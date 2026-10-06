import { useMemo, useState } from 'react';
import { COUNTRIES, REGIONS, SPEECH_LANG, speak, adapterAdvice, LOVE_LANGUAGES, compact } from '@/lib/travel';
import Converter from './Converter';
import Globe from './Globe';

export function GuideList({ onOpen, visited }) {
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('All');
  const [onlyDeep, setOnlyDeep] = useState(false);
  const list = useMemo(() => COUNTRIES
    .filter((c) => region === 'All' || c.region === region)
    .filter((c) => !onlyDeep || c.deep)
    .filter((c) => !q || (c.name + ' ' + c.nativeName + ' ' + c.capital).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name)), [q, region, onlyDeep]);
  return (
    <section className="page-enter">
      <header className="page-head">
        <p className="eyebrow">{COUNTRIES.length} countries · {COUNTRIES.filter((c) => c.deep).length} full guides</p>
        <h2 className="display">Every flag, <em>every story</em></h2>
        <p className="lede">People, history, struggles and hopes, language and money — a page for every nation on earth.</p>
      </header>
      <div className="list-tools">
        <input type="search" placeholder="Search a country or capital…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search countries" />
        <div className="chips">
          {['All', ...REGIONS].map((r) => <button key={r} className={region === r ? 'on' : ''} onClick={() => setRegion(r)}>{r}</button>)}
          <button className={'deep-chip' + (onlyDeep ? ' on' : '')} onClick={() => setOnlyDeep(!onlyDeep)}>★ Full guides</button>
        </div>
      </div>
      <p className="fine">{list.length} shown</p>
      <div className="cards">
        {list.map((c) => (
          <button key={c.iso2} className={'card' + (c.deep ? ' deep' : '')} onClick={() => onOpen(c)}>
            <span className="flag">{c.flag}</span>
            <span className="card-name">{c.name}</span>
            <span className="card-native">{c.nativeName}</span>
            <span className="card-meta">{c.capital.split(/[;(]/)[0].trim()} · {compact(c.population?.value)}</span>
            <span className="card-tags">
              {c.deep && <span className="tag-deep">★ full guide</span>}
              {visited.has(c.key) && <span className="badge">read</span>}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

const TABS = [
  ['overview', 'Overview'],
  ['highlights', '33 Highlights', true],
  ['facts', '33 Fun facts', true],
  ['language', 'Language'],
  ['story', 'Story'],
  ['essentials', 'Travel essentials'],
  ['heart', 'Heart & manners', true],
];

export default function Guide({ country: c, home, rates, visited, isVisited, onToggleVisited, onBack }) {
  const [tab, setTab] = useState('overview');
  const tabs = TABS.filter(([, , deepOnly]) => !deepOnly || c.deep);
  const current = tabs.some(([k]) => k === tab) ? tab : 'overview';

  return (
    <article className="guide page-enter">
      <button className="link back" onClick={onBack}>← All countries</button>
      <header className="guide-hero">
        <div className="flag-aura" aria-hidden="true">{c.flag}</div>
        <div className="hero-text">
          <p className="eyebrow">{c.region} · {c.capital}</p>
          <h2 className="country-name"><span className="flag big" role="img" aria-label={`Flag of ${c.name}`}>{c.flag}</span> {c.name}</h2>
          <p className="native">{c.nativeName}</p>
          <div className="ribbon">
            <span><b>{compact(c.population?.value)}</b> people</span>
            <span><b>≈ {c.languages.count}</b> languages</span>
            <span><b>{c.currency.code}</b> {c.currency.symbol}</span>
            <span><b>{c.plug.types.join(' · ')}</b> plugs</span>
          </div>
          <button className={'visit-toggle' + (isVisited ? ' on' : '')} onClick={onToggleVisited}>
            {isVisited ? '✓ A page you have read' : '+ I’ve been here'}
          </button>
        </div>
        <div className="guide-globe"><Globe visited={visited} focus={c.key} size="mini" /></div>
      </header>

      <nav className="subtabs" aria-label="Guide sections">
        {tabs.map(([k, l]) => <button key={k} className={current === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </nav>

      {current === 'overview' && <Overview c={c} />}
      {current === 'highlights' && <Highlights c={c} />}
      {current === 'facts' && <Facts c={c} />}
      {current === 'language' && <Language c={c} />}
      {current === 'story' && <Story c={c} />}
      {current === 'essentials' && <Essentials c={c} home={home} rates={rates} />}
      {current === 'heart' && <Heart c={c} />}

      {!c.deep && (
        <p className="fine coming">The full guide for {c.name} — 33 highlights, 33 fun facts and a complete language guide — is being written.</p>
      )}
    </article>
  );
}

function Overview({ c }) {
  const inc = c.income || {};
  return (
    <div className="overview">
      <dl className="facts-grid">
        <div><dt>People</dt><dd>{compact(c.population?.value)}</dd><span className="fine">{c.population?.year} estimate</span></div>
        <div><dt>Languages spoken</dt><dd>≈ {c.languages.count}</dd><span className="fine">living languages</span></div>
        <div>
          <dt>Average income</dt>
          <dd>{inc.gniPerCapitaUSD ? '$' + inc.gniPerCapitaUSD.toLocaleString('en') : 'Not published'}</dd>
          <span className="fine">per person per year{inc.year ? `, ${inc.year}` : ''} · {inc.band}</span>
        </div>
        <div><dt>Capital</dt><dd className="small-dd">{c.capital}</dd><span className="fine">{c.currency.name} ({c.currency.code})</span></div>
      </dl>

      <section className="prose-card">
        <h3>Who lives here</h3>
        <p>{c.people}</p>
        <p className="fine">Main languages: {c.languages.main.join(', ')}. {c.languages.note}</p>
      </section>

      <div className="grid2">
        <section className="prose-card">
          <h3>Greatest resources</h3>
          <ul className="list-gold">{c.resources.map((r) => <li key={r}>{r}</li>)}</ul>
        </section>
        <section className="prose-card">
          <h3>What they struggle with</h3>
          <ul className="list-rose">{c.struggles.map((r) => <li key={r}>{r}</li>)}</ul>
        </section>
      </div>

      <section className="pray">
        <p className="eyebrow">Hold them in prayer</p>
        <h3>What to pray for</h3>
        <ul>{c.prayFor.map((r) => <li key={r}>{r}</li>)}</ul>
      </section>
      <p className="fine">Population and income are recent estimates (UN / World Bank “GNI per capita”, Atlas method) and change every year.</p>
    </div>
  );
}

function Highlights({ c }) {
  return (
    <ol className="highlights">
      {c.highlights.map((h, i) => (
        <li key={h.title + i}>
          <span className="num">{i + 1}</span>
          <div><strong>{h.title}</strong><p>{h.line}</p></div>
        </li>
      ))}
    </ol>
  );
}

function Facts({ c }) {
  return (
    <ul className="funfacts">
      {c.funFacts.map((f, i) => <li key={i}><span className="spark" aria-hidden="true">✦</span>{f}</li>)}
    </ul>
  );
}

function Phrase({ p, voice }) {
  const inner = (
    <>
      <span className="en">{p.en}</span>
      <span className="local">{p.local}</span>
      <span className="say">{p.roman ? p.roman + ' · ' : ''}{p.say}</span>
    </>
  );
  return voice ? <button onClick={() => speak(p.local, voice)}>{inner}</button> : <div className="phrase-static">{inner}</div>;
}

function Language({ c }) {
  const voice = SPEECH_LANG[c.iso2];
  if (!c.languageGuide) {
    return (
      <div className="panel">
        <h3>First words</h3>
        <p className="fine">Five phrases to open doors. The full language guide is coming.</p>
        <ul className="phrases">{c.basics.map((p) => <li key={p.en}><Phrase p={p} voice={voice} /></li>)}</ul>
      </div>
    );
  }
  const g = c.languageGuide;
  return (
    <div className="lang-guide">
      <div className="panel">
        <p className="eyebrow">Language guide</p>
        <h3>{g.language}</h3>
        <p>{g.intro}</p>
        {voice && <p className="fine">Tap any phrase to hear it (uses your device’s voices; some languages may not have one installed).</p>}
      </div>
      {g.sections.map((s) => (
        <section key={s.title} className="lang-section">
          <h3>{s.title}</h3>
          <ul className={'phrases' + (s.title === 'Numbers' ? ' numbers' : '')}>
            {s.phrases.map((p, i) => <li key={i}><Phrase p={p} voice={voice} /></li>)}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Story({ c }) {
  const s = c.summary;
  return (
    <div className="story">
      {[['History', s.history], ['Political history', s.politicalHistory], ['Art', s.art], ['Important monuments', s.monuments]].map(([t, body]) => (
        <section key={t} className="prose-card"><h3>{t}</h3><p>{body}</p></section>
      ))}
    </div>
  );
}

function Essentials({ c, home, rates }) {
  const adv = adapterAdvice(home, c);
  const homeCur = home?.currency.code || 'EUR';
  return (
    <div className="grid2">
      <div className="panel">
        <h3>Money</h3>
        <p className="fine">{c.currency.name} ({c.currency.symbol})</p>
        <Converter rates={rates} from={homeCur} to={c.currency.code === homeCur ? 'USD' : c.currency.code} compact key={c.iso2} />
      </div>
      <div className="panel">
        <h3>Power</h3>
        <div className="plugs">
          {c.plug.types.map((t) => <span key={t} className="plug">{t}</span>)}
          <span className="fine">{c.plug.voltage} · {c.plug.frequency}</span>
        </div>
        {adv && home.iso2 !== c.iso2 && (
          <div className={'advice ' + (adv.needAdapter ? 'warn' : 'ok')}>
            <p><strong>From {home.name}:</strong> {adv.summary}</p>
            <p>{adv.voltage}</p>
          </div>
        )}
        {c.plug.note && <p className="fine">{c.plug.note}</p>}
      </div>
    </div>
  );
}

function Heart({ c }) {
  const voice = SPEECH_LANG[c.iso2];
  return (
    <div className="grid2">
      <section className="prose-card">
        <h3>Love &amp; affection</h3>
        <p>{c.love.expression}</p>
        <div className="love-langs">
          {c.love.languages.map((l) => <span key={l} className="love-chip">{LOVE_LANGUAGES[l] || '♡'} {l}</span>)}
        </div>
        <div className="iloveyou-wrap">
          <Phrase p={{ en: '“I love you”', ...c.love.iLoveYou }} voice={voice} />
        </div>
      </section>
      <section className="prose-card">
        <h3>Good manners</h3>
        <ul className="list-gold">{c.etiquette.map((e) => <li key={e}>{e}</li>)}</ul>
      </section>
    </div>
  );
}
