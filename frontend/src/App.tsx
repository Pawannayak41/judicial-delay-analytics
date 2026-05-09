import { lazy, Suspense, useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import FilterPanel from './components/FilterPanel';
import { useDataStore, useUIStore } from './store';

const OverviewPage = lazy(() => import('./pages/OverviewPage'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        <p className="text-sm text-[var(--text-muted)]">Loading dashboard…</p>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mx-4 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
      <strong>Data load error:</strong> {message}
      <div className="text-xs mt-1 text-red-300">
        Make sure datasets are generated: run <code className="font-mono bg-red-950/50 px-1 rounded">python scraper/generate_synthetic.py</code>
      </div>
    </div>
  );
}

export default function App() {
  const { loadAll, error } = useDataStore();
  const { sidebarOpen, setSidebarOpen, theme } = useUIStore();

  useEffect(() => {
    // Apply theme class to root on mount — sync immediately
    const saved = localStorage.getItem('jda-theme') ?? 'dark';
    document.documentElement.classList.toggle('dark', saved === 'dark');
    loadAll();
  }, []);

  return (
    <HashRouter>
      <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg-primary)]">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

        {error && <ErrorBanner message={error} />}

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside
            className={`
              flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out
              border-r border-[var(--border)] bg-[var(--bg-sidebar)]
              ${sidebarOpen ? 'w-56' : 'w-0'}
            `}
          >
            <div className="w-56 h-full p-4">
              <FilterPanel />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/state/:stateId" element={<OverviewPage />} />
                <Route path="/district/:districtId" element={<OverviewPage />} />
                <Route path="*" element={<OverviewPage />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </HashRouter>
  );
}
