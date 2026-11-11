// Phone Lab procedures: jailbreak (Pear), root (Android) and reflash. Every run is assembled from a
// pool of puzzle steps, so the same job plays differently each time: button combos into DFU /
// download / fastboot, picking the right firmware, exploit chains, kernel patching, hex signature
// hunting, bit registers, terminal commands from a forum guide, test points on the board, checksum
// checks, crash-log reading, a flaky cable while flashing, and the setup assistant afterwards.
import { T, lang } from '../core/i18n.js';
import { esc, clamp } from '../core/util.js';
import { RNG } from '../core/rng.js';
import { MODEL } from '../data/catalog.js';
import { G } from '../core/state.js';
import { procedure, pick, shuf, ri, hex2, gate, keypad } from './proc.js';

// ---------------------------------------------------------------- device descriptor
const REGIONS = ['EUX', 'SER', 'XEO', 'INS', 'TUR', 'KOO', 'BTU'];
export function deviceOf(it) {
  const m = (it && MODEL[it.m]) || { brand: 'Pear', name: 'iFone 11', year: 2019, os: 'pear' };
  const r = new RNG('dev|' + (it?.id || 'x'));
  const y = m.year || 2020;
  const name = `${m.brand} ${m.name}`;
  const pear = m.os !== 'droid';
  const d = { name, brand: m.brand, pear, year: y };
  if (pear) {
    const gen = clamp(y - 2007, 6, 19);
    const n = m.name;
    const v = /Pro Max/.test(n) ? 5 : /Pro/.test(n) ? 3 : /Plus|Max/.test(n) ? 4 : /mini/.test(n) ? 6 : /Air/.test(n) ? 7 : /SE|\de\b/.test(n) ? 8 : 1;
    d.id = `iFone${gen},${v}`; d.gen = gen; d.v = v;
    d.major = clamp(y - 2006 + r.int(0, 3), 9, 20); d.minor = r.int(0, 6);
    d.ver = `${d.major}.${d.minor}`;
    d.os = `PearOS ${d.ver}`;
    d.home = y <= 2016 || /SE|\b[678]\b/.test(n);
  } else {
    const hcode = (s) => (parseInt(r.int(100, 999), 10) + s.length * 7) % 900 + 100;
    d.code = m.brand === 'Samsong' ? `SM-${r.pick(['G', 'S', 'A', 'N'])}${hcode(m.name)}${r.pick(['B', 'F'])}` : m.brand === 'Gugle' ? `G${r.int(10, 99)}${String.fromCharCode(65 + r.int(0, 25))}${String.fromCharCode(65 + r.int(0, 25))}` : `${m.brand.slice(0, 2).toUpperCase()}-${r.int(1000, 9999)}`;
    d.id = d.code;
    d.android = clamp(y - 2009 + r.int(0, 2), 7, 16);
    d.bl = r.int(2, 8);
    d.region = r.pick(REGIONS);
    d.os = `Android ${d.android}`;
    d.ver = String(d.android);
    d.samsong = m.brand === 'Samsong';
  }
  return d;
}

// ---------------------------------------------------------------- phone drawing (side buttons light up)
function phoneSVG(dev, screen = '', cls = '') {
  const home = dev.pear && dev.home;
  const sy = home ? 30 : 16, sh = home ? 112 : 144;
  return `<svg class="pphone ${cls}" viewBox="0 0 220 200"><defs><linearGradient id="pgl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a3346"/><stop offset="1" stop-color="#151a24"/></linearGradient></defs>
    <rect x="70" y="6" width="80" height="164" rx="16" fill="url(#pgl)" stroke="#6f7a90" stroke-width="3"/>
    <rect class="sb sb-volup" x="63" y="44" width="6" height="18" rx="2"/><rect class="sb sb-voldn" x="63" y="68" width="6" height="18" rx="2"/>
    <rect class="sb sb-power" x="151" y="52" width="6" height="26" rx="2"/>
    ${home ? '<circle class="sb sb-home" cx="110" cy="156" r="7" stroke="#6f7a90" stroke-width="1.5"/>' : '<rect x="98" y="11" width="24" height="5" rx="2.5" fill="#05070a"/>'}
    <g class="scr"><rect x="76" y="${sy}" width="68" height="${sh}" rx="9" fill="#0d1526"/>${screen}</g>
    <path d="M110 170 v14 h-34" fill="none" stroke="#c9d2e0" stroke-width="3" stroke-linecap="round"/></svg>`;
}
const scrText = (dev, t, size = 13, col = '#dfe7f5', dy = 0) => { const cy = (dev.pear && dev.home ? 86 : 88) + dy; return `<text x="110" y="${cy}" text-anchor="middle" font-size="${size}" font-weight="700" fill="${col}" font-family="system-ui,sans-serif">${esc(t)}</text>`; };

