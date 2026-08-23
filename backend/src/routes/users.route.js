const express = require('express');

const requireAuth = require('../middleware/auth.middleware');
const { getOrCreateUser } = require('../services/users.service');
const { sendError } = require('../lib/apiError');

const router = express.Router();

// GET /api/v1/users/me — verifies the Bearer token, upserts the `users` row
// for this Firebase UID if it doesn't exist yet (idempotent), returns the
// profile. FE calls this right after any successful sign-in (email/password
// or Google) to make sure the row exists before landing on the app.
//
// Optional `?locale=xx` query param: browser-detected locale, used only to
// seed a brand-new row — ignored for an existing user.
router.get('/me', requireAuth, async (req, res) => {
  try {
    const profile = await getOrCreateUser(req.firebaseUser, req.query.locale);
    return res.json(profile);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('GET /api/v1/users/me failed:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'errors.generic', 'Unexpected server error');
  }
});

module.exports = router;
