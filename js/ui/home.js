// Home screen like an iPhone: swipeable pages, widgets in three sizes, every installed app placed on a page,
// long press = edit mode: drag icons and widgets between pages and in/out of the dock, add/remove widgets,
// change the wallpaper, uninstall apps. Everything else comes from the App Store.
import { G, emit } from '../core/state.js';
import { T, L, clockDur, fmtDate } from '../core/i18n.js';
import { esc, clamp, $ } from '../core/util.js';
import { fmt } from '../core/money.js';
import { netWorth } from '../game/player.js';
import { isInstalled, isSystem, vpnActive } from '../game/phone.js';
import { APP_META } from '../data/appmeta.js';
import { feedFor } from '../game/market.js';
import { itemTitle } from '../game/items.js';
import { ensureDaily, questProgress, questText } from '../game/quests.js';
import { jobById } from '../game/jobs.js';
import { itemSVG } from './art.js';
import { morphHTML } from './morph.js';
import { UI, iconHTML, gameClock, gameDate, dayNum, sheet, resolveSheet, confirmBox, toast, appName } from './shell.js';
import { CITY } from '../data/world.js';
import { icon } from './icons.js';

const ROWS = 6, COLS = 4;
const CELLS = { s: 4, m: 8, l: 16 };
export const HOME = { edit: false, page: 0 };

