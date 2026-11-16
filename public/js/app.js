const pages = [
  { id: 'dashboard', label: 'Dashboard', href: '/', icon: '⌂' },
  { id: 'sqli', label: 'SQL Injection Lab', href: '/sqli.html', icon: 'DB' },
  { id: 'xss', label: 'XSS Lab', href: '/xss.html', icon: '</>' },
  { id: 'logs', label: 'Security Logs', href: '/logs.html', icon: '≡' }
];

function renderSidebar() {
  const slot = document.querySelector('#sidebar-slot');
  const activePage = document.body.dataset.page;

  if (!slot) {
    return;
  }

  const links = pages.map((page) => {
    const active = page.id === activePage;
    return `<a class="side-link${active ? ' active' : ''}" href="${page.href}"${active ? ' aria-current="page"' : ''}>
      <span class="nav-icon" aria-hidden="true">${page.icon}</span><span>${page.label}</span>
    </a>`;
  }).join('');

  slot.innerHTML = `<aside class="sidebar" id="sidebar">
    <a class="brand" href="/" aria-label="Vulnerable vs Secure Web App dashboard">
      <span class="brand-mark" aria-hidden="true">VS</span>
      <span><span class="brand-name">SECURITY LAB</span><span class="brand-caption">LEARN · TEST · SECURE</span></span>
    </a>
    <div class="nav-caption">WORKSPACE</div>
    <nav class="side-nav" aria-label="Main navigation">${links}</nav>
    <div class="sidebar-bottom">
      <div class="local-badge"><span class="status-dot"></span><span><strong>Local environment</strong><small>127.0.0.1 · fictional data</small></span></div>
      <div class="sidebar-footer">Local security demo</div>
    </div>
  </aside>`;
}

function setupMobileNavigation() {
  const toggle = document.querySelector('.menu-toggle');
  const backdrop = document.querySelector('[data-sidebar-close]');

  function closeSidebar() {
    document.body.classList.remove('sidebar-open');
    toggle?.setAttribute('aria-expanded', 'false');
  }

  toggle?.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('sidebar-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
  backdrop?.addEventListener('click', closeSidebar);
  document.querySelectorAll('.side-link').forEach((link) => {
    link.addEventListener('click', closeSidebar);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeSidebar();
    }
  });
}

function showSqliResult(container, payload) {
  container.replaceChildren();

  const summary = document.createElement('p');
  summary.textContent = payload.summary;
  container.append(summary);

  const status = document.createElement('p');
  status.textContent = `Status: ${payload.testStatus} · ${payload.resultCount} result(s)`;
  container.append(status);

  if (payload.users.length > 0) {
    const list = document.createElement('ul');
    payload.users.forEach((user) => {
      const item = document.createElement('li');
      item.textContent = `${user.displayName} (${user.username})`;
      list.append(item);
    });
    container.append(list);
  } else {
    const emptyResult = document.createElement('p');
    emptyResult.textContent = 'No matching demo accounts.';
    container.append(emptyResult);
  }
}

function setupSqliForm() {
  const form = document.querySelector('#sqli-form');
  const result = document.querySelector('#sqli-result');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    try {
      const response = await fetch('/api/sqli/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.get('username'),
          mode: formData.get('mode')
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || `The server returned status ${response.status}.`);
      }
      showSqliResult(result, payload);
    } catch (error) {
      console.error('SQL injection lab request failed:', error);
      result.textContent = error.message || 'The local SQL injection test could not be completed.';
    }
  });
}

function renderXssResult(container, payload, status, summary) {
  container.replaceChildren();
  status.textContent = payload.testStatus;
  summary.textContent = payload.summary;

  if (payload.mode === 'secure') {
    const comment = document.createElement('p');
    comment.textContent = payload.comment;
    container.append(comment);
    return;
  }

  const frame = document.createElement('iframe');
  frame.className = 'sandbox-preview';
  frame.title = 'Isolated vulnerable comment rendering preview';
  frame.setAttribute('sandbox', 'allow-scripts');
  // Deliberately interpret the submitted HTML, but isolate it from the application and network.
  frame.srcdoc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline';"><style>body{font:14px system-ui,sans-serif;color:#14263b;padding:8px;margin:0}</style></head><body>${payload.comment}</body></html>`;
  container.append(frame);
}

function setupXssForm() {
  const form = document.querySelector('#xss-form');
  const commentInput = document.querySelector('#comment');
  const preview = document.querySelector('#comment-preview');
  const status = document.querySelector('#xss-status');
  const summary = document.querySelector('#xss-summary');
  const sampleButton = document.querySelector('#use-xss-poc');

  sampleButton?.addEventListener('click', () => {
    commentInput.value = "<script>document.body.innerText = 'Harmless XSS proof of concept executed in sandbox';</script>";
    commentInput.focus();
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    try {
      const response = await fetch('/api/xss/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: formData.get('comment'),
          mode: formData.get('mode')
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || `The server returned status ${response.status}.`);
      }
      renderXssResult(preview, payload, status, summary);
    } catch (error) {
      console.error('XSS lab request failed:', error);
      status.textContent = 'REQUEST FAILED';
      summary.textContent = error.message || 'The local XSS test could not be completed.';
    }
  });
}

function addLogCell(row, value) {
  const cell = document.createElement('td');
  cell.textContent = value;
  row.append(cell);
  return cell;
}

function formatLogDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function renderSecurityLogs(logsBody, logs) {
  logsBody.replaceChildren();

  if (logs.length === 0) {
    const row = document.createElement('tr');
    const cell = addLogCell(row, 'No suspicious lab events have been recorded.');
    cell.colSpan = 5;
    cell.className = 'empty-state';
    logsBody.append(row);
    return;
  }

  logs.forEach((log) => {
    const row = document.createElement('tr');
    addLogCell(row, formatLogDate(log.createdAt));
    addLogCell(row, log.eventType);

    const modeCell = addLogCell(row, '');
    const modeBadge = document.createElement('span');
    modeBadge.className = `event-pill ${log.mode === 'vulnerable' ? 'event-pill-danger' : 'event-pill-safe'}`;
    modeBadge.textContent = log.mode;
    modeCell.append(modeBadge);

    const statusCell = addLogCell(row, '');
    const statusBadge = document.createElement('span');
    const statusClass = log.testStatus === 'BLOCKED' || log.testStatus === 'SAFE'
      ? 'event-pill-safe'
      : log.testStatus === 'DEMONSTRATED' || log.testStatus === 'DETECTED'
        ? 'event-pill-danger'
        : 'event-pill-neutral';
    statusBadge.className = `event-pill ${statusClass}`;
    statusBadge.textContent = log.testStatus;
    statusCell.append(statusBadge);

    addLogCell(row, log.details);
    logsBody.append(row);
  });
}

async function loadSecurityLogs() {
  const logsBody = document.querySelector('#logs-body');
  if (!logsBody) {
    return;
  }

  try {
    const response = await fetch('/api/logs');
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || `The server returned status ${response.status}.`);
    }
    renderSecurityLogs(logsBody, payload.logs);
  } catch (error) {
    console.error('Security logs request failed:', error);
    logsBody.replaceChildren();
    const row = document.createElement('tr');
    const cell = addLogCell(row, error.message || 'The security logs could not be loaded.');
    cell.colSpan = 5;
    cell.className = 'empty-state';
    logsBody.append(row);
  }
}

renderSidebar();
setupMobileNavigation();
setupSqliForm();
setupXssForm();
loadSecurityLogs();
