// Smart minigames for everyday actions: picking up a freebie (reply to the giver, fastest route,
// the right entrance and floor, the intercom, the right bag — while another taker races you), a
// pickpocket chase (remember the thief, follow clues at junctions, grab him), blocking a stolen card
// in the bank app while the thief is spending, haggling at the flea market with real arguments,
// a code lock with Mastermind clues, and returning a found wallet to the right person.
import { T } from '../core/i18n.js';
import { esc, clamp } from '../core/util.js';
import { fmt } from '../core/money.js';
import { RNG } from '../core/rng.js';
import { G } from '../core/state.js';
import { npcName } from '../game/npc.js';
import { DEFECTS, CAT_DEFECTS, MODEL } from '../data/catalog.js';
import { defectName, itemTitle, itemValue } from '../game/items.js';
import { itemBitmap } from '../ui/bitmap.js';
import { procedure, pick, shuf, ri, gate, keypad } from './proc.js';

const city = () => G.s?.player?.city;
const lc1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const rng = () => new RNG('life|' + Math.random());
const person = () => { try { return npcName(rng(), city()); } catch { return { name: 'Alex', fem: false }; } };

// ---------------------------------------------------------------- FREEBIE: reply to the giver
const COND = () => [
  { say: T('Отдам сегодня до 20:00, потом вынесу на мусорку.', 'Віддам сьогодні до 20:00, потім винесу на смітник.', 'Giving it away today until 8 pm, then it goes in the bin.'),
    good: T('Здравствуйте! Заберу сегодня в 19:00, приеду сам.', 'Добрий день! Заберу сьогодні о 19:00, приїду сам.', 'Hi! I’ll pick it up today at 7 pm myself.'),
    bad: [T('А можно в субботу?', 'А можна в суботу?', 'Could I come on Saturday?'), T('Забронируйте за мной до следующей недели', 'Забронюйте за мною до наступного тижня', 'Please hold it for me until next week'), T('Могу завтра утром', 'Можу завтра вранці', 'I can come tomorrow morning')] },
  { say: T('Тяжёлое и большое — нужна машина и кто‑то помочь нести.', 'Важке й велике — потрібна машина і хтось допомогти нести.', 'Big and heavy — you’ll need a car and a helper.'),
    good: T('Добрый день! Приеду на машине с другом, могу через час.', 'Добрий день! Приїду на машині з другом, можу за годину.', 'Hi! Coming by car with a friend, can be there in an hour.'),
    bad: [T('Приеду на метро, поможете донести до станции?', 'Приїду метро, допоможете донести до станції?', 'Coming by metro, can you help carry it to the station?'), T('Можете отправить почтой?', 'Можете відправити поштою?', 'Could you send it by post?'), T('Я на самокате, влезет в рюкзак?', 'Я на самокаті, влізе в рюкзак?', 'I’m on a scooter, will it fit in a backpack?')] },
  { say: T('Забирать только утром до 10 — днём и вечером я на работе.', 'Забирати лише вранці до 10 — вдень і ввечері я на роботі.', 'Pick‑up only in the morning before 10 — I’m at work after.'),
    good: T('Здравствуйте! Заберу завтра в 8:30, удобно?', 'Добрий день! Заберу завтра о 8:30, зручно?', 'Hi! I can come tomorrow at 8:30, OK?'),
    bad: [T('Могу сегодня в 21:00', 'Можу сьогодні о 21:00', 'I can come today at 9 pm'), T('В обед подойдёт?', 'В обід підійде?', 'Would lunchtime work?'), T('Давайте вечером после 18', 'Давайте ввечері після 18', 'Let’s do evening after 6')] },
  { say: T('Отдаю только всё вместе, по одной вещи не раздаю.', 'Віддаю лише все разом, по одній речі не роздаю.', 'All or nothing — I’m not splitting it up.'),
    good: T('Добрый вечер! Заберу всё целиком, сегодня.', 'Добрий вечір! Заберу все цілком, сьогодні.', 'Good evening! I’ll take the whole lot today.'),
    bad: [T('Мне только одну вещь, остальное не надо', 'Мені лише одну річ, решта не треба', 'I only need one item, not the rest'), T('Можно я возьму половину?', 'Можна я візьму половину?', 'Can I take half?'), T('Отложите мне самое ценное', 'Відкладіть мені найцінніше', 'Put the best one aside for me')] },
  { say: T('Отвечаю только на вежливые сообщения. «+» и «моё» игнорирую.', 'Відповідаю лише на ввічливі повідомлення. «+» і «моє» ігнорую.', 'I only answer polite messages. “+” and “mine” get ignored.'),
    good: T('Здравствуйте! Если ещё актуально — с радостью заберу сегодня.', 'Добрий день! Якщо ще актуально — з радістю заберу сьогодні.', 'Hello! If it’s still available I’d gladly pick it up today.'),
    bad: ['+', T('Моё!', 'Моє!', 'Mine!'), T('Скинь адрес', 'Скинь адресу', 'Send the address')] },
];
const GENERIC_BAD = () => [T('Сколько хотите?', 'Скільки хочете?', 'How much do you want?'), '+', T('А доставка есть?', 'А доставка є?', 'Do you deliver?'), T('Бронь!!!', 'Бронь!!!', 'Dibs!!!')];
function replyStep() {
  const c = pick(COND());
  return {
    name: T('написать дарителю', 'написати дарувальнику', 'message the giver'),
    desc: T('Даритель отдаст тому, кто первым напишет подходящее сообщение. Прочитай условие.', 'Дарувальник віддасть тому, хто першим напише доречне повідомлення. Прочитай умову.', 'The giver picks the first message that fits. Read the condition.'),
    run: (P) => {
      const g = gate();
      let bad = 0;
      const opts = shuf([{ t: c.good, ok: true }, ...shuf([...c.bad, ...GENERIC_BAD()]).filter((x, i, a) => a.indexOf(x) === i).slice(0, 3).map((t) => ({ t }))]);
      P.stage(`<div class="chat"><div class="bub in">${esc(c.say)}</div></div>`, 'pchat');
      const ctl = P.ctl(opts.map((o, i) => `<button class="frow lft" data-i="${i}">💬 ${esc(o.t)}</button>`).join(''));
      P.on(ctl, '.frow', (b) => {
        const o = opts[+b.dataset.i];
        P.stage(`<div class="chat"><div class="bub in">${esc(c.say)}</div><div class="bub out">${esc(o.t)}</div>${o.ok ? `<div class="bub in">${T('Хорошо, жду 👍 Адрес в личке.', 'Добре, чекаю 👍 Адреса в особистих.', 'OK, see you 👍 Address in DM.')}</div>` : `<div class="bub in sys">${T('прочитано · без ответа', 'прочитано · без відповіді', 'read · no reply')}</div>`}</div>`, 'pchat');
        if (o.ok) { P.good(T('Даритель ответил вам', 'Дарувальник відповів вам', 'The giver replied')); return g.done(true); }
        b.disabled = true; bad++;
        P.mistake(T('Даритель проигнорировал', 'Дарувальник проігнорував', 'The giver ignored it'), 1.5);
        if (bad >= 2) { P.log(T('Даритель выбрал другого', 'Дарувальник обрав іншого', 'The giver chose someone else'), 'err'); g.done(false); }
      });
      if (!P.data.rival) P.timer(20, () => g.done(false));
      return g;
    },
  };
}

