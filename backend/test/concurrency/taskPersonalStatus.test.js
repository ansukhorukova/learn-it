// Tester coverage for US-039 (task_personal_status) — a per-user overlay of
// `tasks.status` for an authenticated visitor of a `visibility = 'public'`
// board with NO real membership, plus the widened `POST .../comments` gate.
//
// Lives under test/concurrency/ for the same reason as sharing.test.js /
// taskComments.test.js: vitest.config.js only includes that glob and these
// cases need the real Postgres connection the harness sets up (the
// idempotent upsert against a real UNIQUE constraint is exactly the kind of
// DB-level invariant this harness exists for).
const { db, createUser, createBoard, createTask, createTimeEntry, cleanupUser } = require('./helpers');
const tasksService = require('../../src/services/tasks.service');
const timeEntriesService = require('../../src/services/timeEntries.service');
const taskPersonalStatusService = require('../../src/services/taskPersonalStatus.service');
const taskCommentsService = require('../../src/services/taskComments.service');
const boardMembersService = require('../../src/services/boardMembers.service');
const taskSharesService = require('../../src/services/taskShares.service');
const { ValidationError, ForbiddenError, NotFoundError } = require('../../src/lib/serviceErrors');

async function makePublic(boardId) {
  await db('boards').where({ id: boardId }).update({ visibility: 'public' });
}

async function emailOf(userId) {
  const row = await db('users').where({ id: userId }).first();
  return row.email;
}

