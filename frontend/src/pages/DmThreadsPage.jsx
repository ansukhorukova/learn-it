import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { useAuthUser } from '../auth/useAuthUser';
import { useI18n } from '../i18n/I18nProvider';
import { useHeadMeta } from '../lib/useHeadMeta';
import { useWebSocket } from '../hooks/useWebSocket';
import { leaveCompetencyChat, listMyCompetencyChats, listMyDmThreads } from '../api/client';
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

  // US-033 — "Чати компетенцій" section, loaded/rendered independently of
  // the DM section above (same independent-section principle as US-024
  // AC6's "Мої дошки"/"Public Boards"): a hiccup fetching one never blocks
  // the other, and each has its own empty state.
  const [competencyChats, setCompetencyChats] = useState([]);
  const [competencyLoadState, setCompetencyLoadState] = useState('loading'); // loading | ready | error
  const [competencyLoadErrorKey, setCompetencyLoadErrorKey] = useState(null);
  const [leavingIds, setLeavingIds] = useState(new Set());
  const [leaveErrorKey, setLeaveErrorKey] = useState(null);

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

  // US-033 AC7 offers two equally-valid ways to surface reordering: on the
  // next `/messages` open, or live via a list-level WS event. Only the first
  // is wired here — per openapi.yaml's WebSocket section,
  // `competencyChat.message.created` has "no personal-inbox equivalent" and
  // is pushed only to connections subscribed to that specific room, unlike
  // `dm.message.created`'s per-participant inbox delivery (US-027 AC10).
  // Subscribing this screen to every joined competency's channel just for a
  // live bump isn't part of that contract, so REST-refresh-on-open is what
  // satisfies this AC.
  const loadCompetencyChats = useCallback(async () => {
    if (!user) return;
    setCompetencyLoadState('loading');
    try {
      const idToken = await user.getIdToken();
      const { chats } = await listMyCompetencyChats(idToken);
      setCompetencyChats(chats);
      setCompetencyLoadState('ready');
    } catch (err) {
      setCompetencyLoadErrorKey(err.messageKey || 'errors.generic');
      setCompetencyLoadState('error');
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadCompetencyChats();
  }, [loadCompetencyChats]);

  async function handleLeaveCompetencyChat(competencyId) {
    if (!user) return;
    setLeavingIds((prev) => new Set(prev).add(competencyId));
    setLeaveErrorKey(null);
    // Optimistic UI, same pattern as CompetencyChatPage/FindChatsPage —
    // remove the row immediately, restore it only if the request fails.
    const previous = competencyChats;
    setCompetencyChats((prev) => prev.filter((chat) => chat.competencyId !== competencyId));
    try {
      const idToken = await user.getIdToken();
      await leaveCompetencyChat(idToken, competencyId);
    } catch (err) {
      setCompetencyChats(previous);
      setLeaveErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setLeavingIds((prev) => {
        const next = new Set(prev);
        next.delete(competencyId);
        return next;
      });
    }
  }

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

        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>{t('chat.messages.dmSectionHeading')}</h2>

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
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <h2 className={styles.sectionHeading}>{t('chat.messages.competencySectionHeading')}</h2>
            {/* US-033 AC4 — always visible, not just in the empty state below. */}
            <Link to="/chats/find" className={styles.findChatsCta}>
              {t('chat.messages.findChatsCta')}
            </Link>
          </div>

          {competencyLoadState === 'loading' && <p className={styles.hint}>{t('board.overview.loading')}</p>}
          {competencyLoadState === 'error' && (
            <p className={styles.error} role="alert">
              {t(competencyLoadErrorKey)}
            </p>
          )}
          {leaveErrorKey && (
            <p className={styles.error} role="alert">
              {t(leaveErrorKey)}
            </p>
          )}

          {competencyLoadState === 'ready' && competencyChats.length === 0 && (
            <p className={styles.hint}>{t('chat.messages.emptyCompetencyChats')}</p>
          )}

          {competencyLoadState === 'ready' && competencyChats.length > 0 && (
            <ul className={styles.threadList}>
              {competencyChats.map((chat) => {
                const isLeaving = leavingIds.has(chat.competencyId);
                const activityAt = chat.lastMessage ? chat.lastMessage.createdAt : chat.joinedAt;

                // US-033 AC5 — a competency deactivated after I joined it
                // renders archived/disabled: no click-through to the chat,
                // only a "Leave chat" action to clear it out.
                if (!chat.competencyActive) {
                  return (
                    <li key={chat.id} className={`${styles.threadRow} ${styles.archivedRow}`}>
                      <div className={styles.threadMain}>
                        <span className={styles.threadName}>{t(`competency.${chat.competencySlug}`)}</span>
                      </div>
                      <p className={styles.threadPreview}>{t('chat.competency.unavailable')}</p>
                      <button
                        type="button"
                        className={styles.leaveButton}
                        onClick={() => handleLeaveCompetencyChat(chat.competencyId)}
                        disabled={isLeaving}
                      >
                        {t('chat.competency.leave')}
                      </button>
                    </li>
                  );
                }

                return (
                  <li key={chat.id}>
                    <Link to={`/competencies/${chat.competencyId}/chat`} className={styles.threadRow}>
                      <div className={styles.threadMain}>
                        <span className={styles.threadName}>{t(`competency.${chat.competencySlug}`)}</span>
                      </div>
                      <p className={styles.threadPreview}>
                        {chat.lastMessage ? chat.lastMessage.body : t('chat.competency.empty')}
                      </p>
                      <span className={styles.threadTime}>{formatSessionTimestamp(activityAt, locale)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default DmThreadsPage;
