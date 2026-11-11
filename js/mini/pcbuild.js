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

export function assembleGame(api, { cpuName = 'CPU', hasGpu = true, nvme = false, dead = null }) {
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
  let cur = null;
  const draw = () => {
    cur ||= steps[step]();
    const d = typeof cur.d === 'function' ? cur.d() : cur.d, st = typeof cur.stage === 'function' ? cur.stage() : cur.stage;
    api.body.innerHTML = `<div class="proc"><div class="phd"><h3>${step + 1}/5 · ${esc(cur.h)}</h3><p class="pdesc">${esc(d)}</p></div><div class="pstage pcb-stage">${st}</div><div class="pctl">${cur.ctl}</div></div>`;
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
  api.setTime(90, () => finish());
  draw();
}
export const PC_GAMES = { assemble: assembleGame };