describe('US-039 task_personal_status (personal status on public boards)', () => {
  let ownerId;
  let visitorId;
  let board;
  let task;

  beforeEach(async () => {
    ownerId = await createUser();
    visitorId = await createUser();
    board = await createBoard(ownerId);
    task = await createTask(board.id, ownerId, { status: 'done' }); // owner marked it done
  });

  afterEach(async () => {
    await cleanupUser(ownerId);
    await cleanupUser(visitorId);
  });

  it('AC2: public visitor with no row sees status=planned (overlay fallback), not the owner\'s shared status', async () => {
    await makePublic(board.id);
    const { tasks } = await tasksService.listTasksForBoard(board.id, visitorId);
    const t = tasks.find((x) => x.id === task.id);
    expect(t.myRole).toBe('public');
    expect(t.status).toBe('planned'); // NOT 'done'
  });

  it('AC2/AC7: after PUT my-status the overlay persists and is returned on the next GET', async () => {
    await makePublic(board.id);
    const res = await taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'in_progress' });
    expect(res).toMatchObject({ taskId: task.id, status: 'in_progress' });
    expect(res.updatedAt).toBeTruthy();

    const { tasks } = await tasksService.listTasksForBoard(board.id, visitorId);
    expect(tasks.find((x) => x.id === task.id).status).toBe('in_progress');

    const detail = await tasksService.getTaskForUser(task.id, visitorId);
    expect(detail.status).toBe('in_progress'); // AC3
  });

  it('AC1: PUT my-status never mutates the shared tasks.status', async () => {
    await makePublic(board.id);
    await taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'planned' });
    const row = await db('tasks').where({ id: task.id }).first();
    expect(row.status).toBe('done'); // owner's shared status untouched
  });

  it('AC4: a real board member (viewer) always gets the shared status, never an overlay', async () => {
    await makePublic(board.id);
    const memberId = await createUser();
    await boardMembersService.addMember(board.id, ownerId, { email: await emailOf(memberId), role: 'viewer' });

    // Even if a stray personal_status row somehow exists, a real member ignores it.
    await db('task_personal_status').insert({ task_id: task.id, user_id: memberId, status: 'planned' });

    const { tasks } = await tasksService.listTasksForBoard(board.id, memberId);
    const t = tasks.find((x) => x.id === task.id);
    expect(t.myRole).toBe('viewer');
    expect(t.status).toBe('done'); // shared, not the overlay row

    const detail = await tasksService.getTaskForUser(task.id, memberId);
    expect(detail.status).toBe('done');

    await db('task_personal_status').where({ user_id: memberId }).delete();
    await cleanupUser(memberId);
  });

  it('AC5: mixed board — a task_shares grant on one task shows shared status, the rest are overlay', async () => {
    await makePublic(board.id);
    const other = await createTask(board.id, ownerId, { status: 'in_progress', position: 2000 });

    // visitor is task-shared (viewer) on `task` only, no board membership.
    await taskSharesService.addShare(task.id, ownerId, { email: await emailOf(visitorId), role: 'viewer' });

    await taskPersonalStatusService.setMyStatus(other.id, visitorId, { status: 'done' });

    const { tasks } = await tasksService.listTasksForBoard(board.id, visitorId);
    const shared = tasks.find((x) => x.id === task.id);
    const overlay = tasks.find((x) => x.id === other.id);

    expect(shared.myRole).toBe('viewer');
    expect(shared.status).toBe('done'); // shared tasks.status

    expect(overlay.myRole).toBe('public');
    expect(overlay.status).toBe('done'); // personal overlay (owner's is 'in_progress')

    // Sanity: the task-shared task got no overlay applied even if a row existed.
    await taskPersonalStatusService.setMyStatus(other.id, visitorId, { status: 'planned' });
    const { tasks: again } = await tasksService.listTasksForBoard(board.id, visitorId);
    expect(again.find((x) => x.id === task.id).status).toBe('done'); // still shared
  });

  it('AC6/AC7: upsert is idempotent and race-safe — concurrent PUTs land as exactly one row', async () => {
    await makePublic(board.id);
    const results = await Promise.all([
      taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'in_progress' }),
      taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'done' }),
      taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'planned' }),
    ]);
    expect(results).toHaveLength(3);

    const rows = await db('task_personal_status').where({ task_id: task.id, user_id: visitorId });
    expect(rows).toHaveLength(1);
    expect(['planned', 'in_progress', 'done']).toContain(rows[0].status);
  });

  it('AC7: a repeated PUT updates the row in place and bumps updated_at', async () => {
    await makePublic(board.id);
    const first = await taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'in_progress' });
    await new Promise((resolve) => setTimeout(resolve, 15));
    const second = await taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'done' });

    const rows = await db('task_personal_status').where({ task_id: task.id, user_id: visitorId });
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('done');
    expect(new Date(second.updatedAt).getTime()).toBeGreaterThan(new Date(first.updatedAt).getTime());
  });

  it('AC8: an invalid or missing status is 400 errors.task.invalidStatus', async () => {
    await makePublic(board.id);
    await expect(taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'archived' })).rejects.toMatchObject(
      { messageKey: 'errors.task.invalidStatus' },
    );
    await expect(taskPersonalStatusService.setMyStatus(task.id, visitorId, {})).rejects.toBeInstanceOf(ValidationError);
  });

  it('AC9: owner, collaborator and a real viewer all get 403 errors.task.personalStatusNotApplicable', async () => {
    await makePublic(board.id);
    const collaboratorId = await createUser();
    const realViewerId = await createUser();
    await boardMembersService.addMember(board.id, ownerId, { email: await emailOf(collaboratorId), role: 'collaborator' });
    await boardMembersService.addMember(board.id, ownerId, { email: await emailOf(realViewerId), role: 'viewer' });

    for (const uid of [ownerId, collaboratorId, realViewerId]) {
      // eslint-disable-next-line no-await-in-loop
      await expect(taskPersonalStatusService.setMyStatus(task.id, uid, { status: 'done' })).rejects.toMatchObject({
        messageKey: 'errors.task.personalStatusNotApplicable',
      });
    }
    const rows = await db('task_personal_status').where({ task_id: task.id });
    expect(rows).toHaveLength(0);

    await cleanupUser(collaboratorId);
    await cleanupUser(realViewerId);
  });

  it('AC10: no access at all -> 403 forbidden; unknown/invalid task -> 404 notFound', async () => {
    // board is still private here
    await expect(taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'done' })).rejects.toMatchObject({
      messageKey: 'errors.task.forbidden',
    });
    await expect(
      taskPersonalStatusService.setMyStatus('00000000-0000-0000-0000-000000000000', visitorId, { status: 'done' }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      taskPersonalStatusService.setMyStatus('not-a-uuid', visitorId, { status: 'done' }),
    ).rejects.toMatchObject({ messageKey: 'errors.task.notFound' });
  });

  it('AC12: columnTotals reflect the visitor\'s personal status, not the owner\'s', async () => {
    await makePublic(board.id);
    // Visitor logs 10 minutes on the task the owner has in "done".
    await createTimeEntry(task.id, visitorId, { durationSeconds: 600 });
    // Visitor's personal status for it is still 'planned' (no overlay set yet).

    // Replicates boards.route.js GET /boards/:id/tasks exactly: resolve the
    // task list (service), merge each task's own tracked seconds, then reduce
    // columnTotals over the RESOLVED status.
    async function columnTotalsFor(uid) {
      const { tasks } = await tasksService.listTasksForBoard(board.id, uid);
      const timeTotals = await timeEntriesService.timeTotalsForTasks(
        tasks.map((x) => x.id),
        uid,
      );
      const ct = { planned: 0, in_progress: 0, done: 0 };
      tasks.forEach((x) => {
        ct[x.status] += timeTotals.get(x.id) || 0;
      });
      return { tasks, ct };
    }

    const before = await columnTotalsFor(visitorId);
    expect(before.tasks.find((x) => x.id === task.id).status).toBe('planned');
    expect(before.ct.planned).toBe(600);
    expect(before.ct.done).toBe(0);

    // Move it to the visitor's personal "done" -> totals follow.
    await taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'done' });
    const after = await columnTotalsFor(visitorId);
    expect(after.ct.done).toBe(600);
    expect(after.ct.planned).toBe(0);
  });

  it('AC14: the owner never sees a visitor\'s overlay row in any read', async () => {
    await makePublic(board.id);
    await taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'in_progress' });

    const { tasks } = await tasksService.listTasksForBoard(board.id, ownerId);
    const t = tasks.find((x) => x.id === task.id);
    expect(t.myRole).toBe('owner');
    expect(t.status).toBe('done'); // owner's own shared status, no leak of the 'in_progress' overlay

    const detail = await tasksService.getTaskForUser(task.id, ownerId);
    expect(detail.status).toBe('done');
  });

  it('AC15/AC16: a public visitor CAN comment; a real board viewer gets 403 readOnlyAccess', async () => {
    await makePublic(board.id);
    const comment = await taskCommentsService.createComment(task.id, visitorId, { body: 'Question about step 2?' });
    expect(comment.authorId).toBe(visitorId);
    expect(comment.body).toBe('Question about step 2?');

    const realViewerId = await createUser();
    await boardMembersService.addMember(board.id, ownerId, { email: await emailOf(realViewerId), role: 'viewer' });
    await expect(taskCommentsService.createComment(task.id, realViewerId, { body: 'nope' })).rejects.toMatchObject({
      messageKey: 'errors.task.readOnlyAccess',
    });

    // The comment is in the shared list for everyone with access.
    const asOwner = await taskCommentsService.listComments(task.id, ownerId);
    expect(asOwner.map((c) => c.body)).toContain('Question about step 2?');

    await cleanupUser(realViewerId);
  });

  it('AC17: a user with no access to the task cannot comment (403 forbidden)', async () => {
    // board private, visitor has no membership
    await expect(taskCommentsService.createComment(task.id, visitorId, { body: 'hi' })).rejects.toMatchObject({
      messageKey: 'errors.task.forbidden',
    });
  });

  it('AC19: flipping public -> private revokes access immediately; the overlay rows are kept', async () => {
    await makePublic(board.id);
    await taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'done' });

    await db('boards').where({ id: board.id }).update({ visibility: 'private' });

    await expect(tasksService.listTasksForBoard(board.id, visitorId)).rejects.toMatchObject({
      messageKey: 'errors.board.forbidden',
    });
    await expect(taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'planned' })).rejects.toMatchObject({
      messageKey: 'errors.task.forbidden',
    });
    await expect(taskCommentsService.createComment(task.id, visitorId, { body: 'still here?' })).rejects.toMatchObject({
      messageKey: 'errors.task.forbidden',
    });

    const rows = await db('task_personal_status').where({ task_id: task.id, user_id: visitorId });
    expect(rows).toHaveLength(1); // NOT wiped

    // Flip back — the old overlay is still there.
    await makePublic(board.id);
    const detail = await tasksService.getTaskForUser(task.id, visitorId);
    expect(detail.status).toBe('done');
  });

  it('AC20: deleting the task cascades away its personal-status rows', async () => {
    await makePublic(board.id);
    await taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'done' });
    expect(await db('task_personal_status').where({ task_id: task.id })).toHaveLength(1);

    await db('tasks').where({ id: task.id }).delete();
    expect(await db('task_personal_status').where({ task_id: task.id })).toHaveLength(0);
  });

  it('AC20: deleting the BOARD cascades (tasks -> personal-status) away its rows', async () => {
    await makePublic(board.id);
    await taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'done' });
    expect(await db('task_personal_status').where({ task_id: task.id })).toHaveLength(1);

    await db('boards').where({ id: board.id }).delete();
    expect(await db('task_personal_status').where({ task_id: task.id })).toHaveLength(0);

    // Rebuild board/task so afterEach cleanup + other state stays consistent.
    board = await createBoard(ownerId);
    task = await createTask(board.id, ownerId, { status: 'done' });
  });

  it('AC20: deleting the user cascades away their personal-status rows', async () => {
    await makePublic(board.id);
    await taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'done' });
    await cleanupUser(visitorId);
    expect(await db('task_personal_status').where({ user_id: visitorId })).toHaveLength(0);
    visitorId = await createUser(); // restore so afterEach cleanup is a no-op-safe
  });

  it('AC14: a real COLLABORATOR never sees another visitor\'s overlay — not the resolved status, not a raw row', async () => {
    await makePublic(board.id);
    const collaboratorId = await createUser();
    await boardMembersService.addMember(board.id, ownerId, {
      email: await emailOf(collaboratorId),
      role: 'collaborator',
    });

    // Visitor B sets a personal overlay on the task.
    await taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'in_progress' });

    // Collaborator C reads the board + the task detail — must see the SHARED
    // tasks.status ('done'), never visitor B's 'in_progress' overlay.
    const { tasks } = await tasksService.listTasksForBoard(board.id, collaboratorId);
    const t = tasks.find((x) => x.id === task.id);
    expect(t.myRole).toBe('collaborator');
    expect(t.status).toBe('done');

    const detail = await tasksService.getTaskForUser(task.id, collaboratorId);
    expect(detail.status).toBe('done');

    // And the read-resolve helper, called directly with C's id, never returns B's row.
    const map = await taskPersonalStatusService.getPersonalStatuses([task.id], collaboratorId);
    expect(map.size).toBe(0);
    expect(await taskPersonalStatusService.getPersonalStatus(task.id, collaboratorId)).toBeNull();

    await db('task_personal_status').where({ user_id: visitorId }).delete();
    await cleanupUser(collaboratorId);
  });

  it('AC11: PATCH /tasks/:id (shared status) from a public visitor stays 403 readOnlyAccess and writes no overlay', async () => {
    await makePublic(board.id);
    await expect(
      tasksService.updateTask(task.id, visitorId, { status: 'in_progress', position: 0 }),
    ).rejects.toMatchObject({ messageKey: 'errors.task.readOnlyAccess' });

    const row = await db('tasks').where({ id: task.id }).first();
    expect(row.status).toBe('done'); // shared status untouched
    expect(await db('task_personal_status').where({ task_id: task.id })).toHaveLength(0);
  });

  it('AC9: a task_shares-only real viewer also gets 403 personalStatusNotApplicable on PUT my-status', async () => {
    await makePublic(board.id);
    await taskSharesService.addShare(task.id, ownerId, { email: await emailOf(visitorId), role: 'viewer' });
    await expect(
      taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'done' }),
    ).rejects.toMatchObject({ messageKey: 'errors.task.personalStatusNotApplicable' });
  });

  it('AC18: a public visitor can GET the shared comments list unchanged', async () => {
    await makePublic(board.id);
    await taskCommentsService.createComment(task.id, ownerId, { body: 'Owner note on the material' });
    const asVisitor = await taskCommentsService.listComments(task.id, visitorId);
    expect(asVisitor.map((c) => c.body)).toContain('Owner note on the material');
  });

  it('AC12 (route parity): columnTotals leak nothing to the owner from a visitor overlay', async () => {
    await makePublic(board.id);
    await createTimeEntry(task.id, visitorId, { durationSeconds: 600 });
    await taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'done' });

    // Owner's own view: no visitor time, shared status 'done', and the
    // visitor's overlay must not have moved anything for the owner.
    const { tasks } = await tasksService.listTasksForBoard(board.id, ownerId);
    const timeTotals = await timeEntriesService.timeTotalsForTasks(tasks.map((x) => x.id), ownerId);
    const ct = { planned: 0, in_progress: 0, done: 0 };
    tasks.forEach((x) => {
      ct[x.status] += timeTotals.get(x.id) || 0;
    });
    expect(ct).toEqual({ planned: 0, in_progress: 0, done: 0 }); // owner logged nothing
    expect(tasks.find((x) => x.id === task.id).status).toBe('done');

    await db('task_personal_status').where({ user_id: visitorId }).delete();
    await db('time_entries').where({ user_id: visitorId }).delete();
  });

  it('DB-level unique (task_id, user_id): a raw duplicate insert is rejected', async () => {
    await makePublic(board.id);
    await taskPersonalStatusService.setMyStatus(task.id, visitorId, { status: 'done' });
    await expect(
      db('task_personal_status').insert({ task_id: task.id, user_id: visitorId, status: 'planned' }),
    ).rejects.toThrow(/unique|duplicate/i);
  });
});
