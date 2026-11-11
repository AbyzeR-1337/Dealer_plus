// Bank cards: every bank has its own line-up (debit, credit, premium, metal, travel, driver's, business,
// virtual...). A card has requirements (level, credit score, a registered business, money on the account),
// an issue fee, delivery time (a courier brings plastic, virtual cards are instant) and perks that really
// work: cashback paid daily by spending category, a higher credit limit and cheaper tickets.
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { clamp } from '../core/util.js';
import { spend, earn, notify } from './player.js';
import { fmt } from '../core/money.js';
import { countryOf } from '../data/world.js';

// which bank each country uses (its app look and its card line-up)
export const BANK_BY_COUNTRY = { UA: 'mono', RU: 'tbank', KZ: 'kaspi', CN: 'alipey', DE: 'n27', GB: 'monzi', US: 'chaze', PL: 'mbanko', FR: 'boursa', IT: 'finecco', JP: 'mufj', AE: 'emirat', TR: 'ziraatt', GE: 'tbs', TH: 'kbang', BY: 'belarus' };
export const currentBank = () => (G.s.bank.skin && BANK_CARDS[G.s.bank.skin] ? G.s.bank.skin : BANK_BY_COUNTRY[countryOf(G.s.player.city).id] || 'chaze');

// perks by card kind
const KIND = {
  debit: { cb: { all: 0.005 } },
  white: { cb: { food: 0.02, all: 0.005 } },
  credit: { limit: 1.35, cb: { all: 0.01 } },
  premium: { limit: 1.25, cb: { all: 0.015 }, travel: 0.05 },
  metal: { limit: 1.6, cb: { all: 0.02 }, travel: 0.2 },
  travel: { travel: 0.15, cb: { travel: 0.05 } },
  drive: { cb: { travel: 0.07, repair: 0.05 } },
  shop: { cb: { buy: 0.04 } },
  business: { cb: { biz: 0.03, rent: 0.03, service: 0.02 }, limit: 1.2 },
  virtual: { cb: { apps: 0.05 } },
  student: { cb: { food: 0.05 } },
};
const L3 = (ru, uk, en) => [ru, uk, en || ru];
// look: [gradient from, to, text colour]
const C = (id, kind, n, price, eta, req, look) => ({ id, kind, n, price, eta, req, look });
const GENERIC = (prefix, palette) => [
  C('debit', 'debit', L3(`${prefix} Дебетовая`, `${prefix} Дебетова`, `${prefix} Debit`), 0, 30, {}, palette[0]),
  C('virtual', 'virtual', L3('Виртуальная', 'Віртуальна', 'Virtual'), 0, 0, {}, ['#5b6cff', '#8a5bff', '#fff']),
  C('credit', 'credit', L3('Кредитная', 'Кредитна', 'Credit'), 0, 45, { score: 620, level: 3 }, palette[1]),
  C('gold', 'premium', L3('Gold', 'Gold', 'Gold'), 300, 60, { score: 660, level: 6 }, ['#e9cf8b', '#a8812e', '#3a2a08']),
  C('travel', 'travel', L3('Travel', 'Travel', 'Travel'), 150, 60, { level: 4 }, ['#2fa6d8', '#0d4f8a', '#fff']),
  C('metal', 'metal', L3('Infinite Metal', 'Infinite Metal', 'Infinite Metal'), 3500, 120, { score: 740, level: 12, money: 20000 }, ['#4a4d55', '#0c0d10', '#e6e6e6']),
  C('biz', 'business', L3('Бизнес', 'Бізнес', 'Business'), 0, 60, { regime: true }, palette[2]),
];
export const BANK_CARDS = {
  mono: [
    C('black', 'credit', L3('Чёрная карта', 'Чорна картка', 'Black card'), 0, 30, {}, ['#3a3d48', '#0b0c0f', '#e8e8ee']),
    C('white', 'white', L3('Белая карта', 'Біла картка', 'White card'), 0, 30, {}, ['#f4f4f6', '#cfd2da', '#111']),
    C('virtual', 'virtual', L3('Виртуальная', 'Віртуальна', 'Virtual'), 0, 0, {}, ['#6c76e6', '#2a2f9e', '#fff']),
    C('platinum', 'premium', L3('Platinum', 'Platinum', 'Platinum'), 400, 60, { score: 650, level: 5 }, ['#d9dce3', '#8e94a3', '#111']),
    C('iron', 'metal', L3('Iron', 'Iron', 'Iron'), 4000, 120, { score: 720, level: 12, money: 15000 }, ['#6b6f78', '#111216', '#f2f2f2']),
    C('fop', 'business', L3('Карта ФОП', 'Картка ФОП', 'Sole trader card'), 0, 45, { regime: true }, ['#ffd84d', '#e0a800', '#111']),
    C('student', 'student', L3('Студенческая', 'Студентська', 'Student'), 0, 30, { maxLevel: 6 }, ['#7cf2c4', '#22a37a', '#05261b']),
  ],
  tbank: [
    C('black', 'debit', L3('Black', 'Black', 'Black'), 0, 30, {}, ['#2b2b2b', '#000', '#fff']),
    C('platinum', 'credit', L3('Platinum', 'Platinum', 'Platinum'), 0, 45, { score: 600, level: 2 }, ['#e7e9ee', '#a9aebb', '#111']),
    C('drive', 'drive', L3('Drive', 'Drive', 'Drive'), 99, 45, { level: 3 }, ['#ff7a00', '#c43d00', '#fff']),
    C('airlines', 'travel', L3('All Airlines', 'All Airlines', 'All Airlines'), 199, 60, { level: 4 }, ['#2b7cff', '#0b3aa8', '#fff']),
    C('virtual', 'virtual', L3('Виртуальная', 'Віртуальна', 'Virtual'), 0, 0, {}, ['#ffdd2d', '#f2b705', '#333']),
    C('premium', 'metal', L3('Premium', 'Premium', 'Premium'), 2500, 90, { score: 720, level: 10, money: 10000 }, ['#3a3a3a', '#0b0b0b', '#ffdd2d']),
    C('biz', 'business', L3('Бизнес', 'Бізнес', 'Business'), 0, 60, { regime: true }, ['#ffdd2d', '#e6b800', '#333']),
  ],
  kaspi: [
    C('gold', 'debit', L3('Gold', 'Gold', 'Gold'), 0, 30, {}, ['#f2c94c', '#c79a1d', '#3a2a08']),
    C('red', 'shop', L3('Red (рассрочка)', 'Red (розстрочка)', 'Red (instalments)'), 0, 30, { level: 2 }, ['#f14635', '#a81c10', '#fff']),
    C('credit', 'credit', L3('Кредитная', 'Кредитна', 'Credit'), 0, 45, { score: 620, level: 3 }, ['#ff7a6b', '#c92a1c', '#fff']),
    C('travel', 'travel', L3('Travel', 'Travel', 'Travel'), 120, 60, { level: 4 }, ['#2fa6d8', '#0d4f8a', '#fff']),
    C('biz', 'business', L3('Kaspi Pay Бизнес', 'Kaspi Pay Бізнес', 'Kaspi Pay Business'), 0, 60, { regime: true }, ['#f14635', '#5a0c06', '#fff']),
  ],
  alipey: [
    C('debit', 'debit', L3('Дебетовая UnionPay', 'Дебетова UnionPay', 'UnionPay Debit'), 0, 30, {}, ['#1677ff', '#0b4fc2', '#fff']),
    C('virtual', 'virtual', L3('Виртуальная', 'Віртуальна', 'Virtual'), 0, 0, {}, ['#36c', '#0b3aa8', '#fff']),
    C('huabei', 'credit', L3('Хуабэй (кредит)', 'Хуабей (кредит)', 'Huabei credit'), 0, 0, { score: 600, level: 2 }, ['#27c0ff', '#0072d6', '#fff']),
    C('shop', 'shop', L3('ТаоBuy Cashback', 'ТаоBuy Cashback', 'TaoBuy Cashback'), 50, 45, { level: 3 }, ['#ff5000', '#c23d00', '#fff']),
    C('platinum', 'premium', L3('Platinum', 'Platinum', 'Platinum'), 350, 60, { score: 680, level: 7 }, ['#d9dce3', '#7d8494', '#111']),
    C('biz', 'business', L3('Бизнес', 'Бізнес', 'Business'), 0, 60, { regime: true }, ['#1677ff', '#002e7a', '#fff']),
  ],
  n27: [
    C('standard', 'debit', L3('Standard', 'Standard', 'Standard'), 0, 30, {}, ['#36a18b', '#1f6f5f', '#fff']),
    C('smart', 'white', L3('Smart', 'Smart', 'Smart'), 60, 45, { level: 2 }, ['#ffb8c6', '#e8879c', '#111']),
    C('you', 'travel', L3('You', 'You', 'You'), 120, 45, { level: 4 }, ['#2fa6d8', '#0d4f8a', '#fff']),
    C('metal', 'metal', L3('Metal', 'Metal', 'Metal'), 2500, 90, { score: 720, level: 10, money: 8000 }, ['#4a4d55', '#0c0d10', '#e6e6e6']),
    C('biz', 'business', L3('Business', 'Business', 'Business'), 0, 45, { regime: true }, ['#111', '#36a18b', '#fff']),
  ],
  monzi: [
    C('coral', 'debit', L3('Hot Coral', 'Hot Coral', 'Hot Coral'), 0, 30, {}, ['#ff7a6b', '#e2382b', '#fff']),
    C('flex', 'credit', L3('Monzi Flex', 'Monzi Flex', 'Monzi Flex'), 0, 0, { score: 600, level: 2 }, ['#14233c', '#091424', '#ff7a6b']),
    C('perks', 'premium', L3('Perks', 'Perks', 'Perks'), 300, 60, { score: 650, level: 5 }, ['#7a5cff', '#3b1fb0', '#fff']),
    C('max', 'metal', L3('Max (металл)', 'Max (метал)', 'Max (metal)'), 3000, 90, { score: 720, level: 11, money: 9000 }, ['#4a4d55', '#0c0d10', '#ff7a6b']),
    C('biz', 'business', L3('Monzi Business', 'Monzi Business', 'Monzi Business'), 0, 45, { regime: true }, ['#14233c', '#2b4a7a', '#fff']),
  ],
  chaze: [
    C('checking', 'debit', L3('Total Checking', 'Total Checking', 'Total Checking'), 0, 30, {}, ['#117aca', '#0b4f86', '#fff']),
    C('freedom', 'credit', L3('Freedom Unlimited', 'Freedom Unlimited', 'Freedom Unlimited'), 0, 45, { score: 640, level: 3 }, ['#5aa9e6', '#1d5fa8', '#fff']),
    C('sapphire', 'travel', L3('Sapphire Preferred', 'Sapphire Preferred', 'Sapphire Preferred'), 95, 60, { score: 680, level: 5 }, ['#1b3a6b', '#0a1a33', '#cfe0ff']),
    C('reserve', 'metal', L3('Sapphire Reserve', 'Sapphire Reserve', 'Sapphire Reserve'), 550, 90, { score: 740, level: 11, money: 12000 }, ['#2a3245', '#0a0d14', '#e6eaf5']),
    C('amazin', 'shop', L3('Amazin Prime Visa', 'Amazin Prime Visa', 'Amazin Prime Visa'), 0, 45, { score: 620, level: 3 }, ['#232f3e', '#0d1117', '#ff9900']),
    C('ink', 'business', L3('Ink Business', 'Ink Business', 'Ink Business'), 0, 60, { regime: true }, ['#111', '#3a3a3a', '#fff']),
  ],
  mbanko: GENERIC('mBanko', [['#e3001b', '#a80014', '#fff'], ['#2b2b2b', '#e3001b', '#fff'], ['#111', '#555', '#fff']]),
  boursa: GENERIC('Boursa+', [['#d6006e', '#9e0051', '#fff'], ['#2b0a1d', '#d6006e', '#fff'], ['#111', '#555', '#fff']]),
  finecco: GENERIC('Finecco', [['#004b8d', '#00305c', '#fff'], ['#0a1a33', '#004b8d', '#fff'], ['#111', '#555', '#fff']]),
  mufj: GENERIC('MUFJ', [['#d6000f', '#8f000a', '#fff'], ['#f4f4f4', '#cfcfcf', '#d6000f'], ['#111', '#555', '#fff']]),
  emirat: GENERIC('Emirat', [['#0b2e59', '#061b36', '#d4af37'], ['#d4af37', '#8f7019', '#061b36'], ['#111', '#555', '#fff']]),
  ziraatt: GENERIC('Ziraatt', [['#e30a17', '#8f050d', '#fff'], ['#2b2b2b', '#e30a17', '#fff'], ['#111', '#555', '#fff']]),
  tbs: GENERIC('TBS', [['#00aeef', '#0067a3', '#fff'], ['#0b2a3a', '#00aeef', '#fff'], ['#111', '#555', '#fff']]),
  kbang: GENERIC('K‑Bang', [['#138f2d', '#0a5a1b', '#fff'], ['#0b2a14', '#138f2d', '#fff'], ['#111', '#555', '#fff']]),
  belarus: GENERIC('Беларусик', [['#00a650', '#006b33', '#fff'], ['#0b2a14', '#00a650', '#fff'], ['#111', '#555', '#fff']]),
};
// the card everyone gets when opening an account
const FIRST = (bank) => BANK_CARDS[bank]?.[0];
const B = () => G.s.bank;
const findCard = (bank, id) => BANK_CARDS[bank]?.find((c) => c.id === id);
// older saves had one card id: basic / premium / black
export function ensureCards(bank) {
  const b = B();
  if (!b.cards) {
    b.cards = [{ bank, id: FIRST(bank).id, at: G.s.t, pan: panFor(bank, FIRST(bank).id) }];
    const extra = b.card === 'premium' ? BANK_CARDS[bank].find((c) => c.kind === 'premium') : b.card === 'black' ? BANK_CARDS[bank].find((c) => c.kind === 'metal') : null;
    if (extra) b.cards.push({ bank, id: extra.id, at: G.s.t, pan: panFor(bank, extra.id) });
    b.primary = `${bank}:${(extra || FIRST(bank)).id}`;
  }
  b.cardOrders ||= [];
  if (!b.cards.some((c) => c.bank === bank)) b.cards.push({ bank, id: FIRST(bank).id, at: G.s.t, pan: panFor(bank, FIRST(bank).id) });
  if (!b.primary || !ownedCard(b.primary)) b.primary = `${b.cards[0].bank}:${b.cards[0].id}`;
}
function panFor(bank, id) { let h = 7; for (const ch of `${G.s.id}|${bank}|${id}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return String(h % 10000).padStart(4, '0'); }
export const ownedCard = (key) => { const [bank, id] = key.split(':'); return (B().cards || []).find((c) => c.bank === bank && c.id === id) || null; };
export const cardDef = (c) => findCard(c.bank, c.id);
export const ownedCards = () => (B().cards || []).map((c) => ({ ...c, def: findCard(c.bank, c.id), key: `${c.bank}:${c.id}` })).filter((c) => c.def);
export const primaryCard = () => { const k = B().primary; return ownedCards().find((c) => c.key === k) || ownedCards()[0]; };
export const isOwned = (bank, id) => (B().cards || []).some((c) => c.bank === bank && c.id === id);
export const isOrdered = (bank, id) => (B().cardOrders || []).some((o) => o.bank === bank && o.id === id);
export const perksOf = (def) => KIND[def.kind] || {};
// no cashback on bank fees, loans, savings, taxes, fines, transfers to scammers...
const NO_CB = new Set(['p2p', 'bank', 'loan', 'deposit', 'tax', 'fine', 'customs', 'scam', 'theft', 'refund', 'gov', 'casino', 'stock', 'realty', 'numbers']);
// what all your cards give together (the best of each perk)
export function cardEffects() {
  const cbs = {};
  let limit = 1, travel = 0;
  for (const c of ownedCards()) {
    const p = perksOf(c.def);
    limit = Math.max(limit, p.limit || 1);
    travel = Math.max(travel, p.travel || 0);
    for (const [k, v] of Object.entries(p.cb || {})) cbs[k] = Math.max(cbs[k] || 0, v);
  }
  return { limit, travel, cb: (kind) => (NO_CB.has(kind) ? 0 : Math.max(cbs[kind] || 0, cbs.all || 0)), cbs };
}
export function perkText(def) {
  const p = perksOf(def);
  const out = [];
  const CAT = { all: T('на всё', 'на все', 'on everything'), food: T('на еду', 'на їжу', 'on food'), travel: T('на транспорт', 'на транспорт', 'on transport'), repair: T('на ремонт', 'на ремонт', 'on repairs'), buy: T('на покупки', 'на покупки', 'on purchases'), biz: T('на бизнес', 'на бізнес', 'on business'), rent: T('на аренду', 'на оренду', 'on rent'), service: T('на услуги', 'на послуги', 'on services'), apps: T('на подписки', 'на підписки', 'on subscriptions') };
  for (const [k, v] of Object.entries(p.cb || {})) out.push(`${T('кэшбэк', 'кешбек', 'cashback')} ${+(v * 100).toFixed(1)}% ${CAT[k] || k}`);
  if (p.limit > 1) out.push(T(`кредитный лимит +${Math.round((p.limit - 1) * 100)}%`, `кредитний ліміт +${Math.round((p.limit - 1) * 100)}%`, `credit limit +${Math.round((p.limit - 1) * 100)}%`));
  if (p.travel) out.push(T(`билеты −${Math.round(p.travel * 100)}%`, `квитки −${Math.round(p.travel * 100)}%`, `tickets −${Math.round(p.travel * 100)}%`));
  return out;
}
// can I get this card? every requirement with a tick or the reason why not
export function cardCheck(def) {
  const s = G.s, r = def.req || {};
  const rows = [];
  if (r.level) rows.push({ ok: s.level >= r.level, t: T(`Уровень ${r.level}+`, `Рівень ${r.level}+`, `Level ${r.level}+`) });
  if (r.maxLevel) rows.push({ ok: s.level <= r.maxLevel, t: T(`Только для новичков (до ${r.maxLevel} ур.)`, `Лише для новачків (до ${r.maxLevel} рів.)`, `Newcomers only (up to level ${r.maxLevel})`) });
  if (r.score) rows.push({ ok: s.bank.credit >= r.score, t: T(`Кредитный рейтинг ${r.score}+`, `Кредитний рейтинг ${r.score}+`, `Credit score ${r.score}+`) });
  if (r.money) rows.push({ ok: s.money >= r.money, t: T(`На счёте от ${fmt(r.money)}`, `На рахунку від ${fmt(r.money)}`, `At least ${fmt(r.money)} on the account`), money: r.money });
  if (r.regime) rows.push({ ok: s.tax.regime === 'ip' || s.tax.regime === 'company', t: T('Зарегистрирован ИП или компания (Госуслуги)', 'Зареєстровано ФОП або компанію (Держпослуги)', 'Registered sole trader or company (Gov app)') });
  if ((s.tax?.debt || 0) > 0) rows.push({ ok: false, t: T('Нет налоговых долгов', 'Немає податкових боргів', 'No tax debt') });
  if (def.kind === 'credit' || def.kind === 'metal') rows.push({ ok: !s.bank.loans.some((l) => l.due < s.t), t: T('Нет просроченных кредитов', 'Немає прострочених кредитів', 'No overdue loans') });
  return { ok: rows.every((x) => x.ok), rows };
}
export function orderCard(bank, id) {
  const def = findCard(bank, id);
  if (!def || isOwned(bank, id) || isOrdered(bank, id)) return { ok: false };
  if (!cardCheck(def).ok) return { ok: false, msg: T('Не выполнены условия', 'Не виконано умови', 'Requirements not met') };
  if (def.price && !spend(def.price, 'bank', T(`Выпуск карты ${L(def.n)}`, `Випуск картки ${L(def.n)}`, `Card issue: ${L(def.n)}`))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  if (!def.eta) { B().cards.push({ bank, id, at: G.s.t, pan: panFor(bank, id) }); emit('bank'); return { ok: true, now: true }; }
  B().cardOrders.push({ bank, id, at: G.s.t, eta: G.s.t + def.eta });
  emit('bank');
  return { ok: true, eta: G.s.t + def.eta };
}
export function setPrimary(key) { if (ownedCard(key)) { B().primary = key; emit('bank'); } }
export function closeCard(key) {
  const b = B();
  if (b.cards.length <= 1) return false;
  b.cards = b.cards.filter((c) => `${c.bank}:${c.id}` !== key);
  if (b.primary === key) b.primary = `${b.cards[0].bank}:${b.cards[0].id}`;
  emit('bank'); return true;
}
// courier delivers ordered plastic
export function cardsTick() {
  const b = B();
  if (!b?.cardOrders?.length) return;
  for (const o of b.cardOrders.filter((x) => x.eta <= G.s.t)) {
    b.cards.push({ bank: o.bank, id: o.id, at: G.s.t, pan: panFor(o.bank, o.id) });
    const def = findCard(o.bank, o.id);
    notify('bank', T('Карта доставлена', 'Картку доставлено', 'Card delivered'), T(`Курьер привёз карту «${L(def.n)}». Она уже активна.`, `Курʼєр привіз картку «${L(def.n)}». Вона вже активна.`, `The courier brought your “${L(def.n)}” card. It’s active.`));
  }
  b.cardOrders = b.cardOrders.filter((x) => x.eta > G.s.t);
  emit('bank');
}
// cashback for yesterday's spending, paid once a day
export function payCashback() {
  const s = G.s, b = B();
  if (!b?.cards) return 0;
  const from = b.cbFrom ?? s.t - 1440;
  const ef = cardEffects();
  let sum = 0;
  for (const x of b.hist) { if (x.t < from || x.t > s.t || x.amt >= 0) continue; sum += -x.amt * ef.cb(x.kind); }
  b.cbFrom = s.t;
  sum = clamp(sum, 0, 5000);
  if (sum >= 0.01) earn(sum, 'bonus', T('Кэшбэк по картам', 'Кешбек за картками', 'Card cashback'));
  b.cbTotal = (b.cbTotal || 0) + sum;
  return sum;
}
// cashback earned since the last payout (shown in the app)
export function pendingCashback() {
  const s = G.s, b = B();
  if (!b?.cards) return 0;
  const from = b.cbFrom ?? s.t - 1440;
  const ef = cardEffects();
  let sum = 0;
  for (const x of b.hist) { if (x.t < from || x.amt >= 0) continue; sum += -x.amt * ef.cb(x.kind); }
  return sum;
}
