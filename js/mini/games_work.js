// Job / life minigames: courier, sorting, cashier, rhythm, barista, code review, appraisal, guard, taxi,
// flyers, tap race, dumpster dig, interview, casino crash.
import { T, L } from '../core/i18n.js';
import { esc, clamp, shuffleR, rint, pickR, chance, rnd } from '../core/util.js';
import { h } from './engine.js';
import { G } from '../core/state.js';
import { RNG } from '../core/rng.js';
import { makeItem, itemValue, itemTitle, itemSub } from '../game/items.js';
import { itemSVG } from '../ui/art.js';
import { fmt, rate, curCode, symOf } from '../core/money.js';

// ---------------------------------------------------------------- COURIER: deliver orders by deadline
function courier(api, { n = 5, time = 20 }) {
  const pins = Array.from({ length: n }, (_, i) => ({ x: rint(10, 90), y: rint(10, 88), t: 0 }));
  const order = shuffleR(pins.map((_, i) => i));
  order.forEach((p, k) => (pins[p].t = k));
  let next = 0;
  api.setTime(time, () => api.end({ score: next / n }));
  api.body.innerHTML = `<div class="mhint">${T('Доставьте заказы по времени: от самого раннего к позднему', 'Доставте замовлення за часом: від найранішого', 'Deliver orders by deadline: earliest first')}</div><div class="mstage" style="border-radius:18px;overflow:hidden;background:#13202e"><svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 100 100" preserveAspectRatio="none">${Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${i * 12 + 4}" x2="100" y2="${i * 12 + 4}" stroke="#2a3a4e" stroke-width="2"/><line x1="${i * 12 + 4}" y1="0" x2="${i * 12 + 4}" y2="100" stroke="#2a3a4e" stroke-width="2"/>`).join('')}</svg></div>`;
  const st = api.body.querySelector('.mstage');
  pins.forEach((p, i) => {
    const b = h('button', '', `📦<div style="font-size:11px;font-weight:800">${12 + Math.floor((p.t * 15 + 10) / 60)}:${String((p.t * 15 + 10) % 60).padStart(2, '0')}</div>`);
    b.style.cssText = `position:absolute;left:${p.x}%;top:${p.y}%;transform:translate(-50%,-50%);padding:6px 8px;border-radius:12px;background:#ff8a3d;color:#111;font-size:18px;line-height:1`;
    b.addEventListener('pointerdown', () => {
      if (api.ended || b.disabled) return;
      if (p.t === next) { next++; b.disabled = true; b.style.background = '#2ef2a0'; api.sfx('ok'); if (next === n) api.end({ score: clamp(0.6 + api.time / time, 0, 1) }); }
      else { api.addTime(-3); api.sfx('err'); api.shake(b); }
    });
    st.appendChild(b);
  });
}

// ---------------------------------------------------------------- SORT: parcels into zones
function sort(api, { n = 16, time = 26 }) {
  const zones = [{ c: '#4da3ff', n: 'A' }, { c: '#ff8a3d', n: 'B' }, { c: '#2ef2a0', n: 'C' }];
  let i = 0, ok = 0, cur;
  api.setTime(time, () => api.end({ score: ok / n }));
  api.body.innerHTML = `<div class="mhint">${T('Отправьте посылку в зону её цвета', 'Відправте посилку в зону її кольору', 'Send each parcel to its colour zone')}<small class="cnt"></small></div><div class="mstage" style="display:flex;align-items:center;justify-content:center"><div class="parcel" style="width:150px;height:120px;border-radius:14px;display:grid;place-items:center;font-size:44px;font-weight:900;color:#111;transition:transform .12s"></div></div><div class="pad-grid" style="grid-template-columns:repeat(3,1fr)">${zones.map((z, k) => `<button data-z="${k}" style="background:${z.c};color:#111;min-height:84px;font-size:26px">${z.n}</button>`).join('')}</div>`;
  const pEl = api.body.querySelector('.parcel');
  const nextP = () => { cur = rint(0, 2); const lbl = chance(0.3) ? zones[rint(0, 2)].n : zones[cur].n; pEl.style.background = zones[cur].c; pEl.textContent = '📦'; pEl.style.transform = 'scale(1)'; api.body.querySelector('.cnt').textContent = `${i + 1}/${n}`; };
  api.body.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('pointerdown', () => {
    if (api.ended) return;
    if (+b.dataset.z === cur) { ok++; api.sfx('hit'); } else { api.sfx('err'); api.flash(false); }
    pEl.style.transform = 'scale(.6)';
    i++;
    if (i >= n) api.end({ score: ok / n }); else setTimeout(nextP, 90);
  }));
  nextP();
}

