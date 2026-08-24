// Mirrors backend/src/services/taskComments.service.js's body length bound
// (see openapi.yaml's TaskComment/createTaskComment, US-019 AC4/AC5) —
// client-side validation here only gives faster feedback (skips a doomed
// round-trip); the backend is still the single source of truth and
// re-validates every write independently (CLAUDE.md: BE is the single point
// of authorization/validation).
export const COMMENT_BODY_MAX_LENGTH = 2000;
