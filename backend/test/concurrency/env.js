const { deriveTestDatabaseUrl } = require('./testDbUrl');

// Vitest `setupFiles` entry: runs inside each test file's own process/module
// registry, before that file's top-level `require`s. Redirecting
// `DATABASE_URL` here — before any test file requires a service module (and
// transitively `src/db/knex.js`, which reads `process.env.DATABASE_URL` at
// require time) — is what makes every service call in the suite land on the
// dedicated `..._test` database that globalSetup.js just migrated, instead
// of a developer's real local data.
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Concurrency tests need a real Postgres connection — run them via ' +
      '`docker compose exec backend npm run test:concurrency`.',
  );
}
process.env.DATABASE_URL = deriveTestDatabaseUrl(process.env.DATABASE_URL);
