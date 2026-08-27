const db = require('../db/knex');
const { isUuid } = require('../lib/uuid');
const { ValidationError, NotFoundError, ForbiddenError } = require('../lib/serviceErrors');
const dmThreadsService = require('./dmThreads.service');
const competencyChatService = require('./competencyChat.service');

/**
 * `POST /api/v1/chat/forwards` (US-036) — forwards an existing message
 * into a NEW chat (DM thread or competency room), copying its body under
 * the forwarder's own `sender_id`.
 *
 * US-036 AC2/AC7 — the one rule this whole module exists to enforce: a
 * forward is allowed ONLY when its `sourceMessageId` currently lives in
 * `competency_chat_messages`. This is checked by TABLE LOOKUP, not by any
 * historical/inherited field:
 *   - found in `competency_chat_messages` -> allowed (AC1).
 *   - not there, but found in `dm_messages` -> 403
 *     `errors.chat.forwardFromDmForbidden`, unconditionally — even for a
 *     participant of that exact DM thread (AC2 — "без винятків").
 *   - found in neither -> 404 `errors.chat.messageNotFound` (AC3).
 * Because a message forwarded FROM a competency chat INTO a DM thread
 * becomes a real `dm_messages` row (US-036 AC1), a later attempt to forward
 * THAT row hits the second branch above and is rejected the same way —
 * this is what makes the DM-forbidden rule transitive (AC7) without any
 * special-case code: the check only ever asks "which table is this id in
 * right now", never "where did this message originally come from".
 */
async function findSourceMessage(sourceMessageId) {
  if (!isUuid(sourceMessageId)) throw new NotFoundError('errors.chat.messageNotFound');

  const competencyMessage = await db('competency_chat_messages').where({ id: sourceMessageId }).first();
  if (competencyMessage) return competencyMessage;

  const dmMessage = await db('dm_messages').where({ id: sourceMessageId }).first();
  if (dmMessage) throw new ForbiddenError('errors.chat.forwardFromDmForbidden');

  throw new NotFoundError('errors.chat.messageNotFound');
}

/**
 * `destinationType`/`destinationId` authorization (US-036 AC4/AC5) reuses
 * dmThreads.service.js's `createForwardedMessage` / competencyChat
 * .service.js's `createForwardedMessage` — each of which reuses, in turn,
 * the EXACT SAME `requireDmThreadAccess`/`requireActiveCompetencyRoom` gate
 * a normal `POST .../messages` uses. This function does no authorization
 * of its own beyond picking which of the two to call.
 */
async function createForward(callerId, { sourceMessageId, destinationType, destinationId } = {}) {
  const source = await findSourceMessage(sourceMessageId);
  // Only reachable when `source` is a `competency_chat_messages` row (see
  // findSourceMessage above) — its own `competency_id` is what AC1/AC6
  // call "competency_id оригіналу", carried forward as the new message's
  // `forwarded_from_competency_id` regardless of destination.
  const forwardedFromCompetencyId = source.competency_id;
  const body = source.body;

  if (destinationType === 'dmThread') {
    return dmThreadsService.createForwardedMessage(destinationId, callerId, body, forwardedFromCompetencyId);
  }
  if (destinationType === 'competencyChat') {
    return competencyChatService.createForwardedMessage(destinationId, callerId, body, forwardedFromCompetencyId);
  }
  // Neither of the two contractual values (US-036 API surface) — a
  // malformed/missing `destinationType`, not covered by any AC since a
  // conforming client never sends this, but must not fall through silently.
  throw new ValidationError('errors.chat.invalidDestinationType');
}

module.exports = { createForward };
