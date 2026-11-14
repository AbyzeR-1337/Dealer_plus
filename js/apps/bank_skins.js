// Bank app in the style of the real bank app people use in the player's country (fictional names).
// Each bank has its own look: Монокіт (UA) — violet-blue gradient, big balance, tilted card, round
// actions, white "Операції" sheet and the five-tab bar; Т‑Копилка (RU) — light grey, stories,
// "Все счета", yellow accents; Каспер (KZ) / AliPey (CN) — super-app with a service grid; N27 (DE)
// and Monzi (GB) — minimal neobanks; Chaze (US), mBanko, Boursa+, Finecco, MUFJ, Emirat — classic
// retail banks; Ziraatt, TBS, K‑Bang, Беларусик — big account card with a round menu.
// The player can switch to any other bank skin.
import { G, emit } from '../core/state.js';
import { T, L, fmtDate } from '../core/i18n.js';
import { esc, clamp } from '../core/util.js';
import { fmt, fmtNum, rate } from '../core/money.js';
import { CURRENCIES, countryOf } from '../data/world.js';
import { gameDate, UI } from '../ui/shell.js';
import { creditInfo, loanTotal } from '../game/finance.js';
import { cardEffects, BANK_CARDS, BANK_BY_COUNTRY, ensureCards, ownedCards, primaryCard, cardCheck, perkText, isOwned, isOrdered, pendingCashback } from '../game/cards.js';
import { netWorth } from '../game/player.js';
import { onlineEnabled, isRegistered, homeData, HOME, sync, errText, countryRate } from '../game/online.js';
import { COUNTRIES } from '../data/world.js';

// ---------------------------------------------------------------- skins
const SKINS = {
  mono: { name: 'Монокіт', tpl: 'mono', c: '#2a2f9e', status: '#2a2f9e', cards: { basic: ['Чорна картка', 'Чорна картка', 'Black card'], premium: ['Platinum', 'Platinum', 'Platinum'], black: ['Iron', 'Iron', 'Iron'] } },
  tbank: { name: 'Т‑Копилка', tpl: 'tbank', c: '#ffdd2d', status: '#f6f7f8', light: true },
  kaspi: { name: 'Каспер', tpl: 'super', c: '#f14635', c2: '#c92a1c', status: '#f14635', card: 'Gold' },
  alipey: { name: 'AliPey', tpl: 'super', c: '#1677ff', c2: '#0b5ce0', status: '#1677ff', alt: true },
  n27: { name: 'N27', tpl: 'neo', c: '#36a18b', status: '#ffffff', light: true },
  monzi: { name: 'Monzi', tpl: 'neo', c: '#ff4f40', status: '#14233c', dark: true },
  chaze: { name: 'Chaze', tpl: 'retail', c: '#117aca', c2: '#0b4f86', status: '#0b4f86' },
  mbanko: { name: 'mBanko', tpl: 'retail', c: '#e3001b', c2: '#a80014', status: '#ffffff', light: true, white: true },
  boursa: { name: 'Boursa+', tpl: 'retail', c: '#d6006e', c2: '#9e0051', status: '#d6006e' },
  finecco: { name: 'Finecco', tpl: 'retail', c: '#004b8d', c2: '#00305c', status: '#00305c' },
  mufj: { name: 'MUFJ', tpl: 'retail', c: '#d6000f', c2: '#8f000a', status: '#8f000a' },
  emirat: { name: 'Emirat Bank', tpl: 'retail', c: '#0b2e59', c2: '#061b36', status: '#061b36', gold: true },
  ziraatt: { name: 'Ziraatt', tpl: 'kplus', c: '#e30a17', c2: '#8f050d', status: '#e30a17' },
  tbs: { name: 'TBS Bank', tpl: 'kplus', c: '#00aeef', c2: '#0067a3', status: '#00aeef' },
  kbang: { name: 'K‑Bang', tpl: 'kplus', c: '#138f2d', c2: '#0a5a1b', status: '#138f2d' },
  belarus: { name: 'Беларусик', tpl: 'kplus', c: '#00a650', c2: '#006b33', status: '#00a650' },
};
const BY_COUNTRY = BANK_BY_COUNTRY;
export const SKIN_IDS = Object.keys(SKINS);
export function bankSkin() {
  if (!G.s?.player) return { id: 'chaze', ...SKINS.chaze, layout: 'retail' };
  const c = countryOf(G.s.player.city);
  const id = (G.s.bank.skin && SKINS[G.s.bank.skin]) ? G.s.bank.skin : BY_COUNTRY[c.id] || 'chaze';
  const k = SKINS[id];
  const own = BY_COUNTRY[c.id] === id ? c.apps?.bank?.[0] : null;
  return { id, ...k, name: own || k.name, layout: k.tpl };
}
export function setBankSkin(id) { G.s.bank.skin = SKINS[id] ? id : null; emit('bank'); }
export const bankStatusBar = (v) => { const k = bankSkin(); return { bg: k.status, light: !!k.light, cls: 'bk-' + k.tpl }; };

