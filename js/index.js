// ============================================================
//  index.js
//  Enthält: Sprachwechsel (Header) + News Ticker + Artikel-Grid
//  Alle drei Bereiche kennen die aktuell gewählte Sprache
//  über die globale Variable currentLang.
// ============================================================

let currentLang = document.documentElement.lang || 'en';
let currentFilter = 'all'; // 'all' | 'argentina' | 'spain'

// Wird von anderen Abschnitten befüllt, damit beim Sprachwechsel
// ohne erneuten fetch() neu gerendert werden kann.
const onLanguageChange = [];

// Wird von anderen Abschnitten befüllt, damit beim Kategorie-Wechsel
// ohne erneuten fetch() neu gefiltert/gerendert werden kann.
const onFilterChange = [];


// ---------- Footer-Jahr automatisch aktuell halten ----------

const footerYear = document.getElementById('footerYear');
if (footerYear) {
  footerYear.textContent = new Date().getFullYear();
}


// ---------- Dark Mode ----------

const THEME_KEY = 'vamos_theme';
const themeToggle = document.getElementById('themeToggle');

function updateThemeColorMeta(isDark) {
  document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
    meta.setAttribute('content', isDark ? '#17151a' : '#7a1f2b');
  });
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(THEME_KEY, 'light');
      updateThemeColorMeta(false);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem(THEME_KEY, 'dark');
      updateThemeColorMeta(true);
    }
  });
}


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

      // Header- und Footer-Links mit demselben Filter bleiben synchron aktiv
      navLinks.forEach(l => l.classList.toggle('active', l.dataset.filter === currentFilter));

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
    return item.title[currentLang] || item.title.en || '';
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
const CUSTOM_ARTICLES_KEY = 'vamos_custom_articles'; // gleicher Key wie im Admin-Interface

const articlesGrid = document.getElementById('articlesGrid');
const lastUpdatedEl = document.getElementById('lastUpdated');

