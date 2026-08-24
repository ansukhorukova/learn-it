#!/usr/bin/env node
/**
 * Порівнює ключі frontend/locales/en.json і frontend/locales/uk.json.
 * Нуль LLM-токенів — чистий детермінований скрипт.
 * Використання: node scripts/i18n-check.js
 * Exit code 0 = усе синхронізовано, 1 = є розбіжності.
 */
const fs = require('fs');
const path = require('path');

function flatten(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(acc, flatten(value, fullKey));
    } else {
      acc[fullKey] = value;
    }
    return acc;
  }, {});
}

function loadLocale(locale) {
  const filePath = path.join(process.cwd(), 'frontend', 'src', 'locales', `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Не знайдено ${filePath} — пропускаю перевірку i18n (ще нема словників).`);
    process.exit(0);
  }
  return flatten(JSON.parse(fs.readFileSync(filePath, 'utf8')));
}

const en = loadLocale('en');
const uk = loadLocale('uk');

const enKeys = new Set(Object.keys(en));
const ukKeys = new Set(Object.keys(uk));

// A pluralized entry's leaf key is an ICU plural category (one/few/many/
// other/...). Which categories a locale actually uses is decided by
// `Intl.PluralRules`, not by hand-rolled per-language logic (CLAUDE.md) — so
// e.g. Ukrainian legitimately has `few`/`many` leaves that English, with
// only `one`/`other`, never will. A leaf absent only because the *other*
// locale doesn't use that category isn't a missing translation.
const pluralCategories = { en: new Set(new Intl.PluralRules('en').resolvedOptions().pluralCategories) };
function isForeignPluralCategory(key, targetLocale) {
  const leaf = key.split('.').pop();
  const validForTarget = pluralCategories[targetLocale];
  return validForTarget && !validForTarget.has(leaf) && ['zero', 'one', 'two', 'few', 'many', 'other'].includes(leaf);
}

const missingInUk = [...enKeys].filter((k) => !ukKeys.has(k));
const missingInEn = [...ukKeys].filter((k) => !enKeys.has(k) && !isForeignPluralCategory(k, 'en'));

let hasIssues = false;

if (missingInUk.length) {
  hasIssues = true;
  console.error(`❌ Відсутні в uk.json (${missingInUk.length}):`);
  missingInUk.forEach((k) => console.error(`   - ${k}`));
}

if (missingInEn.length) {
  hasIssues = true;
  console.error(`❌ Відсутні в en.json (${missingInEn.length}):`);
  missingInEn.forEach((k) => console.error(`   - ${k}`));
}

if (!hasIssues) {
  console.log(`✅ Локалізація синхронізована: ${enKeys.size} ключів в обох мовах.`);
}

process.exit(hasIssues ? 1 : 0);
