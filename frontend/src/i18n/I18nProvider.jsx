import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { DEFAULT_LOCALE_CODE, SUPPORTED_LOCALES, detectBrowserLocale, getDictionary } from './locales';
import { translate } from './translate';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  // No account/persisted preference is known yet at app boot, so we always
  // start from the browser-detected locale (CLAUDE.md: "за browser locale
  // користувача при першому вході"). AppHeader lets the user override this
  // client-side immediately; App.jsx's useLocaleSync hook (and, on the
  // explicit sign-in path, AuthPage.jsx's completeSignIn) is what corrects
  // this initial guess to the persisted `users.locale` once it's known —
  // see useLocaleSync.js for why a plain useState here is never re-derived
  // from the browser on its own after that.
  const [locale, setLocale] = useState(() => detectBrowserLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const dictionary = useMemo(() => getDictionary(locale), [locale]);

  const t = useCallback((key, params) => translate(dictionary, locale, key, params), [dictionary, locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t, supportedLocales: SUPPORTED_LOCALES, defaultLocale: DEFAULT_LOCALE_CODE }),
    [locale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an <I18nProvider>');
  }
  return ctx;
}
