#!/usr/bin/env bash
# Механічні перевірки перед code review — жодного звернення до LLM.
# Запускай перед тим, як просити code-reviewer агента: ./scripts/pre-review.sh
set -uo pipefail

FAIL=0
step() { echo; echo "▶ $1"; }

step "ESLint (backend)"
if [ -f backend/package.json ] && grep -q '"lint"' backend/package.json; then
  (cd backend && npm run lint) || FAIL=1
else
  echo "  пропущено — немає backend/package.json або скрипта lint"
fi

step "ESLint (frontend)"
if [ -f frontend/package.json ] && grep -q '"lint"' frontend/package.json; then
  (cd frontend && npm run lint) || FAIL=1
else
  echo "  пропущено — немає frontend/package.json або скрипта lint"
fi

step "TypeScript типи (backend)"
if [ -f backend/tsconfig.json ]; then
  (cd backend && npx tsc --noEmit) || FAIL=1
else
  echo "  пропущено — немає backend/tsconfig.json"
fi

step "TypeScript типи (frontend)"
if [ -f frontend/tsconfig.json ]; then
  (cd frontend && npx tsc --noEmit) || FAIL=1
else
  echo "  пропущено — немає frontend/tsconfig.json"
fi

step "Повнота локалізації EN/UK"
node scripts/i18n-check.js || FAIL=1

step "Секрети у застейджених файлах (базова перевірка)"
# `xargs -r` (skip the command entirely on empty stdin) is a GNU-ism that
# BSD/macOS xargs silently ignores as an unknown flag — with nothing staged,
# BSD xargs still runs no command but exits 0, which a bare `if git diff |
# xargs grep` misreads as "grep succeeded" (i.e. a secret was found), a false
# positive on every clean working tree on macOS. Guard on whether there are
# any staged files first instead of relying on xargs' empty-input behavior.
STAGED_FILES="$(git diff --cached --name-only 2>/dev/null)"
if [ -n "$STAGED_FILES" ] && echo "$STAGED_FILES" | xargs grep -lE "(AIza[0-9A-Za-z_-]{35}|-----BEGIN (RSA |EC )?PRIVATE KEY-----|sk_live_[0-9a-zA-Z]{24,})" 2>/dev/null; then
  echo "  ❌ Схоже на секрет у застейджених файлах — див. вище"
  FAIL=1
else
  echo "  ✅ Явних секретів не знайдено"
fi

step "npm audit (backend, лише production-залежності)"
if [ -f backend/package.json ]; then
  (cd backend && npm audit --omit=dev --audit-level=high) || echo "  ⚠️  npm audit знайшов вразливості — переглянь вище (не блокує автоматично)"
else
  echo "  пропущено — немає backend/package.json"
fi

echo
if [ "$FAIL" -eq 1 ]; then
  echo "❌ Механічні перевірки НЕ пройдені — виправ перед тим, як кликати code-reviewer агента."
  exit 1
else
  echo "✅ Усі механічні перевірки пройдені. Готово для code-reviewer агента — той перевірятиме лише логіку/авторизацію/архітектуру, не лінт і не типи."
fi
