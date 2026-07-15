// ============================================================
//  verwaltung-x7k2p.js
//  Manages new articles in localStorage and allows exporting
//  them as JSON (to paste into news.json).
// ============================================================


// ---------- Dark Mode ----------

const THEME_KEY = 'vamos_theme';
const themeToggle = document.getElementById('themeToggle');

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(THEME_KEY, 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem(THEME_KEY, 'dark');
    }
  });
}


// ---------- Password protection ----------
// Note: this is client-side protection without a real server.
// It keeps out casual visitors/search engines, but it is not
// truly "secure" against someone who deliberately inspects the
// source code. Real security would require a server with proper
// login.

const PASSWORD_HASH = '04243b494f615e822ea570d4c2599cd6020a219397fbebcfb1edd30f37e3bcb6';
const AUTH_KEY = 'vamos_admin_auth';

const loginGate = document.getElementById('loginGate');
const adminContent = document.getElementById('adminContent');
const loginForm = document.getElementById('loginForm');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

async function hashPassword(text) {
  const encoded = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function showAdmin() {
  loginGate.hidden = true;
  adminContent.hidden = false;
  if (!adminPanelInitialized) {
    initAdminPanel();
    adminPanelInitialized = true;
  }
}

let adminPanelInitialized = false;

function showLogin() {
  adminContent.hidden = true;
  loginGate.hidden = false;
}

// Already logged in during this browser session?
if (sessionStorage.getItem(AUTH_KEY) === 'true') {
  showAdmin();
} else {
  showLogin();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const entered = await hashPassword(loginPassword.value);

  if (entered === PASSWORD_HASH) {
    sessionStorage.setItem(AUTH_KEY, 'true');
    loginError.hidden = true;
    loginForm.reset();
    showAdmin();
  } else {
    loginError.hidden = false;
    loginPassword.value = '';
    loginPassword.focus();
  }
});

logoutBtn?.addEventListener('click', () => {
  sessionStorage.removeItem(AUTH_KEY);
  showLogin();
});


// ---------- Admin panel (manage articles) ----------
// Only called after a successful login.

function initAdminPanel() {

const STORAGE_KEY = 'vamos_custom_articles';
const BASE_NEWS_SOURCE = 'news.json';

const form = document.getElementById('articleForm');
const articlesList = document.getElementById('articlesList');
const exportBtn = document.getElementById('exportBtn');
const copyBtn = document.getElementById('copyBtn');
const exportSection = document.getElementById('exportSection');
const exportOutput = document.getElementById('exportOutput');

let baseArticles = []; // from news.json (display/export only, not editable here)

function getCustomArticles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading from localStorage:', e);
    return [];
  }
}

function saveCustomArticles(articles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
}

function makeId() {
  return 'local-' + Date.now();
}

function renderList() {
  const custom = getCustomArticles();
  articlesList.innerHTML = '';

  const all = [
    ...baseArticles.map(a => ({ ...a, __source: 'json' })),
    ...custom.map(a => ({ ...a, __source: 'local' }))
  ];

  if (!all.length) {
    articlesList.innerHTML = '<p>No articles yet.</p>';
    return;
  }

  all.forEach(article => {
    const row = document.createElement('div');
    row.className = 'admin-article-row';

    const title = article.title?.en || article.title?.de || '(no title)';
    const isLocal = article.__source === 'local';

    row.innerHTML = `
      ${article.image ? `<img src="${article.image}" alt="">` : '<div></div>'}
      <span class="row-title">${title}</span>
      <span class="row-source ${isLocal ? 'from-local' : 'from-json'}">
        ${isLocal ? 'new (local)' : 'from news.json'}
      </span>
      <button class="delete-btn" data-id="${article.id}" ${isLocal ? '' : 'disabled title="Can only be deleted directly in news.json"'}>
        Delete
      </button>
    `;

    articlesList.appendChild(row);
  });

  // Deleting only works for locally stored articles
  articlesList.querySelectorAll('.delete-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const updated = getCustomArticles().filter(a => a.id !== id);
      saveCustomArticles(updated);
      renderList();
    });
  });
}

async function loadBaseArticles() {
  try {
    const response = await fetch(BASE_NEWS_SOURCE);
    if (response.ok) {
      baseArticles = await response.json();
    }
  } catch (e) {
    console.error('news.json could not be loaded:', e);
  }
  renderList();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const newArticle = {
    id: makeId(),
    category: document.getElementById('category').value,
    image: document.getElementById('image').value.trim(),
    date: document.getElementById('date').value
      ? new Date(document.getElementById('date').value).toISOString()
      : new Date().toISOString(),
    title: {
      de: document.getElementById('title-de').value.trim(),
      en: document.getElementById('title-en').value.trim(),
      es: document.getElementById('title-es').value.trim()
    },
    summary: {
      de: document.getElementById('summary-de').value.trim(),
      en: document.getElementById('summary-en').value.trim(),
      es: document.getElementById('summary-es').value.trim()
    },
    content: {
      de: document.getElementById('content-de').value.trim(),
      en: document.getElementById('content-en').value.trim(),
      es: document.getElementById('content-es').value.trim()
    }
  };

  const custom = getCustomArticles();
  custom.push(newArticle);
  saveCustomArticles(custom);

  form.reset();
  renderList();
});

exportBtn.addEventListener('click', () => {
  const custom = getCustomArticles();
  const combined = [...baseArticles, ...custom];

  exportOutput.value = JSON.stringify(combined, null, 2);
  exportSection.hidden = false;
  exportSection.scrollIntoView({ behavior: 'smooth' });
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(exportOutput.value);
    copyBtn.textContent = 'Copied! ✓';
    setTimeout(() => { copyBtn.textContent = 'Copy to clipboard'; }, 2000);
  } catch (e) {
    exportOutput.select();
    document.execCommand('copy');
  }
});

loadBaseArticles();

} // End of initAdminPanel()
