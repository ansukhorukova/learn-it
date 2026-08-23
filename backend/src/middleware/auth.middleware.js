const admin = require('../lib/firebaseAdmin');
const { sendError } = require('../lib/apiError');

/**
 * BE is the single point of authorization (CLAUDE.md rule). This middleware
 * is the only place that talks to Firebase Admin SDK to verify the ID token
 * from `Authorization: Bearer <token>` — provider-agnostic: a token from
 * email+password sign-in and a token from Google sign-in are indistinguishable
 * here (and must stay that way — no `if (provider === 'google')` branching
 * anywhere in this file or in anything that consumes `req.firebaseUser`).
 *
 * On success, attaches the decoded token to `req.firebaseUser` (has `uid`,
 * `email`, and — only for Google sign-ins — a `name` claim) and calls next().
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return sendError(
      res,
      401,
      'AUTH_TOKEN_MISSING',
      'errors.auth.tokenMissing',
      'Missing or malformed Authorization header',
    );
  }

  try {
    req.firebaseUser = await admin.auth().verifyIdToken(token);
    return next();
  } catch (err) {
    return sendError(
      res,
      401,
      'AUTH_TOKEN_INVALID',
      'errors.auth.tokenInvalid',
      'Invalid or expired Firebase ID token',
    );
  }
}

module.exports = requireAuth;
