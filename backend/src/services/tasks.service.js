const db = require('../db/knex');
const { ValidationError, NotFoundError, ForbiddenError, ConflictError } = require('../lib/serviceErrors');
const { requireBoardRole, requireTaskRole, higherRole } = require('../lib/authz');
const { isUniqueViolation, isDeadlock } = require('../lib/dbErrors');
const { lockRow, lockedUpdate } = require('../lib/db');
const storage = require('../lib/storage');
const personalStatus = require('./taskPersonalStatus.service');

const TITLE_MAX_LENGTH = 200;
// The "Description" field (`tasks.notes`). 20000 rather than a shorter limit
// because board import (US-041) writes the full text of a book section here —
// it used to land in a separate note attachment. Manual editing and import
// share this one number.
const NOTES_MAX_LENGTH = 20000;
const STATUSES = ['planned', 'in_progress', 'done'];
const DEFAULT_STATUS = STATUSES[0];
// US-020 AC5: "~166 годин" — the approved AC's own upper bound for the
// estimate field, kept as a named constant since both the invalid-format
// and too-large error branches below reference it.
const PLANNED_MINUTES_MAX = 9999;

// Gap-based position scheme: every write reindexes the affected column to
// evenly-spaced multiples of POSITION_GAP (1000, 2000, ...). Simpler and more
// robust than midpoint/float math (no precision limits, no "ran out of room
// between two adjacent floats" edge case) at the cost of rewriting the
// touched column's rows on every drag — fine at this app's scale (a column
// holding hundreds of tasks is still a handful of single-row updates).
const POSITION_GAP = 1000;

