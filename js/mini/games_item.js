// Item-related minigames: inspection, authenticity check, repair games, phone lab hacking, packing.
import { T, L } from '../core/i18n.js';
import { esc, clamp, shuffleR, rint, pickR, chance, shade } from '../core/util.js';
import { renderItem } from '../ui/art.js';
import { DEFECTS, CAT_DEFECTS, TESTS, MODEL } from '../data/catalog.js';
import { defectName } from '../game/items.js';
import { svgPoint, h } from './engine.js';
import { upLevel, stat } from '../game/player.js';
import { viewsOf, viewLabel, defectView } from '../data/views.js';

// ---------------------------------------------------------------- INSPECTION
const BTN_NAME = { volup: ['«Громкость +»', '«Гучність +»', '“Volume up”'], voldn: ['«Громкость −»', '«Гучність −»', '“Volume down”'], power: ['«Включение»', '«Увімкнення»', '“Power”'] };
function localPoint(svg, ev) {
  const g = svg.querySelector('.itemg') || svg;
  const pt = svg.createSVGPoint();
  pt.x = ev.clientX; pt.y = ev.clientY;
  return pt.matrixTransform(g.getScreenCTM().inverse());
}
function inspect(api, { item, time = 30 }) {
  const extra = upLevel('eye') * 4;
  const views = viewsOf(item, { inspect: true });
  api.setTime(time + extra + Math.max(0, views.length - 2) * 4, () => finish(true), { optional: true });
  let attempts = 4 + Math.floor(upLevel('eye') / 2);
  let view = views[0];
  const findable = item.defects.filter((d) => !d.known && DEFECTS[d.c]?.vis !== 'hidden');
  const tests = [...new Set((CAT_DEFECTS[item.cat] || []).map((c) => DEFECTS[c].test).filter((t) => t && t !== 'button'))];
  const used = new Set();
  const seen = new Set();
  let found = 0;
  const phone = item.cat === 'phones' && views.includes('bottom');
  const hint = phone
    ? T('Сбоку жмите кнопки и лоток SIM, снизу — разъём, динамик, винты.', 'Збоку тисніть кнопки й лоток SIM, знизу — розʼєм, динамік, гвинти.', 'Sides: buttons and SIM tray. Bottom: port, speaker, screws.')
    : T('Часть дефектов видно только сбоку или вблизи — листайте ракурсы.', 'Частину дефектів видно лише збоку чи зблизька — гортайте ракурси.', 'Some flaws only show from the side or up close — check every angle.');
  api.body.innerHTML = `
    <div class="seg vseg">${views.map((v, i) => `<button class="${i ? '' : 'on'}" data-view="${v}">${esc(L(viewLabel(item, v)))}</button>`).join('')}</div>
    <div class="mstage" style="display:flex;align-items:center;justify-content:center;overflow:hidden"><div class="ins-wrap" style="height:100%;max-height:380px;max-width:100%;aspect-ratio:1;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.45)"></div></div>
    <div class="mhint" style="font-size:13px;margin:6px 2px">${hint}<small class="att">${T('Попыток', 'Спроб', 'Attempts')}: ${attempts}</small></div>
    <div class="tools" style="flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start;scrollbar-width:none">${tests.map((t) => `<button data-test="${t}" style="flex:none">${TESTS[t][3]} ${esc(L(TESTS[t]))}</button>`).join('')}</div>
    <button class="btn dark block done" style="margin-top:6px">${T('Всё в порядке', 'Все гаразд', 'All good')}</button>`;
  const wrap = api.body.querySelector('.ins-wrap');
  const att = api.body.querySelector('.att');
  let R;
  function draw() {
    seen.add(view);
    R = renderItem(item, { view, tilt: false, inspect: true, zoom: 1 });
    wrap.innerHTML = R.svg;
    const svg = wrap.querySelector('svg');
    svg.style.width = '100%'; svg.style.height = '100%';
    svg.addEventListener('pointerdown', onTap);
  }
  function ring(svg, x, y, ok) {
    const g = svg.querySelector('.itemg') || svg;
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 24);
    c.setAttribute('fill', 'none'); c.setAttribute('stroke', ok ? '#2ef2a0' : '#ff5468'); c.setAttribute('stroke-width', 4);
    c.setAttribute('vector-effect', 'non-scaling-stroke');
    g.appendChild(c);
    setTimeout(() => c.remove(), ok ? 1500 : 600);
  }
  function label(text, ok) { const d = h('div', 'toast ' + (ok ? 'g' : 'r'), esc(text)); d.style.cssText = 'position:absolute;left:50%;top:12%;transform:translateX(-50%);z-index:4;white-space:normal;max-width:88%;text-align:center'; api.body.appendChild(d); setTimeout(() => d.remove(), 1700); }
  const reveal = (code) => { const d = item.defects.find((x) => x.c === code && !x.known); if (!d) return false; d.known = true; found++; return true; };
  const inside = (p, r, pad = 6) => p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad;
  function onTap(ev) {
    if (api.ended) return;
    const svg = ev.currentTarget;
    const p = localPoint(svg, ev);
    // buttons: press each one, one of them may be dead
    for (const b of R.buttons || []) {
      if (!phone && view === 'front') break;
      if (!inside(p, b, 8)) continue;
      const deadKey = ['volup', 'voldn', 'power'][item.seed % 3];
      const name = L(BTN_NAME[b.k] || BTN_NAME.power);
      if (b.k === deadKey && reveal('button')) { label(T(`Кнопка ${name} не нажимается!`, `Кнопка ${name} не натискається!`, `The ${name} button is dead!`), false); api.sfx('ok'); api.flash(true); ring(svg, b.x + b.w / 2, b.y + b.h / 2, true); }
      else { api.sfx('tick'); label(T(`Кнопка ${name} нажимается: работает.`, `Кнопка ${name} натискається: працює.`, `The ${name} button clicks fine.`), true); ring(svg, b.x + b.w / 2, b.y + b.h / 2, true); }
      return;
    }
    for (const hs of R.hot || []) {
      if (!inside(p, hs)) continue;
      const cx = hs.x + hs.w / 2, cy = hs.y + hs.h / 2;
      ring(svg, cx, cy, true);
      if (hs.k === 'sim') {
        if (reveal('water')) { label(T('Лоток SIM: индикатор влаги красный — телефон был в воде!', 'Лоток SIM: індикатор вологи червоний — телефон був у воді!', 'SIM tray: the moisture sticker is red — it has been in water!'), false); api.sfx('err'); api.flash(false); }
        else { label(T('Лоток SIM: индикатор влаги белый, следов коррозии нет.', 'Лоток SIM: індикатор вологи білий, слідів корозії немає.', 'SIM tray: moisture sticker is white, no corrosion.'), true); api.sfx('tick'); }
      } else if (hs.k === 'port') {
        if (reveal('port')) { label(T('Кабель вставлен — зарядка не идёт. Разъём неисправен.', 'Кабель вставлено — зарядка не йде. Розʼєм несправний.', 'Cable in — no charging. The port is dead.'), false); api.sfx('err'); }
        else { label(T('⚡ Кабель вставлен — зарядка пошла.', '⚡ Кабель вставлено — зарядка пішла.', '⚡ Plugged in — charging.'), true); api.sfx('ok'); }
      } else if (hs.k === 'speaker') {
        if (reveal('speaker')) { label(T('Включили музыку: динамик хрипит.', 'Увімкнули музику: динамік хрипить.', 'Played some music: the speaker crackles.'), false); api.sfx('err'); }
        else { label(T('🔊 Звук чистый, без хрипа.', '🔊 Звук чистий, без хрипу.', '🔊 Sound is clean.'), true); api.sfx('tick'); }
      } else if (hs.k === 'mic') {
        label(T('🎙 Записали голосовое — микрофон пишет нормально.', '🎙 Записали голосове — мікрофон пише нормально.', '🎙 Recorded a voice note — the mic works.'), true); api.sfx('tick');
      } else if (hs.k === 'screw') {
        const opened = item.defects.some((d) => (d.c === 'nonorig' || d.c === 'battery' || d.c === 'faceid') && !d.known);
        if (opened && chance(0.55 + upLevel('expert') * 0.1)) {
          const d = item.defects.find((x) => ['nonorig', 'battery', 'faceid'].includes(x.c) && !x.known);
          d.known = true; found++;
          label(T(`Шлицы винтов сорваны — телефон вскрывали. Похоже: ${defectName(d.c)}.`, `Шліци гвинтів зірвані — телефон розкривали. Схоже: ${defectName(d.c)}.`, `Stripped screw heads — it has been opened. Likely: ${defectName(d.c)}.`), false); api.sfx('ok'); api.flash(true);
        } else { label(T('Винты родные, следов вскрытия нет.', 'Гвинти рідні, слідів розкриття немає.', 'Original screws, never opened.'), true); api.sfx('tick'); }
      }
      return;
    }
    const box = R.box;
    const hit = findable.find((d) => !d.known && defectView(item, d, views) === view && Math.hypot(p.x - (box.x + d.x * box.w), p.y - (box.y + d.y * box.h)) < Math.max(36, Math.min(box.w, box.h) * 0.16));
    if (hit) { hit.known = true; found++; api.sfx('ok'); api.flash(true); ring(svg, box.x + hit.x * box.w, box.y + hit.y * box.h, true); label(defectName(hit.c), true); setTimeout(draw, 350); }
    else { attempts--; att.textContent = `${T('Попыток', 'Спроб', 'Attempts')}: ${attempts}`; api.sfx('err'); ring(svg, p.x, p.y, false); if (attempts <= 0) finish(false); }
  }
  api.body.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => { view = b.dataset.view; api.body.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('on', x === b)); draw(); }));
  api.body.querySelectorAll('.tools button').forEach((b) => b.addEventListener('click', () => {
    if (used.has(b.dataset.test) || api.ended) return;
    used.add(b.dataset.test); b.classList.add('used');
    api.addTime(-3);
    const hits = item.defects.filter((d) => !d.known && DEFECTS[d.c]?.test === b.dataset.test);
    if (hits.length) { for (const d of hits) d.known = true; found += hits.length; label(hits.map((d) => defectName(d.c)).join(', '), false); api.sfx('err'); }
    else { label(`${TESTS[b.dataset.test][3]} OK`, true); api.sfx('ok'); }
    if (b.dataset.test === 'loupe' && item.fake && chance(0.35 + upLevel('expert') * 0.1)) { label(T('Похоже на подделку!', 'Схоже на підробку!', 'Looks fake!'), false); item.fakeSuspect = true; }
  }));
  api.body.querySelector('.done').addEventListener('click', () => finish(true));
  function finish() {
    stat('inspections');
    const total = item.defects.length;
    const left = item.defects.filter((d) => !d.known).length;
    const angles = T(`Осмотрено ракурсов: ${seen.size} из ${views.length}.`, `Оглянуто ракурсів: ${seen.size} з ${views.length}.`, `Angles checked: ${seen.size} of ${views.length}.`);
    api.end({ score: total ? 1 - left / total : 1, found, emoji: '🔍', title: T('Осмотр завершён', 'Огляд завершено', 'Inspection done'), text: (found ? T(`Найдено проблем: ${found}`, `Знайдено проблем: ${found}`, `Issues found: ${found}`) : T('Новых проблем не нашли', 'Нових проблем не знайшли', 'No new issues found')) + '. ' + angles });
  }
  draw();
}

