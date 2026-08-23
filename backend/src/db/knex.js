const knexLib = require('knex');

const knexConfig = require('../../knexfile');

// Single shared knex instance (connection pool) for the whole API process.
// Every service module that touches Postgres requires this file rather than
// creating its own pool — see CLAUDE.md "Дані" (access exclusively through BE,
// versioned migrations via Knex).
const db = knexLib(knexConfig);

module.exports = db;
