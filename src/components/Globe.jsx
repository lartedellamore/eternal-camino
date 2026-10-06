import { useEffect, useMemo, useRef, useState } from 'react';
import { geoOrthographic, geoPath, geoGraticule10, geoCentroid, geoDistance } from 'd3-geo';
import { SHAPES, MICRO } from './WorldMap';
import { byKey } from '@/lib/travel';

const S = 600; // internal drawing size; the SVG scales to its container

const centroids = Object.fromEntries([
  ...SHAPES.map((f) => [f.key, geoCentroid(f)]),
  ...MICRO.map((m) => [m.key, m.coords]),
]);

// A slowly turning globe you can spin by hand. `focus` turns it to one country and holds still.
export default function Globe({ visited, onPick, focus, size = 'hero' }) {
  const [rot, setRot] = useState(() => (focus && centroids[focus] ? [-centroids[focus][0], -centroids[focus][1] * 0.8] : [-10, -22]));
  const [hover, setHover] = useState(null);
  const drag = useRef(null);
  const idle = useRef(0);
  const reduce = useMemo(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  // ease toward a focused country
  useEffect(() => {
    if (!focus || !centroids[focus]) return;
    const [lon, lat] = centroids[focus];
    const target = [-lon, -lat * 0.8];
    let raf, t = 0;
    const from = [...rot];
    const d0 = ((target[0] - from[0] + 540) % 360) - 180;
    const step = () => {
      t = Math.min(1, t + 0.04);
      const e = 1 - Math.pow(1 - t, 3);
      setRot([from[0] + d0 * e, from[1] + (target[1] - from[1]) * e]);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [focus]); // eslint-disable-line

  // gentle auto-rotation when nobody is touching it
  useEffect(() => {
    if (focus || reduce) return;
    let raf, last = performance.now();
    const tick = (now) => {
      const dt = now - last; last = now;
      if (!drag.current && now - idle.current > 2500) setRot(([l, p]) => [l + dt * 0.006, p]);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [focus, reduce]);

  const projection = useMemo(() => geoOrthographic().translate([S / 2, S / 2]).scale(S / 2 - 2).rotate(rot), [rot]);
  const path = useMemo(() => geoPath(projection), [projection]);
  const grat = path(geoGraticule10());
  const center = [-rot[0], -rot[1]];

  const down = (e) => {
    drag.current = { x: e.clientX, y: e.clientY, rot, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    const k = 0.35;
    setRot([d.rot[0] + dx * k, Math.max(-70, Math.min(70, d.rot[1] - dy * k))]);
  };
  const up = () => { idle.current = performance.now(); setTimeout(() => { drag.current = null; }, 0); };
  const pick = (key, name) => { if (drag.current?.moved) return; onPick?.(key, name); };

  return (
    <div className={'globe-wrap ' + size}>
      <svg viewBox={`0 0 ${S} ${S}`} className="globe" role="img" aria-label="Globe of the countries you have visited"
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}>
        <defs>
          <radialGradient id="ocean" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="var(--ocean-hi)" />
            <stop offset="70%" stopColor="var(--ocean)" />
            <stop offset="100%" stopColor="var(--ocean-lo)" />
          </radialGradient>
          <radialGradient id="shade" cx="35%" cy="30%" r="80%">
            <stop offset="55%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity=".38" />
          </radialGradient>
          <linearGradient id="roseGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--rose)" />
            <stop offset="100%" stopColor="var(--gold)" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={S / 2} cy={S / 2} r={S / 2 - 2} fill="url(#ocean)" className="globe-ocean" />
        <path d={grat} className="globe-grat" />
        {SHAPES.map((f) => {
          const d = path(f);
          if (!d) return null;
          const isV = visited?.has(f.key);
          const isF = focus === f.key;
          return (
            <path key={f.key} d={d}
              className={'g-land' + (isV ? ' visited' : '') + (isF ? ' focus' : '') + (byKey[f.key]?.deep ? ' deep' : '')}
              filter={isV || isF ? 'url(#glow)' : undefined}
              onClick={() => pick(f.key, byKey[f.key]?.name ?? f.properties.name)}
              onMouseEnter={() => setHover(byKey[f.key] ? `${byKey[f.key].flag} ${byKey[f.key].name}` : f.properties.name)}
              onMouseLeave={() => setHover(null)} />
          );
        })}
        {MICRO.map((m) => {
          if (geoDistance(m.coords, center) > Math.PI / 2 - 0.05) return null;
          const [x, y] = projection(m.coords);
          const isV = visited?.has(m.key);
          return (
            <circle key={m.key} cx={x} cy={y} r={focus === m.key ? 6 : 3.2}
              className={'g-micro' + (isV ? ' visited' : '') + (focus === m.key ? ' focus' : '')}
              onClick={() => pick(m.key, m.name)}
              onMouseEnter={() => setHover(`${byKey[m.key].flag} ${m.name}`)} onMouseLeave={() => setHover(null)} />
          );
        })}
        <circle cx={S / 2} cy={S / 2} r={S / 2 - 2} fill="url(#shade)" pointerEvents="none" />
        <circle cx={S / 2} cy={S / 2} r={S / 2 - 2} className="globe-rim" pointerEvents="none" />
      </svg>
      {size === 'hero' && <div className="globe-hint">{hover || 'Drag to turn the world · tap a country'}</div>}
    </div>
  );
}
