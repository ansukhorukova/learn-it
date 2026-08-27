const { ValidationError, NotFoundError, ForbiddenError, ConflictError } = require('./serviceErrors');

// Consistent error envelope for every /api/v1/* response (CLAUDE.md "API":
// "код + локалізований ключ повідомлення"). The FE never renders `message`
// directly for user-facing copy — it looks up `messageKey` in its own
// locale dictionary; `message` is an English fallback for logs/devtools only.
function sendError(res, status, code, messageKey, message, params) {
  const error = {
    code,
    messageKey,
    message: message || messageKey,
  };
  // `params` (optional) — interpolation values for a parameterized
  // `messageKey` (US-037: `{index}`/`{max}`). Only included when non-empty,
  // so every existing non-parameterized error response is byte-for-byte
  // unchanged. The FE formats the localized string with these; `message`
  // stays an unformatted English fallback for logs.
  if (params && typeof params === 'object' && Object.keys(params).length > 0) {
    error.params = params;
  }
  return res.status(status).json({ error });
}

// Maps a service-layer error (see lib/serviceErrors.js) to the standard
// envelope above. Every boards/tasks route funnels its catch block through
// this instead of duplicating the instanceof/status-code mapping — the
// authorization check itself still lives in the service layer (CLAUDE.md:
// "BE — єдина точка авторизації", checked before any DB write), this just
// translates the thrown error into the right HTTP response.
function sendServiceError(res, err) {
  if (err instanceof ValidationError) {
    return sendError(res, 400, 'VALIDATION_ERROR', err.messageKey, undefined, err.params);
  }
  if (err instanceof NotFoundError) {
    return sendError(res, 404, 'NOT_FOUND', err.messageKey, undefined, err.params);
  }
  if (err instanceof ForbiddenError) {
    return sendError(res, 403, 'FORBIDDEN', err.messageKey, undefined, err.params);
  }
  if (err instanceof ConflictError) {
    return sendError(res, 409, 'CONFLICT', err.messageKey, undefined, err.params);
  }
  // eslint-disable-next-line no-console
  console.error(err);
  return sendError(res, 500, 'INTERNAL_ERROR', 'errors.generic', 'Unexpected server error');
}

module.exports = { sendError, sendServiceError };
