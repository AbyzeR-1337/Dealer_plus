// "My PC" as a desktop: boot screen, wallpaper with icons, windows, a taskbar with Start and a clock.
// Apps: This PC, Explorer (your own disk + every drive/phone/laptop from storage, with the real files of
// bought devices), AIDO64 diagnostics (stress test / SMART reveals hidden faults), PC Service (swap parts of a
// built PC, strip it down, clean the cooler, set it as your workstation), Defender (virus scan of drives),
// Command line, Miner (GPU mining: payout vs electricity), Minesweeper, Notepad, Browser.
// The desktop lives in its own layer under sheets/toasts, so file previews and dialogs open on top of it.
import { G, on } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { esc, clamp } from '../core/util.js';
import { fmt } from '../core/money.js';
import { MODEL, DEFECTS } from '../data/catalog.js';
import { CITY } from '../data/world.js';
import { itemTitle, defectName } from '../game/items.js';
import { getItem, getStat } from '../game/player.js';
import { toast, choose, confirmBox, openApp } from '../ui/shell.js';
import { img } from '../ui/comp.js';
import { sfx } from '../ui/sfx.js';
import { playMini } from '../mini/engine.js';
import { hasStorage, storageKind, deviceFiles, accessOf, connect, wipe, KIND_NAME, LOCKED } from '../game/files.js';
import { filesActions, FV } from './files_view.js';
import { lockOf, lockText, tryCode, payLocker, lookupCode, cureAll, processList, endTask, deleteFile, defenderCatch, aliveMiners, badProcs, autorun, slowK } from '../game/pcvirus.js';
import { installerDrive } from '../game/pc.js';
import {
  myPc, setMyPc, isComputer, osOf, OS, SLOTS, SLOT_NAME, SLOT_ICON, specLine, swapCandidates, swapPart, disassemblePc, cleanCooler,
  diagTargets, runDiag, mineState, mineRate, mineCashout, pcSpeed, canBeMyPc, buildTitle,
} from '../game/pc.js';
import { taxDue } from '../game/life.js';