// ---------------------------------------------------------------- CASHIER: give exact change
function cashier(api, { n = 4, time = 35 }) {
  const DEN = [1, 2, 5, 10, 20, 50, 100];
  let k = 0, good = 0, change = 0, given = 0;
  api.setTime(time, () => api.end({ score: good / n }));
  api.body.innerHTML = `<div class="mhint">${T('Выдайте сдачу точно', 'Видайте решту точно', 'Give the exact change')}<small class="cnt"></small></div><div class="card center"><div class="small m">${T('Сумма покупки / клиент дал', 'Сума покупки / клієнт дав', 'Total / paid')}</div><div class="bill" style="font-size:22px;font-weight:800;margin:6px 0"></div><div class="small m">${T('Сдача', 'Решта', 'Change due')}</div><div class="due" style="font-size:34px;font-weight:900;color:var(--acc)"></div><div class="small">${T('Выдано', 'Видано', 'Given')}: <b class="gv">0</b></div></div><div class="pad-grid" style="grid-template-columns:repeat(4,1fr)">${DEN.map((d) => `<button data-d="${d}">${d}</button>`).join('')}<button data-d="reset" style="background:#3a2030">↺</button></div><button class="btn block give mt">${T('Отдать', 'Віддати', 'Hand over')}</button>`;
  const nextC = () => { const total = rint(7, 180); const paid = [200, 100, 500, 50].find((p) => p > total) || 500; change = paid - total; given = 0; api.body.querySelector('.bill').textContent = `${total} / ${paid}`; api.body.querySelector('.due').textContent = change; api.body.querySelector('.gv').textContent = 0; api.body.querySelector('.cnt').textContent = `${k + 1}/${n}`; };
  api.body.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('pointerdown', () => { if (api.ended) return; if (b.dataset.d === 'reset') given = 0; else given += +b.dataset.d; api.sfx('tick'); api.body.querySelector('.gv').textContent = given; }));
  api.body.querySelector('.give').addEventListener('click', () => { if (api.ended) return; const ok = given === change; if (ok) good++; api.flash(ok); api.sfx(ok ? 'cash' : 'err'); k++; if (k >= n) api.end({ score: good / n }); else nextC(); });
  nextC();
}

// ---------------------------------------------------------------- RHYTHM: tap on the beat (loader)
function rhythm(api, { n = 14, label }) {
  let notes = [], spawned = 0, hits = 0, t = 0;
  api.body.innerHTML = `<div class="mhint">${label || T('Поднимайте груз в ритм: жмите, когда круг на линии', 'Піднімайте вантаж у ритм: тисніть, коли коло на лінії', 'Lift in rhythm: tap when the circle hits the line')}</div><div class="mstage" style="border-radius:18px;background:#101722;overflow:hidden"><div style="position:absolute;left:0;right:0;bottom:22%;height:6px;background:#2ef2a0;box-shadow:0 0 14px #2ef2a0"></div></div><button class="btn block" style="min-height:96px;font-size:22px">${T('ВЗЯЛИ!', 'ВЗЯЛИ!', 'LIFT!')}</button>`;
  const st = api.body.querySelector('.mstage');
  api.onTick((dt) => {
    t += dt;
    if (spawned < n && t > 0.7) { t = 0; const e = h('div'); e.style.cssText = 'position:absolute;left:50%;width:56px;height:56px;margin-left:-28px;border-radius:50%;background:#ff8a3d;top:-60px;box-shadow:0 0 12px #ff8a3d'; st.appendChild(e); notes.push({ e, y: -0.08 }); spawned++; }
    for (const nt of notes) { nt.y += dt * 0.55; nt.e.style.top = `calc(${nt.y * 100}% - 28px)`; if (nt.y > 0.95 && !nt.dead) { nt.dead = true; nt.e.style.background = '#ff5468'; } }
    notes = notes.filter((nt) => { if (nt.y > 1.1) { nt.e.remove(); return false; } return true; });
    if (spawned >= n && !notes.length) api.end({ score: hits / n });
  });
  api.body.querySelector('.btn').addEventListener('pointerdown', () => {
    if (api.ended) return;
    const target = 0.78;
    const nt = notes.filter((x) => !x.dead).sort((a, b) => Math.abs(a.y - target) - Math.abs(b.y - target))[0];
    if (nt && Math.abs(nt.y - target) < 0.08) { hits++; nt.dead = true; nt.e.style.background = '#2ef2a0'; api.sfx('hit'); setTimeout(() => nt.e.remove(), 120); }
    else { api.sfx('err'); api.flash(false); }
  });
}

