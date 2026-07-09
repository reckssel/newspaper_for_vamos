// ============================================================
//  index.js
//  Enthält: Sprachwechsel (Header) + News Ticker + Artikel-Grid
//  Alle drei Bereiche kennen die aktuell gewählte Sprache
//  über die globale Variable currentLang.
// ============================================================

let currentLang = document.documentElement.lang || 'de';
let currentFilter = 'all'; // 'all' | 'argentina' | 'spain'

// Wird von anderen Abschnitten befüllt, damit beim Sprachwechsel
// ohne erneuten fetch() neu gerendert werden kann.
const onLanguageChange = [];

// Wird von anderen Abschnitten befüllt, damit beim Kategorie-Wechsel
// ohne erneuten fetch() neu gefiltert/gerendert werden kann.
const onFilterChange = [];


// ---------- Burger-Menü (Handy/Tablet) ----------

const burgerBtn = document.getElementById('burgerBtn');
const siteNav = document.getElementById('siteNav');

if (burgerBtn && siteNav) {

  function closeBurgerMenu() {
    siteNav.classList.remove('open');
    burgerBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleBurgerMenu() {
    const isOpen = siteNav.classList.toggle('open');
    burgerBtn.setAttribute('aria-expanded', String(isOpen));
  }

  burgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleBurgerMenu();
  });

  // Klick außerhalb der Nav schließt das Menü (z.B. auf Handy/Tablet)
  document.addEventListener('click', (e) => {
    if (!siteNav.contains(e.target) && !burgerBtn.contains(e.target)) {
      closeBurgerMenu();
    }
  });

  // Nach Auswahl einer Kategorie (Home/Argentinien/Spanien) Menü schließen
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => closeBurgerMenu());
  });
}


// ---------- Kategorie-Filter (Home / Argentinien / Spanien) ----------

const navLinks = document.querySelectorAll('.nav-link');

if (navLinks.length) {
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilter = link.dataset.filter;

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      onFilterChange.forEach(callback => callback(currentFilter));
    });
  });
}


// ---------- Sprachwechsel (Header) ----------

const langSwitch = document.querySelector('.lang-switch');
const langBtn = document.querySelector('.lang-btn');

if (langSwitch && langBtn) {

  langBtn.addEventListener('click', () => {
    langSwitch.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!langSwitch.contains(e.target)) {
      langSwitch.classList.remove('open');
    }
  });

  document.querySelectorAll('.lang-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = link.dataset.lang; // "de", "en" oder "es"
      currentLang = lang;

      // Statische Texte mit data-de/data-en/data-es umschalten
      document.querySelectorAll('[data-' + lang + ']').forEach(el => {
        el.textContent = el.dataset[lang];
      });

      document.documentElement.lang = lang;
      langSwitch.classList.remove('open');

      // Dynamische Bereiche (Ticker, Artikel) benachrichtigen
      onLanguageChange.forEach(callback => callback(lang));
    });
  });

}


// ---------- News Ticker ----------

const NEWS_SOURCE = 'news.json'; // später: echte News-API / RSS-Quelle

const tickerEl = document.querySelector('.ticker');
const tickerText = document.getElementById('tickerText');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

if (tickerEl && tickerText && prevBtn && nextBtn) {

  let tickerNews = [];
  let currentIndex = 0;
  let tickerAutoplay = null;

  function getTitle(item) {
    if (typeof item.title === 'string') return item.title; // Fallback für einfache Strings
    return item.title[currentLang] || item.title.de || '';
  }

  function showTickerNews(index) {
    if (!tickerNews.length) return;
    const item = tickerNews[index];
    tickerText.textContent = getTitle(item);

    if (item.image) {
      tickerEl.style.backgroundImage = `url('${item.image}')`;
    }
  }

  function nextTickerNews() {
    if (!tickerNews.length) return;
    currentIndex = (currentIndex + 1) % tickerNews.length;
    showTickerNews(currentIndex);
  }

  function prevTickerNews() {
    if (!tickerNews.length) return;
    currentIndex = (currentIndex - 1 + tickerNews.length) % tickerNews.length;
    showTickerNews(currentIndex);
  }

  function startTickerAutoplay() {
    clearInterval(tickerAutoplay);
    tickerAutoplay = setInterval(nextTickerNews, 5000);
  }

  async function loadTickerNews() {
    try {
      const response = await fetch(NEWS_SOURCE);
      if (!response.ok) throw new Error('Netzwerkfehler: ' + response.status);

      const data = await response.json();
      tickerNews = data;

      currentIndex = 0;
      showTickerNews(currentIndex);
      startTickerAutoplay();

    } catch (error) {
      console.error('Fehler beim Laden der Ticker-News:', error);
      tickerText.textContent = 'News konnten nicht geladen werden';
    }
  }

  nextBtn.addEventListener('click', () => {
    nextTickerNews();
    startTickerAutoplay();
  });

  prevBtn.addEventListener('click', () => {
    prevTickerNews();
    startTickerAutoplay();
  });

  // Beim Sprachwechsel die aktuell angezeigte Meldung neu anzeigen
  onLanguageChange.push(() => showTickerNews(currentIndex));

  loadTickerNews();

}


