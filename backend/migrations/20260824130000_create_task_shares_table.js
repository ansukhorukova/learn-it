/**
 * `task_shares` table — CLAUDE.md "Дані": task_shares (task_id, user_id,
 * role) — sharing ONE task without granting access to the rest of its board
 * (US14). A row here is deliberately independent of `board_members`: the
 * service layer (lib/authz.js's getTaskRole/getOwnedTaskWithBoard) computes
 * a caller's *effective* role on a task as the more permissive of any
 * `board_members` row for the task's board and any `task_shares` row for
 * this exact task id — never the reverse (a `task_shares` row never grants
 * access to the board, or to any other task on it). See lib/authz.js for the
 * one-sentence priority rule (also documented on the Task schema in
 * openapi.yaml).
 *
 * `role` reuses the same two-value range as `board_members.role` but under
 * its own enum type (`task_share_role`, not `board_member_role`) — see the
 * board_members migration's header for why: keeps each migration's up/down
 * fully self-contained.
 *
 * `UNIQUE (task_id, user_id)` backs taskShares.service.js's idempotent
 * `INSERT ... ON CONFLICT DO UPDATE` addShare, same shape as
 * board_members.service.js's addMember.
 *
 * `task_id` is `ON DELETE CASCADE` from `tasks` (US17: deleting a task
 * cascades its shares) — `tasks.board_id` is itself `ON DELETE CASCADE` from
 * `boards`, so deleting a board also cascades away every task_shares row for
 * every task under it, transitively, with no extra FK needed here.
 */

exports.up = async function up(knex) {
  await knex.raw("CREATE TYPE task_share_role AS ENUM ('viewer', 'collaborator')");

  await knex.schema.createTable('task_shares', (table) => {
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
    table.specificType('role', 'task_share_role').notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['task_id', 'user_id']);
    table.index('task_id');
    table.index('user_id');
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('task_shares');
  await knex.raw('DROP TYPE IF EXISTS task_share_role');
};
