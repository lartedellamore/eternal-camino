import { useEffect, useRef } from 'react';

// A quiet night sky behind the app. Stars only show in the dark theme (CSS hides the canvas in light).
export default function Starfield() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stars = [], raf, w, h;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      w = c.width = innerWidth * dpr; h = c.height = innerHeight * dpr;
      c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
      const n = Math.round((innerWidth * innerHeight) / 5200);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: (Math.random() ** 3 * 1.4 + 0.25) * dpr,
        p: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 1.2,
        gold: Math.random() < 0.12,
      }));
    };
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const a = reduce ? 0.7 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.p + (t / 1000) * s.s));
        ctx.globalAlpha = a;
        ctx.fillStyle = s.gold ? '#f1d9a0' : '#e9ecff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    resize(); draw(0);
    addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="starfield" aria-hidden="true" />;
}
