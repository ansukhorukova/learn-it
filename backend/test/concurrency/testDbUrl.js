// Shared by globalSetup.js and env.js so both derive the exact same test
// database URL from `DATABASE_URL` (docker-compose's `db` service, same
// Postgres instance the dev backend uses — a separate database on it, not a
// separate server, so this needs no new docker-compose service).
function deriveTestDatabaseUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  const name = url.pathname.replace(/^\//, '');
  const testName = name.endsWith('_test') ? name : `${name}_test`;
  url.pathname = `/${testName}`;
  return url.toString();
}

module.exports = { deriveTestDatabaseUrl };
