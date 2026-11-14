// Player-level helpers: money, XP, reputation, inventory capacity, notifications, upgrades.
import { G, emit } from '../core/state.js';
import { homeValue } from './housing.js';
import { dv, MINI_EARN } from './difficulty.js';
import { recordMult } from './crime.js';
import { T, L } from '../core/i18n.js';
import { uid, clamp, sum } from '../core/util.js';
import { itemValue, sizeUnits, isVehicle, itemTitle } from './items.js';
import { day } from './economy.js';

// ---------------------------------------------------------------- notifications & log
export function log(tag, text) {
  const s = G.s; if (!s) return;
  s.log.push({ t: s.t, tag, text });
  if (s.log.length > 60) s.log.splice(0, s.log.length - 60);
  emit('log');
}
export function notify(app, title, text, o = {}) {
  const s = G.s; if (!s) return;
  if (!o.noBadge) s.unread[app] = (s.unread[app] || 0) + 1;
  log(app, `${title}: ${text}`);
  (s.inbox ||= []).push({ id: 'm' + s.t.toString(36) + Math.random().toString(36).slice(2, 6), app, title: String(title), text: String(text), t: s.t, read: false, go: o.go || null });
  if (s.inbox.length > 150) s.inbox.splice(0, s.inbox.length - 150);
  if (!o.silent) emit('banner', { app, title, text, go: o.go });
  emit('badges');
}
export function clearUnread(app) { if (G.s?.unread[app]) { G.s.unread[app] = 0; emit('badges'); } }

// ---------------------------------------------------------------- stats
export function stat(k, inc = 1) { const s = G.s; s.stats[k] = (s.stats[k] || 0) + inc; s.daily[k] = (s.daily[k] || 0) + inc; emit('stat', k); }
export const getStat = (k) => G.s?.stats[k] || 0;
export const today = (k) => G.s?.daily[k] || 0;

// ---------------------------------------------------------------- money
const TAXABLE = new Set(['job', 'casino', 'biz', 'rent', 'profit', 'quest', 'stock']);
export function earn(usd, kind = 'other', note = '') {
  const s = G.s;
  usd = Math.max(0, usd);
  if (MINI_EARN.has(kind)) usd *= dv().earn;
  s.money += usd;
  if (TAXABLE.has(kind)) s.tax.income += usd;
  pushHist(usd, kind, note);
  stat('earned', usd);
  emit('money');
}
export function canAfford(usd) { return G.s.money + 1e-6 >= usd; }
export function spend(usd, kind = 'other', note = '') {
  const s = G.s;
  if (usd <= 0) return true;
  if (!canAfford(usd)) return false;
  s.money -= usd;
  pushHist(-usd, kind, note);
  stat('spent', usd);
  emit('money');
  return true;
}
// forced payments can push the balance below zero (rent, fines, loan autopay)
export function charge(usd, kind = 'other', note = '') { const s = G.s; if (kind === 'fine') usd *= recordMult(); s.money -= usd; pushHist(-usd, kind, note); emit('money'); }
export function addProfit(profit) { if (profit > 0) G.s.tax.income += profit; }
function pushHist(amt, kind, note) {
  const s = G.s;
  s.bank.hist.unshift({ id: uid('h'), t: s.t, amt, kind, note });
  if (s.bank.hist.length > 120) s.bank.hist.length = 120;
}

// ---------------------------------------------------------------- XP & levels
export const xpNeed = (lvl) => Math.round(60 * Math.pow(lvl, 1.75));
export function addXP(n) {
  const s = G.s;
  s.xp += Math.round(n);
  let up = false;
  while (s.xp >= xpNeed(s.level)) { s.xp -= xpNeed(s.level); s.level++; up = true; }
  if (up) { emit('levelup', s.level); log('lvl', T(`Новый уровень ${s.level}!`, `Новий рівень ${s.level}!`, `Level up: ${s.level}!`)); }
  emit('xp');
}

// ---------------------------------------------------------------- reputation
export function addReview(stars, text, o = {}) {
  const s = G.s;
  s.rep.sum += stars; s.rep.n++;
  (s.rep.reviews ||= []).unshift({ id: 'r' + s.t.toString(36) + Math.floor(Math.random() * 1e4).toString(36), stars, text, t: s.t, buyer: o.buyer || '', fair: o.fair !== false, sale: o.sale || '' });
  if (s.rep.reviews.length > 40) s.rep.reviews.length = 40;
  emit('rep');
}
export function removeReview(id) {
  const s = G.s;
  const i = (s.rep.reviews || []).findIndex((r) => r.id === id);
  if (i < 0) return false;
  const r = s.rep.reviews[i];
  s.rep.sum -= r.stars; s.rep.n = Math.max(0, s.rep.n - 1);
  s.rep.reviews.splice(i, 1);
  emit('rep');
  return true;
}
export const repScore = () => { const r = G.s?.rep; return r && r.n ? r.sum / r.n : 0; };
// Reputation factor used in buyer frequency/trust (0.6..1.3)
export const repFactor = () => { const r = G.s.rep; if (!r.n) return 0.9; return clamp(0.4 + repScore() * 0.18 + Math.min(0.12, r.n * 0.004), 0.55, 1.35); };

