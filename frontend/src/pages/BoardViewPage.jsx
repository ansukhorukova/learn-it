import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { DndContext, KeyboardSensor, PointerSensor, closestCorners, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useAuthUser } from '../auth/useAuthUser';
import { useI18n } from '../i18n/I18nProvider';
import { useHeadMeta } from '../lib/useHeadMeta';
import { createTask, deleteTask, getBoard, listTasks, updateTask } from '../api/client';
import AppHeader from '../components/AppHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import styles from './BoardViewPage.module.css';

const TITLE_MAX_LENGTH = 200;

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
function TaskCard({ task, columnLabels, onDelete, onStatusChange, t }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className={styles.card}>
      <div className={styles.cardHandle} {...attributes} {...listeners}>
        <span className={styles.cardTitle}>{task.title}</span>
      </div>
      <div className={styles.cardControls}>
        <label className={styles.srOnly} htmlFor={`task-status-${task.id}`}>
          {t('boardView.card.statusLabel')}
        </label>
        <select
          id={`task-status-${task.id}`}
          className={styles.statusSelect}
          value={task.status}
          onChange={(event) => onStatusChange(task, event.target.value)}
        >
          {COLUMNS.map((col) => (
            <option key={col.status} value={col.status}>
              {columnLabels[col.status]}
            </option>
          ))}
        </select>
        <button type="button" className={styles.deleteButton} onClick={() => onDelete(task)}>
          {t('task.delete.cta')}
        </button>
      </div>
    </li>
  );
}

function Column({ status, label, tasks, columnLabels, onDelete, onStatusChange, t }) {
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
              t={t}
            />
          ))}
          {tasks.length === 0 && <li className={styles.emptyColumn}>{t('boardView.column.empty')}</li>}
        </ul>
      </SortableContext>
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
  const { t } = useI18n();

  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState(emptyColumns());
  const [pageState, setPageState] = useState('loading'); // loading | ready | forbidden | notFound | error
  const [bannerErrorKey, setBannerErrorKey] = useState(null);

  const [creatingTask, setCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [taskErrorKey, setTaskErrorKey] = useState(null);
  const [submittingTask, setSubmittingTask] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingTask, setDeletingTask] = useState(false);

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
      const [boardData, tasksData] = await Promise.all([getBoard(idToken, boardId), listTasks(idToken, boardId)]);
      setBoard(boardData);
      setColumns(groupByStatus(tasksData.tasks));
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
    if (!trimmed) {
      setTaskErrorKey('task.create.validation.titleRequired');
      return;
    }
    if (trimmed.length > TITLE_MAX_LENGTH) {
      setTaskErrorKey('task.create.validation.titleTooLong');
      return;
    }

    setSubmittingTask(true);
    setTaskErrorKey(null);
    try {
      const idToken = await user.getIdToken();
      const task = await createTask(idToken, boardId, { title: trimmed });
      setColumns((prev) => ({ ...prev, planned: [...prev.planned, task] }));
      setNewTaskTitle('');
      setCreatingTask(false);
    } catch (err) {
      setTaskErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setSubmittingTask(false);
    }
  }

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
          </div>
          {pageState === 'ready' && (
            <button type="button" className={styles.createButton} onClick={() => setCreatingTask((v) => !v)}>
              {t('task.create.cta')}
            </button>
          )}
        </div>

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
    </div>
  );
}

export default BoardViewPage;