const W = (name, sizes, app, render) => ({ name, sizes, app, render });
export const WIDGETS = {
  clock: W(['Часы', 'Годинник', 'Clock'], ['s', 'm'], null, (sz) => {
    const s = G.s;
    return `<div class="wc-time">${gameClock()}</div><div class="wc-date">${esc(fmtDate(gameDate()))}</div><div class="wc-day">${T('День', 'День', 'Day')} ${dayNum()}${sz === 'm' ? ` · ${esc(L(cityName()))}` : ''}</div>${sz === 'm' ? `<div class="wc-money">${T('баланс', 'баланс', 'balance')} <b data-live="money">${fmt(s.money)}</b></div>` : ''}`;
  }),
  log: W(['Журнал событий', 'Журнал подій', 'Event log'], ['m', 'l'], 'news', (sz) => {
    const n = sz === 'l' ? 11 : 4;
    const lines = G.s.log.slice(-n).map((l) => `<div class="tl"><span class="tg">[${esc(l.tag)}]</span> ${esc(l.text)}</div>`).join('') || `<div class="tl">&gt; ${T('система готова', 'система готова', 'system ready')}</div>`;
    return `${lines}<div class="tl">&gt; <span class="cur"></span></div>`;
  }),
  needs: W(['Состояние', 'Стан', 'Status'], ['s', 'm'], 'profile', (sz) => {
    const s = G.s;
    const lvlP = Math.round((s.xp / (60 * Math.pow(s.level, 1.75))) * 100);
    const row = (ic, label, v, live, col) => `<div class="wn"><span>${ic}${sz === 'm' ? ' ' + label : ''}</span><b ${live ? `data-live="${live}"` : ''}>${v}</b><div class="bar"><i ${live ? `data-live="${live}bar"` : ''} style="width:${clamp(+v || 0, 0, 100)}%;background:${col}"></i></div></div>`;
    return row('⚡', T('Энергия', 'Енергія', 'Energy'), Math.round(s.energy), 'energy', s.energy < 25 ? 'var(--red)' : 'var(--acc)') + row('🍔', T('Сытость', 'Ситість', 'Food'), Math.round(s.food), 'food', s.food < 25 ? 'var(--red)' : 'var(--yel)') + `<div class="wn"><span>★${sz === 'm' ? ' ' + T('Уровень', 'Рівень', 'Level') : ''}</span><b>${s.level}</b><div class="bar"><i style="width:${lvlP}%;background:var(--acc2)"></i></div></div>`;
  }),
  money: W(['Баланс', 'Баланс', 'Balance'], ['s', 'm'], 'bank', (sz) => `<small>${T('на карте', 'на картці', 'on card')}</small><b class="wm" data-live="money">${fmt(G.s.money)}</b><small>${T('капитал', 'капітал', 'net worth')} <span data-live="worth">${fmt(netWorth(), { short: true })}</span></small>${sz === 'm' ? `<div class="wtiny">${(G.s.bank?.hist || []).slice(0, 2).map((h) => `${esc(h.note || h.kind)} <b class="${h.amt >= 0 ? 'g' : 'r'}">${h.amt >= 0 ? '+' : ''}${fmt(h.amt)}</b>`).join('<br>')}</div>` : ''}`),
  market: W(['Свежие объявления', 'Свіжі оголошення', 'Fresh listings'], ['m', 'l'], 'market', (sz) => {
    const f = (feedFor().items || []).filter((l) => !l.sold).slice(0, sz === 'l' ? 4 : 2);
    return `<div class="wl ${sz}">${f.map((l) => `<div class="wli"><div class="th">${itemSVG(l.item, { lite: true })}</div><b>${fmt(l.price)}</b><span>${esc(itemTitle(l.item))}</span></div>`).join('')}</div>`;
  }),
  deliveries: W(['Посылки', 'Посилки', 'Parcels'], ['s', 'm'], 'delivery', (sz) => {
    const d = G.s.deliveries.slice().sort((a, b) => a.eta - b.eta);
    if (!d.length) return `<div class="wbig">📦</div><small>${T('Посылок нет', 'Посилок немає', 'No parcels')}</small>`;
    return `<div class="wbig">📦 ${d.length}</div>${d.slice(0, sz === 'm' ? 3 : 1).map((x) => `<small>${x.kind === 'out' ? '📤' : '📥'} <span data-cd="${x.eta}"></span> · ${esc((x.title || (x.item ? itemTitle(x.item) : '')).slice(0, 22))}</small>`).join('')}`;
  }),
  jobs: W(['Работа', 'Робота', 'Work'], ['s', 'm'], 'jobs', (sz) => {
    const j = G.s.job;
    const pend = j.apps.filter((a) => a.st === 'sent');
    const cur = j.cur ? jobById(j.cur) : null;
    let h = cur ? `<div class="wbig">${cur.icon}</div><small>${esc(L(cur.n))}</small><small>${j.next > G.s.t ? `${T('смена через', 'зміна через', 'next shift in')} <span data-cd="${j.next}"></span>` : T('можно на смену', 'можна на зміну', 'shift available')}</small>` : `<div class="wbig">💼</div><small>${T('Без работы', 'Без роботи', 'Unemployed')}</small>`;
    if (pend.length) h += `<small>📄 ${T('ответ через', 'відповідь через', 'reply in')} <span data-cd="${pend[0].respond}"></span>${sz === 'm' && pend.length > 1 ? ` (+${pend.length - 1})` : ''}</small>`;
    return h;
  }),
  quests: W(['Задания', 'Завдання', 'Quests'], ['m'], 'quests', () => ensureDaily().slice(0, 3).map((q) => { const p = Math.min(1, questProgress(q) / q.target); return `<div class="wq"><span>${q.done ? '✅' : '▫️'} ${esc(questText(q))}</span><div class="bar"><i style="width:${Math.round(p * 100)}%;background:var(--yel)"></i></div></div>`; }).join('')),
  chats: W(['Сообщения', 'Повідомлення', 'Messages'], ['s'], 'market', () => {
    const open = G.s.chats.filter((c) => c.unread && c.st !== 'closed');
    const last = open[0];
    return `<div class="wbig">💬 ${open.length}</div><small>${last ? esc(`${last.npc.name}: ${last.msgs[last.msgs.length - 1]?.tx || ''}`.slice(0, 44)) : T('Новых нет', 'Нових немає', 'Nothing new')}</small>`;
  }),
  repair: W(['Мастерская', 'Майстерня', 'Workshop'], ['s'], 'repair', () => {
    const r = G.s.repairs[0];
    return `<div class="wbig">🛠 ${G.s.repairs.length}</div><small>${r ? `<span data-cd="${r.done}"></span>` : T('Свободно', 'Вільно', 'Idle')}</small>`;
  }),
  vpn: W(['VPN', 'VPN', 'VPN'], ['s'], 'vpn', () => `<div class="wbig">${vpnActive() ? '🛡' : '⚠️'}</div><small>${vpnActive() ? T('Защищено', 'Захищено', 'Protected') : T('Не защищено', 'Не захищено', 'Unprotected')}</small>${vpnActive() ? `<small><span data-cd="${G.s.vpn.until}" data-fmt="long"></span></small>` : ''}`),
};
const cityName = () => CITY[G.s.player.city]?.name || ['', '', ''];
export const widgetAvailable = (k) => !WIDGETS[k].app || isInstalled(WIDGETS[k].app);

