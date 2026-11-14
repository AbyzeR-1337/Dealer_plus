// App Store, VPN and the shadow market.
import { G } from '../core/state.js';
import { T, L, clockDur, dur } from '../core/i18n.js';
import { esc } from '../core/util.js';
import { fmt } from '../core/money.js';
import { icon } from '../ui/icons.js';
import { go, rerender, toast, confirmBox, openApp, UI, appName, renderHome, choose } from '../ui/shell.js';
import { img, empty } from '../ui/comp.js';
import { APP_META, APP_CATS } from '../data/appmeta.js';
import { isInstalled, isSystem, downloading, dlProgress, startDownload, uninstall, vpnActive, VPN_PLANS, buyVpn, toggleVpn, darkListings, darkBuy, darkUnlock, unlockPrice, darkBoost, BOOST_PRICE, DARK_KINDS } from '../game/phone.js';
import { MARKS, traceOf, catchChance, riskOf, markLeft, fenceOffer, fenceSell, darkOrders, orderPay, fillOrder, recordWipePrice, wipeRecord, docsPrice, fakeDocs } from '../game/hot.js';
import { CATS } from '../data/catalog.js';
import { marksCount } from '../game/crime.js';
import { itemTitle, itemSub, lockName } from '../game/items.js';
import { getItem } from '../game/player.js';
import { sfx } from '../ui/sfx.js';

