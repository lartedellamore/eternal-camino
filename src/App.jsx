import { useMemo, useState } from 'react';
import WorldMap, { ALL_PLACES } from '@/components/WorldMap';
import Globe from '@/components/Globe';
import Starfield from '@/components/Starfield';
import Guide, { GuideList } from '@/components/Guide';
import Converter from '@/components/Converter';
import Giving from '@/components/Giving';
import { COUNTRIES, REGIONS, byIso2, byKey, QUOTE } from '@/lib/travel';
import { useRates } from '@/lib/rates';
import { useAuth, useCollection, useSetting } from '@/lib/store';

const ICONS = {
  atlas: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></svg>,
  guides: <svg viewBox="0 0 24 24"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5c-.8 0-1.5-.7-1.5-1.5z" /><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z" /></svg>,
  money: <svg viewBox="0 0 24 24"><path d="M4 8h13l-3-3M20 16H7l3 3" /></svg>,
  tenth: <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>,
};
const TABS = [['atlas', 'Atlas'], ['guides', 'Countries'], ['money', 'Exchange'], ['tenth', 'The Tenth']];

export default function App() {
  const [savedTab, setTab] = useSetting('tab', 'atlas');
  const tab = TABS.some(([k]) => k === savedTab) ? savedTab : 'atlas';
  const [homeIso, setHomeIso] = useSetting('home', 'NL');
  const [openIso, setOpenIso] = useState(null);
  const auth = useAuth();
  const visits = useCollection('Visit', auth.user);
  const giving = useCollection('GivingEntry', auth.user);
  const rates = useRates();
  const home = byIso2[homeIso];

  const visited = useMemo(() => new Set(visits.items.map((v) => v.country_key)), [visits.items]);

  const toggle = (key, name) => {
    const found = visits.items.find((v) => v.country_key === key);
    if (found) visits.remove(found.id);
    else visits.add({ country_key: key, country_name: name, visited_on: new Date().toISOString().slice(0, 10) });
  };
  const openGuide = (c) => { setOpenIso(c.iso2); setTab('guides'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const go = (t) => { setTab(t); if (t === 'guides') setOpenIso(null); window.scrollTo({ top: 0 }); };

  const open = openIso ? byIso2[openIso] : null;

  return (
    <>
      <Starfield />
      <div className="aurora" aria-hidden="true" />
      <div className="app">
        <header className="top">
          <button className="brand" onClick={() => go('atlas')} aria-label="Eternal Camino, back to the atlas">
            <svg viewBox="0 0 40 40" className="logo" aria-hidden="true">
              <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--gold-hi)" /><stop offset="1" stopColor="var(--rose)" /></linearGradient></defs>
              <circle cx="20" cy="20" r="17" fill="none" stroke="url(#lg)" strokeWidth="1.6" />
              <ellipse cx="20" cy="20" rx="7" ry="17" fill="none" stroke="url(#lg)" strokeWidth="1" />
              <path d="M3 20h34M6 11h28M6 29h28" fill="none" stroke="url(#lg)" strokeWidth=".7" />
              <path d="M20 1.5l1.6 3.2-1.6 1.2-1.6-1.2z" fill="var(--gold-hi)" />
            </svg>
            <span className="wordmark">Eternal Camino</span>
          </button>
          <nav className="tabs" aria-label="Sections">
            {TABS.map(([k, l]) => (
              <button key={k} className={tab === k ? 'on' : ''} onClick={() => go(k)} aria-current={tab === k ? 'page' : undefined}>
                <span className="ico" aria-hidden="true">{ICONS[k]}</span><span className="lbl">{l}</span>
              </button>
            ))}
          </nav>
          <div className="top-right">
            <label className="home-pick"><span>Home</span>
              <select value={homeIso} onChange={(e) => setHomeIso(e.target.value)} aria-label="Your home country">
                {[...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.iso2} value={c.iso2}>{c.flag} {c.name}</option>)}
              </select>
            </label>
            {auth.available && (auth.user
              ? <button className="ghost small" onClick={auth.signOut} title={auth.user.email}>Sign out</button>
              : <button className="ghost small" onClick={auth.signIn}>Sign in</button>)}
          </div>
        </header>

        <main>
          {tab === 'atlas' && <Atlas visited={visited} visits={visits} toggle={toggle} openGuide={openGuide} go={go} />}
          {tab === 'guides' && (open
            ? <Guide country={open} home={home} rates={rates} visited={visited} isVisited={visited.has(open.key)}
                onToggleVisited={() => toggle(open.key, open.name)} onBack={() => setOpenIso(null)} onOpen={openGuide} />
            : <GuideList onOpen={openGuide} visited={visited} />)}
          {tab === 'money' && (
            <section className="money page-enter">
              <header className="page-head">
                <p className="eyebrow">Live currency converter</p>
                <h2 className="display">What is it <em>worth</em>?</h2>
                <p className="lede">Rates from 160+ currencies, refreshed daily. Your home currency is set from the Home menu.</p>
              </header>
              <Converter rates={rates} from={home.currency.code} to={home.currency.code === 'USD' ? 'EUR' : 'USD'} />
            </section>
          )}
          {tab === 'tenth' && <Giving entries={giving.items} onAdd={giving.add} onRemove={giving.remove} currency={home.currency.code} />}
        </main>

        <footer className="foot">
          <div className="foot-ornament" aria-hidden="true"><span /><svg viewBox="0 0 24 24"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" /></svg><span /></div>
          <blockquote>{QUOTE}</blockquote>
          <p className="fine">
            {auth.user ? 'Synced to your account.' : 'Your atlas is kept on this device.'} Live rates by open.er-api.com.
            One tenth of Eternal Camino’s income goes to humanitarian work.
          </p>
        </footer>
      </div>
    </>
  );
}

