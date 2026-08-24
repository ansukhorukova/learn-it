import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { DndContext, KeyboardSensor, PointerSensor, closestCorners, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useAuthUser } from '../auth/useAuthUser';
import { useI18n } from '../i18n/I18nProvider';
import { useHeadMeta } from '../lib/useHeadMeta';
import { formatDuration } from '../lib/duration';
import {
  addBoardMember,
  createTask,
  deleteTask,
  getBoard,
  listBoardMembers,
  listCompetencyCatalog,
  listTasks,
  removeBoardMember,
  updateBoardMemberRole,
  updateTask,
} from '../api/client';
import { canWrite } from '../lib/roles';
import AppHeader from '../components/AppHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import SharePanel from '../components/SharePanel';
import TaskPanel from '../components/TaskPanel';
import styles from './BoardViewPage.module.css';

const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 2000;

// Exact wording per CLAUDE.md / product-owner confirmation — do not rename.
const COLUMNS = [
  { status: 'planned', labelKey: 'boardView.column.planned' },
  { status: 'in_progress', labelKey: 'boardView.column.inProgress' },
  { status: 'done', labelKey: 'boardView.column.done' },
];

function emptyColumns() {
  return { planned: [], in_progress: [], done: [] };
}

function groupByStatus(tasks) {
  const grouped = emptyColumns();
  [...tasks]
    .sort((a, b) => a.position - b.position)
    .forEach((task) => {
      (grouped[task.status] || grouped.planned).push(task);
    });
  return grouped;
}

// One task card. The drag handle (dnd-kit `useSortable`) is the whole card
// body; the status <select> next to it is the required accessible fallback
// (US8) — a separate control, not a stand-in for dnd-kit's keyboard sensor,
// reachable via Tab+Enter regardless of whether the user ever drags anything.
// `attachmentCount` (US9) is a real live count from the BE (tasks.service.js
// listTasksForBoard), rendered as a badge — this replaces the placeholder
// absence from the boards/tasks pass, when attachments didn't exist yet.
// The "Open" button (not the drag handle) is what opens the attachments
// panel — a dedicated, keyboard-reachable control, deliberately separate
// from the drag-and-drop surface so opening the panel never races dnd-kit's
// pointer sensor.
// US15/US16: a viewer (task.myRole === 'viewer' — board-level viewer, unless
// elevated by a task-level share, see tasks.service.js's listTasksForBoard)
// can open/read the task but can't drag it, change its status, or delete it.
// `disabled` on useSortable turns off both the drag listeners and the
// pointer/keyboard sensors for this one card, so a viewer's card simply
// doesn't respond to drag input rather than allowing a drag that would only
// fail server-side on drop.
function TaskCard({ task, columnLabels, onDelete, onStatusChange, onOpen, t }) {
  const editable = canWrite(task.myRole);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !editable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className={styles.card}>
      <div className={styles.cardHandle} {...(editable ? attributes : {})} {...(editable ? listeners : {})}>
        <span className={styles.cardTitle}>{task.title}</span>
        <div className={styles.cardBadges}>
          {task.attachmentCount > 0 && (
            <span className={styles.attachmentBadge}>{t('task.card.attachmentCount', { count: task.attachmentCount })}</span>
          )}
          {task.totalSeconds > 0 && (
            <span className={styles.timeBadge}>{t('task.card.timeBadge', { duration: formatDuration(task.totalSeconds, t) })}</span>
          )}
          {/* US-020 AC10: a compact "estimated" indicator, shown only when
              plannedMinutes is set — simple text, no progress bar/graphic
              (explicit scope decision, see USER_STORIES.md US-020 AC7). */}
          {task.plannedMinutes != null && (
            <span className={styles.plannedBadge}>
              {t('task.card.plannedBadge', { duration: formatDuration(task.plannedMinutes * 60, t) })}
            </span>
          )}
        </div>
      </div>
      <div className={styles.cardControls}>
        <label className={styles.srOnly} htmlFor={`task-status-${task.id}`}>
          {t('boardView.card.statusLabel')}
        </label>
        <select
          id={`task-status-${task.id}`}
          className={styles.statusSelect}
          value={task.status}
          disabled={!editable}
          onChange={(event) => onStatusChange(task, event.target.value)}
        >
          {COLUMNS.map((col) => (
            <option key={col.status} value={col.status}>
              {columnLabels[col.status]}
            </option>
          ))}
        </select>
        <button type="button" className={styles.openButton} onClick={() => onOpen(task)}>
          {t('task.card.open')}
        </button>
        {editable && (
          <button type="button" className={styles.deleteButton} onClick={() => onDelete(task)}>
            {t('task.delete.cta')}
          </button>
        )}
      </div>
    </li>
  );
}