// ---------------------------------------------------------------- RECIPE: barista memory
const ING = [['☕', ['Эспрессо', 'Еспресо', 'Espresso']], ['🥛', ['Молоко', 'Молоко', 'Milk']], ['🧊', ['Лёд', 'Лід', 'Ice']], ['🍫', ['Шоколад', 'Шоколад', 'Chocolate']], ['🍯', ['Сироп', 'Сироп', 'Syrup']], ['🌿', ['Мята', 'Мʼята', 'Mint']], ['🍋', ['Лимон', 'Лимон', 'Lemon']], ['🥥', ['Кокос', 'Кокос', 'Coconut']]];
function recipe(api, { orders = 3 }) {
  let o = 0, good = 0, seq = [], pos = 0;
  api.setTime(45, () => api.end({ score: good / orders }));
  api.body.innerHTML = `<div class="mhint q"></div><div class="mstage" style="display:flex;align-items:center;justify-content:center"><div class="show" style="font-size:52px;letter-spacing:8px"></div></div><div class="pad-grid" style="grid-template-columns:repeat(4,1fr)">${ING.map((x, i) => `<button data-i="${i}" style="font-size:30px;min-height:70px">${x[0]}<div class="tiny m">${esc(L(x[1]))}</div></button>`).join('')}</div>`;
  const show = api.body.querySelector('.show'), q = api.body.querySelector('.q');
  const pad = api.body.querySelector('.pad-grid');
  function next() {
    seq = Array.from({ length: 3 + Math.min(2, o) }, () => rint(0, ING.length - 1)); pos = 0;
    q.innerHTML = `${T('Заказ', 'Замовлення', 'Order')} ${o + 1}/${orders}: ${T('запомните!', 'запамʼятайте!', 'memorize!')}`;
    show.textContent = seq.map((i) => ING[i][0]).join('');
    pad.style.pointerEvents = 'none'; pad.style.opacity = '.4';
    setTimeout(() => { show.textContent = '❓'.repeat(seq.length); q.textContent = T('Соберите напиток', 'Зберіть напій', 'Make the drink'); pad.style.pointerEvents = ''; pad.style.opacity = '1'; }, 1700 + seq.length * 250);
  }
  pad.querySelectorAll('button').forEach((b) => b.addEventListener('pointerdown', () => {
    if (api.ended) return;
    if (+b.dataset.i === seq[pos]) { pos++; api.sfx('tick'); show.textContent = seq.slice(0, pos).map((i) => ING[i][0]).join('') + '❓'.repeat(seq.length - pos); if (pos === seq.length) { good++; api.flash(true); api.sfx('ok'); o++; if (o >= orders) api.end({ score: good / orders }); else setTimeout(next, 400); } }
    else { api.flash(false); api.sfx('err'); o++; if (o >= orders) api.end({ score: good / orders }); else setTimeout(next, 400); }
  }));
  next();
}

