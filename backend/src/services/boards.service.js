const db = require('../db/knex');
const { isUuid } = require('../lib/uuid');
const { ValidationError, NotFoundError } = require('../lib/serviceErrors');
const { getOwnedBoard, requireBoardRole } = require('../lib/authz');
const { lockedUpdate } = require('../lib/db');
const storage = require('../lib/storage');

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 2000;

// Small fixed palette of accent keys — the FE maps each to a design token
// (frontend/src/styles/tokens.css: --board-accent-*), deliberately separate
// from --color-accent-amber (reserved for active-timer UI per CLAUDE.md
// "Стилізація"). Keep in sync with frontend/src/constants/boardAccents.js.
const ACCENTS = ['teal', 'rose', 'violet', 'sky', 'moss', 'clay'];
const DEFAULT_ACCENT = ACCENTS[0];

function resolveAccent(accent) {
  return ACCENTS.includes(accent) ? accent : DEFAULT_ACCENT;
}

function validateTitle(title) {
  const trimmed = typeof title === 'string' ? title.trim() : '';
  if (!trimmed) throw new ValidationError('errors.board.titleRequired');
  if (trimmed.length > TITLE_MAX_LENGTH) throw new ValidationError('errors.board.titleTooLong');
  return trimmed;
}

function normalizeDescription(description) {
  if (description === undefined) return undefined;
  if (description === null) return null;
  const trimmed = String(description).trim();
  if (trimmed.length > DESCRIPTION_MAX_LENGTH) throw new ValidationError('errors.board.descriptionTooLong');
  return trimmed || null;
}

const VISIBILITIES = ['private', 'public'];

function validateVisibility(visibility) {
  if (!VISIBILITIES.includes(visibility)) throw new ValidationError('errors.board.visibilityInvalid');
  return visibility;
}

// US-021: `categoryId` reuses the `competencies` dictionary — no new table
// (business-analyst's approved decision #2). Returns:
//   - `undefined` when `categoryId` itself was `undefined` — "field omitted,
//     leave unchanged" (updateBoard's caller checks this the same way it
//     already does for `title`/`accent`/etc); createBoard treats this as
//     "no category" (null) since there's nothing to leave unchanged yet.
//   - `null` for an explicit reset ("Без категорії"/`categoryId: null`).
//   - the validated id otherwise.
// 400 `errors.board.categoryInvalid` for a malformed/nonexistent id, 400
// `errors.board.categoryInactive` for a real but `is_active: false` one
// (AC6: a board that already has an inactive category keeps it — this
// validation only ever runs against an id the caller is actively trying to
// ASSIGN right now, never re-validates an already-stored, untouched value).
async function resolveCategoryId(categoryId) {
  if (categoryId === undefined) return undefined;
  if (categoryId === null) return null;
  if (!isUuid(categoryId)) throw new ValidationError('errors.board.categoryInvalid');
  const competency = await db('competencies').where({ id: categoryId }).first();
  if (!competency) throw new ValidationError('errors.board.categoryInvalid');
  if (!competency.is_active) throw new ValidationError('errors.board.categoryInactive');
  return categoryId;
}

// US-023: `languageIds` full-replace semantics (not diff/append) —
// `undefined` means "field omitted, leave the board's current language set
// untouched" (same partial-update convention as `publicName`/
// `plannedMinutes`); an array (including `[]`) means "replace the board's
// entire `board_languages` set with exactly this". Validates ALL ids before
// returning anything, so a caller that gets a non-`undefined` result back
// knows every id is real, active, and de-duplicated — the actual DELETE+
// INSERT happens inside the caller's own transaction (createBoard/
// updateBoard), keeping "all-or-nothing" (US-023 AC5) a property of when
// this function is called (always before opening that transaction), not
// something it enforces on the DB writes itself.
async function resolveLanguages(languageIds) {
  if (languageIds === undefined) return undefined;
  if (!Array.isArray(languageIds)) throw new ValidationError('errors.board.languageInvalid');
  const uniqueIds = [...new Set(languageIds)];
  if (uniqueIds.length === 0) return [];
  if (uniqueIds.some((id) => !isUuid(id))) throw new ValidationError('errors.board.languageInvalid');
  const rows = await db('languages').whereIn('id', uniqueIds);
  if (rows.length !== uniqueIds.length || rows.some((row) => !row.is_active)) {
    throw new ValidationError('errors.board.languageInvalid');
  }
  return rows;
}