// ---------------------------------------------------------------- STEP: hardware button combo (DFU / download / fastboot)
const BN = () => ({ power: T('⏻ Питание', '⏻ Живлення', '⏻ Power'), volup: T('Громкость +', 'Гучність +', 'Volume +'), voldn: T('Громкость −', 'Гучність −', 'Volume −'), home: T('◯ Домой', '◯ Додому', '◯ Home') });
function comboRecipe(dev) {
  const B = BN();
  const U = (s) => s.toUpperCase().replace(/^[⏻◯] /, '');
  if (dev.pear && dev.home) return {
    name: T('режим DFU', 'режим DFU', 'DFU mode'), done: T('Устройство в режиме DFU', 'Пристрій у режимі DFU', 'Device is in DFU mode'),
    desc: T(`Зажми ${U(B.home)} и ${U(B.power)} вместе на 6 секунд. Потом отпусти ${U(B.power)}, а ${U(B.home)} держи ещё 4.`, `Затисни ${U(B.home)} і ${U(B.power)} разом на 6 секунд. Потім відпусти ${U(B.power)}, а ${U(B.home)} тримай ще 4.`, `Hold ${U(B.home)} and ${U(B.power)} for 6 s, then release ${U(B.power)} and keep ${U(B.home)} for 4 more.`),
    btns: ['power', 'home'],
    phases: [{ hold: ['home', 'power'], dur: 6, say: T('Держи обе кнопки', 'Тримай обидві кнопки', 'Hold both') }, { hold: ['home'], dur: 4, grace: 1.6, say: T(`Отпусти ${U(B.power)}! ${U(B.home)} — держи`, `Відпусти ${U(B.power)}! ${U(B.home)} — тримай`, `Release ${U(B.power)}! Keep ${U(B.home)}`) }],
    final: 'black',
  };
  if (dev.pear) return pick([{
    name: T('режим DFU', 'режим DFU', 'DFU mode'), done: T('Устройство в режиме DFU', 'Пристрій у режимі DFU', 'Device is in DFU mode'),
    desc: T(`Зажми ${U(B.power)} и ${U(B.voldn)} вместе на 4 секунды. Потом отпусти ${U(B.power)}, а ${U(B.voldn)} держи ещё 4.`, `Затисни ${U(B.power)} і ${U(B.voldn)} разом на 4 секунди. Потім відпусти ${U(B.power)}, а ${U(B.voldn)} тримай ще 4.`, `Hold ${U(B.power)} + ${U(B.voldn)} for 4 s, then release ${U(B.power)} and keep ${U(B.voldn)} for 4 more.`),
    btns: ['volup', 'voldn', 'power'],
    phases: [{ hold: ['power', 'voldn'], dur: 4, say: T('Держи обе кнопки', 'Тримай обидві кнопки', 'Hold both') }, { hold: ['voldn'], dur: 4, grace: 1.6, say: T(`Отпусти ${U(B.power)}! ${U(B.voldn)} — держи`, `Відпусти ${U(B.power)}! ${U(B.voldn)} — тримай`, `Release ${U(B.power)}! Keep ${U(B.voldn)}`) }],
    final: 'black',
  }, {
    name: T('режим восстановления', 'режим відновлення', 'recovery mode'), done: T('Устройство в режиме восстановления', 'Пристрій у режимі відновлення', 'Device is in recovery mode'),
    desc: T(`Быстро нажми и отпусти ${U(B.volup)}, затем сразу ${U(B.voldn)}. После этого зажми ${U(B.power)} и не отпускай, пока не появится экран с кабелем (≈6 с).`, `Швидко натисни й відпусти ${U(B.volup)}, потім одразу ${U(B.voldn)}. Після цього затисни ${U(B.power)} і не відпускай, доки не зʼявиться екран з кабелем (≈6 с).`, `Quickly press and release ${U(B.volup)}, then ${U(B.voldn)}. Then hold ${U(B.power)} until the cable screen shows (~6 s).`),
    btns: ['volup', 'voldn', 'power'],
    phases: [{ tap: 'volup', say: T('Коротко: громкость +', 'Коротко: гучність +', 'Quick: volume +') }, { tap: 'voldn', within: 1.4, say: T('Сразу же: громкость −', 'Одразу ж: гучність −', 'Right away: volume −') }, { hold: ['power'], dur: 6, grace: 1.4, say: T('Держи питание…', 'Тримай живлення…', 'Hold power…') }],
    final: 'cable',
  }]);
  if (dev.samsong) return {
    name: T('режим загрузки', 'режим завантаження', 'download mode'), done: T('Download mode: ожидание прошивки', 'Download mode: очікування прошивки', 'Download mode: waiting for firmware'),
    desc: T(`Зажми обе кнопки громкости на 3 секунды. На экране предупреждения коротко нажми ${U(B.volup)} — долгое нажатие отменяет.`, `Затисни обидві кнопки гучності на 3 секунди. На екрані попередження коротко натисни ${U(B.volup)} — довге натискання скасовує.`, `Hold both volume keys for 3 s. On the warning screen briefly press ${U(B.volup)} — a long press cancels.`),
    btns: ['volup', 'voldn', 'power'],
    phases: [{ hold: ['volup', 'voldn'], dur: 3, say: T('Держи обе громкости', 'Тримай обидві гучності', 'Hold both volume keys') }, { tap: 'volup', short: true, within: 4, say: T('Предупреждение! Коротко — громкость +', 'Попередження! Коротко — гучність +', 'Warning! Short press volume +'), screen: 'warn' }],
    final: 'download',
  };
  const items = ['START', 'Restart bootloader', 'Recovery mode', 'Power off'];
  const target = pick(['Recovery mode', 'Restart bootloader']);
  return {
    name: 'fastboot', done: T(`Выбрано: ${target}`, `Обрано: ${target}`, `Selected: ${target}`),
    desc: T(`Зажми ${U(B.power)} + ${U(B.voldn)} до появления меню (4 с). Кнопками громкости выбери «${target}», ${U(B.power)} — подтвердить. «Power off» всё сбросит.`, `Затисни ${U(B.power)} + ${U(B.voldn)} до появи меню (4 с). Кнопками гучності обери «${target}», ${U(B.power)} — підтвердити. «Power off» усе скине.`, `Hold ${U(B.power)} + ${U(B.voldn)} until the menu (4 s). Use volume keys to pick “${target}”, ${U(B.power)} to confirm. “Power off” resets everything.`),
    btns: ['volup', 'voldn', 'power'],
    phases: [{ hold: ['power', 'voldn'], dur: 4, say: T('Держи до меню', 'Тримай до меню', 'Hold for the menu') }, { menu: items, target, say: T('Громкость — выбор, питание — ОК', 'Гучність — вибір, живлення — ОК', 'Volume to move, power to OK') }],
    final: 'fastboot',
  };
}
function comboStep(dev) {
  const R = comboRecipe(dev);
  const B = BN();
  return {
    name: R.name, desc: R.desc,
    run: (P) => {
      const g = gate();
      const st = P.stage(phoneSVG(dev, scrText(dev, dev.pear ? '🍐' : dev.brand.toUpperCase(), dev.pear ? 30 : 13)), 'pdev');
      const ctl = P.ctl(`<div class="pbar"><i></i></div><div class="cstat"></div><div class="hbtns">${R.btns.map((b) => `<button class="hb" data-b="${b}">${B[b]}</button>`).join('')}</div><div class="small m c">${T('Мышью кнопки нажимаются кликом и залипают', 'Мишею кнопки натискаються кліком і залипають', 'With a mouse, clicks latch the buttons')}</div>`);
      const bar = ctl.querySelector('.pbar i'), stat = ctl.querySelector('.cstat'), scr = st.querySelector('.scr');
      const held = new Set();
      let ph = 0, prog = 0, t = 0, total = 0, mistakes = 0, cursor = 0, pressAt = 0, waitingRelease = null, gapT = 0;
      const total0 = R.phases.reduce((a, p) => a + (p.dur || 0.6), 0);
      const draw = () => {
        st.querySelectorAll('.sb').forEach((e) => e.classList.toggle('on', [...held].some((b) => e.classList.contains('sb-' + b))));
        ctl.querySelectorAll('.hb').forEach((e) => e.classList.toggle('on', held.has(e.dataset.b)));
        const p = R.phases[ph];
        stat.textContent = p?.say || '';
        stat.className = 'cstat' + (ph > 0 ? ' y' : '');
        const doneDur = R.phases.slice(0, ph).reduce((a, q) => a + (q.dur || 0.6), 0);
        bar.style.width = clamp((doneDur + prog) / total0, 0, 1) * 100 + '%';
      };
      const menuScreen = () => {
        const p = R.phases[ph];
        scr.innerHTML = `<rect x="76" y="16" width="68" height="144" rx="9" fill="#000"/><text x="110" y="46" text-anchor="middle" font-size="20">🤖</text>` + p.menu.map((m, i) => `<text x="80" y="${72 + i * 16}" font-size="7.4" font-family="monospace" fill="${i === cursor ? '#2ef2a0' : '#9aa6b8'}">${i === cursor ? '▶ ' : '  '}${esc(m)}</text>`).join('');
      };
      const restart = (why) => {
        mistakes++; P.mistake(why);
        ph = 0; prog = 0; t = 0; cursor = 0; waitingRelease = null;
        held.clear();
        scr.innerHTML = `<rect x="76" y="${dev.pear && dev.home ? 30 : 16}" width="68" height="${dev.pear && dev.home ? 112 : 144}" rx="9" fill="#0d1526"/>` + scrText(dev, dev.pear ? '🍐' : dev.brand.toUpperCase(), dev.pear ? 30 : 13);
        if (mistakes >= 3) { P.log(T('Слишком много попыток — телефон загрузился в обычном режиме', 'Забагато спроб — телефон завантажився у звичайному режимі', 'Too many tries — the phone booted normally'), 'err'); g.done(false); }
        draw();
      };
      const finishPhase = () => {
        ph++; prog = 0; t = 0;
        const p = R.phases[ph];
        if (!p) {
          const black = `<rect x="76" y="16" width="68" height="144" rx="9" fill="#000"/>`;
          scr.innerHTML = R.final === 'download' ? `<rect x="76" y="16" width="68" height="144" rx="9" fill="#0b5f8a"/><text x="110" y="80" text-anchor="middle" font-size="22">⬇</text>${scrText(dev, 'Downloading…', 8, '#fff', 14)}${scrText(dev, 'Do not turn off target', 5.5, '#cfe', 26)}` : R.final === 'cable' ? `${black}<text x="110" y="92" text-anchor="middle" font-size="26">🔌</text>` : R.final === 'fastboot' ? `${black}${scrText(dev, R.phases[ph - 1].target, 8, '#2ef2a0')}` : black;
          P.good(R.done); held.clear(); draw(); g.done(true); return;
        }
        if (!p.hold) held.clear();
        if (p.menu) { cursor = 0; menuScreen(); }
        if (p.screen === 'warn') scr.innerHTML = `<rect x="76" y="16" width="68" height="144" rx="9" fill="#0b2a4a"/><text x="110" y="70" text-anchor="middle" font-size="20">⚠️</text>${scrText(dev, 'Warning', 9, '#fff', 0)}${scrText(dev, 'Vol+ : Continue', 6.5, '#9fd', 16)}${scrText(dev, 'Vol− : Cancel', 6.5, '#9fd', 26)}`;
        if (p.tap) gapT = 0;
        draw();
      };
      const press = (b) => {
        const p = R.phases[ph];
        if (!p) return;
        if (p.tap) {
          if (b !== p.tap) return restart(T(`Не та кнопка: нужна «${B[p.tap]}»`, `Не та кнопка: потрібна «${B[p.tap]}»`, `Wrong button: need “${B[p.tap]}”`));
          if (p.short) { pressAt = performance.now(); waitingRelease = b; return; }
          api_tick_sfx(P); finishPhase();
        } else if (p.menu) {
          if (b === 'volup') cursor = (cursor + p.menu.length - 1) % p.menu.length;
          else if (b === 'voldn') cursor = (cursor + 1) % p.menu.length;
          else if (b === 'power') {
            const sel = p.menu[cursor];
            if (sel === p.target) { finishPhase(); return; }
            if (sel === 'Power off') return restart(T('Телефон выключился — начинай заново', 'Телефон вимкнувся — починай знову', 'The phone powered off — start over'));
            mistakes++; P.mistake(T(`Выбрано «${sel}» — не то`, `Обрано «${sel}» — не те`, `Picked “${sel}” — wrong`));
            if (mistakes >= 3) g.done(false);
          }
          P.api.sfx('tick'); menuScreen();
        }
      };
      const release = (b) => {
        if (waitingRelease === b) {
          waitingRelease = null;
          if ((performance.now() - pressAt) / 1000 < 0.8) { P.api.sfx('tick'); finishPhase(); }
        }
      };
      ctl.querySelectorAll('.hb').forEach((el) => {
        const b = el.dataset.b;
        el.addEventListener('contextmenu', (e) => e.preventDefault());
        el.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (P.api.ended) return;
          const p = R.phases[ph];
          const mouse = e.pointerType === 'mouse';
          if (p && p.hold) { if (mouse) { if (held.has(b)) held.delete(b); else held.add(b); } else held.add(b); }
          else { if (!mouse) held.add(b); press(b); if (mouse) release(b); }
          draw();
        });
        const up = (e) => { if (e.pointerType === 'mouse') return; held.delete(b); release(b); draw(); };
        el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
      });
      P.timer(50, () => { P.log(T('Время вышло', 'Час вийшов', 'Out of time'), 'err'); g.done(false); });
      P.tick((dt) => {
        const p = R.phases[ph];
        if (!p) return;
        t += dt; total += dt;
        if (waitingRelease && (performance.now() - pressAt) / 1000 > 0.85) { waitingRelease = null; return restart(T('Долгое нажатие — отмена. Ещё раз', 'Довге натискання — скасування. Ще раз', 'Long press cancels. Again')); }
        if (p.tap && p.within && !waitingRelease) { gapT += dt; if (gapT > p.within) return restart(T('Слишком медленно — нужно быстро подряд', 'Надто повільно — треба швидко підряд', 'Too slow — must be quick in a row')); }
        if (!p.hold) return;
        const want = new Set(p.hold);
        const right = want.size === held.size && [...want].every((b) => held.has(b));
        if (right) { prog += dt; if (prog >= p.dur) finishPhase(); }
        else if (prog > 0 && prog <= 0.35) prog = 0;
        else if (prog > 0.35) restart(T('Кнопки отпущены раньше времени', 'Кнопки відпущено зарано', 'Buttons released too early'));
        else if (ph > 0 && t > (p.grace || 1.2)) restart(ph > 0 && held.size > want.size ? T('Не отпустил вовремя — телефон просто перезагрузился', 'Не відпустив вчасно — телефон просто перезавантажився', 'Didn’t release in time — the phone just rebooted') : T('Пропущен момент', 'Пропущено момент', 'Missed the moment'));
        draw();
      });
      draw();
      return g;
    },
  };
}
function api_tick_sfx(P) { P.api.sfx('tick'); }