// ---------------------------------------------------------------- FREEBIE / COURIER: fastest route
function routeOpts() {
  const tr = ri(0, 2);
  const A = [
    { k: 'metro', seg: [['🚶', ri(3, 11)], ['🚇', ri(8, 20)], ...(tr ? [['🔁', tr === 1 ? 4 : 7]] : []), ['🚶', ri(2, 8)]] },
    { k: 'bus', seg: [['⏱', ri(2, 12)], ['🚌', ri(10, 24)], ['🚶', ri(1, 6)]] },
    { k: 'taxi', seg: (() => { const a = ri(3, 9), r = ri(8, 16), f = pick([1, 1.5, 2]); return [['🚕', a], ['🛣', Math.round(r * f), f > 1 ? `×${f} ${T('пробки', 'затори', 'traffic')}` : '']]; })() },
    { k: 'scoot', seg: [['🛴', ri(14, 28)], ['🔋', pick([0, 0, 6])]] },
  ];
  for (;;) {
    const o = shuf(A).slice(0, 3).map((x) => ({ ...x, tot: x.seg.reduce((s, q) => s + q[1], 0) }));
    const tots = o.map((x) => x.tot).sort((a, b) => a - b);
    if (tots[1] - tots[0] >= 2) return o;
    A.forEach((x) => x.seg.forEach((q) => (q[1] = Math.max(1, q[1] + ri(-3, 3)))));
  }
}
const ROUTE_NAME = { metro: () => T('Метро', 'Метро', 'Metro'), bus: () => T('Автобус', 'Автобус', 'Bus'), taxi: () => T('Такси', 'Таксі', 'Taxi'), scoot: () => T('Самокат', 'Самокат', 'Scooter') };
const SEG_TIP = { '🔁': () => T('пересадка', 'пересадка', 'transfer'), '⏱': () => T('ждать', 'чекати', 'wait'), '🔋': () => T('найти заряженный', 'знайти заряджений', 'find a charged one'), '🛣': () => T('поездка', 'поїздка', 'ride'), '🚕': () => T('подача', 'подача', 'pickup') };
function routeStep() {
  return {
    name: T('маршрут', 'маршрут', 'route'),
    desc: T('Сложи минуты и выбери самый быстрый путь. Учитывай ожидание, пересадки и пробки.', 'Склади хвилини й обери найшвидший шлях. Враховуй очікування, пересадки та затори.', 'Add up the minutes and pick the fastest way. Count waits, transfers and traffic.'),
    run: (P) => {
      const g = gate();
      const o = routeOpts();
      const best = Math.min(...o.map((x) => x.tot));
      P.stage(`<div class="maptile"><span>📍</span><i></i><span>🎁</span></div>`, 'proute');
      const c = P.ctl(o.map((x, i) => `<button class="frow lft route" data-i="${i}"><b>${ROUTE_NAME[x.k]()}</b><span class="segs">${x.seg.filter((q) => q[1] > 0).map((q) => `<span class="seg">${q[0]} ${q[1]} ${T('мин', 'хв', 'min')}${q[2] ? ` <em>${q[2]}</em>` : SEG_TIP[q[0]] ? ` <em>${SEG_TIP[q[0]]()}</em>` : ''}</span>`).join('')}</span></button>`).join(''));
      let picked = false;
      P.on(c, '.route', (b) => {
        if (picked) return; picked = true;
        const x = o[+b.dataset.i];
        if (x.tot === best) { b.classList.add('ok'); P.good(T(`${ROUTE_NAME[x.k]()}: ${x.tot} мин — быстрее всех`, `${ROUTE_NAME[x.k]()}: ${x.tot} хв — найшвидше`, `${ROUTE_NAME[x.k]()}: ${x.tot} min — fastest`)); return g.done(true); }
        b.classList.add('bad');
        const lost = x.tot - best;
        P.mistake(T(`${ROUTE_NAME[x.k]()}: ${x.tot} мин — на ${lost} мин дольше`, `${ROUTE_NAME[x.k]()}: ${x.tot} хв — на ${lost} хв довше`, `${ROUTE_NAME[x.k]()}: ${x.tot} min — ${lost} min slower`), clamp(lost / 4, 0.8, 3));
        g.done(!!P.data.lenient);
      });
      if (!P.data.rival) P.timer(25, () => g.done(false));
      return g;
    },
  };
}

// ---------------------------------------------------------------- entrance and floor from the flat number
function entranceStep() {
  const E = ri(4, 6), F = ri(5, 12), A = ri(3, 5), shop = Math.random() < 0.4;
  const per = (shop ? F - 1 : F) * A;
  const N = ri(per + 1, per * E);
  const ent = Math.ceil(N / per), pos = N - (ent - 1) * per, floor = Math.ceil(pos / A) + (shop ? 1 : 0);
  return {
    name: T('подъезд и этаж', 'підʼїзд і поверх', 'entrance and floor'),
    desc: T(`Квартира <b>${N}</b>. Над первым подъездом табличка «кв. 1–${per}», на каждом этаже по ${A} квартиры.${shop ? ' <b>На первом этаже магазины</b> — квартиры начинаются со 2‑го.' : ''} Найди подъезд, потом этаж.`, `Квартира <b>${N}</b>. Над першим підʼїздом табличка «кв. 1–${per}», на кожному поверсі по ${A} квартири.${shop ? ' <b>На першому поверсі магазини</b> — квартири починаються з 2‑го.' : ''} Знайди підʼїзд, потім поверх.`, `Flat <b>${N}</b>. The first entrance says “flats 1–${per}”, ${A} flats per floor.${shop ? ' <b>Shops on the ground floor</b> — flats start on floor 2.' : ''} Find the entrance, then the floor.`),
    run: (P) => {
      const g = gate();
      let bad = 0, stage = 'ent';
      const fail = (t) => { bad++; P.mistake(t, 1.2); if (bad >= 3) g.done(false); };
      const drawEnt = () => {
        const st = P.stage(`<div class="bld" style="--e:${E}"><div class="roof"></div><div class="wins">${Array.from({ length: Math.min(F, 12) * E * 2 }, () => `<i class="${Math.random() < 0.35 ? 'lit' : ''}"></i>`).join('')}</div>${shop ? `<div class="shops">${Array.from({ length: E }, () => `<span>${pick(['🛒', '💊', '☕', '🥖', '✂️'])}</span>`).join('')}</div>` : ''}<div class="doors">${Array.from({ length: E }, (_, i) => `<button data-e="${i + 1}">${i === 0 ? `<small>1–${per}</small>` : '<small>&nbsp;</small>'}🚪<b>${i + 1}</b></button>`).join('')}</div></div>`, 'pbld');
        P.on(st, '[data-e]', (b) => {
          if (stage !== 'ent') return;
          const e = +b.dataset.e;
          if (e === ent) { b.classList.add('ok'); P.good(T(`Подъезд ${e}: кв. ${(e - 1) * per + 1}–${e * per}`, `Підʼїзд ${e}: кв. ${(e - 1) * per + 1}–${e * per}`, `Entrance ${e}: flats ${(e - 1) * per + 1}–${e * per}`)); stage = 'floor'; setTimeout(drawLift, 450); }
          else { b.classList.add('bad'); fail(T(`В ${e}-м подъезде квартиры ${(e - 1) * per + 1}–${e * per}`, `У ${e}-му підʼїзді квартири ${(e - 1) * per + 1}–${e * per}`, `Entrance ${e} has flats ${(e - 1) * per + 1}–${e * per}`)); }
        });
        P.ctl('');
      };
      const drawLift = () => {
        if (P.api.ended) return;
        const st = P.stage(`<div class="lift"><div class="lcd mono">${T('Лифт', 'Ліфт', 'Lift')} · ${T('кв.', 'кв.', 'flat')} ${N}</div><div class="lbtn">${Array.from({ length: F }, (_, i) => `<button data-f="${i + 1}">${i + 1}</button>`).join('')}</div></div>`, 'plift');
        P.on(st, '[data-f]', (b) => {
          const f = +b.dataset.f;
          if (f === floor) { b.classList.add('ok'); P.good(T(`${f} этаж, кв. ${N}`, `${f} поверх, кв. ${N}`, `Floor ${f}, flat ${N}`)); return g.done(true); }
          b.classList.add('bad');
          const fl = (f - (shop ? 1 : 0) - 1) * A + 1 + (ent - 1) * per;
          fail(f === 1 && shop ? T('На первом — магазин', 'На першому — магазин', 'Ground floor is shops') : T(`На ${f} этаже квартиры ${fl}–${fl + A - 1}`, `На ${f} поверсі квартири ${fl}–${fl + A - 1}`, `Floor ${f} has flats ${fl}–${fl + A - 1}`));
        });
      };
      drawEnt();
      if (!P.data.rival) P.timer(35, () => g.done(false));
      return g;
    },
  };
}

