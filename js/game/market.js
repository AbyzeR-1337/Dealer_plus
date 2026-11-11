// City classifieds feed: listings from NPC sellers, buying, haggling with sellers, rival snipes.
import { G, emit } from '../core/state.js';
import { RNG } from '../core/rng.js';
import { T, L } from '../core/i18n.js';
import { uid, clamp, chance, rnd, rint, pickR } from '../core/util.js';
import { CITY, countryOf } from '../data/world.js';
import { DEFECTS, CATS } from '../data/catalog.js';
import { makeItem, itemValue, itemTitle, isVehicle, defectName, knownDefects } from './items.js';
import { nicePrice, fmt } from '../core/money.js';
import { makeSeller, SELLER_TRAITS, PH, say, fill } from './npc.js';
import { canStore, addItem, spend, stat, addXP, upLevel, notify, log, luggageCap } from './player.js';
import { day } from './economy.js';

export const FEED_REFRESH = 300; // game minutes (= real seconds)
export const DISTRICTS = [
  ['Центр', 'Центр', 'Downtown'], ['Север', 'Північ', 'North'], ['Юг', 'Південь', 'South'], ['Запад', 'Захід', 'West'], ['Восток', 'Схід', 'East'],
  ['Спальный район', 'Спальний район', 'Suburbs'], ['Промзона', 'Промзона', 'Industrial'], ['Рынок', 'Ринок', 'Market'], ['Набережная', 'Набережна', 'Riverside'], ['Окраина', 'Околиця', 'Outskirts'],
];

export function makeListing(rng, cityId, o = {}) {
  const item = makeItem(rng, { city: cityId, quality: o.quality || 'any', cat: o.cat, maxVal: o.maxVal ?? maxValForLevel(), lockRate: 0.07, rareBoost: upLevel('network') * 0.2 });
  const seller = makeSeller(rng, cityId);
  const st = SELLER_TRAITS[seller.trait];
  // seller knowledge / disclosure
  for (const d of item.defects) {
    if (!d.known && rng.chance(st.honesty * (seller.trait === 'clueless' ? 0.5 : 1))) d.known = true, d.disclosed = true;
  }
  if (item.fake && rng.chance(st.honesty * 0.6)) item.fakeKnown = true;
  // asking price: seller values the item as if hidden problems don't exist
  const seen = itemValue(item, cityId, 'known');
  let f;
  if (seller.trait === 'urgent' || seller.trait === 'granny') f = rng.float(0.5, 0.78);
  else if (seller.trait === 'clueless') f = rng.float(0.45, 1.25);
  else if (seller.trait === 'dealer') f = rng.float(1.0, 1.3);
  else f = rng.float(0.78, 1.28);
  if (item.lock) f *= 0.9;
  let price = nicePrice(Math.max(1, seen * f), countryOf(cityId).cur);
  return {
    id: uid('l'), item, price, seller, city: cityId, dist: rng.int(0, DISTRICTS.length - 1),
    posted: (G.s?.t || 0) - rng.int(0, o.fresh ? 0 : 900), views: rng.int(3, 400), sold: false, minF: rng.float(st.flex[0], st.flex[1]),
    desc: rng.int(0, 9999),
  };
}
// cheaper items for beginners, bigger budgets later
export function maxValForLevel() {
  const lvl = G.s?.level || 1;
  const money = G.s?.money || 0;
  return Math.max(150, Math.min(4e6, 120 * Math.pow(lvl, 2.2) + money * 2.5));
}

