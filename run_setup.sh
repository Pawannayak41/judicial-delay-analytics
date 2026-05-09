#!/bin/bash
# ============================================================
# Judicial Delay Analytics — Complete Setup Script
# Run this once to set up the entire project:
#   bash run_setup.sh
# ============================================================

set -e
PROJECT="$(cd "$(dirname "$0")" && pwd)"
echo "🏛  Judicial Delay Analytics — Setup"
echo "📁 Project: $PROJECT"
echo ""

# ── Step 1: Python Data Pipeline ──────────────────────────────
echo "━━━ Step 1: Generating datasets ━━━"
cd "$PROJECT/scraper"
echo "  Running generate_synthetic.py..."
python3 generate_synthetic.py
echo "  Running generate_geojson.py..."
python3 generate_geojson.py
echo "  ✅ Datasets generated"
echo ""

# ── Step 2: Frontend ───────────────────────────────────────────
echo "━━━ Step 2: Setting up frontend ━━━"
cd "$PROJECT/frontend"

if [ ! -d "node_modules" ]; then
  echo "  Installing npm dependencies..."
  npm install
else
  echo "  node_modules already exists, skipping install"
fi

echo "  ✅ Frontend ready"
echo ""

# ── Step 3: Launch dev server ──────────────────────────────────
echo "━━━ Step 3: Launching dev server ━━━"
echo "  Dashboard will open at: http://localhost:5173/judicial-delay-analytics/"
echo ""
npm run dev
