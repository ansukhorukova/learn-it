// describe/it/expect/beforeEach/afterEach come from vitest's `globals: true`
// (see vitest.config.js) — vitest's own package can't be `require()`'d from
// this CJS backend, so they're ambient here rather than imported.
const { db, createUser, createBoard, createTask, cleanupUser, wait } = require('./helpers');
const tasksService = require('../../src/services/tasks.service');
const { NotFoundError } = require('../../src/lib/serviceErrors');

// Regression coverage for the "unlocked read -> mutation -> unchecked
// toX(row)" bug class (see backend/src/lib/db.js's header comment) as it
// applies to tasks.service.js. Runs against a real Postgres test database
// (see vitest.config.js/globalSetup.js) because the whole point is real
// row-lock/deadlock behavior between overlapping transactions, which a
// mocked DB can't reproduce.
describe('tasks concurrency', () => {
  let ownerId;
  let board;

  beforeEach(async () => {
    ownerId = await createUser();
    board = await createBoard(ownerId);
  });

  afterEach(async () => {
    await cleanupUser(ownerId);
  });

  it('createTask vs createTask into the same empty column: no position collision', async () => {
    const [a, b] = await Promise.all([
      tasksService.createTask(board.id, ownerId, { title: 'Task A' }),
      tasksService.createTask(board.id, ownerId, { title: 'Task B' }),
    ]);

    expect(a.status).toBe('planned');
    expect(b.status).toBe('planned');
    expect(a.position).not.toBe(b.position);

    const rows = await db('tasks').where({ board_id: board.id }).orderBy('position', 'asc');
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((row) => row.position)).size).toBe(2);
  });

  it('updateTask (reorder) vs updateTask (reorder) cross-column swap: no deadlock/500', async () => {
    const taskA = await createTask(board.id, ownerId, { title: 'A', status: 'planned', position: 1000 });
    const taskB = await createTask(board.id, ownerId, { title: 'B', status: 'done', position: 1000 });

    // A: planned -> done, B: done -> planned, fired concurrently. Without
    // the board-row lock (see updateTask's reorder-branch comment on why
    // it's needed), this shape of cross-column swap is exactly what can
    // deadlock (40P01) under naive per-row locking.
    const results = await Promise.allSettled([
      tasksService.updateTask(taskA.id, ownerId, { status: 'done', position: 0 }),
      tasksService.updateTask(taskB.id, ownerId, { status: 'planned', position: 0 }),
    ]);

    for (const result of results) {
      if (result.status === 'rejected') {
        throw new Error(`expected both concurrent reorders to succeed, one rejected: ${result.reason}`);
      }
    }

    const rows = await db('tasks').where({ board_id: board.id }).orderBy('id');
    expect(rows.map((row) => row.status).sort()).toEqual(['done', 'planned']);

    // No duplicate (status, position) left behind in either column.
    const seen = new Set();
    for (const row of rows) {
      const key = `${row.status}:${row.position}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('updateTask (reorder) vs deleteTask on the same task: clean 404, not a crash', async () => {
    const task = await createTask(board.id, ownerId, { status: 'planned', position: 1000 });

    // Manually drive deleteTask's own lock order (board FOR UPDATE, then
    // task FOR UPDATE, then delete) in a transaction we hold open, so the
    // concurrent updateTask call below is deterministically forced to block
    // on the same locks and observe the row gone once we commit — instead
    // of relying on Promise.all scheduling luck to land in that window.
    const deleteTrx = await db.transaction();
    await deleteTrx('boards').where({ id: board.id }).forUpdate().first();
    await deleteTrx('tasks').where({ id: task.id }).forUpdate().first();
    await deleteTrx('tasks').where({ id: task.id }).delete();

    const updatePromise = tasksService.updateTask(task.id, ownerId, { status: 'done', position: 0 });
    await wait(200); // let updateTask's unlocked read pass and its FOR UPDATE start blocking
    await deleteTrx.commit();

    await expect(updatePromise).rejects.toBeInstanceOf(NotFoundError);
    await expect(updatePromise).rejects.toMatchObject({ messageKey: 'errors.task.notFound' });

    const remaining = await db('tasks').where({ id: task.id }).first();
    expect(remaining).toBeUndefined();
  });

  it('updateTask (title-only) vs deleteTask: clean 404, not a crash', async () => {
    const task = await createTask(board.id, ownerId, { title: 'Original title' });

    const deleteTrx = await db.transaction();
    await deleteTrx('boards').where({ id: board.id }).forUpdate().first();
    await deleteTrx('tasks').where({ id: task.id }).forUpdate().first();
    await deleteTrx('tasks').where({ id: task.id }).delete();

    // This is the title-only branch (no status/position) — before this fix
    // pass it ran a bare UPDATE outside any transaction and returned
    // toTask(undefined) on a concurrent delete, crashing with a raw
    // TypeError instead of a clean 404.
    const updatePromise = tasksService.updateTask(task.id, ownerId, { title: 'Renamed while being deleted' });
    await wait(200);
    await deleteTrx.commit();

    await expect(updatePromise).rejects.toBeInstanceOf(NotFoundError);
    await expect(updatePromise).rejects.toMatchObject({ messageKey: 'errors.task.notFound' });
  });
});
