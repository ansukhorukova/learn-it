// Pure, client-side-only validation — no network calls. Returns a
// localization key (looked up via useI18n().t) or null when the field is
// valid, so callers never handle raw English strings.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(email) {
  const trimmed = email.trim();
  if (!trimmed) return 'auth.validation.emailRequired';
  if (!EMAIL_PATTERN.test(trimmed)) return 'auth.validation.emailInvalid';
  return null;
}

export function validatePassword(password) {
  if (!password) return 'auth.validation.passwordRequired';
  if (password.length < MIN_PASSWORD_LENGTH) return 'auth.validation.passwordMinLength';
  return null;
}

export function validateConfirmPassword(password, confirmPassword) {
  if (password !== confirmPassword) return 'auth.validation.passwordsMustMatch';
  return null;
}
