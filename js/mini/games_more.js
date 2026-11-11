// More minigames for everyday actions: photographing a listing, giving change,
// sorting parcels, catching boxes, catching shoplifters, memory pairs, code sequences, lock picking,
// weighing gold, counting sheep, flipping pancakes, spotting a difference, composing a text.
import { T } from '../core/i18n.js';
import { esc, clamp, rint, pickR, shuffleR, rnd } from '../core/util.js';
import { fmt } from '../core/money.js';
import { h } from './engine.js';
import { renderItem } from '../ui/art.js';

const stage = (api, html, cls = '') => { api.body.innerHTML = html; return api.body.querySelector('.mstage') || api.body; };
const hint = (t, sub = '') => `<div class="mhint">${t}${sub ? `<small>${sub}</small>` : ''}</div>`;

// ---------------------------------------------------------------- PHOTO: shoot a listing photo in focus
function photo(api, { item, shots = 3 }) {
  let n = 0, sum = 0, t = 0;
  const pic = item ? renderItem(item, { tilt: false, zoom: 1 }).svg : '<div style="font-size:120px;text-align:center">📦</div>';
  api.body.innerHTML = hint(T('Ловите момент, когда кадр резкий и предмет в центре — тогда жмите затвор.', 'Ловіть момент, коли кадр різкий і предмет у центрі — тоді тисніть затвор.', 'Shoot when the frame is sharp and the item is centred.'), `${T('Кадр', 'Кадр', 'Shot')} <b class="sn">1</b>/${shots}`) + `<div class="mstage cam"><div class="vf"><div class="pic">${pic}</div><div class="grid"></div><div class="focus"></div></div><div class="fbar"><i></i></div></div><button class="btn block shutter" style="min-height:64px;font-size:22px">📸</button>`;
  const picEl = api.body.querySelector('.pic'), bar = api.body.querySelector('.fbar i'), sn = api.body.querySelector('.sn');
  api.setTime(14);
  let sharp = 0;
  api.onTick((dt) => {
    t += dt;
    sharp = (Math.sin(t * 2.3) * 0.5 + 0.5) * (Math.sin(t * 0.9 + 1) * 0.25 + 0.75);
    const dx = Math.sin(t * 1.7) * 18 * (1 - sharp), dy = Math.cos(t * 1.3) * 12 * (1 - sharp);
    picEl.style.filter = `blur(${((1 - sharp) * 6).toFixed(1)}px)`;
    picEl.style.transform = `translate(${dx}px, ${dy}px)`;
    bar.style.width = Math.round(sharp * 100) + '%';
    bar.style.background = sharp > 0.82 ? 'var(--acc)' : sharp > 0.55 ? 'var(--yel)' : 'var(--red)';
  });
  api.body.querySelector('.shutter').addEventListener('click', () => {
    if (api.ended) return;
    n++; sum += sharp; api.sfx(sharp > 0.82 ? 'ok' : 'tick'); api.flash(sharp > 0.82);
    if (n >= shots) api.end({ score: sum / shots, emoji: '📸', title: T('Фото готовы', 'Фото готові', 'Photos ready'), text: T(`Качество снимков: ${Math.round((sum / shots) * 100)}%. Хорошие фото привлекают больше покупателей.`, `Якість знімків: ${Math.round((sum / shots) * 100)}%. Гарні фото приваблюють більше покупців.`, `Photo quality: ${Math.round((sum / shots) * 100)}%. Good photos attract more buyers.`) });
    else sn.textContent = n + 1;
  });
}