// ---------------------------------------------------------------- STEP: pick the right firmware file
function firmwareStep(dev) {
  let rows, info;
  if (dev.pear) {
    const near = `iFone${dev.gen},${dev.v === 1 ? 3 : 1}`, prev = `iFone${dev.gen - 1},${dev.v}`;
    const ok = { f: `${dev.id}_${dev.ver}_Restore.ipsw`, tag: 's', ok: true };
    rows = [ok, ...shuf([
      { f: `${dev.id}_${dev.major}.${dev.minor + 1}_beta2_Restore.ipsw`, tag: 'b', why: T('Бета-прошивка не активируется', 'Бета-прошивка не активується', 'Beta firmware won’t activate') },
      { f: `${dev.id}_${dev.major - 1}.${ri(0, 6)}_Restore.ipsw`, tag: 'u', why: T('Pear её больше не подписывает — откат запрещён', 'Pear її більше не підписує — відкат заборонено', 'Pear no longer signs it — downgrade refused') },
      { f: `${near}_${dev.ver}_Restore.ipsw`, tag: 's', why: T(`Это образ для ${near}, а телефон — ${dev.id}`, `Це образ для ${near}, а телефон — ${dev.id}`, `That’s for ${near}, the phone is ${dev.id}`) },
      { f: `${prev}_${dev.ver}_Restore.ipsw`, tag: 's', why: T(`Это образ для ${prev}`, `Це образ для ${prev}`, `That’s for ${prev}`) },
      { f: `${dev.id}_${dev.ver}_Update.ipsw`, tag: 's', why: T('Update сохраняет данные — код-пароль останется. Нужен Restore', 'Update зберігає дані — код-пароль залишиться. Потрібен Restore', 'Update keeps data — the passcode stays. You need Restore') },
    ]).slice(0, 4)];
    info = `<div class="pbig mono">${esc(dev.id)}</div><div class="small m mono">${esc(dev.name)} · ${esc(dev.os)}</div>`;
  } else {
    const other = dev.code.replace(/.$/, (c) => (c === 'B' ? 'U' : c === 'F' ? 'N' : 'X'));
    const reg2 = pick(REGIONS.filter((r) => r !== dev.region));
    const okBL = dev.bl + ri(0, 1);
    const ok = { f: `${dev.code} · ${dev.region} · BL ${okBL} · Android ${dev.android}`, tag: 's', ok: true };
    rows = [ok, ...shuf([
      { f: `${dev.code} · ${dev.region} · BL ${dev.bl - 1} · Android ${dev.android - 1}`, tag: 's', why: T(`Загрузчик BL ${dev.bl - 1} ниже текущего BL ${dev.bl} — откат запрещён (SW REV CHECK FAIL)`, `Завантажувач BL ${dev.bl - 1} нижчий за поточний BL ${dev.bl} — відкат заборонено`, `BL ${dev.bl - 1} is below the current BL ${dev.bl} — rollback refused`) },
      { f: `${other} · ${dev.region} · BL ${okBL} · Android ${dev.android}`, tag: 's', why: T(`Это прошивка для ${other}, а телефон — ${dev.code}`, `Це прошивка для ${other}, а телефон — ${dev.code}`, `That’s for ${other}, the phone is ${dev.code}`) },
      { f: `${dev.code} · ${reg2} · BL ${okBL} · Android ${dev.android}`, tag: 's', why: T(`Регион ${reg2} не совпадает с ${dev.region}`, `Регіон ${reg2} не збігається з ${dev.region}`, `Region ${reg2} doesn’t match ${dev.region}`) },
      { f: `COMBINATION_${dev.code} · ${dev.region} · BL ${okBL}`, tag: 'b', why: T('Это заводская тестовая прошивка, а не стоковая', 'Це заводська тестова прошивка, а не стокова', 'That’s a factory test build, not stock') },
    ]).slice(0, 4)];
    info = `<div class="pbig mono">${esc(dev.code)}</div><div class="small m mono">${esc(dev.name)} · ${T('регион', 'регіон', 'region')} ${dev.region} · BL ${dev.bl} · ${esc(dev.os)}</div>`;
  }
  rows = shuf(rows);
  const TAG = { s: `<span class="g">${T('подписана ✓', 'підписана ✓', 'signed ✓')}</span>`, u: `<span class="r">${T('не подписана ×', 'не підписана ×', 'unsigned ×')}</span>`, b: `<span class="r">${T('тест ⚠', 'тест ⚠', 'test ⚠')}</span>` };
  if (dev.pear) TAG.b = `<span class="r">${T('бета ⚠', 'бета ⚠', 'beta ⚠')}</span>`;
  return {
    name: T('выбор прошивки', 'вибір прошивки', 'pick the firmware'),
    desc: dev.pear ? T(`Найди полный Restore‑образ именно для ${dev.id}, который Pear ещё подписывает.`, `Знайди повний Restore‑образ саме для ${dev.id}, який Pear ще підписує.`, `Find the full Restore image for exactly ${dev.id} that Pear still signs.`)
      : T(`Нужна стоковая прошивка: та же модель и регион, загрузчик (BL) не ниже текущего.`, `Потрібна стокова прошивка: та сама модель і регіон, завантажувач (BL) не нижчий за поточний.`, `You need stock firmware: same model and region, bootloader (BL) not below the current one.`),
    run: (P) => {
      const g = gate();
      let bad = 0;
      P.stage(`<div class="pinfo">${info}</div>`);
      const c = P.ctl(rows.map((r, i) => `<button class="frow" data-i="${i}"><span class="mono">📦 ${esc(r.f)}</span>${TAG[r.tag]}</button>`).join(''));
      P.on(c, '.frow', (b) => {
        const r = rows[+b.dataset.i];
        if (r.ok) { b.classList.add('ok'); P.good(T(`Выбран ${r.f}`, `Обрано ${r.f}`, `Picked ${r.f}`)); return g.done(true); }
        b.classList.add('bad'); b.disabled = true; bad++;
        P.mistake(r.why || T('Не подходит', 'Не підходить', 'Doesn’t fit'));
        if (bad >= 2) g.done(false);
      });
      P.timer(30, () => g.done(false));
      return g;
    },
  };
}

// ---------------------------------------------------------------- STEP: exploit chain in a code matrix
function breachStep(hard = 0.5) {
  const N = hard > 0.6 ? 6 : 5, LEN = hard > 0.45 ? 4 : 3, BUF = LEN + 2;
  const SYM = ['1C', '7A', 'E9', '55', 'BD', 'FF'];
  return {
    name: T('цепочка эксплойта', 'ланцюжок експлойту', 'exploit chain'),
    desc: T('Собери в буфер нужную цепочку байтов. Ходы по очереди: сначала в подсвеченной строке, потом в столбце выбранной ячейки, потом снова в строке…', 'Збери в буфер потрібний ланцюжок байтів. Ходи по черзі: спочатку в підсвіченому рядку, потім у стовпці обраної клітинки, потім знову в рядку…', 'Fill the buffer with the target chain. Alternate: first in the highlighted row, then in the column of the chosen cell, then a row again…'),
    run: (P) => {
      const g = gate();
      let tries = 0;
      const build = () => {
        const target = Array.from({ length: LEN }, () => pick(SYM));
        const grid = Array.from({ length: N }, () => Array.from({ length: N }, () => pick(SYM)));
        // plant one solvable path
        let r = 0, c = ri(0, N - 1); const used = new Set();
        for (let k = 0; k < LEN; k++) {
          if (k % 2 === 0) { const cs = shuf([...Array(N).keys()].filter((x) => !used.has(r * N + x))); c = cs[0]; }
          else { const rs = shuf([...Array(N).keys()].filter((x) => !used.has(x * N + c) && x !== r)); r = rs[0]; }
          used.add(r * N + c); grid[r][c] = target[k];
        }
        return { target, grid };
      };
      let S;
      const start = () => {
        S = { ...build(), buf: [], mode: 'row', line: 0, used: new Set() };
        draw();
      };
      const draw = () => {
        const st = P.stage(`<div class="bp"><div class="bpt"><span class="m small">${T('ЦЕЛЬ', 'ЦІЛЬ', 'TARGET')}</span>${S.target.map((x) => `<b>${x}</b>`).join('')}</div><div class="bpb"><span class="m small">${T('БУФЕР', 'БУФЕР', 'BUFFER')}</span>${Array.from({ length: BUF }, (_, i) => `<i>${S.buf[i] || ''}</i>`).join('')}</div><div class="bpg" style="grid-template-columns:repeat(${N},1fr)">${S.grid.map((row, r) => row.map((v, c) => { const id = r * N + c; const act = !S.used.has(id) && (S.mode === 'row' ? r === S.line : c === S.line); return `<button data-r="${r}" data-c="${c}" class="${act ? 'act' : ''} ${S.used.has(id) ? 'used' : ''}">${S.used.has(id) ? '[ ]' : v}</button>`; }).join('')).join('')}</div></div>`, 'pterm');
        P.on(st, '.bpg button', (b) => {
          const r = +b.dataset.r, c = +b.dataset.c, id = r * N + c;
          if (S.used.has(id) || (S.mode === 'row' ? r !== S.line : c !== S.line)) { P.api.sfx('err'); return; }
          S.used.add(id); S.buf.push(S.grid[r][c]);
          P.log(`mov 0x${S.grid[r][c]}`, 'cmd'); P.api.sfx('tick');
          if (S.mode === 'row') { S.mode = 'col'; S.line = c; } else { S.mode = 'row'; S.line = r; }
          const s = S.buf.join(' '), t = S.target.join(' ');
          if (s.includes(t)) { draw(); P.good(T(`Уязвимость найдена: CVE-20${ri(19, 26)}-${ri(10000, 49999)}`, `Вразливість знайдено: CVE-20${ri(19, 26)}-${ri(10000, 49999)}`, `Vulnerability found: CVE-20${ri(19, 26)}-${ri(10000, 49999)}`)); return g.done(true); }
          const noMoves = !S.grid.some((row, rr) => row.some((_, cc) => !S.used.has(rr * N + cc) && (S.mode === 'row' ? rr === S.line : cc === S.line)));
          if (S.buf.length >= BUF || noMoves) {
            tries++; P.mistake(T('Буфер переполнен — цепочка не собрана', 'Буфер переповнено — ланцюжок не зібрано', 'Buffer overflow — chain not built'));
            if (tries >= 2) return g.done(false);
            P.log(T('Новая попытка, матрица перестроена', 'Нова спроба, матрицю перебудовано', 'New attempt, matrix reshuffled'), 'dim');
            return start();
          }
          draw();
        });
        P.ctl(`<div class="c bold">${T('Нужно', 'Потрібно', 'Need')}: ${S.target.join(' → ')}</div>`);
      };
      start();
      P.timer(45 - hard * 10, () => { P.log('timeout', 'err'); g.done(false); });
      return g;
    },
  };
}

