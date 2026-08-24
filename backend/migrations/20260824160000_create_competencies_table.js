/**
 * `competencies` table — CLAUDE.md "Дані": a controlled, admin-managed
 * dictionary of competencies/professions a user can pick from (AUTH-005),
 * as opposed to the free-text `custom_label` path on `user_competencies`
 * (AUTH-006). `slug` is the locale lookup key (`competency.<slug>` in
 * `locales/en.json`/`locales/uk.json`) — the DISPLAYED label always comes
 * from the FE's own dictionary, never a bilingual text column here, same
 * pattern as `tasks.status`/`board_members.role` being rendered through a
 * locale key rather than storing translated text.
 *
 * `is_active` (not a DELETE) lets a competency be retired from the picker
 * without invalidating `user_competencies` rows that already reference it
 * (AUTH-005 AC6: "вже додані раніше неактивні лишаються видимими в профілі,
 * без каскадного видалення").
 *
 * Seeded here with a handful of examples from the approved user story
 * (`mathematician`, `business_analyst`, `java_developer`) plus a few more
 * obvious ones, per CLAUDE.md's "розширюваний список" — every seeded slug
 * has a matching `competency.<slug>` entry in BOTH locale dictionaries
 * (CLAUDE.md: localization is part of the feature, not a later step).
 * Growing this list further is an admin/data change (a later migration),
 * never an app code change.
 */

const SEED_SLUGS = [
  'mathematician',
  'business_analyst',
  'java_developer',
  'ux_designer',
  'product_manager',
  'data_scientist',
];

exports.up = async function up(knex) {
  await knex.schema.createTable('competencies', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('slug').notNullable().unique();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex('competencies').insert(SEED_SLUGS.map((slug) => ({ slug, is_active: true })));
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('competencies');
};
