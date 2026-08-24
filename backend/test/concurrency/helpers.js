const crypto = require('crypto');

// Requires `../../src/db/knex` — by the time any test file reaches this
// require, env.js (a `setupFiles` entry, see vitest.config.js) has already
// pointed `DATABASE_URL` at the dedicated test database, so this is the same
// shared knex pool the services under test use, just aimed at test data.
const db = require('../../src/db/knex');

async function createUser(overrides = {}) {
  const id = overrides.id || `test-user-${crypto.randomUUID()}`;
  await db('users').insert({
    id,
    email: overrides.email || `${id}@example.test`,
    display_name: overrides.displayName || 'Test User',
  });
  return id;
}

async function createBoard(ownerId, overrides = {}) {
  const [row] = await db('boards')
    .insert({
      title: overrides.title || 'Test board',
      owner_id: ownerId,
    })
    .returning('*');
  return row;
}

async function createTask(boardId, ownerId, overrides = {}) {
  const [row] = await db('tasks')
    .insert({
      board_id: boardId,
      title: overrides.title || 'Test task',
      status: overrides.status || 'planned',
      position: overrides.position ?? 1000,
      created_by: ownerId,
    })
    .returning('*');
  return row;
}

// Note-kind by default — no storage side effect to worry about cleaning up
// in a test fixture (unlike kind: 'file', which would need a real/mocked S3
// call). Concurrency tests only care about the DB row's lock behavior.
async function createAttachment(taskId, ownerId, overrides = {}) {
  const [row] = await db('attachments')
    .insert({
      task_id: taskId,
      created_by: ownerId,
      kind: overrides.kind || 'note',
      body: overrides.body || 'Test note',
      title: overrides.title,
      url: overrides.url,
    })
    .returning('*');
  return row;
}

// Completed by default (ended_at/duration_seconds set) — a fixture for the
// edit/delete concurrency cases, which only ever operate on completed
// entries (an active one is a single row directly reachable via
// `whereNull('ended_at')`, no fixture helper needed for that case).
async function createTimeEntry(taskId, userId, overrides = {}) {
  const durationSeconds = overrides.durationSeconds ?? 600;
  const endedAt = overrides.endedAt === undefined ? new Date() : overrides.endedAt;
  const startedAt = overrides.startedAt || (endedAt ? new Date(endedAt.getTime() - durationSeconds * 1000) : new Date());
  const [row] = await db('time_entries')
    .insert({
      task_id: taskId,
      user_id: userId,
      started_at: startedAt,
      ended_at: endedAt,
      duration_seconds: endedAt ? durationSeconds : null,
      note: overrides.note,
    })
    .returning('*');
  return row;
}

// Deleting the user cascades away every board/task the test created under
// it (boards.owner_id and tasks.created_by are both ON DELETE CASCADE from
// users; tasks.board_id is ON DELETE CASCADE from boards) — one call cleans
// up an entire test's fixtures.
async function cleanupUser(userId) {
  await db('users').where({ id: userId }).delete();
}

// Waits for `ms`, resolving. Used only to give a concurrently-running
// service call time to reach its own `FOR UPDATE` and start blocking on a
// lock this test is deliberately holding open in a manually-driven
// transaction — see e.g. tasks.concurrency.test.js's "vs deleteTask" cases.
// 200ms is generous headroom for a handful of local-Postgres queries; not a
// tight race, just enough to make the interleaving deterministic instead of
// depending on Promise.all scheduling order.
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports = { db, createUser, createBoard, createTask, createAttachment, createTimeEntry, cleanupUser, wait };
