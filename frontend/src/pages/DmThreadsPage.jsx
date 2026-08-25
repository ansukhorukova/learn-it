import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { useAuthUser } from '../auth/useAuthUser';
import { useI18n } from '../i18n/I18nProvider';
import { useHeadMeta } from '../lib/useHeadMeta';
import { useWebSocket } from '../hooks/useWebSocket';
import { listMyDmThreads } from '../api/client';
import { formatSessionTimestamp } from '../lib/duration';
import AppHeader from '../components/AppHeader';
import styles from './DmThreadsPage.module.css';

// /messages (US-027 AC11/AC12) — my DM threads, most recently active first.
// REST (`GET /dm-threads`) is the source of truth on every (re)load; the WS
// `dm.message.created` event is only used to bump a thread's preview/
// position live while this screen is open, per US-027 AC10 — it arrives at
// the "inbox" level for BOTH participants regardless of whether this list
// (or the thread itself) is subscribed to anything, so no explicit
// `subscribe` call is needed here (see openapi.yaml's WebSocket section).
function DmThreadsPage() {
  const { user, loading: authLoading } = useAuthUser();
  const { t, locale } = useI18n();
  const { status, onMessage } = useWebSocket();

  useHeadMeta({ title: t('chat.dm.listTitle'), description: t('chat.dm.emptyList') });

  const [threads, setThreads] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | error
  const [loadErrorKey, setLoadErrorKey] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoadState('loading');
    try {
      const idToken = await user.getIdToken();
      const { threads: rows } = await listMyDmThreads(idToken);
      setThreads(rows);
      setLoadState('ready');
    } catch (err) {
      setLoadErrorKey(err.messageKey || 'errors.generic');
      setLoadState('error');
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return onMessage((frame) => {
      if (frame.type !== 'dm.message.created') return;
      setThreads((prev) => {
        const index = prev.findIndex((thread) => thread.id === frame.threadId);
        if (index === -1) {
          // A brand-new thread I have no local record of yet (the other
          // participant just started it) — the full list is small (no
          // pagination in MVP) and is the only place that knows the new
          // thread's competency/otherUser details, so just re-fetch it.
          load();
          return prev;
        }
        const updated = {
          ...prev[index],
          lastMessage: { body: frame.message.body, createdAt: frame.message.createdAt },
        };
        const next = prev.filter((_, i) => i !== index);
        next.unshift(updated);
        return next;
      });
    });
  }, [onMessage, load]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.headerRow}>
          <h1>{t('chat.dm.listTitle')}</h1>
          {status === 'reconnecting' && (
            <span className={styles.reconnecting} role="status">
              {t('ws.status.reconnecting')}
            </span>
          )}
        </div>

        {loadState === 'loading' && <p className={styles.hint}>{t('board.overview.loading')}</p>}
        {loadState === 'error' && (
          <p className={styles.error} role="alert">
            {t(loadErrorKey)}
          </p>
        )}

        {loadState === 'ready' && threads.length === 0 && <p className={styles.hint}>{t('chat.dm.emptyList')}</p>}

        {loadState === 'ready' && threads.length > 0 && (
          <ul className={styles.threadList}>
            {threads.map((thread) => (
              <li key={thread.id}>
                <Link to={`/messages/${thread.id}`} className={styles.threadRow}>
                  <div className={styles.threadMain}>
                    <span className={styles.threadName}>{thread.otherUser.name}</span>
                    <span className={styles.threadCompetency}>{t(`competency.${thread.competencySlug}`)}</span>
                  </div>
                  <p className={styles.threadPreview}>
                    {thread.lastMessage ? thread.lastMessage.body : t('chat.dm.emptyThread')}
                  </p>
                  {thread.lastMessage && (
                    <span className={styles.threadTime}>
                      {formatSessionTimestamp(thread.lastMessage.createdAt, locale)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default DmThreadsPage;