const D = { tm: null, lockMsg: '', open: false, wins: [], active: null, start: false, ex: 'c', diag: { id: null, res: null, run: 0 }, svc: null, term: [], mines: null, flag: false };
const APPS = {
  thispc: { ic: '🖥', n: () => T('Этот компьютер', 'Цей компʼютер', 'This PC') },
  explorer: { ic: '📁', n: () => T('Проводник', 'Провідник', 'Explorer') },
  diag: { ic: '🩺', n: () => 'AIDO64' },
  service: { ic: '🛠', n: () => T('Сервис ПК', 'Сервіс ПК', 'PC Service') },
  defender: { ic: '🛡', n: () => T('Защитник', 'Захисник', 'Defender') },
  term: { ic: '⌨️', n: () => T('Командная строка', 'Командний рядок', 'Command Prompt') },
  mine: { ic: '⛏', n: () => T('Майнер', 'Майнер', 'Miner') },
  mines: { ic: '💣', n: () => T('Сапёр', 'Сапер', 'Minesweeper') },
  notepad: { ic: '📝', n: () => T('Блокнот', 'Блокнот', 'Notepad') },
  browser: { ic: '🌐', n: () => T('Браузер', 'Браузер', 'Browser') },
  trash: { ic: '🗑', n: () => T('Корзина', 'Кошик', 'Recycle Bin') },
  taskmgr: { ic: '📊', n: () => T('Диспетчер задач', 'Диспетчер завдань', 'Task Manager') },
};
const DESK = ['thispc', 'explorer', 'taskmgr', 'diag', 'service', 'defender', 'term', 'mine', 'mines', 'notepad', 'browser', 'trash'];
const hhmm = () => { const m = G.s.t % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
const pa = (a, v = '', extra = '') => `data-pa="${a}" data-pv="${esc(String(v))}" ${extra}`;
const osName = () => { const it = myPc().item; return it ? OS[osOf(it)]?.n || 'Windows 11' : 'Windows 10'; };

// ---------------------------------------------------------------- open / close
let layer = null, clock = 0, unsubs = [];
const onInv = () => { if (D.open) render(); };
export function openDesktop(o = {}) {
  if (D.open) { if (o.app) openWin(o.app, o.params); return; }
  D.open = true; D.start = false;
  layer = document.createElement('div');
  layer.id = 'pcd-layer';
  document.getElementById('screen').appendChild(layer);
  layer.addEventListener('click', onClick);
  layer.addEventListener('input', onInput);
  layer.addEventListener('keydown', onKey);
  layer.addEventListener('contextmenu', (e) => e.preventDefault());
  // a hidden miner makes the boot crawl
  const secs = clamp(2.6 / pcSpeed(), 0.7, 9);
  FV.pc = true;
  layer.innerHTML = `<div class="pcd-boot"><div class="pcd-logo"><i></i><i></i><i></i><i></i></div><div class="pcd-spin"></div><small>${T('Добро пожаловать', 'Ласкаво просимо', 'Welcome')}</small><small class="m">${esc(myPc().name)}</small></div>`;
  sfx('tap');
  setTimeout(() => { if (!D.open) return; if (o.app) openWinNow(o.app, o.params); render(); }, secs * 1000);
  clock = setInterval(() => { if (!layer) return; const c = layer.querySelector('.pcd-clock'); if (c) c.textContent = hhmm(); const mb = layer.querySelector('[data-live-mine]'); if (mb) mb.textContent = fmt(mineState().bal); }, 1000);
  unsubs = [on('inv', onInv), on('pc', onInv)];
}
// plug a device / a bought computer into your PC
export function openDesktopOn(itemId) {
  const it = getItem(itemId);
  if (!it) return;
  if (isComputer(it) && !hasStorage(it)) { D.svc = it.id; openDesktop({ app: 'service' }); return; }
  if (isComputer(it)) { D.svc = it.id; D.ex = it.id; openDesktop({ app: 'explorer' }); return; }
  if (hasStorage(it)) { D.ex = it.id; openDesktop({ app: 'explorer' }); return; }
  D.diag.id = it.id; openDesktop({ app: 'diag' });
}
export function closeDesktop() {
  D.open = false; FV.pc = false; clearInterval(clock);
  for (const u of unsubs) u(); unsubs = [];
  layer?.remove(); layer = null;
}
// with a miner eating the CPU, every window opens with a lag ("Not responding")
let lagging = false;
function lag(fn) {
  const n = aliveMiners();
  if (!n || !layer) return fn();
  if (lagging) return;
  lagging = true;
  const box = document.createElement('div');
  box.className = 'pcd-lag';
  box.innerHTML = `<div class="pcd-spin"></div><small>${T('Не отвечает…', 'Не відповідає…', 'Not responding…')}</small>`;
  layer.appendChild(box);
  setTimeout(() => { lagging = false; box.remove(); if (D.open) fn(); }, Math.min(3500, 500 + n * 700 + Math.random() * 600));
}
function openWin(app, params = {}) { lag(() => openWinNow(app, params)); }
function openWinNow(app, params = {}) {
  let w = D.wins.find((x) => x.app === app);
  if (!w) { w = { id: app, app, min: false }; D.wins.push(w); }
  Object.assign(w, { min: false, params });
  D.active = app; D.start = false;
  if (app === 'mines' && !D.mines) newMines();
  render();
}

// ---------------------------------------------------------------- render
function render() {
  if (!layer || !D.open) return;
  if (lockOf()) return renderLock();
  const act = D.wins.find((w) => w.app === D.active && !w.min);
  const icons = DESK.map((k) => `<button class="pcd-ic" ${pa('open', k)}><i>${APPS[k].ic}</i><span>${esc(APPS[k].n())}</span></button>`).join('');
  const win = act ? `<div class="pcw"><div class="pcw-bar"><span>${APPS[act.app].ic} ${esc(APPS[act.app].n())}</span><button ${pa('min', act.app)}>—</button><button class="x" ${pa('close', act.app)}>✕</button></div><div class="pcw-body">${body(act)}</div></div>` : '';
  const start = D.start ? `<div class="pcd-start"><div class="pcd-user"><span>${esc((G.s.player.name || '?')[0])}</span><b>${esc(G.s.player.name || '')}</b></div><div class="pcd-sgrid">${DESK.map((k) => `<button ${pa('open', k)}><i>${APPS[k].ic}</i><small>${esc(APPS[k].n())}</small></button>`).join('')}</div><button class="pcd-off" ${pa('power')}>⏻ ${T('Завершение работы', 'Завершення роботи', 'Shut down')}</button></div>` : '';
  layer.innerHTML = `<div class="pcd ${act ? 'has-win' : ''}"><div class="pcd-desk">${icons}</div>${win}${start}
    <div class="pcd-bar"><button class="pcd-win ${D.start ? 'on' : ''}" ${pa('start')}><i></i><i></i><i></i><i></i></button>${D.wins.map((w) => `<button class="pcd-task ${w.app === D.active && !w.min ? 'on' : ''}" ${pa('task', w.app)}>${APPS[w.app].ic}</button>`).join('')}<span class="grow"></span><span class="pcd-tray">${mineState().on ? '⛏ ' : ''}📶 🔊</span><b class="pcd-clock">${hhmm()}</b></div></div>`;
  if (D.active === 'term') { const out = layer.querySelector('.term-out'); if (out) out.scrollTop = out.scrollHeight; }
}
function body(w) {
  switch (w.app) {
    case 'thispc': return thisPc();
    case 'explorer': return explorer();
    case 'diag': return diag();
    case 'service': return service();
    case 'defender': return defender();
    case 'term': return term();
    case 'mine': return miner();
    case 'mines': return mines();
    case 'notepad': return `<textarea class="pcd-note" data-pin="note" placeholder="${T('Заметки: цены, кому что обещал…', 'Нотатки: ціни, кому що обіцяв…', 'Notes: prices, promises…')}">${esc(G.s.pcNote || '')}</textarea>`;
    case 'browser': return browser();
    case 'taskmgr': return taskmgr();
    case 'trash': return `<div class="pcd-empty">🗑<b>${T('Корзина пуста', 'Кошик порожній', 'The bin is empty')}</b><small>${T('Вы всё удаляете сразу. Уважаем.', 'Ви все видаляєте одразу. Поважаємо.', 'You delete things for good. Respect.')}</small></div>`;
  }
  return '';
}
const devices = () => G.s.inv.filter((it) => hasStorage(it) && !it.listed);
const DEV_IC = { usb: '🔌', secure: '🔐', card: '💳', dashcam: '🚗', hdd: '🖴', office: '🗄', nas: '🗄', tape: '📼', floppy: '💾', cd: '💿', dvd: '📀', gamecd: '💿', cassette: '📼', vhs: '📼', ipod: '🎧', dictaphone: '🎙', phone: '📱', tablet: '📱', laptop: '💻', camera: '📷', drone: '🛸', console: '🎮' };

function thisPc() {
  const pc = myPc(), it = pc.item, b = it?.build;
  const rows = b ? b.parts.map((x) => `<div class="kv"><span>${SLOT_ICON[x.k] || '🧩'} ${esc(L(SLOT_NAME[x.k]))}</span><b>${esc(x.t)}</b></div>`).join('') : `<div class="kv"><span>🔲 CPU</span><b>${it ? esc(itemTitle(it)) : 'Celeron N4020'}</b></div><div class="kv"><span>📏 RAM</span><b>${it ? '8–16 GB' : '4 GB'}</b></div><div class="kv"><span>💽 ${T('Диск', 'Диск', 'Disk')}</span><b>${it ? 'SSD' : 'HDD 500 GB'}</b></div>`;
  return `<div class="pcd-hero"><span>${it ? '🖥' : '💻'}</span><div><b>${esc(pc.name)}</b><small>${esc(osName())} · ${T('скорость', 'швидкість', 'speed')} ×${pc.speed}${b ? ` · ${T('мощность', 'потужність', 'power')} ${b.score}` : ''}</small></div></div>${rows}
    <div class="pcd-sec">${T('Устройства и диски', 'Пристрої та диски', 'Devices and drives')}</div>
    <div class="pcd-drives"><button ${pa('ex', 'c')}><i>🖴</i><span>${T('Локальный диск (C:)', 'Локальний диск (C:)', 'Local Disk (C:)')}</span><div class="pcd-cap"><i style="width:${b ? 38 : 81}%"></i></div></button>${devices().slice(0, 12).map((d, i) => `<button ${pa('ex', d.id)}><i>${DEV_IC[storageKind(d)] || '💾'}</i><span>${esc(itemTitle(d, false))} (${String.fromCharCode(68 + i)}:)</span></button>`).join('')}</div>
    ${canBeMyPc(it) || G.s.inv.some((x) => canBeMyPc(x) && x.id !== it?.id) ? `<button class="btn sm dark mt" ${pa('open', 'service')}>🛠 ${T('Апгрейд и сервис', 'Апгрейд і сервіс', 'Upgrade & service')}</button>` : `<button class="btn sm dark mt" ${pa('phone', 'build')}>🛠 ${T('Собрать новый ПК', 'Зібрати новий ПК', 'Build a new PC')}</button>`}`;
}

// your own disk: a few generated documents about your business
function myDocs() {
  const s = G.s;
  return [
    { id: 'sales', ic: '📊', n: T('Продажи.xlsx', 'Продажі.xlsx', 'Sales.xlsx'), body: () => `${T('Продано вещей всего', 'Продано речей усього', 'Items sold')}: ${getStat('sold') || 0}\n${T('Куплено', 'Куплено', 'Bought')}: ${getStat('bought') || 0}\n${T('Капитал', 'Капітал', 'Net worth')}: ${fmt(s.money)}\n${T('На складе', 'На складі', 'In storage')}: ${s.inv.length}` },
    { id: 'tax', ic: '🧾', n: T('Налоги_2026.pdf', 'Податки_2026.pdf', 'Taxes_2026.pdf'), body: () => `${T('Режим', 'Режим', 'Regime')}: ${s.tax.regime}\n${T('К оплате сегодня', 'До сплати сьогодні', 'Due today')}: ${fmt(taxDue())}\n${T('Долг', 'Борг', 'Debt')}: ${fmt(s.tax.debt || 0)}` },
    { id: 'pass', ic: '📝', n: T('пароли.txt', 'паролі.txt', 'passwords.txt'), body: () => T('qwerty123\nбанк: 0000\n\n(хранить пароли в txt — плохая идея)', 'qwerty123\nбанк: 0000\n\n(зберігати паролі в txt — погана ідея)', 'qwerty123\nbank: 0000\n\n(keeping passwords in a txt is a bad idea)') },
    { id: 'note', ic: '📝', n: T('заметки.txt', 'нотатки.txt', 'notes.txt'), body: () => s.pcNote || T('(пусто — пишите в Блокноте)', '(порожньо — пишіть у Блокноті)', '(empty — write in Notepad)') },
    { id: 'pics', ic: '🖼', n: T('Фото склада', 'Фото складу', 'Storage photos'), body: () => s.inv.slice(0, 8).map((it) => '• ' + itemTitle(it)).join('\n') || '—' },
  ];
}
function explorer() {
  const sel = D.ex;
  const nav = `<div class="pcd-nav"><button class="${sel === 'c' ? 'on' : ''}" ${pa('ex', 'c')}>🖴 C:</button>${devices().map((d) => `<button class="${sel === d.id ? 'on' : ''}" ${pa('ex', d.id)}>${DEV_IC[storageKind(d)] || '💾'} ${esc(itemTitle(d, false))}</button>`).join('')}</div>`;
  let main = '';
  if (sel === 'c') {
    main = `<div class="pcd-path">C:\\${T('Пользователи', 'Користувачі', 'Users')}\\${esc(G.s.player.name || 'user')}\\${T('Документы', 'Документи', 'Documents')}</div>` + myDocs().map((f) => `<div class="pcd-file" ${pa('doc', f.id)}><i>${f.ic}</i><b>${esc(f.n)}</b></div>`).join('');
  } else {
    const it = getItem(sel);
    if (!it) { D.ex = 'c'; return explorer(); }
    const acc = accessOf(it);
    if (!acc.ok) {
      const btn = { pin: ['fpin', '⌨️ ' + T('Подобрать PIN', 'Підібрати PIN', 'Crack the PIN')], pass: ['fpass', '🔑 ' + T('Подобрать пароль', 'Підібрати пароль', 'Guess the password')], dead: ['frecover', '🛠 ' + T('Сервис восстановления', 'Сервіс відновлення', 'Recovery service')], click: ['frecover', '🛠 ' + T('Сервис восстановления', 'Сервіс відновлення', 'Recovery service')], lock: ['lab', '🔓 Phone Lab'] }[acc.why];
      main = `<div class="pcd-empty">⚠️<b>${esc(LOCKED[acc.why] ? LOCKED[acc.why]() : T('Нет доступа', 'Немає доступу', 'No access'))}</b>${btn ? `<button class="btn sm" ${pa('fact', `${btn[0]}|${it.id}`)}>${btn[1]}</button>` : ''}</div>`;
    }
    else {
      const f = deviceFiles(it);
      main = `<div class="pcd-path">${esc(L(KIND_NAME[storageKind(it)]))} · ${esc(itemTitle(it, false))}</div>`;
      if (f.empty) main += `<div class="pcd-empty">📭<b>${T('Пусто', 'Порожньо', 'Empty')}</b></div>`;
      else if (it.data?.ransom) main += `<div class="pcd-empty">🔒<b>${esc(LOCKED.ransom())}</b><div class="pcd-btns"><button class="btn sm" ${pa('fact', `fransom|${it.id}`)}>💸 ${T('Заплатить', 'Заплатити', 'Pay')}</button><button class="btn sm dark" ${pa('fact', `fdecrypt|${it.id}`)}>🧩 ${T('Подобрать ключ', 'Підібрати ключ', 'Crack the key')}</button></div></div>`;
      else main += f.dirs.map((dd) => `<div class="pcd-dir">📁 ${esc(dd.name || '/')}</div>${dd.files.map((x) => `<div class="pcd-file ${x.bad ? 'bad' : ''}" ${pa('fopen', `${it.id}|${x.id}`)}><i>${{ photo: '🖼', video: '🎞', text: '📝', doc: '📄', music: '🎵', audio: '🎙', exe: '⚙️', wallet: '👛', game: '🎮', save: '💾', archive: '🗜', contact: '👥' }[x.type] || '📄'}</i><b>${esc(x.name)}</b><small>${x.bad ? '⚠' : ''}</small></div>`).join('')}`).join('');
      if (!f.empty) main += `<button class="btn sm dark mt" ${pa('wipe', it.id)}>🧹 ${T('Стереть всё', 'Стерти все', 'Wipe everything')}</button>`;
    }
  }
  return `<div class="pcd-ex">${nav}<div class="pcd-main">${main}</div></div>`;
}

function diag() {
  const list = diagTargets();
  const t = D.diag.id && getItem(D.diag.id);
  let h = `<div class="pcd-sec">${T('Что тестируем', 'Що тестуємо', 'What to test')}</div><div class="pcd-chips">${list.slice(0, 20).map((it) => `<button class="${D.diag.id === it.id ? 'on' : ''}" ${pa('dsel', it.id)}>${esc(itemTitle(it, false))}</button>`).join('') || `<span class="m">${T('Нет компьютеров, комплектующих и дисков на складе', 'Немає компʼютерів, комплектуючих і дисків на складі', 'No computers, parts or drives in storage')}</span>`}</div>`;
  if (!t) return h;
  if (D.diag.run) return h + `<div class="pcd-run"><b>${T('Стресс‑тест…', 'Стрес‑тест…', 'Stress test…')}</b><div class="pcd-prog"><i style="width:${D.diag.run}%"></i></div><small class="m">CPU ${40 + Math.round(D.diag.run * 0.5)}°C · GPU ${38 + Math.round(D.diag.run * 0.45)}°C</small></div>`;
  const r = D.diag.res && D.diag.res.id === t.id ? D.diag.res : null;
  h += `<div class="pcd-hero"><span>🩺</span><div><b>${esc(itemTitle(t))}</b><small>${t.diag ? T('уже проверяли', 'вже перевіряли', 'tested before') : T('не проверялся', 'не перевірявся', 'never tested')}</small></div></div>`;
  if (r) h += `<div class="pcd-report">${r.dead ? `<b class="r">✖ ${T('Не проходит POST — устройство мёртвое', 'Не проходить POST — пристрій мертвий', 'Fails POST — the device is dead')}</b>` : `<div class="kv"><span>${T('Бенчмарк', 'Бенчмарк', 'Benchmark')}</span><b>${r.score * 117}</b></div><div class="kv"><span>CPU</span><b class="${r.cpuT > 85 ? 'r' : 'g'}">${r.cpuT}°C</b></div><div class="kv"><span>GPU</span><b class="${r.gpuT > 85 ? 'r' : 'g'}">${r.gpuT}°C</b></div>`}${r.found.length ? r.found.map((c) => `<div class="r">⚠ ${esc(defectName(c))}</div>`).join('') : `<div class="g">✔ ${T('Скрытых проблем не найдено', 'Прихованих проблем не знайдено', 'No hidden problems found')}</div>`}</div>`;
  h += `<button class="btn block mt" ${pa('drun', t.id)}>▶ ${T('Запустить тест', 'Запустити тест', 'Run the test')}</button>`;
  return h;
}

function service() {
  const comps = G.s.inv.filter((it) => isComputer(it) && !it.listed);
  const mine = myPc().item;
  if (!D.svc || !getItem(D.svc)) D.svc = mine?.id || comps[0]?.id || null;
  let h = `<div class="pcd-chips">${comps.map((it) => `<button class="${D.svc === it.id ? 'on' : ''}" ${pa('ssel', it.id)}>${mine?.id === it.id ? '⭐ ' : ''}${esc(it.build ? buildTitle(it) : itemTitle(it, false))}</button>`).join('') || `<span class="m">${T('Компьютеров на складе нет', 'Компʼютерів на складі немає', 'No computers in storage')}</span>`}</div>`;
  const it = D.svc && getItem(D.svc);
  if (!it) return h + `<button class="btn sm mt" ${pa('phone', 'build')}>🛠 ${T('Собрать ПК в «Сборке»', 'Зібрати ПК у «Збірці»', 'Build one in PC Build')}</button>`;
  const known = it.defects.filter((d) => d.known);
  h += `<div class="pcd-hero"><span>${it.build ? '🖥' : '💻'}</span><div><b>${esc(it.build ? buildTitle(it) : itemTitle(it))}</b><small>${esc(OS[osOf(it)]?.n || '')}${it.build ? ` · ${T('мощность', 'потужність', 'power')} ${it.build.score}` : ''}</small></div></div>`;
  if (it.build) {
    h += `<div class="pcd-sec">${T('Комплектующие', 'Комплектуючі', 'Components')}</div>` + SLOTS.map((k) => { const p = it.build.parts.find((x) => x.k === k); const cand = swapCandidates(it, k).length; return `<div class="pcd-part"><span>${SLOT_ICON[k]}</span><div class="grow"><small>${esc(L(SLOT_NAME[k]))}</small><b>${p ? esc(p.t) : `<span class="m">${T('нет', 'немає', 'none')}</span>`}</b></div><button class="btn xs ${cand ? '' : 'dark'}" ${pa('swap', k)}>${p ? T('Заменить', 'Замінити', 'Swap') : T('Поставить', 'Поставити', 'Fit')}${cand ? ` · ${cand}` : ''}</button></div>`; }).join('');
  }
  h += `<div class="pcd-sec">${T('Состояние', 'Стан', 'Condition')}</div>${known.length ? known.map((d) => `<div class="r small">⚠ ${esc(defectName(d.c))}</div>`).join('') : `<div class="g small">✔ ${T('Известных проблем нет', 'Відомих проблем немає', 'No known problems')}</div>`}
    <div class="pcd-btns"><button class="btn sm" ${pa('dust', it.id)}>🌀 ${T('Почистить от пыли и сменить термопасту', 'Почистити від пилу й змінити термопасту', 'Dust it out, new thermal paste')}</button><button class="btn sm dark" ${pa('open', 'diag', `data-pw="${it.id}"`)}>🩺 ${T('Тест', 'Тест', 'Test')}</button>${known.some((d) => DEFECTS[d.c]?.fix) ? `<button class="btn sm dark" ${pa('repair', it.id)}>🔧 ${T('В мастерскую', 'До майстерні', 'To the workshop')}</button>` : ''}<button class="btn sm dark" ${pa('phone', 'computer')}>💿 ${T('Переустановить ОС', 'Перевстановити ОС', 'Reinstall OS')}</button>${canBeMyPc(it) && mine?.id !== it.id ? `<button class="btn sm dark" ${pa('setmy', it.id)}>⭐ ${T('Работать на нём', 'Працювати на ньому', 'Use as my PC')}</button>` : ''}${it.build ? `<button class="btn sm red" ${pa('strip', it.id)}>🪛 ${T('Разобрать на детали', 'Розібрати на деталі', 'Strip for parts')}</button>` : ''}</div>`;
  return h;
}

function defender() {
  const list = devices().filter((it) => accessOf(it).ok);
  return `<div class="pcd-hero"><span>🛡</span><div><b>${T('Защита от вирусов', 'Захист від вірусів', 'Virus protection')}</b><small>${T('Проверяет подключённые флешки, диски и телефоны. Найденное — в карантин, до запуска.', 'Перевіряє підключені флешки, диски й телефони. Знайдене — у карантин, до запуску.', 'Scans connected sticks, drives and phones. Anything found goes to quarantine before it can run.')}</small></div></div>
    <div class="small m">${T('Подключено устройств', 'Підключено пристроїв', 'Devices connected')}: ${list.length}</div>
    <button class="btn block mt" ${pa('scan')}>🔍 ${T('Быстрая проверка', 'Швидка перевірка', 'Quick scan')}</button>${D.scan ? `<div class="pcd-report mt">${D.scan}</div>` : ''}`;
}
function scanAll() {
  const list = devices().filter((it) => accessOf(it).ok);
  const hits = [];
  for (const it of list) {
    const f = deviceFiles(it);
    const v = f.finds?.virus;
    if (v && !it.data?.virus) { (it.data ||= {}).virus = 'quarantine'; hits.push(`🦠 ${itemTitle(it, false)}: ${v.kind === 'stealer' ? T('троян‑стилер', 'троян‑стилер', 'card stealer') : T('вымогатель', 'вимагач', 'ransomware')} → ${T('карантин', 'карантин', 'quarantined')}`); }
    connect(it);
  }
  return hits.length ? hits.map(esc).join('<br>') : `✔ ${T(`Проверено устройств: ${list.length}. Угроз нет.`, `Перевірено пристроїв: ${list.length}. Загроз немає.`, `${list.length} device(s) scanned. No threats.`)}`;
}

function term() {
  return `<div class="term-out">${(D.term.length ? D.term : [`${osName()} [${T('Версия', 'Версія', 'Version')} 10.0.22631]`, T('Введите help, чтобы увидеть команды.', 'Введіть help, щоб побачити команди.', 'Type help for commands.')]).map((l) => `<div>${esc(l)}</div>`).join('')}</div><div class="term-in"><span>C:\\&gt;</span><input data-pin="cmd" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go"><button ${pa('cmd')}>⏎</button></div>`;
}
function runCmd(raw) {
  const cmd = raw.trim().toLowerCase();
  const out = (x) => D.term.push(...String(x).split('\n'));
  D.term.push(`C:\\> ${raw}`);
  const pc = myPc(), city = L(CITY[G.s.player.city]?.name || '');
  if (!cmd) return;
  if (cmd === 'help') out(T('help, systeminfo, ipconfig, ping <сайт>, dir, chkdsk, scan, tasklist, taskkill /im <имя>, date, whoami, cls, color, shutdown', 'help, systeminfo, ipconfig, ping <сайт>, dir, chkdsk, scan, tasklist, taskkill /im <імʼя>, date, whoami, cls, color, shutdown', 'help, systeminfo, ipconfig, ping <site>, dir, chkdsk, scan, tasklist, taskkill /im <name>, date, whoami, cls, color, shutdown'));
  else if (cmd === 'cls') D.term = [];
  else if (cmd === 'systeminfo') out(`Host: ${pc.name}\nOS: ${osName()}\nSpeed: x${pc.speed}\nLocation: ${city}`);
  else if (cmd === 'ipconfig') out(`IPv4: 192.168.${(G.s.id.length * 7) % 255}.${(G.s.t % 200) + 20}\nGateway: 192.168.0.1\nVPN: ${G.s.vpn?.on && G.s.vpn.until > G.s.t ? 'ON' : 'OFF'}`);
  else if (cmd.startsWith('ping')) { const host = cmd.split(/\s+/)[1] || 'olx.ua'; const ms = 9 + (host.length * 7) % 40; out(`Pinging ${host}…\nReply: time=${ms}ms\nReply: time=${ms + 3}ms\nReply: time=${ms - 2}ms`); }
  else if (cmd === 'dir') out(myDocs().map((f) => `  ${f.n}`).join('\n'));
  else if (cmd === 'chkdsk') { const ds = devices(); const found = []; for (const it of ds) { const f = connect(it); if (f.length) found.push(`${itemTitle(it, false)}: ${f.map((c) => defectName(c)).join(', ')}`); } out(found.length ? found.join('\n') : T(`Проверено дисков: ${ds.length}. Ошибок нет.`, `Перевірено дисків: ${ds.length}. Помилок немає.`, `${ds.length} drive(s) checked. No errors.`)); }
  else if (cmd === 'scan' || cmd === 'sfc /scannow') out(scanAll().replace(/<br>/g, '\n').replace(/&[a-z]+;/g, ''));
  else if (cmd === 'tasklist') out(processList(D.wins.map((w) => w.app), mineState().on).map((p) => `${p.name.padEnd(22, ' ')} ${String(p.cpu).padStart(3, ' ')}%  ${p.mem} MB`).join('\n'));
  else if (cmd.startsWith('taskkill')) { const nm = raw.trim().split(/\s+/).pop(); const p = processList(D.wins.map((w) => w.app), mineState().on).find((x) => x.name.toLowerCase() === String(nm).toLowerCase()); if (!p) out(T(`Процесс "${nm}" не найден.`, `Процес "${nm}" не знайдено.`, `Process "${nm}" not found.`)); else { const r = endTask(p.id); if (r.bsod) { bsod(); return; } out(T(`Успешно: процесс "${p.name}" завершён.`, `Успішно: процес "${p.name}" завершено.`, `SUCCESS: "${p.name}" terminated.`)); } }
  else if (cmd === 'date' || cmd === 'time') out(hhmm());
  else if (cmd === 'whoami') out(`${(G.s.player.name || 'user').toLowerCase().replace(/\s+/g, '_')}@${city.toLowerCase().replace(/\s+/g, '-')}`);
  else if (cmd.startsWith('color')) out('OK');
  else if (cmd === 'shutdown' || cmd === 'exit') { closeDesktop(); return; }
  else if (/hack|взлом|pentagon|nasa/.test(cmd)) out(T('Доступ запрещён. Хорошая попытка 😏', 'Доступ заборонено. Гарна спроба 😏', 'Access denied. Nice try 😏'));
  else out(T(`"${raw}" не является внутренней или внешней командой.`, `"${raw}" не є внутрішньою або зовнішньою командою.`, `'${raw}' is not recognized as a command.`));
  if (D.term.length > 120) D.term = D.term.slice(-120);
}

function miner() {
  const st = mineState(), r = mineRate();
  if (!r) return `<div class="pcd-empty">⛏<b>${T('Нужен ПК с видеокартой', 'Потрібен ПК з відеокартою', 'Needs a PC with a graphics card')}</b><small>${T('Соберите ПК с видеокартой в «Сборке» и сделайте его рабочим.', 'Зберіть ПК з відеокартою у «Збірці» й зробіть його робочим.', 'Build a PC with a GPU in PC Build and make it your workstation.')}</small><button class="btn sm" ${pa('phone', 'build')}>🛠 ${T('Открыть «Сборку»', 'Відкрити «Збірку»', 'Open PC Build')}</button></div>`;
  return `<div class="pcd-hero"><span>⛏</span><div><b>${st.on ? T('Майнинг идёт', 'Майнінг іде', 'Mining') : T('Остановлен', 'Зупинено', 'Stopped')}</b><small>${r.hash} MH/s</small></div></div>
    <div class="kv"><span>${T('Доход в час', 'Дохід за годину', 'Income per hour')}</span><b class="g">+${fmt(r.income)}</b></div><div class="kv"><span>${T('Электричество в час', 'Електрика за годину', 'Electricity per hour')}</span><b class="r">−${fmt(r.power)}</b></div><div class="kv"><span>${T('Чистыми', 'Чистими', 'Net')}</span><b class="${r.net >= 0 ? 'g' : 'r'}">${fmt(r.net)}/${T('ч', 'год', 'h')}</b></div>
    <div class="kv"><span>${T('В пуле', 'У пулі', 'In the pool')}</span><b data-live-mine>${fmt(st.bal)}</b></div><div class="kv"><span>${T('Выведено всего', 'Виведено всього', 'Paid out')}</span><b>${fmt(st.total)}</b></div>
    <div class="pcd-btns"><button class="btn sm ${st.on ? 'dark' : ''}" ${pa('mtoggle')}>${st.on ? '⏸ ' + T('Остановить', 'Зупинити', 'Stop') : '▶ ' + T('Запустить', 'Запустити', 'Start')}</button><button class="btn sm dark" ${pa('mcash')}>💸 ${T('Вывести', 'Вивести', 'Cash out')}</button></div>
    <p class="small m">${T('Счёт за свет списывается каждый игровой час. На слабой видеокарте майнинг в минус.', 'Рахунок за світло списується щогодини. На слабкій відеокарті майнінг у мінус.', 'The power bill is charged every game hour. A weak GPU mines at a loss.')}</p>`;
}

// ---------------------------------------------------------------- minesweeper (9×9, 10 mines)
function newMines() {
  const n = 9, m = 10, cells = Array.from({ length: n * n }, () => ({ mine: false, open: false, flag: false, k: 0 }));
  let placed = 0;
  while (placed < m) { const i = Math.floor(Math.random() * n * n); if (!cells[i].mine) { cells[i].mine = true; placed++; } }
  const nb = (i) => { const x = i % n, y = Math.floor(i / n), r = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < n && yy < n) r.push(yy * n + xx); } return r; };
  cells.forEach((c, i) => { c.k = nb(i).filter((j) => cells[j].mine).length; });
  D.mines = { n, m, cells, nb, st: 'play', t0: Date.now() };
}
function mines() {
  const g = D.mines; if (!g) { newMines(); return mines(); }
  const left = g.m - g.cells.filter((c) => c.flag).length;
  return `<div class="ms-head"><span>💣 ${left}</span><button ${pa('mnew')}>${g.st === 'lost' ? '😵' : g.st === 'won' ? '😎' : '🙂'}</button><button class="${D.flag ? 'on' : ''}" ${pa('mflag')}>🚩 ${D.flag ? T('флажок', 'прапорець', 'flag') : T('копать', 'копати', 'dig')}</button></div><div class="ms-grid" style="grid-template-columns:repeat(${g.n},1fr)">${g.cells.map((c, i) => `<button class="ms-c ${c.open ? 'o' : ''} ${c.open && c.mine ? 'b' : ''}" ${pa('mc', i)}>${c.open ? (c.mine ? '💥' : c.k || '') : c.flag ? '🚩' : g.st === 'lost' && c.mine ? '💣' : ''}</button>`).join('')}</div>${g.st === 'won' ? `<div class="g c mt">🏆 ${T('Победа!', 'Перемога!', 'You win!')}</div>` : g.st === 'lost' ? `<div class="r c mt">${T('Бабах! Ещё разок?', 'Бабах! Ще раз?', 'Boom! Again?')}</div>` : ''}`;
}
function minesTap(i) {
  const g = D.mines; if (!g || g.st !== 'play') return;
  const c = g.cells[i];
  if (D.flag) { if (!c.open) c.flag = !c.flag; return; }
  if (c.flag || c.open) return;
  if (c.mine) { c.open = true; g.st = 'lost'; sfx('lose'); return; }
  const stack = [i];
  while (stack.length) { const j = stack.pop(); const cc = g.cells[j]; if (cc.open || cc.flag) continue; cc.open = true; if (!cc.k) for (const k of g.nb(j)) if (!g.cells[k].open && !g.cells[k].mine) stack.push(k); }
  sfx('tap');
  if (g.cells.every((x) => x.mine || x.open)) { g.st = 'won'; sfx('win'); }
}

