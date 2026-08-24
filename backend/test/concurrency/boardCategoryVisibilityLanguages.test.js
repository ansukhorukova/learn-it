// Tester coverage for US-021 (board category), US-022 (public board
// visibility), US-023 (board languages), and US-024 (public boards
// discovery list) — lives under test/concurrency/ for the same reason as
// sharing.test.js/taskComments.test.js: vitest.config.js only includes that
// glob, and several cases here genuinely need the real Postgres connection
// the concurrency harness already sets up (see globalSetup.js/env.js).
const { db, createUser, createBoard, createTask, cleanupUser } = require('./helpers');
const boardsService = require('../../src/services/boards.service');
const tasksService = require('../../src/services/tasks.service');
const attachmentsService = require('../../src/services/attachments.service');
const timeEntriesService = require('../../src/services/timeEntries.service');
const taskCommentsService = require('../../src/services/taskComments.service');
const boardMembersService = require('../../src/services/boardMembers.service');
const { listActiveLanguages } = require('../../src/services/languages.service');
const { ForbiddenError, NotFoundError } = require('../../src/lib/serviceErrors');

const FAKE_UUID = '00000000-0000-0000-0000-000000000000';

async function getCompetency(slug) {
  return db('competencies').where({ slug }).first();
}

async function getLanguage(slug) {
  return db('languages').where({ slug }).first();
}

describe('US-021 board category', () => {
  let ownerId;
  let board;
  let mathCompetency;
  let uxCompetency;

  beforeEach(async () => {
    ownerId = await createUser();
    board = await createBoard(ownerId);
    mathCompetency = await getCompetency('mathematician');
    uxCompetency = await getCompetency('ux_designer');
  });

  afterEach(async () => {
    await cleanupUser(ownerId);
  });

  it('AC2: POST /boards accepts categoryId, 201 with categoryId persisted', async () => {
    const created = await boardsService.createBoard(ownerId, { title: 'Math board', categoryId: mathCompetency.id });
    expect(created.categoryId).toBe(mathCompetency.id);

    const row = await db('boards').where({ id: created.id }).first();
    expect(row.category_id).toBe(mathCompetency.id);
  });

  it('a board created without categoryId has categoryId: null', async () => {
    const created = await boardsService.createBoard(ownerId, { title: 'No category' });
    expect(created.categoryId).toBeNull();
  });

  it('AC3: owner can set/reset categoryId via PATCH', async () => {
    const updated = await boardsService.updateBoard(board.id, ownerId, { categoryId: mathCompetency.id });
    expect(updated.categoryId).toBe(mathCompetency.id);

    const reset = await boardsService.updateBoard(board.id, ownerId, { categoryId: null });
    expect(reset.categoryId).toBeNull();
  });

  it('AC4: categoryId omitted from PATCH body leaves it unchanged', async () => {
    await boardsService.updateBoard(board.id, ownerId, { categoryId: mathCompetency.id });
    const renamed = await boardsService.updateBoard(board.id, ownerId, { title: 'Renamed' });
    expect(renamed.categoryId).toBe(mathCompetency.id);
    expect(renamed.title).toBe('Renamed');
  });

  it('AC5: a nonexistent categoryId is 400 errors.board.categoryInvalid on both create and update', async () => {
    await expect(boardsService.createBoard(ownerId, { title: 'X', categoryId: FAKE_UUID })).rejects.toMatchObject({
      messageKey: 'errors.board.categoryInvalid',
    });
    await expect(boardsService.updateBoard(board.id, ownerId, { categoryId: FAKE_UUID })).rejects.toMatchObject({
      messageKey: 'errors.board.categoryInvalid',
    });
    // A malformed (non-uuid) id is the same error, not a 500.
    await expect(boardsService.updateBoard(board.id, ownerId, { categoryId: 'not-a-uuid' })).rejects.toMatchObject({
      messageKey: 'errors.board.categoryInvalid',
    });
  });

  it('AC6: an inactive category is 400 errors.board.categoryInactive on assignment, but a board that already has it keeps it after deactivation', async () => {
    // Assign while active.
    const updated = await boardsService.updateBoard(board.id, ownerId, { categoryId: uxCompetency.id });
    expect(updated.categoryId).toBe(uxCompetency.id);

    // Deactivate the competency (admin action, direct DB write — no admin
    // endpoint exists, matching AUTH-005's existing pattern).
    await db('competencies').where({ id: uxCompetency.id }).update({ is_active: false });

    // The board keeps its already-assigned (now-inactive) category — no
    // cascading clear, and a plain read doesn't re-validate it.
    const read = await boardsService.getBoardForOwner(board.id, ownerId);
    expect(read.categoryId).toBe(uxCompetency.id);

    // But (re-)assigning the now-inactive category to ANY board is rejected.
    const otherBoard = await createBoard(ownerId, { title: 'Other' });
    await expect(
      boardsService.updateBoard(otherBoard.id, ownerId, { categoryId: uxCompetency.id }),
    ).rejects.toMatchObject({ messageKey: 'errors.board.categoryInactive' });
    await expect(
      boardsService.createBoard(ownerId, { title: 'New', categoryId: uxCompetency.id }),
    ).rejects.toMatchObject({ messageKey: 'errors.board.categoryInactive' });

    // Restore for other tests/fixtures relying on a clean seed (not strictly
    // necessary given per-test isolation via cleanupUser, but keeps the
    // shared `competencies` seed row itself tidy across test files).
    await db('competencies').where({ id: uxCompetency.id }).update({ is_active: true });
  });

  it('categoryId assignment is owner-only: collaborator gets ownerOnly, stranger gets forbidden', async () => {
    const collaboratorId = await createUser();
    const collaboratorRow = await db('users').where({ id: collaboratorId }).first();
    await boardMembersService.addMember(board.id, ownerId, { email: collaboratorRow.email, role: 'collaborator' });

    await expect(
      boardsService.updateBoard(board.id, collaboratorId, { categoryId: mathCompetency.id }),
    ).rejects.toMatchObject({ messageKey: 'errors.board.ownerOnly' });

    const strangerId = await createUser();
    await expect(
      boardsService.updateBoard(board.id, strangerId, { categoryId: mathCompetency.id }),
    ).rejects.toMatchObject({ messageKey: 'errors.board.forbidden' });

    await cleanupUser(collaboratorId);
    await cleanupUser(strangerId);
  });

  it('AC9: GET /boards (listBoardsForOwner) categoryId filter narrows the list; unmatched/malformed values return zero, not an error', async () => {
    const mathBoard = await boardsService.createBoard(ownerId, { title: 'Math', categoryId: mathCompetency.id });
    const uncategorized = await boardsService.createBoard(ownerId, { title: 'Uncategorized' });

    const filtered = await boardsService.listBoardsForOwner(ownerId, { categoryId: mathCompetency.id });
    expect(filtered.map((b) => b.id)).toEqual([mathBoard.id]);

    const unfiltered = await boardsService.listBoardsForOwner(ownerId);
    expect(unfiltered.map((b) => b.id).sort()).toEqual([board.id, mathBoard.id, uncategorized.id].sort());

    const malformed = await boardsService.listBoardsForOwner(ownerId, { categoryId: 'garbage' });
    expect(malformed).toEqual([]);
  });
});

