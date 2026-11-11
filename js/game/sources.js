// Other item sources: free giveaways, dumpster finds, pawn shop, wholesale lots, mystery boxes, auctions.
import { G, emit } from '../core/state.js';
import { RNG } from '../core/rng.js';
import { T, L } from '../core/i18n.js';
import { uid, clamp, chance, rnd, rint, pickR } from '../core/util.js';
import { countryOf, CITY } from '../data/world.js';
import { CATS, CAT_LIST, RARITY } from '../data/catalog.js';
import { makeItem, itemValue, itemTitle, isVehicle, sizeUnits } from './items.js';
import { nicePrice, fmt } from '../core/money.js';
import { npcName } from './npc.js';
import { canStore, addItem, spend, earn, charge, stat, addXP, upLevel, notify, log, freeSpace, getItem, removeItem, addProfit } from './player.js';
import { DISTRICTS, maxValForLevel } from './market.js';

// ---------------------------------------------------------------- free stuff
export function freeFeed() {
  const s = G.s;
  if (s.free.items) for (const g of s.free.items) if (!g.taken && g.until && g.until <= s.t) g.taken = true; // snapped up by others
  if (s.free.refreshAt <= s.t || s.free.city !== s.player.city) {
    const rng = new RNG(`${s.id}:free:${s.t}`);
    const n = 6 + upLevel('network');
    s.free = { refreshAt: s.t + 480, city: s.player.city, items: [] };
    for (let i = 0; i < n; i++) s.free.items.push(makeGiveaway(rng));
  }
  return s.free;
}
// Giveaways are almost all cheap junk. Anything valuable is rare, swarmed by takers, gone within
// minutes, and often bait ("free iPhone, just pay delivery").
const GIVE_TIERS = [
  { k: 'cheap', p: 0.84, max: 40, claim: [0, 5], life: [120, 480], gone: 0.12, speed: [2.4, 0.38], goal: 24 },
  { k: 'mid', p: 0.97, max: 180, claim: [3, 11], life: [40, 180], gone: 0.35, speed: [5.4, 0.22], goal: 28 },
  { k: 'good', p: 0.995, max: 900, claim: [14, 32], life: [8, 40], gone: 0.68, speed: [8.6, 0.06], goal: 32 },
  { k: 'jackpot', p: 1, max: 6000, claim: [35, 90], life: [3, 15], gone: 0.88, speed: [10.8, 0.03], goal: 34 },
];
export const giveTier = (g) => GIVE_TIERS.find((t) => t.k === g.tier) || GIVE_TIERS[0];
function makeGiveaway(rng) {
  const s = G.s;
  const roll = rng.float(0, 1) * (1 - upLevel('network') * 0.004);
  const tier = GIVE_TIERS.find((t) => roll < t.p) || GIVE_TIERS[0];
  const q = tier.k === 'cheap' ? (rng.chance(0.85) ? 'junk' : 'any') : rng.chance(0.55) ? 'junk' : 'any';
  const item = makeItem(rng, { city: s.player.city, quality: q, maxVal: tier.max, rareBoost: 0.15 + upLevel('network') * 0.15, lockRate: 0.25 });
  for (const d of item.defects) if (rng.chance(0.4)) d.known = true;
  const reason = rng.pick([
    ['Отдам даром, переезд', 'Віддам безкоштовно, переїзд', 'Free — moving out'],
    ['Разбирали кладовку', 'Розбирали комору', 'Cleared out the storage room'],
    ['Остались от деда', 'Залишилися від діда', 'Left over from grandpa'],
    ['Самовывоз сегодня', 'Самовивіз сьогодні', 'Pick up today'],
    ['Не работает, может кому на запчасти', 'Не працює, може комусь на запчастини', 'Broken, maybe for parts'],
    ['Освобождаю гараж', 'Звільняю гараж', 'Clearing the garage'],
    ['Заберите, иначе выброшу', 'Заберіть, інакше викину', 'Take it or it goes in the bin'],
    ['Бывший оставил, видеть не могу', 'Колишній залишив, бачити не можу', 'My ex left it, can’t stand it'],
  ]);
  const bait = (tier.k === 'good' || tier.k === 'jackpot') && rng.chance(0.4);
  return { id: uid('f'), item, tier: tier.k, bait, who: npcName(rng, s.player.city).name, dist: rng.int(0, DISTRICTS.length - 1), claimers: rng.int(tier.claim[0], tier.claim[1]), reason: bait ? ['Отдам даром, оплатите только доставку', 'Віддам безкоштовно, оплатіть лише доставку', 'Free, just pay for delivery'] : reason, until: s.t + rng.int(tier.life[0], tier.life[1]), taken: false };
}
// before the race: did someone already grab it while you were on the way?
export function freeAlreadyGone(g) { return chance(giveTier(g).gone); }
// the bait: paying "delivery" for a free gadget just loses the money
export function payBait(g) {
  const loss = Math.max(5, Math.min(G.s.money, 8 + itemValue(g.item, G.s.player.city, 'true') * 0.04));
  charge(loss, 'scam', T('«Доставка» бесплатной вещи', '«Доставка» безкоштовної речі', '“Delivery” for a free item'));
  g.taken = true;
  stat('scammed');
  return loss;
}