function browser() {
  const links = [['market', '🛒', T('Объявления', 'Оголошення', 'Classifieds')], ['hw', '🧩', T('Магазин железа', 'Магазин заліза', 'Hardware store')], ['news', '📰', T('Новости', 'Новини', 'News')], ['bank', '🏦', T('Банк', 'Банк', 'Bank')], ['realty', '🏠', T('Недвижимость', 'Нерухомість', 'Real estate')]];
  if (G.s.vpn?.on && G.s.vpn.until > G.s.t) links.push(['dark', '🕶', 'tor://shadow']);
  return `<div class="pcd-url">🔒 https://</div><div class="pcd-links">${links.map(([id, ic, n]) => `<button ${pa('phone', id)}><i>${ic}</i><span>${esc(n)}</span></button>`).join('')}</div><p class="small m">${T('Сайты откроются в приложениях телефона.', 'Сайти відкриються в застосунках телефона.', 'Sites open in the phone apps.')}</p>`;
}

// ---------------------------------------------------------------- Task Manager
function taskmgr() {
  const list = processList(D.wins.map((w) => w.app), mineState().on).sort((a, b) => b.cpu - a.cpu);
  const cpu = Math.min(100, list.reduce((a, p) => a + p.cpu, 0) + 3), mem = Math.min(97, Math.round(list.reduce((a, p) => a + p.mem, 0) / 80));
  const sel = D.tm && list.find((p) => p.id === D.tm);
  return `<div class="tm-head"><div><small>${T('ЦП', 'ЦП', 'CPU')}</small><b class="${cpu > 80 ? 'r' : ''}">${cpu}%</b><div class="tm-bar"><i style="width:${cpu}%;background:${cpu > 80 ? '#ff5468' : '#4cc2ff'}"></i></div></div><div><small>${T('Память', 'Памʼять', 'Memory')}</small><b>${mem}%</b><div class="tm-bar"><i style="width:${mem}%"></i></div></div></div>
    <div class="tm-row tm-th"><span>${T('Имя', 'Імʼя', 'Name')}</span><span>${T('ЦП', 'ЦП', 'CPU')}</span><span>${T('Память', 'Памʼять', 'Mem')}</span></div>
    ${list.map((p) => `<div class="tm-row ${D.tm === p.id ? 'on' : ''}" ${pa('tmsel', p.id)}><span>${p.app ? '🪟' : '⚙️'} ${esc(p.name)}</span><span class="${p.cpu > 40 ? 'r' : ''}">${p.cpu}%</span><span>${p.mem} MB</span></div>${D.tm === p.id ? `<div class="tm-det"><div class="small">📁 ${esc(p.path)}${esc(p.path.endsWith('.exe') ? '' : p.name)}</div><div class="small m">${T('Издатель', 'Видавець', 'Publisher')}: ${esc(p.pub)}</div><div class="pcd-btns"><button class="btn xs" ${pa('tmkill', p.id)}>${T('Снять задачу', 'Зняти задачу', 'End task')}</button>${p.bad ? `<button class="btn xs dark" ${pa('tmdel', p.id)}>🗑 ${T('Открыть расположение и удалить', 'Відкрити розташування й видалити', 'Open location and delete')}</button>` : ''}</div></div>` : ''}`).join('')}
    ${badProcs().filter((p) => !p.alive).length ? `<div class="small m mt">⏳ ${T('Завершённые подозрительные процессы могут перезапуститься, пока их файл на диске.', 'Завершені підозрілі процеси можуть перезапуститися, поки їхній файл на диску.', 'Ended suspicious processes can restart while their file is on disk.')}</div>` : ''}`;
}
// ---------------------------------------------------------------- winlocker / blue screen
function renderLock() {
  const L0 = lockOf(), t = lockText();
  layer.innerHTML = `<div class="pcd-lock"><div class="lk-badge">⚠️</div><h2>${esc(L(t.n))}</h2><p>${T(`Ваш компьютер заблокирован: ${L(t.why)}. Для разблокировки переведите <b>${fmt(L0.ask)}</b> на номер +7 9xx xxx‑xx‑xx и введите код из чека. Через 12 часов все данные будут удалены.`, `Ваш компʼютер заблоковано: ${L(t.why)}. Для розблокування переведіть <b>${fmt(L0.ask)}</b> на номер +380 xx xxx‑xx‑xx і введіть код із чека. Через 12 годин усі дані буде видалено.`, `Your computer is blocked: ${L(t.why)}. To unlock, send <b>${fmt(L0.ask)}</b> and enter the code from the receipt. All data will be deleted in 12 hours.`)}</p>
    <div class="lk-in"><input data-pin="lcode" inputmode="numeric" maxlength="6" placeholder="____"><button ${pa('lcode')}>OK</button></div>${D.lockMsg ? `<div class="lk-msg">${esc(D.lockMsg)}</div>` : ''}${L0.tries ? `<small class="m">${T('Неверных попыток', 'Невірних спроб', 'Wrong tries')}: ${L0.tries}</small>` : ''}
    <div class="lk-acts"><button ${pa('lpay')}>💸 ${T('Заплатить', 'Заплатити', 'Pay')} ${fmt(L0.ask)}</button><button ${pa('llook')}>📱 ${T('Найти код на сайте антивируса', 'Знайти код на сайті антивірусу', 'Look up the code on an antivirus site')}</button><button ${pa('lreinst')}>💿 ${T('Загрузиться с флешки и переустановить Windows', 'Завантажитися з флешки й перевстановити Windows', 'Boot from a stick and reinstall Windows')}</button><button ${pa('power')}>⏻ ${T('Выключить', 'Вимкнути', 'Shut down')}</button></div></div>`;
}
function bsod() {
  if (!layer) return;
  sfx('lose');
  layer.innerHTML = `<div class="pcd-bsod"><div class="bs-face">:(</div><p>${T('На вашем ПК возникла проблема, и его необходимо перезагрузить.', 'На вашому ПК виникла проблема, і його потрібно перезавантажити.', 'Your PC ran into a problem and needs to restart.')}</p><small>CRITICAL_PROCESS_DIED · 0% ${T('выполнено', 'виконано', 'complete')}</small></div>`;
  D.wins = []; D.active = null;
  setTimeout(() => { closeDesktop(); setTimeout(() => openDesktop(), 200); }, 2600);
}

