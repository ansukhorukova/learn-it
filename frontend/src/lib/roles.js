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
