// Global game state, persistence and a tiny event bus.
import { uid } from './util.js';

export const G = { s: null };
export const SAVE_KEY = 'gr_save_v1';
const BUS = {};
export function on(ev, fn) { (BUS[ev] ||= []).push(fn); return () => { BUS[ev] = BUS[ev].filter((f) => f !== fn); }; }
export function emit(ev, data) { for (const f of BUS[ev] || []) { try { f(data); } catch (e) { console.error(e); } } }

const RIVAL_NAMES = ['Вадим «Перекуп»', 'Sneaker_Tony', 'Олег Барахольщик', 'Kira.Resell', 'Дядя Жора', 'FlipKing', 'Марина Люкс', 'Ахмед Телефоны', 'Jason Kicks', 'Тарас Вінтаж', 'Mr. Watch', 'Лёха Опт'];

export function newState({ name, lang, country, city }) {
  const now = Date.now();
  return {
    v: 1,
    id: uid('p'),
    created: now,
    startDate: new Date(now).toISOString().slice(0, 10),
    player: { name: name || 'Player', lang, country, city, avatar: Math.floor(Math.random() * 360) },
    t: 8 * 60,
    support: { tickets: [], strikes: 0, banUntil: 0 },
    parts: {},
    tools: [],
    playSec: 0,
    lastReal: now,
    money: 0,
    xp: 0,
    level: 1,
    energy: 100,
    food: 75,
    rep: { sum: 0, n: 0 },
    stats: {},
    daily: {},
    hist: [],
    inv: [],
    listings: [],
    chats: [],
    feeds: {},
    favs: [],
    free: { refreshAt: 0, items: [] },
    pawn: { refreshAt: 0, items: [] },
    whole: { refreshAt: 0, deals: [] },
    auctions: { refreshAt: 0, lots: [] },
    deliveries: [],
    repairs: [],
    job: { cur: null, rank: 0, shifts: 0, good: 0, bad: 0, next: 0, apps: [], past: [] },
    bank: { loans: [], deposits: [], credit: 600, hist: [], card: 'basic', creditLog: [] },
    tax: { day: 0, income: 0, paid: 0, debt: 0, regime: 'none', fines: 0, daysLate: 0 },
    house: { type: 'none', own: false, city },
    props: [],
    biz: { name: '', shops: [], log: [], founded: 0 },
    up: {},
    quests: { day: -1, list: [], story: 0, ach: {}, claimed: {} },
    coll: {},
    news: [],
    events: [],
    econ: { trend: {}, fx: {}, gold: 1 },
    stocks: { hold: {}, px: {}, hist: {}, avg: {} },
    numbers: { owned: [], market: [], refreshAt: 0, listed: [] },
    travel: null,
    car: null,
    log: [],
    unread: {},
    online: { id: null, secret: null, code: null, nick: null, last: 0, friends: [], requests: [] },
    settings: { sound: true, cur: 'auto' },
    tut: {},
    casino: { hist: [] },
    rivals: RIVAL_NAMES.map((n, i) => ({ name: n, worth: 200 + i * 150 + Math.random() * 300, g: 0.035 + Math.random() * 0.05 })),
    mysteries: 0,
  };
}

export function save() {
  if (!G.s) return;
  try { G.s.lastReal = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(G.s)); } catch (e) { console.warn('save failed', e); }
}
export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.v !== 1) return null;
    return migrate(s);
  } catch (e) { console.warn('load failed', e); return null; }
}
function migrate(s) {
  const d = newState({ name: s.player?.name, lang: s.player?.lang, country: s.player?.country, city: s.player?.city });
  for (const k of Object.keys(d)) if (s[k] === undefined) s[k] = d[k];
  return s;
}
export function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch {} G.s = null; }
export function exportSave() { return btoa(unescape(encodeURIComponent(JSON.stringify(G.s)))); }
export function importSave(str) {
  const s = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
  if (!s || s.v !== 1 || !s.player) throw new Error('bad save');
  G.s = migrate(s); save();
}
