// Money apps: Bank, Gov services (taxes), Stock exchange, Numbers & plates, Casino.
import { G, emit } from '../core/state.js';
import { T, L, dur, fmtDate } from '../core/i18n.js';
import { esc, clamp, rnd } from '../core/util.js';
import { fmt, rate, curCode, nicePrice, fmtNum, symOf } from '../core/money.js';
import { CURRENCIES, countryOf } from '../data/world.js';
import { icon } from '../ui/icons.js';
import { go, rerender, toast, askPrice, confirmBox, choose, sheet, resolveSheet, ago, gameDate, UI, openApp } from '../ui/shell.js';
import { empty, bar, kv, sparkline } from '../ui/comp.js';
import { creditInfo, LOAN_TERMS, loanTotal, takeLoan, repayLoan, deposit, withdraw, CARDS, buyCard, TICKERS, buyStock, sellStock, numbersMarket, buyNumber, listNumber } from '../game/finance.js';
import { REGIMES, taxDue, taxRate, taxBase, payTax, register } from '../game/life.js';
import { earn, spend, stat, today, getStat } from '../game/player.js';
import { playMini } from '../mini/engine.js';
import { regName, regColors, region } from './common.js';
import { sfx } from '../ui/sfx.js';
import { orderCard, setPrimary, closeCard } from '../game/cards.js';
import { bankHome, bankRates, bankSkin, bankCredit, bankSave, bankMore, bankCards, bankSkins, bankQR, bankStatusBar, setBankSkin } from './bank_skins.js';
import { CG, slotsView, playSlots, rouletteView, playRoulette, blackjackView, bjDeal, bjHit, bjDouble, bjFinish, diceView, playDice } from './casino_games.js';

