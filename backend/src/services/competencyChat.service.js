const db = require('../db/knex');
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

module.exports = { listMessages, createMessage };
