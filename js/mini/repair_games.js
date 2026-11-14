// Repair mini‑games, one per kind of job. Built on a few mechanics, each dressed for its trade:
//  order   — do the steps in the right order / pattern (open a phone, wheel nuts in a star, watch caseback…)
//  hold    — keep a value in the green zone by holding (heat gun, steam, tyre pressure, fluid level…)
//  trace   — draw along a line (glue on a sole, windshield sealant, thermal paste, a seam…)
//  tune    — turn a knob until the needle sits in the centre and stays there (string tuning, idle rpm, laser…)
//  probe   — measure points with a meter and find the bad one (fuses, battery cells, a short on the board)
//  quiz    — read the symptom/code and pick the right part (OBD scanner)
//  dent    — push a dent out from behind without raising a bump
//  pull    — pull battery adhesive strips slowly, or they tear
//  holes   — laptop screws of different lengths back into their own holes
import { T } from '../core/i18n.js';
import { clamp } from '../core/util.js';
import { h, svgPoint } from './engine.js';

const ri = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const rf = (a, b) => a + Math.random() * (b - a);
const shuf = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const note = (api, text, ok) => { const d = h('div', 'toast ' + (ok ? 'g' : 'r'), text); d.style.cssText = 'position:absolute;left:50%;top:14%;transform:translateX(-50%);z-index:4;white-space:normal;max-width:88%;text-align:center'; api.body.appendChild(d); setTimeout(() => d.remove(), 1500); };

// ---------------------------------------------------------------- backdrops
const BG = {
  phone: '<div class="rg-phone"><i></i></div>', laptop: '<div class="rg-laptop"></div>', board: '<div class="rg-board"></div>', console: '<div class="rg-console"></div>',
  watch: '<div class="rg-watch"></div>', ring: '<div class="rg-ring"></div>', wheel: '<div class="rg-wheel"></div>', engine: '<div class="rg-engine"></div>', fuse: '<div class="rg-fusebox"></div>',
  car: '<div class="rg-carpanel"></div>', cloth: '<div class="rg-cloth"></div>', leather: '<div class="rg-leather"></div>', sole: '<div class="rg-solebg"></div>', glass: '<div class="rg-glassbg"></div>', wood: '<div class="rg-wood"></div>', cpu: '<div class="rg-cpu"></div>',
};

// ---------------------------------------------------------------- ORDER
function order(api, { label, sub = '', pts, valid, time = 24, bg = '', big = false }) {
  api.setTime(time, () => finish(false));
  api.body.innerHTML = `<div class="mhint">${label}${sub ? `<small>${sub}</small>` : ''}</div><div class="mstage rg-stage">${bg}</div>`;
  const st = api.body.querySelector('.mstage');
  const done = []; let miss = 0;
  pts.forEach((p, i) => {
    const b = h('button', 'rg-pt' + (big ? ' big' : ''), `${p.ic ? `<i>${p.ic}</i>` : ''}${p.lab ? `<small>${p.lab}</small>` : ''}`);
    b.style.left = p.x + '%'; b.style.top = p.y + '%';
    b.addEventListener('pointerdown', () => {
      if (api.ended || done.includes(i)) return;
      if (valid(done, i)) { done.push(i); b.classList.add('ok'); api.sfx('hit'); if (done.length === pts.length) finish(true); }
      else { miss++; api.sfx('err'); api.shake(b); api.addTime(-2); if (p.bad) note(api, p.bad, false); }
    });
    st.appendChild(b);
  });
  function finish(ok) { if (api.ended) return; api.end({ score: clamp((ok ? 1 : (done.length / pts.length) * 0.6) - miss * 0.15, 0, 1) }); }
}
const inOrder = (seq) => (done, i) => i === seq[done.length];

