// Hardware store ("Hardware week"), PC Build (orders / build / my PC) and Computer (OS reinstall / my PC).
import { G } from '../core/state.js';
import { T, L, dur } from '../core/i18n.js';
import { esc } from '../core/util.js';
import { fmt } from '../core/money.js';
import { MODEL, DEFECTS } from '../data/catalog.js';
import { RNG } from '../core/rng.js';
import { makeItem, itemTitle } from '../game/items.js';
import { getItem } from '../game/player.js';
import { rerender, toast, choose, confirmBox, sheet, resolveSheet, openApp, go } from '../ui/shell.js';
import { img, empty } from '../ui/comp.js';
import { playMini } from '../mini/engine.js';
import { sfx } from '../ui/sfx.js';
import { region } from './common.js';
import {
  SLOTS, SLOT_NAME, SLOT_ICON, specOf, specLine, partsOf, checkBuild, assemble, pcState, meets, shipToOrder, SHIP_FEE, myPc, setMyPc, canBeMyPc, buildTitle,
  OS, isComputer, osOf, bootBroken, installerDrive, reinstall, installSeconds, HW_CATS, HW_CAT_NAME, hwStore, buyHw,
} from '../game/pc.js';

// ---------------------------------------------------------------- hardware store
const HW_NAMES = { RU: 'ДНК', UA: 'Розетко', BY: '21‑Вэк', KZ: 'Технодомм', PL: 'X‑Kom', DE: 'Mindfaktor', FR: 'LDLK', IT: 'Uniuro', GB: 'Scann', US: 'Newegs', JP: 'Yodobashy', CN: 'JD.kom', AE: 'Sharaf DJJ', TR: 'Vatann', GE: 'Zummer', TH: 'Bananna IT' };
const HV = { cat: null };
const thumbOf = (id) => { const it = makeItem(new RNG(`hwt|${id}`), { model: id, quality: 'new' }); it.sealed = true; it.defects = []; it.cond = 100; return it; };
const card = (x) => `<div class="hw-card"><div class="hw-img">${img(thumbOf(x.id), { size: 240 })}${x.off ? `<span class="hw-off">−${x.off}%</span>` : ''}</div><div class="hw-price">${fmt(x.price)} ${x.off ? `<s>${fmt(x.old)}</s>` : ''}</div><div class="hw-name">${esc(itemTitle({ m: x.id, v: 0 }))}</div><div class="hw-spec">${esc(specLine({ m: x.id }))}</div><div class="hw-rate">★ ${x.rating} · ${x.reviews} ${T('отзывов', 'відгуків', 'reviews')}</div><button class="hw-buy" data-a="hwbuy" data-v="${x.id}" ${x.stock ? '' : 'disabled'}>${x.stock ? T('Купить', 'Купити', 'Buy') : T('Нет в наличии', 'Немає', 'Sold out')}<small>${x.stock ? T('доставка сегодня', 'доставка сьогодні', 'delivered today') : ''}</small></button></div>`;
function hwMain() {
  const st = hwStore();
  let h = `<div class="hw-search">🔍 ${T(`Искать в ${esc(hwName())}`, `Шукати в ${esc(hwName())}`, `Search ${esc(hwName())}`)}</div>
    <div class="hw-banner"><b>${T('Неделя железа', 'Тиждень заліза', 'Hardware week')}</b><span>${T('Комплектующие для ПК со скидками до −45%. Соберите компьютер и отдайте заказ в приложении «Сборка».', 'Комплектуючі для ПК зі знижками до −45%. Зберіть компʼютер і віддайте замовлення в застосунку «Збірка».', 'PC parts up to −45%. Build a computer and deliver an order in the “PC Build” app.')}</span><button data-a="open" data-v="build">${T('Открыть «Сборку»', 'Відкрити «Збірку»', 'Open PC Build')} ›</button></div>
    <div class="hw-cats">${HW_CATS.map(([k, ic]) => `<button class="${HV.cat === k ? 'on' : ''}" data-a="hwcat" data-v="${k}"><i>${ic}</i><span>${esc(L(HW_CAT_NAME[k]))}</span></button>`).join('')}</div>`;
  const list = HV.cat ? st.items.filter((x) => x.kind === HV.cat) : st.items.filter((x) => x.off).sort((a, b) => b.off - a.off).slice(0, 12);
  h += `<h3 class="hw-sec">${HV.cat ? esc(L(HW_CAT_NAME[HV.cat])) : '🔥 ' + T('Скидки дня', 'Знижки дня', 'Deals of the day')}</h3><div class="hw-grid">${list.map(card).join('') || `<p class="p">${T('Пусто', 'Порожньо', 'Nothing here')}</p>`}</div>`;
  return h;
}
const hwName = () => HW_NAMES[region().id] || 'ДНК';
export const hwApp = {
  id: 'hw', glyph: 'cpu', lvl: 2,
  name: () => hwName(), colors: ['#8b5cf6', '#5b21b6'], glyphColor: '#fff',
  views: { main: hwMain },
  actions: {
    hwcat: (v) => { HV.cat = HV.cat === v ? null : v; rerender(); },
    hwbuy: async (id) => { const x = hwStore().items.find((y) => y.id === id); if (!x) return; if (!(await confirmBox(itemTitle({ m: id, v: 0 }), `${fmt(x.price)} · ${T('новое, доставка сегодня', 'нове, доставка сьогодні', 'new, delivered today')}`, T('Купить', 'Купити', 'Buy')))) return; const r = buyHw(id); if (r.ok) { sfx('cash'); toast(T('Заказ оформлен — курьер привезёт сегодня', 'Замовлення оформлено — курʼєр привезе сьогодні', 'Ordered — arriving today'), 'g'); } else toast(r.msg, 'r'); rerender(); },
  },
};