// ---------------------------------------------------------------- BANK (looks like the real bank app of the country; see bank_skins.js)
export const bankApp = {
  id: 'bank', glyph: 'card', lvl: 1,
  name: () => bankSkin().name, colors: () => { const k = bankSkin(); return k.tpl === 'mono' ? ['#3a3fc0', '#14166a'] : k.tpl === 'tbank' ? ['#ffdd2d', '#e6b800'] : [k.c, k.c2 || k.c]; }, glyphColor: '#fff',
  title: () => bankSkin().name,
  bare: true,
  statusBar: (v) => bankStatusBar(v),
  views: { main: bankHome, credit: bankCredit, save: bankSave, more: bankMore, cards: bankCards, rates: bankRates, skins: bankSkins, qr: bankQR },
  actions: {
    corder: async (v) => {
      const [bank, id] = v.split(':');
      const r = orderCard(bank, id);
      if (!r.ok) { toast(r.msg || T('Нельзя оформить', 'Не можна оформити', 'Can’t order'), 'r'); return; }
      sfx('ok'); toast(r.now ? T('Виртуальная карта уже в приложении', 'Віртуальна картка вже в застосунку', 'Your virtual card is ready') : T('Карта выпущена — курьер уже едет', 'Картку випущено — курʼєр уже їде', 'Card issued — a courier is on the way'), 'g'); rerender();
    },
    cmain: (key) => { setPrimary(key); sfx('ok'); rerender(); },
    cclose: async (key) => { if (await confirmBox(T('Закрыть карту?', 'Закрити картку?', 'Close the card?'), T('Бонусы этой карты перестанут действовать.', 'Бонуси цієї картки перестануть діяти.', 'Its perks will stop working.'), T('Закрыть', 'Закрити', 'Close'), undefined, true)) { closeCard(key); rerender(); } },
    bskin: (id) => { setBankSkin(id); sfx('ok'); toast(T('Оформление изменено', 'Оформлення змінено', 'Skin changed'), 'g'); rerender(); },
    bhide: () => { G.s.bank.hideBal = !G.s.bank.hideBal; rerender(); },
    bqr: () => { const w = document.querySelector('#appwin'); void w; go('qr'); },
    bother: async () => {
      const v = await choose(T('Другие платежи', 'Інші платежі', 'Other payments'), [{ v: 'gov', label: '🏛 ' + T('Налоги', 'Податки', 'Taxes') }, { v: 'credit', label: '💳 ' + T('Погасить кредит', 'Погасити кредит', 'Repay a loan') }, { v: 'rates', label: '💱 ' + T('Обмен валют', 'Обмін валют', 'Currency exchange') }, { v: 'cards', label: '✨ ' + T('Оформить карту', 'Оформити картку', 'Get a card') }]);
      if (!v) return;
      if (v === 'gov') openApp('gov'); else go(v);
    },
    loan: async () => {
      const ci = creditInfo();
      const left = ci.limit - loanTotal();
      const amt = await askPrice({ title: T('Сумма кредита', 'Сума кредиту', 'Loan amount'), value: Math.min(left, Math.max(10, left / 2)), min: 1, max: left });
      if (!amt) return;
      const t = await choose(T('Срок', 'Термін', 'Term'), LOAN_TERMS.map((x, i) => ({ v: String(i), label: `${x.days} ${T('дн', 'дн', 'd')} · ${T('вернуть', 'повернути', 'repay')} ${fmt(amt * (1 + x.rate * ci.mult))}`, sub: `+${Math.round(x.rate * ci.mult * 100)}%` })));
      if (t == null) return;
      const r = takeLoan(amt, +t);
      toast(r.ok ? T('Деньги зачислены', 'Гроші зараховано', 'Funds received') : r.msg, r.ok ? 'g' : 'r'); if (r.ok) sfx('cash'); rerender();
    },
    repay: (id) => { if (repayLoan(id)) { sfx('ok'); toast(T('Платёж прошёл', 'Платіж пройшов', 'Payment done'), 'g'); } else toast(T('Недостаточно средств', 'Недостатньо коштів', 'Insufficient funds'), 'r'); rerender(); },
    dep: async () => { const v = await askPrice({ title: T('Сумма вклада', 'Сума вкладу', 'Deposit amount'), value: Math.max(1, G.s.money / 2), min: 1, max: Math.max(1, G.s.money) }); if (v && deposit(v)) { sfx('ok'); rerender(); } },
    wd: (id) => { withdraw(id); sfx('cash'); rerender(); },
    bview: (v) => go(v),
    card: async (id) => { const c = CARDS.find((x) => x.id === id); if (await confirmBox(L(c.n), `${esc(L(c.d))}<br>${fmt(c.price)}`, T('Оформить', 'Оформити', 'Get it'))) { if (buyCard(id)) { sfx('win'); toast(T('Карта оформлена', 'Картку оформлено', 'Card issued'), 'g'); } else toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r'); rerender(); } },
  },
};

// ---------------------------------------------------------------- GOV / TAXES
function govMain() {
  const s = G.s;
  const t = s.tax;
  const due = taxDue();
  const reg = REGIMES[t.regime];
  const earned = t.income;
  const after = earned - (t.regime === 'none' ? 0 : taxBase() + earned * taxRate());
  const paidOk = t.regime === 'none' || (due <= 0 && t.debt <= 0);
  return `<div class="hero"><div class="lbl">${T('Заработок сегодня', 'Заробіток сьогодні', 'Earned today')}</div><div class="big">${earned >= 0 ? '+' : ''}${fmt(earned)}</div><div class="pills"><span>${T('Продано', 'Продано', 'Sold')}: ${today('sold')}</span><span>${T('Выручка', 'Виручка', 'Revenue')}: ${fmt(today('revenue'))}</span><span>${T('После налога', 'Після податку', 'After tax')}: ${after >= 0 ? '+' : ''}${fmt(after)}</span></div></div>
    <div class="card ${paidOk ? 'hl' : 'warn'}"><div class="row"><div style="width:52px;height:52px;border-radius:14px;display:grid;place-items:center;background:${paidOk ? 'rgba(46,242,160,.12)' : 'rgba(255,84,104,.15)'};color:${paidOk ? 'var(--acc)' : 'var(--red)'};flex:none">${icon(paidOk ? 'check' : 'info')}</div><div class="grow"><h3>${t.regime === 'none' ? T('Вы не зарегистрированы', 'Ви не зареєстровані', 'Not registered') : paidOk ? T('Налог за сегодня оплачен', 'Податок за сьогодні сплачено', 'Today’s tax is paid') : T('Налог к оплате', 'Податок до сплати', 'Tax due')}</h3><div class="d">${t.regime === 'none' ? T('Торговля без регистрации рискованна: при больших доходах — проверка и штраф.', 'Торгівля без реєстрації ризикована.', 'Unregistered trading risks audits and fines.') : T('Если заработаете больше, налог вырастет', 'Якщо заробите більше, податок зросте', 'Earn more — the tax grows')}</div></div></div>
      ${t.regime !== 'none' ? `${kv(T('Базовый налог', 'Базовий податок', 'Base tax'), fmt(taxBase()))}${kv(`${T('С дохода', 'З доходу', 'On income')} ${fmt(earned)} (${Math.round(taxRate() * 100)}%)`, fmt(earned * taxRate()))}${kv(T('Уже оплачено', 'Вже сплачено', 'Already paid'), '−' + fmt(t.paid))}${t.debt ? kv(T('Долг с пенями', 'Борг із пенею', 'Debt + penalties'), fmt(t.debt), 'r') : ''}${kv(`<b>${T('К оплате сегодня', 'До сплати сьогодні', 'Due today')}</b>`, fmt(due + t.debt))}` : t.debt ? kv(T('Штраф', 'Штраф', 'Fine'), fmt(t.debt), 'r') : ''}
      ${due + t.debt > 0 ? `<button class="btn block mt" data-a="pay">${T('Оплатить', 'Сплатити', 'Pay')} ${fmt(due + t.debt)}</button>` : ''}
      ${t.regime !== 'none' ? `<label class="row mt small"><input type="checkbox" data-a="auto" ${s.settings.autoTax ? 'checked' : ''}> ${T('Автоплатёж в конце дня', 'Автоплатіж наприкінці дня', 'Auto‑pay at day end')}</label>` : ''}</div>
    <div class="card"><h3>${T('Сегодня', 'Сьогодні', 'Today')}</h3><div class="stats mt"><div class="stat"><small>${T('Продано вещей', 'Продано речей', 'Items sold')}</small><b>${today('sold')}</b></div><div class="stat"><small>${T('Выручка', 'Виручка', 'Revenue')}</small><b>${fmt(today('revenue'))}</b></div><div class="stat"><small>${T('Прибыль с продаж', 'Прибуток з продажів', 'Sales profit')}</small><b class="${today('profit') >= 0 ? 'g' : 'r'}">${today('profit') >= 0 ? '+' : ''}${fmt(today('profit'))}</b></div><div class="stat"><small>${T('Казино', 'Казино', 'Casino')}</small><b class="${today('casino') >= 0 ? 'g' : 'r'}">${today('casino') >= 0 ? '+' : ''}${fmt(today('casino'))}</b></div></div></div>
    <h3 class="sub">${T('Налоговый режим', 'Податковий режим', 'Tax regime')}</h3>
    ${Object.entries(REGIMES).map(([k, r]) => `<div class="card ${t.regime === k ? 'hl' : ''}"><div class="row between"><h3>${esc(L(r.n))}</h3>${t.regime === k ? `<span class="tag g">${T('текущий', 'поточний', 'current')}</span>` : k !== 'none' ? `<button class="btn xs" data-a="reg" data-v="${k}">${T('Оформить', 'Оформити', 'Register')} · ${fmt(r.reg * countryOf(s.player.city).wage)}</button>` : ''}</div><div class="d">${esc(L(r.d))}</div>${k !== 'none' ? `<div class="small m">${T('ставка', 'ставка', 'rate')} ${Math.round(r.rate * Math.max(0.06, countryOf(s.player.city).tax) * 100)}% · ${T('база', 'база', 'base')} ${fmt(r.base * countryOf(s.player.city).wage)}/${T('день', 'день', 'day')}</div>` : ''}</div>`).join('')}`;
}
export const govApp = {
  id: 'gov', glyph: 'bank', lvl: 1,
  name: () => regName('gov'), colors: () => regColors('gov'),
  right: () => `<span class="small">${esc(fmtDate(gameDate(), false))}</span>`,
  badge: () => (G.s.tax.debt > 0 || (G.s.tax.regime !== 'none' && taxDue() > 0 && G.s.t % 1440 > 1200) ? 1 : 0),
  views: { main: govMain },
  actions: {
    pay: () => { if (payTax()) { sfx('ok'); toast(T('Налог оплачен', 'Податок сплачено', 'Tax paid'), 'g'); } else toast(T('Недостаточно средств', 'Недостатньо коштів', 'Insufficient funds'), 'r'); rerender(); },
    auto: (v, el) => { G.s.settings.autoTax = !G.s.settings.autoTax; rerender(); },
    reg: async (k) => { const r = REGIMES[k]; if (!(await confirmBox(L(r.n), esc(L(r.d)), T('Оформить', 'Оформити', 'Register')))) return; if (register(k)) { sfx('win'); toast(T('Регистрация завершена', 'Реєстрацію завершено', 'Registered'), 'g'); } else toast(T('Не хватает денег на пошлину', 'Не вистачає грошей на мито', 'Can’t afford the fee'), 'r'); rerender(); },
  },
};

// ---------------------------------------------------------------- STOCKS
function stocksMain() {
  const s = G.s;
  const port = Object.entries(s.stocks.hold).reduce((a, [tk, q]) => a + q * s.stocks.px[tk], 0);
  return `<div class="card"><div class="small m">${T('Портфель', 'Портфель', 'Portfolio')}</div><div class="price-big">${fmt(port)}</div></div>` + TICKERS.map((t) => {
    const h = s.stocks.hist[t.tk] || [];
    const px = s.stocks.px[t.tk];
    const ch = h.length > 1 ? (px / h[0] - 1) * 100 : 0;
    const q = s.stocks.hold[t.tk] || 0;
    return `<div class="list-item" data-a="go" data-v="stock" data-id="${t.tk}"><div style="width:70px"><b class="mono">${t.tk}</b><div class="tiny m">${esc(L(t.n))}</div></div><div class="grow" style="height:40px">${sparkline(h.slice(-30), 120, 40, 'auto')}</div><div style="text-align:right;min-width:90px"><b>${fmt(px)}</b><div class="small ${ch >= 0 ? 'g' : 'r'}">${ch >= 0 ? '+' : ''}${ch.toFixed(1)}%</div>${q ? `<div class="tiny b">${T('у вас', 'у вас', 'own')} ${fmtNum(q, q < 1 ? 3 : 0)}</div>` : ''}</div></div>`;
  }).join('') + `<p class="small m mt">${T('Цены обновляются каждый игровой час. Новости о брендах двигают котировки.', 'Ціни оновлюються щогодини. Новини про бренди рухають котирування.', 'Prices update hourly; brand news moves them.')}</p>`;
}
function stockView(p) {
  const s = G.s;
  const t = TICKERS.find((x) => x.tk === p.id);
  const h = s.stocks.hist[t.tk];
  const px = s.stocks.px[t.tk];
  const q = s.stocks.hold[t.tk] || 0;
  const avg = s.stocks.avg[t.tk] || 0;
  return `<div class="card"><div class="small m">${esc(L(t.n))}</div><div class="price-big">${fmt(px)}</div>${sparkline(h, 320, 150, 'auto')}</div>
    <div class="card">${kv(T('В портфеле', 'У портфелі', 'Holding'), fmtNum(q, q < 1 ? 3 : 0))}${q ? kv(T('Средняя цена', 'Середня ціна', 'Avg price'), fmt(avg)) + kv(T('Прибыль', 'Прибуток', 'P/L'), fmt((px - avg) * q), px >= avg ? 'g' : 'r') : ''}${kv(T('Комиссия', 'Комісія', 'Fee'), '0.25%')}</div>
    <div class="btns"><button class="btn green" data-a="sbuy" data-v="${t.tk}">${T('Купить', 'Купити', 'Buy')}</button><button class="btn red" data-a="ssell" data-v="${t.tk}" ${q ? '' : 'disabled'}>${T('Продать', 'Продати', 'Sell')}</button></div>`;
}
export const stocksApp = {
  id: 'stocks', glyph: 'chart', lvl: 5,
  name: ['Биржа', 'Біржа', 'Stocks'], colors: ['#2ec27e', '#0f8a5a'],
  views: { main: stocksMain, stock: stockView },
  title: (v, p) => (v === 'stock' ? p.id : T('Биржа', 'Біржа', 'Stocks')),
  live: true,
  actions: {
    sbuy: async (tk) => { const px = G.s.stocks.px[tk]; const v = await askPrice({ title: T('Сумма покупки', 'Сума покупки', 'Amount to invest'), value: Math.max(px, Math.min(G.s.money, px * 5)), min: Math.min(px, G.s.money), max: Math.max(px, G.s.money) }); if (!v) return; const q = +(v / px / 1.0025).toFixed(px > 1000 ? 4 : 2); if (buyStock(tk, q)) { sfx('cash'); toast(T('Куплено', 'Куплено', 'Bought'), 'g'); } else toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r'); rerender(); },
    ssell: async (tk) => { const q = G.s.stocks.hold[tk] || 0; const v = await choose(T('Продать', 'Продати', 'Sell'), [{ v: '1', label: T('Всё', 'Усе', 'All'), cls: '' }, { v: '0.5', label: '50%' }, { v: '0.25', label: '25%' }]); if (!v) return; if (sellStock(tk, q * +v)) { sfx('cash'); toast(T('Продано', 'Продано', 'Sold'), 'g'); } rerender(); },
  },
};

// ---------------------------------------------------------------- NUMBERS & PLATES
const NB = { tab: 'market' };
const numHTML = (n) => n.kind === 'phone' ? `<span class="number">${esc(n.label)}</span>` : `<span class="plate">${esc(n.label)}</span>`;
function numbersMain() {
  const s = G.s;
  const tabs = `<div class="seg"><button class="${NB.tab === 'market' ? 'on' : ''}" data-a="nt" data-v="market">${T('Рынок', 'Ринок', 'Market')}</button><button class="${NB.tab === 'mine' ? 'on' : ''}" data-a="nt" data-v="mine">${T('Мои', 'Мої', 'Mine')} (${s.numbers.owned.length})</button></div>`;
  if (NB.tab === 'market') {
    const list = numbersMarket();
    return tabs + `<p class="p">${T('Красивые телефонные номера и госномера. Чем больше повторов, зеркал и «777» — тем дороже.', 'Гарні номери телефонів і держномери. Більше повторів — дорожче.', 'Vanity phone numbers and plates: repeats, mirrors and 777 cost more.')} ⟳ <span data-cd="${s.numbers.refreshAt}"></span></p>` + list.map((n) => `<div class="list-item">${n.kind === 'phone' ? '📞' : '🚘'}<div class="grow">${numHTML(n)}<div class="small m">${T('оценка', 'оцінка', 'value')} ≈ ${fmt(n.value)}</div></div><button class="btn xs" data-a="nbuy" data-v="${n.id}">${fmt(n.price)}</button></div>`).join('');
  }
  return tabs + (s.numbers.owned.length ? s.numbers.owned.map((n) => `<div class="list-item">${n.kind === 'phone' ? '📞' : '🚘'}<div class="grow">${numHTML(n)}<div class="small m">${T('куплен за', 'куплено за', 'paid')} ${fmt(n.paid || 0)} · ${T('оценка', 'оцінка', 'value')} ${fmt(n.value)}${n.ask ? ` · <span class="b">${T('продаётся за', 'продається за', 'listed')} ${fmt(n.ask)}</span>` : ''}</div></div><div class="btns" style="margin:0;flex-direction:column"><button class="btn xs" data-a="nsell" data-v="${n.id}">${T('Продать', 'Продати', 'Sell')}</button><button class="btn xs dark" data-a="nquick" data-v="${n.id}">70%</button></div></div>`).join('') : empty('hash', T('Нет номеров', 'Немає номерів', 'No numbers')));
}
export const numbersApp = {
  id: 'numbers', glyph: 'phone', lvl: 4,
  name: ['Номера', 'Номери', 'Numbers'], colors: ['#3ad16a', '#16a34a'],
  views: { main: numbersMain },
  actions: {
    nt: (v) => { NB.tab = v; rerender(); },
    nbuy: (id) => { const n = G.s.numbers.market.find((x) => x.id === id); if (n && buyNumber(n)) { sfx('cash'); toast(T('Номер ваш!', 'Номер ваш!', 'It’s yours!'), 'g'); } else toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r'); rerender(); },
    nsell: async (id) => { const n = G.s.numbers.owned.find((x) => x.id === id); const p = await askPrice({ title: T('Цена продажи', 'Ціна продажу', 'Asking price'), value: nicePrice(n.value * 1.1), min: 1, max: n.value * 4 }); if (p) { listNumber(n, p); toast(T('Выставлено', 'Виставлено', 'Listed'), 'g'); rerender(); } },
    nquick: async (id) => { const s = G.s; const n = s.numbers.owned.find((x) => x.id === id); if (!(await confirmBox(T('Продать дилеру?', 'Продати дилеру?', 'Sell to a dealer?'), `${esc(n.label)} → ${fmt(n.value * 0.7)}`))) return; s.numbers.owned = s.numbers.owned.filter((x) => x !== n); earn(n.value * 0.7, 'sale', n.label); sfx('cash'); rerender(); },
  },
};

// ---------------------------------------------------------------- CASINO
const CZ = { chance: 50, bet: null, tab: 'slots', spinning: false };
const payout = (p) => +(0.96 / (p / 100)).toFixed(2);
function casinoMain() {
  const s = G.s;
  if (CZ.bet == null) CZ.bet = Math.max(1, Math.min(s.money, 10));
  CZ.bet = Math.min(CZ.bet, Math.max(0, s.money));
  const pay = payout(CZ.chance);
  const hist = s.casino.hist.slice(0, 12);
  const TABS = [['slots', '🎰', T('Слоты', 'Слоти', 'Slots')], ['roulette', '🎡', T('Рулетка', 'Рулетка', 'Roulette')], ['bj', '🃏', T('Блэкджек', 'Блекджек', 'Blackjack')], ['dice', '🎲', T('Кости', 'Кості', 'Dice')], ['wheel', '🎯', T('Шанс', 'Шанс', 'Chance')], ['crash', '🚀', T('Краш', 'Краш', 'Crash')]];
  const tabs = `<div class="seg vseg">${TABS.map(([k, e, n]) => `<button class="${CZ.tab === k ? 'on' : ''}" data-a="ct" data-v="${k}">${e} ${n}</button>`).join('')}</div>`;
  const ring = (deg, col) => `<circle cx="115" cy="115" r="96" fill="none" stroke="${col}" stroke-width="22" stroke-dasharray="${(deg / 360) * 603} 603" transform="rotate(-90 115 115)"/>`;
  const betBlock = `<div class="small m">${T('Ставка', 'Ставка', 'Bet')}, ${symOf()}</div><div class="center price-big" style="margin:4px 0 8px">${fmt(CZ.bet)}</div><div class="pad-grid" style="grid-template-columns:repeat(6,1fr)">${[['min', T('Мин', 'Мін', 'Min')], ['half', '½'], ['x2', '×2'], ['p10', '+10%'], ['set', '✎'], ['max', T('Макс', 'Макс', 'Max')]].map(([k, l]) => `<button data-a="cbet" data-v="${k}">${l}</button>`).join('')}</div>`;
  if (CZ.tab === 'slots') return tabs + slotsView(betBlock);
  if (CZ.tab === 'roulette') return tabs + rouletteView(betBlock);
  if (CZ.tab === 'bj') return tabs + blackjackView(betBlock);
  if (CZ.tab === 'dice') return tabs + diceView(betBlock);
  if (CZ.tab === 'crash') return tabs + `<div class="center" style="font-size:80px;margin:10px 0">🚀</div><p class="p center">${T('Множитель растёт — заберите выигрыш до взрыва!', 'Множник росте — заберіть виграш до вибуху!', 'The multiplier climbs — cash out before it blows!')}</p>${betBlock}<button class="btn green block mt" style="min-height:60px;font-size:20px" data-a="crash" ${CZ.bet > 0 ? '' : 'disabled'}>${T('Запуск', 'Запуск', 'Launch')}</button><p class="tiny m mt center">${T('В игре только игровые деньги.', 'У грі лише ігрові гроші.', 'In‑game money only.')}</p>`;
  return tabs + `<div class="wheel"><svg viewBox="0 0 230 230"><circle cx="115" cy="115" r="96" fill="none" stroke="#2a2550" stroke-width="22"/>${ring(CZ.chance * 3.6, '#2ef2a0')}<circle cx="115" cy="115" r="70" fill="#1d1838"/><g class="cz-needle" style="transform-origin:115px 115px"><path d="M115 6 l-7 -2 l7 20 l7 -20z" fill="#fff"/></g></svg><div class="lab"><b>${CZ.chance}%</b><small>${T('выплата', 'виплата', 'payout')} ×${pay}</small></div></div>
    <div class="center g bold" style="font-size:18px;min-height:26px" id="cz-res">${T('Выигрыш', 'Виграш', 'Win')} ${fmt(CZ.bet * pay)} (×${pay})</div>
    <div class="small m mt">${T('Шанс выигрыша', 'Шанс виграшу', 'Win chance')}</div><div class="pad-grid" style="grid-template-columns:repeat(3,1fr);margin:6px 0 12px">${[10, 20, 30, 50, 75].map((c) => `<button class="${CZ.chance === c ? 'ok' : ''}" data-a="cch" data-v="${c}">${c}%</button>`).join('')}<button data-a="cch" data-v="custom">${T('Свой %', 'Свій %', 'Custom %')}</button></div>
    ${betBlock}
    <div class="kv"><span>${T('Выигрыш при победе', 'Виграш у разі перемоги', 'Payout on win')}</span><b>${fmt(CZ.bet * pay)}</b></div>
    <button class="btn green block" style="min-height:60px;font-size:20px" data-a="spin" ${CZ.bet > 0 ? '' : 'disabled'}>${T('Крутить', 'Крутити', 'Spin')}</button>
    <div class="hist mt">${hist.map((h) => `<span class="${h.w ? 'w' : 'l'}">×${h.m} ${h.w ? '+' : '−'}${fmt(Math.abs(h.d), { short: true })}</span>`).join('')}</div>
    <p class="tiny m mt">${T('В игре только игровые деньги. Чем выше шанс, тем меньше выплата. Казино всегда в плюсе на дистанции.', 'У грі лише ігрові гроші. Казино завжди в плюсі на дистанції.', 'In‑game money only. The house always wins long‑term.')}</p>`;
}
function settle(bet, win, mult) {
  const s = G.s;
  if (win) { const prof = bet * mult - bet; earn(bet * mult, 'casinoRet', T('Казино', 'Казино', 'Casino')); s.tax.income += prof; stat('casino', prof); stat('casinoWin'); s.casino.hist.unshift({ w: true, m: mult.toFixed(2), d: prof }); }
  else { stat('casino', -bet); stat('casinoLoss'); s.casino.hist.unshift({ w: false, m: mult.toFixed ? mult.toFixed(2) : mult, d: bet }); }
  if (s.casino.hist.length > 30) s.casino.hist.length = 30;
}
export const casinoApp = {
  id: 'casino', glyph: 'wheel', lvl: 2,
  name: ['Казино', 'Казино', 'Casino'], colors: ['#8b5cff', '#5a2ee0'], accent: '#8b5cff', dark: true,
  views: { main: casinoMain },
  actions: {
    ct: (v) => { if (CG.spinning || CZ.spinning) return; CZ.tab = v; rerender(); },
    slots: () => playSlots(CZ.bet, settle),
    roulette: () => playRoulette(CZ.bet, settle),
    rlb: (v) => { CG.rlBet = v; rerender(); },
    rln: (v) => { CG.rlNum = +v; rerender(); },
    bjdeal: () => bjDeal(CZ.bet, settle),
    bjhit: () => bjHit(settle),
    bjstand: () => bjFinish(settle),
    bjdouble: () => bjDouble(settle),
    dice: () => playDice(CZ.bet, settle),
    dcb: (v) => { CG.dice = v; rerender(); },
    cch: async (v) => { if (v === 'custom') { const c = await choose(T('Шанс', 'Шанс', 'Chance'), [5, 15, 25, 40, 60, 90].map((x) => ({ v: String(x), label: `${x}% → ×${payout(x)}` }))); if (c) CZ.chance = +c; } else CZ.chance = +v; rerender(); },
    cbet: async (k) => { const m = Math.max(0, G.s.money); if (k === 'min') CZ.bet = Math.min(m, 1); if (k === 'half') CZ.bet = CZ.bet / 2; if (k === 'x2') CZ.bet = CZ.bet * 2; if (k === 'p10') CZ.bet = CZ.bet * 1.1; if (k === 'max') CZ.bet = m; if (k === 'set') { const v = await askPrice({ title: T('Ставка', 'Ставка', 'Bet'), value: CZ.bet || 1, min: 0.01, max: Math.max(m, 0.01) }); if (v) CZ.bet = v; } CZ.bet = Math.min(Math.max(0, CZ.bet), m); rerender(); },
    spin: () => {
      if (CZ.spinning) return;
      const s = G.s; const bet = CZ.bet;
      if (!(bet > 0) || !spend(bet, 'casino', T('Ставка', 'Ставка', 'Bet'))) return toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r');
      CZ.spinning = true;
      const roll = Math.random() * 100;
      const win = roll < CZ.chance;
      const needle = document.querySelector('.cz-needle');
      const end = 360 * 4 + (roll / 100) * 360;
      if (needle) { needle.style.transition = 'transform 1.6s cubic-bezier(.15,.7,.15,1)'; requestAnimationFrame(() => (needle.style.transform = `rotate(${end}deg)`)); }
      setTimeout(() => { CZ.spinning = false; settle(bet, win, payout(CZ.chance)); sfx(win ? 'win' : 'lose'); toast(win ? `+${fmt(bet * payout(CZ.chance) - bet)}` : `−${fmt(bet)}`, win ? 'g' : 'r'); rerender(); }, 1700);
    },
    crash: async () => {
      const bet = CZ.bet;
      if (!(bet > 0) || !spend(bet, 'casino', T('Ставка', 'Ставка', 'Bet'))) return toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r');
      const r = await playMini('crash', { title: '🚀 Crash', bet, pass: 0.5, showQuit: true });
      if (r.quit && r.mult == null) { settle(bet, false, 0); rerender(); return; }
      settle(bet, r.score >= 1, r.mult || 0);
      rerender();
    },
  },
};
