// Phone OS shell: home screen, status bar, app windows, navigation, sheets, dialogs, toasts, banners.
import { G, on, emit, save } from '../core/state.js';
import { T, L, clockDur, dur, fmtDate, lang } from '../core/i18n.js';
import { $, $$, esc, clamp, pad2 } from '../core/util.js';
import { fmt, curCode, rate, priceStep, symOf, fmtNum, toLoc, fromLoc } from '../core/money.js';
import { CITY, countryOf } from '../data/world.js';
import { icon } from './icons.js';
import { clearUnread, netWorth } from '../game/player.js';
import { sfx } from './sfx.js';
import { morphHTML } from './morph.js';

export const UI = { app: null, view: 'main', params: {}, stack: [], apps: {}, list: [], dock: [], scroll: {} };
export function registerApps(list, dock) { UI.list = list; UI.dock = dock; for (const a of list) UI.apps[a.id] = a; }

// ---------------------------------------------------------------- time helpers
export const gameDate = (t = G.s.t) => { const d = new Date(G.s.startDate + 'T00:00:00'); d.setDate(d.getDate() + Math.floor(t / 1440)); return d; };
export const gameClock = (t = G.s.t) => `${pad2(Math.floor((t % 1440) / 60))}:${pad2(t % 60)}`;
export const dayNum = () => Math.floor(G.s.t / 1440) + 1;
// relative time as a live span: liveUpdate() refreshes the text, so views don't have to re-render each minute
export const ago = (t) => `<span data-ago="${t}">${agoText(t)}</span>`;
export const agoText = (t) => {
  const m = G.s.t - t;
  if (m < 2) return T('только что', 'щойно', 'just now');
  if (m < 60) return T(`${m} мин назад`, `${m} хв тому`, `${m} min ago`);
  const h = Math.floor(m / 60);
  if (h < 24) return T(`${h} ч назад`, `${h} год тому`, `${h} h ago`);
  return T(`${Math.floor(h / 24)} дн назад`, `${Math.floor(h / 24)} дн тому`, `${Math.floor(h / 24)} d ago`);
};

// ---------------------------------------------------------------- status bar
export function renderStatus() {
  const s = G.s; if (!s) return;
  const el = $('#status');
  const city = CITY[s.player.city];
  const c = countryOf(s.player.city);
  const bars = [4, 6, 8, 11].map((h, i) => `<i style="height:${h}px;opacity:${i < 3 + (s.energy > 50 ? 1 : 0) ? 1 : 0.3}"></i>`).join('');
  el.innerHTML = `<span class="st-time">${gameClock()}</span><span class="st-day">${T('Д', 'Д', 'D')}${dayNum()}</span><span class="st-mid">${s.travel ? '✈ ' + T('в пути', 'в дорозі', 'travelling') : `${c.flag} ${esc(L(city.name))}`}</span><span class="st-net">${bars}</span><span class="st-en" title="energy"><b><i style="width:${clamp(s.energy, 3, 100)}%;background:${s.energy < 20 ? 'var(--red)' : s.energy < 45 ? 'var(--yel)' : 'var(--acc)'}"></i></b></span>`;
}

