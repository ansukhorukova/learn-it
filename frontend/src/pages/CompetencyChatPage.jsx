import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { useAuthUser } from '../auth/useAuthUser';
import { useI18n } from '../i18n/I18nProvider';
import { useHeadMeta } from '../lib/useHeadMeta';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  createCompetencyChatMessage,
  joinCompetencyChat,
  leaveCompetencyChat,
  listCompetencyCatalog,
  listCompetencyChatMessages,
  listMyCompetencyChats,
} from '../api/client';
import AppHeader from '../components/AppHeader';
import ChatConversation from '../components/ChatConversation';
import ForwardMessageModal from '../components/ForwardMessageModal';
import styles from './CompetencyChatPage.module.css';

// /competencies/:id/chat (US-028) — the one shared discussion room for a
// competency, identified directly by its id (no separate "rooms" resource,
// decision #3 in USER_STORIES.md's US-025…029 origin notes). Open to any
// authenticated user regardless of whether this competency is in their own
// profile (decision #4) — no membership gate at all, unlike every other
// resource in this app.
function CompetencyChatPage() {
  const { user, loading: authLoading } = useAuthUser();
  const { t } = useI18n();
  const { id: competencyId } = useParams();
  const { status, onMessage, subscribeCompetencyChat } = useWebSocket();

  const [competencySlug, setCompetencySlug] = useState(null);
  const [messages, setMessages] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | notFound | error
  const [loadErrorKey, setLoadErrorKey] = useState(null);

  const [wsErrorKey, setWsErrorKey] = useState(null);

  // US-036 — the competency-chat message a "Forward" click opened the modal
  // for, and a transient success toast after a forward completes (AC9).
  const [forwardSource, setForwardSource] = useState(null);
  const [forwardToastKey, setForwardToastKey] = useState(null);

  // US-031 AC8/AC9 — membership control available from ANY entry point into
  // this screen, not just /chats/find. `null` while unknown (membership
  // fetch is best-effort — a hiccup never blocks the chat itself, same
  // non-blocking pattern as the competency-name lookup below); toggling is
  // optimistic (no re-fetch), the next `/competency-chats/mine` load is what
  // picks it up on the Messages screen (US-033).
  const [joined, setJoined] = useState(null);
  const [membershipErrorKey, setMembershipErrorKey] = useState(null);
  const [membershipBusy, setMembershipBusy] = useState(false);

  const knownMessageIds = useRef(new Set());

  const competencyLabel = competencySlug ? t(`competency.${competencySlug}`) : '';

  useHeadMeta({
    title: competencySlug ? t('chat.competency.title', { competency: competencyLabel }) : t('chat.dm.listTitle'),
    description: t('chat.competency.empty'),
  });

  const load = useCallback(async () => {
    if (!user) return;
    setLoadState('loading');
    setLoadErrorKey(null);
    try {
      const idToken = await user.getIdToken();
      const [{ messages: rows }, { competencies }, mine] = await Promise.all([
        listCompetencyChatMessages(idToken, competencyId),
        // Best-effort — used only to render the room's name; a catalog
        // hiccup never blocks the chat itself (same non-blocking pattern as
        // BoardsPage.jsx's category/language dictionary fetch).
        listCompetencyCatalog(idToken).catch(() => ({ competencies: [] })),
        // Best-effort — used only to render the join/leave control's initial
        // state; a hiccup here never blocks reading/writing the chat itself
        // (US-031 AC4: membership never gates chat access).
        listMyCompetencyChats(idToken).catch(() => null),
      ]);
      knownMessageIds.current = new Set(rows.map((m) => m.id));
      setMessages(rows);
      const entry = competencies.find((c) => c.id === competencyId);
      setCompetencySlug(entry ? entry.slug : null);
      setJoined(mine ? mine.chats.some((chat) => chat.competencyId === competencyId) : null);
      setLoadState('ready');
    } catch (err) {
      if (err.messageKey === 'errors.competencyChat.notFound') {
        setLoadState('notFound');
      } else {
        setLoadErrorKey(err.messageKey || 'errors.generic');
        setLoadState('error');
      }
    }
  }, [user, competencyId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loadState !== 'ready') return undefined;
    return subscribeCompetencyChat(competencyId);
  }, [loadState, competencyId, subscribeCompetencyChat]);

  useEffect(() => {
    return onMessage((frame) => {
      if (frame.type === 'error' && frame.messageKey && frame.messageKey !== 'ws.error.unauthorized') {
        // Connection-level `unauthorized` is surfaced globally by AppHeader —
        // this only handles subscribe-scoped errors for THIS room (e.g. a
        // competency retired after this screen was opened).
        setWsErrorKey(frame.messageKey);
        return;
      }
      if (frame.type !== 'competencyChat.message.created' || frame.competencyId !== competencyId) return;
      if (knownMessageIds.current.has(frame.message.id)) return;
      knownMessageIds.current.add(frame.message.id);
      setMessages((prev) => (prev ? [...prev, frame.message] : [frame.message]));
    });
  }, [onMessage, competencyId]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  async function handleSend(body, replyToMessageId) {
    const idToken = await user.getIdToken();
    const message = await createCompetencyChatMessage(idToken, competencyId, { body, replyToMessageId });
    if (!knownMessageIds.current.has(message.id)) {
      knownMessageIds.current.add(message.id);
      setMessages((prev) => (prev ? [...prev, message] : [message]));
    }
  }

  function handleForwarded(message, destination) {
    // US-036 AC9 — flash the success toast. If the forward's destination is
    // THIS room, append the returned message right away (deduped against
    // the WS push that also delivers it, same guard as handleSend) so it
    // shows even if the socket is momentarily down.
    if (
      destination.type === 'competencyChat' &&
      destination.id === competencyId &&
      !knownMessageIds.current.has(message.id)
    ) {
      knownMessageIds.current.add(message.id);
      setMessages((prev) => (prev ? [...prev, message] : [message]));
    }
    setForwardToastKey('chat.forward.success');
    window.setTimeout(() => setForwardToastKey(null), 3000);
  }

  async function handleToggleMembership() {
    if (!user || membershipBusy) return;
    const wasJoined = joined;
    setMembershipBusy(true);
    setMembershipErrorKey(null);
    // Optimistic UI (US-031 AC9) — flip immediately, no re-fetch; roll back
    // only if the request itself fails.
    setJoined(!wasJoined);
    try {
      const idToken = await user.getIdToken();
      if (wasJoined) {
        await leaveCompetencyChat(idToken, competencyId);
      } else {
        await joinCompetencyChat(idToken, competencyId);
      }
    } catch (err) {
      setJoined(wasJoined);
      setMembershipErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setMembershipBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <Link to="/people" className={styles.backLink}>
          {t('people.search.title')}
        </Link>

        {loadState === 'loading' && <p className={styles.hint}>{t('board.overview.loading')}</p>}

        {loadState === 'notFound' && (
          <div className={styles.emptyState}>
            <p>{t('errors.competencyChat.notFound')}</p>
          </div>
        )}

        {loadState === 'error' && (
          <p className={styles.error} role="alert">
            {t(loadErrorKey)}
          </p>
        )}

        {loadState === 'ready' && (
          <>
            <div className={styles.headerRow}>
              <h1 className={styles.heading}>
                {competencySlug ? t('chat.competency.title', { competency: competencyLabel }) : ''}
              </h1>
              {status === 'reconnecting' && (
                <span className={styles.reconnecting} role="status">
                  {t('ws.status.reconnecting')}
                </span>
              )}
              {joined !== null && (
                <button
                  type="button"
                  className={joined ? styles.leaveButton : styles.joinButton}
                  onClick={handleToggleMembership}
                  disabled={membershipBusy}
                >
                  {joined ? t('chat.competency.leave') : t('chat.competency.join')}
                </button>
              )}
            </div>

            {membershipErrorKey && (
              <p className={styles.error} role="alert">
                {t(membershipErrorKey)}
              </p>
            )}

            {wsErrorKey && (
              <p className={styles.error} role="alert">
                {t(wsErrorKey)}
              </p>
            )}

            {forwardToastKey && (
              <p className={styles.toast} role="status">
                {t(forwardToastKey)}
              </p>
            )}

            {/* US-036 AC12: every competency-chat message is forwardable by
                any authenticated user — `onForward` is always passed here
                (unlike DmThreadPage, which omits it). */}
            <ChatConversation
              messages={messages}
              currentUserId={user.uid}
              emptyLabel={t('chat.competency.empty')}
              placeholder={t('chat.competency.messagePlaceholder')}
              sendLabel={t('chat.competency.send')}
              sendingLabel={t('chat.competency.sending')}
              bodyRequiredKey="errors.competencyChat.messageBodyRequired"
              bodyTooLongKey="errors.competencyChat.messageBodyTooLong"
              onSend={handleSend}
              onForward={(message) => setForwardSource(message)}
            />
          </>
        )}
      </main>

      {forwardSource && (
        <ForwardMessageModal
          user={user}
          sourceMessage={forwardSource}
          onClose={() => setForwardSource(null)}
          onForwarded={handleForwarded}
        />
      )}
    </div>
  );
}

export default CompetencyChatPage;
