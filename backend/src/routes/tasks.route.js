const express = require('express');
const multer = require('multer');

const requireAuth = require('../middleware/auth.middleware');
const { sendServiceError } = require('../lib/apiError');
const { ValidationError } = require('../lib/serviceErrors');
const tasksService = require('../services/tasks.service');
const attachmentsService = require('../services/attachments.service');
const timeEntriesService = require('../services/timeEntries.service');
const taskSharesService = require('../services/taskShares.service');
const taskCommentsService = require('../services/taskComments.service');
const taskPersonalStatusService = require('../services/taskPersonalStatus.service');

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

// GET /api/v1/tasks/:id — single task detail (new, US13-US17). The read
// path a task_shares-only recipient actually needs: GET
// /boards/:id/tasks (board view) is board-level access only (US14 — a
// task-level share must never leak the rest of the board), so someone who
// was only ever shared this one task has no other way to fetch it. Any
// effective role (viewer+) can read; `myRole` on the response tells the FE
// which one so it can gate write UI.
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const task = await tasksService.getTaskForUser(req.params.id, req.firebaseUser.uid);
    res.json(task);
  } catch (err) {
    sendServiceError(res, err);
  }
});

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

// PUT /api/v1/tasks/:id/my-status — set the caller's PERSONAL status for a
// task (US-039). Allowed ONLY for an effective role of `public` (an
// authenticated visitor of a public board with no real membership) — a
// caller with any real membership gets 403
// `errors.task.personalStatusNotApplicable` (they move the shared status via
// PATCH /tasks/:id; a real viewer is read-only on it). Idempotent, race-safe
// upsert of `task_personal_status` keyed by (task_id, user_id). This never
// touches `tasks.status` (the shared state) — see taskPersonalStatus.service.
router.put('/:id/my-status', requireAuth, async (req, res) => {
  try {
    const result = await taskPersonalStatusService.setMyStatus(
      req.params.id,
      req.firebaseUser.uid,
      req.body || {},
    );
    res.json(result);
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

// task_shares CRUD (US14) — sharing ONE task by email, without granting
// access to the rest of its board. Owner-of-the-parent-board-only on every
// route below (taskSharesService, via lib/authz.js's requireTaskOwner) — a
// collaborator (board- or task-level) gets errors.task.ownerOnly, never a
// bare 403 with no explanation (US15/US17).

// GET /api/v1/tasks/:id/shares — list a task's shares.
router.get('/:id/shares', requireAuth, async (req, res) => {
  try {
    const shares = await taskSharesService.listShares(req.params.id, req.firebaseUser.uid);
    res.json({ shares });
  } catch (err) {
    sendServiceError(res, err);
  }
});

// POST /api/v1/tasks/:id/shares — share the task with an email (US14).
// Re-sharing an already-shared email is idempotent: it updates their role
// rather than erroring (US17 duplicate-share decision, see
// taskShares.service.js's addShare).
router.post('/:id/shares', requireAuth, async (req, res) => {
  try {
    const share = await taskSharesService.addShare(req.params.id, req.firebaseUser.uid, req.body || {});
    res.status(201).json(share);
  } catch (err) {
    sendServiceError(res, err);
  }
});

// PATCH /api/v1/tasks/:id/shares/:shareId — change a share's role.
router.patch('/:id/shares/:shareId', requireAuth, async (req, res) => {
  try {
    const share = await taskSharesService.updateShareRole(
      req.params.id,
      req.params.shareId,
      req.firebaseUser.uid,
      req.body || {},
    );
    res.json(share);
  } catch (err) {
    sendServiceError(res, err);
  }
});

// DELETE /api/v1/tasks/:id/shares/:shareId — revoke a share.
router.delete('/:id/shares/:shareId', requireAuth, async (req, res) => {
  try {
    await taskSharesService.removeShare(req.params.id, req.params.shareId, req.firebaseUser.uid);
    res.status(204).end();
  } catch (err) {
    sendServiceError(res, err);
  }
});

// GET /api/v1/tasks/:id/comments — list a task's comments, oldest first
// (US-019). Unlike time-entries, comments are shared — any effective role
// (owner/collaborator/viewer) sees the same full list, same
// `requireTaskRole` viewer+ gate as attachments/time-entries listing.
router.get('/:id/comments', requireAuth, async (req, res) => {
  try {
    const comments = await taskCommentsService.listComments(req.params.id, req.firebaseUser.uid);
    res.json({ comments });
  } catch (err) {
    sendServiceError(res, err);
  }
});

// POST /api/v1/tasks/:id/comments — create a comment (US-019, gate widened
// by US-039). Owner / collaborator / `public` (a public-board visitor with
// no real membership) may post — a REAL `board_members`/`task_shares` viewer
// still gets 403 errors.task.readOnlyAccess, and no access at all still gets
// 403 errors.task.forbidden. No PATCH/DELETE for a comment in this pass.
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const comment = await taskCommentsService.createComment(req.params.id, req.firebaseUser.uid, req.body || {});
    res.status(201).json(comment);
  } catch (err) {
    sendServiceError(res, err);
  }
});

module.exports = router;