function Atlas({ visited, visits, toggle, openGuide, go }) {
  const [pick, setPick] = useState('');
  const [pending, setPending] = useState(null);
  const [view, setView] = useSetting('mapView', 'globe');
  const total = COUNTRIES.length;
  const read = COUNTRIES.filter((c) => visited.has(c.key));
  const n = read.length;

  const onPick = (key, name) => {
    const c = byKey[key];
    if (c) setPending({ c, key }); else toggle(key, name);
  };
  const add = (e) => {
    e.preventDefault();
    const p = ALL_PLACES.find((x) => x.name.toLowerCase() === pick.trim().toLowerCase());
    if (p && !visited.has(p.key)) toggle(p.key, p.name);
    setPick('');
  };

  return (
    <section className="atlas page-enter">
      <div className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A companion for the road</p>
          <h1 className="hero-title">Eternal <span>Camino</span></h1>
          <p className="hero-quote">“The world is like a book, and those who do not learn to read the beauty of diversity miss the moral of the story.”</p>
          <div className="hero-count">
            <span className="big-num">{n}</span>
            <span className="of">of {total} pages read</span>
          </div>
          <div className="hero-actions">
            <button className="primary" onClick={() => go('guides')}>Explore every country</button>
            <button className="ghost" onClick={() => document.getElementById('add-place')?.focus()}>Colour in a place</button>
          </div>
        </div>
        <div className="hero-globe">
          {view === 'globe'
            ? <Globe visited={visited} onPick={onPick} />
            : <WorldMap visited={visited} onToggle={toggle} onOpen={(c, key) => setPending({ c, key })} />}
          <div className="view-switch" role="group" aria-label="Map style">
            <button className={view === 'globe' ? 'on' : ''} onClick={() => setView('globe')}>Globe</button>
            <button className={view === 'flat' ? 'on' : ''} onClick={() => setView('flat')}>Flat map</button>
          </div>
        </div>
      </div>

      {pending && (
        <div className="pop" role="dialog" aria-label={pending.c.name}>
          <span className="pop-flag">{pending.c.flag}</span>
          <div className="pop-text">
            <strong>{pending.c.name}</strong>
            <span className="fine">{pending.c.capital.split(/[;(]/)[0].trim()} · {pending.c.region}</span>
          </div>
          <button className="primary small" onClick={() => { toggle(pending.key, pending.c.name); setPending(null); }}>
            {visited.has(pending.key) ? 'Remove page' : 'I’ve been here'}
          </button>
          <button className="ghost small" onClick={() => { openGuide(pending.c); setPending(null); }}>Open guide</button>
          <button className="x" onClick={() => setPending(null)} aria-label="Close">×</button>
        </div>
      )}

      <div className="atlas-grid">
        <div className="panel glass">
          <p className="eyebrow">Your progress</p>
          <div className="stats">
            <div className="stat"><strong>{n}</strong><span>pages read</span></div>
            <div className="stat"><strong>{total - n}</strong><span>still to read</span></div>
            <div className="stat"><strong>{Math.round((n / total) * 100)}<small>%</small></strong><span>of the book</span></div>
          </div>
          <form className="add-place" onSubmit={add}>
            <input id="add-place" list="places" placeholder="Add a country by name…" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Add a country" />
            <datalist id="places">{ALL_PLACES.map((p) => <option key={p.key} value={p.name} />)}</datalist>
            <button className="primary small">Add</button>
          </form>
          <div className="regions">
            {REGIONS.map((r) => {
              const all = COUNTRIES.filter((c) => c.region === r);
              const got = all.filter((c) => visited.has(c.key)).length;
              return (
                <div key={r} className="region-row">
                  <span className={'reg-dot r-' + r.replace(' ', '')} />
                  <span>{r}</span>
                  <span className="bar"><span style={{ width: (got / all.length) * 100 + '%' }} /></span>
                  <span className="num-cell">{got}<span className="fine">/{all.length}</span></span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="panel glass shelf-panel">
          <p className="eyebrow">Your book of the world</p>
          {n === 0 ? (
            <div className="shelf-empty">
              <p className="display-sm">The shelf is waiting.</p>
              <p className="fine">Every country you visit becomes a volume here. Turn the globe and tap a place to begin.</p>
            </div>
          ) : (
            <div className="shelf">
              {[...read].sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name)).map((c) => (
                <button key={c.key} className={'spine r-' + c.region.replace(' ', '')} onClick={() => openGuide(c)} title={c.name}>
                  <span className="spine-flag">{c.flag}</span>
                  <span className="spine-name">{c.name}</span>
                </button>
              ))}
            </div>
          )}
          {visits.items.some((v) => !byKey[v.country_key]) && (
            <p className="fine">Also coloured in: {visits.items.filter((v) => !byKey[v.country_key]).map((v) => v.country_name).join(', ')}</p>
          )}
        </div>
      </div>
    </section>
  );
}
