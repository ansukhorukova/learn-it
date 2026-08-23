const express = require('express');

const requireAuth = require('../middleware/auth.middleware');
const { sendServiceError } = require('../lib/apiError');
const boardsService = require('../services/boards.service');
const tasksService = require('../services/tasks.service');

const router = express.Router();

// Every route below requires auth and scopes strictly to the caller's own
// boards (req.firebaseUser.uid) — ownership is re-checked in the service
// layer on every call, not inferred from the URL alone (CLAUDE.md: BE is the
// single point of authorization).

// GET /api/v1/boards — boards overview (US1). No "shared with me" section
// this pass — sharing doesn't exist yet.
router.get('/', requireAuth, async (req, res) => {
  try {
    const boards = await boardsService.listBoardsForOwner(req.firebaseUser.uid);
    res.json({ boards });
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

// GET /api/v1/boards/:id/tasks — task list for board view (US5).
router.get('/:id/tasks', requireAuth, async (req, res) => {
  try {
    const tasks = await tasksService.listTasksForBoard(req.params.id, req.firebaseUser.uid);
    res.json({ tasks });
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

module.exports = router;
