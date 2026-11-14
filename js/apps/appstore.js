// App Store, VPN and the shadow market.
import { G } from '../core/state.js';
import { T, L, clockDur, dur } from '../core/i18n.js';
import { esc } from '../core/util.js';
import { fmt } from '../core/money.js';
import { icon } from '../ui/icons.js';
import { go, rerender, toast, confirmBox, openApp, UI, appName, renderHome, choose } from '../ui/shell.js';
import { img, empty } from '../ui/comp.js';
import { APP_META, APP_CATS } from '../data/appmeta.js';
import { isInstalled, isSystem, downloading, dlProgress, startDownload, uninstall, vpnActive, VPN_PLANS, buyVpn, toggleVpn, darkListings, darkBuy, darkUnlock, unlockPrice, darkBoost, BOOST_PRICE } from '../game/phone.js';
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
const D = { tab: 'goods' };
function darkMain() {
  const s = G.s;
  const tabs = `<div class="seg" style="background:#06120c">${[['goods', T('Товар', 'Товар', 'Goods')], ['services', T('Услуги', 'Послуги', 'Services')]].map(([k, n]) => `<button class="${D.tab === k ? 'on' : ''}" data-a="dtab" data-v="${k}">${n}</button>`).join('')}</div>`;
  const warn = `<div class="termbox mb"><span class="hl">&gt; tor://shadow</span><br>${T('Без документов, без гарантий, без возвратов. Часть товара краденая — полиция находит её через несколько дней: изъятие и штраф.', 'Без документів, без гарантій, без повернень. Частина товару крадена — поліція знаходить її за кілька днів: вилучення і штраф.', 'No papers, no guarantees, no refunds. Some goods are stolen — police trace them within days: seizure and a fine.')}</div>`;
  if (D.tab === 'goods') {
    const list = darkListings();
    return tabs + warn + (list.length ? `<div class="tiles">${list.map((l) => `<div class="tile" data-key="${l.id}"><div class="img">${img(l.item, { lite: true })}</div><div class="pr" style="color:#2ef2a0">${fmt(l.price)}</div><div class="nm">${esc(itemTitle(l.item))}</div><div class="ct">@${esc(l.seller)} · ${esc(itemSub(l.item))}</div><button class="btn xs mt" style="background:#0f2a1e;color:#2ef2a0" data-a="dbuy" data-v="${l.id}">${T('Купить', 'Купити', 'Buy')}</button></div>`).join('')}</div>` : empty('box', T('Пусто', 'Порожньо', 'Empty'), T('Новая партия через пару часов.', 'Нова партія за пару годин.', 'New batch in a couple of hours.')));
  }
  const locked = s.inv.filter((it) => ['icloud', 'blacklist'].includes(it.lock));
  return tabs + warn + `<div class="card" style="border-color:#1d3a2e"><b>🔓 ${T('Отвязка Pear ID / чистка IMEI', 'Відвʼязка Pear ID / чистка IMEI', 'Pear ID unlock / IMEI clean')}</b><div class="small m">${T('Шанс ~55%. Иногда «мастер» просто пропадает с деньгами.', 'Шанс ~55%. Іноді «майстер» просто зникає з грошима.', '~55% chance. Sometimes the “technician” just vanishes with the money.')}</div>${locked.length ? locked.map((it) => `<div class="row between mt"><span class="small">${esc(itemTitle(it))} · ${esc(lockName(it.lock))}</span><button class="btn xs dark" data-a="dunlock" data-v="${it.id}">${fmt(unlockPrice(it))}</button></div>`).join('') : `<div class="small m mt">${T('Нет телефонов с такой блокировкой.', 'Немає телефонів з таким блокуванням.', 'No phones with that lock.')}</div>`}</div>
    <div class="card" style="border-color:#1d3a2e"><b>⭐ ${T('Накрутка отзывов (+3 × 5★)', 'Накрутка відгуків (+3 × 5★)', 'Review boost (+3 × 5★)')}</b><div class="small m">${T('Поддержка ловит примерно каждого третьего: отзывы удалят и дадут предупреждение.', 'Підтримка ловить приблизно кожного третього: відгуки видалять і дадуть попередження.', 'Support catches about one in three: reviews removed plus a warning.')}</div><button class="btn sm dark mt" data-a="dboost">${fmt(BOOST_PRICE)}</button></div>`;
}
export const darkApp = {
  id: 'dark', glyph: 'eye', lvl: 4, glyphColor: '#2ef2a0',
  name: ['Тень', 'Тінь', 'Shade'], colors: ['#0d1a14', '#020504'], accent: '#2ef2a0', dark: true,
  title: () => '>_ ' + T('Тень', 'Тінь', 'Shade'),
  right: () => `<span class="pill" style="background:#0f2a1e;color:#2ef2a0">${vpnActive() ? 'VPN ✓' : 'VPN ✕'}</span>`,
  views: { main: darkMain },
  actions: {
    dtab: (v) => { D.tab = v; rerender(); },
    dbuy: async (id) => { const r = darkBuy(id); if (r.ok) { sfx('cash'); toast(T('Куплено. Лучше не задавать вопросов.', 'Куплено. Краще не ставити питань.', 'Bought. Best not to ask questions.'), 'g'); } else if (r.msg) toast(r.msg, 'r'); rerender(); },
    dunlock: (id) => { const r = darkUnlock(id); if (!r.ok) return toast(r.msg || '—', 'r'); sfx(r.res === 'done' ? 'win' : 'lose'); toast(r.res === 'done' ? T('Блокировка снята', 'Блокування знято', 'Unlocked') : r.res === 'fail' ? T('Не вышло, вернули половину', 'Не вийшло, повернули половину', 'Failed, half refunded') : T('Мастер пропал с деньгами', 'Майстер зник із грошима', 'The guy vanished with the money'), r.res === 'done' ? 'g' : 'r'); rerender(); },
    dboost: () => { const r = darkBoost(); if (!r.ok) return toast(r.msg || '—', 'r'); sfx(r.caught ? 'lose' : 'win'); toast(r.caught ? T('Поддержка заметила накрутку: предупреждение', 'Підтримка помітила накрутку: попередження', 'Support caught the boost: warning') : T('+3 отзыва ★★★★★', '+3 відгуки ★★★★★', '+3 reviews ★★★★★'), r.caught ? 'r' : 'g'); rerender(); },
  },
};
