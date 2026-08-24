const express = require('express');
const cors = require('cors');

const healthRouter = require('./routes/health.route');
const usersRouter = require('./routes/users.route');
const authRouter = require('./routes/auth.route');
const boardsRouter = require('./routes/boards.route');
const tasksRouter = require('./routes/tasks.route');
const competenciesRouter = require('./routes/competencies.route');

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

module.exports = app;
