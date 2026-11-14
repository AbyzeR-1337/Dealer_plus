// The phone itself: installed apps, downloads from the App Store, VPN subscription, and the shadow market
// that only works through a VPN (cheap grey goods that may be stolen, account unlocks, fake reviews).
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { RNG } from '../core/rng.js';
import { uid, chance, clamp } from '../core/util.js';
import { fmt, nicePrice } from '../core/money.js';
import { APP_META, PREINSTALLED, SYSTEM_APPS } from '../data/appmeta.js';
import { BY_CAT } from '../data/catalog.js';
import { countryOf } from '../data/world.js';
import { makeItem, itemValue, itemTitle } from './items.js';
import { spend, earn, charge, notify, addItem, getItem, removeItem, canStore, addReview, removeReview, stat, addXP, log } from './player.js';
import { strike } from './support.js';
import { arrest } from './crime.js';
import { makeHot, watchHot } from './hot.js';

// ---------------------------------------------------------------- installed apps
export function ensurePhone(allApps) {
  const s = G.s;
  if (!s.installed) {
    // older saves: keep every app the player could already open
    s.installed = s.t > 8 * 60 + 5 && allApps ? allApps.filter((a) => !APP_META[a.id]?.secret).map((a) => a.id) : [...PREINSTALLED];
  }
  for (const id of PREINSTALLED) if (!s.installed.includes(id)) s.installed.push(id);
  s.dl ||= {};
  s.vpn ||= { on: false, until: 0 };
  s.home ||= { widgets: [{ id: 'w1', k: 'clock', size: 's', page: 0 }, { id: 'w2', k: 'needs', size: 's', page: 0 }, { id: 'w3', k: 'log', size: 'm', page: 0 }] };
}
export const isInstalled = (id) => !APP_META[id] || (G.s.installed || []).includes(id);
export const isSystem = (id) => SYSTEM_APPS.includes(id);
export const vpnActive = () => !!(G.s.vpn?.on && G.s.vpn.until > G.s.t);
export const downloading = (id) => G.s.dl?.[id];
export function dlProgress(id) { const d = G.s.dl?.[id]; if (!d) return 0; return clamp((G.s.t - d.start) / Math.max(1, d.end - d.start), 0, 1); }

