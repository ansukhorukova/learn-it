/**
 * `tasks` table — CLAUDE.md "Дані": tasks (board_id, title, notes, status
 * enum, position, created_by). `board_id` is `ON DELETE CASCADE` so deleting
 * a board (US4) always removes its tasks at the DB level — the correct base
 * to later cascade attachments/time_entries too once those tables exist,
 * without changing this migration.
 *
 * No `attachment_count` or similar column here on purpose — attachments are
 * explicitly out of scope this pass; once that table exists, an attachment
 * count is a COUNT query joined at read time, not a column that needs to be
 * kept in sync on this table.
 *
 * `status` is a native Postgres enum (not a free-text column + CHECK) so an
 * invalid value is rejected at the DB layer as a second line of defense
 * behind the service-layer validation in tasks.service.js.
 */

exports.up = async function up(knex) {
  await knex.raw("CREATE TYPE task_status AS ENUM ('planned', 'in_progress', 'done')");

  await knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('board_id')
      .notNullable()
      .references('id')
      .inTable('boards')
      .onDelete('CASCADE');
    table.text('title').notNullable();
    table.text('notes').nullable();
    table.specificType('status', 'task_status').notNullable().defaultTo('planned');
    // Gap-based ordering within a (board_id, status) column — see
    // tasks.service.js's reindexColumn for the write strategy.
    table.integer('position').notNullable();
    table
      .text('created_by')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['board_id', 'status']);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('tasks');
  await knex.raw('DROP TYPE IF EXISTS task_status');
};