// ---------------------------------------------------------------- LEGIT CHECK
const TYPO = (s) => { const a = s.split(''); const i = rint(1, Math.max(1, a.length - 2)); const r = Math.random(); if (r < 0.4 && a[i + 1]) [a[i], a[i + 1]] = [a[i + 1], a[i]]; else if (r < 0.7) a[i] = a[i] === 'O' ? '0' : a[i] === 'I' ? 'l' : a[i] === 'E' ? 'F' : a[i] + a[i]; else a.splice(i, 1); return a.join(''); };
function legit(api, { item }) {
  const m = MODEL[item.m];
  const brand = m.brand.toUpperCase().replace(/[^A-ZА-Я0-9 ]/g, '');
  const rounds = 5;
  const diffCount = !item.fake ? 0 : item.fake === 1 ? rint(3, 4) : rint(1, 2);
  const diffIdx = new Set(shuffleR([0, 1, 2, 3, 4]).slice(0, diffCount));
  let r = 0, correct = 0;
  const serial = `${String.fromCharCode(65 + (item.seed % 26))}${String.fromCharCode(65 + ((item.seed >> 3) % 26))}${item.seed % 90 + 10}‑${String(item.seed).padStart(6, '7').slice(-6)}`;
  const kinds = shuffleR(['logo', 'serial', 'stitch', 'color', 'weight']);
  api.setTime(40);
  api.body.innerHTML = `<div class="mhint">${T('Сравните деталь с эталоном. Совпадает?', 'Порівняйте деталь з еталоном. Збігається?', 'Compare with the reference. Does it match?')}<small class="rnd"></small></div><div class="mstage lg"></div><div class="btns"><button class="btn red" data-ans="0">✕ ${T('Отличается', 'Відрізняється', 'Different')}</button><button class="btn green" data-ans="1">✓ ${T('Совпадает', 'Збігається', 'Matches')}</button></div>`;
  const stage = api.body.querySelector('.lg');
  const panel = (label, inner) => `<div class="card" style="margin-bottom:10px"><div class="small m mb">${label}</div>${inner}</div>`;
  function show() {
    const kind = kinds[r];
    const diff = diffIdx.has(r);
    api.body.querySelector('.rnd').textContent = `${r + 1} / ${rounds}`;
    let refH = '', itH = '';
    if (kind === 'logo') { refH = `<div class="center" style="font:900 30px/1 Georgia,serif;letter-spacing:4px">${esc(brand)}</div>`; itH = `<div class="center" style="font:900 30px/1 Georgia,serif;letter-spacing:4px">${esc(diff ? TYPO(brand) : brand)}</div>`; }
    if (kind === 'serial') { const bad = serial.slice(0, -1) + (diff ? (item.fake === 1 ? 'XX' : String((+serial.slice(-1) + 1) % 10)) : serial.slice(-1)); refH = `<div class="center mono" style="font-size:24px">${serial.replace(/\d(?=\d{3}$)/g, '•')}</div><div class="center tiny m">${T('формат номера', 'формат номера', 'serial format')}</div>`; itH = `<div class="center mono" style="font-size:24px">${diff ? bad : serial}</div>`; }
    if (kind === 'stitch') { const n = 12; const k = diff ? n - rint(1, 3) : n; const row = (c) => `<svg viewBox="0 0 240 30" style="width:100%;height:30px"><line x1="10" y1="15" x2="230" y2="15" stroke="#e8e8e8" stroke-width="3" stroke-dasharray="${(220 / c) * 0.6} ${(220 / c) * 0.4}"/></svg>`; refH = row(n) + `<div class="center tiny m">${n} ${T('стежков на 3 см', 'стібків на 3 см', 'stitches / 3 cm')}</div>`; itH = row(k); }
    if (kind === 'color') { const base = ['#c8102e', '#1e3f9a', '#2fa36b', '#c9a227', '#6b4428'][item.seed % 5]; const sw = (c) => `<div style="height:44px;border-radius:10px;background:${c}"></div>`; refH = sw(base); itH = sw(diff ? shade(base, item.fake === 1 ? 0.28 : 0.12) : base); }
    if (kind === 'weight') { const w = 80 + (item.seed % 900); const ww = diff ? Math.round(w * (item.fake === 1 ? 0.78 : 0.93)) : w; refH = `<div class="center" style="font-size:28px;font-weight:800">${w} ${T('г', 'г', 'g')}</div>`; itH = `<div class="center" style="font-size:28px;font-weight:800">${ww} ${T('г', 'г', 'g')}</div>`; }
    stage.innerHTML = panel(T('Эталон', 'Еталон', 'Reference'), refH) + panel(T('Этот экземпляр', 'Цей екземпляр', 'This item'), itH);
  }
  api.body.querySelectorAll('[data-ans]').forEach((b) => b.addEventListener('click', () => {
    if (api.ended) return;
    const saysMatch = b.dataset.ans === '1';
    const ok = saysMatch === !diffIdx.has(r);
    if (ok) correct++;
    api.flash(ok); api.sfx(ok ? 'ok' : 'err');
    r++;
    if (r >= rounds) done(); else show();
  }));
  function done() {
    const score = correct / rounds;
    api.end({ score, emoji: '🔎', title: T('Проверка завершена', 'Перевірку завершено', 'Check complete'), text: T(`Верных ответов: ${correct}/${rounds}`, `Правильних відповідей: ${correct}/${rounds}`, `Correct: ${correct}/${rounds}`) });
  }
  api.setTime(40, done);
  show();
}