// ---------------------------------------------------------------- intercom code from the chat
function intercomStep() {
  const flat = ri(12, 140), code = String(ri(1000, 9999));
  const v = pick(['call', 'code', 'fix', 'k']);
  let msgs, want;
  if (v === 'call') { msgs = [T(`Домофон: наберите ${flat} и 🔔, я открою`, `Домофон: наберіть ${flat} і 🔔, я відчиню`, `Intercom: dial ${flat} then 🔔, I’ll buzz you in`)]; want = `${flat}🔔`; }
  else if (v === 'code') { msgs = [T(`Код подъезда ${code}#, квартира ${flat}`, `Код підʼїзду ${code}#, квартира ${flat}`, `Door code ${code}#, flat ${flat}`)]; want = `${code}#`; }
  else if (v === 'k') { msgs = [T(`Наберите К, потом ${code} — это код двери`, `Наберіть К, потім ${code} — це код дверей`, `Press K, then ${code} — that’s the door code`)]; want = `K${code}`; }
  else { const wrong = code.split('').reverse().join('') === code ? String(+code + 1) : code.split('').reverse().join(''); msgs = [T(`Код двери ${wrong}#`, `Код дверей ${wrong}#`, `Door code ${wrong}#`), T(`Ой, перепутала цифры: ${code}#, извините 🙈`, `Ой, переплутала цифри: ${code}#, вибачте 🙈`, `Oops, mixed up the digits: ${code}#, sorry 🙈`)]; want = `${code}#`; }
  return {
    name: T('домофон', 'домофон', 'intercom'),
    desc: T('Открой дверь подъезда, как написал даритель. Читай переписку до конца.', 'Відчини двері підʼїзду, як написав дарувальник. Читай листування до кінця.', 'Open the door the way the giver wrote. Read the whole chat.'),
    run: (P) => {
      const g = gate();
      let inp = '', bad = 0;
      const st = P.stage(`<div class="chat">${msgs.map((m) => `<div class="bub in">${esc(m)}</div>`).join('')}</div>`, 'pchat');
      const c = P.ctl(`<div class="icom"><div class="lcd mono">—</div><div class="pkeys ik">${['1', '2', '3', '4', '5', '6', '7', '8', '9', 'K', '0', '#', 'C', '🔔'].map((k) => `<button data-k="${k}" class="${k === '🔔' ? 'go' : ''}">${k}</button>`).join('')}</div></div>`);
      const lcd = c.querySelector('.lcd');
      P.on(c, '[data-k]', (b) => {
        const k = b.dataset.k;
        if (k === 'C') { inp = ''; lcd.textContent = '—'; return; }
        inp += k; lcd.textContent = inp; P.api.sfx('tick');
        if (k === '🔔' || k === '#' || (want.startsWith('K') && inp.length >= want.length)) {
          if (inp === want) { lcd.textContent = '🔓 OPEN'; P.good(T('Пиииip — дверь открыта', 'Піііп — двері відчинено', 'Beeep — door open')); return g.done(true); }
          bad++; inp = ''; lcd.textContent = 'ERR';
          P.mistake(T('Неверно — домофон пищит', 'Невірно — домофон пищить', 'Wrong — the intercom beeps'), 1);
          if (bad >= 3) g.done(false);
        }
        if (inp.length > 8) { inp = ''; lcd.textContent = '—'; }
      });
      if (!P.data.rival) P.timer(30, () => g.done(false));
      void st;
      return g;
    },
  };
}

// ---------------------------------------------------------------- pick the right bag left at the door
const BAG_KIND = () => [['🛍️', T('пакет', 'пакет', 'bag')], ['📦', T('коробка', 'коробка', 'box')], ['👜', T('сумка', 'сумка', 'tote')]];
const BAG_COL = () => [['#e5484d', T('красный', 'червоний', 'red'), T('красная', 'червона', 'red')], ['#30a46c', T('зелёный', 'зелений', 'green'), T('зелёная', 'зелена', 'green')], ['#3e63dd', T('синий', 'синій', 'blue'), T('синяя', 'синя', 'blue')], ['#f5d90a', T('жёлтый', 'жовтий', 'yellow'), T('жёлтая', 'жовта', 'yellow')], ['#222', T('чёрный', 'чорний', 'black'), T('чёрная', 'чорна', 'black')]];
function bagStep() {
  return {
    name: T('забрать своё', 'забрати своє', 'grab the right one'),
    desc: '',
    run: (P) => {
      const g = gate();
      const kinds = BAG_KIND(), cols = BAG_COL();
      const tags = shuf([T('Для Олега', 'Для Олега', 'For Oleg'), T('Соседке', 'Сусідці', 'For the neighbour'), T('Вам 🙂', 'Вам 🙂', 'For you 🙂'), T('Курьеру', 'Курʼєру', 'Courier'), T('Не трогать', 'Не чіпати', 'Do not touch')]);
      const tgt = { k: ri(0, 2), c: ri(0, 4), t: 0 };
      const items = [tgt, { ...tgt, k: (tgt.k + 1) % 3 }, { ...tgt, c: (tgt.c + 1) % 5 }, { ...tgt, t: 1 }, { k: (tgt.k + 2) % 3, c: (tgt.c + 2) % 5, t: 0 }];
      const mix = shuf(items.map((x, i) => ({ ...x, ok: i === 0 })));
      const female = tgt.k === 1 || tgt.k === 2;
      const colWord = female ? cols[tgt.c][2] : cols[tgt.c][1];
      P.desc(T(`Даритель: «Оставил у двери. Ваш — <b>${colWord} ${kinds[tgt.k][1]}</b> с запиской «${tags[0]}». Остальное не трогайте!»`, `Дарувальник: «Залишив біля дверей. Ваш — <b>${colWord} ${kinds[tgt.k][1]}</b> із запискою «${tags[0]}». Решту не чіпайте!»`, `Giver: “Left it by the door. Yours is the <b>${colWord} ${kinds[tgt.k][1]}</b> with the note “${tags[0]}”. Don’t touch the rest!”`));
      const st = P.stage(`<div class="bags">${mix.map((x, i) => `<button data-i="${i}"><span class="bk" style="--c:${cols[x.c][0]}">${kinds[x.k][0]}</span><span class="note">${esc(tags[x.t])}</span></button>`).join('')}</div>`, 'pbags');
      let bad = 0;
      P.on(st, '[data-i]', (b) => {
        const x = mix[+b.dataset.i];
        if (x.ok) { b.classList.add('ok'); P.good(T('Это оно!', 'Це воно!', 'That’s the one!')); return g.done(true); }
        b.classList.add('bad'); b.disabled = true; bad++;
        P.mistake(T('Это чужое — сосед выглянул и ругается', 'Це чуже — сусід визирнув і свариться', 'Not yours — a neighbour is yelling'), 1);
        if (bad >= 2) g.done(false);
      });
      if (!P.data.rival) P.timer(20, () => g.done(false));
      return g;
    },
  };
}