export function feedFor(cityId = G.s.player.city) {
  const s = G.s;
  let f = s.feeds[cityId];
  if (!f || f.refreshAt <= s.t) f = s.feeds[cityId] = generateFeed(cityId);
  return f;
}
export function generateFeed(cityId) {
  const s = G.s;
  const rng = new RNG(`${s.id}:feed:${cityId}:${s.t}`);
  const size = CITY[cityId]?.size || 1;
  const n = 16 + size * 6;
  const items = [];
  for (let i = 0; i < n; i++) items.push(makeListing(rng, cityId, { quality: rng.chance(0.08) ? 'junk' : 'any' }));
  // keep player's chats with sellers? feed refresh drops them (like the reference game)
  s.chats = s.chats.filter((c) => c.kind !== 'buy' || c.st === 'deal');
  return { refreshAt: s.t + FEED_REFRESH, items, city: cityId };
}
export const feedTimeLeft = (cityId = G.s.player.city) => Math.max(0, (G.s.feeds[cityId]?.refreshAt || 0) - G.s.t);
export function findListing(id) {
  for (const f of Object.values(G.s.feeds)) { const l = f.items.find((x) => x.id === id); if (l) return l; }
  return null;
}
export const marketEstimate = (it, city) => {
  // the player's estimate gets more accurate with the "eye" upgrade
  const v = itemValue(it, city || G.s.player.city, 'known');
  const err = 0.12 - upLevel('eye') * 0.02;
  const wob = 1 + Math.sin((it.seed % 1000) + day()) * err;
  return v * wob;
};
export function isBelowMarket(l) { return l.price < marketEstimate(l.item, l.city) * 0.86; }

// Listing description text (seller’s words)
export function listingDesc(l) {
  const it = l.item;
  const lines = [];
  const known = knownDefects(it).map((d) => defectName(d.c).toLowerCase());
  if (it.lock) known.push(L({ passcode: ['забыл пароль', 'забув пароль', 'forgot passcode'], frp: ['FRP‑блокировка', 'FRP‑блокування', 'FRP lock'], icloud: ['привязан к Pear ID', 'привʼязаний до Pear ID', 'Pear ID locked'], blacklist: ['не ловит сеть', 'не ловить мережу', 'no network'], bootloop: ['перезагружается сам', 'перезавантажується сам', 'keeps rebooting'] }[it.lock]));
  if (known.length) lines.push(fill(L(PH.sellerDefects), { list: known.join(', ') }));
  else lines.push(L(PH.sellerClean));
  if (it.fake && it.fakeKnown) lines.push(L(PH.sellerRepl));
  else if (['bags', 'watches', 'sneakers', 'jewelry', 'clothing', 'perfume'].includes(it.cat)) lines.push(L(PH.sellerOrig));
  if (it.box) lines.push(T('Есть коробка.', 'Є коробка.', 'Box included.'));
  if (it.docs) lines.push(T('Документы/чек на месте.', 'Документи/чек є.', 'Papers/receipt included.'));
  if (l.seller.trait === 'urgent') lines.push(T('Срочно, переезжаю!', 'Терміново, переїжджаю!', 'Urgent, moving out!'));
  if (l.seller.trait === 'granny') lines.push(T('Внук оставил, мне не нужно.', 'Онук залишив, мені не треба.', 'My grandson left it, I don’t need it.'));
  if (l.seller.trait === 'dealer') lines.push(T('Обмен не интересует. Торг уместен.', 'Обмін не цікавить. Торг доречний.', 'No trades. Some haggle room.'));
  return lines.join(' ');
}

// ---------------------------------------------------------------- buying
export function pickupInfo(l) {
  const own = G.s.car ? 'car' : null;
  const base = 25 + (l.dist % 5) * 12;
  const fare = own ? 1.5 : l.dist === 0 ? 1 : 2 + (l.dist % 4);
  return { time: own ? Math.round(base * 0.5) : base, fare, energy: own ? 3 : 6 };
}
export function deliveryFee(l) { return Math.max(3, l.price * 0.03); }
export function deliveryTime(cityFrom, cityTo, big) {
  const base = cityFrom === cityTo ? 150 : 420;
  return Math.round(base * (big ? 1.6 : 1) * (1 - upLevel('delivery') * 0.15));
}