// Replaces `board_languages` for `boardId` with exactly `languageRows`
// (already-validated `languages` rows from resolveLanguages above) inside
// `trx`. Only called when `languageIds` was actually present in the
// request — callers guard on `resolveLanguages`'s `undefined` sentinel
// before reaching here.
async function replaceBoardLanguages(trx, boardId, languageRows) {
  await trx('board_languages').where({ board_id: boardId }).delete();
  if (languageRows.length > 0) {
    await trx('board_languages').insert(languageRows.map((row) => ({ board_id: boardId, language_id: row.id })));
  }
}

// A board's tagged languages (id/slug pairs, US-023), for one or many boards
// at once — same live-join, never-denormalized approach as `taskCount`.
// Returns a Map(boardId -> Array<{id, slug}>); a board with no languages
// simply has no key (callers default to `[]`).
async function getLanguagesForBoards(boardIds) {
  if (!boardIds || boardIds.length === 0) return new Map();
  const rows = await db('board_languages')
    .join('languages', 'languages.id', 'board_languages.language_id')
    .whereIn('board_languages.board_id', boardIds)
    .select('board_languages.board_id as board_id', 'languages.id as id', 'languages.slug as slug')
    .orderBy('languages.slug', 'asc');
  const map = new Map();
  rows.forEach((row) => {
    if (!map.has(row.board_id)) map.set(row.board_id, []);
    map.get(row.board_id).push({ id: row.id, slug: row.slug });
  });
  return map;
}

