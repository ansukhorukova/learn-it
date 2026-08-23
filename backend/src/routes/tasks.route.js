const express = require('express');

const requireAuth = require('../middleware/auth.middleware');
const { sendServiceError } = require('../lib/apiError');
const tasksService = require('../services/tasks.service');

const router = express.Router();

// PATCH /api/v1/tasks/:id — title and/or status+position (drag-and-drop and
// its accessible fallback control both call this, US8). Ownership is
// re-derived through the task's parent board on every call (see
// tasks.service.js's getOwnedTaskWithBoard) — never trust the URL alone.
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const task = await tasksService.updateTask(req.params.id, req.firebaseUser.uid, req.body || {});
    res.json(task);
  } catch (err) {
    sendServiceError(res, err);
  }
});

// DELETE /api/v1/tasks/:id — delete task (US7).
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await tasksService.deleteTask(req.params.id, req.firebaseUser.uid);
    res.status(204).end();
  } catch (err) {
    sendServiceError(res, err);
  }
});

module.exports = router;
