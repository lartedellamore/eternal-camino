import { useState } from 'react';
import { CHARITIES } from '@/lib/travel';
import { fmt } from '@/lib/rates';

export default function Giving({ entries, onAdd, onRemove, currency }) {
  const [kind, setKind] = useState('trip');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const trips = entries.filter((e) => e.kind === 'trip');
  const gifts = entries.filter((e) => e.kind === 'gift');
  const spent = trips.reduce((s, e) => s + Number(e.amount || 0), 0);
  const given = gifts.reduce((s, e) => s + Number(e.amount || 0), 0);
  const tithe = spent * 0.1;
  const pct = tithe ? Math.min(100, (given / tithe) * 100) : 0;

  const submit = (e) => {
    e.preventDefault();
    if (!label || !amount) return;
    onAdd({ kind, label, amount: Number(amount), currency, date: new Date().toISOString().slice(0, 10) });
    setLabel(''); setAmount('');
  };

  return (
    <section className="giving page-enter">
      <div className="pledge">
        <p className="eyebrow">Our promise</p>
        <h2>One tenth for the road</h2>
        <p>
          Eternal Camino gives <strong>10% of everything it earns</strong> to humanitarian organisations — the people who
          stay when travellers leave. We will publish what was given, and to whom, once there is income to share.
        </p>
        <p className="fine">And if you’d like to walk the same way: log what a journey cost you, and Eternal Camino keeps a gentle tally of a tenth.</p>
      </div>

      <div className="grid2">
        <div className="panel">
          <h3>Your tenth</h3>
          <div className="tithe">
            <div><span className="fine">Travel logged</span><strong>{fmt(spent, currency)}</strong></div>
            <div><span className="fine">A tenth</span><strong>{fmt(tithe, currency)}</strong></div>
            <div><span className="fine">Given</span><strong>{fmt(given, currency)}</strong></div>
          </div>
          <div className="progress gold"><span style={{ width: pct + '%' }} /></div>
          <p className="fine">{tithe ? (given >= tithe ? 'Your tenth is complete. Thank you.' : `${fmt(tithe - given, currency)} to go — no rush, no guilt.`) : 'Log a trip to begin.'}</p>

          <form className="giving-form" onSubmit={submit}>
            <div className="seg">
              <button type="button" className={kind === 'trip' ? 'on' : ''} onClick={() => setKind('trip')}>A journey</button>
              <button type="button" className={kind === 'gift' ? 'on' : ''} onClick={() => setKind('gift')}>A gift</button>
            </div>
            <input placeholder={kind === 'trip' ? 'e.g. Lisbon, spring' : 'e.g. Caritas'} value={label} onChange={(e) => setLabel(e.target.value)} list={kind === 'gift' ? 'orgs' : undefined} />
            <datalist id="orgs">{CHARITIES.map((c) => <option key={c.name} value={c.name} />)}</datalist>
            <input type="number" min="0" step="any" placeholder={`Amount in ${currency}`} value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button className="primary" type="submit">Add</button>
          </form>

          {entries.length > 0 && (
            <ul className="ledger">
              {entries.map((e) => (
                <li key={e.id}>
                  <span className={'dot ' + e.kind} />
                  <span>{e.label}</span>
                  <span className="fine">{e.date}</span>
                  <strong>{e.kind === 'gift' ? '−' : ''}{fmt(e.amount, e.currency || currency)}</strong>
                  <button className="x" onClick={() => onRemove(e.id)} aria-label="Remove">×</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <h3>Where a tenth can go</h3>
          <ul className="orgs">
            {CHARITIES.map((c) => (
              <li key={c.name}>
                <a href={c.url} target="_blank" rel="noreferrer">{c.name} ↗</a>
                <p className="fine">{c.what}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