// ---------------------------------------------------------------- CODE REVIEW: find the bug line
const SNIPPETS = [
  { d: ['Сумма корзины всегда 0', 'Сума кошика завжди 0', 'Cart total is always 0'], code: ['function total(cart) {', '  let sum = 0;', '  for (const it of cart) {', '    sum + it.price * it.qty;', '  }', '  return sum;', '}'], bug: 3 },
  { d: ['Скидка применяется дважды', 'Знижка застосовується двічі', 'Discount applied twice'], code: ['function price(p, d) {', '  let x = p - p * d;', '  if (d > 0) {', '    x = x - x * d;', '  }', '  return Math.round(x);', '}'], bug: 3 },
  { d: ['Последний товар не выводится', 'Останній товар не виводиться', 'Last item never shown'], code: ['function list(items) {', '  const out = [];', '  for (let i = 0; i < items.length - 1; i++) {', '    out.push(items[i].name);', '  }', '  return out;', '}'], bug: 2 },
  { d: ['Пустой ник проходит проверку', 'Порожній нік проходить перевірку', 'Empty nickname passes'], code: ['function validNick(n) {', '  if (n.length < 3) {', '    return true;', '  }', '  return /^[a-z0-9_]+$/i.test(n);', '}'], bug: 2 },
  { d: ['Сравнение цен всегда «равны»', 'Порівняння цін завжди «рівні»', 'Prices always compare equal'], code: ['function same(a, b) {', '  const x = a.toFixed(2);', '  const y = b.toFixed(2);', '  return x = y;', '}'], bug: 3 },
  { d: ['Таймер никогда не останавливается', 'Таймер ніколи не зупиняється', 'Timer never stops'], code: ['let t = 10;', 'const id = setInterval(() => {', '  t--;', '  if (t < 0) {', '    clearInterval(t);', '  }', '}, 1000);'], bug: 4 },
  { d: ['Средняя оценка неверна', 'Середня оцінка неправильна', 'Average rating is wrong'], code: ['function avg(xs) {', '  let s = 0;', '  for (const x of xs) s += x;', '  return s / xs.length + 1;', '}'], bug: 3 },
  { d: ['Сортировка по цене наоборот', 'Сортування за ціною навпаки', 'Price sort is reversed'], code: ['function cheapFirst(list) {', '  return list.slice().sort(', '    (a, b) => b.price - a.price', '  );', '}'], bug: 2 },
  { d: ['Пользователь видит чужой заказ', 'Користувач бачить чуже замовлення', 'User sees someone else’s order'], code: ['async function order(req) {', '  const id = req.params.id;', '  const o = await db.orders.find(id);', '  // TODO: check owner', '  return o;', '}'], bug: 3 },
  { d: ['Налог считается от суммы с налогом', 'Податок рахується від суми з податком', 'Tax computed on taxed amount'], code: ['function withTax(p, r) {', '  const tax = p * r;', '  const total = p + tax;', '  return total + total * r;', '}'], bug: 3 },
];
const hl = (line) => esc(line).replace(/\b(function|const|let|return|for|if|of|async|await)\b/g, '<span class="kw">$1</span>').replace(/(\/\/.*)$/, '<span class="cm">$1</span>').replace(/\b(\d+)\b/g, '<span class="nu">$1</span>');
function code(api, { rounds = 3 }) {
  const picks = shuffleR(SNIPPETS).slice(0, rounds);
  let r = 0, good = 0;
  api.setTime(50, () => api.end({ score: good / rounds }));
  api.body.innerHTML = `<div class="termbox mb"><span class="hl">&gt; bug report</span> <span class="rd"></span><br><span class="desc"></span></div><div class="codeview"></div><div class="mhint">${T('Нажмите на строку с ошибкой', 'Натисніть на рядок з помилкою', 'Tap the buggy line')}</div>`;
  function show() {
    const s = picks[r];
    api.body.querySelector('.rd').textContent = `#${1000 + r * 37 + rint(1, 30)} (${r + 1}/${rounds})`;
    api.body.querySelector('.desc').textContent = L(s.d);
    const cv = api.body.querySelector('.codeview');
    cv.innerHTML = s.code.map((l, i) => `<div class="ln" data-i="${i}"><i>${i + 1}</i>${hl(l)}</div>`).join('');
    cv.querySelectorAll('.ln').forEach((ln) => ln.addEventListener('pointerdown', () => {
      if (api.ended || cv.dataset.lock) return;
      cv.dataset.lock = 1;
      const ok = +ln.dataset.i === s.bug;
      ln.classList.add(ok ? 'good' : 'bad');
      if (!ok) cv.querySelector(`[data-i="${s.bug}"]`).classList.add('good');
      if (ok) good++;
      api.sfx(ok ? 'ok' : 'err');
      setTimeout(() => { r++; delete cv.dataset.lock; if (r >= rounds) api.end({ score: good / rounds }); else show(); }, 700);
    }));
  }
  show();
}

// ---------------------------------------------------------------- APPRAISE: guess the value
function appraise(api, { rounds = 3 }) {
  const rng = new RNG('appr' + Date.now());
  let r = 0, total = 0, it, val;
  api.setTime(45, () => api.end({ score: total / rounds }));
  api.body.innerHTML = `<div class="mhint">${T('Оцените вещь клиента', 'Оцініть річ клієнта', 'Appraise the customer’s item')}<small class="rd"></small></div><div class="card" style="padding:8px"><div class="ap-img" style="height:180px;border-radius:12px;overflow:hidden"></div><div class="bold ap-t mt"></div><div class="small m ap-s"></div></div><div class="center price-big ap-v"></div><input type="range" class="ap-r" min="0" max="100" value="50"><button class="btn block ap-ok">${T('Оценить', 'Оцінити', 'Appraise')}</button>`;
  const rangeEl = api.body.querySelector('.ap-r');
  let lo, hi;
  function show() {
    it = makeItem(rng, { city: G.s.player.city, maxVal: 3000 + G.s.level * 400, minVal: 20 });
    for (const d of it.defects) d.known = true;
    val = itemValue(it, G.s.player.city, 'known');
    lo = val * rnd(0.2, 0.5); hi = val * rnd(1.6, 2.6);
    api.body.querySelector('.ap-img').innerHTML = itemSVG(it, { tilt: true });
    api.body.querySelector('.ap-t').textContent = itemTitle(it);
    api.body.querySelector('.ap-s').textContent = itemSub(it);
    api.body.querySelector('.rd').textContent = `${r + 1}/${rounds}`;
    rangeEl.value = 50; upd();
  }
  const cur = () => lo + (hi - lo) * (+rangeEl.value / 100);
  const upd = () => (api.body.querySelector('.ap-v').textContent = fmt(cur()));
  rangeEl.addEventListener('input', upd);
  api.body.querySelector('.ap-ok').addEventListener('click', () => {
    if (api.ended) return;
    const err = Math.abs(cur() - val) / val;
    const sc = clamp(1 - err * 2.2, 0, 1);
    total += sc;
    api.sfx(sc > 0.6 ? 'ok' : 'err');
    api.flash(sc > 0.6);
    const t = h('div', 'toast ' + (sc > 0.6 ? 'g' : 'r'), `${T('Реальная цена', 'Реальна ціна', 'Real value')}: ${fmt(val)}`);
    t.style.cssText = 'position:absolute;left:50%;top:40%;transform:translateX(-50%);z-index:5'; api.body.appendChild(t); setTimeout(() => t.remove(), 1200);
    r++;
    if (r >= rounds) setTimeout(() => api.end({ score: total / rounds }), 900); else setTimeout(show, 900);
  });
  show();
}

