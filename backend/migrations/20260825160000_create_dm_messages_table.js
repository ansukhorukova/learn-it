/**
 * `dm_messages` table — CLAUDE.md "Дані" / US-027: individual messages
 * within a `dm_threads` conversation. View + add only this pass (same MVP
 * scope decision as `task_comments`, US-019 AC10, reaffirmed for chat in
 * this pass's "походження" section — no edit/delete) — no `updated_at`,
 * nothing ever mutates a row after insert.
 *
 * `thread_id` is `ON DELETE CASCADE` — a thread is never deleted by any
 * current product code path, but kept consistent with every other
 * parent/child table in this schema.
 *
 * `sender_id` is `ON DELETE CASCADE`, same treatment as
 * `task_comments.author_id` — a deleted user's messages go with them
 * rather than dangling on a nonexistent FK target.
 *
 * Index on `(thread_id, created_at)` — the only read path is "this
 * thread's messages, chronological, oldest first" (US-027 AC4), no
 * pagination in MVP (AC4), plus this same index backs the "most recent
 * message per thread" lookup the my-threads list (AC11) needs.
 */

exports.up = function up(knex) {
  return knex.schema.createTable('dm_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('thread_id')
      .notNullable()
      .references('id')
      .inTable('dm_threads')
      .onDelete('CASCADE');
    table.text('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('body').notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['thread_id', 'created_at']);
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('dm_messages');
};
