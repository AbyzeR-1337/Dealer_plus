// Bank (loans, deposits, credit rating, cards), stock exchange and collectible phone numbers / plates.
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { uid, clamp, chance, rnd, rint, pickR } from '../core/util.js';
import { RNG, hashStr } from '../core/rng.js';
import { countryOf, COUNTRY } from '../data/world.js';
import { earn, spend, charge, stat, addXP, notify, log, upLevel } from './player.js';
import { fmt, nicePrice } from '../core/money.js';
import { day, brandMult } from './economy.js';
import { makePlate } from './items.js';

// ---------------------------------------------------------------- credit
export function creditInfo() {
  const r = G.s.bank.credit;
  const lvl = G.s.level;
  const tier = r >= 760 ? 0 : r >= 680 ? 1 : r >= 600 ? 2 : r >= 520 ? 3 : 4;
  const names = [['Отличный', 'Відмінний', 'Excellent'], ['Хороший', 'Добрий', 'Good'], ['Средний', 'Середній', 'Fair'], ['Плохой', 'Поганий', 'Poor'], ['Очень плохой', 'Дуже поганий', 'Very poor']];
  const mult = [0.7, 0.85, 1, 1.3, 1.8][tier];
  const company = G.s.tax.regime === 'company' ? 3 : G.s.tax.regime === 'ip' ? 1.6 : 1;
  const card = G.s.bank.card === 'premium' ? 1.25 : G.s.bank.card === 'black' ? 1.6 : 1;
  const limit = Math.max(0, Math.round(Math.pow(Math.max(0, r - 450), 2) * 0.05 * (1 + lvl * 0.35) * company * card));
  return { r, tier, name: L(names[tier]), mult, limit };
}
export const LOAN_TERMS = [
  { days: 1, rate: 0.06 }, { days: 3, rate: 0.14 }, { days: 7, rate: 0.26 }, { days: 30, rate: 0.75 },
];
export const loanTotal = () => G.s.bank.loans.reduce((a, l) => a + l.left, 0);
export function takeLoan(amount, termIdx) {
  const s = G.s;
  const ci = creditInfo();
  if (amount <= 0 || amount + loanTotal() > ci.limit) return { ok: false, msg: T('Превышен лимит', 'Перевищено ліміт', 'Over your limit') };
  if (s.tax.debt > 0) return { ok: false, msg: T('Сначала погасите налоговый долг', 'Спочатку погасіть податковий борг', 'Pay off your tax debt first') };
  const term = LOAN_TERMS[termIdx];
  const total = amount * (1 + term.rate * ci.mult);
  s.bank.loans.push({ id: uid('ln'), amt: amount, left: total, due: s.t + term.days * 1440, at: s.t });
  earn(amount, 'loan', T('Кредит', 'Кредит', 'Loan'));
  stat('loans');
  emit('bank');
  return { ok: true, total };
}
export function repayLoan(id, amount) {
  const s = G.s;
  const l = s.bank.loans.find((x) => x.id === id);
  if (!l) return false;
  amount = Math.min(amount ?? l.left, l.left, s.money);
  if (amount <= 0) return false;
  spend(amount, 'loan', T('Погашение кредита', 'Погашення кредиту', 'Loan repayment'));
  l.left -= amount;
  if (l.left <= 0.01) {
    s.bank.loans = s.bank.loans.filter((x) => x !== l);
    const early = s.t < l.due;
    s.bank.credit = clamp(s.bank.credit + (early ? 18 : 10), 300, 850);
    s.bank.creditLog.unshift({ t: s.t, d: early ? 18 : 10, why: 'repaid' });
  }
  emit('bank');
  return true;
}
export function bankTick() {
  const s = G.s;
  for (const l of s.bank.loans) {
    if (l.due > s.t || l.overdueHandled === day()) continue;
    // auto-debit at due date, penalty if not enough
    l.overdueHandled = day();
    if (s.money >= l.left) { repayLoan(l.id, l.left); notify('bank', T('Автосписание', 'Автосписання', 'Auto‑debit'), T('Кредит погашен автоматически', 'Кредит погашено автоматично', 'Loan repaid automatically')); }
    else {
      const pay = Math.max(0, s.money);
      if (pay > 0) repayLoan(l.id, pay);
      const pen = l.left * 0.1;
      l.left += pen;
      l.due = s.t + 1440;
      s.bank.credit = clamp(s.bank.credit - 45, 300, 850);
      s.bank.creditLog.unshift({ t: s.t, d: -45, why: 'late' });
      notify('bank', T('Просрочка по кредиту', 'Прострочка кредиту', 'Loan overdue'), T(`Штраф ${fmt(pen)}, рейтинг −45`, `Штраф ${fmt(pen)}, рейтинг −45`, `Penalty ${fmt(pen)}, rating −45`));
    }
  }
}
export function dailyBank() {
  const s = G.s;
  for (const d of s.bank.deposits) { const i = d.amt * 0.0025; d.amt += i; d.earned = (d.earned || 0) + i; }
  if (s.money > 0 && !s.bank.loans.some((l) => l.due < s.t)) s.bank.credit = clamp(s.bank.credit + 1, 300, 850);
}
export function deposit(amount) { if (!spend(amount, 'deposit', T('Вклад', 'Вклад', 'Deposit'))) return false; G.s.bank.deposits.push({ id: uid('dp'), amt: amount, at: G.s.t, earned: 0 }); emit('bank'); return true; }
export function withdraw(id) { const s = G.s; const d = s.bank.deposits.find((x) => x.id === id); if (!d) return; s.bank.deposits = s.bank.deposits.filter((x) => x !== d); earn(d.amt, 'deposit', T('Снятие вклада', 'Зняття вкладу', 'Deposit withdrawal')); emit('bank'); }
export const CARDS = [
  { id: 'basic', n: ['Дебетовая', 'Дебетова', 'Debit'], price: 0, d: ['Обычная карта.', 'Звичайна картка.', 'A regular card.'], grad: ['#1f9a6a', '#0d5c40'] },
  { id: 'premium', n: ['Премиум', 'Преміум', 'Premium'], price: 400, d: ['Лимит кредита +25%, кэшбэк 1% на покупки.', 'Ліміт кредиту +25%, кешбек 1%.', 'Credit limit +25%, 1% cashback.'], grad: ['#2b3a67', '#121a33'] },
  { id: 'black', n: ['Black', 'Black', 'Black'], price: 4000, d: ['Лимит +60%, билеты −20%, кэшбэк 2%.', 'Ліміт +60%, квитки −20%, кешбек 2%.', 'Limit +60%, tickets −20%, 2% cashback.'], grad: ['#2a2a2a', '#000000'] },
];
export function buyCard(id) {
  const c = CARDS.find((x) => x.id === id);
  if (!spend(c.price, 'bank', L(c.n))) return false;
  G.s.bank.card = id; emit('bank'); return true;
}
export const cashback = () => (G.s.bank.card === 'premium' ? 0.01 : G.s.bank.card === 'black' ? 0.02 : 0);

