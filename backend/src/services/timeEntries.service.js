const db = require('../db/knex');
const { isUuid } = require('../lib/uuid');
const { ValidationError, NotFoundError, ConflictError } = require('../lib/serviceErrors');
const { lockRow } = require('../lib/db');
const { isUniqueViolation, isForeignKeyViolation } = require('../lib/dbErrors');
const { getOwnedTaskWithBoard } = require('./tasks.service');

// US16: every call below uses getOwnedTaskWithBoard's default `minRole:
// 'viewer'` — a viewer (board- or task-level) has FULL access to their OWN
// timer/time entries on a task they can see, same as a collaborator/owner.
// This is intentionally not gated any tighter: CLAUDE.md's "прогрес завжди
// приватний" invariant is enforced by every query below being scoped to
// `user_id = ownerId` (never returning another user's rows), not by
// withholding time-tracking from viewers.

// Documented as the single source of truth for both client-side and
// server-side validation errors, same pattern as attachments.service.js's
// MAX_FILE_SIZE_BYTES.
const MINUTES_MIN = 1;
const MINUTES_MAX = 1440; // 24h — US11 AC3, "не може перевищувати 24 години"
const NOTE_MAX_LENGTH = 500;

// SQL fragment computing a row's "seconds so far": the stored
// duration_seconds for a completed entry, or a live now()-started_at for the
// still-running one. Shared by every totals query below (US12 AC2) so the
// live/completed distinction can't drift between them. Two copies —
// unqualified for single-table queries (timeTotalsForTasks), `time_entries.`
// -qualified for the joined query (timeTotalsForBoards, joined to `tasks`).
const SECONDS_SO_FAR_SQL =
  "CASE WHEN ended_at IS NOT NULL THEN duration_seconds ELSE EXTRACT(EPOCH FROM (now() - started_at))::bigint END";
const SECONDS_SO_FAR_SQL_QUALIFIED =
  "CASE WHEN time_entries.ended_at IS NOT NULL THEN time_entries.duration_seconds ELSE EXTRACT(EPOCH FROM (now() - time_entries.started_at))::bigint END";

function validateMinutes(minutes) {
  if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < MINUTES_MIN) {
    throw new ValidationError('errors.timeEntry.minutesInvalid');
  }
  if (minutes > MINUTES_MAX) {
    throw new ValidationError('errors.timeEntry.minutesTooLarge');
  }
  return minutes;
}

// `note` is always optional — undefined/null/whitespace-only all normalize
// to `null` (no note) rather than an error, mirroring how the manual-entry
// form and the stop-timer form both treat an empty note field as "no note",
// not a validation failure.
function validateNote(note) {
  if (note === undefined || note === null) return null;
  const trimmed = String(note).trim();
  if (!trimmed) return null;
  if (trimmed.length > NOTE_MAX_LENGTH) throw new ValidationError('errors.timeEntry.noteTooLong');
  return trimmed;
}

function toTimeEntry(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds !== null && row.duration_seconds !== undefined ? Number(row.duration_seconds) : null,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Monday 00:00 UTC of the current week (US12 AC6: "межа — понеділок 00:00
// UTC"). Deliberately UTC-fixed, not the caller's local timezone — no
// per-user timezone preference exists on `users` yet, and CLAUDE.md's
// locale-aware formatting guidance applies to *display* (Intl.DateTimeFormat
// on the FE), not to where this server-side aggregation window starts.
function getCurrentWeekStartUtc() {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday, 0, 0, 0, 0),
  );
}

