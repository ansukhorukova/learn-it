// Maps Firebase Auth error codes to our own localization keys. A raw
// Firebase `error.message`/`error.code` must never reach the UI — every
// path here resolves to one of the auth.error.* keys.

const WRONG_CREDENTIAL_CODES = new Set([
  // Anti-enumeration: user-not-found and wrong-password map to the exact
  // same message so a failed sign-in never reveals whether the email exists.
  'auth/user-not-found',
  'auth/wrong-password',
  'auth/invalid-credential',
  'auth/invalid-login-credentials',
]);

export function mapSignInError(error) {
  const code = error && error.code;
  if (WRONG_CREDENTIAL_CODES.has(code)) return 'auth.error.wrongPassword';
  if (code === 'auth/network-request-failed') return 'auth.error.networkError';
  return 'auth.error.generic';
}

export function mapSignUpError(error, { isGoogleOnlyAccount = false } = {}) {
  const code = error && error.code;
  if (code === 'auth/email-already-in-use') {
    return isGoogleOnlyAccount ? 'auth.error.useGoogleInstead' : 'auth.error.emailAlreadyInUse';
  }
  if (code === 'auth/network-request-failed') return 'auth.error.networkError';
  return 'auth.error.generic';
}

export function mapGoogleSignInError(error) {
  const code = error && error.code;
  if (code === 'auth/popup-closed-by-user') return 'auth.error.popupClosed';
  if (code === 'auth/account-exists-with-different-credential') return 'auth.error.useEmailInstead';
  if (code === 'auth/network-request-failed') return 'auth.error.networkError';
  return 'auth.error.generic';
}