// ---------------------------------------------------------------- input
function onInput(e) {
  const k = e.target?.dataset?.pin;
  if (k === 'note') G.s.pcNote = e.target.value.slice(0, 4000);
}
function onKey(e) {
  if (e.target?.dataset?.pin === 'cmd' && e.key === 'Enter') { e.preventDefault(); const v = e.target.value; runCmd(v); if (D.open) { render(); layer.querySelector('[data-pin="cmd"]')?.focus(); } }
}
async function onClick(e) {
  const el = e.target.closest('[data-pa]');
  if (!el) { if (D.start && !e.target.closest('.pcd-start')) { D.start = false; render(); } return; }
  e.preventDefault(); e.stopPropagation();
  const a = el.dataset.pa, v = el.dataset.pv;
  switch (a) {
    case 'open': if (v === 'diag' && el.dataset.pw) D.diag.id = el.dataset.pw; openWin(v); return;
    case 'start': D.start = !D.start; render(); return;
    case 'power': closeDesktop(); return;
    case 'task': { const w = D.wins.find((x) => x.app === v); if (!w) return; if (D.active === v && !w.min) { w.min = true; render(); } else lag(() => { w.min = false; D.active = v; render(); }); return; }
    case 'min': { const w = D.wins.find((x) => x.app === v); if (w) w.min = true; render(); return; }
    case 'close': D.wins = D.wins.filter((x) => x.app !== v); D.active = D.wins[D.wins.length - 1]?.app || null; render(); return;
    case 'fact': { const [fn, id] = v.split('|'); if (fn === 'lab') { closeDesktop(); filesActions.lab(id); return; } await filesActions[fn]?.(id); render(); return; }
    case 'ex': { const dv = v !== 'c' && getItem(v); if (dv && accessOf(dv).ok) { const f = deviceFiles(dv); autorun(dv, f.finds?.virus); } }
      D.ex = v; if (!D.wins.some((w) => w.app === 'explorer')) D.wins.push({ id: 'explorer', app: 'explorer', min: false }); D.active = 'explorer'; D.wins.find((w) => w.app === 'explorer').min = false; render(); return;
    case 'doc': { const f = myDocs().find((x) => x.id === v); if (f) { G.s.pcDoc = f; toastDoc(f); } return; }
    case 'fopen': filesActions.fopen(v); return;
    case 'phonefiles': closeDesktop(); openApp('inventory', 'files', { id: v }); return;
    case 'wipe': { const it = getItem(v); if (it && await confirmBox(T('Стереть всё?', 'Стерти все?', 'Wipe everything?'), esc(itemTitle(it)), T('Стереть', 'Стерти', 'Wipe'), undefined, true)) { wipe(it); sfx('ok'); render(); } return; }
    case 'dsel': D.diag.id = v; D.diag.res = null; render(); return;
    case 'drun': {
      const it = getItem(v); if (!it || D.diag.run) return;
      const dur = clamp(3200 / pcSpeed(), 900, 3200), t0 = performance.now();
      const step = () => { if (!D.open) return; D.diag.run = Math.min(99, Math.round((performance.now() - t0) / dur * 100)); if (performance.now() - t0 < dur) { render(); setTimeout(step, 120); } else { D.diag.run = 0; D.diag.res = { id: it.id, ...runDiag(it) }; sfx(D.diag.res.found.length || D.diag.res.dead ? 'err' : 'win'); render(); } };
      step(); return;
    }
    case 'ssel': D.svc = v; render(); return;
    case 'swap': {
      const pc = getItem(D.svc); if (!pc?.build) return;
      const cand = swapCandidates(pc, v);
      if (!cand.length) { if (await confirmBox(L(SLOT_NAME[v]), T('На складе нет подходящих деталей. Открыть магазин железа?', 'На складі немає відповідних деталей. Відкрити магазин заліза?', 'No parts for this slot in storage. Open the hardware store?'), T('В магазин', 'У магазин', 'To the store'))) { closeDesktop(); openApp('hw'); } return; }
      const id = await choose(L(SLOT_NAME[v]), cand.map((it) => ({ v: it.id, label: itemTitle(it, false), sub: specLine(it) + (it.defects.some((d) => d.known) ? ' · ⚠' : '') })));
      if (!id) return;
      const r = swapPart(pc.id, v, id);
      if (r.ok) { sfx('win'); toast(T(`Готово! Мощность ${r.score}`, `Готово! Потужність ${r.score}`, `Done! Power ${r.score}`), 'g'); } else toast(r.msg || '—', 'r');
      render(); return;
    }
    case 'strip': { const it = getItem(v); if (it && await confirmBox(T('Разобрать ПК на детали?', 'Розібрати ПК на деталі?', 'Strip the PC for parts?'), T('Все комплектующие лягут на склад по отдельности.', 'Усі комплектуючі ляжуть на склад окремо.', 'Every part goes to storage separately.'), T('Разобрать', 'Розібрати', 'Strip'), undefined, true)) { const r = disassemblePc(v); if (r.ok) { sfx('ok'); toast(T(`Деталей на складе: +${r.parts.length}`, `Деталей на складі: +${r.parts.length}`, `+${r.parts.length} parts in storage`), 'g'); D.svc = null; } render(); } return; }
    case 'dust': { const it = getItem(v); if (!it) return; const r = await playMini('scrub', { title: T('Чистка от пыли', 'Чистка від пилу', 'Dusting out'), label: T('Выдуйте и ототрите пыль с радиатора и кулера', 'Видуйте й відітріть пил із радіатора і кулера', 'Blow and wipe the dust off the heatsink and fan'), pass: 0.5 }); if (r.quit) return; const res = cleanCooler(v, r.score); toast(res.fixed ? T('Кулер больше не шумит, температура упала', 'Кулер більше не шумить, температура впала', 'The fan is quiet, temps are down') : T('Почищено', 'Почищено', 'Cleaned'), 'g'); render(); return; }
    case 'repair': closeDesktop(); openApp('repair', 'item', { id: v }); return;
    case 'setmy': setMyPc(v); sfx('win'); toast(T(`Теперь это ваш рабочий ПК · ×${myPc().speed}`, `Тепер це ваш робочий ПК · ×${myPc().speed}`, `Now your workstation · ×${myPc().speed}`), 'g'); render(); return;
    case 'scan': { const caught = defenderCatch(); D.scan = (caught.length ? caught.map((n) => `🦠 ${esc(n)} → ${T('удалён', 'видалено', 'removed')}`).join('<br>') + '<br>' : '') + scanAll(); sfx(caught.length ? 'win' : 'ok'); render(); return; }
    case 'tmsel': D.tm = D.tm === v ? null : v; render(); return;
    case 'tmkill': {
      const r = endTask(v);
      if (r.bsod) { bsod(); return; }
      sfx('tap'); toast(r.bad ? T('Процесс завершён. Нагрузка упала… пока что', 'Процес завершено. Навантаження впало… поки що', 'Process ended. The load dropped… for now') : T('Процесс завершён', 'Процес завершено', 'Process ended'), r.bad ? 'g' : '');
      render(); return;
    }
    case 'tmdel': { const r = deleteFile(v); if (r.ok) { sfx('win'); toast(T('Файл удалён — больше не запустится', 'Файл видалено — більше не запуститься', 'File deleted — it won’t come back'), 'g'); D.tm = null; } else toast(r.msg || '—', 'r'); render(); return; }
    case 'lcode': { const inp = layer.querySelector('[data-pin="lcode"]'); const r = tryCode(inp?.value || ''); if (r.ok) { sfx('win'); toast(T('Разблокировано!', 'Розблоковано!', 'Unlocked!'), 'g'); render(); } else { sfx('err'); D.lockMsg = T('Неверный код', 'Невірний код', 'Wrong code'); render(); } return; }
    case 'lpay': { const r = payLocker(); if (!r.ok) { toast(r.msg || '—', 'r'); return; } if (r.honest) { sfx('ok'); toast(T(`Пришёл код ${r.code} — разблокировано`, `Прийшов код ${r.code} — розблоковано`, `Code ${r.code} arrived — unlocked`), 'g'); } else { sfx('lose'); D.lockMsg = T('Деньги ушли, кода нет. Теперь просят больше.', 'Гроші пішли, коду немає. Тепер просять більше.', 'Money gone, no code. Now they want more.'); } render(); return; }
    case 'llook': { const r = lookupCode(); if (!r.ok && r.wait) { D.lockMsg = T(`Сайт антивируса: попробуйте через ${r.wait} мин`, `Сайт антивірусу: спробуйте через ${r.wait} хв`, `Antivirus site: try again in ${r.wait} min`); } else D.lockMsg = r.code ? T(`На сайте антивируса нашёлся код для этого блокировщика: ${r.code}`, `На сайті антивірусу знайшовся код для цього блокувальника: ${r.code}`, `The antivirus site lists a code for this locker: ${r.code}`) : T('Для этого блокировщика кода пока нет. Попробуйте позже.', 'Для цього блокувальника коду поки немає. Спробуйте пізніше.', 'No code for this locker yet. Try later.'); render(); return; }
    case 'lreinst': {
      if (!installerDrive()) { D.lockMsg = T('Нужна загрузочная флешка от 8 ГБ — купите в магазине железа.', 'Потрібна завантажувальна флешка від 8 ГБ — купіть у магазині заліза.', 'You need an 8 GB+ boot stick — buy one at the hardware store.'); render(); return; }
      if (!(await confirmBox(T('Переустановить Windows?', 'Перевстановити Windows?', 'Reinstall Windows?'), T('Все вирусы исчезнут, но и ваши заметки на диске C: тоже.', 'Усі віруси зникнуть, але й ваші нотатки на диску C: теж.', 'Every virus goes, and so do your notes on C:.'), T('Переустановить', 'Перевстановити', 'Reinstall')))) return;
      cureAll(); G.s.pcNote = ''; D.wins = []; D.active = null; sfx('win'); toast(T('Система переустановлена — чисто', 'Систему перевстановлено — чисто', 'Reinstalled — clean'), 'g'); closeDesktop(); setTimeout(() => openDesktop(), 300); return;
    }
    case 'cmd': { const inp = layer.querySelector('[data-pin="cmd"]'); runCmd(inp?.value || ''); if (D.open) render(); return; }
    case 'mtoggle': { const st = mineState(); st.on = !st.on; sfx('tap'); render(); return; }
    case 'mcash': { const vv = mineCashout(); toast(vv ? `+${fmt(vv)}` : T('В пуле пока мало', 'У пулі поки мало', 'Not enough in the pool yet'), vv ? 'g' : ''); render(); return; }
    case 'mnew': newMines(); render(); return;
    case 'mflag': D.flag = !D.flag; render(); return;
    case 'mc': minesTap(+v); render(); return;
    case 'phone': closeDesktop(); openApp(v); return;
  }
}
function toastDoc(f) {
  import('../ui/shell.js').then(({ sheet }) => sheet(`<h2>${f.ic} ${esc(f.n)}</h2><pre class="pcd-pre">${esc(f.body())}</pre>`));
}