// ---------------------------------------------------------------- stocks
export const TICKERS = [
  { tk: 'PEAR', n: 'Pear Inc.', p: 210, vol: 0.012, brand: 'Pear' },
  { tk: 'SMSG', n: 'Samsong Electronics', p: 58, vol: 0.014, brand: 'Samsong' },
  { tk: 'XMO', n: 'Xiaomo Corp', p: 4.2, vol: 0.022, brand: 'Xiaomo' },
  { tk: 'NIKY', n: 'Nikey Inc.', p: 76, vol: 0.013, brand: 'Nikey' },
  { tk: 'ADBS', n: 'Adibas AG', p: 215, vol: 0.013, brand: 'Adibas' },
  { tk: 'LUVH', n: 'LuVH Luxury Group', p: 640, vol: 0.011, brand: 'Louis Vuittan' },
  { tk: 'RLX', n: 'Rolecks Holding', p: 980, vol: 0.008, brand: 'Rolecks' },
  { tk: 'SNNY', n: 'Sonny Group', p: 19, vol: 0.016, brand: 'Sonny' },
  { tk: 'NTND', n: 'Nintendu Co.', p: 54, vol: 0.015, brand: 'Nintendu' },
  { tk: 'NVDO', n: 'Nvidio Corp', p: 128, vol: 0.026, brand: 'Nvidio' },
  { tk: 'TSLR', n: 'Tesler Motors', p: 250, vol: 0.03, brand: 'Tesler' },
  { tk: 'TOYD', n: 'Toyoda Motor', p: 180, vol: 0.01, brand: 'Toyoda' },
  { tk: 'LEGG', n: 'LEGGO Group', p: 95, vol: 0.009, brand: 'LEGGO' },
  { tk: 'POPM', n: 'Pop Marte Intl', p: 12, vol: 0.04, brand: 'Pop Marte' },
  { tk: 'GOLD', n: ['Золото (унция)', 'Золото (унція)', 'Gold (oz)'], p: 2650, vol: 0.006, brand: null },
  { tk: 'BTK', n: 'Bitkoin', p: 68000, vol: 0.035, brand: null },
];
export function initStocks() {
  const s = G.s;
  for (const t of TICKERS) {
    if (!s.stocks.px[t.tk]) {
      s.stocks.px[t.tk] = t.p;
      const rng = new RNG(s.id + t.tk);
      const h = []; let p = t.p;
      for (let i = 0; i < 48; i++) { p *= 1 + rng.gauss() * t.vol; h.push(+p.toFixed(4)); }
      s.stocks.hist[t.tk] = h; s.stocks.px[t.tk] = p;
    }
  }
}
export function stocksTick() {
  const s = G.s;
  const rng = new RNG(`${s.id}:stk:${s.t}`);
  for (const t of TICKERS) {
    let p = s.stocks.px[t.tk];
    const ev = t.brand ? brandMult(t.brand) : 1;
    const drift = 0.0004 + (ev - 1) * 0.02;
    p *= 1 + rng.gauss() * t.vol + drift;
    if (rng.chance(0.004)) p *= rng.chance(0.5) ? 1.12 : 0.88;
    p = Math.max(t.p * 0.15, p);
    s.stocks.px[t.tk] = p;
    const h = s.stocks.hist[t.tk]; h.push(+p.toFixed(4)); if (h.length > 72) h.shift();
  }
  emit('stocks');
}
export function buyStock(tk, qty) {
  const s = G.s;
  const cost = s.stocks.px[tk] * qty * 1.0025;
  if (qty <= 0 || !spend(cost, 'stock', tk)) return false;
  const have = s.stocks.hold[tk] || 0;
  s.stocks.avg[tk] = ((s.stocks.avg[tk] || 0) * have + s.stocks.px[tk] * qty) / (have + qty);
  s.stocks.hold[tk] = have + qty;
  stat('trades'); emit('stocks');
  return true;
}
export function sellStock(tk, qty) {
  const s = G.s;
  const have = s.stocks.hold[tk] || 0;
  qty = Math.min(qty, have);
  if (qty <= 0) return false;
  const got = s.stocks.px[tk] * qty * 0.9975;
  const profit = (s.stocks.px[tk] - (s.stocks.avg[tk] || 0)) * qty;
  earn(got - Math.max(0, profit), 'stocksale', tk);
  if (profit > 0) earn(profit, 'stock', tk);
  s.stocks.hold[tk] = have - qty;
  if (!s.stocks.hold[tk]) { delete s.stocks.hold[tk]; delete s.stocks.avg[tk]; }
  stat('trades'); emit('stocks');
  return true;
}

