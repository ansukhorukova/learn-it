import { useEffect, useRef, useState } from 'react';

import { useAuthUser } from '../auth/useAuthUser';
import { wsClient } from '../lib/ws';

// React-facing wrapper around the session-wide `wsClient` singleton
// (US-029). Establishes the one shared connection as soon as a user is
// known, tears it down cleanly on sign-out, and exposes the status +
// subscribe helpers any chat screen needs. Multiple components mounting
// this hook at once (e.g. AppHeader's status badge AND an open DM thread
// screen) all observe the same underlying connection — never one socket per
// component (CLAUDE.md/US-029 "єдине з'єднання на сесію").
export function useWebSocket() {
  const { user } = useAuthUser();
  const [status, setStatus] = useState(wsClient.status);
  const wasSignedIn = useRef(false);

  useEffect(() => {
    if (user) {
      wasSignedIn.current = true;
      wsClient.connect(() => user.getIdToken());
    } else if (wasSignedIn.current) {
      // Transition from signed-in to signed-out (not "never signed in yet")
      // — close for real, no auto-reconnect, and forget every subscription
      // so a different account signing in on the same tab starts clean.
      wasSignedIn.current = false;
      wsClient.close();
    }
  }, [user]);

  useEffect(() => {
    return wsClient.onMessage((frame) => {
      if (frame.type === '__status') setStatus(frame.status);
    });
  }, []);

  return {
    status,
    onMessage: wsClient.onMessage.bind(wsClient),
    subscribeDmThread: wsClient.subscribeDmThread.bind(wsClient),
    subscribeCompetencyChat: wsClient.subscribeCompetencyChat.bind(wsClient),
  };
}
