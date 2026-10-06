import { useEffect, useMemo, useRef, useState } from 'react';
import { geoEqualEarth, geoPath, geoGraticule10 } from 'd3-geo';
import { feature } from 'topojson-client';
import { zoom as d3zoom, zoomIdentity } from 'd3-zoom';
import { select } from 'd3-selection';
import world from 'world-atlas/countries-110m.json';
import { byKey, byIso2 } from '@/lib/travel';

const W = 960, H = 500;
export const SHAPES = feature(world, world.objects.countries).features.map((f) => ({
  ...f,
  key: f.id ?? 'n:' + f.properties.name,
}));
// Countries too small for this map scale get a marker instead.
const MICRO_COORDS = {
  VA: [12.45, 41.9], AD: [1.52, 42.51], LI: [9.52, 47.14], MT: [14.51, 35.9], MC: [7.42, 43.74], SM: [12.45, 43.94],
  AG: [-61.85, 17.12], BB: [-59.6, 13.1], DM: [-61.39, 15.3], GD: [-61.68, 12.06], KN: [-62.72, 17.3], LC: [-60.98, 13.9],
  VC: [-61.2, 13.16], BH: [50.58, 26.22], MV: [73.51, 4.17], SG: [103.82, 1.35], KI: [173.0, 1.33], MH: [171.38, 7.09],
  FM: [158.16, 6.92], NR: [166.93, -0.53], PW: [134.48, 7.5], WS: [-171.76, -13.83], TO: [-175.2, -21.14], TV: [179.2, -8.52],
  CV: [-23.51, 14.93], KM: [43.26, -11.7], MU: [57.5, -20.16], ST: [6.73, 0.34], SC: [55.45, -4.62],
};
export const MICRO = Object.entries(MICRO_COORDS).filter(([iso]) => byIso2[iso]).map(([iso, coords]) => ({ key: byIso2[iso].key, name: byIso2[iso].name, coords }));
export const ALL_PLACES = [...SHAPES.map((s) => ({ key: s.key, name: byKey[s.key]?.name ?? s.properties.name })), ...MICRO.map((m) => ({ key: m.key, name: m.name }))]
  .sort((a, b) => a.name.localeCompare(b.name));

export default function WorldMap({ visited, onToggle, onOpen }) {
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [k, setK] = useState(1);
  const zoomRef = useRef(null);

  const projection = useMemo(() => geoEqualEarth().fitExtent([[8, 8], [W - 8, H - 8]], { type: 'Sphere' }), []);
  const path = useMemo(() => geoPath(projection), [projection]);
  const sphere = useMemo(() => path({ type: 'Sphere' }), [path]);
  const grat = useMemo(() => path(geoGraticule10()), [path]);

  useEffect(() => {
    const z = d3zoom().scaleExtent([1, 8]).translateExtent([[0, 0], [W, H]])
      .on('zoom', (e) => { gRef.current.setAttribute('transform', e.transform); setK(e.transform.k); });
    zoomRef.current = z;
    select(svgRef.current).call(z).on('dblclick.zoom', null);
  }, []);

  const reset = () => zoomRef.current.transform(select(svgRef.current), zoomIdentity);

  const click = (key, name) => {
    if (byKey[key]) onOpen(byKey[key], key, name);
    else onToggle(key, name);
  };

  return (
    <div className="map-wrap">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="world" role="img" aria-label="World map of places you have visited">
        <defs>
          <linearGradient id="visitedFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--rose)" />
            <stop offset="100%" stopColor="var(--gold)" />
          </linearGradient>
        </defs>
        <path d={sphere} className="sphere" />
        <g ref={gRef}>
          <path d={grat} className="graticule" style={{ strokeWidth: 0.5 / k }} />
          {SHAPES.map((f) => {
            const isV = visited.has(f.key);
            const guide = byKey[f.key];
            return (
              <path
                key={f.key}
                d={path(f)}
                className={'land' + (isV ? ' visited' : '') + (guide?.deep ? ' has-guide' : '')}
                style={{ strokeWidth: 0.5 / k }}
                onMouseEnter={() => setHover({ name: (guide ? guide.flag + ' ' + guide.name : f.properties.name), isV, guide: !!guide })}
                onMouseLeave={() => setHover(null)}
                onClick={() => click(f.key, f.properties.name)}
              />
            );
          })}
          {MICRO.map((m) => {
            const [x, y] = projection(m.coords);
            const isV = visited.has(m.key);
            return (
              <circle key={m.key} cx={x} cy={y} r={2.6 / k} className={'micro' + (isV ? ' visited' : '')}
                onMouseEnter={() => setHover({ name: byKey[m.key].flag + ' ' + m.name, isV, guide: true })} onMouseLeave={() => setHover(null)}
                onClick={() => click(m.key, m.name)} />
            );
          })}
        </g>
      </svg>
      <div className="map-tools">
        <button onClick={() => zoomRef.current.scaleBy(select(svgRef.current), 1.6)} aria-label="Zoom in">+</button>
        <button onClick={() => zoomRef.current.scaleBy(select(svgRef.current), 1 / 1.6)} aria-label="Zoom out">−</button>
        <button onClick={reset} aria-label="Reset view">⟲</button>
      </div>
      <div className="map-hint">
        {hover
          ? <><strong>{hover.name}</strong>{hover.isV ? ' · visited' : ''}{hover.guide ? ' · tap to open' : ' · tap to colour in'}</>
          : 'Tap any country to colour it in or open its page. Gold edges mark the full guides; dots mark small island and city states.'}
      </div>
    </div>
  );
}
