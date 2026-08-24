const express = require('express');

const requireAuth = require('../middleware/auth.middleware');
const { sendServiceError } = require('../lib/apiError');
const { listActiveCompetencies } = require('../services/competencies.service');

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

module.exports = router;