// ---------------------------------------------------------------- upgrades
export const UPGRADES = [
  { id: 'clients', icon: 'users', color: ['#2a63ff', '#1b3fb0'], n: ['Больше клиентов', 'Більше клієнтів', 'More buyers'], d: ['Покупатели пишут чаще.', 'Покупці пишуть частіше.', 'Buyers message you more often.'], cost: 60, eff: (l) => `+${l * 22}%` },
  { id: 'haggle', icon: 'chat', color: ['#22c7a0', '#0f8a6a'], n: ['Мастер торга', 'Майстер торгу', 'Haggling'], d: ['Продавцы уступают больше, покупатели меньше давят.', 'Продавці поступаються більше.', 'Sellers concede more, buyers push less.'], cost: 80, eff: (l) => `±${l * 3}%` },
  { id: 'eye', icon: 'eye', color: ['#ff8a3d', '#d4560f'], n: ['Глаз оценщика', 'Око оцінювача', 'Appraiser eye'], d: ['Больше времени на осмотр и точнее оценка.', 'Більше часу на огляд і точніша оцінка.', 'More inspection time, better estimates.'], cost: 70, eff: (l) => `+${l * 4} ${T('сек', 'сек', 's')}` },
  { id: 'expert', icon: 'shield', color: ['#8b5cff', '#5b2ee0'], n: ['Эксперт подлинности', 'Експерт справжності', 'Authenticity expert'], d: ['Подделки проще распознать.', 'Підробки легше розпізнати.', 'Fakes are easier to spot.'], cost: 120, eff: (l) => `+${l * 10}%` },
  { id: 'hands', icon: 'wrench', color: ['#22c7a0', '#0f8a6a'], n: ['Быстрый ремонт', 'Швидкий ремонт', 'Fast repair'], d: ['Мастерская работает быстрее и дешевле.', 'Майстерня працює швидше й дешевше.', 'Workshop is faster and cheaper.'], cost: 90, eff: (l) => `−${l * 12}%` },
  { id: 'delivery', icon: 'box', color: ['#ff9a1f', '#e2620a'], n: ['Быстрая доставка', 'Швидка доставка', 'Fast delivery'], d: ['Посылки доезжают быстрее — деньги приходят раньше.', 'Посилки доїжджають швидше.', 'Parcels arrive sooner, money comes faster.'], cost: 150, eff: (l) => `−${l * 15}%` },
  { id: 'storage', icon: 'warehouse', color: ['#5d6677', '#2f3644'], n: ['Больше места', 'Більше місця', 'More storage'], d: ['Склад вмещает больше вещей.', 'Склад вміщує більше речей.', 'Store more items.'], cost: 100, eff: (l) => `+${l * 8}` },
  { id: 'photo', icon: 'camera', color: ['#ff4f8b', '#c41d5a'], n: ['Профи‑фото', 'Профі‑фото', 'Pro photos'], d: ['Объявления выглядят дороже — готовы платить больше.', 'Оголошення виглядають дорожче.', 'Listings look premium — buyers pay more.'], cost: 110, eff: (l) => `+${l * 3}%` },
  { id: 'network', icon: 'link', color: ['#00b4ff', '#0062ff'], n: ['Связи', 'Звʼязки', 'Connections'], d: ['Больше редких находок, бесплатных вещей и оптовых сделок.', 'Більше рідкісних знахідок і оптових угод.', 'More rare finds, freebies and bulk deals.'], cost: 200, eff: (l) => `+${l * 20}%` },
  { id: 'charisma', icon: 'star', color: ['#ffc94d', '#d49a00'], n: ['Харизма', 'Харизма', 'Charisma'], d: ['Легче проходить собеседования, выше зарплата.', 'Легше проходити співбесіди, вища зарплата.', 'Easier interviews, higher wages.'], cost: 50, eff: (l) => `+${l * 6}%` },
  { id: 'luggage', icon: 'bag', color: ['#3ecf8e', '#16935a'], n: ['Большой чемодан', 'Велика валіза', 'Big luggage'], d: ['Больше вещей с собой в поездку.', 'Більше речей із собою в подорож.', 'Carry more items when travelling.'], cost: 70, eff: (l) => `+${l * 3}` },
];
export const upLevel = (id) => G.s?.up[id] || 0;
export const upCost = (u, lvl) => Math.round(u.cost * Math.pow(3.1, lvl));
export const UP_MAX = 5;

