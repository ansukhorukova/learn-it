const express = require('express');

const requireAuth = require('../middleware/auth.middleware');
const { sendServiceError } = require('../lib/apiError');
const { listActiveLanguages } = require('../services/languages.service');

const router = express.Router();

// GET /api/v1/languages — the active dictionary (US-023 AC1), what a
// board's language picker offers. Same contract/auth posture as GET
// /competencies: authenticated like every other endpoint in this API
// (CLAUDE.md: BE is the single point of authorization) even though the
// content itself isn't per-user.
router.get('/', requireAuth, async (req, res) => {
  try {
    const languages = await listActiveLanguages();
    return res.json({ languages });
  } catch (err) {
    return sendServiceError(res, err);
  }
});

module.exports = router;