// ---------------------------------------------------------------- home screen
function appColors(a) { const c = typeof a.colors === 'function' ? a.colors() : a.colors; return c || ['#2a63ff', '#1b3fb0']; }
export const appName = (a) => (typeof a.name === 'function' ? a.name() : L(a.name));
export const appLocked = (a) => (a.lvl || 1) > G.s.level;
function appBadge(a) { const n = (a.badge ? a.badge() : 0) || G.s.unread[a.id] || 0; return n; }
function iconHTML(a, dock = false) {
  const [c1, c2] = appColors(a);
  const lock = appLocked(a);
  const n = lock ? 0 : appBadge(a);
  return `<button class="ic${lock ? ' locked' : ''}" data-a="open" data-v="${a.id}">${n ? `<span class="badge">${n > 99 ? '99+' : n}</span>` : ''}${lock ? `<span class="lockb">🔒 ${a.lvl}</span>` : ''}<div class="ico" style="--a:${c1};--b:${c2};--g:${a.glyphColor || '#fff'}">${icon(a.glyph)}<span class="glow"></span></div><span>${esc(appName(a))}</span></button>`;
}
export function renderHome() {
  const s = G.s; if (!s) return;
  const date = gameDate();
  const lines = s.log.slice(-4).map((l) => `<div class="tl"><span class="tg">[${esc(l.tag)}]</span> ${esc(l.text)}</div>`).join('') || `<div class="tl">&gt; ${T('система готова', 'система готова', 'system ready')}</div>`;
  const grid = UI.list.filter((a) => !UI.dock.includes(a.id) && !a.hidden).map((a) => iconHTML(a)).join('');
  const dock = UI.dock.map((id) => iconHTML(UI.apps[id], true)).join('');
  $('#home').innerHTML = `
    <div class="hw-top"><div><div class="hw-clock">${gameClock()}</div></div>
      <div class="hw-money"><small>${T('баланс', 'баланс', 'balance')}</small><b data-live="money">${fmt(s.money)}</b><small style="margin-top:4px">${T('капитал', 'капітал', 'net worth')} <span data-live="worth">${fmt(netWorth(), { short: true })}</span></small></div></div>
    <div class="hw-date">${esc(fmtDate(date))}</div>
    <div class="term" data-a="open" data-v="news">${lines}<div class="tl">&gt; <span class="cur"></span></div></div>
    <div class="hw-needs">
      <div class="need" data-a="open" data-v="profile">⚡ ${T('Энергия', 'Енергія', 'Energy')} <b data-live="energy">${Math.round(s.energy)}</b><div class="bar"><i data-live="energybar" style="width:${s.energy}%;background:${s.energy < 25 ? 'var(--red)' : 'var(--acc)'}"></i></div></div>
      <div class="need" data-a="open" data-v="profile">🍔 ${T('Сытость', 'Ситість', 'Food')} <b data-live="food">${Math.round(s.food)}</b><div class="bar"><i data-live="foodbar" style="width:${s.food}%;background:${s.food < 25 ? 'var(--red)' : 'var(--yel)'}"></i></div></div>
      <div class="need" data-a="open" data-v="profile">★ ${T('Уровень', 'Рівень', 'Level')} <b>${s.level}</b><div class="bar"><i style="width:${Math.round((s.xp / (60 * Math.pow(s.level, 1.75))) * 100)}%;background:var(--acc2)"></i></div></div>
    </div>
    <div class="grid">${grid}</div>
    <div style="height:30px"></div>`;
  $('#dockbar').innerHTML = `<div class="dock">${dock}</div>`;
}