// ---------------------------------------------------------------- SCREWS (tap in order)
function screws(api, { n = 6, time = 14, label }) {
  api.setTime(time, () => api.end({ score: hit / n }));
  api.body.innerHTML = `<div class="mhint">${label || T('Открутите винты по порядку: 1 → ' + n, 'Відкрутіть гвинти по порядку: 1 → ' + n, 'Unscrew in order: 1 → ' + n)}</div><div class="mstage"><div style="position:absolute;inset:6% 18%;border-radius:36px;background:linear-gradient(160deg,#2a2f3a,#141820);border:2px solid #3a4252"></div></div>`;
  const st = api.body.querySelector('.mstage');
  let hit = 0;
  const pos = [];
  for (let i = 0; i < n; i++) { let x, y, tries = 0; do { x = rint(24, 76); y = rint(12, 88); tries++; } while (pos.some((p) => Math.hypot(p.x - x, p.y - y) < 16) && tries < 50); pos.push({ x, y }); }
  pos.forEach((p, i) => {
    const b = h('button', '', `<span style="font-weight:900">${i + 1}</span>`);
    b.style.cssText = `position:absolute;left:${p.x}%;top:${p.y}%;transform:translate(-50%,-50%);width:50px;height:50px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#e8eaee,#7a808a);color:#111;border:3px solid #5a606a`;
    b.addEventListener('pointerdown', () => {
      if (api.ended) return;
      if (i === hit) { hit++; b.style.transition = 'transform .25s, opacity .25s'; b.style.transform = 'translate(-50%,-50%) rotate(-270deg) scale(.4)'; b.style.opacity = '0'; api.sfx('hit'); if (hit === n) api.end({ score: clamp(0.6 + api.time / time, 0, 1) }); }
      else { api.addTime(-2); api.sfx('err'); api.shake(b); }
    });
    st.appendChild(b);
  });
}

