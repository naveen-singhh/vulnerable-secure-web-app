const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const dataDirectory = path.join(__dirname, '..', '..', 'data');
const databasePath = path.join(dataDirectory, 'app.sqlite');
let database;

function initializeDatabase() {
  if (database) {
    return database;
  }

  fs.mkdirSync(dataDirectory, { recursive: true });
  database = new Database(databasePath);
  database.pragma('foreign_keys = ON');

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY,
      mode TEXT NOT NULL CHECK (mode IN ('vulnerable', 'secure')),
      body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS security_logs (
      id INTEGER PRIMARY KEY,
      event_type TEXT NOT NULL CHECK (event_type IN ('SQLI', 'XSS')),
      mode TEXT NOT NULL CHECK (mode IN ('vulnerable', 'secure')),
      test_status TEXT NOT NULL CHECK (
        test_status IN ('DETECTED', 'BLOCKED', 'DEMONSTRATED', 'SAFE')
      ),
      details TEXT NOT NULL DEFAULT '' CHECK (length(details) <= 500),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  const insertUser = database.prepare(
    'INSERT OR IGNORE INTO users (username, display_name) VALUES (?, ?)'
  );
  const seedUsers = database.transaction((users) => {
    for (const user of users) {
      insertUser.run(user.username, user.displayName);
    }
  });

  seedUsers([
    { username: 'demo_admin', displayName: 'Demo Admin' },
    { username: 'demo_guest', displayName: 'Demo Guest' },
    { username: 'demo_student', displayName: 'Demo Student' }
  ]);

  return database;
}

if (require.main === module) {
  initializeDatabase();
  console.log(`SQLite database initialized at ${databasePath}`);
}

module.exports = { initializeDatabase };
