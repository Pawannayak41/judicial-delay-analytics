import { useEffect, useRef, useCallback, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import * as d3 from 'd3';
import { useDataStore, useFilterStore } from '../store';
import { useUIStore } from '../store';
import type { StateData, DistrictData, MetricKey } from '../types';
import {
  CHOROPLETH_COLORS,
  CHOROPLETH_COLORS_DARK,
  METRIC_LABELS,
  formatMetric,
  getMetricValue,
} from '../utils/constants';

// ─── GeoJSON Layer Controller ─────────────────────────────────────────────────

interface GeoLayerProps {
  geoData: GeoJSON.FeatureCollection | null;
  states: StateData[];
  districts: DistrictData[];
  selectedStateId: string | null;
  metric: MetricKey;
  caseType: 'all' | 'civil' | 'criminal';
  theme: 'dark' | 'light';
  onStateClick: (stateId: string) => void;
  onDistrictClick: (districtId: string) => void;
}

function GeoLayer({
  geoData, states, districts, selectedStateId,
  metric, caseType, theme, onStateClick, onDistrictClick,
}: GeoLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  const getColor = useCallback((value: number, scale: d3.ScaleSequential<string>) => {
    return scale(value) || '#6b7280';
  }, []);

  useEffect(() => {
    if (!geoData) return;

    // Clean up previous layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    const isStateLevel = !selectedStateId;
    const rows: (StateData | DistrictData)[] = isStateLevel ? states : districts.filter(
      d => d.state_id === selectedStateId
    );

    if (rows.length === 0) return;

    const values = rows.map(r => getMetricValue(r, metric, caseType)).filter(v => v > 0);
    const [minVal, maxVal] = d3.extent(values) as [number, number];

    const colorRange = theme === 'dark'
      ? CHOROPLETH_COLORS_DARK[metric]
      : CHOROPLETH_COLORS[metric];

    const colorScale = d3.scaleSequential()
      .domain([minVal, maxVal])
      .interpolator(d3.interpolateRgb(colorRange[0], colorRange[1]));

    // Index data by normalized name for fuzzy lookup
    const normalize = (s: string) => s.toLowerCase()
      .replace(/[&]/g, 'and')
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const dataByName = new Map<string, StateData | DistrictData>();
    rows.forEach(r => {
      dataByName.set(normalize(r.name), r);
      if ('id' in r) dataByName.set(normalize(r.id.replace(/_/g, ' ')), r);
      // Also index by slug
      if ('slug' in r) dataByName.set(normalize((r as StateData).slug.replace(/_/g, ' ')), r);
    });

    const filteredFeatures = geoData.features.filter((feature: any) => {
      if (isStateLevel) return true;
      const raw = feature?.properties?.NAME_1 || feature?.properties?.NAME_2 ||
        feature?.properties?.st_nm || feature?.properties?.district ||
        feature?.properties?.name || '';
      return dataByName.has(normalize(raw));
    });

    if (filteredFeatures.length === 0) return;

    const layer = L.geoJSON({ ...geoData, features: filteredFeatures } as GeoJSON.FeatureCollection, {
      style: (feature) => {
        const raw = feature?.properties?.NAME_1 || feature?.properties?.NAME_2 ||
          feature?.properties?.st_nm || feature?.properties?.district ||
          feature?.properties?.name || '';
        const name = normalize(raw);
        const row = dataByName.get(name);
        const val = row ? getMetricValue(row, metric, caseType) : 0;
        const color = val > 0 ? getColor(val, colorScale) : (theme === 'dark' ? '#1e293b' : '#e2e8f0');

        return {
          fillColor: color,
          weight: 1,
          opacity: 1,
          color: theme === 'dark' ? '#334155' : '#cbd5e1',
          fillOpacity: 0.8,
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const rawName = feature.properties?.NAME_1 || feature.properties?.NAME_2 ||
          feature.properties?.st_nm || feature.properties?.district ||
          feature.properties?.name || 'Unknown';
        const name = normalize(rawName);
        const row = dataByName.get(name);

        // Hover effects
        featureLayer.on({
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({ weight: 2.5, fillOpacity: 0.95 });
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
              l.bringToFront();
            }
            if (row) {
              const val = getMetricValue(row, metric, caseType);
              l.bindPopup(`
                <div class="p-1">
                  <div class="font-semibold text-sm">${row.name}</div>
                  <div class="text-xs text-gray-400">${isStateLevel ? 'State' : row.state_name}</div>
                  <div class="mt-1 text-base font-mono font-bold" style="color:var(--accent)">
                    ${formatMetric(val, metric)}
                  </div>
                  <div class="text-xs">${METRIC_LABELS[metric]}</div>
                  ${!isStateLevel ? `<div class="text-xs mt-1">Pending: ${(row as DistrictData).total_pending.toLocaleString('en-IN')}</div>` : ''}
                </div>
              `).openPopup(e.latlng);
            }
          },
          mouseout: (e) => {
            layer.resetStyle(e.target);
            featureLayer.closePopup();
          },
          click: () => {
            if (row) {
              if (isStateLevel) {
                // Find state by matching name
                const state = states.find(s => s.name.toLowerCase() === row.name.toLowerCase());
                if (state) onStateClick(state.id);
              } else {
                onDistrictClick((row as DistrictData).id);
              }
            }
          },
        });
      },
    });

    layer.addTo(map);
    layerRef.current = layer;

    // Fit bounds
    try {
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20], duration: 0.5 });
      }
    } catch {}

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [geoData, states, districts, selectedStateId, metric, caseType, theme]);

  return null;
}

