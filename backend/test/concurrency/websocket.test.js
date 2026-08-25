// Tester coverage for US-029 (WS auth + subscribe authorization) using a
// REAL `ws` client against a REAL http.Server + WebSocketServer — not a
// browser, per the task's "if there's a sane way to test WS auth/subscribe
// authorization without a browser, do it" ask. `firebase-admin`'s
// `verifyIdToken` is monkey-patched on the shared `admin` singleton (the
// exact same object `ws/server.js` and `auth.middleware.js` both
// `require()` — Node's module cache guarantees it's one instance) rather
// than hitting real Firebase, since this test environment has no real
// Firebase project/tokens to verify against. This is the same boundary
// every other test in this codebase already lives at: nothing here tests
// Express routing or the requireAuth middleware itself, only the WS-layer
// logic in src/ws/server.js — service-layer calls (dmThreadsService) are
// used directly to set up fixtures and to trigger a real broadcast, same
// as every other file in this directory.
const http = require('http');
const { WebSocket } = require('ws');

const { db, createUser, cleanupUser } = require('./helpers');
const admin = require('../../src/lib/firebaseAdmin');
const { attachWebSocketServer } = require('../../src/ws/server');
const dmThreadsService = require('../../src/services/dmThreads.service');

// Maps a fake bearer token straight to a Firebase UID — good enough to
// drive ws/server.js's `admin.auth().verifyIdToken(token)` call without a
// real Firebase project. `null` mapping means "verifyIdToken rejects",
// simulating an invalid/expired token (US-029 AC3).
const tokenToUid = new Map();
function tokenFor(uid) {
  const token = `fake-token-${uid}`;
  tokenToUid.set(token, uid);
  return token;
}

// `admin.auth` itself is a getter-only property on firebase-admin's
// namespace object (reassigning it throws) — but `admin.auth()` returns a
// cached Auth service singleton, so patching ITS `verifyIdToken` method
// achieves the same thing without touching the getter. `ws/server.js` calls
// `admin.auth().verifyIdToken(token)` fresh each time, always landing on
// this same patched instance.
let realVerifyIdToken;
beforeAll(() => {
  const authInstance = admin.auth();
  realVerifyIdToken = authInstance.verifyIdToken;
  authInstance.verifyIdToken = async (token) => {
    const uid = tokenToUid.get(token);
    if (!uid) throw new Error('invalid token');
    return { uid };
  };
});

afterAll(() => {
  admin.auth().verifyIdToken = realVerifyIdToken;
});

let server;
let port;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    res.writeHead(404);
    res.end();
  });
  attachWebSocketServer(server);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

function wsUrl(token) {
  const base = `ws://127.0.0.1:${port}/ws`;
  return token === undefined ? base : `${base}?token=${encodeURIComponent(token)}`;
}

// Collects every frame received on `ws` into `frames`, resolving `closed`
// when the socket closes (with the close code).
function trackClient(ws) {
  const frames = [];
  const closed = new Promise((resolve) => {
    ws.on('close', (code) => resolve(code));
  });
  ws.on('message', (data) => {
    frames.push(JSON.parse(data.toString()));
  });
  return { frames, closed };
}

function waitFor(frames, predicate, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const found = frames.find(predicate);
      if (found) return resolve(found);
      if (Date.now() - start > timeoutMs) return reject(new Error(`Timed out waiting for frame, got: ${JSON.stringify(frames)}`));
      setTimeout(check, 20);
    };
    check();
  });
}

