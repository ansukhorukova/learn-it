const crypto = require('crypto');

const db = require('../db/knex');
const { isUuid } = require('../lib/uuid');
const { ValidationError, NotFoundError } = require('../lib/serviceErrors');
const { lockRow } = require('../lib/db');
const { isForeignKeyViolation } = require('../lib/dbErrors');
const storage = require('../lib/storage');
const { getOwnedTaskWithBoard } = require('./tasks.service');

const KINDS = ['file', 'link', 'note'];
const TITLE_MAX_LENGTH = 200;
const URL_MAX_LENGTH = 2000;
const NOTE_BODY_MAX_LENGTH = 2000;

// Reasonable defaults for a solo-learner attachment feature (no product
// requirement pinned an exact number — documented here and in openapi.yaml
// as the single source of truth for both the client and server validation
// error). Covers the "pdf/doc/зображення" wording from CLAUDE.md's Task
// panel spec.
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
// SVG is deliberately excluded: it's an XML document that can carry an
// embedded <script>, and unlike an <img src>-rendered image, clicking an
// image-kind attachment chip navigates the browser to the signed download
// URL directly (target="_blank" in TaskPanel.jsx), so the browser renders it
// as a live document and executes any script inside. Every attachment is
// visibility: 'private' today, so this is self-XSS at worst right now, but
// it becomes real stored XSS against other users once the sharing feature
// introduces visibility: 'shared'. Only re-add SVG support alongside actual
// content sanitization (or by forcing Content-Disposition: attachment on the
// signed URL for SVG specifically) — never a bare allowlist entry.
const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

function isImageMime(mimeType) {
  return typeof mimeType === 'string' && mimeType.startsWith('image/');
}

function validateKind(kind) {
  if (!KINDS.includes(kind)) throw new ValidationError('errors.attachment.invalidKind');
  return kind;
}

function validateLinkTitle(title) {
  const trimmed = typeof title === 'string' ? title.trim() : '';
  if (!trimmed) throw new ValidationError('errors.attachment.titleRequired');
  if (trimmed.length > TITLE_MAX_LENGTH) throw new ValidationError('errors.attachment.titleTooLong');
  return trimmed;
}

function validateUrl(url) {
  const trimmed = typeof url === 'string' ? url.trim() : '';
  if (!trimmed) throw new ValidationError('errors.attachment.urlRequired');
  if (trimmed.length > URL_MAX_LENGTH) throw new ValidationError('errors.attachment.urlTooLong');
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new ValidationError('errors.attachment.urlInvalid');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ValidationError('errors.attachment.urlInvalid');
  }
  return trimmed;
}

function validateNoteBody(body) {
  const trimmed = typeof body === 'string' ? body.trim() : '';
  if (!trimmed) throw new ValidationError('errors.attachment.noteBodyRequired');
  if (trimmed.length > NOTE_BODY_MAX_LENGTH) throw new ValidationError('errors.attachment.noteBodyTooLong');
  return trimmed;
}

// Strips any path separators from an uploaded filename before it's stored
// as `title` (defense-in-depth — never trusted as a path component; the
// actual storage key below is built from a random UUID, not this value).
// Any remaining special characters are safely escaped by encodeURIComponent
// wherever this value ends up in an HTTP header (see lib/storage.js's
// getSignedDownloadUrl), rather than stripped here.
function sanitizeFilename(name) {
  const base = typeof name === 'string' ? name.split(/[/\\]/).pop().trim() : '';
  return (base || 'file').slice(0, TITLE_MAX_LENGTH);
}