// ---------------------------------------------------------------- CHANGE: count the change at a till
function change(api, { rounds = 5 }) {
  let r = 0, ok = 0;
  api.setTime(30);
  const show = () => {
    const price = rint(3, 98) * 10 + pickR([0, 0, 5]);
    const paid = [100, 200, 500, 1000, 2000].find((p) => p > price + rint(0, 300)) || 2000;
    const right = paid - price;
    const opts = shuffleR([right, right + 10, Math.max(5, right - 10), right + 100].filter((v, i, a) => a.indexOf(v) === i)).slice(0, 4);
    if (!opts.includes(right)) opts[0] = right;
    api.body.innerHTML = hint(T('Сколько сдачи?', 'Скільки решти?', 'How much change?'), `${r + 1}/${rounds}`) + `<div class="card center"><div class="small m">${T('Покупка', 'Покупка', 'Total')}</div><div class="price-big">${price}</div><div class="small m mt">${T('Дали', 'Дали', 'Paid')}</div><div style="font-size:26px;font-weight:800">${paid}</div></div><div class="pad-grid" style="grid-template-columns:1fr 1fr">${shuffleR(opts).map((v) => `<button data-v="${v}" style="min-height:64px;font-size:22px">${v}</button>`).join('')}</div>`;
    api.body.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => {
      const good = +b.dataset.v === right;
      if (good) ok++;
      api.sfx(good ? 'cash' : 'err'); api.flash(good);
      if (++r >= rounds) api.end({ score: ok / rounds, text: T(`Верно: ${ok} из ${rounds}`, `Правильно: ${ok} з ${rounds}`, `Correct: ${ok} of ${rounds}`) });
      else show();
    }));
  };
  show();
}

// ---------------------------------------------------------------- SWIPE: sort parcels left / right
function swipe(api, { n = 14 }) {
  const KINDS = [[T('Хрупкое', 'Крихке', 'Fragile'), '🥂', 'l'], [T('Обычное', 'Звичайне', 'Regular'), '📦', 'r'], [T('Возврат', 'Повернення', 'Return'), '↩️', 'l'], [T('Срочное', 'Термінове', 'Express'), '⚡', 'r']];
  const rule = shuffleR([0, 1, 2, 3]);
  const left = [KINDS[rule[0]], KINDS[rule[1]]];
  let i = 0, ok = 0, cur, sx = 0;
  api.setTime(26);
  api.body.innerHTML = hint(T('Свайп влево или вправо — по правилу сверху.', 'Свайп уліво або вправо — за правилом зверху.', 'Swipe left or right following the rule.'), `<span class="cnt">0</span>/${n}`) + `<div class="row between" style="font-weight:700;margin-bottom:8px"><span>⬅ ${left.map((k) => k[1] + ' ' + k[0]).join(', ')}</span><span>${KINDS.filter((k) => !left.includes(k)).map((k) => k[1] + ' ' + k[0]).join(', ')} ➡</span></div><div class="mstage swfield"><div class="parcel"></div></div><div class="btns"><button class="btn dark" data-d="l">⬅</button><button class="btn dark" data-d="r">➡</button></div>`;
  const field = api.body.querySelector('.swfield'), card = field.querySelector('.parcel'), cnt = api.body.querySelector('.cnt');
  const next = () => { cur = pickR(KINDS); card.innerHTML = `<div style="font-size:60px">${cur[1]}</div><b>${cur[0]}</b><small>#${rint(10000, 99999)}</small>`; card.style.transform = ''; };
  const decide = (d) => {
    if (api.ended) return;
    const good = (d === 'l') === left.includes(cur);
    if (good) ok++;
    api.sfx(good ? 'ok' : 'err'); api.flash(good);
    card.style.transform = `translateX(${d === 'l' ? -140 : 140}%) rotate(${d === 'l' ? -18 : 18}deg)`;
    cnt.textContent = ++i;
    if (i >= n) setTimeout(() => api.end({ score: ok / n, text: T(`Без ошибок: ${ok} из ${n}`, `Без помилок: ${ok} з ${n}`, `Right: ${ok} of ${n}`) }), 180);
    else setTimeout(next, 170);
  };
  field.addEventListener('pointerdown', (e) => { sx = e.clientX; });
  field.addEventListener('pointerup', (e) => { const dx = e.clientX - sx; if (Math.abs(dx) > 30) decide(dx < 0 ? 'l' : 'r'); });
  api.body.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => decide(b.dataset.d)));
  next();
}

