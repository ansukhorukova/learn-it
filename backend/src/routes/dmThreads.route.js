const express = require('express');

const requireAuth = require('../middleware/auth.middleware');
const { sendServiceError } = require('../lib/apiError');
const dmThreadsService = require('../services/dmThreads.service');

const router = express.Router();

// POST /api/v1/dm-threads — get-or-create a thread for
// {targetUserId, competencyId} (US-027 AC1-3). 200 if it already existed,
// 201 if this call just created it.
router.post('/', requireAuth, async (req, res) => {
  try {
    const { thread, created } = await dmThreadsService.getOrCreateThread(req.firebaseUser.uid, req.body || {});
    return res.status(created ? 201 : 200).json(thread);
  } catch (err) {
    return sendServiceError(res, err);
  }
});

// GET /api/v1/dm-threads — the caller's own threads, sorted by last
// activity (US-027 AC11).
router.get('/', requireAuth, async (req, res) => {
  try {
    const threads = await dmThreadsService.listThreads(req.firebaseUser.uid);
    return res.json({ threads });
  } catch (err) {
    return sendServiceError(res, err);
  }
});

// GET /api/v1/dm-threads/:id/messages — participants only (US-027 AC4/AC5).
router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const messages = await dmThreadsService.listMessages(req.params.id, req.firebaseUser.uid);
    return res.json({ messages });
  } catch (err) {
    return sendServiceError(res, err);
  }
});

// POST /api/v1/dm-threads/:id/messages — send a message (US-027 AC5-8).
// Triggers a `dm.message.created` WS push to the other participant's live
// connection(s), if any — see dmThreads.service.js's createMessage.
router.post('/:id/messages', requireAuth, async (req, res) => {
  try {
    const message = await dmThreadsService.createMessage(req.params.id, req.firebaseUser.uid, req.body || {});
    return res.status(201).json(message);
  } catch (err) {
    return sendServiceError(res, err);
  }
});

module.exports = router;
