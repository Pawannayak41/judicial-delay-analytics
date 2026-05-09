import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { useDataStore, useFilterStore } from '../store';
import { AGE_LABELS, AGE_COLORS, formatNumber } from '../utils/constants';
import type { AgeDistribution } from '../types';

const AGE_KEYS = ['0_1yr', '1_3yr', '3_5yr', '5_10yr', '10plus_yr'] as const;

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; fill: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="chart-tooltip p-3 rounded-xl">
      <p className="text-xs font-semibold mb-2 text-[var(--text-muted)]">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs py-0.5">
          <span className="w-2 h-2 rounded-sm" style={{ background: p.fill }} />
          <span className="text-[var(--text-secondary)] flex-1">{p.name}</span>
          <span className="font-mono font-semibold">{formatNumber(p.value)}</span>
          <span className="text-[var(--text-muted)]">
            ({total > 0 ? ((p.value / total) * 100).toFixed(1) : 0}%)
          </span>
        </div>
      ))}
    </div>
  );
};

export default function AgeDistributionChart() {
  const { states, districts, summary } = useDataStore();
  const { selectedStateId, selectedDistrictId, caseType } = useFilterStore();

  // Build bar chart data
  const chartData = useMemo(() => {
    let sources: { name: string; age_distribution: AgeDistribution }[] = [];

    if (selectedDistrictId) {
      const d = districts.find(d => d.id === selectedDistrictId);
      if (d) sources = [d];
    } else if (selectedStateId) {
      // Show top 8 districts sorted by total pending
      sources = districts
        .filter(d => d.state_id === selectedStateId)
        .sort((a, b) => b.total_pending - a.total_pending)
        .slice(0, 8)
        .map(d => ({ name: d.name, age_distribution: d.age_distribution }));
    } else {
      // National: one bar per age bucket, summed across states
      const national: AgeDistribution = {
        '0_1yr': 0, '1_3yr': 0, '3_5yr': 0, '5_10yr': 0, '10plus_yr': 0,
      };
      states.forEach(s => {
        AGE_KEYS.forEach(k => { national[k] += s.age_distribution[k]; });
      });
      // Show top 8 states
      sources = states
        .sort((a, b) => b.total_pending - a.total_pending)
        .slice(0, 8)
        .map(s => ({ name: s.name.split(' ')[0], age_distribution: s.age_distribution }));
    }

    return sources.map(({ name, age_distribution: ad }) => ({
      name,
      [AGE_LABELS['0_1yr']]: ad['0_1yr'],
      [AGE_LABELS['1_3yr']]: ad['1_3yr'],
      [AGE_LABELS['3_5yr']]: ad['3_5yr'],
      [AGE_LABELS['5_10yr']]: ad['5_10yr'],
      [AGE_LABELS['10plus_yr']]: ad['10plus_yr'],
    }));
  }, [states, districts, summary, selectedStateId, selectedDistrictId]);

  // Donut summary for selected scope
  const donutData = useMemo(() => {
    let ad: AgeDistribution;
    if (selectedDistrictId) {
      ad = districts.find(d => d.id === selectedDistrictId)?.age_distribution ?? summary?.age_distribution!;
    } else if (selectedStateId) {
      ad = states.find(s => s.id === selectedStateId)?.age_distribution ?? summary?.age_distribution!;
    } else {
      ad = summary?.age_distribution ?? { '0_1yr': 0, '1_3yr': 0, '3_5yr': 0, '5_10yr': 0, '10plus_yr': 0 };
    }
    const total = AGE_KEYS.reduce((s, k) => s + (ad[k] ?? 0), 0);
    return AGE_KEYS.map((k, i) => ({
      key: k,
      label: AGE_LABELS[k],
      value: ad[k] ?? 0,
      pct: total > 0 ? ((ad[k] ?? 0) / total * 100).toFixed(1) : '0',
      color: AGE_COLORS[i],
    }));
  }, [states, districts, summary, selectedStateId, selectedDistrictId]);

  if (!summary) return <div className="h-full skeleton rounded-xl" />;

  return (
    <div className="h-full flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
        Age-wise Pendency Distribution
      </h3>

      {/* Mini age breakdown pills */}
      <div className="flex flex-wrap gap-2">
        {donutData.map((d) => (
          <div
            key={d.key}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
            style={{ background: d.color + '22' }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
            <span className="text-[var(--text-secondary)]">{d.label}</span>
            <span className="font-mono font-bold" style={{ color: d.color }}>{d.pct}%</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height="75%">
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 8, left: 0, bottom: 20 }}
          barSize={selectedStateId ? 14 : 18}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            angle={-25}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatNumber(v)}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
          {AGE_KEYS.map((k, i) => (
            <Bar
              key={k}
              dataKey={AGE_LABELS[k]}
              stackId="age"
              fill={AGE_COLORS[i]}
              radius={i === AGE_KEYS.length - 1 ? [3, 3, 0, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
