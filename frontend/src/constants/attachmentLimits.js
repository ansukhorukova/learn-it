// Mirrors backend/src/services/attachments.service.js's ALLOWED_MIME_TYPES /
// MAX_FILE_SIZE_BYTES — client-side validation here only gives faster
// feedback (skips uploading bytes that would just be rejected); the backend
// is still the single source of truth and re-validates every upload
// independently (CLAUDE.md: BE is the single point of authorization/
// validation).
// SVG is deliberately excluded — see the matching comment on
// ALLOWED_MIME_TYPES in backend/src/services/attachments.service.js (stored
// XSS risk: an <a target="_blank"> to a signed SVG URL renders it as a live
// document and executes any embedded <script>).
export const ALLOWED_FILE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export const FILE_INPUT_ACCEPT = '.png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.txt';
