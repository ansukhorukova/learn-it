const path = require('path');
const { Client } = require('pg');
const knexLib = require('knex');

const { deriveTestDatabaseUrl } = require('./testDbUrl');

// Vitest `globalSetup`: runs once, in a separate process, before any test
// file. Its only job is to make sure a dedicated `..._test` Postgres
// database exists on the same server as `DATABASE_URL` (the docker-compose
// `db` service) and has every migration applied — the actual per-test-file
// switch to that database happens in env.js (a `setupFiles` entry, which
// runs inside each test file's own process/module registry).
//
// This runs concurrency tests against a real Postgres instance rather than
// a mock, on purpose (per the task: row-locking/deadlock behavior is exactly
// what can't be meaningfully faked) — but a *separate* database from dev
// data, so running the suite never touches whatever boards/tasks a
// developer has sitting in their local `learning_time_tracker` database.
module.exports = async function globalSetup() {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error(
      'DATABASE_URL is not set. Concurrency tests need a real Postgres connection — run them ' +
        'via `docker compose exec backend npm run test:concurrency` (or equivalent, with ' +
        'DATABASE_URL pointed at a reachable Postgres), not in an environment with no DB configured.',
    );
  }

  const testUrl = deriveTestDatabaseUrl(baseUrl);
  const testDbName = new URL(testUrl).pathname.replace(/^\//, '');

  // CREATE DATABASE can't run inside a transaction and can't target the
  // database it's creating, so connect to the server's default maintenance
  // database (`postgres`) to issue it.
  const adminUrl = new URL(baseUrl);
  adminUrl.pathname = '/postgres';
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${testDbName}"`);
  } catch (err) {
    if (err.code !== '42P04') throw err; // 42P04 = duplicate_database — already exists, fine.
  } finally {
    await admin.end();
  }

  // Bring the test database's schema up to date with the same versioned
  // migrations the real app uses (CLAUDE.md "Міграції") — never a
  // hand-maintained parallel schema that could drift from it.
  const testKnex = knexLib({
    client: 'pg',
    connection: testUrl,
    migrations: {
      directory: path.join(__dirname, '..', '..', 'migrations'),
      tableName: 'knex_migrations',
    },
  });
  try {
    await testKnex.migrate.latest();
  } finally {
    await testKnex.destroy();
  }
};