// ---------------------------------------------------------------- PICKUP: the whole trip to a freebie, racing another taker
const RIVAL_ETA = { cheap: 80, mid: 52, good: 34, jackpot: 24 };
function pickup(api, { tier = 'cheap', claimers = 1 }) {
  const n = tier === 'cheap' ? 2 : tier === 'mid' ? 3 : 4;
  const first = replyStep();
  const pool = shuf([routeStep(), entranceStep(), intercomStep(), bagStep()]);
  const steps = [first, ...pool.slice(0, n - 1)];
  const eta = Math.max(16, (RIVAL_ETA[tier] || 60) - claimers * 1.6 + ri(-3, 3));
  procedure(api, {
    steps,
    rival: claimers > 0 ? { label: '🏃 ' + T('Другой желающий', 'Інший охочий', 'Another taker'), eta, penalty: tier === 'cheap' ? 4 : 5, lost: T('Опередили!', 'Випередили!', 'Beaten to it!'), lostText: T('Другой желающий забрал вещь у вас из‑под носа', 'Інший охочий забрав річ у вас з‑під носа', 'Someone else grabbed it right before you'), emoji: '🏃' } : null,
    onEnd: (r) => (r.won ? { emoji: '🎁', title: T('Ваше!', 'Ваше!', 'It’s yours!') } : { emoji: '😞', title: T('Не вышло', 'Не вийшло', 'Didn’t work out') }),
    data: { rival: claimers > 0, lenient: true },
  });
}

// ---------------------------------------------------------------- PICKPOCKET: remember, chase, grab
const COLS = [['#d93f3f', ['красная', 'червона', 'red'], ['красной', 'червоній', 'red']], ['#2f6fd6', ['синяя', 'синя', 'blue'], ['синей', 'синій', 'blue']], ['#222831', ['чёрная', 'чорна', 'black'], ['чёрной', 'чорній', 'black']], ['#3a9b5c', ['зелёная', 'зелена', 'green'], ['зелёной', 'зеленій', 'green']], ['#c9a227', ['жёлтая', 'жовта', 'yellow'], ['жёлтой', 'жовтій', 'yellow']], ['#8a8f98', ['серая', 'сіра', 'grey'], ['серой', 'сірій', 'grey']]];
function figure(p) {
  const cap = p.cap >= 0 ? `<path d="M37 30 Q50 14 63 30 Z" fill="${COLS[p.cap][0]}"/><rect x="${p.capBack ? 30 : 55}" y="27" width="15" height="4" rx="2" fill="${COLS[p.cap][0]}"/>` : `<path d="M38 30 Q50 16 62 30 Q58 24 50 24 Q42 24 38 30Z" fill="#4a3426"/>`;
  const bag = p.bag === 1 ? `<rect x="22" y="48" width="12" height="26" rx="4" fill="#5b4636"/>` : p.bag === 2 ? `<path d="M40 46 L66 80" stroke="#5b4636" stroke-width="3"/><rect x="60" y="74" width="14" height="12" rx="3" fill="#5b4636"/>` : '';
  const glass = p.gl ? `<rect x="42" y="33" width="7" height="4" rx="1" fill="#111"/><rect x="51" y="33" width="7" height="4" rx="1" fill="#111"/><path d="M49 35h2" stroke="#111"/>` : '';
  return `<svg viewBox="0 0 100 130" class="fig">${bag && p.bag === 1 ? bag : ''}<rect x="34" y="44" width="32" height="40" rx="10" fill="${COLS[p.jk][0]}"/><rect x="36" y="84" width="12" height="36" rx="4" fill="#2d3442"/><rect x="52" y="84" width="12" height="36" rx="4" fill="#2d3442"/><circle cx="50" cy="34" r="11" fill="#e6b89c"/>${cap}${glass}${p.bag === 2 ? bag : ''}</svg>`;
}
function descOf(p) {
  const parts = [];
  parts.push(p.cap >= 0 ? T(`кепка ${COLS[p.cap][1][0]}`, `кепка ${COLS[p.cap][1][1]}`, `${COLS[p.cap][1][2]} cap`) : T('без кепки', 'без кепки', 'no cap'));
  parts.push(T(`куртка ${COLS[p.jk][1][0]}`, `куртка ${COLS[p.jk][1][1]}`, `${COLS[p.jk][1][2]} jacket`));
  parts.push(p.bag === 1 ? T('рюкзак', 'рюкзак', 'backpack') : p.bag === 2 ? T('сумка через плечо', 'сумка через плече', 'shoulder bag') : T('без сумки', 'без сумки', 'no bag'));
  if (p.gl) parts.push(T('тёмные очки', 'темні окуляри', 'sunglasses'));
  return parts.join(', ');
}
function spotStep() {
  return {
    name: T('приметы', 'прикмети', 'description'),
    desc: T('Ты успел увидеть вора краем глаза. Запомни, как он выглядит!', 'Ти встиг побачити злодія краєм ока. Запамʼятай, який він!', 'You caught a glimpse of the thief. Remember him!'),
    run: async (P) => {
      const thief = { cap: ri(-1, 5), jk: ri(0, 5), bag: ri(0, 2), gl: Math.random() < 0.4, capBack: Math.random() < 0.5 };
      const alt = (p) => { const q = { ...p }; const k = pick(['cap', 'jk', 'bag', 'gl']); if (k === 'cap') q.cap = p.cap === -1 ? ri(0, 5) : (Math.random() < 0.3 ? -1 : (p.cap + ri(1, 5)) % 6); if (k === 'jk') q.jk = (p.jk + ri(1, 5)) % 6; if (k === 'bag') q.bag = (p.bag + ri(1, 2)) % 3; if (k === 'gl') q.gl = !p.gl; return q; };
      const crowd = [thief]; const sig = (p) => `${p.cap}|${p.jk}|${p.bag}|${p.gl}`; const seen = new Set([sig(thief)]);
      while (crowd.length < 6) { const q = crowd.length < 4 ? alt(thief) : alt(alt(thief)); if (!seen.has(sig(q))) { seen.add(sig(q)); crowd.push(q); } }
      const mix = shuf(crowd);
      P.stage(`<div class="glimpse">${figure(thief)}<div class="small m">${esc(descOf(thief))}</div></div>`, 'pfig');
      P.ctl(`<div class="pbar"><i class="gt" style="width:100%;transition:width 2.6s linear"></i></div>`);
      requestAnimationFrame(() => requestAnimationFrame(() => { const e = P.root.querySelector('.gt'); if (e) e.style.width = '0%'; }));
      await P.wait(2700);
      P.desc(T('Кто из них? В толпе есть похожие.', 'Хто з них? У натовпі є схожі.', 'Which one? Some look alike.'));
      const g = gate();
      let bad = 0;
      const st = P.stage(`<div class="crowd">${mix.map((p, i) => `<button data-i="${i}">${figure(p)}</button>`).join('')}</div>`, 'pfig');
      P.ctl('');
      P.on(st, '[data-i]', (b) => {
        const p = mix[+b.dataset.i];
        if (p === thief) { b.classList.add('ok'); P.good(T('Вот он! Бежит!', 'Ось він! Тікає!', 'There he is! Running!')); return g.done(true); }
        b.classList.add('bad'); b.disabled = true; bad++;
        P.mistake(T('Не он — человек возмущается', 'Не він — людина обурюється', 'Not him — the guy is annoyed'), 1.5);
        if (bad >= 2) g.done(false);
      });
      return g;
    },
  };
}
const MARKS = () => [['🏪', T('аптека', 'аптека', 'pharmacy'), T('к аптеке', 'до аптеки', 'to the pharmacy')], ['🚇', T('метро', 'метро', 'metro'), T('к метро', 'до метро', 'to the metro')], ['🅿️', T('парковка', 'парковка', 'parking'), T('к парковке', 'до парковки', 'to the parking lot')], ['🌳', T('парк', 'парк', 'park'), T('в парк', 'в парк', 'into the park')], ['🏫', T('школа', 'школа', 'school'), T('к школе', 'до школи', 'to the school')], ['🍔', T('кафе', 'кафе', 'cafe'), T('к кафе', 'до кафе', 'to the cafe')], ['⛪', T('церковь', 'церква', 'church'), T('к церкви', 'до церкви', 'to the church')], ['🏦', T('банк', 'банк', 'bank'), T('к банку', 'до банку', 'to the bank')]];
function chaseStep() {
  return {
    name: T('погоня', 'погоня', 'chase'),
    desc: T('Вор петляет по дворам. На каждой развилке смотри на подсказки.', 'Злодій петляє дворами. На кожному роздоріжжі дивись на підказки.', 'The thief zigzags through yards. Use the clues at every junction.'),
    run: (P) => {
      const g = gate();
      let j = 0, bad = 0;
      const DIRS = [['⬅️', T('налево', 'ліворуч', 'left')], ['⬆️', T('прямо', 'прямо', 'ahead')], ['➡️', T('направо', 'праворуч', 'right')]];
      const junction = () => {
        const m = shuf(MARKS()).slice(0, 3);
        const ans = ri(0, 2);
        const others = [0, 1, 2].filter((x) => x !== ans);
        const kind = pick(['witness', 'drop', 'not', 'sound']);
        const clue = kind === 'witness' ? T(`Бабушка кричит: «Он ${m[ans][2]} побежал!»`, `Бабуся кричить: «Він ${m[ans][2]} побіг!»`, `A granny shouts: “He ran ${m[ans][2]}!”`)
          : kind === 'drop' ? T(`На асфальте твоя скидочная карта — у поворота, где ${m[ans][1]}`, `На асфальті твоя знижкова картка — біля повороту, де ${m[ans][1]}`, `Your loyalty card is on the ground by the turn with the ${m[ans][1]}`)
          : kind === 'not' ? T(`Дворник: «${m[others[0]][2][0].toUpperCase() + m[others[0]][2].slice(1)} никто не бежал. И ${m[others[1]][2]} тоже»`, `Двірник: «${m[others[0]][2][0].toUpperCase() + m[others[0]][2].slice(1)} ніхто не біг. І ${m[others[1]][2]} теж»`, `Janitor: “Nobody ran ${m[others[0]][2]}. Or ${m[others[1]][2]}.”`)
          : T(`Слышно: ${['слева', 'впереди', 'справа'][ans]} хлопнула дверь подъезда и залаяла собака`, `Чути: ${['ліворуч', 'попереду', 'праворуч'][ans]} грюкнули двері підʼїзду й загавкав собака`, `A door slams and a dog barks ${['to the left', 'up ahead', 'to the right'][ans]}`);
        P.stage(`<div class="junc"><div class="clue">${esc(clue)}</div><div class="jmap">${m.map((x, i) => `<div class="jd d${i}"><span>${x[0]}</span><small>${esc(x[1])}</small></div>`).join('')}<div class="jme">🏃</div></div></div>`, 'pjunc');
        const c = P.ctl(`<div class="jbtns">${DIRS.map((d, i) => `<button class="btn" data-i="${i}">${d[0]}<small>${esc(m[i][1])}</small></button>`).join('')}</div><div class="small m c">${T('Развилка', 'Роздоріжжя', 'Junction')} ${j + 1}/3</div>`);
        P.on(c, '[data-i]', (b) => {
          if (+b.dataset.i === ans) { P.good(T(`Свернул ${DIRS[ans][1]} — он впереди!`, `Звернув ${DIRS[ans][1]} — він попереду!`, `Turned ${DIRS[ans][1]} — he’s ahead!`)); j++; if (j >= 3) return g.done(true); return junction(); }
          bad++; P.mistake(T('Тупик! Пришлось возвращаться', 'Глухий кут! Довелося повертатися', 'Dead end! Had to go back'), 1.6);
          if (bad >= 3) return g.done(false);
          j++; if (j >= 3) return g.done(true); junction();
        });
      };
      junction();
      return g;
    },
  };
}
function grabStep() {
  return {
    name: T('схватить', 'схопити', 'grab him'),
    desc: T('Он лезет через забор. Хватай, когда он замешкается — бегунок в зелёной зоне. Две попытки.', 'Він лізе через паркан. Хапай, коли він забариться — бігунок у зеленій зоні. Дві спроби.', 'He’s climbing a fence. Grab when he falters — slider in the green zone. Two tries.'),
    run: (P) => {
      const g = gate();
      let x = 0, dir = 1, tries = 2;
      const zx = 0.2 + Math.random() * 0.55, zw = 0.16;
      const st = P.stage(`<div class="kp"><div class="fence">🧱🧱🏃🧱🧱</div><div class="kbar"><i class="kz" style="left:${zx * 100}%;width:${zw * 100}%"></i><b class="km"></b></div></div>`);
      const mk = st.querySelector('.km');
      const c = P.ctl(`<button class="btn block big red go">✊ ${T('Схватить!', 'Схопити!', 'Grab!')}</button>`);
      P.tick((dt) => { x += dir * dt * 1.25; if (x > 1) { x = 1; dir = -1; } if (x < 0) { x = 0; dir = 1; } mk.style.left = x * 100 + '%'; });
      P.on(c, '.go', () => {
        if (x >= zx && x <= zx + zw) { P.good(T('Попался!', 'Попався!', 'Got him!')); return g.done(true); }
        tries--; P.mistake(T('Вывернулся!', 'Викрутився!', 'He wriggled free!'), 1.5);
        if (tries <= 0) g.done(false);
      });
      return g;
    },
  };
}
function thief(api) {
  procedure(api, {
    steps: [spotStep(), chaseStep(), grabStep()],
    rival: { label: '🦹 ' + T('Вор убегает', 'Злодій тікає', 'Thief escaping'), eta: ri(40, 48), penalty: 4, lost: T('Ушёл…', 'Утік…', 'He got away…'), lostText: T('Вор скрылся во дворах', 'Злодій зник у дворах', 'The thief vanished into the yards'), emoji: '🦹' },
    onEnd: (r) => (r.won ? { emoji: '🚔', title: T('Вор пойман!', 'Злодія спіймано!', 'Thief caught!') } : { emoji: '🦹', title: T('Ушёл…', 'Утік…', 'He got away…') }),
    data: { rival: true },
  });
}