// ---------------------------------------------------------------- SCRUB (rub dirt off)
function scrub(api, { time = 12, label, item }) {
  api.setTime(time, () => finish());
  api.body.innerHTML = `<div class="mhint">${label || T('Ототрите грязь пальцем', 'Відтріть бруд пальцем', 'Rub the dirt off')}<small class="pc">0%</small></div><div class="mstage"><div class="sc-img" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"></div><canvas style="position:absolute;inset:0;width:100%;height:100%;touch-action:none"></canvas></div>`;
  const st = api.body.querySelector('.mstage');
  if (item) { const r = renderItem(item, { bg: false, view: 'front' }); st.querySelector('.sc-img').innerHTML = r.svg; st.querySelector('svg').style.cssText = 'width:90%;height:90%'; }
  const cv = st.querySelector('canvas');
  const W = 160, H = 160;
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${rint(70, 110)},${rint(55, 80)},${rint(30, 50)},${Math.random() * 0.5 + 0.5})`; g.beginPath(); g.arc(Math.random() * W, Math.random() * H, Math.random() * 9 + 3, 0, 7); g.fill(); }
  g.globalCompositeOperation = 'destination-out';
  let down = false;
  const rub = (ev) => { const r = cv.getBoundingClientRect(); const x = ((ev.clientX - r.left) / r.width) * W, y = ((ev.clientY - r.top) / r.height) * H; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); };
  cv.addEventListener('pointerdown', (e) => { down = true; rub(e); });
  cv.addEventListener('pointermove', (e) => { if (down) rub(e); });
  window.addEventListener('pointerup', () => { down = false; });
  let acc = 0;
  api.onTick((dt) => { acc += dt; if (acc > 0.35) { acc = 0; const p = cleaned(); api.body.querySelector('.pc').textContent = Math.round(p * 100) + '%'; if (p > 0.9) finish(); } });
  function cleaned() { const d = g.getImageData(0, 0, W, H).data; let clear = 0; for (let i = 3; i < d.length; i += 16) if (d[i] < 40) clear++; return clear / (d.length / 16); }
  function finish() { if (api.ended) return; api.end({ score: clamp(cleaned() / 0.85, 0, 1) }); }
}

// ---------------------------------------------------------------- TIMING (needle QTE)
function timing(api, { rounds = 3, label, speed = 1.3, zone = 0.22, title }) {
  let r = 0, hits = 0, perfect = 0, pos = 0, dir = 1;
  let z0 = 0, zw = zone;
  api.body.innerHTML = `<div class="mhint">${label || T('Нажмите, когда стрелка в зелёной зоне', 'Натисніть, коли стрілка в зеленій зоні', 'Tap when the needle is in the green zone')}<small class="rr"></small></div><div class="mstage" style="display:flex;flex-direction:column;justify-content:center;gap:18px"><div class="needle-track"><div class="zone"></div><div class="zone perfect"></div><div class="ndl"></div></div><button class="btn block" style="min-height:120px;font-size:22px;border-radius:24px">${T('ЖМИ!', 'ТИСНИ!', 'TAP!')}</button></div>`;
  const zoneEl = api.body.querySelector('.zone'), pz = api.body.querySelector('.zone.perfect'), ndl = api.body.querySelector('.ndl');
  function newZone() { zw = Math.max(0.08, zone - r * 0.03); z0 = Math.random() * (1 - zw); zoneEl.style.left = z0 * 100 + '%'; zoneEl.style.width = zw * 100 + '%'; pz.style.left = (z0 + zw * 0.35) * 100 + '%'; pz.style.width = zw * 0.3 * 100 + '%'; api.body.querySelector('.rr').textContent = `${r + 1} / ${rounds}`; }
  api.onTick((dt) => { pos += dir * dt * speed * (1 + r * 0.15); if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; } ndl.style.left = pos * 100 + '%'; });
  api.body.querySelector('.btn').addEventListener('pointerdown', () => {
    if (api.ended) return;
    const inZ = pos >= z0 && pos <= z0 + zw;
    const perf = pos >= z0 + zw * 0.35 && pos <= z0 + zw * 0.65;
    if (inZ) { hits++; if (perf) perfect++; api.flash(true); api.sfx(perf ? 'cash' : 'ok'); } else { api.flash(false); api.sfx('err'); }
    r++;
    if (r >= rounds) api.end({ score: (hits + perfect * 0.25) / (rounds * 1.25) * (hits === rounds ? 1.05 : 1), perfect });
    else newZone();
  });
  newZone();
}

// ---------------------------------------------------------------- ALIGN (drag a part into place)
function align(api, { time = 12, label }) {
  api.setTime(time, () => finish());
  api.body.innerHTML = `<div class="mhint">${label || T('Перетащите деталь точно на место', 'Перетягніть деталь точно на місце', 'Drag the part exactly into place')}</div><div class="mstage"><div class="tgt" style="position:absolute;left:30%;top:20%;width:40%;height:52%;border:3px dashed #2ef2a0;border-radius:24px"></div><div class="pc" style="position:absolute;left:8%;top:62%;width:40%;height:52%;border-radius:24px;background:linear-gradient(160deg,#4a5a7a,#1a2030);border:2px solid #8aa;touch-action:none;transform:rotate(${rint(-14, 14)}deg)"></div></div><button class="btn block done">${T('Установить', 'Встановити', 'Install')}</button>`;
  const st = api.body.querySelector('.mstage'), pc = api.body.querySelector('.pc'), tgt = api.body.querySelector('.tgt');
  let drag = null;
  pc.addEventListener('pointerdown', (e) => { const r = pc.getBoundingClientRect(); drag = { dx: e.clientX - r.left, dy: e.clientY - r.top }; pc.setPointerCapture(e.pointerId); });
  pc.addEventListener('pointermove', (e) => { if (!drag) return; const s = st.getBoundingClientRect(); pc.style.left = ((e.clientX - s.left - drag.dx) / s.width) * 100 + '%'; pc.style.top = ((e.clientY - s.top - drag.dy) / s.height) * 100 + '%'; });
  pc.addEventListener('pointerup', () => { drag = null; pc.style.transform = 'rotate(0deg)'; pc.style.transition = 'transform .2s'; });
  api.body.querySelector('.done').addEventListener('click', finish);
  function finish() { if (api.ended) return; const a = pc.getBoundingClientRect(), b = tgt.getBoundingClientRect(); const d = Math.hypot(a.left - b.left, a.top - b.top) / b.width; api.end({ score: clamp(1 - d * 2.2, 0, 1) }); }
}

// ---------------------------------------------------------------- WIRES (connect matching colours)
function wires(api, { n = 4, time = 15, label }) {
  const cols = shuffleR(['#ff5468', '#2ef2a0', '#4da3ff', '#ffc94d', '#b07cff', '#ff8a3d']).slice(0, n);
  const right = shuffleR(cols);
  let sel = null, done = 0, mistakes = 0;
  api.setTime(time, () => api.end({ score: done / n - mistakes * 0.1 }));
  api.body.innerHTML = `<div class="mhint">${label || T('Соедините контакты одного цвета', 'Зʼєднайте контакти одного кольору', 'Connect matching colours')}</div><div class="mstage"><svg class="wsvg" style="position:absolute;inset:0;width:100%;height:100%"></svg><div class="wl" style="position:absolute;left:4%;top:0;bottom:0;display:flex;flex-direction:column;justify-content:space-around"></div><div class="wr" style="position:absolute;right:4%;top:0;bottom:0;display:flex;flex-direction:column;justify-content:space-around"></div></div>`;
  const st = api.body.querySelector('.mstage'), svg = api.body.querySelector('.wsvg');
  const mk = (c, side) => { const b = h('button'); b.style.cssText = `width:56px;height:44px;border-radius:12px;background:${c};border:3px solid #0008`; b.dataset.c = c; b.dataset.side = side; return b; };
  cols.forEach((c) => api.body.querySelector('.wl').appendChild(mk(c, 'L')));
  right.forEach((c) => api.body.querySelector('.wr').appendChild(mk(c, 'R')));
  st.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled || api.ended) return;
    if (b.dataset.side === 'L') { sel = b; api.body.querySelectorAll('.wl button').forEach((x) => (x.style.outline = x === b ? '3px solid #fff' : '')); return; }
    if (!sel) return;
    if (b.dataset.c === sel.dataset.c) {
      const s = st.getBoundingClientRect(), a1 = sel.getBoundingClientRect(), a2 = b.getBoundingClientRect();
      svg.insertAdjacentHTML('beforeend', `<line x1="${a1.right - s.left}" y1="${a1.top + a1.height / 2 - s.top}" x2="${a2.left - s.left}" y2="${a2.top + a2.height / 2 - s.top}" stroke="${b.dataset.c}" stroke-width="8" stroke-linecap="round"/>`);
      sel.disabled = b.disabled = true; sel.style.outline = ''; sel = null; done++; api.sfx('ok');
      if (done === n) api.end({ score: clamp(1 - mistakes * 0.15, 0, 1) });
    } else { mistakes++; api.sfx('err'); api.shake(b); api.addTime(-2); }
  });
}

