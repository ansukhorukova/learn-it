import { useEffect, useRef, useState } from 'react';

import {
  addTaskShare,
  createLinkAttachment,
  createManualTimeEntry,
  createNoteAttachment,
  createTaskComment,
  deleteAttachment,
  deleteTimeEntry,
  listAttachments,
  listTaskComments,
  listTaskShares,
  listTimeEntries,
  removeTaskShare,
  startTimer,
  stopTimer,
  updateTask,
  updateTaskShareRole,
  updateTimeEntry,
  uploadFileAttachment,
} from '../api/client';
import { ALLOWED_FILE_MIME_TYPES, FILE_INPUT_ACCEPT, MAX_FILE_SIZE_BYTES } from '../constants/attachmentLimits';
import { COMMENT_BODY_MAX_LENGTH } from '../constants/commentLimits';
import { replyExcerpt } from '../lib/chatExcerpt';
import { PLANNED_MINUTES_FIELD_MAX, PLANNED_TOTAL_MINUTES_MAX } from '../constants/plannedTimeLimits';
import { MINUTES_MAX, MINUTES_MIN, NOTE_MAX_LENGTH as TIME_NOTE_MAX_LENGTH } from '../constants/timeEntryLimits';
import { formatDuration, formatSessionTimestamp, formatStopwatch } from '../lib/duration';
import { canComment, canWrite } from '../lib/roles';
import ConfirmDialog from './ConfirmDialog';
import SharePanel from './SharePanel';
import styles from './TaskPanel.module.css';

const LINK_TITLE_MAX_LENGTH = 200;
const NOTE_BODY_MAX_LENGTH = 2000;
const TASK_DESCRIPTION_MAX_LENGTH = 2000;
const NOTE_PREVIEW_LENGTH = 80;
// Matches tasks.service.js's TITLE_MAX_LENGTH (backend/src/services/tasks.service.js)
// and BoardViewPage.jsx's own copy of the same constant for task creation.
const TITLE_MAX_LENGTH = 200;

const GROUPS = [
  { kind: 'file', labelKey: 'attachment.group.files' },
  { kind: 'link', labelKey: 'attachment.group.links' },
  { kind: 'note', labelKey: 'attachment.group.notes' },
];

function groupByKind(attachments) {
  return {
    file: attachments.filter((a) => a.kind === 'file'),
    link: attachments.filter((a) => a.kind === 'link'),
    note: attachments.filter((a) => a.kind === 'note'),
  };
}