// ---------------------------------------------------------------- CARD BLOCK: stop the thief spending from a stolen card
const SHOPS = ['Сільпо', 'АТБ', 'Пятёрочка', 'Магнит', 'Shell', 'McDonald’s', 'Zara', 'Steam', 'Rozetka', 'Wildberries', 'Bolt', 'Lidl'];
function cardblock(api, { amount = 50 }) {
  const phys = String(ri(1000, 9999)), virt = String(ri(1000, 9999));
  const layout = pick(['cards', 'more']);
  const sms = String(ri(1000, 9999));
  let spent = 0, screen = 'home', blocked = false, wrong = 0, smsShown = false, code = '';
  const charges = [];
  let nextBuy = 2.6;
  api.body.innerHTML = `<div class="proc cb"><div class="phd"><h3>${T('Кошелёк украли — с ним пластиковая карта!', 'Гаманець вкрали — з ним пластикова картка!', 'Wallet stolen — with your plastic card!')}</h3><p class="pdesc">${T(`Вор уже расплачивается картой ••${phys}. Заблокируй её в банковском приложении как можно быстрее. Виртуальную карту в телефоне не трогай — она тебе ещё нужна.`, `Злодій уже розраховується карткою ••${phys}. Заблокуй її в банківському застосунку якнайшвидше. Віртуальну картку в телефоні не чіпай — вона тобі ще потрібна.`, `The thief is already paying with card ••${phys}. Block it in the bank app ASAP. Leave the virtual card on your phone alone — you still need it.`)}</p></div><div class="bankui"><div class="bnot"></div><div class="bscr"></div></div><div class="cbsum">${T('Потрачено вором', 'Витрачено злодієм', 'Spent by thief')}: <b class="r sp">0</b> / ${fmt(amount)}</div></div>`;
  const scr = api.body.querySelector('.bscr'), not = api.body.querySelector('.bnot'), spEl = api.body.querySelector('.sp');
  const btn = (v, t, cls = '') => `<button class="bi ${cls}" data-v="${v}">${t}</button>`;
  const back = btn('home', '‹ ' + T('Назад', 'Назад', 'Back'), 'bk');
  const render = () => {
    let h = '';
    if (screen === 'home') h = `<div class="bh"><div class="bal">${fmt(Math.max(0, (G.s?.money || 0)))}</div><div class="small m">${T('Все счета', 'Усі рахунки', 'All accounts')}</div></div><div class="bgrid">${[['tr', '💸', T('Переводы', 'Перекази', 'Transfers')], ['pay', '🧾', T('Платежи', 'Платежі', 'Payments')], ['cards', '💳', T('Карты', 'Картки', 'Cards')], ['cash', '🎁', T('Кэшбэк', 'Кешбек', 'Cashback')], ['chat', '💬', T('Чат', 'Чат', 'Chat')], ['more', '⋯', T('Ещё', 'Ще', 'More')]].map(([v, e, t]) => btn(v, `<span>${e}</span>${t}`)).join('')}</div>`;
    else if (screen === 'cards') h = `${back}<div class="bt">${T('Мои карты', 'Мої картки', 'My cards')}</div>${btn('c_' + virt, `💳 ${T('Виртуальная', 'Віртуальна', 'Virtual')} ••${virt}<small>${T('в телефоне', 'у телефоні', 'on the phone')}</small>`, 'row')}${btn('c_' + phys, `💳 ${T('Пластиковая', 'Пластикова', 'Plastic')} ••${phys}<small>${T('в кошельке', 'у гаманці', 'in the wallet')}</small>`, 'row')}`;
    else if (screen.startsWith('c_')) { const n = screen.slice(2); h = `${btn(layout === 'more' ? 'sec' : 'cards', '‹ ' + T('Назад', 'Назад', 'Back'), 'bk')}<div class="bt">••${n}</div>${[['req', T('Реквизиты', 'Реквізити', 'Details')], ['lim', T('Лимиты', 'Ліміти', 'Limits')], ['pin', T('Сменить PIN', 'Змінити PIN', 'Change PIN')], ['blk_' + n, '🔒 ' + T('Заблокировать', 'Заблокувати', 'Block'), 'red'], ['re', T('Перевыпустить', 'Перевипустити', 'Reissue')]].map(([v, t, cl]) => btn(v, t, 'row ' + (cl || ''))).join('')}`; }
    else if (screen === 'more') h = `${back}<div class="bt">${T('Ещё', 'Ще', 'More')}</div>${[['set', '⚙️ ' + T('Настройки', 'Налаштування', 'Settings')], ['sec', '🛡 ' + T('Безопасность', 'Безпека', 'Security')], ['docs', '📄 ' + T('Документы', 'Документи', 'Documents')], ['help', '❓ ' + T('Помощь', 'Допомога', 'Help')]].map(([v, t]) => btn(v, t, 'row')).join('')}`;
    else if (screen === 'sec') h = `${btn('more', '‹ ' + T('Назад', 'Назад', 'Back'), 'bk')}<div class="bt">${T('Безопасность', 'Безпека', 'Security')}</div>${[['pw', T('Пароль входа', 'Пароль входу', 'Login password')], ['dev', T('Мои устройства', 'Мої пристрої', 'My devices')], ['lost', '🔒 ' + T('Утеряна или украдена карта', 'Загублена або вкрадена картка', 'Card lost or stolen')]].map(([v, t]) => btn(v, t, 'row')).join('')}`;
    else if (screen === 'lost') h = `${btn('sec', '‹ ' + T('Назад', 'Назад', 'Back'), 'bk')}<div class="bt">${T('Какую карту?', 'Яку картку?', 'Which card?')}</div>${btn('blk_' + virt, `💳 ••${virt} <small>${T('виртуальная', 'віртуальна', 'virtual')}</small>`, 'row')}${btn('blk_' + phys, `💳 ••${phys} <small>${T('пластиковая', 'пластикова', 'plastic')}</small>`, 'row')}`;
    else if (screen.startsWith('blk_')) { const n = screen.slice(4); h = `${back}<div class="bt">${T('Блокировка', 'Блокування', 'Block')} ••${n}</div><p class="small m">${T('Код из СМС', 'Код з СМС', 'SMS code')}</p><div class="pinbox mono">${code || '—'}</div>${keypad()}`; }
    else h = `${back}<div class="bt">…</div><p class="small m">${T('Здесь нет того, что нужно', 'Тут немає того, що треба', 'Nothing useful here')}</p>`;
    scr.innerHTML = h;
    scr.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => { if (api.ended) return; go(b.dataset.v); }));
    scr.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { if (api.ended) return; key(b.dataset.k); }));
  };
  const go = (v) => {
    api.sfx('tick');
    if (layout === 'more' && v === 'cards') { screen = 'cardsinfo'; scr.innerHTML = `${back}<div class="bt">${T('Мои карты', 'Мої картки', 'My cards')}</div><div class="row bi">💳 ••${virt}</div><div class="row bi">💳 ••${phys}</div><p class="small m">${T('Управление блокировкой — в разделе «Ещё → Безопасность»', 'Керування блокуванням — у розділі «Ще → Безпека»', 'Blocking lives in “More → Security”')}</p>`; scr.querySelector('[data-v]').addEventListener('click', () => go('home')); return; }
    screen = v;
    if (v.startsWith('blk_')) { code = ''; if (!smsShown) { smsShown = true; setTimeout(() => { if (!api.ended) toastN(`✉️ ${T('Банк', 'Банк', 'Bank')}: ${T('код', 'код', 'code')} <b>${sms}</b>`); }, 900); } }
    render();
  };
  const key = (k) => {
    if (k === '⌫') code = code.slice(0, -1);
    else if (k === '✓') {
      const n = screen.slice(4);
      if (code !== sms) { code = ''; wrong++; api.sfx('err'); api.shake(scr); }
      else if (n === virt) { wrong++; api.sfx('err'); toastN(`<span class="r">${T('Заблокирована виртуальная карта — не та!', 'Заблоковано віртуальну картку — не та!', 'You blocked the virtual card — wrong one!')}</span>`); screen = 'home'; }
      else { blocked = true; api.sfx('ok'); scr.innerHTML = `<div class="c" style="padding:30px 0"><div style="font-size:44px">🔒</div><b>${T('Карта заблокирована', 'Картку заблоковано', 'Card blocked')}</b><p class="small m">••${phys}</p></div>`; setTimeout(() => end(), 900); return; }
    } else if (code.length < 6) code += k;
    render();
  };
  const toastN = (h) => { const d = document.createElement('div'); d.className = 'bn'; d.innerHTML = h; not.prepend(d); setTimeout(() => d.remove(), 3600); };
  const end = () => { const saved = clamp(1 - spent / amount, 0, 1); api.end({ score: saved, saved, spent, emoji: blocked ? '🔒' : '💸', title: blocked ? T('Карта заблокирована', 'Картку заблоковано', 'Card blocked') : T('Вор потратил всё', 'Злодій витратив усе', 'The thief spent it all'), text: T(`Вор успел потратить ${fmt(spent)} из ${fmt(amount)}`, `Злодій встиг витратити ${fmt(spent)} з ${fmt(amount)}`, `The thief spent ${fmt(spent)} of ${fmt(amount)}`) }); };
  api.onTick((dt) => {
    if (api.ended || blocked) return;
    nextBuy -= dt;
    if (nextBuy <= 0) {
      nextBuy = 2.4 + Math.random() * 1.6;
      const sum = Math.min(amount - spent, amount * (0.08 + Math.random() * 0.12));
      spent += sum; charges.push(sum);
      spEl.textContent = fmt(spent);
      api.sfx('err');
      toastN(`💳 ••${phys} · ${pick(SHOPS)} · <b class="r">−${fmt(sum)}</b>`);
      if (spent >= amount - 0.01) end();
    }
  });
  render();
}

