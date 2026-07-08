// ============================================================
//  index.js
//  Enthält: Sprachwechsel (Header) + News Ticker
// ============================================================


// ---------- Sprachwechsel (Header) ----------

const langSwitch = document.querySelector('.lang-switch');
const langBtn = document.querySelector('.lang-btn');

console.log('langSwitch gefunden:', langSwitch);
console.log('langBtn gefunden:', langBtn);

if (langSwitch && langBtn) {

  console.log('Sprachwechsel-Script gestartet');

  langBtn.addEventListener('click', () => {
    console.log('Button geklickt, toggle open');
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
      const lang = link.dataset.lang;

      document.querySelectorAll('[data-' + lang + ']').forEach(el => {
        el.textContent = el.dataset[lang];
      });

      document.documentElement.lang = lang;
      langSwitch.classList.remove('open');
    });
  });

} else {
  console.warn('Sprachwechsel: Elemente nicht gefunden auf dieser Seite');
}


// ---------- News Ticker ----------

const NEWS_SOURCE = 'news.json';

const tickerEl = document.querySelector('.ticker');
const tickerText = document.getElementById('tickerText');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

if (tickerEl && tickerText && prevBtn && nextBtn) {

  let news = [];
  let currentIndex = 0;
  let autoplay = null;

  function showNews(index) {
    if (!news.length) return;
    const item = news[index];
    tickerText.textContent = item.title;

    if (item.image) {
      tickerEl.style.backgroundImage = `url('${item.image}')`;
    }
  }

  function nextNews() {
    if (!news.length) return;
    currentIndex = (currentIndex + 1) % news.length;
    showNews(currentIndex);
  }

  function prevNews() {
    if (!news.length) return;
    currentIndex = (currentIndex - 1 + news.length) % news.length;
    showNews(currentIndex);
  }

  function startAutoplay() {
    clearInterval(autoplay);
    autoplay = setInterval(nextNews, 5000);
  }

  async function loadNews() {
    try {
      const response = await fetch(NEWS_SOURCE);
      if (!response.ok) throw new Error('Netzwerkfehler: ' + response.status);

      const data = await response.json();

      news = data.map(item =>
        typeof item === 'string' ? { title: item, image: null } : item
      );

      currentIndex = 0;
      showNews(currentIndex);
      startAutoplay();

    } catch (error) {
      console.error('Fehler beim Laden der News:', error);
      tickerText.textContent = 'News konnten nicht geladen werden';
    }
  }

  nextBtn.addEventListener('click', () => {
    nextNews();
    startAutoplay();
  });

  prevBtn.addEventListener('click', () => {
    prevNews();
    startAutoplay();
  });

  loadNews();

}