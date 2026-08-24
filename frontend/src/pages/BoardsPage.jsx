import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { useAuthUser } from '../auth/useAuthUser';
import { useI18n } from '../i18n/I18nProvider';
import { useHeadMeta } from '../lib/useHeadMeta';
import { formatDuration } from '../lib/duration';
import {
  createBoard,
  deleteBoard,
  listBoards,
  listCompetencyCatalog,
  listLanguagesCatalog,
  listPublicBoards,
  updateBoard,
} from '../api/client';
import { BOARD_ACCENTS, DEFAULT_BOARD_ACCENT } from '../constants/boardAccents';
import AppHeader from '../components/AppHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import styles from './BoardsPage.module.css';

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 2000;

function toggleId(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

// Board category/language badges (US-021 AC7-8, US-023 AC6-7): a category
// badge only renders when both the board carries a categoryId AND that id
// still resolves against the (active-only) competencies catalog — see the
// Board schema's note in openapi.yaml on why the FE, not the BE, does this
// match. Language badges need no catalog lookup — `board.languages` already
// carries {id, slug} pairs directly.
function BoardBadges({ board, categoryCatalog, t, className }) {
  const categoryEntry = board.categoryId ? categoryCatalog.find((entry) => entry.id === board.categoryId) : null;
  const languages = board.languages || [];
  if (!categoryEntry && languages.length === 0) return null;

  return (
    <div className={className}>
      {categoryEntry && <span className={styles.badge}>{t(`competency.${categoryEntry.slug}`)}</span>}
      {languages.map((lang) => (
        <span key={lang.id} className={styles.badge}>
          {t(`language.${lang.slug}`)}
        </span>
      ))}
    </div>
  );
}

// Shared by both sections' filter panels (US-024 AC3-4): "Мої дошки" gets
// only the category control, "Public Boards" gets category + language.
// Filtering always re-fetches from the relevant endpoint via query params —
// never a client-side filter of an already-loaded list (US-024 AC5).
function CategoryFilter({ value, onChange, categoryCatalog, t, idPrefix }) {
  return (
    <div className={styles.filterField}>
      <label className={styles.label} htmlFor={`${idPrefix}-category-filter`}>
        {t('board.filters.category.label')}
      </label>
      <select
        id={`${idPrefix}-category-filter`}
        className={styles.input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{t('board.filters.category.all')}</option>
        {categoryCatalog.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {t(`competency.${entry.slug}`)}
          </option>
        ))}
      </select>
    </div>
  );
}

