// describe/it/expect/beforeEach/afterEach come from vitest's `globals: true`
// (see vitest.config.js) — vitest's own package can't be `require()`'d from
// this CJS backend, so they're ambient here rather than imported.
const { db, createUser, createBoard, createTask, cleanupUser, wait } = require('./helpers');
const boardsService = require('../../src/services/boards.service');
const tasksService = require('../../src/services/tasks.service');
const { NotFoundError } = require('../../src/lib/serviceErrors');

// Regression coverage for the "unlocked read -> mutation -> unchecked
// toX(row)" bug class as it applies to boards.service.js, and to
// tasks.service.js's updateTask when the *board* (not the task) disappears
// mid-request. See backend/src/lib/db.js's header comment for the full
// history — updateBoard is the "silent 200 with garbage data" variant of
// this bug, which is worse than the crash variant since the client gets no
// signal anything went wrong.
describe('boards concurrency', () => {
  let ownerId;
  let board;

  beforeEach(async () => {
    ownerId = await createUser();
    board = await createBoard(ownerId);
  });

  afterEach(async () => {
    await cleanupUser(ownerId);
  });

  it('updateTask (reorder) vs deleteBoard on the parent board: clean 404, not a crash', async () => {
    const task = await createTask(board.id, ownerId, { status: 'planned', position: 1000 });

    // Manually drive deleteBoard's own lock order (board FOR UPDATE, then
    // delete — tasks cascade at the DB level via ON DELETE CASCADE) in a
    // transaction held open, so updateTask's board-row lock deterministically
    // blocks on it and then observes the board gone once we commit.
    const deleteTrx = await db.transaction();
    await deleteTrx('boards').where({ id: board.id }).forUpdate().first();
    await deleteTrx('boards').where({ id: board.id }).delete();

    const updatePromise = tasksService.updateTask(task.id, ownerId, { status: 'done', position: 0 });
    await wait(200);
    await deleteTrx.commit();

    await expect(updatePromise).rejects.toBeInstanceOf(NotFoundError);
    await expect(updatePromise).rejects.toMatchObject({ messageKey: 'errors.board.notFound' });

    const remainingBoard = await db('boards').where({ id: board.id }).first();
    expect(remainingBoard).toBeUndefined();
    const remainingTask = await db('tasks').where({ id: task.id }).first();
    expect(remainingTask).toBeUndefined(); // cascade-deleted with the board
  });

  it('updateBoard vs deleteBoard: clean 404, not a silent-garbage 200', async () => {
    const deleteTrx = await db.transaction();
    await deleteTrx('boards').where({ id: board.id }).forUpdate().first();
    await deleteTrx('boards').where({ id: board.id }).delete();

    // Before this fix pass, updateBoard ran a bare UPDATE outside any
    // transaction and spread the (possibly `undefined`, on a concurrent
    // delete) result into toBoardSummary — resolving with a garbage object
    // instead of rejecting. Assert the rejection explicitly rather than
    // just "doesn't throw a TypeError", since a silent resolve is exactly
    // the failure mode being regression-tested here.
    const updatePromise = boardsService.updateBoard(board.id, ownerId, { title: 'Renamed while being deleted' });
    await wait(200);
    await deleteTrx.commit();

    let rejected = false;
    try {
      const result = await updatePromise;
      throw new Error(`expected updateBoard to reject with NotFoundError, but it resolved with: ${JSON.stringify(result)}`);
    } catch (err) {
      rejected = true;
      expect(err).toBeInstanceOf(NotFoundError);
      expect(err.messageKey).toBe('errors.board.notFound');
    }
    expect(rejected).toBe(true);
  });
});
