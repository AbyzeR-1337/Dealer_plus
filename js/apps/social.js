// Messages (every notification, grouped by sender) and Telega (channels + members' requests).
import { G, emit } from '../core/state.js';
import { T, L, dur } from '../core/i18n.js';
import { esc } from '../core/util.js';
import { fmt } from '../core/money.js';
import { CITY } from '../data/world.js';
import { rerender, toast, choose, confirmBox, openApp, go, UI, gameClock } from '../ui/shell.js';
import { img, empty } from '../ui/comp.js';
import { itemTitle, knownDefects, defectName } from '../game/items.js';
import { sfx } from '../ui/sfx.js';
import { CHANNELS, chName, tgState, joined, entryFee, join, postsOf, buyPost, requests, matchesFor, fulfil } from '../game/tg.js';

// ---------------------------------------------------------------- Messages
const SENDER = { quests: ['Задания', 'Завдання', 'Quests', '#f59e0b'], gov: ['Госуслуги', 'Держпослуги', 'Government', '#3c7bf0'], bank: ['Банк', 'Банк', 'Bank', '#10b981'], market: ['Объявления', 'Оголошення', 'Classifieds', '#0ea5e9'], sys: ['Система', 'Система', 'System', '#64748b'], tg: ['Телега', 'Телега', 'Telega', '#229ed9'], build: ['Сборка', 'Збірка', 'PC Build', '#ff7a3d'], supplier: ['Поставщик', 'Постачальник', 'Supplier', '#ea580c'], auto: ['Авторынок', 'Авторинок', 'Car market', '#e11d48'], ymarket: ['Ё.Маркет', 'Ё.Маркет', 'Yo.Market', '#eab308'] };
const senderOf = (app) => SENDER[app] || [UI.apps[app] ? (typeof UI.apps[app].name === 'function' ? UI.apps[app].name() : L(UI.apps[app].name)) : app, '', '', '#8b5cf6'];
const sName = (app) => { const x = senderOf(app); return x[1] ? L(x) : x[0]; };
export function ensureInbox() {
  const s = G.s;
  if (!(s.inbox || []).some((m) => m.id === 'm0')) { (s.inbox ||= []).unshift({ id: 'm0', app: 'sys', title: T('Добро пожаловать', 'Ласкаво просимо', 'Welcome'), text: T(`Добро пожаловать, ${s.player.name}! Ваш город: ${L(CITY[s.player.city].name)}.`, `Ласкаво просимо, ${s.player.name}! Ваше місто: ${L(CITY[s.player.city].name)}.`, `Welcome, ${s.player.name}! Your city: ${L(CITY[s.player.city].name)}.`), t: 0, read: false }); }
  return s.inbox;
}
const MV = { thread: null };
function msgMain() {
  const box = ensureInbox();
  if (MV.thread) {
    const list = box.filter((m) => m.app === MV.thread);
    for (const m of list) m.read = true;
    const c = senderOf(MV.thread);
    return `<div class="ms-thead"><button class="btn xs dark" data-a="msback">‹</button><span class="ms-ava" style="background:${c[3]}">${esc(sName(MV.thread)[0])}</span><b>${esc(sName(MV.thread))}</b></div>` + list.map((m) => `<div class="ms-bub"><b>${esc(m.title)}</b><span>${esc(m.text)}</span><small>${ago(m.t)}</small>${m.go ? `<button class="btn xs mt" data-a="msgo" data-v="${m.id}">${T('Открыть', 'Відкрити', 'Open')} ›</button>` : ''}</div>`).join('');
  }
  const threads = {};
  for (const m of box) { const th = (threads[m.app] ||= { app: m.app, last: m, unread: 0 }); if (!m.read) th.unread++; }
  const list = Object.values(threads).sort((a, b) => b.last.t - a.last.t);
  if (!list.length) return empty('chat', T('Сообщений нет', 'Повідомлень немає', 'No messages'));
  return list.map((th) => { const c = senderOf(th.app); return `<div class="ms-row" data-a="msopen" data-v="${esc(th.app)}"><span class="ms-ava" style="background:${c[3]}">${esc(sName(th.app)[0])}</span><div class="grow"><div class="row between"><b>${esc(sName(th.app))}</b><small class="m">${ago(th.last.t)}</small></div><small class="m">${esc(th.last.title)}: ${esc(th.last.text)}</small></div>${th.unread ? `<span class="ms-badge">${th.unread}</span>` : ''}</div>`; }).join('');
}
const ago = (t) => { const d = G.s.t - t; return d < 2 ? T('сейчас', 'зараз', 'now') : d < 60 ? `${d} ${T('мин', 'хв', 'min')}` : d < 1440 ? `${Math.floor(d / 60)} ${T('ч', 'год', 'h')}` : `${Math.floor(d / 1440)} ${T('д', 'д', 'd')}`; };
export const msgApp = {
  id: 'msgs', glyph: 'msg', lvl: 1,
  name: ['Сообщения', 'Повідомлення', 'Messages'], colors: ['#34c759', '#1f9a43'], glyphColor: '#fff',
  views: { main: msgMain },
  onOpen: () => { MV.thread = null; },
  actions: {
    msopen: (app) => { MV.thread = app; rerender(); },
    msback: () => { MV.thread = null; rerender(); },
    msgo: (id) => { const m = ensureInbox().find((x) => x.id === id); if (m?.go) openApp(...m.go); },
  },
};

