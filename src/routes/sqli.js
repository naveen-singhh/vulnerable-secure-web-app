const express = require('express');
const { initializeDatabase } = require('../db/database');

const router = express.Router();
const suspiciousSqlPattern = /(?:['"]\s*(?:OR|AND)\b|--|\/\*|\bUNION\s+SELECT\b|\bOR\b\s+1\s*=\s*1)/i;
const selectColumns = 'id, username, display_name AS displayName';

function logSuspiciousAttempt(database, mode, testStatus) {
  const details = mode === 'secure'
    ? 'Suspicious SQL-like input was bound as a value.'
    : 'Suspicious SQL-like input reached the local vulnerable query.';

  database.prepare(`
    INSERT INTO security_logs (event_type, mode, test_status, details)
    VALUES ('SQLI', ?, ?, ?)
  `).run(mode, testStatus, details);
}

router.post('/test', (request, response) => {
  const { username, mode } = request.body ?? {};

  if (typeof username !== 'string' || typeof mode !== 'string') {
    return response.status(400).json({ error: 'Provide a username and implementation mode.' });
  }

  const searchTerm = username.trim();
  if (searchTerm.length < 1 || searchTerm.length > 80 || /[\u0000-\u001f\u007f]/.test(searchTerm)) {
    return response.status(400).json({ error: 'Username must be 1–80 characters without control characters.' });
  }

  if (!['vulnerable', 'secure'].includes(mode)) {
    return response.status(400).json({ error: 'Mode must be vulnerable or secure.' });
  }

  const database = initializeDatabase();
  const suspicious = suspiciousSqlPattern.test(searchTerm);
  let users;

  if (mode === 'vulnerable') {
    const unsafeQuery = `SELECT ${selectColumns} FROM users WHERE username = '${searchTerm}' LIMIT 5`;
    try {
      users = database.prepare(unsafeQuery).all();
    } catch (error) {
      if (error.code !== 'SQLITE_ERROR') {
        throw error;
      }

      if (suspicious) {
        logSuspiciousAttempt(database, mode, 'DETECTED');
      }
      return response.status(400).json({ error: 'The local demo query could not parse that input.' });
    }
  } else {
    const safeQuery = `SELECT ${selectColumns} FROM users WHERE username = ? LIMIT 5`;
    users = database.prepare(safeQuery).all(searchTerm);
  }

  let testStatus = 'SAFE';
  if (suspicious) {
    testStatus = mode === 'secure'
      ? 'BLOCKED'
      : users.length > 1 ? 'DEMONSTRATED' : 'DETECTED';
    logSuspiciousAttempt(database, mode, testStatus);
  }

  const summary = mode === 'secure'
    ? 'The username was bound as a value; it did not change the query structure.'
    : suspicious && users.length > 1
      ? 'The input changed the local query result. Only fictional sample accounts were returned.'
      : 'The local demo used unsafe string construction. Try the suggested lab input to observe the difference.';

  return response.json({
    mode,
    suspicious,
    testStatus,
    summary,
    resultCount: users.length,
    users
  });
});

module.exports = router;
