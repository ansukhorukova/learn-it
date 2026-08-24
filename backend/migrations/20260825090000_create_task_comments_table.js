/**
 * `task_comments` table — CLAUDE.md "Дані" / US-019: коментарі до таски,
 * спільні для всіх з доступом до таски/борду (owner/collaborator/viewer),
 * on the same "shared like task status" footing as `tasks.status` — NOT
 * privacy-scoped per-user like `time_entries`.
 *
 * `task_id` is `ON DELETE CASCADE` — mirrors every other task-child table
 * (`attachments.task_id`, `time_entries.task_id`): deleting a task (US7)
 * removes its comments at the DB level too, no orphaned rows.
 *
 * `author_id` is `ON DELETE CASCADE`, same treatment as
 * `attachments.created_by`/`time_entries.user_id` — a deleted user's
 * comments go with them rather than dangling on a nonexistent FK target.
 *
 * MVP is view + add only (US-019 AC10, explicit scope decision, not an
 * oversight) — no edit/delete endpoint exists for a comment once posted, so
 * there's deliberately no `updated_at` column here (nothing ever mutates a
 * row after insert).
 *
 * Index on `(task_id, created_at)` — the only read path is "this task's
 * comments, chronological, oldest first" (US-019 AC1), no pagination this
 * pass (AC8), so a single composite index covering both the filter and the
 * sort is all this needs.
 */

exports.up = function up(knex) {
  return knex.schema.createTable('task_comments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('task_id')
      .notNullable()
      .references('id')
      .inTable('tasks')
      .onDelete('CASCADE');
    table
      .text('author_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.text('body').notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['task_id', 'created_at']);
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('task_comments');
};
