// US13-US17 board/task sharing: `myRole` on every Board/Task API response is
// the caller's effective role — 'owner', 'collaborator', 'viewer', or (since
// US-022) 'public' for a visitor with no real board_members/task_shares
// grant, reachable only because the board itself is visibility: 'public'
// (see backend/src/lib/authz.js's higherRole for how it's computed — a real
// membership role always wins over this fallback). US15/US16/US-022:
// owner and collaborator can create/edit/move/delete shared content; a
// viewer OR a public visitor is read-only on it (but a viewer still has full
// access to their own time tracking, handled separately — see
// TaskPanel.jsx, which never gates the timer/time-entry controls on this).
//
// Shared by BoardViewPage.jsx and TaskPanel.jsx so the two can't drift on
// what "can write" means.
export function canWrite(role) {
  return role === 'owner' || role === 'collaborator';
}

// US-039/US-040: adding task comments is allowed for owner/collaborator AND
// for a public visitor of a visibility: 'public' board (role 'public') — a
// public board is a learning template, so a visitor can ask questions on the
// material. A real board_members viewer stays read-only on comments (US-019
// AC3), so 'viewer' is deliberately NOT included here — that case still shows
// the read-only banner without a form. Only the comments section (add form +
// "Reply" buttons) is gated on this; every other write-UI in the task panel
// (description, estimate, attachments, delete) stays on canWrite, which
// excludes 'public'.
export function canComment(role) {
  return role === 'owner' || role === 'collaborator' || role === 'public';
}
