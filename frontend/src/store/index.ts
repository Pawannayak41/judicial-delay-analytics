import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  FilterState, DataState, UIState,
  IndiaSummary, StateData, DistrictData, TimeSeries,
  CaseType, MetricKey,
} from '../types';

// ─── Data Store ───────────────────────────────────────────────────────────────

interface DataStore extends DataState {
  loadAll: () => Promise<void>;
}

const BASE = import.meta.env.BASE_URL;

const fetchJson = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${BASE}data/${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json() as Promise<T>;
};

export const useDataStore = create<DataStore>()(
  subscribeWithSelector((set) => ({
    summary: null,
    states: [],
    districts: [],
    timeSeries: null,
    loading: false,
    error: null,

    loadAll: async () => {
      set({ loading: true, error: null });
      try {
        const [summary, states, districts, timeSeries] = await Promise.all([
          fetchJson<IndiaSummary>('india_summary.json'),
          fetchJson<StateData[]>('states.json'),
          fetchJson<DistrictData[]>('districts.json'),
          fetchJson<TimeSeries>('time_series.json'),
        ]);
        set({ summary, states, districts, timeSeries, loading: false });
      } catch (err) {
        set({ error: String(err), loading: false });
      }
    },
  }))
);

// ─── Filter Store ─────────────────────────────────────────────────────────────

interface FilterStore extends FilterState {
  setSelectedState: (id: string | null) => void;
  setSelectedDistrict: (id: string | null) => void;
  setCaseType: (type: CaseType) => void;
  setMetric: (metric: MetricKey) => void;
  setYearRange: (range: [number, number]) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  selectedStateId: null,
  selectedDistrictId: null,
  caseType: 'all',
  metric: 'total_pending',
  yearRange: [2020, 2024],
};

export const useFilterStore = create<FilterStore>()(
  subscribeWithSelector((set) => ({
    ...DEFAULT_FILTERS,
    setSelectedState: (id) => set({ selectedStateId: id, selectedDistrictId: null }),
    setSelectedDistrict: (id) => set({ selectedDistrictId: id }),
    setCaseType: (type) => set({ caseType: type }),
    setMetric: (metric) => set({ metric }),
    setYearRange: (range) => set({ yearRange: range }),
    resetFilters: () => set(DEFAULT_FILTERS),
  }))
);

// ─── UI Store ─────────────────────────────────────────────────────────────────

interface UIStore extends UIState {
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActivePanel: (panel: string) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  theme: 'dark',
  sidebarOpen: true,
  activePanel: 'overview',

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      return { theme: next };
    }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActivePanel: (panel) => set({ activePanel: panel }),
}));
