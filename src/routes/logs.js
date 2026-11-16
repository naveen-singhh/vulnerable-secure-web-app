const express = require('express');
const { initializeDatabase } = require('../db/database');

const router = express.Router();

router.get('/', (request, response) => {
  const database = initializeDatabase();
  const logs = database.prepare(`
    SELECT
      created_at AS createdAt,
      event_type AS eventType,
      mode,
      test_status AS testStatus,
      details
    FROM security_logs
    ORDER BY id DESC
  `).all();

  return response.json({ logs });
});

module.exports = router;