// ---------------------------------------------------------------- GUARD: catch thieves on CCTV
function guard(api, { time = 22 }) {
  let caught = 0, missed = 0, wrong = 0, spawnT = 0;
  api.setTime(time, () => api.end({ score: clamp((caught - wrong * 0.7) / Math.max(1, caught + missed), 0, 1) }));
  api.body.innerHTML = `<div class="mhint">${T('Ловите воров 🦹 — не трогайте покупателей', 'Ловіть злодіїв 🦹 — не чіпайте покупців', 'Catch thieves 🦹 — leave shoppers alone')}</div><div class="pad-grid" style="grid-template-columns:repeat(3,1fr);flex:1">${Array.from({ length: 9 }, (_, i) => `<button data-c="${i}" style="aspect-ratio:1;font-size:40px;background:#0c1a12;border-color:#1f3a2a;position:relative"><span class="tiny m" style="position:absolute;left:6px;top:4px">CAM ${i + 1}</span></button>`).join('')}</div>`;
  const cells = [...api.body.querySelectorAll('[data-c]')];
  const state = cells.map(() => null);
  api.onTick((dt) => {
    spawnT += dt;
    for (let i = 0; i < 9; i++) if (state[i]) { state[i].t -= dt; if (state[i].t <= 0) { if (state[i].thief) missed++; state[i] = null; cells[i].lastChild?.remove?.(); cells[i].querySelector('.who')?.remove(); } }
    if (spawnT > 0.55) { spawnT = 0; const free = state.map((s, i) => (s ? -1 : i)).filter((i) => i >= 0); if (free.length) { const i = pickR(free); const thief = chance(0.4); state[i] = { thief, t: rnd(0.9, 1.5) }; const w = h('span', 'who', thief ? '🦹' : pickR(['🧑', '👩', '👨‍🦳', '🧒', '👱‍♀️'])); cells[i].appendChild(w); } }
  });
  cells.forEach((c, i) => c.addEventListener('pointerdown', () => { if (api.ended || !state[i]) return; if (state[i].thief) { caught++; api.sfx('hit'); api.flash(true); } else { wrong++; api.sfx('err'); api.flash(false); } state[i] = null; c.querySelector('.who')?.remove(); }));
}

// ---------------------------------------------------------------- TAXI: lane dodging
function taxi(api, { time = 25 }) {
  let lane = 1, obs = [], t = 0, crashes = 0, fares = 0;
  api.setTime(time, () => api.end({ score: clamp(0.4 + fares * 0.12 - crashes * 0.25, 0, 1), text: `${T('Пассажиров', 'Пасажирів', 'Fares')}: ${fares} · ${T('аварий', 'аварій', 'crashes')}: ${crashes}` }));
  api.body.innerHTML = `<div class="mhint">${T('Уворачивайтесь от машин, подбирайте пассажиров 🙋', 'Ухиляйтеся від авто, підбирайте пасажирів 🙋', 'Dodge cars, pick up passengers 🙋')}</div><div class="mstage road" style="border-radius:18px;overflow:hidden;background:#3a3f47"><div style="position:absolute;left:33%;top:0;bottom:0;border-left:4px dashed #ddd6"></div><div style="position:absolute;left:66%;top:0;bottom:0;border-left:4px dashed #ddd6"></div><div class="me" style="position:absolute;bottom:6%;width:22%;margin-left:-11%;font-size:46px;text-align:center;transition:left .12s">🚕</div></div><div class="btns"><button class="btn dark l" style="min-height:70px;font-size:26px">◀</button><button class="btn dark r" style="min-height:70px;font-size:26px">▶</button></div>`;
  const road = api.body.querySelector('.road'), me = api.body.querySelector('.me');
  const place = () => (me.style.left = (lane * 33.3 + 16.6) + '%');
  place();
  api.body.querySelector('.l').addEventListener('pointerdown', () => { lane = Math.max(0, lane - 1); place(); });
  api.body.querySelector('.r').addEventListener('pointerdown', () => { lane = Math.min(2, lane + 1); place(); });
  api.onTick((dt) => {
    t += dt;
    if (t > 0.75) { t = 0; const pas = chance(0.3); const e = h('div', '', pas ? '🙋' : pickR(['🚗', '🚙', '🚚', '🚌'])); const ln = rint(0, 2); e.style.cssText = `position:absolute;top:-12%;left:${ln * 33.3 + 16.6}%;margin-left:-11%;width:22%;text-align:center;font-size:42px;transform:rotate(180deg)`; if (pas) e.style.transform = 'none'; road.appendChild(e); obs.push({ e, y: -0.12, ln, pas }); }
    for (const o of obs) { o.y += dt * 0.6; o.e.style.top = o.y * 100 + '%'; if (!o.hit && o.y > 0.78 && o.y < 0.92 && o.ln === lane) { o.hit = true; if (o.pas) { fares++; api.sfx('cash'); } else { crashes++; api.sfx('err'); api.shake(road); } o.e.remove(); } }
    obs = obs.filter((o) => { if (o.y > 1.1 || o.hit) { o.e.remove(); return false; } return true; });
  });
}

