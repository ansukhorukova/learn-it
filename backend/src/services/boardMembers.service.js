const db = require('../db/knex');
const { isUuid } = require('../lib/uuid');
const { ValidationError, NotFoundError } = require('../lib/serviceErrors');
const { getOwnedBoard } = require('../lib/authz');
const { lockRow } = require('../lib/db');
const { validateShareRole, validateShareEmail } = require('../lib/shareValidation');

/**
 * board_members CRUD (US13) — sharing a WHOLE board by email, role
 * `viewer`/`collaborator`. Every function here is owner-only
 * (getOwnedBoard, lib/authz.js — throws the nuanced `errors.board.ownerOnly`
 * for a collaborator/viewer who has board access but isn't the owner, per
 * US15: "collaborator НЕ може керувати board_members"), so there's
 * deliberately no `minRole` parameter anywhere in this file — board_members
 * management only ever has one valid caller.
 */

// AUTH-004 AC5/AC6: a member is shown by their `public_name` if they've set
// one, falling back to the system `display_name` otherwise — never the raw
// `display_name` when a `public_name` exists. Resolved here, server-side,
// rather than in the FE, so every caller of this service (and any future
// one) gets the same fallback for free instead of re-implementing it.
function toMember(row) {
  return {
    id: row.id,
    boardId: row.board_id,
    userId: row.user_id,
    email: row.email,
    displayName: row.public_name || row.display_name,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listMembers(boardId, ownerId) {
  await getOwnedBoard(boardId, ownerId);
  const rows = await db('board_members')
    .join('users', 'users.id', 'board_members.user_id')
    .where({ board_id: boardId })
    .select('board_members.*', 'users.email as email', 'users.display_name as display_name', 'users.public_name as public_name')
    .orderBy('board_members.created_at', 'asc');
  return rows.map(toMember);
}

/**
 * Adds (or re-invites) a member by email. US17 duplicate-share decision:
 * idempotent upsert, not a 409 — re-sharing with the same email updates
 * their role to whatever was just requested (`INSERT ... ON CONFLICT
 * (board_id, user_id) DO UPDATE`, backed by the migration's
 * `UNIQUE (board_id, user_id)`), so "share again with a different role" is
 * the same request as "share for the first time" — no separate
 * update-vs-create branch for the caller to get wrong. Documented as this
 * endpoint's contract in openapi.yaml.
 *
 * Wrapped in a transaction locking the board row (US17 concurrency): closes
 * the race where deleteBoard runs between an unlocked ownership check and
 * this INSERT (would otherwise hit a raw FK violation) — same shape as
 * tasks.service.js's createTask locking the board row before inserting.
 *
 * US17 self-share: rejected as a ValidationError, not silently ignored or
 * upserted — the owner is never a `board_members` row (their access is
 * always `boards.owner_id`), so a self-share attempt is always a mistake to
 * surface, not a valid no-op.
 */
async function addMember(boardId, ownerId, { email, role } = {}) {
  const validRole = validateShareRole(role);
  const validEmail = validateShareEmail(email);

  return db.transaction(async (trx) => {
    const board = await getOwnedBoard(boardId, ownerId, { trx, forUpdate: true });

    const targetUser = await trx('users').whereRaw('lower(email) = lower(?)', [validEmail]).first();
    if (!targetUser) throw new NotFoundError('errors.share.userNotFound');
    if (targetUser.id === board.owner_id) throw new ValidationError('errors.share.selfShare');

    const [row] = await trx('board_members')
      .insert({ board_id: boardId, user_id: targetUser.id, role: validRole })
      .onConflict(['board_id', 'user_id'])
      .merge({ role: validRole, updated_at: trx.fn.now() })
      .returning('*');

    return toMember({ ...row, email: targetUser.email, display_name: targetUser.display_name, public_name: targetUser.public_name });
  });
}

/**
 * US17 concurrency: two concurrent requests touching the SAME member row
 * (e.g. one changing its role while another deletes it) serialize on
 * lockRow's `SELECT ... FOR UPDATE` — whichever commits first "wins", and
 * the loser either operates on the fresh committed state (if it re-reads,
 * which this doesn't need to) or, if the row is gone, gets a clean
 * NotFoundError instead of silently updating a phantom row or crashing.
 * Same shape as attachments.service.js's deleteAttachment.
 */
async function updateMemberRole(boardId, memberId, ownerId, { role } = {}) {
  await getOwnedBoard(boardId, ownerId);
  if (!isUuid(memberId)) throw new NotFoundError('errors.share.memberNotFound');
  const validRole = validateShareRole(role);

  const row = await db.transaction(async (trx) => {
    const existing = await lockRow(trx, 'board_members', memberId, () => new NotFoundError('errors.share.memberNotFound'));
    if (existing.board_id !== boardId) throw new NotFoundError('errors.share.memberNotFound');
    const [updated] = await trx('board_members')
      .where({ id: memberId })
      .update({ role: validRole, updated_at: trx.fn.now() })
      .returning('*');
    return updated;
  });

  const user = await db('users').where({ id: row.user_id }).first();
  return toMember({ ...row, email: user.email, display_name: user.display_name, public_name: user.public_name });
}

async function removeMember(boardId, memberId, ownerId) {
  await getOwnedBoard(boardId, ownerId);
  if (!isUuid(memberId)) throw new NotFoundError('errors.share.memberNotFound');

  await db.transaction(async (trx) => {
    const existing = await lockRow(trx, 'board_members', memberId, () => new NotFoundError('errors.share.memberNotFound'));
    if (existing.board_id !== boardId) throw new NotFoundError('errors.share.memberNotFound');
    await trx('board_members').where({ id: memberId }).delete();
  });
}

module.exports = { listMembers, addMember, updateMemberRole, removeMember };
