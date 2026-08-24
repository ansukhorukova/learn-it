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

// Shared fetch wrapper for the boards/tasks/attachments endpoints below —
// every call carries the caller's Firebase ID token (obtained by the
// component via `user.getIdToken()`, same pattern as fetchCurrentUser above)
// and parses the standard { error: { code, messageKey, message } } envelope
// on failure. `formData` (used only by uploadFileAttachment) skips the JSON
// Content-Type/stringify path — the browser sets the correct multipart
// boundary header itself when the body is a FormData instance.
async function request(path, { method = 'GET', idToken, body, formData } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(formData ? {} : { 'Content-Type': 'application/json' }),
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: formData || (body !== undefined ? JSON.stringify(body) : undefined),
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

// --- Attachments (US9) ---

export function listAttachments(idToken, taskId) {
  return request(`/tasks/${taskId}/attachments`, { idToken });
}

export function createLinkAttachment(idToken, taskId, { title, url }) {
  return request(`/tasks/${taskId}/attachments`, {
    method: 'POST',
    idToken,
    body: { kind: 'link', title, url },
  });
}

export function createNoteAttachment(idToken, taskId, { body }) {
  return request(`/tasks/${taskId}/attachments`, {
    method: 'POST',
    idToken,
    body: { kind: 'note', body },
  });
}

// Multipart upload — the file's bytes go straight to the BE (never to
// storage directly from the browser), which then proxies the PutObject call
// server-side (see backend/src/lib/storage.js).
export function uploadFileAttachment(idToken, taskId, file) {
  const formData = new FormData();
  formData.append('kind', 'file');
  formData.append('file', file);
  return request(`/tasks/${taskId}/attachments`, { method: 'POST', idToken, formData });
}

export function deleteAttachment(idToken, taskId, attachmentId) {
  return request(`/tasks/${taskId}/attachments/${attachmentId}`, { method: 'DELETE', idToken });
}

// --- Time entries (US10-US12) ---

export function listTimeEntries(idToken, taskId) {
  return request(`/tasks/${taskId}/time-entries`, { idToken });
}

export function startTimer(idToken, taskId) {
  return request(`/tasks/${taskId}/time-entries/start`, { method: 'POST', idToken });
}

export function stopTimer(idToken, taskId, { note } = {}) {
  return request(`/tasks/${taskId}/time-entries/stop`, { method: 'POST', idToken, body: { note } });
}

export function createManualTimeEntry(idToken, taskId, { minutes, note }) {
  return request(`/tasks/${taskId}/time-entries`, { method: 'POST', idToken, body: { minutes, note } });
}

export function updateTimeEntry(idToken, taskId, entryId, payload) {
  return request(`/tasks/${taskId}/time-entries/${entryId}`, { method: 'PATCH', idToken, body: payload });
}

export function deleteTimeEntry(idToken, taskId, entryId) {
  return request(`/tasks/${taskId}/time-entries/${entryId}`, { method: 'DELETE', idToken });
}

// --- Single task detail (US13-US17) ---

// GET /tasks/:id — the read path a task_shares-only recipient needs (see
// backend/src/routes/tasks.route.js's header comment): `listTasks` above
// requires board-level access, which a task-only share never has. Not
// currently called by any page (BoardViewPage always has the task from the
// board's task list already), but exported for the future task-share-direct-
// link flow ("Shared with me", out of scope this pass).
export function getTask(idToken, taskId) {
  return request(`/tasks/${taskId}`, { idToken });
}

// --- Sharing: board_members (US13) and task_shares (US14) ---
// Both resources share the same shape ({ email, role } to add, { role } to
// change) and the same owner-only authorization on the BE — see
// boardMembers.service.js / taskShares.service.js.

export function listBoardMembers(idToken, boardId) {
  return request(`/boards/${boardId}/members`, { idToken });
}

export function addBoardMember(idToken, boardId, { email, role }) {
  return request(`/boards/${boardId}/members`, { method: 'POST', idToken, body: { email, role } });
}

export function updateBoardMemberRole(idToken, boardId, memberId, { role }) {
  return request(`/boards/${boardId}/members/${memberId}`, { method: 'PATCH', idToken, body: { role } });
}

export function removeBoardMember(idToken, boardId, memberId) {
  return request(`/boards/${boardId}/members/${memberId}`, { method: 'DELETE', idToken });
}

export function listTaskShares(idToken, taskId) {
  return request(`/tasks/${taskId}/shares`, { idToken });
}

export function addTaskShare(idToken, taskId, { email, role }) {
  return request(`/tasks/${taskId}/shares`, { method: 'POST', idToken, body: { email, role } });
}

export function updateTaskShareRole(idToken, taskId, shareId, { role }) {
  return request(`/tasks/${taskId}/shares/${shareId}`, { method: 'PATCH', idToken, body: { role } });
}

export function removeTaskShare(idToken, taskId, shareId) {
  return request(`/tasks/${taskId}/shares/${shareId}`, { method: 'DELETE', idToken });
}
