const express = require('express');

const requireAuth = require('../middleware/auth.middleware');
const { getOrCreateUser, updateProfile } = require('../services/users.service');
const competenciesService = require('../services/competencies.service');
const { sendError, sendServiceError } = require('../lib/apiError');

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

// PATCH /api/v1/users/me — partial profile update (AUTH-004). This pass only
// recognizes `publicName`; see users.service.js's updateProfile for the
// "omitted field = untouched" contract (AC8).
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const profile = await updateProfile(req.firebaseUser.uid, req.body || {});
    return res.json(profile);
  } catch (err) {
    return sendServiceError(res, err);
  }
});

// user_competencies CRUD (AUTH-005/AUTH-006/AUTH-007) — always scoped to the
// caller's own rows (req.firebaseUser.uid), never a route param naming a
// user. See competencies.service.js for the anti-enumeration contract on
// PATCH/DELETE (a foreign id 404s, never 403).

// GET /api/v1/users/me/competencies — the caller's own competencies, for
// rendering the profile screen's list.
router.get('/me/competencies', requireAuth, async (req, res) => {
  try {
    const competencies = await competenciesService.listUserCompetencies(req.firebaseUser.uid);
    return res.json({ competencies });
  } catch (err) {
    return sendServiceError(res, err);
  }
});

// POST /api/v1/users/me/competencies — add a dictionary pick ({competencyId})
// or a free-text entry ({customLabel}), exactly one of the two (AUTH-006 AC5).
router.post('/me/competencies', requireAuth, async (req, res) => {
  try {
    const created = await competenciesService.addUserCompetency(req.firebaseUser.uid, req.body || {});
    return res.status(201).json(created);
  } catch (err) {
    return sendServiceError(res, err);
  }
});

// PATCH /api/v1/users/me/competencies/:id — {willingToTeach} (AUTH-007).
router.patch('/me/competencies/:id', requireAuth, async (req, res) => {
  try {
    const updated = await competenciesService.updateWillingToTeach(req.firebaseUser.uid, req.params.id, req.body || {});
    return res.json(updated);
  } catch (err) {
    return sendServiceError(res, err);
  }
});

// DELETE /api/v1/users/me/competencies/:id — remove, dictionary or custom
// alike (AUTH-005 AC4 / AUTH-006 AC6).
router.delete('/me/competencies/:id', requireAuth, async (req, res) => {
  try {
    await competenciesService.removeUserCompetency(req.firebaseUser.uid, req.params.id);
    return res.status(204).end();
  } catch (err) {
    return sendServiceError(res, err);
  }
});

module.exports = router;
