const { WebSocketServer, WebSocket } = require('ws');
const admin = require('../lib/firebaseAdmin');
const { requireDmThreadAccess, requireActiveCompetencyRoom } = require('../lib/authz');

/**
 * WS layer — US-029. Technical placement decision (US-029 AC6/AC7): this is
 * NOT a separate process/docker-compose service. It's a `WebSocketServer`
 * attached to the SAME `http.Server` the Express app already listens on
 * (see server.js), sharing port 4000. Rationale:
 *   - Zero new infra to run/deploy locally or on Cloud Run — Cloud Run
 *     already forwards WebSocket upgrade requests to a container's single
 *     listening port, no extra service/ingress config needed.
 *   - The delivery-guarantee contract (REST is the source of truth, WS only
 *     accelerates "live" delivery, CLAUDE.md/US-027 AC8) means the two
 *     layers only ever need to talk to each other in-process — `dmThreads
 *     .service.js`/`competencyChat.service.js` call `broadcastDmMessage`/
 *     `broadcastCompetencyChatMessage` below directly after a successful
 *     INSERT, no queue or pub/sub hand-off required.
 *   - Trade-off, explicitly accepted for this MVP pass: the subscriber
 *     registries below (`dmSubscribers`/`competencySubscribers`/
 *     `userSockets`) are plain in-process `Map`s. This works only because
 *     Cloud Run today runs this backend as a single container. A future
 *     multi-instance deploy would need a shared layer (Postgres LISTEN/
 *     NOTIFY, Redis pub/sub, …) to fan a broadcast out to sockets held by
 *     OTHER instances — out of scope here (US-029 leaves "як саме" to
 *     backend-developer judgment, this is that judgment call, documented
 *     per AC6/AC7 for whoever revisits it at that point).
 * `docker-compose.yml` is therefore intentionally UNCHANGED by this pass
 * (US-029 AC7's other branch).
 *
 * Protocol (documented in full in openapi.yaml's "WebSocket channel" section
 * near the end of the file — OpenAPI itself has no WS syntax, so it's a
 * plain-text section there, not a `paths` entry):
 *
 *   Connect:    wss://<host>/ws?token=<Firebase ID token>
 *   Server -> Client, on successful auth:      {"type":"ready"}
 *   Server -> Client, on failed/missing auth:  {"type":"error", code:
 *               "UNAUTHORIZED", "messageKey":"ws.error.unauthorized"}
 *               immediately followed by a close (code 4401) — no
 *               subscription or message is ever accepted first (US-029 AC3).
 *   Client -> Server: {"type":"subscribe","channel":"dmThread","threadId":"..."}
 *                     {"type":"subscribe","channel":"competencyChat","competencyId":"..."}
 *                     {"type":"unsubscribe", ...same shape}
 *   Server -> Client, ack:   {"type":"subscribed","channel":...,"threadId"|"competencyId":...}
 *   Server -> Client, deny:  {"type":"error","code":"FORBIDDEN","messageKey":"ws.error.subscribeForbidden"}
 *                            (dmThread — not a participant, or thread doesn't
 *                            exist, indistinguishable per requireDmThreadAccess)
 *                    or:     {"type":"error","code":"NOT_FOUND","messageKey":"errors.competencyChat.notFound"}
 *                            (competencyChat — room doesn't exist / retired)
 *   Server -> Client, push:  {"type":"dm.message.created","threadId":"...","message":{...}}
 *                             — sent to sockets subscribed to that specific
 *                             dmThread channel (an open thread screen, AC9)
 *                             AND, independently, to every OTHER live socket
 *                             belonging to either participant regardless of
 *                             whether they've subscribed to this exact
 *                             thread (US-027 AC10 — bumps the my-threads
 *                             list even when that thread screen isn't open;
 *                             this is "my own inbox", trivially authorized
 *                             by `ws.userId` alone, not a separate
 *                             authorization-gated subscription).
 *                            {"type":"competencyChat.message.created","competencyId":"...","message":{...}}
 *                             — sent only to sockets subscribed to that
 *                             competencyChat channel (no personal-inbox
 *                             equivalent for a shared room).
 *
 * Delivery guarantee (US-027 AC8/AC9, US-029 AC5/AC9): every broadcast
 * below is fire-and-forget best-effort over whatever sockets happen to be
 * registered at that instant. There's no queue/redelivery — a socket that's
 * offline, not yet subscribed, or belongs to a different process instance
 * (see trade-off note above) simply doesn't get the push. That's fine ONLY
 * because REST (`GET .../messages`) is unconditionally the source of truth
 * — the message row is already committed to Postgres before either
 * broadcast function is ever called (see dmThreads.service.js/
 * competencyChat.service.js), so a missed push never means a lost message.
 */

