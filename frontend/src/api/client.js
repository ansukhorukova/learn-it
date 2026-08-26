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

// --- Boards (US1-US5, filters extended by US-021/US-024) ---

// `categoryId` (US-021 AC9) narrows "Мої дошки" to boards with that exact
// category. Omitted/falsy means no filter — never send an empty query param.
export function listBoards(idToken, { categoryId } = {}) {
  const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
  return request(`/boards${query}`, { idToken });
}

// GET /boards/public (US-024) — the "Public Boards" section, filtered
// independently of "Мої дошки" above. `languageIds` is OR-semantics
// (US-023 AC8) and repeats the query param per id, per the OpenAPI
// `style: form, explode: true` contract.
export function listPublicBoards(idToken, { categoryId, languageIds } = {}) {
  const params = new URLSearchParams();
  if (categoryId) params.set('categoryId', categoryId);
  (languageIds || []).forEach((id) => params.append('languageIds', id));
  const query = params.toString();
  return request(`/boards/public${query ? `?${query}` : ''}`, { idToken });
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

// --- Comments (US-019) ---
// Shared (not privacy-scoped) list, unlike time-entries — every caller with
// task access (owner/collaborator/viewer) sees the identical list. Only
// GET/POST exist this pass — no edit/delete endpoint (US-019 AC10).

export function listTaskComments(idToken, taskId) {
  return request(`/tasks/${taskId}/comments`, { idToken });
}

export function createTaskComment(idToken, taskId, { body }) {
  return request(`/tasks/${taskId}/comments`, { method: 'POST', idToken, body: { body } });
}

// --- Profile & competencies (AUTH-004..AUTH-007) ---

// PATCH /users/me — partial profile update. `updateProfile`'s `publicName`
// may be a string, empty string, or null; users.service.js on the BE treats
// an empty/whitespace string the same as null (reset to the display_name
// fallback, AUTH-004 AC3) — the FE doesn't need to pre-convert.
export function fetchProfile(idToken) {
  return request('/users/me', { idToken });
}

export function updateProfile(idToken, payload) {
  return request('/users/me', { method: 'PATCH', idToken, body: payload });
}

// GET /competencies — the active dictionary the picker offers (AUTH-005 AC1),
// reused as-is for the board category picker/badge (US-021).
export function listCompetencyCatalog(idToken) {
  return request('/competencies', { idToken });
}

// GET /languages — the active languages dictionary (US-023 AC1), same
// contract/shape as listCompetencyCatalog above.
export function listLanguagesCatalog(idToken) {
  return request('/languages', { idToken });
}

export function listUserCompetencies(idToken) {
  return request('/users/me/competencies', { idToken });
}

// {competencyId} for a dictionary pick, or {customLabel} for free text —
// exactly one of the two (AUTH-006 AC5), enforced on the BE.
export function addUserCompetency(idToken, payload) {
  return request('/users/me/competencies', { method: 'POST', idToken, body: payload });
}

export function updateUserCompetency(idToken, id, { willingToTeach }) {
  return request(`/users/me/competencies/${id}`, { method: 'PATCH', idToken, body: { willingToTeach } });
}

export function removeUserCompetency(idToken, id) {
  return request(`/users/me/competencies/${id}`, { method: 'DELETE', idToken });
}

// --- People search & public profiles (US-025/US-026) ---

// GET /users/search — deliberately never called with an empty/undefined
// competencyId (US-025 AC2: no request until a competency is chosen) — that
// guard lives in PeopleSearchPage.jsx, not here, since this wrapper mirrors
// the REST call 1:1.
export function searchUsersByCompetency(idToken, competencyId) {
  return request(`/users/search?competencyId=${encodeURIComponent(competencyId)}`, { idToken });
}

export function getPublicUserProfile(idToken, userId) {
  return request(`/users/${encodeURIComponent(userId)}`, { idToken });
}

// --- DM threads (US-027) ---

// POST /dm-threads — get-or-create (200 for an existing thread, 201 for a
// new one; identical JSON shape either way, see DmThread schema).
export function getOrCreateDmThread(idToken, { targetUserId, competencyId }) {
  return request('/dm-threads', { method: 'POST', idToken, body: { targetUserId, competencyId } });
}

export function listMyDmThreads(idToken) {
  return request('/dm-threads', { idToken });
}

export function listDmThreadMessages(idToken, threadId) {
  return request(`/dm-threads/${threadId}/messages`, { idToken });
}

export function createDmThreadMessage(idToken, threadId, { body }) {
  return request(`/dm-threads/${threadId}/messages`, { method: 'POST', idToken, body: { body } });
}

// --- Competency group chat (US-028) ---
// One room per `competencies` row, identified directly by competencyId — no
// separate "rooms" resource (decision #3 in USER_STORIES.md's US-025…029
// origin notes).

export function listCompetencyChatMessages(idToken, competencyId) {
  return request(`/competencies/${competencyId}/chat/messages`, { idToken });
}

export function createCompetencyChatMessage(idToken, competencyId, { body }) {
  return request(`/competencies/${competencyId}/chat/messages`, { method: 'POST', idToken, body: { body } });
}

// --- Competency chat membership (US-031/032/033) ---
// Idempotent get-or-create/delete — membership determines ONLY what
// `listMyCompetencyChats` returns, never read/write access to the chat
// itself (US-028 access stays unchanged).

export function joinCompetencyChat(idToken, competencyId) {
  return request(`/competencies/${competencyId}/chat/members`, { method: 'POST', idToken });
}

export function leaveCompetencyChat(idToken, competencyId) {
  return request(`/competencies/${competencyId}/chat/members/me`, { method: 'DELETE', idToken });
}

export function listMyCompetencyChats(idToken) {
  return request('/competency-chats/mine', { idToken });
}
