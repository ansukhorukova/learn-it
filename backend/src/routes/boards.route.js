const express = require('express');

const requireAuth = require('../middleware/auth.middleware');
const { sendServiceError } = require('../lib/apiError');
const boardsService = require('../services/boards.service');
const tasksService = require('../services/tasks.service');
const timeEntriesService = require('../services/timeEntries.service');
const boardMembersService = require('../services/boardMembers.service');

const router = express.Router();

// Every route below requires auth; access is re-checked in the service layer
// on every call, not inferred from the URL alone (CLAUDE.md: BE is the
// single point of authorization). Since US13-US17, that check is no longer
// strict ownership everywhere — GET /:id and /:id/tasks accept a shared
// board's collaborator/viewer too (lib/authz.js's requireBoardRole); rename/
// delete/members-management stay owner-only (getOwnedBoard).

// GET /api/v1/boards — boards overview (US1). Still scoped strictly to
// boards owned by the caller — "shared with me" is explicitly out of scope
// for the US13-US17 pass that added board_members/task_shares; a shared
// board is reachable directly via its URL (GET /:id below), just not listed
// here yet. `totalSeconds`/`thisWeekSeconds` (US12 AC6) come from a separate
// aggregate query, merged onto each board here rather than inside
// boardsService — keeps boards.service.js and timeEntries.service.js
// decoupled from each other (see timeTotalsForTasks's header comment in
// timeEntries.service.js for the matching reasoning on the tasks side).
router.get('/', requireAuth, async (req, res) => {
  try {
    const boards = await boardsService.listBoardsForOwner(req.firebaseUser.uid);
    const totals = await timeEntriesService.timeTotalsForBoards(
      boards.map((board) => board.id),
      req.firebaseUser.uid,
    );
    const enriched = boards.map((board) => {
      const boardTotals = totals.get(board.id) || { totalSeconds: 0, thisWeekSeconds: 0 };
      return { ...board, totalSeconds: boardTotals.totalSeconds, thisWeekSeconds: boardTotals.thisWeekSeconds };
    });
    res.json({ boards: enriched });
  } catch (err) {
    sendServiceError(res, err);
  }
});

// POST /api/v1/boards — create board (US2).
router.post('/', requireAuth, async (req, res) => {
  try {
    const board = await boardsService.createBoard(req.firebaseUser.uid, req.body || {});
    res.status(201).json(board);
  } catch (err) {
    sendServiceError(res, err);
  }
});

// GET /api/v1/boards/:id — single board (board view header, US5).
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const board = await boardsService.getBoardForOwner(req.params.id, req.firebaseUser.uid);
    res.json(board);
  } catch (err) {
    sendServiceError(res, err);
  }
});

// PATCH /api/v1/boards/:id — rename / update board (US3).
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const board = await boardsService.updateBoard(req.params.id, req.firebaseUser.uid, req.body || {});
    res.json(board);
  } catch (err) {
    sendServiceError(res, err);
  }
});

// DELETE /api/v1/boards/:id — delete board, cascades tasks (US4).
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await boardsService.deleteBoard(req.params.id, req.firebaseUser.uid);
    res.status(204).end();
  } catch (err) {
    sendServiceError(res, err);
  }
});

// GET /api/v1/boards/:id/tasks — task list for board view (US5). Each task
// gets `totalSeconds` (US12 AC4), and the response is wrapped with
// `columnTotals`/`boardTotalSeconds` (US12 AC5) — both computed here, after
// tasksService.listTasksForBoard has already done its ownership check, from
// a separate time-entries aggregate query merged onto the task list. See
// timeTotalsForTasks's header comment (timeEntries.service.js) for why this
// isn't folded into that service's own query.
router.get('/:id/tasks', requireAuth, async (req, res) => {
  try {
    // US13-US17: listTasksForBoard now requires only board-level access
    // (owner or board_members, never a task_shares-only grant — see its
    // header comment) and returns the caller's board-level `myRole`
    // alongside the tasks, each of which also carries its own effective
    // `myRole` (board role, unless elevated by a task-level share on that
    // specific task).
    const { tasks, boardRole } = await tasksService.listTasksForBoard(req.params.id, req.firebaseUser.uid);
    const timeTotals = await timeEntriesService.timeTotalsForTasks(
      tasks.map((task) => task.id),
      req.firebaseUser.uid,
    );

    const columnTotals = { planned: 0, in_progress: 0, done: 0 };
    let boardTotalSeconds = 0;
    const enrichedTasks = tasks.map((task) => {
      const totalSeconds = timeTotals.get(task.id) || 0;
      columnTotals[task.status] += totalSeconds;
      boardTotalSeconds += totalSeconds;
      return { ...task, totalSeconds };
    });

    res.json({ tasks: enrichedTasks, columnTotals, boardTotalSeconds, myRole: boardRole });
  } catch (err) {
    sendServiceError(res, err);
  }
});

// POST /api/v1/boards/:id/tasks — create task, appended to Planned (US6).
router.post('/:id/tasks', requireAuth, async (req, res) => {
  try {
    const task = await tasksService.createTask(req.params.id, req.firebaseUser.uid, req.body || {});
    res.status(201).json(task);
  } catch (err) {
    sendServiceError(res, err);
  }
});

// board_members CRUD (US13) — sharing a whole board by email, role
// viewer/collaborator. Owner-only on every route below (boardMembersService,
// via lib/authz.js's getOwnedBoard) — a collaborator/viewer gets
// errors.board.ownerOnly, never a bare 403 with no explanation (US15/US17).

// GET /api/v1/boards/:id/members — list a board's members.
router.get('/:id/members', requireAuth, async (req, res) => {
  try {
    const members = await boardMembersService.listMembers(req.params.id, req.firebaseUser.uid);
    res.json({ members });
  } catch (err) {
    sendServiceError(res, err);
  }
});

// POST /api/v1/boards/:id/members — share the board with an email (US13).
// Re-sharing an already-member email is idempotent: it updates their role
// rather than erroring (US17 duplicate-share decision, see
// boardMembers.service.js's addMember).
router.post('/:id/members', requireAuth, async (req, res) => {
  try {
    const member = await boardMembersService.addMember(req.params.id, req.firebaseUser.uid, req.body || {});
    res.status(201).json(member);
  } catch (err) {
    sendServiceError(res, err);
  }
});

// PATCH /api/v1/boards/:id/members/:memberId — change a member's role.
router.patch('/:id/members/:memberId', requireAuth, async (req, res) => {
  try {
    const member = await boardMembersService.updateMemberRole(
      req.params.id,
      req.params.memberId,
      req.firebaseUser.uid,
      req.body || {},
    );
    res.json(member);
  } catch (err) {
    sendServiceError(res, err);
  }
});

// DELETE /api/v1/boards/:id/members/:memberId — revoke a member's access.
router.delete('/:id/members/:memberId', requireAuth, async (req, res) => {
  try {
    await boardMembersService.removeMember(req.params.id, req.params.memberId, req.firebaseUser.uid);
    res.status(204).end();
  } catch (err) {
    sendServiceError(res, err);
  }
});

module.exports = router;
