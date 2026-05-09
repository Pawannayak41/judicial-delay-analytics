import { useFilterStore } from '../store';
import { METRIC_LABELS } from '../utils/constants';
import type { MetricKey, CaseType } from '../types';
import { Home, ChevronRight } from 'lucide-react';
import { useDataStore } from '../store';

const METRICS: MetricKey[] = [
  'total_pending', 'disposal_rate', 'cases_per_judge', 'vacancy_rate', 'backlog_severity',
];

const CASE_TYPES: { value: CaseType; label: string; color: string }[] = [
  { value: 'all',      label: 'All Cases',     color: 'bg-brand-500/20 text-brand-400 border-brand-500/40' },
  { value: 'civil',    label: 'Civil',         color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' },
  { value: 'criminal', label: 'Criminal',      color: 'bg-red-500/20 text-red-400 border-red-500/40' },
];

const YEAR_RANGE = [2020, 2021, 2022, 2023, 2024];

export default function FilterPanel() {
  const {
    selectedStateId, selectedDistrictId,
    caseType, metric, yearRange,
    setCaseType, setMetric, setYearRange,
    setSelectedState, setSelectedDistrict, resetFilters,
  } = useFilterStore();

  const { states, districts } = useDataStore();

  const selectedState = selectedStateId ? states.find(s => s.id === selectedStateId) : null;
  const selectedDistrict = selectedDistrictId ? districts.find(d => d.id === selectedDistrictId) : null;

  return (
    <aside className="flex flex-col gap-5 h-full overflow-y-auto pr-1">

      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">JD</span>
        </div>
        <div>
          <div className="text-sm font-bold text-[var(--text-primary)] leading-tight">Judicial Delay</div>
          <div className="text-xs text-[var(--text-muted)]">Analytics Dashboard</div>
        </div>
      </div>

      {/* Drilldown Breadcrumb */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Location</p>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => { setSelectedState(null); setSelectedDistrict(null); }}
            className={`flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg transition-colors ${
              !selectedStateId ? 'bg-brand-500/15 text-brand-400 font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <Home size={13} />
            India (National)
          </button>

          {selectedState && (
            <button
              onClick={() => setSelectedDistrict(null)}
              className={`flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg transition-colors ml-3 ${
                !selectedDistrictId ? 'bg-brand-500/15 text-brand-400 font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <ChevronRight size={13} />
              {selectedState.name}
            </button>
          )}

          {selectedDistrict && (
            <div className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg bg-purple-500/15 text-purple-400 font-medium ml-6">
              <ChevronRight size={13} />
              {selectedDistrict.name}
            </div>
          )}
        </div>
      </div>

      {/* Case Type */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Case Type</p>
        <div className="flex flex-col gap-1.5">
          {CASE_TYPES.map((ct) => (
            <button
              key={ct.value}
              onClick={() => setCaseType(ct.value)}
              className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left ${
                caseType === ct.value
                  ? ct.color
                  : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Metric */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Map Metric</p>
        <div className="flex flex-col gap-1">
          {METRICS.map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                metric === m
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] border border-transparent'
              }`}
            >
              {METRIC_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Year Range */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Year Range: {yearRange[0]}–{yearRange[1]}
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {YEAR_RANGE.map((y) => (
            <button
              key={y}
              onClick={() => {
                if (y < yearRange[1]) setYearRange([y, yearRange[1]]);
              }}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                y >= yearRange[0] && y <= yearRange[1]
                  ? 'bg-brand-500/20 text-brand-300'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs text-[var(--text-muted)]">Click start year to adjust</div>
      </div>

      {/* Reset */}
      <button
        onClick={resetFilters}
        className="mt-auto text-xs px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:border-red-500/40 hover:text-red-400 transition-all"
      >
        Reset All Filters
      </button>

      {/* Data source note */}
      <div className="text-[10px] text-[var(--text-muted)] leading-relaxed">
        Data: NJDG synthetic dataset<br />
        Last updated: Dec 2024<br />
        <a
          href="https://njdg.ecourts.gov.in"
          target="_blank"
          rel="noopener"
          className="text-brand-400 hover:underline"
        >
          njdg.ecourts.gov.in
        </a>
      </div>
    </aside>
  );
}