// Boards overview (`/`, US1, restructured by US-024). Two independent
// sections: "Мої дошки" (owner-only boards from GET /boards, unchanged
// semantics) and "Public Boards" (GET /boards/public, US-022/US-024) — each
// with its own filter panel and its own load/error/empty state, so a filter
// change or a load failure in one never touches the other.
function BoardsPage() {
  const { user, loading: authLoading } = useAuthUser();
  const { t } = useI18n();

  useHeadMeta({ title: t('board.overview.title'), description: t('board.overview.description') });

  // --- Shared dictionaries (US-021/US-023): fetched once, used by both
  // sections' filters/pickers and by badge rendering on every card. ---
  const [categoryCatalog, setCategoryCatalog] = useState([]);
  const [languageCatalog, setLanguageCatalog] = useState([]);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const [catalogRes, languagesRes] = await Promise.all([
          listCompetencyCatalog(idToken),
          listLanguagesCatalog(idToken),
        ]);
        if (!cancelled) {
          setCategoryCatalog(catalogRes.competencies);
          setLanguageCatalog(languagesRes.languages);
        }
      } catch {
        // The category/language dictionaries only power filters/badges —
        // never block the boards lists themselves on a catalog fetch error.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // --- "Мої дошки" section ---
  const [boards, setBoards] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | error
  const [loadErrorKey, setLoadErrorKey] = useState(null);
  const [myCategoryFilter, setMyCategoryFilter] = useState('');

  const loadBoards = useCallback(async () => {
    if (!user) return;
    setLoadState('loading');
    try {
      const idToken = await user.getIdToken();
      const { boards: rows } = await listBoards(idToken, { categoryId: myCategoryFilter || undefined });
      setBoards(rows);
      setLoadState('ready');
    } catch (err) {
      setLoadErrorKey(err.messageKey || 'errors.generic');
      setLoadState('error');
    }
  }, [user, myCategoryFilter]);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  // --- "Public Boards" section (US-024) ---
  const [publicBoards, setPublicBoards] = useState([]);
  const [publicLoadState, setPublicLoadState] = useState('loading');
  const [publicLoadErrorKey, setPublicLoadErrorKey] = useState(null);
  const [publicCategoryFilter, setPublicCategoryFilter] = useState('');
  const [publicLanguageFilter, setPublicLanguageFilter] = useState([]);

  const loadPublicBoards = useCallback(async () => {
    if (!user) return;
    setPublicLoadState('loading');
    try {
      const idToken = await user.getIdToken();
      const { boards: rows } = await listPublicBoards(idToken, {
        categoryId: publicCategoryFilter || undefined,
        languageIds: publicLanguageFilter,
      });
      setPublicBoards(rows);
      setPublicLoadState('ready');
    } catch (err) {
      setPublicLoadErrorKey(err.messageKey || 'errors.generic');
      setPublicLoadState('error');
    }
  }, [user, publicCategoryFilter, publicLanguageFilter]);

  useEffect(() => {
    loadPublicBoards();
  }, [loadPublicBoards]);

  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAccent, setNewAccent] = useState(DEFAULT_BOARD_ACCENT);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newLanguageIds, setNewLanguageIds] = useState([]);
  const [createErrorKey, setCreateErrorKey] = useState(null);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameDescriptionValue, setRenameDescriptionValue] = useState('');
  const [renameCategoryId, setRenameCategoryId] = useState('');
  const [renameLanguageIds, setRenameLanguageIds] = useState([]);
  const [renameVisibility, setRenameVisibility] = useState('private');
  const [renameErrorKey, setRenameErrorKey] = useState(null);
  const [savingRename, setSavingRename] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  function resetCreateForm() {
    setCreating(false);
    setNewTitle('');
    setNewDescription('');
    setNewAccent(DEFAULT_BOARD_ACCENT);
    setNewCategoryId('');
    setNewLanguageIds([]);
    setCreateErrorKey(null);
  }

  async function handleCreateSubmit(event) {
    event.preventDefault();
    const trimmed = newTitle.trim();
    const trimmedDescription = newDescription.trim();
    if (!trimmed) {
      setCreateErrorKey('board.create.validation.titleRequired');
      return;
    }
    if (trimmed.length > TITLE_MAX_LENGTH) {
      setCreateErrorKey('board.create.validation.titleTooLong');
      return;
    }
    if (trimmedDescription.length > DESCRIPTION_MAX_LENGTH) {
      setCreateErrorKey('board.create.validation.descriptionTooLong');
      return;
    }

    setSubmittingCreate(true);
    setCreateErrorKey(null);
    try {
      const idToken = await user.getIdToken();
      const board = await createBoard(idToken, {
        title: trimmed,
        description: trimmedDescription || undefined,
        accent: newAccent,
        categoryId: newCategoryId || null,
        languageIds: newLanguageIds,
      });
      setBoards((prev) => [...prev, board]);
      resetCreateForm();
    } catch (err) {
      setCreateErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setSubmittingCreate(false);
    }
  }

  function startRename(board) {
    setRenamingId(board.id);
    setRenameValue(board.title);
    setRenameDescriptionValue(board.description || '');
    setRenameCategoryId(board.categoryId || '');
    setRenameLanguageIds((board.languages || []).map((lang) => lang.id));
    setRenameVisibility(board.visibility || 'private');
    setRenameErrorKey(null);
  }

  async function submitRename(event, boardId) {
    event.preventDefault();
    const trimmed = renameValue.trim();
    const trimmedDescription = renameDescriptionValue.trim();
    if (!trimmed) {
      setRenameErrorKey('board.rename.validation.titleRequired');
      return;
    }
    if (trimmed.length > TITLE_MAX_LENGTH) {
      setRenameErrorKey('board.rename.validation.titleTooLong');
      return;
    }
    if (trimmedDescription.length > DESCRIPTION_MAX_LENGTH) {
      setRenameErrorKey('board.rename.validation.descriptionTooLong');
      return;
    }

    setSavingRename(true);
    try {
      const idToken = await user.getIdToken();
      const updated = await updateBoard(idToken, boardId, {
        title: trimmed,
        description: trimmedDescription || null,
        categoryId: renameCategoryId || null,
        languageIds: renameLanguageIds,
        visibility: renameVisibility,
      });
      setBoards((prev) => prev.map((board) => (board.id === boardId ? updated : board)));
      setRenamingId(null);
    } catch (err) {
      setRenameErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setSavingRename(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const idToken = await user.getIdToken();
      await deleteBoard(idToken, deleteTarget.id);
      setBoards((prev) => prev.filter((board) => board.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setLoadErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setDeleting(false);
    }
  }

  const myFiltersActive = Boolean(myCategoryFilter);
  const publicFiltersActive = Boolean(publicCategoryFilter) || publicLanguageFilter.length > 0;

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.headerRow}>
          <h1>{t('board.overview.heading')}</h1>
          <button type="button" className={styles.createButton} onClick={() => setCreating((v) => !v)}>
            {t('board.create.cta')}
          </button>
        </div>

        {creating && (
          <form className={styles.createForm} onSubmit={handleCreateSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="new-board-title">
                {t('board.create.titleLabel')}
              </label>
              <input
                id="new-board-title"
                className={styles.input}
                value={newTitle}
                maxLength={TITLE_MAX_LENGTH}
                onChange={(event) => setNewTitle(event.target.value)}
                aria-invalid={Boolean(createErrorKey)}
                autoFocus
              />
              {createErrorKey && <span className={styles.fieldError}>{t(createErrorKey)}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="new-board-description">
                {t('board.create.descriptionLabel')}
              </label>
              <textarea
                id="new-board-description"
                className={`${styles.input} ${styles.textarea}`}
                value={newDescription}
                maxLength={DESCRIPTION_MAX_LENGTH}
                placeholder={t('board.create.descriptionPlaceholder')}
                onChange={(event) => setNewDescription(event.target.value)}
              />
            </div>

            <div className={styles.field}>
              <span className={styles.label}>{t('board.create.accentLabel')}</span>
              <div className={styles.swatchRow} role="radiogroup" aria-label={t('board.create.accentLabel')}>
                {BOARD_ACCENTS.map((accent) => (
                  <button
                    key={accent}
                    type="button"
                    role="radio"
                    aria-checked={newAccent === accent}
                    aria-label={t(`board.accent.${accent}`)}
                    className={`${styles.swatch} ${styles[`swatch_${accent}`]} ${
                      newAccent === accent ? styles.swatchSelected : ''
                    }`}
                    onClick={() => setNewAccent(accent)}
                  />
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="new-board-category">
                {t('board.form.category.label')}
              </label>
              <select
                id="new-board-category"
                className={styles.input}
                value={newCategoryId}
                onChange={(event) => setNewCategoryId(event.target.value)}
              >
                <option value="">{t('board.form.category.placeholder')}</option>
                {categoryCatalog.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {t(`competency.${entry.slug}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>{t('board.form.languages.label')}</span>
              <div className={styles.checkboxGroup} role="group" aria-label={t('board.form.languages.label')}>
                {languageCatalog.length === 0 && (
                  <span className={styles.hint}>{t('board.form.languages.placeholder')}</span>
                )}
                {languageCatalog.map((entry) => (
                  <label key={entry.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={newLanguageIds.includes(entry.id)}
                      onChange={() => setNewLanguageIds((prev) => toggleId(prev, entry.id))}
                    />
                    {t(`language.${entry.slug}`)}
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.submit} disabled={submittingCreate}>
                {submittingCreate ? t('board.create.saving') : t('board.create.submit')}
              </button>
              <button type="button" className={styles.cancel} onClick={resetCreateForm}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        )}

        <div className={styles.filtersRow}>
          <CategoryFilter
            idPrefix="my-boards"
            value={myCategoryFilter}
            onChange={setMyCategoryFilter}
            categoryCatalog={categoryCatalog}
            t={t}
          />
          {myFiltersActive && (
            <button type="button" className={styles.clearFiltersButton} onClick={() => setMyCategoryFilter('')}>
              {t('board.filters.clear')}
            </button>
          )}
        </div>

        {loadState === 'loading' && <p className={styles.hint}>{t('board.overview.loading')}</p>}
        {loadState === 'error' && (
          <p className={styles.error} role="alert">
            {t(loadErrorKey)}
          </p>
        )}

        {loadState === 'ready' && boards.length === 0 && (
          <div className={styles.emptyState}>
            <p>{t('board.overview.empty')}</p>
            {!creating && (
              <button type="button" className={styles.createButton} onClick={() => setCreating(true)}>
                {t('board.create.cta')}
              </button>
            )}
          </div>
        )}

        {boards.length > 0 && (
          <div className={styles.grid}>
            {boards.map((board) => (
              <div key={board.id} className={`${styles.card} ${styles[`accent_${board.accent}`]}`}>
                {renamingId === board.id ? (
                  <form className={styles.renameForm} onSubmit={(event) => submitRename(event, board.id)} noValidate>
                    <label className={styles.srOnly} htmlFor={`rename-${board.id}`}>
                      {t('board.create.titleLabel')}
                    </label>
                    <input
                      id={`rename-${board.id}`}
                      className={styles.input}
                      value={renameValue}
                      maxLength={TITLE_MAX_LENGTH}
                      onChange={(event) => setRenameValue(event.target.value)}
                      autoFocus
                    />
                    <label className={styles.srOnly} htmlFor={`rename-description-${board.id}`}>
                      {t('board.create.descriptionLabel')}
                    </label>
                    <textarea
                      id={`rename-description-${board.id}`}
                      className={`${styles.input} ${styles.textarea}`}
                      value={renameDescriptionValue}
                      maxLength={DESCRIPTION_MAX_LENGTH}
                      placeholder={t('board.create.descriptionPlaceholder')}
                      onChange={(event) => setRenameDescriptionValue(event.target.value)}
                    />

                    <label className={styles.label} htmlFor={`rename-category-${board.id}`}>
                      {t('board.form.category.label')}
                    </label>
                    <select
                      id={`rename-category-${board.id}`}
                      className={styles.input}
                      value={renameCategoryId}
                      onChange={(event) => setRenameCategoryId(event.target.value)}
                    >
                      <option value="">{t('board.form.category.placeholder')}</option>
                      {categoryCatalog.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {t(`competency.${entry.slug}`)}
                        </option>
                      ))}
                    </select>

                    <span className={styles.label}>{t('board.form.languages.label')}</span>
                    <div
                      className={styles.checkboxGroup}
                      role="group"
                      aria-label={t('board.form.languages.label')}
                    >
                      {languageCatalog.map((entry) => (
                        <label key={entry.id} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={renameLanguageIds.includes(entry.id)}
                            onChange={() => setRenameLanguageIds((prev) => toggleId(prev, entry.id))}
                          />
                          {t(`language.${entry.slug}`)}
                        </label>
                      ))}
                    </div>

                    <span className={styles.label}>{t('board.form.visibility.label')}</span>
                    <div
                      className={styles.radioRow}
                      role="radiogroup"
                      aria-label={t('board.form.visibility.label')}
                    >
                      {['private', 'public'].map((value) => (
                        <label key={value} className={styles.radioLabel}>
                          <input
                            type="radio"
                            name={`visibility-${board.id}`}
                            value={value}
                            checked={renameVisibility === value}
                            onChange={() => setRenameVisibility(value)}
                          />
                          {t(`board.form.visibility.${value}`)}
                        </label>
                      ))}
                    </div>
                    {renameVisibility === 'public' && (
                      <span className={styles.hint}>{t('board.form.visibility.publicHint')}</span>
                    )}

                    {renameErrorKey && <span className={styles.fieldError}>{t(renameErrorKey)}</span>}
                    <div className={styles.formActions}>
                      <button type="submit" className={styles.submit} disabled={savingRename}>
                        {t('common.save')}
                      </button>
                      <button type="button" className={styles.cancel} onClick={() => setRenamingId(null)}>
                        {t('common.cancel')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <Link to={`/boards/${board.id}`} className={styles.cardTitleLink}>
                      <h2 className={styles.cardTitle}>{board.title}</h2>
                    </Link>
                    {board.description && <p className={styles.cardDescription}>{board.description}</p>}
                    <BoardBadges board={board} categoryCatalog={categoryCatalog} t={t} className={styles.badgeRow} />
                    <p className={styles.cardMeta}>{t('board.card.taskCount', { count: board.taskCount })}</p>
                    {board.totalSeconds > 0 ? (
                      <>
                        <p className={styles.cardMeta}>{t('board.card.totalTime', { duration: formatDuration(board.totalSeconds, t) })}</p>
                        <p className={styles.cardMeta}>{t('board.card.thisWeek', { duration: formatDuration(board.thisWeekSeconds, t) })}</p>
                      </>
                    ) : (
                      <p className={styles.cardMeta}>{t('board.card.noTimeYet')}</p>
                    )}
                    <div className={styles.cardActions}>
                      <button type="button" className={styles.iconButton} onClick={() => startRename(board)}>
                        {t('board.card.rename')}
                      </button>
                      <button
                        type="button"
                        className={styles.iconButtonDanger}
                        onClick={() => setDeleteTarget(board)}
                      >
                        {t('board.card.delete')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div className={styles.sectionSpacer}>
          <div className={styles.headerRow}>
            <h2>{t('board.overview.publicSection.heading')}</h2>
          </div>

          <div className={styles.filtersRow}>
            <CategoryFilter
              idPrefix="public-boards"
              value={publicCategoryFilter}
              onChange={setPublicCategoryFilter}
              categoryCatalog={categoryCatalog}
              t={t}
            />
            <div className={styles.filterField}>
              <span className={styles.label}>{t('board.filters.language.label')}</span>
              <div className={styles.checkboxGroup} role="group" aria-label={t('board.filters.language.label')}>
                {languageCatalog.length === 0 && (
                  <span className={styles.hint}>{t('board.filters.language.all')}</span>
                )}
                {languageCatalog.map((entry) => (
                  <label key={entry.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={publicLanguageFilter.includes(entry.id)}
                      onChange={() => setPublicLanguageFilter((prev) => toggleId(prev, entry.id))}
                    />
                    {t(`language.${entry.slug}`)}
                  </label>
                ))}
              </div>
            </div>
            {publicFiltersActive && (
              <button
                type="button"
                className={styles.clearFiltersButton}
                onClick={() => {
                  setPublicCategoryFilter('');
                  setPublicLanguageFilter([]);
                }}
              >
                {t('board.filters.clear')}
              </button>
            )}
          </div>

          {publicLoadState === 'loading' && <p className={styles.hint}>{t('board.overview.loading')}</p>}
          {publicLoadState === 'error' && (
            <p className={styles.error} role="alert">
              {t(publicLoadErrorKey)}
            </p>
          )}

          {publicLoadState === 'ready' && publicBoards.length === 0 && (
            <div className={styles.emptyState}>
              <p>{t('board.overview.publicSection.empty')}</p>
            </div>
          )}

          {publicBoards.length > 0 && (
            <div className={styles.grid}>
              {publicBoards.map((board) => (
                <div key={board.id} className={`${styles.card} ${styles[`accent_${board.accent}`]}`}>
                  <Link to={`/boards/${board.id}`} className={styles.cardTitleLink}>
                    <h2 className={styles.cardTitle}>{board.title}</h2>
                  </Link>
                  <p className={styles.ownerLabel}>
                    {t('board.overview.publicSection.ownerLabel', { ownerName: board.ownerName })}
                  </p>
                  {board.description && <p className={styles.cardDescription}>{board.description}</p>}
                  <BoardBadges board={board} categoryCatalog={categoryCatalog} t={t} className={styles.badgeRow} />
                  <p className={styles.cardMeta}>{t('board.card.taskCount', { count: board.taskCount })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {deleteTarget && (
        <ConfirmDialog
          title={t('board.delete.confirmTitle')}
          message={t('board.delete.confirmMessage', { title: deleteTarget.title })}
          confirmLabel={t('board.delete.confirmButton')}
          cancelLabel={t('common.cancel')}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

export default BoardsPage;
