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

module.exports = { sendError };
