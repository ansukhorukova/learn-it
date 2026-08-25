const db = require('../db/knex');
const { isUuid } = require('../lib/uuid');
const { ValidationError } = require('../lib/serviceErrors');
const { requireDmThreadAccess } = require('../lib/authz');
const { broadcastDmMessage } = require('../ws/server');

// Same limit as task_comments (US-019) — explicit reuse per US-027 AC7's
// "той самий ліміт, що task_comments US-019".
const BODY_MAX_LENGTH = 2000;

/**
 * `dm_threads`/`dm_messages` (US-027) — one independent thread per
 * (user pair, competency), get-or-create, absolute two-participant privacy.
 * See dm_threads migration's header comment for the normalized-pair
 * uniqueness invariant this module is responsible for upholding on every
 * INSERT.
 */

// Firebase UIDs are opaque strings (users.id is `text`, not `uuid` — see
// the users table migration), so "smaller"/"larger" is plain string
// comparison, not numeric. Order doesn't need to mean anything beyond
// "consistent" — it only exists so the same pair always normalizes to the
// same two columns regardless of who's the caller and who's the target.
function normalizePair(userId1, userId2) {
  return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
}

function validateMessageBody(body) {
  const trimmed = typeof body === 'string' ? body.trim() : '';
  if (!trimmed) throw new ValidationError('errors.dmThread.messageBodyRequired');
  if (trimmed.length > BODY_MAX_LENGTH) throw new ValidationError('errors.dmThread.messageBodyTooLong');
  return trimmed;
}

// AUTH-004 AC5/AC6 public_name-falls-back-to-display_name pattern, same as
// taskComments.service.js's toComment/boardMembers.service.js's toMember.
function resolveDisplayName(row) {
  return row.public_name || row.display_name;
}

function toMessage(row) {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    senderName: resolveDisplayName({ public_name: row.sender_public_name, display_name: row.sender_display_name }),
    body: row.body,
    createdAt: row.created_at,
  };
}

/**
 * Hydrates a bare `dm_threads` row into the shape both `getOrCreateThread`
 * and `listThreads` return: the OTHER participant's resolved name (never
 * the caller's own — US-027 AC11 "показує співрозмовника"), the
 * competency's locale slug, and the most recent message (if any, for the
 * list preview / AC12's "порожнє прев'ю" when none exists yet).
 */
async function hydrateThread(row, callerId) {
  const otherId = row.user_a_id === callerId ? row.user_b_id : row.user_a_id;
  const [otherUser, competency, lastMessage] = await Promise.all([
    db('users').where({ id: otherId }).first(),
    db('competencies').where({ id: row.competency_id }).first(),
    db('dm_messages').where({ thread_id: row.id }).orderBy('created_at', 'desc').first(),
  ]);

  return {
    id: row.id,
    competencyId: row.competency_id,
    competencySlug: competency ? competency.slug : null,
    otherUser: otherUser
      ? { id: otherUser.id, name: resolveDisplayName(otherUser) }
      : { id: otherId, name: null },
    lastMessage: lastMessage ? { body: lastMessage.body, createdAt: lastMessage.created_at } : null,
    createdAt: row.created_at,
  };
}

/**
 * POST /api/v1/dm-threads — get-or-create (US-027 AC1-3). Returns
 * `{ thread, created }` — the route maps `created` to 201/200.
 *
 * Order of checks mirrors the AC order: self-message (AC2) before the
 * competency-offer check (AC3), since "you can't message yourself" is true
 * regardless of any competency and is the cheaper check (no DB round trip).
 *
 * `competencyId` for a new thread is ALWAYS validated against the TARGET
 * user's `willing_to_teach=true` rows, never the caller's — this is a
 * deliberate server-side re-check, not just a UI nicety: a direct API call
 * with a `competencyId` the target hasn't offered is rejected exactly the
 * same as it would be if it had never been offered a UI path at all (AC3's
 * explicit "пряма спроба обійти UI-вибір через API").
 */
async function getOrCreateThread(callerId, { targetUserId, competencyId } = {}) {
  if (typeof targetUserId !== 'string' || !targetUserId.trim()) {
    throw new ValidationError('errors.dmThread.invalidPayload');
  }
  if (targetUserId === callerId) {
    throw new ValidationError('errors.dmThread.cannotMessageSelf');
  }
  if (!isUuid(competencyId)) {
    throw new ValidationError('errors.dmThread.competencyNotOffered');
  }

  const offer = await db('user_competencies')
    .where({ user_id: targetUserId, competency_id: competencyId, willing_to_teach: true })
    .first();
  if (!offer) throw new ValidationError('errors.dmThread.competencyNotOffered');

  const [userAId, userBId] = normalizePair(callerId, targetUserId);

  // `onConflict(...).ignore()` is the concurrency-safe backstop behind the
  // unique constraint on the normalized pair — mirrors
  // competencies.service.js's addUserCompetency: two racing "start a
  // conversation with the same person about the same competency" requests
  // both pass every check above, but only one INSERT actually lands; the
  // loser's `returning('*')` comes back empty and falls through to the
  // plain SELECT below instead of throwing a 409 (this endpoint's contract
  // is idempotent get-or-create, AC1 — never a conflict error).
  const inserted = await db('dm_threads')
    .insert({ user_a_id: userAId, user_b_id: userBId, competency_id: competencyId })
    .onConflict(['user_a_id', 'user_b_id', 'competency_id'])
    .ignore()
    .returning('*');

  if (inserted.length > 0) {
    return { thread: await hydrateThread(inserted[0], callerId), created: true };
  }

  const existing = await db('dm_threads')
    .where({ user_a_id: userAId, user_b_id: userBId, competency_id: competencyId })
    .first();
  return { thread: await hydrateThread(existing, callerId), created: false };
}

