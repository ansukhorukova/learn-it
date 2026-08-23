/**
 * Replaces `users.email`'s case-sensitive unique constraint with a
 * case-insensitive one (unique index on `lower(email)`).
 *
 * Why: backend/src/services/users.service.js's `getSignInProviderForEmail`
 * (used by GET /api/v1/auth/provider-hint) looks up by `lower(email) =
 * lower(?)`, but the original constraint from
 * 20260823120000_create_users_table.js only prevented exact-case duplicates.
 * Two rows differing only by case (e.g. `Foo@Example.com` vs
 * `foo@example.com`) could theoretically both exist, and the lookup would
 * only ever find one of them by Postgres's arbitrary row order — a
 * correctness gap flagged in code review. Firebase is the actual identity
 * source of truth (this table just mirrors it), so the practical risk is
 * low, but the constraint should match how the column is actually queried.
 */

exports.up = async function up(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropUnique(['email']);
  });
  await knex.raw('CREATE UNIQUE INDEX users_email_lower_unique_idx ON users (lower(email))');
};

exports.down = async function down(knex) {
  await knex.raw('DROP INDEX IF EXISTS users_email_lower_unique_idx');
  await knex.schema.alterTable('users', (table) => {
    table.unique(['email']);
  });
};