// ---------------------------------------------------------------- app window
export function openApp(id, view = 'main', params = {}) {
  const a = UI.apps[id];
  if (!a) return;
  if (appLocked(a)) { toast(T(`Откроется на ${a.lvl} уровне`, `Відкриється на ${a.lvl} рівні`, `Unlocks at level ${a.lvl}`)); sfx('err'); return; }
  closeSheet();
  UI.app = a; UI.view = view; UI.params = params; UI.stack = [{ view, params }];
  if (a.onOpen) a.onOpen(params);
  clearUnread(id);
  const w = $('#appwin');
  w.classList.remove('hidden', 'closing');
  w.style.animation = 'none'; void w.offsetWidth; w.style.animation = '';
  document.body.classList.add('in-app');
  sfx('tap');
  render(true);
}
export function go(view, params = {}) {
  UI.scroll[UI.view] = $('.abody')?.scrollTop || 0;
  UI.stack.push({ view, params });
  UI.view = view; UI.params = params;
  render(true);
}
export function replace(view, params = {}) { UI.stack[UI.stack.length - 1] = { view, params }; UI.view = view; UI.params = params; render(true); }
export function back() {
  if ($('#sheet-layer').children.length) { closeSheet(); return; }
  if (UI.stack.length > 1) {
    UI.stack.pop();
    const top = UI.stack[UI.stack.length - 1];
    UI.view = top.view; UI.params = top.params;
    render(false, UI.scroll[UI.view]);
  } else home();
}
export function home() {
  closeSheet();
  if (!UI.app) return;
  if (UI.app.onClose) UI.app.onClose();
  const w = $('#appwin');
  w.classList.add('closing');
  setTimeout(() => { w.classList.add('hidden'); w.classList.remove('closing'); w.innerHTML = ''; }, 190);
  UI.app = null;
  document.body.classList.remove('in-app');
  $('#status').classList.remove('on-app', 'dark-head');
  renderHome(); renderStatus();
}
// while the finger is on the screen or the list is still gliding, background updates wait
let renderQueued = false, busyUntil = 0, retryT = 0;
export function markBusy(ms = 650) { busyUntil = Math.max(busyUntil, performance.now() + ms); }
export function rerender() {
  if (renderQueued || !UI.app) return;
  renderQueued = true;
  const run = () => {
    const wait = busyUntil - performance.now();
    if (wait > 0) { clearTimeout(retryT); retryT = setTimeout(run, wait + 30); return; }
    requestAnimationFrame(() => { renderQueued = false; if (UI.app) render(false); });
  };
  run();
}
function render(fresh = false, scrollTo) {
  const a = UI.app; if (!a) return;
  const w = $('#appwin');
  const prev = w.querySelector('.abody');
  if (!fresh && prev && w.dataset.app === a.id && w.dataset.view === UI.view) return patchRender(a, w, prev);
  const keep = fresh ? (scrollTo || 0) : prev ? prev.scrollTop : 0;
  const v = a.views[UI.view] ? UI.view : 'main';
  let body = '';
  try { body = a.views[v](UI.params || {}); } catch (e) { console.error(e); body = `<div class="empty"><b>Ошибка</b>${esc(e.message)}</div>`; }
  const [c1, c2] = appColors(a);
  const dark = typeof a.dark === 'function' ? a.dark(v) : a.dark;
  const title = a.title ? a.title(v, UI.params) : appName(a);
  const sub = a.sub ? a.sub(v, UI.params) : '';
  const right = a.right ? a.right(v, UI.params) : `<span class="pill" data-live="money">${fmt(G.s.money)}</span>`;
  const showBack = UI.stack.length > 1;
  const tabs = a.tabs ? a.tabs.filter((t) => !t.hide || !t.hide()) : null;
  const tabOf = a.tabOf ? a.tabOf(v) : v;
  const tabsHTML = tabs ? `<div class="atabs">${tabs.map((t) => { const n = t.badge ? t.badge() : 0; return `<button class="${t.v === tabOf ? 'on' : ''}" data-a="tab" data-v="${t.v}">${n ? `<span class="badge">${n}</span>` : ''}${icon(t.icon)}${esc(L(t.label))}</button>`; }).join('')}</div>` : '';
  w.style.setProperty('--c1', c1); w.style.setProperty('--c2', c2); w.style.setProperty('--ac', a.accent || c1);
  w.innerHTML = `<div class="ahead${dark ? ' dark' : ''}">${headHTML(showBack, title, sub, right)}</div><div class="abody${tabs ? ' has-tabs' : ''}">${body}</div>${tabsHTML}`;
  w.dataset.app = a.id; w.dataset.view = UI.view; w._body = body;
  const st = $('#status');
  st.classList.add('on-app'); st.classList.toggle('dark-head', !!dark);
  st.style.setProperty('--c1', c1);
  const nb = w.querySelector('.abody');
  nb.scrollTop = keep;
  if (a.after) try { a.after(v, nb, UI.params); } catch (e) { console.error(e); }
  liveUpdate();
}
function headHTML(showBack, title, sub, right) {
  return `${showBack ? `<button class="back" data-a="back">${icon('back')}</button>` : ''}<h1>${esc(title)}${sub ? `<small>${sub}</small>` : ''}</h1>${right}`;
}
function tabsBar(a, v) {
  const tabs = a.tabs ? a.tabs.filter((t) => !t.hide || !t.hide()) : null;
  if (!tabs) return '';
  const tabOf = a.tabOf ? a.tabOf(v) : v;
  return tabs.map((t) => { const n = t.badge ? t.badge() : 0; return `<button class="${t.v === tabOf ? 'on' : ''}" data-a="tab" data-v="${t.v}">${n ? `<span class="badge">${n}</span>` : ''}${icon(t.icon)}${esc(L(t.label))}</button>`; }).join('');
}
// background refresh of the open screen: patch only what changed, keep scroll and untouched photos
function patchRender(a, w, body) {
  const v = a.views[UI.view] ? UI.view : 'main';
  let html = '';
  try { html = a.views[v](UI.params || {}); } catch (e) { console.error(e); return; }
  const dark = typeof a.dark === 'function' ? a.dark(v) : a.dark;
  const head = w.querySelector('.ahead');
  const hh = headHTML(UI.stack.length > 1, a.title ? a.title(v, UI.params) : appName(a), a.sub ? a.sub(v, UI.params) : '', a.right ? a.right(v, UI.params) : `<span class="pill" data-live="money">${fmt(G.s.money)}</span>`);
  if (head && head._h !== hh) { morphHTML(head, hh); head._h = hh; }
  if (head) head.classList.toggle('dark', !!dark);
  if (w._body !== html) {
    // keep whatever the player is looking at in place even if something was added above it
    const top = body.scrollTop;
    const box = body.getBoundingClientRect();
    let anchor = null, at = 0;
    if (top > 0) for (const el of body.querySelectorAll('[data-id],[data-key],.card,.list-item')) { const r = el.getBoundingClientRect(); if (r.bottom > box.top + 4) { anchor = el; at = r.top; break; } }
    morphHTML(body, html); w._body = html;
    if (anchor && anchor.isConnected) body.scrollTop = top + (anchor.getBoundingClientRect().top - at);
    else if (body.scrollTop !== top) body.scrollTop = top;
  }
  const tb = w.querySelector('.atabs');
  if (tb) { const th = tabsBar(a, v); if (tb._h !== th) { morphHTML(tb, th); tb._h = th; } }
  liveUpdate();
}
export const currentView = () => (UI.app ? UI.view : null);

