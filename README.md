# Learning Time Tracker

Private, bilingual (EN/UK) app for tracking learning time across topic boards, with attachments per task. API-first: the frontend never talks to the database directly, only to its own backend REST API.

```
FE (React, Vite)  →  BE API (Node.js, REST, /api/v1)  →  PostgreSQL (Docker)
                             ↓
                    Firebase Admin SDK ←→ Firebase Auth (token verification)
                             ↓
                    S3-compatible storage (MinIO locally; R2/Blaze in production)
```

See [CLAUDE.md](./CLAUDE.md) for the full product spec and architecture decisions, and [PROJECT_MAP.md](./PROJECT_MAP.md) for what's built vs. planned.

## Prerequisites

- Docker + Docker Compose
- A Firebase project (free Spark plan) with **Email/Password** and **Google** sign-in providers enabled, for Auth only
- A Firebase service account key (Project settings → Service accounts → Generate new private key)

## Setup

1. Copy `.env.example` to `.env` and fill in your Firebase project's values.
2. Save your Firebase service account JSON as `firebase-service-account.json` in the repo root (gitignored, never commit it).
3. Start everything:
   ```bash
   docker compose up -d
   ```
4. Run the initial database migration:
   ```bash
   docker compose exec backend npm run migrate
   ```

## Services

| Service | URL | Notes |
|---|---|---|
| Frontend | http://localhost:5173 | React + Vite dev server |
| Backend | http://localhost:4000 | Express API, versioned under `/api/v1` |
| MinIO console | http://localhost:9001 | S3-compatible storage for attachments |
| Postgres | localhost:5432 | `db` service in `docker-compose.yml` |

Check the backend is up:
```bash
curl http://localhost:4000/api/v1/health
```

## Development notes

- Both `backend/` and `frontend/` are bind-mounted into their containers with hot reload (nodemon / Vite dev server) — edit locally, changes apply immediately.
- If you add a dependency to either `package.json`, regenerate its lockfile locally first (`npm install` inside `backend/` or `frontend/`), then rebuild and force a fresh `node_modules` volume:
  ```bash
  docker compose build <service>
  docker compose up -d --renew-anon-volumes <service>
  ```
  Skipping this causes `npm ci` to fail on a stale lockfile, or the container to crash with `MODULE_NOT_FOUND` even after a rebuild.
- Backend migrations live in `backend/migrations/` (Knex). Add a new one with `docker compose exec backend npm run migrate:make -- <name>`.
- Localization strings live in `frontend/src/locales/{en,uk}.json` — both languages are required for every feature, not a follow-up step.

## Project status

See [PROJECT_MAP.md](./PROJECT_MAP.md) for the current build state (auth, boards + public boards, board view, task panel with time tracking / attachments / comments, board & task sharing, user profiles & competencies, people search, DM & competency chat with reply/forward, and board import from file are done; "Shared with me" and team view are still planned).
