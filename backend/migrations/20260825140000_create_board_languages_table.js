/**
 * `board_languages` junction table — CLAUDE.md "Дані" / US-023: which
 * `languages` a board's learning material is tagged with, exact same
 * shape/pattern as `board_members` (20260824120000_create_board_members_table.js)
 * minus a `role` column — membership in this table IS the fact being
 * recorded, there's no role to attach to it.
 *
 * Full-replace write semantics (boards.service.js: a `PATCH`/`POST` with
 * `languageIds` deletes every existing row for the board and re-inserts the
 * new set inside one transaction, all-or-nothing after validation) rather
 * than a diff/upsert — simpler than reconciling adds/removes, and cheap at
 * this table's expected size (a handful of rows per board).
 *
 * `UNIQUE (board_id, language_id)` backstops that full-replace against a
 * concurrent double-insert of the same pair ever producing duplicate rows,
 * same defense-in-depth role `UNIQUE (board_id, user_id)` plays for
 * `board_members`.
 *
 * `board_id`/`language_id` are both `ON DELETE CASCADE` — deleting a board
 * removes its language tags for free; deleting a `languages` row (never
 * done in practice, see that migration) would remove any board's tag on it
 * rather than leaving a dangling reference — same reasoning as
 * `user_competencies.competency_id`, not `boards.category_id`'s `SET NULL`,
 * because there's no single board-level column here to null out — the row
 * itself is the fact, so removing it is the only sensible response to its
 * language disappearing.
 */

exports.up = function up(knex) {
  return knex.schema.createTable('board_languages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('board_id')
      .notNullable()
      .references('id')
      .inTable('boards')
      .onDelete('CASCADE');
    table
      .uuid('language_id')
      .notNullable()
      .references('id')
      .inTable('languages')
      .onDelete('CASCADE');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['board_id', 'language_id']);
    table.index('board_id');
    table.index('language_id');
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('board_languages');
};
