const express = require('express');

const requireAuth = require('../middleware/auth.middleware');
const { sendServiceError } = require('../lib/apiError');
const chatForwardsService = require('../services/chatForwards.service');

const router = express.Router();

// POST /api/v1/chat/forwards (US-036) — forward an existing message into a
// new chat. Body: {sourceMessageId, destinationType: "dmThread" |
// "competencyChat", destinationId}. See chatForwards.service.js's
// createForward for the full source/destination authorization algorithm
// (AC1-7) — sources from `dm_messages` are unconditionally 403
// (errors.chat.forwardFromDmForbidden), including transitively (AC7).
router.post('/', requireAuth, async (req, res) => {
  try {
    const message = await chatForwardsService.createForward(req.firebaseUser.uid, req.body || {});
    return res.status(201).json(message);
  } catch (err) {
    return sendServiceError(res, err);
  }
});

module.exports = router;