// ---------------------------------------------------------------- CATCH: move the trolley, catch boxes, dodge glass
function catchGame(api, { time = 22 }) {
  let x = 0.5, got = 0, miss = 0, bad = 0, spawn = 0;
  const fall = [];
  api.setTime(time, () => api.end({ score: clamp(got / (got + miss + bad * 2 + 1) * 1.1, 0, 1), text: T(`Поймано: ${got}, уронено: ${miss}, стекла: ${bad}`, `Спіймано: ${got}, впущено: ${miss}, скла: ${bad}`, `Caught ${got}, dropped ${miss}, glass ${bad}`) }));
  api.body.innerHTML = hint(T('Водите пальцем — ловите коробки тележкой, не ловите битое стекло.', 'Водіть пальцем — ловіть коробки візком, не ловіть бите скло.', 'Drag to catch boxes, avoid broken glass.')) + `<div class="mstage catchf"><div class="cart">🛒</div></div>`;
  const f = api.body.querySelector('.catchf'), cart = f.querySelector('.cart');
  const move = (e) => { const r = f.getBoundingClientRect(); x = clamp((e.clientX - r.left) / r.width, 0.06, 0.94); };
  f.addEventListener('pointerdown', move); f.addEventListener('pointermove', move);
  api.onTick((dt) => {
    cart.style.left = x * 100 + '%';
    spawn -= dt;
    if (spawn <= 0) { const glass = Math.random() < 0.22; const e = h('div', 'fallit', glass ? '🍾' : pickR(['📦', '📦', '🎁', '🧳'])); e.x = rnd(0.08, 0.92); e.y = -0.05; e.glass = glass; e.v = rnd(0.35, 0.6); f.appendChild(e); fall.push(e); spawn = rnd(0.45, 0.9); }
    for (const e of fall) {
      if (e.done) continue;
      e.y += dt * e.v; e.style.left = e.x * 100 + '%'; e.style.top = e.y * 100 + '%';
      if (e.y > 0.84 && e.y < 0.95 && Math.abs(e.x - x) < 0.11) { e.done = true; e.remove(); if (e.glass) { bad++; api.sfx('err'); api.shake(f); } else { got++; api.sfx('tick'); } }
      else if (e.y > 1.02) { e.done = true; e.remove(); if (!e.glass) miss++; }
    }
  });
}

// ---------------------------------------------------------------- WHACK: catch shoplifters popping up
function whack(api, { time = 20 }) {
  let hits = 0, wrong = 0, missed = 0;
  api.setTime(time, () => api.end({ score: clamp((hits - wrong) / Math.max(6, hits + missed), 0, 1), text: T(`Поймано: ${hits}, ошибок: ${wrong}`, `Спіймано: ${hits}, помилок: ${wrong}`, `Caught ${hits}, mistakes ${wrong}`) }));
  api.body.innerHTML = hint(T('Ловите воришек 🥷 — покупателей 🙂 не трогайте.', 'Ловіть злодюжок 🥷 — покупців 🙂 не чіпайте.', 'Catch thieves 🥷, leave shoppers 🙂 alone.')) + `<div class="mstage whackf">${Array.from({ length: 9 }, (_, i) => `<button class="hole" data-i="${i}"></button>`).join('')}</div>`;
  const holes = [...api.body.querySelectorAll('.hole')];
  let t = 0;
  api.onTick((dt) => {
    t -= dt;
    if (t <= 0) {
      const free = holes.filter((h2) => !h2.dataset.who);
      if (free.length) { const b = pickR(free); const thief = Math.random() < 0.6; b.dataset.who = thief ? 't' : 'c'; b.textContent = thief ? '🥷' : '🙂'; b.until = performance.now() + rnd(650, 1100); }
      t = rnd(0.35, 0.7);
    }
    for (const b of holes) if (b.dataset.who && performance.now() > b.until) { if (b.dataset.who === 't') missed++; b.dataset.who = ''; b.textContent = ''; }
  });
  holes.forEach((b) => b.addEventListener('pointerdown', () => { if (!b.dataset.who || api.ended) return; if (b.dataset.who === 't') { hits++; api.sfx('ok'); } else { wrong++; api.sfx('err'); api.flash(false); } b.dataset.who = ''; b.textContent = '💥'; setTimeout(() => { if (!b.dataset.who) b.textContent = ''; }, 200); }));
}

