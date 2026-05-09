import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine,
} from 'recharts';
import { useDataStore, useFilterStore } from '../store';
import { formatNumber } from '../utils/constants';

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip p-3 rounded-xl shadow-xl">
      <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[var(--text-secondary)]">{p.name}:</span>
          <span className="font-mono font-semibold text-[var(--text-primary)]">
            {formatNumber(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function TimeSeriesChart() {
  const { timeSeries } = useDataStore();
  const { selectedStateId, yearRange } = useFilterStore();

  const data = useMemo(() => {
    if (!timeSeries) return [];
    const series = selectedStateId && timeSeries.by_state[selectedStateId]
      ? timeSeries.by_state[selectedStateId]
      : timeSeries.national;

    return series
      .filter((d) => {
        const year = parseInt(d.month.split('-')[0]);
        return year >= yearRange[0] && year <= yearRange[1];
      })
      .map((d) => ({
        month: d.month,
        label: new Date(d.month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        Filed: d.filed,
        Disposed: d.disposed,
        Pending: d.pending,
      }));
  }, [timeSeries, selectedStateId, yearRange]);

  if (!timeSeries) {
    return <div className="h-full skeleton rounded-xl" />;
  }

  const scope = selectedStateId
    ? `— ${timeSeries.by_state[selectedStateId] ? selectedStateId : 'National'}`
    : '— National';

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Filing & Disposal Trends {scope}
        </h3>
        <span className="text-xs text-[var(--text-muted)]">
          {yearRange[0]}–{yearRange[1]}
        </span>
      </div>

      <ResponsiveContainer width="100%" height="45%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="filedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="disposedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            interval={5}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatNumber(v)}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
          />
          <Area
            type="monotone"
            dataKey="Filed"
            stroke="#818cf8"
            strokeWidth={2}
            fill="url(#filedGrad)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="Disposed"
            stroke="#34d399"
            strokeWidth={2}
            fill="url(#disposedGrad)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="text-xs font-medium text-[var(--text-secondary)] mt-1">
        Pendency Over Time
      </div>

      <ResponsiveContainer width="100%" height="40%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            interval={5}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatNumber(v)}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="Pending"
            stroke="#f87171"
            strokeWidth={2}
            fill="url(#pendingGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
