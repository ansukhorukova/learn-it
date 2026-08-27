const db = require('../db/knex');
const { isUuid } = require('../lib/uuid');
const { ValidationError, NotFoundError, ForbiddenError } = require('../lib/serviceErrors');
const { requireTaskRole } = require('../lib/authz');
const { lockRow } = require('../lib/db');
const { isForeignKeyViolation } = require('../lib/dbErrors');

const BODY_MAX_LENGTH = 2000;

/**
 * task_comments CRUD (US-019) — view + add only this pass, no edit/delete
 * (explicit scope decision, see the migration's header comment). Unlike
 * `time_entries` (always privacy-scoped to the caller), comments are shared
 * across everyone with access to the task — same footing as `tasks.status`,
 * not `time_entries`'s per-user privacy.
 */

function validateBody(body) {
  const trimmed = typeof body === 'string' ? body.trim() : '';
  if (!trimmed) throw new ValidationError('errors.comment.bodyRequired');
  if (trimmed.length > BODY_MAX_LENGTH) throw new ValidationError('errors.comment.bodyTooLong');
  return trimmed;
}

// AUTH-004 AC5/AC6: same public_name-falls-back-to-display_name resolution
// as boardMembers.service.js's toMember / taskShares.service.js's toShare —
// `authorName` here plays the same role their `displayName` does.
function toComment(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    authorId: row.author_id,
    authorName: row.public_name || row.display_name,
    body: row.body,
    parentCommentId: row.parent_comment_id,
    replyToCommentId: row.reply_to_comment_id,
    createdAt: row.created_at,
  };
}

/**
 * US-034 AC1-3: the flatten-on-level-3 algorithm. `replyToCommentId` is
 * optional (AC4: no reply selected -> both fields stay `null`, unchanged
 * from US-019). When given, it must name a comment on THIS task (AC7) —
 * checked via the `task_id` filter in the same query as the existence
 * check, so "belongs to another task" and "doesn't exist" collapse to the
 * same 400 `errors.comment.replyTargetInvalid`, mirroring the single-key
 * collapse lib/chatMessages.js's resolveReplyTarget uses for US-035.
 *
 * Levels, by definition (AC1-3):
 *   - level 1: `parent_comment_id IS NULL`.
 *   - level 2: `parent_comment_id` points to a level-1 comment.
 *   - level 3: `parent_comment_id` points to a level-2 comment (i.e. a
 *     comment whose OWN `parent_comment_id` is NOT NULL).
 *
 * Replying to level 1 or level 2 is a normal one-level deepening:
 * `parent_comment_id = replyToCommentId`, `reply_to_comment_id =
 * replyToCommentId` (AC1/AC2). Replying to a level-3 comment does NOT
 * create level 4: the new comment flattens to a SIBLING under the target's
 * own `parent_comment_id` (the same level-2 parent), while
 * `reply_to_comment_id` still names the exact level-3 comment that was
 * replied to, preserving the quote attribution despite the structural
 * flatten (AC3).
 */
async function resolveReplyTarget(taskId, replyToCommentId) {
  if (replyToCommentId === undefined || replyToCommentId === null) {
    return { parentCommentId: null, replyToCommentId: null };
  }
  if (!isUuid(replyToCommentId)) throw new ValidationError('errors.comment.replyTargetInvalid');

  const target = await db('task_comments').where({ id: replyToCommentId, task_id: taskId }).first();
  if (!target) throw new ValidationError('errors.comment.replyTargetInvalid');

  if (!target.parent_comment_id) {
    // Target is level 1 -> new comment is level 2.
    return { parentCommentId: target.id, replyToCommentId: target.id };
  }

  const targetParent = await db('task_comments').where({ id: target.parent_comment_id }).first();
  if (!targetParent || !targetParent.parent_comment_id) {
    // Target's own parent is level 1 (or, defensively, missing) -> target
    // is level 2 -> new comment is level 3.
    return { parentCommentId: target.id, replyToCommentId: target.id };
  }

  // Target's own parent already has a parent -> target is level 3 -> flatten:
  // new comment becomes a sibling under the SAME level-2 parent.
  return { parentCommentId: target.parent_comment_id, replyToCommentId: target.id };
}

/**
 * GET .../comments — any effective role (viewer+) can read (US-019 AC1/AC7):
 * reuses `requireTaskRole`'s default `minRole: 'viewer'`, the same gate
 * already used for attachments/time-entries listing on a task — owner,
 * collaborator, and viewer (board- or task-level, whichever access source)
 * all see the identical shared list. No pagination this pass (AC8).
 */
async function listComments(taskId, userId) {
  await requireTaskRole(taskId, userId, 'viewer');
  const rows = await db('task_comments')
    .join('users', 'users.id', 'task_comments.author_id')
    .where({ task_id: taskId })
    .select('task_comments.*', 'users.display_name as display_name', 'users.public_name as public_name')
    .orderBy('task_comments.created_at', 'asc');
  return rows.map(toComment);
}

/**
 * POST .../comments — owner / collaborator / `public` may post (US-019
 * AC2/AC3/AC6, gate widened by US-039 AC15/AC16). A public-board visitor
 * with no real membership (effective role `public`) can now add comments —
 * they walk the board as a learning template and need to ask questions. A
 * REAL `board_members`/`task_shares` viewer is still read-only here
 * (`errors.task.readOnlyAccess`), and no access at all is still
 * `errors.task.forbidden`. Implemented as `requireTaskRole(..., 'viewer')`
 * (admits `public`, which ranks alongside `viewer`) plus an explicit reject
 * of a real `viewer` — `public` and `viewer` share a rank so the gate alone
 * can't tell them apart. Authorization is checked before validating the body
 * (matches `createAttachment`'s ordering in attachments.service.js).
 *
 * `lockRow` on the parent task, inside a transaction, mirrors
 * `attachments.service.js`'s `insertAttachmentLocked` — closes the race
 * where a concurrent `deleteTask` commits between the `requireTaskRole`
 * check above and this INSERT; the `isForeignKeyViolation` catch below is
 * the same belt-and-suspenders backstop that file uses in case that race is
 * ever reached through a path that skips the lock.
 */
async function createComment(taskId, userId, { body, replyToCommentId } = {}) {
  const { role } = await requireTaskRole(taskId, userId, 'viewer');
  if (role === 'viewer') throw new ForbiddenError('errors.task.readOnlyAccess');
  const validBody = validateBody(body);
  const { parentCommentId, replyToCommentId: resolvedReplyToId } = await resolveReplyTarget(
    taskId,
    replyToCommentId,
  );

  let row;
  try {
    row = await db.transaction(async (trx) => {
      await lockRow(trx, 'tasks', taskId, () => new NotFoundError('errors.task.notFound'));
      const [inserted] = await trx('task_comments')
        .insert({
          task_id: taskId,
          author_id: userId,
          body: validBody,
          parent_comment_id: parentCommentId,
          reply_to_comment_id: resolvedReplyToId,
        })
        .returning('*');
      return inserted;
    });
  } catch (err) {
    if (isForeignKeyViolation(err, 'task_comments_task_id_foreign')) {
      throw new NotFoundError('errors.task.notFound');
    }
    throw err;
  }

  const author = await db('users').where({ id: userId }).first();
  return toComment({ ...row, display_name: author.display_name, public_name: author.public_name });
}

module.exports = { listComments, createComment };
