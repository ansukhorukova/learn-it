import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { useAuthUser } from '../auth/useAuthUser';
import { useI18n } from '../i18n/I18nProvider';
import { useHeadMeta } from '../lib/useHeadMeta';
import { useWebSocket } from '../hooks/useWebSocket';
import { createCompetencyChatMessage, listCompetencyCatalog, listCompetencyChatMessages } from '../api/client';
import { formatSessionTimestamp } from '../lib/duration';
import { CHAT_MESSAGE_BODY_MAX_LENGTH } from '../constants/chatMessageLimits';
import AppHeader from '../components/AppHeader';
import styles from './CompetencyChatPage.module.css';

// /competencies/:id/chat (US-028) — the one shared discussion room for a
// competency, identified directly by its id (no separate "rooms" resource,
// decision #3 in USER_STORIES.md's US-025…029 origin notes). Open to any
// authenticated user regardless of whether this competency is in their own
// profile (decision #4) — no membership gate at all, unlike every other
// resource in this app.
function CompetencyChatPage() {
  const { user, loading: authLoading } = useAuthUser();
  const { t, locale } = useI18n();
  const { id: competencyId } = useParams();
  const { status, onMessage, subscribeCompetencyChat } = useWebSocket();

  const [competencySlug, setCompetencySlug] = useState(null);
  const [messages, setMessages] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | notFound | error
  const [loadErrorKey, setLoadErrorKey] = useState(null);

  const [messageBody, setMessageBody] = useState('');
  const [sendErrorKey, setSendErrorKey] = useState(null);
  const [sending, setSending] = useState(false);
  const [wsErrorKey, setWsErrorKey] = useState(null);

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
      const [{ messages: rows }, { competencies }] = await Promise.all([
        listCompetencyChatMessages(idToken, competencyId),
        // Best-effort — used only to render the room's name; a catalog
        // hiccup never blocks the chat itself (same non-blocking pattern as
        // BoardsPage.jsx's category/language dictionary fetch).
        listCompetencyCatalog(idToken).catch(() => ({ competencies: [] })),
      ]);
      knownMessageIds.current = new Set(rows.map((m) => m.id));
      setMessages(rows);
      const entry = competencies.find((c) => c.id === competencyId);
      setCompetencySlug(entry ? entry.slug : null);
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

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = messageBody.trim();
    if (!trimmed) {
      setSendErrorKey('errors.competencyChat.messageBodyRequired');
      return;
    }
    if (trimmed.length > CHAT_MESSAGE_BODY_MAX_LENGTH) {
      setSendErrorKey('errors.competencyChat.messageBodyTooLong');
      return;
    }

    setSending(true);
    setSendErrorKey(null);
    try {
      const idToken = await user.getIdToken();
      const message = await createCompetencyChatMessage(idToken, competencyId, { body: trimmed });
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
            </div>

            {wsErrorKey && (
              <p className={styles.error} role="alert">
                {t(wsErrorKey)}
              </p>
            )}

            {messages && messages.length === 0 && <p className={styles.hint}>{t('chat.competency.empty')}</p>}

            {messages && messages.length > 0 && (
              <ul className={styles.messageList}>
                {messages.map((message) => (
                  <li key={message.id} className={styles.messageRow}>
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
              <label className={styles.srOnly} htmlFor="competency-chat-body">
                {t('chat.competency.messagePlaceholder')}
              </label>
              <textarea
                id="competency-chat-body"
                className={styles.textarea}
                value={messageBody}
                maxLength={CHAT_MESSAGE_BODY_MAX_LENGTH}
                placeholder={t('chat.competency.messagePlaceholder')}
                onChange={(event) => setMessageBody(event.target.value)}
              />
              {sendErrorKey && <span className={styles.fieldError}>{t(sendErrorKey)}</span>}
              <div className={styles.formActions}>
                <button type="submit" className={styles.submit} disabled={sending}>
                  {sending ? t('chat.competency.sending') : t('chat.competency.send')}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

export default CompetencyChatPage;