// ---------------------------------------------------------------- my PC (shared)
function myPcView() {
  const pc = myPc();
  const cands = G.s.inv.filter((it) => canBeMyPc(it) && !it.listed && it.id !== pc.item?.id);
  return `<div class="pc-hero"><div class="pc-ico">${pc.item ? '🖥' : '💻'}</div><div class="grow"><b>${esc(pc.name)}</b><small>${esc(pc.item ? pc.spec : 'Celeron N4020 · 4 ГБ · HDD')}</small><div class="pc-speed">${T('Скорость', 'Швидкість', 'Speed')} ×${pc.speed}</div></div></div>
    <p class="p">${T('Компьютер, за которым вы работаете. Мощный ПК быстрее ставит системы, восстанавливает данные и даёт больше времени в «Сборке» и Phone Lab. Новые компьютеры собираются в приложении «Сборка».', 'Компʼютер, за яким ви працюєте. Потужний ПК швидше ставить системи, відновлює дані й дає більше часу в «Збірці» та Phone Lab. Нові компʼютери збираються в застосунку «Збірка».', 'The computer you work on. A strong PC installs systems faster, recovers data better and gives more time in PC Build and Phone Lab. New computers are built in the PC Build app.')}</p>
    ${pc.item ? `<button class="btn dark block" data-a="pcunset">${T('Вернуться на старый ноутбук', 'Повернутися на старий ноутбук', 'Back to the old laptop')}</button>` : ''}
    ${cands.length ? `<h3 class="sub">${T('Можно поставить на стол', 'Можна поставити на стіл', 'Could be your workstation')}</h3>` + cands.map((it) => `<div class="list-item"><div class="th">${img(it)}</div><div class="grow"><div class="t">${esc(itemTitle(it))}</div><div class="s">${it.build ? T(`мощность ${it.build.score}`, `потужність ${it.build.score}`, `power ${it.build.score}`) : esc(OS[osOf(it)].n)}</div></div><button class="btn xs" data-a="pcset" data-v="${it.id}">${T('Работать на нём', 'Працювати на ньому', 'Use it')}</button></div>`).join('') : `<button class="btn block" data-a="open" data-v="build">🛠 ${T('Собрать компьютер', 'Зібрати компʼютер', 'Build a computer')}</button>`}`;
}
const myPcActions = {
  pcset: async (id) => { const it = getItem(id); if (!(await confirmBox(T('Работать на этом компьютере?', 'Працювати на цьому компʼютері?', 'Use this computer?'), T('Пока он ваш рабочий, его лучше не продавать — иначе вернётесь на старый ноутбук.', 'Поки він ваш робочий, його краще не продавати — інакше повернетеся на старий ноутбук.', 'While it’s your workstation, selling it sends you back to the old laptop.'), T('Да', 'Так', 'Yes')))) return; setMyPc(id); sfx('win'); toast(T(`Скорость ×${myPc().speed}`, `Швидкість ×${myPc().speed}`, `Speed ×${myPc().speed}`), 'g'); rerender(); },
  pcunset: () => { setMyPc(null); rerender(); },
};

