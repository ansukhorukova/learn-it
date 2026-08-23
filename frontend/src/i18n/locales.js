import en from '../locales/en.json';
import uk from '../locales/uk.json';

// Single registration point for supported locales. Adding a new language in
// the future = drop a new `locales/{code}.json` next to these and add one
// entry here — no other file in the app should need to change (CLAUDE.md
// "Розширюваність локалізації").
export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English', dictionary: en },
  { code: 'uk', label: 'Українська', dictionary: uk },
];

export const DEFAULT_LOCALE_CODE = 'en';

export function isSupportedLocale(code) {
  return SUPPORTED_LOCALES.some((locale) => locale.code === code);
}

export function getDictionary(code) {
  const match = SUPPORTED_LOCALES.find((locale) => locale.code === code);
  if (match) return match.dictionary;
  return SUPPORTED_LOCALES.find((locale) => locale.code === DEFAULT_LOCALE_CODE).dictionary;
}

// Browser locale at first visit, falling back to EN for anything unsupported
// (CLAUDE.md "Визначення мови за замовчуванням"). No account exists yet at
// this point, so there's no persisted preference to check first.
export function detectBrowserLocale() {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE_CODE;

  const candidates =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language].filter(Boolean);

  for (const raw of candidates) {
    const primary = raw.split('-')[0].toLowerCase();
    if (isSupportedLocale(primary)) return primary;
  }

  return DEFAULT_LOCALE_CODE;
}
