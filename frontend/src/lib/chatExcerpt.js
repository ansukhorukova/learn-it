// US-034 AC6 / US-035 AC7 — the "first ~80 characters" excerpt shown in a
// reply's quote preview above the composer. Computed client-side from the
// already-loaded comment/message list (no extra round trip). Matches the
// backend's own slice length in lib/chatMessages.js (EXCERPT_LENGTH = 80) so
// an FE-computed preview and a BE-hydrated `replyTo.excerpt` read the same.
export const REPLY_EXCERPT_LENGTH = 80;

export function replyExcerpt(body) {
  return typeof body === 'string' ? body.slice(0, REPLY_EXCERPT_LENGTH) : '';
}
