// Bank app looks like the bank app people use in the player's country (fictional names):
//  'neo'   – dark neobank (UA Монокіт, UK, DE): centred balance, round actions, jars, feed with emoji avatars
//  'light' – bright super-app (RU Т‑Копилка, KZ, TR, BY, TH): stories, spending by category, accounts
//  'corp'  – classic retail bank (US, FR, IT, PL, JP, AE…): blue header, account list, pay & transfer
import { G } from '../core/state.js';
import { T, L, fmtDate } from '../core/i18n.js';
import { esc, clamp } from '../core/util.js';
import { fmt, fmtNum, rate } from '../core/money.js';
import { CURRENCIES, countryOf } from '../data/world.js';
import { gameDate } from '../ui/shell.js';
import { creditInfo, loanTotal, CARDS } from '../game/finance.js';
import { netWorth } from '../game/player.js';

const LAYOUT = { UA: 'neo', GB: 'neo', DE: 'neo', RU: 'light', KZ: 'light', TR: 'light', BY: 'light', TH: 'light', GE: 'light' };
export const bankSkin = () => {
  const c = countryOf(G.s.player.city);
  const [name, c1, c2] = c.apps?.bank || ['Bank', '#2a63ff', '#1b3fb0'];
  return { layout: LAYOUT[c.id] || LAYOUT[c.code] || 'corp', name, c1, c2 };
};
// transaction kinds → category, emoji, colour
const CAT = {
  buy: ['Покупки', 'Покупки', 'Shopping', '🛍', '#7c5cff'], sale: ['Продажи', 'Продажі', 'Sales', '💸', '#2ec27e'], repair: ['Ремонт', 'Ремонт', 'Repairs', '🛠', '#ff8a3d'],
  food: ['Еда', 'Їжа', 'Food', '🍔', '#ffb800'], travel: ['Транспорт', 'Транспорт', 'Transport', '🚕', '#2d9cff'], rent: ['Жильё', 'Житло', 'Housing', '🏠', '#9b6bff'],
  service: ['Услуги', 'Послуги', 'Services', '🧾', '#00b3a4'], biz: ['Бизнес', 'Бізнес', 'Business', '🏪', '#5d7cff'], casino: ['Развлечения', 'Розваги', 'Fun', '🎰', '#ff4fa3'],
  apps: ['Подписки', 'Підписки', 'Subscriptions', '📱', '#4b8dff'], tax: ['Налоги', 'Податки', 'Taxes', '🏛', '#8a94a6'], fine: ['Штрафы', 'Штрафи', 'Fines', '🚨', '#ff5468'],
  customs: ['Таможня', 'Митниця', 'Customs', '🛃', '#8a94a6'], scam: ['Мошенники', 'Шахраї', 'Scammers', '⚠️', '#ff5468'], theft: ['Кража', 'Крадіжка', 'Theft', '🕵️', '#ff5468'],
  refund: ['Возвраты', 'Повернення', 'Refunds', '↩️', '#8a94a6'], loan: ['Кредит', 'Кредит', 'Loan', '🏦', '#ffc23d'], deposit: ['Копилка', 'Скарбничка', 'Savings', '🐷', '#ff8ac6'],
  job: ['Зарплата', 'Зарплата', 'Salary', '💼', '#2ec27e'], quest: ['Бонусы', 'Бонуси', 'Bonuses', '🎁', '#ffc23d'], stock: ['Инвестиции', 'Інвестиції', 'Investments', '📈', '#00b3a4'],
  realty: ['Недвижимость', 'Нерухомість', 'Real estate', '🏢', '#9b6bff'], numbers: ['Номера', 'Номери', 'Numbers', '🔢', '#4b8dff'], auction: ['Аукционы', 'Аукціони', 'Auctions', '🔨', '#ff8a3d'],
  box: ['Боксы', 'Бокси', 'Boxes', '🎁', '#ff4fa3'], gov: ['Госуслуги', 'Держпослуги', 'Gov', '🏛', '#8a94a6'], bonus: ['Бонусы', 'Бонуси', 'Bonuses', '🎁', '#ffc23d'], other: ['Прочее', 'Інше', 'Other', '•', '#8a94a6'],
};
const cat = (k) => CAT[k] || CAT.other;
const last4 = () => String(Math.abs(G.s.id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % 10000).padStart(4, '0');
function dayLabel(t) {
  const d = Math.floor(G.s.t / 1440) - Math.floor(t / 1440);
  if (d === 0) return T('Сегодня', 'Сьогодні', 'Today');
  if (d === 1) return T('Вчера', 'Вчора', 'Yesterday');
  return fmtDate(gameDate(t));
}
function feed(n = 30, light = false) {
  const h = G.s.bank.hist.slice(0, n);
  if (!h.length) return `<div class="bk-empty">${T('Операций пока нет', 'Операцій поки немає', 'No transactions yet')}</div>`;
  let out = '', lastDay = null;
  for (const x of h) {
    const dl = dayLabel(x.t);
    if (dl !== lastDay) { out += `<div class="bk-day">${esc(dl)}</div>`; lastDay = dl; }
    const c = cat(x.kind);
    out += `<div class="bk-tx"><div class="bk-av" style="background:${c[4]}${light ? '22' : '33'}">${c[3]}</div><div class="grow"><b>${esc(x.note || L(c))}</b><small>${esc(L(c))} · ${String(Math.floor((x.t % 1440) / 60)).padStart(2, '0')}:${String(x.t % 60).padStart(2, '0')}</small></div><b class="${x.amt >= 0 ? 'bk-in' : ''}">${x.amt >= 0 ? '+' : '−'}${fmt(Math.abs(x.amt))}</b></div>`;
  }
  return out;
}
function spendByCat(days = 30) {
  const from = G.s.t - days * 1440;
  const m = {};
  for (const x of G.s.bank.hist) if (x.t >= from && x.amt < 0) m[x.kind] = (m[x.kind] || 0) - x.amt;
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}
const income30 = () => G.s.bank.hist.filter((x) => x.t >= G.s.t - 30 * 1440 && x.amt > 0).reduce((a, x) => a + x.amt, 0);
const actions = (cls) => `<div class="${cls}">
  <button data-a="dep">🐷<span>${T('Копилка', 'Банка', 'Save')}</span></button>
  <button data-a="loan">💳<span>${T('Кредит', 'Кредит', 'Loan')}</span></button>
  <button data-a="bview" data-v="cards">✨<span>${T('Карты', 'Картки', 'Cards')}</span></button>
  <button data-a="bview" data-v="rates">💱<span>${T('Валюта', 'Валюта', 'FX')}</span></button></div>`;
function credit(ci) {
  const pos = clamp(((ci.r - 300) / 550) * 100, 0, 100);
  return `<div class="bk-score"><div class="row between"><span>${T('Кредитный рейтинг', 'Кредитний рейтинг', 'Credit score')}</span><b>${ci.r}</b></div><div class="bk-sbar"><i style="left:${pos}%"></i></div><small>${T(`Лимит ${fmt(ci.limit)} · ставка ×${ci.mult}`, `Ліміт ${fmt(ci.limit)} · ставка ×${ci.mult}`, `Limit ${fmt(ci.limit)} · rate ×${ci.mult}`)}</small></div>`;
}
function loans() {
  const s = G.s;
  if (!s.bank.loans.length) return '';
  return s.bank.loans.map((l) => `<div class="bk-row"><span>💳 ${T('Кредит', 'Кредит', 'Loan')} · ${T('осталось', 'залишилось', 'left')} ${fmt(l.left)}<small>${T('до', 'до', 'due')} ${esc(fmtDate(gameDate(l.due)))}</small></span><button class="bk-mini" data-a="repay" data-v="${l.id}">${T('Погасить', 'Погасити', 'Repay')}</button></div>`).join('');
}
function jars(light) {
  const s = G.s;
  if (!s.bank.deposits.length) return `<div class="bk-row" data-a="dep"><span>🐷 ${T('Открыть копилку: +0.25% в день', 'Відкрити банку: +0.25% на день', 'Open a savings jar: +0.25%/day')}</span><b>＋</b></div>`;
  return s.bank.deposits.map((d) => { const goal = Math.pow(10, Math.ceil(Math.log10(Math.max(10, d.amt + (d.earned || 0)) * 1.2))); const p = Math.round(((d.amt + (d.earned || 0)) / goal) * 100); return `<div class="bk-jar ${light ? 'l' : ''}"><div class="bk-jarico"><i style="height:${p}%"></i>🐷</div><div class="grow"><b>${fmt(d.amt + (d.earned || 0))}</b><small>+${fmt(d.earned || 0)} · ${T('цель', 'ціль', 'goal')} ${fmt(goal)}</small></div><button class="bk-mini" data-a="wd" data-v="${d.id}">${T('Снять', 'Зняти', 'Withdraw')}</button></div>`; }).join('');
}

// ---------------------------------------------------------------- layouts
export function bankHome() {
  const sk = bankSkin();
  const s = G.s;
  const ci = creditInfo();
  const card = CARDS.find((c) => c.id === s.bank.card) || CARDS[0];
  const name = esc(s.player.name.toUpperCase());
  if (sk.layout === 'neo') {
    return `<div class="bk bk-neo" style="--k1:${sk.c1};--k2:${sk.c2}">
      <div class="bk-neo-top"><div class="bk-cat">🐱</div><small>${T('Баланс', 'Баланс', 'Balance')}</small><div class="bk-bal" data-live="money">${fmt(s.money)}</div><small>${T('Кредитный лимит', 'Кредитний ліміт', 'Credit limit')} ${fmt(Math.max(0, ci.limit - loanTotal()))}</small></div>
      <div class="bk-neo-card" style="background:linear-gradient(135deg,${card === CARDS[0] ? '#3a3a3c,#0b0b0c' : card.grad[0] + ',' + card.grad[1]})"><div class="row between"><b>${esc(L(card.n))}</b><span class="bk-chip"></span></div><div class="bk-pan">•••• ${last4()}</div><div class="row between"><small>${name}</small><b>${esc(sk.name)}</b></div></div>
      ${actions('bk-neo-act')}
      <div class="bk-sec">${T('Банки', 'Банки', 'Jars')}</div>${jars(false)}
      ${loans() ? `<div class="bk-sec">${T('Кредиты', 'Кредити', 'Loans')}</div>${loans()}` : ''}
      ${credit(ci)}
      <div class="bk-sec">${T('Операции', 'Операції', 'Transactions')}</div>${feed(40)}</div>`;
  }
  if (sk.layout === 'light') {
    const sp = spendByCat();
    const total = sp.reduce((a, x) => a + x[1], 0);
    const stories = [['🎁', T('Кэшбэк', 'Кешбек', 'Cashback')], ['📈', T('Инвестиции', 'Інвестиції', 'Invest')], ['✈️', T('Путешествия', 'Подорожі', 'Travel')], ['🔥', T('Акции', 'Акції', 'Deals')], ['🛡', T('Безопасность', 'Безпека', 'Security')]];
    return `<div class="bk bk-light" style="--k1:${sk.c1};--k2:${sk.c2}">
      <div class="bk-stories">${stories.map(([e, n]) => `<div><span>${e}</span><small>${esc(n)}</small></div>`).join('')}</div>
      <div class="bk-lcard"><div class="row between"><small>${T('Все счета', 'Усі рахунки', 'All accounts')}</small><small>${esc(sk.name)}</small></div><div class="bk-bal" data-live="money">${fmt(s.money)}</div>
        <div class="bk-acc"><span class="bk-mcard" style="background:linear-gradient(135deg,${card.grad[0]},${card.grad[1]})">${last4()}</span><div class="grow"><b>${T('Дебетовая карта', 'Дебетова картка', 'Debit card')} ${esc(L(card.n))}</b><small>${T('кэшбэк', 'кешбек', 'cashback')} ${card.id === 'black' ? '2%' : card.id === 'premium' ? '1%' : '0%'}</small></div><b data-live="money">${fmt(s.money)}</b></div>
        <div class="bk-acc"><span class="bk-mcard" style="background:#ffdd2d;color:#111">%</span><div class="grow"><b>${T('Кредитка', 'Кредитка', 'Credit card')}</b><small>${T('доступно', 'доступно', 'available')} ${fmt(Math.max(0, ci.limit - loanTotal()))}</small></div><b>${loanTotal() ? '−' + fmt(loanTotal()) : '0'}</b></div>
        <div class="bk-acc"><span class="bk-mcard" style="background:#2ec27e">🐷</span><div class="grow"><b>${T('Накопительный счёт', 'Накопичувальний рахунок', 'Savings account')}</b><small>+0.25% ${T('в день', 'на день', 'per day')}</small></div><b>${fmt(s.bank.deposits.reduce((a, d) => a + d.amt + (d.earned || 0), 0))}</b></div></div>
      ${actions('bk-light-act')}
      <div class="bk-lcard"><div class="row between"><b>${T('Траты за 30 дней', 'Витрати за 30 днів', 'Spending, 30 days')}</b><b>${fmt(total)}</b></div><div class="bk-stack">${sp.slice(0, 6).map(([k, v]) => `<i style="width:${(v / Math.max(1, total)) * 100}%;background:${cat(k)[4]}"></i>`).join('') || '<i style="width:100%;background:#e3e5e8"></i>'}</div>${sp.slice(0, 5).map(([k, v]) => `<div class="bk-row"><span>${cat(k)[3]} ${esc(L(cat(k)))}</span><b>${fmt(v)}</b></div>`).join('')}<div class="bk-row"><span>💰 ${T('Доходы', 'Доходи', 'Income')}</span><b class="bk-in">+${fmt(income30())}</b></div></div>
      ${loans() ? `<div class="bk-lcard">${loans()}</div>` : ''}
      <div class="bk-lcard">${jars(true)}</div>
      <div class="bk-lcard">${credit(ci)}</div>
      <div class="bk-lcard"><b>${T('Операции', 'Операції', 'Transactions')}</b>${feed(30, true)}</div></div>`;
  }
  // corp
  return `<div class="bk bk-corp" style="--k1:${sk.c1};--k2:${sk.c2}">
    <div class="bk-corp-top"><small>${T('Добрый день', 'Добрий день', 'Good day')}, ${esc(s.player.name)}</small><div class="bk-bal" data-live="money">${fmt(s.money)}</div><small>${T('Общий капитал', 'Загальний капітал', 'Total net worth')} <span data-live="worth">${fmt(netWorth(), { short: true })}</span></small></div>
    ${actions('bk-corp-act')}
    <div class="bk-sec">${T('Счета', 'Рахунки', 'Accounts')}</div>
    <div class="bk-ccard"><div class="bk-acc"><div class="grow"><b>${T('Текущий счёт', 'Поточний рахунок', 'Checking')} (...${last4()})</b><small>${esc(L(card.n))} · ${esc(sk.name)}</small></div><b data-live="money">${fmt(s.money)}</b></div>
      <div class="bk-acc"><div class="grow"><b>${T('Сберегательный', 'Ощадний', 'Savings')}</b><small>+0.25% / ${T('день', 'день', 'day')}</small></div><b>${fmt(s.bank.deposits.reduce((a, d) => a + d.amt + (d.earned || 0), 0))}</b></div>
      <div class="bk-acc"><div class="grow"><b>${T('Кредитная линия', 'Кредитна лінія', 'Credit line')}</b><small>${T('доступно', 'доступно', 'available')} ${fmt(Math.max(0, ci.limit - loanTotal()))}</small></div><b>${loanTotal() ? '−' + fmt(loanTotal()) : fmt(0)}</b></div></div>
    ${loans() ? `<div class="bk-ccard">${loans()}</div>` : ''}
    <div class="bk-ccard">${jars(true)}</div>
    <div class="bk-ccard">${credit(ci)}</div>
    <div class="bk-sec">${T('Последние операции', 'Останні операції', 'Recent activity')}</div><div class="bk-ccard">${feed(30, true)}</div></div>`;
}
export function bankRates() {
  return `<div class="card"><h3>${T('Курсы валют', 'Курси валют', 'Exchange rates')}</h3>${Object.entries(CURRENCIES).filter(([k]) => k !== 'USD').map(([k, c]) => `<div class="kv"><span>${k} · ${esc(L(c.name))}</span><b>1 $ = ${fmtNum(rate(k), rate(k) < 10 ? 3 : 1)} ${c.sym}</b></div>`).join('')}</div>`;
}