// download time grows with the app size; a VPN slows it down a bit
export function startDownload(app) {
  const s = G.s;
  const meta = APP_META[app.id] || {};
  if (isInstalled(app.id) || s.dl[app.id]) return { ok: false };
  if (meta.secret && !vpnActive()) return { ok: false, msg: T('Скрытые приложения качаются только через VPN', 'Приховані застосунки завантажуються лише через VPN', 'Hidden apps download only over a VPN') };
  if (meta.price && !(s.bought || []).includes(app.id)) {
    if (!spend(meta.price, 'apps', T(`Покупка: ${L(app.name)}`, `Покупка: ${L(app.name)}`, `Purchase: ${L(app.name)}`))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
    (s.bought ||= []).push(app.id);
  }
  const mins = Math.max(2, Math.round((meta.mb || 40) / 22)) + (vpnActive() ? 1 : 0);
  s.dl[app.id] = { start: s.t, end: s.t + mins };
  emit('apps');
  return { ok: true, mins };
}
export function uninstall(id) {
  const s = G.s;
  if (isSystem(id)) return false;
  s.installed = s.installed.filter((x) => x !== id);
  s.home.widgets = s.home.widgets.filter((w) => w.app !== id);
  emit('apps');
  return true;
}
export const PHONE = { nameOf: (id) => id };
export function phoneTick() {
  const s = G.s;
  for (const [id, d] of Object.entries(s.dl || {})) {
    if (d.end > s.t) continue;
    delete s.dl[id];
    if (!s.installed.includes(id)) s.installed.push(id);
    notify('appstore', T('Приложение установлено', 'Застосунок встановлено', 'App installed'), PHONE.nameOf(id), { go: [id] });
    emit('apps');
  }
  if (s.vpn?.on && s.vpn.until <= s.t) { s.vpn.on = false; notify('vpn', 'VPN', T('Подписка закончилась — соединение не защищено', 'Підписка скінчилася — зʼєднання не захищене', 'Subscription ended — connection unprotected')); emit('apps'); }
  darkTick();
}

// ---------------------------------------------------------------- VPN
export const VPN_PLANS = [
  { d: 1, price: 0.99, n: ['1 день', '1 день', '1 day'] },
  { d: 7, price: 4.49, n: ['7 дней', '7 днів', '7 days'] },
  { d: 30, price: 12.99, n: ['30 дней', '30 днів', '30 days'] },
];
export function buyVpn(i) {
  const p = VPN_PLANS[i];
  if (!spend(p.price, 'apps', `VPN ${L(p.n)}`)) return false;
  const s = G.s;
  s.vpn.until = Math.max(s.vpn.until, s.t) + p.d * 1440;
  s.vpn.on = true;
  emit('apps');
  return true;
}
export function toggleVpn() { const s = G.s; if (s.vpn.until <= s.t) return false; s.vpn.on = !s.vpn.on; emit('apps'); return true; }

// ---------------------------------------------------------------- shadow market
// Four kinds of goods: 🔥 stolen (the seller says so — cheapest, carries traces), 📦 grey import (clean, no papers,
// no warranty), 🎭 1:1 replicas (sold as replicas — passing them off as originals is a crime), and "clean" offers
// that are secretly hot (no label, the price is just a bit too good). A new batch every 4 hours.
const DARK_CATS = ['phones', 'phones', 'electronics', 'consoles', 'watches', 'bags', 'sneakers', 'jewelry', 'bikes', 'perfume', 'clothing', 'instruments', 'cars'];
const SELLERS = ['ghost_77', 'n1ght', 'tovar24', 'shadowbox', 'anon_seller', 'quiet_m', 'dropzone', 'sklad_bez_voprosov', 'tihiy_opt', 'grey_import', 'replica_lux', 'kot_v_meshke'];
export const DARK_KINDS = {
  hot: { ic: '🔥', n: ['Краденое', 'Крадене', 'Stolen'] },
  grey: { ic: '📦', n: ['Серый импорт', 'Сірий імпорт', 'Grey import'] },
  replica: { ic: '🎭', n: ['Реплика 1:1', 'Репліка 1:1', '1:1 replica'] },
};
function darkFeed() {
  const s = G.s;
  s.dark ||= { feed: [], at: 0, watch: [] };
  if (s.dark.at > s.t && s.dark.feed.length) return s.dark.feed;
  const rng = new RNG(`${s.id}:dark2:${Math.floor(s.t / 240)}`);
  const city = s.player.city, cur = countryOf(city).cur;
  s.dark.feed = [];
  for (let i = 0; i < 12; i++) {
    let cat = rng.pick(DARK_CATS);
    if (cat === 'cars' && !rng.chance(0.35)) cat = 'phones';
    const kind = rng.weighted(['hot', 'grey', 'replica', 'hidden'], (k) => ({ hot: 4, grey: 4, replica: ['watches', 'bags', 'sneakers', 'jewelry', 'perfume', 'clothing'].includes(cat) ? 3 : 0, hidden: 1.4 }[k]));
    const it = makeItem(rng, { model: rng.pick(BY_CAT[cat]), quality: rng.chance(0.6) ? 'good' : 'any', fakeMult: 0, lockRate: kind === 'hot' ? 0.25 : 0.04 });
    it.box = kind === 'grey' && rng.chance(0.5); it.docs = false; it.grey = true; it.fake = 0;
    const clean = itemValue(it, city, 'true');
    let k = 0.7;
    if (kind === 'hot') { makeHot(it, rng, { known: true }); k = rng.float(0.25, 0.42); }
    else if (kind === 'hidden') { makeHot(it, rng, { known: false }); k = rng.float(0.5, 0.65); }
    else if (kind === 'replica') { it.fake = 2; it.fakeKnown = true; k = rng.float(0.1, 0.16); }
    else k = rng.float(0.62, 0.8);
    s.dark.feed.push({ id: uid('dk'), item: it, kind: kind === 'hidden' ? 'grey' : kind, price: nicePrice(Math.max(5, clean * k), cur), seller: rng.pick(SELLERS) });
  }
  s.dark.at = s.t + 240 - (s.t % 240);
  return s.dark.feed;
}
export const darkListings = () => darkFeed();
export function darkBuy(id) {
  const s = G.s;
  if (!vpnActive()) return { ok: false, msg: T('Без VPN сюда нельзя', 'Без VPN сюди не можна', 'Not without a VPN') };
  const l = s.dark.feed.find((x) => x.id === id);
  if (!l) return { ok: false };
  if (!canStore(l.item)) return { ok: false, msg: T('Склад переполнен', 'Склад переповнений', 'Storage is full') };
  if (!spend(l.price, 'buy', T('Теневой рынок', 'Тіньовий ринок', 'Shadow market'))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  s.dark.feed = s.dark.feed.filter((x) => x !== l);
  addItem(l.item, l.price, 'dark');
  // stolen goods get traced sooner or later — unless you wipe the traces (and even then, maybe)
  if (l.item.hot) watchHot(l.item);
  stat('darkBuys'); log('dark', itemTitle(l.item));
  return { ok: true, hot: !!l.item.hot };
}
function darkTick() {
  const s = G.s;
  if (!s.dark?.watch?.length) return;
  const due = s.dark.watch.filter((w) => w.at <= s.t);
  if (!due.length) return;
  s.dark.watch = s.dark.watch.filter((w) => w.at > s.t);
  for (const w of due) {
    if (!chance(0.7)) continue;
    const it = getItem(w.itemId);
    const fine = Math.max(30, w.value * 0.35);
    if (it) removeItem(it.id);
    arrest('stolen', { fine: fine * 0.5, text: w.title });
    notify('gov', T('Полиция', 'Поліція', 'Police'), it ? T(`Изъято краденое: ${w.title}. Штраф ${fmt(fine)}.`, `Вилучено крадене: ${w.title}. Штраф ${fmt(fine)}.`, `Stolen goods seized: ${w.title}. Fine ${fmt(fine)}.`) : T(`Проданная вами вещь оказалась краденой. Штраф ${fmt(fine)}.`, `Продана вами річ виявилася краденою. Штраф ${fmt(fine)}.`, `An item you sold was stolen. Fine ${fmt(fine)}.`));
  }
  emit('inv');
}
// account unlock service for hopelessly locked phones (Pear ID / blacklisted IMEI)
export const unlockPrice = (it) => Math.max(15, itemValue(it, G.s.player.city, 'true') * 0.22);
export function darkUnlock(itemId) {
  const it = getItem(itemId);
  if (!it || !['icloud', 'blacklist'].includes(it.lock) || !vpnActive()) return { ok: false };
  const price = unlockPrice(it);
  if (!spend(price, 'service', T('Теневой сервис', 'Тіньовий сервіс', 'Shadow service'))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  const r = Math.random();
  if (r < 0.55) { it.lock = null; it.grey = true; addXP(12); emit('inv'); return { ok: true, res: 'done' }; }
  if (r < 0.8) { earn(price * 0.5, 'refund', T('Частичный возврат', 'Частковий повернення', 'Partial refund')); return { ok: true, res: 'fail' }; }
  return { ok: true, res: 'scam' };
}
// fake reviews: quick rating boost, but support may catch it
export const BOOST_PRICE = 25;
export function darkBoost() {
  const s = G.s;
  if (!vpnActive()) return { ok: false };
  if (!spend(BOOST_PRICE, 'service', T('Накрутка отзывов', 'Накрутка відгуків', 'Review boosting'))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  const names = ['Ирина', 'Max', 'Олег', 'Kate', 'Дима'];
  const ids = [];
  for (let i = 0; i < 3; i++) { addReview(5, T('Всё супер, рекомендую!', 'Усе супер, рекомендую!', 'All great, recommended!'), { buyer: names[i], fair: false }); ids.push(s.rep.reviews[0].id); }
  if (chance(0.35)) {
    for (const id of ids) removeReview(id);
    strike(T('Накрутка отзывов', 'Накрутка відгуків', 'Fake reviews'));
    return { ok: true, caught: true };
  }
  return { ok: true, caught: false };
}
