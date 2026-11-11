// Home screen: swipeable pages (scroll-snap), widgets in three sizes, edit mode (long press) to add/remove
// widgets and uninstall apps. Only installed apps are shown; everything else comes from the App Store.
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

// dock: the first four installed of these
const DOCK_PREF = ['market', 'bank', 'inventory', 'jobs', 'map', 'appstore', 'profile', 'settings'];
export const dockApps = () => DOCK_PREF.filter((id) => isInstalled(id) && UI.apps[id]).slice(0, 4);

function layout() {
  const s = G.s;
  const dock = dockApps();
  const apps = s.installed.filter((id) => UI.apps[id] && !dock.includes(id) && !UI.apps[id].hidden);
  const widgets = s.home.widgets.filter((w) => WIDGETS[w.k] && widgetAvailable(w.k));
  const pages = [];
  let ai = 0;
  const maxPage = Math.max(0, ...widgets.map((w) => w.page));
  for (let p = 0; p <= maxPage || ai < apps.length; p++) {
    let free = ROWS * COLS;
    const ws = [];
    for (const w of widgets.filter((x) => x.page === p)) { if (CELLS[w.size] <= free) { ws.push(w); free -= CELLS[w.size]; } else w.page = p + 1; }
    const icons = [];
    while (free > 0 && ai < apps.length) { icons.push(apps[ai++]); free--; }
    pages.push({ ws, icons });
    if (p > 20) break;
  }
  return { pages, dock };
}
function widgetHTML(w) {
  const def = WIDGETS[w.k];
  let inner = '';
  try { inner = def.render(w.size); } catch (e) { console.error('widget', w.k, e); }
  const open = def.app && !HOME.edit ? `data-a="open" data-v="${def.app}"` : '';
  return `<div class="wdg wdg-${w.k} ${w.size}" data-key="${w.id}" ${open}>${HOME.edit ? `<button class="wx" data-a="homeDelW" data-v="${w.id}">−</button>` : ''}<div class="wbody">${inner}</div><div class="wname">${esc(L(def.name))}</div></div>`;
}
export function renderHomeScreen() {
  const s = G.s; if (!s) return;
  const { pages, dock } = layout();
  const html = pages.map((pg, i) => `<div class="hpage" data-key="p${i}"><div class="hgrid">${pg.ws.map(widgetHTML).join('')}${pg.icons.map((id) => iconHTML(UI.apps[id], false, HOME.edit && !isSystem(id))).join('')}</div></div>`).join('');
  const home = $('#home');
  home.classList.toggle('editing', HOME.edit);
  morphHTML(home, html);
  const dots = pages.length > 1 ? `<div class="pdots">${pages.map((_, i) => `<i class="${i === HOME.page ? 'on' : ''}" data-a="homePage" data-v="${i}"></i>`).join('')}</div>` : '';
  const bar = HOME.edit ? `<div class="hedit"><button data-a="homeAddW">＋ ${T('Виджет', 'Віджет', 'Widget')}</button><button data-a="homeDone" class="on">${T('Готово', 'Готово', 'Done')}</button></div>` : '';
  morphHTML($('#dockbar'), `${bar}${dots}<div class="dock">${dock.map((id) => iconHTML(UI.apps[id], true)).join('')}</div>`);
}

// ---------------------------------------------------------------- interactions
export function initHome() {
  const home = $('#home');
  home.addEventListener('scroll', () => {
    const p = Math.round(home.scrollLeft / Math.max(1, home.clientWidth));
    if (p !== HOME.page) { HOME.page = p; for (const [i, d] of [...document.querySelectorAll('.pdots i')].entries()) d.classList.toggle('on', i === p); }
  }, { passive: true });
  // long press anywhere on the home screen = edit mode
  let t = null, sx = 0, sy = 0;
  const cancel = () => { clearTimeout(t); t = null; };
  home.addEventListener('touchstart', (e) => { const p = e.touches[0]; sx = p.clientX; sy = p.clientY; cancel(); t = setTimeout(() => { t = null; if (!HOME.edit) { HOME.edit = true; navigator.vibrate?.(15); renderHomeScreen(); } }, 600); }, { passive: true });
  home.addEventListener('touchmove', (e) => { const p = e.touches[0]; if (Math.hypot(p.clientX - sx, p.clientY - sy) > 10) cancel(); }, { passive: true });
  home.addEventListener('touchend', cancel, { passive: true });
  home.addEventListener('contextmenu', (e) => { e.preventDefault(); HOME.edit = true; renderHomeScreen(); });
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
  homeAddW: async () => {
    const list = Object.entries(WIDGETS).filter(([k]) => widgetAvailable(k));
    const SZ = { s: T('Малый', 'Малий', 'Small'), m: T('Средний', 'Середній', 'Medium'), l: T('Большой', 'Великий', 'Large') };
    const v = await sheet(`<h2>${T('Добавить виджет', 'Додати віджет', 'Add a widget')}</h2><p class="p">${T('Виджеты приложений появляются после их установки.', 'Віджети застосунків зʼявляються після їх встановлення.', 'App widgets appear once the app is installed.')}</p><div class="wgal">${list.map(([k, d]) => `<div class="card"><b>${esc(L(d.name))}</b><div class="btns">${d.sizes.map((sz) => `<button class="btn xs dark" data-a="resolve" data-v="${k}:${sz}">${SZ[sz]}</button>`).join('')}</div></div>`).join('')}</div>`);
    if (!v) return;
    const [k, size] = v.split(':');
    G.s.home.widgets.push({ id: 'w' + Date.now().toString(36), k, size, page: HOME.page, app: WIDGETS[k].app });
    toast(T('Виджет добавлен', 'Віджет додано', 'Widget added'), 'g');
    renderHomeScreen();
  },
};
