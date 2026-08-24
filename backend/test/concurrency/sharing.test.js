// Tester coverage for US13-US17 (board_members/task_shares sharing) that the
// fullstack-developer's existing suite doesn't touch — that suite only has
// lock-race regression tests for boards/tasks/attachments/timeEntries, none
// of which exercise board_members/task_shares at all. Lives under
// test/concurrency/ (not a new top-level test/ dir) because vitest.config.js
// only includes that glob, and several cases here genuinely do need the real
// Postgres transaction/locking behavior the concurrency harness already sets
// up (see globalSetup.js/env.js) — not because every case below is itself a
// race.
const { db, createUser, createBoard, createTask, cleanupUser, wait } = require('./helpers');
const boardsService = require('../../src/services/boards.service');
const tasksService = require('../../src/services/tasks.service');
const attachmentsService = require('../../src/services/attachments.service');
const timeEntriesService = require('../../src/services/timeEntries.service');
const boardMembersService = require('../../src/services/boardMembers.service');
const taskSharesService = require('../../src/services/taskShares.service');
const { ForbiddenError, NotFoundError, ValidationError } = require('../../src/lib/serviceErrors');

describe('US13-US17 board/task sharing', () => {
  let ownerId;
  let ownerEmail;
  let board;

  beforeEach(async () => {
    ownerId = await createUser();
    const ownerRow = await db('users').where({ id: ownerId }).first();
    ownerEmail = ownerRow.email;
    board = await createBoard(ownerId);
  });

  afterEach(async () => {
    await cleanupUser(ownerId);
  });

  // ---------------------------------------------------------------------
  // US14: a task-share must never leak the rest of the parent board.
  // ---------------------------------------------------------------------
  describe('US14 — task share does not leak the parent board', () => {
    it('recipient can read the shared task but not list the board\'s tasks or read the board', async () => {
      const recipientId = await createUser();
      const recipientRow = await db('users').where({ id: recipientId }).first();
      const task = await createTask(board.id, ownerId);
      await createTask(board.id, ownerId, { title: 'Sibling task, never shared', position: 2000 });

      await taskSharesService.addShare(task.id, ownerId, { email: recipientRow.email, role: 'viewer' });

      // The recipient CAN read the one task they were shared.
      const readTask = await tasksService.getTaskForUser(task.id, recipientId);
      expect(readTask.id).toBe(task.id);
      expect(readTask.myRole).toBe('viewer');

      // The recipient CANNOT list the board's tasks (would leak the sibling
      // task they were never shared) ...
      await expect(tasksService.listTasksForBoard(board.id, recipientId)).rejects.toBeInstanceOf(ForbiddenError);
      await expect(tasksService.listTasksForBoard(board.id, recipientId)).rejects.toMatchObject({
        messageKey: 'errors.board.forbidden',
      });

      // ... nor read the board itself.
      await expect(boardsService.getBoardForOwner(board.id, recipientId)).rejects.toBeInstanceOf(ForbiddenError);
      await expect(boardsService.getBoardForOwner(board.id, recipientId)).rejects.toMatchObject({
        messageKey: 'errors.board.forbidden',
      });

      await cleanupUser(recipientId);
    });

    // Code-reviewer MAJOR finding: a task-share-only recipient (NO
    // board_members row at all — confirmed above they can't list/read the
    // board) must not be able to trigger a write that touches sibling
    // tasks they can never read. updateTask's reorder branch
    // (reindexColumn) unconditionally rewrites position/updated_at on
    // EVERY task currently in the destination column, not just the one
    // being moved — so allowing this caller to reorder/change-status their
    // shared task would leak both a write capability AND (via the changed
    // position value) information about sibling tasks onto rows this user
    // has zero read access to.
    it('a task-share-only recipient cannot reorder/change-status their task — siblings stay completely untouched', async () => {
      const recipientId = await createUser();
      const recipientRow = await db('users').where({ id: recipientId }).first();
      const taskA = await createTask(board.id, ownerId, { title: 'A (shared)', position: 1000 });
      const taskB = await createTask(board.id, ownerId, { title: 'B (never shared)', position: 2000 });
      const taskC = await createTask(board.id, ownerId, { title: 'C (never shared)', position: 3000 });

      await taskSharesService.addShare(taskA.id, ownerId, { email: recipientRow.email, role: 'collaborator' });

      const beforeB = await db('tasks').where({ id: taskB.id }).first();
      const beforeC = await db('tasks').where({ id: taskC.id }).first();

      // Status change (which would move A to the end of the "done" column,
      // reindexing every existing row there) is rejected outright.
      await expect(
        tasksService.updateTask(taskA.id, recipientId, { status: 'done', position: 0 }),
      ).rejects.toBeInstanceOf(ForbiddenError);
      await expect(
        tasksService.updateTask(taskA.id, recipientId, { status: 'done', position: 0 }),
      ).rejects.toMatchObject({ messageKey: 'errors.task.reorderRequiresBoardAccess' });

      // Same-column reorder (position only, no status change) is rejected
      // the same way — it still goes through reindexColumn.
      await expect(
        tasksService.updateTask(taskA.id, recipientId, { position: 0 }),
      ).rejects.toMatchObject({ messageKey: 'errors.task.reorderRequiresBoardAccess' });

      // Sibling rows this recipient can never read are byte-for-byte
      // untouched — not just "still in the planned column", but position
      // AND updated_at unchanged (no write was ever attempted on them).
      const afterB = await db('tasks').where({ id: taskB.id }).first();
      const afterC = await db('tasks').where({ id: taskC.id }).first();
      expect(afterB.position).toBe(beforeB.position);
      expect(afterB.updated_at).toEqual(beforeB.updated_at);
      expect(afterC.position).toBe(beforeC.position);
      expect(afterC.updated_at).toEqual(beforeC.updated_at);

      // A itself is also untouched (the whole operation was rejected before
      // any write, not partially applied).
      const afterA = await db('tasks').where({ id: taskA.id }).first();
      expect(afterA.status).toBe('planned');
      expect(afterA.position).toBe(taskA.position);

      // The title-only path is NOT blocked by this — it never touches
      // siblings, so a task-share-only collaborator can still rename their
      // task (US15: collaborator can edit within their access).
      const renamed = await tasksService.updateTask(taskA.id, recipientId, { title: 'Renamed by task-share-only collaborator' });
      expect(renamed.title).toBe('Renamed by task-share-only collaborator');

      await cleanupUser(recipientId);
    });
  });

  // ---------------------------------------------------------------------
  // US17: effective role = the more permissive of board_members / task_shares.
  // ---------------------------------------------------------------------
  describe('US17 — role priority (board vs task, both directions)', () => {
    it('board-level viewer + task-level collaborator on the same task => effective collaborator', async () => {
      const userId = await createUser();
      const userRow = await db('users').where({ id: userId }).first();
      const task = await createTask(board.id, ownerId);

      await boardMembersService.addMember(board.id, ownerId, { email: userRow.email, role: 'viewer' });
      await taskSharesService.addShare(task.id, ownerId, { email: userRow.email, role: 'collaborator' });

      // A board-viewer alone could not update a task title (collaborator+
      // required) — the task-level collaborator share should win.
      const updated = await tasksService.updateTask(task.id, userId, { title: 'Edited by elevated viewer' });
      expect(updated.title).toBe('Edited by elevated viewer');
      expect(updated.myRole).toBe('collaborator');

      // Confirm listTasksForBoard's per-task myRole reflects the same
      // elevation for this task, but plain 'viewer' for a sibling task with
      // no task-level share.
      const sibling = await createTask(board.id, ownerId, { title: 'Sibling', position: 2000 });
      const { tasks } = await tasksService.listTasksForBoard(board.id, userId);
      const thisTask = tasks.find((t) => t.id === task.id);
      const siblingTask = tasks.find((t) => t.id === sibling.id);
      expect(thisTask.myRole).toBe('collaborator');
      expect(siblingTask.myRole).toBe('viewer');

      await cleanupUser(userId);
    });

    it('board-level collaborator + task-level viewer on the same task => effective collaborator (task share never downgrades)', async () => {
      const userId = await createUser();
      const userRow = await db('users').where({ id: userId }).first();
      const task = await createTask(board.id, ownerId);

      await boardMembersService.addMember(board.id, ownerId, { email: userRow.email, role: 'collaborator' });
      await taskSharesService.addShare(task.id, ownerId, { email: userRow.email, role: 'viewer' });

      // If the task-level viewer share incorrectly clamped the role down,
      // this would 403. It must not: board collaborator is more permissive.
      const updated = await tasksService.updateTask(task.id, userId, { title: 'Edited despite viewer task-share' });
      expect(updated.title).toBe('Edited despite viewer task-share');
      expect(updated.myRole).toBe('collaborator');

      await cleanupUser(userId);
    });
  });

  // ---------------------------------------------------------------------
  // US17: self-share and duplicate-share.
  // ---------------------------------------------------------------------
  describe('US17 — self-share and duplicate-share', () => {
    it('board self-share is rejected with a validation error, not a crash', async () => {
      await expect(
        boardMembersService.addMember(board.id, ownerId, { email: ownerEmail, role: 'viewer' }),
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(
        boardMembersService.addMember(board.id, ownerId, { email: ownerEmail, role: 'viewer' }),
      ).rejects.toMatchObject({ messageKey: 'errors.share.selfShare' });
    });

    it('task self-share is rejected with a validation error, not a crash', async () => {
      const task = await createTask(board.id, ownerId);
      await expect(
        taskSharesService.addShare(task.id, ownerId, { email: ownerEmail, role: 'collaborator' }),
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(
        taskSharesService.addShare(task.id, ownerId, { email: ownerEmail, role: 'collaborator' }),
      ).rejects.toMatchObject({ messageKey: 'errors.share.selfShare' });
    });

    it('re-sharing a board with the same email is an idempotent role upsert, not a 409 or a duplicate row', async () => {
      const userId = await createUser();
      const userRow = await db('users').where({ id: userId }).first();

      const first = await boardMembersService.addMember(board.id, ownerId, { email: userRow.email, role: 'viewer' });
      const second = await boardMembersService.addMember(board.id, ownerId, {
        email: userRow.email,
        role: 'collaborator',
      });

      expect(second.id).toBe(first.id); // same row, not a new one
      expect(second.role).toBe('collaborator');

      const rows = await db('board_members').where({ board_id: board.id, user_id: userId });
      expect(rows).toHaveLength(1);
      expect(rows[0].role).toBe('collaborator');

      await cleanupUser(userId);
    });

    it('re-sharing a task with the same email is an idempotent role upsert, not a 409 or a duplicate row', async () => {
      const userId = await createUser();
      const userRow = await db('users').where({ id: userId }).first();
      const task = await createTask(board.id, ownerId);

      const first = await taskSharesService.addShare(task.id, ownerId, { email: userRow.email, role: 'collaborator' });
      const second = await taskSharesService.addShare(task.id, ownerId, { email: userRow.email, role: 'viewer' });

      expect(second.id).toBe(first.id);
      expect(second.role).toBe('viewer');

      const rows = await db('task_shares').where({ task_id: task.id, user_id: userId });
      expect(rows).toHaveLength(1);
      expect(rows[0].role).toBe('viewer');

      await cleanupUser(userId);
    });
  });

  // ---------------------------------------------------------------------
  // US17: concurrency on the same board_members/task_shares row.
  // ---------------------------------------------------------------------
  describe('US17 — concurrent update-role / delete on the same share row', () => {
    it('updateMemberRole vs removeMember on the same row: clean 404, no orphaned/contradictory state', async () => {
      const userId = await createUser();
      const userRow = await db('users').where({ id: userId }).first();
      const member = await boardMembersService.addMember(board.id, ownerId, { email: userRow.email, role: 'viewer' });

      // Manually hold the row's FOR UPDATE lock open (same technique as
      // boards.concurrency.test.js) and delete it — simulating another
      // request's removeMember winning the race.
      const deleteTrx = await db.transaction();
      await deleteTrx('board_members').where({ id: member.id }).forUpdate().first();
      await deleteTrx('board_members').where({ id: member.id }).delete();

      const updatePromise = boardMembersService.updateMemberRole(board.id, member.id, ownerId, {
        role: 'collaborator',
      });
      await wait(200);
      await deleteTrx.commit();

      await expect(updatePromise).rejects.toBeInstanceOf(NotFoundError);
      await expect(updatePromise).rejects.toMatchObject({ messageKey: 'errors.share.memberNotFound' });

      // No orphaned or contradictory row left behind.
      const remaining = await db('board_members').where({ id: member.id });
      expect(remaining).toHaveLength(0);

      await cleanupUser(userId);
    });

    it('two concurrent removeMember calls on the same row: one succeeds, the other gets a clean 404, never a crash', async () => {
      const userId = await createUser();
      const userRow = await db('users').where({ id: userId }).first();
      const member = await boardMembersService.addMember(board.id, ownerId, { email: userRow.email, role: 'viewer' });

      const [first, second] = await Promise.allSettled([
        boardMembersService.removeMember(board.id, member.id, ownerId),
        boardMembersService.removeMember(board.id, member.id, ownerId),
      ]);

      const outcomes = [first, second];
      const fulfilled = outcomes.filter((o) => o.status === 'fulfilled');
      const rejected = outcomes.filter((o) => o.status === 'rejected');
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason).toBeInstanceOf(NotFoundError);
      expect(rejected[0].reason.messageKey).toBe('errors.share.memberNotFound');

      const remaining = await db('board_members').where({ id: member.id });
      expect(remaining).toHaveLength(0);

      await cleanupUser(userId);
    });

    it('updateShareRole vs removeShare on the same task_shares row: clean 404, no orphaned state', async () => {
      const userId = await createUser();
      const userRow = await db('users').where({ id: userId }).first();
      const task = await createTask(board.id, ownerId);
      const share = await taskSharesService.addShare(task.id, ownerId, { email: userRow.email, role: 'viewer' });

      const deleteTrx = await db.transaction();
      await deleteTrx('task_shares').where({ id: share.id }).forUpdate().first();
      await deleteTrx('task_shares').where({ id: share.id }).delete();

      const updatePromise = taskSharesService.updateShareRole(task.id, share.id, ownerId, { role: 'collaborator' });
      await wait(200);
      await deleteTrx.commit();

      await expect(updatePromise).rejects.toBeInstanceOf(NotFoundError);
      await expect(updatePromise).rejects.toMatchObject({ messageKey: 'errors.share.shareNotFound' });

      const remaining = await db('task_shares').where({ id: share.id });
      expect(remaining).toHaveLength(0);

      await cleanupUser(userId);
    });
  });

  // ---------------------------------------------------------------------
  // US13/US15: board_members management is strictly owner-only.
  // ---------------------------------------------------------------------
  describe('US13/US15 — board_members management is owner-only', () => {
    it('a board-level collaborator gets errors.board.ownerOnly (has access, just not enough)', async () => {
      const collaboratorId = await createUser();
      const collaboratorRow = await db('users').where({ id: collaboratorId }).first();
      await boardMembersService.addMember(board.id, ownerId, { email: collaboratorRow.email, role: 'collaborator' });

      await expect(
        boardMembersService.addMember(board.id, collaboratorId, { email: 'someone-else@example.test', role: 'viewer' }),
      ).rejects.toMatchObject({ messageKey: 'errors.board.ownerOnly' });
      await expect(boardMembersService.listMembers(board.id, collaboratorId)).rejects.toMatchObject({
        messageKey: 'errors.board.ownerOnly',
      });

      // Collaborator can't delete the board either — same ownerOnly gate.
      await expect(boardsService.deleteBoard(board.id, collaboratorId)).rejects.toMatchObject({
        messageKey: 'errors.board.ownerOnly',
      });

      await cleanupUser(collaboratorId);
    });

    it('a user with zero access gets the generic errors.board.forbidden, not ownerOnly', async () => {
      const strangerId = await createUser();
      await expect(boardMembersService.listMembers(board.id, strangerId)).rejects.toMatchObject({
        messageKey: 'errors.board.forbidden',
      });
      await cleanupUser(strangerId);
    });
  });

  // ---------------------------------------------------------------------
  // US15/US16: collaborator can write, viewer is read-only on content but
  // has full access to their OWN time tracking.
  // ---------------------------------------------------------------------
  describe('US15/US16 — collaborator write access, viewer read-only + own time tracking', () => {
    it('collaborator can create/edit/delete tasks and attachments on a shared board', async () => {
      const collaboratorId = await createUser();
      const collaboratorRow = await db('users').where({ id: collaboratorId }).first();
      await boardMembersService.addMember(board.id, ownerId, { email: collaboratorRow.email, role: 'collaborator' });

      const task = await tasksService.createTask(board.id, collaboratorId, { title: 'Made by collaborator' });
      const edited = await tasksService.updateTask(task.id, collaboratorId, { title: 'Edited by collaborator' });
      expect(edited.title).toBe('Edited by collaborator');

      const attachment = await attachmentsService.createAttachment(task.id, collaboratorId, {
        kind: 'note',
        body: 'Collaborator note',
      });
      await attachmentsService.deleteAttachment(task.id, attachment.id, collaboratorId);
      await tasksService.deleteTask(task.id, collaboratorId);

      const remaining = await db('tasks').where({ id: task.id });
      expect(remaining).toHaveLength(0);

      await cleanupUser(collaboratorId);
    });

    it('viewer is rejected (403 readOnlyAccess) on create/edit/delete task and attachment', async () => {
      const viewerId = await createUser();
      const viewerRow = await db('users').where({ id: viewerId }).first();
      await boardMembersService.addMember(board.id, ownerId, { email: viewerRow.email, role: 'viewer' });
      const task = await createTask(board.id, ownerId);

      await expect(tasksService.createTask(board.id, viewerId, { title: 'Nope' })).rejects.toMatchObject({
        messageKey: 'errors.board.readOnlyAccess',
      });
      await expect(tasksService.updateTask(task.id, viewerId, { title: 'Nope' })).rejects.toMatchObject({
        messageKey: 'errors.task.readOnlyAccess',
      });
      await expect(tasksService.deleteTask(task.id, viewerId)).rejects.toMatchObject({
        messageKey: 'errors.task.readOnlyAccess',
      });
      await expect(
        attachmentsService.createAttachment(task.id, viewerId, { kind: 'note', body: 'nope' }),
      ).rejects.toMatchObject({ messageKey: 'errors.task.readOnlyAccess' });

      await cleanupUser(viewerId);
    });

    it('viewer has full access to their OWN timer/time-entries on a task they can see', async () => {
      const viewerId = await createUser();
      const viewerRow = await db('users').where({ id: viewerId }).first();
      await boardMembersService.addMember(board.id, ownerId, { email: viewerRow.email, role: 'viewer' });
      const task = await createTask(board.id, ownerId);

      const { startedEntry } = await timeEntriesService.startTimer(task.id, viewerId);
      expect(startedEntry.userId).toBe(viewerId);
      const stopped = await timeEntriesService.stopTimer(task.id, viewerId, { note: 'viewer session' });
      expect(stopped.endedAt).not.toBeNull();

      const manual = await timeEntriesService.createManualEntry(task.id, viewerId, { minutes: 15 });
      expect(manual.userId).toBe(viewerId);

      await cleanupUser(viewerId);
    });

    it('a shared task never exposes another user\'s time_entries rows, even to the board owner listing the same task', async () => {
      const collaboratorId = await createUser();
      const collaboratorRow = await db('users').where({ id: collaboratorId }).first();
      await boardMembersService.addMember(board.id, ownerId, { email: collaboratorRow.email, role: 'collaborator' });
      const task = await createTask(board.id, ownerId);

      await timeEntriesService.createManualEntry(task.id, collaboratorId, { minutes: 30, note: 'collaborator private' });
      await timeEntriesService.createManualEntry(task.id, ownerId, { minutes: 10, note: 'owner private' });

      const ownerView = await timeEntriesService.listTimeEntriesForTask(task.id, ownerId);
      expect(ownerView.entries.every((e) => e.userId === ownerId)).toBe(true);
      expect(ownerView.entries.some((e) => e.note === 'collaborator private')).toBe(false);

      const collaboratorView = await timeEntriesService.listTimeEntriesForTask(task.id, collaboratorId);
      expect(collaboratorView.entries.every((e) => e.userId === collaboratorId)).toBe(true);
      expect(collaboratorView.entries.some((e) => e.note === 'owner private')).toBe(false);

      await cleanupUser(collaboratorId);
    });
  });

  // ---------------------------------------------------------------------
  // US17: cascade delete — board delete cascades board_members/tasks/
  // task_shares/attachments; task delete cascades its own task_shares.
  // ---------------------------------------------------------------------
  describe('US17 — cascade delete', () => {
    it('deleting a board cascades board_members, tasks, task_shares, and attachments', async () => {
      const userId = await createUser();
      const userRow = await db('users').where({ id: userId }).first();
      const task = await createTask(board.id, ownerId);
      await boardMembersService.addMember(board.id, ownerId, { email: userRow.email, role: 'collaborator' });
      await taskSharesService.addShare(task.id, ownerId, { email: userRow.email, role: 'viewer' });
      await attachmentsService.createAttachment(task.id, ownerId, { kind: 'note', body: 'cascade me' });

      await boardsService.deleteBoard(board.id, ownerId);

      expect(await db('board_members').where({ board_id: board.id })).toHaveLength(0);
      expect(await db('tasks').where({ board_id: board.id })).toHaveLength(0);
      expect(await db('task_shares').where({ task_id: task.id })).toHaveLength(0);
      expect(await db('attachments').where({ task_id: task.id })).toHaveLength(0);

      await cleanupUser(userId);
    });

    it('deleting a task cascades its task_shares', async () => {
      const userId = await createUser();
      const userRow = await db('users').where({ id: userId }).first();
      const task = await createTask(board.id, ownerId);
      await taskSharesService.addShare(task.id, ownerId, { email: userRow.email, role: 'viewer' });

      await tasksService.deleteTask(task.id, ownerId);

      expect(await db('task_shares').where({ task_id: task.id })).toHaveLength(0);

      await cleanupUser(userId);
    });
  });

  // ---------------------------------------------------------------------
  // Privacy-boundary check requested by CLAUDE.md ("вкладення з visibility
  // private не видно нікому, крім автора") — now that sharing makes a
  // second user reachable on the same task for the first time.
  //
  // Regression coverage for the fix in attachments.service.js's
  // listAttachmentsForTask (isVisibleTo): a `private` row (still the only
  // visibility any create path writes) is filtered out for anyone but its
  // `created_by`, even when the caller otherwise has task access via
  // board_members/task_shares.
  // ---------------------------------------------------------------------
  describe('attachment visibility=private boundary (now reachable via sharing)', () => {
    it('a board collaborator does NOT see another member\'s visibility=private attachment', async () => {
      const collaboratorId = await createUser();
      const collaboratorRow = await db('users').where({ id: collaboratorId }).first();
      const task = await createTask(board.id, ownerId);

      const ownerAttachment = await attachmentsService.createAttachment(task.id, ownerId, {
        kind: 'note',
        body: 'Owner-only private note',
      });
      expect(ownerAttachment.visibility).toBe('private'); // every attachment is hardcoded 'private'

      await boardMembersService.addMember(board.id, ownerId, { email: collaboratorRow.email, role: 'collaborator' });

      // Fixed behavior: the collaborator's own list never includes the
      // owner's private attachment.
      const collaboratorsView = await attachmentsService.listAttachmentsForTask(task.id, collaboratorId);
      expect(collaboratorsView.find((a) => a.id === ownerAttachment.id)).toBeUndefined();

      // The owner still sees their own private attachment on their own list.
      const ownersView = await attachmentsService.listAttachmentsForTask(task.id, ownerId);
      expect(ownersView.find((a) => a.id === ownerAttachment.id)).toBeDefined();

      await cleanupUser(collaboratorId);
    });

    it('a collaborator\'s own visibility=private attachment IS visible to them, just not to the owner or a co-collaborator', async () => {
      const collaboratorId = await createUser();
      const collaboratorRow = await db('users').where({ id: collaboratorId }).first();
      const otherCollaboratorId = await createUser();
      const otherCollaboratorRow = await db('users').where({ id: otherCollaboratorId }).first();
      const task = await createTask(board.id, ownerId);

      await boardMembersService.addMember(board.id, ownerId, { email: collaboratorRow.email, role: 'collaborator' });
      await boardMembersService.addMember(board.id, ownerId, {
        email: otherCollaboratorRow.email,
        role: 'collaborator',
      });

      const collaboratorAttachment = await attachmentsService.createAttachment(task.id, collaboratorId, {
        kind: 'note',
        body: 'Collaborator-only private note',
      });

      const ownItsView = await attachmentsService.listAttachmentsForTask(task.id, collaboratorId);
      expect(ownItsView.find((a) => a.id === collaboratorAttachment.id)).toBeDefined();

      const ownerView = await attachmentsService.listAttachmentsForTask(task.id, ownerId);
      expect(ownerView.find((a) => a.id === collaboratorAttachment.id)).toBeUndefined();

      const otherCollaboratorView = await attachmentsService.listAttachmentsForTask(task.id, otherCollaboratorId);
      expect(otherCollaboratorView.find((a) => a.id === collaboratorAttachment.id)).toBeUndefined();

      await cleanupUser(collaboratorId);
      await cleanupUser(otherCollaboratorId);
    });

    // Regression coverage for the fix in attachments.service.js's
    // deleteAttachment: the same isVisibleTo gate as the list read applies
    // to DELETE too (CLAUDE.md's "private (тільки я)" covers delete, not
    // just read) — with NO exception for the board owner. A caller who
    // can't see a private attachment gets the same 404 as if it didn't
    // exist, never a 403 (that would confirm something private exists
    // there), and the row is left untouched either way.
    it('a collaborator cannot delete another member\'s visibility=private attachment (404, row untouched)', async () => {
      const collaboratorId = await createUser();
      const collaboratorRow = await db('users').where({ id: collaboratorId }).first();
      const task = await createTask(board.id, ownerId);

      const ownerAttachment = await attachmentsService.createAttachment(task.id, ownerId, {
        kind: 'note',
        body: 'Owner-only private note',
      });
      await boardMembersService.addMember(board.id, ownerId, { email: collaboratorRow.email, role: 'collaborator' });

      await expect(
        attachmentsService.deleteAttachment(task.id, ownerAttachment.id, collaboratorId),
      ).rejects.toBeInstanceOf(NotFoundError);
      await expect(
        attachmentsService.deleteAttachment(task.id, ownerAttachment.id, collaboratorId),
      ).rejects.toMatchObject({ messageKey: 'errors.attachment.notFound' });

      const stillThere = await db('attachments').where({ id: ownerAttachment.id });
      expect(stillThere).toHaveLength(1);

      await cleanupUser(collaboratorId);
    });

    it('the board OWNER cannot delete a collaborator\'s visibility=private attachment either — no owner exception (404, row untouched)', async () => {
      const collaboratorId = await createUser();
      const collaboratorRow = await db('users').where({ id: collaboratorId }).first();
      const task = await createTask(board.id, ownerId);
      await boardMembersService.addMember(board.id, ownerId, { email: collaboratorRow.email, role: 'collaborator' });

      const collaboratorAttachment = await attachmentsService.createAttachment(task.id, collaboratorId, {
        kind: 'note',
        body: 'Collaborator-only private note',
      });

      await expect(
        attachmentsService.deleteAttachment(task.id, collaboratorAttachment.id, ownerId),
      ).rejects.toBeInstanceOf(NotFoundError);
      await expect(
        attachmentsService.deleteAttachment(task.id, collaboratorAttachment.id, ownerId),
      ).rejects.toMatchObject({ messageKey: 'errors.attachment.notFound' });

      const stillThere = await db('attachments').where({ id: collaboratorAttachment.id });
      expect(stillThere).toHaveLength(1);

      await cleanupUser(collaboratorId);
    });

    it('a user CAN delete their own visibility=private attachment', async () => {
      const collaboratorId = await createUser();
      const collaboratorRow = await db('users').where({ id: collaboratorId }).first();
      const task = await createTask(board.id, ownerId);
      await boardMembersService.addMember(board.id, ownerId, { email: collaboratorRow.email, role: 'collaborator' });

      const ownAttachment = await attachmentsService.createAttachment(task.id, collaboratorId, {
        kind: 'note',
        body: 'Delete me, I own this',
      });

      await attachmentsService.deleteAttachment(task.id, ownAttachment.id, collaboratorId);

      const gone = await db('attachments').where({ id: ownAttachment.id });
      expect(gone).toHaveLength(0);

      await cleanupUser(collaboratorId);
    });
  });
});
