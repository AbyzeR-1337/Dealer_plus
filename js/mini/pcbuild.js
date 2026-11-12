// Assembling a PC: CPU orientation (the golden triangle), thermal paste, RAM slots for dual channel,
// power cables, first power-on. Mistakes cost quality (and bent pins); a dead part shows up at POST.
import { T } from '../core/i18n.js';
import { esc } from '../core/util.js';

const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const CORNERS = ['tl', 'tr', 'br', 'bl'];
function chip(corner, size = 74, label = '') {
  const pos = { tl: [8, 8], tr: [size - 22, 8], br: [size - 22, size - 22], bl: [8, size - 22] }[corner];
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="6" fill="#b9bec7" stroke="#6b7280" stroke-width="2"/><rect x="14" y="14" width="${size - 28}" height="${size - 28}" rx="4" fill="#d9dde3"/><path d="M${pos[0]} ${pos[1]} l12 0 l-12 12 z" fill="#e0b020"/>${label ? `<text x="${size / 2}" y="${size / 2 + 4}" font-size="10" text-anchor="middle" fill="#555">${esc(label)}</text>` : ''}</svg>`;
}
function socket(corner) {
  const pos = { tl: [10, 10], tr: [92, 10], br: [92, 92], bl: [10, 92] }[corner];
  let dots = '';
  for (let y = 22; y < 100; y += 8) for (let x = 22; x < 100; x += 8) dots += `<circle cx="${x}" cy="${y}" r="1.4" fill="#8a8f98"/>`;
  return `<svg viewBox="0 0 120 120" width="150" height="150"><rect x="2" y="2" width="116" height="116" rx="8" fill="#2b2f36" stroke="#555" stroke-width="2"/>${dots}<path d="M${pos[0]} ${pos[1]} l16 0 l-16 16 z" fill="#e0b020"/></svg>`;
}

export function assembleGame(api, { cpuName = 'CPU', hasGpu = true, nvme = false, dead = null, kind = 'pc' }) {
  let score = 1, step = 0, pins = false, dual = true, paste = true;
  const corner = CORNERS[Math.floor(Math.random() * 4)];
  const log = [];
  const steps = [
    // 1. CPU into the socket
    () => {
      const opts = shuf(CORNERS);
      return {
        h: T('Процессор в сокет', 'Процесор у сокет', 'CPU into the socket'),
        d: T(`${cpuName}: совместите золотой треугольник на процессоре с меткой на сокете. Не так — погнёте ножки.`, `${cpuName}: суміщіть золотий трикутник на процесорі з міткою на сокеті. Не так — погнете ніжки.`, `${cpuName}: line up the gold triangle on the chip with the socket mark. Wrong way bends the pins.`),
        stage: socket(corner),
        ctl: `<div class="pcb-row">${opts.map((c) => `<button class="pcb-opt" data-v="${c}">${chip(c)}</button>`).join('')}</div>`,
        pick: (v) => { if (v === corner) return true; pins = true; score -= 0.3; log.push(T('погнуты ножки', 'погнуто ніжки', 'bent pins')); return 'bad'; },
      };
    },
    // 2. thermal paste
    () => ({
      h: T('Термопаста', 'Термопаста', 'Thermal paste'),
      d: T('Сколько нанести перед кулером?', 'Скільки нанести перед кулером?', 'How much before the cooler goes on?'),
      stage: `<div class="pcb-big">🧴</div>`,
      ctl: `<div class="pcb-col">${shuf([['pea', T('Горошину в центр', 'Горошину в центр', 'A pea in the middle')], ['thick', T('Толстым слоем на весь процессор и плату', 'Товстим шаром на весь процесор і плату', 'A thick layer over the chip and the board')], ['none', T('Без пасты, у кулера уже есть', 'Без пасти, у кулера вже є', 'None, the cooler has some')], ['tooth', T('Зубную пасту — она тоже белая', 'Зубну пасту — вона теж біла', 'Toothpaste — it’s white too')]]).map(([v, t]) => `<button class="btn dark block" data-v="${v}">${t}</button>`).join('')}</div>`,
      pick: (v) => { if (v === 'pea') return true; paste = false; score -= 0.15; log.push(T('перегрев', 'перегрів', 'runs hot')); return 'bad'; },
    }),
    // 3. memory slots (two of four)
    () => {
      let chosen = [];
      return {
        h: T('Оперативная память', 'Оперативна памʼять', 'Memory'),
        d: T('Две планки — в какие слоты, чтобы заработал двухканальный режим? Выберите два.', 'Дві планки — у які слоти, щоб запрацював двоканальний режим? Оберіть два.', 'Two sticks — which slots give dual channel? Pick two.'),
        stage: `<div class="pcb-slots">${['A1', 'A2', 'B1', 'B2'].map((s) => `<button class="pcb-slot" data-v="${s}">${s}</button>`).join('')}</div>`,
        ctl: `<p class="small m">${T('Подсказка на плате мелким шрифтом: «DIMM_A2 / DIMM_B2 first»', 'Підказка на платі дрібним шрифтом: «DIMM_A2 / DIMM_B2 first»', 'Tiny print on the board: “DIMM_A2 / DIMM_B2 first”')}</p>`,
        multi: (v, el) => { if (chosen.includes(v)) return null; chosen.push(v); el.classList.add('on'); if (chosen.length < 2) return null; const ok = chosen.includes('A2') && chosen.includes('B2'); if (!ok) { dual = false; score -= 0.1; log.push(T('одноканал', 'одноканал', 'single channel')); } return ok || 'bad'; },
      };
    },
    // 4. power cables
    () => {
      const cables = shuf([['24', T('24‑pin', '24‑pin', '24‑pin'), 'mb'], ['8cpu', T('8‑pin CPU (4+4)', '8‑pin CPU (4+4)', '8‑pin CPU (4+4)'), 'cpu'], ...(hasGpu ? [['pcie', 'PCIe 8‑pin', 'gpu']] : []), ...(!nvme ? [['sata', 'SATA', 'drive']] : [])]);
      let i = 0;
      const dest = [['mb', T('Правый край платы', 'Правий край плати', 'Right edge of the board')], ['cpu', T('Верх платы, у процессора', 'Верх плати, біля процесора', 'Top of the board, by the CPU')], ['gpu', T('Видеокарта', 'Відеокарта', 'Graphics card')], ['drive', T('Накопитель', 'Накопичувач', 'Drive')]].filter(([k]) => cables.some((c) => c[2] === k));
      return {
        h: T('Кабели питания', 'Кабелі живлення', 'Power cables'),
        d: () => T(`Куда подключить ${cables[i][1]}?`, `Куди підключити ${cables[i][1]}?`, `Where does the ${cables[i][1]} go?`),
        stage: () => `<div class="pcb-big">🔌</div><div class="pcb-cable">${cables[i][1]}</div><div class="small m">${i + 1} / ${cables.length}</div>`,
        ctl: `<div class="pcb-col">${dest.map(([k, t]) => `<button class="btn dark block" data-v="${k}">${t}</button>`).join('')}</div>`,
        pick: (v) => { if (v !== cables[i][2]) { score -= 0.08; return 'retry'; } i++; return i >= cables.length ? true : 'next'; },
      };
    },
    // 5. first power-on
    () => ({
      h: T('Первый запуск', 'Перший запуск', 'First power‑on'),
      d: T('Жмём кнопку и смотрим на POST.', 'Тиснемо кнопку й дивимося на POST.', 'Press the button and watch POST.'),
      stage: `<div class="pcb-big">⏻</div>`,
      ctl: `<button class="btn block" data-v="on">${T('Включить', 'Увімкнути', 'Power on')}</button>`,
      pick: () => true,
    }),
  ];
  const steps0 = steps.slice();
  // laptops and consoles have their own steps
  const choice = (h, d, big, opts) => () => ({ h, d, stage: `<div class="pcb-big">${big}</div>`, ctl: `<div class="pcb-col">${shuf(opts).map(([v, t]) => `<button class="btn dark block" data-v="${v}">${t}</button>`).join('')}</div>`, pick: (v) => { const o = opts.find((x) => x[0] === v); if (o[2]) return true; score -= o[3] || 0.15; if (o[4]) log.push(o[4]); return 'bad'; } });
  const match = (h, pairs, dests) => () => { let i = 0; const cs = shuf(pairs); return { h, d: () => T(`Куда подключить: ${cs[i][1]}?`, `Куди підключити: ${cs[i][1]}?`, `Where does ${cs[i][1]} go?`), stage: () => `<div class="pcb-big">🔌</div><div class="pcb-cable">${cs[i][1]}</div><div class="small m">${i + 1} / ${cs.length}</div>`, ctl: `<div class="pcb-col">${dests.map(([k, t]) => `<button class="btn dark block" data-v="${k}">${t}</button>`).join('')}</div>`, pick: (v) => { if (v !== cs[i][2]) { score -= 0.07; return 'retry'; } i++; return i >= cs.length ? true : 'next'; } }; };
  const power = () => ({ h: T('Первый запуск', 'Перший запуск', 'First power‑on'), d: T('Жмём кнопку питания.', 'Тиснемо кнопку живлення.', 'Press the power button.'), stage: `<div class="pcb-big">⏻</div>`, ctl: `<button class="btn block" data-v="on">${T('Включить', 'Увімкнути', 'Power on')}</button>`, pick: () => true });
  if (kind === 'laptop') {
    steps.length = 0;
    steps.push(
      choice(T('Аккумулятор', 'Акумулятор', 'Battery'), T('Когда подключать батарею к плате?', 'Коли підключати батарею до плати?', 'When does the battery get connected?'), '🔋', [['last', T('В самом конце, когда всё собрано', 'У самому кінці, коли все зібрано', 'Last, once everything is in'), true], ['first', T('Сразу — чтобы проверить плату', 'Одразу — щоб перевірити плату', 'Right away — to test the board'), false, 0.35, T('коротнули плату', 'коротнули плату', 'shorted the board')], ['any', T('Без разницы', 'Без різниці', 'Doesn’t matter'), false, 0.2, T('искра на разъёме', 'іскра на розʼємі', 'a spark on the connector')]]),
      steps0[1],
      choice(T('Шлейф матрицы', 'Шлейф матриці', 'Display cable'), T('Как вставить шлейф экрана в разъём?', 'Як вставити шлейф екрана в розʼєм?', 'How does the display cable go in?'), '🖥', [['latch', T('Поднять фиксатор, вставить до упора, опустить', 'Підняти фіксатор, вставити до упору, опустити', 'Lift the latch, insert fully, close it'), true], ['push', T('Просто вдавить пальцем', 'Просто вдавити пальцем', 'Just press it in'), false, 0.15, T('полосы на экране', 'смуги на екрані', 'lines on the screen')], ['solder', T('Припаять для надёжности', 'Припаяти для надійності', 'Solder it to be safe'), false, 0.25, T('испорчен разъём', 'зіпсовано розʼєм', 'ruined the connector')]]),
      choice(T('Винты поддона', 'Гвинти піддону', 'Bottom screws'), T('Винты разной длины. Куда какие?', 'Гвинти різної довжини. Куди які?', 'Screws of different lengths. Which go where?'), '🪛', [['map', T('Длинные — в петли, короткие — по краю поддона', 'Довгі — у петлі, короткі — по краю піддону', 'Long ones in the hinges, short ones along the edge'), true], ['any', T('Куда попало, все одинаковые', 'Куди завгодно, усі однакові', 'Anywhere, they’re all the same'), false, 0.15, T('пробит корпус под клавиатурой', 'пробито корпус під клавіатурою', 'punched through under the keyboard')], ['half', T('Половину не ставить — и так держится', 'Половину не ставити — і так тримається', 'Skip half — it holds anyway'), false, 0.1, T('скрипит корпус', 'скрипить корпус', 'creaky body')]]),
      power,
    );
  } else if (kind === 'console') {
    steps.length = 0;
    steps.push(
      choice(T('Термоинтерфейс', 'Термоінтерфейс', 'Thermal interface'), T('На чипе стоял жидкий металл. Что делаем?', 'На чипі стояв рідкий метал. Що робимо?', 'The chip had liquid metal. What now?'), '💧', [['lm', T('Жидкий металл тонко, с изоляцией вокруг чипа', 'Рідкий метал тонко, з ізоляцією навколо чипа', 'Thin liquid metal with insulation around the chip'), true], ['paste', T('Обычную термопасту горошиной', 'Звичайну термопасту горошиною', 'Regular paste, a pea'), false, 0.06, T('греется сильнее', 'гріється сильніше', 'runs warmer')], ['lots', T('Жидкий металл щедро, побольше', 'Рідкий метал щедро, побільше', 'Lots of liquid metal'), false, 0.4, T('металл затёк на плату', 'метал затік на плату', 'metal leaked on the board')], ['none', T('Ничего — и так сойдёт', 'Нічого — і так зійде', 'Nothing, it’ll do'), false, 0.3, T('перегрев', 'перегрів', 'overheats')]]),
      match(T('Шлейфы и разъёмы', 'Шлейфи й розʼєми', 'Cables and connectors'), [['d', T('Шлейф привода', 'Шлейф приводу', 'Drive ribbon'), 'drive'], ['p', T('Питание 2‑pin', 'Живлення 2‑pin', '2‑pin power'), 'psu'], ['f', T('Разъём вентилятора', 'Розʼєм вентилятора', 'Fan plug'), 'fan'], ['b', T('Шлейф кнопок', 'Шлейф кнопок', 'Button ribbon'), 'front']], [['drive', T('Привод', 'Привід', 'Drive')], ['psu', T('Блок питания', 'Блок живлення', 'Power supply')], ['fan', 'FAN'], ['front', T('Передняя панель', 'Передня панель', 'Front panel')]]),
      choice(T('Корпус', 'Корпус', 'Shell'), T('Как вернуть боковые панели?', 'Як повернути бокові панелі?', 'How do the side panels go back?'), '🎮', [['slide', T('Сдвинуть до щелчка, без силы', 'Зсунути до клацання, без сили', 'Slide until they click, no force'), true], ['press', T('Надавить посильнее', 'Натиснути сильніше', 'Push harder'), false, 0.15, T('сломана защёлка', 'зламано засувку', 'broke a clip')], ['glue', T('Посадить на клей', 'Посадити на клей', 'Glue them'), false, 0.2, T('корпус на клею', 'корпус на клею', 'glued shell')]]),
      power,
    );
  }
  let cur = null;
  const draw = () => {
    cur ||= steps[step]();
    const d = typeof cur.d === 'function' ? cur.d() : cur.d, st = typeof cur.stage === 'function' ? cur.stage() : cur.stage;
    api.body.innerHTML = `<div class="proc"><div class="phd"><h3>${step + 1}/${steps.length} · ${esc(cur.h)}</h3><p class="pdesc">${esc(d)}</p></div><div class="pstage pcb-stage">${st}</div><div class="pctl">${cur.ctl}</div></div>`;
    api.body.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => {
      if (api.ended) return;
      const r = cur.multi ? cur.multi(b.dataset.v, b) : cur.pick(b.dataset.v);
      if (r === null) return;
      if (r === 'retry') { api.sfx('err'); api.flash(false); api.shake(b); return; }
      if (r === 'next') { api.sfx('ok'); draw(); return; }
      api.sfx(r === true ? 'ok' : 'err'); api.flash(r === true);
      step++; cur = null;
      if (step >= steps.length) return finish();
      setTimeout(draw, r === true ? 150 : 450);
    }));
  };
  const finish = () => {
    if (dead) return api.end({ score: 0, emoji: '💀', title: T('Не стартует', 'Не стартує', 'No POST'), text: T('Вентиляторы крутятся, экрана нет. Одна из деталей мертва.', 'Вентилятори крутяться, екрана немає. Одна з деталей мертва.', 'Fans spin, no picture. One of the parts is dead.'), dead: true, pins, dual, paste });
    const q = Math.max(0.4, score);
    api.end({ score: q, emoji: q >= 0.95 ? '🖥' : '🛠', title: q >= 0.95 ? T('Собрано идеально!', 'Зібрано ідеально!', 'A perfect build!') : T('Собрано', 'Зібрано', 'Built'), text: log.length ? T('Проблемы: ', 'Проблеми: ', 'Issues: ') + log.join(', ') : T('BIOS видит всё, температуры в норме.', 'BIOS бачить усе, температури в нормі.', 'BIOS sees everything, temps are fine.'), pins, dual, paste });
  };
  api.setTime(90, () => finish(), { optional: true });
  draw();
}
export const PC_GAMES = { assemble: assembleGame };
