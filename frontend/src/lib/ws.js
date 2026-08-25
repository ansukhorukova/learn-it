// US-029 — single WebSocket connection shared by the whole session (DM
// thread list, an open DM thread, an open competency chat room), never one
// socket per component. See backend/openapi.yaml's "WebSocket channel"
// section for the full wire protocol this module implements against.
//
// Contract recap (openapi.yaml, US-029 AC2/AC3/AC5):
//  - Connect: `${WS_BASE_URL}/ws?token=<Firebase ID token>` — token as a
//    query param because the browser's native WebSocket API can't set
//    request headers on the upgrade request.
//  - Wait for `{"type":"ready"}` before sending any `subscribe` frame.
//  - Subscriptions are NOT remembered by the server across a reconnect —
//    this module re-sends every currently-active subscription itself once
//    the new connection reaches `ready`.
//  - REST is always the source of truth (US-027 AC8, US-028 AC9); this
//    module only ever accelerates "live" delivery, it never owns state that
//    isn't also fetchable via REST.

import { API_URL } from '../api/client';

const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 15000;

// `API_URL` is e.g. 'http://localhost:4000/api/v1' locally or
// 'https://api.example.com/api/v1' in production (VITE_API_URL, never
// hardcoded here — CLAUDE.md "ніколи не хардкодь localhost"). The WS
// endpoint lives on the same host/port per backend-developer's placement
// decision (US-029 AC6/AC7: attached to the same Express process), just
// under `/ws` instead of `/api/v1/...` and with `ws(s):` instead of
// `http(s):`.
function deriveWsBaseUrl(apiUrl) {
  const url = new URL(apiUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '';
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

// Status values a consumer (see hooks/useWebSocket.js) can render:
//   idle          — never connected yet, or cleanly closed (e.g. sign-out).
//   connecting    — first connection attempt in flight.
//   ready         — server sent {"type":"ready"}; subscribe/send are safe.
//   reconnecting  — a previous connection dropped, backing off before retry
//                   (ws.status.reconnecting in the locale dictionaries).
class WsClient {
  constructor() {
    this.socket = null;
    this.getIdToken = null;
    this.status = 'idle';
    // key -> the exact subscribe frame to resend after a reconnect.
    this.subscriptions = new Map();
    this.listeners = new Set();
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.manualClose = false;
  }

  // `listener(frame)` receives every server frame verbatim (ready,
  // subscribed, error, dm.message.created, competencyChat.message.created),
  // PLUS a synthetic `{ type: '__status', status }` frame whenever the
  // connection status above changes — callers that only care about the
  // status badge can filter on that without a separate subscription API.
  onMessage(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(frame) {
    this.listeners.forEach((listener) => listener(frame));
  }

  setStatus(status) {
    if (this.status === status) return;
    this.status = status;
    this.emit({ type: '__status', status });
  }

  // Idempotent: safe to call from every screen that needs live updates —
  // if a connection is already open or opening, this is a no-op. `getIdToken`
  // is stored and re-invoked on every (re)connect, since a token fetched
  // once could be stale by the time of a later reconnect; the Firebase SDK
  // transparently refreshes/caches the token on each `getIdToken()` call, so
  // this module never caches it itself (US-029 "token refresh" note).
  async connect(getIdToken) {
    this.getIdToken = getIdToken;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.manualClose = false;
    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    let idToken;
    try {
      idToken = await getIdToken();
    } catch {
      this.scheduleReconnect();
      return;
    }

    const base = deriveWsBaseUrl(API_URL);
    const socket = new WebSocket(`${base}/ws?token=${encodeURIComponent(idToken)}`);
    this.socket = socket;

    socket.onmessage = (event) => {
      let frame;
      try {
        frame = JSON.parse(event.data);
      } catch {
        return;
      }
      if (frame.type === 'ready') {
        this.reconnectAttempts = 0;
        this.setStatus('ready');
        this.resubscribeAll();
      }
      this.emit(frame);
    };

    socket.onclose = () => {
      if (this.socket !== socket) return; // a newer connection already replaced this one
      this.socket = null;
      if (this.manualClose) {
        this.setStatus('idle');
        return;
      }
      this.scheduleReconnect();
    };

    // onclose always fires after onerror for a WebSocket, so reconnect
    // scheduling lives in one place (onclose) rather than being duplicated.
    socket.onerror = () => {};
  }

  scheduleReconnect() {
    this.setStatus('reconnecting');
    const delay = Math.min(RECONNECT_MAX_DELAY_MS, RECONNECT_BASE_DELAY_MS * 2 ** this.reconnectAttempts);
    this.reconnectAttempts += 1;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.getIdToken) this.connect(this.getIdToken);
    }, delay);
  }

  resubscribeAll() {
    this.subscriptions.forEach((frame) => this.sendFrame(frame));
  }

  sendFrame(frame) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(frame));
    }
    // If not open yet, the frame is simply skipped for now — it's already
    // recorded in `this.subscriptions` (for subscribe calls) so `ready`'s
    // resubscribeAll() sends it as soon as the connection is up.
  }

  // Returns an unsubscribe function, same convention as onMessage() above.
  subscribeDmThread(threadId) {
    const key = `dmThread:${threadId}`;
    this.subscriptions.set(key, { type: 'subscribe', channel: 'dmThread', threadId });
    this.sendFrame(this.subscriptions.get(key));
    return () => {
      this.subscriptions.delete(key);
      this.sendFrame({ type: 'unsubscribe', channel: 'dmThread', threadId });
    };
  }

  subscribeCompetencyChat(competencyId) {
    const key = `competencyChat:${competencyId}`;
    this.subscriptions.set(key, { type: 'subscribe', channel: 'competencyChat', competencyId });
    this.sendFrame(this.subscriptions.get(key));
    return () => {
      this.subscriptions.delete(key);
      this.sendFrame({ type: 'unsubscribe', channel: 'competencyChat', competencyId });
    };
  }

  // Called on sign-out (see useWebSocket.js) — a real close, no reconnect,
  // and every remembered subscription is dropped so a different account
  // signing in on the same tab never inherits them.
  close() {
    this.manualClose = true;
    this.subscriptions.clear();
    clearTimeout(this.reconnectTimer);
    this.reconnectAttempts = 0;
    if (this.socket) {
      this.socket.close();
    } else {
      this.setStatus('idle');
    }
  }
}

// One instance per browser tab/session (module singleton) — every
// `useWebSocket()` call below shares it rather than opening its own socket.
export const wsClient = new WsClient();
