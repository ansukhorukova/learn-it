// Mirrors backend/src/services/tasks.service.js's `plannedMinutes` bounds
// (see openapi.yaml's PATCH /tasks/{id}, US-020 AC4/AC5) — client-side
// validation here only gives faster feedback (skips a doomed round-trip);
// the backend is still the single source of truth and re-validates every
// write independently (CLAUDE.md: BE is the single point of authorization/
// validation).
export const PLANNED_MINUTES_FIELD_MIN = 0;
export const PLANNED_MINUTES_FIELD_MAX = 59; // the "minutes" field of the two-field hours/minutes form
export const PLANNED_TOTAL_MINUTES_MAX = 9999; // ~166h, the combined hours*60+minutes cap