// ---------------------------------------------------------------- Telega
const TV = { ch: null, tab: 'ch' };
const k = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'K' : String(n));
function postCard(p, c, locked) {
  if (p.news) return `<div class="tg-post"><div class="tg-txt">📣 ${esc(p.news)}</div>${p.go ? `<button class="btn xs mt" data-a="open" data-v="${p.go}">${T('Открыть', 'Відкрити', 'Open')} ›</button>` : ''}<div class="tg-meta">👁 ${k(p.views)}</div></div>`;
  const kd = knownDefects(p.it).map((d) => defectName(d.c).toLowerCase());
  const cond = kd.length ? kd.slice(0, 2).join(', ') : p.it.cond >= 85 ? T('отличное состояние', 'відмінний стан', 'great condition') : T('потёртости и царапины', 'потертості й подряпини', 'scuffs and scratches');
  const batt = p.it.cat === 'phones' ? `, ${T('батарея', 'батарея', 'battery')} ${70 + (p.it.seed % 28)}%` : '';
  return `<div class="tg-post ${locked ? 'locked' : ''}"><div class="tg-img">${img(p.it)}</div><div class="tg-txt">😶 <b>${esc(p.handle.replace('@', ''))}</b><br>• ${esc(itemTitle(p.it))} · ${esc(cond)}${batt}<br>${esc(p.note)}<br><br>💰 <b>${fmt(p.price)}</b> <s>${fmt(p.mkt)}</s> ${T('на рынке', 'на ринку', 'at market')}<br>✍️ ${T('Писать', 'Писати', 'DM')} ${esc(p.handle)}</div>
    ${locked ? `<div class="tg-lock">🔒 ${T('Оплатите вход, чтобы купить', 'Оплатіть вхід, щоб купити', 'Pay to join to buy')}</div>` : p.sold ? `<div class="tg-lock">✅ ${T('Продано', 'Продано', 'Sold')}</div>` : `<button class="btn block mt" data-a="tgbuy" data-v="${p.id}">${T('Купить', 'Купити', 'Buy')}</button>`}<div class="tg-meta">👁 ${k(p.views)} · ${ago(p.at)}</div></div>`;
}
function tgMain() {
  const st = tgState();
  const tabs = `<div class="seg"><button class="${TV.tab === 'ch' ? 'on' : ''}" data-a="tgtab" data-v="ch">${T('Каналы', 'Канали', 'Channels')}</button><button class="${TV.tab === 'rq' ? 'on' : ''}" data-a="tgtab" data-v="rq">${T('Заказы', 'Замовлення', 'Orders')}</button></div>`;
  if (TV.tab === 'rq') {
    const rqs = requests();
    return tabs + `<p class="p">${T('Участники чатов ищут конкретные вещи. Есть такая на складе — продайте сразу по их цене.', 'Учасники чатів шукають конкретні речі. Є така на складі — продайте одразу за їхньою ціною.', 'Chat members want specific things. Have one in storage? Sell it right away at their price.')}</p>` + rqs.map((r) => { const have = matchesFor(r).length; return `<div class="tg-rq"><div class="row between"><b>${esc(r.who)}</b><b class="g">${fmt(r.budget)}</b></div><span>${T('Ищу', 'Шукаю', 'Looking for')} ${esc(r.title)}. ${T('Заберу сегодня.', 'Заберу сьогодні.', 'Can pick up today.')}</span>${r.done ? `<div class="tg-lock">✅ ${T('Сделка закрыта', 'Угоду закрито', 'Deal closed')}</div>` : have ? `<button class="btn block mt" data-a="tgfill" data-v="${r.id}">${T('Предложить свой', 'Запропонувати свій', 'Offer mine')} (${have})</button>` : `<small class="m">${T('На складе нет', 'На складі немає', 'Not in storage')}</small>`}</div>`; }).join('');
  }
  if (TV.ch) {
    const c = CHANNELS.find((x) => x.id === TV.ch);
    const posts = postsOf(c), lock = !joined(c);
    let h = `<div class="tg-head" style="--c:${c.col}"><button class="btn xs dark" data-a="tgback">‹</button><span class="tg-ava">${c.ic}</span><div class="grow"><b>${esc(chName(c))}</b><small>${esc(L(c.about))} · ${k(c.members)} ${T('в канале', 'у каналі', 'members')}</small></div></div>`;
    if (lock) h += `<button class="btn green block" data-a="tgjoin" data-v="${c.id}">${T(`Заплатить ${fmt(entryFee(c))} и войти`, `Заплатити ${fmt(entryFee(c))} і увійти`, `Pay ${fmt(entryFee(c))} and join`)}</button><p class="small m mt">${T('Что сейчас в канале:', 'Що зараз у каналі:', 'In the channel now:')}</p>`;
    h += (lock ? posts.slice(0, 2) : posts).map((p) => postCard(p, c, lock)).join('') || `<p class="p">${T('Пока тихо', 'Поки тихо', 'Quiet for now')}</p>`;
    return tabs + h;
  }
  return tabs + CHANNELS.map((c) => { const posts = postsOf(c); const last = posts[0]; return `<div class="tg-ch" data-a="tgopen" data-v="${c.id}"><span class="tg-ava" style="background:${c.col}">${c.ic}</span><div class="grow"><div class="row between"><b>${esc(chName(c))}${c.fee ? ' 🔒' : ''}</b><small class="m">${last ? ago(last.at) : ''}</small></div><small class="m">${last ? esc(last.news || `${itemTitle(last.it)} — ${fmt(last.price)}`) : esc(L(c.about))}</small></div>${c.fee && !joined(c) ? `<span class="tg-pay">${fmt(entryFee(c))}</span>` : posts.length ? `<span class="ms-badge">${posts.length}</span>` : ''}</div>`; }).join('');
}
export const tgApp = {
  id: 'tg', glyph: 'plane2', lvl: 1,
  name: ['Телега', 'Телега', 'Telega'], colors: ['#37aee2', '#1e96c8'], glyphColor: '#fff', dark: true,
  views: { main: tgMain },
  onOpen: () => { TV.ch = null; },
  actions: {
    tgtab: (v) => { TV.tab = v; rerender(); },
    tgopen: (id) => { TV.ch = id; rerender(); },
    tgback: () => { TV.ch = null; rerender(); },
    tgjoin: async (id) => { const c = CHANNELS.find((x) => x.id === id); if (!(await confirmBox(chName(c), T(`Вход ${fmt(entryFee(c))}. Здесь дешевле рынка, но бывает краденое и кидалы.`, `Вхід ${fmt(entryFee(c))}. Тут дешевше за ринок, але буває крадене й кидали.`, `Entry ${fmt(entryFee(c))}. Cheaper than the market, but expect stolen goods and scammers.`), T('Войти', 'Увійти', 'Join')))) return; const r = join(c); if (r.ok) { sfx('ok'); toast(T('Вы в канале', 'Ви в каналі', 'You’re in'), 'g'); } else toast(r.msg, 'r'); rerender(); },
    tgbuy: async (pid) => {
      const c = CHANNELS.find((x) => x.id === TV.ch); const p = postsOf(c).find((x) => x.id === pid); if (!p) return;
      const v = await choose(itemTitle(p.it), [{ v: 'meet', label: T(`Встреча: ${fmt(p.price)}`, `Зустріч: ${fmt(p.price)}`, `Meet: ${fmt(p.price)}`), sub: T('осмотрите на месте, платите при встрече', 'оглянете на місці, платите при зустрічі', 'inspect on the spot, pay in person') }, { v: 'prepay', label: T(`Предоплата на карту: ${fmt(Math.round(p.price * 0.95))}`, `Передоплата на картку: ${fmt(Math.round(p.price * 0.95))}`, `Prepay to card: ${fmt(Math.round(p.price * 0.95))}`), sub: T('дешевле и с доставкой, но продавец может пропасть', 'дешевше й з доставкою, але продавець може зникнути', 'cheaper and delivered, but the seller may vanish'), cls: 'dark' }]);
      if (!v) return;
      const r = buyPost(p, v);
      if (!r.ok) return toast(r.msg, 'r');
      if (r.scam) { sfx('err'); toast(T(`${p.handle} пропал с деньгами`, `${p.handle} зник із грошима`, `${p.handle} vanished with the money`), 'r'); }
      else { sfx('cash'); toast(v === 'meet' ? T('Забрали, вещь на складе', 'Забрали, річ на складі', 'Picked up — it’s in storage') : T('Оплачено, ждите посылку', 'Оплачено, чекайте посилку', 'Paid — parcel on the way'), 'g'); }
      rerender();
    },
    tgfill: async (id) => {
      const rq = requests().find((x) => x.id === id); if (!rq) return;
      const list = matchesFor(rq);
      const v = list.length === 1 ? list[0].id : await choose(T('Какую отдать?', 'Яку віддати?', 'Which one?'), list.map((it) => ({ v: it.id, label: itemTitle(it), sub: `${it.cond}%` })));
      if (!v) return;
      if (!(await confirmBox(T(`Продать ${rq.who}?`, `Продати ${rq.who}?`, `Sell to ${rq.who}?`), fmt(rq.budget), T('Продать', 'Продати', 'Sell')))) return;
      if (fulfil(rq, v).ok) { sfx('cash'); toast(`+${fmt(rq.budget)}`, 'g'); }
      rerender();
    },
  },
};