// ---------------------------------------------------------------- STEP: kernel patch timing (moving zone, watchdog trap)
function patchStep(hard = 0.5) {
  const trap = hard > 0.4 && Math.random() < 0.6;
  return {
    name: T('патч ядра', 'патч ядра', 'kernel patch'),
    desc: trap ? T('Внедри патч, когда бегунок в зелёной зоне. Нужно 3 попадания. Красная зона — сторожевой таймер: попадёшь в неё — сразу паника ядра.', 'Впровадь патч, коли бігунок у зеленій зоні. Потрібно 3 влучання. Червона зона — сторожовий таймер: влучиш — одразу паніка ядра.', 'Inject when the slider is in the green zone. 3 hits needed. The red zone is the watchdog: hit it and the kernel panics.')
      : T('Внедри патч, когда бегунок в зелёной зоне. Нужно 3 попадания, после каждого зона прыгает и сужается. Три промаха — паника ядра.', 'Впровадь патч, коли бігунок у зеленій зоні. Потрібно 3 влучання, після кожного зона стрибає і звужується. Три промахи — паніка ядра.', 'Inject when the slider is in the green zone. 3 hits; the zone jumps and narrows each time. Three misses — kernel panic.'),
    run: (P) => {
      const g = gate();
      let hits = 0, miss = 0, x = 0, dir = 1, zx = 0, zw = 0.2, rx = -1, t = 0;
      const dump = Array.from({ length: 6 }, () => Array.from({ length: 12 }, hex2).join(' ')).join('<br>');
      const st = P.stage(`<div class="kp"><div class="kd mono">${dump}</div><div class="kbar"><i class="kz"></i><i class="kr"></i><b class="km"></b></div><div class="c small kc"></div></div>`, 'pterm');
      const z = st.querySelector('.kz'), rz = st.querySelector('.kr'), mk = st.querySelector('.km'), kc = st.querySelector('.kc');
      const place = () => {
        zw = 0.2 - hits * 0.035 - hard * 0.03; zx = Math.random() * (1 - zw);
        z.style.left = zx * 100 + '%'; z.style.width = zw * 100 + '%';
        if (trap) { do { rx = Math.random() * 0.88; } while (Math.abs(rx + 0.06 - (zx + zw / 2)) < zw / 2 + 0.1); rz.style.left = rx * 100 + '%'; rz.style.width = '12%'; rz.style.display = 'block'; } else rz.style.display = 'none';
        kc.innerHTML = `${T('Патчей', 'Патчів', 'Patches')}: <b class="g">${hits}/3</b> · Kernel panic: <b class="r">${miss}/3</b>`;
      };
      place();
      const c = P.ctl(`<button class="btn block big go">⚙️ ${T('Внедрить патч', 'Впровадити патч', 'Inject patch')}</button>`);
      P.tick((dt) => { t += dt; const sp = 0.55 + hits * 0.18 + hard * 0.3; x += dir * dt * sp; if (x > 1) { x = 1; dir = -1; } if (x < 0) { x = 0; dir = 1; } mk.style.left = x * 100 + '%'; });
      P.on(c, '.go', () => {
        if (trap && x >= rx && x <= rx + 0.12) { P.mistake('watchdog: kernel panic'); P.log('panic(cpu 0 caller 0xfffffff0): watchdog timeout', 'err'); return g.done(false); }
        if (x >= zx && x <= zx + zw) { hits++; P.good(`patch @0x${hex2()}${hex2()}${hex2()} — OK`); P.api.flash(true); if (hits >= 3) { place(); return g.done(true); } place(); }
        else { miss++; P.mistake(T('Мимо — ядро ругается', 'Повз — ядро свариться', 'Missed — the kernel complains')); place(); if (miss >= 3) { P.log('panic: kernel integrity violated', 'err'); g.done(false); } }
      });
      P.timer(40, () => g.done(false));
      return g;
    },
  };
}

// ---------------------------------------------------------------- STEP: find a byte signature in a hex dump
const SIGS = [['CF', 'FA', 'ED', 'FE', 'Mach-O'], ['7F', '45', '4C', '46', 'ELF'], ['CA', 'FE', 'BA', 'BE', 'FAT'], ['DE', 'C0', '17', '0B', 'BOOT'], ['4D', '5A', '90', '00', 'PE']];
function hexStep() {
  const sig = pick(SIGS);
  const S = sig.slice(0, 4);
  return {
    name: T('поиск сигнатуры', 'пошук сигнатури', 'find the signature'),
    desc: T(`Найди в дампе памяти заголовок ${sig[4]}: <b class="mono">${S.join(' ')}</b> — и нажми на его первый байт. Похожие куски — ловушки. Строки переносятся.`, `Знайди в дампі памʼяті заголовок ${sig[4]}: <b class="mono">${S.join(' ')}</b> — і натисни на його перший байт. Схожі шматки — пастки. Рядки переносяться.`, `Find the ${sig[4]} header <b class="mono">${S.join(' ')}</b> in the memory dump and tap its first byte. Similar pieces are traps. Lines wrap.`),
    run: (P) => {
      const g = gate();
      const W = 8, H = 8, n = W * H;
      let bytes, at;
      for (;;) {
        bytes = Array.from({ length: n }, hex2);
        at = ri(0, n - 4);
        const taken = new Set([at, at + 1, at + 2, at + 3]);
        for (let k = 0; k < 3; k++) {
          let p; let guard = 0;
          do { p = ri(0, n - 4); guard++; } while (guard < 50 && [p, p + 1, p + 2, p + 3].some((q) => taken.has(q) || taken.has(q - 1) || taken.has(q + 1)));
          if (guard >= 50) continue;
          const wrong = ri(1, 3);
          for (let j = 0; j < 4; j++) { bytes[p + j] = j === wrong ? (S[j] === 'FE' ? 'FF' : S[j] === '00' ? '01' : S[j][0] + (S[j][1] === 'E' ? 'F' : 'E')) : S[j]; taken.add(p + j); }
        }
        for (let j = 0; j < 4; j++) bytes[at + j] = S[j];
        const str = bytes.join(' '), sStr = S.join(' ');
        if (str.indexOf(sStr) === str.lastIndexOf(sStr)) break;
      }
      let bad = 0;
      const st = P.stage(`<div class="hx">${Array.from({ length: H }, (_, r) => `<div class="hxr"><span class="ad">${(0x1000 + r * W).toString(16).toUpperCase()}</span>${bytes.slice(r * W, r * W + W).map((b, c) => `<button data-i="${r * W + c}">${b}</button>`).join('')}</div>`).join('')}</div>`, 'pterm');
      P.on(st, 'button', (b) => {
        const i = +b.dataset.i;
        if (i === at) { for (let j = 0; j < 4; j++) st.querySelector(`[data-i="${at + j}"]`).classList.add('ok'); P.good(T(`Заголовок найден @0x${(0x1000 + at).toString(16).toUpperCase()}`, `Заголовок знайдено @0x${(0x1000 + at).toString(16).toUpperCase()}`, `Header found @0x${(0x1000 + at).toString(16).toUpperCase()}`)); return g.done(true); }
        b.classList.add('bad'); bad++;
        P.mistake(T(`0x${(0x1000 + i).toString(16).toUpperCase()}: ${bytes.slice(i, i + 4).join(' ')} — не то`, `0x${(0x1000 + i).toString(16).toUpperCase()}: ${bytes.slice(i, i + 4).join(' ')} — не те`, `0x${(0x1000 + i).toString(16).toUpperCase()}: ${bytes.slice(i, i + 4).join(' ')} — wrong`));
        if (bad >= 3) g.done(false);
      });
      P.ctl(`<div class="c bold mono">${S.join(' ')}</div>`);
      P.timer(40, () => g.done(false));
      return g;
    },
  };
}

