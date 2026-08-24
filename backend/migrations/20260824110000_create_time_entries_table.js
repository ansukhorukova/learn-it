/**
 * `time_entries` table — CLAUDE.md "Дані": time_entries (task_id, user_id,
 * started_at, ended_at, duration_seconds, note). Absent `ended_at` = the
 * timer is currently running (US10). BE only ever returns another user's
 * entries as aggregated sums (never raw rows) — see
 * services/timeEntries.service.js — that's a service-layer contract, not
 * something this schema itself enforces.
 *
 * `time_entries_one_active_per_user` — a PARTIAL UNIQUE INDEX on `user_id`
 * WHERE `ended_at IS NULL` — is the DB-level backstop for "one active timer
 * per user" (US10 AC: "гарантовано не лишається двох активних записів для
 * одного user_id одночасно"). The service layer (timeEntries.service.js)
 * already serializes concurrent starts via `SELECT ... FOR UPDATE` on any
 * existing active row, but that lock is a no-op when no active row exists
 * yet (locking zero rows locks nothing — same caveat documented on
 * tasks.service.js's POSITION_GAP scheme for two concurrent first-creates in
 * an empty column), so two concurrent "first ever start" calls for the same
 * user can both reach the INSERT. This index is what turns the second one
 * into a clean, catchable unique-violation (23505) instead of two active
 * rows silently coexisting — startTimer catches it and retries once, so the
 * caller still gets a correct auto-stop-and-switch result rather than a raw
 * error.
 *
 * `task_id`/`user_id` are both `ON DELETE CASCADE` — deleting a task or a
 * user removes its time entries at the DB level, mirroring
 * `attachments.task_id`/`attachments.created_by`.
 */

exports.up = async function up(knex) {
  await knex.schema.createTable('time_entries', (table) => {
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
    table.timestamp('started_at', { useTz: true }).notNullable();
    // Null while the timer is running (US10) — a completed session always has
    // both ended_at and duration_seconds set together.
    table.timestamp('ended_at', { useTz: true }).nullable();
    table.integer('duration_seconds').nullable();
    table.text('note').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('task_id');
    table.index('user_id');
  });

  await knex.raw(
    'CREATE UNIQUE INDEX time_entries_one_active_per_user ON time_entries (user_id) WHERE ended_at IS NULL',
  );
};

exports.down = async function down(knex) {
  // Dropping the table drops the partial index above with it.
  await knex.schema.dropTableIfExists('time_entries');
};
