const express = require('express');
const rateLimit = require('express-rate-limit');

const { getSignInProviderForEmail } = require('../services/users.service');
const { sendError } = require('../lib/apiError');

const router = express.Router();

// --- Security decision for GET /provider-hint (fix pass, code-review blocker) ---
//
// Prior shape: fully open, unauthenticated, unrate-limited — anyone could
// query arbitrary emails at any volume and learn (a) whether the email is
// registered and (b) which provider (password/google.com). That's exactly
// the enumeration vector this project's Firebase Email Enumeration
// Protection exists to prevent, reintroduced here server-side and
// unprotected. The endpoint's own "this is safe because Firebase already
// disclosed existence" reasoning only holds for a caller who actually went
// through the FE's signup flow first — it does nothing to stop a caller who
// hits this endpoint directly, which is the actual threat model for a public
// unauthenticated route.
//
// Decision taken here: keep the endpoint (the "use Google instead" UX is
// real, and CLAUDE.md doesn't mandate the stricter remove-it path), but make
// it expensive/bounded to abuse instead of free:
//
//   1. Two-layer rate limiting — per-IP AND per-email, both 1-hour windows.
//      Per-IP alone isn't sufficient (one attacker on one IP can still
//      enumerate a wordlist of emails within that IP's budget); per-email
//      alone isn't sufficient (many IPs querying the same email is a
//      different attack, e.g. targeted). Both together bound both axes.
//      Numbers (10/hr/IP, 5/hr/email) are deliberately blunt per CLAUDE.md's
//      framing of this as a low-traffic personal app — no CAPTCHA or
//      proof-of-work needed for this threat model.
//   2. A minimum response-time floor on the success path, so the response
//      timing can't be used to distinguish "found a row" from "didn't" even
//      if a future change (e.g. a cache) adds an early return. The current
//      single `await` DB lookup is already timing-uniform regardless of
//      outcome, but this guards the invariant going forward rather than just
//      the current code shape.
//
// Residual risk, accepted explicitly: a patient attacker controlling many
// IPs could still trickle out signal over days/weeks — no rate limit fully
// closes that. That's accepted because (a) the marginal disclosure is only
// "which of 2 providers", on an app with no real user base yet, and (b)
// removing the endpoint entirely trades a bounded, rate-limited residual
// risk for permanently worse UX with nothing in CLAUDE.md requiring the
// stricter choice. Revisit if this app ever gets a real user base.
//
// Reminder: sign-in (see auth.middleware.js and errorMapping.js's
// mapSignInError) must keep "wrong password" and "unknown email"
// indistinguishable — untouched by this endpoint, and this endpoint must
// never be consulted from the sign-in path, only the signup-conflict path.
// -----------------------------------------------------------------------

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MIN_RESPONSE_TIME_MS = 150;

function rateLimitedResponse(req, res) {
  return sendError(res, 429, 'RATE_LIMITED', 'errors.auth.rateLimited', 'Too many requests, try again later');
}

function normalizeEmail(raw) {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

// Bounds "how many emails can one caller probe" — keyed by IP (express-rate-limit's default IPv6-safe keyGenerator).
const ipLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitedResponse,
});

// Bounds "how many times can any caller(s) probe the same email" — keyed by the normalized email itself, independent of IP.
const emailLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => normalizeEmail(req.query.email) || 'unknown-email',
  handler: rateLimitedResponse,
});

// GET /api/v1/auth/provider-hint?email=... — intentionally UNAUTHENTICATED
// and used ONLY on the signup-conflict path (frontend/src/pages/AuthPage.jsx),
// after Firebase's own `createUserWithEmailAndPassword` has already rejected
// the attempt with `auth/email-already-in-use`. See the decision block above
// for why this is rate-limited rather than removed. Never call this from the
// sign-in path.
router.get('/provider-hint', ipLimiter, emailLimiter, async (req, res) => {
  const startedAt = Date.now();
  const email = normalizeEmail(req.query.email);
  if (!email) {
    return sendError(res, 400, 'INVALID_EMAIL', 'errors.auth.invalidEmail', 'email query param is required');
  }

  try {
    const provider = await getSignInProviderForEmail(email);
    // `provider` is one of 'password' | 'google.com' | null (unknown / no
    // row yet) — FE only branches on `=== 'google.com'` and falls back to
    // the generic "already in use" message for anything else, so there's
    // nothing more specific to leak by returning null here.

    // Timing-floor: normalize response latency regardless of whether a row
    // was found, so response time itself isn't a distinguishing signal.
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_RESPONSE_TIME_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
    }

    return res.json({ provider });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('GET /api/v1/auth/provider-hint failed:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'errors.generic', 'Unexpected server error');
  }
});

module.exports = router;
