import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';

import { auth, googleProvider } from '../firebase/client';
import { useAuthUser } from '../auth/useAuthUser';
import { validateConfirmPassword, validateEmail, validatePassword } from '../auth/validation';
import { mapGoogleSignInError, mapSignInError, mapSignUpError } from '../auth/errorMapping';
import { fetchCurrentUser, fetchProviderHint } from '../api/client';
import { useI18n } from '../i18n/I18nProvider';
import { useHeadMeta } from '../lib/useHeadMeta';
import styles from './AuthPage.module.css';

// Google's "G" mark uses Google's official brand colors, not this app's
// design tokens — that's a brand-identity exception, not a themeable color.
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"
      />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.27-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97L3.68 7.3C4.39 5.17 6.38 3.58 9 3.58z"
      />
    </svg>
  );
}

function AuthPage() {
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthUser();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formErrorKey, setFormErrorKey] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useHeadMeta({ title: t('auth.title'), description: t('auth.description') });

  // Already signed in and /auth opened directly — bounce to / without ever
  // rendering the form (no flash of the sign-in UI).
  //
  // Gated on `!submitting && !formErrorKey`, not just `user`: `user` comes
  // from Firebase's local auth state (useAuthUser → onAuthStateChanged),
  // which flips true as soon as the Firebase credential resolves — *before*
  // completeSignIn's own `await fetchCurrentUser(...)` BE sync (below) has
  // even started, let alone finished. Two failure windows this needs to
  // cover:
  //   1. While that BE sync is still in flight (`submitting` is true) — the
  //      guard must not fire yet, or it preempts completeSignIn's own
  //      success/failure handling entirely.
  //   2. After it fails (`submitting` goes back to false, but
  //      `formErrorKey` gets set to e.g. auth.error.networkError) — the
  //      guard must still not fire, or the user gets bounced to `/` in the
  //      very same render that was supposed to show them the error, and a
  //      Firebase account with no corresponding `users` row is silently
  //      orphaned (nothing elsewhere retries the sync).
  // Checking `submitting` alone handles (1) but not (2); checking
  // `formErrorKey` alone handles (2) but not (1) (it's null for the whole
  // duration of the pending await). Both together are required. On
  // confirmed success, `submitting` is never reset to false and
  // `formErrorKey` is never set — completeSignIn instead navigates directly
  // via `navigate('/', { replace: true })`, so this guard is simply never
  // reached on that path.
  if (!authLoading && user && !submitting && !formErrorKey) {
    return <Navigate to="/" replace />;
  }
  if (authLoading) {
    return null;
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setFieldErrors({});
    setFormErrorKey(null);
    setConfirmPassword('');
  }

  function runClientValidation() {
    const errors = {};
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;

    if (mode === 'signup') {
      const confirmError = validateConfirmPassword(password, confirmPassword);
      if (confirmError) errors.confirmPassword = confirmError;
    }

    return errors;
  }

  async function completeSignIn(firebaseUser) {
    try {
      const idToken = await firebaseUser.getIdToken();
      const profile = await fetchCurrentUser(idToken, locale);
      // AUTH-008 AC7/AC8: adopt the persisted `users.locale` from the BE —
      // for a returning user this may differ from the browser-detected
      // locale I18nProvider started from at app boot (e.g. they switched it
      // via the header last session, then opened the app on a different
      // device/browser locale); for a brand-new user this is exactly the
      // browser locale the BE just seeded the row with (see `locale` query
      // param above), so it's a no-op in that case. Either way, browser
      // locale is never re-derived after first sign-in — only this
      // persisted value going forward.
      setLocale(profile.locale);
    } catch (err) {
      setFormErrorKey('auth.error.networkError');
      setSubmitting(false);
      return;
    }
    navigate('/', { replace: true });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormErrorKey(null);

    const errors = runClientValidation();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return; // Validation fails client-side — never hits the network.
    }

    setSubmitting(true);
    const trimmedEmail = email.trim();

    try {
      if (mode === 'signin') {
        const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
        await completeSignIn(credential.user);
        return;
      }

      try {
        const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        await completeSignIn(credential.user);
      } catch (err) {
        if (err && err.code === 'auth/email-already-in-use') {
          // Firebase's own EMAIL_EXISTS error already told us this email is
          // registered — `fetchSignInMethodsForEmail` used to try to tell us
          // *which* provider, but this project has Email Enumeration
          // Protection enabled, which makes it always return [] (existing or
          // not), so it could never actually distinguish. We ask our own BE
          // instead (backend/src/routes/auth.route.js has the full
          // anti-enumeration reasoning for why this is safe here but must
          // never be used on the sign-in path).
          let isGoogleOnlyAccount = false;
          try {
            const { provider } = await fetchProviderHint(trimmedEmail);
            isGoogleOnlyAccount = provider === 'google.com';
          } catch {
            // BE unreachable or errored — fall back to the generic
            // already-in-use message below rather than blocking signup.
          }
          setFormErrorKey(mapSignUpError(err, { isGoogleOnlyAccount }));
          setSubmitting(false);
          return;
        }
        throw err;
      }
    } catch (err) {
      setFormErrorKey(mode === 'signin' ? mapSignInError(err) : mapSignUpError(err));
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setFormErrorKey(null);
    setSubmitting(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await completeSignIn(result.user);
    } catch (err) {
      // Cancelling the popup isn't a hard error — just reset to idle.
      setFormErrorKey(mapGoogleSignInError(err));
      setSubmitting(false);
    }
  }

  const submitLabel = submitting
    ? t('auth.submit.loading')
    : t(mode === 'signin' ? 'auth.submit.signin' : 'auth.submit.signup');

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.brand}>{t('app.name')}</h1>
        <p className={styles.description}>{t('auth.description')}</p>

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            className={`${styles.tab} ${mode === 'signin' ? styles.tabActive : ''}`}
            onClick={() => switchMode('signin')}
          >
            {t('auth.tabs.signin')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={`${styles.tab} ${mode === 'signup' ? styles.tabActive : ''}`}
            onClick={() => switchMode('signup')}
          >
            {t('auth.tabs.signup')}
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {formErrorKey && (
            <div className={styles.formError} role="alert">
              {t(formErrorKey)}
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="auth-email">
              {t('auth.email.label')}
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              className={`${styles.input} ${fieldErrors.email ? styles.inputInvalid : ''}`}
              placeholder={t('auth.email.placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined}
            />
            {fieldErrors.email && (
              <span id="auth-email-error" className={styles.fieldError}>
                {t(fieldErrors.email)}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="auth-password">
              {t('auth.password.label')}
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className={`${styles.input} ${fieldErrors.password ? styles.inputInvalid : ''}`}
              placeholder={t('auth.password.placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'auth-password-error' : undefined}
            />
            {fieldErrors.password && (
              <span id="auth-password-error" className={styles.fieldError}>
                {t(fieldErrors.password)}
              </span>
            )}
          </div>

          {mode === 'signup' && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="auth-confirm-password">
                {t('auth.confirmPassword.label')}
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                autoComplete="new-password"
                className={`${styles.input} ${fieldErrors.confirmPassword ? styles.inputInvalid : ''}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={fieldErrors.confirmPassword ? 'auth-confirm-password-error' : undefined}
              />
              {fieldErrors.confirmPassword && (
                <span id="auth-confirm-password-error" className={styles.fieldError}>
                  {t(fieldErrors.confirmPassword)}
                </span>
              )}
            </div>
          )}

          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitLabel}
          </button>
        </form>

        <div className={styles.divider}>{t('auth.divider.or')}</div>

        <button
          type="button"
          className={styles.googleButton}
          onClick={handleGoogleSignIn}
          disabled={submitting}
        >
          <GoogleIcon />
          {t('auth.google.button')}
        </button>

        <button type="button" className={styles.switchLink} onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
          {t(mode === 'signin' ? 'auth.switchToSignup' : 'auth.switchToSignin')}
        </button>
      </div>
    </div>
  );
}

export default AuthPage;
