// Tester coverage for US-034 (task_comments replies, 3-level flatten) — the
// exact parentCommentId/replyToCommentId values the flatten algorithm
// (taskComments.service.js's resolveReplyTarget) must produce at each
// level, plus the cross-task/nonexistent-target and read-only-role error
// paths. Lives under test/concurrency/ for the same reason as
// taskComments.test.js — needs the real Postgres connection the
// concurrency harness sets up.
const { db, createUser, createBoard, createTask, cleanupUser } = require('./helpers');
const taskCommentsService = require('../../src/services/taskComments.service');
const boardMembersService = require('../../src/services/boardMembers.service');
const { ValidationError, ForbiddenError } = require('../../src/lib/serviceErrors');

describe('US-034 task comment replies (3-level flatten)', () => {
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

  it('AC4: a comment with no replyToCommentId is level 1 — both fields null', async () => {
    const level1 = await taskCommentsService.createComment(task.id, ownerId, { body: 'Level 1' });
    expect(level1.parentCommentId).toBeNull();
    expect(level1.replyToCommentId).toBeNull();
  });

  it('AC1-3: replying to level 1, then level 2, then level 3 produces the exact documented parent/replyTo values at each step', async () => {
    const level1 = await taskCommentsService.createComment(task.id, ownerId, { body: 'Level 1' });

    // AC1: reply to level 1 -> level 2, parent = replyTo = level1.id.
    const level2 = await taskCommentsService.createComment(task.id, ownerId, {
      body: 'Level 2',
      replyToCommentId: level1.id,
    });
    expect(level2.parentCommentId).toBe(level1.id);
    expect(level2.replyToCommentId).toBe(level1.id);

    // AC2: reply to level 2 -> level 3, parent = replyTo = level2.id.
    const level3 = await taskCommentsService.createComment(task.id, ownerId, {
      body: 'Level 3',
      replyToCommentId: level2.id,
    });
    expect(level3.parentCommentId).toBe(level2.id);
    expect(level3.replyToCommentId).toBe(level2.id);

    // AC3: reply to level 3 -> FLATTENS to a sibling under level2 (the
    // level-3 comment's own parent), NOT a level 4. replyToCommentId names
    // the exact level-3 comment clicked, not the level-2 grandparent.
    const flattened = await taskCommentsService.createComment(task.id, ownerId, {
      body: 'Reply to level 3',
      replyToCommentId: level3.id,
    });
    expect(flattened.parentCommentId).toBe(level2.id); // same level-2 parent as level3, sibling not child
    expect(flattened.replyToCommentId).toBe(level3.id); // exact target preserved for the UI quote

    // A second reply to the SAME level-3 comment flattens the same way —
    // both flattened siblings share parentCommentId, differ only in which
    // exact level-3 comment they quote (AC10's "кожен зі своєю цитатою").
    const secondFlattened = await taskCommentsService.createComment(task.id, ownerId, {
      body: 'Another reply to level 3',
      replyToCommentId: level3.id,
    });
    expect(secondFlattened.parentCommentId).toBe(level2.id);
    expect(secondFlattened.replyToCommentId).toBe(level3.id);

    // AC3: replying to an ALREADY-FLATTENED sibling (itself a level-3
    // depth, parent_comment_id = level2.id, i.e. NOT NULL and its own
    // parent's parent_comment_id (level1) IS NULL) must flatten identically
    // — sibling under level2, never level 4.
    const replyToFlattened = await taskCommentsService.createComment(task.id, ownerId, {
      body: 'Reply to a flattened sibling',
      replyToCommentId: flattened.id,
    });
    expect(replyToFlattened.parentCommentId).toBe(level2.id);
    expect(replyToFlattened.replyToCommentId).toBe(flattened.id);

    // GET returns the flat array with both fields intact (AC9) — no nested
    // JSON tree, FE builds the tree client-side from parentCommentId chains.
    const list = await taskCommentsService.listComments(task.id, ownerId);
    const byBody = Object.fromEntries(list.map((c) => [c.body, c]));
    expect(byBody['Level 1'].parentCommentId).toBeNull();
    expect(byBody['Level 2'].parentCommentId).toBe(level1.id);
    expect(byBody['Level 3'].parentCommentId).toBe(level2.id);
    expect(byBody['Reply to level 3'].parentCommentId).toBe(level2.id);
    expect(byBody['Reply to level 3'].replyToCommentId).toBe(level3.id);
  });

  it('AC7: replyToCommentId that does not exist is 400 errors.comment.replyTargetInvalid, comment not created', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    await expect(
      taskCommentsService.createComment(task.id, ownerId, { body: 'Nope', replyToCommentId: fakeId }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      taskCommentsService.createComment(task.id, ownerId, { body: 'Nope', replyToCommentId: fakeId }),
    ).rejects.toMatchObject({ messageKey: 'errors.comment.replyTargetInvalid' });

    const rows = await db('task_comments').where({ task_id: task.id, body: 'Nope' });
    expect(rows).toHaveLength(0);
  });

  it('AC7: replyToCommentId belonging to ANOTHER task is 400 errors.comment.replyTargetInvalid', async () => {
    const otherTask = await createTask(board.id, ownerId, { title: 'Other task', position: 2000 });
    const otherComment = await taskCommentsService.createComment(otherTask.id, ownerId, { body: 'On other task' });

    await expect(
      taskCommentsService.createComment(task.id, ownerId, { body: 'Nope', replyToCommentId: otherComment.id }),
    ).rejects.toMatchObject({ messageKey: 'errors.comment.replyTargetInvalid' });
  });

  it('AC7: a malformed (non-uuid) replyToCommentId is also 400 errors.comment.replyTargetInvalid, not a 500', async () => {
    await expect(
      taskCommentsService.createComment(task.id, ownerId, { body: 'Nope', replyToCommentId: 'not-a-uuid' }),
    ).rejects.toMatchObject({ messageKey: 'errors.comment.replyTargetInvalid' });
  });

  it('AC8: a viewer gets 403 errors.task.readOnlyAccess posting a reply, regardless of the target depth', async () => {
    const viewerId = await createUser();
    const viewerRow = await db('users').where({ id: viewerId }).first();
    await boardMembersService.addMember(board.id, ownerId, { email: viewerRow.email, role: 'viewer' });

    const level1 = await taskCommentsService.createComment(task.id, ownerId, { body: 'Level 1' });
    const level2 = await taskCommentsService.createComment(task.id, ownerId, {
      body: 'Level 2',
      replyToCommentId: level1.id,
    });

    await expect(
      taskCommentsService.createComment(task.id, viewerId, { body: 'Nope', replyToCommentId: level2.id }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      taskCommentsService.createComment(task.id, viewerId, { body: 'Nope', replyToCommentId: level2.id }),
    ).rejects.toMatchObject({ messageKey: 'errors.task.readOnlyAccess' });

    await cleanupUser(viewerId);
  });

  it('AC11: reply body validation is identical to a normal comment (empty -> bodyRequired, >2000 -> bodyTooLong)', async () => {
    const level1 = await taskCommentsService.createComment(task.id, ownerId, { body: 'Level 1' });

    await expect(
      taskCommentsService.createComment(task.id, ownerId, { body: '   ', replyToCommentId: level1.id }),
    ).rejects.toMatchObject({ messageKey: 'errors.comment.bodyRequired' });

    await expect(
      taskCommentsService.createComment(task.id, ownerId, {
        body: 'x'.repeat(2001),
        replyToCommentId: level1.id,
      }),
    ).rejects.toMatchObject({ messageKey: 'errors.comment.bodyTooLong' });

    const rows = await db('task_comments').where({ task_id: task.id }).whereNot({ id: level1.id });
    expect(rows).toHaveLength(0);
  });

  it('AC9: a plain (non-reply) comment returns parentCommentId/replyToCommentId as null in the GET list', async () => {
    await taskCommentsService.createComment(task.id, ownerId, { body: 'Plain' });
    const list = await taskCommentsService.listComments(task.id, ownerId);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ parentCommentId: null, replyToCommentId: null });
  });

  it('AC12: deleting the task cascades comments of all levels, including the reply fields', async () => {
    const level1 = await taskCommentsService.createComment(task.id, ownerId, { body: 'Level 1' });
    const level2 = await taskCommentsService.createComment(task.id, ownerId, {
      body: 'Level 2',
      replyToCommentId: level1.id,
    });

    await db('tasks').where({ id: task.id }).delete();

    const remaining = await db('task_comments').where({ task_id: task.id });
    expect(remaining).toHaveLength(0);
    const gone = await db('task_comments').whereIn('id', [level1.id, level2.id]);
    expect(gone).toHaveLength(0);
  });
});
