#!/bin/bash
# setup.sh — scaffolds the complete Judicial Delay Analytics frontend
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "🏗  Scaffolding Vite + React + TypeScript frontend..."

# Scaffold Vite project
npm create vite@latest frontend -- --template react-ts

cd frontend

echo "📦 Installing dependencies..."
npm install

echo "📦 Installing visualization & routing libs..."
npm install \
  react-router-dom@6 \
  zustand \
  d3 \
  recharts \
  leaflet \
  react-leaflet \
  topojson-client \
  clsx \
  lucide-react \
  @types/d3 \
  @types/leaflet \
  @types/topojson-client

echo "📦 Installing Tailwind CSS v3..."
npm install -D tailwindcss@3 postcss autoprefixer

echo "🎨 Initializing Tailwind..."
npx tailwindcss init -p

echo "📁 Creating data directories..."
mkdir -p public/data/geo

echo "✅ Frontend scaffolded! Run: cd frontend && npm run dev"
