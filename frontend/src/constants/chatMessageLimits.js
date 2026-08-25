// Shared by DM messages (US-027 AC7) and competency group chat messages
// (US-028 AC4) — both mirror the exact same backend bound (see openapi.yaml
// DmMessage/CompetencyChatMessage `body` and task_comments' identical
// precedent, US-019). Client-side validation here only gives faster
// feedback (skips a doomed round-trip); the backend re-validates every
// write independently (CLAUDE.md: BE is the single point of authorization/
// validation).
export const CHAT_MESSAGE_BODY_MAX_LENGTH = 2000;
