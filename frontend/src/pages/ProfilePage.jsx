import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { useAuthUser } from '../auth/useAuthUser';
import { useI18n } from '../i18n/I18nProvider';
import { useHeadMeta } from '../lib/useHeadMeta';
import {
  addUserCompetency,
  fetchProfile,
  listCompetencyCatalog,
  listUserCompetencies,
  removeUserCompetency,
  updateProfile,
  updateUserCompetency,
} from '../api/client';
import AppHeader from '../components/AppHeader';
import styles from './ProfilePage.module.css';

const PUBLIC_NAME_MAX_LENGTH = 100;
const CUSTOM_LABEL_MAX_LENGTH = 100;
const CUSTOM_OPTION_VALUE = '__custom__';

// /profile (AUTH-004..AUTH-007) — public name + competencies (dictionary and
// custom, each with its own per-competency "willing to teach" toggle). Same
// load/save shape as BoardsPage.jsx: page-level load state, per-form
// submitting/error state, messageKey-driven error rendering.
function ProfilePage() {
  const { user, loading: authLoading } = useAuthUser();
  const { t } = useI18n();

  useHeadMeta({ title: t('profile.title'), description: t('profile.publicName.hint') });

  const [loadState, setLoadState] = useState('loading'); // loading | ready | error
  const [loadErrorKey, setLoadErrorKey] = useState(null);

  const [profile, setProfile] = useState(null);
  const [publicNameInput, setPublicNameInput] = useState('');
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved
  const [saveErrorKey, setSaveErrorKey] = useState(null);

  const [catalog, setCatalog] = useState([]);
  const [competencies, setCompetencies] = useState([]);

  const [pickerValue, setPickerValue] = useState('');
  const [customLabelInput, setCustomLabelInput] = useState('');
  const [addErrorKey, setAddErrorKey] = useState(null);
  const [submittingAdd, setSubmittingAdd] = useState(false);

  const [busyId, setBusyId] = useState(null); // competency row currently being toggled/removed

  const load = useCallback(async () => {
    if (!user) return;
    setLoadState('loading');
    try {
      const idToken = await user.getIdToken();
      const [profileRow, catalogRes, competenciesRes] = await Promise.all([
        fetchProfile(idToken),
        listCompetencyCatalog(idToken),
        listUserCompetencies(idToken),
      ]);
      setProfile(profileRow);
      setPublicNameInput(profileRow.publicName || '');
      setCatalog(catalogRes.competencies);
      setCompetencies(competenciesRes.competencies);
      setLoadState('ready');
    } catch (err) {
      setLoadErrorKey(err.messageKey || 'errors.generic');
      setLoadState('error');
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  async function handleSavePublicName(event) {
    event.preventDefault();
    const trimmed = publicNameInput.trim();
    if (trimmed.length > PUBLIC_NAME_MAX_LENGTH) {
      setSaveErrorKey('errors.profile.publicNameTooLong');
      return;
    }

    setSaveState('saving');
    setSaveErrorKey(null);
    try {
      const idToken = await user.getIdToken();
      const updated = await updateProfile(idToken, { publicName: trimmed || null });
      setProfile(updated);
      setPublicNameInput(updated.publicName || '');
      setSaveState('saved');
      setTimeout(() => setSaveState((current) => (current === 'saved' ? 'idle' : current)), 2000);
    } catch (err) {
      setSaveErrorKey(err.messageKey || 'errors.generic');
      setSaveState('idle');
    }
  }

  function resetAddForm() {
    setPickerValue('');
    setCustomLabelInput('');
    setAddErrorKey(null);
  }

  async function handleAddCompetency(event) {
    event.preventDefault();
    if (!pickerValue) {
      setAddErrorKey('errors.competency.invalidPayload');
      return;
    }

    let payload;
    if (pickerValue === CUSTOM_OPTION_VALUE) {
      const trimmedLabel = customLabelInput.trim();
      if (!trimmedLabel) {
        setAddErrorKey('errors.competency.customLabelRequired');
        return;
      }
      if (trimmedLabel.length > CUSTOM_LABEL_MAX_LENGTH) {
        setAddErrorKey('errors.competency.customLabelTooLong');
        return;
      }
      payload = { customLabel: trimmedLabel };
    } else {
      payload = { competencyId: pickerValue };
    }

    setSubmittingAdd(true);
    setAddErrorKey(null);
    try {
      const idToken = await user.getIdToken();
      const created = await addUserCompetency(idToken, payload);
      setCompetencies((prev) => [...prev, created]);
      resetAddForm();
    } catch (err) {
      setAddErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setSubmittingAdd(false);
    }
  }

  async function handleToggleWillingToTeach(competency) {
    setBusyId(competency.id);
    try {
      const idToken = await user.getIdToken();
      const updated = await updateUserCompetency(idToken, competency.id, {
        willingToTeach: !competency.willingToTeach,
      });
      setCompetencies((prev) => prev.map((row) => (row.id === competency.id ? updated : row)));
    } catch (err) {
      setLoadErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveCompetency(competency) {
    setBusyId(competency.id);
    try {
      const idToken = await user.getIdToken();
      await removeUserCompetency(idToken, competency.id);
      setCompetencies((prev) => prev.filter((row) => row.id !== competency.id));
    } catch (err) {
      setLoadErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setBusyId(null);
    }
  }

  const willingCount = competencies.filter((c) => c.willingToTeach).length;
  const addedCompetencyIds = new Set(competencies.filter((c) => !c.isCustom).map((c) => c.competencyId));
  const availableCatalog = catalog.filter((entry) => !addedCompetencyIds.has(entry.id));

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <h1>{t('profile.title')}</h1>

        {loadState === 'loading' && <p className={styles.hint}>{t('board.overview.loading')}</p>}
        {loadState === 'error' && (
          <p className={styles.error} role="alert">
            {t(loadErrorKey)}
          </p>
        )}

        {loadState === 'ready' && profile && (
          <>
            <section className={styles.section}>
              <form className={styles.form} onSubmit={handleSavePublicName} noValidate>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="public-name">
                    {t('profile.publicName.label')}
                  </label>
                  <input
                    id="public-name"
                    className={styles.input}
                    value={publicNameInput}
                    maxLength={PUBLIC_NAME_MAX_LENGTH}
                    placeholder={t('profile.publicName.placeholder')}
                    onChange={(event) => setPublicNameInput(event.target.value)}
                    aria-invalid={Boolean(saveErrorKey)}
                  />
                  <span className={styles.hint}>{t('profile.publicName.hint')}</span>
                  {saveErrorKey && <span className={styles.fieldError}>{t(saveErrorKey)}</span>}
                </div>

                <div className={styles.field}>
                  <span className={styles.label}>{t('profile.displayName.readonlyLabel')}</span>
                  <input className={styles.input} value={profile.displayName} readOnly disabled />
                </div>

                <div className={styles.formActions}>
                  <button type="submit" className={styles.submit} disabled={saveState === 'saving'}>
                    {saveState === 'saving'
                      ? t('profile.save.saving')
                      : saveState === 'saved'
                        ? t('profile.save.saved')
                        : t('profile.save.cta')}
                  </button>
                </div>
              </form>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeaderRow}>
                <h2>{t('profile.competencies.title')}</h2>
                <span className={styles.countBadge}>
                  {t('profile.competencies.count', { count: competencies.length })}
                </span>
              </div>

              {competencies.length > 0 && (
                <p className={styles.summary}>
                  {t('profile.competencies.willingToTeach.summary', {
                    count: willingCount,
                    total: competencies.length,
                  })}
                </p>
              )}

              {competencies.length === 0 ? (
                <p className={styles.hint}>{t('profile.competencies.empty')}</p>
              ) : (
                <ul className={styles.competencyList}>
                  {competencies.map((competency) => (
                    <li key={competency.id} className={styles.competencyRow}>
                      <div className={styles.competencyLabelGroup}>
                        <span className={styles.competencyLabel}>
                          {competency.isCustom ? competency.customLabel : t(`competency.${competency.competencySlug}`)}
                        </span>
                        {competency.willingToTeach && (
                          <span className={styles.teacherBadge}>{t('profile.competencies.willingToTeach.badge')}</span>
                        )}
                      </div>
                      <div className={styles.competencyActions}>
                        {/* US-028 AC2's "чи довідника компетенцій" entry point — a
                            custom (isCustom) entry has no real `competencies`
                            row/competencyId (CLAUDE.md user_competencies note),
                            so there is no group chat room to link to for it. */}
                        {!competency.isCustom && (
                          <Link to={`/competencies/${competency.competencyId}/chat`} className={styles.iconButton}>
                            {t('chat.competency.openCta')}
                          </Link>
                        )}
                        <label className={styles.toggleLabel}>
                          <input
                            type="checkbox"
                            checked={competency.willingToTeach}
                            disabled={busyId === competency.id}
                            onChange={() => handleToggleWillingToTeach(competency)}
                          />
                          {t('profile.competencies.willingToTeach.label')}
                        </label>
                        <button
                          type="button"
                          className={styles.iconButtonDanger}
                          disabled={busyId === competency.id}
                          onClick={() => handleRemoveCompetency(competency)}
                        >
                          {t('profile.competencies.removeCta')}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <form className={styles.addForm} onSubmit={handleAddCompetency} noValidate>
                <div className={styles.field}>
                  <label className={styles.srOnly} htmlFor="competency-picker">
                    {t('profile.competencies.picker.placeholder')}
                  </label>
                  <select
                    id="competency-picker"
                    className={styles.input}
                    value={pickerValue}
                    onChange={(event) => setPickerValue(event.target.value)}
                  >
                    <option value="" disabled>
                      {t('profile.competencies.picker.placeholder')}
                    </option>
                    {availableCatalog.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {t(`competency.${entry.slug}`)}
                      </option>
                    ))}
                    <option value={CUSTOM_OPTION_VALUE}>{t('profile.competencies.picker.customOption')}</option>
                  </select>
                </div>

                {pickerValue === CUSTOM_OPTION_VALUE && (
                  <div className={styles.field}>
                    <label className={styles.srOnly} htmlFor="competency-custom-label">
                      {t('profile.competencies.custom.inputPlaceholder')}
                    </label>
                    <input
                      id="competency-custom-label"
                      className={styles.input}
                      value={customLabelInput}
                      maxLength={CUSTOM_LABEL_MAX_LENGTH}
                      placeholder={t('profile.competencies.custom.inputPlaceholder')}
                      onChange={(event) => setCustomLabelInput(event.target.value)}
                    />
                  </div>
                )}

                {addErrorKey && <span className={styles.fieldError}>{t(addErrorKey)}</span>}

                <div className={styles.formActions}>
                  <button type="submit" className={styles.submit} disabled={submittingAdd}>
                    {t('profile.competencies.addCta')}
                  </button>
                </div>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default ProfilePage;