/**
 * Starts a timer on `taskId` for `ownerId`. If the user already has an
 * active timer on ANY task, it's auto-stopped (ended_at = now(),
 * duration_seconds computed) in the same transaction as the new start
 * (US10 AC2, "auto-stop-and-switch").
 *
 * Concurrent first-ever starts for the same user (from any number of tabs,
 * not just two) race the DB's `time_entries_one_active_per_user` partial
 * unique index (see the migration's header comment for why the row lock
 * below can't prevent this particular race on its own) — caught here and
 * retried, so each loser simply re-runs against the now-committed state and
 * correctly auto-stops whichever entry is active by then, instead of
 * surfacing a raw 500 (US10 AC6). The retry path itself serializes cleanly
 * against any number of racers, so the attempt cap just bounds worst-case
 * latency, not correctness — MAX_START_ATTEMPTS comfortably covers realistic
 * concurrent-tab counts.
 */
const MAX_START_ATTEMPTS = 8;

async function startTimer(taskId, ownerId) {
  await getOwnedTaskWithBoard(taskId, ownerId);

  for (let attempt = 0; attempt < MAX_START_ATTEMPTS; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop -- retry is sequential by nature: attempt 1 only runs after attempt 0's transaction has fully rolled back.
      return await db.transaction(async (trx) => {
        // Locks the task row so a concurrent deleteTask can't remove it out
        // from under this insert — same pattern as attachments.service.js's
        // insertAttachmentLocked.
        await lockRow(trx, 'tasks', taskId, () => new NotFoundError('errors.task.notFound'));

        // Locks this user's active entry, if any, across ALL of their tasks
        // (a timer is one-per-user, not one-per-task) — serializes against a
        // concurrent stop/start for the same user once that row exists.
        const activeRow = await trx('time_entries')
          .where({ user_id: ownerId })
          .whereNull('ended_at')
          .forUpdate()
          .first();

        let autoStoppedEntry = null;
        if (activeRow) {
          const [stopped] = await trx('time_entries')
            .where({ id: activeRow.id })
            .update({
              ended_at: trx.fn.now(),
              duration_seconds: trx.raw('EXTRACT(EPOCH FROM (now() - started_at))::integer'),
              updated_at: trx.fn.now(),
            })
            .returning('*');
          autoStoppedEntry = toTimeEntry(stopped);
        }

        const [started] = await trx('time_entries')
          .insert({ task_id: taskId, user_id: ownerId, started_at: trx.fn.now() })
          .returning('*');

        return { startedEntry: toTimeEntry(started), autoStoppedEntry };
      });
    } catch (err) {
      if (isUniqueViolation(err, 'time_entries_one_active_per_user') && attempt < MAX_START_ATTEMPTS - 1) {
        continue; // eslint-disable-line no-continue -- another racer's start committed first; retry observes it and auto-stops it correctly.
      }
      if (isForeignKeyViolation(err, 'time_entries_task_id_foreign')) {
        throw new NotFoundError('errors.task.notFound');
      }
      throw err;
    }
  }
  // Reached only if MAX_START_ATTEMPTS racers all collide back-to-back —
  // vanishingly unlikely, but surfaces as a distinct, honestly-named
  // conflict rather than a misleading "no active timer" message.
  throw new ConflictError('errors.timeEntry.startConflict');
}

/**
 * Stops the active timer on `taskId` for `ownerId` (US10 AC4/5). The
 * `SELECT ... FOR UPDATE ... WHERE ended_at IS NULL` re-evaluates its WHERE
 * clause against the committed row once any lock it waited on is released
 * (standard Postgres MVCC behavior for a blocked `FOR UPDATE`), so a second
 * concurrent stop attempt on an already-stopped entry cleanly resolves to
 * "no active timer" (409) rather than operating on stale data.
 */
async function stopTimer(taskId, ownerId, { note } = {}) {
  await getOwnedTaskWithBoard(taskId, ownerId);
  const noteProvided = note !== undefined;
  const validNote = noteProvided ? validateNote(note) : undefined;

  return db.transaction(async (trx) => {
    await lockRow(trx, 'tasks', taskId, () => new NotFoundError('errors.task.notFound'));

    const activeRow = await trx('time_entries')
      .where({ task_id: taskId, user_id: ownerId })
      .whereNull('ended_at')
      .forUpdate()
      .first();
    if (!activeRow) throw new ConflictError('errors.timeEntry.noActiveTimer');

    const patch = {
      ended_at: trx.fn.now(),
      duration_seconds: trx.raw('EXTRACT(EPOCH FROM (now() - started_at))::integer'),
      updated_at: trx.fn.now(),
    };
    if (noteProvided) patch.note = validNote;

    const [row] = await trx('time_entries').where({ id: activeRow.id }).update(patch).returning('*');
    return toTimeEntry(row);
  });
}

