// Single registration point for supported locales on the BE, mirroring
// frontend/src/i18n/locales.js. Adding a new locale later = add its code
// here (+ the matching frontend/src/locales/{code}.json) — no branching
// logic elsewhere in the codebase should special-case a locale code.
const SUPPORTED_LOCALES = ['en', 'uk'];
const DEFAULT_LOCALE = 'en';

function resolveLocale(candidate) {
  return SUPPORTED_LOCALES.includes(candidate) ? candidate : DEFAULT_LOCALE;
}

module.exports = { SUPPORTED_LOCALES, DEFAULT_LOCALE, resolveLocale };
