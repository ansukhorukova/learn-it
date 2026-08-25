const db = require('../db/knex');
const { SUPPORTED_LOCALES, resolveLocale } = require('../config/locales');
const { ValidationError, NotFoundError } = require('../lib/serviceErrors');
const { isUuid } = require('../lib/uuid');

// AUTH-004 AC4.
const PUBLIC_NAME_MAX_LENGTH = 100;

function toProfile(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    publicName: row.public_name,
    locale: row.locale,
    createdAt: row.created_at,
  };
}

function defaultDisplayName(decodedToken) {
  // Google sign-in tokens carry a `name` claim from the Google profile.
  // Email+password tokens don't — fall back to the local-part of the email.
  // Never overwritten on subsequent logins (see upsert logic below).
  if (decodedToken.name) return decodedToken.name;
  if (decodedToken.email) return decodedToken.email.split('@')[0];
  return decodedToken.uid;
}

// Firebase ID tokens carry which provider was used for *this* sign-in under
// `firebase.sign_in_provider` (e.g. 'password', 'google.com') — distinct
// from the top-level claims used elsewhere in this file. Unlike
// `display_name`, we want this to stay current across sign-ins, so it's
// written on every call, not just on first insert (see getOrCreateUser).
function signInProviderFrom(decodedToken) {
  return (decodedToken.firebase && decodedToken.firebase.sign_in_provider) || null;
}

/**
 * Idempotently ensures a `users` row exists for this Firebase-authenticated
 * caller and returns it. Called from GET /api/v1/users/me right after any
 * successful FE sign-in (either provider — this function never branches on
 * provider, only on whether a row already exists).
 *
 * `requestedLocale` is the browser-detected locale the FE sends on first
 * sync; it's only ever used to seed a brand-new row (INSERT ... ON CONFLICT
 * DO NOTHING) and is otherwise ignored so a returning user's persisted
 * preference (set later from profile settings) is never clobbered.
 */
async function getOrCreateUser(decodedToken, requestedLocale) {
  const { uid, email } = decodedToken;
  const signInProvider = signInProviderFrom(decodedToken);

  // Insert a brand-new row on first sign-in; on every subsequent sign-in
  // (conflict on `id`), refresh only `last_sign_in_provider`/`updated_at` —
  // `email`/`display_name`/`locale` must NOT be touched here (locale is
  // owned by the future profile-settings screen once set; display_name is
  // seeded once and never overwritten by the auth sync).
  const [row] = await db('users')
    .insert({
      id: uid,
      email,
      display_name: defaultDisplayName(decodedToken),
      locale: resolveLocale(requestedLocale),
      last_sign_in_provider: signInProvider,
    })
    .onConflict('id')
    .merge({ last_sign_in_provider: signInProvider, updated_at: db.fn.now() })
    .returning('*');

  return toProfile(row);
}

/**
 * Looks up which provider an email last signed in with — used ONLY by
 * GET /api/v1/auth/provider-hint on the signup-conflict path. See that
 * route for the anti-enumeration reasoning; this function itself is a plain
 * lookup with no authorization concern of its own (the route is what scopes
 * when it's safe to call).
 *
 * Returns null if there's no user with this email yet, or if the existing
 * row hasn't captured a provider yet (shouldn't happen post-migration, but
 * never throw over it — the caller falls back to a generic message).
 */
async function getSignInProviderForEmail(email) {
  if (!email) return null;
  const row = await db('users').whereRaw('lower(email) = lower(?)', [email]).first();
  return (row && row.last_sign_in_provider) || null;
}

/**
 * Validates a candidate `public_name` (AUTH-004 AC2-4): `null` (explicit
 * reset to the `display_name` fallback, AC3 — a deliberate action, not a
 * validation failure) passes through unchanged; a string is trimmed, an
 * empty-after-trim string is ALSO treated as a reset to null (AC3 covers
 * "clear the field and save", which the FE sends as an empty string, not
 * necessarily a literal `null`); anything left over 100 chars is rejected
 * (AC4).
 */
