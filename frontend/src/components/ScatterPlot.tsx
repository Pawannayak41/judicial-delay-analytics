import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useDataStore, useFilterStore } from '../store';
import { formatNumber, formatPercent } from '../utils/constants';

interface ScatterPoint {
  id: string;
  name: string;
  x: number;  // cases_per_judge
  y: number;  // disposal_rate
  r: number;  // total_pending (bubble size)
  vacancy: number;
  isSelected: boolean;
  isState: boolean;
}

export default function ScatterPlot() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { states, districts } = useDataStore();
  const { selectedStateId, setSelectedState, setSelectedDistrict } = useFilterStore();

  const points = useMemo<ScatterPoint[]>(() => {
    if (selectedStateId) {
      return districts
        .filter(d => d.state_id === selectedStateId)
        .map(d => ({
          id: d.id,
          name: d.name,
          x: d.cases_per_judge,
          y: d.disposal_rate,
          r: d.total_pending,
          vacancy: d.vacancy_rate,
          isSelected: false,
          isState: false,
        }));
    }
    return states.map(s => ({
      id: s.id,
      name: s.name,
      x: s.cases_per_judge,
      y: s.disposal_rate,
      r: s.total_pending,
      vacancy: s.vacancy_rate,
      isSelected: s.id === selectedStateId,
      isState: true,
    }));
  }, [states, districts, selectedStateId]);

  useEffect(() => {
    if (!svgRef.current || points.length === 0) return;

    const el = svgRef.current;
    const parent = el.parentElement!;
    const W = parent.clientWidth || 500;
    const H = parent.clientHeight || 300;
    const margin = { top: 20, right: 20, bottom: 45, left: 55 };
    const w = W - margin.left - margin.right;
    const h = H - margin.top - margin.bottom;

    d3.select(el).selectAll('*').remove();

    const svg = d3.select(el)
      .attr('width', W)
      .attr('height', H);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xExt = d3.extent(points, p => p.x) as [number, number];
    const yExt = d3.extent(points, p => p.y) as [number, number];
    const rExt = d3.extent(points, p => p.r) as [number, number];

    const xScale = d3.scaleLinear().domain([0, xExt[1] * 1.1]).range([0, w]).nice();
    const yScale = d3.scaleLinear().domain([yExt[0] * 0.9, Math.min(1.05, yExt[1] * 1.05)]).range([h, 0]).nice();
    const rScale = d3.scaleSqrt().domain(rExt).range([4, 24]);

    // Grid
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale).tickSize(-w).tickFormat(() => ''))
      .call(el => {
        el.select('.domain').remove();
        el.selectAll('line').attr('stroke', 'var(--border)').attr('stroke-opacity', 0.5);
      });

    // Regression line
    const n = points.length;
    const meanX = d3.mean(points, p => p.x)!;
    const meanY = d3.mean(points, p => p.y)!;
    const slope = d3.sum(points, p => (p.x - meanX) * (p.y - meanY)) /
                  d3.sum(points, p => (p.x - meanX) ** 2);
    const intercept = meanY - slope * meanX;

    const x1 = xScale.domain()[0], x2 = xScale.domain()[1];
    g.append('line')
      .attr('x1', xScale(x1)).attr('y1', yScale(slope * x1 + intercept))
      .attr('x2', xScale(x2)).attr('y2', yScale(slope * x2 + intercept))
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,3')
      .attr('opacity', 0.7);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(xScale).tickFormat(d => formatNumber(+d)))
      .call(el => {
        el.select('.domain').remove();
        el.selectAll('text').attr('fill', 'var(--text-muted)').attr('font-size', 10);
        el.selectAll('line').remove();
      });

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => formatPercent(+d)))
      .call(el => {
        el.select('.domain').remove();
        el.selectAll('text').attr('fill', 'var(--text-muted)').attr('font-size', 10);
        el.selectAll('line').remove();
      });

    // Axis labels
    g.append('text')
      .attr('x', w / 2).attr('y', h + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', 11)
      .text('Cases per Judge');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -h / 2).attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', 11)
      .text('Disposal Rate');

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'chart-tooltip')
      .style('position', 'fixed')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 9999)
      .style('padding', '10px 12px')
      .style('border-radius', '10px')
      .style('font-size', '12px');

    // Bubbles
    const circles = g.selectAll('circle.point')
      .data(points)
      .join('circle')
      .attr('class', 'point')
      .attr('cx', p => xScale(p.x))
      .attr('cy', p => yScale(p.y))
      .attr('r', 0)
      .attr('fill', p => {
        // Color by vacancy severity
        const v = p.vacancy;
        if (v > 0.35) return '#ef4444';
        if (v > 0.25) return '#f97316';
        return '#818cf8';
      })
      .attr('fill-opacity', 0.7)
      .attr('stroke', p => p.isSelected ? '#fff' : 'transparent')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', (event, p) => {
        d3.select(event.target).attr('fill-opacity', 1).attr('stroke', '#fff');
        tooltip
          .style('opacity', 1)
          .html(`
            <div style="font-weight:600;margin-bottom:4px">${p.name}</div>
            <div>Cases/Judge: <b>${formatNumber(p.x)}</b></div>
            <div>Disposal: <b>${formatPercent(p.y)}</b></div>
            <div>Vacancy: <b>${formatPercent(p.vacancy)}</b></div>
            <div>Total Pending: <b>${formatNumber(p.r)}</b></div>
          `);
      })
      .on('mousemove', (event) => {
        tooltip
          .style('left', (event.clientX + 12) + 'px')
          .style('top', (event.clientY - 28) + 'px');
      })
      .on('mouseout', (event, p) => {
        d3.select(event.target).attr('fill-opacity', 0.7).attr('stroke', p.isSelected ? '#fff' : 'transparent');
        tooltip.style('opacity', 0);
      })
      .on('click', (_, p) => {
        if (p.isState) setSelectedState(p.id);
        else setSelectedDistrict(p.id);
        tooltip.style('opacity', 0);
      });

    // Animate in
    circles.transition().duration(600).delay((_, i) => i * 15)
      .attr('r', p => rScale(p.r));

    // Outlier labels (top 3 by cases/judge)
    const outliers = [...points].sort((a, b) => b.x - a.x).slice(0, 3);
    g.selectAll('text.label')
      .data(outliers)
      .join('text')
      .attr('class', 'label')
      .attr('x', p => xScale(p.x) + rScale(p.r) + 4)
      .attr('y', p => yScale(p.y) + 4)
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', 9)
      .text(p => p.name.split(' ')[0]);

    // Color legend
    const legendData = [
      { color: '#ef4444', label: 'Vacancy > 35%' },
      { color: '#f97316', label: 'Vacancy 25–35%' },
      { color: '#818cf8', label: 'Vacancy < 25%' },
    ];
    const lg = svg.append('g').attr('transform', `translate(${margin.left + 8}, ${margin.top + 8})`);
    legendData.forEach((ld, i) => {
      lg.append('circle').attr('cx', 6).attr('cy', i * 18).attr('r', 5).attr('fill', ld.color).attr('fill-opacity', 0.8);
      lg.append('text').attr('x', 16).attr('y', i * 18 + 4).attr('fill', 'var(--text-muted)').attr('font-size', 9).text(ld.label);
    });

    return () => { tooltip.remove(); };
  }, [points]);

  if (!states.length) return <div className="h-full skeleton rounded-xl" />;

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Cases per Judge vs Disposal Rate
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <span className="w-4 border-t border-dashed border-amber-400" />
          Regression line
        </div>
      </div>
      <div className="flex-1 relative">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}
