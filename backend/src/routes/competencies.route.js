const express = require('express');

const requireAuth = require('../middleware/auth.middleware');
const { sendServiceError } = require('../lib/apiError');
const { listActiveCompetencies } = require('../services/competencies.service');
const competencyChatService = require('../services/competencyChat.service');

const router = express.Router();

// GET /api/v1/competencies — the active dictionary (AUTH-005 AC1), what the
// profile screen's picker offers. Authenticated like every other endpoint in
// this API (CLAUDE.md: BE is the single point of authorization) even though
// the content itself isn't per-user — there's no unauthenticated read path
// anywhere else in this API to be consistent with, and this isn't the
// anti-enumeration-driven exception that /auth/provider-hint is.
router.get('/', requireAuth, async (req, res) => {
  try {
    const competencies = await listActiveCompetencies();
    return res.json({ competencies });
  } catch (err) {
    return sendServiceError(res, err);
  }
});

// competency_chat_messages (US-028) — one shared room per competency,
// identified directly by :id, any authenticated user can read/write
// regardless of whether they have this competency in their own profile
// (decision #4 in USER_STORIES.md's US-025…029 "походження" section).

// GET /api/v1/competencies/:id/chat/messages — the room's full history,
// oldest first, no pagination in MVP (US-028 AC2).
router.get('/:id/chat/messages', requireAuth, async (req, res) => {
  try {
    const messages = await competencyChatService.listMessages(req.params.id);
    return res.json({ messages });
  } catch (err) {
    return sendServiceError(res, err);
  }
});

// POST /api/v1/competencies/:id/chat/messages — send a message (US-028
// AC3/AC4). Triggers a `competencyChat.message.created` WS push to every
// live connection subscribed to this room — see
// competencyChat.service.js's createMessage.
router.post('/:id/chat/messages', requireAuth, async (req, res) => {
  try {
    const message = await competencyChatService.createMessage(req.params.id, req.firebaseUser.uid, req.body || {});
    return res.status(201).json(message);
  } catch (err) {
    return sendServiceError(res, err);
  }
});

module.exports = router;
