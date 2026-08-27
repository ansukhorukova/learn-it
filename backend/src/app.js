const express = require('express');
const cors = require('cors');

const healthRouter = require('./routes/health.route');
const usersRouter = require('./routes/users.route');
const authRouter = require('./routes/auth.route');
const boardsRouter = require('./routes/boards.route');
const tasksRouter = require('./routes/tasks.route');
const competenciesRouter = require('./routes/competencies.route');
const languagesRouter = require('./routes/languages.route');
const dmThreadsRouter = require('./routes/dmThreads.route');
const competencyChatsRouter = require('./routes/competencyChats.route');
const chatForwardsRouter = require('./routes/chatForwards.route');
const boardImportRouter = require('./routes/boardImport.route');

const app = express();

// Cloud Run (CLAUDE.md "Деплой" target) sits behind Google's front-end proxy,
// which sets X-Forwarded-For — trust exactly one hop so req.ip (and anything
// keyed off it, e.g. the /auth/provider-hint rate limiter) reflects the real
// client instead of the proxy. Harmless locally: without a proxy in front of
// the Docker `backend` service there's no X-Forwarded-For header to trust,
// so this has no effect on local dev.
app.set('trust proxy', 1);

// TODO: restrict to the actual deployed frontend origin(s) via env var once
// production hosting (Firebase Hosting) is configured — permissive for local dev.
app.use(cors());

// US-037: mounted BEFORE the global express.json() so boardImport.route.js's
// own 1 MB body parser is the one that runs for POST /api/v1/boards/import
// (the global parser's default ~100 KB limit would otherwise reject a large
// import before it reached the route). Every other method/path under
// /api/v1/boards/import falls through to the global parser and boardsRouter
// below unchanged.
app.use('/api/v1/boards/import', boardImportRouter);

app.use(express.json());

// Versioned REST API per CLAUDE.md ("API-first" — /api/v1/...).
app.use('/api/v1/health', healthRouter);

// Firebase ID token verification happens inside each route via the
// requireAuth middleware (see src/middleware/auth.middleware.js) rather than
// mounted globally here, so future public endpoints (if any) aren't forced
// through it.
app.use('/api/v1/users', usersRouter);

// Intentionally unauthenticated (no requireAuth) — see auth.route.js header
// comment for why GET /provider-hint is safe to expose without a token.
app.use('/api/v1/auth', authRouter);

// Boards + tasks (Phase 1 of "boards + tasks" — see CLAUDE.md "API" and
// "Дані"). requireAuth is applied per-route inside each router, same pattern
// as usersRouter above. tasksRouter also mounts /tasks/:id/attachments
// (US9) and /tasks/:id/time-entries (US10-US12) — both nested here rather
// than separate routers since the URL space is already owned by tasksRouter.
// boardsRouter also mounts /boards/:id/members (US13 — board_members CRUD)
// and tasksRouter also mounts /tasks/:id/shares (US14 — task_shares CRUD),
// both nested here rather than separate routers, same reasoning as
// attachments/time-entries above.
app.use('/api/v1/boards', boardsRouter);
app.use('/api/v1/tasks', tasksRouter);

// The competencies dictionary (AUTH-005) — a top-level resource, not nested
// under /users, since it's a shared catalog rather than per-user data. A
// user's own picks live under /users/me/competencies (usersRouter above).
app.use('/api/v1/competencies', competenciesRouter);

// The languages dictionary (US-023) — same top-level-resource reasoning as
// competenciesRouter above: a shared catalog, not per-user data.
app.use('/api/v1/languages', languagesRouter);

// DM threads (US-027) — a top-level resource, not nested under /users:
// a thread belongs to a PAIR of users plus a competency, not to either
// user individually, so there's no single natural parent to nest it under.
// The competency group chat (US-028) is nested under /competencies/:id/chat
// instead (see competencies.route.js) since a chat room there genuinely
// does have one natural parent — the competency itself.
app.use('/api/v1/dm-threads', dmThreadsRouter);

// The caller's own joined competency chats (US-031) — a per-user view over
// `competency_chat_members`, top-level and distinct from
// `/competencies/:id/chat/*` (join/leave/message actions on ONE competency,
// mounted under competenciesRouter above) for the same reason `/dm-threads`
// is top-level rather than nested under `/users`.
app.use('/api/v1/competency-chats', competencyChatsRouter);

// Forwarding a message into a new chat (US-036) — a top-level action
// resource (not nested under either /dm-threads or /competencies, since a
// forward's SOURCE can be either and its DESTINATION can be either too, so
// there's no single natural parent to nest it under).
app.use('/api/v1/chat/forwards', chatForwardsRouter);

module.exports = app;
