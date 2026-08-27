// Shared error classes thrown by the service layer (boards/tasks and beyond)
// so route handlers can map them to the project's standard error envelope
// (see lib/apiError.js's sendServiceError) without each route re-implementing
// its own instanceof checks. Every error carries a `messageKey` — the FE
// looks this up in its own locale dictionary (CLAUDE.md: "код + локалізований
// ключ повідомлення"), never rendering `message` directly.
class ValidationError extends Error {
  // `params` (optional) — an object of interpolation values for a
  // parameterized `messageKey` (e.g. `{ index: 3 }` for
  // `errors.boardImport.taskTitleRequired`, US-037). The FE substitutes
  // them into its own localized string; the BE never formats the text
  // itself. Absent for the common non-parameterized case.
  constructor(messageKey, params) {
    super(messageKey);
    this.name = 'ValidationError';
    this.messageKey = messageKey;
    if (params && typeof params === 'object') this.params = params;
  }
}

class NotFoundError extends Error {
  constructor(messageKey) {
    super(messageKey);
    this.name = 'NotFoundError';
    this.messageKey = messageKey;
  }
}

class ForbiddenError extends Error {
  constructor(messageKey) {
    super(messageKey);
    this.name = 'ForbiddenError';
    this.messageKey = messageKey;
  }
}

// Thrown when a write loses a race it should have won cleanly — e.g. a
// position collision that slips past the service layer's row locking and
// trips the DB's unique-constraint backstop instead. Maps to HTTP 409.
class ConflictError extends Error {
  constructor(messageKey) {
    super(messageKey);
    this.name = 'ConflictError';
    this.messageKey = messageKey;
  }
}

module.exports = { ValidationError, NotFoundError, ForbiddenError, ConflictError };