// ─── Legend ───────────────────────────────────────────────────────────────────

interface LegendProps {
  metric: MetricKey;
  theme: 'dark' | 'light';
}

function Legend({ metric, theme }: LegendProps) {
  const colorRange = theme === 'dark'
    ? CHOROPLETH_COLORS_DARK[metric]
    : CHOROPLETH_COLORS[metric];

  return (
    <div className="absolute bottom-8 left-4 z-[1000] glass-card p-3 min-w-[140px]">
      <div className="text-xs font-semibold mb-2 text-[var(--text-secondary)]">
        {METRIC_LABELS[metric]}
      </div>
      <div
        className="h-3 rounded-full w-full"
        style={{
          background: `linear-gradient(to right, ${colorRange[0]}, ${colorRange[1]})`,
        }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[var(--text-muted)]">Low</span>
        <span className="text-[10px] text-[var(--text-muted)]">High</span>
      </div>
    </div>
  );
}

// ─── Main Choropleth Component ────────────────────────────────────────────────

export default function ChoroplethMap() {
  const { states, districts } = useDataStore();
  const { selectedStateId, metric, caseType, setSelectedState, setSelectedDistrict } = useFilterStore();
  const { theme } = useUIStore();

  const [stateGeo, setStateGeo] = useState<GeoJSON.FeatureCollection | null>(null);
  const [districtGeo, setDistrictGeo] = useState<GeoJSON.FeatureCollection | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);

  const BASE = import.meta.env.BASE_URL;

  // Load GeoJSON
  useEffect(() => {
    setGeoLoading(true);
    fetch(`${BASE}data/geo/india_states.geojson`)
      .then(r => r.json())
      .then(d => { setStateGeo(d); setGeoLoading(false); })
      .catch(() => setGeoLoading(false));
  }, [BASE]);

  useEffect(() => {
    if (!selectedStateId) return;
    fetch(`${BASE}data/geo/india_districts.geojson`)
      .then(r => r.json())
      .then(d => setDistrictGeo(d))
      .catch(() => {});
  }, [selectedStateId, BASE]);

  const activeGeo = selectedStateId && districtGeo ? districtGeo : stateGeo;

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden glass-card">
      {/* Header */}
      <div className="absolute top-3 left-3 z-[1000] glass-card px-3 py-2">
        <div className="text-sm font-semibold text-[var(--text-primary)]">
          {selectedStateId
            ? `${states.find(s => s.id === selectedStateId)?.name ?? selectedStateId} — Districts`
            : 'India — State Overview'}
        </div>
        {selectedStateId && (
          <button
            onClick={() => { setSelectedState(null); setSelectedDistrict(null); }}
            className="text-xs text-brand-400 hover:text-brand-300 mt-0.5 flex items-center gap-1"
          >
            ← Back to India
          </button>
        )}
      </div>

      {geoLoading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[var(--bg-card)]/80">
          <div className="text-sm text-[var(--text-muted)] animate-pulse">Loading map data…</div>
        </div>
      )}

      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={true}
      >
        {/* Carto dark tile layer — beautiful minimal base map */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
          maxZoom={19}
        />
        {/* Labels on top */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
          maxZoom={19}
          pane="shadowPane"
        />

        {activeGeo && (
          <GeoLayer
            geoData={activeGeo}
            states={states}
            districts={districts}
            selectedStateId={selectedStateId}
            metric={metric}
            caseType={caseType}
            theme={theme}
            onStateClick={setSelectedState}
            onDistrictClick={setSelectedDistrict}
          />
        )}
      </MapContainer>

      <Legend metric={metric} theme={theme} />

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
        <button
          onClick={() => {}}
          className="glass-card w-8 h-8 flex items-center justify-center text-sm font-bold hover:bg-brand-500/20 transition-colors"
        >
          +
        </button>
        <button
          className="glass-card w-8 h-8 flex items-center justify-center text-sm font-bold hover:bg-brand-500/20 transition-colors"
        >
          −
        </button>
      </div>
    </div>
  );
}