function validatePublicName(value) {
  if (value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (trimmed.length > PUBLIC_NAME_MAX_LENGTH) throw new ValidationError('errors.profile.publicNameTooLong');
  return trimmed;
}

/**
 * Validates a candidate `locale` (AUTH-008 AC6): must be one of the
 * registered supported codes (`backend/src/config/locales.js`, the same
 * registry `resolveLocale`/`getOrCreateUser` use) — reused here rather than
 * hardcoding `['en', 'uk']` again, so a future third locale only needs
 * registering in one place. Unlike `resolveLocale` (which silently falls
 * back to the default for an unrecognized code — appropriate for the
 * best-effort browser-detected seed on first sign-in), an explicit PATCH
 * with an unsupported code is a hard validation error, not a silent
 * fallback.
 */
function validateLocale(value) {
  if (!SUPPORTED_LOCALES.includes(value)) {
    throw new ValidationError('errors.profile.localeInvalid');
  }
  return value;
}

/**
 * Partial update of the caller's own profile (AUTH-004 `publicName`,
 * AUTH-008 `locale`). Any other key in the body is silently ignored, and
 * OMITTING a recognized field entirely leaves that column untouched (AC8:
 * "PATCH ... без поля public_name ... лишається незмінним", same contract
 * now extended to `locale` per AUTH-008 AC4), same "undefined vs explicit
 * value" convention already used throughout timeEntries.service.js's
 * updateTimeEntry.
 *
 * `userId` is always `req.firebaseUser.uid` from an already-verified token
 * (CLAUDE.md: BE is the single point of authorization) — there is no id
 * parameter here for a caller to substitute another user's id, unlike
 * every other resource in this codebase that takes a route `:id`.
 */
async function updateProfile(userId, { publicName, locale } = {}) {
  const patch = {};
  if (publicName !== undefined) {
    patch.public_name = validatePublicName(publicName);
  }
  if (locale !== undefined) {
    patch.locale = validateLocale(locale);
  }

  if (Object.keys(patch).length === 0) {
    const row = await db('users').where({ id: userId }).first();
    // Shouldn't happen — requireAuth already verified the token, and every
    // authenticated caller has a row from getOrCreateUser's first-sign-in
    // upsert. Not a NotFoundError (that maps to a misleading 404 with no
    // matching "profile not found" messageKey) — let it fall through to
    // sendServiceError's generic 500 branch like any other unexpected state.
    if (!row) throw new Error(`users.updateProfile: no row for authenticated uid ${userId}`);
    return toProfile(row);
  }

  patch.updated_at = db.fn.now();
  const [row] = await db('users').where({ id: userId }).update(patch).returning('*');
  if (!row) throw new Error(`users.updateProfile: update returned no row for authenticated uid ${userId}`);
  return toProfile(row);
}

// AUTH-004 AC5/AC6 public_name-falls-back-to-display_name pattern, same
// resolution every other resource in this codebase uses when showing one
// user's name to another (taskComments.service.js's authorName,
// boardMembers.service.js's displayName, dmThreads.service.js's
// otherUser.name, ...).
function resolvePublicDisplayName(row) {
  return row.public_name || row.display_name;
}

/**
 * GET /api/v1/users/search?competencyId= (US-025). Public profiles of every
 * user whose `user_competencies` row for THIS SPECIFIC competency has
 * `willing_to_teach = true` (AC1 — literally "willing to teach it", not
 * merely "has it listed"). For each match, the response also carries that
 * user's FULL list of `willing_to_teach = true` competencies (AC4 — useful
 * context beyond just the one searched for), never email/boards/time
 * (AC4's explicit privacy boundary).
 *
 * A missing/malformed `competencyId` (AC2 — "запит до BE не виконується
 * без параметра" is the FE's job; this is the defensive BE-side twin of
 * that) or one that matches nobody (AC3) both resolve to a plain empty
 * array rather than an error — there's no AC-defined error path for this
 * query param, and "nothing matched" is exactly the AC3 empty-state case
 * either way.
 */
async function searchByCompetency(competencyId) {
  if (!isUuid(competencyId)) return [];

  const matches = await db('user_competencies')
    .join('users', 'users.id', 'user_competencies.user_id')
    .where({
      'user_competencies.competency_id': competencyId,
      'user_competencies.willing_to_teach': true,
    })
    .select('users.id as user_id', 'users.display_name', 'users.public_name');
  if (matches.length === 0) return [];

  const userIds = matches.map((m) => m.user_id);
  const willingRows = await db('user_competencies')
    .leftJoin('competencies', 'competencies.id', 'user_competencies.competency_id')
    .whereIn('user_competencies.user_id', userIds)
    .andWhere('user_competencies.willing_to_teach', true)
    .select(
      'user_competencies.user_id',
      'user_competencies.competency_id',
      'user_competencies.is_custom',
      'user_competencies.custom_label',
      'competencies.slug as competency_slug',
    );

  const willingByUser = new Map();
  for (const row of willingRows) {
    if (!willingByUser.has(row.user_id)) willingByUser.set(row.user_id, []);
    willingByUser.get(row.user_id).push({
      competencyId: row.competency_id,
      competencySlug: row.competency_slug || null,
      isCustom: row.is_custom,
      customLabel: row.custom_label,
      willingToTeach: true,
    });
  }

  return matches.map((m) => ({
    id: m.user_id,
    name: resolvePublicDisplayName(m),
    competencies: willingByUser.get(m.user_id) || [],
  }));
}

/**
 * GET /api/v1/users/:id (US-026). Any valid userId — not gated by shared
 * board/task membership at all (AC1's "доступний для БУДЬ-ЯКОГО валідного
 * userId"), this is the one deliberately wide-open cross-user read in the
 * whole API. Returns the FULL competency list (not just willing-to-teach
 * ones, unlike searchByCompetency above) with a per-entry `willingToTeach`
 * flag so the FE can render the "Готовий(а) викладати" badge (AC1).
 *
 * `userId` is a Firebase UID (`users.id` is `text`, not `uuid` — see the
 * users table migration) so there's no format to pre-validate the way
 * isUuid() does for every other resource's route param; a nonexistent id
 * (malformed or simply never registered) both resolve to the same 404
 * (AC2) — there is no meaningful "malformed vs missing" distinction to make
 * for an opaque string id.
 */
async function getPublicProfile(userId) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw new NotFoundError('errors.user.notFound');

  const competencyRows = await db('user_competencies')
    .leftJoin('competencies', 'competencies.id', 'user_competencies.competency_id')
    .where('user_competencies.user_id', userId)
    .select('user_competencies.*', 'competencies.slug as competency_slug')
    .orderBy('user_competencies.created_at', 'asc');

  return {
    id: user.id,
    name: resolvePublicDisplayName(user),
    competencies: competencyRows.map((row) => ({
      competencyId: row.competency_id,
      competencySlug: row.competency_slug || null,
      isCustom: row.is_custom,
      customLabel: row.custom_label,
      willingToTeach: row.willing_to_teach,
    })),
  };
}

module.exports = {
  getOrCreateUser,
  getSignInProviderForEmail,
  updateProfile,
  searchByCompetency,
  getPublicProfile,
  PUBLIC_NAME_MAX_LENGTH,
};
