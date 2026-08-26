import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { useAuthUser } from '../auth/useAuthUser';
import { useI18n } from '../i18n/I18nProvider';
import { useHeadMeta } from '../lib/useHeadMeta';
import {
  joinCompetencyChat,
  leaveCompetencyChat,
  listCompetencyCatalog,
  listMyCompetencyChats,
} from '../api/client';
import AppHeader from '../components/AppHeader';
import styles from './FindChatsPage.module.css';

// /chats/find (US-032) — the full active-competency directory (same
// endpoint/render pattern as AUTH-005/US-021/US-025), each row showing its
// join state (merged in from GET /competency-chats/mine, US-031 AC5) and a
// client-side substring filter over the current locale's label — no
// pagination, same MVP approach as the directory-backed pickers elsewhere.
function FindChatsPage() {
  const { user, loading: authLoading } = useAuthUser();
  const { t } = useI18n();

  useHeadMeta({ title: t('chat.find.title'), description: t('chat.find.searchPlaceholder') });

  const [catalog, setCatalog] = useState(null);
  const [joinedIds, setJoinedIds] = useState(new Set());
  const [loadState, setLoadState] = useState('loading'); // loading | ready | error
  const [loadErrorKey, setLoadErrorKey] = useState(null);
  const [search, setSearch] = useState('');
  const [busyIds, setBusyIds] = useState(new Set());
  const [rowErrorKey, setRowErrorKey] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoadState('loading');
    setLoadErrorKey(null);
    try {
      const idToken = await user.getIdToken();
      const [{ competencies }, { chats }] = await Promise.all([
        listCompetencyCatalog(idToken),
        listMyCompetencyChats(idToken),
      ]);
      setCatalog(competencies);
      setJoinedIds(new Set(chats.map((chat) => chat.competencyId)));
      setLoadState('ready');
    } catch (err) {
      setLoadErrorKey(err.messageKey || 'errors.generic');
      setLoadState('error');
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!catalog) return [];
    const needle = search.trim().toLowerCase();
    if (!needle) return catalog;
    return catalog.filter((entry) => t(`competency.${entry.slug}`).toLowerCase().includes(needle));
  }, [catalog, search, t]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  async function handleToggleMembership(competencyId, wasJoined) {
    setBusyIds((prev) => new Set(prev).add(competencyId));
    setRowErrorKey(null);
    // Optimistic UI (US-032 AC3/AC4) — flip immediately, roll back only on failure.
    setJoinedIds((prev) => {
      const next = new Set(prev);
      if (wasJoined) next.delete(competencyId);
      else next.add(competencyId);
      return next;
    });
    try {
      const idToken = await user.getIdToken();
      if (wasJoined) {
        await leaveCompetencyChat(idToken, competencyId);
      } else {
        await joinCompetencyChat(idToken, competencyId);
      }
    } catch (err) {
      setJoinedIds((prev) => {
        const next = new Set(prev);
        if (wasJoined) next.add(competencyId);
        else next.delete(competencyId);
        return next;
      });
      setRowErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(competencyId);
        return next;
      });
    }
  }

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <h1>{t('chat.find.title')}</h1>

        <input
          type="search"
          className={styles.searchInput}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('chat.find.searchPlaceholder')}
          aria-label={t('chat.find.searchPlaceholder')}
        />

        {loadState === 'loading' && <p className={styles.hint}>{t('board.overview.loading')}</p>}
        {loadState === 'error' && (
          <p className={styles.error} role="alert">
            {t(loadErrorKey)}
          </p>
        )}
        {rowErrorKey && (
          <p className={styles.error} role="alert">
            {t(rowErrorKey)}
          </p>
        )}

        {loadState === 'ready' && catalog.length === 0 && <p className={styles.hint}>{t('chat.find.emptyDirectory')}</p>}

        {loadState === 'ready' && catalog.length > 0 && filtered.length === 0 && (
          <p className={styles.hint}>{t('chat.find.emptySearch')}</p>
        )}

        {loadState === 'ready' && filtered.length > 0 && (
          <ul className={styles.list}>
            {filtered.map((entry) => {
              const isJoined = joinedIds.has(entry.id);
              const isBusy = busyIds.has(entry.id);
              return (
                <li key={entry.id} className={styles.row}>
                  <Link
                    to={`/competencies/${entry.id}/chat`}
                    className={styles.rowNameLink}
                    aria-label={`${t(`competency.${entry.slug}`)} — ${t('chat.find.openChat')}`}
                  >
                    <span className={styles.rowName}>{t(`competency.${entry.slug}`)}</span>
                    <span className={styles.rowOpenHint} aria-hidden="true">
                      {t('chat.find.openChat')}
                    </span>
                  </Link>
                  <div className={styles.rowActions}>
                    {isJoined && <span className={styles.joinedBadge}>{t('chat.competency.joined')}</span>}
                    <button
                      type="button"
                      className={isJoined ? styles.leaveButton : styles.joinButton}
                      onClick={() => handleToggleMembership(entry.id, isJoined)}
                      disabled={isBusy}
                    >
                      {isJoined ? t('chat.competency.leave') : t('chat.competency.join')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

export default FindChatsPage;