// ---------------------------------------------------------------- beautiful numbers & plates
function numberScore(digits) {
  let sc = 0;
  const runs = digits.match(/(\d)\1+/g) || [];
  for (const r of runs) sc += Math.pow(r.length, 2.4);
  if (/(\d{2,})\1/.test(digits)) sc += 6;
  const rev = digits.split('').reverse().join('');
  if (rev === digits) sc += 14;
  for (let i = 0; i < digits.length - 3; i++) {
    const a = +digits[i], b = +digits[i + 1], c = +digits[i + 2], d = +digits[i + 3];
    if (b === a + 1 && c === b + 1 && d === c + 1) sc += 6;
  }
  if (/777|000|999|888|666/.test(digits)) sc += 8;
  if (/^(\d)\1+$/.test(digits)) sc += 60;
  return sc;
}
export function genNumber(rng, kind, country) {
  const C = COUNTRY[country];
  let label, digits;
  if (kind === 'phone') {
    const fancy = rng.chance(0.55);
    const d = () => rng.int(0, 9);
    let tail;
    if (fancy) {
      const a = d(), b = d();
      tail = rng.pick([`${a}${a}${a}${a}${a}${a}${a}`, `${a}${b}${b}${b}${b}${b}${b}`, `${a}${a}${a}${b}${b}${b}${b}`, `${a}${b}${a}${b}${a}${b}${a}`, `1234567`, `${a}${a}${b}${b}${a}${a}${b}`, `${d()}${d()}${d()}${a}${a}${a}${a}`, `${d()}${d()}${d()}0000`, `${d()}${d()}${d()}7777`]);
    } else tail = Array.from({ length: 7 }, d).join('');
    const op = rng.pick(['900', '999', '777', '916', '926', '950', '985', '67', '50', '93', '63']);
    digits = op + tail;
    label = `${C.phone} (${op}) ${tail.slice(0, 3)}‑${tail.slice(3, 5)}‑${tail.slice(5)}`;
  } else {
    label = makePlate(rng, country);
    if (rng.chance(0.5)) {
      const a = rng.int(0, 9);
      label = label.replace(/\d{3,4}/, (m) => String(a).repeat(m.length));
    }
    digits = label.replace(/\D/g, '');
    const letters = label.replace(/[^A-ZА-Я]/g, '');
    if (/^(.)\1+$/.test(letters) && letters.length > 1) digits += '0000';
  }
  const sc = numberScore(digits);
  const base = kind === 'phone' ? 4 : 30;
  const value = Math.round(base + Math.pow(sc, 1.55) * (kind === 'phone' ? 2.2 : 9));
  return { id: uid('n'), kind, label, value, country };
}
export function numbersMarket() {
  const s = G.s;
  const cid = countryOf(s.player.city).id;
  if (s.numbers.refreshAt <= s.t || s.numbers.country !== cid) {
    const rng = new RNG(`${s.id}:num:${s.t}`);
    s.numbers.market = [];
    for (let i = 0; i < 14; i++) {
      const n = genNumber(rng, rng.chance(0.55) ? 'phone' : 'plate', cid);
      n.price = nicePrice(n.value * rng.float(0.75, 1.35), countryOf(s.player.city).cur);
      s.numbers.market.push(n);
    }
    s.numbers.refreshAt = s.t + 600; s.numbers.country = cid;
  }
  return s.numbers.market;
}
export function buyNumber(n) {
  const s = G.s;
  if (!spend(n.price, 'numbers', n.label)) return false;
  s.numbers.market = s.numbers.market.filter((x) => x !== n);
  s.numbers.owned.push({ ...n, paid: n.price });
  stat('numbers'); addXP(5);
  return true;
}
export function listNumber(n, price) { n.ask = price; n.listedAt = G.s.t; emit('numbers'); }
export function numbersTick() {
  const s = G.s;
  for (const n of [...s.numbers.owned]) {
    if (!n.ask) continue;
    const p = clamp(Math.pow(n.value / n.ask, 3) / 120, 0.0005, 0.06);
    if (chance(p)) {
      s.numbers.owned = s.numbers.owned.filter((x) => x !== n);
      earn(n.ask, 'sale', n.label);
      const profit = n.ask - (n.paid || 0);
      if (profit > 0) s.tax.income += profit;
      stat('numbersSold'); addXP(8);
      notify('numbers', T('Номер продан', 'Номер продано', 'Number sold'), `${n.label} — ${fmt(n.ask)}`);
    }
  }
}
