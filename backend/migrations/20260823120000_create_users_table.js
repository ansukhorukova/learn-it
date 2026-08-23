/**
 * `users` table — CLAUDE.md "Дані":
 *   users (id = Firebase UID, email, display_name, locale) — synced from
 *   Firebase Auth on first sign-in (see backend/src/services/users.service.js).
 *
 * `id` is the Firebase UID itself (not a generated key) so every other table
 * can FK against it directly without an extra lookup table.
 */

exports.up = function up(knex) {
  return knex.schema.createTable('users', (table) => {
    table.text('id').primary(); // Firebase UID
    table.text('email').notNullable().unique();
    table.text('display_name').notNullable();
    // BCP-47-ish locale code, e.g. 'en', 'uk'. Set once from browser-detected
    // locale on first sign-in, changed later only via the (future) profile
    // settings screen — never silently overwritten by the auth sync endpoint.
    table.text('locale').notNullable().defaultTo('en');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('users');
};
