// PC hardware business: parts and their specs, compatibility, build score, buyers' build orders,
// your own workstation ("My PC"), reinstalling operating systems from a flash drive, the hardware store.
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { RNG } from '../core/rng.js';
import { uid, clamp } from '../core/util.js';
import { MODEL, BY_CAT, DEFECTS } from '../data/catalog.js';
import { GPU_SPEC } from '../data/models_pc.js';
import { makeItem, itemValue, itemTitle } from './items.js';
import { getItem, removeItem, addItem, earn, charge, spend, addXP, addReview, notify, stat, canStore } from './player.js';
import { storageKind } from './files.js';
import { deliveryTime } from './market.js';
import { stockOf, addPart, takePart } from './workshop.js';
import { partPrice, partKey, PART_NAMES, QUALITY } from '../data/parts.js';
import { slowK } from './pcvirus.js';
import { fmt, nicePrice } from '../core/money.js';

export const SLOTS = ['cpu', 'mb', 'ram', 'gpu', 'drive', 'psu', 'case', 'cooler'];
export const SLOT_NAME = {
  cpu: ['Процессор', 'Процесор', 'CPU'], mb: ['Материнская плата', 'Материнська плата', 'Motherboard'], ram: ['Оперативная память', 'Оперативна памʼять', 'Memory'],
  gpu: ['Видеокарта', 'Відеокарта', 'Graphics card'], drive: ['Накопитель', 'Накопичувач', 'Drive'], psu: ['Блок питания', 'Блок живлення', 'Power supply'],
  case: ['Корпус', 'Корпус', 'Case'], cooler: ['Охлаждение', 'Охолодження', 'Cooling'],
};
export const SLOT_ICON = { cpu: '🔲', mb: '🟩', ram: '📏', gpu: '🎴', drive: '💽', psu: '🔌', case: '🗄', cooler: '🌀' };
// what a part is, for builds
export function specOf(it) {
  const m = MODEL[it?.m];
  if (!m) return null;
  if (m.cat === 'pcparts' && m.pc) return m.pc;
  if (m.art?.t === 'gpu') return { kind: 'gpu', ...(GPU_SPEC[m.id] || { perf: 40, watts: 250 }) };
  if (m.cat === 'storage' && ['ssd', 'nvme', 'hdd', 'hdd25'].includes(m.art?.t)) return { kind: 'drive', ssd: m.art.t === 'ssd' || m.art.t === 'nvme', nvme: m.art.t === 'nvme' };
  return null;
}
export const partsOf = (kind) => G.s.inv.filter((it) => !it.listed && !it.shop && specOf(it)?.kind === kind && !it.auction);
export function specLine(it) {
  const p = specOf(it); if (!p) return '';
  return { cpu: `${p.socket} · ${T('мощность', 'потужність', 'power')} ${p.perf} · TDP ${p.tdp} W`, mb: `${p.socket} · ${p.ram} · ${p.form}`, ram: `${p.ram} · ${p.gb} ${T('ГБ', 'ГБ', 'GB')}`, gpu: `${T('мощность', 'потужність', 'power')} ${p.perf} · ${p.watts} W`, drive: p.nvme ? 'NVMe SSD' : p.ssd ? 'SATA SSD' : 'HDD', psu: `${p.watts} W`, case: p.form === 'ATX' ? 'ATX / mATX / ITX' : p.form === 'mATX' ? 'mATX / ITX' : 'Mini‑ITX', cooler: `${T('до', 'до', 'up to')} ${p.tdp} W` }[p.kind] || '';
}
// compatibility and score for a set of chosen parts { slot: itemId }
export function checkBuild(sel) {
  const P = {};
  for (const k of SLOTS) { const it = sel[k] && getItem(sel[k]); if (it) P[k] = { it, s: specOf(it) }; }
  return checkP(P);
}
// compatibility + score for parts given as { slot: { it, s } } (it may be just { m })
export function checkP(P) {
  const rows = [];
  const row = (ok, t) => rows.push({ ok, t });
  const need = ['cpu', 'mb', 'ram', 'drive', 'psu', 'case', 'cooler'];
  const missing = need.filter((k) => !P[k]);
  if (P.cpu && P.mb) row(P.cpu.s.socket === P.mb.s.socket, T(`Сокет: процессор ${P.cpu.s.socket}, плата ${P.mb.s.socket}`, `Сокет: процесор ${P.cpu.s.socket}, плата ${P.mb.s.socket}`, `Socket: CPU ${P.cpu.s.socket}, board ${P.mb.s.socket}`));
  if (P.ram && P.mb) row(P.ram.s.ram === P.mb.s.ram, T(`Память ${P.ram.s.ram}, плата под ${P.mb.s.ram}`, `Памʼять ${P.ram.s.ram}, плата під ${P.mb.s.ram}`, `RAM ${P.ram.s.ram}, board takes ${P.mb.s.ram}`));
  const FR = { ITX: 0, mATX: 1, ATX: 2 };
  if (P.case && P.mb) row(FR[P.case.s.form] >= FR[P.mb.s.form], T(`Плата ${P.mb.s.form} в корпус ${P.case.s.form}`, `Плата ${P.mb.s.form} у корпус ${P.case.s.form}`, `${P.mb.s.form} board in a ${P.case.s.form} case`));
  if (P.cooler && P.cpu) row(P.cooler.s.tdp >= P.cpu.s.tdp, T(`Кулер тянет ${P.cooler.s.tdp} W, процессор греется на ${P.cpu.s.tdp} W`, `Кулер тягне ${P.cooler.s.tdp} W, процесор гріється на ${P.cpu.s.tdp} W`, `Cooler handles ${P.cooler.s.tdp} W, CPU puts out ${P.cpu.s.tdp} W`));
  const draw = (P.cpu?.s.tdp || 0) + (P.gpu?.s.watts || 0) + 90;
  if (P.psu) row(P.psu.s.watts >= draw, T(`Блок ${P.psu.s.watts} W, системе нужно ~${draw} W`, `Блок ${P.psu.s.watts} W, системі треба ~${draw} W`, `PSU ${P.psu.s.watts} W, system needs ~${draw} W`));
  const ok = !missing.length && rows.every((r) => r.ok);
  return { ok, rows, missing, P, score: scoreOf(P), draw };
}
export function scoreOf(P) {
  if (!P.cpu) return 0;
  let s = P.gpu ? P.cpu.s.perf * 0.45 + P.gpu.s.perf * 0.55 : P.cpu.s.perf * 0.5;
  const gb = P.ram?.s.gb || 0;
  s *= gb >= 64 ? 1.08 : gb >= 32 ? 1.05 : gb >= 16 ? 1 : gb >= 8 ? 0.85 : 0.6;
  if (P.drive && !P.drive.s.ssd) s *= 0.9;
  return Math.round(s);
}
// turn the parts into one PC (after the assembly mini-game)
export function assemble(sel, res) {
  const s = G.s, chk = checkBuild(sel);
  if (!chk.ok) return { ok: false, msg: T('Сборка не сходится', 'Збірка не сходиться', 'The build doesn’t fit together') };
  const parts = Object.entries(chk.P);
  // a dead part shows up at the first power-on
  const dead = parts.find(([, x]) => x.it.defects.some((d) => d.c === 'x_dead' || d.c === 's_dead' || d.c === 'e_dead'));
  if (dead) { for (const d of dead[1].it.defects) if (['x_dead', 's_dead', 'e_dead'].includes(d.c)) d.known = true; emit('inv'); return { ok: false, dead: dead[1].it, msg: T(`Не стартует: виноват ${L(SLOT_NAME[dead[0]]).toLowerCase()} — ${itemTitle(dead[1].it)}`, `Не стартує: винен ${L(SLOT_NAME[dead[0]]).toLowerCase()} — ${itemTitle(dead[1].it)}`, `No POST: the ${L(SLOT_NAME[dead[0]]).toLowerCase()} is dead — ${itemTitle(dead[1].it)}`) }; }
  if (res.pins) { const cpu = chk.P.cpu.it; if (!cpu.defects.some((d) => d.c === 'x_pins')) cpu.defects.push({ c: 'x_pins', x: 0.5, y: 0.5, view: 'front', known: true }); }
  const q = clamp(res.score ?? 1, 0.4, 1);
  const base = parts.reduce((a, [, x]) => a + itemValue(x.it, s.player.city, 'true', { raw: true }), 0);
  const it = makeItem(new RNG(uid('pc')), { model: 'electronics_сборка_пк', quality: 'new' });
  it.sealed = false; it.box = false; it.docs = false; it.defects = []; it.cond = Math.round(80 + q * 18); it.rar = 0; it.fake = 0;
  const g = (k) => chk.P[k] && itemTitle(chk.P[k].it, false);
  it.build = { base: base * 1.12 * (0.85 + q * 0.15), score: Math.round(chk.score * (res.dual === false ? 0.92 : 1)), cpu: g('cpu'), gpu: g('gpu'), ram: chk.P.ram.s.gb, ssd: !!chk.P.drive.s.ssd, parts: parts.map(([k, x]) => ({ k, m: x.it.m, t: itemTitle(x.it, false), v: Math.round(itemValue(x.it, s.player.city, 'true', { raw: true })) })), q: +q.toFixed(2) };
  it.paid = parts.reduce((a, [, x]) => a + (x.it.paid || 0), 0);
  it.os = 'win11';
  for (const [, x] of parts) removeItem(x.it.id);
  addItem(it, it.paid, 'build');
  stat('pcBuilt'); addXP(20 + Math.round(chk.score / 4));
  emit('inv');
  return { ok: true, it };
}
export const buildTitle = (it) => `${T('ПК', 'ПК', 'PC')} · ${it.build.cpu}${it.build.gpu ? ' / ' + it.build.gpu : ''} / ${it.build.ram} ${T('ГБ', 'ГБ', 'GB')}`;