const appIcon = (a, size = 58) => { const c = typeof a.colors === 'function' ? a.colors() : a.colors; return `<div class="sico" style="width:${size}px;height:${size}px;--a:${c?.[0] || '#2a63ff'};--b:${c?.[1] || '#1b3fb0'};--g:${a.glyphColor || '#fff'}">${icon(a.glyph)}</div>`; };
const stars = (r) => `<span class="y">★</span> ${r.toFixed(1)}`;
function getBtn(a) {
  const meta = APP_META[a.id] || {};
  if (isInstalled(a.id)) return `<button class="getb" data-a="openA" data-v="${a.id}">${T('ОТКРЫТЬ', 'ВІДКРИТИ', 'OPEN')}</button>`;
  const d = downloading(a.id);
  if (d) { const p = Math.round(dlProgress(a.id) * 100); return `<div class="dlring" style="--p:${p}"><span data-cd="${d.end}"></span></div>`; }
  const owned = (G.s.bought || []).includes(a.id);
  return `<button class="getb" data-a="get" data-v="${a.id}">${meta.price && !owned ? fmt(meta.price) : T('ЗАГРУЗИТЬ', 'ЗАВАНТАЖИТИ', 'GET')}</button>`;
}
function row(a) {
  const meta = APP_META[a.id] || {};
  return `<div class="srow" data-key="s-${a.id}">${`<div data-a="go" data-v="app" data-id="${a.id}">${appIcon(a)}</div>`}<div class="grow" data-a="go" data-v="app" data-id="${a.id}"><b>${esc(appName(a))}</b><div class="small m">${esc(L(meta.desc || ['', '', '']).split('.')[0])}</div><div class="tiny m">${stars(meta.rating || 4.5)} · ${meta.mb || 40} MB${isSystem(a.id) ? ' · ' + T('системное', 'системний', 'system') : ''}</div></div>${getBtn(a)}</div>`;
}
const F = { cat: 'all' };
function storeMain() {
  const apps = UI.list.filter((a) => APP_META[a.id] && a.id !== 'appstore');
  const vpn = vpnActive();
  const pub = apps.filter((a) => !APP_META[a.id].secret);
  const secret = apps.filter((a) => APP_META[a.id].secret);
  const list = F.cat === 'all' ? pub : pub.filter((a) => APP_META[a.id].cat === F.cat);
  const notInst = pub.filter((a) => !isInstalled(a.id));
  const feat = notInst.find((a) => a.id === 'market') || notInst.find((a) => a.id === 'jobs') || notInst[0];
  return `${feat ? `<div class="sfeat" data-a="go" data-v="app" data-id="${feat.id}"><small>${T('СЕГОДНЯ РЕКОМЕНДУЕМ', 'СЬОГОДНІ РАДИМО', 'TODAY’S PICK')}</small><div class="row" style="gap:12px;margin-top:8px">${appIcon(feat, 64)}<div class="grow"><b style="font-size:20px">${esc(appName(feat))}</b><div class="small">${esc(L(APP_META[feat.id].desc))}</div></div></div></div>` : ''}
    <div class="chips">${['all', ...Object.keys(APP_CATS).filter((k) => k !== 'secret')].map((k) => `<button class="chip ${F.cat === k ? 'on' : ''}" data-a="scat" data-v="${k}">${k === 'all' ? T('Все', 'Усі', 'All') : esc(L(APP_CATS[k]))}</button>`).join('')}</div>
    ${list.map(row).join('')}
    <h3 class="sub">🕶 ${esc(L(APP_CATS.secret))}</h3>
    ${vpn ? `<div class="sdark">${secret.map(row).join('')}</div>` : `<div class="card sdark"><b>${T('Скрыто', 'Приховано', 'Hidden')}</b><div class="small m">${T('Некоторые приложения не видны в обычной сети. Нужно защищённое соединение: VPN и защита Wi‑Fi.', 'Деякі застосунки не видно у звичайній мережі. Потрібне захищене зʼєднання: VPN і захист Wi‑Fi.', 'Some apps aren’t visible on a normal network. You need a secure connection: VPN and Wi‑Fi protection.')}</div><button class="btn sm mt" data-a="${isInstalled('vpn') ? 'openA' : 'go'}" data-v="${isInstalled('vpn') ? 'vpn' : 'app'}" data-id="vpn">${isInstalled('vpn') ? T('Открыть VPN', 'Відкрити VPN', 'Open VPN') : T('Скачать VPN', 'Завантажити VPN', 'Get a VPN')}</button></div>`}`;
}
function storeApp(p) {
  const a = UI.apps[p.id];
  const meta = APP_META[p.id];
  if (!a || !meta) return empty('box', T('Нет такого приложения', 'Немає такого застосунку', 'No such app'));
  if (meta.secret && !vpnActive()) return empty('shield', T('Недоступно', 'Недоступно', 'Unavailable'), T('Включите VPN.', 'Увімкніть VPN.', 'Turn on the VPN.'));
  return `<div class="row" style="gap:14px;align-items:flex-start">${appIcon(a, 96)}<div class="grow"><h2 style="margin:0">${esc(appName(a))}</h2><div class="small m">${esc(L(APP_CATS[meta.cat]))}</div><div class="mt">${getBtn(a)}</div></div></div>
    <div class="sstats"><div><b>${(meta.rating || 4.5).toFixed(1)}</b><small>★★★★★</small></div><div><b>${meta.mb || 40}</b><small>MB</small></div><div><b>${meta.price ? fmt(meta.price) : T('Бесплатно', 'Безкоштовно', 'Free')}</b><small>${T('цена', 'ціна', 'price')}</small></div><div><b>12+</b><small>${T('возраст', 'вік', 'age')}</small></div></div>
    <div class="card">${esc(L(meta.desc))}</div>
    ${isInstalled(a.id) && !isSystem(a.id) ? `<button class="btn red block mt" data-a="del" data-v="${a.id}">${T('Удалить приложение', 'Видалити застосунок', 'Remove app')}</button>` : ''}`;
}
export const appstoreApp = {
  id: 'appstore', glyph: 'sparkle', lvl: 1,
  name: ['App Market', 'App Market', 'App Market'], colors: ['#2d9cff', '#1660e8'],
  badge: () => Object.keys(G.s.dl || {}).length,
  live: true,
  views: { main: storeMain, app: storeApp },
  title: (v) => (v === 'app' ? '' : 'App Market'),
  actions: {
    scat: (v) => { F.cat = v; rerender(); },
    get: (id) => { const a = UI.apps[id]; const r = startDownload(a); if (r.ok) { sfx('tap'); toast(T(`Загрузка: ${appName(a)}`, `Завантаження: ${appName(a)}`, `Downloading: ${appName(a)}`)); } else if (r.msg) { toast(r.msg, 'r'); sfx('err'); } rerender(); },
    openA: (id) => openApp(id),
    del: async (id) => { if (await confirmBox(T('Удалить приложение?', 'Видалити застосунок?', 'Remove the app?'), T('Прогресс сохранится.', 'Прогрес збережеться.', 'Progress is kept.'), T('Удалить', 'Видалити', 'Remove'), undefined, true)) { uninstall(id); toast(T('Удалено', 'Видалено', 'Removed')); rerender(); } },
  },
};