// ---------------------------------------------------------------- PC Build: orders / build / my PC
const BV = { tab: 'orders', sel: {} };
function ordersView() {
  const st = pcState(), s = G.s;
  let h = `<p class="p">${T(`Покупатели пишут, какой компьютер им нужен и сколько готовы заплатить: соберите подходящий ПК и отправьте доставкой (${fmt(SHIP_FEE)}). Деньги придут, когда покупатель получит компьютер.`, `Покупці пишуть, який компʼютер їм потрібен і скільки готові заплатити: зберіть відповідний ПК і надішліть доставкою (${fmt(SHIP_FEE)}). Гроші прийдуть, коли покупець отримає компʼютер.`, `Buyers write what PC they need and how much they’ll pay: build a matching PC and ship it (${fmt(SHIP_FEE)}). You’re paid when the buyer receives it.`)}</p>`;
  if (!st.orders.length) h += `<div class="pc-empty">${T('Пока никто не писал. Первые заказы появятся в течение минуты.', 'Поки ніхто не писав. Перші замовлення зʼявляться протягом хвилини.', 'No one has written yet. The first orders arrive within a minute.')}</div>`;
  const builds = s.inv.filter((it) => it.build && !it.listed);
  h += st.orders.map((o) => {
    const fit = builds.filter((it) => meets(it, o).ok);
    return `<div class="pc-order"><div class="row between"><b>${esc(o.who)}</b><b class="g">${fmt(o.budget)}</b></div><p>${esc(L(o.text))}</p><div class="pc-need"><span>⚡ ≥ ${o.need.perf}</span><span>📏 ≥ ${o.need.ram} ${T('ГБ', 'ГБ', 'GB')}</span>${o.need.gpu ? `<span>🎴 ${T('видеокарта', 'відеокарта', 'GPU')}</span>` : ''}<span>💽 SSD</span><span class="m">⏳ ${dur(o.exp - s.t)}</span></div>${fit.length ? `<button class="btn block mt" data-a="pcship" data-v="${o.id}">📦 ${T('Отправить сборку', 'Надіслати збірку', 'Ship a build')} (${fit.length})</button>` : `<button class="btn dark block mt" data-a="pctab" data-v="build">🛠 ${T('Собрать под заказ', 'Зібрати під замовлення', 'Build for this order')}</button>`}</div>`;
  }).join('');
  if (st.ships.length) h += `<h3 class="sub">${T('В пути к покупателям', 'У дорозі до покупців', 'On the way to buyers')}</h3>` + st.ships.map((x) => `<div class="kv"><span>📦 ${esc(x.who)} · ${esc(x.title)}</span><b>${fmt(x.pay)} · ${dur(x.eta - s.t)}</b></div>`).join('');
  return h;
}
function buildView() {
  const c = checkBuild(BV.sel);
  let h = `<div class="pc-slots">${SLOTS.map((k) => { const it = BV.sel[k] && getItem(BV.sel[k]); const n = partsOf(k).length; return `<div class="pc-slot ${it ? 'set' : ''}" data-a="pcpick" data-v="${k}"><i>${SLOT_ICON[k]}</i><div class="grow"><small>${esc(L(SLOT_NAME[k]))}${k === 'gpu' ? ' · ' + T('для офиса можно без', 'для офісу можна без', 'optional for office') : ''}</small><b>${it ? esc(itemTitle(it, false)) : n ? T(`выбрать (${n} на складе)`, `обрати (${n} на складі)`, `choose (${n} in stock)`) : T('нет на складе — купить', 'немає на складі — купити', 'none in stock — buy')}</b>${it ? `<small>${esc(specLine(it))}</small>` : ''}</div><span>›</span></div>`; }).join('')}</div>`;
  h += `<div class="pc-check">${c.rows.map((r) => `<span class="${r.ok ? 'g' : 'r'}">${r.ok ? '✔' : '✖'} ${esc(r.t)}</span>`).join('')}${c.missing.length ? `<span class="m">… ${T('не хватает', 'не вистачає', 'missing')}: ${c.missing.map((k) => esc(L(SLOT_NAME[k]).toLowerCase())).join(', ')}</span>` : ''}<div class="pc-score">⚡ ${T('Мощность сборки', 'Потужність збірки', 'Build power')}: <b>${c.score}</b></div></div>`;
  h += `<button class="btn block mt ${c.ok ? '' : 'dis'}" data-a="pcassemble">🔧 ${T('Собрать', 'Зібрати', 'Assemble')}</button>`;
  return h;
}
function buildMain() {
  const tabs = `<div class="seg"><button class="${BV.tab === 'orders' ? 'on' : ''}" data-a="pctab" data-v="orders">${T('Заказы', 'Замовлення', 'Orders')}${pcState().orders.length ? ` · ${pcState().orders.length}` : ''}</button><button class="${BV.tab === 'build' ? 'on' : ''}" data-a="pctab" data-v="build">${T('Собрать', 'Зібрати', 'Build')}</button><button class="${BV.tab === 'my' ? 'on' : ''}" data-a="pctab" data-v="my">${T('Мой ПК', 'Мій ПК', 'My PC')}</button></div>`;
  return tabs + (BV.tab === 'orders' ? ordersView() : BV.tab === 'build' ? buildView() : myPcView());
}
export const buildApp = {
  id: 'build', glyph: 'wrench', lvl: 2,
  name: ['Сборка', 'Збірка', 'PC Build'], colors: ['#ff7a3d', '#d9480f'], glyphColor: '#fff', dark: true,
  views: { main: buildMain },
  actions: {
    ...myPcActions,
    pctab: (v) => { BV.tab = v; rerender(); },
    pcpick: async (k) => {
      const list = partsOf(k);
      if (!list.length) { if (await confirmBox(L(SLOT_NAME[k]), T('На складе нет — заглянуть в магазин железа или на доску объявлений?', 'На складі немає — зазирнути в магазин заліза чи на дошку оголошень?', 'None in stock — check the hardware store or the classifieds?'), T('В магазин', 'У магазин', 'To the store'))) { HV.cat = k; openApp('hw'); } return; }
      const v = await choose(L(SLOT_NAME[k]), [...list.map((it) => ({ v: it.id, label: itemTitle(it, false), sub: specLine(it) + ((it.defects || []).some((d) => d.known) ? ' · ⚠' : '') })), ...(BV.sel[k] ? [{ v: '__none', label: T('Убрать', 'Прибрати', 'Remove'), cls: 'dark' }] : [])]);
      if (!v) return;
      if (v === '__none') delete BV.sel[k]; else BV.sel[k] = v;
      rerender();
    },
    pcassemble: async () => {
      const c = checkBuild(BV.sel);
      if (!c.ok) return toast(c.missing.length ? T('Не хватает деталей', 'Не вистачає деталей', 'Missing parts') : T('Детали несовместимы — смотрите ✖', 'Деталі несумісні — дивіться ✖', 'Incompatible parts — see ✖'), 'r');
      const dead = Object.values(c.P).some((x) => x.it.defects.some((d) => ['x_dead', 's_dead', 'e_dead'].includes(d.c)));
      const r = await playMini('assemble', { title: T('Сборка ПК', 'Збірка ПК', 'PC assembly'), cpuName: itemTitle(c.P.cpu.it, false), hasGpu: !!c.P.gpu, nvme: !!c.P.drive?.s.nvme, dead, pass: 0.5 });
      if (r.quit) return;
      const res = assemble(BV.sel, r);
      if (res.ok) { BV.sel = {}; sfx('win'); toast(T(`Готово: ${itemTitle(res.it)}`, `Готово: ${itemTitle(res.it)}`, `Done: ${itemTitle(res.it)}`), 'g'); BV.tab = 'orders'; }
      else { toast(res.msg, 'r'); if (res.dead) delete BV.sel[Object.keys(BV.sel).find((k) => BV.sel[k] === res.dead.id)]; }
      rerender();
    },
    pcship: async (oid) => {
      const o = pcState().orders.find((x) => x.id === oid); if (!o) return;
      const fit = G.s.inv.filter((it) => it.build && !it.listed && meets(it, o).ok);
      const v = fit.length === 1 ? fit[0].id : await choose(T('Какую сборку?', 'Яку збірку?', 'Which build?'), fit.map((it) => ({ v: it.id, label: buildTitle(it), sub: T(`мощность ${it.build.score}`, `потужність ${it.build.score}`, `power ${it.build.score}`) })));
      if (!v) return;
      if (!(await confirmBox(T(`Отправить ${o.who}?`, `Надіслати ${o.who}?`, `Ship to ${o.who}?`), T(`Доставка ${fmt(SHIP_FEE)}. Деньги (${fmt(o.budget)}) придут, когда покупатель получит компьютер.`, `Доставка ${fmt(SHIP_FEE)}. Гроші (${fmt(o.budget)}) прийдуть, коли покупець отримає компʼютер.`, `Shipping ${fmt(SHIP_FEE)}. You get ${fmt(o.budget)} on delivery.`), T('Отправить', 'Надіслати', 'Ship')))) return;
      const r = shipToOrder(oid, v);
      if (r.ok) { sfx('ok'); toast(T('Отправлено!', 'Надіслано!', 'Shipped!'), 'g'); } else toast(r.msg, 'r');
      rerender();
    },
  },
};