// ---------------------------------------------------------------- buyers' orders
const ORDER_KINDS = [
  { k: 'office', perf: 18, ram: 8, gpu: false, budget: [340, 520], w: 3, txt: [['Нужен комп для учёбы и офиса: браузер, Word, Zoom. Без наворотов.', 'Потрібен комп для навчання й офісу: браузер, Word, Zoom. Без наворотів.', 'Need a PC for school and office: browser, Word, Zoom. Nothing fancy.'], ['Маме для сериалов и почты, чтобы не тормозил.', 'Мамі для серіалів і пошти, щоб не гальмував.', 'For my mum: shows and email, no lag.']] },
  { k: 'gaming', perf: 40, ram: 16, gpu: true, budget: [950, 1300], w: 3, txt: [['Игровой ПК под Full HD, чтобы CS2 и Fortnait летали.', 'Ігровий ПК під Full HD, щоб CS2 і Fortnait літали.', 'A Full HD gaming PC, CS2 and Fortnait must fly.'], ['Сыну на день рождения, игровой, с подсветкой бы.', 'Синові на день народження, ігровий, з підсвіткою б.', 'For my son’s birthday, a gaming one, RGB would be nice.']] },
  { k: 'stream', perf: 60, ram: 32, gpu: true, budget: [1600, 2250], w: 2, txt: [['Комп для монтажа и стримов. 32 ГБ обязательно.', 'Комп для монтажу й стрімів. 32 ГБ обовʼязково.', 'A PC for editing and streaming. 32 GB is a must.'], ['Работаю в 3D, нужен мощный, но в рамках бюджета.', 'Працюю в 3D, потрібен потужний, але в межах бюджету.', 'I do 3D, need something strong within budget.']] },
  { k: 'top', perf: 85, ram: 32, gpu: true, budget: [2900, 3900], w: 1, txt: [['Топовый ПК под 4K, деньги не проблема.', 'Топовий ПК під 4K, гроші не проблема.', 'A top 4K rig, money is no object.']] },
];
const BUYERS = ['Артём', 'Илья', 'Настя', 'Денис', 'Влад', 'Катя', 'Олег', 'Максим', 'Лена', 'Тимур', 'Света', 'Гоша'];
export function pcState() { const s = G.s; s.pc ||= { orders: [], ships: [], nextOrder: s.t + 1, mine: null }; return s.pc; }
export function pcTick() {
  const s = G.s, st = pcState();
  st.orders = st.orders.filter((o) => o.exp > s.t);
  if (s.t >= st.nextOrder && st.orders.length < 4) {
    const r = new RNG(`pco|${s.t}|${s.id}`);
    const k = r.weighted(ORDER_KINDS, (x) => x.w);
    st.orders.push({ id: uid('po'), who: r.pick(BUYERS), k: k.k, need: { perf: k.perf, ram: k.ram, gpu: k.gpu, ssd: true }, budget: Math.round(r.float(k.budget[0], k.budget[1])), text: r.pick(k.txt), at: s.t, exp: s.t + r.int(600, 1400) });
    st.nextOrder = s.t + r.int(40, 160);
    emit('pc');
  }
  // shipped builds: paid when the buyer gets them
  const due = st.ships.filter((x) => x.eta <= s.t);
  if (due.length) {
    st.ships = st.ships.filter((x) => x.eta > s.t);
    for (const x of due) {
      earn(x.pay, 'sale', T(`Сборка для ${x.who}`, `Збірка для ${x.who}`, `Build for ${x.who}`));
      const over = x.score >= x.need * 1.25;
      addReview(5, over ? T('Комп летает, даже мощнее, чем просил! Спасибо!', 'Комп літає, навіть потужніший, ніж просив! Дякую!', 'Flies, even faster than I asked! Thanks!') : T('Всё как договаривались, собрано аккуратно.', 'Усе як домовлялися, зібрано акуратно.', 'Exactly as agreed, neatly built.'), { buyer: x.who, fair: true });
      notify('build', T('Покупатель получил ПК', 'Покупець отримав ПК', 'The buyer got the PC'), `${x.who}: +${fmt(x.pay)}`);
      stat('pcSold'); stat('sold');
    }
    emit('pc');
  }
}
export function meets(it, o) {
  const b = it?.build; if (!b) return { ok: false, rows: [] };
  const rows = [
    { ok: b.score >= o.need.perf, t: T(`Мощность ${b.score} из нужных ${o.need.perf}`, `Потужність ${b.score} з потрібних ${o.need.perf}`, `Power ${b.score} of ${o.need.perf}`) },
    { ok: b.ram >= o.need.ram, t: T(`Память ${b.ram} ГБ из ${o.need.ram}`, `Памʼять ${b.ram} ГБ з ${o.need.ram}`, `RAM ${b.ram} GB of ${o.need.ram}`) },
    { ok: !o.need.gpu || !!b.gpu, t: T('Видеокарта', 'Відеокарта', 'Graphics card') },
    { ok: b.ssd, t: 'SSD' },
  ];
  return { ok: rows.every((r) => r.ok), rows };
}
export const SHIP_FEE = 9; // ≈ 800 ₽
export function shipToOrder(orderId, itemId) {
  const s = G.s, st = pcState();
  const o = st.orders.find((x) => x.id === orderId), it = getItem(itemId);
  if (!o || !it) return { ok: false };
  if (!meets(it, o).ok) return { ok: false, msg: T('Сборка не подходит под заказ', 'Збірка не підходить під замовлення', 'The build doesn’t match the order') };
  if (!spend(SHIP_FEE, 'service', T('Доставка ПК', 'Доставка ПК', 'PC shipping'))) return { ok: false, msg: T('Не хватает на доставку', 'Не вистачає на доставку', 'Can’t afford shipping') };
  if (st.mine === it.id) st.mine = null;
  removeItem(it.id);
  st.orders = st.orders.filter((x) => x !== o);
  st.ships.push({ id: uid('ps'), who: o.who, pay: o.budget, score: it.build.score, need: o.need.perf, eta: s.t + deliveryTime(s.player.city, s.player.city), title: buildTitle(it), paid: it.paid || 0 });
  addXP(10);
  emit('pc'); emit('inv');
  return { ok: true };
}

