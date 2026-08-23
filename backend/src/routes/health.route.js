const express = require('express');

const router = express.Router();

// GET /api/v1/health — unauthenticated liveness check.
router.get('/', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
