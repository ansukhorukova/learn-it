const db = require('../db/knex');
const { isUuid } = require('../lib/uuid');
const { ValidationError } = require('../lib/serviceErrors');
const { requireActiveCompetencyRoom } = require('../lib/authz');
const { broadcastCompetencyChatMessage } = require('../ws/server');

// Same limit as task_comments/dm_messages (US-028 AC4's "той самий ліміт,
// що DM/task_comments").
const BODY_MAX_LENGTH = 2000;

/**
 * `competency_chat_messages` (US-028) — one shared room per `competencies`
 * row, identified directly by `competency_id` (no separate "rooms" table,
 * see that migration's header comment). Access is "any authenticated
 * user" on both read and write — no membership/role concept at all, unlike
 * every other resource in this codebase.
 */

function validateMessageBody(body) {
  const trimmed = typeof body === 'string' ? body.trim() : '';
  if (!trimmed) throw new ValidationError('errors.competencyChat.messageBodyRequired');
  if (trimmed.length > BODY_MAX_LENGTH) throw new ValidationError('errors.competencyChat.messageBodyTooLong');
  return trimmed;
}

// AUTH-004 AC5/AC6 public_name-falls-back-to-display_name pattern, same as
// dmThreads.service.js/taskComments.service.js.
function toMessage(row) {
  return {
    id: row.id,
    competencyId: row.competency_id,
    senderId: row.sender_id,
    senderName: row.sender_public_name || row.sender_display_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

/**
 * GET .../chat/messages — any authenticated user (US-028 AC2). 404
 * `errors.competencyChat.notFound` for a nonexistent OR retired
 * (`is_active = false`) competency — AC5: retiring a competency closes the
 * product path to its room without deleting the room's history in the DB.
 * Chronological, oldest first, no pagination (AC2).
 */
async function listMessages(competencyId) {
  await requireActiveCompetencyRoom(competencyId);
  const rows = await db('competency_chat_messages')
    .join('users', 'users.id', 'competency_chat_messages.sender_id')
    .where({ competency_id: competencyId })
    .select(
      'competency_chat_messages.*',
      'users.display_name as sender_display_name',
      'users.public_name as sender_public_name',
    )
    .orderBy('competency_chat_messages.created_at', 'asc');
  return rows.map(toMessage);
}

/**
 * POST .../chat/messages — any authenticated user (US-028 AC3). Same
 * 404-for-retired-or-missing-room gate as listMessages above, checked
 * before body validation (same ordering convention as
 * taskComments.service.js's createComment / dmThreads.service.js's
 * createMessage).
 */
async function createMessage(competencyId, senderId, { body } = {}) {
  await requireActiveCompetencyRoom(competencyId);
  const validBody = validateMessageBody(body);

  const [row] = await db('competency_chat_messages')
    .insert({ competency_id: competencyId, sender_id: senderId, body: validBody })
    .returning('*');
  const sender = await db('users').where({ id: senderId }).first();
  const message = toMessage({
    ...row,
    sender_display_name: sender.display_name,
    sender_public_name: sender.public_name,
  });

  broadcastCompetencyChatMessage(competencyId, message);

  return message;
}

/**
 * POST .../chat/members (US-031 AC1) — join a competency's group chat.
 * Same 404-for-retired-or-missing-room gate as listMessages/createMessage
 * above: you cannot join a chat you couldn't open in the first place.
 *
 * `onConflict(...).ignore()` against the unique (user_id, competency_id)
 * constraint is the concurrency-safe backstop for the idempotent-join
 * contract (AC1's "повторний виклик ... ідемпотентний 200 без дублікату")
 * — same shape as dmThreads.service.js's getOrCreateThread /
 * competencies.service.js's addUserCompetency. Returns `{ created }` so the
 * route can map it to 201 (new) vs 200 (already a member).
 */
async function joinChat(competencyId, userId) {
  await requireActiveCompetencyRoom(competencyId);
  const inserted = await db('competency_chat_members')
    .insert({ user_id: userId, competency_id: competencyId })
    .onConflict(['user_id', 'competency_id'])
    .ignore()
    .returning('*');
  return { created: inserted.length > 0 };
}

/**
 * DELETE .../chat/members/me (US-031 AC2/AC3) — leave a competency's group
 * chat. Deliberately does NOT gate on `requireActiveCompetencyRoom` the way
 * join/read/write do: leaving must stay possible even after the competency
 * has since been deactivated (AC3's "лишається дозволеним" — the only way
 * to clear an archived row out of `GET /competency-chats/mine`, US-033
 * AC5), and it must stay a no-op success when there was never a membership
 * row at all (AC2's idempotent 204). A malformed/non-uuid id can never
 * match a real row, so it's treated the same as "not a member" rather than
 * erroring — this endpoint has no error path at all by design.
 */
async function leaveChat(competencyId, userId) {
  if (!isUuid(competencyId)) return;
  await db('competency_chat_members').where({ user_id: userId, competency_id: competencyId }).delete();
}

/**
 * GET /competency-chats/mine (US-031 AC5) — the caller's own joined
 * competency chats, sorted by last-activity (most recent message, falling
 * back to `joined_at` for a chat with no messages yet) descending, same
 * pattern as dmThreads.service.js's listThreads. `competencyActive` lets
 * the FE render an archived/disabled row (US-033 AC5) without a second
 * round trip to `GET /competencies` (which wouldn't even list a retired
 * one).
 */
async function listMyChats(userId) {
  const memberships = await db('competency_chat_members')
    .join('competencies', 'competencies.id', 'competency_chat_members.competency_id')
    .where('competency_chat_members.user_id', userId)
    .select(
      'competency_chat_members.id',
      'competency_chat_members.competency_id',
      'competency_chat_members.joined_at',
      'competencies.slug as competency_slug',
      'competencies.is_active as competency_active',
    );
  if (memberships.length === 0) return [];

  const competencyIds = memberships.map((m) => m.competency_id);
  const lastMessages = await db('competency_chat_messages')
    .whereIn('competency_id', competencyIds)
    .select('competency_id', 'body', 'created_at')
    .orderBy('created_at', 'desc');

  const lastByCompetency = new Map();
  for (const m of lastMessages) {
    if (!lastByCompetency.has(m.competency_id)) lastByCompetency.set(m.competency_id, m); // first hit wins (desc order)
  }

  return memberships
    .map((m) => {
      const last = lastByCompetency.get(m.competency_id);
      const lastActivityAt = last ? last.created_at : m.joined_at;
      return {
        id: m.id,
        competencyId: m.competency_id,
        competencySlug: m.competency_slug,
        competencyActive: m.competency_active,
        lastMessage: last ? { body: last.body, createdAt: last.created_at } : null,
        joinedAt: m.joined_at,
        _lastActivityAt: lastActivityAt,
      };
    })
    .sort((a, b) => new Date(b._lastActivityAt) - new Date(a._lastActivityAt))
    .map(({ _lastActivityAt, ...rest }) => rest);
}

module.exports = { listMessages, createMessage, joinChat, leaveChat, listMyChats };
