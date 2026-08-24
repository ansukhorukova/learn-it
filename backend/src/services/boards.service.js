const db = require('../db/knex');
const { ValidationError, NotFoundError } = require('../lib/serviceErrors');
const { getOwnedBoard } = require('../lib/authz');
const { lockedUpdate } = require('../lib/db');
const storage = require('../lib/storage');

const TITLE_MAX_LENGTH = 100;

// Small fixed palette of accent keys — the FE maps each to a design token
// (frontend/src/styles/tokens.css: --board-accent-*), deliberately separate
// from --color-accent-amber (reserved for active-timer UI per CLAUDE.md
// "Стилізація"). Keep in sync with frontend/src/constants/boardAccents.js.
const ACCENTS = ['teal', 'rose', 'violet', 'sky', 'moss', 'clay'];
const DEFAULT_ACCENT = ACCENTS[0];

function resolveAccent(accent) {
  return ACCENTS.includes(accent) ? accent : DEFAULT_ACCENT;
}

function validateTitle(title) {
  const trimmed = typeof title === 'string' ? title.trim() : '';
  if (!trimmed) throw new ValidationError('errors.board.titleRequired');
  if (trimmed.length > TITLE_MAX_LENGTH) throw new ValidationError('errors.board.titleTooLong');
  return trimmed;
}

function normalizeDescription(description) {
  if (description === undefined) return undefined;
  if (description === null) return null;
  const trimmed = String(description).trim();
  return trimmed || null;
}

// `taskCount` comes from a LEFT JOIN + COUNT, not a denormalized column on
// `boards` — always accurate, no risk of drifting out of sync with the
// `tasks` table as tasks are created/moved/deleted.
function toBoardSummary(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    accent: row.accent,
    ownerId: row.owner_id,
    taskCount: Number(row.task_count) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listBoardsForOwner(ownerId) {
  const rows = await db('boards')
    .leftJoin('tasks', 'tasks.board_id', 'boards.id')
    .where('boards.owner_id', ownerId)
    .groupBy('boards.id')
    .select('boards.*')
    .count('tasks.id as task_count')
    .orderBy('boards.created_at', 'asc');
  return rows.map(toBoardSummary);
}

async function createBoard(ownerId, { title, description, accent } = {}) {
  const validTitle = validateTitle(title);
  const [row] = await db('boards')
    .insert({
      title: validTitle,
      description: normalizeDescription(description) ?? null,
      accent: resolveAccent(accent),
      owner_id: ownerId,
    })
    .returning('*');
  return toBoardSummary({ ...row, task_count: 0 });
}

async function countTasks(boardId) {
  const [{ count }] = await db('tasks').where({ board_id: boardId }).count('id as count');
  return count;
}

async function getBoardForOwner(boardId, ownerId) {
  const row = await getOwnedBoard(boardId, ownerId);
  const taskCount = await countTasks(boardId);
  return toBoardSummary({ ...row, task_count: taskCount });
}

async function updateBoard(boardId, ownerId, { title, description, accent } = {}) {
  await getOwnedBoard(boardId, ownerId); // throws NotFoundError/ForbiddenError

  const patch = { updated_at: db.fn.now() };
  if (title !== undefined) patch.title = validateTitle(title);
  const normalizedDescription = normalizeDescription(description);
  if (normalizedDescription !== undefined) patch.description = normalizedDescription;
  if (accent !== undefined) patch.accent = resolveAccent(accent);

  // Previously: a bare `UPDATE ... RETURNING *` outside any transaction,
  // with the result spread straight into toBoardSummary with no existence
  // check. A concurrent deleteBoard in the gap between the unlocked
  // getOwnedBoard() above and this UPDATE made the UPDATE affect zero rows,
  // so `row` was `undefined` and `{ ...undefined, task_count }` silently
  // produced `{ id: undefined, ... }` — a 200 response with garbage data
  // instead of any error signal (code-reviewer: worse than a crash, since
  // the client has no indication anything went wrong). lockedUpdate
  // (lib/db.js) re-locks and re-checks the board's existence inside a
  // transaction immediately before writing, so a board deleted in that
  // window now surfaces as a clean NotFoundError instead of a phantom
  // success — same fix shape as tasks.service.js's updateTask/deleteTask.
  const row = await db.transaction((trx) =>
    lockedUpdate(trx, 'boards', boardId, patch, () => new NotFoundError('errors.board.notFound')),
  );
  const taskCount = await countTasks(boardId);
  return toBoardSummary({ ...row, task_count: taskCount });
}

async function deleteBoard(boardId, ownerId) {
  // Wrapped in a transaction that locks the board row before deleting
  // (third fix pass, code-reviewer MAJOR finding) — mirrors the
  // createTask/updateTask board-row-lock invariant (see tasks.service.js),
  // now also extended to the delete path. Previously this was a bare,
  // unlocked ownership check followed by a bare DELETE outside any
  // transaction, so nothing serialized it against a concurrent
  // updateTask/createTask's lock acquisition on the same board — a task
  // reorder racing this delete could observe a phantom board mid-request.
  // Folding the ownership check into the locked read (via getOwnedBoard's
  // trx/forUpdate options) avoids a second unlocked-then-locked read gap,
  // same fix shape as createTask.
  // Collected inside the transaction below (storage_path of every file-kind
  // attachment under any task on this board), then used to clean up the
  // corresponding MinIO objects AFTER the transaction commits — same
  // best-effort, outside-the-trx shape as tasks.service.js's deleteTask
  // (see its comment for the full rationale).
  let orphanedStorageKeys = [];

  await db.transaction(async (trx) => {
    await getOwnedBoard(boardId, ownerId, { trx, forUpdate: true });

    // `tasks.board_id` and `attachments.task_id` are both ON DELETE CASCADE
    // (see migrations) — the single DELETE below removes every task AND
    // every attachment row under this board at the DB level. That cascade
    // only touches Postgres, not the MinIO objects file-kind attachments
    // point at, so their keys are read here first, before the cascade
    // removes the rows that reference them (US9).
    orphanedStorageKeys = (
      await trx('attachments')
        .join('tasks', 'tasks.id', 'attachments.task_id')
        .where({ 'tasks.board_id': boardId, 'attachments.kind': 'file' })
        .select('attachments.storage_path as storage_path')
    )
      .map((r) => r.storage_path)
      .filter(Boolean);

    await trx('boards').where({ id: boardId }).delete();
  });

  await Promise.all(
    orphanedStorageKeys.map((key) =>
      storage.deleteObject(key).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to delete attachment object from storage after board delete', key, err);
      }),
    ),
  );
}

module.exports = {
  ACCENTS,
  listBoardsForOwner,
  createBoard,
  getOwnedBoard,
  getBoardForOwner,
  updateBoard,
  deleteBoard,
};
