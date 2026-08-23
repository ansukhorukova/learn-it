/**
 * `boards` table — CLAUDE.md "Дані": boards (title, description, accent,
 * owner_id). No `board_members` table yet — sharing is out of scope for this
 * pass (Phase 1: boards + tasks only), so authorization is a plain
 * `owner_id === current user` check in the service layer for now. Adding
 * `board_members` later won't require touching this table.
 *
 * `id` is a Postgres-generated UUID (`gen_random_uuid()`, built into
 * PostgreSQL 13+ with no extension needed) rather than a Firebase-style
 * external id, since boards are created by the BE, not synced from an
 * external identity provider.
 */

exports.up = function up(knex) {
  return knex.schema.createTable('boards', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('title').notNullable();
    table.text('description').nullable();
    // One of a small fixed palette of accent keys (see
    // backend/src/services/boards.service.js's ACCENTS) — the FE maps this
    // to a design token, never a literal color from the DB.
    table.text('accent').notNullable().defaultTo('teal');
    table
      .text('owner_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('owner_id');
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('boards');
};
