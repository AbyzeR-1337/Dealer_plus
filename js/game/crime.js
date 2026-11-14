// Police, the holding cell and your personal record. Shady things have a chance to get you caught: keeping a found
// wallet (very rarely), cheating buyers, stolen goods, smuggling, leaking databases (much more often). Caught → a
// fine, hours in the holding cell with the phone confiscated (a countdown), and a mark in your record that makes
// paperwork harder and fines/late penalties bigger until it expires.
import { G, emit } from '../core/state.js';
import { T, L, dur } from '../core/i18n.js';
import { RNG } from '../core/rng.js';
import { clamp } from '../core/util.js';
import { countryOf } from '../data/world.js';
import { fmt } from '../core/money.js';
import { charge, notify, log, stat, canAfford } from './player.js';
import { dv } from './difficulty.js';

export const CRIMES = {
  wallet: { n: ['Присвоение найденного', 'Привласнення знайденого', 'Keeping found property'], jail: [90, 150], fine: [20, 60], sev: 1 },
  fraud: { n: ['Мошенничество с покупателями', 'Шахрайство з покупцями', 'Defrauding buyers'], jail: [180, 300], fine: [60, 200], sev: 2 },
  fake: { n: ['Продажа подделок', 'Продаж підробок', 'Selling counterfeits'], jail: [240, 360], fine: [80, 260], sev: 2 },
  stolen: { n: ['Скупка краденого', 'Скупка краденого', 'Receiving stolen goods'], jail: [240, 420], fine: [80, 250], sev: 2 },
  // a police "test purchase" in the Shade: a deal that was too good
  sting: { n: ['Контрольная закупка: покупка краденого', 'Контрольна закупівля: купівля краденого', 'Police sting: buying stolen goods'], jail: [300, 300], fine: [0, 0], sev: 2 },
  grey: { n: ['Сбыт товара без растаможки', 'Збут товару без розмитнення', 'Selling uncleared imports'], jail: [0, 0], fine: [0, 0], sev: 1 },
  smuggling: { n: ['Контрабанда', 'Контрабанда', 'Smuggling'], jail: [360, 600], fine: [150, 500], sev: 3 },
  leak: { n: ['Торговля персональными данными', 'Торгівля персональними даними', 'Trading personal data'], jail: [480, 720], fine: [200, 600], sev: 3 },
};
const RECORD_DAYS = 30;
export function recordState() { const s = G.s; s.record ||= { marks: [] }; return s.record; }
export const activeMarks = () => (G.s?.record?.marks || []).filter((m) => m.until > G.s.t);
export const marksCount = () => activeMarks().length;
// fines and late penalties grow with every active mark
export const recordMult = () => 1 + marksCount() * 0.3;
// "paperwork is harder": job applications, credit, business registration, customs checks
export const paperPenalty = () => clamp(marksCount() * 0.15, 0, 0.6);
export const jailed = () => !!(G.s?.jail && G.s.jail.until > G.s.t);

// a shady act: maybe the police notice. p is the base chance; returns true if arrested
export function risk(kind, p, extra = {}) {
  const s = G.s;
  const chanceNow = clamp(p * dv().crime * (1 + marksCount() * 0.2), 0, 0.95);
  const r = new RNG(`crime|${s.id}|${kind}|${s.t}|${extra.salt || ''}`);
  stat('shady');
  if (!r.chance(chanceNow)) return false;
  arrest(kind, extra);
  return true;
}
export function arrest(kind, extra = {}) {
  const s = G.s, c = CRIMES[kind] || CRIMES.fraud;
  const r = new RNG(`arrest|${s.id}|${kind}|${s.t}`);
  const wage = Math.max(0.5, countryOf(s.player.city).wage);
  const fine = Math.round(r.float(c.fine[0], c.fine[1]) * wage + (extra.fine || 0));
  // extra.mins fixes the time in the cell (a sting is always the same 5 minutes)
  const mins = extra.mins ?? Math.round(r.float(c.jail[0], c.jail[1]) * dv().jail * (1 + marksCount() * 0.3));
  charge(fine, 'fine', T(`Штраф: ${L(c.n).toLowerCase()}`, `Штраф: ${L(c.n).toLowerCase()}`, `Fine: ${L(c.n).toLowerCase()}`));
  const rec = recordState();
  rec.marks.push({ kind, t: s.t, until: s.t + RECORD_DAYS * 1440, text: extra.text || '' });
  s.jail = { kind, until: s.t + mins, since: s.t, fine: Math.round(fine * recordMult()), bail: Math.round(fine * 1.5 + 30 * wage), text: extra.text || '' };
  stat('arrests');
  log('police', `${L(c.n)}: ${fmt(fine)}`);
  notify('gov', T('Задержание', 'Затримання', 'Arrested'), T(`${L(c.n)}. Штраф ${fmt(fine)}, телефон изъят на ${dur(mins)}. Пометка в личном деле.`, `${L(c.n)}. Штраф ${fmt(fine)}, телефон вилучено на ${dur(mins)}. Позначка в особовій справі.`, `${L(c.n)}. Fine ${fmt(fine)}, phone confiscated for ${dur(mins)}. A mark on your record.`), { noBadge: true });
  emit('jail');
  return s.jail;
}
// the police come, fine you and put a mark on your record — but don't lock you up
export function policeFine(kind, fine, text = '') {
  const s = G.s, c = CRIMES[kind] || CRIMES.fraud;
  charge(fine, 'fine', T(`Штраф: ${L(c.n).toLowerCase()}`, `Штраф: ${L(c.n).toLowerCase()}`, `Fine: ${L(c.n).toLowerCase()}`));
  recordState().marks.push({ kind, t: s.t, until: s.t + RECORD_DAYS * 1440, text });
  stat('policeFines');
  log('police', `${L(c.n)}: ${fmt(fine)}`);
  emit('jail');
}
export function payBail() {
  const s = G.s;
  if (!jailed()) return { ok: false };
  if (!canAfford(s.jail.bail)) return { ok: false, msg: T('Не хватает на залог', 'Не вистачає на заставу', 'Can’t afford bail') };
  charge(s.jail.bail, 'fine', T('Залог', 'Застава', 'Bail'));
  s.jail = null;
  emit('jail');
  return { ok: true };
}
export function jailTick() {
  const s = G.s;
  if (s.jail && s.jail.until <= s.t) {
    s.jail = null;
    notify('gov', T('Отпустили', 'Відпустили', 'Released'), T('Телефон вернули. Постарайтесь больше не попадаться.', 'Телефон повернули. Постарайтеся більше не потрапляти.', 'You got your phone back. Try not to get caught again.'), { noBadge: true });
    emit('jail');
  }
  const rec = s.record;
  if (rec?.marks?.length && s.t % 60 === 0) {
    const before = rec.marks.length;
    rec.marks = rec.marks.filter((m) => m.until > s.t - 1440 * 60); // keep old ones visible for a while, they just stop counting
    if (rec.marks.length !== before) emit('jail');
  }
}
export const crimeName = (k) => L((CRIMES[k] || CRIMES.fraud).n);