// ---------------------------------------------------------------- FLYERS: hand out to interested people
function flyers(api, { time = 20 }) {
  let good = 0, bad = 0, t = 0, ppl = [];
  api.setTime(time, () => api.end({ score: clamp((good - bad * 0.8) / 8, 0, 1), text: `${T('Взяли листовку', 'Взяли листівку', 'Flyers taken')}: ${good}` }));
  api.body.innerHTML = `<div class="mhint">${T('Давайте листовки тем, кто улыбается 🙂. Хмурых 😠 не трогайте!', 'Давайте листівки тим, хто усміхається 🙂. Похмурих 😠 не чіпайте!', 'Give flyers to smiling people 🙂, skip grumpy ones 😠')}</div><div class="mstage street" style="border-radius:18px;background:linear-gradient(#2a3546,#1a2230);overflow:hidden"></div>`;
  const st = api.body.querySelector('.street');
  api.onTick((dt) => {
    t += dt;
    if (t > 0.5) { t = 0; const happy = chance(0.5); const e = h('button', '', happy ? pickR(['🙂', '😊', '😃']) : pickR(['😠', '😒', '🙄'])); const dir = chance(0.5) ? 1 : -1; const y = rint(8, 82); e.style.cssText = `position:absolute;top:${y}%;font-size:44px;background:none;border:0`; st.appendChild(e); const p = { e, x: dir > 0 ? -0.12 : 1.02, dir, happy, sp: rnd(0.18, 0.32) }; ppl.push(p); e.addEventListener('pointerdown', () => { if (p.done || api.ended) return; p.done = true; if (p.happy) { good++; e.textContent = '📄'; api.sfx('ok'); } else { bad++; e.textContent = '💢'; api.sfx('err'); } setTimeout(() => e.remove(), 250); }); }
    for (const p of ppl) { p.x += p.dir * p.sp * dt; p.e.style.left = p.x * 100 + '%'; }
    ppl = ppl.filter((p) => { if (p.x < -0.2 || p.x > 1.1) { p.e.remove(); return false; } return true; });
  });
}

// ---------------------------------------------------------------- TAP RACE: be faster than the rival
function tapRace(api, { rival = 'Вадим', speed = 5.5, label, goal = 30 }) {
  let me = 0, them = 0, started = false;
  api.body.innerHTML = `<div class="mhint">${label || T('Успейте раньше конкурента — жмите быстро!', 'Встигніть раніше за конкурента — тисніть швидко!', 'Beat the rival — tap fast!')}</div><div class="card"><div class="small">${T('Вы', 'Ви', 'You')}</div><div class="bar" style="height:14px"><i class="b1" style="width:0%"></i></div><div class="small mt">${esc(rival)}</div><div class="bar" style="height:14px"><i class="b2" style="width:0%;background:var(--red)"></i></div></div><button class="btn block tap" style="flex:1;min-height:200px;font-size:34px;border-radius:28px;margin-top:10px">3</button>`;
  const btn = api.body.querySelector('.tap');
  let cd = 3;
  const cdT = setInterval(() => { cd--; btn.textContent = cd > 0 ? cd : T('ЖМИ!', 'ТИСНИ!', 'TAP!'); if (cd <= 0) { clearInterval(cdT); started = true; } }, 600);
  api.onTick((dt) => {
    if (!started) return;
    them += dt * speed * rnd(0.7, 1.3);
    api.body.querySelector('.b2').style.width = Math.min(100, (them / goal) * 100) + '%';
    if (them >= goal) api.end({ score: clamp(me / goal * 0.6, 0, 0.59), won: false, title: T('Конкурент успел первым', 'Конкурент встиг першим', 'The rival was faster'), emoji: '🐢' });
  });
  btn.addEventListener('pointerdown', () => { if (!started || api.ended) return; me++; api.sfx('tick'); api.body.querySelector('.b1').style.width = Math.min(100, (me / goal) * 100) + '%'; btn.style.transform = `scale(${0.96 + Math.random() * 0.03})`; if (me >= goal) api.end({ score: 1, won: true, emoji: '🏃', title: T('Вы первые!', 'Ви перші!', 'You made it first!') }); });
}

