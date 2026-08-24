// describe/it/expect/beforeEach/afterEach come from vitest's `globals: true`
// (see vitest.config.js).
const { db, createUser, createBoard, createTask, createTimeEntry, cleanupUser, wait } = require('./helpers');
const timeEntriesService = require('../../src/services/timeEntries.service');
const { NotFoundError } = require('../../src/lib/serviceErrors');

describe('time entries concurrency', () => {
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

  // US10 AC6: "Дві одночасні спроби старту з двох вкладок того самого юзера
  // → гарантовано не лишається двох активних (ended_at IS NULL) записів для
  // одного user_id одночасно; без 500." Both calls race to be the very
  // first active entry for this user — no row exists yet for the
  // `SELECT ... FOR UPDATE` in startTimer to lock, so the DB's
  // `time_entries_one_active_per_user` partial unique index (see the
  // migration) is what actually prevents two active rows, not the lock.
  // startTimer catches that unique-violation and retries once — this
  // asserts both calls still resolve successfully (never a raw 500) and the
  // DB never ends up with two active rows for this user.
  it('startTimer vs startTimer (same user, first-ever start): never two active entries, no crash', async () => {
    const results = await Promise.allSettled([
      timeEntriesService.startTimer(task.id, ownerId),
      timeEntriesService.startTimer(task.id, ownerId),
    ]);

    // Every rejection must be a recognized service error, never a raw
    // unhandled exception (e.g. an uncaught Postgres unique-violation) —
    // that's the "no 500" half of the AC. Both are expected to actually
    // succeed given startTimer's retry, but this assertion holds even if
    // that internal retry strategy ever changes.
    for (const result of results) {
      if (result.status === 'rejected') {
        expect(result.reason).toBeInstanceOf(Error);
        expect(result.reason.messageKey).toBeTruthy();
      }
    }

    const activeRows = await db('time_entries').where({ user_id: ownerId }).whereNull('ended_at');
    expect(activeRows).toHaveLength(1);

    const allRows = await db('time_entries').where({ user_id: ownerId });
    // One racer's entry ends up auto-stopped by the other (in whichever
    // order the DB actually serialized them) — two rows total: one
    // completed, one active.
    expect(allRows).toHaveLength(2);
    expect(allRows.filter((row) => row.ended_at !== null)).toHaveLength(1);
  });

  // Same race this closes as attachments.service.js's insertAttachmentLocked
  // (see attachments.concurrency.test.js's "createAttachment vs deleteTask"
  // case): startTimer's getOwnedTaskWithBoard read is unlocked, so a
  // concurrent deleteTask could commit between that read and the INSERT.
  // startTimer locks the parent task row first (insertTimeEntryLocked-style,
  // mirrored inline in startTimer itself) before inserting, so this
  // resolves as a clean 404 instead of a raw FK-violation 500.
  it('startTimer vs deleteTask on the same task: clean 404, not a crash', async () => {
    const deleteTrx = await db.transaction();
    await deleteTrx('boards').where({ id: board.id }).forUpdate().first();
    await deleteTrx('tasks').where({ id: task.id }).forUpdate().first();
    await deleteTrx('tasks').where({ id: task.id }).delete();

    const startPromise = timeEntriesService.startTimer(task.id, ownerId);
    await wait(200); // let startTimer's unlocked ownership read pass and its FOR UPDATE start blocking
    await deleteTrx.commit();

    await expect(startPromise).rejects.toBeInstanceOf(NotFoundError);
    await expect(startPromise).rejects.toMatchObject({ messageKey: 'errors.task.notFound' });

    const remaining = await db('time_entries').where({ task_id: task.id });
    expect(remaining).toHaveLength(0);
  });

  // US11 AC9: "Дві одночасні PATCH/DELETE на той самий запис → один успіх,
  // другий чистий 404, без 500." Exact mirror of
  // attachments.concurrency.test.js's "deleteAttachment vs deleteAttachment"
  // case — deleteTimeEntry routes through the same lockRow-then-recheck
  // pattern (lib/db.js), so this is regression coverage for that on
  // time_entries specifically.
  it('deleteTimeEntry vs deleteTimeEntry on the same entry: one succeeds, the other gets a clean 404, not a crash', async () => {
    const entry = await createTimeEntry(task.id, ownerId);

    const results = await Promise.allSettled([
      timeEntriesService.deleteTimeEntry(task.id, entry.id, ownerId),
      timeEntriesService.deleteTimeEntry(task.id, entry.id, ownerId),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(NotFoundError);
    expect(rejected[0].reason).toMatchObject({ messageKey: 'errors.timeEntry.notFound' });

    const remaining = await db('time_entries').where({ id: entry.id }).first();
    expect(remaining).toBeUndefined();
  });

  // Same AC, different pairing: an edit racing a delete on the same entry.
  // Both calls lock the row (lockRow) before acting, so they still fully
  // serialize — but unlike delete-vs-delete, the loser's outcome depends on
  // which one wins the lock: if delete goes first, the update's lockRow
  // finds the row gone and 404s (Postgres re-evaluates a blocked
  // `SELECT ... FOR UPDATE` against the row's post-commit state); if the
  // update goes first, the delete simply deletes the now-updated row and
  // succeeds too. Either ordering is a valid, crash-free outcome — this
  // asserts exactly that (no 500, and the DB ends up in one of the two
  // consistent end states), without pinning down which racer wins.
  it('updateTimeEntry vs deleteTimeEntry on the same entry: no crash, consistent end state either way', async () => {
    const entry = await createTimeEntry(task.id, ownerId, { durationSeconds: 900 });

    const results = await Promise.allSettled([
      timeEntriesService.updateTimeEntry(task.id, entry.id, ownerId, { minutes: 20 }),
      timeEntriesService.deleteTimeEntry(task.id, entry.id, ownerId),
    ]);

    for (const result of results) {
      if (result.status === 'rejected') {
        expect(result.reason).toBeInstanceOf(NotFoundError);
        expect(result.reason).toMatchObject({ messageKey: 'errors.timeEntry.notFound' });
      }
    }

    const remaining = await db('time_entries').where({ id: entry.id }).first();
    const [updateResult, deleteResult] = results;
    if (updateResult.status === 'fulfilled') {
      // Update won the race: the row exists with the update applied, and
      // the delete (having run after) removed it — same as any single
      // successful delete of an entry that happens to have just been edited.
      expect(deleteResult.status).toBe('fulfilled');
      expect(remaining).toBeUndefined();
    } else {
      // Delete won the race: the row is gone, and the update's lockRow
      // correctly observed that instead of silently updating nothing.
      expect(remaining).toBeUndefined();
    }
  });
});
