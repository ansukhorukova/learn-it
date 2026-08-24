const db = require('../db/knex');
const { isUuid } = require('./uuid');
const { NotFoundError, ForbiddenError } = require('./serviceErrors');

// Effective-role model for the board/task sharing feature (US13-US17).
// Three "real" roles, ranked by how much they permit: viewer < collaborator
// < owner. `owner` is never a row in `board_members`/`task_shares` — it's
// always derived from `boards.owner_id`.
//
// `public` (US-022) is a fourth, deliberately separate role: the read-only
// access ANY authenticated user gets to a `boards.visibility = 'public'`
// board with no `board_members`/`task_shares` row of their own. It ranks
// alongside `viewer` (1) so every existing `minRole: 'viewer'` read gate
// admits it for free, and every existing `minRole: 'collaborator'` write
// gate rejects it for free (US-022 AC3) — no separate `public`-aware branch
// needed at any of those call sites. It is NEVER assigned as a
// `board_members`/`task_shares` row's own role — only computed on the fly by
// getBoardRole/getTaskRole below, and only as a fallback once every real
// source of access has come up empty (US-022 AC7: real membership always
// wins over public base access — see higherRole below for the one place
// that priority needs an explicit tie-break).
const ROLE_RANK = { viewer: 1, public: 1, collaborator: 2, owner: 3 };

function rankOf(role) {
  return role ? ROLE_RANK[role] || 0 : 0;
}

// US17 priority rule, one sentence (also documented on the Task schema in
// openapi.yaml): when a user has both a board-level role (via
// board_members) and a task-level role (via task_shares) on the same task,
// the MORE PERMISSIVE of the two wins as their effective role on that task.
//
// US-022 AC7 extends this: `public` never wins a tie against a real role.
// `public` and `viewer` share the same rank (1), so the generic
// rank-comparison below alone would non-deterministically favor whichever
// argument happens to be `a` on a tie — e.g. tasks.service.js's
// listTasksForBoard calls `higherRole(boardRole, taskShareRole)`, and a
// public visitor (`boardRole: 'public'`) who ALSO happens to have a real
// `task_shares` row of `viewer` on one specific task would otherwise still
// show `myRole: 'public'` for that task instead of the real `viewer` grant.
// Since `public` is only ever produced by getBoardRole/getTaskRole as a
// last-resort fallback (never a real membership row), any real, truthy role
// on the other side always wins outright — regardless of rank — before
// falling through to the ordinary rank comparison.
function higherRole(a, b) {
  if (a === 'public' && b) return b;
  if (b === 'public' && a) return a;
  return rankOf(a) >= rankOf(b) ? a || b : b;
}

// Authorization gate shared by every board read+write that touches one
// specific board (CLAUDE.md: BE is the single point of authorization,
// checked in the service layer before any DB write). Not-found and
// not-owned are deliberately distinct errors (404 vs 403) per the approved
// AC ("403/404" for a non-owner opening a board URL directly).
//
// STRICT owner-only gate — used for board settings (rename/delete) and for
// managing board_members/task_shares (US15: a collaborator can never do
// either, no matter how permissive their role is otherwise). For a caller
// who has SOME access to the board (any board_members row) but isn't the
// owner, this throws a distinct `errors.board.ownerOnly` instead of the
// generic `errors.board.forbidden` — "you have access, just not enough of
// it" is a different, more actionable message than "you have no access at
// all" (US17 locale ask: 403 messages need to distinguish the two).
//
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
  if (row.owner_id === ownerId) return row;
  const member = await (trx || db)('board_members').where({ board_id: boardId, user_id: ownerId }).first();
  if (member) throw new ForbiddenError('errors.board.ownerOnly');
  throw new ForbiddenError('errors.board.forbidden');
}

// STRICT owner-only gate for a task, mirroring getOwnedBoard above — used
// only by taskShares.service.js (US15: managing a task's shares is
// owner-of-the-parent-board-only, even for a collaborator with full
// edit/move rights on the task itself). Distinguishes "no access at all"
// from "has some access (board- or task-level), just not owner" the same
// way getOwnedBoard does.
async function requireTaskOwner(taskId, ownerId, { trx, forUpdate = false } = {}) {
  if (!isUuid(taskId)) throw new NotFoundError('errors.task.notFound');
  const query = (trx || db)('tasks')
    .join('boards', 'boards.id', 'tasks.board_id')
    .where('tasks.id', taskId)
    .select('tasks.*', 'boards.owner_id as board_owner_id');
  if (forUpdate) query.forUpdate();
  const row = await query.first();
  if (!row) throw new NotFoundError('errors.task.notFound');
  if (row.board_owner_id === ownerId) return row;
  const [member, share] = await Promise.all([
    (trx || db)('board_members').where({ board_id: row.board_id, user_id: ownerId }).first(),
    (trx || db)('task_shares').where({ task_id: taskId, user_id: ownerId }).first(),
  ]);
  if (member || share) throw new ForbiddenError('errors.task.ownerOnly');
  throw new ForbiddenError('errors.task.forbidden');
}

