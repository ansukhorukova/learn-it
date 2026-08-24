const db = require('../db/knex');
const { isUuid } = require('../lib/uuid');
const { ValidationError, NotFoundError } = require('../lib/serviceErrors');
const { requireTaskOwner } = require('../lib/authz');
const { lockRow } = require('../lib/db');
const { validateShareRole, validateShareEmail } = require('../lib/shareValidation');

/**
 * task_shares CRUD (US14) — sharing a SINGLE task by email, WITHOUT granting
 * access to the rest of the parent board. Every function here is owner-only
 * via requireTaskOwner (lib/authz.js) — the OWNER OF THE TASK'S PARENT
 * BOARD, never a board-level or task-level collaborator (US15: "collaborator
 * НЕ може керувати task_shares"), so, like boardMembers.service.js, there's
 * no `minRole` parameter here — one valid caller only.
 *
 * This module never touches `board_members` — a task_shares row only ever
 * grants access to THIS task id (see lib/authz.js's getTaskRole, which reads
 * both tables but only ever widens a specific task's effective role, never
 * the board's).
 */

// AUTH-004 AC5/AC6: same public_name-falls-back-to-display_name resolution
// as boardMembers.service.js's toMember — see that comment for the reasoning.
function toShare(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id,
    email: row.email,
    displayName: row.public_name || row.display_name,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listShares(taskId, ownerId) {
  await requireTaskOwner(taskId, ownerId);
  const rows = await db('task_shares')
    .join('users', 'users.id', 'task_shares.user_id')
    .where({ task_id: taskId })
    .select('task_shares.*', 'users.email as email', 'users.display_name as display_name', 'users.public_name as public_name')
    .orderBy('task_shares.created_at', 'asc');
  return rows.map(toShare);
}

/**
 * Same idempotent-upsert duplicate-share contract as
 * boardMembers.service.js's addMember (US17) — re-sharing the same email
 * updates their role via `INSERT ... ON CONFLICT (task_id, user_id) DO
 * UPDATE`, backed by the migration's `UNIQUE (task_id, user_id)`. Locks the
 * task row (via requireTaskOwner's `forUpdate`) for the same
 * concurrent-delete-race reason as addMember locks the board row.
 *
 * Self-share (US17): rejected — `ownerId` here is always the task's parent
 * board's owner (requireTaskOwner already enforced that), so sharing with
 * that same id would just be the owner sharing with themselves.
 */
async function addShare(taskId, ownerId, { email, role } = {}) {
  const validRole = validateShareRole(role);
  const validEmail = validateShareEmail(email);

  return db.transaction(async (trx) => {
    await requireTaskOwner(taskId, ownerId, { trx, forUpdate: true });

    const targetUser = await trx('users').whereRaw('lower(email) = lower(?)', [validEmail]).first();
    if (!targetUser) throw new NotFoundError('errors.share.userNotFound');
    if (targetUser.id === ownerId) throw new ValidationError('errors.share.selfShare');

    const [row] = await trx('task_shares')
      .insert({ task_id: taskId, user_id: targetUser.id, role: validRole })
      .onConflict(['task_id', 'user_id'])
      .merge({ role: validRole, updated_at: trx.fn.now() })
      .returning('*');

    return toShare({ ...row, email: targetUser.email, display_name: targetUser.display_name, public_name: targetUser.public_name });
  });
}

// Same lockRow-then-recheck concurrency shape as
// boardMembers.service.js's updateMemberRole (US17).
async function updateShareRole(taskId, shareId, ownerId, { role } = {}) {
  await requireTaskOwner(taskId, ownerId);
  if (!isUuid(shareId)) throw new NotFoundError('errors.share.shareNotFound');
  const validRole = validateShareRole(role);

  const row = await db.transaction(async (trx) => {
    const existing = await lockRow(trx, 'task_shares', shareId, () => new NotFoundError('errors.share.shareNotFound'));
    if (existing.task_id !== taskId) throw new NotFoundError('errors.share.shareNotFound');
    const [updated] = await trx('task_shares')
      .where({ id: shareId })
      .update({ role: validRole, updated_at: trx.fn.now() })
      .returning('*');
    return updated;
  });

  const user = await db('users').where({ id: row.user_id }).first();
  return toShare({ ...row, email: user.email, display_name: user.display_name, public_name: user.public_name });
}

async function removeShare(taskId, shareId, ownerId) {
  await requireTaskOwner(taskId, ownerId);
  if (!isUuid(shareId)) throw new NotFoundError('errors.share.shareNotFound');

  await db.transaction(async (trx) => {
    const existing = await lockRow(trx, 'task_shares', shareId, () => new NotFoundError('errors.share.shareNotFound'));
    if (existing.task_id !== taskId) throw new NotFoundError('errors.share.shareNotFound');
    await trx('task_shares').where({ id: shareId }).delete();
  });
}

module.exports = { listShares, addShare, updateShareRole, removeShare };
