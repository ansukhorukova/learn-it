import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { useAuthUser } from '../auth/useAuthUser';
import { useI18n } from '../i18n/I18nProvider';
import { useHeadMeta } from '../lib/useHeadMeta';
import { listCompetencyCatalog, searchUsersByCompetency } from '../api/client';
import AppHeader from '../components/AppHeader';
import styles from './PeopleSearchPage.module.css';

// /people (US-025) — find people willing to teach a chosen competency.
// Same load/error-state shape as ProfilePage.jsx/BoardsPage.jsx: page-level
// load state for the catalog, a separate one for the search results so a
// catalog hiccup never blocks rendering an already-fetched result list.
function PeopleSearchPage() {
  const { user, loading: authLoading } = useAuthUser();
  const { t } = useI18n();
  const navigate = useNavigate();

  useHeadMeta({ title: t('people.search.title'), description: t('people.search.emptyNoSelection') });

  const [catalog, setCatalog] = useState([]);
  const [catalogLoadErrorKey, setCatalogLoadErrorKey] = useState(null);

  const [competencyId, setCompetencyId] = useState('');
  const [results, setResults] = useState(null); // null = no selection yet (AC2)
  const [searchState, setSearchState] = useState('idle'); // idle | loading | ready | error
  const [searchErrorKey, setSearchErrorKey] = useState(null);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const { competencies } = await listCompetencyCatalog(idToken);
        if (!cancelled) setCatalog(competencies);
      } catch (err) {
        if (!cancelled) setCatalogLoadErrorKey(err.messageKey || 'errors.generic');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const runSearch = useCallback(
    async (selectedCompetencyId) => {
      if (!user || !selectedCompetencyId) return;
      setSearchState('loading');
      setSearchErrorKey(null);
      try {
        const idToken = await user.getIdToken();
        const { users } = await searchUsersByCompetency(idToken, selectedCompetencyId);
        setResults(users);
        setSearchState('ready');
      } catch (err) {
        setSearchErrorKey(err.messageKey || 'errors.generic');
        setSearchState('error');
      }
    },
    [user],
  );

  useEffect(() => {
    if (!competencyId) {
      setResults(null);
      setSearchState('idle');
      return;
    }
    runSearch(competencyId);
  }, [competencyId, runSearch]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  function competencyLabel(competency) {
    return competency.isCustom ? competency.customLabel : t(`competency.${competency.competencySlug}`);
  }

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <h1>{t('people.search.title')}</h1>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="people-search-competency">
            {t('people.search.competencyLabel')}
          </label>
          <select
            id="people-search-competency"
            className={styles.input}
            value={competencyId}
            onChange={(event) => setCompetencyId(event.target.value)}
          >
            <option value="">{t('people.search.competencyPlaceholder')}</option>
            {catalog.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {t(`competency.${entry.slug}`)}
              </option>
            ))}
          </select>
          {catalogLoadErrorKey && (
            <span className={styles.fieldError}>{t(catalogLoadErrorKey)}</span>
          )}
        </div>

        {competencyId && (
          <p className={styles.hint}>
            <Link to={`/competencies/${competencyId}/chat`} className={styles.chatLink}>
              {t('chat.competency.openCta')}
            </Link>
          </p>
        )}

        {!competencyId && <p className={styles.hint}>{t('people.search.emptyNoSelection')}</p>}

        {competencyId && searchState === 'loading' && (
          <p className={styles.hint}>{t('board.overview.loading')}</p>
        )}

        {competencyId && searchState === 'error' && (
          <p className={styles.error} role="alert">
            {t(searchErrorKey)}
          </p>
        )}

        {competencyId && searchState === 'ready' && results && results.length === 0 && (
          <p className={styles.hint}>{t('people.search.emptyNoResults')}</p>
        )}

        {competencyId && searchState === 'ready' && results && results.length > 0 && (
          <>
            <p className={styles.resultsCount}>{t('people.search.resultsCount', { count: results.length })}</p>
            <div className={styles.grid}>
              {results.map((person) => (
                <div key={person.id} className={styles.card}>
                  <h2 className={styles.cardTitle}>{person.name}</h2>
                  <span className={styles.badgeSectionLabel}>{t('people.search.willingToTeachBadge')}</span>
                  <div className={styles.badgeRow}>
                    {person.competencies.map((competency, index) => (
                      <span key={competency.competencyId || `${person.id}-custom-${index}`} className={styles.badge}>
                        {competencyLabel(competency)}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={styles.viewButton}
                    onClick={() => navigate(`/users/${person.id}`, { state: { competencyId } })}
                  >
                    {t('people.search.viewProfile')}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default PeopleSearchPage;