// ---------------------------------------------------------------- Computer: OS reinstall / my PC
const CV = { tab: 'sys' };
function sysView() {
  const comps = G.s.inv.filter((it) => isComputer(it) && !it.listed);
  const drive = installerDrive();
  let h = `<div class="pc-note"><b>${T('Переустановка системы', 'Перевстановлення системи', 'Reinstalling the system')}</b><span>${T('Сначала сброс, потом установка с флешки. Система немного меняет цену: Windows 11 +3%, Windows 10 +2%, Linux и macOS — как есть, Windows 8 −3%, Windows 7 −7%. Не загружающийся компьютер после переустановки дорожает примерно на 45%.', 'Спершу скидання, потім встановлення з флешки. Система трохи змінює ціну: Windows 11 +3%, Windows 10 +2%, Linux і macOS — як є, Windows 8 −3%, Windows 7 −7%. Компʼютер, що не завантажується, після перевстановлення дорожчає приблизно на 45%.', 'Reset first, then install from a flash drive. The OS nudges the price: Windows 11 +3%, Windows 10 +2%, Linux and macOS as is, Windows 8 −3%, Windows 7 −7%. A non‑booting computer is worth ~45% more after a reinstall.')}</span></div>
    <div class="kv"><span>🔌 ${T('Флешка', 'Флешка', 'Flash drive')}</span><b>${drive ? esc(itemTitle(drive, false)) : `<span class="r">${T('нет', 'немає', 'none')}</span> — <a data-a="hwflash">${T('купить в магазине', 'купити в магазині', 'buy one')}</a>`}</b></div>
    <div class="kv"><span>🖥 ${T('Ваш ПК', 'Ваш ПК', 'Your PC')}</span><b>×${myPc().speed} · ≈ ${Math.round(installSeconds())} ${T('с на установку', 'с на встановлення', 's per install')}</b></div>`;
  if (!comps.length) h += `<div class="pc-empty">💻 ${T('Компьютеров на складе нет. Купите на доске объявлений — дешевле всего с пометкой «Не загружается».', 'Компʼютерів на складі немає. Купіть на дошці оголошень — найдешевше з позначкою «Не завантажується».', 'No computers in storage. Buy one on the classifieds — cheapest with “won’t boot”.')}</div><button class="btn block" data-a="open" data-v="market">${T('Открыть объявления', 'Відкрити оголошення', 'Open classifieds')}</button>`;
  h += comps.map((it) => `<div class="list-item"><div class="th">${img(it)}</div><div class="grow"><div class="t">${esc(itemTitle(it))}</div><div class="s">${esc(OS[osOf(it)].n)}${bootBroken(it) ? ` · <span class="r">${T('не загружается', 'не завантажується', 'won’t boot')}</span>` : ''}</div></div><button class="btn xs ${drive ? '' : 'dark'}" data-a="osinst" data-v="${it.id}">${T('Переустановить', 'Перевстановити', 'Reinstall')}</button></div>`).join('');
  return h;
}
function compMain() {
  const tabs = `<div class="seg"><button class="${CV.tab === 'sys' ? 'on' : ''}" data-a="cvtab" data-v="sys">${T('Система', 'Система', 'System')}</button><button class="${CV.tab === 'my' ? 'on' : ''}" data-a="cvtab" data-v="my">${T('Мой ПК', 'Мій ПК', 'My PC')}</button></div>`;
  return tabs + (CV.tab === 'sys' ? sysView() : myPcView());
}
export const computerApp = {
  id: 'computer', glyph: 'monitor', lvl: 2,
  name: ['Компьютер', 'Компʼютер', 'Computer'], colors: ['#3a4256', '#1c2130'], glyphColor: '#fff', dark: true,
  views: { main: compMain },
  actions: {
    ...myPcActions,
    cvtab: (v) => { CV.tab = v; rerender(); },
    hwflash: () => { HV.cat = 'usb'; openApp('hw'); },
    osinst: async (id) => {
      const it = getItem(id); if (!it) return;
      if (!installerDrive()) { if (await confirmBox(T('Нужна флешка', 'Потрібна флешка', 'A flash drive is needed'), T('Для установки нужна флешка от 8 ГБ. Купить в магазине железа?', 'Для встановлення потрібна флешка від 8 ГБ. Купити в магазині заліза?', 'You need an 8 GB+ flash drive. Buy one at the hardware store?'), T('В магазин', 'У магазин', 'To the store'))) { HV.cat = 'usb'; openApp('hw'); } return; }
      const mac = /Mac|iMak/.test(MODEL[it.m]?.name || '');
      const os = await choose(T('Какую систему?', 'Яку систему?', 'Which system?'), Object.entries(OS).filter(([k]) => mac || k !== 'macos').map(([k, o]) => ({ v: k, label: o.n, sub: o.mult > 1 ? `+${Math.round((o.mult - 1) * 100)}%` : o.mult < 1 ? `−${Math.round((1 - o.mult) * 100)}%` : T('цена как есть', 'ціна як є', 'price as is') })), T('Старые файлы на компьютере и на флешке сотрутся.', 'Старі файли на компʼютері й на флешці зітруться.', 'Old files on the computer and the stick are erased.'));
      if (!os) return;
      const secs = installSeconds();
      const steps = [T('Сброс системы…', 'Скидання системи…', 'Resetting…'), T('Форматирование диска…', 'Форматування диска…', 'Formatting…'), T('Копирование файлов с флешки…', 'Копіювання файлів із флешки…', 'Copying from the stick…'), T('Установка драйверов…', 'Встановлення драйверів…', 'Installing drivers…'), T('Первая загрузка…', 'Перше завантаження…', 'First boot…')];
      await sheet(`<h2>💿 ${esc(OS[os].n)}</h2><p class="p" id="osstep">${steps[0]}</p><div class="pc-prog"><i id="osbar"></i></div>`, { modal: true, after(el) {
        const bar = el.querySelector('#osbar'), lab = el.querySelector('#osstep');
        const t0 = performance.now();
        const tick = () => { const p = Math.min(1, (performance.now() - t0) / (secs * 1000)); bar.style.width = p * 100 + '%'; lab.textContent = steps[Math.min(steps.length - 1, Math.floor(p * steps.length))]; if (p < 1) requestAnimationFrame(tick); else setTimeout(() => resolveSheet('done'), 250); };
        requestAnimationFrame(tick);
      } });
      const r = reinstall(it, os);
      if (r.ok) { sfx('win'); toast(r.fixed ? T(`${OS[os].n} установлена — компьютер снова загружается!`, `${OS[os].n} встановлено — компʼютер знову завантажується!`, `${OS[os].n} installed — it boots again!`) : T(`${OS[os].n} установлена`, `${OS[os].n} встановлено`, `${OS[os].n} installed`), 'g'); } else toast(r.msg, 'r');
      rerender();
    },
  },
};