// ---------------------------------------------------------------- COLOR (match paint)
function color(api, { time = 20, label }) {
  const tgt = [rint(30, 225), rint(30, 225), rint(30, 225)];
  const cur = [128, 128, 128];
  api.setTime(time, () => finish());
  api.body.innerHTML = `<div class="mhint">${label || T('Подберите оттенок краски', 'Підберіть відтінок фарби', 'Match the paint colour')}</div><div class="mstage" style="display:flex;flex-direction:column;gap:12px;justify-content:center"><div class="row" style="gap:10px"><div class="grow center"><div class="small m">${T('Цель', 'Ціль', 'Target')}</div><div style="height:90px;border-radius:16px;background:rgb(${tgt})"></div></div><div class="grow center"><div class="small m">${T('Ваша краска', 'Ваша фарба', 'Yours')}</div><div class="mine" style="height:90px;border-radius:16px;background:rgb(${cur})"></div></div></div>${['R', 'G', 'B'].map((k, i) => `<label class="small m">${k}<input type="range" min="0" max="255" value="128" data-i="${i}" style="accent-color:${['#ff5468', '#2ef2a0', '#4da3ff'][i]}"></label>`).join('')}</div><button class="btn block done">${T('Покрасить', 'Пофарбувати', 'Paint')}</button>`;
  api.body.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', () => { cur[+inp.dataset.i] = +inp.value; api.body.querySelector('.mine').style.background = `rgb(${cur})`; }));
  api.body.querySelector('.done').addEventListener('click', finish);
  function finish() { if (api.ended) return; const d = Math.hypot(tgt[0] - cur[0], tgt[1] - cur[1], tgt[2] - cur[2]); api.end({ score: clamp(1 - d / 140, 0, 1) }); }
}

