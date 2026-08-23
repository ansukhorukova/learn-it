const db = require('../db/knex');
const { isUuid } = require('./uuid');
const { NotFoundError, ForbiddenError } = require('./serviceErrors');

// Authorization gate shared by every board/task read+write that touches one
// specific board (CLAUDE.md: BE is the single point of authorization,
// checked in the service layer before any DB write). Not-found and
// not-owned are deliberately distinct errors (404 vs 403) per the approved
// AC ("403/404" for a non-owner opening a board URL directly).
//
// Previously duplicated word-for-word in boards.service.js and
// tasks.service.js — extracted here so the two can't drift if the check is
// ever changed in one place and not the other (code-reviewer MINOR finding).
// `trx`/`forUpdate` let a caller that's about to lock the board row anyway
// (e.g. createTask's `FOR UPDATE` for concurrency-safe position assignment)
// fold the ownership check into that same locked read, instead of checking
// once unlocked before the transaction and again via the lock inside it —
// which leaves a gap where the board could be deleted between the two
// checks (code-reviewer MINOR finding). Defaults preserve the plain
// unlocked read every other caller uses.
async function getOwnedBoard(boardId, ownerId, { trx, forUpdate = false } = {}) {
  if (!isUuid(boardId)) throw new NotFoundError('errors.board.notFound');
  const query = (trx || db)('boards').where({ id: boardId });
  if (forUpdate) query.forUpdate();
  const row = await query.first();
  if (!row) throw new NotFoundError('errors.board.notFound');
  if (row.owner_id !== ownerId) throw new ForbiddenError('errors.board.forbidden');
  return row;
}

module.exports = { getOwnedBoard };
