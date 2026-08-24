/**
 * `languages` table — CLAUDE.md "Дані" / US-023: a controlled,
 * admin-managed dictionary of learning-material languages a board can be
 * tagged with, exact same pattern as `competencies`
 * (20260824160000_create_competencies_table.js) — `slug` is the locale
 * lookup key (`language.<slug>` in `locales/en.json`/`locales/uk.json`),
 * the DISPLAYED label always comes from the FE's own dictionary, never a
 * bilingual text column here.
 *
 * `is_active` (not a DELETE) lets a language be retired from the picker
 * without invalidating `board_languages` rows that already reference it —
 * same "retire, don't cascade-delete" reasoning as `competencies.is_active`.
 *
 * Seeded here with the three examples from the approved user story
 * (`english`, `ukrainian`, `spanish`) — a deliberately small, extensible
 * starting list (CLAUDE.md's "розширюваний список"); every seeded slug has
 * a matching `language.<slug>` entry in BOTH locale dictionaries. Growing
 * this list further is an admin/data change (a later migration), never an
 * app code change — identical policy to `competencies`.
 */

const SEED_SLUGS = ['english', 'ukrainian', 'spanish'];

exports.up = async function up(knex) {
  await knex.schema.createTable('languages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('slug').notNullable().unique();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex('languages').insert(SEED_SLUGS.map((slug) => ({ slug, is_active: true })));
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('languages');
};
