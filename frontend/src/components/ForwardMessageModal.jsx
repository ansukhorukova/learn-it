import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useI18n } from '../i18n/I18nProvider';
import {
  createChatForward,
  listCompetencyCatalog,
  listMyCompetencyChats,
  listMyDmThreads,
} from '../api/client';
import styles from './ForwardMessageModal.module.css';

// US-036 — the "choose where to forward this message" modal. Opened only
// from a competency-chat message (the FE never renders a Forward control on
// a DM message — AC12), so `sourceMessage` is always a competency-chat row.
//
// Default list = "My chats" (my DM threads + my joined competency chats,
// the same combined set as the Messages screen, US-033). A separate
// "Find another competency chat…" search over the full active-competency
// catalog covers AC8's "any active competency chat, not just joined ones"
// — membership is never required for a forward destination (AC5, per
// US-031 AC4).
function ForwardMessageModal({ user, sourceMessage, onClose, onForwarded }) {
  const { t } = useI18n();

  const [dmThreads, setDmThreads] = useState([]);
  const [joinedChats, setJoinedChats] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | error

  const [selected, setSelected] = useState(null); // { type, id, label }
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState(null);

  const cancelRef = useRef(null);

  const competencyLabel = useCallback((slug) => (slug ? t(`competency.${slug}`) : ''), [t]);

  useEffect(() => {
    cancelRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const [{ threads }, { chats }, { competencies }] = await Promise.all([
          listMyDmThreads(idToken),
          listMyCompetencyChats(idToken),
          listCompetencyCatalog(idToken),
        ]);
        if (cancelled) return;
        setDmThreads(threads);
        setJoinedChats(chats.filter((c) => c.competencyActive !== false));
        setCatalog(competencies);
        setLoadState('ready');
      } catch {
        if (!cancelled) setLoadState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const joinedCompetencyIds = useMemo(
    () => new Set(joinedChats.map((c) => c.competencyId)),
    [joinedChats],
  );

  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    return catalog
      .filter((c) => !joinedCompetencyIds.has(c.id))
      .map((c) => ({ id: c.id, label: competencyLabel(c.slug) }))
      .filter((c) => !term || c.label.toLowerCase().includes(term))
      .slice(0, 25);
  }, [catalog, joinedCompetencyIds, search, competencyLabel]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selected || submitting) {
      if (!selected) setErrorKey('chat.forward.pickDestination');
      return;
    }
    setSubmitting(true);
    setErrorKey(null);
    try {
      const idToken = await user.getIdToken();
      const message = await createChatForward(idToken, {
        sourceMessageId: sourceMessage.id,
        destinationType: selected.type,
        destinationId: selected.id,
      });
      onForwarded(message, selected);
      onClose();
    } catch (err) {
      setErrorKey(err.messageKey || 'errors.generic');
      setSubmitting(false);
    }
  }

  function renderOption(option) {
    const isSelected =
      selected && selected.type === option.type && selected.id === option.id;
    return (
      <li key={`${option.type}:${option.id}`}>
        <label className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}>
          <input
            type="radio"
            name="forward-destination"
            checked={Boolean(isSelected)}
            onChange={() => {
              setErrorKey(null);
              setSelected(option);
            }}
          />
          <span>{option.label}</span>
        </label>
      </li>
    );
  }

  const dmOptions = dmThreads.map((thread) => ({
    type: 'dmThread',
    id: thread.id,
    label: t('chat.forward.dmOptionLabel', {
      name: thread.otherUser.name,
      competency: competencyLabel(thread.competencySlug),
    }),
  }));
  const joinedOptions = joinedChats.map((chat) => ({
    type: 'competencyChat',
    id: chat.competencyId,
    label: competencyLabel(chat.competencySlug),
  }));

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="forward-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="forward-modal-title" className={styles.title}>
          {t('chat.forward.modalTitle')}
        </h2>
        <p className={styles.hint}>{t('chat.forward.pickDestination')}</p>

        {loadState === 'loading' && <p className={styles.hint}>{t('board.overview.loading')}</p>}
        {loadState === 'error' && (
          <p className={styles.error} role="alert">
            {t('errors.generic')}
          </p>
        )}

        {loadState === 'ready' && (
          <form onSubmit={handleSubmit}>
            <fieldset className={styles.group}>
              <legend className={styles.groupLabel}>{t('chat.forward.myChatsHeading')}</legend>
              {dmOptions.length === 0 && joinedOptions.length === 0 && (
                <p className={styles.hint}>{t('chat.forward.noMyChats')}</p>
              )}
              <ul className={styles.optionList}>
                {dmOptions.map(renderOption)}
                {joinedOptions.map(renderOption)}
              </ul>
            </fieldset>

            {showSearch ? (
              <fieldset className={styles.group}>
                <legend className={styles.groupLabel}>{t('chat.forward.searchOtherChats')}</legend>
                <input
                  type="text"
                  className={styles.search}
                  value={search}
                  placeholder={t('chat.find.searchPlaceholder')}
                  onChange={(event) => setSearch(event.target.value)}
                />
                {searchResults.length === 0 ? (
                  <p className={styles.hint}>{t('chat.find.emptySearch')}</p>
                ) : (
                  <ul className={styles.optionList}>
                    {searchResults.map((c) => renderOption({ type: 'competencyChat', id: c.id, label: c.label }))}
                  </ul>
                )}
              </fieldset>
            ) : (
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => setShowSearch(true)}
              >
                {t('chat.forward.searchOtherChats')}
              </button>
            )}

            {errorKey && (
              <p className={styles.error} role="alert">
                {t(errorKey)}
              </p>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                ref={cancelRef}
                className={styles.cancel}
                onClick={onClose}
                disabled={submitting}
              >
                {t('chat.forward.cancel')}
              </button>
              <button type="submit" className={styles.confirm} disabled={submitting || !selected}>
                {submitting ? t('chat.forward.forwarding') : t('chat.forward.confirm')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForwardMessageModal;