// Board-level effective role (owner, or a board_members row) — deliberately
// does NOT consult task_shares (a task-level share must never leak board
// access, US14). Returns `{ board: null, role: null }` for a nonexistent
// board rather than throwing, so callers can choose their own 404 wording;
// requireBoardRole below is the throwing wrapper most callers actually want.
//
// US-022 AC2/AC7: when there's no real role (not the owner, no
// `board_members` row) but the board is `visibility: 'public'`, the caller
// still gets a role — `'public'` — rather than `null`. This is checked LAST,
// after both real-access checks, so a real role (however it was granted)
// always wins over the public fallback, never the other way around.
async function getBoardRole(boardId, userId, { trx, forUpdate = false } = {}) {
  if (!isUuid(boardId)) return { board: null, role: null };
  const query = (trx || db)('boards').where({ id: boardId });
  if (forUpdate) query.forUpdate();
  const board = await query.first();
  if (!board) return { board: null, role: null };
  if (board.owner_id === userId) return { board, role: 'owner' };
  const member = await (trx || db)('board_members').where({ board_id: boardId, user_id: userId }).first();
  if (member) return { board, role: member.role };
  if (board.visibility === 'public') return { board, role: 'public' };
  return { board, role: null };
}

// Throws NotFoundError if the board doesn't exist, ForbiddenError
// `errors.board.forbidden` if the caller has no board-level role at all, or
// `errors.board.readOnlyAccess` if they have a role but it's below
// `minRole` (US17 locale ask: distinct message for "insufficient role" vs
// "no access"). Returns `{ board, role }` on success.
async function requireBoardRole(boardId, userId, minRole, opts = {}) {
  const { board, role } = await getBoardRole(boardId, userId, opts);
  if (!board) throw new NotFoundError('errors.board.notFound');
  if (!role) throw new ForbiddenError('errors.board.forbidden');
  if (rankOf(role) < rankOf(minRole)) throw new ForbiddenError('errors.board.readOnlyAccess');
  return { board, role };
}

// Task-level effective role: owner, else the higher of any board_members
// role (via the task's parent board) and any task_shares role for this
// exact task (US17 priority rule — see higherRole above). Returns
// `{ task: null, role: null, hasBoardAccess: false }` for a nonexistent
// task; requireTaskRole below is the throwing wrapper most callers actually
// want.
//
// `hasBoardAccess` (code-reviewer MAJOR finding): true when the caller's
// access is board-derived — owner, or a `board_members` row — false when
// it's ONLY a `task_shares` row on this exact task. This is what
// tasks.service.js's updateTask uses to block the reorder path for a
// task-share-only caller: reindexColumn unconditionally rewrites
// position/updated_at on every OTHER task in the destination column, which
// a task_shares-only grant (by definition, US14) never gives access to
// read. `role` alone can't distinguish this case — a task-share
// `collaborator` and a board-member `collaborator` have the identical rank,
// but only one of them is safe to let touch sibling rows.
// US-022 AC2/AC4/AC7: same public-fallback as getBoardRole above, checked
// only after both real sources of task access (board_members via the
// parent board, task_shares on this exact task) come up empty — a public
// visitor's `hasBoardAccess` is `false` (see tasks.service.js's updateTask
// reorder-branch comment for why that specifically matters: a public
// visitor must never be able to trigger a write that touches sibling tasks,
// same as a task-share-only recipient).
async function getTaskRole(taskId, userId, { trx } = {}) {
  if (!isUuid(taskId)) return { task: null, role: null, hasBoardAccess: false };
  const task = await (trx || db)('tasks')
    .join('boards', 'boards.id', 'tasks.board_id')
    .where('tasks.id', taskId)
    .select('tasks.*', 'boards.owner_id as board_owner_id', 'boards.visibility as board_visibility')
    .first();
  if (!task) return { task: null, role: null, hasBoardAccess: false };
  if (task.board_owner_id === userId) return { task, role: 'owner', hasBoardAccess: true };
  const [member, share] = await Promise.all([
    (trx || db)('board_members').where({ board_id: task.board_id, user_id: userId }).first(),
    (trx || db)('task_shares').where({ task_id: taskId, user_id: userId }).first(),
  ]);
  const role = higherRole(member ? member.role : null, share ? share.role : null);
  if (role) return { task, role, hasBoardAccess: !!member };
  if (task.board_visibility === 'public') return { task, role: 'public', hasBoardAccess: false };
  return { task, role: null, hasBoardAccess: false };
}

// Throws NotFoundError if the task doesn't exist, ForbiddenError
// `errors.task.forbidden` if the caller has no access at all, or
// `errors.task.readOnlyAccess` if they have a role but it's below
// `minRole`. Returns `{ task, role, hasBoardAccess }` on success — see
// getTaskRole above for what `hasBoardAccess` means and why it exists.
async function requireTaskRole(taskId, userId, minRole, opts = {}) {
  const { task, role, hasBoardAccess } = await getTaskRole(taskId, userId, opts);
  if (!task) throw new NotFoundError('errors.task.notFound');
  if (!role) throw new ForbiddenError('errors.task.forbidden');
  if (rankOf(role) < rankOf(minRole)) throw new ForbiddenError('errors.task.readOnlyAccess');
  return { task, role, hasBoardAccess };
}

module.exports = {
  ROLE_RANK,
  rankOf,
  higherRole,
  getOwnedBoard,
  requireTaskOwner,
  getBoardRole,
  requireBoardRole,
  getTaskRole,
  requireTaskRole,
};
