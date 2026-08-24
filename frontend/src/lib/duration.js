// Duration formatting shared by the timer/sessions/totals UI (US10-US12).
// Two distinct formats on purpose:
//  - formatStopwatch: HH:MM:SS for the live running-timer display — a fixed
//    technical/digital-clock format, not language-dependent, so no locale
//    dictionary lookup is involved (matches the {duration} example in
//    timeEntry.timer.running).
//  - formatDuration: "{hours}h {minutes}m" (or hours-only / minutes-only) for
//    session lengths, sessions.total, task.card.timeBadge, and
//    board.card.totalTime/thisWeek — driven entirely by the time.unit.*
//    locale-dictionary keys (translate.js's t()), never a hardcoded English
//    string. Hour/minute units are a fixed, non-declined abbreviation per
//    product decision ("як «5 кг»") — deliberately no ICU pluralization here,
//    unlike task.card.attachmentCount.

export function formatStopwatch(totalSeconds) {
  const clamped = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatDuration(totalSeconds, t) {
  const clamped = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  if (hours > 0 && minutes > 0) return t('time.unit.hoursMinutes', { hours, minutes });
  if (hours > 0) return t('time.unit.hours', { hours });
  return t('time.unit.minutes', { minutes });
}

// Locale-aware session timestamp (CLAUDE.md "Дати/час — через
// Intl.DateTimeFormat", not a fixed format) — used on each session row.
export function formatSessionTimestamp(isoString, locale) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(isoString));
}