export function claimFree(g, won) {
  const s = G.s;
  g.taken = true;
  if (!won) return { ok: false };
  if (!canStore(g.item)) return { ok: false, msg: T('Нет места на складе', 'Немає місця на складі', 'No storage space') };
  addItem(g.item, 0, 'free');
  s.energy = clamp(s.energy - 6, 0, 100);
  stat('freebies'); addXP(6);
  log('free', itemTitle(g.item));
  emit('inv');
  return { ok: true };
}

// ---------------------------------------------------------------- dumpster / street search
export function dumpsterLoot(score) {
  const s = G.s;
  const rng = new RNG(`${s.id}:dump:${s.t}:${Math.random()}`);
  const n = score > 0.8 ? 2 : 1;
  const out = [];
  for (let i = 0; i < n; i++) {
    if (rng.chance(0.25 - score * 0.15)) continue;
    const it = makeItem(rng, { city: s.player.city, quality: 'junk', maxVal: rng.chance(0.05) ? 2000 : 120, rareBoost: score * 0.6 + upLevel('network') * 0.2, lockRate: 0.3 });
    if (isVehicle(it)) continue;
    out.push(it);
  }
  return out;
}

// ---------------------------------------------------------------- pawn shop (buy)
export function pawnShop() {
  const s = G.s;
  if (s.pawn.refreshAt <= s.t || s.pawn.city !== s.player.city) {
    const rng = new RNG(`${s.id}:pawn:${s.t}`);
    s.pawn = { refreshAt: s.t + 720, city: s.player.city, items: [] };
    for (let i = 0; i < 8; i++) {
      const item = makeItem(rng, { city: s.player.city, quality: 'good', maxVal: maxValForLevel() * 1.5, fakeMult: 0.4, lockRate: 0 });
      for (const d of item.defects) d.known = true;
      if (item.fake) item.fakeKnown = rng.chance(0.6);
      const price = nicePrice(itemValue(item, s.player.city, 'known') * rng.float(0.72, 0.98), countryOf(s.player.city).cur);
      s.pawn.items.push({ id: uid('p'), item, price, sold: false });
    }
  }
  return s.pawn;
}
export function buyPawn(p) {
  if (p.sold) return { ok: false };
  if (!canStore(p.item)) return { ok: false, msg: T('Нет места', 'Немає місця', 'No space') };
  if (!spend(p.price, 'buy', itemTitle(p.item))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  p.sold = true;
  addItem(p.item, p.price, 'pawn');
  stat('bought'); addXP(5);
  return { ok: true };
}

// ---------------------------------------------------------------- wholesale lots
export function wholesale() {
  const s = G.s;
  if (s.whole.refreshAt <= s.t || s.whole.city !== s.player.city) {
    const rng = new RNG(`${s.id}:whole:${s.t}`);
    s.whole = { refreshAt: s.t + 900, city: s.player.city, deals: [] };
    const n = 3 + Math.floor(upLevel('network') / 2);
    for (let i = 0; i < n; i++) s.whole.deals.push(makeWholesale(rng));
  }
  return s.whole;
}
const LOT_NAMES = {
  phones: ['Лот телефонов из сервиса', 'Лот телефонів із сервісу', 'Phones from a repair shop'],
  electronics: ['Списанная офисная техника', 'Списана офісна техніка', 'Decommissioned office tech'],
  consoles: ['Приставки из закрытого клуба', 'Приставки з закритого клубу', 'Consoles from a closed gaming club'],
  sneakers: ['Остатки склада кроссовок', 'Залишки складу кросівок', 'Sneaker warehouse leftovers'],
  clothing: ['Сток одежды', 'Сток одягу', 'Clothing stock lot'],
  accessories: ['Коробка аксессуаров', 'Коробка аксесуарів', 'Box of accessories'],
  perfume: ['Парфюм с таможни', 'Парфуми з митниці', 'Perfume seized by customs'],
  toys: ['Игрушки из закрывшегося магазина', 'Іграшки з магазину, що закрився', 'Toy store closing lot'],
  default: ['Оптовая партия', 'Оптова партія', 'Bulk lot'],
};
function makeWholesale(rng) {
  const s = G.s;
  const cat = rng.pick(['phones', 'phones', 'electronics', 'consoles', 'sneakers', 'clothing', 'accessories', 'perfume', 'toys']);
  const n = rng.int(5, 15);
  const items = [];
  const maxVal = Math.max(200, maxValForLevel() / 4);
  for (let i = 0; i < n; i++) items.push(makeItem(rng, { city: s.player.city, cat, quality: rng.chance(0.5) ? 'any' : 'junk', maxVal, lockRate: 0.15, fakeMult: 1.4 }));
  const total = items.reduce((a, it) => a + itemValue(it, s.player.city, 'true'), 0);
  const price = nicePrice(total * rng.float(0.5, 0.82), countryOf(s.player.city).cur);
  return { id: uid('w'), cat, name: LOT_NAMES[cat] || LOT_NAMES.default, items, price, sold: false, until: s.t + 900 };
}
export function buyWholesale(w) {
  if (w.sold) return { ok: false };
  const units = w.items.reduce((a, it) => a + sizeUnits(it), 0);
  if (freeSpace() < units) return { ok: false, msg: T(`Нужно ${units} мест на складе`, `Потрібно ${units} місць на складі`, `Need ${units} storage units`) };
  if (!spend(w.price, 'buy', L(w.name))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  w.sold = true;
  const per = w.price / w.items.length;
  for (const it of w.items) addItem(it, per, 'wholesale');
  stat('bought', w.items.length); stat('wholesale'); addXP(20);
  return { ok: true };
}

// ---------------------------------------------------------------- mystery boxes
export const BOXES = [
  { id: 'basic', n: ['Базовый бокс', 'Базовий бокс', 'Basic box'], price: 12, ev: 0.8, cats: null, color: '#8a94a6', lvl: 1 },
  { id: 'tech', n: ['Техно‑бокс', 'Техно‑бокс', 'Tech box'], price: 45, ev: 0.85, cats: ['phones', 'electronics', 'consoles', 'accessories'], color: '#4da3ff', lvl: 2 },
  { id: 'kicks', n: ['Сникер‑бокс', 'Снікер‑бокс', 'Sneaker box'], price: 90, ev: 0.85, cats: ['sneakers', 'clothing'], color: '#ff8a3d', lvl: 2 },
  { id: 'collector', n: ['Коллекционный бокс', 'Колекційний бокс', 'Collector box'], price: 150, ev: 0.85, cats: ['cards', 'comics', 'toys', 'collectibles'], color: '#ffcc33', lvl: 3 },
  { id: 'lux', n: ['Люкс‑бокс', 'Люкс‑бокс', 'Luxury box'], price: 900, ev: 0.88, cats: ['watches', 'bags', 'jewelry', 'perfume'], color: '#c9a227', lvl: 5 },
  { id: 'diamond', n: ['Бриллиантовый бокс', 'Діамантовий бокс', 'Diamond box'], price: 5000, ev: 0.9, cats: ['watches', 'bags', 'jewelry', 'art', 'cars', 'cards'], color: '#b07cff', lvl: 8 },
];
// draw candidate prizes for the roulette strip; returns {prizes, winIndex}
export function rollBox(box) {
  const s = G.s;
  const rng = new RNG(`${s.id}:box:${box.id}:${s.t}:${Math.random()}`);
  const tiers = [
    { w: 52, lo: 0.15, hi: 0.6 }, { w: 30, lo: 0.6, hi: 1.2 }, { w: 12, lo: 1.2, hi: 2.5 }, { w: 4.5, lo: 2.5, hi: 6 }, { w: 1.2, lo: 6, hi: 15 }, { w: 0.3, lo: 15, hi: 40 },
  ];
  const mk = (tier) => {
    const lo = box.price * tier.lo * box.ev, hi = box.price * tier.hi * box.ev;
    for (let k = 0; k < 6; k++) {
      const it = makeItem(rng, { city: s.player.city, cats: box.cats || undefined, quality: rng.chance(0.4) ? 'new' : 'good', maxVal: hi * 1.6, minVal: lo * 0.4, fakeMult: 0, lockRate: 0 });
      const v = itemValue(it, s.player.city, 'true');
      if (v >= lo * 0.6 && v <= hi * 1.4 && !isVehicle(it)) return { it, tier: tiers.indexOf(tier), v };
    }
    const it = makeItem(rng, { city: s.player.city, cats: box.cats || undefined, quality: 'good', maxVal: hi, fakeMult: 0, lockRate: 0 });
    return { it, tier: tiers.indexOf(tier), v: itemValue(it, s.player.city, 'true') };
  };
  const strip = [];
  for (let i = 0; i < 46; i++) strip.push(mk(rng.weighted(tiers, (t) => t.w * (t.lo > 2 ? 2.5 : 1))));
  const win = mk(rng.weighted(tiers, (t) => t.w));
  strip[40] = win;
  return { strip, win, winIndex: 40 };
}
export function buyBox(box) {
  return spend(box.price, 'box', L(box.n));
}
export function takeBoxPrize(win) {
  if (!canStore(win.it)) return false;
  addItem(win.it, 0, 'box');
  stat('boxes'); addXP(5);
  return true;
}

// ---------------------------------------------------------------- auctions (bots bid against the player)
const BIDDERS = ['lot_hunter', 'Vintage_Masha', 'Коллекционер77', 'Bidder_X', 'ПерекупЖорик', 'Kira.Resell', 'DealMaker', 'Сникерхед', 'Old_Money', 'AlexAntique', 'Tokyo_Flip', 'Ляля_Люкс'];
export function auctions() {
  const s = G.s;
  if (s.auctions.city !== s.player.city || s.auctions.lots.filter((l) => !l.done).length < 3) {
    const rng = new RNG(`${s.id}:auc:${s.t}`);
    if (s.auctions.city !== s.player.city) s.auctions = { city: s.player.city, lots: [] };
    while (s.auctions.lots.filter((l) => !l.done).length < 6) s.auctions.lots.push(makeLot(rng));
  }
  return s.auctions;
}
function makeLot(rng) {
  const s = G.s;
  const container = rng.chance(0.22);
  const dur = rng.int(90, 360);
  if (container) {
    const items = []; const k = rng.int(3, 8);
    for (let i = 0; i < k; i++) { const it = makeItem(rng, { city: s.player.city, quality: rng.chance(0.6) ? 'junk' : 'any', maxVal: Math.max(400, maxValForLevel() / 3), rareBoost: 0.4 }); if (!isVehicle(it)) items.push(it); }
    const val = items.reduce((a, it) => a + itemValue(it, s.player.city, 'true'), 0);
    const start = nicePrice(val * 0.15, countryOf(s.player.city).cur);
    return { id: uid('a'), container: true, items, hint: items.slice(0, 2).map((i) => i.cat), start, bid: start, bidder: null, mine: false, end: s.t + dur, done: false, max: bots(rng, val * rng.float(0.45, 0.95)), units: items.reduce((a, it) => a + sizeUnits(it), 0) };
  }
  const item = makeItem(rng, { city: s.player.city, quality: rng.chance(0.5) ? 'good' : 'any', maxVal: maxValForLevel() * 2, rareBoost: 0.8, lockRate: 0 });
  for (const d of item.defects) d.known = true;
  const val = itemValue(item, s.player.city, 'known');
  const start = nicePrice(val * rng.float(0.25, 0.5), countryOf(s.player.city).cur);
  return { id: uid('a'), item, start, bid: start, bidder: null, mine: false, end: s.t + dur, done: false, max: bots(rng, val * rng.float(0.7, 1.08)) };
}
function bots(rng, cap) { return Array.from({ length: rng.int(1, 4) }, () => ({ name: rng.pick(BIDDERS), max: cap * rng.float(0.6, 1) })); }
export const minNext = (lot) => nicePrice(lot.bid * 1.06 + 1, countryOf(G.s.player.city).cur);
export function placeBid(lot, amount) {
  const s = G.s;
  if (lot.done || s.t >= lot.end) return { ok: false };
  if (amount > s.money) return { ok: false, msg: T('Ставка больше баланса', 'Ставка більша за баланс', 'Bid exceeds your balance') };
  lot.bid = amount; lot.bidder = s.player.name; lot.mine = true;
  if (lot.end - s.t < 15) lot.end = s.t + 15; // anti-snipe extension
  stat('bids');
  return { ok: true };
}
export function auctionTick() {
  const s = G.s;
  const A = s.auctions;
  if (!A?.lots) return;
  for (const lot of A.lots) {
    if (lot.done) continue;
    if (s.t >= lot.end) { closeLot(lot); continue; }
    // bots respond to bids
    const left = lot.end - s.t;
    const p = lot.mine ? (left < 20 ? 0.35 : 0.08) : 0.025;
    if (chance(p)) {
      const cand = lot.max.filter((b) => b.max > minNext(lot) && b.name !== lot.bidder);
      if (cand.length) {
        const b = pickR(cand);
        const was = lot.mine;
        lot.bid = minNext(lot); lot.bidder = b.name; lot.mine = false;
        if (left < 15) lot.end = s.t + 15;
        if (was) notify('auction', T('Вашу ставку перебили', 'Вашу ставку перебили', 'You were outbid'), `${lot.container ? T('Контейнер', 'Контейнер', 'Storage unit') : itemTitle(lot.item)} — ${fmt(lot.bid)}`, { go: ['auction', 'lot', { id: lot.id }] });
      }
    }
  }
  A.lots = A.lots.filter((l) => !l.done || s.t - l.end < 300);
}
function closeLot(lot) {
  const s = G.s;
  lot.done = true;
  if (!lot.mine) return;
  const items = lot.container ? lot.items : [lot.item];
  const units = items.reduce((a, it) => a + sizeUnits(it), 0);
  if (s.money < lot.bid || (!lot.container && !canStore(lot.item)) || (lot.container && freeSpace() < units)) {
    lot.failed = true;
    notify('auction', T('Лот аннулирован', 'Лот анульовано', 'Lot cancelled'), T('Не хватило денег или места', 'Не вистачило грошей чи місця', 'Not enough money or space'));
    return;
  }
  spend(lot.bid, 'auction', lot.container ? 'container' : itemTitle(lot.item));
  const per = lot.bid / items.length;
  for (const it of items) addItem(it, per, 'auction');
  lot.won = true;
  stat('auctionsWon'); addXP(15);
  notify('auction', T('Вы выиграли аукцион!', 'Ви виграли аукціон!', 'You won the auction!'), `${lot.container ? T(`Контейнер: ${items.length} вещей`, `Контейнер: ${items.length} речей`, `Storage unit: ${items.length} items`) : itemTitle(lot.item)} — ${fmt(lot.bid)}`, { go: ['inventory'] });
}

// Selling your own item via auction (resolves over time)
export function startOwnAuction(itemId, start, dur = 240) {
  const s = G.s;
  const it = getItem(itemId);
  if (!it || it.listed || it.shop) return false;
  it.listed = true; it.auction = { start, end: s.t + dur, bid: 0, bids: 0 };
  s.ownAuctions ||= [];
  s.ownAuctions.push({ itemId, start, end: s.t + dur });
  return true;
}
export function ownAuctionTick() {
  const s = G.s;
  if (!s.ownAuctions?.length) return;
  for (const a of s.ownAuctions) {
    const it = getItem(a.itemId);
    if (!it) { a.done = true; continue; }
    const val = itemValue(it, s.player.city, 'known');
    if (!a.done && chance(0.05)) {
      const next = Math.max(a.start, (it.auction.bid || 0) * 1.07);
      if (next < val * rnd(0.85, 1.2)) { it.auction.bid = next; it.auction.bids++; }
    }
    if (!a.done && s.t >= a.end) {
      a.done = true;
      it.listed = false;
      const bid = it.auction.bid;
      delete it.auction;
      if (bid > 0) {
        const fee = bid * 0.08;
        removeItem(it.id);
        earn(bid - fee, 'sale', itemTitle(it));
        addProfit(bid - fee - (it.paid || 0));
        stat('sold'); stat('auctionSold'); addXP(12);
        notify('auction', T('Аукцион завершён', 'Аукціон завершено', 'Auction finished'), `${itemTitle(it)}: ${fmt(bid - fee)}`);
      } else notify('auction', T('Ставок не было', 'Ставок не було', 'No bids'), itemTitle(it));
    }
  }
  s.ownAuctions = s.ownAuctions.filter((a) => !a.done);
}
