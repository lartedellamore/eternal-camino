import WORLD from '@/data/world.json';

// Map key = world-atlas id (ISO numeric), or n:<name> for shapes without one (Kosovo).
export const COUNTRIES = WORLD.map((c) => ({ ...c, key: c.isoNumeric ?? 'n:' + c.name }));
export const byIso2 = Object.fromEntries(COUNTRIES.map((c) => [c.iso2, c]));
export const byKey = Object.fromEntries(COUNTRIES.map((c) => [c.key, c]));
export const byNumeric = byKey;
export const REGIONS = ['Europe', 'Americas', 'Africa', 'Middle East', 'Asia', 'Oceania'];

export const QUOTE = 'The world is like a book, and those who do not learn to read the beauty of diversity miss the moral of the story.';

// Voice for "hear it" buttons (Web Speech API, uses the device's installed voices).
export const SPEECH_LANG = {
  NL: 'nl-NL', BE: 'nl-BE', FR: 'fr-FR', ES: 'es-ES', PT: 'pt-PT', IT: 'it-IT', VA: 'it-IT', DE: 'de-DE', AT: 'de-AT',
  IE: 'ga-IE', PL: 'pl-PL', GB: 'en-GB', HR: 'hr-HR', GR: 'el-GR', MX: 'es-MX', AR: 'es-AR', BR: 'pt-BR', PE: 'es-PE',
  CO: 'es-CO', US: 'en-US', CA: 'en-CA', AU: 'en-AU', PH: 'fil-PH', JP: 'ja-JP', KR: 'ko-KR', IN: 'hi-IN', TH: 'th-TH',
  MA: 'ar-MA', EG: 'ar-EG', KE: 'sw-KE', ZA: 'zu-ZA', IL: 'he-IL',
};

export function speak(text, lang) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return false;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.85;
    const voice = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith(lang.toLowerCase().slice(0, 2)));
    if (voice) u.voice = voice;
    synth.speak(u);
    return true;
  } catch { return false; }
}

// Which plug fits which socket. Type C (Europlug) is the great traveller: it slips into most round-pin sockets.
const FITS = {
  A: ['A', 'B'], B: ['B'], C: ['C', 'E', 'F', 'J', 'K', 'L', 'N'], D: ['D'], E: ['E', 'F'], F: ['E', 'F'],
  G: ['G'], H: ['H'], I: ['I'], J: ['J'], K: ['K'], L: ['L'], M: ['M'], N: ['N'], O: ['O'],
};
const volts = (s) => (s.match(/\d{3}/g) || []).map(Number);

export function adapterAdvice(home, dest) {
  if (!home || !dest) return null;
  const sockets = dest.plug.types.map((t) => t.trim().toUpperCase());
  const fitting = home.plug.types.filter((p) => (FITS[p.toUpperCase()] || [p]).some((s) => sockets.includes(s)));
  const hv = volts(home.plug.voltage), dv = volts(dest.plug.voltage);
  const lowHome = hv.some((v) => v < 200) && !hv.some((v) => v >= 200);
  const lowDest = dv.some((v) => v < 200);
  const highDest = dv.some((v) => v >= 200);
  const voltageWarn = (lowHome && highDest) || (!lowHome && lowDest && !highDest);
  return {
    needAdapter: fitting.length === 0,
    fitting,
    sockets,
    voltageWarn,
    summary: fitting.length
      ? `Your ${fitting.join('/')} plug${fitting.length > 1 ? 's' : ''} should fit — no adapter needed.`
      : `Bring an adapter for type ${sockets.join(' / ')} sockets.`,
    voltage: voltageWarn
      ? `Voltage differs (${home.plug.voltage} at home, ${dest.plug.voltage} here). Check your charger says 100–240 V; most phone and laptop chargers do, hair tools often don't.`
      : `Voltage is compatible (${dest.plug.voltage}, ${dest.plug.frequency}).`,
  };
}

// Approximate per-EUR rates, used only if live rates cannot be reached.
export const FALLBACK_RATES = {
  EUR: 1, USD: 1.16, GBP: 0.86, CHF: 0.94, PLN: 4.25, MXN: 21.5, ARS: 1400, BRL: 6.3, PEN: 4.1, COP: 4600, CAD: 1.6,
  AUD: 1.78, PHP: 66, JPY: 170, KRW: 1600, INR: 100, THB: 37.5, MAD: 10.6, EGP: 56, KES: 150, ZAR: 20.5, ILS: 3.9,
};

export const CHARITIES = [
  { name: 'Caritas Internationalis', url: 'https://www.caritas.org', what: 'The Catholic Church’s confederation of 160+ relief and development organisations, present in nearly every country you might visit.' },
  { name: 'Catholic Relief Services', url: 'https://www.crs.org', what: 'Emergency relief, clean water, farming and health programmes across Africa, Asia, Latin America and the Middle East.' },
  { name: 'Aid to the Church in Need', url: 'https://acninternational.org', what: 'Supports Christians who are persecuted, displaced or living in poverty, and the local priests and sisters who serve them.' },
  { name: 'International Committee of the Red Cross', url: 'https://www.icrc.org', what: 'Protects and assists people affected by war and armed violence, and reunites separated families.' },
  { name: 'UNHCR, the UN Refugee Agency', url: 'https://www.unhcr.org', what: 'Shelter, protection and a path home or forward for people forced to flee.' },
  { name: 'Médecins Sans Frontières', url: 'https://www.msf.org', what: 'Independent medical care where it is needed most — conflict zones, epidemics, disasters.' },
  { name: 'World Food Programme', url: 'https://www.wfp.org', what: 'Food assistance in emergencies and long-term work to end hunger.' },
];

export const LOVE_LANGUAGES = {
  'Words of Affirmation': '✎', 'Quality Time': '◷', 'Receiving Gifts': '❀', 'Acts of Service': '✧', 'Physical Touch': '♡',
};

export function compact(n) {
  if (n == null) return '—';
  if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 2).replace(/\.?0+$/, '') + ' billion';
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e8 ? 0 : 1).replace(/\.0$/, '') + ' million';
  return n.toLocaleString('en');
}
