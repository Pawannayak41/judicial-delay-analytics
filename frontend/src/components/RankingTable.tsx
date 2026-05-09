import { useState, useMemo } from 'react';
import { useDataStore, useFilterStore } from '../store';
import { formatNumber, formatPercent, getMetricValue } from '../utils/constants';
import type { StateData, DistrictData, MetricKey } from '../types';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortDir = 'asc' | 'desc';
type SortKey = 'name' | MetricKey;

export default function RankingTable() {
  const { states, districts } = useDataStore();
  const { selectedStateId, caseType, metric, setSelectedState, setSelectedDistrict } = useFilterStore();

  const [sortKey, setSortKey] = useState<SortKey>('total_pending');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;

  const rows = useMemo(() => {
    const source: (StateData | DistrictData)[] = selectedStateId
      ? districts.filter(d => d.state_id === selectedStateId)
      : states;

    return [...source].sort((a, b) => {
      let av = sortKey === 'name' ? a.name : getMetricValue(a, sortKey as MetricKey, caseType);
      let bv = sortKey === 'name' ? b.name : getMetricValue(b, sortKey as MetricKey, caseType);
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [states, districts, selectedStateId, sortKey, sortDir, caseType]);

  const paged = rows.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(rows.length / PER_PAGE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(0);
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown size={12} className="opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp size={12} className="text-brand-400" /> : <ArrowDown size={12} className="text-brand-400" />;
  };

  const getSeverityBar = (row: StateData | DistrictData) => {
    const val = row.backlog_severity;
    const color = val > 0.7 ? '#ef4444' : val > 0.4 ? '#f97316' : '#22c55e';
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-[var(--border)] rounded-full h-1.5 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${val * 100}%`, background: color }} />
        </div>
        <span className="text-xs font-mono text-[var(--text-muted)] w-10 text-right">
          {(val * 100).toFixed(0)}%
        </span>
      </div>
    );
  };

  const cols: { key: SortKey; label: string; render: (row: StateData | DistrictData) => React.ReactNode }[] = [
    {
      key: 'name',
      label: selectedStateId ? 'District' : 'State',
      render: (row) => (
        <button
          onClick={() => {
            if ('state_id' in row) setSelectedDistrict(row.id);
            else setSelectedState(row.id);
          }}
          className="text-left font-medium text-brand-400 hover:text-brand-300 hover:underline transition-colors text-sm"
        >
          {row.name}
        </button>
      ),
    },
    {
      key: 'total_pending',
      label: 'Pending',
      render: (row) => (
        <span className="font-mono text-sm">{formatNumber(getMetricValue(row, 'total_pending', caseType))}</span>
      ),
    },
    {
      key: 'disposal_rate',
      label: 'Disposal',
      render: (row) => (
        <span
          className={`font-mono text-sm ${row.disposal_rate > 0.8 ? 'text-emerald-400' : row.disposal_rate > 0.65 ? 'text-amber-400' : 'text-red-400'}`}
        >
          {formatPercent(row.disposal_rate)}
        </span>
      ),
    },
    {
      key: 'cases_per_judge',
      label: 'Cases/Judge',
      render: (row) => (
        <span className="font-mono text-sm">{formatNumber(row.cases_per_judge)}</span>
      ),
    },
    {
      key: 'vacancy_rate',
      label: 'Vacancy',
      render: (row) => (
        <span
          className={`font-mono text-sm ${row.vacancy_rate > 0.35 ? 'text-red-400' : row.vacancy_rate > 0.25 ? 'text-amber-400' : 'text-emerald-400'}`}
        >
          {formatPercent(row.vacancy_rate)}
        </span>
      ),
    },
    {
      key: 'backlog_severity',
      label: 'Severity',
      render: (row) => getSeverityBar(row),
    },
  ];

  if (!states.length) return <div className="h-full skeleton rounded-xl" />;

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {selectedStateId ? 'District Rankings' : 'State Rankings'}
        </h3>
        <span className="text-xs text-[var(--text-muted)]">{rows.length} records</span>
      </div>

      <div className="flex-1 overflow-auto rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="py-1.5 pr-2 text-xs font-medium text-[var(--text-muted)] w-6">#</th>
              {cols.map((col) => (
                <th key={col.key} className="py-1.5 pr-3">
                  <button
                    onClick={() => handleSort(col.key)}
                    className="flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {col.label}
                    <SortIcon k={col.key} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={row.id ?? row.name}
                className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <td className="py-2 pr-2 text-xs text-[var(--text-muted)]">
                  {page * PER_PAGE + i + 1}
                </td>
                {cols.map((col) => (
                  <td key={col.key} className="py-2 pr-3">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-xs px-3 py-1.5 rounded-lg glass-card disabled:opacity-40 hover:bg-brand-500/10 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-[var(--text-muted)]">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="text-xs px-3 py-1.5 rounded-lg glass-card disabled:opacity-40 hover:bg-brand-500/10 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
