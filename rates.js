import { useEffect, useState } from 'react';
import { FALLBACK_RATES } from './travel';

// Live exchange rates (open.er-api.com, daily, no key needed). Cached for 6 hours on the device.
const KEY = 'eternal-camino:rates';
const TTL = 6 * 3600 * 1000;

export function useRates() {
  const [state, setState] = useState(() => {
    try {
      const c = JSON.parse(localStorage.getItem(KEY));
      if (c?.rates) return { ...c, status: Date.now() - c.fetched < TTL ? 'live' : 'stale' };
    } catch { /* ignore */ }
    return { rates: FALLBACK_RATES, status: 'loading', updated: null };
  });

  useEffect(() => {
    if (state.status === 'live') return;
    let alive = true;
    fetch('https://open.er-api.com/v6/latest/EUR')
      .then((r) => r.json())
      .then((d) => {
        if (!alive || d.result !== 'success') throw new Error('bad');
        const next = { rates: d.rates, updated: d.time_last_update_utc, fetched: Date.now() };
        try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
        setState({ ...next, status: 'live' });
      })
      .catch(() => alive && setState((s) => ({ ...s, status: s.updated ? 'stale' : 'offline' })));
    return () => { alive = false; };
  }, []); // eslint-disable-line

  const convert = (amount, from, to) => {
    const r = state.rates;
    if (!r[from] || !r[to]) return null;
    return (amount / r[from]) * r[to];
  };
  return { ...state, convert, codes: Object.keys(state.rates).sort() };
}

export function fmt(n, code) {
  if (n == null || isNaN(n)) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code, maximumFractionDigits: n >= 1000 ? 0 : 2 }).format(n);
  } catch { return `${n.toFixed(2)} ${code}`; }
}

let names;
export function currencyName(code) {
  try { names ??= new Intl.DisplayNames(['en'], { type: 'currency' }); return names.of(code); } catch { return code; }
}
