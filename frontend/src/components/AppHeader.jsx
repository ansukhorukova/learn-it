import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';

import { auth } from '../firebase/client';
import { useAuthUser } from '../auth/useAuthUser';
import { useI18n } from '../i18n/I18nProvider';
import { useWebSocket } from '../hooks/useWebSocket';
import { updateProfile } from '../api/client';
import styles from './AppHeader.module.css';

// AUTH-008: how long the non-blocking "couldn't save" warning stays visible
// before fading back out on its own — same pattern as ProfilePage's
// save-state timeout, just a touch longer since this one carries a message
// to read rather than a one-word confirmation.
const SYNC_ERROR_TIMEOUT_MS = 5000;

// Persistent header for every authenticated route (boards overview, board
// view, profile, and future screens) — carries the sign-out control that
// used to live on the placeholder HomePage (CLAUDE.md task: "keep the
// ability to sign out"), and the AUTH-008 language switcher. Never rendered
// on /auth (AC10) — every page that mounts <AppHeader /> already redirects
// unauthenticated visitors to /auth before reaching this component (see
// BoardsPage.jsx/BoardViewPage.jsx/ProfilePage.jsx's `if (!user) return
// <Navigate ... />` guard), so `user` below is never null in practice.
function AppHeader() {
  const { t, locale, setLocale, supportedLocales } = useI18n();
  const { user } = useAuthUser();
  const [syncErrorVisible, setSyncErrorVisible] = useState(false);

  // US-029 AC3/AC8: the WS server closes the connection right after an
  // `unauthorized` error frame — the only WS error that isn't scoped to one
  // screen's subscription, so it's surfaced here rather than in every chat
  // page individually. `useWebSocket()` already de-dupes to the one shared
  // session connection, so mounting it here doesn't open a second socket.
  const { status, onMessage } = useWebSocket();
  const [wsAuthErrorVisible, setWsAuthErrorVisible] = useState(false);

  useEffect(() => {
    return onMessage((frame) => {
      if (frame.type === 'error' && frame.messageKey === 'ws.error.unauthorized') {
        setWsAuthErrorVisible(true);
      }
    });
  }, [onMessage]);

  // AC3/AC4: flip the client-side locale — and everything t() renders —
  // BEFORE the network call, never waiting on it. AC5: if the PATCH below
  // fails, the locale chosen here is NOT rolled back; only a non-blocking
  // warning is shown, and the choice stays active for the rest of this
  // session (it just may not persist to the next one).
  function handleLocaleChange(code) {
    if (code === locale) return;
    setLocale(code);
    setSyncErrorVisible(false);

    if (!user) return;
    user
      .getIdToken()
      .then((idToken) => updateProfile(idToken, { locale: code }))
      .catch(() => {
        setSyncErrorVisible(true);
        setTimeout(() => setSyncErrorVisible(false), SYNC_ERROR_TIMEOUT_MS);
      });
  }

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        {t('app.name')}
      </Link>
      <div className={styles.actions}>
        {wsAuthErrorVisible && (
          <span className={styles.wsBanner} role="alert">
            {t('ws.error.unauthorized')}
          </span>
        )}
        {!wsAuthErrorVisible && status === 'reconnecting' && (
          <span className={styles.wsBanner} role="status">
            {t('ws.status.reconnecting')}
          </span>
        )}
        <div className={styles.languageGroup}>
          {/* AC2: built from the supported-locales registry, not a hardcoded
              two-option list — a future third locale needs only a new entry
              in frontend/src/i18n/locales.js + its own locales/{code}.json,
              no change here. AC9: plain <button>s are natively focusable and
              already activate on both Enter and Space with a visible
              :focus-visible outline (see .languageOption below); no custom
              keyboard handling needed. */}
          <div
            className={styles.languageSwitcher}
            role="group"
            aria-label={t('app.header.language.groupLabel')}
          >
            {supportedLocales.map(({ code }) => (
              <button
                key={code}
                type="button"
                className={`${styles.languageOption} ${locale === code ? styles.languageOptionActive : ''}`}
                aria-pressed={locale === code}
                aria-label={t('app.header.language.switchTo', {
                  language: t(`app.header.language.${code}`),
                })}
                onClick={() => handleLocaleChange(code)}
              >
                {t(`app.header.language.${code}`)}
              </button>
            ))}
          </div>
          {syncErrorVisible && (
            <span className={styles.languageSyncError} role="status">
              {t('app.header.language.syncError')}
            </span>
          )}
        </div>
        <Link to="/people" className={styles.navLink}>
          {t('app.nav.people')}
        </Link>
        <Link to="/messages" className={styles.navLink}>
          {t('app.nav.messages')}
        </Link>
        <Link to="/profile" className={styles.navLink}>
          {t('app.nav.profile')}
        </Link>
        <button type="button" className={styles.signOut} onClick={() => signOut(auth)}>
          {t('home.signOut')}
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
