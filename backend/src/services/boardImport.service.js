const db = require('../db/knex');
const { ValidationError } = require('../lib/serviceErrors');
const { toBoardSummary } = require('./boards.service');

/**
 * `POST /api/v1/boards/import` (US-037) — bulk-creates a board + all its
 * tasks from a single parsed JSON payload, in ONE transaction. Partial
 * imports never happen: any critical validation failure (see the
 * `ValidationError`s below) throws BEFORE the transaction is opened — the
 * exact same "validate everything up front, so the write is all-or-nothing
 * by construction" ordering `boards.service.js`'s `createBoard` already uses
 * for `resolveCategoryId`/`resolveLanguages`.
 *
 * US-041: the full text of a book section is the task's Description
 * (`tasks.notes`) — it used to be stored as a separate `kind: 'note'`
 * attachment. The import no longer creates attachments at all. A file's
 * per-task `notes` carries that text; for back-compat with files an older
 * Skill generated, a legacy `attachment.body` is used as the notes source
 * when `notes` itself is absent.
 *
 * Server-authoritative fields (US-037 AC4): the new board is always
 * `visibility: 'private'`, every task is `status: 'planned'` with
 * `position = (index + 1) * 1000`, and `owner_id`/`created_by` is always the
 * caller — any such field present in the file is ignored.
 *
 * Non-critical issues (unknown/inactive category or language slug, an
 * invalid `planned_minutes`, an over-long description) never block the
 * import — they are collected as `warnings` (`{code, params}`, a locale key
 * + its params, rendered by the FE's own dictionary, same principle as error
 * `messageKey`s) and returned alongside the 201.
 */

// Reuses boards.service.js's own board title/description limits (kept in
// sync by intent — same columns, same UI meaning).
const BOARD_TITLE_MAX_LENGTH = 100;
const BOARD_DESCRIPTION_MAX_LENGTH = 2000;
// US-037 AC8: task title reuses tasks.service.js's TITLE_MAX_LENGTH, notes
// its NOTES_MAX_LENGTH.
const TASK_TITLE_MAX_LENGTH = 200;
// US-041: mirrors tasks.service.js's NOTES_MAX_LENGTH — the imported
// description is "the full text of a book section". Over this, the text is
// trimmed (not rejected) and a non-critical
// `board.import.warning.taskNotesTruncated` warning is added.
const TASK_NOTES_MAX_LENGTH = 20000;
// US-037 AC7: at most 200 tasks per import — a chunked/paged import is out
// of scope for this pass.
const MAX_TASKS = 200;
// US-037 AC13: reuses US-020's estimate bounds (whole minutes, 0–9999).
const PLANNED_MINUTES_MAX = 9999;

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateBoardTitle(title) {
  const trimmed = asTrimmedString(title);
  if (!trimmed) throw new ValidationError('errors.boardImport.boardTitleRequired');
  if (trimmed.length > BOARD_TITLE_MAX_LENGTH) throw new ValidationError('errors.boardImport.boardTitleTooLong');
  return trimmed;
}

function normalizeBoardDescription(description) {
  if (description === undefined || description === null) return null;
  const trimmed = String(description).trim();
  if (trimmed.length > BOARD_DESCRIPTION_MAX_LENGTH) throw new ValidationError('errors.board.descriptionTooLong');
  return trimmed || null;
}

// US-037 AC11: `board.category` is a competency SLUG (the import contract is
// slug-based, not id-based). An unknown or inactive slug is a warning, not
// an error — the board is created without a category.
async function resolveCategoryFromSlug(rawSlug, warnings) {
  const slug = asTrimmedString(rawSlug);
  if (!slug) return null;
  const competency = await db('competencies').where({ slug }).first();
  if (!competency) {
    warnings.push({ code: 'board.import.warning.unknownCategory', params: { slug } });
    return null;
  }
  if (!competency.is_active) {
    warnings.push({ code: 'board.import.warning.inactiveCategory', params: { slug } });
    return null;
  }
  return competency.id;
}

// US-037 AC12: `board.languages` is an array of language SLUGs. Each unknown
// or inactive slug is skipped with its own warning; the valid ones are
// still saved. A missing/empty/non-array value means no languages, no
// warning.
async function resolveLanguagesFromSlugs(rawLanguages, warnings) {
  if (!Array.isArray(rawLanguages) || rawLanguages.length === 0) return [];
  const seen = new Set();
  const resolved = [];
  for (const raw of rawLanguages) {
    const slug = asTrimmedString(raw);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    // eslint-disable-next-line no-await-in-loop -- dictionary is tiny and a
    // board realistically has a handful of languages; a per-slug lookup
    // keeps the unknown/inactive warning specific to each slug.
    const language = await db('languages').where({ slug }).first();
    if (!language) {
      warnings.push({ code: 'board.import.warning.unknownLanguage', params: { slug } });
      continue;
    }
    if (!language.is_active) {
      warnings.push({ code: 'board.import.warning.inactiveLanguage', params: { slug } });
      continue;
    }
    resolved.push({ id: language.id, slug: language.slug });
  }
  return resolved;
}