function Column({ status, label, tasks, columnLabels, onDelete, onStatusChange, onOpen, t }) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className={styles.column}>
      <h2 className={styles.columnTitle}>{label}</h2>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className={styles.columnList}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columnLabels={columnLabels}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onOpen={onOpen}
              t={t}
            />
          ))}
          {tasks.length === 0 && <li className={styles.emptyColumn}>{t('boardView.column.empty')}</li>}
        </ul>
      </SortableContext>
    </div>
  );
}

// US-021 AC7 / US-023 AC6: category + language badges under the board
// title. Category resolves against the (active-only) competencies catalog
// fetched alongside the board (see `load()` below); a category that's since
// been deactivated (still assigned, per US-021 AC6) simply won't resolve and
// its badge is omitted — the board keeps the assignment, only the label
// can't be looked up. Language badges need no lookup: `board.languages`
// already carries {id, slug} pairs directly.
function BoardHeaderBadges({ board, categoryCatalog, t, styles }) {
  const categoryEntry = board.categoryId ? categoryCatalog.find((entry) => entry.id === board.categoryId) : null;
  const languages = board.languages || [];
  if (!categoryEntry && languages.length === 0) return null;

  return (
    <div className={styles.badgeRow}>
      {categoryEntry && <span className={styles.badge}>{t(`competency.${categoryEntry.slug}`)}</span>}
      {languages.map((lang) => (
        <span key={lang.id} className={styles.badge}>
          {t(`language.${lang.slug}`)}
        </span>
      ))}
    </div>
  );
}

