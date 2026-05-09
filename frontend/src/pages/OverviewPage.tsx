import { lazy, Suspense } from 'react';
import SummaryCards from '../components/SummaryCards';
import TimeSeriesChart from '../components/TimeSeriesChart';
import AgeDistributionChart from '../components/AgeDistributionChart';
import RankingTable from '../components/RankingTable';
import { useDataStore, useFilterStore } from '../store';
import { BarChart3, Map, TrendingUp, Clock, List, AlertTriangle } from 'lucide-react';

const ChoroplethMap = lazy(() => import('../components/ChoroplethMap'));
const ScatterPlot = lazy(() => import('../components/ScatterPlot'));

function MapSkeleton() {
  return (
    <div className="w-full h-full skeleton rounded-xl min-h-[460px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 opacity-50">
        <Map size={32} className="text-[var(--text-muted)] animate-pulse" />
        <p className="text-sm text-[var(--text-muted)]">Loading map…</p>
      </div>
    </div>
  );
}

function SectionLabel({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="p-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">{title}</div>
        {subtitle && <div className="text-[11px] text-[var(--text-muted)]">{subtitle}</div>}
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const { loading } = useDataStore();
  const { selectedStateId, selectedDistrictId } = useFilterStore();

  const scopeLabel = selectedDistrictId
    ? 'District Detail'
    : selectedStateId
    ? 'State Overview'
    : 'National Overview';

  const scopeDesc = selectedDistrictId
    ? 'District-level case pendency & judge workload data'
    : selectedStateId
    ? 'State-level judicial statistics and trend analysis'
    : 'All-India court backlog analytics · National Judicial Data Grid';

  return (
    <div className="p-5 flex flex-col gap-5 min-h-full">

      {/* Page banner */}
      <div className="glass-card px-5 py-4 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(167,139,250,0.08) 50%, rgba(244,114,182,0.06) 100%)',
          borderColor: 'rgba(99,102,241,0.2)',
        }}
      >
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            {selectedDistrictId && <AlertTriangle size={14} className="text-amber-400" />}
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              {scopeLabel}
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">{scopeDesc}</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <div className="w-3 h-3 rounded-full border border-indigo-400 border-t-transparent animate-spin" />
              Loading…
            </div>
          )}
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-[var(--text-secondary)]">Data as of</div>
            <div className="text-xs text-[var(--accent)] font-mono font-semibold">Dec 2024</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <SummaryCards />

      {/* Map + Time Series */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5" style={{ minHeight: '480px' }}>
        {/* Choropleth Map */}
        <div className="xl:col-span-3 glass-card flex flex-col" style={{ minHeight: '480px' }}>
          <div className="px-4 pt-4 pb-0">
            <SectionLabel
              icon={<Map size={14} />}
              title="District & State Pendency Map"
              subtitle="Click a state to drill down to districts · Color = selected metric"
            />
          </div>
          <div className="flex-1 p-2 pt-0 min-h-0">
            <Suspense fallback={<MapSkeleton />}>
              <div style={{ height: '420px' }}>
                <ChoroplethMap />
              </div>
            </Suspense>
          </div>
        </div>

        {/* Time Series */}
        <div className="xl:col-span-2 glass-card p-4 flex flex-col" style={{ minHeight: '480px' }}>
          <SectionLabel
            icon={<TrendingUp size={14} />}
            title="Pendency Trend (2020–2024)"
            subtitle="Monthly filed vs. disposed case volumes"
          />
          <div className="flex-1 min-h-0">
            <TimeSeriesChart />
          </div>
        </div>
      </div>

      {/* Age Distribution + Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" style={{ minHeight: '400px' }}>
        <div className="glass-card p-4 flex flex-col" style={{ minHeight: '400px' }}>
          <SectionLabel
            icon={<Clock size={14} />}
            title="Case Age Distribution"
            subtitle="Breakdown of pending cases by how long they've been pending"
          />
          <div className="flex-1 min-h-0">
            <AgeDistributionChart />
          </div>
        </div>
        <div className="glass-card p-4 flex flex-col" style={{ minHeight: '400px' }}>
          <SectionLabel
            icon={<BarChart3 size={14} />}
            title="Judge Workload vs. Pendency"
            subtitle="Scatter: each bubble = one state. Size = total pending cases"
          />
          <div className="flex-1 min-h-0">
            <Suspense fallback={<div className="h-full skeleton rounded-xl" />}>
              <ScatterPlot />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="glass-card p-4" style={{ minHeight: '380px' }}>
        <SectionLabel
          icon={<List size={14} />}
          title="State / District Rankings"
          subtitle="Sortable by any metric — click column headers to reorder"
        />
        <RankingTable />
      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] text-[var(--text-muted)] py-3 border-t border-[var(--border)] flex items-center justify-center gap-2 flex-wrap">
        <span>Judicial Delay Analytics</span>
        <span className="text-[var(--border)]">·</span>
        <span>Source: National Judicial Data Grid (NJDG)</span>
        <span className="text-[var(--border)]">·</span>
        <a
          href="https://njdg.ecourts.gov.in"
          target="_blank"
          rel="noopener"
          className="text-[var(--accent)] hover:underline"
        >
          njdg.ecourts.gov.in
        </a>
        <span className="text-[var(--border)]">·</span>
        <span>Built with React · D3.js · Leaflet · Recharts</span>
      </footer>
    </div>
  );
}
