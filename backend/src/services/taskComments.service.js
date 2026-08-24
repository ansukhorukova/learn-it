const db = require('../db/knex');
const { ValidationError, NotFoundError } = require('../lib/serviceErrors');
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
    createdAt: row.created_at,
  };
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
 * POST .../comments — owner/collaborator only (US-019 AC2/AC3/AC6). Reuses
 * `requireTaskRole(taskId, userId, 'collaborator')` — the exact same gate
 * `tasks.service.js`'s `updateTask`/`attachments.service.js`'s
 * `createAttachment` already use for a task write: a viewer gets 403
 * `errors.task.readOnlyAccess`, no access at all gets 403
 * `errors.task.forbidden`. Authorization is checked before validating the
 * body (matches `createAttachment`'s ordering in attachments.service.js).
 *
 * `lockRow` on the parent task, inside a transaction, mirrors
 * `attachments.service.js`'s `insertAttachmentLocked` — closes the race
 * where a concurrent `deleteTask` commits between the `requireTaskRole`
 * check above and this INSERT; the `isForeignKeyViolation` catch below is
 * the same belt-and-suspenders backstop that file uses in case that race is
 * ever reached through a path that skips the lock.
 */
async function createComment(taskId, userId, { body } = {}) {
  await requireTaskRole(taskId, userId, 'collaborator');
  const validBody = validateBody(body);

  let row;
  try {
    row = await db.transaction(async (trx) => {
      await lockRow(trx, 'tasks', taskId, () => new NotFoundError('errors.task.notFound'));
      const [inserted] = await trx('task_comments')
        .insert({ task_id: taskId, author_id: userId, body: validBody })
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