// ---------------------------------------------------------------- MEMORY: pairs (stock audit)
function memory(api, { pairs = 6 }) {
  const syms = shuffleR(['📱', '⌚', '👟', '👜', '🎧', '💍', '🎮', '📷', '🧴', '🕶']).slice(0, pairs);
  const cards = shuffleR([...syms, ...syms]);
  let open = [], done = 0, moves = 0;
  api.setTime(40, () => api.end({ score: done / pairs * 0.7, text: T(`Найдено пар: ${done}/${pairs}`, `Знайдено пар: ${done}/${pairs}`, `Pairs: ${done}/${pairs}`) }));
  api.body.innerHTML = hint(T('Инвентаризация: найдите все пары одинаковых товаров.', 'Інвентаризація: знайдіть усі пари однакових товарів.', 'Stock audit: find all matching pairs.')) + `<div class="mstage memf">${cards.map((c, i) => `<button class="mc" data-i="${i}"><span>${c}</span></button>`).join('')}</div>`;
  const els = [...api.body.querySelectorAll('.mc')];
  els.forEach((b) => b.addEventListener('click', () => {
    if (api.ended || b.classList.contains('open') || open.length >= 2) return;
    b.classList.add('open'); open.push(b); api.sfx('tick');
    if (open.length === 2) {
      moves++;
      const [a, c] = open;
      if (cards[a.dataset.i] === cards[c.dataset.i]) { a.classList.add('ok'); c.classList.add('ok'); open = []; done++; api.sfx('ok'); if (done >= pairs) api.end({ score: clamp(1.25 - moves / (pairs * 3), 0.4, 1), text: T(`Ходов: ${moves}`, `Ходів: ${moves}`, `Moves: ${moves}`) }); }
      else setTimeout(() => { a.classList.remove('open'); c.classList.remove('open'); open = []; }, 650);
    }
  }));
}

// ---------------------------------------------------------------- SIMON: repeat a code / pattern
function simon(api, { rounds = 5 }) {
  const seq = [];
  let pos = 0, round = 0, input = false;
  const COL = ['#ff5468', '#2ef2a0', '#4da3ff', '#ffc23d'];
  api.body.innerHTML = hint(T('Запомните последовательность и повторите её.', 'Запамʼятайте послідовність і повторіть її.', 'Memorise the sequence and repeat it.'), `<span class="rd">1</span>/${rounds}`) + `<div class="mstage simonf">${COL.map((c, i) => `<button class="sp" data-i="${i}" style="--c:${c}"></button>`).join('')}</div>`;
  const pads = [...api.body.querySelectorAll('.sp')], rd = api.body.querySelector('.rd');
  const blink = (i) => { pads[i].classList.add('on'); api.sfx('tick'); setTimeout(() => pads[i].classList.remove('on'), 320); };
  const play = () => { input = false; seq.push(rint(0, 3)); rd.textContent = round + 1; seq.forEach((i, k) => setTimeout(() => blink(i), 600 + k * 520)); setTimeout(() => { input = true; pos = 0; }, 600 + seq.length * 520); };
  pads.forEach((p) => p.addEventListener('pointerdown', () => {
    if (!input || api.ended) return;
    const i = +p.dataset.i; blink(i);
    if (i !== seq[pos]) { api.flash(false); return api.end({ score: round / rounds, text: T(`Пройдено раундов: ${round}`, `Пройдено раундів: ${round}`, `Rounds cleared: ${round}`) }); }
    if (++pos >= seq.length) { round++; if (round >= rounds) return api.end({ score: 1 }); api.flash(true); play(); }
  }));
  play();
}

