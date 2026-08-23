// Knex config — chosen migration/query tool for this project (see CLAUDE.md "Дані").
// Single config, no per-environment branching: DATABASE_URL always comes from env
// (docker-compose locally, Neon in production via Cloud Run secrets), so the same
// image/code runs unmodified in both places — never hardcode `db`/`localhost` here.
module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
};
