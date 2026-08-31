// Tester coverage for US-037 / US-041 (POST /api/v1/boards/import —
// transactional board import; section text is the task Description, not a
// note attachment). Lives under test/concurrency/ for the same reason as
// plannedMinutes.test.js / boardCategoryVisibilityLanguages.test.js:
// vitest.config.js only includes that glob, and this suite needs the real
// Postgres connection the concurrency harness already sets up
// (globalSetup.js / env.js) — the whole point of AC3 is a real transaction
// rolling back real rows.
const { db, createUser, cleanupUser } = require('./helpers');
const boardImportService = require('../../src/services/boardImport.service');
const { ValidationError } = require('../../src/lib/serviceErrors');

function basePayload(overrides = {}) {
  return {
    board: { title: 'Imported board', ...(overrides.board || {}) },
    tasks: overrides.tasks || [{ title: 'Task one' }, { title: 'Task two' }],
  };
}

async function countBoards(ownerId) {
  const [{ count }] = await db('boards').where({ owner_id: ownerId }).count('id as count');
  return Number(count);
}

describe('US-037 / US-041 board import', () => {
  let ownerId;

  beforeEach(async () => {
    ownerId = await createUser();
  });

  afterEach(async () => {
    await cleanupUser(ownerId);
  });

  it('AC1/AC2: creates board + tasks in one call, section text is the task Description', async () => {
    const result = await boardImportService.importBoard(ownerId, {
      board: { title: 'Algorithms', description: '  From a book  ' },
      tasks: [
        { title: 'Chapter 1', planned_minutes: 90, notes: 'full text 1' },
        // US-041 back-compat: a legacy attachment.body with no `notes` folds into notes
        { title: 'Chapter 2', attachment: { body: 'full text 2' } },
        { title: 'Chapter 3' },
      ],
    });

    expect(result.createdTaskCount).toBe(3);
    expect(result).not.toHaveProperty('createdAttachmentCount');
    expect(result.warnings).toEqual([]);
    // board is toBoardSummary's shape (same as POST /boards)
    expect(result.board).toMatchObject({
      title: 'Algorithms',
      description: 'From a book',
      visibility: 'private',
      ownerId,
      taskCount: 3,
      myRole: 'owner',
      categoryId: null,
      languages: [],
    });
    expect(result.board.accent).toBe('teal');

    const boardRow = await db('boards').where({ id: result.board.id }).first();
    expect(boardRow.visibility).toBe('private');
    expect(boardRow.owner_id).toBe(ownerId);

    const taskRows = await db('tasks').where({ board_id: result.board.id }).orderBy('position', 'asc');
    expect(taskRows.map((t) => t.title)).toEqual(['Chapter 1', 'Chapter 2', 'Chapter 3']);
    expect(taskRows.map((t) => t.position)).toEqual([1000, 2000, 3000]);
    expect(taskRows.map((t) => t.notes)).toEqual(['full text 1', 'full text 2', null]);
    expect(taskRows.every((t) => t.status === 'planned')).toBe(true);
    expect(taskRows.every((t) => t.created_by === ownerId)).toBe(true);
    expect(taskRows[0].planned_minutes).toBe(90);
    expect(taskRows[1].planned_minutes).toBeNull();

    // US-041: the import creates no attachments
    const attachmentRows = await db('attachments').whereIn(
      'task_id',
      taskRows.map((t) => t.id),
    );
    expect(attachmentRows).toHaveLength(0);
  });

  it('US-041: an explicit `notes` wins over a legacy `attachment.body`', async () => {
    const result = await boardImportService.importBoard(ownerId, {
      board: { title: 'B' },
      tasks: [{ title: 'T', notes: 'the description', attachment: { body: 'stale text' } }],
    });
    const taskRow = await db('tasks').where({ board_id: result.board.id }).first();
    expect(taskRow.notes).toBe('the description');
    expect(result.warnings).toEqual([]);
  });

  it('AC4: visibility / status / owner_id / created_by in the file are ignored', async () => {
    const result = await boardImportService.importBoard(ownerId, {
      board: { title: 'Ignore me', visibility: 'public', owner_id: 'someone-else' },
      tasks: [{ title: 'T', status: 'done', created_by: 'someone-else' }],
    });
    const boardRow = await db('boards').where({ id: result.board.id }).first();
    expect(boardRow.visibility).toBe('private');
    expect(boardRow.owner_id).toBe(ownerId);
    const taskRow = await db('tasks').where({ board_id: result.board.id }).first();
    expect(taskRow.status).toBe('planned');
    expect(taskRow.created_by).toBe(ownerId);
  });

  it('AC5: a non-object body, or a missing board / non-array tasks, is errors.boardImport.invalidStructure', async () => {
    for (const bad of [null, 'string', 42, [], { tasks: [] }, { board: {} }, { board: {}, tasks: {} }, { board: [], tasks: [] }]) {
      // eslint-disable-next-line no-await-in-loop
      await expect(boardImportService.importBoard(ownerId, bad)).rejects.toMatchObject({
        messageKey: 'errors.boardImport.invalidStructure',
      });
    }
    expect(await countBoards(ownerId)).toBe(0);
  });

  it('AC6: board title required / too long, description too long', async () => {
    await expect(boardImportService.importBoard(ownerId, basePayload({ board: { title: '   ' } }))).rejects.toMatchObject({
      messageKey: 'errors.boardImport.boardTitleRequired',
    });
    await expect(
      boardImportService.importBoard(ownerId, basePayload({ board: { title: 'x'.repeat(101) } })),
    ).rejects.toMatchObject({ messageKey: 'errors.boardImport.boardTitleTooLong' });
    await expect(
      boardImportService.importBoard(ownerId, basePayload({ board: { title: 'ok', description: 'd'.repeat(2001) } })),
    ).rejects.toMatchObject({ messageKey: 'errors.board.descriptionTooLong' });
    expect(await countBoards(ownerId)).toBe(0);
  });

  it('AC7: tasks required (missing / empty), and over 200 is errors.boardImport.tooManyTasks with params.max', async () => {
    await expect(boardImportService.importBoard(ownerId, { board: { title: 'B' }, tasks: [] })).rejects.toMatchObject({
      messageKey: 'errors.boardImport.tasksRequired',
    });
    await expect(
      boardImportService.importBoard(ownerId, { board: { title: 'B' }, tasks: 'nope' }),
    ).rejects.toMatchObject({ messageKey: 'errors.boardImport.invalidStructure' });

    const tooMany = Array.from({ length: 201 }, (_, i) => ({ title: `T${i}` }));
    const err = await boardImportService
      .importBoard(ownerId, { board: { title: 'B' }, tasks: tooMany })
      .catch((e) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.messageKey).toBe('errors.boardImport.tooManyTasks');
    expect(err.params).toEqual({ max: 200 });
    expect(await countBoards(ownerId)).toBe(0);
  });

  it('exactly 200 tasks is allowed', async () => {
    const exactly = Array.from({ length: 200 }, (_, i) => ({ title: `T${i}` }));
    const result = await boardImportService.importBoard(ownerId, { board: { title: 'B' }, tasks: exactly });
    expect(result.createdTaskCount).toBe(200);
  });

  it('AC8: per-task title validation carries the 1-based {index}', async () => {
    const missingTitle = await boardImportService
      .importBoard(ownerId, { board: { title: 'B' }, tasks: [{ title: 'ok' }, { title: '  ' }] })
      .catch((e) => e);
    expect(missingTitle.messageKey).toBe('errors.boardImport.taskTitleRequired');
    expect(missingTitle.params).toEqual({ index: 2 });

    const longTitle = await boardImportService
      .importBoard(ownerId, { board: { title: 'B' }, tasks: [{ title: 'x'.repeat(201) }] })
      .catch((e) => e);
    expect(longTitle.messageKey).toBe('errors.boardImport.taskTitleTooLong');
    expect(longTitle.params).toEqual({ index: 1 });

    expect(await countBoards(ownerId)).toBe(0);
  });

  it('US-041: an over-long `notes` is no longer a critical error — it is trimmed + warned', async () => {
    const result = await boardImportService.importBoard(ownerId, {
      board: { title: 'B' },
      tasks: [{ title: 'ok' }, { title: 'ok2', notes: 'n'.repeat(20001) }],
    });
    expect(result.createdTaskCount).toBe(2);
    expect(result.warnings).toContainEqual({
      code: 'board.import.warning.taskNotesTruncated',
      params: { taskTitle: 'ok2', max: 20000 },
    });
    const taskRows = await db('tasks').where({ board_id: result.board.id }).orderBy('position', 'asc');
    expect(taskRows[1].notes).toHaveLength(20000);
  });

  it('AC3: a critical failure rolls back completely — no board or tasks', async () => {
    await expect(
      boardImportService.importBoard(ownerId, {
        board: { title: 'Half board' },
        tasks: [
          { title: 'good', notes: 'x' },
          { title: 'x'.repeat(201) }, // trips taskTitleTooLong at index 2
        ],
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(await countBoards(ownerId)).toBe(0);
    const anyTask = await db('tasks').where({ created_by: ownerId }).first();
    expect(anyTask).toBeUndefined();
  });

  it('US-041: a legacy `attachment.body` over 20000 chars folds into notes, trimmed + warned', async () => {
    const result = await boardImportService.importBoard(ownerId, {
      board: { title: 'B' },
      tasks: [{ title: 'Long chapter', attachment: { body: 'a'.repeat(25000) } }],
    });
    expect(result.warnings).toContainEqual({
      code: 'board.import.warning.taskNotesTruncated',
      params: { taskTitle: 'Long chapter', max: 20000 },
    });
    const taskRow = await db('tasks').where({ board_id: result.board.id }).first();
    expect(taskRow.notes).toHaveLength(20000);
    expect(await db('attachments').where({ created_by: ownerId })).toHaveLength(0);
  });

  it('US-041: an empty legacy attachment body and no notes → no description, no warning', async () => {
    const result = await boardImportService.importBoard(ownerId, {
      board: { title: 'B' },
      tasks: [
        { title: 'Empty note', attachment: { kind: 'file', body: '   ' } },
        { title: 'No attachment key' },
      ],
    });
    expect(result.warnings).toEqual([]);
    const taskRows = await db('tasks').where({ board_id: result.board.id }).orderBy('position', 'asc');
    expect(taskRows.map((t) => t.notes)).toEqual([null, null]);
    expect(await db('attachments').where({ created_by: ownerId })).toHaveLength(0);
  });

  it('AC11: category slug — valid assigns it, unknown/inactive → warning + no category', async () => {
    const math = await db('competencies').where({ slug: 'mathematician' }).first();

    const ok = await boardImportService.importBoard(ownerId, basePayload({ board: { title: 'B', category: 'mathematician' } }));
    expect(ok.board.categoryId).toBe(math.id);
    expect(ok.warnings).toEqual([]);

    const unknown = await boardImportService.importBoard(ownerId, basePayload({ board: { title: 'B', category: 'nope_slug' } }));
    expect(unknown.board.categoryId).toBeNull();
    expect(unknown.warnings).toContainEqual({ code: 'board.import.warning.unknownCategory', params: { slug: 'nope_slug' } });

    await db('competencies').where({ slug: 'ux_designer' }).update({ is_active: false });
    try {
      const inactive = await boardImportService.importBoard(
        ownerId,
        basePayload({ board: { title: 'B', category: 'ux_designer' } }),
      );
      expect(inactive.board.categoryId).toBeNull();
      expect(inactive.warnings).toContainEqual({
        code: 'board.import.warning.inactiveCategory',
        params: { slug: 'ux_designer' },
      });
    } finally {
      await db('competencies').where({ slug: 'ux_designer' }).update({ is_active: true });
    }
  });

  it('AC12: languages — valid slugs saved, unknown/inactive skipped with a per-slug warning', async () => {
    const english = await db('languages').where({ slug: 'english' }).first();
    const ukrainian = await db('languages').where({ slug: 'ukrainian' }).first();

    const result = await boardImportService.importBoard(
      ownerId,
      basePayload({ board: { title: 'B', languages: ['english', 'ukrainian', 'klingon', 'english'] } }),
    );
    expect(result.board.languages.map((l) => l.id).sort()).toEqual([english.id, ukrainian.id].sort());
    expect(result.warnings).toContainEqual({ code: 'board.import.warning.unknownLanguage', params: { slug: 'klingon' } });

    const rows = await db('board_languages').where({ board_id: result.board.id });
    expect(rows).toHaveLength(2);
  });

  it('AC13: planned_minutes — 0/missing → null (no warning), invalid → null + warning, valid → set', async () => {
    const result = await boardImportService.importBoard(ownerId, {
      board: { title: 'B' },
      tasks: [
        { title: 'Zero', planned_minutes: 0 },
        { title: 'Missing' },
        { title: 'Negative', planned_minutes: -5 },
        { title: 'Fractional', planned_minutes: 12.5 },
        { title: 'TooBig', planned_minutes: 10000 },
        { title: 'Valid', planned_minutes: 120 },
      ],
    });
    const tasks = await db('tasks').where({ board_id: result.board.id }).orderBy('position', 'asc');
    expect(tasks.map((t) => t.planned_minutes)).toEqual([null, null, null, null, null, 120]);

    const dropped = result.warnings.filter((w) => w.code === 'board.import.warning.plannedMinutesDropped');
    expect(dropped.map((w) => w.params.taskTitle).sort()).toEqual(['Fractional', 'Negative', 'TooBig']);
  });

  it('AC17: warnings never block — the response is still a normal success with the board created', async () => {
    const result = await boardImportService.importBoard(
      ownerId,
      basePayload({
        board: { title: 'B', category: 'bad', languages: ['bad'] },
        tasks: [{ title: 'T', planned_minutes: 'x' }],
      }),
    );
    expect(result.createdTaskCount).toBe(1);
    expect(result.warnings.length).toBeGreaterThanOrEqual(3);
    expect(await countBoards(ownerId)).toBe(1);
  });

  // --- Tester-added boundary coverage (US-037 AC6/AC8/AC13, US-041 notes) ---

  it('boundaries: exactly-max board title (100), description (2000), task title (200), notes (20000) all pass', async () => {
    const result = await boardImportService.importBoard(ownerId, {
      board: { title: 'b'.repeat(100), description: 'd'.repeat(2000) },
      tasks: [{ title: 't'.repeat(200), notes: 'n'.repeat(20000) }],
    });
    expect(result.warnings).toEqual([]);
    const boardRow = await db('boards').where({ id: result.board.id }).first();
    expect(boardRow.title).toHaveLength(100);
    expect(boardRow.description).toHaveLength(2000);
    const taskRow = await db('tasks').where({ board_id: result.board.id }).first();
    expect(taskRow.title).toHaveLength(200);
    expect(taskRow.notes).toHaveLength(20000);
  });

  it('US-041 boundary: notes of exactly 20000 chars passes with no warning; 20001 is trimmed + warned', async () => {
    const exact = await boardImportService.importBoard(ownerId, {
      board: { title: 'B' },
      tasks: [{ title: 'Exact', notes: 'a'.repeat(20000) }],
    });
    expect(exact.warnings).toEqual([]);
    const exactRow = await db('tasks').where({ board_id: exact.board.id }).first();
    expect(exactRow.notes).toHaveLength(20000);

    const over = await boardImportService.importBoard(ownerId, {
      board: { title: 'B2' },
      tasks: [{ title: 'Over', notes: 'a'.repeat(20001) }],
    });
    expect(over.warnings).toContainEqual({
      code: 'board.import.warning.taskNotesTruncated',
      params: { taskTitle: 'Over', max: 20000 },
    });
  });

  it('AC13 boundary: planned_minutes of exactly 9999 is stored with no warning', async () => {
    const result = await boardImportService.importBoard(ownerId, {
      board: { title: 'B' },
      tasks: [{ title: 'Max estimate', planned_minutes: 9999 }],
    });
    expect(result.warnings).toEqual([]);
    const taskRow = await db('tasks').where({ board_id: result.board.id }).first();
    expect(taskRow.planned_minutes).toBe(9999);
  });

  it('US-041: a non-object legacy `attachment` (string / number) is ignored — no description, no warning', async () => {
    const result = await boardImportService.importBoard(ownerId, {
      board: { title: 'B' },
      tasks: [
        { title: 'String attachment', attachment: 'just text' },
        { title: 'Number attachment', attachment: 42 },
      ],
    });
    expect(result.warnings).toEqual([]);
    const taskRows = await db('tasks').where({ board_id: result.board.id }).orderBy('position', 'asc');
    expect(taskRows.map((t) => t.notes)).toEqual([null, null]);
    expect(await db('attachments').where({ created_by: ownerId })).toHaveLength(0);
  });
});
