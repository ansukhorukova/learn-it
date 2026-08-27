import { useEffect, useRef, useState } from 'react';

import { useI18n } from '../i18n/I18nProvider';
import { importBoard } from '../api/client';
import styles from './ImportBoardModal.module.css';

// US-038 — "Import from file" flow, opened from the "Мої дошки" section of
// Boards overview (never from "Public Boards" — the parent only renders this
// in the owner context).
//
// The dialog auto-opens the native file picker on mount (AC2). After a file
// is chosen the FE does ONLY a light structural check — non-empty string
// `board.title`, non-empty `tasks` array (AC4) — everything else (slugs,
// field lengths, the 200-task cap) is the BE's job and is never duplicated
// here. A structural pass moves to the preview step (AC5); confirming POSTs
// the parsed JSON verbatim to `POST /api/v1/boards/import` (AC6). On 201 the
// parent navigates to the new board and, if `warnings` is non-empty, shows
// them there (AC7); a 4xx keeps us on this dialog with a localized inline
// error so the user can pick another file (AC9).
function ImportBoardModal({ user, onClose, onImported }) {
  const { t } = useI18n();

  const [stage, setStage] = useState('select'); // select | preview | importing
  const [parsed, setParsed] = useState(null);
  const [taskCount, setTaskCount] = useState(0);
  const [errorKey, setErrorKey] = useState(null);
  const [errorParams, setErrorParams] = useState(undefined);

  const fileInputRef = useRef(null);
  const cancelRef = useRef(null);

  // Auto-open the OS file picker as soon as the dialog mounts (AC2). If the
  // user dismisses that native dialog without choosing anything, the "select"
  // stage still offers a visible button to try again.
  useEffect(() => {
    fileInputRef.current?.click();
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleFileChange(event) {
    const file = event.target.files && event.target.files[0];
    // Reset so picking the same filename again still re-fires `change`.
    event.target.value = '';
    if (!file) return;

    setErrorKey(null);
    setErrorParams(undefined);

    const reader = new FileReader();
    reader.onerror = () => {
      setErrorKey('errors.generic');
    };
    reader.onload = () => {
      let data;
      try {
        data = JSON.parse(String(reader.result));
      } catch {
        setErrorKey('errors.boardImport.invalidJson');
        return;
      }

      const title = data && data.board && data.board.title;
      if (typeof title !== 'string' || !title.trim()) {
        setErrorKey('errors.boardImport.boardTitleRequired');
        return;
      }
      if (!Array.isArray(data.tasks) || data.tasks.length === 0) {
        setErrorKey('errors.boardImport.tasksRequired');
        return;
      }

      setParsed(data);
      setTaskCount(data.tasks.length);
      setStage('preview');
    };
    reader.readAsText(file);
  }

  async function handleConfirm() {
    setStage('importing');
    setErrorKey(null);
    setErrorParams(undefined);
    try {
      const idToken = await user.getIdToken();
      const result = await importBoard(idToken, parsed);
      onImported(result);
    } catch (err) {
      setErrorKey(err.messageKey || 'errors.generic');
      setErrorParams(err.params);
      setStage('preview');
    }
  }

  const previewTitle = parsed && parsed.board ? parsed.board.title.trim() : '';
  const busy = stage === 'importing';

  return (
    <div className={styles.overlay} role="presentation" onClick={busy ? undefined : onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-board-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="import-board-title" className={styles.title}>
          {t('board.import.previewTitle')}
        </h2>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className={styles.fileInput}
          onChange={handleFileChange}
        />

        {stage === 'select' && (
          <>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => fileInputRef.current?.click()}
            >
              {t('board.import.cta')}
            </button>
            {errorKey && (
              <p className={styles.error} role="alert">
                {t(errorKey, errorParams)}
              </p>
            )}
            <div className={styles.actions}>
              <button type="button" ref={cancelRef} className={styles.cancel} onClick={onClose}>
                {t('board.import.cancel')}
              </button>
            </div>
          </>
        )}

        {(stage === 'preview' || stage === 'importing') && (
          <>
            <p className={styles.summary}>{t('board.import.previewSummary', { title: previewTitle })}</p>
            <p className={styles.meta}>{t('board.card.taskCount', { count: taskCount })}</p>

            <button
              type="button"
              className={styles.linkButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              {t('board.import.chooseAnother')}
            </button>

            {errorKey && (
              <p className={styles.error} role="alert">
                {t(errorKey, errorParams)}
              </p>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                ref={cancelRef}
                className={styles.cancel}
                onClick={onClose}
                disabled={busy}
              >
                {t('board.import.cancel')}
              </button>
              <button type="button" className={styles.confirm} onClick={handleConfirm} disabled={busy}>
                {busy ? t('board.import.importing') : t('board.import.confirm')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ImportBoardModal;
