import { useDataStore, useFilterStore } from '../store';
import AnimatedCounter from './AnimatedCounter';
import { formatNumber, formatPercent } from '../utils/constants';
import {
  Scale, Users, TrendingDown, AlertTriangle, Activity
} from 'lucide-react';

interface KPICard {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: number;
  format: (n: number) => string;
  subLabel: string;
  colorClass: string;
  bgClass: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
}

export default function SummaryCards() {
  const { summary, states, districts } = useDataStore();
  const { selectedStateId, selectedDistrictId, caseType } = useFilterStore();

  // Determine active data scope
  const activeState = selectedStateId
    ? states.find((s) => s.id === selectedStateId)
    : null;
  const activeDistrict = selectedDistrictId
    ? districts.find((d) => d.id === selectedDistrictId)
    : null;
  const data = activeDistrict ?? activeState ?? summary;

  if (!data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card p-4 h-28 skeleton" />
        ))}
      </div>
    );
  }

  const pendingValue =
    caseType === 'civil' ? (data as typeof summary & { civil_pending: number }).civil_pending
    : caseType === 'criminal' ? (data as typeof summary & { criminal_pending: number }).criminal_pending
    : (data as typeof summary & { total_pending: number }).total_pending;

  const cards: KPICard[] = [
    {
      id: 'pending',
      label: 'Total Pending Cases',
      icon: <Scale size={20} />,
      value: pendingValue,
      format: formatNumber,
      subLabel: selectedDistrictId ? 'in district' : selectedStateId ? 'in state' : 'nationwide',
      colorClass: 'text-brand-400',
      bgClass: 'bg-brand-500/10',
      trend: 'up',
      trendLabel: '+2.3% vs last yr',
    },
    {
      id: 'judges',
      label: 'Judges Working',
      icon: <Users size={20} />,
      value: (data as { judges_working: number }).judges_working ?? (summary?.total_judges_working ?? 0),
      format: formatNumber,
      subLabel: `of ${formatNumber((data as { judges_sanctioned?: number }).judges_sanctioned ?? summary?.total_judges_sanctioned ?? 0)} sanctioned`,
      colorClass: 'text-cyan-400',
      bgClass: 'bg-cyan-500/10',
    },
    {
      id: 'disposal',
      label: 'Disposal Rate',
      icon: <TrendingDown size={20} />,
      value: Math.round(((data as { disposal_rate: number }).disposal_rate ?? 0) * 1000) / 10,
      format: (n) => `${n.toFixed(1)}%`,
      subLabel: 'cases disposed/filed',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10',
      trend: 'up',
      trendLabel: 'improving',
    },
    {
      id: 'vacancy',
      label: 'Vacancy Rate',
      icon: <AlertTriangle size={20} />,
      value: Math.round(((data as { vacancy_rate: number }).vacancy_rate ?? 0) * 1000) / 10,
      format: (n) => `${n.toFixed(1)}%`,
      subLabel: 'judicial vacancies',
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-500/10',
      trend: 'down',
      trendLabel: 'needs attention',
    },
    {
      id: 'cpj',
      label: 'Cases / Judge',
      icon: <Activity size={20} />,
      value: (data as { cases_per_judge: number }).cases_per_judge ?? 0,
      format: formatNumber,
      subLabel: 'average workload',
      colorClass: 'text-purple-400',
      bgClass: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((card) => (
        <div
          key={card.id}
          className="glass-card kpi-card p-4 flex flex-col gap-2 group hover:scale-[1.02] transition-all-smooth cursor-default"
        >
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-lg ${card.bgClass} ${card.colorClass}`}>
              {card.icon}
            </div>
            {card.trend && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  card.trend === 'up' ? 'bg-red-500/10 text-red-400'
                  : card.trend === 'down' ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-gray-500/10 text-gray-400'
                }`}
              >
                {card.trendLabel}
              </span>
            )}
          </div>
          <div>
            <div className={`text-2xl font-bold font-mono ${card.colorClass}`}>
              <AnimatedCounter
                value={card.value}
                format={card.format}
                duration={900}
              />
            </div>
            <div className="text-xs font-medium text-[var(--text-primary)] mt-0.5">
              {card.label}
            </div>
            <div className="text-xs text-[var(--text-muted)]">{card.subLabel}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
