// US13-US17 board/task sharing: `myRole` on every Board/Task API response is
// the caller's effective role — 'owner', 'collaborator', or 'viewer' (see
// backend/src/lib/authz.js's higherRole for how it's computed). US15/US16:
// owner and collaborator can create/edit/move/delete shared content; a
// viewer is read-only on it (but has full access to their own time
// tracking, handled separately — see TaskPanel.jsx, which never gates the
// timer/time-entry controls on this).
//
// Shared by BoardViewPage.jsx and TaskPanel.jsx so the two can't drift on
// what "can write" means.
export function canWrite(role) {
  return role === 'owner' || role === 'collaborator';
}
