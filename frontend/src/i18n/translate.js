function getByPath(dictionary, path) {
  return path
    .split('.')
    .reduce((acc, segment) => (acc && typeof acc === 'object' ? acc[segment] : undefined), dictionary);
}

function interpolate(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}

/**
 * Content-keyed lookup with {placeholder} interpolation and ICU-like
 * pluralization. A dictionary entry can be either a plain string, or (for
 * countable strings) an object keyed by plural category, e.g.
 * `{ one: "...", few: "...", many: "...", other: "..." }`.
 *
 * The plural *category* for a given count is never decided by hand-rolled
 * per-language logic here — `Intl.PluralRules(locale).select(count)` derives
 * it from the active locale's CLDR rules, so English (one/other) and
 * Ukrainian (one/few/many/other) — and any future locale — are handled by
 * the same code path with zero `if (locale === 'xx')` branches.
 */
export function translate(dictionary, locale, key, params) {
  const entry = getByPath(dictionary, key);

  if (entry === undefined) {
    // Missing key: fall back to the key itself rather than throwing, so a
    // gap in one locale's dictionary is visible but never crashes the UI.
    return key;
  }

  if (typeof entry === 'string') {
    return interpolate(entry, params);
  }

  if (typeof entry === 'object' && params && typeof params.count === 'number') {
    const category = new Intl.PluralRules(locale).select(params.count);
    const form = entry[category] ?? entry.other;
    return form ? interpolate(form, params) : key;
  }

  return key;
}
