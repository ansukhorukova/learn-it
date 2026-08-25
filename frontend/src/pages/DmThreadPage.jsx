import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { useAuthUser } from '../auth/useAuthUser';
import { useI18n } from '../i18n/I18nProvider';
import { useHeadMeta } from '../lib/useHeadMeta';
import { useWebSocket } from '../hooks/useWebSocket';
import { createDmThreadMessage, listDmThreadMessages, listMyDmThreads } from '../api/client';
import { formatSessionTimestamp } from '../lib/duration';
import { CHAT_MESSAGE_BODY_MAX_LENGTH } from '../constants/chatMessageLimits';
import AppHeader from '../components/AppHeader';
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
  const { t, locale } = useI18n();
  const { threadId } = useParams();
  const { status, onMessage, subscribeDmThread } = useWebSocket();

  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | forbidden | error
  const [loadErrorKey, setLoadErrorKey] = useState(null);

  const [messageBody, setMessageBody] = useState('');
  const [sendErrorKey, setSendErrorKey] = useState(null);
  const [sending, setSending] = useState(false);
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

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = messageBody.trim();
    if (!trimmed) {
      setSendErrorKey('errors.dmThread.messageBodyRequired');
      return;
    }
    if (trimmed.length > CHAT_MESSAGE_BODY_MAX_LENGTH) {
      setSendErrorKey('errors.dmThread.messageBodyTooLong');
      return;
    }

    setSending(true);
    setSendErrorKey(null);
    try {
      const idToken = await user.getIdToken();
      const message = await createDmThreadMessage(idToken, threadId, { body: trimmed });
      if (!knownMessageIds.current.has(message.id)) {
        knownMessageIds.current.add(message.id);
        setMessages((prev) => (prev ? [...prev, message] : [message]));
      }
      setMessageBody('');
    } catch (err) {
      setSendErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setSending(false);
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

            {messages && messages.length === 0 && <p className={styles.hint}>{t('chat.dm.emptyThread')}</p>}

            {messages && messages.length > 0 && (
              <ul className={styles.messageList}>
                {messages.map((message) => (
                  <li
                    key={message.id}
                    className={`${styles.messageRow} ${message.senderId === user.uid ? styles.messageMine : ''}`}
                  >
                    <div className={styles.messageMeta}>
                      <span className={styles.messageAuthor}>{message.senderName}</span>
                      <span className={styles.messageTime}>{formatSessionTimestamp(message.createdAt, locale)}</span>
                    </div>
                    <p className={styles.messageBody}>{message.body}</p>
                  </li>
                ))}
              </ul>
            )}

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <label className={styles.srOnly} htmlFor="dm-message-body">
                {t('chat.dm.messagePlaceholder')}
              </label>
              <textarea
                id="dm-message-body"
                className={styles.textarea}
                value={messageBody}
                maxLength={CHAT_MESSAGE_BODY_MAX_LENGTH}
                placeholder={t('chat.dm.messagePlaceholder')}
                onChange={(event) => setMessageBody(event.target.value)}
              />
              {sendErrorKey && <span className={styles.fieldError}>{t(sendErrorKey)}</span>}
              <div className={styles.formActions}>
                <button type="submit" className={styles.submit} disabled={sending}>
                  {sending ? t('chat.dm.sending') : t('chat.dm.send')}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

export default DmThreadPage;