// ---------------------------------------------------------------- layout: explicit order like on an iPhone
// s.home.lay = { pages: [[key…]…], dock: [appId…] }, key = 'a:<appId>' | 'w:<widgetId>'
const DOCK_PREF = ['market', 'bank', 'inventory', 'jobs', 'map', 'appstore', 'profile', 'settings'];
const CAP = ROWS * COLS;
const cellsOf = (key) => { if (key.startsWith('a:')) return 1; const w = G.s.home.widgets.find((x) => 'w:' + x.id === key); return w ? CELLS[w.size] : 0; };
const validApp = (id) => !!UI.apps[id] && !UI.apps[id].hidden && isInstalled(id);
export function syncLayout() {
  const s = G.s, h = s.home;
  const apps = (s.installed || []).filter(validApp);
  const wids = h.widgets.filter((w) => WIDGETS[w.k] && widgetAvailable(w.k));
  if (!h.lay) {
    const dock = DOCK_PREF.filter((id) => apps.includes(id)).slice(0, 4);
    const pages = [];
    for (const w of wids) (pages[w.page || 0] ||= []).push('w:' + w.id);
    for (let i = 0; i < pages.length; i++) pages[i] ||= [];
    if (!pages.length) pages.push([]);
    for (const id of apps) if (!dock.includes(id)) pages[pages.length - 1].push('a:' + id);
    h.lay = { pages, dock };
  }
  const L2 = h.lay;
  const ok = (k) => (k.startsWith('a:') ? apps.includes(k.slice(2)) : wids.some((w) => 'w:' + w.id === k));
  L2.dock = L2.dock.filter((id) => apps.includes(id)).slice(0, 4);
  L2.pages = L2.pages.map((pg) => pg.filter((k, i, arr) => ok(k) && arr.indexOf(k) === i && !(k.startsWith('a:') && L2.dock.includes(k.slice(2)))));
  const placed = new Set([...L2.pages.flat(), ...L2.dock.map((id) => 'a:' + id)]);
  // newly installed apps and new widgets go to the first free spot from the end
  for (const w of wids) if (!placed.has('w:' + w.id)) { const pg = L2.pages[Math.min(HOME.page, L2.pages.length - 1)] || (L2.pages[0] ||= []); pg.unshift('w:' + w.id); }
  for (const id of apps) if (!placed.has('a:' + id)) { if (!L2.pages.length) L2.pages.push([]); L2.pages[L2.pages.length - 1].push('a:' + id); }
  // overflow → next page
  for (let i = 0; i < L2.pages.length; i++) {
    let used = 0; const keep = [], spill = [];
    for (const k of L2.pages[i]) { const c = cellsOf(k); if (used + c <= CAP) { keep.push(k); used += c; } else spill.push(k); }
    L2.pages[i] = keep;
    if (spill.length) (L2.pages[i + 1] ||= []).unshift(...spill);
  }
  while (L2.pages.length > 1 && !L2.pages[L2.pages.length - 1].length && HOME.page < L2.pages.length - 1) L2.pages.pop();
  if (!L2.pages.length) L2.pages.push([]);
  return L2;
}
export const dockApps = () => (G.s?.home?.lay ? G.s.home.lay.dock : DOCK_PREF.filter((id) => isInstalled(id) && UI.apps[id]).slice(0, 4));
function widgetHTML(w) {
  const def = WIDGETS[w.k];
  let inner = '';
  try { inner = def.render(w.size); } catch (e) { console.error('widget', w.k, e); }
  const open = def.app && !HOME.edit ? `data-a="open" data-v="${def.app}"` : '';
  return `<div class="wdg wdg-${w.k} ${w.size}" data-key="${w.id}" data-hk="w:${w.id}" ${open}>${HOME.edit ? `<button class="wx" data-a="homeDelW" data-v="${w.id}">−</button>` : ''}<div class="wbody">${inner}</div><div class="wname">${esc(L(def.name))}</div></div>`;
}
const appIcon = (id, dock) => iconHTML(UI.apps[id], dock, HOME.edit && !isSystem(id)).replace('<button class="ic', `<button data-hk="a:${id}" class="ic`);
// wallpapers
export const WALLS = {
  hacker: { n: ['Хакер', 'Хакер', 'Hacker'], css: 'radial-gradient(520px 380px at 12% 8%, rgba(255,138,61,.28), transparent 60%), radial-gradient(520px 520px at 100% 40%, rgba(139,92,255,.32), transparent 60%), radial-gradient(600px 500px at 30% 100%, rgba(42,99,255,.35), transparent 60%), linear-gradient(180deg, #0c0f1c, #160f2c 50%, #0b1230)', grid: true },
  aurora: { n: ['Северное сияние', 'Північне сяйво', 'Aurora'], css: 'radial-gradient(700px 400px at 20% 20%, rgba(46,242,160,.45), transparent 60%), radial-gradient(600px 500px at 90% 30%, rgba(77,163,255,.45), transparent 60%), radial-gradient(500px 400px at 50% 90%, rgba(139,92,255,.5), transparent 60%), linear-gradient(180deg, #03141a, #071029 60%, #0e0a24)' },
  sunset: { n: ['Закат', 'Захід сонця', 'Sunset'], css: 'linear-gradient(180deg, #2b1055 0%, #7b2869 35%, #d5486a 60%, #f78f48 80%, #fbc96b 100%)' },
  ocean: { n: ['Океан', 'Океан', 'Ocean'], css: 'radial-gradient(800px 500px at 50% 0%, rgba(110,200,255,.55), transparent 60%), linear-gradient(180deg, #0a4d8c, #063767 50%, #021c38)' },
  forest: { n: ['Лес', 'Ліс', 'Forest'], css: 'radial-gradient(600px 500px at 30% 10%, rgba(180,230,140,.35), transparent 60%), linear-gradient(180deg, #1f4a2c, #12301d 55%, #081a10)' },
  graphite: { n: ['Графит', 'Графіт', 'Graphite'], css: 'radial-gradient(600px 500px at 50% 0%, #3a3d45, transparent 70%), linear-gradient(180deg, #24262c, #111214)' },
  dune: { n: ['Дюны', 'Дюни', 'Dunes'], css: 'linear-gradient(170deg, #f3d9b1 0%, #e0a96d 40%, #b8693f 70%, #6b3a26 100%)' },
  candy: { n: ['Конфета', 'Цукерка', 'Candy'], css: 'radial-gradient(500px 400px at 20% 20%, #ff9ad5, transparent 60%), radial-gradient(500px 500px at 80% 70%, #8fd3ff, transparent 60%), linear-gradient(160deg, #ffb3c7, #c5a3ff)' },
  neon: { n: ['Неон', 'Неон', 'Neon'], css: 'radial-gradient(400px 300px at 0% 30%, rgba(255,0,153,.55), transparent 60%), radial-gradient(400px 300px at 100% 70%, rgba(0,229,255,.55), transparent 60%), linear-gradient(180deg, #07010f, #10031f)' },
  mono: { n: ['Чёрный', 'Чорний', 'Black'], css: '#000' },
  space: { n: ['Космос', 'Космос', 'Space'], css: 'radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 20%, #fff, transparent), radial-gradient(1.5px 1.5px at 40% 70%, #fff, transparent), radial-gradient(1px 1px at 85% 60%, #fff, transparent), radial-gradient(1px 1px at 10% 85%, #fff, transparent), radial-gradient(600px 400px at 70% 80%, rgba(120,60,255,.45), transparent 60%), linear-gradient(180deg, #02030a, #0a0820)' },
  mint: { n: ['Мята', 'Мʼята', 'Mint'], css: 'linear-gradient(160deg, #b8f5e0, #5fd3b3 50%, #1f8f7a)' },
  p_city: { n: ['Ночной город', 'Нічне місто', 'City at night'], css: 'linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.28)), url(assets/walls/city.jpg) center / cover no-repeat' },
  p_mountains: { n: ['Горное озеро', 'Гірське озеро', 'Mountain lake'], css: 'linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.28)), url(assets/walls/mountains.jpg) center / cover no-repeat' },
  p_tokyo: { n: ['Неоновая улица', 'Неонова вулиця', 'Neon street'], css: 'linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.28)), url(assets/walls/tokyo.jpg) center / cover no-repeat' },
  p_waves: { n: ['Океан сверху', 'Океан згори', 'Ocean from above'], css: 'linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.28)), url(assets/walls/waves.jpg) center / cover no-repeat' },
  p_fog: { n: ['Туманный лес', 'Туманний ліс', 'Foggy forest'], css: 'linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.28)), url(assets/walls/fog.jpg) center / cover no-repeat' },
  p_dunes: { n: ['Пустыня', 'Пустеля', 'Desert'], css: 'linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.28)), url(assets/walls/dunes.jpg) center / cover no-repeat' },
  p_aurora2: { n: ['Сияние в горах', 'Сяйво в горах', 'Aurora peaks'], css: 'linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.28)), url(assets/walls/aurora2.jpg) center / cover no-repeat' },
  p_liquid: { n: ['Жидкое стекло', 'Рідке скло', 'Liquid glass'], css: 'linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.28)), url(assets/walls/liquid.jpg) center / cover no-repeat' },
};
function applyWall() {
  const w = WALLS[G.s.home.wall] || WALLS.hacker;
  const home = $('#home');
  if (home._wall === w) return;
  home._wall = w;
  home.style.background = w.css;
  home.classList.toggle('nogrid', !w.grid);
}
export function renderHomeScreen() {
  const s = G.s; if (!s) return;
  const lay = syncLayout();
  applyWall();
  const html = lay.pages.map((pg, i) => `<div class="hpage" data-key="p${i}" data-page="${i}"><div class="hgrid">${pg.map((k) => { if (k.startsWith('a:')) return appIcon(k.slice(2), false); const w = s.home.widgets.find((x) => 'w:' + x.id === k); return w ? widgetHTML(w) : ''; }).join('')}</div></div>`).join('');
  const home = $('#home');
  home.classList.toggle('editing', HOME.edit);
  morphHTML(home, html);
  const dots = lay.pages.length > 1 ? `<div class="pdots">${lay.pages.map((_, i) => `<i class="${i === HOME.page ? 'on' : ''}" data-a="homePage" data-v="${i}"></i>`).join('')}</div>` : '';
  const bar = HOME.edit ? `<div class="hedit"><button data-a="homeAddW">＋ ${T('Виджет', 'Віджет', 'Widget')}</button><button data-a="homeWall">🖼 ${T('Обои', 'Шпалери', 'Wallpaper')}</button><button data-a="homeDone" class="on">${T('Готово', 'Готово', 'Done')}</button></div>` : '';
  $('#dockbar').classList.toggle('editing', HOME.edit);
  morphHTML($('#dockbar'), `${bar}${dots}<div class="dock" data-dock="1">${lay.dock.map((id) => appIcon(id, true)).join('')}${HOME.edit && lay.dock.length < 4 ? '<i class="dslot"></i>'.repeat(4 - lay.dock.length) : ''}</div>`);
}