// ---------------------------------------------------------------- LOCKPICK: find the sweet spot of each pin
function lockpick(api, { pins = 3 }) {
  let pin = 0, angle = 0, dir = 1, tries = 6;
  const spots = Array.from({ length: pins }, () => rnd(25, 335));
  api.setTime(30);
  api.body.innerHTML = hint(T('Отмычка крутится — нажмите, когда она в зелёной зоне штифта.', 'Відмичка крутиться — натисніть, коли вона в зеленій зоні штифта.', 'Tap when the pick is in the pin’s green zone.'), `${T('Штифт', 'Штифт', 'Pin')} <b class="pn">1</b>/${pins} · ${T('попыток', 'спроб', 'tries')} <b class="tr">${tries}</b>`) + `<div class="mstage lockf"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="80" fill="#1b1f2a" stroke="#3a4152" stroke-width="10"/><path class="zone" fill="none" stroke="#2ef2a0" stroke-width="10"/><g class="pick"><line x1="100" y1="100" x2="100" y2="26" stroke="#ffc23d" stroke-width="5" stroke-linecap="round"/></g><circle cx="100" cy="100" r="14" fill="#c9a227"/></svg></div><button class="btn block tap" style="min-height:64px;font-size:22px">🔓</button>`;
  const zone = api.body.querySelector('.zone'), pick = api.body.querySelector('.pick');
  const W = () => 34 - pin * 7;
  const arc = (a, w) => { const r = 80, s0 = (a - w / 2 - 90) * Math.PI / 180, s1 = (a + w / 2 - 90) * Math.PI / 180; return `M${100 + r * Math.cos(s0)} ${100 + r * Math.sin(s0)} A${r} ${r} 0 0 1 ${100 + r * Math.cos(s1)} ${100 + r * Math.sin(s1)}`; };
  const setZone = () => zone.setAttribute('d', arc(spots[pin], W()));
  setZone();
  api.onTick((dt) => { angle = (angle + dir * dt * (140 + pin * 60) + 360) % 360; pick.setAttribute('transform', `rotate(${angle} 100 100)`); });
  api.body.querySelector('.tap').addEventListener('click', () => {
    if (api.ended) return;
    const d = Math.abs(((angle - spots[pin] + 540) % 360) - 180);
    if (d <= W() / 2) { api.sfx('ok'); api.flash(true); pin++; dir = -dir; if (pin >= pins) return api.end({ score: 1, emoji: '🔓', title: T('Открыто!', 'Відчинено!', 'Unlocked!') }); api.body.querySelector('.pn').textContent = pin + 1; setZone(); }
    else { tries--; api.sfx('err'); api.shake(); api.body.querySelector('.tr').textContent = tries; if (tries <= 0) api.end({ score: pin / pins * 0.5, emoji: '🔒', title: T('Отмычка сломалась', 'Відмичка зламалася', 'The pick broke') }); }
  });
}

// ---------------------------------------------------------------- SCALE: stop the needle on the exact weight
function scale(api, { rounds = 3 }) {
  let r = 0, sum = 0, t = 0, target = 0;
  const show = () => { target = +(rnd(1.2, 28)).toFixed(1); api.body.querySelector('.tg').textContent = `${target} ${T('г', 'г', 'g')}`; };
  api.body.innerHTML = hint(T('Остановите стрелку на весе с бирки — так оценщик проверяет пробу и вес.', 'Зупиніть стрілку на вазі з бирки — так оцінювач перевіряє пробу й вагу.', 'Stop the needle on the tag weight — that’s how appraisers check gold.'), `${T('Цель', 'Ціль', 'Target')}: <b class="tg"></b>`) + `<div class="mstage scalef"><div class="disp mono">0.0</div><div class="ruler"><i class="needle"></i></div></div><button class="btn block tap" style="min-height:64px;font-size:22px">⚖️ ${T('Стоп', 'Стоп', 'Stop')}</button>`;
  const disp = api.body.querySelector('.disp'), needle = api.body.querySelector('.needle');
  let val = 0;
  show();
  api.onTick((dt) => { t += dt * (1.1 + r * 0.35); val = (Math.sin(t) * 0.5 + 0.5) * 30; disp.textContent = val.toFixed(1); needle.style.left = (val / 30) * 100 + '%'; });
  api.body.querySelector('.tap').addEventListener('click', () => {
    if (api.ended) return;
    const acc = clamp(1 - Math.abs(val - target) / 4, 0, 1);
    sum += acc; api.sfx(acc > 0.8 ? 'ok' : 'tick'); api.flash(acc > 0.7);
    if (++r >= rounds) api.end({ score: sum / rounds });
    else show();
  });
}