// ---------------------------------------------------------------- shared data
const CAT = {
  buy: ['Покупки', 'Покупки', 'Shopping', '🛍', '#7c5cff'], sale: ['Продажи', 'Продажі', 'Sales', '💸', '#2ec27e'], repair: ['Ремонт', 'Ремонт', 'Repairs', '🛠', '#ff8a3d'],
  food: ['Еда', 'Їжа', 'Food', '🍔', '#ffb800'], travel: ['Транспорт', 'Транспорт', 'Transport', '🚕', '#2d9cff'], rent: ['Жильё', 'Житло', 'Housing', '🏠', '#9b6bff'],
  service: ['Услуги', 'Послуги', 'Services', '🧾', '#00b3a4'], biz: ['Бизнес', 'Бізнес', 'Business', '🏪', '#5d7cff'], casino: ['Развлечения', 'Розваги', 'Fun', '🎰', '#ff4fa3'],
  apps: ['Подписки', 'Підписки', 'Subscriptions', '📱', '#4b8dff'], tax: ['Налоги', 'Податки', 'Taxes', '🏛', '#8a94a6'], fine: ['Штрафы', 'Штрафи', 'Fines', '🚨', '#ff5468'],
  customs: ['Таможня', 'Митниця', 'Customs', '🛃', '#8a94a6'], scam: ['Мошенники', 'Шахраї', 'Scammers', '⚠️', '#ff5468'], theft: ['Кража', 'Крадіжка', 'Theft', '🕵️', '#ff5468'],
  refund: ['Возвраты', 'Повернення', 'Refunds', '↩️', '#8a94a6'], loan: ['Кредит', 'Кредит', 'Loan', '🏦', '#ffc23d'], deposit: ['Копилка', 'Скарбничка', 'Savings', '🐷', '#ff8ac6'],
  job: ['Зарплата', 'Зарплата', 'Salary', '💼', '#2ec27e'], quest: ['Бонусы', 'Бонуси', 'Bonuses', '🎁', '#ffc23d'], stock: ['Инвестиции', 'Інвестиції', 'Investments', '📈', '#00b3a4'],
  realty: ['Недвижимость', 'Нерухомість', 'Real estate', '🏢', '#9b6bff'], numbers: ['Номера', 'Номери', 'Numbers', '🔢', '#4b8dff'], auction: ['Аукционы', 'Аукціони', 'Auctions', '🔨', '#ff8a3d'],
  p2p: ['Переводы', 'Перекази', 'Transfers', '↔️', '#4b8dff'], box: ['Боксы', 'Бокси', 'Boxes', '🎁', '#ff4fa3'], gov: ['Госуслуги', 'Держпослуги', 'Gov', '🏛', '#8a94a6'], bonus: ['Бонусы', 'Бонуси', 'Bonuses', '🎁', '#ffc23d'], other: ['Прочее', 'Інше', 'Other', '•', '#8a94a6'],
};
const cat = (k) => CAT[k] || CAT.other;
const last4 = () => String(Math.abs(G.s.id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % 10000).padStart(4, '0');
const first4 = () => String(4000 + (Number(last4()) * 7) % 999);
const hhmm = (t) => `${String(Math.floor((t % 1440) / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
const initials = () => (G.s.player.name || '?').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const savings = () => G.s.bank.deposits.reduce((a, d) => a + d.amt + (d.earned || 0), 0);
const avail = () => Math.max(0, creditInfo().limit - loanTotal());
// the main card (the one on the home screen) and the rest of the wallet
const prim = () => { ensureCards(bankSkin().id); return primaryCard(); };
const card = () => { const p = prim(); return { id: p.def.kind, n: p.def.n, pan: p.pan, look: p.def.look, key: p.key }; };
const cashback = () => pendingCashback();
const plastic = (c, cls = '') => `<div class="bk-plast ${cls}" style="background:linear-gradient(135deg,${c.def.look[0]},${c.def.look[1]});color:${c.def.look[2]}"><div class="row between"><b>${esc(L(c.def.n))}</b><span class="bk-chip"></span></div><span class="bk-pan">•••• ${esc(c.pan || '0000')}</span><div class="row between"><small>${esc((G.s.player.name || '').toUpperCase())}</small><b class="bk-viza">VIZA</b></div></div>`;
// ---------------------------------------------------------------- swipeable card carousel (like the real apps)
// Swipe left/right between your cards; the dots, the card name above and the "main card" chip follow the card
// in the middle. The last slide orders a new card. The swiped‑to card is remembered while the game runs.
const CC = { key: null };
function cardsCarousel(slide, o = {}) {
  const list = ownedCards();
  const prim = card().key;
  let start = list.findIndex((c) => c.key === CC.key);
  if (start < 0) start = Math.max(0, list.findIndex((c) => c.key === prim));
  setTimeout(() => { for (const t of document.querySelectorAll('.bk-cc-track')) if (!t._snap) { t._snap = 1; const el = t.children[start]; if (el) t.scrollLeft = el.offsetLeft - (t.clientWidth - el.offsetWidth) / 2; } }, 0);
  const sub = (c) => `<div class="bk-cc-sub"><small>${esc(perkText(c.def)[0] || T('Обычная карта', 'Звичайна картка', 'Plain card'))}</small>${c.key === prim ? `<span class="bk-cc-main">★ ${T('Основная', 'Основна', 'Main')}</span>` : `<button class="bk-cc-btn" data-a="cmain" data-v="${c.key}">${T('Сделать основной', 'Зробити основною', 'Make main')}</button>`}</div>`;
  return `<div class="bk-cc ${o.cls || ''}"><div class="bk-cc-track">${list.map((c, i) => `<div class="bk-cc-slide" data-key="cc_${c.key}" data-name="${esc(L(c.def.n))}">${slide(c, i)}${o.sub === false ? '' : sub(c)}</div>`).join('')}<div class="bk-cc-slide add" data-key="cc_add" data-name="${T('Новая карта', 'Нова картка', 'New card')}" data-a="tab" data-v="cards"><span>＋</span><b>${T('Оформить карту', 'Оформити картку', 'Get a card')}</b></div></div><div class="bk-cc-dots">${list.map((c, i) => `<i class="${i === start ? 'on' : ''}"></i>`).join('')}<i class="plus"></i></div></div>`;
}
if (typeof document !== 'undefined' && !window.__bkcc) {
  window.__bkcc = 1;
  document.addEventListener('scroll', (e) => {
    const t = e.target;
    if (!t.classList || !t.classList.contains('bk-cc-track')) return;
    const mid = t.scrollLeft + t.clientWidth / 2;
    let best = 0, bd = Infinity;
    [...t.children].forEach((el, i) => { const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
    if (t._i === best) return;
    t._i = best;
    const el = t.children[best];
    if (el && el.dataset.key !== 'cc_add') CC.key = el.dataset.key.slice(3);
    const box = t.closest('.bk');
    box?.querySelectorAll('.bk-cc-dots i').forEach((d, k) => d.classList.toggle('on', k === best));
    const nm = box?.querySelector('.bk-cc-name');
    if (nm && el) nm.textContent = el.dataset.name;
  }, { capture: true, passive: true });
}
function dayLabel(t) {
  const d = Math.floor(G.s.t / 1440) - Math.floor(t / 1440);
  if (d === 0) return T('Сегодня', 'Сьогодні', 'Today');
  if (d === 1) return T('Вчера', 'Вчора', 'Yesterday');
  return fmtDate(gameDate(t));
}
function feed(n = 30, o = {}) {
  const h = G.s.bank.hist.slice(0, n);
  if (!h.length) return `<div class="bk-empty">${T('Операций пока нет', 'Операцій поки немає', 'No transactions yet')}</div>`;
  let out = '', lastDay = null;
  for (const x of h) {
    const dl = dayLabel(x.t);
    if (o.days !== false && dl !== lastDay) { out += `<div class="bk-day">${esc(dl)}</div>`; lastDay = dl; }
    const c = cat(x.kind);
    out += `<div class="bk-tx"><div class="bk-av" style="background:${c[4]}${o.solid ? '' : '26'};${o.solid ? 'color:#fff' : ''}">${c[3]}</div><div class="grow"><b>${esc(x.note || L(c))}</b><small>${esc(L(c))} · ${hhmm(x.t)}</small></div><b class="${x.amt >= 0 ? 'bk-in' : ''}">${x.amt >= 0 ? '+' : '−'}${fmt(Math.abs(x.amt))}</b></div>`;
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
function credit(ci) {
  const pos = clamp(((ci.r - 300) / 550) * 100, 0, 100);
  return `<div class="bk-score"><div class="row between"><span>${T('Кредитный рейтинг', 'Кредитний рейтинг', 'Credit score')}</span><b>${ci.r}</b></div><div class="bk-sbar"><i style="left:${pos}%"></i></div><small>${T(`Лимит ${fmt(ci.limit)} · ставка ×${ci.mult}`, `Ліміт ${fmt(ci.limit)} · ставка ×${ci.mult}`, `Limit ${fmt(ci.limit)} · rate ×${ci.mult}`)}</small></div>`;
}
function loans() {
  const s = G.s;
  if (!s.bank.loans.length) return '';
  return s.bank.loans.map((l) => `<div class="bk-row"><span>💳 ${T('Кредит', 'Кредит', 'Loan')} · ${T('осталось', 'залишилось', 'left')} ${fmt(l.left)}<small>${T('до', 'до', 'due')} ${esc(fmtDate(gameDate(l.due)))}</small></span><button class="bk-mini" data-a="repay" data-v="${l.id}">${T('Погасить', 'Погасити', 'Repay')}</button></div>`).join('');
}
function jars() {
  const s = G.s;
  if (!s.bank.deposits.length) return `<div class="bk-row" data-a="dep"><span>🐷 ${T('Открыть копилку: +0.25% в день', 'Відкрити банку: +0.25% на день', 'Open a savings jar: +0.25%/day')}</span><b>＋</b></div>`;
  return s.bank.deposits.map((d) => { const goal = Math.pow(10, Math.ceil(Math.log10(Math.max(10, d.amt + (d.earned || 0)) * 1.2))); const p = Math.round(((d.amt + (d.earned || 0)) / goal) * 100); return `<div class="bk-jar"><div class="bk-jarico"><i style="height:${p}%"></i>🐷</div><div class="grow"><b>${fmt(d.amt + (d.earned || 0))}</b><small>+${fmt(d.earned || 0)} · ${T('цель', 'ціль', 'goal')} ${fmt(goal)}</small></div><button class="bk-mini" data-a="wd" data-v="${d.id}">${T('Снять', 'Зняти', 'Withdraw')}</button></div>`; }).join('');
}

// ---------------------------------------------------------------- tab bars (own icons, own labels per bank)
const ICO = {
  cards: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18"/>',
  pie: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M14 3.3A8 8 0 0 1 20.7 10H14z"/>',
  jar: '<rect x="6" y="7" width="12" height="13" rx="3"/><path d="M8 4h8v3H8z"/>',
  dots: '<circle cx="7" cy="7" r="2.2"/><circle cx="17" cy="7" r="2.2"/><circle cx="7" cy="17" r="2.2"/><circle cx="17" cy="17" r="2.2"/>',
  bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  home: '<path d="M4 11l8-7 8 7v9H4z"/>',
  pay: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 10h8M8 14h5"/>',
  city: '<path d="M4 20V9l5-3v14M9 20V4l6 3v13M15 20v-9l5 2v7"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  qr: '<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h6v6h-6z"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  chart: '<path d="M5 19V10M10 19V5M15 19v-7M20 19v-11"/>',
  send: '<path d="M4 12l16-8-6 16-3-6z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 15-5 16 0"/>',
  star: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
};
const svg = (k, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICO[k] || ICO.dots}</svg>`;
const TABS = {
  mono: () => [['main', 'cards', T('Карты', 'Картки', 'Cards')], ['credit', 'pie', T('Кредиты', 'Кредити', 'Credit')], ['save', 'jar', T('Накопления', 'Накопичення', 'Savings')], ['more', 'dots', T('Ещё', 'Ще', 'More')], ['@market', 'bag', T('Маркет', 'Маркет', 'Market')]],
  tbank: () => [['main', 'home', T('Главная', 'Головна', 'Home')], ['@gov', 'pay', T('Платежи', 'Платежі', 'Payments')], ['@map', 'city', T('Город', 'Місто', 'City')], ['@support', 'chat', T('Чат', 'Чат', 'Chat')], ['more', 'menu', T('Ещё', 'Ще', 'More')]],
  super: () => [['main', 'home', T('Главная', 'Головна', 'Home')], ['save', 'jar', T('Депозит', 'Депозит', 'Deposit')], ['qr', 'qr', 'QR'], ['credit', 'pie', T('Кредит', 'Кредит', 'Credit')], ['more', 'grid', T('Сервисы', 'Сервіси', 'Services')]],
  neo: () => [['main', 'home', T('Главная', 'Головна', 'Home')], ['save', 'jar', T('Копилки', 'Скарбнички', 'Pots')], ['credit', 'chart', T('Финансы', 'Фінанси', 'Finances')], ['more', 'user', T('Профиль', 'Профіль', 'Profile')]],
  retail: () => [['main', 'cards', T('Счета', 'Рахунки', 'Accounts')], ['@gov', 'send', T('Платежи', 'Платежі', 'Pay')], ['credit', 'chart', T('Кредит', 'Кредит', 'Credit')], ['save', 'star', T('Вклады', 'Вклади', 'Savings')], ['more', 'menu', T('Ещё', 'Ще', 'More')]],
  kplus: () => [['main', 'home', T('Главная', 'Головна', 'Home')], ['save', 'jar', T('Вклады', 'Вклади', 'Savings')], ['qr', 'qr', T('Скан', 'Скан', 'Scan')], ['credit', 'pie', T('Кредиты', 'Кредити', 'Loans')], ['more', 'menu', T('Ещё', 'Ще', 'More')]],
};
function tabbar(k, v) {
  return `<nav class="bk-tabs">${TABS[k.tpl]().map(([to, ic, lb]) => {
    const on = to === v || (v === 'qr' && to === 'qr');
    const act = to.startsWith('@') ? `data-a="open" data-v="${to.slice(1)}"` : to === 'qr' ? 'data-a="bqr"' : `data-a="tab" data-v="${to}"`;
    return `<button class="${on ? 'on' : ''} ${to === 'qr' && k.tpl === 'super' ? 'big' : ''}" ${act}>${svg(ic)}<span>${esc(lb)}</span></button>`;
  }).join('')}</nav>`;
}
const wrap = (k, v, inner) => `<div class="bk bk-${k.tpl} ${k.dark ? 'bk-dk' : ''} ${k.alt ? 'bk-alt' : ''} ${k.white ? 'bk-white' : ''} ${k.gold ? 'bk-gold' : ''}" style="--k1:${k.c};--k2:${k.c2 || k.c}">${inner}${tabbar(k, v)}</div>`;
const skinBtn = () => `<button class="bk-skinbtn" data-a="tab" data-v="skins" title="skin">🎨</button>`;

// ---------------------------------------------------------------- MAIN per template
function monoMain(k) {
  const s = G.s;
  const cn = L(card().n);
  return `<div class="mn-head">
      <div class="mn-top"><span class="mn-ava">${esc(initials())}</span><span class="mn-ico">💬</span><i class="grow"></i><span class="mn-cb">🎁 ${fmt(cashback())}</span><span class="mn-ico">🐱</span>${skinBtn()}</div>
      <div class="mn-pill">🐱 <span class="bk-cc-name">${esc(cn)}</span></div>
      <div class="mn-bal" data-live="money">${fmt(s.money)}</div>
      ${cardsCarousel((c) => `<div class="mn-cardwrap"><div class="mn-card" style="background:linear-gradient(160deg,${c.def.look[0]} 0%,${c.def.look[1]} 70%);color:${c.def.look[2]}"><span class="mn-word">${esc(k.name.toLowerCase())}</span><span class="mn-pan">${first4()} **** **** ${esc(c.pan)}</span><span class="mn-viza">VIZA</span></div></div>`, { cls: 'mn-cc' })}
      <div class="mn-all" data-a="tab" data-v="cards">💳 ${T('Все карты', 'Усі картки', 'All cards')} · ${ownedCards().length} · ${T('листайте ↔', 'гортайте ↔', 'swipe ↔')}</div>
      <div class="mn-act"><button data-a="p2p"><i>${svg('send')}</i><span>${T('Переказ другу', 'Переказ другу', 'To a friend')}</span></button><button data-a="dep"><i>${svg('cards')}</i><span>${T('Перевести в банку', 'Переказати на банку', 'Move to a jar')}</span></button><button data-a="open" data-v="gov"><i>${svg('pay')}</i><span>${T('Платёж по IBAN', 'Платіж за IBAN', 'Pay by IBAN')}</span></button><button data-a="bother"><i>${svg('grid')}</i><span>${T('Другие платежи', 'Інші платежі', 'Other payments')}</span></button></div>
    </div>
    <div class="mn-sheet"><div class="row between"><b class="mn-h">${T('Операции', 'Операції', 'Transactions')}</b><span class="mn-allbtn">${T('Все', 'Усі', 'All')} ›</span></div>${feed(40, { solid: false })}</div>`;
}
function tbankMain(k) {
  const s = G.s, sp = spendByCat(), total = sp.reduce((a, x) => a + x[1], 0);
  const stories = [['🎁', T('Кэшбэк до 30%', 'Кешбек до 30%', 'Cashback up to 30%'), '#ff7a59,#ffb36b'], ['📈', T('Инвестиции', 'Інвестиції', 'Invest'), '#3f7cff,#8ab4ff'], ['✈️', T('Путешествия', 'Подорожі', 'Travel'), '#00b3a4,#6be3d6'], ['🛡', T('Как не попасться мошенникам', 'Як не потрапити до шахраїв', 'Beat the scammers'), '#7c5cff,#c4a8ff'], ['🔥', T('Акции недели', 'Акції тижня', 'Deals'), '#ff4f6e,#ff9aa9']];
  const month = gameDate().toLocaleString(G.s.settings?.lang === 'en' ? 'en' : G.s.settings?.lang === 'uk' ? 'uk' : 'ru', { month: 'long' });
  return `<div class="tb-head"><span class="tb-ava">${esc(initials())}</span><b>${esc(s.player.name)} ›</b><i class="grow"></i>${skinBtn()}<span class="tb-bell">🔔</span></div>
    <div class="tb-search">🔍 ${T('Поиск', 'Пошук', 'Search')}</div>
    <div class="tb-stories">${stories.map(([e, t, g]) => `<div style="background:linear-gradient(160deg,${g})"><span>${e}</span><small>${esc(t)}</small></div>`).join('')}</div>
    <div class="tb-card tb-cb"><div class="row between"><b>${T('Кэшбэк и бонусы', 'Кешбек і бонуси', 'Cashback & bonuses')}</b><b>${fmt(cashback())}</b></div><div class="tb-cats">${(() => { const ef = cardEffects(); const E = { buy: '🛒', food: '🍔', travel: '🚕', service: '🧾', apps: '📱', repair: '🛠', biz: '🏪', rent: '🏠' }; return Object.keys(E).map((kk) => [kk, ef.cb(kk)]).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([kk, v]) => `<span><i>${E[kk]}</i><small>${+(v * 100).toFixed(1)}%</small></span>`).join(''); })()}</div></div>
    ${cardsCarousel((c) => plastic(c), { cls: 'tb-cc' })}
    <div class="tb-card"><div class="row between"><small>${T('Все счета', 'Усі рахунки', 'All accounts')}</small><small>›</small></div><div class="tb-bal" data-live="money">${fmt(s.money + savings())}</div>
      ${ownedCards().map((c) => `<div class="tb-acc" data-a="tab" data-v="cards"><span class="tb-mini" style="background:linear-gradient(135deg,${c.def.look[0]},${c.def.look[1]});color:${c.def.look[2]}">${esc(c.pan)}</span><div class="grow"><b>${esc(L(c.def.n))}${c.key === card().key ? ' ★' : ''}</b><small>${esc(perkText(c.def)[0] || T('без бонусов', 'без бонусів', 'no perks'))}</small></div></div>`).join('')}
      <div class="tb-acc"><span class="tb-mini yel">%</span><div class="grow"><b>${fmt(avail())}</b><small>${T('Кредитная карта', 'Кредитна картка', 'Credit card')}</small></div></div>
      <div class="tb-acc" data-a="tab" data-v="save"><span class="tb-mini grn">🐷</span><div class="grow"><b>${fmt(savings())}</b><small>${T('Накопительный счёт', 'Накопичувальний рахунок', 'Savings account')} · 0,25% ${T('в день', 'на день', 'a day')}</small></div></div></div>
    <div class="tb-quick"><button data-a="dep"><i>🐷</i>${T('Отложить', 'Відкласти', 'Save')}</button><button data-a="loan"><i>💳</i>${T('Кредит', 'Кредит', 'Loan')}</button><button data-a="open" data-v="gov"><i>🧾</i>${T('Налоги', 'Податки', 'Taxes')}</button><button data-a="p2p"><i>↔️</i>${T('Другу', 'Другу', 'Friend')}</button></div>
    <div class="tb-card"><div class="row between"><b>${T('Траты в', 'Витрати в', 'Spent in')} ${esc(month)}</b><b>${fmt(total)}</b></div><div class="bk-stack">${sp.slice(0, 6).map(([kk, v]) => `<i style="width:${(v / Math.max(1, total)) * 100}%;background:${cat(kk)[4]}"></i>`).join('') || '<i style="width:100%;background:#e3e5e8"></i>'}</div><div class="row between small"><span>💰 ${T('Доходы', 'Доходи', 'Income')}</span><b class="bk-in">+${fmt(income30())}</b></div></div>
    <div class="tb-card"><b>${T('Операции', 'Операції', 'Transactions')}</b>${feed(30, { solid: true })}</div>`;
}
function superMain(k) {
  const s = G.s;
  const grid = k.alt
    ? [['🔍', T('Сканировать', 'Сканувати', 'Scan')], ['💳', T('Оплатить', 'Оплатити', 'Pay')], ['📥', T('Получить', 'Отримати', 'Collect')], ['👛', T('Кошелёк', 'Гаманець', 'Wallet')]]
    : null;
  const svc = [['🏦', T('Мой Банк', 'Мій Банк', 'My Bank'), 'tab:credit'], ['🧾', T('Платежи', 'Платежі', 'Payments'), 'open:gov'], ['↔️', T('Переводы', 'Перекази', 'Transfers'), 'p2p'], ['🛍', T('Маркет', 'Маркет', 'Market'), 'open:market'], ['✈️', 'Travel', 'open:travel'], ['🏛', T('Госуслуги', 'Держпослуги', 'Gov'), 'open:gov'], ['📢', T('Объявления', 'Оголошення', 'Classifieds'), 'open:market'], ['💱', T('Курсы', 'Курси', 'Rates'), 'tab:rates']];
  const act = (a) => { const [x, y] = a.split(':'); return y ? `data-a="${x}" data-v="${y}"` : `data-a="${x}"`; };
  return `<div class="sp-head"><div class="row"><b class="sp-logo">${esc(k.name)}${k.alt ? '' : '<small>.kz</small>'}</b><i class="grow"></i>${skinBtn()}<span>🔔</span></div><div class="sp-search">🔍 ${T('Поиск по сервисам', 'Пошук сервісів', 'Search services')}</div>
      ${grid ? `<div class="sp-big">${grid.map(([e, t]) => `<button data-a="${e === '👛' ? 'tab' : 'bqr'}" ${e === '👛' ? 'data-v="save"' : ''}><i>${e}</i><span>${esc(t)}</span></button>`).join('')}</div>` : ''}</div>
    <div class="sp-grid">${svc.map(([e, t, a]) => `<button ${act(a)}><i>${e}</i><span>${esc(t)}</span></button>`).join('')}</div>
    ${cardsCarousel((c) => plastic(c), { cls: 'sp-cc' })}
    <div class="sp-card" data-a="tab" data-v="cards"><div class="row between"><b>${esc(k.name)} ${esc(L(card().n))}</b><small>•• ${esc(card().pan)} · ${ownedCards().length} 💳</small></div><div class="sp-bal" data-live="money">${fmt(s.money)}</div><div class="row between small"><span>${T('Депозит', 'Депозит', 'Deposit')} ${fmt(savings())}</span><span>${T('Кредит доступен', 'Кредит доступний', 'Credit available')} ${fmt(avail())}</span></div></div>
    <div class="sp-sheet"><b>${T('История', 'Історія', 'History')}</b>${feed(30, { solid: true })}</div>`;
}
function neoMain(k) {
  const s = G.s;
  if (k.dark) {
    return `<div class="nz-top"><span class="nz-ava">${esc(initials())}</span><i class="grow"></i>${skinBtn()}<span>🔍</span></div>
      ${cardsCarousel((c) => `<div class="nz-card" style="background:linear-gradient(150deg,${c.def.look[0]},${c.def.look[1]});color:${c.def.look[2]}"><span>${esc(k.name.toLowerCase())}</span><b>${esc(c.pan)}</b></div>`, { cls: 'nz-cc' })}
      <div class="nz-bal"><small>${T('Баланс', 'Баланс', 'Balance')}</small><b data-live="money">${fmt(s.money)}</b><small>${T('Потрачено сегодня', 'Витрачено сьогодні', 'Spent today')} ${fmt(G.s.bank.hist.filter((x) => x.amt < 0 && x.t >= G.s.t - (G.s.t % 1440)).reduce((a, x) => a - x.amt, 0))}</small></div>
      <div class="nz-act"><button data-a="p2p">↗ ${T('Другу', 'Другу', 'Pay a friend')}</button><button data-a="dep">＋ ${T('В копилку', 'У скарбничку', 'Add to pot')}</button><button data-a="loan">💷 ${T('Кредит', 'Кредит', 'Loan')}</button></div>
      <div class="nz-pots">${G.s.bank.deposits.map((d) => `<div data-a="wd" data-v="${d.id}"><span>🐷</span><b>${fmt(d.amt + (d.earned || 0))}</b><small>${T('Копилка', 'Скарбничка', 'Pot')}</small></div>`).join('')}<div data-a="dep"><span>＋</span><b>${T('Новая', 'Нова', 'New')}</b><small>${T('копилка', 'скарбничка', 'pot')}</small></div></div>
      <div class="nz-feed">${feed(30, { solid: true })}</div>`;
  }
  return `<div class="n2-top"><span class="n2-ava">${esc(initials())}</span><b>${T('Привет', 'Привіт', 'Hi')}, ${esc(s.player.name.split(' ')[0])}</b><i class="grow"></i>${skinBtn()}<span>🔔</span></div>
    <div class="n2-main"><small>${T('Основной счёт', 'Основний рахунок', 'Main account')}</small><b data-live="money">${fmt(s.money)}</b></div>
    ${cardsCarousel((c) => plastic(c), { cls: 'n2-cc' })}
    <div class="n2-act"><button data-a="dep"><i>↗</i>${T('Отложить', 'Відкласти', 'Move')}</button><button data-a="loan"><i>＋</i>${T('Кредит', 'Кредит', 'Credit')}</button><button data-a="p2p"><i>⇄</i>${T('Другу', 'Другу', 'Friend')}</button></div>
    <div class="n2-spaces"><div class="n2-sp main"><small>${T('Основной', 'Основний', 'Main')}</small><b data-live="money">${fmt(s.money)}</b></div>${G.s.bank.deposits.map((d) => `<div class="n2-sp" data-a="wd" data-v="${d.id}"><small>Space</small><b>${fmt(d.amt + (d.earned || 0))}</b></div>`).join('')}<div class="n2-sp add" data-a="dep"><small>${T('Новый', 'Новий', 'New')}</small><b>＋</b></div></div>
    <div class="n2-feed"><b>${T('Операции', 'Операції', 'Transactions')}</b>${feed(30, { solid: false })}</div>`;
}
function retailMain(k) {
  const s = G.s;
  const hour = Math.floor((G.s.t % 1440) / 60);
  const hi = hour < 12 ? T('Доброе утро', 'Доброго ранку', 'Good morning') : hour < 18 ? T('Добрый день', 'Добрий день', 'Good afternoon') : T('Добрый вечер', 'Добрий вечір', 'Good evening');
  return `<div class="rt-bar"><span class="rt-burger">☰</span><b class="rt-logo">${esc(k.name.toUpperCase())}</b><i class="grow"></i>${skinBtn()}<span>🔔</span><span class="rt-ava">${esc(initials())}</span></div>
    <div class="rt-hero"><small>${hi}, ${esc(s.player.name.split(' ')[0])}</small><b>${T('Ваши счета', 'Ваші рахунки', 'Your accounts')}</b></div>
    ${cardsCarousel((c) => plastic(c), { cls: 'rt-cc' })}
    <div class="rt-tile"><div class="rt-th"><b>${T('ТЕКУЩИЙ СЧЁТ', 'ПОТОЧНИЙ РАХУНОК', 'TOTAL CHECKING')}</b> <small>(...${last4()})</small></div><div class="rt-big" data-live="money">${fmt(s.money)}</div><small>${T('Доступный остаток', 'Доступний залишок', 'Available balance')}</small></div>
    <div class="rt-tile" data-a="tab" data-v="save"><div class="rt-th"><b>${T('СБЕРЕГАТЕЛЬНЫЙ', 'ОЩАДНИЙ', 'SAVINGS')}</b> <small>(...${String((+last4() * 3) % 10000).padStart(4, '0')})</small></div><div class="rt-big">${fmt(savings())}</div><small>+0.25% ${T('в день', 'на день', 'a day')}</small></div>
    <div class="rt-tile" data-a="tab" data-v="credit"><div class="rt-th"><b>${T('КРЕДИТНАЯ ЛИНИЯ', 'КРЕДИТНА ЛІНІЯ', 'CREDIT LINE')}</b></div><div class="rt-big">${loanTotal() ? '−' + fmt(loanTotal()) : fmt(0)}</div><small>${T('Доступно', 'Доступно', 'Available credit')} ${fmt(avail())}</small></div>
    <div class="rt-links"><button data-a="p2p">${T('Перевод другу', 'Переказ другу', 'Send money to a friend')} ›</button><button data-a="dep">${T('Перевести на вклад', 'Переказати на вклад', 'Transfer to savings')} ›</button><button data-a="open" data-v="gov">${T('Оплатить налоги', 'Сплатити податки', 'Pay taxes')} ›</button><button data-a="tab" data-v="rates">${T('Курсы валют', 'Курси валют', 'Exchange rates')} ›</button></div>
    <div class="rt-sec">${T('Последние операции', 'Останні операції', 'Recent activity')}</div><div class="rt-tile">${feed(25, { solid: false })}</div>`;
}
function kplusMain(k) {
  const s = G.s;
  const hide = G.s.bank.hideBal;
  const menu = [['↔️', T('Перевод', 'Переказ', 'Transfer'), 'p2p'], ['🧾', T('Оплата', 'Оплата', 'Bill pay'), 'open:gov'], ['📷', T('Сканировать', 'Сканувати', 'Scan'), 'bqr'], ['💳', T('Карты', 'Картки', 'Cards'), 'tab:more'], ['🏦', T('Кредит', 'Кредит', 'Loan'), 'loan'], ['🐷', T('Вклады', 'Вклади', 'Savings'), 'tab:save'], ['💱', T('Курсы', 'Курси', 'Rates'), 'tab:rates'], ['📈', T('Инвестиции', 'Інвестиції', 'Invest'), 'open:stocks']];
  const act = (a) => { const [x, y] = a.split(':'); return y ? `data-a="${x}" data-v="${y}"` : `data-a="${x}"`; };
  return `<div class="kp-head"><div class="row"><span class="kp-ava">${esc(initials())}</span><b>${esc(k.name)}</b><i class="grow"></i>${skinBtn()}<span>🔔</span></div>
      <div class="kp-card"><small>${T('Сберегательный счёт', 'Ощадний рахунок', 'Savings account')}</small><div class="mono kp-no">${first4()}-${last4().slice(0, 1)}-${last4()}-${last4().slice(2)}</div><div class="row between"><b class="kp-bal" ${hide ? '' : 'data-live="money"'}>${hide ? '••••••' : fmt(s.money)}</b><button class="kp-eye" data-a="bhide">${hide ? '🙈' : '👁'}</button></div><small>${T('Доступно', 'Доступно', 'Available')}</small></div></div>
    ${cardsCarousel((c) => plastic(c), { cls: 'kp-cc' })}
    <div class="kp-menu">${menu.map(([e, t, a]) => `<button ${act(a)}><i>${e}</i><span>${esc(t)}</span></button>`).join('')}</div>
    <div class="kp-sheet"><b>${T('Последние операции', 'Останні операції', 'Recent transactions')}</b>${feed(30, { solid: true })}</div>`;
}

// ---------------------------------------------------------------- sub pages in the bank's own chrome
function page(k, v, title, inner) {
  return wrap(k, v, `<div class="bk-ph"><b>${esc(title)}</b>${skinBtn()}</div><div class="bk-pbody">${inner}</div>`);
}
export function bankHome() {
  const k = bankSkin();
  const body = k.tpl === 'mono' ? monoMain(k) : k.tpl === 'tbank' ? tbankMain(k) : k.tpl === 'super' ? superMain(k) : k.tpl === 'neo' ? neoMain(k) : k.tpl === 'kplus' ? kplusMain(k) : retailMain(k);
  return wrap(k, 'main', body);
}
export function bankCredit() {
  const k = bankSkin(), ci = creditInfo();
  return page(k, 'credit', T('Кредиты', 'Кредити', 'Credit'), `<div class="bk-box">${credit(ci)}</div><div class="bk-box"><div class="bk-row"><span>${T('Доступно', 'Доступно', 'Available')}</span><b>${fmt(avail())}</b></div><button class="btn block" data-a="loan">${T('Взять кредит', 'Взяти кредит', 'Take a loan')}</button></div>${loans() ? `<div class="bk-box">${loans()}</div>` : ''}`);
}
export function bankSave() {
  const k = bankSkin();
  return page(k, 'save', T('Накопления', 'Накопичення', 'Savings'), `<div class="bk-box"><div class="bk-row"><span>${T('Всего на копилках', 'Усього на скарбничках', 'Total saved')}</span><b>${fmt(savings())}</b></div><button class="btn block" data-a="dep">＋ ${T('Пополнить копилку', 'Поповнити скарбничку', 'Add to savings')}</button></div><div class="bk-box">${jars()}</div>`);
}
export function bankMore() {
  const k = bankSkin();
  return page(k, 'more', T('Ещё', 'Ще', 'More'), `<div class="bk-box"><div class="bk-row" data-a="p2p"><span>↔️ ${T('Перевод другу', 'Переказ другу', 'Send to a friend')}</span><b>›</b></div><div class="bk-row" data-a="tab" data-v="cards"><span>💳 ${T('Карты и тарифы', 'Картки й тарифи', 'Cards & plans')}</span><b>›</b></div><div class="bk-row" data-a="tab" data-v="rates"><span>💱 ${T('Курсы валют', 'Курси валют', 'Exchange rates')}</span><b>›</b></div><div class="bk-row" data-a="tab" data-v="skins"><span>🎨 ${T('Оформление банка', 'Оформлення банку', 'Bank skin')}</span><b>${esc(bankSkin().name)} ›</b></div><div class="bk-row" data-a="open" data-v="gov"><span>🏛 ${T('Налоги и госплатежи', 'Податки й держплатежі', 'Taxes')}</span><b>›</b></div></div><div class="bk-box"><div class="bk-row"><span>${T('Общий капитал', 'Загальний капітал', 'Net worth')}</span><b data-live="worth">${fmt(netWorth(), { short: true })}</b></div></div>`);
}
export function bankCards() {
  const k = bankSkin(), s = G.s;
  ensureCards(k.id);
  const mine = ownedCards(), orders = s.bank.cardOrders || [];
  const cat = BANK_CARDS[k.id] || [];
  const ownHTML = mine.map((c) => `<div class="bk-box">${plastic(c)}<div class="bk-perks">${perkText(c.def).map((p) => `<span>✓ ${esc(p)}</span>`).join('') || `<span class="m">${T('Обычная карта без бонусов', 'Звичайна картка без бонусів', 'A plain card, no perks')}</span>`}</div><div class="bk-row">${c.key === card().key ? `<span class="tag g">★ ${T('Основная', 'Основна', 'Main card')}</span>` : `<button class="btn xs" data-a="cmain" data-v="${c.key}">${T('Сделать основной', 'Зробити основною', 'Make main')}</button>`}${mine.length > 1 ? `<button class="bk-mini" data-a="cclose" data-v="${c.key}">${T('Закрыть', 'Закрити', 'Close')}</button>` : ''}</div></div>`).join('');
  const ordHTML = orders.map((o) => { const d = (BANK_CARDS[o.bank] || []).find((x) => x.id === o.id); return d ? `<div class="bk-box"><div class="bk-row"><span>🛵 ${esc(L(d.n))}</span><b>${T('курьер через', 'курʼєр через', 'courier in')} <span data-cd="${o.eta}"></span></b></div></div>` : ''; }).join('');
  const shop = cat.filter((d) => !isOwned(k.id, d.id) && !isOrdered(k.id, d.id)).map((d) => {
    const chk = cardCheck(d);
    return `<div class="bk-box"><div class="bk-plast sm" style="background:linear-gradient(135deg,${d.look[0]},${d.look[1]});color:${d.look[2]}"><b>${esc(L(d.n))}</b><span class="bk-pan">•••• ••••</span></div><div class="bk-perks">${perkText(d).map((p) => `<span>✓ ${esc(p)}</span>`).join('')}</div><div class="bk-req">${chk.rows.map((r) => `<span class="${r.ok ? 'g' : 'r'}">${r.ok ? '✔' : '✖'} ${esc(r.t)}</span>`).join('') || `<span class="g">✔ ${T('Без условий', 'Без умов', 'No requirements')}</span>`}</div><div class="bk-row"><small>${d.price ? fmt(d.price) : T('Бесплатно', 'Безкоштовно', 'Free')} · ${d.eta ? T(`доставка ${d.eta} мин`, `доставка ${d.eta} хв`, `delivery ${d.eta} min`) : T('сразу, виртуальная', 'одразу, віртуальна', 'instant, virtual')}</small><button class="btn xs ${chk.ok ? '' : 'dark'}" data-a="corder" data-v="${k.id}:${d.id}" ${chk.ok ? '' : 'disabled'}>${chk.ok ? T('Оформить', 'Оформити', 'Order') : T('Пока нельзя', 'Поки не можна', 'Not yet')}</button></div></div>`;
  }).join('');
  return page(k, 'more', T('Карты', 'Картки', 'Cards'), `<div class="bk-sec2">${T('Мои карты', 'Мої картки', 'My cards')} · ${mine.length}</div>${ownHTML}${ordHTML ? `<div class="bk-sec2">${T('В пути', 'В дорозі', 'On the way')}</div>${ordHTML}` : ''}<div class="bk-sec2">${T('Оформить карту', 'Оформити картку', 'Get a card')} · ${esc(k.name)}</div>${shop || `<p class="bk-p">${T('У вас уже есть все карты этого банка', 'У вас уже є всі картки цього банку', 'You already have every card of this bank')}</p>`}<p class="bk-p">${T('Кэшбэк по всем картам приходит раз в день. Работает лучший бонус из ваших карт.', 'Кешбек за всіма картками приходить раз на день. Працює найкращий бонус із ваших карток.', 'Cashback from all cards is paid daily. The best perk among your cards applies.')}</p>`);
}
export function bankRates() {
  const k = bankSkin();
  return page(k, 'more', T('Курсы валют', 'Курси валют', 'Exchange rates'), `<div class="bk-box">${Object.entries(CURRENCIES).filter(([kk]) => kk !== 'USD').map(([kk, c]) => `<div class="bk-row"><span>${kk} · ${esc(L(c.name))}</span><b>1 $ = ${fmtNum(rate(kk), rate(kk) < 10 ? 3 : 1)} ${c.sym}</b></div>`).join('')}</div>`);
}
// skin picker: every bank look, with a mini preview
const PREV = { mono: 'linear-gradient(180deg,#2a2f9e,#7d86ec)', tbank: 'linear-gradient(180deg,#f6f7f8,#ffdd2d)', super: 'linear-gradient(180deg,var(--k1) 0 40%,#f3f4f6 40%)', neo: '', retail: 'linear-gradient(180deg,var(--k1) 0 30%,#f4f6fa 30%)', kplus: 'linear-gradient(180deg,var(--k1),var(--k2))' };
export function bankSkins() {
  const k = bankSkin();
  const auto = BY_COUNTRY[countryOf(G.s.player.city).id];
  return page(k, 'more', T('Оформление банка', 'Оформлення банку', 'Bank skin'), `<p class="bk-p">${T('Выберите, как будет выглядеть ваш банк. По умолчанию — банк вашей страны.', 'Оберіть, як виглядатиме ваш банк. За замовчуванням — банк вашої країни.', 'Pick how your bank looks. Default is your country’s bank.')}</p><div class="bk-skins">${SKIN_IDS.map((id) => { const x = SKINS[id]; const bg = x.tpl === 'neo' ? (x.dark ? '#14233c' : '#fff') : PREV[x.tpl]; return `<button class="${k.id === id ? 'on' : ''}" data-a="bskin" data-v="${id}" style="--k1:${x.c};--k2:${x.c2 || x.c}"><i style="background:${bg}"><em style="background:${x.tpl === 'mono' ? '#111' : x.c}"></em></i><b>${esc(id === auto ? countryOf(G.s.player.city).apps?.bank?.[0] || x.name : x.name)}</b>${id === auto ? `<small>${T('ваша страна', 'ваша країна', 'your country')}</small>` : ''}</button>`; }).join('')}</div>`);
}
export function bankQR() {
  const k = bankSkin();
  return page(k, 'qr', 'QR', `<div class="bk-box c"><div class="bk-qr">${Array.from({ length: 121 }, (_, i) => `<i style="background:${(i * 7919 + +last4()) % 3 ? '#111' : 'transparent'}"></i>`).join('')}</div><p class="bk-p">${T('Покажите QR продавцу — оплата пройдёт с основной карты.', 'Покажіть QR продавцю — оплата пройде з основної картки.', 'Show the QR to the seller — paid from your main card.')}</p><b data-live="money">${fmt(G.s.money)}</b></div>`);
}

// ---------------------------------------------------------------- send money to a friend (online)
const flagOf = (r) => COUNTRIES.find((c) => c.id === r)?.flag || '🌐';
const srvNow = () => { const d = homeData(); return Date.now() + (d?.now ? Date.parse(d.now) - HOME.at : 0); };
const minsLeft = (at) => Math.max(0, Math.ceil((Date.parse(at) - srvNow()) / 60000));
const WHY = (w) => errText('limit_' + w);
export function bankP2P() {
  const k = bankSkin(), title = T('Перевод другу', 'Переказ другу', 'Send to a friend');
  const P = (inner) => page(k, 'main', title, inner);
  if (!onlineEnabled()) return P(`<div class="bk-box"><p class="bk-p">${T('Переводы друзьям работают через онлайн‑сервер игры, а он не подключён.', 'Перекази друзям працюють через онлайн‑сервер гри, а його не підключено.', 'Transfers to friends need the game’s online server, which isn’t connected.')}</p></div>`);
  if (!isRegistered()) return P(`<div class="bk-box"><p class="bk-p">${T('Чтобы переводить деньги друзьям, войдите в онлайн‑рейтинг и добавьте друзей по коду.', 'Щоб переказувати гроші друзям, увійдіть в онлайн‑рейтинг і додайте друзів за кодом.', 'Join the online leaderboard and add friends by code to send them money.')}</p><button class="btn block" data-a="open" data-v="rating">${T('Открыть Рейтинг', 'Відкрити Рейтинг', 'Open Leaderboard')}</button></div>`);
  setTimeout(() => { if (Date.now() - HOME.at > 8000) sync().catch(() => {}); }, 0);
  const d = homeData(), m = d?.money;
  if (!m) return P(`<div class="bk-box c"><p class="bk-p">${HOME.err ? esc(HOME.err) : T('Загружаем выписку…', 'Завантажуємо виписку…', 'Loading…')}</p></div>`);
  if (!m.active) return P(`<div class="bk-box"><p class="bk-p">🔐 ${T('Ваш онлайн‑аккаунт сейчас открыт на другом устройстве. Переводы работают только на одном устройстве за раз — так деньги нельзя скопировать.', 'Ваш онлайн‑акаунт зараз відкрито на іншому пристрої. Перекази працюють лише на одному пристрої за раз — так гроші не можна скопіювати.', 'Your online account is active on another device. Transfers work on one device at a time, so money can’t be copied.')}</p><button class="btn block" data-a="p2prelink">${T('Перенести сюда', 'Перенести сюди', 'Move it here')}</button></div>`);
  const lim = m.limits || {};
  const blocked = (lim.why || []).length > 0 || lim.send_left < 1;
  const pct = lim.send_cap ? Math.min(100, ((lim.send_cap - lim.send_left) / lim.send_cap) * 100) : 0;
  let h = `<div class="bk-box p2p-lim"><div class="bk-row"><span>${T('Можно отправить сегодня', 'Можна відправити сьогодні', 'You can send today')}</span><b>${fmt(lim.send_left)}</b></div><div class="p2p-bar"><i style="width:${pct}%"></i></div>
    <div class="bk-row small"><span>${T('Лимит в сутки', 'Ліміт на добу', 'Daily limit')}: ${fmt(lim.send_cap)} · ${T('переводов', 'переказів', 'transfers')} ${lim.count}/${lim.count_cap}</span><span>${T('получить', 'отримати', 'receive')} ≤ ${fmt(lim.recv_left)}</span></div>
    ${(lim.why || []).map((w) => `<div class="p2p-why">⛔ ${esc(WHY(w))}${(w === 'cooldown' || w === 'new_account') && lim.wait ? ` · ${Math.ceil(lim.wait / 60)} ${T('мин', 'хв', 'min')}` : ''}</div>`).join('')}</div>`;
  const fr = (d.social?.friends || []).slice().sort((a, b) => (b.id === UI.params?.to) - (a.id === UI.params?.to));
  h += `<div class="bk-sec2">${T('Кому', 'Кому', 'To')}</div><div class="bk-box">${fr.map((f) => `<div class="p2p-f ${f.id === UI.params?.to ? 'sel' : ''}"><span class="p2p-ava" style="background:hsl(${(f.nick.charCodeAt(0) * 37) % 360} 65% 55%)">${esc(f.nick[0].toUpperCase())}</span><div class="grow"><b>${esc(f.nick)}</b><small>${flagOf(f.region)} ${T('ур.', 'рів.', 'lvl')} ${f.level} · ${T('налог', 'податок', 'tax')} ${Math.round(countryRate(f.region) * 100)}%</small></div><button class="btn xs ${blocked ? 'dark' : ''}" data-a="p2psend" data-v="${f.id}" ${blocked ? 'disabled' : ''}>${T('Отправить', 'Надіслати', 'Send')}</button></div>`).join('') || `<p class="bk-p">${T('Друзей пока нет — добавьте их по коду в Рейтинге.', 'Друзів поки немає — додайте їх за кодом у Рейтингу.', 'No friends yet — add them by code in the Leaderboard.')}</p><button class="btn block" data-a="open" data-v="rating">${T('Добавить друзей', 'Додати друзів', 'Add friends')}</button>`}</div>`;
  if (m.in?.length) h += `<div class="bk-sec2">${T('Летят к вам', 'Летять до вас', 'Coming to you')}</div><div class="bk-box">${m.in.map((x) => `<div class="bk-row"><span>⏳ ${esc(x.nick)}${x.note ? ` · «${esc(x.note)}»` : ''}<small>${T('зачисление через', 'зарахування через', 'arrives in')} ${minsLeft(x.at)} ${T('мин', 'хв', 'min')}</small></span><b class="bk-in">+${fmt(x.net)}</b></div>`).join('')}</div>`;
  if (m.out?.length) h += `<div class="bk-sec2">${T('В пути', 'В дорозі', 'On the way')}</div><div class="bk-box">${m.out.map((x) => `<div class="bk-row"><span>➡️ ${esc(x.nick)} · ${fmt(x.amount)}<small>${x.can_cancel && minsLeft(x.at) > 0 ? `${T('доставка через', 'доставка через', 'delivery in')} ${minsLeft(x.at)} ${T('мин', 'хв', 'min')}` : T('доставлен, ждёт получателя', 'доставлено, чекає отримувача', 'delivered, waiting for the payee')}</small></span>${x.can_cancel && minsLeft(x.at) > 0 ? `<button class="bk-mini" data-a="p2pcancel" data-v="${x.id}">${T('Отменить', 'Скасувати', 'Cancel')}</button>` : ''}</div>`).join('')}</div>`;
  if (m.history?.length) h += `<div class="bk-sec2">${T('История переводов', 'Історія переказів', 'Transfer history')}</div><div class="bk-box">${m.history.slice(0, 12).map((x) => `<div class="bk-row"><span>${x.kind === 'send' ? '↗️' : x.kind === 'recv' ? '↘️' : '↩️'} ${esc(x.other || '')}<small>${x.kind === 'send' ? T(`комиссия ${fmt(+x.info?.fee || 0)} · другу ${fmt(+x.info?.net || 0)} после налога`, `комісія ${fmt(+x.info?.fee || 0)} · другу ${fmt(+x.info?.net || 0)} після податку`, `fee ${fmt(+x.info?.fee || 0)} · friend gets ${fmt(+x.info?.net || 0)} after tax`) : x.kind === 'recv' ? T(`налог ${fmt(+x.info?.tax || 0)} удержан`, `податок ${fmt(+x.info?.tax || 0)} утримано`, `tax ${fmt(+x.info?.tax || 0)} withheld`) : T('возврат', 'повернення', 'refund')}</small></span><b class="${+x.delta >= 0 ? 'bk-in' : ''}">${+x.delta >= 0 ? '+' : '−'}${fmt(Math.abs(+x.delta))}</b></div>`).join('')}</div>`;
  h += `<div class="bk-box p2p-rules"><b>🛡 ${T('Как защищены переводы', 'Як захищено перекази', 'How transfers are protected')}</b>
    <span>• ${T('Каждый перевод записан на сервере. Если откатить сохранение, банк спишет отправленное заново, а полученное дважды не придёт.', 'Кожен переказ записано на сервері. Якщо відкотити збереження, банк спише відправлене знову, а отримане двічі не прийде.', 'Every transfer is recorded on the server: roll back a save and the bank takes the sent money again; nothing arrives twice.')}</span>
    <span>• ${T('Лимиты считаются от капитала, который подтвердил сервер, а он растёт только со временем игры.', 'Ліміти рахуються від капіталу, який підтвердив сервер, а він росте лише з часом гри.', 'Limits come from your server‑verified net worth, which only grows with real play time.')}</span>
    <span>• ${T('Комиссия 1% (2.5% за границу) и налог страны получателя. Деньги идут 2–45 минут, крупные суммы — на финмониторинге.', 'Комісія 1% (2.5% за кордон) і податок країни отримувача. Гроші йдуть 2–45 хвилин, великі суми — на фінмоніторингу.', '1% fee (2.5% abroad) plus the payee’s country tax. Money takes 2–45 minutes; big sums go through financial monitoring.')}</span>
    <span>• ${T('Только друзьям, не чаще раза в минуту, до 10 в сутки, и только с одного устройства.', 'Лише друзям, не частіше разу на хвилину, до 10 на добу, і лише з одного пристрою.', 'Friends only, once a minute, up to 10 a day, from one device.')}</span></div>`;
  return P(h);
}
