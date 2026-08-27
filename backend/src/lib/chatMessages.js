const db = require('../db/knex');
const { isUuid } = require('./uuid');
const { ValidationError } = require('./serviceErrors');

// US-035 AC5/AC6: "перші ~80 символів" — a plain slice, no ellipsis or
// word-boundary trimming specified by the AC, so this stays as simple as
// the spec asks for.
const EXCERPT_LENGTH = 80;

// AUTH-004 AC5/AC6 public_name-falls-back-to-display_name pattern, same as
// dmThreads.service.js/competencyChat.service.js/taskComments.service.js —
// duplicated here (rather than imported from one of those) so this stays a
// small, dependency-free lib module usable by all three, and by
// chatForwards.service.js.
function resolveAuthorName(row) {
  return row.public_name || row.display_name;
}

function excerptOf(body) {
  return typeof body === 'string' ? body.slice(0, EXCERPT_LENGTH) : '';
}

/**
 * US-035 AC1-4: resolves an optional `replyToMessageId` into the id to
 * store as `reply_to_message_id`, or `null` when none was given (AC1/AC2's
 * "опційне поле"). Both failure cases collapse to the SAME 400
 * `errors.chat.replyTargetInvalid` (AC3: another thread/room; AC4:
 * nonexistent) — a plain Postgres FK can't express "must belong to the same
 * thread_id/competency_id as the referencing row", so that scoping is
 * enforced here via the `WHERE id = ? AND <scopeColumn> = ?` filter: a
 * message from a different thread/room simply doesn't match and looks
 * identical to "doesn't exist" from the caller's point of view — which is
 * exactly the single error key AC3/AC4 ask for.
 *
 * `table`/`scopeColumn` let this one function serve both
 * dmThreads.service.js (`'dm_messages'`, `'thread_id'`) and
 * competencyChat.service.js (`'competency_chat_messages'`, `'competency_id'`)
 * without duplicating the lookup.
 */
async function resolveReplyTarget(table, scopeColumn, scopeValue, replyToMessageId) {
  if (replyToMessageId === undefined || replyToMessageId === null) return null;
  if (!isUuid(replyToMessageId)) throw new ValidationError('errors.chat.replyTargetInvalid');
  const row = await db(table)
    .where({ id: replyToMessageId, [scopeColumn]: scopeValue })
    .first();
  if (!row) throw new ValidationError('errors.chat.replyTargetInvalid');
  return row.id;
}

/**
 * US-035 AC5/AC6: batch-hydrates `{id, authorName, excerpt}` reply previews
 * for a set of `reply_to_message_id` values in ONE query rather than N+1 —
 * mirrors the "most recent message per thread" batching pattern already
 * used by dmThreads.service.js's listThreads / competencyChat.service.js's
 * listMyChats. Returns a `Map<id, preview>`; ids that are null/undefined
 * (no reply) or duplicated collapse naturally via the `Set`.
 */
async function fetchReplyPreviews(table, ids) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();
  const rows = await db(table)
    .join('users', 'users.id', `${table}.sender_id`)
    .whereIn(`${table}.id`, uniqueIds)
    .select(
      `${table}.id as id`,
      `${table}.body as body`,
      'users.display_name as display_name',
      'users.public_name as public_name',
    );
  const map = new Map();
  for (const row of rows) {
    map.set(row.id, { id: row.id, authorName: resolveAuthorName(row), excerpt: excerptOf(row.body) });
  }
  return map;
}

module.exports = { resolveReplyTarget, fetchReplyPreviews, excerptOf, resolveAuthorName };
