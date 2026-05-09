# Judicial Delay Analytics

> An interactive visual analytics dashboard for judicial backlog and pendency patterns across India, powered by National Judicial Data Grid (NJDG) statistics.

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue)](https://your-username.github.io/judicial-delay-analytics/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🖼️ Dashboard Features

| Feature | Description |
|---------|-------------|
| **Choropleth Map** | Interactive India map with state → district drilldown, color-coded by metric |
| **Time Series** | Monthly filing vs. disposal trends with pendency growth chart |
| **Age Distribution** | Stacked bars showing case age buckets (0-1yr through 10+yr) |
| **Scatter Plot** | D3 bubble chart: Cases/judge vs disposal rate with regression line |
| **Ranking Table** | Sortable, paginated state/district rankings with severity bars |
| **Linked Views** | All charts respond to a shared global filter state |
| **Dark/Light Mode** | Full theme toggle |

---

## 🏗️ Architecture

```
judicial-delay-analytics/
├── scraper/                 # Python data pipeline
│   ├── generate_synthetic.py  # Synthetic dataset generator (primary)
│   ├── generate_geojson.py    # India GeoJSON downloader
│   ├── scrape_njdg.py         # Live NJDG scraper (optional)
│   ├── normalize.py           # Name normalization utilities
│   └── requirements.txt
├── frontend/                # React + Vite app
│   ├── src/
│   │   ├── components/      # Chart & UI components
│   │   ├── pages/           # Route-level pages
│   │   ├── store/           # Zustand state management
│   │   ├── types/           # TypeScript interfaces
│   │   └── utils/           # Constants, formatters, colors
│   ├── public/data/         # Static JSON datasets (generated)
│   │   ├── india_summary.json
│   │   ├── states.json
│   │   ├── districts.json
│   │   ├── time_series.json
│   │   └── geo/
│   │       ├── india_states.geojson
│   │       └── india_districts.geojson
│   └── vite.config.ts
└── docs/                    # GitHub Pages output (built)
```

---

## 🚀 Quick Start

### 1. Generate Datasets

```bash
cd scraper
pip install -r requirements.txt
python generate_synthetic.py   # Creates all JSON files
python generate_geojson.py     # Downloads India GeoJSON
```

### 2. Start Development Server

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173/judicial-delay-analytics/

### 3. Build for GitHub Pages

```bash
cd frontend
npm run build
# Output is in /docs — commit and push to deploy
```

---

## 📊 Dataset Schema

See [`docs/SCHEMA.md`](docs/SCHEMA.md) for complete field documentation.

---

## 🗺️ Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for GitHub Pages setup.

---

## 🕷️ Scraping

See [`docs/SCRAPING.md`](docs/SCRAPING.md) for live NJDG scraping instructions.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite 5, TailwindCSS 3
- **Visualization**: D3.js 7, Recharts 2, Leaflet 1.9
- **State Management**: Zustand 5
- **Routing**: React Router 6
- **Data Pipeline**: Python 3.10+, pandas, requests

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Data Sources

- [National Judicial Data Grid (NJDG)](https://njdg.ecourts.gov.in) — eCourts India
- [Datameet India Maps](https://github.com/datameet/maps) — GeoJSON boundaries