describe('US-022 public board visibility', () => {
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

  it('a freshly created board defaults to visibility: private', async () => {
    const read = await boardsService.getBoardForOwner(board.id, ownerId);
    expect(read.visibility).toBe('private');
    expect(read.myRole).toBe('owner');
  });

  it('AC1/AC8/AC9: visibility is owner-only, omitted-means-unchanged, and rejects an invalid value', async () => {
    const collaboratorId = await createUser();
    const collaboratorRow = await db('users').where({ id: collaboratorId }).first();
    await boardMembersService.addMember(board.id, ownerId, { email: collaboratorRow.email, role: 'collaborator' });

    await expect(boardsService.updateBoard(board.id, collaboratorId, { visibility: 'public' })).rejects.toMatchObject({
      messageKey: 'errors.board.ownerOnly',
    });

    await expect(boardsService.updateBoard(board.id, ownerId, { visibility: 'hidden' })).rejects.toMatchObject({
      messageKey: 'errors.board.visibilityInvalid',
    });

    const updated = await boardsService.updateBoard(board.id, ownerId, { visibility: 'public' });
    expect(updated.visibility).toBe('public');

    const renamed = await boardsService.updateBoard(board.id, ownerId, { title: 'Renamed' });
    expect(renamed.visibility).toBe('public'); // omitted -> unchanged

    await cleanupUser(collaboratorId);
  });

  it('AC2: a public board is readable (200, myRole: public) by an authenticated user with no membership row', async () => {
    await boardsService.updateBoard(board.id, ownerId, { visibility: 'public' });
    const visitorId = await createUser();

    const read = await boardsService.getBoardForOwner(board.id, visitorId);
    expect(read.myRole).toBe('public');
    expect(read.id).toBe(board.id);

    const { tasks, boardRole } = await tasksService.listTasksForBoard(board.id, visitorId);
    expect(boardRole).toBe('public');
    expect(Array.isArray(tasks)).toBe(true);

    await cleanupUser(visitorId);
  });

  it('a private (default) board is NOT readable by a non-member — 403 errors.board.forbidden, same as before this feature', async () => {
    const visitorId = await createUser();
    await expect(boardsService.getBoardForOwner(board.id, visitorId)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(boardsService.getBoardForOwner(board.id, visitorId)).rejects.toMatchObject({
      messageKey: 'errors.board.forbidden',
    });
    await cleanupUser(visitorId);
  });

  it('AC3: a public visitor cannot mutate board/task/attachment content — readOnlyAccess at every layer, never a bare crash', async () => {
    await boardsService.updateBoard(board.id, ownerId, { visibility: 'public' });
    const visitorId = await createUser();
    const task = await createTask(board.id, ownerId);

    // Board-level mutation (create task) — 403 board.readOnlyAccess.
    await expect(tasksService.createTask(board.id, visitorId, { title: 'Nope' })).rejects.toMatchObject({
      messageKey: 'errors.board.readOnlyAccess',
    });

    // Task-level mutation (edit/delete) — 403 task.readOnlyAccess.
    await expect(tasksService.updateTask(task.id, visitorId, { title: 'Nope' })).rejects.toMatchObject({
      messageKey: 'errors.task.readOnlyAccess',
    });
    await expect(tasksService.deleteTask(task.id, visitorId)).rejects.toMatchObject({
      messageKey: 'errors.task.readOnlyAccess',
    });

    // Attachment creation.
    await expect(
      attachmentsService.createAttachment(task.id, visitorId, { kind: 'note', body: 'nope' }),
    ).rejects.toMatchObject({ messageKey: 'errors.task.readOnlyAccess' });

    // Owner-only board settings (visibility/category/rename) — a public
    // visitor has zero real access, so this is the generic forbidden, not
    // ownerOnly (they were never "a collaborator/viewer who isn't the
    // owner" — see getOwnedBoard's distinction).
    await expect(boardsService.updateBoard(board.id, visitorId, { title: 'Nope' })).rejects.toMatchObject({
      messageKey: 'errors.board.forbidden',
    });

    await cleanupUser(visitorId);
  });

  it('AC4: a public visitor sees only visibility=shared attachments, plus visibility=selected ones they are explicitly listed on — never private', async () => {
    await boardsService.updateBoard(board.id, ownerId, { visibility: 'public' });
    const visitorId = await createUser();
    const selectedVisitorId = await createUser();
    const task = await createTask(board.id, ownerId);

    const privateAttachment = await attachmentsService.createAttachment(task.id, ownerId, {
      kind: 'note',
      body: 'Private note',
    });
    expect(privateAttachment.visibility).toBe('private');

    // No create path ever produces shared/selected attachments yet (product
    // decision, see attachments.service.js's insertAttachment) — inserted
    // directly here to exercise the READ-side gate US-022 AC4 specifies.
    const [sharedAttachment] = await db('attachments')
      .insert({ task_id: task.id, created_by: ownerId, kind: 'note', body: 'Shared note', visibility: 'shared' })
      .returning('*');
    const [selectedAttachment] = await db('attachments')
      .insert({ task_id: task.id, created_by: ownerId, kind: 'note', body: 'Selected note', visibility: 'selected' })
      .returning('*');
    await db('attachment_viewers').insert({ attachment_id: selectedAttachment.id, user_id: selectedVisitorId });

    const visitorView = await attachmentsService.listAttachmentsForTask(task.id, visitorId);
    const visitorIds = visitorView.map((a) => a.id);
    expect(visitorIds).toContain(sharedAttachment.id);
    expect(visitorIds).not.toContain(privateAttachment.id);
    expect(visitorIds).not.toContain(selectedAttachment.id); // not on the viewer list

    const selectedVisitorView = await attachmentsService.listAttachmentsForTask(task.id, selectedVisitorId);
    const selectedVisitorIds = selectedVisitorView.map((a) => a.id);
    expect(selectedVisitorIds).toContain(sharedAttachment.id);
    expect(selectedVisitorIds).toContain(selectedAttachment.id); // explicitly listed
    expect(selectedVisitorIds).not.toContain(privateAttachment.id);

    await cleanupUser(visitorId);
    await cleanupUser(selectedVisitorId);
  });

  it('AC5: time_entries privacy is absolute for a public visitor — never another user\'s rows, not even aggregated', async () => {
    await boardsService.updateBoard(board.id, ownerId, { visibility: 'public' });
    const visitorId = await createUser();
    const task = await createTask(board.id, ownerId);

    await timeEntriesService.createManualEntry(task.id, ownerId, { minutes: 45, note: 'owner private time' });

    const visitorView = await timeEntriesService.listTimeEntriesForTask(task.id, visitorId);
    expect(visitorView.entries).toEqual([]);
    expect(visitorView.activeEntry).toBeNull();
    expect(visitorView.totalSeconds).toBe(0);

    // The visitor's own timer/manual entries still work — the privacy rule
    // is "never see SOMEONE ELSE's rows", not "no time tracking for public
    // visitors" (matches the same invariant already established for viewer
    // in US16).
    const ownEntry = await timeEntriesService.createManualEntry(task.id, visitorId, { minutes: 5 });
    expect(ownEntry.userId).toBe(visitorId);

    await cleanupUser(visitorId);
  });

  it('AC6: a public visitor can read comments but gets 403 errors.task.readOnlyAccess trying to post one', async () => {
    await boardsService.updateBoard(board.id, ownerId, { visibility: 'public' });
    const visitorId = await createUser();
    const task = await createTask(board.id, ownerId);
    await taskCommentsService.createComment(task.id, ownerId, { body: 'Visible to everyone' });

    const list = await taskCommentsService.listComments(task.id, visitorId);
    expect(list).toHaveLength(1);

    await expect(taskCommentsService.createComment(task.id, visitorId, { body: 'Nope' })).rejects.toMatchObject({
      messageKey: 'errors.task.readOnlyAccess',
    });

    await cleanupUser(visitorId);
  });

  it('AC7: real membership always wins over the public fallback, at both board and task level', async () => {
    await boardsService.updateBoard(board.id, ownerId, { visibility: 'public' });
    const memberId = await createUser();
    const memberRow = await db('users').where({ id: memberId }).first();
    await boardMembersService.addMember(board.id, ownerId, { email: memberRow.email, role: 'viewer' });

    const read = await boardsService.getBoardForOwner(board.id, memberId);
    expect(read.myRole).toBe('viewer'); // not 'public', despite the board being public

    const { boardRole } = await tasksService.listTasksForBoard(board.id, memberId);
    expect(boardRole).toBe('viewer');

    await cleanupUser(memberId);
  });

  it('AC10: switching a board back to private immediately revokes a prior public visitor\'s access', async () => {
    await boardsService.updateBoard(board.id, ownerId, { visibility: 'public' });
    const visitorId = await createUser();

    const whilePublic = await boardsService.getBoardForOwner(board.id, visitorId);
    expect(whilePublic.myRole).toBe('public');

    await boardsService.updateBoard(board.id, ownerId, { visibility: 'private' });

    await expect(boardsService.getBoardForOwner(board.id, visitorId)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(boardsService.getBoardForOwner(board.id, visitorId)).rejects.toMatchObject({
      messageKey: 'errors.board.forbidden',
    });

    await cleanupUser(visitorId);
  });

  it('AC12/US-024 AC8: listPublicBoards never carries time_entries or attachment data — the shape itself has no such field', async () => {
    await boardsService.updateBoard(board.id, ownerId, { visibility: 'public' });
    const visitorId = await createUser();
    const task = await createTask(board.id, ownerId);
    await timeEntriesService.createManualEntry(task.id, ownerId, { minutes: 30 });

    const [publicEntry] = await boardsService.listPublicBoards(visitorId);
    expect(publicEntry).toBeDefined();
    expect(publicEntry).not.toHaveProperty('totalSeconds');
    expect(publicEntry).not.toHaveProperty('thisWeekSeconds');
    expect(publicEntry).not.toHaveProperty('attachments');
    expect(publicEntry).not.toHaveProperty('timeEntries');

    await cleanupUser(visitorId);
  });
});

describe('US-023 board languages', () => {
  let ownerId;
  let board;
  let english;
  let ukrainian;
  let spanish;

  beforeEach(async () => {
    ownerId = await createUser();
    board = await createBoard(ownerId);
    english = await getLanguage('english');
    ukrainian = await getLanguage('ukrainian');
    spanish = await getLanguage('spanish');
  });

  afterEach(async () => {
    await cleanupUser(ownerId);
  });

  it('GET /languages returns the seeded active dictionary', async () => {
    const languages = await listActiveLanguages();
    const slugs = languages.map((l) => l.slug);
    expect(slugs).toEqual(expect.arrayContaining(['english', 'ukrainian', 'spanish']));
  });

  it('AC2: POST /boards accepts languageIds; a freshly created board with none has languages: []', async () => {
    const created = await boardsService.createBoard(ownerId, {
      title: 'Multilingual',
      languageIds: [english.id, ukrainian.id],
    });
    expect(created.languages.map((l) => l.id).sort()).toEqual([english.id, ukrainian.id].sort());

    const bare = await boardsService.createBoard(ownerId, { title: 'No languages' });
    expect(bare.languages).toEqual([]);
  });

  it('AC2: PATCH languageIds is full-replace, not diff/append', async () => {
    await boardsService.updateBoard(board.id, ownerId, { languageIds: [english.id, ukrainian.id] });
    const replaced = await boardsService.updateBoard(board.id, ownerId, { languageIds: [spanish.id] });
    expect(replaced.languages.map((l) => l.id)).toEqual([spanish.id]);

    const rows = await db('board_languages').where({ board_id: board.id });
    expect(rows).toHaveLength(1);
    expect(rows[0].language_id).toBe(spanish.id);
  });

  it('AC3: languageIds omitted from PATCH body leaves the current set untouched', async () => {
    await boardsService.updateBoard(board.id, ownerId, { languageIds: [english.id] });
    const renamed = await boardsService.updateBoard(board.id, ownerId, { title: 'Renamed' });
    expect(renamed.languages.map((l) => l.id)).toEqual([english.id]);
  });

  it('AC4: an explicit empty array clears every language', async () => {
    await boardsService.updateBoard(board.id, ownerId, { languageIds: [english.id, spanish.id] });
    const cleared = await boardsService.updateBoard(board.id, ownerId, { languageIds: [] });
    expect(cleared.languages).toEqual([]);

    const rows = await db('board_languages').where({ board_id: board.id });
    expect(rows).toHaveLength(0);
  });

  it('AC5: an unknown or inactive language id is 400 errors.board.languageInvalid, all-or-nothing (no partial apply)', async () => {
    await expect(
      boardsService.updateBoard(board.id, ownerId, { languageIds: [english.id, FAKE_UUID] }),
    ).rejects.toMatchObject({ messageKey: 'errors.board.languageInvalid' });

    // Nothing was applied — not even the valid id in the same array.
    const rows = await db('board_languages').where({ board_id: board.id });
    expect(rows).toHaveLength(0);

    // Deactivate a language and confirm assigning it is also rejected.
    await db('languages').where({ id: spanish.id }).update({ is_active: false });
    await expect(
      boardsService.updateBoard(board.id, ownerId, { languageIds: [spanish.id] }),
    ).rejects.toMatchObject({ messageKey: 'errors.board.languageInvalid' });
    await db('languages').where({ id: spanish.id }).update({ is_active: true });

    // AC5's "все-або-нічого" also covers OTHER fields in the same request:
    // a title change bundled with an invalid languageIds fails entirely,
    // the title is left untouched too.
    await expect(
      boardsService.updateBoard(board.id, ownerId, { title: 'Should not apply', languageIds: [FAKE_UUID] }),
    ).rejects.toMatchObject({ messageKey: 'errors.board.languageInvalid' });
    const row = await db('boards').where({ id: board.id }).first();
    expect(row.title).toBe(board.title);
  });

  it('languageIds assignment is owner-only', async () => {
    const collaboratorId = await createUser();
    const collaboratorRow = await db('users').where({ id: collaboratorId }).first();
    await boardMembersService.addMember(board.id, ownerId, { email: collaboratorRow.email, role: 'collaborator' });

    await expect(
      boardsService.updateBoard(board.id, collaboratorId, { languageIds: [english.id] }),
    ).rejects.toMatchObject({ messageKey: 'errors.board.ownerOnly' });

    await cleanupUser(collaboratorId);
  });

  it('deleting a board cascades its board_languages rows', async () => {
    await boardsService.updateBoard(board.id, ownerId, { languageIds: [english.id] });
    await boardsService.deleteBoard(board.id, ownerId);
    const rows = await db('board_languages').where({ board_id: board.id });
    expect(rows).toHaveLength(0);
  });
});

describe('US-024 public boards discovery list', () => {
  let ownerId;
  let board;

  beforeEach(async () => {
    ownerId = await createUser();
    board = await createBoard(ownerId);
  });

  afterEach(async () => {
    await cleanupUser(ownerId);
  });

  it('AC2: excludes the caller\'s own boards even when public, and excludes other users\' private boards', async () => {
    await boardsService.updateBoard(board.id, ownerId, { visibility: 'public' });
    const otherOwnerId = await createUser();
    const otherPrivateBoard = await createBoard(otherOwnerId, { title: 'Other private' });
    const otherPublicBoard = await createBoard(otherOwnerId, { title: 'Other public' });
    await boardsService.updateBoard(otherPublicBoard.id, otherOwnerId, { visibility: 'public' });

    const asOwner = await boardsService.listPublicBoards(ownerId);
    expect(asOwner.map((b) => b.id)).not.toContain(board.id); // never my own, even public

    const asOtherOwner = await boardsService.listPublicBoards(otherOwnerId);
    expect(asOtherOwner.map((b) => b.id)).toContain(board.id); // sees MY public board
    expect(asOtherOwner.map((b) => b.id)).not.toContain(otherPrivateBoard.id); // never someone's private board
    expect(asOtherOwner.map((b) => b.id)).not.toContain(otherPublicBoard.id); // never their OWN board either

    await cleanupUser(otherOwnerId);
  });

  it('AC8: each item carries ownerName (publicName falling back to displayName) and myRole: public', async () => {
    await boardsService.updateBoard(board.id, ownerId, { visibility: 'public' });
    const visitorId = await createUser();

    let [publicItem] = await boardsService.listPublicBoards(visitorId);
    expect(publicItem.myRole).toBe('public');
    expect(publicItem.ownerName).toBeTruthy();

    await db('users').where({ id: ownerId }).update({ public_name: 'Owner Display Choice' });
    [publicItem] = await boardsService.listPublicBoards(visitorId);
    expect(publicItem.ownerName).toBe('Owner Display Choice');

    await cleanupUser(visitorId);
  });

  it('a public board is reachable via GET /boards/{id}-equivalent from the discovery list, in myRole: public read mode', async () => {
    await boardsService.updateBoard(board.id, ownerId, { visibility: 'public' });
    const visitorId = await createUser();

    const [listed] = await boardsService.listPublicBoards(visitorId);
    const opened = await boardsService.getBoardForOwner(listed.id, visitorId);
    expect(opened.myRole).toBe('public');

    await cleanupUser(visitorId);
  });

  it('categoryId and languageIds filters (US-021 AC9/US-023 AC8) narrow the public list; language filter is OR across multiple ids', async () => {
    const math = await getCompetency('mathematician');
    const english = await getLanguage('english');
    const spanish = await getLanguage('spanish');

    const mathBoard = await createBoard(ownerId, { title: 'Math public' });
    await boardsService.updateBoard(mathBoard.id, ownerId, {
      visibility: 'public',
      categoryId: math.id,
      languageIds: [english.id],
    });

    const spanishBoard = await createBoard(ownerId, { title: 'Spanish public' });
    await boardsService.updateBoard(spanishBoard.id, ownerId, { visibility: 'public', languageIds: [spanish.id] });

    const neitherBoard = await createBoard(ownerId, { title: 'Neither' });
    await boardsService.updateBoard(neitherBoard.id, ownerId, { visibility: 'public' });

    const visitorId = await createUser();

    const byCategory = await boardsService.listPublicBoards(visitorId, { categoryId: math.id });
    expect(byCategory.map((b) => b.id)).toEqual([mathBoard.id]);

    const byLanguageOr = await boardsService.listPublicBoards(visitorId, {
      languageIds: [english.id, spanish.id],
    });
    expect(byLanguageOr.map((b) => b.id).sort()).toEqual([mathBoard.id, spanishBoard.id].sort());

    const byMalformedLanguage = await boardsService.listPublicBoards(visitorId, { languageIds: ['garbage'] });
    expect(byMalformedLanguage).toEqual([]);

    const noFilter = await boardsService.listPublicBoards(visitorId);
    expect(noFilter.map((b) => b.id).sort()).toEqual(
      [mathBoard.id, spanishBoard.id, neitherBoard.id].sort(),
    );

    await cleanupUser(visitorId);
  });

  it('a nonexistent board id 404s the same way as any other board read', async () => {
    const visitorId = await createUser();
    await expect(boardsService.getBoardForOwner(FAKE_UUID, visitorId)).rejects.toBeInstanceOf(NotFoundError);
    await cleanupUser(visitorId);
  });
});
