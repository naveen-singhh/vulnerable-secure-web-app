const express = require('express');
const path = require('node:path');
const { initializeDatabase } = require('./db/database');
const logsRouter = require('./routes/logs');
const sqliRouter = require('./routes/sqli');
const xssRouter = require('./routes/xss');

const app = express();
const host = '127.0.0.1';
const port = Number(process.env.PORT) || 3000;
const publicDirectory = path.join(__dirname, '..', 'public');
const bootstrapDirectory = path.join(__dirname, '..', 'node_modules', 'bootstrap', 'dist');

initializeDatabase();

app.disable('x-powered-by');
app.use(express.json({ limit: '2kb' }));
app.use('/vendor/bootstrap', express.static(bootstrapDirectory));
app.use(express.static(publicDirectory));
app.use('/api/sqli', sqliRouter);
app.use('/api/xss', xssRouter);
app.use('/api/logs', logsRouter);

app.get('/health', (request, response) => {
  response.json({ status: 'ok' });
});

app.listen(port, host, () => {
  console.log(`Vulnerable vs Secure Web App available at http://${host}:${port}`);
});
