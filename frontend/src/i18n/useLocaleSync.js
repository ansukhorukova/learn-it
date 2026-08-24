import { useEffect, useRef } from 'react';

import { fetchProfile } from '../api/client';
import { useI18n } from './I18nProvider';

/**
 * AUTH-008 bugfix. I18nProvider (see its own header comment) only ever
 * boots from the browser-detected locale. Before this hook, the only place
 * that ever corrected that to the persisted `users.locale` was
 * AuthPage.jsx's `completeSignIn` — reached exclusively via an explicit
 * `signInWithEmailAndPassword` / `signInWithPopup` /
 * `createUserWithEmailAndPassword` call.
 *
 * That skips the far more common "new session" case: reloading the tab
 * (F5) or opening the app in a fresh tab while a Firebase session is still
 * active. `onAuthStateChanged` resolves the same user immediately, `/auth`
 * is never rendered, `completeSignIn` never runs, and the persisted locale
 * (e.g. `uk`, chosen last session via AppHeader) is silently discarded in
 * favour of the browser's.
 *
 * Mounted once at the app root (see App.jsx). The first time an
 * authenticated user shows up *outside* `/auth`, it fetches the persisted
 * profile and adopts `profile.locale`.
 *
 * Race with `completeSignIn` (brand-new signup): `skip` is true while the
 * current route is `/auth`, so this hook stays inert for the whole explicit
 * sign-in/up flow. For a brand-new user, `completeSignIn`'s own
 * `fetchCurrentUser` call is literally what creates the `users` row
 * (seeded from the browser locale it sends) — its full await chain
 * (fetch -> setLocale -> navigate('/')) finishes before the route ever
 * leaves `/auth`, so this hook can never reach the BE first and
 * race-create the row with the wrong (default, not browser) locale. Once
 * routing lands on '/', the row and locale are already correct and this
 * hook's own fetch is just a redundant-but-harmless read.
 *
 * Race with the user's own manual switch (AppHeader): `syncedUidRef` makes
 * this fire at most once per signed-in uid per app load, so it can't
 * repeatedly re-run and clobber an active manual choice. The one fetch it
 * does make still snapshots the locale before the request and only applies
 * the response if the locale hasn't changed in the meantime — belt and
 * braces against a manual switch landing while this background sync is in
 * flight.
 */
export function useLocaleSync(user, skip) {
  const { locale, setLocale } = useI18n();

  const localeRef = useRef(locale);
  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  const syncedUidRef = useRef(null);

  useEffect(() => {
    if (skip || !user) return;
    if (syncedUidRef.current === user.uid) return;
    syncedUidRef.current = user.uid;

    let cancelled = false;
    const localeBeforeFetch = localeRef.current;

    (async () => {
      try {
        const idToken = await user.getIdToken();
        const profile = await fetchProfile(idToken);
        if (cancelled) return;
        // Don't overwrite a locale the user picked via AppHeader while this
        // background sync was in flight (see race note above).
        if (localeRef.current === localeBeforeFetch) {
          setLocale(profile.locale);
        }
      } catch {
        // Best-effort background sync, not a user-facing load: on failure
        // just keep whatever locale is currently showing (the
        // browser-detected one this session started from).
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, skip, setLocale]);
}