// Board view (`/boards/:boardId`, US5-US8): three status columns, task
// create/delete, drag-and-drop reordering with an accessible fallback
// control, and a localized 403/404 page for a non-owner opening the URL
// directly.
function BoardViewPage() {
  const { boardId } = useParams();
  const { user, loading: authLoading } = useAuthUser();
  const { t, locale } = useI18n();

  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState(emptyColumns());
  const [pageState, setPageState] = useState('loading'); // loading | ready | forbidden | notFound | error
  const [bannerErrorKey, setBannerErrorKey] = useState(null);
  // US-021 AC7: the board's categoryId badge resolves against this
  // (active-only) catalog on the FE, same pattern as BoardsPage.jsx — the
  // Board response never carries the category's slug directly.
  const [categoryCatalog, setCategoryCatalog] = useState([]);

  const [creatingTask, setCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [taskErrorKey, setTaskErrorKey] = useState(null);
  const [submittingTask, setSubmittingTask] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingTask, setDeletingTask] = useState(false);

  const [panelTask, setPanelTask] = useState(null);
  const [sharingBoard, setSharingBoard] = useState(false);

  const dragSnapshot = useRef(null);

  useHeadMeta({
    title: board ? `${board.title} — ${t('app.name')}` : t('app.name'),
    description: t('boardView.description'),
  });

  const load = useCallback(async () => {
    if (!user) return;
    setPageState('loading');
    try {
      const idToken = await user.getIdToken();
      const [boardData, tasksData, catalogRes] = await Promise.all([
        getBoard(idToken, boardId),
        listTasks(idToken, boardId),
        listCompetencyCatalog(idToken).catch(() => ({ competencies: [] })),
      ]);
      setBoard(boardData);
      setColumns(groupByStatus(tasksData.tasks));
      setCategoryCatalog(catalogRes.competencies);
      setPageState('ready');
    } catch (err) {
      if (err.status === 403) setPageState('forbidden');
      else if (err.status === 404) setPageState('notFound');
      else setPageState('error');
    }
  }, [user, boardId]);

  useEffect(() => {
    load();
  }, [load]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findContainer = useCallback(
    (id) => {
      if (columns[id]) return id;
      return Object.keys(columns).find((key) => columns[key].some((task) => task.id === id));
    },
    [columns],
  );

  function handleDragStart() {
    dragSnapshot.current = columns;
    setBannerErrorKey(null);
  }

  // Live cross-column preview as the card is dragged — re-renders
  // immediately without a network round-trip (US8: "re-renders immediately
  // without a full page reload"). The persisted write happens in
  // handleDragEnd once the drop location is final.
  function handleDragOver(event) {
    const { active, over } = event;
    if (!over) return;
    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id) || over.id;
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((task) => task.id === active.id);
      if (activeIndex === -1) return prev;

      const overIndex = overItems.findIndex((task) => task.id === over.id);
      const movingTask = { ...activeItems[activeIndex], status: overContainer };
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;

      return {
        ...prev,
        [activeContainer]: activeItems.filter((task) => task.id !== active.id),
        [overContainer]: [...overItems.slice(0, insertAt), movingTask, ...overItems.slice(insertAt)],
      };
    });
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    const snapshot = dragSnapshot.current;
    dragSnapshot.current = null;

    if (!over) {
      if (snapshot) setColumns(snapshot);
      return;
    }

    const finalContainer = findContainer(active.id);
    if (!finalContainer) {
      if (snapshot) setColumns(snapshot);
      return;
    }

    let items = columns[finalContainer];
    const activeIndex = items.findIndex((task) => task.id === active.id);
    const overContainer = findContainer(over.id);
    let finalIndex = activeIndex;

    if (overContainer === finalContainer && over.id !== finalContainer) {
      const overIndex = items.findIndex((task) => task.id === over.id);
      if (overIndex !== -1 && overIndex !== activeIndex) {
        items = arrayMove(items, activeIndex, overIndex);
        finalIndex = overIndex;
        setColumns((prev) => ({ ...prev, [finalContainer]: items }));
      }
    }

    try {
      const idToken = await user.getIdToken();
      await updateTask(idToken, active.id, { status: finalContainer, position: finalIndex });
    } catch (err) {
      // Roll back to pre-drag state on a failed write — never let the UI
      // silently diverge from BE state (US8).
      if (snapshot) setColumns(snapshot);
      setBannerErrorKey(err.messageKey || 'errors.generic');
    }
  }

  // Accessible fallback control (US8) — identical effect to a drag, driven
  // by a plain <select>, reachable via Tab+Enter with no pointer required.
  async function handleStatusChange(task, newStatus) {
    if (newStatus === task.status) return;
    const snapshot = columns;
    const targetLength = snapshot[newStatus].length;

    setColumns((prev) => ({
      ...prev,
      [task.status]: prev[task.status].filter((t) => t.id !== task.id),
      [newStatus]: [...prev[newStatus], { ...task, status: newStatus }],
    }));

    try {
      const idToken = await user.getIdToken();
      await updateTask(idToken, task.id, { status: newStatus, position: targetLength });
    } catch (err) {
      setColumns(snapshot);
      setBannerErrorKey(err.messageKey || 'errors.generic');
    }
  }

  async function handleCreateTask(event) {
    event.preventDefault();
    const trimmed = newTaskTitle.trim();
    const trimmedDescription = newTaskDescription.trim();
    if (!trimmed) {
      setTaskErrorKey('task.create.validation.titleRequired');
      return;
    }
    if (trimmed.length > TITLE_MAX_LENGTH) {
      setTaskErrorKey('task.create.validation.titleTooLong');
      return;
    }
    if (trimmedDescription.length > DESCRIPTION_MAX_LENGTH) {
      setTaskErrorKey('task.create.validation.descriptionTooLong');
      return;
    }

    setSubmittingTask(true);
    setTaskErrorKey(null);
    try {
      const idToken = await user.getIdToken();
      const task = await createTask(idToken, boardId, { title: trimmed, notes: trimmedDescription || undefined });
      setColumns((prev) => ({ ...prev, planned: [...prev.planned, task] }));
      setNewTaskTitle('');
      setNewTaskDescription('');
      setCreatingTask(false);
    } catch (err) {
      setTaskErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setSubmittingTask(false);
    }
  }

  // Keeps the task card's attachment-count badge (US9) in sync with the
  // panel's own attachments list without a full task-list re-fetch — called
  // by TaskPanel whenever it loads or mutates its attachments.
  const handleAttachmentCountChange = useCallback((taskId, count) => {
    setColumns((prev) => {
      const next = { ...prev };
      for (const status of Object.keys(next)) {
        next[status] = next[status].map((task) => (task.id === taskId ? { ...task, attachmentCount: count } : task));
      }
      return next;
    });
  }, []);

  // Keeps the task card's time badge (US12 AC4) in sync with TaskPanel's own
  // time-tracking data, same shape as handleAttachmentCountChange above.
  const handleTimeSummaryChange = useCallback((taskId, totalSeconds) => {
    setColumns((prev) => {
      const next = { ...prev };
      for (const status of Object.keys(next)) {
        next[status] = next[status].map((task) => (task.id === taskId ? { ...task, totalSeconds } : task));
      }
      return next;
    });
  }, []);

  // Keeps the task card's title in sync after a rename in TaskPanel, without
  // a full task-list re-fetch — same shape as handleAttachmentCountChange
  // above. Also updates `panelTask` itself so the panel's own header reflects
  // the new title immediately (it's a separate piece of state from
  // `columns`, not a reference into it — see TaskPanelWithToken below).
  const handleTaskTitleUpdated = useCallback((taskId, title) => {
    setColumns((prev) => {
      const next = { ...prev };
      for (const status of Object.keys(next)) {
        next[status] = next[status].map((task) => (task.id === taskId ? { ...task, title } : task));
      }
      return next;
    });
    setPanelTask((prev) => (prev && prev.id === taskId ? { ...prev, title } : prev));
  }, []);

  // Same shape as handleTaskTitleUpdated above, for the task description
  // (`notes` field) edited in TaskPanel — keeps `panelTask` in sync so
  // reopening the panel for the same task without a full re-fetch shows the
  // saved value, not the stale one from when the panel first opened.
  const handleTaskNotesUpdated = useCallback((taskId, notes) => {
    setColumns((prev) => {
      const next = { ...prev };
      for (const status of Object.keys(next)) {
        next[status] = next[status].map((task) => (task.id === taskId ? { ...task, notes } : task));
      }
      return next;
    });
    setPanelTask((prev) => (prev && prev.id === taskId ? { ...prev, notes } : prev));
  }, []);

  // Same shape as handleTaskNotesUpdated above, for `plannedMinutes` (US-020)
  // edited/cleared in TaskPanel — keeps the board card's compact estimate
  // badge and `panelTask` in sync without a full task-list re-fetch.
  const handleTaskPlannedMinutesUpdated = useCallback((taskId, plannedMinutes) => {
    setColumns((prev) => {
      const next = { ...prev };
      for (const status of Object.keys(next)) {
        next[status] = next[status].map((task) => (task.id === taskId ? { ...task, plannedMinutes } : task));
      }
      return next;
    });
    setPanelTask((prev) => (prev && prev.id === taskId ? { ...prev, plannedMinutes } : prev));
  }, []);

  async function confirmDeleteTask() {
    if (!deleteTarget) return;
    setDeletingTask(true);
    try {
      const idToken = await user.getIdToken();
      await deleteTask(idToken, deleteTarget.id);
      setColumns((prev) => ({
        ...prev,
        [deleteTarget.status]: prev[deleteTarget.status].filter((task) => task.id !== deleteTarget.id),
      }));
      setDeleteTarget(null);
    } catch (err) {
      setBannerErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setDeletingTask(false);
    }
  }

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  if (pageState === 'forbidden' || pageState === 'notFound') {
    return (
      <div className={styles.page}>
        <AppHeader />
        <main className={styles.errorPage}>
          <h1>{t(pageState === 'forbidden' ? 'boardView.error.forbiddenTitle' : 'boardView.error.notFoundTitle')}</h1>
          <p>{t(pageState === 'forbidden' ? 'boardView.error.forbiddenBody' : 'boardView.error.notFoundBody')}</p>
          <Link to="/" className={styles.backLink}>
            {t('boardView.error.backToBoards')}
          </Link>
        </main>
      </div>
    );
  }

  const columnLabels = COLUMNS.reduce((acc, col) => ({ ...acc, [col.status]: t(col.labelKey) }), {});

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.headerRow}>
          <div>
            <Link to="/" className={styles.backLink}>
              {t('boardView.backToBoards')}
            </Link>
            <h1 className={styles.boardTitle}>{pageState === 'loading' ? t('boardView.loading') : board?.title}</h1>
            {pageState === 'ready' && board?.description && (
              <p className={styles.boardDescription}>{board.description}</p>
            )}
            {pageState === 'ready' && board && (
              <BoardHeaderBadges board={board} categoryCatalog={categoryCatalog} t={t} styles={styles} />
            )}
          </div>
          {pageState === 'ready' && (
            <div className={styles.headerActions}>
              {/* US13/US15: only the owner manages board_members — a
                  collaborator can write tasks/attachments but never sees
                  this control. */}
              {board?.myRole === 'owner' && (
                <button type="button" className={styles.shareButton} onClick={() => setSharingBoard(true)}>
                  {t('share.board.cta')}
                </button>
              )}
              {/* US15/US16: a viewer can't create tasks. */}
              {canWrite(board?.myRole) && (
                <button type="button" className={styles.createButton} onClick={() => setCreatingTask((v) => !v)}>
                  {t('task.create.cta')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* US-022 AC3: read-only visitor via board visibility=public, not a
            real board_members/task_shares grant — same read-only UI gate as
            a viewer (canWrite(myRole) already excludes 'public' below), plus
            this dedicated banner explaining why. */}
        {pageState === 'ready' && board?.myRole === 'public' && (
          <p className={styles.infoBanner} role="status">
            {t('sharing.publicViewerBanner')}
          </p>
        )}

        {bannerErrorKey && (
          <p className={styles.banner} role="alert">
            {t(bannerErrorKey)}
          </p>
        )}

        {pageState === 'error' && (
          <p className={styles.banner} role="alert">
            {t('errors.generic')}
          </p>
        )}

        {creatingTask && (
          <form className={styles.createForm} onSubmit={handleCreateTask} noValidate>
            <label className={styles.srOnly} htmlFor="new-task-title">
              {t('task.create.titlePlaceholder')}
            </label>
            <input
              id="new-task-title"
              className={styles.input}
              value={newTaskTitle}
              maxLength={TITLE_MAX_LENGTH}
              placeholder={t('task.create.titlePlaceholder')}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              autoFocus
            />
            <label className={styles.srOnly} htmlFor="new-task-description">
              {t('task.create.descriptionLabel')}
            </label>
            <textarea
              id="new-task-description"
              className={`${styles.input} ${styles.textarea}`}
              value={newTaskDescription}
              maxLength={DESCRIPTION_MAX_LENGTH}
              placeholder={t('task.create.descriptionPlaceholder')}
              onChange={(event) => setNewTaskDescription(event.target.value)}
            />
            {taskErrorKey && <span className={styles.fieldError}>{t(taskErrorKey)}</span>}
            <div className={styles.formActions}>
              <button type="submit" className={styles.submit} disabled={submittingTask}>
                {submittingTask ? t('task.create.saving') : t('task.create.submit')}
              </button>
              <button
                type="button"
                className={styles.cancel}
                onClick={() => {
                  setCreatingTask(false);
                  setNewTaskTitle('');
                  setNewTaskDescription('');
                  setTaskErrorKey(null);
                }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        )}

        {pageState === 'loading' ? (
          <p className={styles.hint}>{t('boardView.loading')}</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className={styles.columns}>
              {COLUMNS.map((col) => (
                <Column
                  key={col.status}
                  status={col.status}
                  label={columnLabels[col.status]}
                  tasks={columns[col.status]}
                  columnLabels={columnLabels}
                  onDelete={setDeleteTarget}
                  onStatusChange={handleStatusChange}
                  onOpen={setPanelTask}
                  t={t}
                />
              ))}
            </div>
          </DndContext>
        )}
      </main>

      {deleteTarget && (
        <ConfirmDialog
          title={t('task.delete.confirmTitle')}
          message={t('task.delete.confirmMessage', { title: deleteTarget.title })}
          confirmLabel={t('task.delete.confirmButton')}
          cancelLabel={t('common.cancel')}
          busy={deletingTask}
          onConfirm={confirmDeleteTask}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {panelTask && user && (
        <TaskPanelWithToken
          task={panelTask}
          user={user}
          t={t}
          locale={locale}
          onClose={() => setPanelTask(null)}
          onAttachmentCountChange={handleAttachmentCountChange}
          onTitleUpdated={handleTaskTitleUpdated}
          onNotesUpdated={handleTaskNotesUpdated}
          onTimeSummaryChange={handleTimeSummaryChange}
          onPlannedMinutesUpdated={handleTaskPlannedMinutesUpdated}
        />
      )}

      {sharingBoard && user && (
        <BoardShareWithToken boardId={boardId} user={user} t={t} onClose={() => setSharingBoard(false)} />
      )}
    </div>
  );
}

// TaskPanel needs the caller's current Firebase ID token for every API call
// (same `user.getIdToken()` pattern as every other action on this page), but
// that's an async call — this tiny wrapper resolves it once when the panel
// opens and only then mounts TaskPanel, instead of threading token-loading
// state through the panel component itself.
function TaskPanelWithToken({
  task,
  user,
  t,
  locale,
  onClose,
  onAttachmentCountChange,
  onTitleUpdated,
  onNotesUpdated,
  onTimeSummaryChange,
  onPlannedMinutesUpdated,
}) {
  const [idToken, setIdToken] = useState(null);

  useEffect(() => {
    let cancelled = false;
    user.getIdToken().then((token) => {
      if (!cancelled) setIdToken(token);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!idToken) return null;

  return (
    <TaskPanel
      task={task}
      idToken={idToken}
      t={t}
      locale={locale}
      onClose={onClose}
      onAttachmentCountChange={onAttachmentCountChange}
      onTitleUpdated={onTitleUpdated}
      onNotesUpdated={onNotesUpdated}
      onTimeSummaryChange={onTimeSummaryChange}
      onPlannedMinutesUpdated={onPlannedMinutesUpdated}
    />
  );
}

// Same token-resolution wrapper shape as TaskPanelWithToken above, for
// SharePanel (US13). `api` binds SharePanel's generic list/add/updateRole/
// remove calls to this specific board's board_members endpoints — see
// SharePanel.jsx's header comment for why the component itself never
// branches on board-vs-task.
function BoardShareWithToken({ boardId, user, t, onClose }) {
  const [idToken, setIdToken] = useState(null);

  useEffect(() => {
    let cancelled = false;
    user.getIdToken().then((token) => {
      if (!cancelled) setIdToken(token);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!idToken) return null;

  const api = {
    list: (token) => listBoardMembers(token, boardId).then((data) => data.members),
    add: (token, payload) => addBoardMember(token, boardId, payload),
    updateRole: (token, memberId, payload) => updateBoardMemberRole(token, boardId, memberId, payload),
    remove: (token, memberId) => removeBoardMember(token, boardId, memberId),
  };

  return <SharePanel panelTitleKey="share.board.panelTitle" idToken={idToken} api={api} t={t} onClose={onClose} />;
}

export default BoardViewPage;