// US-037 AC13: 0 / missing / null → NULL, no warning (0 = "not set", same as
// US-020 AC3). Anything else that isn't a whole number in [0, 9999] → NULL +
// a non-critical warning.
function resolvePlannedMinutes(rawValue, taskTitle, warnings) {
  if (rawValue === undefined || rawValue === null || rawValue === 0) return null;
  if (typeof rawValue !== 'number' || !Number.isInteger(rawValue) || rawValue < 0 || rawValue > PLANNED_MINUTES_MAX) {
    warnings.push({ code: 'board.import.warning.plannedMinutesDropped', params: { taskTitle } });
    return null;
  }
  return rawValue;
}

// US-041: the task Description (`tasks.notes`). Source text is `task.notes`;
// if that's absent, a legacy `task.attachment.body` is used instead
// (back-compat with files an older Skill generated — the import no longer
// creates attachments). Empty → null, no warning. Over TASK_NOTES_MAX_LENGTH
// → trimmed (not rejected) + a non-critical `taskNotesTruncated` warning.
function resolveNotes(rawTask, taskTitle, warnings) {
  let source = rawTask.notes;
  if (source === undefined || source === null || String(source).trim() === '') {
    const legacyAttachment = rawTask.attachment;
    if (legacyAttachment && typeof legacyAttachment === 'object' && !Array.isArray(legacyAttachment)) {
      source = legacyAttachment.body;
    }
  }
  if (source === undefined || source === null) return null;

  const trimmed = String(source).trim();
  if (!trimmed) return null;
  if (trimmed.length > TASK_NOTES_MAX_LENGTH) {
    warnings.push({
      code: 'board.import.warning.taskNotesTruncated',
      params: { taskTitle, max: TASK_NOTES_MAX_LENGTH },
    });
    return trimmed.slice(0, TASK_NOTES_MAX_LENGTH);
  }
  return trimmed;
}

function validateTasks(rawTasks, warnings) {
  if (!Array.isArray(rawTasks) || rawTasks.length === 0) {
    throw new ValidationError('errors.boardImport.tasksRequired');
  }
  if (rawTasks.length > MAX_TASKS) {
    throw new ValidationError('errors.boardImport.tooManyTasks', { max: MAX_TASKS });
  }

  return rawTasks.map((rawTask, i) => {
    const index = i + 1; // 1-based, for the localized `{index}` params
    const task = rawTask && typeof rawTask === 'object' ? rawTask : {};

    const title = asTrimmedString(task.title);
    if (!title) {
      throw new ValidationError('errors.boardImport.taskTitleRequired', { index });
    }
    if (title.length > TASK_TITLE_MAX_LENGTH) {
      throw new ValidationError('errors.boardImport.taskTitleTooLong', { index });
    }

    return {
      title,
      notes: resolveNotes(task, title, warnings),
      plannedMinutes: resolvePlannedMinutes(task.planned_minutes, title, warnings),
      position: index * 1000,
    };
  });
}

async function importBoard(ownerId, payload) {
  // US-037 AC5. `express.json()` on the route already rejects unparseable
  // JSON before this point; this is the defense-in-depth branch for a
  // payload that somehow reaches the service without the expected shape.
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ValidationError('errors.boardImport.invalidStructure');
  }
  const { board, tasks } = payload;
  if (!board || typeof board !== 'object' || Array.isArray(board) || !Array.isArray(tasks)) {
    throw new ValidationError('errors.boardImport.invalidStructure');
  }

  const warnings = [];

  // --- All validation BEFORE the transaction (US-037 AC3) ---
  const boardTitle = validateBoardTitle(board.title);
  const boardDescription = normalizeBoardDescription(board.description);
  const categoryId = await resolveCategoryFromSlug(board.category, warnings);
  const languageRows = await resolveLanguagesFromSlugs(board.languages, warnings);
  const preparedTasks = validateTasks(tasks, warnings);

  // --- Single all-or-nothing transaction (US-037 AC1) ---
  const created = await db.transaction(async (trx) => {
    const [boardRow] = await trx('boards')
      .insert({
        title: boardTitle,
        description: boardDescription,
        // `accent` omitted — the column defaults to 'teal' (US-037 AC4:
        // "accent за замовчуванням"), same as createBoard relies on for a
        // request with no accent.
        owner_id: ownerId,
        category_id: categoryId,
        visibility: 'private',
      })
      .returning('*');

    if (languageRows.length > 0) {
      await trx('board_languages').insert(
        languageRows.map((language) => ({ board_id: boardRow.id, language_id: language.id })),
      );
    }

    let createdTaskCount = 0;

    for (const preparedTask of preparedTasks) {
      // eslint-disable-next-line no-await-in-loop -- one INSERT per task,
      // all on the same transaction/connection; sequential keeps the
      // (board_id, status, position) ordering deterministic and the code
      // trivially readable. At most MAX_TASKS (200) iterations.
      await trx('tasks').insert({
        board_id: boardRow.id,
        title: preparedTask.title,
        notes: preparedTask.notes,
        status: 'planned',
        position: preparedTask.position,
        created_by: ownerId,
        planned_minutes: preparedTask.plannedMinutes,
      });
      createdTaskCount += 1;
    }

    return { boardRow, createdTaskCount };
  });

  return {
    board: toBoardSummary({
      ...created.boardRow,
      task_count: created.createdTaskCount,
      languages: languageRows.map((language) => ({ id: language.id, slug: language.slug })),
    }),
    createdTaskCount: created.createdTaskCount,
    warnings,
  };
}

module.exports = {
  BOARD_TITLE_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  TASK_NOTES_MAX_LENGTH,
  MAX_TASKS,
  importBoard,
};