// ---------------------------------------------------------------- DIG: search a dumpster
function dig(api, { taps = 6 }) {
  const cells = Array.from({ length: 16 }, () => { const r = Math.random(); return r < 0.18 ? 'gem' : r < 0.32 ? 'rat' : r < 0.5 ? 'ok' : 'junk'; });
  if (!cells.includes('gem')) cells[rint(0, 15)] = 'gem';
  let left = taps, score = 0;
  api.body.innerHTML = `<div class="mhint">${T('Ищите ценное среди хлама. Крысы отнимают попытку!', 'Шукайте цінне серед мотлоху. Щури забирають спробу!', 'Dig for valuables. Rats cost a try!')}<small class="lf"></small></div><div class="pad-grid" style="grid-template-columns:repeat(4,1fr);flex:1">${cells.map((_, i) => `<button data-i="${i}" style="aspect-ratio:1;font-size:32px;background:#3a3020;border-color:#5a4a30">🗑️</button>`).join('')}</div>`;
  const lf = api.body.querySelector('.lf');
  const upd = () => (lf.textContent = `${T('Попыток', 'Спроб', 'Tries')}: ${left}`);
  upd();
  api.body.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('pointerdown', () => {
    if (api.ended || b.disabled) return;
    b.disabled = true;
    const c = cells[+b.dataset.i];
    b.textContent = { gem: '💎', rat: '🐀', ok: '📦', junk: pickR(['🥫', '🧦', '📰', '🍌']) }[c];
    if (c === 'gem') { score += 0.45; api.sfx('cash'); } else if (c === 'ok') { score += 0.15; api.sfx('ok'); } else if (c === 'rat') { left--; api.sfx('err'); api.shake(b); } else api.sfx('tick');
    left--; upd();
    if (left <= 0) setTimeout(() => api.end({ score: clamp(score, 0, 1), emoji: '🗑️', title: T('Поиски окончены', 'Пошуки закінчено', 'Search over') }), 500);
  }));
}

