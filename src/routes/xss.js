const express = require('express');
const { initializeDatabase } = require('../db/database');

const router = express.Router();
const suspiciousXssPattern = /<\s*script\b|\bon[a-z]+\s*=|javascript\s*:/i;
const allowedControlCharacters = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

router.post('/comments', (request, response) => {
  const { comment, mode } = request.body ?? {};

  if (typeof comment !== 'string' || typeof mode !== 'string') {
    return response.status(400).json({ error: 'Provide a comment and rendering mode.' });
  }

  const body = comment.trim();
  if (body.length < 1 || body.length > 1000 || allowedControlCharacters.test(body)) {
    return response.status(400).json({ error: 'Comment must be 1–1000 characters and contain no invalid control characters.' });
  }

  if (!['vulnerable', 'secure'].includes(mode)) {
    return response.status(400).json({ error: 'Mode must be vulnerable or secure.' });
  }

  const database = initializeDatabase();
  const suspicious = suspiciousXssPattern.test(body);
  const insertComment = database.prepare(
    'INSERT INTO comments (mode, body) VALUES (?, ?)'
  );
  const result = insertComment.run(mode, body);

  let testStatus = 'SAFE';
  if (suspicious) {
    testStatus = mode === 'secure' ? 'BLOCKED' : 'DEMONSTRATED';
    const details = mode === 'secure'
      ? 'Suspicious markup was stored but will be rendered as text.'
      : 'Suspicious markup was submitted to the isolated vulnerable renderer.';
    database.prepare(`
      INSERT INTO security_logs (event_type, mode, test_status, details)
      VALUES ('XSS', ?, ?, ?)
    `).run(mode, testStatus, details);
  }

  return response.status(201).json({
    id: Number(result.lastInsertRowid),
    mode,
    comment: body,
    suspicious,
    testStatus,
    summary: mode === 'secure'
      ? 'The comment will be displayed as text, not interpreted as HTML.'
      : 'The comment will be interpreted as HTML inside a restricted sandbox.'
  });
});

module.exports = router;