// Object key layout: taskId/uuid-filename — namespaced by task so a task's
// (and, transitively, its board's) attachments are trivially enumerable in
// the bucket for debugging, and the random UUID prefix avoids any collision
// between two uploads that happen to share a filename.
function buildObjectKey(taskId, filename) {
  return `${taskId}/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;
}

// Maps a DB row to the API shape. `downloadUrl` is only ever present for
// `kind: 'file'` — a freshly generated short-lived signed GET URL (see
// lib/storage.js), regenerated on every read rather than stored, so it's
// never stale and never persisted anywhere a leak could make it long-lived.
async function toAttachment(row) {
  const base = {
    id: row.id,
    taskId: row.task_id,
    kind: row.kind,
    title: row.title,
    url: row.url,
    mimeType: row.mime_type,
    body: row.body,
    visibility: row.visibility,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.kind === 'file' && row.storage_path) {
    base.downloadUrl = await storage.getSignedDownloadUrl(row.storage_path, row.title);
    base.isImage = isImageMime(row.mime_type);
  }
  return base;
}

// Privacy boundary (CLAUDE.md: "вкладення з visibility private не видно
// нікому, крім автора"). Before US13-US17 (sharing), a second user could
// never reach this task at all, so every row here was trivially only ever
// read by its own author — the filter below did nothing in practice and was
// never written. Now that a task can have a collaborator/viewer alongside
// its owner, this must be explicit: a `private` row (still the only
// visibility any create path ever writes — see insertAttachment below) is
// filtered out for anyone but its `created_by`. `shared` passes through to
// every caller who already got past the task-level access check above (that
// check IS the "has access to this task" gate `shared` is defined against);
// `selected` has no writer yet (attachment_viewers is schema-only this
// pass — see its migration) so no row can currently have that visibility to
// filter here, but the branch is written to hold once one does, not to be
// revisited when the picker UI ships.
function isVisibleTo(row, callerId) {
  if (row.visibility === 'private') return row.created_by === callerId;
  return true;
}

async function listAttachmentsForTask(taskId, ownerId) {
  await getOwnedTaskWithBoard(taskId, ownerId);
  const rows = await db('attachments').where({ task_id: taskId }).orderBy('created_at', 'asc');
  const visible = rows.filter((row) => isVisibleTo(row, ownerId));
  return Promise.all(visible.map(toAttachment));
}

// `trx` is required (not defaulted to `db`) so a caller can't accidentally
// insert without going through insertAttachmentLocked's task-row lock below.
async function insertAttachment(trx, patch) {
  const [row] = await trx('attachments')
    .insert({
      ...patch,
      // `visibility: 'private'` is spread AFTER `patch` (not before) so it's
      // an invariant no caller can accidentally override — per the product
      // decision recorded in CLAUDE.md/US9, no visibility picker UI exists
      // yet, so nothing here ever sets anything else. Whoever builds the
      // sharing feature's visibility picker must change this line
      // deliberately, not discover it silently no-opped because `patch`
      // happened to include a `visibility` key.
      visibility: 'private',
    })
    .returning('*');
  return row;
}

// Locks the parent task row (mirroring updateTask's title-only branch and
// deleteTask in tasks.service.js — lockRow, lib/db.js) before inserting,
// then inserts within the same transaction. Closes the race where
// getOwnedTaskWithBoard's unlocked read in createAttachment succeeds but a
// concurrent deleteTask commits before this INSERT runs: without the lock,
// that ordering hit the `attachments_task_id_foreign` FK constraint
// (SQLSTATE 23503) and fell through to a raw 500 (dbErrors.js only mapped
// 23505/40P01 at the time). With the lock, deleteTask's own task-row lock
// (same table, same row) forces the two transactions to serialize: either
// this lock wins and deleteTask blocks until the attachment is committed (so
// its cascade delete removes it, consistent with an attachment that existed
// before the delete), or deleteTask's lock already committed and this lockRow
// call itself throws the clean NotFoundError below — never a raw FK 500.
// attachments have none of tasks.service.js's position/reindex complexity, so
// (unlike updateTask's reorder branch) there's no need to also lock the
// parent board row here — just the task being inserted under.
async function insertAttachmentLocked(taskId, patch) {
  try {
    return await db.transaction(async (trx) => {
      await lockRow(trx, 'tasks', taskId, () => new NotFoundError('errors.task.notFound'));
      return insertAttachment(trx, patch);
    });
  } catch (err) {
    // Backstop, same spirit as the isUniqueViolation/isDeadlock backstops in
    // tasks.service.js: the lock above is what actually prevents the race,
    // but map the raw FK violation to a clean 404 too in case this is ever
    // reached through a path that skips the lock.
    if (isForeignKeyViolation(err, 'attachments_task_id_foreign')) {
      throw new NotFoundError('errors.task.notFound');
    }
    throw err;
  }
}

/**
 * Creates a link, note, or file attachment on a task. `kind` selects which
 * of `{title, url}` / `{body}` / `{file}` is required — see the route layer
 * (routes/tasks.route.js) for how each is populated from the request
 * (JSON body for link/note, multipart form + `req.file` for file).
 *
 * Authorization: every call re-derives ownership through the task's parent
 * board (getOwnedTaskWithBoard, shared with tasks.service.js) — never
 * trusts the URL alone (CLAUDE.md: BE is the single point of authorization).
 */
async function createAttachment(taskId, ownerId, { kind, title, url, body, file, fileRejected } = {}) {
  // US15/US16: adding an attachment needs collaborator+ — a viewer is
  // read-only here, same as tasks.service.js's updateTask/deleteTask.
  await getOwnedTaskWithBoard(taskId, ownerId, { minRole: 'collaborator' });
  const validKind = validateKind(kind);

  if (validKind === 'link') {
    // Validate before locking (fail fast on bad input without taking a
    // row lock for nothing), same ordering as the note/file branches below.
    const validTitle = validateLinkTitle(title);
    const validUrl = validateUrl(url);
    const row = await insertAttachmentLocked(taskId, {
      task_id: taskId,
      created_by: ownerId,
      kind: 'link',
      title: validTitle,
      url: validUrl,
    });
    return toAttachment(row);
  }

  if (validKind === 'note') {
    const validBody = validateNoteBody(body);
    const row = await insertAttachmentLocked(taskId, {
      task_id: taskId,
      created_by: ownerId,
      kind: 'note',
      body: validBody,
    });
    return toAttachment(row);
  }

  // kind === 'file'
  if (fileRejected) throw new ValidationError('errors.attachment.invalidFileType');
  if (!file) throw new ValidationError('errors.attachment.fileRequired');
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) throw new ValidationError('errors.attachment.invalidFileType');
  if (file.size > MAX_FILE_SIZE_BYTES) throw new ValidationError('errors.attachment.fileTooLarge');

  const objectKey = buildObjectKey(taskId, file.originalname);
  await storage.putObject(objectKey, file.buffer, file.mimetype);

  try {
    const row = await insertAttachmentLocked(taskId, {
      task_id: taskId,
      created_by: ownerId,
      kind: 'file',
      title: sanitizeFilename(file.originalname),
      storage_path: objectKey,
      mime_type: file.mimetype,
    });
    return toAttachment(row);
  } catch (err) {
    // The object already landed in storage but the DB insert failed — clean
    // it up so a failed create never leaves an orphaned MinIO object behind
    // (same "no orphaned storage objects" invariant the delete path below
    // upholds). Covers both a genuine DB failure and the concurrent-delete
    // race insertAttachmentLocked guards against/maps to NotFoundError above
    // — either way, the object must not be left behind if the row never
    // landed.
    await storage.deleteObject(objectKey).catch(() => {});
    throw err;
  }
}

/**
 * Deletes an attachment: removes the DB row and, for `kind: 'file'`, the
 * backing MinIO object — never one without the other (no orphaned storage
 * objects, no DB rows pointing at deleted objects).
 *
 * Privacy boundary (CLAUDE.md: "private (тільки я)"): this applies to
 * DELETE too, not just the list read `isVisibleTo` gates above — a
 * `private` attachment belonging to someone else is treated as not existing
 * for the caller, with NO exception for the board owner. Deliberately 404
 * (`errors.attachment.notFound`), not 403: a 403 would confirm "an
 * attachment exists here, you're just not allowed to touch it", which is
 * exactly the existence-disclosure this app's other anti-enumeration
 * boundaries avoid (see timeEntries.service.js's updateTimeEntry/
 * deleteTimeEntry — another user's row 404s the same way a genuinely
 * missing id would). Same `isVisibleTo` used by listAttachmentsForTask, so
 * the two can't drift on what "visible to this caller" means.
 *
 * Two concurrent deletes of the same attachment: both re-derive task
 * ownership first, then race on `lockRow`'s `SELECT ... FOR UPDATE`. The
 * first to acquire the lock deletes the row and commits; the second blocks
 * until that commit, then finds zero rows and gets a clean NotFoundError
 * (404) instead of a double-delete or a crash — see
 * test/concurrency/attachments.concurrency.test.js.
 */
async function deleteAttachment(taskId, attachmentId, ownerId) {
  // US15/US16: same collaborator+ gate as createAttachment above.
  await getOwnedTaskWithBoard(taskId, ownerId, { minRole: 'collaborator' });
  if (!isUuid(attachmentId)) throw new NotFoundError('errors.attachment.notFound');

  let deletedRow;
  await db.transaction(async (trx) => {
    const row = await lockRow(trx, 'attachments', attachmentId, () => new NotFoundError('errors.attachment.notFound'));
    if (row.task_id !== taskId) throw new NotFoundError('errors.attachment.notFound');
    // Checked INSIDE the lock, not before it: the lock is what makes this
    // read-then-decide safe against a concurrent visibility-relevant change
    // to this exact row (there is none today — visibility is immutable
    // post-create — but this keeps the check where every other guard in
    // this transaction already lives rather than splitting it across an
    // unlocked pre-check and a locked mutation).
    if (!isVisibleTo(row, ownerId)) throw new NotFoundError('errors.attachment.notFound');
    await trx('attachments').where({ id: attachmentId }).delete();
    deletedRow = row;
  });

  if (deletedRow.kind === 'file' && deletedRow.storage_path) {
    try {
      await storage.deleteObject(deletedRow.storage_path);
    } catch (err) {
      // The DB row is already gone (source of truth for "does this
      // attachment exist"), so a storage-delete failure here is logged, not
      // surfaced as a failed request — the user's delete action did
      // succeed. Worst case is a genuinely orphaned object needing manual
      // cleanup, not a stuck/undeletable attachment.
      // eslint-disable-next-line no-console
      console.error('Failed to delete attachment object from storage', deletedRow.storage_path, err);
    }
  }
}

module.exports = {
  KINDS,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  listAttachmentsForTask,
  createAttachment,
  deleteAttachment,
};
