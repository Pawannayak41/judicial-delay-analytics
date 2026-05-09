// Dataset types matching the JSON schema from the scraper

export interface AgeDistribution {
  '0_1yr': number;
  '1_3yr': number;
  '3_5yr': number;
  '5_10yr': number;
  '10plus_yr': number;
}

export interface IndiaSummary {
  last_updated: string;
  source: string;
  total_pending: number;
  civil_pending: number;
  criminal_pending: number;
  total_judges_sanctioned: number;
  total_judges_working: number;
  vacancy_rate: number;
  disposal_rate: number;
  cases_per_judge: number;
  age_distribution: AgeDistribution;
  num_states: number;
  num_districts: number;
}

export interface StateData {
  id: string;          // e.g. "UP"
  slug: string;        // e.g. "uttar_pradesh"
  name: string;
  total_pending: number;
  civil_pending: number;
  criminal_pending: number;
  judges_sanctioned: number;
  judges_working: number;
  vacancy_rate: number;
  disposal_rate: number;
  cases_per_judge: number;
  backlog_severity: number;
  num_districts: number;
  age_distribution: AgeDistribution;
}

export interface DistrictData {
  id: string;          // e.g. "uttar_pradesh__lucknow"
  state_id: string;    // e.g. "UP"
  state_name: string;
  name: string;
  total_pending: number;
  civil_pending: number;
  criminal_pending: number;
  judges_sanctioned: number;
  judges_working: number;
  vacancy_rate: number;
  disposal_rate: number;
  cases_per_judge: number;
  backlog_severity: number;
  age_distribution: AgeDistribution;
}

export interface TimeSeriesPoint {
  month: string;
  filed: number;
  disposed: number;
  pending: number;
}

export interface TimeSeries {
  national: TimeSeriesPoint[];
  by_state: Record<string, TimeSeriesPoint[]>;
}

// UI / Store types
export type CaseType = 'all' | 'civil' | 'criminal';
export type MetricKey =
  | 'total_pending'
  | 'disposal_rate'
  | 'cases_per_judge'
  | 'vacancy_rate'
  | 'backlog_severity';

export type ViewLevel = 'national' | 'state' | 'district';

export interface FilterState {
  selectedStateId: string | null;
  selectedDistrictId: string | null;
  caseType: CaseType;
  metric: MetricKey;
  yearRange: [number, number];
}

export interface DataState {
  summary: IndiaSummary | null;
  states: StateData[];
  districts: DistrictData[];
  timeSeries: TimeSeries | null;
  loading: boolean;
  error: string | null;
}

export interface UIState {
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  activePanel: string;
}
