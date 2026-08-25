/**
 * `competency_chat_messages` table — CLAUDE.md "Дані" / US-028: the group
 * chat room for one competency. There is no separate "rooms" table — a
 * room is identified directly by `competency_id` (business-analyst decision
 * #3 in this pass's "походження" section: exactly one shared room per
 * `competencies` row, no create/rename/delete UI for arbitrary new rooms).
 *
 * Access is "any authenticated user" on both read and write (decision #4)
 * regardless of whether the competency is in their own `user_competencies`
 * or `willing_to_teach` — so unlike `dm_threads`/`dm_messages`, there is no
 * membership/participant concept for this table at all.
 *
 * View + add only (no edit/delete) — same MVP scope as `dm_messages`/
 * `task_comments` — no `updated_at`.
 *
 * `competency_id` is `ON DELETE CASCADE` for FK consistency with the rest
 * of this schema, though in practice a `competencies` row is never
 * hard-deleted (retired via `is_active = false` instead — US-028 AC5:
 * deactivating a competency closes the product path to its room but does
 * NOT delete this history, the same "no cascade delete on retirement"
 * principle already applied to `user_competencies`/`boards.category_id`).
 *
 * `sender_id` is `ON DELETE CASCADE`, same treatment as
 * `task_comments.author_id`/`dm_messages.sender_id`.
 *
 * Index on `(competency_id, created_at)` — the only read path is "this
 * room's messages, chronological, oldest first" (US-028 AC2), no
 * pagination in MVP.
 */

exports.up = function up(knex) {
  return knex.schema.createTable('competency_chat_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('competency_id')
      .notNullable()
      .references('id')
      .inTable('competencies')
      .onDelete('CASCADE');
    table.text('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('body').notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['competency_id', 'created_at']);
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('competency_chat_messages');
};
