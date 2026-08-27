const express = require('express');

const requireAuth = require('../middleware/auth.middleware');
const { sendError, sendServiceError } = require('../lib/apiError');
const boardImportService = require('../services/boardImport.service');

const router = express.Router();

// US-037 AC15: a 1 MB JSON body limit scoped to THIS route only — not the
// global `express.json()` (default 100 KB). This router is mounted in app.js
// BEFORE the global parser so this is the parser that actually consumes the
// body for `POST /api/v1/boards/import` (body-parser skips once `req._body`
// is set, so a second global parse never happens).
const parseImportBody = express.json({ limit: '1mb' });

function parseImportBodyOrError(req, res, next) {
  parseImportBody(req, res, (err) => {
    if (!err) return next();
    if (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413) {
      return sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'errors.boardImport.fileTooLarge');
    }
    // Malformed JSON that still reached the server — the FE is expected to
    // pre-validate with JSON.parse (US-038 AC3), so this is the fallback.
    return sendError(res, 400, 'VALIDATION_ERROR', 'errors.boardImport.invalidJson');
  });
}

// POST /api/v1/boards/import (US-037) — top-level action resource (same
// pattern as POST /api/v1/chat/forwards): bulk-creates a board + all its
// tasks + note attachments from a parsed JSON file, in one transaction.
// Auth only — no role check, the caller creates their OWN board, exactly
// like POST /api/v1/boards.
router.post('/', requireAuth, parseImportBodyOrError, async (req, res) => {
  try {
    const result = await boardImportService.importBoard(req.firebaseUser.uid, req.body);
    return res.status(201).json(result);
  } catch (err) {
    return sendServiceError(res, err);
  }
});

module.exports = router;
