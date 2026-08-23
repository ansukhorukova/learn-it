// VITE_API_URL already includes the /api/v1 prefix (see docker-compose.yml /
// .env.example). Never hardcode localhost/backend here — the same built
// bundle must work against Cloud Run in production via a different
// VITE_API_URL at build time.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

/**
 * Calls GET /api/v1/users/me with the Firebase ID token, which idempotently
 * upserts the `users` row on first login. `locale` is only used by the BE to
 * seed a brand-new row and is ignored for a returning user.
 */
export async function fetchCurrentUser(idToken, locale) {
  const res = await fetch(`${API_URL}/users/me?locale=${encodeURIComponent(locale)}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) {
    throw new Error(`GET /users/me failed with status ${res.status}`);
  }
  return res.json();
}

/**
 * Calls GET /api/v1/auth/provider-hint — unauthenticated, used ONLY from the
 * signup-conflict path in AuthPage.jsx after Firebase has already rejected
 * the signup with `auth/email-already-in-use` (see backend/src/routes/auth.route.js
 * for the anti-enumeration reasoning). Returns `{ provider }` where provider
 * is `'password' | 'google.com' | null`. Never call this from the sign-in path.
 */
export async function fetchProviderHint(email) {
  const res = await fetch(`${API_URL}/auth/provider-hint?email=${encodeURIComponent(email)}`);
  if (!res.ok) {
    throw new Error(`GET /auth/provider-hint failed with status ${res.status}`);
  }
  return res.json();
}