// `trx` required (not defaulted), mirroring attachments.service.js's
// insertAttachment — callers must go through insertTimeEntryLocked below so
// nothing can insert without the task-row lock/FK backstop it provides.
async function insertTimeEntry(trx, patch) {
  const [row] = await trx('time_entries').insert(patch).returning('*');
  return row;
}

// Same race this closes as attachments.service.js's insertAttachmentLocked:
// without locking the parent task row first, a concurrent deleteTask could
// commit between the caller's ownership check and this INSERT, hitting the
// `time_entries_task_id_foreign` FK constraint and falling through as a raw
// 500 instead of a clean 404.
async function insertTimeEntryLocked(taskId, patch) {
  try {
    return await db.transaction(async (trx) => {
      await lockRow(trx, 'tasks', taskId, () => new NotFoundError('errors.task.notFound'));
      return insertTimeEntry(trx, patch);
    });
  } catch (err) {
    if (isForeignKeyViolation(err, 'time_entries_task_id_foreign')) {
      throw new NotFoundError('errors.task.notFound');
    }
    throw err;
  }
}

/**
 * Manual entry (US11 AC1-4): `minutes` (1-1440) becomes a COMPLETED session
 * ending now, with `started_at` backdated by `minutes * 60` seconds —
 * never touches the active-timer state, so it can't collide with a running
 * timer on this or any other task.
 */
async function createManualEntry(taskId, ownerId, { minutes, note } = {}) {
  await getOwnedTaskWithBoard(taskId, ownerId);
  const validMinutes = validateMinutes(minutes);
  const validNote = validateNote(note);
  const durationSeconds = validMinutes * 60;

  const row = await insertTimeEntryLocked(taskId, {
    task_id: taskId,
    user_id: ownerId,
    // Explicit `::integer` cast on the bound parameter — without it,
    // Postgres's parser can't unambiguously resolve the placeholder's type
    // against the `*` operator's overloads (numeric * interval has more than
    // one candidate) at PARSE time (before any value is bound), and silently
    // picks the wrong one. Same fix as updateTimeEntry's `ended_at`
    // computation below — see its comment for the full failure mode this
    // was caught by (a concurrency test, not a plain unit test).
    started_at: db.raw("now() - (?::integer * interval '1 second')", [durationSeconds]),
    ended_at: db.fn.now(),
    duration_seconds: durationSeconds,
    note: validNote,
  });
  return toTimeEntry(row);
}

/**
 * Edits a completed entry's minutes and/or note (US11 AC5-7). `started_at`
 * is never touched — only `ended_at` is recomputed from it so the edited
 * session keeps the same start time, just a different length.
 *
 * Anti-enumeration invariant (US11 AC7): an entry that exists but belongs to
 * another user, or is still active (ended_at IS NULL — editable only via the
 * stop flow, AC6), both resolve to the exact same 404
 * `errors.timeEntry.notFound` as a genuinely missing id. Never 403 — that
 * would leak whether a given id exists at all, which is exactly what
 * CLAUDE.md's "прогрес завжди приватний" rules out for another user's rows.
 */