// ---------------------------------------------------------------- FLEA HAGGLE: real arguments vs bluff
function haggle(api, { item }) {
  const m = MODEL[item.m] || {};
  const known = (item.defects || []).filter((d) => d.known).map((d) => d.c);
  const pool = (CAT_DEFECTS[item.cat] || []).filter((c) => !known.includes(c) && DEFECTS[c]);
  const nowY = new Date().getFullYear();
  const old = m.year && nowY - m.year >= 5;
  let val = 50; try { val = itemValue(item, city(), 'known'); } catch { /* ignore */ }
  let disc = 0, patience = 3, round = 0, usedCash = false;
  const ARGS = () => {
    const out = [];
    if (known.length) { const c = pick(known); out.push({ t: T(`Тут же ${lc1(defectName(c))} — видно на фото`, `Тут же ${lc1(defectName(c))} — видно на фото`, `Look, it has ${lc1(defectName(c))} — you can see it`), d: 9, ok: true }); }
    if (pool.length) { const c = pick(pool); out.push({ t: T(`Тут же ${lc1(defectName(c))}`, `Тут же ${lc1(defectName(c))}`, `It has ${lc1(defectName(c))}`), d: -1, why: T('Продавец: «Где? Нет там такого!»', 'Продавець: «Де? Немає там такого!»', 'Seller: “Where? There’s no such thing!”') }); }
    if (m.year) out.push(old ? { t: T(`Модели уже ${nowY - m.year} лет, она устарела`, `Моделі вже ${nowY - m.year} років, вона застаріла`, `The model is ${nowY - m.year} years old already`), d: 7, ok: true } : { t: T('Модель же старая совсем', 'Модель же зовсім стара', 'This model is ancient'), d: -1, why: T(`Продавец: «Какая старая? ${m.year} год!»`, `Продавець: «Яка стара? ${m.year} рік!»`, `Seller: “Old? It’s from ${m.year}!”`) });
    const fair = Math.round(val * 0.85), absurd = Math.round(val * 0.35);
    out.push(Math.random() < 0.5 ? { t: T(`В объявлениях такие от ${fmt(fair)}`, `В оголошеннях такі від ${fmt(fair)}`, `Listings have these from ${fmt(fair)}`), d: 8, ok: true } : { t: T(`В объявлениях такие по ${fmt(absurd)}`, `В оголошеннях такі по ${fmt(absurd)}`, `Listings have these for ${fmt(absurd)}`), d: -1, why: T('Продавец: «Не смеши. За такие деньги — только коробка»', 'Продавець: «Не смійся. За такі гроші — хіба коробка»', 'Seller: “Don’t make me laugh. That buys the box”') });
    if (!usedCash) out.push({ t: T('Беру прямо сейчас, наличными', 'Беру просто зараз, готівкою', 'I’ll take it right now, cash'), d: 4, ok: true, cash: true });
    out.push({ t: T('Да это хлам, кому он нужен', 'Та це мотлох, кому він потрібен', 'It’s junk, who’d want it'), d: -2, why: T('Продавец обиделся', 'Продавець образився', 'The seller is offended') });
    return shuf(out).slice(0, 3);
  };
  const draw = () => {
    const thumb = itemBitmap(item, {}, 300);
    const a = ARGS();
    api.body.innerHTML = `<div class="proc"><div class="phd"><h3>${T('Торг', 'Торг', 'Haggle')} · ${T('раунд', 'раунд', 'round')} ${round + 1}/3</h3><p class="pdesc">${T('Аргументы должны быть правдой: смотри на вещь и её дефекты. Враньё злит продавца.', 'Аргументи мають бути правдою: дивись на річ і її дефекти. Брехня злить продавця.', 'Arguments must be true: look at the item and its defects. Lies annoy the seller.')}</p></div>
      <div class="hg"><div class="th">${thumb}</div><div class="grow"><b>${esc(itemTitle(item))}</b><div class="small m">${m.year || ''} · ${T('состояние', 'стан', 'condition')} ${Math.round(item.cond || 0)}%</div><div class="small">${known.length ? known.map((c) => `<span class="r">⚠ ${esc(defectName(c))}</span>`).join('<br>') : `<span class="g">✓ ${T('дефектов не видно', 'дефектів не видно', 'no visible defects')}</span>`}</div></div></div>
      <div class="hgst"><span>${T('Скидка', 'Знижка', 'Discount')}: <b class="g">${disc}%</b></span><span>${T('Терпение', 'Терпіння', 'Patience')}: ${'❤️'.repeat(Math.max(0, patience))}${'🖤'.repeat(Math.max(0, 3 - patience))}</span></div>
      <div class="pctl">${a.map((x, i) => `<button class="frow lft" data-i="${i}">💬 ${esc(x.t)}</button>`).join('')}<button class="btn dark block" data-i="stop">${T('Хватит, беру', 'Досить, беру', 'Enough, I’ll take it')}</button></div><div class="plog mono"></div></div>`;
    api.body.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
      if (api.ended) return;
      if (b.dataset.i === 'stop') return fin();
      const x = a[+b.dataset.i];
      if (x.ok) { disc += x.d + ri(-1, 2); if (x.cash) usedCash = true; api.sfx('ok'); api.flash(true); }
      else { patience += x.d; api.sfx('err'); api.flash(false); }
      const log = api.body.querySelector('.plog');
      log.innerHTML = `<div class="${x.ok ? 'ok' : 'err'}">${esc(x.ok ? T('Продавец: «Ну ладно, уступлю немного»', 'Продавець: «Ну добре, поступлюся трохи»', 'Seller: “Fine, I’ll knock a bit off”') : x.why)}</div>`;
      round++;
      setTimeout(() => { if (api.ended) return; if (patience <= 0 || round >= 3) fin(); else draw(); }, 700);
    }));
  };
  const fin = () => {
    if (patience <= 0) return api.end({ score: 0, disc: 0, emoji: '😤', title: T('Продавец обиделся', 'Продавець образився', 'The seller is offended'), text: T('Скидки не будет', 'Знижки не буде', 'No discount') });
    disc = clamp(disc, 0, 30);
    api.end({ score: disc / 30, disc, emoji: disc >= 15 ? '🤝' : '😐', title: disc ? T(`Скидка ${disc}%`, `Знижка ${disc}%`, `${disc}% off`) : T('Без скидки', 'Без знижки', 'No discount') });
  };
  draw();
}