const WS_PATH = '/ws';
const CLOSE_UNAUTHORIZED = 4401;

// threadId -> Set<ws> (explicit "I'm looking at this thread right now"
// subscriptions, authorization-gated by requireDmThreadAccess).
const dmSubscribers = new Map();
// competencyId -> Set<ws> (explicit room subscriptions, gated by
// requireActiveCompetencyRoom).
const competencySubscribers = new Map();
// userId -> Set<ws> (every live, authenticated socket for this user —
// populated automatically on successful auth, no explicit subscribe frame
// needed since it's always the caller's own data; this is what powers the
// my-threads-list "bump" in US-027 AC10 without requiring that thread's
// channel to already be subscribed).
const userSockets = new Map();

function send(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function sendWsError(ws, code, messageKey) {
  send(ws, { type: 'error', code, messageKey });
}

function addToSetMap(map, key, ws) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(ws);
}

function removeFromSetMap(map, key, ws) {
  const set = map.get(key);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) map.delete(key);
}

function cleanupConnection(ws) {
  if (ws.userId) removeFromSetMap(userSockets, ws.userId, ws);
  if (ws.dmThreadIds) {
    for (const id of ws.dmThreadIds) removeFromSetMap(dmSubscribers, id, ws);
  }
  if (ws.competencyIds) {
    for (const id of ws.competencyIds) removeFromSetMap(competencySubscribers, id, ws);
  }
}

async function handleSubscribe(ws, msg) {
  if (msg.channel === 'dmThread') {
    try {
      await requireDmThreadAccess(msg.threadId, ws.userId);
    } catch (err) {
      return sendWsError(ws, 'FORBIDDEN', 'ws.error.subscribeForbidden');
    }
    ws.dmThreadIds.add(msg.threadId);
    addToSetMap(dmSubscribers, msg.threadId, ws);
    return send(ws, { type: 'subscribed', channel: 'dmThread', threadId: msg.threadId });
  }

  if (msg.channel === 'competencyChat') {
    try {
      await requireActiveCompetencyRoom(msg.competencyId);
    } catch (err) {
      return sendWsError(ws, 'NOT_FOUND', 'errors.competencyChat.notFound');
    }
    ws.competencyIds.add(msg.competencyId);
    addToSetMap(competencySubscribers, msg.competencyId, ws);
    return send(ws, { type: 'subscribed', channel: 'competencyChat', competencyId: msg.competencyId });
  }

  return sendWsError(ws, 'BAD_REQUEST', 'ws.error.badRequest');
}

function handleUnsubscribe(ws, msg) {
  if (msg.channel === 'dmThread' && msg.threadId) {
    ws.dmThreadIds.delete(msg.threadId);
    removeFromSetMap(dmSubscribers, msg.threadId, ws);
    return;
  }
  if (msg.channel === 'competencyChat' && msg.competencyId) {
    ws.competencyIds.delete(msg.competencyId);
    removeFromSetMap(competencySubscribers, msg.competencyId, ws);
  }
}

/**
 * Attaches the WS upgrade handler to an existing `http.Server` (see
 * server.js). Returns the `WebSocketServer` instance mainly so tests can
 * hook `wss.close()` for cleanup — production code never needs it after
 * calling this once at startup.
 */
function attachWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: WS_PATH });

  wss.on('connection', (ws, req) => {
    ws.dmThreadIds = new Set();
    ws.competencyIds = new Set();

    // Token transport decision (US-029 AC2, left to backend-developer
    // judgment): a query parameter. The browser's native WebSocket API
    // can't set custom headers on the upgrade request, and a "send the
    // token as the first message after connecting" handshake would mean
    // briefly accepting a connection before it's authenticated — the query
    // param lets the token be verified synchronously in the `connection`
    // handler, before a single subscribe/message frame is ever processed
    // (AC3: "без прийому підписок чи повідомлень").
    let token = null;
    try {
      token = new URL(req.url, 'http://internal').searchParams.get('token');
    } catch {
      token = null;
    }

    if (!token) {
      sendWsError(ws, 'UNAUTHORIZED', 'ws.error.unauthorized');
      ws.close(CLOSE_UNAUTHORIZED, 'unauthorized');
      return;
    }

    // Same Firebase Admin SDK verify() the REST `requireAuth` middleware
    // uses (auth.middleware.js) — not a separate/parallel auth mechanism,
    // per US-029 AC2/US-027 AC13.
    admin
      .auth()
      .verifyIdToken(token)
      .then((decoded) => {
        if (ws.readyState !== WebSocket.OPEN) return; // client disconnected mid-verify

        ws.userId = decoded.uid;
        addToSetMap(userSockets, ws.userId, ws);
        send(ws, { type: 'ready' });

        ws.on('message', (data) => {
          let msg;
          try {
            msg = JSON.parse(data.toString());
          } catch {
            sendWsError(ws, 'BAD_REQUEST', 'ws.error.badRequest');
            return;
          }
          if (!msg || typeof msg.type !== 'string') {
            sendWsError(ws, 'BAD_REQUEST', 'ws.error.badRequest');
            return;
          }
          if (msg.type === 'subscribe') {
            handleSubscribe(ws, msg).catch(() => sendWsError(ws, 'INTERNAL_ERROR', 'errors.generic'));
          } else if (msg.type === 'unsubscribe') {
            handleUnsubscribe(ws, msg);
          } else {
            sendWsError(ws, 'BAD_REQUEST', 'ws.error.badRequest');
          }
        });
      })
      .catch(() => {
        sendWsError(ws, 'UNAUTHORIZED', 'ws.error.unauthorized');
        ws.close(CLOSE_UNAUTHORIZED, 'unauthorized');
      });

    ws.on('close', () => cleanupConnection(ws));
  });

  return wss;
}

/**
 * Called by dmThreads.service.js's createMessage AFTER the `dm_messages`
 * row is committed (US-027 AC6/AC8) — never before, so a push can't ever
 * race ahead of the row a subsequent REST `GET .../messages` would need to
 * see. `thread` needs only `id`/`user_a_id`/`user_b_id` (the row shape
 * `requireDmThreadAccess` already returns).
 */
function broadcastDmMessage(thread, message) {
  const payload = { type: 'dm.message.created', threadId: thread.id, message };
  const targets = new Set();

  const threadSubs = dmSubscribers.get(thread.id);
  if (threadSubs) for (const ws of threadSubs) targets.add(ws);

  for (const uid of [thread.user_a_id, thread.user_b_id]) {
    const socks = userSockets.get(uid);
    if (socks) for (const ws of socks) targets.add(ws);
  }

  for (const ws of targets) send(ws, payload);
}

/**
 * Called by competencyChat.service.js's createMessage after the
 * `competency_chat_messages` row is committed (US-028 AC3).
 */
function broadcastCompetencyChatMessage(competencyId, message) {
  const payload = { type: 'competencyChat.message.created', competencyId, message };
  const subs = competencySubscribers.get(competencyId);
  if (!subs) return;
  for (const ws of subs) send(ws, payload);
}

module.exports = {
  WS_PATH,
  attachWebSocketServer,
  broadcastDmMessage,
  broadcastCompetencyChatMessage,
};
