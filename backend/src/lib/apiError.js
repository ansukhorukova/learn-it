const { ValidationError, NotFoundError, ForbiddenError, ConflictError } = require('./serviceErrors');

// Consistent error envelope for every /api/v1/* response (CLAUDE.md "API":
// "код + локалізований ключ повідомлення"). The FE never renders `message`
// directly for user-facing copy — it looks up `messageKey` in its own
// locale dictionary; `message` is an English fallback for logs/devtools only.
function sendError(res, status, code, messageKey, message) {
  return res.status(status).json({
    error: {
      code,
      messageKey,
      message: message || messageKey,
    },
  });
}

// Maps a service-layer error (see lib/serviceErrors.js) to the standard
// envelope above. Every boards/tasks route funnels its catch block through
// this instead of duplicating the instanceof/status-code mapping — the
// authorization check itself still lives in the service layer (CLAUDE.md:
// "BE — єдина точка авторизації", checked before any DB write), this just
// translates the thrown error into the right HTTP response.
function sendServiceError(res, err) {
  if (err instanceof ValidationError) {
    return sendError(res, 400, 'VALIDATION_ERROR', err.messageKey);
  }
  if (err instanceof NotFoundError) {
    return sendError(res, 404, 'NOT_FOUND', err.messageKey);
  }
  if (err instanceof ForbiddenError) {
    return sendError(res, 403, 'FORBIDDEN', err.messageKey);
  }
  if (err instanceof ConflictError) {
    return sendError(res, 409, 'CONFLICT', err.messageKey);
  }
  // eslint-disable-next-line no-console
  console.error(err);
  return sendError(res, 500, 'INTERNAL_ERROR', 'errors.generic', 'Unexpected server error');
}

module.exports = { sendError, sendServiceError };
