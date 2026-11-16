# Vulnerable vs Secure Web App

A localhost-only educational demo demonstrating SQL injection (SQLi), cross-site scripting (XSS), and basic security-event monitoring.

## Requirements

- Node.js 20 or newer
- npm

## Run the application

Open PowerShell in this project folder and run:

```powershell
npm install
npm start
```

Open `http://127.0.0.1:3000`. The server binds to `127.0.0.1` only and is not exposed on the local network.

The SQLite database is created automatically at `data/app.sqlite` on startup. It contains three fictional demo accounts and the tables `users`, `comments`, and `security_logs`. To initialize it without starting the web server, run:

```powershell
node src/db/database.js
```

To stop the server, press **Ctrl+C** in the terminal where it is running.

## Pages

| Page | URL | Purpose |
|---|---|---|
| Dashboard | `/` | Project overview and navigation |
| SQL Injection Lab | `/sqli.html` | Compare an unsafe, read-only local query with a parameterized query |
| XSS Lab | `/xss.html` | Compare isolated vulnerable HTML rendering with safe text rendering |
| Security Logs | `/logs.html` | Review suspicious SQLi and XSS demonstrations |

### Try the demonstrations

1. In the SQLi lab, search for `demo_guest` in **Secure** mode. Then select **Vulnerable** and try the example shown on the page. The vulnerable branch can change the result of its local query; the secure branch treats the same value as data.
2. In the XSS lab, select **Use harmless proof of concept**. In **Vulnerable** mode, the proof changes text inside a sandboxed preview. In **Secure** mode, the same input is displayed literally.
3. Open Security Logs to review suspicious tests, their mode, result, and timestamp. Raw test input is not written to log details.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Local server health |
| `POST` | `/api/sqli/test` | Search demo users in `vulnerable` or `secure` mode |
| `POST` | `/api/xss/comments` | Store and render a comment in the selected mode |
| `GET` | `/api/logs` | Read all security events |

The demonstration APIs accept JSON. SQLi requests use `username` and `mode`; XSS requests use `comment` and `mode`. The accepted modes are `vulnerable` and `secure`.

## Safety notes

- This is a deliberately vulnerable educational application. **Never deploy it or expose it to a network.**
- The server listens on the loopback address `127.0.0.1`. The vulnerable SQLi branch performs one read-only query against the fictional `users` table; it cannot run multiple statements.
- The vulnerable XSS preview runs in a sandboxed iframe with a restrictive Content Security Policy. Its harmless proof of concept only changes text in that frame.
- The secure SQLi branch uses a prepared statement. Secure XSS output uses `textContent`.
- No passwords, real accounts, or real personal information are used.
- Comments are stored in the local SQLite database. Security logs store event metadata and generic details, not the submitted test value.

## Folder structure

```text
vulnerable-secure-web-app/
├── data/                       # generated local SQLite database (ignored by Git)
├── public/
│   ├── css/styles.css
│   ├── js/app.js
│   ├── index.html
│   ├── sqli.html
│   ├── xss.html
│   └── logs.html
├── src/
│   ├── db/database.js
│   ├── routes/
│   │   ├── logs.js
│   │   ├── sqli.js
│   │   └── xss.js
│   └── server.js
├── .gitignore
├── package.json
└── package-lock.json
```