// ---------- Artikel-Grid (aktualisiert sich automatisch) ----------
// Aktuell liest das noch aus news.json. Sobald eine echte
// News-Quelle (API/RSS) feststeht, muss nur ARTICLES_SOURCE
// und loadArticles() angepasst werden – der Rest bleibt gleich.

const ARTICLES_SOURCE = 'news.json';
const ARTICLES_REFRESH_MS = 15000; // alle 15 Sekunden neu laden

const articlesGrid = document.getElementById('articlesGrid');
const lastUpdatedEl = document.getElementById('lastUpdated');

if (articlesGrid) {

  let latestArticles = []; // zwischengespeichert, damit Sprachwechsel ohne neuen fetch() geht

  const localeMap = { de: 'de-DE', en: 'en-US', es: 'es-ES' };

  function pickText(field) {
    if (typeof field === 'string') return field; // Fallback für einfache Strings
    return field[currentLang] || field.de || '';
  }

  function formatDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    const locale = localeMap[currentLang] || 'de-DE';
    return d.toLocaleDateString(locale, {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }) + ' · ' + d.toLocaleTimeString(locale, {
      hour: '2-digit', minute: '2-digit'
    });
  }

  function renderArticles(articles) {
    articlesGrid.innerHTML = '';

    const filtered = currentFilter === 'all'
      ? articles
      : articles.filter(a => a.category === currentFilter);

    if (!filtered.length) {
      const emptyLabel = {
        de: 'Keine Artikel in dieser Kategorie.',
        en: 'No articles in this category.',
        es: 'No hay artículos en esta categoría.'
      };
      articlesGrid.innerHTML = `<p>${emptyLabel[currentLang] || emptyLabel.de}</p>`;
      return;
    }

    filtered.forEach(article => {
      const card = document.createElement('article');
      card.className = 'article-card';

      const title = pickText(article.title);
      const summary = article.summary ? pickText(article.summary) : '';

      card.innerHTML = `
        ${article.image ? `<img src="${article.image}" alt="">` : ''}
        <div class="article-body">
          <h3>${title}</h3>
          ${summary ? `<p>${summary}</p>` : ''}
          ${article.date ? `<span class="article-date">${formatDate(article.date)}</span>` : ''}
        </div>
      `;

      articlesGrid.appendChild(card);
    });
  }

  function updateTimestamp() {
    if (!lastUpdatedEl) return;
    const now = new Date();
    const locale = localeMap[currentLang] || 'de-DE';
    const label = { de: 'Zuletzt aktualisiert', en: 'Last updated', es: 'Última actualización' };
    lastUpdatedEl.textContent = (label[currentLang] || label.de) + ': ' +
      now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  async function loadArticles() {
    try {
      const response = await fetch(ARTICLES_SOURCE);
      if (!response.ok) throw new Error('Netzwerkfehler: ' + response.status);

      const data = await response.json();
      latestArticles = data;
      renderArticles(latestArticles);
      updateTimestamp();

    } catch (error) {
      console.error('Fehler beim Laden der Artikel:', error);
      articlesGrid.innerHTML = '<p>Artikel konnten nicht geladen werden.</p>';
    }
  }

  // Beim Sprachwechsel: ohne neuen fetch() einfach in der neuen Sprache neu rendern
  onLanguageChange.push(() => {
    renderArticles(latestArticles);
    updateTimestamp();
  });

  // Beim Kategorie-Wechsel: ohne neuen fetch() neu filtern/rendern
  onFilterChange.push(() => {
    renderArticles(latestArticles);
  });

  // Erste Ladung sofort, danach automatisch alle ARTICLES_REFRESH_MS
  loadArticles();
  setInterval(loadArticles, ARTICLES_REFRESH_MS);

}