// ---------------------------------------------------------------- HACK (phone lab terminal)
const WORDS = ['ROOTKIT', 'BOOTROM', 'KERNEL', 'SANDBOX', 'EXPLOIT', 'FIRMWARE', 'BYPASS', 'PAYLOAD', 'DAEMON', 'SYSCALL', 'TOKENS', 'SECURE', 'BINARY', 'MODULE', 'REBOOT', 'BUFFER', 'SIGNER', 'BASEBAND', 'UNLOCKS', 'PATCHER'];
function hack(api, { tries = 4, label }) {
  const len = 7;
  const pool = shuffleR(WORDS.filter((w) => w.length === len)).slice(0, 9);
  while (pool.length < 9) pool.push(shuffleR(WORDS.filter((w) => w.length === len))[0]);
  const pass = pickR(pool);
  let left = tries + Math.floor(upLevel('expert') / 2);
  api.setTime(45, () => api.end({ score: 0, title: T('Таймаут', 'Таймаут', 'Timeout') }), { optional: true });
  const hex = () => '0x' + rint(4096, 65535).toString(16).toUpperCase();
  api.body.innerHTML = `<div class="termbox" style="margin-bottom:10px"><span class="hl">&gt; Phone Lab v2.6</span><br>${label || T('Подбери ключ прошивки. Подсказка: число совпавших букв на своих местах.', 'Підбери ключ прошивки. Підказка: кількість збігів букв на своїх місцях.', 'Find the firmware key. Hint: letters matching in place.')}<br><span class="dim lg-log"></span></div><div class="pad-grid" style="grid-template-columns:1fr 1fr 1fr">${pool.map((w) => `<button class="mono" data-w="${w}"><span class="dim tiny">${hex()}</span><br>${w}</button>`).join('')}</div><div class="mhint mono tries">${T('Попыток', 'Спроб', 'Tries')}: ${'▮'.repeat(left)}</div>`;
  const logEl = api.body.querySelector('.lg-log');
  api.body.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => {
    if (api.ended || b.disabled) return;
    const w = b.dataset.w;
    if (w === pass) { b.classList.add('ok'); logEl.innerHTML += `&gt; ${w} … <span class="hl">ACCESS GRANTED</span><br>`; api.sfx('win'); setTimeout(() => api.end({ score: 1, emoji: '🔓', title: T('Доступ получен', 'Доступ отримано', 'Access granted') }), 600); return; }
    const like = w.split('').filter((c, i) => pass[i] === c).length;
    b.classList.add('bad'); b.disabled = true; left--;
    logEl.innerHTML += `&gt; ${w} … ${like}/${len}<br>`;
    api.body.querySelector('.tries').textContent = `${T('Попыток', 'Спроб', 'Tries')}: ${'▮'.repeat(Math.max(0, left))}`;
    api.sfx('err');
    if (left <= 0) api.end({ score: 0.1, emoji: '💀', title: T('Доступ запрещён', 'Доступ заборонено', 'Access denied') });
  }));
}

// ---------------------------------------------------------------- PACK (pop bubble wrap)
function pack(api, { time = 8 }) {
  const n = 24;
  let popped = 0;
  api.setTime(time, () => api.end({ score: popped / n }));
  api.body.innerHTML = `<div class="mhint">${T('Упакуйте посылку: лопайте пупырки!', 'Запакуйте посилку: лускайте пухирці!', 'Pack it: pop the bubble wrap!')}</div><div class="pad-grid" style="grid-template-columns:repeat(4,1fr);flex:1">${Array.from({ length: n }, () => `<button style="border-radius:50%;aspect-ratio:1;background:radial-gradient(circle at 35% 35%,#ffffffcc,#b9d8f066);border:2px solid #cfe6ff55"></button>`).join('')}</div>`;
  api.body.querySelectorAll('.pad-grid button').forEach((b) => b.addEventListener('pointerdown', () => { if (b.disabled || api.ended) return; b.disabled = true; b.style.background = '#2a3440'; b.style.transform = 'scale(.85)'; popped++; api.sfx('hit'); if (popped === n) api.end({ score: 1 }); }));
}

export const ITEM_GAMES = { inspect, legit, screws, scrub, timing, align, wires, color, hack, pack, screen: align, solder: timing, dent: timing };