// `taskCount` comes from a LEFT JOIN + COUNT, not a denormalized column on
// `boards` — always accurate, no risk of drifting out of sync with the
// `tasks` table as tasks are created/moved/deleted.
//
// `myRole` (US13-US17, extended by US-022): the caller's effective role on
// this board. Defaults to 'owner' when the caller didn't attach
// `row.my_role` — true for every row from listBoardsForOwner (scoped to
// `owner_id = caller`, "shared with me" listing is explicitly out of scope
// this pass) and for create/rename (both owner-only actions).
// getBoardForOwner below is the one path that can return a non-owner role
// (`collaborator`/`viewer`/US-022's `public`), and explicitly sets it.
//
// `categoryId`/`languages`/`visibility` (US-021/US-022/US-023): `languages`
// must be attached by the caller (via getLanguagesForBoards) BEFORE calling
// this — it's a live join this function has no DB access to perform itself,
// same reasoning as `task_count` being computed by the caller's own query.
function toBoardSummary(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    accent: row.accent,
    ownerId: row.owner_id,
    categoryId: row.category_id ?? null,
    languages: row.languages || [],
    visibility: row.visibility || 'private',
    taskCount: Number(row.task_count) || 0,
    myRole: row.my_role || 'owner',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// US-024 AC8: the caller's own boards never appear in the public list
// (`listPublicBoards` below excludes `owner_id = caller`), so `myRole` here
// is unconditionally `'public'` — there's no owner/collaborator/viewer case
// to resolve. `ownerName` (US-024 AC8, same public_name-falls-back-to-
// display_name resolution as boardMembers.service.js's toMember/
// taskComments.service.js's toComment) is the one field this shape has that
// the plain Board summary doesn't; `totalSeconds`/`thisWeekSeconds` are
// deliberately absent — US-022 AC12/US-024 AC8 require this list to never
// carry another user's time-tracking data, not even in aggregate, so there
// is no field for the route layer to accidentally merge one into.
function toPublicBoardSummary(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    accent: row.accent,
    ownerId: row.owner_id,
    ownerName: row.owner_public_name || row.owner_display_name,
    categoryId: row.category_id ?? null,
    languages: row.languages || [],
    visibility: row.visibility,
    taskCount: Number(row.task_count) || 0,
    myRole: 'public',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// US-021 AC9: `categoryId` narrows the list to boards with that exact
// `category_id`; omitted/empty means no filter. A malformed (non-uuid)
// filter value resolves to "no boards match" rather than a 400 — this is a
// read-side query refinement, not a write whose shape is being validated,
// so there's nothing actionable to reject; the alternative (passing a
// literal non-uuid string to Postgres) would 500 on an `invalid input
// syntax for type uuid` error instead.
async function listBoardsForOwner(ownerId, { categoryId } = {}) {
  const hasCategoryFilter = categoryId !== undefined && categoryId !== null && categoryId !== '';
  if (hasCategoryFilter && !isUuid(categoryId)) return [];

  let query = db('boards')
    .leftJoin('tasks', 'tasks.board_id', 'boards.id')
    .where('boards.owner_id', ownerId)
    .groupBy('boards.id')
    .select('boards.*')
    .count('tasks.id as task_count')
    .orderBy('boards.created_at', 'asc');
  if (hasCategoryFilter) query = query.where('boards.category_id', categoryId);

  const rows = await query;
  const languagesByBoard = await getLanguagesForBoards(rows.map((row) => row.id));
  return rows.map((row) => toBoardSummary({ ...row, languages: languagesByBoard.get(row.id) || [] }));
}

// US-021/US-023: `categoryId`/`languageIds` are validated up front — before
// the board row is even inserted — so a bad value never leaves a partially
// created board behind (POST is a single all-or-nothing operation by
// nature; there's no "board already exists, only the category failed"
// state to guard against here the way updateBoard's PATCH has to).
// `visibility` is deliberately NOT accepted here (US-022's API surface:
// only `PATCH` exposes it) — every new board starts `private`, the column's
// own DB default.
async function createBoard(ownerId, { title, description, accent, categoryId, languageIds } = {}) {
  const validTitle = validateTitle(title);
  const resolvedCategoryId = await resolveCategoryId(categoryId);
  const languageRows = await resolveLanguages(languageIds);

  const row = await db.transaction(async (trx) => {
    const [inserted] = await trx('boards')
      .insert({
        title: validTitle,
        description: normalizeDescription(description) ?? null,
        accent: resolveAccent(accent),
        owner_id: ownerId,
        category_id: resolvedCategoryId === undefined ? null : resolvedCategoryId,
      })
      .returning('*');
    if (languageRows !== undefined && languageRows.length > 0) {
      await trx('board_languages').insert(languageRows.map((l) => ({ board_id: inserted.id, language_id: l.id })));
    }
    return inserted;
  });

  const languages = (languageRows || []).map((l) => ({ id: l.id, slug: l.slug }));
  return toBoardSummary({ ...row, task_count: 0, languages });
}

async function countTasks(boardId) {
  const [{ count }] = await db('tasks').where({ board_id: boardId }).count('id as count');
  return count;
}

// US13-US17: the board view header is now reachable by a shared board's
// collaborator/viewer, not just the owner — `requireBoardRole(..., 'viewer')`
// accepts any board_members role (or owner). US-022 extends this further:
// it also now accepts a `myRole: 'public'` visitor on a `visibility: 'public'`
// board with no membership row of their own (lib/authz.js's getBoardRole) —
// `myRole` on the response tells the FE which one so it can gate write UI
// (e.g. hide "add task" for a viewer/public visitor) without a second
// request.
async function getBoardForOwner(boardId, userId) {
  const { board, role } = await requireBoardRole(boardId, userId, 'viewer');
  const taskCount = await countTasks(boardId);
  const languagesByBoard = await getLanguagesForBoards([boardId]);
  return toBoardSummary({
    ...board,
    task_count: taskCount,
    my_role: role,
    languages: languagesByBoard.get(boardId) || [],
  });
}

// US-021/US-022/US-023: `categoryId`/`visibility`/`languageIds` follow the
// exact same "undefined = leave unchanged" partial-update convention as
// `title`/`description`/`accent` above (and `publicName`/`plannedMinutes`
// elsewhere in this codebase) — omitting a field from the PATCH body never
// touches it. `languageIds: []` is the one deliberate exception (US-023
// AC4): an explicitly empty array is a real, meaningful "clear every
// language", distinct from omitting the field entirely.
//
// All validation — including the DB lookups `resolveCategoryId`/
// `resolveLanguages` need — runs BEFORE `getOwnedBoard`'s result is used to
// open the write transaction below, so a validation failure (bad
// `categoryId`/`languageIds`) never applies ANY part of the patch (US-023
// AC5's "все-або-нічого" reads naturally as a property of this ordering,
// not of some rollback machinery: the transaction simply never starts).
async function updateBoard(boardId, ownerId, { title, description, accent, categoryId, visibility, languageIds } = {}) {
  await getOwnedBoard(boardId, ownerId); // throws NotFoundError/ForbiddenError

  const patch = { updated_at: db.fn.now() };
  if (title !== undefined) patch.title = validateTitle(title);
  const normalizedDescription = normalizeDescription(description);
  if (normalizedDescription !== undefined) patch.description = normalizedDescription;
  if (accent !== undefined) patch.accent = resolveAccent(accent);
  if (categoryId !== undefined) patch.category_id = await resolveCategoryId(categoryId);
  if (visibility !== undefined) patch.visibility = validateVisibility(visibility);

  const languageRows = await resolveLanguages(languageIds); // undefined = leave unchanged

  // Previously: a bare `UPDATE ... RETURNING *` outside any transaction,
  // with the result spread straight into toBoardSummary with no existence
  // check. A concurrent deleteBoard in the gap between the unlocked
  // getOwnedBoard() above and this UPDATE made the UPDATE affect zero rows,
  // so `row` was `undefined` and `{ ...undefined, task_count }` silently
  // produced `{ id: undefined, ... }` — a 200 response with garbage data
  // instead of any error signal (code-reviewer: worse than a crash, since
  // the client has no indication anything went wrong). lockedUpdate
  // (lib/db.js) re-locks and re-checks the board's existence inside a
  // transaction immediately before writing, so a board deleted in that
  // window now surfaces as a clean NotFoundError instead of a phantom
  // success — same fix shape as tasks.service.js's updateTask/deleteTask.
  const row = await db.transaction(async (trx) => {
    const updated = await lockedUpdate(trx, 'boards', boardId, patch, () => new NotFoundError('errors.board.notFound'));
    // US-023: only touched when `languageIds` was actually present in the
    // request — `languageRows === undefined` means "leave the board's
    // current language set untouched", same convention as every other
    // omitted field above.
    if (languageRows !== undefined) {
      await replaceBoardLanguages(trx, boardId, languageRows);
    }
    return updated;
  });
  const taskCount = await countTasks(boardId);
  const languagesByBoard = await getLanguagesForBoards([boardId]);
  return toBoardSummary({ ...row, task_count: taskCount, languages: languagesByBoard.get(boardId) || [] });
}

// US-024: boards visible to `callerId` for discovery, NOT owned by them
// (US-024 AC2 — a board the caller owns only ever appears in "Мої дошки",
// never duplicated here even if it's also public). US-021 AC9/US-023 AC8:
// `categoryId` (single) / `languageIds` (OR — matches ANY of the given ids,
// via `whereExists` against `board_languages` rather than a JOIN, so a
// board tagged with multiple of the requested languages still appears
// exactly once) independently narrow the list; both omitted means no
// filtering beyond `visibility = 'public' AND owner_id != callerId`.
//
// Same "malformed filter value matches nothing, doesn't 500" reasoning as
// listBoardsForOwner's `categoryId` handling above extends to `languageIds`
// here: any entries that aren't valid uuids are dropped, and if that leaves
// zero usable ids from an otherwise non-empty filter, the result is an
// empty list rather than silently falling back to "no filter" (which would
// return MORE than what was asked for) or a 500.
//
// AC12 (US-022) / AC8 (US-024): only fields safe for anyone to see —
// title/description/accent/category/languages/taskCount/ownerName. No
// `time_entries` join, no attachment data of any kind, at any point in this
// query — this list is safe by construction, not by a filter applied after
// the fact.
async function listPublicBoards(callerId, { categoryId, languageIds } = {}) {
  const hasCategoryFilter = categoryId !== undefined && categoryId !== null && categoryId !== '';
  if (hasCategoryFilter && !isUuid(categoryId)) return [];

  const languageIdsArray = Array.isArray(languageIds) ? languageIds : languageIds ? [languageIds] : [];
  let validLanguageIds = null;
  if (languageIdsArray.length > 0) {
    validLanguageIds = languageIdsArray.filter(isUuid);
    if (validLanguageIds.length === 0) return [];
  }

  let query = db('boards')
    .leftJoin('tasks', 'tasks.board_id', 'boards.id')
    .join('users', 'users.id', 'boards.owner_id')
    .where('boards.visibility', 'public')
    .whereNot('boards.owner_id', callerId)
    .groupBy('boards.id', 'users.id')
    .select('boards.*', 'users.display_name as owner_display_name', 'users.public_name as owner_public_name')
    .count('tasks.id as task_count')
    .orderBy('boards.created_at', 'asc');

  if (hasCategoryFilter) query = query.where('boards.category_id', categoryId);
  if (validLanguageIds) {
    query = query.whereExists(function boardHasAnyLanguage() {
      this.select(1)
        .from('board_languages')
        .whereRaw('board_languages.board_id = boards.id')
        .whereIn('board_languages.language_id', validLanguageIds);
    });
  }

  const rows = await query;
  const languagesByBoard = await getLanguagesForBoards(rows.map((row) => row.id));
  return rows.map((row) => toPublicBoardSummary({ ...row, languages: languagesByBoard.get(row.id) || [] }));
}

async function deleteBoard(boardId, ownerId) {
  // Wrapped in a transaction that locks the board row before deleting
  // (third fix pass, code-reviewer MAJOR finding) — mirrors the
  // createTask/updateTask board-row-lock invariant (see tasks.service.js),
  // now also extended to the delete path. Previously this was a bare,
  // unlocked ownership check followed by a bare DELETE outside any
  // transaction, so nothing serialized it against a concurrent
  // updateTask/createTask's lock acquisition on the same board — a task
  // reorder racing this delete could observe a phantom board mid-request.
  // Folding the ownership check into the locked read (via getOwnedBoard's
  // trx/forUpdate options) avoids a second unlocked-then-locked read gap,
  // same fix shape as createTask.
  // Collected inside the transaction below (storage_path of every file-kind
  // attachment under any task on this board), then used to clean up the
  // corresponding MinIO objects AFTER the transaction commits — same
  // best-effort, outside-the-trx shape as tasks.service.js's deleteTask
  // (see its comment for the full rationale).
  let orphanedStorageKeys = [];

  await db.transaction(async (trx) => {
    await getOwnedBoard(boardId, ownerId, { trx, forUpdate: true });

    // `tasks.board_id` and `attachments.task_id` are both ON DELETE CASCADE
    // (see migrations) — the single DELETE below removes every task AND
    // every attachment row under this board at the DB level. That cascade
    // only touches Postgres, not the MinIO objects file-kind attachments
    // point at, so their keys are read here first, before the cascade
    // removes the rows that reference them (US9).
    orphanedStorageKeys = (
      await trx('attachments')
        .join('tasks', 'tasks.id', 'attachments.task_id')
        .where({ 'tasks.board_id': boardId, 'attachments.kind': 'file' })
        .select('attachments.storage_path as storage_path')
    )
      .map((r) => r.storage_path)
      .filter(Boolean);

    await trx('boards').where({ id: boardId }).delete();
  });

  await Promise.all(
    orphanedStorageKeys.map((key) =>
      storage.deleteObject(key).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to delete attachment object from storage after board delete', key, err);
      }),
    ),
  );
}

module.exports = {
  ACCENTS,
  VISIBILITIES,
  listBoardsForOwner,
  listPublicBoards,
  createBoard,
  getOwnedBoard,
  getBoardForOwner,
  updateBoard,
  deleteBoard,
};
