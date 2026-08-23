const db = require('../db/knex');
const { isUuid } = require('../lib/uuid');
const { ValidationError, NotFoundError, ForbiddenError, ConflictError } = require('../lib/serviceErrors');
const { getOwnedBoard } = require('../lib/authz');
const { isUniqueViolation, isDeadlock } = require('../lib/dbErrors');
const { lockRow, lockedUpdate } = require('../lib/db');

const TITLE_MAX_LENGTH = 200;
const STATUSES = ['planned', 'in_progress', 'done'];
const DEFAULT_STATUS = STATUSES[0];

// Gap-based position scheme: every write reindexes the affected column to
// evenly-spaced multiples of POSITION_GAP (1000, 2000, ...). Simpler and more
// robust than midpoint/float math (no precision limits, no "ran out of room
// between two adjacent floats" edge case) at the cost of rewriting the
// touched column's rows on every drag — fine at this app's scale (a column
// holding hundreds of tasks is still a handful of single-row updates).
const POSITION_GAP = 1000;

function toTask(row) {
  return {
    id: row.id,
    boardId: row.board_id,
    title: row.title,
    notes: row.notes,
    status: row.status,
    position: row.position,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateTitle(title) {
  const trimmed = typeof title === 'string' ? title.trim() : '';
  if (!trimmed) throw new ValidationError('errors.task.titleRequired');
  if (trimmed.length > TITLE_MAX_LENGTH) throw new ValidationError('errors.task.titleTooLong');
  return trimmed;
}

function validateStatus(status) {
  if (!STATUSES.includes(status)) throw new ValidationError('errors.task.invalidStatus');
  return status;
}

// Tasks have no `owner_id` of their own — authorization is always derived
// through the parent board's owner_id (CLAUDE.md: BE service layer is the
// single point of authorization). This mirrors how board_members/task_shares
// would extend this later without a schema change to `tasks` itself.
// getOwnedBoard itself lives in lib/authz.js — shared with boards.service.js
// so the ownership check can't drift between the two (code-reviewer MINOR
// finding).

async function getOwnedTaskWithBoard(taskId, ownerId) {
  if (!isUuid(taskId)) throw new NotFoundError('errors.task.notFound');
  const row = await db('tasks')
    .join('boards', 'boards.id', 'tasks.board_id')
    .where('tasks.id', taskId)
    .select('tasks.*', 'boards.owner_id as board_owner_id')
    .first();
  if (!row) throw new NotFoundError('errors.task.notFound');
  if (row.board_owner_id !== ownerId) throw new ForbiddenError('errors.task.forbidden');
  return row;
}

async function listTasksForBoard(boardId, ownerId) {
  await getOwnedBoard(boardId, ownerId);
  const rows = await db('tasks')
    .where({ board_id: boardId })
    .orderBy([{ column: 'status' }, { column: 'position', order: 'asc' }]);
  return rows.map(toTask);
}

async function createTask(boardId, ownerId, { title } = {}) {
  const validTitle = validateTitle(title);

  try {
    return await db.transaction(async (trx) => {
      // Lock the parent board row first, for the duration of the
      // transaction, AND use that same locked read as the ownership check
      // (code-reviewer MINOR finding) — previously this called the unlocked
      // getOwnedBoard() before the transaction started, then locked the
      // board row again inside it, leaving a gap where the board could be
      // deleted between the two (the FOR UPDATE would then just return zero
      // rows rather than error, and the INSERT below would fail on an FK
      // violation instead of a clean 404). Checking ownership via the locked
      // row means there's only ever one read of the board, and it's the one
      // that's actually locked for the rest of the transaction.
      //
      // Locking the board row is also what actually serializes two
      // concurrent createTask calls into the *same, possibly empty* column —
      // a `SELECT ... FOR UPDATE` on the "last position" query below only
      // locks rows that already exist, so it does nothing when the column
      // is empty (both racing transactions would see zero rows and both
      // pick position = POSITION_GAP). Locking the board row means the
      // second transaction blocks until the first commits, then re-reads
      // the now-current last position instead of a stale one.
      await getOwnedBoard(boardId, ownerId, { trx, forUpdate: true });

      // Append to the end of Planned (US6: "з'являється в колонці Planned в
      // кінці"). `.forUpdate()` here too, per the code-reviewer's
      // belt-and-suspenders ask — redundant with the board-row lock above
      // once the column is non-empty, but harmless, and it's what actually
      // matters if the board-row lock is ever removed by a future refactor.
      const last = await trx('tasks')
        .where({ board_id: boardId, status: DEFAULT_STATUS })
        .orderBy('position', 'desc')
        .forUpdate()
        .first();
      const position = last ? last.position + POSITION_GAP : POSITION_GAP;

      const [row] = await trx('tasks')
        .insert({
          board_id: boardId,
          title: validTitle,
          status: DEFAULT_STATUS,
          position,
          created_by: ownerId,
        })
        .returning('*');
      return toTask(row);
    });
  } catch (err) {
    // Backstop: the DEFERRABLE UNIQUE (board_id, status, position)
    // constraint (see migration ..._add_tasks_position_unique_constraint)
    // only fires here if the locking above was somehow bypassed. Surface it
    // as a clean 409 instead of a raw Postgres error.
    if (isUniqueViolation(err, 'tasks_board_status_position_unique')) {
      throw new ConflictError('errors.task.positionConflict');
    }
    throw err;
  }
}

// Rewrites an ordered array of task ids within one (board, status) column to
// evenly-spaced positions. `orderedIds` must already include the moved task
// at its target index.
async function reindexColumn(trx, orderedIds) {
  for (let index = 0; index < orderedIds.length; index += 1) {
    // eslint-disable-next-line no-await-in-loop -- must run sequentially:
    // these updates share one transaction/connection, and later rows'
    // correctness doesn't depend on earlier ones, but keeping it sequential
    // keeps the transaction's query order predictable and easy to reason
    // about (this loop only ever touches a handful of rows per drag).
    await trx('tasks')
      .where({ id: orderedIds[index] })
      .update({ position: (index + 1) * POSITION_GAP, updated_at: trx.fn.now() });
  }
}

/**
 * Updates a task's title and/or its status+position (a single combined
 * endpoint per the technical guidance: `PATCH /tasks/:id`).
 *
 * `position` is a zero-based target index within the destination column
 * (`status`, if provided, else the task's current column) — NOT the raw
 * stored `position` value, which is an internal reindexing detail the client
 * never sees or sends. This covers both AC's in one code path:
 *   - cross-column drag: status changes, position = index in the new column.
 *   - same-column reorder: status omitted/unchanged, position = new index.
 */
async function updateTask(taskId, ownerId, { title, status, position } = {}) {
  const task = await getOwnedTaskWithBoard(taskId, ownerId);

  const patch = {};
  if (title !== undefined) patch.title = validateTitle(title);

  const isReordering = status !== undefined || position !== undefined;
  if (!isReordering) {
    if (Object.keys(patch).length === 0) return toTask(task);
    patch.updated_at = db.fn.now();
    // Same fix shape as the reorder branch below and deleteTask: the read
    // above (getOwnedTaskWithBoard) is unlocked, so a concurrent deleteTask
    // can remove this row in the gap before the UPDATE runs. Previously this
    // ran a bare `UPDATE ... RETURNING *` outside any transaction and
    // returned `toTask(row)` unchecked — if the row was gone, `row` was
    // `undefined` and `toTask(undefined)` threw a raw TypeError (unhandled
    // 500) instead of a clean 404. lockedUpdate (lib/db.js) re-locks and
    // re-checks existence inside a transaction immediately before writing,
    // so this now surfaces as NotFoundError like every other mutation here.
    const row = await db.transaction((trx) =>
      lockedUpdate(trx, 'tasks', taskId, patch, () => new NotFoundError('errors.task.notFound')),
    );
    return toTask(row);
  }

  const targetStatus = status !== undefined ? validateStatus(status) : task.status;

  try {
    return await db.transaction(async (trx) => {
      // Lock the parent board row first, for the whole transaction — mirrors
      // createTask's identical lock (see its comment for the full
      // rationale). Two reasons this is needed here too:
      //  1. Empty-destination-column race: `.forUpdate()` on the destination
      //     column's rows below locks nothing when that column is currently
      //     empty, so two concurrent moves into the same empty column don't
      //     serialize on that alone (they'd both see zero existing rows and
      //     pick colliding positions).
      //  2. Cross-column swap deadlock: without a single shared lock to
      //     queue on, two concurrent updateTask calls that cross columns
      //     (A: planned→done, B: done→planned) can each end up holding a
      //     lock the other is waiting for — the task-row lock from one
      //     transaction and the destination-column lock from the other,
      //     acquired in the opposite order. Postgres detects this as
      //     `deadlock_detected` (40P01, see lib/dbErrors.js) and aborts one
      //     transaction. Locking the board row first forces every reorder on
      //     this board to queue on one lock instead, so that circular-wait
      //     shape can't arise.
      // The result is checked, not discarded: if a concurrent deleteTask/
      // deleteBoard runs in the window between the unlocked
      // getOwnedTaskWithBoard() above and this lock acquisition, the board
      // (or task, below) may already be gone by the time this resolves.
      // `.first()` on a row that no longer exists just returns undefined —
      // it does NOT block or error — so without this check the code below
      // would proceed with a phantom taskId: the UPDATEs would silently
      // affect zero rows, reindexColumn would silently do nothing, and the
      // final re-read of the task would return undefined, crashing
      // toTask(undefined) with a raw TypeError → unhandled 500 instead of a
      // clean 404 (code-reviewer MAJOR finding, third fix pass). Now routed
      // through lockRow (lib/db.js) instead of a hand-rolled
      // lock-then-if(!row)-throw pair, so this can't drift from the same
      // check used elsewhere (fourth fix pass — see lib/db.js header).
      const lockedBoard = await lockRow(trx, 'boards', task.board_id, () => new NotFoundError('errors.board.notFound'));

      // Lock the task being moved itself too, so two overlapping
      // updateTask calls for the *same* task (e.g. a double-fired drag
      // event from the same tab) serialize instead of interleaving. Same
      // discarded-result gap as the board lock above — checked for the same
      // reason, via the same lockRow helper.
      const lockedTask = await lockRow(trx, 'tasks', taskId, () => new NotFoundError('errors.task.notFound'));

      if (Object.keys(patch).length > 0) {
        await trx('tasks').where({ id: taskId }).update(patch);
      }

      // `.forUpdate()` locks every row in the destination column for the
      // rest of this transaction. A second, concurrent reindex of the same
      // column (another tab, a double-fired drag) blocks here until this
      // transaction commits, then reads the positions this transaction just
      // wrote instead of a stale snapshot — this is what actually prevents
      // the lost-update race the code-reviewer flagged.
      const columnRows = await trx('tasks')
        .where({ board_id: task.board_id, status: targetStatus })
        .whereNot('id', taskId)
        .orderBy('position', 'asc')
        .forUpdate();

      const targetIndex =
        typeof position === 'number' && Number.isFinite(position)
          ? Math.max(0, Math.min(Math.trunc(position), columnRows.length))
          : columnRows.length;

      const orderedIds = columnRows.map((row) => row.id);
      orderedIds.splice(targetIndex, 0, taskId);

      await trx('tasks').where({ id: taskId }).update({ status: targetStatus });
      await reindexColumn(trx, orderedIds);

      const row = await trx('tasks').where({ id: taskId }).first();
      return toTask(row);
    });
  } catch (err) {
    // Backstop: see createTask's identical catch for why this exists — the
    // DEFERRABLE unique constraint only fires if locking was bypassed.
    if (isUniqueViolation(err, 'tasks_board_status_position_unique')) {
      throw new ConflictError('errors.task.positionConflict');
    }
    // Backstop: the board-row lock above is what actually prevents the
    // cross-column deadlock scenario, but map it to the same clean 409 as
    // the conflict case above rather than a raw 500, in case a deadlock is
    // ever still possible through some path not covered by that lock.
    if (isDeadlock(err)) {
      throw new ConflictError('errors.task.positionConflict');
    }
    throw err;
  }
}

async function deleteTask(taskId, ownerId) {
  const task = await getOwnedTaskWithBoard(taskId, ownerId);

  try {
    await db.transaction(async (trx) => {
      // Lock the parent board row first, same invariant/order as
      // createTask/updateTask (see updateTask's comment for the full
      // rationale) — this is what was missing before (third fix pass,
      // code-reviewer MAJOR finding): deleteTask took no locks at all, so
      // nothing serialized it against a concurrent updateTask's lock
      // acquisition on the same board/task. Queuing deletes on the same
      // board-level lock closes that race at the source rather than only
      // handling its aftermath. Routed through lockRow (lib/db.js), same as
      // updateTask's reorder branch, rather than a hand-rolled check.
      const board = await lockRow(trx, 'boards', task.board_id, () => new NotFoundError('errors.board.notFound'));

      // Lock the task row itself too, mirroring updateTask, so a
      // concurrent updateTask on this exact task serializes against this
      // delete instead of racing it.
      const row = await lockRow(trx, 'tasks', taskId, () => new NotFoundError('errors.task.notFound'));

      // Nothing else to cascade yet — no attachments/time_entries tables
      // this pass (CLAUDE.md "Поза межами цього етапу" equivalent for
      // Phase 1).
      await trx('tasks').where({ id: taskId }).delete();
    });
  } catch (err) {
    // Backstop: see updateTask's identical catch — locking board-before-task
    // in the same order everywhere is what actually prevents deadlocks, but
    // map one to a clean 409 rather than a raw 500 in case it's ever still
    // possible through some path not covered by that ordering.
    if (isDeadlock(err)) {
      throw new ConflictError('errors.task.positionConflict');
    }
    throw err;
  }
}

module.exports = {
  STATUSES,
  listTasksForBoard,
  createTask,
  updateTask,
  deleteTask,
};