// ---------------------------------------------------------------- HOLD in a zone
function hold(api, { label, unit = '°C', lo, hi, max, start = 20, rise = 30, fall = 22, need = 3, time = 20, btn = T('Держать', 'Тримати', 'Hold'), ic = '🔥', over = T('Перегрев!', 'Перегрів!', 'Overheated!'), fmt = (v) => Math.round(v) }) {
  api.setTime(time, () => finish());
  api.body.innerHTML = `<div class="mhint">${label}<small>${T('Держите значение в зелёной зоне', 'Тримайте значення в зеленій зоні', 'Keep it in the green zone')} · ${fmt(lo)}–${fmt(hi)} ${unit}</small></div>
    <div class="mstage rg-holdst"><div class="rg-gauge"><div class="rg-zone" style="bottom:${(lo / max) * 100}%;height:${((hi - lo) / max) * 100}%"></div><div class="rg-lvl"></div></div><div class="rg-read"><b>0</b><small>${unit}</small><div class="rg-prog"><i></i></div></div></div>
    <button class="btn block rg-hold">${ic} ${btn}</button>`;
  const lvl = api.body.querySelector('.rg-lvl'), rd = api.body.querySelector('.rg-read b'), pr = api.body.querySelector('.rg-prog i'), b = api.body.querySelector('.rg-hold');
  let v = start, held = false, inZ = 0, overs = 0;
  const on = (e) => { e.preventDefault(); held = true; b.classList.add('on'); };
  const offf = () => { held = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', offf); b.addEventListener('pointerleave', offf); b.addEventListener('pointercancel', offf);
  api.onTick((dt) => {
    if (api.ended) return;
    v += (held ? rise * (1 + (v / max) * 0.7) : -fall) * dt;
    v = Math.max(start, v);
    if (v > max) { overs++; v = lo * 0.55; note(api, over, false); api.sfx('err'); api.flash(false); }
    const z = v >= lo && v <= hi;
    if (z) inZ += dt;
    lvl.style.height = clamp((v / max) * 100, 0, 100) + '%';
    lvl.style.background = z ? '#2ef2a0' : v > hi ? '#ff5468' : '#4da3ff';
    rd.textContent = fmt(v);
    pr.style.width = clamp((inZ / need) * 100, 0, 100) + '%';
    if (inZ >= need) finish();
  });
  function finish() { if (api.ended) return; api.end({ score: clamp(inZ / need - overs * 0.25, 0, 1) }); }
}

// ---------------------------------------------------------------- TRACE a line
function trace(api, { label, d, bg = '', tol = 6, time = 18, color = '#ffd166', width = 3.5, sub = '' }) {
  api.setTime(time, () => finish());
  api.body.innerHTML = `<div class="mhint">${label}<small>${sub || T('Ведите пальцем по пунктиру', 'Ведіть пальцем по пунктиру', 'Trace the dashed line')} · <b class="rg-cov">0%</b></small></div>
    <div class="mstage rg-stage">${bg}<svg class="rg-trace" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><path class="rg-guide" d="${d}" /><polyline class="rg-ink" points="" style="stroke:${color};stroke-width:${width}" /></svg></div><button class="btn dark block rg-done">${T('Готово', 'Готово', 'Done')}</button>`;
  const svg = api.body.querySelector('svg'), guide = svg.querySelector('.rg-guide'), ink = svg.querySelector('.rg-ink'), cov = api.body.querySelector('.rg-cov');
  const L0 = guide.getTotalLength(), N = 70;
  const S = Array.from({ length: N }, (_, i) => { const p = guide.getPointAtLength((i / (N - 1)) * L0); return { x: p.x, y: p.y, c: false }; });
  const pts = []; let devSum = 0, devN = 0, down = false;
  const add = (ev) => {
    const p = svgPoint(svg, ev);
    pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`); ink.setAttribute('points', pts.join(' '));
    let md = 1e9;
    for (const s of S) { const dd = Math.hypot(s.x - p.x, s.y - p.y); if (dd < md) md = dd; if (dd < tol) s.c = true; }
    devSum += Math.min(md, tol * 3); devN++;
    const c = S.filter((s) => s.c).length / N;
    cov.textContent = Math.round(c * 100) + '%';
    if (c >= 0.94) finish();
  };
  svg.addEventListener('pointerdown', (e) => { down = true; svg.setPointerCapture(e.pointerId); add(e); });
  svg.addEventListener('pointermove', (e) => { if (down) add(e); });
  svg.addEventListener('pointerup', () => { down = false; });
  api.body.querySelector('.rg-done').addEventListener('click', finish);
  function finish() {
    if (api.ended) return;
    const c = S.filter((s) => s.c).length / N, acc = devN ? 1 - clamp(devSum / devN / (tol * 1.6), 0, 1) : 0;
    api.end({ score: clamp(c * 0.72 + acc * 0.28 - (c < 0.5 ? 0.2 : 0), 0, 1) });
  }
}

// ---------------------------------------------------------------- TUNE a needle
function tune(api, { label, unit = '', target, span, need = 1.8, drift = 0.3, time = 20, fmt = (v) => v.toFixed(1), tol = 0.07, title = '' }) {
  api.setTime(time, () => finish());
  api.body.innerHTML = `<div class="mhint">${label}<small>${T('Тяните ползунок влево‑вправо, пока стрелка не встанет в центр, и удержите', 'Тягніть повзунок вліво‑вправо, доки стрілка не стане в центр, і втримайте', 'Drag the slider until the needle sits in the middle, then hold it')}</small></div>
    <div class="mstage rg-tunest"><div class="rg-dial"><div class="rg-arc"></div><div class="rg-ok"></div><div class="rg-ndl"></div><div class="rg-dread"><b></b><small>${title || `${fmt(target)} ${unit}`}</small></div></div><div class="rg-prog wide"><i></i></div></div>
    <div class="rg-knob"><span>◀</span><i></i><span>▶</span></div>`;
  const ndl = api.body.querySelector('.rg-ndl'), rd = api.body.querySelector('.rg-dread b'), pr = api.body.querySelector('.rg-prog i'), knob = api.body.querySelector('.rg-knob'), grip = knob.querySelector('i');
  let v = target + span * rf(0.55, 0.9) * (Math.random() < 0.5 ? -1 : 1), held = 0, wob = 0, drag = null;
  knob.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, v }; knob.setPointerCapture(e.pointerId); });
  knob.addEventListener('pointermove', (e) => { if (!drag) return; const w = knob.getBoundingClientRect().width; v = drag.v + ((e.clientX - drag.x) / w) * span * 1.6; grip.style.transform = `translateX(${clamp(e.clientX - drag.x, -120, 120)}px)`; });
  knob.addEventListener('pointerup', () => { drag = null; grip.style.transform = ''; });
  api.onTick((dt) => {
    if (api.ended) return;
    wob += (Math.random() - 0.5) * dt * 3; wob = clamp(wob, -1, 1);
    v += wob * drift * span * dt;
    const dev = clamp((v - target) / span, -1, 1);
    ndl.style.transform = `rotate(${dev * 62}deg)`;
    const ok = Math.abs(dev) < tol;
    ndl.classList.toggle('on', ok);
    held = ok ? held + dt : Math.max(0, held - dt * 0.6);
    rd.textContent = `${fmt(v)} ${unit}`;
    pr.style.width = clamp((held / need) * 100, 0, 100) + '%';
    if (held >= need) finish(true);
  });
  function finish(ok) { if (api.ended) return; api.end({ score: ok ? clamp(0.7 + (api.time ?? 0) / time * 0.3, 0, 1) : clamp((held / need) * 0.6, 0, 1) }); }
}

// ---------------------------------------------------------------- PROBE with a meter
function probe(api, { label, labs, read, tries, cols = 4, ic = '🔌', bg = '', sub = '' }) {
  const n = labs.length, bad = ri(0, n - 1);
  let taps = 0;
  api.setTime(26, () => api.end({ score: 0.1 }));
  api.body.innerHTML = `<div class="mhint">${label}<small>${sub} · ${T('Замеров', 'Замірів', 'Probes')}: <b class="rg-left">${tries}</b></small></div><div class="mstage rg-stage">${bg}<div class="rg-grid" style="grid-template-columns:repeat(${cols},1fr)">${labs.map((l, i) => `<button class="rg-cell" data-i="${i}"><i>${ic}</i><small>${l}</small><b></b></button>`).join('')}</div></div>`;
  const left = api.body.querySelector('.rg-left');
  api.body.querySelectorAll('.rg-cell').forEach((b) => b.addEventListener('pointerdown', () => {
    if (api.ended || b.classList.contains('read')) return;
    const i = +b.dataset.i; taps++;
    const r = read(i, i === bad);
    b.classList.add('read', i === bad ? 'bad' : 'good');
    b.querySelector('b').textContent = r;
    left.textContent = tries - taps;
    if (i === bad) { api.sfx('ok'); api.flash(true); setTimeout(() => api.end({ score: clamp(1 - ((taps - 1) / n) * 0.9, 0.25, 1), emoji: '🎯', title: T('Нашли неисправность', 'Знайшли несправність', 'Found the fault') }), 600); return; }
    api.sfx('tick');
    if (taps >= tries) setTimeout(() => api.end({ score: 0.15 }), 500);
  }));
}

// ---------------------------------------------------------------- QUIZ (pick the right part)
function quiz(api, { label, q, options, time = 22 }) {
  api.setTime(time, () => api.end({ score: 0.1 }));
  let wrong = 0;
  api.body.innerHTML = `<div class="mhint">${label}</div><div class="rg-screen">${q}</div><div class="rg-opts">${shuf(options).map((o) => `<button class="btn dark block" data-ok="${o.ok ? 1 : 0}">${o.t}</button>`).join('')}</div>`;
  api.body.querySelectorAll('[data-ok]').forEach((b) => b.addEventListener('click', () => {
    if (api.ended || b.disabled) return;
    if (b.dataset.ok === '1') { b.classList.add('green'); api.sfx('ok'); setTimeout(() => api.end({ score: [1, 0.55, 0.25][Math.min(2, wrong)] }), 450); }
    else { wrong++; b.disabled = true; b.classList.add('red'); api.sfx('err'); api.addTime(-3); }
  }));
}

// ---------------------------------------------------------------- DENT push‑out
function dent(api, { label, sub = '', n = 7, time = 24, cls = 'car' }) {
  api.setTime(time, () => finish());
  const cx = rf(2, n - 3), cy = rf(2, n - 3), D = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) D.push(Math.max(0, Math.round(3.2 - Math.hypot(x - cx, y - cy) * 1.15)));
  const total = D.reduce((a, b) => a + b, 0) || 1; let bumps = 0;
  api.body.innerHTML = `<div class="mhint">${label}<small>${sub || T('Давите изнутри в тёмные места. Лишнее нажатие — выпуклость', 'Тисніть зсередини на темні місця. Зайве натискання — опуклість', 'Push the dark spots out from behind. Too much and it bulges')}</small></div><div class="mstage rg-stage"><div class="rg-dent ${cls}" style="grid-template-columns:repeat(${n},1fr)">${D.map((_, i) => `<button data-i="${i}"></button>`).join('')}</div></div>`;
  const cells = [...api.body.querySelectorAll('.rg-dent button')];
  const paint = () => cells.forEach((c, i) => { const d = D[i]; c.style.background = d > 0 ? `rgba(0,0,0,${0.16 * d + 0.05})` : d < 0 ? 'rgba(255,255,255,.45)' : 'transparent'; });
  paint();
  cells.forEach((c, i) => c.addEventListener('pointerdown', () => {
    if (api.ended) return;
    if (D[i] > 0) { D[i]--; api.sfx('hit'); } else { D[i]--; bumps++; api.sfx('err'); api.shake(c); }
    paint();
    if (D.every((d) => d <= 0)) finish();
  }));
  function finish() { if (api.ended) return; const left = D.reduce((a, d) => a + Math.max(0, d), 0); api.end({ score: clamp(1 - left / total - bumps * 0.1, 0, 1) }); }
}

// ---------------------------------------------------------------- PULL adhesive strips slowly
function pull(api, { label, strips = 2, time = 24 }) {
  api.setTime(time, () => finish());
  api.body.innerHTML = `<div class="mhint">${label}<small>${T('Тяните язычок вверх медленно и ровно — рывок порвёт ленту', 'Тягніть язичок угору повільно й рівно — ривок порве стрічку', 'Pull the tab up slowly and steadily — a jerk tears the strip')}</small></div><div class="mstage rg-stage"><div class="rg-batt">${Array.from({ length: strips }, (_, i) => `<div class="rg-strip" data-i="${i}"><i></i><button>⇧</button></div>`).join('')}</div><div class="rg-speed"><i></i></div></div>`;
  let ok = 0, torn = 0;
  const sp = api.body.querySelector('.rg-speed i');
  api.body.querySelectorAll('.rg-strip').forEach((el) => {
    const tab = el.querySelector('button'), fill = el.querySelector('i');
    let drag = null, p = 0, last = 0, fast = 0, over = false;
    tab.addEventListener('pointerdown', (e) => { if (over || api.ended) return; drag = { y: e.clientY, p, t: performance.now() }; last = performance.now(); tab.setPointerCapture(e.pointerId); });
    tab.addEventListener('pointermove', (e) => {
      if (!drag || over) return;
      const hgt = el.getBoundingClientRect().height, now = performance.now();
      const np = clamp(drag.p + (drag.y - e.clientY) / hgt, 0, 1);
      const dt = Math.max(1, now - last) / 1000, speed = (np - p) / dt;
      last = now; p = np;
      sp.style.width = clamp(speed / 0.9, 0, 1) * 100 + '%'; sp.style.background = speed > 0.55 ? '#ff5468' : '#2ef2a0';
      fast = speed > 0.55 ? fast + dt : Math.max(0, fast - dt);
      fill.style.height = p * 100 + '%'; tab.style.bottom = `calc(${p * 100}% - 18px)`;
      if (fast > 0.16) { over = true; torn++; el.classList.add('torn'); api.sfx('err'); note(api, T('Лента порвалась!', 'Стрічка порвалася!', 'The strip tore!'), false); drag = null; check(); }
      else if (p >= 1) { over = true; ok++; el.classList.add('done'); api.sfx('ok'); drag = null; check(); }
    });
    tab.addEventListener('pointerup', () => { drag = null; });
  });
  function check() { if (ok + torn >= strips) finish(); }
  function finish() { if (api.ended) return; api.end({ score: clamp(ok / strips, 0, 1) }); }
}

// ---------------------------------------------------------------- HOLES: screws of different lengths
function holes(api, { label, time = 26 }) {
  api.setTime(time, () => finish());
  const SZ = [['3', '#9be7ff'], ['4', '#ffd166'], ['6', '#ff8fab']];
  const holesArr = shuf([0, 0, 1, 1, 2, 2, 0, 1]).map((s, i) => ({ s, x: [14, 50, 86, 14, 86, 14, 50, 86][i], y: [16, 16, 16, 50, 50, 84, 84, 84][i], f: false }));
  const tray = shuf(holesArr.map((x) => x.s));
  let cur = 0, miss = 0, pierce = 0;
  api.body.innerHTML = `<div class="mhint">${label}<small>${T('Каждый винт — в отверстие своей длины. Длинный в короткое — пробьёте плату', 'Кожен гвинт — у отвір своєї довжини. Довгий у короткий — проб’єте плату', 'Each screw goes into a hole of its length. A long one in a short hole pierces the board')}</small></div><div class="rg-tray"></div><div class="mstage rg-stage">${BG.laptop}</div>`;
  const st = api.body.querySelector('.mstage'), tr = api.body.querySelector('.rg-tray');
  const showTray = () => { tr.innerHTML = cur < tray.length ? `${T('В пинцете', 'У пінцеті', 'In the tweezers')}: <b style="color:${SZ[tray[cur]][1]}">● ${SZ[tray[cur]][0]} ${T('мм', 'мм', 'mm')}</b> · ${T('осталось', 'залишилось', 'left')} ${tray.length - cur}` : '✔'; };
  showTray();
  holesArr.forEach((ho) => {
    const b = h('button', 'rg-pt hole', `<i style="border-color:${SZ[ho.s][1]}"></i><small>${SZ[ho.s][0]}</small>`);
    b.style.left = ho.x + '%'; b.style.top = ho.y + '%';
    b.addEventListener('pointerdown', () => {
      if (api.ended || ho.f) return;
      const need = tray[cur];
      if (ho.s === need) { ho.f = true; b.classList.add('ok'); cur++; api.sfx('hit'); showTray(); if (cur >= tray.length) finish(); }
      else { miss++; if (need > ho.s) { pierce++; note(api, T('Длинный винт в коротком отверстии — пробили плату!', 'Довгий гвинт у короткому отворі — пробили плату!', 'Long screw, short hole — you pierced the board!'), false); } api.sfx('err'); api.shake(b); api.addTime(-2); }
    });
    st.appendChild(b);
  });
  function finish() { if (api.ended) return; api.end({ score: clamp((cur / tray.length) - miss * 0.1 - pierce * 0.25, 0, 1) }); }
}

// ---------------------------------------------------------------- themed games
const L3 = (ru, uk, en) => T(ru, uk, en);
const star = (n) => (done, i) => (done.length ? i === (done[0] + 2 * done.length) % n : true);
const circlePts = (n, r, ic, labs) => Array.from({ length: n }, (_, i) => ({ x: 50 + r * Math.sin((i / n) * 2 * Math.PI), y: 50 - r * Math.cos((i / n) * 2 * Math.PI), ic, lab: labs ? labs[i] : '' }));
const scatter = (n) => { const out = []; for (let i = 0; i < n; i++) { let x, y, t = 0; do { x = ri(16, 84); y = ri(14, 86); t++; } while (out.some((p) => Math.hypot(p.x - x, p.y - y) < 22) && t < 60); out.push({ x, y }); } return out; };
function steps(api, label, names, o = {}) {
  const pos = scatter(names.length);
  const pts = names.map((n, i) => ({ ...pos[i], ic: n[0], lab: n[1], bad: n[2] }));
  const shown = shuf(pts.map((_, i) => i));
  // the checklist shows the order; the parts are scattered over the device
  order(api, { label, sub: names.map((n, i) => `${i + 1}. ${n[1]}`).join(' → '), pts: shown.map((i) => pts[i]), valid: (done, k) => shown[k] === done.length, bg: o.bg || '', time: o.time || 26 });
}
export const REPAIR_GAMES = {
  // phones
  ph_heat: (api) => hold(api, { label: L3('Прогрейте клей по краю экрана феном', 'Прогрійте клей по краю екрана феном', 'Heat the adhesive round the screen edge'), lo: 80, hi: 100, max: 140, start: 25, rise: 34, fall: 26, need: 3, over: L3('Перегрели — пошли пятна на матрице!', 'Перегріли — пішли плями на матриці!', 'Too hot — the panel is marked!') }),
  ph_open: (api) => steps(api, L3('Вскройте телефон в правильном порядке', 'Розкрийте телефон у правильному порядку', 'Open the phone in the right order'), [['🔩', L3('Винты у разъёма', 'Гвинти біля розʼєму', 'Bottom screws')], ['🪝', L3('Присоска и медиатор', 'Присоска й медіатор', 'Suction cup & pick')], ['🛡', L3('Планка шлейфов', 'Планка шлейфів', 'Cable shield')], ['🔋', L3('Отключить батарею', 'Відключити батарею', 'Disconnect battery')], ['🖥', L3('Шлейф дисплея', 'Шлейф дисплея', 'Display cable'), L3('Искра! Сначала отключают батарею', 'Іскра! Спочатку відключають батарею', 'Spark! Disconnect the battery first')]], { bg: BG.phone }),
  ph_battery: (api) => pull(api, { label: L3('Вытяните клеевые ленты батареи', 'Витягніть клейові стрічки батареї', 'Pull out the battery adhesive strips'), strips: 2 }),
  ph_bend: (api) => hold(api, { label: L3('Выправьте корпус под прессом', 'Виправте корпус під пресом', 'Straighten the frame in the press'), unit: L3('кг', 'кг', 'kg'), lo: 55, hi: 70, max: 100, start: 0, rise: 22, fall: 30, need: 2.5, ic: '🗜', btn: L3('Давить', 'Тиснути', 'Press'), over: L3('Пережали — корпус треснул!', 'Перетиснули — корпус тріснув!', 'Too hard — the frame cracked!') }),
  ph_ultra: (api) => hold(api, { label: L3('Отмойте плату в ультразвуковой ванне', 'Відмийте плату в ультразвуковій ванні', 'Clean the board in the ultrasonic bath'), lo: 40, hi: 55, max: 80, start: 20, rise: 16, fall: 12, need: 3.5, ic: '🫧', btn: L3('Нагрев', 'Нагрів', 'Heat'), over: L3('Слишком горячо — отклеились компоненты!', 'Надто гаряче — відклеїлися компоненти!', 'Too hot — components lifted!') }),
  ph_speaker: (api) => tune(api, { label: L3('Проверка звука: выведите тон точно на 1 кГц', 'Перевірка звуку: виведіть тон точно на 1 кГц', 'Sound check: set the tone to exactly 1 kHz'), unit: L3('Гц', 'Гц', 'Hz'), target: 1000, span: 400, fmt: (v) => Math.round(v) }),
  // laptops & electronics
  lt_screws: (api) => holes(api, { label: L3('Нижняя крышка: соберите винты по местам', 'Нижня кришка: зберіть гвинти по місцях', 'Bottom cover: screws back where they belong') }),
  lt_keys: (api) => { const keys = shuf(['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж']).slice(0, 6); const pts = keys.map((k, i) => ({ x: 14 + (i % 3) * 36, y: 22 + Math.floor(i / 3) * 44, ic: k })); const seq = shuf(keys.map((_, i) => i)); order(api, { label: L3(`Поставьте клавиши на место: ${seq.map((i) => keys[i]).join(' ')}`, `Поставте клавіші на місце: ${seq.map((i) => keys[i]).join(' ')}`, `Put the keys back: ${seq.map((i) => keys[i]).join(' ')}`), pts, valid: inOrder(seq), big: true, time: 18 }); },
  lt_paste: (api) => trace(api, { label: L3('Нанесите термопасту крестом', 'Нанесіть термопасту хрестом', 'Apply thermal paste in an X'), d: 'M28 28 L72 72 M72 28 L28 72', bg: BG.cpu, color: '#d9dde4', width: 5 }),
  lt_short: (api) => probe(api, { label: L3('Найдите КЗ на плате тепловизором', 'Знайдіть КЗ на платі тепловізором', 'Find the short with the thermal camera'), sub: L3('Горячий элемент — виновник', 'Гарячий елемент — винуватець', 'The hot part is the culprit'), labs: ['PU1', 'PU2', 'PQ3', 'PC7', 'PL2', 'PR9', 'U4', 'C12', 'Q8', 'D3', 'L1', 'C40'], tries: 6, ic: '🌡', read: (i, bad) => (bad ? `${ri(72, 96)}°C` : `${ri(29, 38)}°C`), bg: BG.board }),
  lt_hinge: (api) => tune(api, { label: L3('Затяните петлю динамометрическим ключом', 'Затягніть петлю динамометричним ключем', 'Torque the hinge screws'), unit: L3('Н·м', 'Н·м', 'N·m'), target: 0.6, span: 0.4, fmt: (v) => v.toFixed(2) }),
  lt_dent: (api) => dent(api, { label: L3('Выправьте вмятину на крышке', 'Виправте вмʼятину на кришці', 'Push out the dent in the lid'), n: 6, cls: 'alu' }),
  // consoles
  cn_open: (api) => steps(api, L3('Разберите приставку по порядку', 'Розберіть приставку по порядку', 'Strip the console in order'), [['🏷', L3('Гарантийная наклейка', 'Гарантійна наклейка', 'Warranty sticker')], ['🔩', L3('Винты корпуса', 'Гвинти корпусу', 'Case screws')], ['📦', L3('Сдвинуть крышку', 'Зсунути кришку', 'Slide the cover')], ['🔌', L3('Шлейф кнопок', 'Шлейф кнопок', 'Button ribbon')], ['🌀', L3('Снять кулер', 'Зняти кулер', 'Fan off')]], { bg: BG.console }),
  cn_laser: (api) => tune(api, { label: L3('Подстройте ток лазера привода', 'Підлаштуйте струм лазера приводу', 'Trim the drive laser current'), unit: L3('мА', 'мА', 'mA'), target: 42, span: 18, fmt: (v) => v.toFixed(1), drift: 0.4 }),
  cn_stick: (api) => tune(api, { label: L3('Откалибруйте центр стика', 'Відкалібруйте центр стіка', 'Calibrate the stick centre'), unit: '%', target: 0, span: 30, fmt: (v) => (v > 0 ? '+' : '') + v.toFixed(1), drift: 0.55 }),
  cn_retro: (api) => hold(api, { label: L3('Отбелите пластик под УФ‑лампой', 'Відбіліть пластик під УФ‑лампою', 'Retrobright the plastic under UV'), unit: '%', lo: 70, hi: 88, max: 100, start: 0, rise: 14, fall: 8, need: 3, ic: '☀️', btn: L3('Лампа', 'Лампа', 'Lamp'), over: L3('Пересветили — пластик стал хрупким!', 'Пересвітили — пластик став крихким!', 'Overdone — the plastic went brittle!') }),
  // shoes, clothes, bags
  sh_glue: (api) => trace(api, { label: L3('Промажьте клеем край подошвы', 'Промажте клеєм край підошви', 'Run glue along the sole edge'), d: 'M14 58 C14 40 36 34 56 37 C76 40 90 46 90 58 C90 70 70 74 50 72 C30 70 14 72 14 58 Z', bg: BG.sole, color: '#f6e6a3' }),
  sh_press: (api) => hold(api, { label: L3('Прижмите подошву прессом', 'Притисніть підошву пресом', 'Press the sole'), unit: L3('кг', 'кг', 'kg'), lo: 30, hi: 45, max: 70, start: 0, rise: 18, fall: 22, need: 3, ic: '🗜', btn: L3('Прижать', 'Притиснути', 'Press'), over: L3('Пережали — клей выдавило!', 'Перетиснули — клей видавило!', 'Too hard — glue squeezed out!') }),
  sh_steam: (api) => hold(api, { label: L3('Распарьте залом утюгом через ткань', 'Розпарте залом праскою через тканину', 'Steam the crease through a cloth'), lo: 110, hi: 140, max: 200, start: 25, rise: 40, fall: 30, need: 3, ic: '♨️', btn: L3('Пар', 'Пара', 'Steam'), over: L3('Перегрели — кожа поплыла!', 'Перегріли — шкіра попливла!', 'Too hot — the leather melted!') }),
  cl_stitch: (api) => trace(api, { label: L3('Прошейте шов зигзагом', 'Прошийте шов зигзагом', 'Sew a zigzag seam'), d: 'M12 50 L20 40 L28 60 L36 40 L44 60 L52 40 L60 60 L68 40 L76 60 L84 40 L90 50', bg: BG.cloth, color: '#ff6ea8', tol: 5 }),
  cl_zip: (api) => trace(api, { label: L3('Пришейте молнию ровной строчкой', 'Пришийте блискавку рівним рядком', 'Sew the zip on in a straight line'), d: 'M40 10 L40 90 M60 90 L60 10', bg: BG.cloth, color: '#ffd166', tol: 4.5 }),
  bg_edge: (api) => trace(api, { label: L3('Прокрасьте урез сумки кисточкой', 'Пофарбуйте зріз сумки пензликом', 'Paint the bag’s edge'), d: 'M16 26 L84 26 L84 78 Q50 88 16 78 Z', bg: BG.leather, color: '#7a2e1a', tol: 4.5 }),
  bg_steam: (api) => hold(api, { label: L3('Верните сумке форму паром', 'Поверніть сумці форму парою', 'Steam the bag back into shape'), lo: 90, hi: 115, max: 160, start: 25, rise: 34, fall: 26, need: 3, ic: '♨️', btn: L3('Пар', 'Пара', 'Steam') }),
  // watches & jewellery
  wt_back: (api) => { const n = 6; order(api, { label: L3('Открутите крышку ключом: по выемкам против часовой', 'Відкрутіть кришку ключем: по виїмках проти годинникової', 'Unscrew the caseback: notch by notch, anticlockwise'), sub: L3('Начните с любой выемки', 'Почніть з будь‑якої виїмки', 'Start at any notch'), pts: circlePts(n, 34, '◆'), valid: (done, i) => (done.length ? i === (done[done.length - 1] - 1 + n) % n : true), bg: BG.watch, time: 18 }); },
  wt_reg: (api) => tune(api, { label: L3('Отрегулируйте ход на таймграфере', 'Відрегулюйте хід на таймграфері', 'Regulate the movement on the timegrapher'), unit: L3('с/сут', 'с/добу', 's/day'), target: 0, span: 40, fmt: (v) => (v > 0 ? '+' : '') + v.toFixed(1), drift: 0.45 }),
  jw_prongs: (api) => order(api, { label: L3('Закрепите камень: лапки крест‑накрест', 'Закріпіть камінь: лапки навхрест', 'Set the stone: prongs crosswise'), sub: L3('Напротив, потом соседние', 'Навпроти, потім сусідні', 'Opposite pairs first'), pts: circlePts(4, 26, '▲'), valid: (done, i) => (done.length === 0 ? true : done.length === 1 ? i === (done[0] + 2) % 4 : done.length === 2 ? [(done[0] + 1) % 4, (done[0] + 3) % 4].includes(i) : true), bg: BG.ring, time: 14 }),
  jw_size: (api) => tune(api, { label: L3('Выправьте кольцо на шпераке до размера', 'Виправте каблучку на шпераку до розміру', 'Round the ring on the mandrel to size'), unit: '', target: 17.5, span: 2, fmt: (v) => v.toFixed(2), drift: 0.25 }),
  jw_solder: (api) => hold(api, { label: L3('Пропаяйте замок горелкой', 'Пропаяйте замок пальником', 'Solder the clasp with the torch'), lo: 700, hi: 760, max: 950, start: 20, rise: 230, fall: 180, need: 2.5, ic: '🔥', btn: L3('Пламя', 'Полумʼя', 'Flame'), over: L3('Пережгли — металл поплыл!', 'Перепалили — метал поплив!', 'Overheated — the metal flowed!') }),
  // cars
  car_lug: (api) => order(api, { label: L3('Затяните колёсные гайки звёздочкой', 'Затягніть колісні гайки зірочкою', 'Torque the wheel nuts in a star'), sub: L3('Через одну — крест‑накрест', 'Через одну — навхрест', 'Every other one, across'), pts: circlePts(5, 26, '⬢'), valid: star(5), bg: BG.wheel, time: 15 }),
  car_pump: (api) => hold(api, { label: L3('Накачайте колесо до нормы', 'Накачайте колесо до норми', 'Inflate the tyre to spec'), unit: L3('бар', 'бар', 'bar'), lo: 2.2, hi: 2.4, max: 3.2, start: 0.4, rise: 0.5, fall: 0.12, need: 2.5, ic: '🛞', btn: L3('Качать', 'Качати', 'Pump'), fmt: (v) => v.toFixed(2), over: L3('Перекачали — стравили воздух', 'Перекачали — стравили повітря', 'Too much — let some air out') }),
  car_obd: (api) => { const C = [['P0301', L3('Пропуски зажигания в 1‑м цилиндре', 'Пропуски запалювання в 1‑му циліндрі', 'Cylinder 1 misfire'), L3('Катушка и свеча 1‑го цилиндра', 'Котушка і свічка 1‑го циліндра', 'Cylinder 1 coil & plug')], ['P0171', L3('Слишком бедная смесь', 'Надто бідна суміш', 'System too lean'), L3('Подсос воздуха: патрубок впуска', 'Підсос повітря: патрубок впуску', 'Vacuum leak: intake hose')], ['P0420', L3('Низкая эффективность катализатора', 'Низька ефективність каталізатора', 'Catalyst efficiency low'), L3('Катализатор', 'Каталізатор', 'Catalytic converter')], ['P0128', L3('Двигатель не прогревается', 'Двигун не прогрівається', 'Coolant below temp'), L3('Термостат', 'Термостат', 'Thermostat')], ['P0335', L3('Нет сигнала коленвала', 'Немає сигналу колінвала', 'Crank sensor circuit'), L3('Датчик коленвала', 'Датчик колінвала', 'Crank position sensor')]]; const c = C[ri(0, C.length - 1)]; quiz(api, { label: L3('Сканер OBD: выберите, что менять', 'Сканер OBD: оберіть, що міняти', 'OBD scanner: pick what to replace'), q: `<b>${c[0]}</b><small>${c[1]}</small>`, options: [{ t: c[2], ok: true }, ...shuf(C.filter((x) => x !== c)).slice(0, 3).map((x) => ({ t: x[2] }))] }); },
  car_bolts: (api) => { const n = 8, pos = scatter(n), seq = Array.from({ length: n }, (_, i) => i); order(api, { label: L3('Затяните болты по схеме из мануала: 1 → 8', 'Затягніть болти за схемою з мануалу: 1 → 8', 'Torque the bolts in the manual’s order: 1 → 8'), pts: pos.map((p, i) => ({ ...p, ic: '⬣', lab: String(i + 1) })), valid: inOrder(seq), bg: BG.engine, time: 16 }); },
  car_idle: (api) => tune(api, { label: L3('Выставьте холостые обороты', 'Виставте холості оберти', 'Set the idle speed'), unit: L3('об/мин', 'об/хв', 'rpm'), target: 800, span: 500, fmt: (v) => Math.round(v), drift: 0.5 }),
  car_fluid: (api) => hold(api, { label: L3('Залейте ATF до метки на щупе', 'Залийте ATF до мітки на щупі', 'Fill ATF up to the dipstick mark'), unit: L3('л', 'л', 'L'), lo: 6.4, hi: 6.9, max: 8.5, start: 0, rise: 1.6, fall: 0.25, need: 0.6, ic: '🛢', btn: L3('Лить', 'Лити', 'Pour'), fmt: (v) => v.toFixed(1), over: L3('Перелили — сливаем лишнее', 'Перелили — зливаємо зайве', 'Overfilled — draining the excess') }),
  car_fuse: (api) => probe(api, { label: L3('Прозвоните предохранители мультиметром', 'Продзвоніть запобіжники мультиметром', 'Test the fuses with a multimeter'), sub: L3('Сгоревший показывает OL', 'Згорілий показує OL', 'A blown one reads OL'), labs: Array.from({ length: 12 }, (_, i) => `F${i + 1}`), tries: 7, ic: '🟨', read: (i, bad) => (bad ? 'OL' : `0.${ri(1, 4)} Ω`), bg: BG.fuse }),
  car_pdr: (api) => dent(api, { label: L3('Выдавите вмятину крючками (PDR)', 'Видавіть вмʼятину гачками (PDR)', 'Push the dent out with PDR rods'), n: 7, cls: 'car' }),
  car_seal: (api) => trace(api, { label: L3('Нанесите герметик по проёму стекла', 'Нанесіть герметик по прорізу скла', 'Run sealant round the windshield frame'), d: 'M18 30 Q50 22 82 30 L90 70 Q50 77 10 70 Z', bg: BG.glass, color: '#222', width: 4.5, tol: 5 }),
  car_lights: (api) => steps(api, L3('Снимите фару по порядку', 'Зніміть фару по порядку', 'Remove the headlight in order'), [['🔌', L3('Отключить разъём', 'Відключити розʼєм', 'Unplug it')], ['🔩', L3('Верхний болт', 'Верхній болт', 'Top bolt')], ['🔩', L3('Боковой болт', 'Боковий болт', 'Side bolt')], ['🔩', L3('Нижний болт', 'Нижній болт', 'Bottom bolt')], ['💡', L3('Вынуть фару', 'Вийняти фару', 'Pull the lamp')]], { bg: BG.car }),
  car_aim: (api) => tune(api, { label: L3('Отрегулируйте свет фары по экрану', 'Відрегулюйте світло фари по екрану', 'Aim the headlight on the screen'), unit: '%', target: 0, span: 20, fmt: (v) => (v > 0 ? '+' : '') + v.toFixed(1), drift: 0.3 }),
  // bikes
  bk_true: (api) => tune(api, { label: L3('Отцентруйте колесо спицевым ключом', 'Відцентруйте колесо спицевим ключем', 'True the wheel with a spoke key'), unit: L3('мм', 'мм', 'mm'), target: 0, span: 4, fmt: (v) => (v > 0 ? '+' : '') + v.toFixed(2), drift: 0.45 }),
  bk_brake: (api) => tune(api, { label: L3('Отцентруйте тормозной калипер', 'Відцентруйте гальмівний каліпер', 'Centre the brake caliper'), unit: L3('мм', 'мм', 'mm'), target: 0, span: 3, fmt: (v) => (v > 0 ? '+' : '') + v.toFixed(2), drift: 0.35 }),
  bk_cells: (api) => probe(api, { label: L3('Найдите мёртвую банку в батарее', 'Знайдіть мертву банку в батареї', 'Find the dead cell in the pack'), sub: L3('Норма 3.6–4.1 В', 'Норма 3.6–4.1 В', 'Normal is 3.6–4.1 V'), labs: Array.from({ length: 12 }, (_, i) => `#${i + 1}`), tries: 7, ic: '🔋', read: (i, bad) => (bad ? `${rf(1.1, 2.6).toFixed(2)} V` : `${rf(3.7, 4.05).toFixed(2)} V`) }),
  // instruments
  in_tune: (api) => tune(api, { label: L3('Настройте струну по тюнеру', 'Налаштуйте струну за тюнером', 'Tune the string'), unit: L3('Гц', 'Гц', 'Hz'), target: 110, span: 12, fmt: (v) => v.toFixed(1), title: 'A 110 Гц', drift: 0.3 }),
  in_truss: (api) => tune(api, { label: L3('Подкрутите анкер: прогиб грифа', 'Підкрутіть анкер: прогин грифа', 'Adjust the truss rod: neck relief'), unit: L3('мм', 'мм', 'mm'), target: 0.25, span: 0.6, fmt: (v) => v.toFixed(2), drift: 0.25 }),
  in_glue: (api) => trace(api, { label: L3('Пролейте клей по трещине деки', 'Пролийте клей по тріщині деки', 'Run glue along the crack'), d: 'M22 18 Q34 32 30 46 T44 66 T58 84', bg: BG.wood, color: '#f6e6a3', tol: 5 }),
  // generic dents (antiques, toys…)
  dentfix: (api) => dent(api, { label: L3('Выправьте вмятину', 'Виправте вмʼятину', 'Knock out the dent'), n: 6, cls: 'alu' }),
};
