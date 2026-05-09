import type { MetricKey, StateData, DistrictData } from '../types';

export const METRIC_LABELS: Record<MetricKey, string> = {
  total_pending: 'Total Pending Cases',
  disposal_rate: 'Disposal Efficiency',
  cases_per_judge: 'Cases Per Judge',
  vacancy_rate: 'Vacancy Rate',
  backlog_severity: 'Backlog Severity',
};

export const METRIC_UNITS: Record<MetricKey, string> = {
  total_pending: 'cases',
  disposal_rate: '%',
  cases_per_judge: 'cases/judge',
  vacancy_rate: '%',
  backlog_severity: 'score',
};

export const METRIC_IS_PERCENT: Record<MetricKey, boolean> = {
  total_pending: false,
  disposal_rate: true,
  cases_per_judge: false,
  vacancy_rate: true,
  backlog_severity: false,
};

export const AGE_LABELS: Record<string, string> = {
  '0_1yr': '< 1 Year',
  '1_3yr': '1–3 Years',
  '3_5yr': '3–5 Years',
  '5_10yr': '5–10 Years',
  '10plus_yr': '10+ Years',
};

export const AGE_COLORS = [
  '#22d3ee',  // cyan  — fresh
  '#a3e635',  // lime
  '#fbbf24',  // amber
  '#f97316',  // orange
  '#ef4444',  // red   — severe
];

export const CASE_TYPE_COLORS = {
  civil: '#818cf8',
  criminal: '#f87171',
  all: '#6366f1',
};

export function formatNumber(n: number): string {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString('en-IN');
}

export function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function formatMetric(value: number, metric: MetricKey): string {
  if (METRIC_IS_PERCENT[metric]) return formatPercent(value);
  if (metric === 'backlog_severity') return value.toFixed(3);
  return formatNumber(value);
}

export function getMetricValue(
  row: StateData | DistrictData,
  metric: MetricKey,
  caseType: 'all' | 'civil' | 'criminal' = 'all'
): number {
  if (metric === 'total_pending') {
    if (caseType === 'civil') return row.civil_pending;
    if (caseType === 'criminal') return row.criminal_pending;
    return row.total_pending;
  }
  return (row as unknown as Record<string, number>)[metric] ?? 0;
}

/** D3 color scale range for choropleth — low to high severity */
export const CHOROPLETH_COLORS = {
  total_pending:    ['#dbeafe', '#1e40af'],
  disposal_rate:    ['#dc2626', '#16a34a'],  // inverted: red=low, green=high
  cases_per_judge:  ['#ede9fe', '#5b21b6'],
  vacancy_rate:     ['#fef9c3', '#b45309'],
  backlog_severity: ['#fef2f2', '#7f1d1d'],
};

export const CHOROPLETH_COLORS_DARK = {
  total_pending:    ['#1e3a5f', '#93c5fd'],
  disposal_rate:    ['#7f1d1d', '#4ade80'],
  cases_per_judge:  ['#2e1065', '#c4b5fd'],
  vacancy_rate:     ['#422006', '#fde68a'],
  backlog_severity: ['#1c0a00', '#fca5a5'],
};