// ---------------------------------------------------------------- SHEEP: count sheep to fall asleep
function sheep(api) {
  const total = rint(7, 13);
  let shown = 0, t = 0.6;
  api.body.innerHTML = hint(T('Считайте овец, чтобы уснуть. Сколько их было?', 'Рахуйте овець, щоб заснути. Скільки їх було?', 'Count the sheep to fall asleep. How many were there?')) + `<div class="mstage sheepf"><div class="fence"></div></div>`;
  const f = api.body.querySelector('.sheepf');
  api.onTick((dt) => {
    t -= dt;
    if (t <= 0 && shown < total) {
      shown++;
      const e = h('div', 'shp', Math.random() < 0.12 && shown > 2 ? '🐐' : '🐑');
      if (e.textContent === '🐐') shown--; // goats don't count
      f.appendChild(e);
      setTimeout(() => e.remove(), 1700);
      t = rnd(0.55, 0.95);
    }
    if (shown >= total && t <= -1.6 && !f.dataset.asked) {
      f.dataset.asked = '1';
      const opts = shuffleR([total, total + 1, total - 1, total + 2]);
      api.body.insertAdjacentHTML('beforeend', `<div class="pad-grid" style="grid-template-columns:repeat(4,1fr)">${opts.map((v) => `<button data-v="${v}" style="min-height:58px;font-size:22px">${v}</button>`).join('')}</div>`);
      api.body.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => { const ok = +b.dataset.v === total; api.end({ score: ok ? 1 : 0.4, emoji: ok ? '😴' : '🥱', title: ok ? T('Сладко уснули', 'Солодко заснули', 'Fell asleep sweetly') : T('Сон беспокойный', 'Сон неспокійний', 'Restless sleep'), text: T(`Овец было ${total}.`, `Овець було ${total}.`, `There were ${total} sheep.`) }); }));
    }
  });
}

// ---------------------------------------------------------------- PANCAKE: flip when golden
function pancake(api, { n = 4 }) {
  let i = 0, sum = 0, cook = 0;
  api.body.innerHTML = hint(T('Переворачивайте, когда золотистый. Сырой или горелый — минус.', 'Перевертайте, коли золотистий. Сирий чи горілий — мінус.', 'Flip when golden. Raw or burnt costs you.'), `<span class="pc2">1</span>/${n}`) + `<div class="mstage panf"><div class="pan"><div class="cake"></div></div><div class="fbar"><i></i></div></div><button class="btn block tap" style="min-height:64px;font-size:22px">🍳 ${T('Перевернуть', 'Перевернути', 'Flip')}</button>`;
  const cake = api.body.querySelector('.cake'), bar = api.body.querySelector('.fbar i');
  const speed = () => rnd(0.28, 0.48);
  let sp = speed();
  api.onTick((dt) => {
    cook += dt * sp;
    const c = clamp(cook, 0, 1.3);
    const col = c < 0.6 ? `hsl(45 70% ${88 - c * 30}%)` : c < 0.9 ? `hsl(35 75% ${70 - (c - 0.6) * 60}%)` : `hsl(25 50% ${52 - (c - 0.9) * 90}%)`;
    cake.style.background = col; bar.style.width = clamp(c / 1.3 * 100, 0, 100) + '%';
    bar.style.background = c > 0.62 && c < 0.88 ? 'var(--acc)' : c >= 0.88 ? 'var(--red)' : 'var(--yel)';
    if (cook > 1.35) flip();
  });
  function flip() {
    if (api.ended) return;
    const q = cook > 0.62 && cook < 0.88 ? 1 : cook > 0.5 && cook < 1 ? 0.6 : 0.15;
    sum += q; api.sfx(q === 1 ? 'ok' : 'err'); api.flash(q === 1);
    cake.classList.remove('flip'); void cake.offsetWidth; cake.classList.add('flip');
    cook = 0; sp = speed();
    if (++i >= n) api.end({ score: sum / n, emoji: '🥞' });
    else api.body.querySelector('.pc2').textContent = i + 1;
  }
  api.body.querySelector('.tap').addEventListener('click', flip);
}