// buy now; mode: 'pickup' (immediate, after inspection) | 'delivery'
export function buyListing(l, mode, price = l.price) {
  const s = G.s;
  if (l.sold) return { ok: false, msg: T('Уже продано', 'Вже продано', 'Already sold') };
  if (!canStore(l.item)) return { ok: false, msg: isVehicle(l.item) ? T('Нет места в гараже/на парковке', 'Немає місця в гаражі', 'No garage space') : T('Склад переполнен', 'Склад переповнений', 'Storage is full') };
  const fee = mode === 'delivery' ? deliveryFee(l) : pickupInfo(l).fare;
  if (!spend(price + fee, 'buy', itemTitle(l.item))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  l.sold = true; l.buyer = 'me';
  const it = l.item;
  it.paid = price + fee;
  if (mode === 'delivery') {
    s.deliveries.push({ id: uid('d'), kind: 'in', item: it, from: l.city, to: s.player.city, start: s.t, eta: s.t + deliveryTime(l.city, s.player.city, isVehicle(it)), price: price + fee, who: l.seller.name });
    notify('delivery', T('Заказ оформлен', 'Замовлення оформлено', 'Order placed'), itemTitle(it), { silent: true });
  } else {
    addItem(it, price + fee, 'market');
    s.energy = clamp(s.energy - pickupInfo(l).energy, 0, 100);
  }
  stat('bought'); stat('boughtSum', price);
  addXP(4 + Math.min(30, price / 50));
  log('buy', `${itemTitle(it)} — ${fmt(price)}`);
  emit('market');
  return { ok: true };
}

// ---------------------------------------------------------------- haggling with a seller (buy side chat)
export function openBuyChat(l) {
  const s = G.s;
  let c = s.chats.find((x) => x.kind === 'buy' && x.ref === l.id);
  if (c) return c;
  c = { id: uid('c'), kind: 'buy', ref: l.id, npc: l.seller, title: itemTitle(l.item), itemSnap: l.item, ask: l.price, msgs: [], st: 'open', round: 0, t: s.t, unread: 0 };
  s.chats.unshift(c);
  return c;
}
export function sellerRespond(c, l, offer, persuade = 0) {
  const s = G.s;
  const rng = new RNG(c.id + ':' + c.round + ':' + Math.round(offer));
  c.round++;
  const floor = l.price * clamp(l.minF - upLevel('haggle') * 0.03 - persuade, 0.4, 1);
  if (l.sold) { c.msgs.push({ f: 'them', tx: L(PH.sellerGone), t: s.t }); c.st = 'closed'; return 'gone'; }
  if (offer >= floor) {
    c.deal = offer; c.st = 'deal';
    c.msgs.push({ f: 'them', tx: say(PH.sellerYes, { price: fmt(offer) }, rng), t: s.t });
    return 'yes';
  }
  if (offer < l.price * 0.45 || c.round > 3) {
    c.msgs.push({ f: 'them', tx: say(PH.sellerNo, {}, rng), t: s.t });
    if (c.round > 3) { c.st = 'closed'; return 'no'; }
    return 'low';
  }
  const counter = nicePrice(Math.max(floor, (offer + c.ask) / 2), countryOf(l.city).cur);
  c.ask = Math.min(c.ask, counter);
  c.msgs.push({ f: 'them', tx: say(PH.sellerCounter, { price: fmt(c.ask) }, rng), t: s.t });
  return 'counter';
}

// ---------------------------------------------------------------- ticking
export function marketTick() {
  const s = G.s;
  const city = s.player.city;
  const f = s.feeds[city];
  if (!f) return;
  if (f.refreshAt <= s.t) { s.feeds[city] = generateFeed(city); emit('market'); return; }
  // new listings trickle in
  if (chance(1 / 55)) {
    const rng = new RNG(`${s.id}:new:${s.t}`);
    const l = makeListing(rng, city, { fresh: true });
    f.items.unshift(l);
    if (f.items.length > 40) f.items.pop();
    if (isBelowMarket(l) && chance(0.3)) notify('market', T('Горячее объявление', 'Гаряче оголошення', 'Hot listing'), `${itemTitle(l.item)} — ${fmt(l.price)}`, { noBadge: true, go: ['market', 'item', { id: l.id }] });
    emit('market');
  }
  // rival resellers snipe underpriced listings
  if (chance(1 / 40)) {
    const hot = f.items.filter((l) => !l.sold && l.buyer !== 'me' && isBelowMarket(l));
    if (hot.length) {
      const l = pickR(hot);
      l.sold = true; l.buyer = pickR(s.rivals).name; l.soldAt = s.t;
      log('rival', `${l.buyer}: ${itemTitle(l.item)}`);
      if (s.favs.includes(l.id)) notify('market', T('Увели из‑под носа', 'Увели з‑під носа', 'Sniped!'), `${l.buyer} → ${itemTitle(l.item)}`);
      emit('market');
    }
  }
  // drop sold listings after a while
  if (s.t % 30 === 0) { f.items = f.items.filter((l) => !(l.sold && l.buyer !== 'me' && s.t - (l.soldAt || 0) > 90)); }
}