// ---------------------------------------------------------------- live values (updated every tick without re-render)
export function liveUpdate() {
  const s = G.s; if (!s) return;
  for (const el of $$('[data-live]')) {
    const k = el.dataset.live;
    if (k === 'money') el.textContent = fmt(s.money);
    else if (k === 'worth') el.textContent = fmt(netWorth(), { short: true });
    else if (k === 'energy') el.textContent = Math.round(s.energy);
    else if (k === 'food') el.textContent = Math.round(s.food);
    else if (k === 'energybar') el.style.width = s.energy + '%';
    else if (k === 'foodbar') el.style.width = s.food + '%';
  }
  for (const el of $$('[data-cd]')) {
    const left = +el.dataset.cd - s.t;
    el.textContent = el.dataset.fmt === 'long' ? dur(left) : clockDur(left);
    if (left <= 0 && el.dataset.done) el.textContent = el.dataset.done;
  }
  for (const el of $$('[data-ago]')) { const tx = agoText(+el.dataset.ago); if (el.textContent !== tx) el.textContent = tx; }
  for (const el of $$('[data-bar-from]')) {
    const a = +el.dataset.barFrom, b = +el.dataset.barTo;
    el.style.width = clamp(((s.t - a) / Math.max(1, b - a)) * 100, 0, 100) + '%';
  }
}

