/**
 * `task_personal_status` table — US-039: a per-user overlay of a task's
 * `status`, used ONLY by an authenticated visitor of a `visibility = 'public'`
 * board who has NO real membership (effective role `public`, see
 * lib/authz.js's getTaskRole). Such a visitor walks the board as a learning
 * template — "what the owner already learned, I haven't yet" — so their
 * progress must be their own, independent of `tasks.status` (the shared state
 * every real member sees and moves together).
 *
 * This table never changes `tasks.status` — that column stays the single
 * source of the SHARED status for owner / `board_members` / `task_shares`
 * (US-039 AC1/AC4). When this migration runs the table is empty, so no
 * existing data or behaviour changes.
 *
 * Privacy is absolute, inherited verbatim from `time_entries` (US-039 AC14):
 * the board owner and every real member NEVER see any row here — not the row,
 * not a count, not an aggregate. No endpoint returns another user's personal
 * status. Only the owning user ever reads their own row (the read-resolve in
 * tasks.service.js, and the write in taskPersonalStatus.service.js).
 *
 * `status` reuses the native `task_status` enum created in
 * 20260823160000_create_tasks_table.js — same three values, same DB-level
 * second line of defense behind the service-layer validation.
 *
 * `task_id` is `ON DELETE CASCADE` (mirrors `task_comments.task_id` /
 * `time_entries.task_id`) and `user_id` is `ON DELETE CASCADE` (mirrors
 * `task_comments.author_id`, type `text` = Firebase UID) — deleting a task,
 * or its board (which cascades to `tasks`), or the user, removes the
 * corresponding rows, no orphans (US-039 AC20).
 *
 * `UNIQUE (task_id, user_id)` backs the idempotent, race-safe upsert
 * (`onConflict(['task_id','user_id']).merge()`, US-039 AC6/AC7 — same
 * defense-in-depth shape as `competency_chat_members`' unique constraint).
 * A separate btree index on `user_id` supports the read-resolve query
 * (`WHERE user_id = ? AND task_id IN (...)`), which the composite unique
 * (task_id-leading) does not serve well.
 *
 * NOTE (US-039 AC19): flipping a board `public -> private` does NOT delete
 * rows here — they are kept in case it flips back. Access is lost
 * immediately through authorization (the former visitor's effective role is
 * no longer `public`), not by wiping data.
 */

exports.up = function up(knex) {
  return knex.schema.createTable('task_personal_status', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('task_id')
      .notNullable()
      .references('id')
      .inTable('tasks')
      .onDelete('CASCADE');
    table
      .text('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.specificType('status', 'task_status').notNullable().defaultTo('planned');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['task_id', 'user_id']);
    table.index('user_id');
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('task_personal_status');
};
