import { useCallback, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAuthUser } from '../auth/useAuthUser';
import { useI18n } from '../i18n/I18nProvider';
import { useHeadMeta } from '../lib/useHeadMeta';
import { getOrCreateDmThread, getPublicUserProfile } from '../api/client';
import AppHeader from '../components/AppHeader';
import styles from './UserProfilePage.module.css';

// /users/:id (US-026) — another user's public profile, with the "Написати
// повідомлення" entry point into a DM thread (US-027). Only competencies
// with a real `competencyId` (dictionary entries, `isCustom: false`) can
// ever back a DM thread — `dm_threads.competency_id` is a FK into
// `competencies`, so a free-text custom competency (competencyId null, same
// "not a real competencies row" rule as CLAUDE.md's user_competencies
// section) is never offered as a messaging context, even if
// `willingToTeach` is true for it.
function UserProfilePage() {
  const { user, loading: authLoading } = useAuthUser();
  const { t } = useI18n();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [loadState, setLoadState] = useState('loading'); // loading | ready | notFound | error
  const [loadErrorKey, setLoadErrorKey] = useState(null);
  const [profile, setProfile] = useState(null);

  const [pickedCompetencyId, setPickedCompetencyId] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createErrorKey, setCreateErrorKey] = useState(null);

  useHeadMeta({
    title: profile ? `${profile.name} — ${t('profile.public.title')}` : t('profile.public.title'),
    description: t('profile.public.competenciesTitle'),
  });

  const load = useCallback(async () => {
    if (!user) return;
    setLoadState('loading');
    setCreateErrorKey(null);
    try {
      const idToken = await user.getIdToken();
      const data = await getPublicUserProfile(idToken, id);
      setProfile(data);
      setLoadState('ready');
    } catch (err) {
      if (err.messageKey === 'errors.user.notFound') {
        setLoadState('notFound');
      } else {
        setLoadErrorKey(err.messageKey || 'errors.generic');
        setLoadState('error');
      }
    }
  }, [user, id]);

  useEffect(() => {
    load();
  }, [load]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const isOwnProfile = user.uid === id;
  // Only dictionary-backed (non-custom) willing-to-teach competencies can
  // seed a DM thread (see the header comment above).
  const messagingCompetencies = profile
    ? profile.competencies.filter((c) => c.willingToTeach && !c.isCustom && c.competencyId)
    : [];
  const contextCompetencyId = location.state && location.state.competencyId;

  async function startThread(competencyId) {
    setCreating(true);
    setCreateErrorKey(null);
    try {
      const idToken = await user.getIdToken();
      const thread = await getOrCreateDmThread(idToken, { targetUserId: id, competencyId });
      navigate(`/messages/${thread.id}`);
    } catch (err) {
      setCreateErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setCreating(false);
    }
  }

  function handleMessageClick() {
    // AC3: a competencyId carried over from People search (US-025 AC6) is
    // used immediately, no extra picker — but only if it's actually one of
    // this person's current willing-to-teach dictionary competencies (it
    // could theoretically have changed since the search results were
    // fetched).
    const contextIsValid =
      contextCompetencyId && messagingCompetencies.some((c) => c.competencyId === contextCompetencyId);
    if (contextIsValid) {
      startThread(contextCompetencyId);
      return;
    }
    // AC4: exactly one willing-to-teach competency — use it directly.
    if (messagingCompetencies.length === 1) {
      startThread(messagingCompetencies[0].competencyId);
      return;
    }
    // AC5: several — ask which one before creating the thread.
    setShowPicker(true);
  }

  function competencyLabel(competency) {
    return competency.isCustom ? competency.customLabel : t(`competency.${competency.competencySlug}`);
  }

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        {loadState === 'loading' && <p className={styles.hint}>{t('board.overview.loading')}</p>}

        {loadState === 'notFound' && (
          <div className={styles.emptyState}>
            <p>{t('profile.public.notFound')}</p>
          </div>
        )}

        {loadState === 'error' && (
          <p className={styles.error} role="alert">
            {t(loadErrorKey)}
          </p>
        )}

        {loadState === 'ready' && profile && (
          <>
            <h1>{profile.name}</h1>

            <section className={styles.section}>
              <h2>{t('profile.public.competenciesTitle')}</h2>
              {profile.competencies.length === 0 ? (
                <p className={styles.hint}>{t('profile.competencies.empty')}</p>
              ) : (
                <ul className={styles.competencyList}>
                  {profile.competencies.map((competency, index) => (
                    <li key={competency.competencyId || `custom-${index}`} className={styles.competencyRow}>
                      <span className={styles.competencyLabel}>{competencyLabel(competency)}</span>
                      {competency.willingToTeach && (
                        <span className={styles.teacherBadge}>{t('profile.public.willingToTeachBadge')}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {!isOwnProfile && (
              <section className={styles.section}>
                {messagingCompetencies.length === 0 ? (
                  <p className={styles.disabledHint}>{t('profile.public.messageButton.disabledNoCompetencies')}</p>
                ) : showPicker ? (
                  <div className={styles.pickerBlock}>
                    <label className={styles.label} htmlFor="dm-competency-picker">
                      {t('profile.public.pickCompetencyPrompt')}
                    </label>
                    <select
                      id="dm-competency-picker"
                      className={styles.input}
                      value={pickedCompetencyId}
                      onChange={(event) => setPickedCompetencyId(event.target.value)}
                    >
                      <option value="" disabled>
                        {t('profile.public.pickCompetencyPrompt')}
                      </option>
                      {messagingCompetencies.map((competency) => (
                        <option key={competency.competencyId} value={competency.competencyId}>
                          {competencyLabel(competency)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={styles.messageButton}
                      disabled={!pickedCompetencyId || creating}
                      onClick={() => startThread(pickedCompetencyId)}
                    >
                      {t('profile.public.messageButton.cta')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.messageButton}
                    disabled={creating}
                    onClick={handleMessageClick}
                  >
                    {t('profile.public.messageButton.cta')}
                  </button>
                )}
                {createErrorKey && (
                  <p className={styles.error} role="alert">
                    {t(createErrorKey)}
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default UserProfilePage;