// `attachmentCount` is only present on rows read via listTasksForBoard
// (LEFT JOIN + COUNT, same live-aggregation pattern as boards.service.js's
// taskCount — never a denormalized column that could drift). Rows read by
// any other path in this file (create/update/delete, all single-task reads)
// don't join attachments, so this defaults to 0 there rather than showing a
// stale/wrong count.
// `myRole` (US13-US17): the caller's effective role on this task — 'owner',
// 'collaborator', or 'viewer' — present whenever the caller comes through
// getOwnedTaskWithBoard/getTaskForUser (which attach it), absent (falls back
// to 'owner') on rows from a plain owner-scoped write path that never
// computed it. See lib/authz.js's higherRole for the board-vs-task-share
// priority rule this reflects.
function toTask(row) {
  return {
    id: row.id,
    boardId: row.board_id,
    title: row.title,
    notes: row.notes,
    status: row.status,
    position: row.position,
    createdBy: row.created_by,
    attachmentCount: row.attachment_count !== undefined ? Number(row.attachment_count) || 0 : 0,
    myRole: row.myRole || 'owner',
    // US-020: nullable estimate in minutes, passed straight through from the
    // `tasks.planned_minutes` column — no aggregation needed (unlike
    // `totalSeconds`, which is merged in separately at the route layer from
    // time_entries; see boards.route.js).
    plannedMinutes: row.planned_minutes ?? null,
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

// Mirrors boards.service.js's normalizeDescription: same UI label
// ("Description") reusing this pre-existing `notes` column rather than
// adding a separate one (per product decision — see task panel's
// description section).
function normalizeNotes(notes) {
  if (notes === undefined) return undefined;
  if (notes === null) return null;
  const trimmed = String(notes).trim();
  if (trimmed.length > NOTES_MAX_LENGTH) throw new ValidationError('errors.task.notesTooLong');
  return trimmed || null;
}

// US-020 AC2/AC3/AC4/AC5: `plannedMinutes` is the already-combined
// hours*60+minutes total the FE computes from its two-field (hours/minutes)
// form — this only validates the single integer the API actually receives.
// `null` is a deliberate, explicit reset (AC3, same "clearing back to NULL
// is a legitimate action" pattern as `users.public_name`, AUTH-004 AC3) —
// distinct from `undefined`, which callers use to mean "field omitted,
// leave unchanged" (see updateTask's `!== undefined` check below).
function validatePlannedMinutes(plannedMinutes) {
  if (plannedMinutes === null) return null;
  if (typeof plannedMinutes !== 'number' || !Number.isInteger(plannedMinutes) || plannedMinutes < 0) {
    throw new ValidationError('errors.task.plannedMinutesInvalid');
  }
  if (plannedMinutes > PLANNED_MINUTES_MAX) {
    throw new ValidationError('errors.task.plannedMinutesTooLarge');
  }
  return plannedMinutes;
}

// Tasks have no `owner_id` of their own — authorization is derived through
// the parent board's owner_id, PLUS (US13-US17) any board_members row for
// the parent board and any task_shares row for this exact task, whichever
// is more permissive (lib/authz.js's getTaskRole/higherRole). Delegates to
// lib/authz.js's requireTaskRole — shared with boardMembers/taskShares
// service modules so the effective-role computation can't drift between
// callers (same extraction rationale as the original getOwnedBoard
// code-reviewer finding this comment used to describe).
//
// `minRole` (default 'viewer'): every read-only call site (attachment/time-
// entry listing, GET /tasks/:id) accepts any role — US16's "viewer has full
// access to their OWN time tracking" invariant lives in timeEntries.service
// scoping every query to `user_id = ownerId`, not here. Callers that mutate
// shared state (task title/status/position, attachments) pass
// `{ minRole: 'collaborator' }` — US15/US16.
//
// Returns the task row with `myRole` attached (the caller's effective role)
// so route handlers/toTask can surface it without a second query, plus
// `hasBoardAccess` (see lib/authz.js's getTaskRole) — updateTask's reorder
// branch below uses it to block a task-share-only caller from an operation
// that would touch sibling tasks they can't read (code-reviewer MAJOR
// finding).
async function getOwnedTaskWithBoard(taskId, ownerId, { minRole = 'viewer' } = {}) {
  const { task, role, hasBoardAccess } = await requireTaskRole(taskId, ownerId, minRole);
  return { ...task, myRole: role, hasBoardAccess };
}

// Single-task detail (new endpoint, GET /tasks/:id) — the read path a
// task_shares-only recipient actually needs: `listTasksForBoard` below is
// deliberately board-level-only (US14: a task share must never leak the
// rest of the board), so a task-share recipient with no board_members row
// has no other way to fetch the task they were shared. Any role (viewer+)
// can read.
async function getTaskForUser(taskId, userId) {
  const row = await getOwnedTaskWithBoard(taskId, userId);
  // US-039 AC3/AC4: a public-board visitor with no real membership
  // (effective role `public`) gets their OWN personal `status` overlay
  // (fallback 'planned'), never the owner's shared `tasks.status`. Every
  // real role resolves `tasks.status` unchanged.
  if (row.myRole === 'public') {
    const mine = await personalStatus.getPersonalStatus(taskId, userId);
    return toTask({ ...row, status: mine || personalStatus.DEFAULT_STATUS });
  }
  return toTask(row);
}

// `attachmentCount` (US9): LEFT JOIN + COUNT against `attachments`, grouped
// by task — same live-aggregation approach as boards.service.js's
// taskCount, so the board view's per-card badge is always accurate and
// never needs a denormalized counter kept in sync on writes elsewhere
// (attachments.service.js's create/delete). `tasks.*`/order-by columns are
// qualified to avoid ambiguity now that a second table is joined in.
//
// Board-level access only (owner or a board_members row) — deliberately
// does NOT also honor a task_shares-only grant (US14: listing every task on
// the board would leak the rest of the board to someone who was only ever
// shared one task on it). A task-share recipient reads their task via
// getTaskForUser (GET /tasks/:id) instead.
//
// Each returned task's `myRole` (US17) is the caller's EFFECTIVE role on
// that specific task — `boardRole`, unless this exact task also has a
// task_shares row for the caller that's more permissive (higherRole) — so a
// board-viewer who was additionally task-shared as collaborator on one task
// sees `collaborator` for that task and `viewer` for every other one.
async function listTasksForBoard(boardId, ownerId) {
  const { role: boardRole } = await requireBoardRole(boardId, ownerId, 'viewer');
  const rows = await db('tasks')
    .leftJoin('attachments', 'attachments.task_id', 'tasks.id')
    .where({ 'tasks.board_id': boardId })
    .groupBy('tasks.id')
    .select('tasks.*')
    .count('attachments.id as attachment_count')
    .orderBy([{ column: 'tasks.status' }, { column: 'tasks.position', order: 'asc' }]);

  const taskIds = rows.map((row) => row.id);
  const shareRows = taskIds.length
    ? await db('task_shares').where({ user_id: ownerId }).whereIn('task_id', taskIds)
    : [];
  const shareRoleByTaskId = new Map(shareRows.map((row) => [row.task_id, row.role]));

  const withRoles = rows.map((row) => ({
    row,
    effectiveRole: higherRole(boardRole, shareRoleByTaskId.get(row.id) || null),
  }));

  // US-039 AC2/AC4/AC5: for every task whose effective role is `public`
  // (public board, no real membership on this specific task), the caller's
  // `status` is their OWN personal overlay (fallback 'planned'), not the
  // shared `tasks.status`. A task on the same board where this caller DOES
  // have a real `task_shares` role (effectiveRole !== 'public') keeps the
  // shared status — the mixed state AC5 describes. The route's
  // `columnTotals` then sum by this resolved status (AC12).
  const publicTaskIds = withRoles.filter((x) => x.effectiveRole === 'public').map((x) => x.row.id);
  const personalStatusByTaskId = await personalStatus.getPersonalStatuses(publicTaskIds, ownerId);

  const tasks = withRoles.map(({ row, effectiveRole }) => {
    const status =
      effectiveRole === 'public'
        ? personalStatusByTaskId.get(row.id) || personalStatus.DEFAULT_STATUS
        : row.status;
    return toTask({ ...row, status, myRole: effectiveRole });
  });
  return { tasks, boardRole };
}

async function createTask(boardId, ownerId, { title, notes } = {}) {
  const validTitle = validateTitle(title);
  const validNotes = normalizeNotes(notes) ?? null;

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
      //
      // US15: a board-level collaborator can create tasks, a viewer can't —
      // `minRole: 'collaborator'` folds that check into the same locked
      // read. Creating a task always needs board-level access (there's no
      // task yet for a task_shares row to apply to), so this uses
      // requireBoardRole, not requireTaskRole.
      const { role } = await requireBoardRole(boardId, ownerId, 'collaborator', { trx, forUpdate: true });

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
          notes: validNotes,
          status: DEFAULT_STATUS,
          position,
          created_by: ownerId,
        })
        .returning('*');
      return toTask({ ...row, myRole: role });
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
async function updateTask(taskId, ownerId, { title, notes, status, position, plannedMinutes } = {}) {
  // US15/US16: editing/moving a task needs collaborator+ — a viewer (board-
  // or task-level) is read-only here. US-020 reuses this exact same gate for
  // `plannedMinutes` — no separate authorization path.
  const task = await getOwnedTaskWithBoard(taskId, ownerId, { minRole: 'collaborator' });

  const patch = {};
  if (title !== undefined) patch.title = validateTitle(title);
  const normalizedNotes = normalizeNotes(notes);
  if (normalizedNotes !== undefined) patch.notes = normalizedNotes;
  // US-020: `plannedMinutes` never participates in the reorder branch below
  // (it's not `status`/`position`) — a plannedMinutes-only PATCH always
  // takes the title/notes-style branch just below, going through the same
  // lockedUpdate existence-check as every other non-reordering field.
  if (plannedMinutes !== undefined) patch.planned_minutes = validatePlannedMinutes(plannedMinutes);

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
    return toTask({ ...row, myRole: task.myRole });
  }

  // code-reviewer MAJOR finding (US14 leak): reindexColumn below
  // unconditionally rewrites `position`/`updated_at` on EVERY other task
  // currently in the destination (board_id, status) column, not just the
  // one being moved — that's how the gap-based reindex scheme keeps
  // positions evenly spaced (see reindexColumn's own header comment). A
  // caller whose ONLY grant on this task is a `task_shares` row (no
  // `board_members` role on the parent board at all — `hasBoardAccess:
  // false`, lib/authz.js's getTaskRole) can never read those sibling tasks
  // through any endpoint (listTasksForBoard/getBoard both require
  // board-level access, US14), so letting them trigger a write that
  // touches those siblings' rows is exactly the "task_shares row never
  // grants access to... any other task" leak the migration's own header
  // comment (20260824130000_create_task_shares_table.js) declares must not
  // happen. `role` alone can't catch this — a task-share `collaborator` and
  // a board-member `collaborator` have the same rank. The title-only branch
  // above is unaffected (it only ever touches this one row), so a
  // task-share-only collaborator can still rename their task; only
  // status/position changes — which always go through this reindex — are
  // blocked here.
  if (!task.hasBoardAccess) {
    throw new ForbiddenError('errors.task.reorderRequiresBoardAccess');
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
      return toTask({ ...row, myRole: task.myRole });
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
  // US15/US16: deleting a task needs collaborator+, same as editing/moving —
  // "редагувати" is read broadly enough to cover delete, since the only
  // deletion explicitly withheld from a collaborator by the approved AC is
  // the board itself.
  const task = await getOwnedTaskWithBoard(taskId, ownerId, { minRole: 'collaborator' });

  // Collected inside the transaction below (storage_path of every file-kind
  // attachment this task owns), then used to clean up the corresponding
  // MinIO objects AFTER the transaction commits — see the comment further
  // down for why this exists.
  let orphanedStorageKeys = [];

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

      // `attachments.task_id` is ON DELETE CASCADE (US9 migration), so the
      // task DELETE below removes every attachment row under it for free at
      // the DB level — but that cascade only touches Postgres, not the
      // MinIO objects file-kind attachments point at. Read their keys now,
      // before the rows disappear, so they can be removed from storage
      // after this transaction commits (best-effort, outside the trx — a
      // storage-delete failure shouldn't roll back a task deletion the user
      // already confirmed).
      orphanedStorageKeys = (
        await trx('attachments').where({ task_id: taskId, kind: 'file' }).select('storage_path')
      )
        .map((r) => r.storage_path)
        .filter(Boolean);

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

  await Promise.all(
    orphanedStorageKeys.map((key) =>
      storage.deleteObject(key).catch((storageErr) => {
        // eslint-disable-next-line no-console
        console.error('Failed to delete attachment object from storage after task delete', key, storageErr);
      }),
    ),
  );
}

module.exports = {
  STATUSES,
  getOwnedTaskWithBoard,
  getTaskForUser,
  listTasksForBoard,
  createTask,
  updateTask,
  deleteTask,
};