// ---------------------------------------------------------------- housing & capacity
export const HOUSING = [
  { id: 'none', n: ['Без жилья (улица)', 'Без житла (вулиця)', 'Homeless'], rent: 0, price: 0, store: 4, garage: 0, energy: 0.45, rep: 0 },
  { id: 'hostel', n: ['Койка в хостеле', 'Ліжко в хостелі', 'Hostel bed'], rent: 9, price: 0, store: 8, garage: 0, energy: 0.8, rep: 0 },
  { id: 'room', n: ['Комната', 'Кімната', 'Room'], rent: 18, price: 14000, store: 16, garage: 0, energy: 0.9, rep: 0.02 },
  { id: 'studio', n: ['Студия', 'Студія', 'Studio flat'], rent: 32, price: 42000, store: 26, garage: 1, energy: 1, rep: 0.04 },
  { id: 'flat', n: ['Квартира', 'Квартира', 'Apartment'], rent: 60, price: 110000, store: 42, garage: 1, energy: 1.05, rep: 0.06 },
  { id: 'flat2', n: ['2‑комнатная квартира', '2‑кімнатна квартира', 'Two‑bed flat'], rent: 80, price: 150000, store: 52, garage: 1, energy: 1.06, rep: 0.07 },
  { id: 'flat3', n: ['3‑комнатная квартира', '3‑кімнатна квартира', 'Three‑bed flat'], rent: 100, price: 200000, store: 64, garage: 1, energy: 1.07, rep: 0.08 },
  { id: 'townhouse', n: ['Таунхаус', 'Таунхаус', 'Townhouse'], rent: 105, price: 260000, store: 72, garage: 2, energy: 1.08, rep: 0.08 },
  { id: 'house', n: ['Дом с гаражом', 'Будинок з гаражем', 'House with garage'], rent: 115, price: 290000, store: 80, garage: 3, energy: 1.1, rep: 0.09 },
  { id: 'penthouse', n: ['Пентхаус', 'Пентхаус', 'Penthouse'], rent: 260, price: 1200000, store: 120, garage: 4, energy: 1.15, rep: 0.13 },
  { id: 'villa', n: ['Вилла', 'Вілла', 'Villa'], rent: 520, price: 3200000, store: 200, garage: 8, energy: 1.2, rep: 0.18 },
];
export const houseDef = (id = G.s?.house.type) => HOUSING.find((h) => h.id === id) || HOUSING[0];

export function capacity() {
  const s = G.s;
  let c = houseDef().store + upLevel('storage') * 8;
  for (const p of s.props) if (p.kind === 'warehouse') c += p.cap || 150;
  return c;
}
export function used() { return sum(G.s.inv.filter((i) => !i.shop && !isVehicle(i) && i.loc !== 'szx'), sizeUnits); } // the supplier's warehouse in Shenzhen holds paid lots
export const freeSpace = () => capacity() - used();
export function garage() {
  const s = G.s;
  let g = houseDef().garage + 1; // +1 street parking
  for (const p of s.props) if (p.kind === 'showroom') g += 8;
  // rented spaces (yard, underground, co‑op garage, car park, lawn) and a garage built on your own plot (parking.js)
  const pk = s.park;
  if (pk) { for (const sp of pk.spots || []) if (sp.st === 'active' && sp.kind !== 'build' && (!sp.city || sp.city === s.player.city)) g += sp.slots; if (s.house?.own && pk.built?.[s.house.homeId]) g += 2; }
  return g;
}
export const vehiclesOwned = () => G.s.inv.filter((i) => isVehicle(i) && !i.shop).length;
export function canStore(item) {
  if (isVehicle(item)) return vehiclesOwned() < garage();
  return freeSpace() >= sizeUnits(item);
}
export const luggageCap = () => 6 + upLevel('luggage') * 3;

// ---------------------------------------------------------------- inventory
export const getItem = (id) => G.s.inv.find((i) => i.id === id);
export function addItem(item, paid = 0, src = 'market') {
  item.paid = paid; item.src = item.src || src; item.at = G.s.t; item.loc = item.loc || G.s.player.city;
  G.s.inv.unshift(item);
  if (item.rar >= 2 && !item.rf) { item.rf = 1; stat('rareFound'); }
  emit('inv');
  return item;
}
export function removeItem(id) {
  const s = G.s;
  const i = s.inv.findIndex((x) => x.id === id);
  if (i >= 0) { const [it] = s.inv.splice(i, 1); if (s.car === id) s.car = null; emit('inv'); return it; }
  return null;
}

// ---------------------------------------------------------------- net worth
export function netWorth() {
  const s = G.s;
  let w = s.money;
  for (const it of s.inv) w += itemValue(it, it.loc || s.player.city, 'known') * 0.85;
  for (const p of s.props) if (p.own) w += p.value || 0;
  for (const h of s.homes || []) w += homeValue(h) * 0.9;
  for (const sp of s.park?.spots || []) if (sp.own) w += (sp.value || 0) * 0.85;
  for (const d of s.bank.deposits) w += d.amt;
  for (const l of s.bank.loans) w -= l.left;
  for (const [tk, q] of Object.entries(s.stocks.hold)) w += q * (s.stocks.px[tk] || 0);
  for (const n of s.numbers.owned) w += (n.value || 0) * 0.8;
  w -= s.tax.debt;
  return w;
}
export function snapshotWorth() {
  const s = G.s;
  s.hist.push({ d: day(), w: Math.round(netWorth()) });
  if (s.hist.length > 120) s.hist.splice(0, s.hist.length - 120);
}
export const isNewcomer = () => G.s.level < 3;
export { itemTitle };
