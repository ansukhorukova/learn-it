import { useRef, useState } from 'react';

import { useI18n } from '../i18n/I18nProvider';
import { formatSessionTimestamp } from '../lib/duration';
import { replyExcerpt } from '../lib/chatExcerpt';
import { CHAT_MESSAGE_BODY_MAX_LENGTH } from '../constants/chatMessageLimits';
import styles from './ChatConversation.module.css';

// Shared message list + composer for both chat surfaces — the DM thread
// (US-027) and the competency room (US-028). US-035 adds quote-replies
// (a flat `replyTo` pointer, rendered as a click-to-scroll quote block and
// a preview above the composer); US-036 adds the "Forward" control, passed
// in via `onForward` — DM threads pass `null` for it, so a Forward button
// never appears on a DM message (US-036 AC12).
function ChatConversation({
  messages,
  currentUserId,
  emptyLabel,
  placeholder,
  sendLabel,
  sendingLabel,
  bodyRequiredKey,
  bodyTooLongKey,
  onSend,
  onForward,
}) {
  const { t, locale } = useI18n();

  const [body, setBody] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [errorKey, setErrorKey] = useState(null);
  const [sending, setSending] = useState(false);
  const [highlightId, setHighlightId] = useState(null);

  const itemRefs = useRef(new Map());

  function scrollToOriginal(id) {
    const node = itemRefs.current.get(id);
    // US-035 AC8 — the original may be outside the loaded window (unlikely
    // without pagination, but possible later); a missing node is a no-op,
    // never an extra round trip.
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightId(id);
    window.setTimeout(() => setHighlightId((cur) => (cur === id ? null : cur)), 1600);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
      setErrorKey(bodyRequiredKey);
      return;
    }
    if (trimmed.length > CHAT_MESSAGE_BODY_MAX_LENGTH) {
      setErrorKey(bodyTooLongKey);
      return;
    }

    setSending(true);
    setErrorKey(null);
    try {
      await onSend(trimmed, replyTarget ? replyTarget.id : undefined);
      setBody('');
      setReplyTarget(null);
    } catch (err) {
      setErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {messages && messages.length === 0 && <p className={styles.hint}>{emptyLabel}</p>}

      {messages && messages.length > 0 && (
        <ul className={styles.messageList}>
          {messages.map((message) => {
            const mine = message.senderId === currentUserId;
            return (
              <li
                key={message.id}
                ref={(node) => {
                  if (node) itemRefs.current.set(message.id, node);
                  else itemRefs.current.delete(message.id);
                }}
                className={`${styles.messageRow} ${mine ? styles.messageMine : ''} ${
                  highlightId === message.id ? styles.messageHighlight : ''
                }`}
              >
                {message.forwardedFrom && (
                  <p className={styles.forwardAttribution}>
                    {t('chat.forward.attribution', {
                      competency: message.forwardedFrom.competencySlug
                        ? t(`competency.${message.forwardedFrom.competencySlug}`)
                        : '',
                    })}
                  </p>
                )}

                {message.replyTo && (
                  <button
                    type="button"
                    className={styles.quote}
                    onClick={() => scrollToOriginal(message.replyTo.id)}
                  >
                    <span className={styles.quoteAuthor}>
                      {t('chat.message.inReplyTo', { name: message.replyTo.authorName })}
                    </span>
                    <span className={styles.quoteExcerpt}>{message.replyTo.excerpt}</span>
                  </button>
                )}

                <div className={styles.messageMeta}>
                  <span className={styles.messageAuthor}>{message.senderName}</span>
                  <span className={styles.messageTime}>
                    {formatSessionTimestamp(message.createdAt, locale)}
                  </span>
                </div>
                <p className={styles.messageBody}>{message.body}</p>

                <div className={styles.messageActions}>
                  <button
                    type="button"
                    className={styles.messageActionButton}
                    onClick={() => {
                      setErrorKey(null);
                      setReplyTarget(message);
                    }}
                  >
                    {t('chat.message.reply')}
                  </button>
                  {onForward && (
                    <button
                      type="button"
                      className={styles.messageActionButton}
                      onClick={() => onForward(message)}
                    >
                      {t('chat.message.forward')}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {replyTarget && (
          <div className={styles.replyPreview}>
            <span>
              {t('chat.message.replyPreview', {
                name: replyTarget.senderName,
                excerpt: replyExcerpt(replyTarget.body),
              })}
            </span>
            <button
              type="button"
              className={styles.replyPreviewCancel}
              onClick={() => setReplyTarget(null)}
            >
              {t('chat.message.cancelReply')}
            </button>
          </div>
        )}
        <label className={styles.srOnly} htmlFor="chat-conversation-body">
          {placeholder}
        </label>
        <textarea
          id="chat-conversation-body"
          className={styles.textarea}
          value={body}
          maxLength={CHAT_MESSAGE_BODY_MAX_LENGTH}
          placeholder={placeholder}
          onChange={(event) => setBody(event.target.value)}
        />
        {errorKey && <span className={styles.fieldError}>{t(errorKey)}</span>}
        <div className={styles.formActions}>
          <button type="submit" className={styles.submit} disabled={sending}>
            {sending ? sendingLabel : sendLabel}
          </button>
        </div>
      </form>
    </>
  );
}

export default ChatConversation;