function truncate(text, max) {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

// US-034 — flatten the chronological `task_comments` array into render rows
// with a visual depth (0/1/2, capped at 3 levels). The tree is built
// EXCLUSIVELY from `parentCommentId` (AC9); `replyToCommentId` is only used
// later to render the "In reply to {name}" line on a flattened level-3
// sibling (where it points deeper than the structural parent, AC3/AC10).
// Children keep the source array's chronological order.
function buildCommentTree(comments) {
  const ids = new Set(comments.map((c) => c.id));
  const childrenOf = new Map();
  for (const comment of comments) {
    // A comment whose parent isn't in the list (can't happen today — GET
    // returns the whole set and there's no per-comment delete, US-034 AC13
    // — but defended so a stray row never silently drops its whole subtree).
    const parentKey =
      comment.parentCommentId && ids.has(comment.parentCommentId) ? comment.parentCommentId : '__root__';
    if (!childrenOf.has(parentKey)) childrenOf.set(parentKey, []);
    childrenOf.get(parentKey).push(comment);
  }
  const rows = [];
  const walk = (key, depth) => {
    let prevReplyRef = null;
    for (const comment of childrenOf.get(key) || []) {
      // US-034 AC3/AC10 — a flattened level-3 sibling addresses a comment
      // deeper than its structural parent; the "In reply to {name}" line is
      // shown for it only when that target differs from the previous
      // sibling's ("там, де вона відрізняється від найближчого сусіда").
      const isFlattened =
        comment.replyToCommentId && comment.replyToCommentId !== comment.parentCommentId;
      const showReplyRef = isFlattened && comment.replyToCommentId !== prevReplyRef;
      prevReplyRef = isFlattened ? comment.replyToCommentId : null;
      rows.push({ comment, depth, showReplyRef });
      walk(comment.id, Math.min(depth + 1, 2));
    }
  };
  walk('__root__', 0);
  return rows;
}

// One attachment chip. `onDelete` opens the shared ConfirmDialog in the
// parent (US9 AC: deletion needs confirmation, matching the existing
// board/task delete pattern). `canDelete` (US15/US16) hides the delete
// control entirely for a viewer, rather than showing it disabled — matches
// TaskCard's equivalent gating in BoardViewPage.jsx.
// US-018: a note chip whose body exceeds NOTE_PREVIEW_LENGTH gets an inline
// expand/collapse control instead of a silently-truncated, unrecoverable
// preview. `noteExpanded` is declared unconditionally (not inside the
// kind==='note' branch below) to keep this component's hook order stable
// across renders regardless of attachment.kind — it's simply unused for
// file/link chips.
function AttachmentChip({ attachment, t, onDelete, canDelete }) {
  const [noteExpanded, setNoteExpanded] = useState(false);
  let content;
  let isExpandedNote = false;
  if (attachment.kind === 'file') {
    content = attachment.isImage ? (
      <a href={attachment.downloadUrl} target="_blank" rel="noopener noreferrer" className={styles.chipLink}>
        <img src={attachment.downloadUrl} alt={attachment.title} className={styles.thumb} />
        <span className={styles.chipLabel}>{attachment.title}</span>
      </a>
    ) : (
      <a href={attachment.downloadUrl} target="_blank" rel="noopener noreferrer" className={styles.chipLink}>
        <span className={styles.fileIcon} aria-hidden="true">
          📄
        </span>
        <span className={styles.chipLabel}>{attachment.title}</span>
      </a>
    );
  } else if (attachment.kind === 'link') {
    content = (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className={styles.chipLink}>
        <span className={styles.chipLabel}>{attachment.title}</span>
      </a>
    );
  } else {
    const body = attachment.body || '';
    // AC1/4: the control only exists in the DOM when the body actually
    // exceeds the preview threshold — a short note renders its full text
    // immediately with no "Show more"/disabled button.
    const isLong = body.length > NOTE_PREVIEW_LENGTH;
    const displayText = noteExpanded || !isLong ? body : truncate(body, NOTE_PREVIEW_LENGTH);
    isExpandedNote = noteExpanded && isLong;
    content = (
      <div className={styles.noteBody}>
        <span className={noteExpanded ? styles.noteTextExpanded : styles.chipLabel}>{displayText}</span>
        {isLong && (
          <button
            type="button"
            className={styles.noteToggle}
            onClick={() => setNoteExpanded((v) => !v)}
            aria-expanded={noteExpanded}
            aria-label={t(noteExpanded ? 'attachment.note.collapseAriaLabel' : 'attachment.note.expandAriaLabel')}
          >
            {t(noteExpanded ? 'attachment.note.showLess' : 'attachment.note.showMore')}
          </button>
        )}
      </div>
    );
  }

  return (
    <li className={styles.chip} data-note-expanded={isExpandedNote || undefined}>
      {content}
      {canDelete && (
        <button
          type="button"
          className={styles.chipDelete}
          onClick={() => onDelete(attachment)}
          aria-label={t('attachment.delete.cta')}
        >
          ×
        </button>
      )}
    </li>
  );
}

// Side panel opened from a task card (US9) — currently the only content is
// the attachments section (CLAUDE.md's "Task panel" also specifies a time
// tracker section, out of scope for this pass — see PROJECT_MAP.md's
// FE_TaskPanel node). `onAttachmentCountChange(taskId, count)` lets the
// board view keep the task card's attachment-count badge in sync without a
// full task list re-fetch. `onTitleUpdated(taskId, title)` does the same for
// a task rename (see below) — mirrors the attachment-count callback's shape
// rather than passing the whole updated task back, since the title-only
// PATCH response (tasks.service.js's non-reordering branch) has no
// attachmentCount and a naive full-object merge would clobber the card's
// existing badge count back to 0.
function TaskPanel({
  task,
  idToken,
  t,
  locale,
  onClose,
  onAttachmentCountChange,
  onTitleUpdated,
  onNotesUpdated,
  onTimeSummaryChange,
  onPlannedMinutesUpdated,
}) {
  // US15/US16: a viewer (task.myRole, the caller's EFFECTIVE role — board
  // role unless elevated by a task-level share, see tasks.service.js's
  // getOwnedTaskWithBoard) can read everything in this panel but can't
  // rename the task or add/delete attachments. Time-entry controls below are
  // deliberately NEVER gated on this — US16 gives a viewer full access to
  // their own timer/time-entries regardless of role.
  const editable = canWrite(task.myRole);
  // US-040: a public-board visitor (task.myRole === 'public') can add
  // comments and reply, but nothing else here is writable for them — every
  // other control stays gated on `editable` (canWrite excludes 'public'). A
  // real board_members viewer stays read-only on comments too (canComment
  // excludes 'viewer'), so they still see the read-only banner, no form.
  const canPostComments = canComment(task.myRole);
  const [sharingTask, setSharingTask] = useState(false);

  const [attachments, setAttachments] = useState(null); // null = loading
  const [loadErrorKey, setLoadErrorKey] = useState(null);
  const [bannerErrorKey, setBannerErrorKey] = useState(null);

  // --- Time tracking (US10-US12) ---
  // `timeData` shape: { entries: [...completed, newest first], activeEntry }.
  // Deliberately drops the `totalSeconds` field the GET response also
  // carries — every total shown by this panel is derived client-side from
  // `entries`/`activeEntry` instead (see `displayTotalSeconds` below), so
  // there's exactly one source of truth that stays correct across every
  // local mutation (start/stop/manual/edit/delete) without needing a
  // matching totalSeconds recompute at each call site.
  const [timeData, setTimeData] = useState(null); // null = loading
  const [timeLoadErrorKey, setTimeLoadErrorKey] = useState(null);
  const [timeBannerErrorKey, setTimeBannerErrorKey] = useState(null);
  const [switchNotice, setSwitchNotice] = useState(false);

  // --- Estimated/planned time (US-020) ---
  // `plannedMinutesValue` is this panel's own source of truth for the saved
  // estimate (seeded from the task prop, then updated locally after each
  // successful save/clear) — same pattern as `timeData` above, so the
  // "Estimated: X / Logged: Y" summary always reflects the latest write
  // without needing a full task re-fetch. The two number inputs are kept as
  // separate string state so an in-progress edit (e.g. clearing the hours
  // field to type a new value) never fights with the derived summary.
  const [plannedMinutesValue, setPlannedMinutesValue] = useState(task.plannedMinutes ?? null);
  const [plannedHoursInput, setPlannedHoursInput] = useState(
    task.plannedMinutes != null ? String(Math.floor(task.plannedMinutes / 60)) : '',
  );
  const [plannedMinutesInput, setPlannedMinutesInput] = useState(
    task.plannedMinutes != null ? String(task.plannedMinutes % 60) : '',
  );
  const [plannedErrorKey, setPlannedErrorKey] = useState(null);
  const [savingPlanned, setSavingPlanned] = useState(false);

  // --- Comments (US-019) ---
  // Shared across every caller with task access (unlike time-entries) —
  // fetched once per panel open, appended to locally on a successful post.
  const [comments, setComments] = useState(null); // null = loading
  const [commentsLoadErrorKey, setCommentsLoadErrorKey] = useState(null);
  const [commentBody, setCommentBody] = useState('');
  const [commentErrorKey, setCommentErrorKey] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  // US-034 — the comment the "Reply" button was clicked on, or null for a
  // plain top-level comment. When set, the composer renders inline under
  // that comment with a quote preview instead of at the bottom.
  const [replyTargetId, setReplyTargetId] = useState(null);

  const [starting, setStarting] = useState(false);
  const [stoppingForm, setStoppingForm] = useState(false);
  const [stopNote, setStopNote] = useState('');
  const [stopNoteErrorKey, setStopNoteErrorKey] = useState(null);
  const [stopping, setStopping] = useState(false);

  const [addingManualEntry, setAddingManualEntry] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [manualErrorKey, setManualErrorKey] = useState(null);
  const [submittingManual, setSubmittingManual] = useState(false);

  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editMinutes, setEditMinutes] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editErrorKey, setEditErrorKey] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteEntryTarget, setDeleteEntryTarget] = useState(null);
  const [deletingEntry, setDeletingEntry] = useState(false);

  // Ticks once a second only while a timer is running on this task, driving
  // the live HH:MM:SS display (US10 AC1/3: "рахує Date.now()-startedAt
  // локально, ресинхронізується з сервером при завантаженні панелі" — the
  // resync is `timeData.activeEntry.startedAt` itself, freshly fetched on
  // panel open; this tick just re-renders that computation every second).
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (!timeData?.activeEntry) return undefined;
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [timeData?.activeEntry?.id]);

  // Task title rename — placed in this panel (rather than on the board-view
  // TaskCard) because CLAUDE.md frames the panel as the task's "detail view"
  // and this mirrors that role; the board-rename UI (BoardsPage.jsx) is an
  // inline edit toggled from the equivalent list-item/card, which is what
  // this reproduces here (form replaces the static <h2> in place).
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);
  const [titleErrorKey, setTitleErrorKey] = useState(null);
  const [savingTitle, setSavingTitle] = useState(false);

  // Task description — reuses the pre-existing `notes` column (tasks.service.js),
  // labeled "Description" in the UI per product decision, same inline-edit
  // shape as the title rename above.
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(task.notes || '');
  const [notesErrorKey, setNotesErrorKey] = useState(null);
  const [savingNotes, setSavingNotes] = useState(false);

  const [addingLink, setAddingLink] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkErrorKey, setLinkErrorKey] = useState(null);
  const [submittingLink, setSubmittingLink] = useState(false);

  const [addingNote, setAddingNote] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const [noteErrorKey, setNoteErrorKey] = useState(null);
  const [submittingNote, setSubmittingNote] = useState(false);

  const [fileErrorKey, setFileErrorKey] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const panelRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== 'Escape') return;
      // Escape cancels an in-progress title edit first (keyboard-accessible
      // cancel, matching the rest of this app's inline-edit forms), and only
      // falls through to closing the whole panel once there's no edit to
      // cancel — otherwise Escape-to-cancel-rename would also dismiss the
      // panel, which isn't what a user pressing it once would expect.
      if (editingTitle) {
        setEditingTitle(false);
        setTitleErrorKey(null);
        return;
      }
      if (editingNotes) {
        setEditingNotes(false);
        setNotesErrorKey(null);
        return;
      }
      if (editingEntryId) {
        cancelEditEntry();
        return;
      }
      if (!deleteTarget && !deleteEntryTarget) onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, deleteTarget, deleteEntryTarget, editingTitle, editingNotes, editingEntryId]);

  useEffect(() => {
    let cancelled = false;
    setAttachments(null);
    setLoadErrorKey(null);
    (async () => {
      try {
        const data = await listAttachments(idToken, task.id);
        if (!cancelled) setAttachments(data.attachments);
      } catch (err) {
        if (!cancelled) setLoadErrorKey(err.messageKey || 'errors.generic');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [task.id, idToken]);

  useEffect(() => {
    if (attachments !== null) onAttachmentCountChange?.(task.id, attachments.length);
  }, [attachments, task.id, onAttachmentCountChange]);

  useEffect(() => {
    let cancelled = false;
    setTimeData(null);
    setTimeLoadErrorKey(null);
    (async () => {
      try {
        const data = await listTimeEntries(idToken, task.id);
        if (!cancelled) setTimeData({ entries: data.entries, activeEntry: data.activeEntry });
      } catch (err) {
        if (!cancelled) setTimeLoadErrorKey(err.messageKey || 'errors.generic');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [task.id, idToken]);

  useEffect(() => {
    let cancelled = false;
    setComments(null);
    setCommentsLoadErrorKey(null);
    setReplyTargetId(null);
    setCommentBody('');
    setCommentErrorKey(null);
    (async () => {
      try {
        const data = await listTaskComments(idToken, task.id);
        if (!cancelled) setComments(data.comments);
      } catch (err) {
        if (!cancelled) setCommentsLoadErrorKey(err.messageKey || 'errors.generic');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [task.id, idToken]);

  // Completed-sessions total + the active entry's live elapsed time, if
  // running — the single total this panel ever shows (sessions.total) or
  // reports upward (see the effect below), always derived fresh rather than
  // trusted as a separately-tracked number that could drift.
  const liveElapsedSeconds = timeData?.activeEntry
    ? Math.max(0, Math.floor((nowTick - new Date(timeData.activeEntry.startedAt).getTime()) / 1000))
    : 0;
  const displayTotalSeconds = timeData
    ? timeData.entries.reduce((sum, entry) => sum + (entry.durationSeconds || 0), 0) + liveElapsedSeconds
    : 0;

  // Keeps the task card's time badge (US12 AC4) in sync with this panel's
  // own data, same shape/intent as onAttachmentCountChange above — but keyed
  // off `timeData` (start/stop/manual/edit/delete), not `nowTick`, so the
  // board view doesn't re-render every second while a timer runs in the
  // background.
  useEffect(() => {
    if (timeData !== null) onTimeSummaryChange?.(task.id, displayTotalSeconds);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally excludes displayTotalSeconds/liveElapsedSeconds/nowTick: this should only re-fire when timeData itself changes (a real mutation), not every second-tick recomputation of the live total.
  }, [timeData, task.id, onTimeSummaryChange]);

  async function handleStartTimer() {
    setStarting(true);
    setTimeBannerErrorKey(null);
    setSwitchNotice(false);
    try {
      const result = await startTimer(idToken, task.id);
      setTimeData((prev) => ({ entries: prev ? prev.entries : [], activeEntry: result.startedEntry }));
      if (result.autoStoppedEntry) setSwitchNotice(true);
    } catch (err) {
      setTimeBannerErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setStarting(false);
    }
  }

  async function handleStopTimer(event) {
    event.preventDefault();
    const trimmedNote = stopNote.trim();
    if (trimmedNote.length > TIME_NOTE_MAX_LENGTH) {
      setStopNoteErrorKey('errors.timeEntry.noteTooLong');
      return;
    }

    setStopping(true);
    setStopNoteErrorKey(null);
    try {
      const stopped = await stopTimer(idToken, task.id, { note: trimmedNote || undefined });
      setTimeData((prev) => ({ entries: [stopped, ...(prev ? prev.entries : [])], activeEntry: null }));
      setStoppingForm(false);
      setStopNote('');
    } catch (err) {
      setTimeBannerErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setStopping(false);
    }
  }

  function parseMinutesInput(value) {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  async function handleAddManualEntry(event) {
    event.preventDefault();
    const minutesNum = parseMinutesInput(manualMinutes);
    if (minutesNum === null || !Number.isInteger(minutesNum) || minutesNum < MINUTES_MIN) {
      setManualErrorKey('errors.timeEntry.minutesInvalid');
      return;
    }
    if (minutesNum > MINUTES_MAX) {
      setManualErrorKey('errors.timeEntry.minutesTooLarge');
      return;
    }
    const trimmedNote = manualNote.trim();
    if (trimmedNote.length > TIME_NOTE_MAX_LENGTH) {
      setManualErrorKey('errors.timeEntry.noteTooLong');
      return;
    }

    setSubmittingManual(true);
    setManualErrorKey(null);
    try {
      const entry = await createManualTimeEntry(idToken, task.id, { minutes: minutesNum, note: trimmedNote || undefined });
      setTimeData((prev) => ({ entries: [entry, ...(prev ? prev.entries : [])], activeEntry: prev ? prev.activeEntry : null }));
      setManualMinutes('');
      setManualNote('');
      setAddingManualEntry(false);
    } catch (err) {
      setManualErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setSubmittingManual(false);
    }
  }

  function startEditEntry(entry) {
    setEditingEntryId(entry.id);
    setEditMinutes(String(Math.max(1, Math.round((entry.durationSeconds || 0) / 60))));
    setEditNote(entry.note || '');
    setEditErrorKey(null);
  }

  function cancelEditEntry() {
    setEditingEntryId(null);
    setEditErrorKey(null);
  }

  async function handleSubmitEdit(event, entryId) {
    event.preventDefault();
    const minutesNum = parseMinutesInput(editMinutes);
    if (minutesNum === null || !Number.isInteger(minutesNum) || minutesNum < MINUTES_MIN) {
      setEditErrorKey('errors.timeEntry.minutesInvalid');
      return;
    }
    if (minutesNum > MINUTES_MAX) {
      setEditErrorKey('errors.timeEntry.minutesTooLarge');
      return;
    }
    const trimmedNote = editNote.trim();
    if (trimmedNote.length > TIME_NOTE_MAX_LENGTH) {
      setEditErrorKey('errors.timeEntry.noteTooLong');
      return;
    }

    setSavingEdit(true);
    setEditErrorKey(null);
    try {
      const updated = await updateTimeEntry(idToken, task.id, entryId, { minutes: minutesNum, note: trimmedNote || null });
      setTimeData((prev) => ({
        ...prev,
        entries: prev.entries.map((entry) => (entry.id === entryId ? updated : entry)),
      }));
      setEditingEntryId(null);
    } catch (err) {
      setEditErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setSavingEdit(false);
    }
  }

  async function confirmDeleteEntry() {
    if (!deleteEntryTarget) return;
    setDeletingEntry(true);
    try {
      await deleteTimeEntry(idToken, task.id, deleteEntryTarget.id);
      setTimeData((prev) => {
        if (!prev) return prev;
        const wasActive = prev.activeEntry?.id === deleteEntryTarget.id;
        return {
          activeEntry: wasActive ? null : prev.activeEntry,
          entries: prev.entries.filter((entry) => entry.id !== deleteEntryTarget.id),
        };
      });
      setDeleteEntryTarget(null);
    } catch (err) {
      setTimeBannerErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setDeletingEntry(false);
    }
  }

  function startEditingTitle() {
    setTitleValue(task.title);
    setTitleErrorKey(null);
    setEditingTitle(true);
  }

  // Client-side validation mirrors board rename (BoardsPage.jsx's
  // submitRename): trim, required, then max-length, using the FE's own
  // pre-submit validation.* keys — a failed BE round-trip (403/404/network/a
  // race that changed the title server-side first) falls through to
  // `err.messageKey`, which resolves to the server's own errors.task.* key
  // (e.g. errors.task.forbidden for a non-owner) via the same generic
  // ApiRequestError.messageKey pattern used by every other mutation here.
  async function handleTitleSubmit(event) {
    event.preventDefault();
    const trimmed = titleValue.trim();
    if (!trimmed) {
      setTitleErrorKey('task.rename.validation.titleRequired');
      return;
    }
    if (trimmed.length > TITLE_MAX_LENGTH) {
      setTitleErrorKey('task.rename.validation.titleTooLong');
      return;
    }

    setSavingTitle(true);
    setTitleErrorKey(null);
    try {
      const updated = await updateTask(idToken, task.id, { title: trimmed });
      onTitleUpdated?.(task.id, updated.title);
      setEditingTitle(false);
    } catch (err) {
      setTitleErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setSavingTitle(false);
    }
  }

  function startEditingNotes() {
    setNotesValue(task.notes || '');
    setNotesErrorKey(null);
    setEditingNotes(true);
  }

  // Same validation shape as handleTitleSubmit above: trim, then max-length
  // via the FE's own pre-submit validation.* key, with a failed BE
  // round-trip falling through to err.messageKey (errors.task.notesTooLong).
  // Unlike the title, an empty description is valid (it's optional) — sent
  // as `null` to clear it server-side rather than omitted.
  async function handleNotesSubmit(event) {
    event.preventDefault();
    const trimmed = notesValue.trim();
    if (trimmed.length > TASK_DESCRIPTION_MAX_LENGTH) {
      setNotesErrorKey('task.notes.validation.descriptionTooLong');
      return;
    }

    setSavingNotes(true);
    setNotesErrorKey(null);
    try {
      const updated = await updateTask(idToken, task.id, { notes: trimmed || null });
      onNotesUpdated?.(task.id, updated.notes);
      setEditingNotes(false);
    } catch (err) {
      setNotesErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleAddLink(event) {
    event.preventDefault();
    const trimmedTitle = linkTitle.trim();
    const trimmedUrl = linkUrl.trim();
    if (!trimmedTitle) {
      setLinkErrorKey('errors.attachment.titleRequired');
      return;
    }
    if (trimmedTitle.length > LINK_TITLE_MAX_LENGTH) {
      setLinkErrorKey('errors.attachment.titleTooLong');
      return;
    }
    if (!trimmedUrl) {
      setLinkErrorKey('errors.attachment.urlRequired');
      return;
    }
    let parsedUrl;
    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      setLinkErrorKey('errors.attachment.urlInvalid');
      return;
    }
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      setLinkErrorKey('errors.attachment.urlInvalid');
      return;
    }

    setSubmittingLink(true);
    setLinkErrorKey(null);
    try {
      const attachment = await createLinkAttachment(idToken, task.id, { title: trimmedTitle, url: trimmedUrl });
      setAttachments((prev) => [...(prev || []), attachment]);
      setLinkTitle('');
      setLinkUrl('');
      setAddingLink(false);
    } catch (err) {
      setLinkErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setSubmittingLink(false);
    }
  }

  async function handleAddNote(event) {
    event.preventDefault();
    const trimmed = noteBody.trim();
    if (!trimmed) {
      setNoteErrorKey('errors.attachment.noteBodyRequired');
      return;
    }
    if (trimmed.length > NOTE_BODY_MAX_LENGTH) {
      setNoteErrorKey('errors.attachment.noteBodyTooLong');
      return;
    }

    setSubmittingNote(true);
    setNoteErrorKey(null);
    try {
      const attachment = await createNoteAttachment(idToken, task.id, { body: trimmed });
      setAttachments((prev) => [...(prev || []), attachment]);
      setNoteBody('');
      setAddingNote(false);
    } catch (err) {
      setNoteErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setSubmittingNote(false);
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setFileErrorKey(null);
    if (!ALLOWED_FILE_MIME_TYPES.includes(file.type)) {
      setFileErrorKey('errors.attachment.invalidFileType');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileErrorKey('errors.attachment.fileTooLarge');
      return;
    }

    setUploadingFile(true);
    try {
      const attachment = await uploadFileAttachment(idToken, task.id, file);
      setAttachments((prev) => [...(prev || []), attachment]);
    } catch (err) {
      setFileErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setUploadingFile(false);
    }
  }

  async function confirmDeleteAttachment() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAttachment(idToken, task.id, deleteTarget.id);
      setAttachments((prev) => (prev || []).filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setBannerErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setDeleting(false);
    }
  }

  // US-020: combines the two number inputs into a single `plannedMinutes`
  // integer before sending (CLAUDE.md task description) — `0` or both
  // fields empty is a deliberate reset to `null` (AC3), not a validation
  // error. Client-side checks mirror the BE's own bounds (openapi.yaml's
  // PATCH /tasks/{id}) purely for faster feedback; the BE re-validates
  // independently.
  function parsePlannedField(value) {
    if (value === '' || value === null || value === undefined) return 0;
    const num = Number(value);
    return num;
  }

  async function savePlannedMinutes(totalMinutes) {
    setSavingPlanned(true);
    setPlannedErrorKey(null);
    try {
      const updated = await updateTask(idToken, task.id, { plannedMinutes: totalMinutes });
      setPlannedMinutesValue(updated.plannedMinutes);
      onPlannedMinutesUpdated?.(task.id, updated.plannedMinutes);
      if (updated.plannedMinutes == null) {
        setPlannedHoursInput('');
        setPlannedMinutesInput('');
      } else {
        setPlannedHoursInput(String(Math.floor(updated.plannedMinutes / 60)));
        setPlannedMinutesInput(String(updated.plannedMinutes % 60));
      }
    } catch (err) {
      setPlannedErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setSavingPlanned(false);
    }
  }

  async function handleSavePlanned(event) {
    event.preventDefault();
    const hoursNum = parsePlannedField(plannedHoursInput);
    const minutesNum = parsePlannedField(plannedMinutesInput);
    const validHours = Number.isInteger(hoursNum) && hoursNum >= 0;
    const validMinutes = Number.isInteger(minutesNum) && minutesNum >= 0 && minutesNum <= PLANNED_MINUTES_FIELD_MAX;
    if (!validHours || !validMinutes) {
      setPlannedErrorKey('errors.task.plannedMinutesInvalid');
      return;
    }

    const total = hoursNum * 60 + minutesNum;
    if (total > PLANNED_TOTAL_MINUTES_MAX) {
      setPlannedErrorKey('errors.task.plannedMinutesTooLarge');
      return;
    }

    await savePlannedMinutes(total === 0 ? null : total);
  }

  async function handleClearPlanned() {
    setPlannedErrorKey(null);
    await savePlannedMinutes(null);
  }

  function startReply(commentId) {
    setReplyTargetId(commentId);
    setCommentBody('');
    setCommentErrorKey(null);
  }

  function cancelReply() {
    setReplyTargetId(null);
    setCommentBody('');
    setCommentErrorKey(null);
  }

  async function handleAddComment(event) {
    event.preventDefault();
    const trimmed = commentBody.trim();
    if (!trimmed) {
      setCommentErrorKey('errors.comment.bodyRequired');
      return;
    }
    if (trimmed.length > COMMENT_BODY_MAX_LENGTH) {
      setCommentErrorKey('errors.comment.bodyTooLong');
      return;
    }

    setSubmittingComment(true);
    setCommentErrorKey(null);
    try {
      const comment = await createTaskComment(idToken, task.id, {
        body: trimmed,
        replyToCommentId: replyTargetId || undefined,
      });
      setComments((prev) => [...(prev || []), comment]);
      setCommentBody('');
      setReplyTargetId(null);
    } catch (err) {
      setCommentErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setSubmittingComment(false);
    }
  }

  const grouped = attachments ? groupByKind(attachments) : { file: [], link: [], note: [] };

  const commentsById = new Map((comments || []).map((comment) => [comment.id, comment]));

  // US-034 — one composer, rendered either at the bottom (top-level comment)
  // or inline under the comment being replied to. `replyExcerpt`/the preview
  // line come straight from the already-loaded list (AC6 — no extra fetch).
  function renderCommentForm({ inline }) {
    const target = inline ? commentsById.get(replyTargetId) : null;
    const fieldId = inline ? 'task-comment-reply-body' : 'task-comment-body';
    return (
      <form className={styles.form} onSubmit={handleAddComment} noValidate>
        {target && (
          <div className={styles.replyPreview}>
            <span>
              {t('taskPanel.comments.replyPreview', {
                name: target.authorName,
                excerpt: replyExcerpt(target.body),
              })}
            </span>
            <button type="button" className={styles.replyPreviewCancel} onClick={cancelReply}>
              {t('taskPanel.comments.cancelReply')}
            </button>
          </div>
        )}
        <label className={styles.srOnly} htmlFor={fieldId}>
          {t('taskPanel.comments.bodyPlaceholder')}
        </label>
        <textarea
          id={fieldId}
          className={styles.textarea}
          value={commentBody}
          maxLength={COMMENT_BODY_MAX_LENGTH}
          placeholder={t('taskPanel.comments.bodyPlaceholder')}
          onChange={(event) => setCommentBody(event.target.value)}
          autoFocus={inline}
        />
        {commentErrorKey && <span className={styles.fieldError}>{t(commentErrorKey)}</span>}
        <div className={styles.formActions}>
          <button type="submit" className={styles.submit} disabled={submittingComment}>
            {submittingComment ? t('taskPanel.comments.saving') : t('taskPanel.comments.submit')}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <aside
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-panel-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          {/* Always-present, always in sync with `task.title` — keeps
              aria-labelledby valid whether or not the rename form (which has
              no matching id) is currently rendered in its place below. */}
          <span id="task-panel-title" className={styles.srOnly}>
            {task.title}
          </span>

          {editingTitle ? (
            <form className={styles.titleForm} onSubmit={handleTitleSubmit} noValidate>
              <label className={styles.srOnly} htmlFor="task-panel-title-input">
                {t('task.rename.titleLabel')}
              </label>
              <input
                id="task-panel-title-input"
                className={styles.input}
                value={titleValue}
                maxLength={TITLE_MAX_LENGTH}
                onChange={(event) => setTitleValue(event.target.value)}
                aria-invalid={Boolean(titleErrorKey)}
                autoFocus
              />
              {titleErrorKey && <span className={styles.fieldError}>{t(titleErrorKey)}</span>}
              <div className={styles.formActions}>
                <button type="submit" className={styles.submit} disabled={savingTitle}>
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  className={styles.cancel}
                  onClick={() => {
                    setEditingTitle(false);
                    setTitleErrorKey(null);
                  }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.titleRow}>
              <h2 className={styles.title}>{task.title}</h2>
              {editable && (
                <button type="button" className={styles.renameButton} onClick={startEditingTitle}>
                  {t('task.rename.cta')}
                </button>
              )}
              {/* US14/US15: only the parent board's owner manages
                  task_shares — task.myRole === 'owner' is exactly that
                  caller (see lib/authz.js's getTaskRole: 'owner' is only
                  ever the board owner, never a board_members/task_shares
                  row). A collaborator with full edit rights on this task
                  still never sees this control. */}
              {task.myRole === 'owner' && (
                <button type="button" className={styles.renameButton} onClick={() => setSharingTask(true)}>
                  {t('share.task.cta')}
                </button>
              )}
            </div>
          )}

          <button type="button" className={styles.closeButton} onClick={onClose} aria-label={t('attachment.panel.close')}>
            ×
          </button>
        </div>

        <div className={styles.notesSection}>
          {editingNotes ? (
            <form className={styles.form} onSubmit={handleNotesSubmit} noValidate>
              <label className={styles.label} htmlFor="task-panel-notes-input">
                {t('task.notes.label')}
              </label>
              <textarea
                id="task-panel-notes-input"
                className={styles.textarea}
                value={notesValue}
                maxLength={TASK_DESCRIPTION_MAX_LENGTH}
                placeholder={t('task.notes.placeholder')}
                onChange={(event) => setNotesValue(event.target.value)}
                autoFocus
              />
              {notesErrorKey && <span className={styles.fieldError}>{t(notesErrorKey)}</span>}
              <div className={styles.formActions}>
                <button type="submit" className={styles.submit} disabled={savingNotes}>
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  className={styles.cancel}
                  onClick={() => {
                    setEditingNotes(false);
                    setNotesErrorKey(null);
                  }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <>
              {task.notes ? (
                <p className={styles.notesText}>{task.notes}</p>
              ) : (
                <p className={styles.hint}>{t('task.notes.empty')}</p>
              )}
              {editable && (
                <button type="button" className={styles.renameButton} onClick={startEditingNotes}>
                  {task.notes ? t('task.notes.edit') : t('task.notes.add')}
                </button>
              )}
            </>
          )}
        </div>

        <h3 className={styles.subheading}>{t('timeEntry.section.title')}</h3>

        <div className={styles.plannedTimeBlock}>
          <span className={styles.label}>{t('taskPanel.plannedTime.label')}</span>
          <form className={styles.plannedTimeForm} onSubmit={handleSavePlanned} noValidate>
            <div className={styles.plannedTimeFields}>
              <div className={styles.plannedTimeField}>
                <label className={styles.srOnly} htmlFor="planned-time-hours">
                  {t('taskPanel.plannedTime.hoursLabel')}
                </label>
                <input
                  id="planned-time-hours"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  className={styles.input}
                  placeholder={t('taskPanel.plannedTime.hoursLabel')}
                  value={plannedHoursInput}
                  disabled={!editable || savingPlanned}
                  onChange={(event) => setPlannedHoursInput(event.target.value)}
                />
              </div>
              <div className={styles.plannedTimeField}>
                <label className={styles.srOnly} htmlFor="planned-time-minutes">
                  {t('taskPanel.plannedTime.minutesLabel')}
                </label>
                <input
                  id="planned-time-minutes"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={PLANNED_MINUTES_FIELD_MAX}
                  step={1}
                  className={styles.input}
                  placeholder={t('taskPanel.plannedTime.minutesLabel')}
                  value={plannedMinutesInput}
                  disabled={!editable || savingPlanned}
                  onChange={(event) => setPlannedMinutesInput(event.target.value)}
                />
              </div>
            </div>
            {plannedErrorKey && <span className={styles.fieldError}>{t(plannedErrorKey)}</span>}
            {editable && (
              <div className={styles.formActions}>
                <button type="submit" className={styles.submit} disabled={savingPlanned}>
                  {t('common.save')}
                </button>
                {plannedMinutesValue != null && (
                  <button type="button" className={styles.cancel} onClick={handleClearPlanned} disabled={savingPlanned}>
                    {t('taskPanel.plannedTime.clear')}
                  </button>
                )}
              </div>
            )}
          </form>
          {/* Gated on timeData !== null too — displayTotalSeconds is 0 while
              time entries are still loading, and showing "Logged: 0m" for a
              moment before the real total arrives would be misleading. */}
          {plannedMinutesValue != null && timeData !== null && (
            <p className={styles.hint}>
              {t('taskPanel.plannedTime.summary', {
                estimated: formatDuration(plannedMinutesValue * 60, t),
                logged: formatDuration(displayTotalSeconds, t),
              })}
            </p>
          )}
        </div>

        {timeBannerErrorKey && (
          <p className={styles.banner} role="alert">
            {t(timeBannerErrorKey)}
          </p>
        )}
        {switchNotice && (
          <p className={styles.switchNotice} role="status">
            {t('timeEntry.timer.switchedNotice')}
          </p>
        )}

        {timeData === null && !timeLoadErrorKey && <p className={styles.hint}>{t('attachment.panel.loading')}</p>}
        {timeLoadErrorKey && (
          <p className={styles.banner} role="alert">
            {t(timeLoadErrorKey)}
          </p>
        )}

        {timeData !== null && (
          <>
            <div className={styles.timerCard} data-active={timeData.activeEntry ? 'true' : undefined}>
              <div className={styles.timerInfo}>
                {timeData.activeEntry ? (
                  <span className={styles.timerClock}>
                    {t('timeEntry.timer.running', { duration: formatStopwatch(liveElapsedSeconds) })}
                  </span>
                ) : (
                  <span className={styles.hint}>{t('timeEntry.sessions.total', { duration: formatDuration(displayTotalSeconds, t) })}</span>
                )}
              </div>
              <div className={styles.timerActions}>
                {timeData.activeEntry ? (
                  <>
                    <button
                      type="button"
                      className={styles.timerButtonActive}
                      onClick={() => setStoppingForm((v) => !v)}
                      disabled={stopping}
                    >
                      {t('timeEntry.timer.stop')}
                    </button>
                    <button
                      type="button"
                      className={styles.chipDelete}
                      onClick={() => setDeleteEntryTarget(timeData.activeEntry)}
                      aria-label={t('timeEntry.delete.cta')}
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <button type="button" className={styles.timerButton} onClick={handleStartTimer} disabled={starting}>
                    {t('timeEntry.timer.start')}
                  </button>
                )}
              </div>
            </div>

            {stoppingForm && timeData.activeEntry && (
              <form className={styles.form} onSubmit={handleStopTimer} noValidate>
                <label className={styles.label} htmlFor="stop-timer-note">
                  {t('timeEntry.timer.stopNoteLabel')}
                </label>
                <textarea
                  id="stop-timer-note"
                  className={styles.textarea}
                  value={stopNote}
                  maxLength={TIME_NOTE_MAX_LENGTH}
                  onChange={(event) => setStopNote(event.target.value)}
                  autoFocus
                />
                {stopNoteErrorKey && <span className={styles.fieldError}>{t(stopNoteErrorKey)}</span>}
                <div className={styles.formActions}>
                  <button type="submit" className={styles.submit} disabled={stopping}>
                    {t('timeEntry.timer.stop')}
                  </button>
                  <button
                    type="button"
                    className={styles.cancel}
                    onClick={() => {
                      setStoppingForm(false);
                      setStopNote('');
                      setStopNoteErrorKey(null);
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            )}

            <div className={styles.sessionsBlock}>
              <h4 className={styles.groupTitle}>{t('timeEntry.sessions.title')}</h4>
              {timeData.entries.length === 0 && <p className={styles.hint}>{t('timeEntry.sessions.empty')}</p>}
              {timeData.entries.length > 0 && (
                <ul className={styles.sessionList}>
                  {timeData.entries.map((entry) =>
                    editingEntryId === entry.id ? (
                      <li key={entry.id} className={styles.sessionRow}>
                        <form className={styles.form} onSubmit={(event) => handleSubmitEdit(event, entry.id)} noValidate>
                          <label className={styles.label} htmlFor={`edit-entry-minutes-${entry.id}`}>
                            {t('timeEntry.manual.minutesLabel')}
                          </label>
                          <input
                            id={`edit-entry-minutes-${entry.id}`}
                            type="number"
                            inputMode="numeric"
                            min={MINUTES_MIN}
                            max={MINUTES_MAX}
                            step={1}
                            className={styles.input}
                            value={editMinutes}
                            onChange={(event) => setEditMinutes(event.target.value)}
                            autoFocus
                          />
                          <label className={styles.srOnly} htmlFor={`edit-entry-note-${entry.id}`}>
                            {t('timeEntry.manual.notePlaceholder')}
                          </label>
                          <textarea
                            id={`edit-entry-note-${entry.id}`}
                            className={styles.textarea}
                            value={editNote}
                            maxLength={TIME_NOTE_MAX_LENGTH}
                            placeholder={t('timeEntry.manual.notePlaceholder')}
                            onChange={(event) => setEditNote(event.target.value)}
                          />
                          {editErrorKey && <span className={styles.fieldError}>{t(editErrorKey)}</span>}
                          <div className={styles.formActions}>
                            <button type="submit" className={styles.submit} disabled={savingEdit}>
                              {t('timeEntry.edit.submit')}
                            </button>
                            <button type="button" className={styles.cancel} onClick={cancelEditEntry}>
                              {t('common.cancel')}
                            </button>
                          </div>
                        </form>
                      </li>
                    ) : (
                      <li key={entry.id} className={styles.sessionRow}>
                        <div className={styles.sessionInfo}>
                          <span className={styles.sessionDuration}>{formatDuration(entry.durationSeconds, t)}</span>
                          <span className={styles.sessionMeta}>{formatSessionTimestamp(entry.startedAt, locale)}</span>
                          {entry.note && <span className={styles.sessionNote}>{entry.note}</span>}
                        </div>
                        <div className={styles.sessionActions}>
                          <button type="button" className={styles.renameButton} onClick={() => startEditEntry(entry)}>
                            {t('timeEntry.edit.cta')}
                          </button>
                          <button
                            type="button"
                            className={styles.chipDelete}
                            onClick={() => setDeleteEntryTarget(entry)}
                            aria-label={t('timeEntry.delete.cta')}
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              )}

              <button type="button" className={styles.addButton} onClick={() => setAddingManualEntry((v) => !v)}>
                {t('timeEntry.manual.cta')}
              </button>

              {addingManualEntry && (
                <form className={styles.form} onSubmit={handleAddManualEntry} noValidate>
                  <label className={styles.label} htmlFor="manual-entry-minutes">
                    {t('timeEntry.manual.minutesLabel')}
                  </label>
                  <input
                    id="manual-entry-minutes"
                    type="number"
                    inputMode="numeric"
                    min={MINUTES_MIN}
                    max={MINUTES_MAX}
                    step={1}
                    className={styles.input}
                    value={manualMinutes}
                    onChange={(event) => setManualMinutes(event.target.value)}
                    autoFocus
                  />
                  <label className={styles.srOnly} htmlFor="manual-entry-note">
                    {t('timeEntry.manual.notePlaceholder')}
                  </label>
                  <textarea
                    id="manual-entry-note"
                    className={styles.textarea}
                    value={manualNote}
                    maxLength={TIME_NOTE_MAX_LENGTH}
                    placeholder={t('timeEntry.manual.notePlaceholder')}
                    onChange={(event) => setManualNote(event.target.value)}
                  />
                  {manualErrorKey && <span className={styles.fieldError}>{t(manualErrorKey)}</span>}
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.submit} disabled={submittingManual}>
                      {submittingManual ? t('timeEntry.manual.saving') : t('timeEntry.manual.submit')}
                    </button>
                    <button
                      type="button"
                      className={styles.cancel}
                      onClick={() => {
                        setAddingManualEntry(false);
                        setManualMinutes('');
                        setManualNote('');
                        setManualErrorKey(null);
                      }}
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}

        <h3 className={styles.subheading}>{t('attachment.panel.title')}</h3>

        {bannerErrorKey && (
          <p className={styles.banner} role="alert">
            {t(bannerErrorKey)}
          </p>
        )}

        {attachments === null && !loadErrorKey && <p className={styles.hint}>{t('attachment.panel.loading')}</p>}
        {loadErrorKey && (
          <p className={styles.banner} role="alert">
            {t(loadErrorKey)}
          </p>
        )}

        {attachments !== null && (
          <div className={styles.groups}>
            {attachments.length === 0 && <p className={styles.hint}>{t('attachment.panel.empty')}</p>}
            {GROUPS.map(
              (group) =>
                grouped[group.kind].length > 0 && (
                  <div key={group.kind} className={styles.group}>
                    <h4 className={styles.groupTitle}>
                      {t(group.labelKey)} ({grouped[group.kind].length})
                    </h4>
                    <ul className={styles.chipList}>
                      {grouped[group.kind].map((attachment) => (
                        <AttachmentChip
                          key={attachment.id}
                          attachment={attachment}
                          t={t}
                          onDelete={setDeleteTarget}
                          canDelete={editable}
                        />
                      ))}
                    </ul>
                  </div>
                ),
            )}
          </div>
        )}

        {/* US15/US16: a viewer can read every attachment above but can't add
            one — the whole "add" section (file/link/note) is hidden, same
            gating pattern as BoardViewPage.jsx's "Add task" button. */}
        {editable && (
        <div className={styles.addSection}>
          <div className={styles.addRow}>
            <button
              type="button"
              className={styles.addButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
            >
              {uploadingFile ? t('attachment.file.uploading') : t('attachment.add.file')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={FILE_INPUT_ACCEPT}
              className={styles.srOnly}
              onChange={handleFileChange}
            />
            <button
              type="button"
              className={styles.addButton}
              onClick={() => {
                setAddingLink((v) => !v);
                setAddingNote(false);
              }}
            >
              {t('attachment.add.link')}
            </button>
            <button
              type="button"
              className={styles.addButton}
              onClick={() => {
                setAddingNote((v) => !v);
                setAddingLink(false);
              }}
            >
              {t('attachment.add.note')}
            </button>
          </div>
          <p className={styles.hint}>{t('attachment.file.hint')}</p>
          {fileErrorKey && <span className={styles.fieldError}>{t(fileErrorKey)}</span>}

          {addingLink && (
            <form className={styles.form} onSubmit={handleAddLink} noValidate>
              <label className={styles.label} htmlFor="attachment-link-title">
                {t('attachment.link.titleLabel')}
              </label>
              <input
                id="attachment-link-title"
                className={styles.input}
                value={linkTitle}
                maxLength={LINK_TITLE_MAX_LENGTH}
                placeholder={t('attachment.link.titlePlaceholder')}
                onChange={(event) => setLinkTitle(event.target.value)}
                autoFocus
              />
              <label className={styles.label} htmlFor="attachment-link-url">
                {t('attachment.link.urlLabel')}
              </label>
              <input
                id="attachment-link-url"
                type="url"
                className={styles.input}
                value={linkUrl}
                placeholder={t('attachment.link.urlPlaceholder')}
                onChange={(event) => setLinkUrl(event.target.value)}
              />
              {linkErrorKey && <span className={styles.fieldError}>{t(linkErrorKey)}</span>}
              <div className={styles.formActions}>
                <button type="submit" className={styles.submit} disabled={submittingLink}>
                  {submittingLink ? t('attachment.link.saving') : t('attachment.link.submit')}
                </button>
                <button
                  type="button"
                  className={styles.cancel}
                  onClick={() => {
                    setAddingLink(false);
                    setLinkTitle('');
                    setLinkUrl('');
                    setLinkErrorKey(null);
                  }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          )}

          {addingNote && (
            <form className={styles.form} onSubmit={handleAddNote} noValidate>
              <label className={styles.label} htmlFor="attachment-note-body">
                {t('attachment.note.bodyLabel')}
              </label>
              <textarea
                id="attachment-note-body"
                className={styles.textarea}
                value={noteBody}
                maxLength={NOTE_BODY_MAX_LENGTH}
                placeholder={t('attachment.note.bodyPlaceholder')}
                onChange={(event) => setNoteBody(event.target.value)}
                autoFocus
              />
              {noteErrorKey && <span className={styles.fieldError}>{t(noteErrorKey)}</span>}
              <div className={styles.formActions}>
                <button type="submit" className={styles.submit} disabled={submittingNote}>
                  {submittingNote ? t('attachment.note.saving') : t('attachment.note.submit')}
                </button>
                <button
                  type="button"
                  className={styles.cancel}
                  onClick={() => {
                    setAddingNote(false);
                    setNoteBody('');
                    setNoteErrorKey(null);
                  }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          )}
        </div>
        )}

        <h3 className={styles.subheading}>{t('taskPanel.comments.title')}</h3>

        {commentsLoadErrorKey && (
          <p className={styles.banner} role="alert">
            {t(commentsLoadErrorKey)}
          </p>
        )}

        {comments === null && !commentsLoadErrorKey && <p className={styles.hint}>{t('attachment.panel.loading')}</p>}

        {comments !== null && (
          <div className={styles.commentsBlock}>
            {comments.length === 0 && <p className={styles.hint}>{t('taskPanel.comments.empty')}</p>}
            {comments.length > 0 && (
              <ul className={styles.commentList}>
                {buildCommentTree(comments).map(({ comment, depth, showReplyRef }) => {
                  const depthClass =
                    depth === 1 ? styles.commentDepth1 : depth === 2 ? styles.commentDepth2 : '';
                  const replyRef = showReplyRef ? commentsById.get(comment.replyToCommentId) : null;
                  return (
                    <li key={comment.id} className={`${styles.commentRow} ${depthClass}`}>
                      {replyRef && (
                        <span className={styles.commentReplyRef}>
                          {t('taskPanel.comments.inReplyTo', { name: replyRef.authorName })}
                        </span>
                      )}
                      <div className={styles.commentMeta}>
                        <span className={styles.commentAuthor}>{comment.authorName}</span>
                        <span className={styles.sessionMeta}>
                          {formatSessionTimestamp(comment.createdAt, locale)}
                        </span>
                      </div>
                      <p className={styles.commentBody}>{comment.body}</p>
                      {/* US-034 AC5 — "Reply" is present at every level,
                          including level 3 (where the BE flattens the new
                          comment into a sibling rather than hiding the
                          button). */}
                      {canPostComments && (
                        <div className={styles.commentRowActions}>
                          <button
                            type="button"
                            className={styles.commentReplyButton}
                            onClick={() => startReply(comment.id)}
                          >
                            {t('taskPanel.comments.reply')}
                          </button>
                        </div>
                      )}
                      {canPostComments && replyTargetId === comment.id && (
                        <div className={styles.inlineReplyForm}>{renderCommentForm({ inline: true })}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {/* US-019 AC3 / US-040 AC7: a real board_members viewer sees the
                full list above but the add form is replaced with a banner
                rather than a disabled form — same hide-not-disable convention
                as the rest of this panel. A public-board visitor (role
                'public') keeps the form (canPostComments, US-040 AC6).
                US-034: while an inline reply form is open, the bottom
                top-level composer is hidden to keep a single active form. */}
            {canPostComments ? (
              replyTargetId === null && renderCommentForm({ inline: false })
            ) : (
              <p className={styles.infoBanner}>{t('taskPanel.comments.viewerBanner')}</p>
            )}
          </div>
        )}
      </aside>

      {sharingTask && (
        <SharePanel
          panelTitleKey="share.task.panelTitle"
          idToken={idToken}
          t={t}
          onClose={() => setSharingTask(false)}
          api={{
            list: (token) => listTaskShares(token, task.id).then((data) => data.shares),
            add: (token, payload) => addTaskShare(token, task.id, payload),
            updateRole: (token, shareId, payload) => updateTaskShareRole(token, task.id, shareId, payload),
            remove: (token, shareId) => removeTaskShare(token, task.id, shareId),
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={t('attachment.delete.confirmTitle')}
          message={t('attachment.delete.confirmMessage')}
          confirmLabel={t('attachment.delete.confirmButton')}
          cancelLabel={t('common.cancel')}
          busy={deleting}
          onConfirm={confirmDeleteAttachment}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {deleteEntryTarget && (
        <ConfirmDialog
          title={t('timeEntry.delete.confirmTitle')}
          message={t('timeEntry.delete.confirmMessage')}
          confirmLabel={t('timeEntry.delete.confirmButton')}
          cancelLabel={t('common.cancel')}
          busy={deletingEntry}
          onConfirm={confirmDeleteEntry}
          onCancel={() => setDeleteEntryTarget(null)}
        />
      )}
    </div>
  );
}

export default TaskPanel;
