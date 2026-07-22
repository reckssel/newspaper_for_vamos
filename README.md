# 📰 Vamos Newspaper

**A bilingual news site covering Argentina 🇦🇷 and Spain 🇪🇸 — fast, free to host, and dead simple to keep updated.**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-222?style=for-the-badge&logo=github)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## ✨ What is this?

Vamos Newspaper is a lightweight, static news website with a real editorial feel — breaking news ticker, live weather, live market data, favorites, dark mode, and a proper legal notice — all running on plain HTML/CSS/JS with **zero backend and zero hosting cost**.

New articles get published straight from a one-click desktop tool, no code required.

---

## 🚀 Features

| | |
|---|---|
| 🌐 **Bilingual** | Full English / Spanish switch, site-wide |
| 🇦🇷 🇪🇸 **Two sections** | Argentina & Spain, plus a combined Home feed |
| ⭐ **Favorites** | Bookmark articles locally, no login needed |
| 📰 **Breaking news ticker** | Auto-rotating headlines, click-through arrows |
| 🌦️ **Live weather** | Buenos Aires & Madrid, via [Open-Meteo](https://open-meteo.com) (no API key) |
| 📈 **Live markets** | Gold, oil, an index proxy, and Bitcoin, via [Twelve Data](https://twelvedata.com) |
| 🌓 **Dark mode** | One click, remembered per visitor |
| 📱 **Fully responsive** | Handcrafted breakpoints for phone, tablet, and desktop |
| ⚖️ **Legal-ready** | Spanish LSSI-CE compliant Aviso Legal page |
| 🖥️ **One-click publishing** | Desktop tool (Python) with a form — no Git, no code |

---

## 🗂️ Project structure

```
newspaper_for_vamos/
├── index.html                  # Main site
├── aviso-legal.html            # Legal notice (Spanish law)
├── verwaltung-x7k2p.html        # Legacy browser admin panel (password protected)
├── news.json                   # All article data (bilingual)
├── css/
│   ├── index.css               # Main site styles
│   └── verwaltung-x7k2p.css     # Admin panel styles
├── js/
│   ├── index.js                # Ticker, weather, markets, favorites, i18n
│   └── verwaltung-x7k2p.js      # Admin panel logic
├── images/                     # Site images & logo
├── main.py                     # Desktop publishing tool (Tkinter)
└── .github/workflows/
    └── build-tool.yml          # Builds Windows .exe + macOS .app on demand
```

---

## 🛠️ Local development

No build step, no dependencies — just open it.

```bash
git clone git@github.com:reckssel/newspaper_for_vamos.git
cd newspaper_for_vamos
```

Then serve it with any static server (opening `index.html` directly won't work — `fetch()` needs `http://`, not `file://`):

```bash
# e.g. VS Code "Live Server" extension, or:
python3 -m http.server 5500
```

Open `http://localhost:5500`.

---

## ✍️ Publishing new articles

The recommended way is the **desktop tool** (`main.py`), which commits and pushes directly:

1. Get pre-built apps from the [Releases](../../releases) page (Windows `.exe` / macOS `.app`), or run `python3 main.py` yourself.
2. Fill in the form — category, image, title/summary/full text in English & Spanish.
3. Click **🚀 Publish** — it updates `news.json`, commits, and pushes to `main`.
4. GitHub Pages rebuilds automatically within ~1–2 minutes.

Want to build the desktop apps yourself? Trigger the **Build Vamos Article Tool** workflow under the *Actions* tab — it cross-builds both platforms and attaches them to a new Release.

---

## 🌍 Live site

Hosted for free on **GitHub Pages** — no server, no monthly bill.

---

## 📄 License

MIT — do whatever you want with it, just don't blame us if it breaks. 😄

---

<p align="center">Made with ☕ and a bit of Argentine-Spanish stubbornness.</p>