// ---------------------------------------------------------------- STEP: set a hardware register bit by bit
function registerStep() {
  const kind = pick(['hex', 'dec', 'flip']);
  const start = ri(0, 255);
  let target, task;
  if (kind === 'hex') { target = ri(17, 254); task = T(`Выставь регистр AMFI = <b class="mono">0x${target.toString(16).toUpperCase()}</b>`, `Встанови регістр AMFI = <b class="mono">0x${target.toString(16).toUpperCase()}</b>`, `Set the AMFI register to <b class="mono">0x${target.toString(16).toUpperCase()}</b>`); }
  else if (kind === 'dec') { target = ri(17, 254); task = T(`Выставь регистр SEP = <b class="mono">${target}</b> (в десятичной)`, `Встанови регістр SEP = <b class="mono">${target}</b> (у десятковій)`, `Set the SEP register to <b class="mono">${target}</b> (decimal)`); }
  else {
    const on = shuf([0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 2), off = shuf([0, 1, 2, 3, 4, 5, 6, 7].filter((b) => !on.includes(b))).slice(0, 1);
    target = start; on.forEach((b) => (target |= 1 << b)); off.forEach((b) => (target &= ~(1 << b)));
    task = T(`Включи биты ${on.join(' и ')}, выключи бит ${off[0]}. Остальные не трогай. (бит 0 — справа)`, `Увімкни біти ${on.join(' і ')}, вимкни біт ${off[0]}. Решту не чіпай. (біт 0 — праворуч)`, `Set bits ${on.join(' and ')}, clear bit ${off[0]}. Leave the rest. (bit 0 is on the right)`);
  }
  return {
    name: T('регистр защиты', 'регістр захисту', 'protection register'),
    desc: task,
    run: (P) => {
      const g = gate();
      let v = start, bad = 0;
      const draw = () => {
        const st = P.stage(`<div class="rg"><div class="rgv mono"><span>HEX <b>0x${v.toString(16).toUpperCase().padStart(2, '0')}</b></span><span>DEC <b>${v}</b></span></div><div class="rgb">${[7, 6, 5, 4, 3, 2, 1, 0].map((b) => `<button data-b="${b}" class="${v & (1 << b) ? 'on' : ''}"><small>${b}</small>${v & (1 << b) ? 1 : 0}</button>`).join('')}</div><div class="rgw mono small m">${[128, 64, 32, 16, 8, 4, 2, 1].map((w) => `<span>${w}</span>`).join('')}</div></div>`, 'pterm');
        P.on(st, '.rgb button', (b) => { v ^= 1 << +b.dataset.b; P.api.sfx('tick'); draw(); });
      };
      draw();
      const c = P.ctl(`<button class="btn block big go">✍️ ${T('Записать', 'Записати', 'Write')}</button>`);
      P.on(c, '.go', () => {
        if (v === target) { P.good(`reg ← 0x${v.toString(16).toUpperCase()}`); return g.done(true); }
        bad++; P.mistake(T(`Записано 0x${v.toString(16).toUpperCase()} — защита не отключилась`, `Записано 0x${v.toString(16).toUpperCase()} — захист не вимкнувся`, `Wrote 0x${v.toString(16).toUpperCase()} — protection still on`));
        if (bad >= 2) g.done(false);
      });
      P.timer(40, () => g.done(false));
      return g;
    },
  };
}

// ---------------------------------------------------------------- STEP: type commands from a forum guide
const SCRIPTS = {
  root: () => ({
    guide: T('Гайд с форума: «1) Из системы перезагрузи телефон в загрузчик через adb. 2) Разблокируй загрузчик (flashing). 3) Прошей ПРОПАТЧЕННЫЙ boot — не recovery! 4) Перезагрузись.»', 'Гайд з форуму: «1) Із системи перезавантаж телефон у завантажувач через adb. 2) Розблокуй завантажувач (flashing). 3) Проший ПРОПАТЧЕНИЙ boot — не recovery! 4) Перезавантажся.»', 'Forum guide: “1) From the OS, reboot into the bootloader via adb. 2) Unlock the bootloader (flashing). 3) Flash the PATCHED boot — not recovery! 4) Reboot.”'),
    lines: [['adb', 'reboot', 'bootloader'], ['fastboot', 'flashing', 'unlock'], ['fastboot', 'flash', 'boot', 'magisk_patched.img'], ['fastboot', 'reboot']],
    decoys: ['recovery', 'oem', 'lock', 'erase', 'system', 'magisk.img', 'twrp.img', 'sideload', 'format'],
  }),
  frp: () => ({
    guide: T('Гайд: «1) Проверь, что телефон виден в fastboot (devices). 2) Сотри раздел frp — именно его, не system! 3) Сотри пользовательские данные флагом -w. 4) Перезагрузи.»', 'Гайд: «1) Перевір, що телефон видно у fastboot (devices). 2) Зітри розділ frp — саме його, не system! 3) Зітри дані користувача прапорцем -w. 4) Перезавантаж.»', 'Guide: “1) Check the phone shows in fastboot (devices). 2) Erase the frp partition — that one, not system! 3) Wipe user data with -w. 4) Reboot.”'),
    lines: [['fastboot', 'devices'], ['fastboot', 'erase', 'frp'], ['fastboot', '-w'], ['fastboot', 'reboot']],
    decoys: ['system', 'boot', 'adb', 'flash', 'lock', 'oem', 'vbmeta', 'unlock'],
  }),
  jb: () => ({
    guide: T('Гайд: «1) Подключись по SSH к root на localhost, порт 2222. 2) Перемонтируй корень на запись (mount -uw /). 3) Обнови кэш иконок (uicache -a). 4) Перезапусти SpringBoard.»', 'Гайд: «1) Підключися по SSH до root на localhost, порт 2222. 2) Перемонтуй корінь на запис (mount -uw /). 3) Онови кеш іконок (uicache -a). 4) Перезапусти SpringBoard.»', 'Guide: “1) SSH as root to localhost, port 2222. 2) Remount root read-write (mount -uw /). 3) Refresh the icon cache (uicache -a). 4) Restart SpringBoard.”'),
    lines: [['ssh', 'root@localhost', '-p', '2222'], ['mount', '-uw', '/'], ['uicache', '-a'], ['killall', '-9', 'SpringBoard']],
    decoys: ['-p', '22', 'mobile@localhost', '-ro', 'rm', '-rf', 'reboot', 'launchd', 'sudo'],
  }),
};
function scriptStep(kind) {
  const S = SCRIPTS[kind]();
  return {
    name: T('терминал', 'термінал', 'terminal'),
    desc: S.guide,
    run: (P) => {
      const g = gate();
      let line = 0, tok = 0, bad = 0;
      const typed = [];
      const draw = () => {
        const cur = S.lines[line] || [];
        const need = cur[tok];
        const pool = shuf([need, ...shuf(S.decoys.filter((d) => d !== need && !cur.slice(tok).includes(d))).slice(0, 3), ...(cur.slice(tok + 1, tok + 2))].filter(Boolean)).filter((x, i, a) => a.indexOf(x) === i);
        P.stage(`<div class="ptm mono">${typed.map((l) => `<div><span class="g">$</span> ${esc(l.join(' '))}</div>`).join('')}${line < S.lines.length ? `<div><span class="g">$</span> ${esc(cur.slice(0, tok).join(' '))}<span class="cur">▌</span></div>` : ''}</div>`, 'pterm');
        const c = P.ctl(`<div class="chips">${pool.map((x) => `<button data-t="${esc(x)}" class="mono">${esc(x)}</button>`).join('')}</div>`);
        P.on(c, 'button', (b) => {
          if (b.dataset.t === need) {
            tok++; P.api.sfx('tick');
            if (tok >= cur.length) { typed.push(cur); P.log(cur.join(' '), 'cmd'); line++; tok = 0; if (line >= S.lines.length) { draw(); P.good(T('Скрипт выполнен', 'Скрипт виконано', 'Script finished')); return g.done(true); } }
            draw();
          } else {
            bad++; P.mistake(`${[...cur.slice(0, tok), b.dataset.t].join(' ')}: ${T('ошибка', 'помилка', 'error')}`);
            if (bad >= 3) g.done(false);
          }
        });
      };
      draw();
      P.timer(55, () => g.done(false));
      return g;
    },
  };
}

// ---------------------------------------------------------------- STEP: flashing with a flaky cable and popups
function cableStep(dev) {
  const LOGS = dev.pear ? [T('Отправка iBSS…', 'Надсилання iBSS…', 'Sending iBSS…'), T('Загрузка iBEC…', 'Завантаження iBEC…', 'Loading iBEC…'), T('Восстановление файловой системы…', 'Відновлення файлової системи…', 'Restoring filesystem…'), T('Прошивка baseband…', 'Прошивка baseband…', 'Flashing baseband…'), T('Проверка образа…', 'Перевірка образу…', 'Verifying image…'), T('Запись SEP…', 'Запис SEP…', 'Writing SEP…')] : ['Sending sparse super 1/6…', 'Writing boot…', 'Writing vbmeta…', 'Sending sparse super 4/6…', 'Writing modem…', 'Verifying…'];
  return {
    name: T('прошивка', 'прошивка', 'flashing'),
    desc: T('Идёт запись. Если кабель отойдёт — быстро жми «Переподключить», иначе прогресс откатится. На всплывающие окна отвечай так, чтобы не прервать запись.', 'Йде запис. Якщо кабель відійде — швидко тисни «Перепідключити», інакше прогрес відкотиться. На спливні вікна відповідай так, щоб не перервати запис.', 'Writing. If the cable drops, hit “Reconnect” fast or progress rolls back. Answer popups so the write isn’t interrupted.'),
    run: (P) => {
      const g = gate();
      let prog = 0, ev = null, evT = 0, bad = 0, li = 0;
      const events = shuf(['cable', 'cable', 'popup', pick(['cable', 'popup2'])]).map((k, i) => ({ k, at: 0.15 + i * 0.2 + Math.random() * 0.08 }));
      const st = P.stage(phoneSVG(dev, `<text x="110" y="84" text-anchor="middle" font-size="24">${dev.pear ? '🍐' : '⬇'}</text><rect x="90" y="102" width="40" height="4" rx="2" fill="#2a3346"/><rect class="fp" x="90" y="102" width="0" height="4" rx="2" fill="#e9eef6"/>`), 'pdev');
      const fp = st.querySelector('.fp');
      const c = P.ctl(`<div class="pbar"><i></i></div><div class="cstat">${T('Не отключай телефон…', 'Не відключай телефон…', 'Don’t unplug the phone…')}</div><div class="pev"></div>`);
      const bar = c.querySelector('.pbar i'), stat = c.querySelector('.cstat'), evEl = c.querySelector('.pev');
      const fail = (why, back) => { bad++; P.mistake(why); prog = Math.max(0, prog - back); if (bad >= 3) { P.log(T('Прошивка прервана — повтори позже', 'Прошивку перервано — повтори пізніше', 'Flash aborted — retry later'), 'err'); g.done(false); } };
      const show = (e) => {
        ev = e; evT = 0;
        if (e.k === 'cable') {
          stat.innerHTML = `<span class="r">⚠ ${T('Кабель отошёл!', 'Кабель відійшов!', 'Cable dropped!')}</span>`;
          evEl.innerHTML = `<button class="btn block big red" data-v="re">🔌 ${T('Переподключить', 'Перепідключити', 'Reconnect')}</button>`;
          st.querySelector('path')?.setAttribute('stroke', '#ff5468');
        } else if (e.k === 'popup') {
          evEl.innerHTML = `<div class="pop"><b>PearTunes</b><p>${T('Доступна новая версия PearTunes. Установить сейчас? Программа будет перезапущена.', 'Доступна нова версія PearTunes. Встановити зараз? Програму буде перезапущено.', 'A new PearTunes version is available. Install now? The app will restart.')}</p><div class="btns"><button class="btn sm" data-v="bad">${T('Установить', 'Встановити', 'Install')}</button><button class="btn sm dark" data-v="ok">${T('Позже', 'Пізніше', 'Later')}</button></div></div>`;
        } else {
          evEl.innerHTML = `<div class="pop"><b>${T('Система', 'Система', 'System')}</b><p>${T('Безопасно извлечь USB-устройство «PHONE»?', 'Безпечно вилучити USB-пристрій «PHONE»?', 'Safely remove USB device “PHONE”?')}</p><div class="btns"><button class="btn sm" data-v="bad">${T('Извлечь', 'Вилучити', 'Eject')}</button><button class="btn sm dark" data-v="ok">${T('Отмена', 'Скасувати', 'Cancel')}</button></div></div>`;
        }
        P.on(evEl, '[data-v]', (b) => {
          const v = b.dataset.v;
          if (v === 'bad') fail(T('Запись прервана этим окном', 'Запис перервано цим вікном', 'That popup interrupted the write'), 0.25);
          else { P.log(e.k === 'cable' ? T('Кабель переподключён', 'Кабель перепідключено', 'Cable reconnected') : T('Окно закрыто', 'Вікно закрито', 'Popup dismissed'), 'ok'); P.api.sfx('ok'); }
          ev = null; evEl.innerHTML = ''; stat.textContent = T('Не отключай телефон…', 'Не відключай телефон…', 'Don’t unplug the phone…'); st.querySelector('path')?.setAttribute('stroke', '#c9d2e0');
        });
      };
      P.tick((dt) => {
        if (ev) {
          evT += dt;
          if (ev.k === 'cable' && evT > 1.9) { ev = null; evEl.innerHTML = ''; st.querySelector('path')?.setAttribute('stroke', '#c9d2e0'); stat.textContent = T('Не отключай телефон…', 'Не відключай телефон…', 'Don’t unplug the phone…'); fail(T('Не успел переподключить — прогресс откатился', 'Не встиг перепідключити — прогрес відкотився', 'Too slow — progress rolled back'), 0.22); }
          return;
        }
        prog += dt / 13;
        const nx = events.find((e) => !e.done && prog >= e.at);
        if (nx) { nx.done = true; show(nx); }
        if (prog * LOGS.length > li + 1 && li < LOGS.length) P.log(LOGS[li++]);
        bar.style.width = clamp(prog, 0, 1) * 100 + '%'; fp.setAttribute('width', clamp(prog, 0, 1) * 40);
        if (prog >= 1) { P.good(T('Прошивка записана', 'Прошивку записано', 'Firmware written')); g.done(true); }
      });
      return g;
    },
  };
}

// ---------------------------------------------------------------- STEP: setup assistant after a reflash
const HELLO = { ru: 'Привет', uk: 'Привіт', en: 'Hello' };
const HELLO_DECOY = { ru: ['Привіт', 'Прывітанне', 'Здраво', 'Pryvet', 'Hola', 'Merhaba'], uk: ['Привет', 'Прывітанне', 'Здраво', 'Pryvit', 'Bonjour', 'Cześć'], en: ['Hallo', 'Hola', 'Hej', 'Helo', 'Halló', 'Ciao'] };
function setupStep(dev) {
  const subs = shuf(['hello', 'clock', 'sim', 'wifi']).slice(0, 2);
  return {
    name: T('активация', 'активація', 'activation'),
    desc: T('Телефон перезагрузился. Пройди первую настройку — и дождись активации.', 'Телефон перезавантажився. Пройди перше налаштування — і дочекайся активації.', 'The phone rebooted. Get through the setup assistant and wait for activation.'),
    run: async (P) => {
      let bad = 0;
      const scr = (inner) => P.stage(`<div class="setup"><div class="sscr">${inner}</div></div>`, 'pdev');
      const strike = (why) => { bad++; P.mistake(why); return bad < 4; };
      const g0 = gate();
      P.timer(75, () => { bad = 99; g0.done(false); });
      const flow = (async () => {
        for (const s of subs) {
          if (s === 'hello') {
            const want = HELLO[lang()];
            P.desc(T(`Нажми, когда на экране будет «${want}» на твоём языке. Похожие слова — другие языки.`, `Натисни, коли на екрані буде «${want}» твоєю мовою. Схожі слова — інші мови.`, `Tap when “${want}” in your language shows. Look-alikes are other languages.`));
            const seq = shuf([...HELLO_DECOY[lang()], want, want]);
            let k = 0, cur = '';
            const el = scr(`<div class="hello"></div><div class="small m">${T('Нажми на экран', 'Натисни на екран', 'Tap the screen')}</div>`).querySelector('.setup');
            const h = el.querySelector('.hello');
            const ok = await new Promise((res) => {
              const iv = setInterval(() => { if (P.api.ended) return clearInterval(iv); cur = seq[k++ % seq.length]; h.textContent = cur; h.classList.remove('in'); void h.offsetWidth; h.classList.add('in'); }, 1100);
              cur = seq[k++]; h.textContent = cur;
              el.addEventListener('click', () => { if (P.api.ended) return; if (cur === want) { clearInterval(iv); P.good(T(`Язык: ${want}`, `Мова: ${want}`, `Language: ${want}`)); res(true); } else if (!strike(T(`«${cur}» — это не твой язык`, `«${cur}» — це не твоя мова`, `“${cur}” isn’t your language`))) { clearInterval(iv); res(false); } });
            });
            if (!ok) return false;
          } else if (s === 'clock') {
            const d = gameDateSafe();
            let dd = ri(1, 28), mm = ri(0, 11), yy = 1970;
            const MON = T('янв фев мар апр мая июн июл авг сен окт ноя дек', 'січ лют бер кві тра чер лип сер вер жов лис гру', 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec').split(' ');
            P.desc(T('Сервер активации отвечает «сертификат ещё не действителен» — на телефоне сбились дата и время. Выставь сегодняшнюю дату (её видно в шапке твоего телефона ниже).', 'Сервер активації відповідає «сертифікат ще не дійсний» — на телефоні збилися дата й час. Встанови сьогоднішню дату (її видно в шапці твого телефона нижче).', 'The activation server says “certificate not yet valid” — the phone’s date is reset. Set today’s date (shown on your own phone below).'));
            P.log('SSL: certificate is not yet valid (1970-01-01)', 'err');
            const ok = await new Promise((res) => {
              const draw = () => {
                const el = scr(`<div class="ssub">${T('Дата и время', 'Дата й час', 'Date & time')}</div><div class="wheels">${[['d', dd], ['m', MON[mm]], ['y', yy]].map(([k, v]) => `<div class="wh"><button data-k="${k}" data-d="1">▲</button><b>${v}</b><button data-k="${k}" data-d="-1">▼</button></div>`).join('')}</div>`);
                P.on(el, '.wh button', (b) => { const s2 = +b.dataset.d; if (b.dataset.k === 'd') dd = ((dd - 1 + s2 + 31) % 31) + 1; if (b.dataset.k === 'm') mm = (mm + s2 + 12) % 12; if (b.dataset.k === 'y') yy = clamp(yy + s2 * (Math.abs(yy - d.getFullYear()) > 12 ? 10 : 1), 1970, 2040); P.api.sfx('tick'); draw(); });
              };
              draw();
              const c = P.ctl(`<div class="myphone">📱 ${T('Твой телефон', 'Твій телефон', 'Your phone')}: <b>${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}</b></div><button class="btn block go">${T('Готово', 'Готово', 'Done')}</button>`);
              P.on(c, '.go', () => {
                if (dd === d.getDate() && mm === d.getMonth() && yy === d.getFullYear()) { P.good(T('Дата верная, сертификат принят', 'Дата правильна, сертифікат прийнято', 'Date OK, certificate accepted')); P.ctl(''); res(true); }
                else if (!strike(T('Сертификат всё ещё недействителен — дата не та', 'Сертифікат досі недійсний — дата не та', 'Certificate still invalid — wrong date'))) res(false);
              });
            });
            if (!ok) return false;
          } else if (s === 'sim') {
            const pin = String(ri(1000, 9999)), puk = String(ri(10000000, 99999999)), pin2 = String(ri(1000, 9999)), puk2 = String(ri(10000000, 99999999));
            P.desc(T('Телефон просит PIN SIM‑карты. Он напечатан на пластике, из которого выломали симку. Не перепутай с PUK и PIN2 — три ошибки заблокируют SIM.', 'Телефон просить PIN SIM‑картки. Він надрукований на пластику, з якого виламали сімку. Не переплутай з PUK і PIN2 — три помилки заблокують SIM.', 'The phone asks for the SIM PIN. It’s printed on the plastic the SIM came in. Don’t mix it up with PUK or PIN2 — three errors lock the SIM.'));
            const rows = shuf([['PIN1', pin], ['PUK1', puk], ['PIN2', pin2], ['PUK2', puk2]]);
            let code = '', simBad = 0;
            const ok = await new Promise((res) => {
              const draw = () => {
                scr(`<div class="ssub">SIM PIN</div><div class="pinbox mono">${code.replace(/./g, '•') || '—'}</div><div class="small m">${T('Осталось попыток', 'Залишилось спроб', 'Tries left')}: ${3 - simBad}</div>`);
              };
              draw();
              const c = P.ctl(`<div class="simcard"><div class="chip"></div><div class="mono small">${rows.map(([k, v]) => `<div><span class="m">${k}</span> ${v}</div>`).join('')}</div></div>${keypad()}`);
              P.on(c, '[data-k]', (b) => {
                const k = b.dataset.k;
                if (k === '⌫') code = code.slice(0, -1);
                else if (k === '✓') {
                  if (code === pin) { P.good(T('SIM разблокирована', 'SIM розблоковано', 'SIM unlocked')); P.ctl(''); return res(true); }
                  simBad++; code = '';
                  if (!strike(T('Неверный PIN', 'Невірний PIN', 'Wrong PIN')) || simBad >= 3) { P.log(T('SIM заблокирована — нужен PUK', 'SIM заблоковано — потрібен PUK', 'SIM locked — PUK needed'), 'err'); return res(false); }
                } else if (code.length < 8) code += k;
                P.api.sfx('tick'); draw();
              });
            });
            if (!ok) return false;
          } else if (s === 'wifi') {
            const base = pick(['Lab', 'Remont', 'Fix', 'Service', 'Office']) + pick(['_5G', '-5G', '_2.4']);
            const key = Array.from({ length: 8 }, () => '0123456789ABCDEF'[ri(0, 15)]).join('');
            const look = base.replace(/o/i, (m) => (m === 'o' ? '0' : '0'));
            const nets = shuf([base, base + '_EXT', look !== base ? look : base + '2', 'TP-LINK_' + ri(1000, 9999), base.replace(/[_-]/, '')]);
            P.desc(T('Подключись к своей сети. Имя и ключ — на наклейке роутера. Соседские сети похожи.', 'Підключись до своєї мережі. Імʼя і ключ — на наліпці роутера. Сусідські мережі схожі.', 'Join your network. Name and key are on the router sticker. Neighbours’ networks look similar.'));
            let net = null, code = '';
            const label = `<div class="sticker mono"><div>SSID: <b>${esc(base)}</b></div><div>WPA2: <b>${key.slice(0, 4)} ${key.slice(4)}</b></div></div>`;
            const ok = await new Promise((res) => {
              const list = () => {
                const el = scr(`<div class="ssub">Wi‑Fi</div>${nets.map((n) => `<button class="wnet" data-n="${esc(n)}">📶 ${esc(n)} <span>🔒</span></button>`).join('')}`);
                P.ctl(label);
                P.on(el, '.wnet', (b) => { net = b.dataset.n; code = ''; pass(); });
              };
              const pass = () => {
                scr(`<div class="ssub">${T('Ключ для', 'Ключ для', 'Key for')} «${esc(net)}»</div><div class="pinbox mono">${code || '—'}</div>`);
                const c = P.ctl(`${label}<div class="pkeys hexk">${'0123456789ABCDEF'.split('').map((k) => `<button data-k="${k}">${k}</button>`).join('')}<button data-k="⌫">⌫</button><button data-k="←">←</button><button data-k="✓" class="go">✓</button></div>`);
                P.on(c, '[data-k]', (b) => {
                  const k = b.dataset.k;
                  if (k === '⌫') code = code.slice(0, -1);
                  else if (k === '←') return list();
                  else if (k === '✓') {
                    if (net !== base) { if (!strike(T(`«${net}» — не твоя сеть`, `«${net}» — не твоя мережа`, `“${net}” isn’t your network`))) return res(false); return list(); }
                    if (code !== key) { code = ''; if (!strike(T('Неверный ключ', 'Невірний ключ', 'Wrong key'))) return res(false); }
                    else { P.good(T(`Wi‑Fi: ${base}`, `Wi‑Fi: ${base}`, `Wi‑Fi: ${base}`)); P.ctl(''); return res(true); }
                  } else if (code.length < 8) code += k;
                  P.api.sfx('tick');
                  P.root.querySelector('.pinbox').textContent = code || '—';
                });
              };
              list();
            });
            if (!ok) return false;
          }
        }
        P.desc(T(`Связываемся с серверами ${dev.pear ? 'Pear' : 'Gugle'}…`, `Звʼязуємося із серверами ${dev.pear ? 'Pear' : 'Gugle'}…`, `Contacting ${dev.pear ? 'Pear' : 'Gugle'} servers…`));
        scr(`<div class="spin"></div><div class="ssub">${T('Активация…', 'Активація…', 'Activating…')}</div>`);
        P.log(T('Проверка блокировки активации…', 'Перевірка блокування активації…', 'Checking activation lock…'));
        await P.wait(1500);
        scr(`<div style="font-size:42px">👋</div><div class="ssub">${T('Добро пожаловать!', 'Ласкаво просимо!', 'Welcome!')}</div>`);
        P.good(T('Активирован. Блокировки нет', 'Активовано. Блокування немає', 'Activated. No lock'));
        await P.wait(700);
        return true;
      })();
      return Promise.race([flow, g0]);
    },
  };
}
function gameDateSafe() { try { const d = new Date(G.s.startDate + 'T00:00:00'); d.setDate(d.getDate() + Math.floor(G.s.t / 1440)); return d; } catch { return new Date(); } }

// ---------------------------------------------------------------- STEP: short a test point on the board (Android EDL)
function testpointStep() {
  const pair = pick([['CLK', 'GND'], ['DAT0', 'GND'], ['CMD', 'GND']]);
  return {
    name: T('тест‑поинт', 'тест‑поінт', 'test point'),
    desc: T(`Сервис‑мануал: «Для аварийного режима EDL замкни пинцетом <b>${pair[0]}</b> на <b>${pair[1]}</b> и в течение 2 секунд вставь кабель». VCC на GND — короткое замыкание!`, `Сервіс‑мануал: «Для аварійного режиму EDL замкни пінцетом <b>${pair[0]}</b> на <b>${pair[1]}</b> і протягом 2 секунд встав кабель». VCC на GND — коротке замикання!`, `Service manual: “For EDL, short <b>${pair[0]}</b> to <b>${pair[1]}</b> with tweezers and plug the cable within 2 s.” VCC to GND is a short circuit!`),
    run: (P) => {
      const g = gate();
      const pads = shuf(['CLK', 'GND', 'DAT0', 'CMD', 'VCC', 'VCCQ', 'RST']);
      const pos = [[40, 60], [100, 46], [160, 64], [62, 120], [130, 116], [188, 128], [96, 168]];
      let a = null, bad = 0, armed = 0;
      const st = P.stage(`<svg class="pcb" viewBox="0 0 230 210"><rect x="6" y="6" width="218" height="198" rx="14" fill="#0e3b2a" stroke="#2c6b4f" stroke-width="2"/>
        <rect x="70" y="70" width="60" height="38" rx="4" fill="#1d1f24"/><text x="100" y="93" text-anchor="middle" font-size="8" fill="#9aa">UFS</text>
        <rect x="140" y="150" width="70" height="44" rx="4" fill="#9aa3ad" opacity=".8"/><text x="175" y="176" text-anchor="middle" font-size="8" fill="#334">SHIELD</text>
        <path d="M20 30 H210 M20 196 H120 M14 40 V180" stroke="#1f5c43" stroke-width="3" fill="none"/>
        ${pads.map((p, i) => `<g class="tp" data-p="${p}"><circle cx="${pos[i][0]}" cy="${pos[i][1]}" r="9" fill="#d4a94a" stroke="#7a5a1a" stroke-width="2"/><text x="${pos[i][0]}" y="${pos[i][1] + 21}" text-anchor="middle" font-size="9" font-family="monospace" fill="#e8f5ee">${p}</text></g>`).join('')}</svg>`, 'ppcb');
      const c = P.ctl(`<div class="cstat">${T('Пинцет: коснись первой площадки', 'Пінцет: торкнись першого майданчика', 'Tweezers: touch the first pad')}</div><button class="btn block big go" disabled>🔌 ${T('Вставить кабель', 'Вставити кабель', 'Plug the cable')}</button>`);
      const stat = c.querySelector('.cstat'), go = c.querySelector('.go');
      const reset = () => { a = null; armed = 0; go.disabled = true; st.querySelectorAll('.tp').forEach((e) => e.classList.remove('on')); stat.textContent = T('Пинцет: коснись первой площадки', 'Пінцет: торкнись першого майданчика', 'Tweezers: touch the first pad'); };
      st.querySelectorAll('.tp').forEach((e) => e.addEventListener('click', () => {
        if (P.api.ended || armed) return;
        const p = e.dataset.p;
        e.classList.add('on'); P.api.sfx('tick');
        if (!a) { a = p; stat.textContent = T(`${p} — теперь вторая площадка`, `${p} — тепер другий майданчик`, `${p} — now the second pad`); return; }
        const set = new Set([a, p]);
        if (set.has('GND') && (set.has('VCC') || set.has('VCCQ'))) { bad++; P.mistake(T('Искра! Короткое замыкание питания', 'Іскра! Коротке замикання живлення', 'Spark! Power short circuit'), 2); reset(); if (bad >= 2) g.done(false); return; }
        if (set.has(pair[0]) && set.has(pair[1]) && set.size === 2) { armed = 2.2; go.disabled = false; stat.innerHTML = `<span class="y">${T('Замкнуто! Быстро вставляй кабель', 'Замкнено! Швидко вставляй кабель', 'Shorted! Plug the cable now')}</span>`; return; }
        bad++; P.mistake(T(`${a} ↔ ${p}: телефон не видит EDL`, `${a} ↔ ${p}: телефон не бачить EDL`, `${a} ↔ ${p}: no EDL`)); reset(); if (bad >= 3) g.done(false);
      }));
      P.on(c, '.go', () => { if (armed > 0) { P.good('Qualcomm HS-USB QDLoader 9008'); g.done(true); } });
      P.tick((dt) => { if (armed > 0) { armed -= dt; if (armed <= 0) { bad++; P.mistake(T('Пинцет соскользнул', 'Пінцет зісковзнув', 'The tweezers slipped')); reset(); if (bad >= 3) g.done(false); } } });
      P.timer(45, () => g.done(false));
      return g;
    },
  };
}

// ---------------------------------------------------------------- STEP: compare checksums
const LOOK = { '8': 'B', B: '8', '0': 'D', D: '0', '1': '7', '7': '1', E: 'F', F: 'E', '3': '8', C: '0', '6': 'B', '5': '6', A: '4', '4': 'A', '9': 'A', '2': '7' };
function checksumStep(file) {
  return {
    name: T('проверка хеша', 'перевірка хешу', 'checksum'),
    desc: T(`Скачано 4 копии <b class="mono">${esc(file)}</b> с разных зеркал. Выбери ту, у которой SHA‑256 совпадает с официальным — остальные битые или подменённые.`, `Завантажено 4 копії <b class="mono">${esc(file)}</b> з різних дзеркал. Обери ту, у якої SHA‑256 збігається з офіційним — решта биті або підмінені.`, `4 copies of <b class="mono">${esc(file)}</b> from different mirrors. Pick the one whose SHA‑256 matches the official — the rest are broken or tampered.`),
    run: (P) => {
      const g = gate();
      const hx = () => Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => '0123456789ABCDEF'[ri(0, 15)]).join(''));
      const off = hx();
      const mut = (h) => { const a = h.map((s) => s.split('')); const gi = ri(1, 3), ci = ri(0, 3); const ch = a[gi][ci]; a[gi][ci] = LOOK[ch] || (ch === '0' ? 'D' : '0'); return a.map((s) => s.join('')); };
      const seen = new Set([off.join('')]); const fakes = [];
      while (fakes.length < 3) { const f = fakes.length === 2 ? mut(mut(off)) : mut(off); if (!seen.has(f.join(''))) { seen.add(f.join('')); fakes.push(f); } }
      const rows = shuf([{ h: off, ok: true }, ...fakes.map((h) => ({ h }))]).map((r, i) => ({ ...r, m: ['mirror-eu', 'files.4pda.cc', 'dl.fwhub.io', 'cdn.romz.net'][i] }));
      let bad = 0;
      P.stage(`<div class="pinfo"><div class="small m">${T('Официальный SHA‑256', 'Офіційний SHA‑256', 'Official SHA‑256')}</div><div class="pbig mono">${off.join(' ')}</div></div>`, 'pterm');
      const c = P.ctl(rows.map((r, i) => `<button class="frow" data-i="${i}"><span class="mono">${r.h.join(' ')}</span><span class="m small">${r.m}</span></button>`).join(''));
      P.on(c, '.frow', (b) => {
        const r = rows[+b.dataset.i];
        if (r.ok) { b.classList.add('ok'); P.good(T(`Хеш совпал (${r.m})`, `Хеш збігся (${r.m})`, `Hash matches (${r.m})`)); return g.done(true); }
        b.classList.add('bad'); b.disabled = true; bad++;
        P.mistake(T(`${r.m}: хеш не совпадает`, `${r.m}: хеш не збігається`, `${r.m}: hash mismatch`));
        if (bad >= 2) g.done(false);
      });
      P.timer(30, () => g.done(false));
      return g;
    },
  };
}