// ---------------------------------------------------------------- VPN
const SERVERS = [['🇳🇱', 'Амстердам', 'Амстердам', 'Amsterdam'], ['🇫🇮', 'Хельсинки', 'Гельсінкі', 'Helsinki'], ['🇨🇭', 'Цюрих', 'Цюрих', 'Zurich'], ['🇸🇬', 'Сингапур', 'Сінгапур', 'Singapore'], ['🇮🇸', 'Рейкьявик', 'Рейкʼявік', 'Reykjavik']];
function vpnMain() {
  const s = G.s;
  const on = vpnActive();
  const sub = s.vpn.until > s.t;
  const srv = SERVERS[s.vpn.srv || 0];
  return `<div class="vpnbox ${on ? 'on' : ''}"><button class="vpnbtn" data-a="vtoggle">${icon('shield')}</button><b>${on ? T('Защищено', 'Захищено', 'Protected') : T('Не защищено', 'Не захищено', 'Not protected')}</b><small>${on ? `${srv[0]} ${esc(L(srv.slice(1)))} · IP 185.${(s.seed || 7) % 200}.${s.t % 250}.${(s.t * 7) % 250}` : T('Ваш трафик видно провайдеру и владельцу Wi‑Fi', 'Ваш трафік бачить провайдер і власник Wi‑Fi', 'Your ISP and the Wi‑Fi owner can see your traffic')}</small></div>
    <div class="card"><div class="row between"><span>📶 ${T('Защита Wi‑Fi', 'Захист Wi‑Fi', 'Wi‑Fi protection')}</span><b class="${on ? 'g' : 'r'}">${on ? T('включена', 'увімкнено', 'on') : T('выключена', 'вимкнено', 'off')}</b></div><div class="row between mt"><span>🕶 ${T('Скрытые приложения', 'Приховані застосунки', 'Hidden apps')}</span><b class="${on ? 'g' : 'm'}">${on ? T('доступны', 'доступні', 'available') : T('недоступны', 'недоступні', 'unavailable')}</b></div>${sub ? `<div class="row between mt"><span>⏳ ${T('Подписка', 'Підписка', 'Subscription')}</span><b><span data-cd="${s.vpn.until}" data-fmt="long"></span></b></div>` : ''}</div>
    <h3 class="sub">${T('Сервер', 'Сервер', 'Server')}</h3><div class="chips">${SERVERS.map((x, i) => `<button class="chip ${(s.vpn.srv || 0) === i ? 'on' : ''}" data-a="vsrv" data-v="${i}">${x[0]} ${esc(L(x.slice(1)))}</button>`).join('')}</div>
    <h3 class="sub">${T('Подписка', 'Підписка', 'Subscription')}</h3>${VPN_PLANS.map((p, i) => `<div class="card row between"><div><b>${esc(L(p.n))}</b><div class="small m">${fmt(p.price / p.d)} / ${T('день', 'день', 'day')}</div></div><button class="btn sm" data-a="vbuy" data-v="${i}">${fmt(p.price)}</button></div>`).join('')}`;
}
export const vpnApp = {
  id: 'vpn', glyph: 'shield', lvl: 2,
  name: ['Тоннель VPN', 'Тунель VPN', 'Tunnel VPN'], colors: ['#16c784', '#0b7a52'],
  views: { main: vpnMain },
  actions: {
    vtoggle: () => { if (!toggleVpn()) { toast(T('Сначала оформите подписку', 'Спочатку оформіть підписку', 'Get a subscription first'), 'r'); sfx('err'); } else sfx(vpnActive() ? 'ok' : 'tap'); rerender(); renderHome(); },
    vsrv: (i) => { G.s.vpn.srv = +i; rerender(); },
    vbuy: (i) => { if (buyVpn(+i)) { sfx('cash'); toast(T('VPN включён', 'VPN увімкнено', 'VPN on'), 'g'); } else toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r'); rerender(); },
  },
};

// ---------------------------------------------------------------- shadow market
const D = { tab: 'goods', f: 'all' };
const G2 = '#2ef2a0';
export const traceBar = (it) => { const t = traceOf(it); return `<div class="hot-bar"><i style="width:${t}%;background:${t > 60 ? '#ff5468' : t > 30 ? '#ffb020' : G2}"></i></div>`; };
function darkMain() {
  const s = G.s;
  const tabs = `<div class="seg" style="background:#06120c">${[['goods', T('Товар', 'Товар', 'Goods')], ['orders', T('Заказы', 'Замовлення', 'Orders')], ['fence', T('Скупщик', 'Скупник', 'Fence')], ['services', T('Услуги', 'Послуги', 'Services')]].map(([k, n]) => `<button class="${D.tab === k ? 'on' : ''}" data-a="dtab" data-v="${k}">${n}</button>`).join('')}</div>`;
  const hotMine = s.inv.filter((it) => it.hot && it.hot.known && !it.listed);
  const warn = (tx) => `<div class="termbox mb"><span class="hl">&gt; tor://shadow</span><br>${tx}</div>`;
  if (D.tab === 'goods') {
    const all = darkListings();
    const list = D.f === 'all' ? all : all.filter((l) => l.kind === D.f);
    const chips = `<div class="chips mb">${[['all', '🌑', T('Всё', 'Усе', 'All')], ...Object.entries(DARK_KINDS).map(([k, d]) => [k, d.ic, L(d.n)])].map(([k, ic, n]) => `<button class="chip${D.f === k ? ' on' : ''}" style="${D.f === k ? `background:${G2};color:#03140c` : 'background:#0f2a1e;color:#9fe8c6'}" data-a="dfilt" data-v="${k}">${ic} ${esc(n)}</button>`).join('')}</div>`;
    return tabs + warn(T('Без документов, без гарантий, без возвратов. 🔥 — краденое: на нём следы, по которым полиция находит вещь. Следы можно убрать, но риск остаётся всегда. Не всё краденое помечено честно. А слишком выгодное предложение может оказаться контрольной закупкой полиции.', 'Без документів, без гарантій, без повернень. 🔥 — крадене: на ньому сліди, за якими поліція знаходить річ. Сліди можна прибрати, але ризик лишається завжди. Не все крадене позначено чесно. А надто вигідна пропозиція може виявитися контрольною закупівлею поліції.', 'No papers, no guarantees, no refunds. 🔥 = stolen: it carries traces the police follow. Traces can be wiped, but the risk never fully goes. Not every stolen item is labelled honestly. And a deal that looks too good may be a police sting.')) + chips
      + (list.length ? `<div class="tiles">${list.map((l) => { const it = l.item, k = DARK_KINDS[l.kind]; const hot = l.kind === 'hot'; return `<div class="tile dk-tile ${hot ? 'dk-hot' : ''}" data-key="${l.id}"><div class="img">${img(it, { lite: true })}<span class="dk-kind">${k.ic} ${esc(L(k.n))}</span>${hot ? '<span class="dk-wanted">В РОЗЫСКЕ</span>' : ''}</div><div class="pr" style="color:${G2}">${fmt(l.price)}</div><div class="nm">${esc(itemTitle(it))}</div><div class="ct">@${esc(l.seller)} · ${esc(itemSub(it))}</div>${hot ? `<div class="dk-marks">${it.hot.marks.map((m) => `<span title="${esc(L(MARKS[m].n))}">${MARKS[m].ic}</span>`).join('')}<small>${T('след', 'слід', 'trace')} ${traceOf(it)}%</small></div>${traceBar(it)}` : ''}<button class="btn xs mt" style="background:#0f2a1e;color:${G2}" data-a="dbuy" data-v="${l.id}">${T('Купить', 'Купити', 'Buy')}</button></div>`; }).join('')}</div>` : empty('box', T('Пусто', 'Порожньо', 'Empty'), T('Новая партия через пару часов.', 'Нова партія за пару годин.', 'New batch in a couple of hours.')))
      + `<div class="small m mt c">⏳ ${T('Новая партия через', 'Нова партія через', 'New batch in')} <span data-cd="${s.dark?.at || s.t}"></span></div>`;
  }
  if (D.tab === 'orders') {
    const os = darkOrders();
    return tabs + warn(T('Заказчики не спрашивают, откуда вещь, и не проверяют её по базам: краденое уходит без риска. Платят меньше рынка.', 'Замовники не питають, звідки річ, і не перевіряють її за базами: крадене йде без ризику. Платять менше за ринок.', 'Buyers here don’t ask where it came from and don’t run checks: hot goods go with no risk. They pay below market.'))
      + (os.length ? os.map((o) => { const fit = s.inv.filter((it) => it.cat === o.cat && !it.listed && !it.shop); return `<div class="card dk-card"><div class="row between"><b>${esc(o.who)}</b><span class="small m">⏳ <span data-cd="${o.until}"></span></span></div><div class="small">${T('Ищу', 'Шукаю', 'Looking for')}: ${CATS[o.cat].icon} ${esc(L(CATS[o.cat].name))} · ${T('плачу', 'плачу', 'paying')} ${Math.round(o.k * 100)}% ${T('от рынка', 'від ринку', 'of market')}</div>${fit.length ? fit.slice(0, 4).map((it) => `<div class="row between mt"><span class="small">${it.hot?.known ? '🔥 ' : ''}${esc(itemTitle(it))}</span><button class="btn xs dark" data-a="dorder" data-v="${o.id}" data-w="${it.id}">${fmt(orderPay(o, it))}</button></div>`).join('') : `<div class="small m mt">${T('На складе нет подходящего.', 'На складі немає відповідного.', 'Nothing suitable in storage.')}</div>`}</div>`; }).join('') : empty('box', T('Заказов пока нет', 'Замовлень поки немає', 'No orders yet')))
      + `<div class="small m mt c">⏳ ${T('Новые заказы через', 'Нові замовлення через', 'New orders in')} <span data-cd="${(Math.floor(s.t / 240) + 1) * 240}"></span></div>`;
  }
  if (D.tab === 'fence') {
    return tabs + warn(T('Скупщик берёт любое краденое сразу и без вопросов. После него вещь уже не ваша проблема — полиция до вас не дойдёт. Но платит копейки.', 'Скупник бере будь‑яке крадене одразу й без питань. Після нього річ уже не ваша проблема — поліція до вас не дійде. Але платить копійки.', 'The fence takes any stolen item right now, no questions. After that it’s not your problem — the police won’t reach you. But he pays peanuts.'))
      + (hotMine.length ? hotMine.map((it) => `<div class="list-item"><div class="th">${img(it)}</div><div class="grow"><div class="t">🔥 ${esc(itemTitle(it))}</div><div class="s">${T('след', 'слід', 'trace')} ${traceOf(it)}% · ${T('риск попасться', 'ризик попастися', 'risk of getting caught')} ~${Math.round(riskOf(it) * 100)}%</div></div><button class="btn xs" style="background:#0f2a1e;color:${G2}" data-a="dfence" data-v="${it.id}">${fmt(fenceOffer(it))}</button></div>`).join('') : empty('box', T('Краденого на складе нет', 'Краденого на складі немає', 'No stolen goods in storage')));
  }
  const locked = s.inv.filter((it) => ['icloud', 'blacklist'].includes(it.lock));
  const nodocs = s.inv.filter((it) => !it.docs && !it.listed && ['watches', 'bags', 'jewelry', 'electronics', 'phones', 'sneakers'].includes(it.cat)).slice(0, 5);
  return tabs + warn(T('Услуги «мастеров». Платите вперёд — иногда «мастер» исчезает с деньгами.', 'Послуги «майстрів». Платите наперед — іноді «майстер» зникає з грошима.', 'Services by “masters”. Pay upfront — sometimes the guy vanishes with the money.'))
    + `<div class="card dk-card"><b>🧽 ${T('Чистка следов на краденом', 'Чистка слідів на краденому', 'Wiping traces on stolen goods')}</b><div class="small m">${T('Перебить IMEI, номер рамы, отвязать аккаунт, переклеить серийник — на странице вещи. Чем меньше след, тем меньше шанс, что найдут.', 'Перебити IMEI, номер рами, відвʼязати акаунт, переклеїти серійник — на сторінці речі. Що менший слід, то менший шанс, що знайдуть.', 'Re‑flash IMEI, re‑stamp numbers, unlink accounts, swap serial stickers — on the item page. Smaller trace, smaller chance they find it.')}</div>${hotMine.length ? hotMine.map((it) => `<div class="row between mt" data-a="ditem" data-v="${it.id}"><span class="small">🔥 ${esc(itemTitle(it))} · ${markLeft(it).map((m) => MARKS[m].ic).join('')}</span><span class="small" style="color:${traceOf(it) > 40 ? '#ff5468' : G2}">${traceOf(it)}% ›</span></div>`).join('') : `<div class="small m mt">${T('Краденого на складе нет.', 'Краденого на складі немає.', 'No stolen goods in storage.')}</div>`}</div>
    <div class="card dk-card"><b>🔓 ${T('Отвязка Pear ID / чистка IMEI', 'Відвʼязка Pear ID / чистка IMEI', 'Pear ID unlock / IMEI clean')}</b><div class="small m">${T('Шанс ~55%. Иногда «мастер» просто пропадает с деньгами.', 'Шанс ~55%. Іноді «майстер» просто зникає з грошима.', '~55% chance. Sometimes the “technician” just vanishes with the money.')}</div>${locked.length ? locked.map((it) => `<div class="row between mt"><span class="small">${esc(itemTitle(it))} · ${esc(lockName(it.lock))}</span><button class="btn xs dark" data-a="dunlock" data-v="${it.id}">${fmt(unlockPrice(it))}</button></div>`).join('') : `<div class="small m mt">${T('Нет телефонов с такой блокировкой.', 'Немає телефонів з таким блокуванням.', 'No phones with that lock.')}</div>`}</div>
    <div class="card dk-card"><b>🧾 ${T('Документы «под ключ»', 'Документи «під ключ»', 'Turnkey papers')}</b><div class="small m">${T('Чек, гарантийный талон и коробка — вещь дороже, у краденого след меньше. Если подлог вскроется — штраф за подделку.', 'Чек, гарантійний талон і коробка — річ дорожча, у краденого слід менший. Якщо підробку викриють — штраф.', 'A receipt, warranty card and box — the item sells higher, a stolen one gets a smaller trace. If the forgery is found — a fine.')}</div>${nodocs.length ? nodocs.map((it) => `<div class="row between mt"><span class="small">${esc(itemTitle(it))}</span><button class="btn xs dark" data-a="ddocs" data-v="${it.id}">${fmt(docsPrice(it))}</button></div>`).join('') : `<div class="small m mt">${T('Все вещи уже с документами.', 'Усі речі вже з документами.', 'Everything already has papers.')}</div>`}</div>
    <div class="card dk-card"><b>🗂 ${T('«Подчистить» личное дело', '«Підчистити» особову справу', '“Clean up” your record')}</b><div class="small m">${T('Убирают одну пометку. 60% — сделано, 25% — пропадут с деньгами, 15% — это подстава и вас берут за взятку.', 'Прибирають одну позначку. 60% — зроблено, 25% — зникнуть із грошима, 15% — це підстава і вас беруть за хабар.', 'Removes one mark. 60% done, 25% they vanish with the money, 15% it’s a sting and you’re nicked for bribery.')}</div><div class="row between mt"><span class="small">${T('Пометок', 'Позначок', 'Marks')}: ${marksCount()}</span><button class="btn xs dark" data-a="drecord" ${marksCount() ? '' : 'disabled'}>${fmt(recordWipePrice())}</button></div></div>
    <div class="card dk-card"><b>⭐ ${T('Накрутка отзывов (+3 × 5★)', 'Накрутка відгуків (+3 × 5★)', 'Review boost (+3 × 5★)')}</b><div class="small m">${T('Поддержка ловит примерно каждого третьего: отзывы удалят и дадут предупреждение.', 'Підтримка ловить приблизно кожного третього: відгуки видалять і дадуть попередження.', 'Support catches about one in three: reviews removed plus a warning.')}</div><button class="btn sm dark mt" data-a="dboost">${fmt(BOOST_PRICE)}</button></div>`;
}
export const darkApp = {
  id: 'dark', glyph: 'eye', lvl: 4, glyphColor: '#2ef2a0',
  name: ['Тень', 'Тінь', 'Shade'], colors: ['#0d1a14', '#020504'], accent: '#2ef2a0', dark: true,
  title: () => '>_ ' + T('Тень', 'Тінь', 'Shade'),
  right: () => `<span class="pill" style="background:#0f2a1e;color:#2ef2a0">${vpnActive() ? 'VPN ✓' : 'VPN ✕'}</span>`,
  views: { main: darkMain },
  actions: {
    dtab: (v) => { D.tab = v; rerender(); },
    dfilt: (v) => { D.f = v; rerender(); },
    dbuy: async (id) => { const r = darkBuy(id); if (r.sting) { sfx('lose'); toast(T(`🚔 Это была контрольная закупка! Деньги изъяты, штраф ${fmt(r.fine)}`, `🚔 Це була контрольна закупівля! Гроші вилучено, штраф ${fmt(r.fine)}`, `🚔 It was a police sting! Money seized, fine ${fmt(r.fine)}`), 'r'); rerender(); return; } if (r.ok) { sfx('cash'); toast(r.hot ? T('Куплено. На вещи следы — уберите их или сбудьте побыстрее.', 'Куплено. На речі сліди — приберіть їх або збудьте швидше.', 'Bought. It carries traces — wipe them or move it fast.') : T('Куплено. Лучше не задавать вопросов.', 'Куплено. Краще не ставити питань.', 'Bought. Best not to ask questions.'), r.hot ? 'r' : 'g'); } else if (r.msg) toast(r.msg, 'r'); rerender(); },
    ditem: (id) => openApp('inventory', 'item', { id }),
    dfence: async (id) => { const it = getItem(id); if (!it) return; if (!(await confirmBox(T('Отдать скупщику?', 'Віддати скупнику?', 'Sell to the fence?'), `${esc(itemTitle(it))} → ${fmt(fenceOffer(it))}`, T('Отдать', 'Віддати', 'Sell')))) return; const r = fenceSell(id); if (r.ok) { sfx('cash'); toast(T(`+${fmt(r.pay)} · вещь ушла без следа`, `+${fmt(r.pay)} · річ пішла без сліду`, `+${fmt(r.pay)} · gone without a trace`), 'g'); } rerender(); },
    dorder: async (oid, el) => { const id = el?.dataset?.w; const it = getItem(id); if (!it) return; if (!(await confirmBox(T('Отдать заказчику?', 'Віддати замовнику?', 'Hand it over?'), esc(itemTitle(it)), T('Отдать', 'Віддати', 'Hand over')))) return; const r = fillOrder(oid, id); if (r.ok) { sfx('cash'); toast(`+${fmt(r.pay)}`, 'g'); } else toast('—', 'r'); rerender(); },
    ddocs: (id) => { const r = fakeDocs(id); if (r.ok) { sfx('ok'); toast(T('Документы готовы', 'Документи готові', 'Papers ready'), 'g'); } else if (r.msg) toast(r.msg, 'r'); rerender(); },
    drecord: async () => { if (!(await confirmBox(T('Подчистить личное дело?', 'Підчистити особову справу?', 'Clean up your record?'), T('Риск: могут взять за взятку.', 'Ризик: можуть узяти за хабар.', 'Risk: it may be a sting.'), fmt(recordWipePrice())))) return; const r = wipeRecord(); if (!r.ok) return toast(r.msg || '—', 'r'); sfx(r.res === 'done' ? 'win' : 'lose'); toast(r.res === 'done' ? T('Одна пометка исчезла из дела', 'Одна позначка зникла зі справи', 'One mark is gone') : r.res === 'scam' ? T('«Знакомый в полиции» пропал с деньгами', '«Знайомий у поліції» зник із грошима', 'The “police contact” vanished with the money') : T('Подстава! Вас задержали за взятку', 'Підстава! Вас затримали за хабар', 'A sting! Arrested for bribery'), r.res === 'done' ? 'g' : 'r'); rerender(); },
    dunlock: (id) => { const r = darkUnlock(id); if (!r.ok) return toast(r.msg || '—', 'r'); sfx(r.res === 'done' ? 'win' : 'lose'); toast(r.res === 'done' ? T('Блокировка снята', 'Блокування знято', 'Unlocked') : r.res === 'fail' ? T('Не вышло, вернули половину', 'Не вийшло, повернули половину', 'Failed, half refunded') : T('Мастер пропал с деньгами', 'Майстер зник із грошима', 'The guy vanished with the money'), r.res === 'done' ? 'g' : 'r'); rerender(); },
    dboost: () => { const r = darkBoost(); if (!r.ok) return toast(r.msg || '—', 'r'); sfx(r.caught ? 'lose' : 'win'); toast(r.caught ? T('Поддержка заметила накрутку: предупреждение', 'Підтримка помітила накрутку: попередження', 'Support caught the boost: warning') : T('+3 отзыва ★★★★★', '+3 відгуки ★★★★★', '+3 reviews ★★★★★'), r.caught ? 'r' : 'g'); rerender(); },
  },
};
