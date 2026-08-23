import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { DEFAULT_LOCALE_CODE, SUPPORTED_LOCALES, detectBrowserLocale, getDictionary } from './locales';
import { translate } from './translate';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  // No account/persisted preference exists yet at app boot, so we always
  // start from the browser-detected locale (CLAUDE.md: "за browser locale
  // користувача при першому вході"). A later profile-settings screen will
  // let the user override this and persist it server-side on `users.locale`.
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