// ---------------------------------------------------------------- STEP: read a crash log, remove the culprit
const TWEAKS = ['SnowBoard', 'Cylinder', 'PowerSelector', 'Velvet', 'DockX', 'NotchKit', 'PrefixUI', 'Shadow', 'CallBar', 'Lynx'];
function crashStep() {
  const tw = shuf(TWEAKS).slice(0, 4);
  const bad = tw[ri(0, 3)];
  return {
    name: T('разбор краша', 'розбір крешу', 'crash log'),
    desc: T('После джейлбрейка SpringBoard падает по кругу. Прочитай лог и удали твик, который реально вызывает падение — остальные просто загрузились.', 'Після джейлбрейку SpringBoard падає по колу. Прочитай лог і видали твік, який справді спричиняє падіння — решта просто завантажилися.', 'After the jailbreak SpringBoard keeps crashing. Read the log and remove the tweak that actually causes it — the others just loaded.'),
    run: (P) => {
      const g = gate();
      const lines = shuf(tw.map((t) => `[substrate] loaded ${t}.dylib`)).concat([`SpringBoard[${ri(200, 900)}]: hooking -[SBIconView layoutSubviews]`, `Exception Type: EXC_BAD_ACCESS (SIGSEGV)`, `Thread 0 Crashed: 0 ${bad}.dylib 0x0000000${ri(100, 999)}a +${ri(100, 900)}`, `1 SpringBoard 0x00000001${ri(100, 999)}f`, `respring loop detected (${ri(3, 7)}×)`]);
      P.stage(`<div class="ptm mono small">${lines.map((l) => `<div class="${/Crashed|EXC_/.test(l) ? 'r' : ''}">${esc(l)}</div>`).join('')}</div>`, 'pterm');
      const opts = shuf([...tw.map((t) => ({ t, v: t })), { t: T('Удалить все твики', 'Видалити всі твіки', 'Remove all tweaks'), v: '*' }]);
      const c = P.ctl(`<div class="chips">${opts.map((o) => `<button data-v="${esc(o.v)}">🗑 ${esc(o.t)}</button>`).join('')}</div>`);
      let n = 0;
      P.on(c, 'button', (b) => {
        const v = b.dataset.v;
        if (v === bad) { P.good(T(`${bad} удалён — SpringBoard стабилен`, `${bad} видалено — SpringBoard стабільний`, `${bad} removed — SpringBoard is stable`)); return g.done(true); }
        n++; b.disabled = true;
        P.mistake(v === '*' ? T('Снесено всё — клиент без твиков недоволен', 'Знесено все — клієнт без твіків незадоволений', 'Wiped everything — not what the client wanted') : T(`${v} удалён, но SpringBoard снова упал`, `${v} видалено, але SpringBoard знову впав`, `${v} removed, SpringBoard crashed again`));
        if (n >= 2 || v === '*') g.done(false);
      });
      P.timer(40, () => g.done(false));
      return g;
    },
  };
}

