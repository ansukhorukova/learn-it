const express = require('express');
const cors = require('cors');

const healthRouter = require('./routes/health.route');
const usersRouter = require('./routes/users.route');
const authRouter = require('./routes/auth.route');
const boardsRouter = require('./routes/boards.route');
const tasksRouter = require('./routes/tasks.route');

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
// as usersRouter above.
app.use('/api/v1/boards', boardsRouter);
app.use('/api/v1/tasks', tasksRouter);

// TODO (future): mount /api/v1/*/time-entries, /api/v1/*/attachments,
// /api/v1/*/members, /api/v1/*/shares once acceptance criteria are in place.
// See CLAUDE.md "API" and "Дані" sections.

module.exports = app;