// ---------------------------------------------------------------- CODE LOCK: Mastermind-style clues
function codelock(api, { digits = 3, tries = 6, head = '' }) {
  const code = shuf(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']).slice(0, digits).join('');
  const hist = [];
  let cur = '';
  const hint = Math.random() < 0.5 ? T(`На крышке нацарапано: «${code[0]}…»`, `На кришці надряпано: «${code[0]}…»`, `Scratched on the lid: “${code[0]}…”`) : '';
  const draw = () => {
    api.body.innerHTML = `<div class="proc"><div class="phd"><h3>${head ? esc(head) : T('Кодовый замок', 'Кодовий замок', 'Combination lock')}</h3><p class="pdesc">${T(`Код из ${digits} разных цифр. После попытки: 🟢 — цифра на своём месте, 🟡 — есть в коде, но не там. Попыток: ${tries - hist.length}.`, `Код із ${digits} різних цифр. Після спроби: 🟢 — цифра на своєму місці, 🟡 — є в коді, але не там. Спроб: ${tries - hist.length}.`, `${digits} different digits. After a try: 🟢 — right digit, right place; 🟡 — in the code, wrong place. Tries left: ${tries - hist.length}.`)}${hint ? `<br><i>${esc(hint)}</i>` : ''}</p></div>
      <div class="pstage"><div class="cl">${hist.map((h) => `<div class="clr"><span class="mono">${h.g.split('').join(' ')}</span><span>${'🟢'.repeat(h.a)}${'🟡'.repeat(h.b)}${h.a + h.b === 0 ? '⚫' : ''}</span></div>`).join('')}<div class="clr cur"><span class="mono">${(cur + '_'.repeat(digits - cur.length)).split('').join(' ')}</span></div></div></div>
      <div class="pctl">${keypad()}</div></div>`;
    api.body.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
      if (api.ended) return;
      const k = b.dataset.k;
      if (k === '⌫') cur = cur.slice(0, -1);
      else if (k === '✓') {
        if (cur.length < digits) return;
        let a = 0, bb = 0;
        cur.split('').forEach((c, i) => { if (code[i] === c) a++; else if (code.includes(c)) bb++; });
        hist.push({ g: cur, a, b: bb }); cur = '';
        if (a === digits) { api.sfx('win'); return api.end({ score: 1, emoji: '🔓', title: T('Открыто!', 'Відчинено!', 'Unlocked!'), text: T(`Код ${code} с ${hist.length}-й попытки`, `Код ${code} з ${hist.length}-ї спроби`, `Code ${code} in ${hist.length} tries`) }); }
        api.sfx(a + bb ? 'tick' : 'err');
        if (hist.length >= tries) return api.end({ score: 0.2, emoji: '🔒', title: T('Замок заклинило', 'Замок заклинило', 'The lock jammed'), text: T(`Код был ${code}`, `Код був ${code}`, `The code was ${code}`) });
      } else if (cur.length < digits && !cur.includes(k)) cur += k;
      draw();
    }));
  };
  api.setTime(90, () => api.end({ score: 0.1, emoji: '⌛', title: T('Время вышло', 'Час вийшов', 'Out of time'), text: T(`Код был ${code}`, `Код був ${code}`, `The code was ${code}`) }));
  draw();
}

