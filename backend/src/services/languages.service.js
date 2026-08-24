const db = require('../db/knex');

/**
 * `languages` (dictionary) — US-023, exact same shape and role as
 * competencies.service.js's `listActiveCompetencies`: the active catalog a
 * board's language picker offers. A language retired via `is_active =
 * false` simply stops appearing here; any `board_languages` rows already
 * referencing it are untouched and keep rendering via their own joined
 * slug (see boards.service.js's getLanguagesForBoards), which this function
 * has no bearing on.
 */

function toCatalogEntry(row) {
  return { id: row.id, slug: row.slug };
}

async function listActiveLanguages() {
  const rows = await db('languages').where({ is_active: true }).orderBy('slug', 'asc');
  return rows.map(toCatalogEntry);
}

module.exports = { listActiveLanguages };
