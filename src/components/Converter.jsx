import { useState } from 'react';
import { fmt, currencyName } from '@/lib/rates';

export default function Converter({ rates, from: initFrom = 'EUR', to: initTo = 'USD', compact = false }) {
  const [amount, setAmount] = useState(compact ? 10 : 100);
  const [from, setFrom] = useState(initFrom);
  const [to, setTo] = useState(initTo);
  const out = rates.convert(Number(amount) || 0, from, to);
  const unit = rates.convert(1, from, to);
  const quick = [1, 5, 10, 20, 50, 100];

  const sel = (v, set) => (
    <select value={v} onChange={(e) => set(e.target.value)} aria-label="Currency">
      {rates.codes.map((c) => <option key={c} value={c}>{c} — {currencyName(c)}</option>)}
    </select>
  );

  return (
    <div className={'converter' + (compact ? ' compact' : '')}>
      <div className="conv-row">
        <input type="number" inputMode="decimal" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Amount" />
        {sel(from, setFrom)}
      </div>
      <button className="swap" onClick={() => { setFrom(to); setTo(from); }} aria-label="Swap currencies">⇅</button>
      <div className="conv-row">
        <output className="conv-out">{fmt(out, to)}</output>
        {sel(to, setTo)}
      </div>
      <p className="fine rate-line">
        1 {from} = {unit ? unit.toLocaleString(undefined, { maximumSignificantDigits: 5 }) : '—'} {to} ·{' '}
        <span className={'status ' + rates.status}>
          {rates.status === 'live' && 'Live rate'}
          {rates.status === 'stale' && 'Last known rate'}
          {rates.status === 'loading' && 'Fetching live rate…'}
          {rates.status === 'offline' && 'Offline estimate — check before you pay'}
        </span>
        {rates.updated && <> · updated {new Date(rates.updated).toLocaleDateString()}</>}
      </p>
      {!compact && (
        <div className="cheat">
          <p className="eyebrow">Pocket cheat-sheet</p>
          <table>
            <tbody>
              {quick.map((q) => (
                <tr key={q}><td>{fmt(q, from)}</td><td>→</td><td>{fmt(rates.convert(q, from, to), to)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
