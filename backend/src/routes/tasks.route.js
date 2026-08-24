const express = require('express');
const multer = require('multer');

const requireAuth = require('../middleware/auth.middleware');
const { sendServiceError } = require('../lib/apiError');
const { ValidationError } = require('../lib/serviceErrors');
const tasksService = require('../services/tasks.service');
const attachmentsService = require('../services/attachments.service');
const timeEntriesService = require('../services/timeEntries.service');

const router = express.Router();

// Multipart parsing for file-kind attachment uploads (US9). Memory storage
// (not disk) — files go straight from the request into the S3-compatible
// PutObjectCommand buffer in attachments.service.js, never touching the
// container's filesystem, matching "FE never talks to storage directly, BE
// proxies the upload" from CLAUDE.md's storage architecture. The MIME
// allowlist is enforced again in the service layer (attachmentsService's
// ALLOWED_MIME_TYPES) — this fileFilter only avoids buffering bytes for a
// file we're going to reject anyway; it can't be the sole gate since a
// non-multipart caller (link/note kind) never reaches it.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: attachmentsService.MAX_FILE_SIZE_BYTES },
  fileFilter(req, file, cb) {
    if (!attachmentsService.ALLOWED_MIME_TYPES.has(file.mimetype)) {
      req.attachmentFileRejected = true;
      return cb(null, false);
    }
    return cb(null, true);
  },
});

// multer's own middleware signature is callback-based, not promise-based —
// wrapped here so the route handler below can `await` it and funnel any
// failure through the same sendServiceError envelope as every other error
// in this file, instead of a separate express error-handling middleware.
function parseAttachmentUpload(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('file')(req, res, (err) => {
      if (!err) return resolve();
      if (err.code === 'LIMIT_FILE_SIZE') {
        return reject(new ValidationError('errors.attachment.fileTooLarge'));
      }
      return reject(new ValidationError('errors.attachment.uploadFailed'));
    });
  });
}

// PATCH /api/v1/tasks/:id — title and/or status+position (drag-and-drop and
// its accessible fallback control both call this, US8). Ownership is
// re-derived through the task's parent board on every call (see
// tasks.service.js's getOwnedTaskWithBoard) — never trust the URL alone.
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const task = await tasksService.updateTask(req.params.id, req.firebaseUser.uid, req.body || {});
    res.json(task);
  } catch (err) {
    sendServiceError(res, err);
  }
});

// DELETE /api/v1/tasks/:id — delete task (US7).
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await tasksService.deleteTask(req.params.id, req.firebaseUser.uid);
    res.status(204).end();
  } catch (err) {
    sendServiceError(res, err);
  }
});

// GET /api/v1/tasks/:id/attachments — list a task's attachments, grouped by
// kind on the FE (US9). Ownership re-derived through the task's parent
// board on every call, same as every other tasks.* endpoint.
router.get('/:id/attachments', requireAuth, async (req, res) => {
  try {
    const attachments = await attachmentsService.listAttachmentsForTask(req.params.id, req.firebaseUser.uid);
    res.json({ attachments });
  } catch (err) {
    sendServiceError(res, err);
  }
});

// POST /api/v1/tasks/:id/attachments — create a file/link/note attachment
// (US9). `kind: 'file'` request bodies are multipart/form-data with a
// `file` field; `kind: 'link'`/`kind: 'note'` are plain JSON — multer's
// upload.single() is a no-op for a non-multipart request (see
// parseAttachmentUpload above), so both shapes are handled by one route.
router.post('/:id/attachments', requireAuth, async (req, res) => {
  try {
    await parseAttachmentUpload(req, res);
  } catch (err) {
    return sendServiceError(res, err);
  }

  try {
    const attachment = await attachmentsService.createAttachment(req.params.id, req.firebaseUser.uid, {
      kind: req.body.kind,
      title: req.body.title,
      url: req.body.url,
      body: req.body.body,
      file: req.file,
      fileRejected: req.attachmentFileRejected,
    });
    res.status(201).json(attachment);
  } catch (err) {
    sendServiceError(res, err);
  }
});

// DELETE /api/v1/tasks/:id/attachments/:attachmentId — delete an
// attachment (US9): DB row + the backing MinIO object for kind: 'file'.
router.delete('/:id/attachments/:attachmentId', requireAuth, async (req, res) => {
  try {
    await attachmentsService.deleteAttachment(req.params.id, req.params.attachmentId, req.firebaseUser.uid);
    res.status(204).end();
  } catch (err) {
    sendServiceError(res, err);
  }
});

// GET /api/v1/tasks/:id/time-entries — the caller's own sessions (newest
// first) plus totals (US12). Ownership re-derived through the task's parent
// board, same as every other tasks.* endpoint. Only ever returns the
// caller's own rows — see timeEntriesService.listTimeEntriesForTask's header
// comment for the privacy invariant this is built on.
router.get('/:id/time-entries', requireAuth, async (req, res) => {
  try {
    const data = await timeEntriesService.listTimeEntriesForTask(req.params.id, req.firebaseUser.uid);
    res.json(data);
  } catch (err) {
    sendServiceError(res, err);
  }
});

// POST /api/v1/tasks/:id/time-entries/start — start the timer on this task
// (US10). If the caller already has an active timer on another task, it's
// auto-stopped in the same transaction ("auto-stop-and-switch") — the
// response carries both entries so the FE can show a switch notification.
router.post('/:id/time-entries/start', requireAuth, async (req, res) => {
  try {
    const result = await timeEntriesService.startTimer(req.params.id, req.firebaseUser.uid);
    res.status(201).json(result);
  } catch (err) {
    sendServiceError(res, err);
  }
});

// POST /api/v1/tasks/:id/time-entries/stop — stop the caller's active timer
// on this task (US10). 409 errors.timeEntry.noActiveTimer if none is running
// here (including if it's already been stopped by a concurrent request).
router.post('/:id/time-entries/stop', requireAuth, async (req, res) => {
  try {
    const entry = await timeEntriesService.stopTimer(req.params.id, req.firebaseUser.uid, req.body || {});
    res.json(entry);
  } catch (err) {
    sendServiceError(res, err);
  }
});

// POST /api/v1/tasks/:id/time-entries — manual entry (US11): minutes (1-1440)
// + optional note, created as an already-completed session. Never touches
// the active-timer state.
router.post('/:id/time-entries', requireAuth, async (req, res) => {
  try {
    const entry = await timeEntriesService.createManualEntry(req.params.id, req.firebaseUser.uid, req.body || {});
    res.status(201).json(entry);
  } catch (err) {
    sendServiceError(res, err);
  }
});

// PATCH /api/v1/tasks/:id/time-entries/:entryId — edit a completed session's
// minutes and/or note (US11). Active entries, and entries belonging to
// another user, both 404 — see updateTimeEntry's header comment.
router.patch('/:id/time-entries/:entryId', requireAuth, async (req, res) => {
  try {
    const entry = await timeEntriesService.updateTimeEntry(
      req.params.id,
      req.params.entryId,
      req.firebaseUser.uid,
      req.body || {},
    );
    res.json(entry);
  } catch (err) {
    sendServiceError(res, err);
  }
});

// DELETE /api/v1/tasks/:id/time-entries/:entryId — delete a session, active
// or completed (US11) — deleting an active one cancels the timer with
// nothing saved.
router.delete('/:id/time-entries/:entryId', requireAuth, async (req, res) => {
  try {
    await timeEntriesService.deleteTimeEntry(req.params.id, req.params.entryId, req.firebaseUser.uid);
    res.status(204).end();
  } catch (err) {
    sendServiceError(res, err);
  }
});

module.exports = router;