describe('US-029 WebSocket infrastructure', () => {
  it('AC3: connecting with no token at all is rejected — error frame + close 4401, no subscription ever accepted', async () => {
    const ws = new WebSocket(wsUrl());
    const { frames, closed } = trackClient(ws);
    const code = await closed;
    expect(code).toBe(4401);
    expect(frames.find((f) => f.type === 'error' && f.messageKey === 'ws.error.unauthorized')).toBeDefined();
  });

  it('AC3: connecting with an invalid/unverifiable token is rejected the same way', async () => {
    const ws = new WebSocket(wsUrl('this-is-not-a-real-token'));
    const { frames, closed } = trackClient(ws);
    const code = await closed;
    expect(code).toBe(4401);
    expect(frames.find((f) => f.type === 'error' && f.messageKey === 'ws.error.unauthorized')).toBeDefined();
  });

  it('AC2: a valid token authenticates via the same Firebase Admin verify() REST uses, and the connection stays open', async () => {
    const userId = await createUser();
    const ws = new WebSocket(wsUrl(tokenFor(userId)));
    const { frames } = trackClient(ws);
    await waitFor(frames, (f) => f.type === 'ready');
    ws.close();
    await cleanupUser(userId);
  });

  it('AC4/US-027 AC5: subscribing to a DM thread I am NOT a participant of is denied with a structured, localized error — no crash, no silent drop', async () => {
    const ownerA = await createUser();
    const ownerB = await createUser();
    const stranger = await createUser();
    const competency = await db('competencies').where({ is_active: true }).first();
    await db('user_competencies')
      .insert({ user_id: ownerB, competency_id: competency.id, is_custom: false, willing_to_teach: true })
      .onConflict(['user_id', 'competency_id'])
      .merge({ willing_to_teach: true });
    const { thread } = await dmThreadsService.getOrCreateThread(ownerA, {
      targetUserId: ownerB,
      competencyId: competency.id,
    });

    const ws = new WebSocket(wsUrl(tokenFor(stranger)));
    const { frames } = trackClient(ws);
    await waitFor(frames, (f) => f.type === 'ready');

    ws.send(JSON.stringify({ type: 'subscribe', channel: 'dmThread', threadId: thread.id }));
    const errorFrame = await waitFor(frames, (f) => f.type === 'error');
    expect(errorFrame).toMatchObject({ code: 'FORBIDDEN', messageKey: 'ws.error.subscribeForbidden' });
    expect(frames.find((f) => f.type === 'subscribed')).toBeUndefined();

    ws.close();
    await Promise.all([cleanupUser(ownerA), cleanupUser(ownerB), cleanupUser(stranger)]);
  });

  it('AC4: subscribing to a DM thread I AM a participant of is accepted (ack), reusing the same authz as REST', async () => {
    const ownerA = await createUser();
    const ownerB = await createUser();
    const competency = await db('competencies').where({ is_active: true }).first();
    await db('user_competencies')
      .insert({ user_id: ownerB, competency_id: competency.id, is_custom: false, willing_to_teach: true })
      .onConflict(['user_id', 'competency_id'])
      .merge({ willing_to_teach: true });
    const { thread } = await dmThreadsService.getOrCreateThread(ownerA, {
      targetUserId: ownerB,
      competencyId: competency.id,
    });

    const ws = new WebSocket(wsUrl(tokenFor(ownerA)));
    const { frames } = trackClient(ws);
    await waitFor(frames, (f) => f.type === 'ready');

    ws.send(JSON.stringify({ type: 'subscribe', channel: 'dmThread', threadId: thread.id }));
    const ack = await waitFor(frames, (f) => f.type === 'subscribed');
    expect(ack).toMatchObject({ channel: 'dmThread', threadId: thread.id });

    ws.close();
    await Promise.all([cleanupUser(ownerA), cleanupUser(ownerB)]);
  });

  it('subscribing to a nonexistent/retired competency room is denied with errors.competencyChat.notFound', async () => {
    const userId = await createUser();
    const ws = new WebSocket(wsUrl(tokenFor(userId)));
    const { frames } = trackClient(ws);
    await waitFor(frames, (f) => f.type === 'ready');

    ws.send(JSON.stringify({ type: 'subscribe', channel: 'competencyChat', competencyId: '00000000-0000-0000-0000-000000000000' }));
    const errorFrame = await waitFor(frames, (f) => f.type === 'error');
    expect(errorFrame).toMatchObject({ code: 'NOT_FOUND', messageKey: 'errors.competencyChat.notFound' });

    ws.close();
    await cleanupUser(userId);
  });

  it('US-027 AC6/AC9/AC10: posting a DM message pushes dm.message.created to the OTHER participant\'s live socket, even without an explicit per-thread subscribe (inbox-level delivery)', async () => {
    const ownerA = await createUser();
    const ownerB = await createUser();
    const competency = await db('competencies').where({ is_active: true }).first();
    await db('user_competencies')
      .insert({ user_id: ownerB, competency_id: competency.id, is_custom: false, willing_to_teach: true })
      .onConflict(['user_id', 'competency_id'])
      .merge({ willing_to_teach: true });
    const { thread } = await dmThreadsService.getOrCreateThread(ownerA, {
      targetUserId: ownerB,
      competencyId: competency.id,
    });

    // ownerB connects but never sends an explicit "subscribe" for this
    // thread — only inbox-level (userId-keyed) delivery should reach them.
    const wsB = new WebSocket(wsUrl(tokenFor(ownerB)));
    const { frames: framesB } = trackClient(wsB);
    await waitFor(framesB, (f) => f.type === 'ready');

    // REST is the actual trigger point in production (the route calls this
    // same service function) — calling the service directly here is
    // equivalent and avoids standing up the full Express app for this test.
    const message = await dmThreadsService.createMessage(thread.id, ownerA, { body: 'Live push test' });

    const pushed = await waitFor(framesB, (f) => f.type === 'dm.message.created');
    expect(pushed.threadId).toBe(thread.id);
    expect(pushed.message.id).toBe(message.id);
    expect(pushed.message.body).toBe('Live push test');

    wsB.close();
    await Promise.all([cleanupUser(ownerA), cleanupUser(ownerB)]);
  });

  it('US-028 AC3: posting a competency-chat message pushes competencyChat.message.created only to subscribers of that room', async () => {
    const subscriber = await createUser();
    const nonSubscriber = await createUser();
    const sender = await createUser();
    const competency = await db('competencies').where({ is_active: true }).first();

    const wsSub = new WebSocket(wsUrl(tokenFor(subscriber)));
    const { frames: subFrames } = trackClient(wsSub);
    await waitFor(subFrames, (f) => f.type === 'ready');
    wsSub.send(JSON.stringify({ type: 'subscribe', channel: 'competencyChat', competencyId: competency.id }));
    await waitFor(subFrames, (f) => f.type === 'subscribed');

    const wsNonSub = new WebSocket(wsUrl(tokenFor(nonSubscriber)));
    const { frames: nonSubFrames } = trackClient(wsNonSub);
    await waitFor(nonSubFrames, (f) => f.type === 'ready');

    const competencyChatService = require('../../src/services/competencyChat.service');
    const message = await competencyChatService.createMessage(competency.id, sender, { body: 'Room broadcast' });

    const pushed = await waitFor(subFrames, (f) => f.type === 'competencyChat.message.created');
    expect(pushed.message.id).toBe(message.id);

    // Give the non-subscriber a short grace window, then confirm nothing
    // arrived — a group-chat room has no "inbox" fallback, unlike DM.
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(nonSubFrames.find((f) => f.type === 'competencyChat.message.created')).toBeUndefined();

    wsSub.close();
    wsNonSub.close();
    await Promise.all([cleanupUser(subscriber), cleanupUser(nonSubscriber), cleanupUser(sender)]);
  });

  it('a malformed frame gets a structured ws.error.badRequest, not a crash/silent drop', async () => {
    const userId = await createUser();
    const ws = new WebSocket(wsUrl(tokenFor(userId)));
    const { frames } = trackClient(ws);
    await waitFor(frames, (f) => f.type === 'ready');

    ws.send('not json at all');
    const errorFrame = await waitFor(frames, (f) => f.type === 'error');
    expect(errorFrame).toMatchObject({ code: 'BAD_REQUEST', messageKey: 'ws.error.badRequest' });

    ws.close();
    await cleanupUser(userId);
  });
});