async function updateTimeEntry(taskId, entryId, ownerId, { minutes, note } = {}) {
  await getOwnedTaskWithBoard(taskId, ownerId);
  if (!isUuid(entryId)) throw new NotFoundError('errors.timeEntry.notFound');

  const minutesProvided = minutes !== undefined;
  const durationSeconds = minutesProvided ? validateMinutes(minutes) * 60 : undefined;
  const noteProvided = note !== undefined;
  const validNote = noteProvided ? validateNote(note) : undefined;

  return db.transaction(async (trx) => {
    const row = await lockRow(trx, 'time_entries', entryId, () => new NotFoundError('errors.timeEntry.notFound'));
    if (row.task_id !== taskId || row.user_id !== ownerId) throw new NotFoundError('errors.timeEntry.notFound');
    if (row.ended_at === null) throw new NotFoundError('errors.timeEntry.notFound'); // active — edit via stop flow only (AC6)

    const patch = { updated_at: trx.fn.now() };
    if (minutesProvided) {
      patch.duration_seconds = durationSeconds;
      // Explicit casts on BOTH bound parameters — without `?::timestamptz`
      // here, Postgres resolved `$started_at + ($duration * interval)`'s
      // ambiguous `+` overload as `interval + interval` (picking `interval`
      // as the unspecified parameter's inferred type, since that's also a
      // valid candidate) instead of `timestamptz + interval`, then rejected
      // the whole UPDATE with "column ended_at is of type timestamp with
      // time zone but expression is of type interval". Caught by
      // timeEntries.concurrency.test.js's "updateTimeEntry vs
      // deleteTimeEntry" case — a plain single-call unit test never
      // exercises this line the way that race does, but the type error is
      // unconditional and would have hit on every edited entry once one
      // actually ran.
      patch.ended_at = trx.raw("?::timestamptz + (?::integer * interval '1 second')", [row.started_at, durationSeconds]);
    }
    if (noteProvided) patch.note = validNote;

    if (Object.keys(patch).length === 1) return toTimeEntry(row); // only updated_at — nothing recognized changed

    const [updated] = await trx('time_entries').where({ id: entryId }).update(patch).returning('*');
    return toTimeEntry(updated);
  });
}

/**
 * Deletes an entry, active or completed (US11 AC8) — deleting an active one
 * simply cancels the timer with nothing saved, no special-casing needed
 * since this never computes/writes a duration.
 *
 * Same lockRow-then-recheck concurrency shape as
 * attachments.service.js's deleteAttachment: two concurrent deletes of the
 * same row serialize on the row lock, and the loser finds zero rows and
 * gets a clean 404 (US11 AC9) instead of a double-delete or a crash.
 * Same anti-enumeration contract as updateTimeEntry above — never 403.
 */
async function deleteTimeEntry(taskId, entryId, ownerId) {
  await getOwnedTaskWithBoard(taskId, ownerId);
  if (!isUuid(entryId)) throw new NotFoundError('errors.timeEntry.notFound');

  await db.transaction(async (trx) => {
    const row = await lockRow(trx, 'time_entries', entryId, () => new NotFoundError('errors.timeEntry.notFound'));
    if (row.task_id !== taskId || row.user_id !== ownerId) throw new NotFoundError('errors.timeEntry.notFound');
    await trx('time_entries').where({ id: entryId }).delete();
  });
}

/**
 * The caller's own sessions on this task plus totals (US12 AC1-3).
 * `entries` is completed sessions only (newest first) — the running one, if
 * any, is `activeEntry`, kept separate since it's edited only via the
 * stop flow (US11 AC6), never through the edit/delete session list.
 * `totalSeconds` = sum of completed durations + the active entry's live
 * elapsed time, if running.
 *
 * `WHERE user_id = ownerId` is unconditional — this NEVER returns another
 * user's rows, only their own aggregated total would ever be exposed
 * (there's no such endpoint yet; team view is explicitly out of scope for
 * this pass). See openapi.yaml for this as a documented contract invariant.
 */