// ---------------------------------------------------------------- INTERVIEW: answer HR questions
const QS = [
  { q: ['Почему вы хотите у нас работать?', 'Чому ви хочете у нас працювати?', 'Why do you want to work here?'], a: [[['Хочу расти вместе с компанией', 'Хочу рости разом з компанією', 'I want to grow with the company'], 1], [['Нужны деньги', 'Потрібні гроші', 'I need money'], 0.4], [['Мама заставила', 'Мама змусила', 'My mom made me'], 0]] },
  { q: ['Ваша главная слабость?', 'Ваша головна слабкість?', 'Your biggest weakness?'], a: [[['Иногда беру слишком много задач, учусь делегировать', 'Іноді беру забагато задач, вчуся делегувати', 'I take on too much, learning to delegate'], 1], [['Опаздываю', 'Запізнююся', 'I’m often late'], 0.1], [['У меня нет слабостей', 'У мене немає слабкостей', 'I have none'], 0.3]] },
  { q: ['Клиент кричит на вас. Ваши действия?', 'Клієнт кричить на вас. Ваші дії?', 'A customer yells at you. What do you do?'], a: [[['Спокойно выслушаю и предложу решение', 'Спокійно вислухаю й запропоную рішення', 'Listen calmly and offer a solution'], 1], [['Позову начальника', 'Покличу начальника', 'Call the manager'], 0.5], [['Накричу в ответ', 'Накричу у відповідь', 'Yell back'], 0]] },
  { q: ['Где вы видите себя через 5 лет?', 'Де ви бачите себе через 5 років?', 'Where do you see yourself in 5 years?'], a: [[['Руководителем направления', 'Керівником напряму', 'Leading a team here'], 1], [['Не знаю', 'Не знаю', 'No idea'], 0.2], [['На вашем месте 😏', 'На вашому місці 😏', 'In your chair 😏'], 0.5]] },
  { q: ['Готовы к переработкам?', 'Готові до переробок?', 'Ready for overtime?'], a: [[['Если нужно для дела — да', 'Якщо потрібно — так', 'If the job needs it — yes'], 1], [['Только за доплату', 'Тільки за доплату', 'Only if paid extra'], 0.7], [['Никогда', 'Ніколи', 'Never'], 0.1]] },
  { q: ['Расскажите о своём опыте', 'Розкажіть про свій досвід', 'Tell us about your experience'], a: [[['Перепродавал вещи, умею торговаться', 'Перепродавав речі, вмію торгуватися', 'I flip items and can negotiate'], 1], [['Опыта нет, но быстро учусь', 'Досвіду немає, але швидко вчуся', 'No experience but I learn fast'], 0.7], [['Работал везде понемногу', 'Працював усюди потроху', 'A bit of everything'], 0.4]] },
  { q: ['Какую зарплату ожидаете?', 'Яку зарплату очікуєте?', 'Expected salary?'], a: [[['По рынку, обсудим по результатам', 'За ринком, обговоримо за результатами', 'Market rate, open to discuss'], 1], [['Миллион', 'Мільйон', 'A million'], 0], [['Сколько дадите', 'Скільки дасте', 'Whatever you give'], 0.5]] },
];
function interview(api, { n = 3 }) {
  const qs = shuffleR(QS).slice(0, n);
  let i = 0, sc = 0, qt = 0;
  api.body.innerHTML = `<div class="card"><div class="row"><div class="avatar">HR</div><div class="grow"><div class="bold">${T('Собеседование', 'Співбесіда', 'Interview')}</div><div class="small m qn"></div></div></div><div class="q mt" style="font-size:18px;font-weight:700"></div><div class="bar mt" style="height:6px"><i class="qbar" style="width:100%;background:var(--yel)"></i></div></div><div class="btns col ans"></div>`;
  function show() {
    const q = qs[i]; qt = 9;
    api.body.querySelector('.qn').textContent = `${i + 1}/${n}`;
    api.body.querySelector('.q').textContent = L(q.q);
    api.body.querySelector('.ans').innerHTML = shuffleR(q.a).map(([t, v]) => `<button class="opt" data-v="${v}">${esc(L(t))}</button>`).join('');
    api.body.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => answer(+b.dataset.v)));
  }
  function answer(v) { if (api.ended) return; sc += v; api.sfx(v >= 0.7 ? 'ok' : 'err'); i++; if (i >= n) api.end({ score: sc / n }); else show(); }
  api.onTick((dt) => { qt -= dt; api.body.querySelector('.qbar').style.width = Math.max(0, (qt / 9) * 100) + '%'; if (qt <= 0) answer(0); });
  show();
}

// ---------------------------------------------------------------- CRASH (casino)
function crash(api, { bet }) {
  const crashAt = Math.max(1.0, Math.min(50, 0.97 / (1 - Math.random())));
  let m = 1, out = false, t = 0;
  api.body.innerHTML = `<div class="mstage" style="display:flex;flex-direction:column;align-items:center;justify-content:center"><div class="mult" style="font-size:64px;font-weight:900;font-variant-numeric:tabular-nums">1.00×</div><div class="small m">${T('Ставка', 'Ставка', 'Bet')}: ${fmt(bet)}</div><div class="win" style="font-size:22px;font-weight:800;color:var(--acc);margin-top:6px"></div><div style="font-size:60px;margin-top:20px" class="rk">🚀</div></div><button class="btn green block co" style="min-height:80px;font-size:22px">${T('ЗАБРАТЬ', 'ЗАБРАТИ', 'CASH OUT')}</button>`;
  const mEl = api.body.querySelector('.mult'), wEl = api.body.querySelector('.win');
  api.onTick((dt) => {
    if (out) return;
    t += dt; m = Math.pow(1.065, t * 6);
    mEl.textContent = m.toFixed(2) + '×';
    wEl.textContent = fmt(bet * m);
    api.body.querySelector('.rk').style.transform = `translateY(${-Math.min(60, t * 8)}px) rotate(${Math.sin(t * 8) * 6}deg)`;
    if (m >= crashAt) { out = true; mEl.style.color = 'var(--red)'; api.body.querySelector('.rk').textContent = '💥'; api.sfx('lose'); setTimeout(() => api.end({ score: 0, mult: 0, emoji: '💥', title: T(`Краш на ${crashAt.toFixed(2)}×`, `Краш на ${crashAt.toFixed(2)}×`, `Crashed at ${crashAt.toFixed(2)}×`), text: `−${fmt(bet)}` }), 700); }
  });
  api.body.querySelector('.co').addEventListener('pointerdown', () => { if (out || api.ended) return; out = true; api.sfx('cash'); api.end({ score: 1, mult: m, emoji: '💰', title: `${m.toFixed(2)}×`, text: `+${fmt(bet * m - bet)}` }); });
}

export const WORK_GAMES = { courier, sort, cashier, rhythm, recipe, code, appraise, guard, taxi, flyers, tapRace, dig, interview, crash };
