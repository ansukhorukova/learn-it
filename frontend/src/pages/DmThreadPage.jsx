import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { useAuthUser } from '../auth/useAuthUser';
import { useI18n } from '../i18n/I18nProvider';
import { useHeadMeta } from '../lib/useHeadMeta';
import { useWebSocket } from '../hooks/useWebSocket';
import { createDmThreadMessage, listDmThreadMessages, listMyDmThreads } from '../api/client';
import AppHeader from '../components/AppHeader';
import ChatConversation from '../components/ChatConversation';
import styles from './DmThreadPage.module.css';

// /messages/:threadId (US-027) — one DM thread's history + send form. REST
// (`GET /dm-threads/:id/messages`) is fetched fresh on every mount (source
// of truth, US-027 AC8); the WS `dm.message.created` event then live-appends
// anything that arrives afterwards while this screen stays open (AC9).
//
// There's no `GET /dm-threads/:id` single-thread endpoint in the API
// surface (see openapi.yaml) — the header (other participant's name +
// competency) is hydrated from `GET /dm-threads` (the list this thread must
// appear in, since I'm necessarily one of its two participants) rather than
// a second bespoke request.
function DmThreadPage() {
  const { user, loading: authLoading } = useAuthUser();
  const { t } = useI18n();
  const { threadId } = useParams();
  const { status, onMessage, subscribeDmThread } = useWebSocket();

  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | forbidden | error
  const [loadErrorKey, setLoadErrorKey] = useState(null);

  const [wsErrorKey, setWsErrorKey] = useState(null);

  const knownMessageIds = useRef(new Set());

  useHeadMeta({
    title: thread
      ? t('chat.dm.threadHeading', { name: thread.otherUser.name, competency: t(`competency.${thread.competencySlug}`) })
      : t('chat.dm.listTitle'),
    description: t('chat.dm.emptyThread'),
  });

  const load = useCallback(async () => {
    if (!user) return;
    setLoadState('loading');
    setLoadErrorKey(null);
    try {
      const idToken = await user.getIdToken();
      const [{ threads }, { messages: rows }] = await Promise.all([
        listMyDmThreads(idToken),
        listDmThreadMessages(idToken, threadId),
      ]);
      const currentThread = threads.find((t2) => t2.id === threadId);
      knownMessageIds.current = new Set(rows.map((m) => m.id));
      setThread(currentThread || null);
      setMessages(rows);
      setLoadState('ready');
    } catch (err) {
      if (err.status === 403) {
        setLoadState('forbidden');
        setLoadErrorKey(err.messageKey || 'errors.dmThread.forbidden');
      } else {
        setLoadErrorKey(err.messageKey || 'errors.generic');
        setLoadState('error');
      }
    }
  }, [user, threadId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loadState !== 'ready') return undefined;
    return subscribeDmThread(threadId);
  }, [loadState, threadId, subscribeDmThread]);

  useEffect(() => {
    return onMessage((frame) => {
      if (frame.type === 'error' && frame.messageKey && frame.messageKey !== 'ws.error.unauthorized') {
        // Connection-level `unauthorized` is surfaced globally by AppHeader —
        // this only handles subscribe-scoped errors for THIS thread (e.g.
        // `ws.error.subscribeForbidden`).
        setWsErrorKey(frame.messageKey);
        return;
      }
      if (frame.type !== 'dm.message.created' || frame.threadId !== threadId) return;
      // My own just-sent message is already appended optimistically from the
      // POST response below — the server also pushes this same event back to
      // my own live connection(s) (openapi.yaml: "EVERY live connection
      // belonging to either participant"), so dedupe by id.
      if (knownMessageIds.current.has(frame.message.id)) return;
      knownMessageIds.current.add(frame.message.id);
      setMessages((prev) => (prev ? [...prev, frame.message] : [frame.message]));
    });
  }, [onMessage, threadId]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  async function handleSend(body, replyToMessageId) {
    const idToken = await user.getIdToken();
    const message = await createDmThreadMessage(idToken, threadId, { body, replyToMessageId });
    if (!knownMessageIds.current.has(message.id)) {
      knownMessageIds.current.add(message.id);
      setMessages((prev) => (prev ? [...prev, message] : [message]));
    }
  }

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <Link to="/messages" className={styles.backLink}>
          {t('chat.dm.listTitle')}
        </Link>

        {loadState === 'loading' && <p className={styles.hint}>{t('board.overview.loading')}</p>}

        {loadState === 'forbidden' && (
          <p className={styles.error} role="alert">
            {t(loadErrorKey)}
          </p>
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
                {thread
                  ? t('chat.dm.threadHeading', {
                      name: thread.otherUser.name,
                      competency: t(`competency.${thread.competencySlug}`),
                    })
                  : t('chat.dm.listTitle')}
              </h1>
              {status === 'reconnecting' && (
                <span className={styles.reconnecting} role="status">
                  {t('ws.status.reconnecting')}
                </span>
              )}
            </div>

            {wsErrorKey && (
              <p className={styles.error} role="alert">
                {t(wsErrorKey)}
              </p>
            )}

            {/* US-036 AC12: DM messages get no Forward control — `onForward`
                is omitted entirely, never just disabled. */}
            <ChatConversation
              messages={messages}
              currentUserId={user.uid}
              emptyLabel={t('chat.dm.emptyThread')}
              placeholder={t('chat.dm.messagePlaceholder')}
              sendLabel={t('chat.dm.send')}
              sendingLabel={t('chat.dm.sending')}
              bodyRequiredKey="errors.dmThread.messageBodyRequired"
              bodyTooLongKey="errors.dmThread.messageBodyTooLong"
              onSend={handleSend}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default DmThreadPage;
