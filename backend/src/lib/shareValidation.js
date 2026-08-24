const { ValidationError } = require('./serviceErrors');

// Shared by boardMembers.service.js (US13) and taskShares.service.js (US14)
// so the two can't drift on what counts as a valid role/email — same
// extraction rationale as lib/authz.js's getOwnedBoard header comment.
const SHARE_ROLES = ['viewer', 'collaborator'];

// Deliberately simple, not RFC 5322-exhaustive — this only gates "is this
// worth a lookup against `users.email`", not full address validation (the
// FE's own signup form already does client-side format checking; this is
// the BE's last line of defense against obviously malformed input reaching
// the DB query).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateShareRole(role) {
  if (!SHARE_ROLES.includes(role)) throw new ValidationError('errors.share.invalidRole');
  return role;
}

function validateShareEmail(email) {
  const trimmed = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!trimmed || !EMAIL_RE.test(trimmed)) throw new ValidationError('errors.share.emailInvalid');
  return trimmed;
}

module.exports = { SHARE_ROLES, validateShareRole, validateShareEmail };
