// Mirrors backend/src/services/timeEntries.service.js's MINUTES_MIN/
// MINUTES_MAX/NOTE_MAX_LENGTH — client-side validation here only gives
// faster feedback (skips a doomed round-trip); the backend is still the
// single source of truth and re-validates every write independently
// (CLAUDE.md: BE is the single point of authorization/validation).
export const MINUTES_MIN = 1;
export const MINUTES_MAX = 1440; // 24h

export const NOTE_MAX_LENGTH = 500;
