// describe/it/expect/beforeEach/afterEach come from vitest's `globals: true`
// (see vitest.config.js).
const { db, createUser, createBoard, createTask, createAttachment, cleanupUser, wait } = require('./helpers');
const attachmentsService = require('../../src/services/attachments.service');
const { NotFoundError } = require('../../src/lib/serviceErrors');

// Attachments (US9) have none of tasks.service.js's position/reindex
// complexity — create/list/delete are plain ownership-gated single-row
// operations, so most of that suite's row-locking machinery doesn't apply
// here. The one real race worth covering: two concurrent deletes of the
// *same* attachment (e.g. a double-fired click, or two tabs open on the
// same task panel). attachments.service.js's deleteAttachment routes
// through lib/db.js's lockRow (`SELECT ... FOR UPDATE`) inside a
// transaction, same pattern as tasks.service.js's deleteTask — this is
// regression coverage for that, run against a real Postgres database
// because it's real lock-queue behavior between two overlapping
// transactions, which a mocked DB can't reproduce.
//
// Fixtures use kind: 'note' attachments specifically so this suite never
// needs a reachable MinIO/S3 endpoint — deleteAttachment only calls
// storage.deleteObject for kind: 'file', so a note-kind row exercises the
// exact same DB-locking code path with zero storage dependency.
describe('attachments concurrency', () => {
  let ownerId;
  let board;
  let task;

  beforeEach(async () => {
    ownerId = await createUser();
    board = await createBoard(ownerId);
    task = await createTask(board.id, ownerId);
  });

  afterEach(async () => {
    await cleanupUser(ownerId);
  });

  it('deleteAttachment vs deleteAttachment on the same attachment: one succeeds, the other gets a clean 404, not a crash', async () => {
    const attachment = await createAttachment(task.id, ownerId, { kind: 'note', body: 'Race me' });

    const results = await Promise.allSettled([
      attachmentsService.deleteAttachment(task.id, attachment.id, ownerId),
      attachmentsService.deleteAttachment(task.id, attachment.id, ownerId),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(NotFoundError);
    expect(rejected[0].reason).toMatchObject({ messageKey: 'errors.attachment.notFound' });

    const remaining = await db('attachments').where({ id: attachment.id }).first();
    expect(remaining).toBeUndefined();
  });

  // Code-reviewer MAJOR finding (fix pass after the double-delete case
  // above shipped): createAttachment's getOwnedTaskWithBoard read is
  // unlocked, same shape as updateTask's pre-fix bug in
  // tasks.concurrency.test.js. If a concurrent deleteTask commits between
  // that read and the INSERT, the INSERT used to hit the
  // `attachments_task_id_foreign` FK constraint (SQLSTATE 23503, which
  // dbErrors.js didn't map at the time) and fall through as a raw 500.
  // createAttachment now locks the parent task row (insertAttachmentLocked,
  // attachments.service.js) before inserting, mirroring updateTask's
  // title-only branch and deleteTask itself — this reproduces the race
  // deterministically the same way tasks.concurrency.test.js's "vs
  // deleteTask" cases do: manually drive deleteTask's own lock order (board
  // FOR UPDATE, then task FOR UPDATE, then delete) in a transaction held
  // open, so createAttachment is forced to block on the same task-row lock
  // and observe the row gone once the delete commits.
  it('createAttachment (note) vs deleteTask on the same task: clean 404, not a crash', async () => {
    const deleteTrx = await db.transaction();
    await deleteTrx('boards').where({ id: board.id }).forUpdate().first();
    await deleteTrx('tasks').where({ id: task.id }).forUpdate().first();
    await deleteTrx('tasks').where({ id: task.id }).delete();

    const createPromise = attachmentsService.createAttachment(task.id, ownerId, {
      kind: 'note',
      body: 'Created while task is being deleted',
    });
    await wait(200); // let createAttachment's unlocked ownership read pass and its FOR UPDATE start blocking
    await deleteTrx.commit();

    await expect(createPromise).rejects.toBeInstanceOf(NotFoundError);
    await expect(createPromise).rejects.toMatchObject({ messageKey: 'errors.task.notFound' });

    const remaining = await db('attachments').where({ task_id: task.id }).first();
    expect(remaining).toBeUndefined();
  });
});
