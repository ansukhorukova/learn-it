import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { useAuthUser } from '../auth/useAuthUser';
import { useI18n } from '../i18n/I18nProvider';
import { useHeadMeta } from '../lib/useHeadMeta';
import { formatDuration } from '../lib/duration';
import { createBoard, deleteBoard, listBoards, updateBoard } from '../api/client';
import { BOARD_ACCENTS, DEFAULT_BOARD_ACCENT } from '../constants/boardAccents';
import AppHeader from '../components/AppHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import styles from './BoardsPage.module.css';

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 2000;

// Boards overview (`/`, US1). Renders the owner's boards in a grid with
// create/rename/delete (US2-US4). No "Shared with me" section — sharing
// doesn't exist yet, so it's simply absent rather than a stub (per the
// approved AC).
function BoardsPage() {
  const { user, loading: authLoading } = useAuthUser();
  const { t } = useI18n();

  useHeadMeta({ title: t('board.overview.title'), description: t('board.overview.description') });

  const [boards, setBoards] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | error
  const [loadErrorKey, setLoadErrorKey] = useState(null);

  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAccent, setNewAccent] = useState(DEFAULT_BOARD_ACCENT);
  const [createErrorKey, setCreateErrorKey] = useState(null);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameDescriptionValue, setRenameDescriptionValue] = useState('');
  const [renameErrorKey, setRenameErrorKey] = useState(null);
  const [savingRename, setSavingRename] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadBoards = useCallback(async () => {
    if (!user) return;
    setLoadState('loading');
    try {
      const idToken = await user.getIdToken();
      const { boards: rows } = await listBoards(idToken);
      setBoards(rows);
      setLoadState('ready');
    } catch (err) {
      setLoadErrorKey(err.messageKey || 'errors.generic');
      setLoadState('error');
    }
  }, [user]);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  function resetCreateForm() {
    setCreating(false);
    setNewTitle('');
    setNewDescription('');
    setNewAccent(DEFAULT_BOARD_ACCENT);
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
      const updated = await updateBoard(idToken, boardId, { title: trimmed, description: trimmedDescription || null });
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
