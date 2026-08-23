const db = require('../db/knex');
const { resolveLocale } = require('../config/locales');

function toProfile(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
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

module.exports = { getOrCreateUser, getSignInProviderForEmail };