async function listTimeEntriesForTask(taskId, ownerId) {
  await getOwnedTaskWithBoard(taskId, ownerId);

  const rows = await db('time_entries')
    .where({ task_id: taskId, user_id: ownerId })
    .orderBy('started_at', 'desc');

  const activeRow = rows.find((row) => row.ended_at === null) || null;
  const completedRows = rows.filter((row) => row.ended_at !== null);
  const completedTotal = completedRows.reduce((sum, row) => sum + (Number(row.duration_seconds) || 0), 0);
  const activeSeconds = activeRow ? Math.max(0, Math.floor((Date.now() - new Date(activeRow.started_at).getTime()) / 1000)) : 0;

  return {
    entries: completedRows.map(toTimeEntry),
    activeEntry: activeRow ? toTimeEntry(activeRow) : null,
    totalSeconds: completedTotal + activeSeconds,
  };
}

/**
 * Per-task totals for the board view (US12 AC4): own time (completed +
 * live active) for each id in `taskIds`, scoped to `ownerId` — same
 * never-another-user's-rows invariant as listTimeEntriesForTask, just
 * aggregated instead of listed. Returns a Map(taskId -> totalSeconds);
 * a task with zero entries simply has no key (callers default to 0).
 *
 * Deliberately a separate query rather than an extra LEFT JOIN folded into
 * tasks.service.js's listTasksForBoard attachment-count query: joining two
 * one-to-many tables (attachments AND time_entries) off the same tasks row
 * in one query would fan out into a cross product of the two, inflating
 * both the attachment COUNT and this SUM. Merged back onto the task list at
 * the route layer (boards.route.js) instead — also sidesteps a circular
 * require, since this module already depends on tasks.service.js for
 * getOwnedTaskWithBoard.
 */
async function timeTotalsForTasks(taskIds, ownerId) {
  if (!taskIds || taskIds.length === 0) return new Map();
  const rows = await db('time_entries')
    .where({ user_id: ownerId })
    .whereIn('task_id', taskIds)
    .select('task_id')
    .select(db.raw(`SUM(${SECONDS_SO_FAR_SQL}) AS total_seconds`))
    .groupBy('task_id');
  return new Map(rows.map((row) => [row.task_id, Number(row.total_seconds) || 0]));
}

/**
 * Per-board totals for the boards overview (US12 AC6): all-time and
 * this-calendar-week (Monday 00:00 UTC boundary) own time, scoped to
 * `ownerId`. Returns a Map(boardId -> { totalSeconds, thisWeekSeconds});
 * a board with zero entries simply has no key (callers default to both 0).
 *
 * "This week" counts a session toward the week it STARTED in — a session
 * that happens to straddle the Monday boundary isn't split across both
 * weeks. Not specced beyond "межа — понеділок 00:00 UTC"; this is the
 * simplest reading that still matches that boundary exactly for the common
 * case (sessions rarely run for days).
 */
async function timeTotalsForBoards(boardIds, ownerId) {
  if (!boardIds || boardIds.length === 0) return new Map();
  const weekStart = getCurrentWeekStartUtc();
  const rows = await db('time_entries')
    .join('tasks', 'tasks.id', 'time_entries.task_id')
    .where('time_entries.user_id', ownerId)
    .whereIn('tasks.board_id', boardIds)
    .select('tasks.board_id as board_id')
    .select(
      db.raw(`SUM(${SECONDS_SO_FAR_SQL_QUALIFIED}) AS total_seconds`),
      db.raw(
        `SUM(CASE WHEN time_entries.started_at >= ? THEN (${SECONDS_SO_FAR_SQL_QUALIFIED}) ELSE 0 END) AS this_week_seconds`,
        [weekStart],
      ),
    )
    .groupBy('tasks.board_id');
  return new Map(
    rows.map((row) => [
      row.board_id,
      { totalSeconds: Number(row.total_seconds) || 0, thisWeekSeconds: Number(row.this_week_seconds) || 0 },
    ]),
  );
}

module.exports = {
  MINUTES_MIN,
  MINUTES_MAX,
  NOTE_MAX_LENGTH,
  startTimer,
  stopTimer,
  createManualEntry,
  updateTimeEntry,
  deleteTimeEntry,
  listTimeEntriesForTask,
  timeTotalsForTasks,
  timeTotalsForBoards,
};