// ---------------------------------------------------------------- SPOT: find the odd detail (fake vs original)
function spot(api, { rounds = 4 }) {
  const SETS = [['🔩', '🔧'], ['⭐', '✩'], ['🟦', '🟪'], ['🔵', '🟣'], ['🌕', '🌔'], ['🍏', '🍎'], ['♦️', '♥️'], ['🔶', '🔸']];
  let r = 0, ok = 0;
  api.setTime(28);
  const show = () => {
    const [a, b] = pickR(SETS);
    const n = 20, odd = rint(0, n - 1);
    api.body.innerHTML = hint(T('Найдите деталь, которая отличается от эталона.', 'Знайдіть деталь, яка відрізняється від еталону.', 'Find the one detail that differs.'), `${r + 1}/${rounds}`) + `<div class="mstage spotf">${Array.from({ length: n }, (_, i) => `<button data-i="${i}">${i === odd ? b : a}</button>`).join('')}</div>`;
    api.body.querySelectorAll('[data-i]').forEach((x) => x.addEventListener('click', () => { const good = +x.dataset.i === odd; if (good) ok++; api.sfx(good ? 'ok' : 'err'); api.flash(good); if (++r >= rounds) api.end({ score: ok / rounds }); else show(); }));
  };
  show();
}

// ---------------------------------------------------------------- COMPOSE: build a sentence from words (ad text, CV)
const TEXTS = [
  ['Продаю', 'в', 'отличном', 'состоянии,', 'торг', 'уместен'], ['Полный', 'комплект,', 'чек', 'и', 'коробка', 'есть'],
  ['Работал', 'курьером', 'и', 'кассиром', 'два', 'года'], ['Самовывоз', 'у', 'метро,', 'доставка', 'по', 'городу'],
  ['Без', 'ремонта,', 'батарея', 'держит', 'весь', 'день'],
];
const TEXTS_UK = [['Продаю', 'у', 'відмінному', 'стані,', 'торг', 'доречний'], ['Повний', 'комплект,', 'чек', 'і', 'коробка', 'є'], ['Самовивіз', 'біля', 'метро,', 'доставка', 'містом'], ['Без', 'ремонту,', 'батарея', 'тримає', 'весь', 'день']];
const TEXTS_EN = [['Selling', 'in', 'great', 'condition,', 'open', 'to', 'offers'], ['Full', 'set,', 'receipt', 'and', 'box', 'included'], ['Pickup', 'near', 'the', 'metro,', 'city', 'delivery'], ['Never', 'repaired,', 'battery', 'lasts', 'all', 'day']];
function compose(api, { rounds = 2 }) {
  let r = 0, mistakes = 0;
  api.setTime(35);
  const show = () => {
    const words = pickR(T(TEXTS, TEXTS_UK, TEXTS_EN));
    let k = 0;
    api.body.innerHTML = hint(T('Соберите текст объявления: нажимайте слова по порядку.', 'Зберіть текст оголошення: натискайте слова по порядку.', 'Build the ad text: tap the words in order.'), `${r + 1}/${rounds}`) + `<div class="card composed" style="min-height:70px;font-size:18px"></div><div class="mstage wordsf">${shuffleR(words.map((w, i) => [w, i])).map(([w, i]) => `<button data-i="${i}">${esc(w)}</button>`).join('')}</div>`;
    const out = api.body.querySelector('.composed');
    api.body.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
      if (+b.dataset.i === k) { k++; out.textContent += (k > 1 ? ' ' : '') + b.textContent; b.disabled = true; b.style.opacity = '.3'; api.sfx('tick'); if (k >= words.length) { api.flash(true); if (++r >= rounds) api.end({ score: clamp(1 - mistakes * 0.12, 0.2, 1), text: T(`Ошибок: ${mistakes}`, `Помилок: ${mistakes}`, `Mistakes: ${mistakes}`) }); else setTimeout(show, 300); } }
      else { mistakes++; api.sfx('err'); api.shake(b); }
    }));
  };
  show();
}

export const MORE_GAMES = { photo, change, swipe, catch: catchGame, whack, memory, simon, lockpick, scale, sheep, pancake, spot, compose };
