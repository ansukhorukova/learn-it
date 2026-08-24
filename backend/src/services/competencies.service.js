const db = require('../db/knex');
const { isUuid } = require('../lib/uuid');
const { ValidationError, NotFoundError, ConflictError } = require('../lib/serviceErrors');
const { lockRow } = require('../lib/db');

/**
 * `competencies` (dictionary) + `user_competencies` (a user's own picks,
 * dictionary or custom, each with its own `willing_to_teach` flag) —
 * AUTH-005/AUTH-006/AUTH-007. Every function below is scoped to the
 * caller's own rows only (`user_id = callerId`, always from
 * `req.firebaseUser.uid`, never a route param) — there is no cross-user read
 * here, unlike boardMembers/taskShares which manage OTHER people's access to
 * a shared resource.
 */

// AUTH-006 AC3.
const CUSTOM_LABEL_MAX_LENGTH = 100;

function toCatalogEntry(row) {
  return { id: row.id, slug: row.slug };
}

function toUserCompetency(row) {
  return {
    id: row.id,
    userId: row.user_id,
    competencyId: row.competency_id,
    // Only present for a dictionary pick (joined from `competencies.slug` —
    // see the queries below); null for a custom entry, which is rendered
    // from `customLabel` directly, never through the locale dictionary
    // (AUTH-006 AC4: "без спроби перекладу чи прогону через competency.<slug>").
    competencySlug: row.competency_slug || null,
    isCustom: row.is_custom,
    customLabel: row.custom_label,
    willingToTeach: row.willing_to_teach,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * The active dictionary (AUTH-005 AC1) — what the FE's picker offers. A
 * competency retired via `is_active = false` simply stops appearing here;
 * existing `user_competencies` rows that reference it are untouched (AUTH-005
 * AC6) and keep rendering via their own joined `competency_slug`, which this
 * function has no bearing on.
 */
async function listActiveCompetencies() {
  const rows = await db('competencies').where({ is_active: true }).orderBy('slug', 'asc');
  return rows.map(toCatalogEntry);
}

/**
 * The caller's own competencies (dictionary picks, LEFT JOINed for their
 * slug, plus custom entries) for rendering the profile screen.
 */
async function listUserCompetencies(userId) {
  const rows = await db('user_competencies')
    .leftJoin('competencies', 'competencies.id', 'user_competencies.competency_id')
    .where('user_competencies.user_id', userId)
    .select('user_competencies.*', 'competencies.slug as competency_slug')
    .orderBy('user_competencies.created_at', 'asc');
  return rows.map(toUserCompetency);
}

/**
 * Adds a competency to the caller's profile — either a dictionary pick
 * (`competencyId`, AUTH-005) or a free-text entry (`customLabel`,
 * AUTH-006). Exactly one of the two must be given (AUTH-006 AC5).
 *
 * AUTH-005 AC5: an unknown/malformed `competencyId` is a 400
 * `errors.competency.notFound` — NOT a 404. This is a deliberate literal
 * reading of the approved AC (unusual next to this codebase's usual
 * "malformed id -> 404" convention for id-in-URL params, e.g.
 * timeEntries.service.js) — here the id is a BODY field naming what to
 * create, closer in spirit to "you asked to attach a competency that
 * doesn't exist" (a bad request) than "you asked to read a resource that
 * isn't there".
 */
async function addUserCompetency(userId, { competencyId, customLabel } = {}) {
  const hasCompetencyId = competencyId !== undefined && competencyId !== null && competencyId !== '';
  const hasCustomLabel = customLabel !== undefined && customLabel !== null && String(customLabel).trim() !== '';

  if (hasCompetencyId && hasCustomLabel) throw new ValidationError('errors.competency.invalidPayload');
  if (!hasCompetencyId && !hasCustomLabel) {
    // A customLabel field that's present but blank/whitespace-only is a more
    // specific error than "invalid payload" (AUTH-006 AC2) — only fall
    // through to the generic "neither field" error when customLabel wasn't
    // attempted at all.
    if (customLabel !== undefined && customLabel !== null && !hasCustomLabel) {
      throw new ValidationError('errors.competency.customLabelRequired');
    }
    throw new ValidationError('errors.competency.invalidPayload');
  }

  if (hasCompetencyId) {
    if (!isUuid(competencyId)) throw new ValidationError('errors.competency.notFound');
    const competency = await db('competencies').where({ id: competencyId }).first();
    if (!competency) throw new ValidationError('errors.competency.notFound');
    if (!competency.is_active) throw new ValidationError('errors.competency.inactive');

    const existing = await db('user_competencies').where({ user_id: userId, competency_id: competencyId }).first();
    if (existing) throw new ConflictError('errors.competency.alreadyAdded');

    // `onConflict(...).ignore()` (rather than catching a raw unique-violation
    // by constraint name) is the concurrency-safe backstop behind the
    // existence check above: two racing "add the same competency" requests
    // both pass the check, but only one INSERT actually lands — the loser's
    // `returning('*')` comes back empty instead of throwing, which this maps
    // to the same 409 the pre-check gives the common (non-racing) case.
    const inserted = await db('user_competencies')
      .insert({ user_id: userId, competency_id: competencyId, is_custom: false, willing_to_teach: false })
      .onConflict(['user_id', 'competency_id'])
      .ignore()
      .returning('*');
    if (inserted.length === 0) throw new ConflictError('errors.competency.alreadyAdded');
    return toUserCompetency({ ...inserted[0], competency_slug: competency.slug });
  }

  const trimmedLabel = String(customLabel).trim();
  if (trimmedLabel.length > CUSTOM_LABEL_MAX_LENGTH) throw new ValidationError('errors.competency.customLabelTooLong');

  const [row] = await db('user_competencies')
    .insert({ user_id: userId, competency_id: null, is_custom: true, custom_label: trimmedLabel, willing_to_teach: false })
    .returning('*');
  return toUserCompetency(row);
}

/**
 * AUTH-007: toggles `willing_to_teach` on one of the caller's own
 * `user_competencies` rows, dictionary or custom alike (AC4 — the flag
 * doesn't care about origin). Anti-enumeration (AC3): an id that belongs to
 * another user resolves to the SAME 404 `errors.competency.notFound` as a
 * genuinely missing id — never a 403, same convention as
 * timeEntries.service.js's updateTimeEntry/deleteTimeEntry.
 */
async function updateWillingToTeach(userId, id, { willingToTeach } = {}) {
  if (!isUuid(id)) throw new NotFoundError('errors.competency.notFound');
  if (typeof willingToTeach !== 'boolean') throw new ValidationError('errors.competency.invalidPayload');

  const row = await db.transaction(async (trx) => {
    const existing = await lockRow(trx, 'user_competencies', id, () => new NotFoundError('errors.competency.notFound'));
    if (existing.user_id !== userId) throw new NotFoundError('errors.competency.notFound');
    const [updated] = await trx('user_competencies')
      .where({ id })
      .update({ willing_to_teach: willingToTeach, updated_at: trx.fn.now() })
      .returning('*');
    return updated;
  });

  if (!row.competency_id) return toUserCompetency(row);
  const competency = await db('competencies').where({ id: row.competency_id }).first();
  return toUserCompetency({ ...row, competency_slug: competency ? competency.slug : null });
}

/**
 * Removes one of the caller's own competencies (AUTH-005 AC4 / AUTH-006
 * AC6) — a single endpoint for both dictionary and custom entries. Same
 * lockRow-then-ownership-check-then-404 shape and anti-enumeration
 * guarantee as updateWillingToTeach above (never 403 for another user's
 * row). `willing_to_teach` has no independent existence — deleting the row
 * removes it too (AUTH-005 AC4), there's nothing further to clean up.
 */
async function removeUserCompetency(userId, id) {
  if (!isUuid(id)) throw new NotFoundError('errors.competency.notFound');

  await db.transaction(async (trx) => {
    const existing = await lockRow(trx, 'user_competencies', id, () => new NotFoundError('errors.competency.notFound'));
    if (existing.user_id !== userId) throw new NotFoundError('errors.competency.notFound');
    await trx('user_competencies').where({ id }).delete();
  });
}

module.exports = {
  CUSTOM_LABEL_MAX_LENGTH,
  listActiveCompetencies,
  listUserCompetencies,
  addUserCompetency,
  updateWillingToTeach,
  removeUserCompetency,
};
