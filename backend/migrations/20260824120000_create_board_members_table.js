/**
 * `board_members` table — CLAUDE.md "Дані": board_members (board_id, user_id,
 * role enum `viewer | collaborator`). Foundation for US13 (share a whole
 * board) — the owner is never a row in this table (ownership stays
 * `boards.owner_id`); a `board_members` row only ever represents a
 * non-owner's granted access.
 *
 * `role` is a native Postgres enum (`board_member_role`), same
 * defense-in-depth reasoning as `tasks.status`/`attachments.kind` — an
 * invalid value is rejected at the DB layer behind the service-layer
 * validation in boardMembers.service.js. `task_shares` (next migration) gets
 * its own separately-named `task_share_role` enum with the same two values
 * rather than reusing this one — keeps each migration's up/down fully
 * self-contained (no "can't DROP TYPE, still in use by a table created in a
 * later migration" ordering hazard on rollback).
 *
 * `UNIQUE (board_id, user_id)` is what makes "add the same email twice"
 * idempotent: boardMembers.service.js's addMember does a single
 * `INSERT ... ON CONFLICT (board_id, user_id) DO UPDATE` against this
 * constraint rather than a separate existence check + branch, so two
 * concurrent "share with the same email" requests can't create duplicate
 * rows or crash on a raw unique-violation.
 *
 * No DB-level CHECK against self-share (`user_id != boards.owner_id`) —
 * that's a cross-table condition Postgres can only express via a trigger,
 * which is more machinery than this needs; self-share is rejected in the
 * service layer (boardMembers.service.js) instead, consistent with
 * CLAUDE.md's "BE is the single point of authorization" (this replaces
 * RLS/trigger-level enforcement, doesn't duplicate it).
 *
 * `board_id`/`user_id` are both `ON DELETE CASCADE` — deleting a board or a
 * user removes any membership rows referencing it, mirroring
 * `attachments.task_id`/`attachments.created_by`.
 */

exports.up = async function up(knex) {
  await knex.raw("CREATE TYPE board_member_role AS ENUM ('viewer', 'collaborator')");

  await knex.schema.createTable('board_members', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('board_id')
      .notNullable()
      .references('id')
      .inTable('boards')
      .onDelete('CASCADE');
    table
      .text('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.specificType('role', 'board_member_role').notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['board_id', 'user_id']);
    table.index('board_id');
    table.index('user_id');
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('board_members');
  await knex.raw('DROP TYPE IF EXISTS board_member_role');
};