// ---------------------------------------------------------------- my PC (your workstation)
export const STARTER_PC = { name: ['Старый ноутбук', 'Старий ноутбук', 'Old laptop'], spec: 'Celeron N4020 · 4 ГБ · HDD', speed: 1 };
export function myPc() {
  const st = pcState(), it = st.mine && getItem(st.mine);
  if (!it) return { ...STARTER_PC, name: L(STARTER_PC.name), item: null };
  const sc = it.build ? it.build.score : laptopScore(it);
  return { name: it.build ? buildTitle(it) : itemTitle(it), spec: it.build ? `${it.build.ram} ${T('ГБ', 'ГБ', 'GB')} · ${it.build.ssd ? 'SSD' : 'HDD'}` : itemTitle(it), speed: +clamp(1 + sc / 32, 1, 4).toFixed(1), item: it };
}
export const laptopScore = (it) => clamp(Math.round((MODEL[it.m]?.price || 500) / 40), 8, 70);
// a hidden miner eats the CPU: everything on the PC gets slower (see pcvirus.js)
export const pcSpeed = () => +(myPc().speed / slowK()).toFixed(2);
export function setMyPc(itemId) { pcState().mine = itemId; emit('pc'); }
export const canBeMyPc = (it) => !!it && (it.build || ['laptop', 'box'].includes(MODEL[it.m]?.art?.t) || /iMak/.test(MODEL[it.m]?.name || ''));