if (articlesGrid) {

  let latestArticles = []; // zwischengespeichert, damit Sprachwechsel ohne neuen fetch() geht

  const localeMap = { de: 'de-DE', en: 'en-US', es: 'es-ES' };

  function pickText(field) {
    if (!field) return '';
    if (typeof field === 'string') return field; // Fallback für einfache Strings
    return field[currentLang] || field.en || '';
  }

  function formatDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    const locale = localeMap[currentLang] || 'en-US';
    return d.toLocaleDateString(locale, {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }) + ' · ' + d.toLocaleTimeString(locale, {
      hour: '2-digit', minute: '2-digit'
    });
  }

  function getLocalArticles() {
    try {
      const raw = localStorage.getItem(CUSTOM_ARTICLES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Fehler beim Lesen der lokal gespeicherten Artikel:', e);
      return [];
    }
  }

  // ---------- Favoriten ----------

  const FAVORITES_KEY = 'vamos_favorites';

  function getFavorites() {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function isFavorite(id) {
    return getFavorites().includes(id);
  }

  function toggleFavorite(id) {
    const favs = getFavorites();
    const index = favs.indexOf(id);

    if (index === -1) {
      favs.push(id);
    } else {
      favs.splice(index, 1);
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return favs.includes(id);
  }

  function renderArticles(articles) {
    articlesGrid.innerHTML = '';

    let filtered;
    if (currentFilter === 'all') {
      filtered = articles;
    } else if (currentFilter === 'favorites') {
      const favs = getFavorites();
      filtered = articles.filter(a => favs.includes(a.id));
    } else {
      filtered = articles.filter(a => a.category === currentFilter);
    }

    if (!filtered.length) {
      const emptyLabel = currentFilter === 'favorites'
        ? {
            de: 'Noch keine Favoriten. Klick auf den Stern bei einem Artikel!',
            en: 'No favorites yet. Click the star on an article!',
            es: 'Aún no hay favoritos. ¡Haz clic en la estrella de un artículo!'
          }
        : {
            de: 'Keine Artikel in dieser Kategorie.',
            en: 'No articles in this category.',
            es: 'No hay artículos en esta categoría.'
          };
      articlesGrid.innerHTML = `<p>${emptyLabel[currentLang] || emptyLabel.de}</p>`;
      return;
    }

    // Neueste zuerst
    const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(article => {
      const card = document.createElement('article');
      card.className = 'article-card';
      card.tabIndex = 0; // per Tastatur erreichbar

      const title = pickText(article.title);
      const summary = article.summary ? pickText(article.summary) : '';
      const favActive = isFavorite(article.id);

      card.innerHTML = `
        <button class="favorite-btn ${favActive ? 'active' : ''}" aria-label="Favorit umschalten">
          ${favActive ? '★' : '☆'}
        </button>
        ${article.image ? `<img src="${article.image}" alt="" loading="lazy" decoding="async">` : ''}
        <div class="article-body">
          <h3>${title}</h3>
          ${summary ? `<p>${summary}</p>` : ''}
          ${article.date ? `<span class="article-date">${formatDate(article.date)}</span>` : ''}
        </div>
      `;

      card.addEventListener('click', () => openArticleModal(article));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openArticleModal(article);
        }
      });

      const favBtn = card.querySelector('.favorite-btn');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Klick auf Stern soll nicht das Modal öffnen
        const nowActive = toggleFavorite(article.id);
        favBtn.classList.toggle('active', nowActive);
        favBtn.textContent = nowActive ? '★' : '☆';

        // Falls gerade die Favoriten-Ansicht aktiv ist: Liste neu rendern
        if (currentFilter === 'favorites') {
          renderArticles(latestArticles);
        }
      });

      articlesGrid.appendChild(card);
    });
  }

  function updateTimestamp() {
    if (!lastUpdatedEl) return;
    const now = new Date();
    const locale = localeMap[currentLang] || 'en-US';
    const label = { de: 'Zuletzt aktualisiert', en: 'Last updated', es: 'Última actualización' };
    lastUpdatedEl.textContent = (label[currentLang] || label.en) + ': ' +
      now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  async function loadArticles() {
    try {
      const response = await fetch(ARTICLES_SOURCE);
      if (!response.ok) throw new Error('Netzwerkfehler: ' + response.status);

      const data = await response.json();
      const localArticles = getLocalArticles();

      // Artikel aus news.json + per Admin-Interface lokal hinzugefügte Artikel
      latestArticles = [...data, ...localArticles];

      renderArticles(latestArticles);
      updateTimestamp();

    } catch (error) {
      console.error('Fehler beim Laden der Artikel:', error);
      articlesGrid.innerHTML = '<p>Articles could not be loaded.</p>';
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


// ---------- Artikel-Detail-Modal ----------

const articleModal = document.getElementById('articleModal');
const modalClose = document.getElementById('modalClose');
const modalImage = document.getElementById('modalImage');
const modalCategory = document.getElementById('modalCategory');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalBody = document.getElementById('modalBody');

const categoryLabels = {
  argentina: { de: 'Argentinien', en: 'Argentina', es: 'Argentina' },
  spain: { de: 'Spanien', en: 'Spain', es: 'España' }
};

function openArticleModal(article) {
  if (!articleModal) return;

  const pick = (field) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[currentLang] || field.en || '';
  };

  const localeMap = { de: 'de-DE', en: 'en-US', es: 'es-ES' };

  if (modalImage) {
    if (article.image) {
      modalImage.src = article.image;
      modalImage.style.display = 'block';
    } else {
      modalImage.style.display = 'none';
    }
  }

  if (modalCategory) {
    const catLabel = categoryLabels[article.category];
    modalCategory.textContent = catLabel ? (catLabel[currentLang] || catLabel.de) : '';
  }

  if (modalTitle) modalTitle.textContent = pick(article.title);

  if (modalDate && article.date) {
    const d = new Date(article.date);
    const locale = localeMap[currentLang] || 'en-US';
    modalDate.textContent = d.toLocaleDateString(locale, {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }) + ' · ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }

  if (modalBody) {
    const fullText = pick(article.content);
    const summaryText = pick(article.summary);
    modalBody.textContent = fullText || summaryText || '';
  }

  articleModal.classList.add('open');
  document.body.style.overflow = 'hidden'; // Hintergrund nicht scrollbar während Modal offen
}

function closeArticleModal() {
  if (!articleModal) return;
  articleModal.classList.remove('open');
  document.body.style.overflow = '';
}

if (articleModal) {
  modalClose?.addEventListener('click', closeArticleModal);

  // Klick auf den dunklen Hintergrund schließt das Modal
  articleModal.addEventListener('click', (e) => {
    if (e.target === articleModal) closeArticleModal();
  });

  // ESC schließt das Modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeArticleModal();
  });
}


// ---------- Wetter (Open-Meteo API, kostenlos, ohne Key) ----------

const weatherList = document.getElementById('weatherList');

const WEATHER_CITIES = [
  { name: { de: 'Buenos Aires', en: 'Buenos Aires', es: 'Buenos Aires' }, lat: -34.6037, lon: -58.3816 },
  { name: { de: 'Madrid', en: 'Madrid', es: 'Madrid' }, lat: 40.4168, lon: -3.7038 }
];

// Wetter alle 20 Minuten aktualisieren (Wetter ändert sich langsam,
// Open-Meteo hat aber ohnehin kein knappes Anfragelimit)
const WEATHER_REFRESH_MS = 20 * 60 * 1000;

// Vereinfachte Zuordnung der Open-Meteo "weather_code" zu Icon + Text
function weatherCodeToIcon(code) {
  if (code === 0) return '☀️';
  if ([1, 2].includes(code)) return '🌤️';
  if (code === 3) return '☁️';
  if ([45, 48].includes(code)) return '🌫️';
  if ([51, 53, 55, 56, 57].includes(code)) return '🌦️';
  if ([61, 63, 65, 80, 81, 82].includes(code)) return '🌧️';
  if ([66, 67].includes(code)) return '🌧️';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️';
  if ([95, 96, 99].includes(code)) return '⛈️';
  return '🌡️';
}

if (weatherList) {

  let latestWeather = []; // zwischengespeichert für Sprachwechsel ohne neuen Fetch

  function renderWeather(results) {
    weatherList.innerHTML = '';

    results.forEach(({ city, temp, code }) => {
      const row = document.createElement('div');
      row.className = 'weather-row';

      const cityName = city.name[currentLang] || city.name.en;

      if (temp === null) {
        row.innerHTML = `
          <span class="weather-icon">–</span>
          <span class="weather-city">${cityName}</span>
          <span class="weather-temp">–</span>
        `;
      } else {
        row.innerHTML = `
          <span class="weather-icon">${weatherCodeToIcon(code)}</span>
          <span class="weather-city">${cityName}</span>
          <span class="weather-temp">${Math.round(temp)}°C</span>
        `;
      }

      weatherList.appendChild(row);
    });
  }

  async function loadWeather() {
    try {
      const results = await Promise.all(
        WEATHER_CITIES.map(async (city) => {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code&timezone=auto`;
          const response = await fetch(url);
          const data = await response.json();
          return {
            city,
            temp: data.current?.temperature_2m ?? null,
            code: data.current?.weather_code ?? null
          };
        })
      );

      latestWeather = results;
      renderWeather(results);

    } catch (error) {
      console.error('Fehler beim Laden des Wetters:', error);
      weatherList.innerHTML = '<p class="market-placeholder">Weather could not be loaded.</p>';
    }
  }

  // Beim Sprachwechsel: Städtenamen neu anzeigen, ohne neuen API-Call
  onLanguageChange.push(() => {
    if (latestWeather.length) renderWeather(latestWeather);
  });

  loadWeather();
  setInterval(loadWeather, WEATHER_REFRESH_MS);
}


// ---------- Kurse (Twelve Data API) ----------
// Kostenloser API-Key: twelvedata.com → registrieren → Dashboard.
// Dort steht dein Key, den du hier unten einträgst.

const TWELVE_DATA_API_KEY = 'DEIN_API_KEY_HIER'; // <-- hier deinen Key einfügen

// Gold & Öl laufen über Forex-Symbole (im Gratis-Plan enthalten).
// SPY steht stellvertretend für einen Aktien-Index (echte Indizes
// brauchen einen kostenpflichtigen Plan bei Twelve Data).
const MARKET_SYMBOLS = [
  { symbol: 'XAU/USD', label: { de: 'Gold', en: 'Gold', es: 'Oro' } },
  { symbol: 'WTI/USD', label: { de: 'Öl (WTI)', en: 'Oil (WTI)', es: 'Petróleo (WTI)' } },
  { symbol: 'SPY', label: { de: 'S&P 500 (ETF)', en: 'S&P 500 (ETF)', es: 'S&P 500 (ETF)' } },
  { symbol: 'BTC/USD', label: { de: 'Bitcoin', en: 'Bitcoin', es: 'Bitcoin' } }
];

// Gratis-Plan: 800 Anfragen/Tag. Ein Refresh kostet 4 Credits
// (1 pro Symbol) → alle 10 Minuten bleibt das sicher im Limit.
const MARKET_REFRESH_MS = 10 * 60 * 1000;

const marketList = document.getElementById('marketList');
const marketUpdated = document.getElementById('marketUpdated');

if (marketList && TWELVE_DATA_API_KEY && TWELVE_DATA_API_KEY !== 'DEIN_API_KEY_HIER') {

  let latestQuotes = null; // zwischengespeichert, damit Sprachwechsel ohne neuen API-Call geht

  async function loadMarketData() {
    const symbols = MARKET_SYMBOLS.map(m => m.symbol).join(',');
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${TWELVE_DATA_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      // Bei mehreren Symbolen liefert Twelve Data ein Objekt,
      // bei genau einem Symbol direkt die Quote-Daten selbst.
      latestQuotes = MARKET_SYMBOLS.length === 1 ? { [MARKET_SYMBOLS[0].symbol]: data } : data;

      renderMarketList(latestQuotes);
      updateMarketTimestamp();

    } catch (error) {
      console.error('Fehler beim Laden der Kurse:', error);
      marketList.innerHTML = '<p class="market-placeholder">Market data could not be loaded.</p>';
    }
  }

  function renderMarketList(quotes) {
    marketList.innerHTML = '';

    MARKET_SYMBOLS.forEach(({ symbol, label }) => {
      const quote = quotes[symbol];

      const row = document.createElement('div');
      row.className = 'market-row';

      if (!quote || quote.status === 'error' || quote.code) {
        row.innerHTML = `
          <span class="market-name">${label[currentLang] || label.en}</span>
          <span class="market-price">–</span>
        `;
        marketList.appendChild(row);
        return;
      }

      const price = parseFloat(quote.close).toLocaleString(undefined, {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      });

      const changePercent = parseFloat(quote.percent_change);
      const isPositive = changePercent >= 0;
      const changeText = (isPositive ? '+' : '') + changePercent.toFixed(2) + '%';

      row.innerHTML = `
        <span class="market-name">${label[currentLang] || label.en}</span>
        <span class="market-price">${price}</span>
        <span class="market-change ${isPositive ? 'positive' : 'negative'}">${changeText}</span>
      `;

      marketList.appendChild(row);
    });
  }

  function updateMarketTimestamp() {
    if (!marketUpdated) return;
    const now = new Date();
    const locale = { de: 'de-DE', en: 'en-US', es: 'es-ES' }[currentLang] || 'en-US';
    const label = { de: 'Stand', en: 'As of', es: 'Actualizado' };
    marketUpdated.textContent = (label[currentLang] || label.en) + ': ' +
      now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }

  // Beim Sprachwechsel: Labels neu anzeigen, ohne neuen API-Call
  onLanguageChange.push(() => {
    if (latestQuotes) renderMarketList(latestQuotes);
  });

  loadMarketData();
  setInterval(loadMarketData, MARKET_REFRESH_MS);

} else if (marketList) {
  marketList.innerHTML = '<p class="market-placeholder">API key missing – add it in js/index.js.</p>';
}
