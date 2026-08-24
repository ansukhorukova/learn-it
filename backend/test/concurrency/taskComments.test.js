// Tester coverage for US-019 (task_comments) — lives under test/concurrency/
// (not a new top-level test/ dir) for the same reason as sharing.test.js:
// vitest.config.js only includes that glob, and this suite needs the real
// Postgres connection the concurrency harness already sets up (see
// globalSetup.js/env.js), even though most cases here are plain
// authorization/validation checks, not lock-race regressions.
const { db, createUser, createBoard, createTask, cleanupUser } = require('./helpers');
const taskCommentsService = require('../../src/services/taskComments.service');
const boardMembersService = require('../../src/services/boardMembers.service');
const taskSharesService = require('../../src/services/taskShares.service');
const { ValidationError, ForbiddenError, NotFoundError } = require('../../src/lib/serviceErrors');

describe('US-019 task comments', () => {
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

  it('AC2: owner can post a comment, 201 shape includes authorId/authorName/body/createdAt', async () => {
    const comment = await taskCommentsService.createComment(task.id, ownerId, { body: '  First comment  ' });
    expect(comment.taskId).toBe(task.id);
    expect(comment.authorId).toBe(ownerId);
    expect(comment.body).toBe('First comment'); // trimmed
    expect(comment.authorName).toBeTruthy();
    expect(comment.createdAt).toBeTruthy();

    const row = await db('task_comments').where({ id: comment.id }).first();
    expect(row.task_id).toBe(task.id);
    expect(row.author_id).toBe(ownerId);
    expect(row.body).toBe('First comment');
  });

  it('AC1/AC7: comments are listed oldest-first and are visible to every role — shared, not privacy-scoped like time_entries', async () => {
    const collaboratorId = await createUser();
    const collaboratorRow = await db('users').where({ id: collaboratorId }).first();
    await boardMembersService.addMember(board.id, ownerId, { email: collaboratorRow.email, role: 'collaborator' });

    const viewerId = await createUser();
    const viewerRow = await db('users').where({ id: viewerId }).first();
    await boardMembersService.addMember(board.id, ownerId, { email: viewerRow.email, role: 'viewer' });

    await taskCommentsService.createComment(task.id, ownerId, { body: 'First' });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await taskCommentsService.createComment(task.id, collaboratorId, { body: 'Second' });

    const asOwner = await taskCommentsService.listComments(task.id, ownerId);
    const asCollaborator = await taskCommentsService.listComments(task.id, collaboratorId);
    const asViewer = await taskCommentsService.listComments(task.id, viewerId);

    for (const list of [asOwner, asCollaborator, asViewer]) {
      expect(list.map((c) => c.body)).toEqual(['First', 'Second']); // oldest first
    }

    await cleanupUser(collaboratorId);
    await cleanupUser(viewerId);
  });

  it('AC1/AC7: a comment added via a task_shares-only grant is visible to the board owner too (shared, not per-author)', async () => {
    const recipientId = await createUser();
    const recipientRow = await db('users').where({ id: recipientId }).first();
    await taskSharesService.addShare(task.id, ownerId, { email: recipientRow.email, role: 'collaborator' });

    const posted = await taskCommentsService.createComment(task.id, recipientId, { body: 'Shared-task comment' });

    const ownerView = await taskCommentsService.listComments(task.id, ownerId);
    expect(ownerView.find((c) => c.id === posted.id)).toBeDefined();

    await cleanupUser(recipientId);
  });

  it('AC3: a viewer can read but gets 403 errors.task.readOnlyAccess trying to post', async () => {
    const viewerId = await createUser();
    const viewerRow = await db('users').where({ id: viewerId }).first();
    await boardMembersService.addMember(board.id, ownerId, { email: viewerRow.email, role: 'viewer' });
    await taskCommentsService.createComment(task.id, ownerId, { body: 'Visible to viewer' });

    const list = await taskCommentsService.listComments(task.id, viewerId);
    expect(list).toHaveLength(1);

    await expect(taskCommentsService.createComment(task.id, viewerId, { body: 'Nope' })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(taskCommentsService.createComment(task.id, viewerId, { body: 'Nope' })).rejects.toMatchObject({
      messageKey: 'errors.task.readOnlyAccess',
    });

    // Rejected post never made it into the table.
    const rows = await db('task_comments').where({ task_id: task.id, author_id: viewerId });
    expect(rows).toHaveLength(0);

    await cleanupUser(viewerId);
  });

  it('AC6: a caller with zero access gets 403 errors.task.forbidden on both GET and POST', async () => {
    const strangerId = await createUser();

    await expect(taskCommentsService.listComments(task.id, strangerId)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(taskCommentsService.listComments(task.id, strangerId)).rejects.toMatchObject({
      messageKey: 'errors.task.forbidden',
    });
    await expect(
      taskCommentsService.createComment(task.id, strangerId, { body: 'Nope' }),
    ).rejects.toMatchObject({ messageKey: 'errors.task.forbidden' });

    await cleanupUser(strangerId);
  });

  it('AC4: empty or whitespace-only body is 400 errors.comment.bodyRequired', async () => {
    await expect(taskCommentsService.createComment(task.id, ownerId, { body: '' })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(taskCommentsService.createComment(task.id, ownerId, { body: '   ' })).rejects.toMatchObject({
      messageKey: 'errors.comment.bodyRequired',
    });
    await expect(taskCommentsService.createComment(task.id, ownerId, {})).rejects.toMatchObject({
      messageKey: 'errors.comment.bodyRequired',
    });
  });

  it('AC5: a body over 2000 characters is 400 errors.comment.bodyTooLong', async () => {
    const tooLong = 'a'.repeat(2001);
    await expect(taskCommentsService.createComment(task.id, ownerId, { body: tooLong })).rejects.toMatchObject({
      messageKey: 'errors.comment.bodyTooLong',
    });

    const exactly2000 = 'a'.repeat(2000);
    const ok = await taskCommentsService.createComment(task.id, ownerId, { body: exactly2000 });
    expect(ok.body).toHaveLength(2000);
  });

  it('AC9: deleting a task cascades its task_comments', async () => {
    const comment = await taskCommentsService.createComment(task.id, ownerId, { body: 'Will be cascaded' });
    await db('tasks').where({ id: task.id }).delete();

    const remaining = await db('task_comments').where({ id: comment.id });
    expect(remaining).toHaveLength(0);
  });

  it('a nonexistent task id 404s on both GET and POST (errors.task.notFound)', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    await expect(taskCommentsService.listComments(fakeId, ownerId)).rejects.toBeInstanceOf(NotFoundError);
    await expect(taskCommentsService.listComments(fakeId, ownerId)).rejects.toMatchObject({
      messageKey: 'errors.task.notFound',
    });
    await expect(taskCommentsService.createComment(fakeId, ownerId, { body: 'Nope' })).rejects.toMatchObject({
      messageKey: 'errors.task.notFound',
    });
  });
});