/**
 * GET /api/v1/dm-threads — the caller's own threads (US-027 AC11), sorted
 * by last-activity (most recent message, falling back to the thread's own
 * `created_at` for a thread with no messages yet — AC12) descending. No
 * pagination in MVP (AC4's "той самий підхід, що task_comments").
 *
 * Implemented as a handful of batched queries plus an in-process sort/join
 * rather than one single query with a LATERAL join — simpler to read, and
 * at MVP scale (no pagination anywhere else in this codebase either) the
 * extra round trips cost nothing that matters.
 */
async function listThreads(callerId) {
  const threads = await db('dm_threads').where('user_a_id', callerId).orWhere('user_b_id', callerId).select('*');
  if (threads.length === 0) return [];

  const threadIds = threads.map((t) => t.id);
  const otherUserIds = [...new Set(threads.map((t) => (t.user_a_id === callerId ? t.user_b_id : t.user_a_id)))];
  const competencyIds = [...new Set(threads.map((t) => t.competency_id))];

  const [lastMessages, users, competencies] = await Promise.all([
    db('dm_messages').whereIn('thread_id', threadIds).select('thread_id', 'body', 'created_at').orderBy('created_at', 'desc'),
    db('users').whereIn('id', otherUserIds).select('id', 'display_name', 'public_name'),
    db('competencies').whereIn('id', competencyIds).select('id', 'slug'),
  ]);

  const lastByThread = new Map();
  for (const m of lastMessages) {
    if (!lastByThread.has(m.thread_id)) lastByThread.set(m.thread_id, m); // first hit wins (desc order)
  }
  const usersById = new Map(users.map((u) => [u.id, u]));
  const competenciesById = new Map(competencies.map((c) => [c.id, c]));

  return threads
    .map((t) => {
      const otherId = t.user_a_id === callerId ? t.user_b_id : t.user_a_id;
      const other = usersById.get(otherId);
      const competency = competenciesById.get(t.competency_id);
      const last = lastByThread.get(t.id);
      const lastActivityAt = last ? last.created_at : t.created_at;
      return {
        id: t.id,
        competencyId: t.competency_id,
        competencySlug: competency ? competency.slug : null,
        otherUser: other ? { id: otherId, name: resolveDisplayName(other) } : { id: otherId, name: null },
        lastMessage: last ? { body: last.body, createdAt: last.created_at } : null,
        createdAt: t.created_at,
        _lastActivityAt: lastActivityAt,
      };
    })
    .sort((a, b) => new Date(b._lastActivityAt) - new Date(a._lastActivityAt))
    .map(({ _lastActivityAt, ...rest }) => rest);
}

/**
 * GET .../messages — participants only (US-027 AC4/AC5). Chronological,
 * oldest first, no pagination (AC4).
 */
async function listMessages(threadId, callerId) {
  await requireDmThreadAccess(threadId, callerId);
  const rows = await db('dm_messages')
    .join('users', 'users.id', 'dm_messages.sender_id')
    .where({ thread_id: threadId })
    .select(
      'dm_messages.*',
      'users.display_name as sender_display_name',
      'users.public_name as sender_public_name',
    )
    .orderBy('dm_messages.created_at', 'asc');
  return rows.map(toMessage);
}

/**
 * POST .../messages — participants only (US-027 AC5-7). Authorization is
 * checked before validating the body, same ordering convention as
 * taskComments.service.js's createComment.
 *
 * The thread is never deleted by any product code path, so unlike
 * taskComments.service.js's createComment (which locks its parent `tasks`
 * row against a concurrent delete) there's no equivalent race to close here
 * — a plain INSERT is enough.
 */
async function createMessage(threadId, callerId, { body } = {}) {
  const thread = await requireDmThreadAccess(threadId, callerId);
  const validBody = validateMessageBody(body);

  const [row] = await db('dm_messages')
    .insert({ thread_id: threadId, sender_id: callerId, body: validBody })
    .returning('*');
  const sender = await db('users').where({ id: callerId }).first();
  const message = toMessage({
    ...row,
    sender_display_name: sender.display_name,
    sender_public_name: sender.public_name,
  });

  // WS push AFTER the row is committed (US-027 AC8/AC9) — REST already
  // holds the source of truth by this point regardless of whether any
  // socket is listening.
  broadcastDmMessage(thread, message);

  return message;
}

module.exports = { normalizePair, getOrCreateThread, listThreads, listMessages, createMessage };
