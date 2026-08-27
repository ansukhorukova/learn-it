const db = require('../db/knex');
const { ValidationError, NotFoundError, ForbiddenError } = require('../lib/serviceErrors');
const { getTaskRole } = require('../lib/authz');

/**
 * task_personal_status (US-039) — a per-user overlay of `tasks.status`,
 * writable and readable ONLY by an authenticated visitor of a public board
 * with no real membership (effective task role === 'public', lib/authz.js's
 * getTaskRole). Every real member (owner / board_members / task_shares) keeps
 * the SHARED `tasks.status` and never touches this table — see the migration
 * header for the full rationale and the absolute privacy invariant (AC14).
 *
 * This module deliberately depends only on lib/authz — tasks.service.js
 * requires it (for the read-resolve in listTasksForBoard/getTaskForUser), so
 * the reverse dependency would be a cycle. The three enum values are
 * redefined locally rather than imported from tasks.service for the same
 * reason (they are already the source-of-truth `task_status` enum at the DB
 * layer regardless).
 */

const STATUSES = ['planned', 'in_progress', 'done'];
const DEFAULT_STATUS = STATUSES[0];

function validateStatus(status) {
  if (!STATUSES.includes(status)) throw new ValidationError('errors.task.invalidStatus');
  return status;
}

/**
 * PUT /tasks/:id/my-status — upsert the caller's personal status for a task.
 *
 * Allowed ONLY when the caller's effective role on the task is `public`
 * (US-039 AC6). A caller with any real membership gets 403
 * `errors.task.personalStatusNotApplicable` (AC9) — they move the shared
 * status via `PATCH /tasks/:id`, or (a real viewer) are read-only on it with
 * no personal bypass. No access at all -> 403 `errors.task.forbidden`;
 * nonexistent task / invalid uuid -> 404 `errors.task.notFound` (AC10).
 *
 * The authorization gate runs before body validation, matching
 * taskComments.service.js's createComment ordering.
 *
 * The write is a race-safe idempotent upsert against the
 * `UNIQUE (task_id, user_id)` constraint — same
 * `onConflict(...).merge()` shape as US-031's idempotent chat join — and
 * always bumps `updated_at` (AC7).
 */
async function setMyStatus(taskId, userId, { status } = {}) {
  const { task, role } = await getTaskRole(taskId, userId);
  if (!task) throw new NotFoundError('errors.task.notFound');
  if (!role) throw new ForbiddenError('errors.task.forbidden');
  if (role !== 'public') throw new ForbiddenError('errors.task.personalStatusNotApplicable');

  const validStatus = validateStatus(status);

  const [row] = await db('task_personal_status')
    .insert({ task_id: taskId, user_id: userId, status: validStatus })
    .onConflict(['task_id', 'user_id'])
    .merge({ status: validStatus, updated_at: db.fn.now() })
    .returning('*');

  return { taskId, status: row.status, updatedAt: row.updated_at };
}

/**
 * Read-resolve helper for tasks.service.js's listTasksForBoard: given the
 * task ids whose effective role for this caller is `public`, returns a
 * Map(taskId -> personal status). Tasks with no row are simply absent from
 * the map — the caller falls back to DEFAULT_STATUS ('planned', AC2).
 * Scoped to `user_id = ?` — never returns another user's row (AC14).
 */
async function getPersonalStatuses(taskIds, userId) {
  if (!taskIds || taskIds.length === 0) return new Map();
  const rows = await db('task_personal_status')
    .where({ user_id: userId })
    .whereIn('task_id', taskIds)
    .select('task_id', 'status');
  return new Map(rows.map((row) => [row.task_id, row.status]));
}

/**
 * Single-task variant for tasks.service.js's getTaskForUser. Returns the
 * caller's personal status string for one task, or null if they have no row
 * (caller falls back to 'planned', AC3).
 */
async function getPersonalStatus(taskId, userId) {
  const row = await db('task_personal_status').where({ task_id: taskId, user_id: userId }).first();
  return row ? row.status : null;
}

module.exports = {
  STATUSES,
  DEFAULT_STATUS,
  setMyStatus,
  getPersonalStatuses,
  getPersonalStatus,
};