// ---------------------------------------------------------------- PROCEDURES
function labRun(api, steps, opts) { return procedure(api, { steps, theme: 'lab', ...opts }); }
// jailbreak (Pear) / root (Android): exploit → patch → post-check
function jbGame(api, { item, hard = 0.5 }) {
  const dev = deviceOf(item);
  const steps = dev.pear
    ? [pick([breachStep(hard), hexStep(), registerStep()]), pick([patchStep(hard), scriptStep('jb')]), pick([crashStep(), checksumStep('bootstrap.tar.zst')])]
    : [checksumStep(pick(['Magisk-v27.0.apk', 'magisk_patched.img'])), pick([scriptStep('root'), comboStep(dev)]), pick([patchStep(hard), registerStep(), breachStep(hard)])];
  labRun(api, steps, { head: `<span class="hl">&gt; ${esc(dev.name)}</span> · <span class="dim mono">${esc(dev.id)} · ${esc(dev.os)}</span>` });
}
// reflash: enter the service mode → right firmware → flash → setup
function flashGame(api, { item, hard = 0.5 }) {
  const dev = deviceOf(item);
  const enter = dev.pear ? comboStep(dev) : (Math.random() < 0.45 ? testpointStep() : comboStep(dev));
  const mid = !dev.pear && item?.lock === 'frp' && Math.random() < 0.5 ? scriptStep('frp') : firmwareStep(dev);
  const steps = [enter, mid, cableStep(dev), setupStep(dev)];
  if (item?.lock === 'bootloop' && Math.random() < 0.5) steps.splice(1, 0, checksumStep(dev.pear ? `${dev.id}_${dev.ver}_Restore.ipsw` : `${dev.code}_${dev.region}.tar.md5`));
  labRun(api, steps, { head: `<span class="hl">&gt; ${esc(dev.name)}</span> · <span class="dim mono">${esc(dev.id)} · ${esc(dev.os)}</span>` });
}

export const LAB_GAMES = { jb: jbGame, flash: flashGame };
// single steps reused elsewhere
export { SCRIPTS };
export const LAB_STEPS = { breachStep, patchStep, hexStep, registerStep, checksumStep, crashStep, scriptStep, comboStep, cableStep, setupStep, testpointStep, firmwareStep };