// ---------------------------------------------------------------- operating systems
export const OS = {
  macos: { n: 'macOS', mult: 1 }, win11: { n: 'Windows 11', mult: 1.03 }, win10: { n: 'Windows 10', mult: 1.02 }, linux: { n: 'Linux', mult: 1 },
  win8: { n: 'Windows 8', mult: 0.97 }, win7: { n: 'Windows 7', mult: 0.93 },
};
export const isComputer = (it) => !!it && (!!it.build || ['laptop', 'box'].includes(MODEL[it.m]?.art?.t) || /iMak/.test(MODEL[it.m]?.name || ''));
export function osOf(it) {
  if (it.os) return it.os;
  const m = MODEL[it.m] || {};
  if (/Mac|iMak/.test(m.name) || m.brand === 'Pear') return 'macos';
  const r = new RNG(`os|${it.seed}`);
  const y = it.year || m.year || 2020;
  return y >= 2022 ? r.pick(['win11', 'win11', 'win10']) : y >= 2016 ? r.pick(['win10', 'win10', 'win11', 'linux']) : r.pick(['win7', 'win8', 'win10']);
}
export const bootBroken = (it) => (it.defects || []).some((d) => d.c === 'e_os');
// a flash drive for the installer: at least 8 GB, yours, not for sale
export function installerDrive() {
  return G.s.inv.find((it) => ['usb', 'secure'].includes(storageKind(it)) && !it.listed && !it.shop && !(it.defects || []).some((d) => ['s_dead', 's_click'].includes(d.c)) && capOk(it));
}
const capOk = (it) => { const m = MODEL[it.m]; if (m.fakeCap) return true; const g = (m.name.match(/(\d+)\s*(ГБ|GB)/) || [])[1]; return !g || +g >= 8; };
export function reinstall(it, os) {
  const drive = installerDrive();
  if (!drive) return { ok: false, msg: T('Нужна флешка от 8 ГБ', 'Потрібна флешка від 8 ГБ', 'You need an 8 GB+ flash drive') };
  if (/Mac|iMak/.test(MODEL[it.m]?.name || '') === false && os === 'macos') return { ok: false, msg: T('macOS ставится только на Mac', 'macOS ставиться лише на Mac', 'macOS only installs on a Mac') };
  const fixed = bootBroken(it);
  it.defects = it.defects.filter((d) => d.c !== 'e_os');
  it.os = os;
  (it.data ||= {}).wiped = true; // a clean install wipes the old files
  (drive.data ||= {}).wiped = true; // the installer overwrote the stick
  stat('osInstalled'); addXP(fixed ? 12 : 6);
  emit('inv');
  return { ok: true, fixed, drive };
}
export const installSeconds = () => Math.max(2.5, 9 / pcSpeed());