// ---------------------------------------------------------------- sheets & dialogs
let sheetResolve = null;
export function sheet(html, o = {}) {
  closeSheet(true);
  const layer = $('#sheet-layer');
  layer.innerHTML = `<div class="dimbg" data-a="${o.modal ? '' : 'closeSheet'}"></div><div class="sheet${o.cls ? ' ' + o.cls : ''}">${html}</div>`;
  if (o.after) o.after(layer.querySelector('.sheet'));
  return new Promise((r) => { sheetResolve = r; });
}
export function closeSheet(silent, value) {
  const layer = $('#sheet-layer');
  if (!layer || !layer.children.length) return;
  layer.innerHTML = '';
  if (sheetResolve) { const r = sheetResolve; sheetResolve = null; r(value ?? null); }
}
export function resolveSheet(v) { closeSheet(true, v); }
export function dialog(html) {
  const layer = $('#sheet-layer');
  layer.innerHTML = `<div class="dimbg"></div><div class="dialog">${html}</div>`;
  return new Promise((r) => { sheetResolve = r; });
}
export function confirmBox(title, text = '', ok = T('Да', 'Так', 'Yes'), cancel = T('Отмена', 'Скасувати', 'Cancel'), danger = false) {
  return dialog(`<h2>${esc(title)}</h2>${text ? `<p class="p">${text}</p>` : ''}<div class="btns"><button class="btn dark" data-a="resolve" data-v="0">${esc(cancel)}</button><button class="btn ${danger ? 'red' : ''}" data-a="resolve" data-v="1">${esc(ok)}</button></div>`).then((v) => v === '1');
}
export function alertBox(title, text = '', ok = 'OK') {
  return dialog(`<h2>${esc(title)}</h2>${text ? `<p class="p">${text}</p>` : ''}<div class="btns"><button class="btn" data-a="resolve" data-v="1">${esc(ok)}</button></div>`);
}
// choose from options: [{v, label, sub, cls}]
export function choose(title, opts, text = '') {
  return sheet(`<h2>${esc(title)}</h2>${text ? `<p class="p">${text}</p>` : ''}<div class="btns col">${opts.map((o) => `<button class="btn ${o.cls || 'dark'} block" data-a="resolve" data-v="${esc(o.v)}" ${o.dis ? 'disabled' : ''}>${esc(o.label)}${o.sub ? ` <span class="small m">${esc(o.sub)}</span>` : ''}</button>`).join('')}</div>`);
}
// price picker in the display currency. Returns USD or null
export function askPrice({ title, sub = '', value, min = 0, max, hint = '', ok = T('Готово', 'Готово', 'Done') }) {
  const code = curCode();
  const r = rate(code);
  const toL = (u) => Math.round(u * r);
  let loc = toL(value);
  const lo = toL(min), hi = toL(max ?? value * 3);
  const step = Math.max(1, Math.round(priceStep(value, code) * r));
  const html = `<h2>${esc(title)}</h2>${sub ? `<p class="p">${sub}</p>` : ''}
    <div class="center" style="margin:8px 0 4px"><span class="price-big" id="ap-big">${fmt(value)}</span></div>
    <input type="range" id="ap-range" min="${lo}" max="${hi}" step="${step}" value="${loc}">
    <div class="row" style="gap:8px;margin:6px 0 10px">
      <button class="btn dark sm" data-a="apStep" data-v="-10">−10%</button><button class="btn dark sm" data-a="apStep" data-v="-1">−</button>
      <input class="input" id="ap-input" inputmode="numeric" style="text-align:center;font-weight:800" value="${loc}">
      <button class="btn dark sm" data-a="apStep" data-v="1">+</button><button class="btn dark sm" data-a="apStep" data-v="10">+10%</button>
    </div>
    ${hint ? `<div class="small m mb">${hint}</div>` : ''}
    <button class="btn block" data-a="apOk">${esc(ok)}</button>`;
  return sheet(html, {
    after(el) {
      const big = el.querySelector('#ap-big'), range = el.querySelector('#ap-range'), inp = el.querySelector('#ap-input');
      const set = (v, from) => { loc = clamp(Math.round(v), lo, Math.max(hi, lo)); big.textContent = fmt(loc / r); if (from !== 'range') range.value = loc; if (from !== 'input') inp.value = loc; };
      range.addEventListener('input', () => set(+range.value, 'range'));
      inp.addEventListener('input', () => { const v = +inp.value.replace(/\D/g, ''); if (v) { loc = v; big.textContent = fmt(v / r); range.value = v; } });
      el._step = (k) => set(Math.abs(k) === 10 ? loc * (1 + k / 100) : loc + k * step);
      el._ok = () => resolveSheet(Math.max(lo, loc) / r);
    },
  });
}

