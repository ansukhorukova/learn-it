/**
 * Adds `last_sign_in_provider` to `users` — captures the Firebase
 * `firebase.sign_in_provider` claim (e.g. `password`, `google.com`) from the
 * decoded ID token on every successful GET /api/v1/users/me call, not just
 * on first insert (see backend/src/services/users.service.js).
 *
 * Unlike `display_name`/`locale` (seeded once, never overwritten by the auth
 * sync), this column is intentionally kept fresh on every call — the same
 * user can sign in with either provider on different occasions, and we only
 * care about the most recent one, used to give a specific "already
 * registered via Google/password" hint on the signup-conflict path (see
 * GET /api/v1/auth/provider-hint).
 */

exports.up = function up(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.text('last_sign_in_provider').nullable();
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('last_sign_in_provider');
  });
};
