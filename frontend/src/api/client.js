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

/**
 * Thrown by `request()` below for any non-2xx response. Carries the parsed
 * error envelope (see backend/src/lib/apiError.js) so callers can look up
 * `messageKey` in the FE's own locale dictionary rather than ever rendering
 * `message` (English-only, logs/devtools use) to the user.
 */
export class ApiRequestError extends Error {
  constructor(status, code, messageKey, message) {
    super(message || messageKey);
    this.status = status;
    this.code = code;
    this.messageKey = messageKey;
  }
}

// Shared fetch wrapper for the boards/tasks endpoints below — every call
// carries the caller's Firebase ID token (obtained by the component via
// `user.getIdToken()`, same pattern as fetchCurrentUser above) and parses
// the standard { error: { code, messageKey, message } } envelope on failure.
async function request(path, { method = 'GET', idToken, body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const err = (payload && payload.error) || {};
    throw new ApiRequestError(res.status, err.code || 'UNKNOWN', err.messageKey || 'errors.generic', err.message);
  }
  return payload;
}

// --- Boards (US1-US5) ---

export function listBoards(idToken) {
  return request('/boards', { idToken });
}

export function createBoard(idToken, payload) {
  return request('/boards', { method: 'POST', idToken, body: payload });
}

export function getBoard(idToken, boardId) {
  return request(`/boards/${boardId}`, { idToken });
}

export function updateBoard(idToken, boardId, payload) {
  return request(`/boards/${boardId}`, { method: 'PATCH', idToken, body: payload });
}

export function deleteBoard(idToken, boardId) {
  return request(`/boards/${boardId}`, { method: 'DELETE', idToken });
}

// --- Tasks (US6-US8) ---

export function listTasks(idToken, boardId) {
  return request(`/boards/${boardId}/tasks`, { idToken });
}

export function createTask(idToken, boardId, payload) {
  return request(`/boards/${boardId}/tasks`, { method: 'POST', idToken, body: payload });
}

export function updateTask(idToken, taskId, payload) {
  return request(`/tasks/${taskId}`, { method: 'PATCH', idToken, body: payload });
}

export function deleteTask(idToken, taskId) {
  return request(`/tasks/${taskId}`, { method: 'DELETE', idToken });
}
