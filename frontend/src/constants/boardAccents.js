// Mirrors backend/src/services/boards.service.js's ACCENTS list — keep the
// two in sync if this palette ever changes. A small fixed set of accent keys
// for visually distinguishing board cards; components map each key to a
// `--board-accent-*` design token (frontend/src/styles/tokens.css), never a
// hardcoded color.
export const BOARD_ACCENTS = ['teal', 'rose', 'violet', 'sky', 'moss', 'clay'];
export const DEFAULT_BOARD_ACCENT = BOARD_ACCENTS[0];