// ---------------------------------------------------------------- interactions
function moveKey(key, toPage, before) {
  const lay = G.s.home.lay;
  const isApp = key.startsWith('a:');
  lay.pages = lay.pages.map((pg) => pg.filter((k) => k !== key));
  if (isApp) lay.dock = lay.dock.filter((id) => 'a:' + id !== key);
  if (toPage === 'dock') {
    if (!isApp) return false;
    let i = before ? lay.dock.indexOf(before.slice(2)) : lay.dock.length;
    if (i < 0) i = lay.dock.length;
    lay.dock.splice(i, 0, key.slice(2));
    while (lay.dock.length > 4) { const out = lay.dock.splice(i === 4 ? 3 : 4, 1)[0]; (lay.pages[HOME.page] ||= []).push('a:' + out); }
    return true;
  }
  const pg = (lay.pages[toPage] ||= []);
  let i = before ? pg.indexOf(before) : pg.length;
  if (i < 0) i = pg.length;
  pg.splice(i, 0, key);
  return true;
}
function startDrag(el, e) {
  const key = el.dataset.hk;
  const r = el.getBoundingClientRect();
  const ghost = el.cloneNode(true);
  ghost.classList.add('hghost');
  ghost.style.width = r.width + 'px'; ghost.style.height = r.height + 'px';
  document.body.appendChild(ghost);
  const dx = e.clientX - r.left, dy = e.clientY - r.top;
  const home = $('#home');
  let lastT = 0, lastTarget = '', edgeT = 0;
  const mark = () => document.querySelectorAll(`[data-hk="${CSS.escape(key)}"]`).forEach((x) => x.classList.add('dragging'));
  mark();
  const move = (ev) => {
    ghost.style.transform = `translate(${ev.clientX - dx}px, ${ev.clientY - dy}px) scale(1.08)`;
    const now = performance.now();
    const W = home.clientWidth, hr = home.getBoundingClientRect();
    // hover at the screen edge → flip the page
    const edge = ev.clientX < hr.left + 22 ? -1 : ev.clientX > hr.left + W - 22 ? 1 : 0;
    if (edge) {
      if (!edgeT) edgeT = now;
      else if (now - edgeT > 650) {
        edgeT = now;
        const np = clamp(HOME.page + edge, 0, G.s.home.lay.pages.length);
        if (np !== HOME.page) { if (moveKey(key, np, null)) { HOME.page = np; renderHomeScreen(); home.scrollTo({ left: np * W, behavior: 'smooth' }); mark(); } }
      }
      return;
    }
    edgeT = 0;
    if (now - lastT < 110) return;
    const under = document.elementFromPoint(ev.clientX, ev.clientY);
    const tgt = under?.closest('[data-hk]');
    const inDock = under?.closest('[data-dock]');
    let sig = '';
    if (inDock && key.startsWith('a:')) sig = 'dock:' + (tgt?.dataset.hk || '');
    else if (tgt && tgt.dataset.hk !== key && tgt.closest('.hpage')) sig = 'pg:' + tgt.dataset.hk + (ev.clientX > tgt.getBoundingClientRect().left + tgt.getBoundingClientRect().width / 2 ? '>' : '<');
    else if (under?.closest('.hgrid') && !tgt) sig = 'end:' + HOME.page;
    if (!sig || sig === lastTarget) return;
    lastTarget = sig; lastT = now;
    if (sig.startsWith('dock:')) moveKey(key, 'dock', tgt && tgt.closest('[data-dock]') ? tgt.dataset.hk : null);
    else if (sig.startsWith('end:')) moveKey(key, HOME.page, null);
    else {
      const t = tgt.dataset.hk, after = sig.endsWith('>');
      const pi = +tgt.closest('.hpage').dataset.page;
      const pg = G.s.home.lay.pages[pi];
      const idx = pg.indexOf(t) + (after ? 1 : 0);
      moveKey(key, pi, pg.filter((k) => k !== key)[idx - (pg.indexOf(key) >= 0 && pg.indexOf(key) < idx ? 1 : 0)] || null);
    }
    renderHomeScreen(); mark();
  };
  const up = () => {
    window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
    ghost.remove();
    document.querySelectorAll('.dragging').forEach((x) => x.classList.remove('dragging'));
    renderHomeScreen();
    emit('home');
  };
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  move(e);
}
export function initHome() {
  const home = $('#home');
  home.addEventListener('scroll', () => {
    const p = Math.round(home.scrollLeft / Math.max(1, home.clientWidth));
    if (p !== HOME.page) { HOME.page = p; for (const [i, d] of [...document.querySelectorAll('.pdots i')].entries()) d.classList.toggle('on', i === p); }
  }, { passive: true });
  // long press anywhere on the home screen = edit mode (like holding the wallpaper or an icon on an iPhone)
  let t = null, sx = 0, sy = 0;
  const cancel = () => { clearTimeout(t); t = null; };
  home.addEventListener('touchstart', (e) => { const p = e.touches[0]; sx = p.clientX; sy = p.clientY; cancel(); t = setTimeout(() => { t = null; if (!HOME.edit) { HOME.edit = true; navigator.vibrate?.(15); renderHomeScreen(); } }, 550); }, { passive: true });
  home.addEventListener('touchmove', (e) => { const p = e.touches[0]; if (Math.hypot(p.clientX - sx, p.clientY - sy) > 10) cancel(); }, { passive: true });
  home.addEventListener('touchend', cancel, { passive: true });
  home.addEventListener('contextmenu', (e) => { e.preventDefault(); HOME.edit = true; renderHomeScreen(); });
  // drag icons and widgets in edit mode — on the pages and in/out of the dock
  const down = (e) => {
    if (!HOME.edit || e.button > 0) return;
    const el = e.target.closest('[data-hk]');
    if (!el || e.target.closest('.wx')) return;
    const x0 = e.clientX, y0 = e.clientY;
    const mv = (ev) => { if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 7) { off(); startDrag(el, ev); } };
    const off = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', off); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', off);
  };
  home.addEventListener('pointerdown', down);
  $('#dockbar').addEventListener('pointerdown', down);
}
export const homeActions = {
  homeDone: () => { HOME.edit = false; renderHomeScreen(); },
  homePage: (v) => { const home = $('#home'); home.scrollTo({ left: +v * home.clientWidth, behavior: 'smooth' }); },
  homeDelW: (id, el, ev) => { ev?.stopPropagation(); G.s.home.widgets = G.s.home.widgets.filter((w) => w.id !== id); renderHomeScreen(); },
  homeUninstall: async (id, el, ev) => {
    ev?.stopPropagation();
    const a = UI.apps[id];
    if (!a || isSystem(id)) return;
    const nm = appName(a);
    if (!(await confirmBox(T(`Удалить «${nm}»?`, `Видалити «${nm}»?`, `Remove “${nm}”?`), T('Данные игры сохранятся, приложение можно скачать снова.', 'Дані гри збережуться, застосунок можна завантажити знову.', 'Your progress stays; you can download it again.'), T('Удалить', 'Видалити', 'Remove'), undefined, true))) return;
    const { uninstall } = await import('../game/phone.js');
    uninstall(id); renderHomeScreen();
  },
  homeWall: async () => {
    const cur = G.s.home.wall || 'hacker';
    const v = await sheet(`<h2>${T('Обои', 'Шпалери', 'Wallpaper')}</h2><div class="walls">${Object.entries(WALLS).map(([k, w]) => `<button class="${k === cur ? 'on' : ''}" data-a="resolve" data-v="${k}"><i style="background:${w.css}"></i><small>${esc(L(w.n))}</small></button>`).join('')}</div>`);
    if (!v) return;
    G.s.home.wall = v; renderHomeScreen();
  },
  homeAddW: async () => {
    const list = Object.entries(WIDGETS).filter(([k]) => widgetAvailable(k));
    const SZ = { s: T('Малый', 'Малий', 'Small'), m: T('Средний', 'Середній', 'Medium'), l: T('Большой', 'Великий', 'Large') };
    const v = await sheet(`<h2>${T('Добавить виджет', 'Додати віджет', 'Add a widget')}</h2><p class="p">${T('Виджеты приложений появляются после их установки. После добавления его можно перетащить.', 'Віджети застосунків зʼявляються після їх встановлення. Після додавання його можна перетягнути.', 'App widgets appear once the app is installed. Drag it anywhere after adding.')}</p><div class="wgal">${list.map(([k, d]) => `<div class="card"><b>${esc(L(d.name))}</b><div class="btns">${d.sizes.map((sz) => `<button class="btn xs dark" data-a="resolve" data-v="${k}:${sz}">${SZ[sz]}</button>`).join('')}</div></div>`).join('')}</div>`);
    if (!v) return;
    const [k, size] = v.split(':');
    G.s.home.widgets.push({ id: 'w' + Date.now().toString(36), k, size, page: HOME.page, app: WIDGETS[k].app });
    toast(T('Виджет добавлен', 'Віджет додано', 'Widget added'), 'g');
    renderHomeScreen();
  },
};
