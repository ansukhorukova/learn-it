// Tester coverage for US-020 (tasks.planned_minutes) — lives under
// test/concurrency/ for the same reason as sharing.test.js/
// taskComments.test.js: vitest.config.js only includes that glob, and this
// suite needs the real Postgres connection the concurrency harness already
// sets up (globalSetup.js/env.js).
const { db, createUser, createBoard, createTask, cleanupUser } = require('./helpers');
const tasksService = require('../../src/services/tasks.service');
const boardMembersService = require('../../src/services/boardMembers.service');
const { ValidationError, ForbiddenError } = require('../../src/lib/serviceErrors');

describe('US-020 planned (estimated) minutes', () => {
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

  it('AC6: a freshly created task has plannedMinutes: null', async () => {
    const read = await tasksService.getTaskForUser(task.id, ownerId);
    expect(read.plannedMinutes).toBeNull();
  });

  it('AC2: owner can set plannedMinutes via PATCH, 200 with the value persisted', async () => {
    const updated = await tasksService.updateTask(task.id, ownerId, { plannedMinutes: 150 });
    expect(updated.plannedMinutes).toBe(150);

    const row = await db('tasks').where({ id: task.id }).first();
    expect(row.planned_minutes).toBe(150);

    const reread = await tasksService.getTaskForUser(task.id, ownerId);
    expect(reread.plannedMinutes).toBe(150);
  });

  it('AC3: explicit null is a deliberate reset back to NULL, not an error', async () => {
    await tasksService.updateTask(task.id, ownerId, { plannedMinutes: 90 });
    const cleared = await tasksService.updateTask(task.id, ownerId, { plannedMinutes: null });
    expect(cleared.plannedMinutes).toBeNull();

    const row = await db('tasks').where({ id: task.id }).first();
    expect(row.planned_minutes).toBeNull();
  });

  it('AC4: non-integer or negative values are 400 errors.task.plannedMinutesInvalid, no change applied', async () => {
    await expect(tasksService.updateTask(task.id, ownerId, { plannedMinutes: -1 })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(tasksService.updateTask(task.id, ownerId, { plannedMinutes: -1 })).rejects.toMatchObject({
      messageKey: 'errors.task.plannedMinutesInvalid',
    });
    await expect(tasksService.updateTask(task.id, ownerId, { plannedMinutes: 12.5 })).rejects.toMatchObject({
      messageKey: 'errors.task.plannedMinutesInvalid',
    });
    await expect(tasksService.updateTask(task.id, ownerId, { plannedMinutes: 'abc' })).rejects.toMatchObject({
      messageKey: 'errors.task.plannedMinutesInvalid',
    });

    const row = await db('tasks').where({ id: task.id }).first();
    expect(row.planned_minutes).toBeNull(); // unchanged — the invalid PATCH never wrote anything
  });

  it('AC5: a value over 9999 is 400 errors.task.plannedMinutesTooLarge, exactly 9999 is accepted', async () => {
    await expect(tasksService.updateTask(task.id, ownerId, { plannedMinutes: 10000 })).rejects.toMatchObject({
      messageKey: 'errors.task.plannedMinutesTooLarge',
    });

    const atLimit = await tasksService.updateTask(task.id, ownerId, { plannedMinutes: 9999 });
    expect(atLimit.plannedMinutes).toBe(9999);
  });

  it('AC8: a viewer gets 403 errors.task.readOnlyAccess trying to set plannedMinutes', async () => {
    const viewerId = await createUser();
    const viewerRow = await db('users').where({ id: viewerId }).first();
    await boardMembersService.addMember(board.id, ownerId, { email: viewerRow.email, role: 'viewer' });

    await expect(tasksService.updateTask(task.id, viewerId, { plannedMinutes: 60 })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(tasksService.updateTask(task.id, viewerId, { plannedMinutes: 60 })).rejects.toMatchObject({
      messageKey: 'errors.task.readOnlyAccess',
    });

    const row = await db('tasks').where({ id: task.id }).first();
    expect(row.planned_minutes).toBeNull();

    await cleanupUser(viewerId);
  });

  it('AC9: a caller with zero access gets 403 errors.task.forbidden', async () => {
    const strangerId = await createUser();
    await expect(tasksService.updateTask(task.id, strangerId, { plannedMinutes: 60 })).rejects.toMatchObject({
      messageKey: 'errors.task.forbidden',
    });
    await cleanupUser(strangerId);
  });

  it('a board-level collaborator can set plannedMinutes', async () => {
    const collaboratorId = await createUser();
    const collaboratorRow = await db('users').where({ id: collaboratorId }).first();
    await boardMembersService.addMember(board.id, ownerId, { email: collaboratorRow.email, role: 'collaborator' });

    const updated = await tasksService.updateTask(task.id, collaboratorId, { plannedMinutes: 45 });
    expect(updated.plannedMinutes).toBe(45);

    await cleanupUser(collaboratorId);
  });

  it('AC10: GET /boards/:id/tasks-equivalent (listTasksForBoard) surfaces plannedMinutes alongside each task', async () => {
    await tasksService.updateTask(task.id, ownerId, { plannedMinutes: 75 });
    const sibling = await createTask(board.id, ownerId, { title: 'No estimate', position: 2000 });

    const { tasks } = await tasksService.listTasksForBoard(board.id, ownerId);
    const withEstimate = tasks.find((t) => t.id === task.id);
    const withoutEstimate = tasks.find((t) => t.id === sibling.id);

    expect(withEstimate.plannedMinutes).toBe(75);
    expect(withoutEstimate.plannedMinutes).toBeNull();
  });

  it('setting plannedMinutes does not disturb title/notes/status/position, and vice versa', async () => {
    const withEstimate = await tasksService.updateTask(task.id, ownerId, { plannedMinutes: 30 });
    const renamed = await tasksService.updateTask(task.id, ownerId, { title: 'Renamed task' });
    expect(renamed.plannedMinutes).toBe(30); // untouched by a title-only PATCH
    expect(renamed.title).toBe('Renamed task');
    expect(withEstimate.title).toBe(task.title); // the plannedMinutes-only PATCH didn't touch title
  });
});