// ---------------------------------------------------------------- FOUND WALLET: find the real owner
const AVF = ['👩', '👩‍🦰', '👱‍♀️', '👩‍🦳', '👵', '👩‍🦱'], AVM = ['🧔', '👨', '👨‍🦰', '👴', '👱‍♂️', '👨‍🦱'];
function ownerStep() {
  const kind = pick(['id', 'claim']);
  if (kind === 'id') {
    return {
      name: T('найти владельца', 'знайти власника', 'find the owner'),
      desc: T('В кошельке — пропуск с фото, годом рождения и городом. В поиске мессенджера нашлось несколько людей с таким именем. Кто из них?', 'У гаманці — перепустка з фото, роком народження й містом. У пошуку месенджера знайшлося кілька людей з таким імʼям. Хто з них?', 'Inside: an ID card with a photo, birth year and city. The messenger search finds several people with that name. Which one?'),
      run: (P) => {
        const g = gate();
        const who = person(), nm = who.name, AV = who.fem ? AVF : AVM;
        const yr = new Date().getFullYear();
        const t = { av: pick(AV), age: ri(19, 70), city: pick(['Kyiv', 'Lviv', 'Odesa', 'Almaty', 'Riga', 'Tbilisi', 'Warsaw']) };
        const cities = ['Kyiv', 'Lviv', 'Odesa', 'Almaty', 'Riga', 'Tbilisi', 'Warsaw', 'Minsk'];
        const prof = [t, { ...t, av: pick(AV.filter((a) => a !== t.av)) }, { ...t, age: t.age + pick([-11, 9, 14]) }, { ...t, city: pick(cities.filter((c) => c !== t.city)) }];
        const mix = shuf(prof);
        P.stage(`<div class="idcard"><div class="ph">${t.av}</div><div><b>${esc(nm)}</b><div class="small m">${T('Год рождения', 'Рік народження', 'Born')}: ${yr - t.age}</div><div class="small m">${T('Город', 'Місто', 'City')}: ${t.city}</div></div></div>`, 'pid');
        const c = P.ctl(mix.map((p, i) => `<button class="frow lft" data-i="${i}"><span style="font-size:28px">${p.av}</span><span><b>${esc(nm)}</b><br><small class="m">${p.age} ${T('лет', 'років', 'y.o.')} · ${p.city}</small></span></button>`).join(''));
        let bad = 0;
        P.on(c, '[data-i]', (b) => {
          const p = mix[+b.dataset.i];
          if (p === t) { P.good(T('«Ой, спасибо огромное! Это мой!»', '«Ой, дякую величезне! Це мій!»', '“Oh thank you so much! It’s mine!”')); return g.done(true); }
          b.disabled = true; b.classList.add('bad'); bad++;
          P.mistake(T('«Это не мой, вы ошиблись»', '«Це не мій, ви помилилися»', '“That’s not mine, wrong person”'));
          if (bad >= 2) g.done(false);
        });
        P.timer(30, () => g.done(false));
        return g;
      },
    };
  }
  return {
    name: T('кто настоящий владелец', 'хто справжній власник', 'the real owner'),
    desc: T('Ты выложил объявление о находке. Написали несколько человек. Отдай тому, кто правильно описал, что внутри (ты видишь содержимое).', 'Ти виклав оголошення про знахідку. Написали кілька людей. Віддай тому, хто правильно описав, що всередині (ти бачиш вміст).', 'You posted about the find. Several people wrote. Give it to the one who correctly describes what’s inside (you can see it).'),
    run: (P) => {
      const g = gate();
      const IT = () => [['🐱', T('фото кота', 'фото кота', 'a cat photo')], ['🎫', T('проездной', 'проїзний', 'a transit pass')], ['🏷️', T('скидочная карта', 'знижкова картка', 'a loyalty card')], ['🔑', T('маленький ключ', 'маленький ключ', 'a small key')], ['🧾', T('чек из аптеки', 'чек з аптеки', 'a pharmacy receipt')], ['💌', T('записка', 'записка', 'a note')], ['🪙', T('монетка на удачу', 'монетка на удачу', 'a lucky coin')]];
      const all = shuf(IT());
      const inside = all.slice(0, 3), notIn = all.slice(3);
      const cash = P.data.cash || ri(2, 9) * 10;
      const names = [person().name, person().name, person().name].map((n, i, arr) => (arr.indexOf(n) !== i ? n + ' ' + 'KMS'[i] + '.' : n));
      const about = (v) => T(`около ${fmt(v)}`, `близько ${fmt(v)}`, `about ${fmt(v)}`);
      const real = shuf([inside[0][1], inside[ri(1, 2)][1], about(cash)]);
      const wrongItem = shuf([inside[0][1], notIn[0][1], about(cash)]);
      const wrongCash = shuf([inside[1][1], inside[2][1], about(cash * pick([2, 2.5, 3]))]);
      const ppl = shuf([{ n: names[0], say: real, ok: true }, { n: names[1], say: wrongItem }, { n: names[2], say: wrongCash }]);
      P.stage(`<div class="wal"><div class="small m">${T('Внутри', 'Всередині', 'Inside')}:</div><div class="wit">${inside.map((x) => `<span>${x[0]} ${esc(x[1])}</span>`).join('')}<span>💵 ${fmt(cash)}</span></div></div>`, 'pid');
      const c = P.ctl(ppl.map((p, i) => `<button class="frow lft" data-i="${i}"><span><b>${esc(p.n)}</b><br><small>«${esc(T('Там', 'Там', 'There’s'))} ${esc(p.say.join(', '))}»</small></span></button>`).join(''));
      P.on(c, '[data-i]', (bt) => {
        const p = ppl[+bt.dataset.i];
        if (p.ok) { P.good(T('Совпало всё — это владелец', 'Збіглося все — це власник', 'Everything matches — the real owner')); return g.done(true); }
        bt.classList.add('bad'); P.mistake(T('Это был мошенник — описал наугад', 'Це був шахрай — описав навмання', 'That was a scammer guessing'));
        g.done(false);
      });
      P.timer(35, () => g.done(false));
      return g;
    },
  };
}
function owner(api, { cash } = {}) { procedure(api, { steps: [ownerStep()], data: { cash } }); }

// ---------------------------------------------------------------- courier job: rounds of routes / addresses
function route(api, { rounds = 3 }) { procedure(api, { steps: Array.from({ length: rounds }, () => (Math.random() < 0.5 ? routeStep() : entranceStep())).map((s) => ({ ...s, soft: true })) }); }

export const LIFE_GAMES = { pickup, thief, cardblock, haggle, codelock, owner, route };
export { COND, BAG_COL, BAG_KIND, MARKS };
export const LIFE_STEPS = { replyStep, routeStep, entranceStep, intercomStep, bagStep, spotStep, chaseStep, grabStep };
