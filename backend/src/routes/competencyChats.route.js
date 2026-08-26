const express = require('express');

const requireAuth = require('../middleware/auth.middleware');
const { sendServiceError } = require('../lib/apiError');
const competencyChatService = require('../services/competencyChat.service');

const router = express.Router();

// GET /api/v1/competency-chats/mine (US-031 AC5) — the caller's own joined
// competency chats, sorted by last activity, most recent first. A
// top-level resource distinct from /competencies/:id/chat — this is a
// per-user VIEW over the membership table, not nested under any single
// competency, same reasoning as /dm-threads being top-level rather than
// nested under /users.
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const chats = await competencyChatService.listMyChats(req.firebaseUser.uid);
    return res.json({ chats });
  } catch (err) {
    return sendServiceError(res, err);
  }
});

module.exports = router;