// ---------------------------------------------------------------- hardware store ("Hardware week")
export const HW_CATS = [['cpu', '🔲'], ['mb', '🟩'], ['gpu', '🎴'], ['ram', '📏'], ['drive', '💽'], ['case', '🗄'], ['cooler', '🌀'], ['psu', '🔌'], ['usb', '🔌']];
export const HW_CAT_NAME = { ...SLOT_NAME, drive: ['Накопители', 'Накопичувачі', 'Drives'], usb: ['Флешки', 'Флешки', 'Flash drives'], cpu: ['Процессоры', 'Процесори', 'CPUs'], mb: ['Материнки', 'Материнки', 'Motherboards'], gpu: ['Видеокарты', 'Відеокарти', 'Graphics'], ram: ['Память', 'Памʼять', 'Memory'], case: ['Корпуса', 'Корпуси', 'Cases'], cooler: ['Охлаждение', 'Охолодження', 'Cooling'], psu: ['Блоки питания', 'Блоки живлення', 'PSUs'] };
const HW_MODELS = () => {
  const pc = BY_CAT.pcparts || [];
  const gpu = (BY_CAT.electronics || []).filter((m) => m.art?.t === 'gpu');
  const drives = (BY_CAT.storage || []).filter((m) => ['ssd', 'nvme', 'hdd'].includes(m.art?.t) && m.year >= 2016);
  const usb = (BY_CAT.storage || []).filter((m) => m.art?.t === 'usb' && m.year >= 2015 && !m.fakeCap);
  return [...pc, ...gpu, ...drives, ...usb];
};
export const hwKind = (m) => (m.cat === 'pcparts' ? m.pc.kind : m.art?.t === 'gpu' ? 'gpu' : m.art?.t === 'usb' ? 'usb' : 'drive');
export function hwStore() {
  const s = G.s;
  if (s.hw && s.hw.until > s.t && s.hw.city === s.player.city) return s.hw;
  const r = new RNG(`hw|${s.id}|${Math.floor(s.t / 1440)}|${s.player.city}`);
  const items = HW_MODELS().map((m) => {
    const it = makeItem(new RNG(`hwi|${m.id}|${Math.floor(s.t / 1440)}`), { model: m.id, quality: 'new', fakeMult: 0, lockRate: 0 });
    it.sealed = true; it.cond = 100; it.defects = []; it.fake = 0; it.rar = 0;
    const v = itemValue(it, s.player.city, 'true');
    const off = r.chance(0.3) ? r.int(8, 45) : 0;
    return { id: m.id, kind: hwKind(m), old: nicePrice(v * 1.12), price: nicePrice(v * 1.12 * (1 - off / 100)), off, rating: +(r.float(4.3, 4.9)).toFixed(1), reviews: r.int(40, 4000), stock: r.int(1, 9) };
  });
  s.hw = { until: s.t + 1440 - (s.t % 1440), city: s.player.city, items };
  return s.hw;
}
export function buyHw(id) {
  const s = G.s, x = hwStore().items.find((y) => y.id === id);
  if (!x || x.stock <= 0) return { ok: false, msg: T('Нет в наличии', 'Немає в наявності', 'Out of stock') };
  if (!spend(x.price, 'buy', itemTitle({ m: id, v: 0 }))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  x.stock--;
  const it = makeItem(new RNG(uid('hwb')), { model: id, quality: 'new', fakeMult: 0, lockRate: 0 });
  it.sealed = true; it.cond = 100; it.defects = []; it.fake = 0; it.paid = x.price;
  s.deliveries.push({ id: uid('d'), kind: 'in', item: it, from: s.player.city, to: s.player.city, start: s.t, eta: s.t + Math.round(deliveryTime(s.player.city, s.player.city) * 0.6), price: x.price, who: T('Магазин железа', 'Магазин заліза', 'Hardware store') });
  stat('bought');
  emit('deliveries');
  return { ok: true };
}

// ---------------------------------------------------------------- laptops and consoles from parts
// Donors you dismantle in the Workshop give used parts; new originals and copies can be bought too.
export const DEVICE_RECIPES = {
  laptop: ['board', 'display', 'battery', 'keyboard', 'hinge', 'fan', 'frame'],
  console: ['board', 'drive', 'psu', 'fan', 'hdmi', 'frame', 'stick'],
};
export const DEVICE_MODELS = (kind) => (kind === 'laptop' ? BY_CAT.electronics.filter((m) => m.art?.t === 'laptop') : (BY_CAT.consoles || []).filter((m) => m.year >= 2000)).slice().sort((a, b) => b.year - a.year);
const QK = { orig: 1, copy: 0.82, used: 0.78 };
export function devStock(modelId, kind) { const st = stockOf(partKey(modelId, kind)); return st; }
export const bestQ = (st) => (st.orig ? 'orig' : st.copy ? 'copy' : st.used ? 'used' : null);
export function devReady(dkind, modelId) {
  const rows = DEVICE_RECIPES[dkind].map((k) => ({ k, st: devStock(modelId, k), q: bestQ(devStock(modelId, k)) }));
  const optional = dkind === 'console' ? ['stick'] : [];
  return { rows, ok: rows.every((r) => r.q || optional.includes(r.k)), have: rows.filter((r) => r.q).length };
}
export function buyDevPart(modelId, kind, q) {
  const price = partPrice(modelId, kind, q);
  if (!spend(price, 'repair', `${L(PART_NAMES[kind])} · ${L(QUALITY[q].n)}`)) return false;
  addPart(partKey(modelId, kind), q);
  stat('partsBought');
  return true;
}
export function assembleDevice(dkind, modelId, res) {
  const s = G.s, r = devReady(dkind, modelId);
  if (!r.ok) return { ok: false, msg: T('Не хватает деталей', 'Не вистачає деталей', 'Missing parts') };
  const used = r.rows.filter((x) => x.q);
  for (const x of used) takePart(partKey(modelId, x.k), x.q);
  const avg = used.reduce((a, x) => a + QK[x.q], 0) / used.length;
  const it = makeItem(new RNG(uid('dev')), { model: modelId, quality: 'good', fakeMult: 0, lockRate: 0 });
  it.sealed = false; it.box = false; it.docs = false; it.defects = []; it.fake = 0; it.rar = 0; it.lock = null;
  it.cond = Math.round(clamp(55 + 42 * avg * (res.score ?? 1), 40, 97));
  it.refurb = true;
  it.paid = used.reduce((a, x) => a + partPrice(modelId, x.k, x.q), 0);
  if (dkind === 'laptop') it.defects.push({ c: 'e_os', x: 0.5, y: 0.5, view: 'front', known: true }); // a fresh board has no system yet
  if (dkind === 'console' && !used.some((x) => x.k === 'stick')) it.noPad = true;
  addItem(it, it.paid, 'build');
  stat(dkind === 'laptop' ? 'laptopsBuilt' : 'consolesBuilt'); addXP(18);
  emit('inv'); emit('parts');
  return { ok: true, it };
}

// ---------------------------------------------------------------- servicing a built PC: swap a part, strip it down
const partsMapOf = (pc) => Object.fromEntries((pc.build?.parts || []).map((x) => [x.k, { it: { m: x.m }, s: specOf({ m: x.m }) }]));
function rebuildStats(pc) {
  const P = partsMapOf(pc), chk = checkP(P);
  const b = pc.build, q = b.q ?? 0.9;
  const g = (k) => P[k] && itemTitle({ m: P[k].it.m, v: 0 }, false);
  b.base = b.parts.reduce((a, x) => a + (x.v || 0), 0) * 1.12 * (0.85 + q * 0.15);
  b.score = chk.score; b.cpu = g('cpu'); b.gpu = g('gpu'); b.ram = P.ram?.s.gb || 0; b.ssd = !!P.drive?.s.ssd;
  return chk;
}
// which parts in storage could go into this slot
export const swapCandidates = (pc, slot) => partsOf(slot).filter((it) => it.id !== pc.id);
export function swapPart(pcId, slot, newId) {
  const s = G.s, pc = getItem(pcId), nw = getItem(newId);
  if (!pc?.build || !nw || specOf(nw)?.kind !== slot) return { ok: false };
  const parts = pc.build.parts, i = parts.findIndex((x) => x.k === slot);
  const P = partsMapOf(pc); P[slot] = { it: nw, s: specOf(nw) };
  const chk = checkP(P);
  const bad = chk.rows.filter((r) => !r.ok);
  if (bad.length) return { ok: false, msg: bad.map((r) => r.t).join('; ') };
  if (nw.defects.some((d) => ['x_dead', 's_dead', 'e_dead'].includes(d.c))) { for (const d of nw.defects) d.known = true; emit('inv'); return { ok: false, msg: T('Новая деталь мёртвая — ПК не стартует. Вернули старую.', 'Нова деталь мертва — ПК не стартує. Повернули стару.', 'The new part is dead — no POST. The old one went back in.') }; }
  // the old part comes out as an item
  if (i >= 0) {
    const old = parts[i];
    const it = makeItem(new RNG(uid('pcold')), { model: old.m, quality: 'good', fakeMult: 0, lockRate: 0 });
    it.sealed = false; it.box = false; it.docs = false; it.defects = []; it.cond = Math.round(clamp(70 + (pc.build.q ?? 0.9) * 25, 60, 96)); it.fake = 0;
    addItem(it, Math.round(old.v * 0.7), 'build');
    parts.splice(i, 1);
  }
  parts.push({ k: slot, m: nw.m, t: itemTitle(nw, false), v: Math.round(itemValue(nw, s.player.city, 'true', { raw: true })) });
  pc.paid = (pc.paid || 0) + (nw.paid || 0);
  removeItem(nw.id);
  rebuildStats(pc);
  stat('pcUpgrades'); addXP(6);
  emit('inv'); emit('pc');
  return { ok: true, score: pc.build.score };
}
export function disassemblePc(pcId) {
  const s = G.s, pc = getItem(pcId);
  if (!pc?.build) return { ok: false };
  const out = [];
  for (const x of pc.build.parts) {
    const it = makeItem(new RNG(uid('pcd')), { model: x.m, quality: 'good', fakeMult: 0, lockRate: 0 });
    it.sealed = false; it.box = false; it.docs = false; it.defects = []; it.cond = Math.round(clamp(72 + (pc.build.q ?? 0.9) * 24, 60, 97)); it.fake = 0;
    addItem(it, Math.round((pc.paid || 0) / Math.max(1, pc.build.parts.length)), 'build');
    out.push(it);
  }
  if (pcState().mine === pc.id) pcState().mine = null;
  removeItem(pc.id);
  stat('pcStripped'); addXP(5);
  emit('inv'); emit('pc');
  return { ok: true, parts: out };
}
// dust, dried thermal paste: cleaning the cooler fixes a noisy fan and cools things down
export function cleanCooler(pcId, q = 1) {
  const pc = getItem(pcId);
  if (!pc) return { ok: false };
  const before = pc.defects.length;
  if (q >= 0.5) pc.defects = pc.defects.filter((d) => !['e_fan', 'x_fan'].includes(d.c));
  pc.cleaned = true;
  emit('inv');
  return { ok: true, fixed: before - pc.defects.length };
}

// ---------------------------------------------------------------- diagnostics (stress test / SMART / BIOS log)
const DIAG = {
  electronics: ['e_fan', 'e_battery', 'e_os', 'e_dead', 'e_keys', 'e_water'],
  pcparts: ['x_dead', 'x_oc', 'x_fan'],
  storage: ['s_bad', 's_slow', 's_click', 's_dead'],
  consoles: ['c_drive', 'c_hdmi', 'c_fan', 'c_dead', 'c_ban'],
};
export const diagTargets = () => G.s.inv.filter((it) => !it.listed && (isComputer(it) || ['pcparts', 'storage'].includes(it.cat) || specOf(it)));
export function runDiag(it) {
  const pool = DIAG[it.cat] || [];
  const found = [];
  for (const d of it.defects || []) if (!d.known && pool.includes(d.c)) { d.known = true; found.push(d.c); }
  it.diag = true;
  const dead = (it.defects || []).some((d) => ['e_dead', 'x_dead', 's_dead', 'c_dead'].includes(d.c));
  const sc = it.build ? it.build.score : specOf(it)?.perf || laptopScore(it);
  const hot = (it.defects || []).some((d) => ['e_fan', 'x_fan', 'x_oc'].includes(d.c));
  const r = new RNG(`diag|${it.id}`);
  stat('diagRuns');
  emit('inv');
  return { found, dead, score: dead ? 0 : sc, cpuT: dead ? 0 : r.int(hot ? 88 : 58, hot ? 99 : 79), gpuT: dead ? 0 : r.int(hot ? 84 : 55, hot ? 96 : 76) };
}

// ---------------------------------------------------------------- crypto mining on your own PC (needs a graphics card)
export function mineState() { const s = G.s; s.pcmine ||= { on: false, bal: 0, total: 0, hours: 0 }; return s.pcmine; }
export function mineRate() {
  const pc = myPc(), b = pc.item?.build;
  if (!b?.gpu) return null;
  const gpu = b.parts.find((x) => x.k === 'gpu');
  const perf = specOf({ m: gpu?.m })?.perf || 40;
  const income = perf * 0.009, power = 0.04 + perf * 0.0032;
  return { perf, income, power, net: income - power, hash: Math.round(perf * 1.7) };
}
export function mineHourly() {
  const st = G.s.pcmine;
  if (!st?.on) return;
  const r = mineRate();
  if (!r) { st.on = false; return; }
  st.bal += r.income; st.hours++;
  // the electricity bill comes from the account every hour
  if (r.power > 0) charge(r.power, 'service', T('Электричество (майнинг)', 'Електрика (майнінг)', 'Electricity (mining)'));
}
export function mineCashout() {
  const st = mineState();
  if (st.bal < 0.5) return 0;
  const v = st.bal; st.bal = 0; st.total += v;
  earn(v, 'stock', T('Вывод с майнинг‑пула', 'Виведення з майнінг‑пулу', 'Mining pool payout'));
  return v;
}