// ---------------------------------------------------------------- toasts & banners
export function toast(text, cls = '') {
  const l = $('#toast-layer');
  const d = document.createElement('div');
  d.className = 'toast ' + cls; d.textContent = text;
  l.appendChild(d);
  setTimeout(() => { d.style.transition = 'opacity .3s'; d.style.opacity = '0'; setTimeout(() => d.remove(), 300); }, 2300);
}
export function banner({ app, title, text, go: target }) {
  const a = UI.apps[app] || UI.apps.news;
  if (UI.app && UI.app.id === app && !target) return; // already looking at it
  const l = $('#banner-layer');
  while (l.children.length > 1) l.firstChild.remove();
  const [c1, c2] = a ? appColors(a) : ['#333', '#111'];
  const d = document.createElement('div');
  d.className = 'banner';
  d.innerHTML = `<div class="bi" style="--a:${c1};--b:${c2}">${icon(a?.glyph || 'bell')}</div><div class="grow"><div class="bt">${esc(title)}</div><div class="bs">${esc(text)}</div></div><small>${gameClock()}</small>`;
  d.onclick = () => { d.remove(); const t = target || [app]; openApp(t[0], t[1] || 'main', t[2] || {}); };
  l.appendChild(d);
  sfx('note');
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 320); }, 3800);
}

// ---------------------------------------------------------------- global event delegation
const GLOBAL = {
  open: (v, el) => openApp(v, el.dataset.w || 'main', el.dataset.p ? JSON.parse(el.dataset.p) : {}),
  go: (v, el) => go(v, el.dataset.p ? JSON.parse(el.dataset.p) : el.dataset.id ? { id: el.dataset.id } : {}),
  back: () => back(),
  home: () => home(),
  tab: (v) => { UI.stack = [{ view: v, params: {} }]; UI.view = v; UI.params = {}; render(true); },
  closeSheet: () => closeSheet(),
  resolve: (v) => resolveSheet(v),
  apStep: (v, el) => el.closest('.sheet')._step(+v),
  apOk: (v, el) => el.closest('.sheet')._ok(),
};
export function initShell() {
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-a]');
    if (!el || el.dataset.a === '') return;
    if (el.closest('.mini') && !el.closest('.mres') && !el.dataset.global) return; // minigames handle their own clicks
    const name = el.dataset.a, v = el.dataset.v;
    ev.preventDefault();
    const fn = (UI.app?.actions && UI.app.actions[name]) || GLOBAL[name];
    if (!fn) { console.warn('no action', name); return; }
    try { const r = fn(v, el, ev); if (r && r.catch) r.catch((e) => console.error(e)); } catch (e) { console.error(e); toast('⚠ ' + e.message, 'r'); }
  });
  document.addEventListener('input', (ev) => {
    const el = ev.target.closest('[data-in]');
    if (!el || !UI.app?.inputs) return;
    const fn = UI.app.inputs[el.dataset.in];
    if (fn) fn(el.value, el, ev);
  });
  // finger down / momentum scroll: hold background re-renders until the screen settles
  document.addEventListener('scroll', () => markBusy(450), { capture: true, passive: true });
  document.addEventListener('touchstart', () => markBusy(900), { passive: true });
  document.addEventListener('touchmove', () => markBusy(900), { passive: true });
  document.addEventListener('pointerdown', () => markBusy(350), { passive: true });
  $('#homebar').addEventListener('click', () => { if ($('#mini-layer').children.length) return; if (UI.app) home(); });
  // swipe up from the bottom edge to go home
  let sy = null;
  $('#screen').addEventListener('touchstart', (e) => { const t = e.touches[0]; const r = $('#screen').getBoundingClientRect(); sy = t.clientY > r.bottom - 34 ? t.clientY : null; }, { passive: true });
  $('#screen').addEventListener('touchend', (e) => { if (sy == null) return; const t = e.changedTouches[0]; if (sy - t.clientY > 60 && UI.app && !$('#mini-layer').children.length) home(); sy = null; }, { passive: true });
  on('banner', banner);
  on('badges', () => { if (!UI.app) renderHome(); });
  on('levelup', (lvl) => { toast(T(`🎉 Уровень ${lvl}!`, `🎉 Рівень ${lvl}!`, `🎉 Level ${lvl}!`), 'g'); sfx('win'); if (!UI.app) renderHome(); });
}
export function refreshAll() { renderStatus(); if (UI.app) rerender(); else renderHome(); }
