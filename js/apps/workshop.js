// Workshop (repairs), Legit Check, Phone Lab and Delivery apps.
import { G, emit } from '../core/state.js';
import { T, L, dur } from '../core/i18n.js';
import { esc } from '../core/util.js';
import { fmt } from '../core/money.js';
import { DEFECTS, LOCKS, LUXURY_CATS, MODEL } from '../data/catalog.js';
import { CITY } from '../data/world.js';
import { icon } from '../ui/icons.js';
import { go, rerender, toast, confirmBox, ago, openApp, UI } from '../ui/shell.js';
import { img, empty, bar, row, defectList, tags } from '../ui/comp.js';
import { itemTitle, itemSub, itemValue, defectName, lockName } from '../game/items.js';
import { getItem, upLevel } from '../game/player.js';
import { repairQuote, diyRepair, masterRepair, cleanItem, diagCost, diagnose, authCost, paidAuth, gradeCost, sendToGrading, busy, reflash, jailbreak, needs, buyPart, buyCons, buyTool, hasTool, consLeft, consPackPrice, PACK, diyWithParts, toolBonus, dismantle, dismantleYield, sellPart, partSellPrice } from '../game/workshop.js';
import { TOOLS, CONS, PART_NAMES, QUALITY, MODEL_PART_CATS, partPrice, RECIPES } from '../data/parts.js';
import { choose } from '../ui/shell.js';
import { playMini } from '../mini/engine.js';
import { legitFlow, regName, regColors } from './common.js';
import { sfx } from '../ui/sfx.js';

const GAME_LABEL = {
  screen: ['Установите новый дисплей ровно в рамку', 'Встановіть новий дисплей рівно в рамку', 'Fit the new screen precisely'],
  screws: ['Открутите винты по порядку', 'Відкрутіть гвинти по порядку', 'Remove the screws in order'],
  solder: ['Пайка: жмите, когда жало над контактом', 'Пайка: тисніть, коли жало над контактом', 'Solder: tap when the tip is over the pad'],
  wires: ['Соедините шлейфы по цветам', 'Зʼєднайте шлейфи за кольорами', 'Reconnect the ribbon cables'],
  scrub: ['Очистите и отполируйте', 'Очистіть і відполіруйте', 'Clean and polish'],
  align: ['Выставьте деталь точно на место', 'Виставте деталь точно на місце', 'Set the part exactly in place'],
  color: ['Подберите краску в тон', 'Підберіть фарбу в тон', 'Match the paint'],
  dent: ['Выправляйте вмятину точными ударами', 'Виправляйте вмʼятину точними ударами', 'Tap out the dent with precise hits'],
};

// ---------------------------------------------------------------- REPAIR
function repairMain() {
  const s = G.s;
  const active = s.repairs.map((r) => ({ r, it: getItem(r.itemId) })).filter((x) => x.it);
  const fixable = s.inv.filter((i) => !i.shop && (i.defects.some((d) => d.known && (DEFECTS[d.c]?.fix || RECIPES[d.c])) || !i.cleaned || (['cards', 'comics'].includes(i.cat) && !i.grade && !i.sealed)));
  return `${active.length ? `<h3 class="sub">${T('В работе', 'У роботі', 'In progress')}</h3>` + active.map(({ r, it }) => `<div class="card"><div class="row"><div class="th" style="width:54px;height:54px;border-radius:10px;overflow:hidden">${img(it)}</div><div class="grow"><b>${esc(itemTitle(it))}</b><div class="small m">${r.kind === 'grade' ? T('Грейдинг', 'Грейдинг', 'Grading') : esc(defectName(r.code))} · <span data-cd="${r.done}" data-fmt="long"></span></div><div class="bar mt"><i data-bar-from="${r.start}" data-bar-to="${r.done}"></i></div></div></div></div>`).join('') : ''}
    <h3 class="sub">${T('Можно улучшить', 'Можна покращити', 'Can be improved')}</h3>
    ${fixable.length ? fixable.map((it) => row(it, `<span class="small b">${icon('wrench', 'style="width:18px"')}</span>`, `${esc(itemSub(it))}`, 'go', 'item')).join('') : empty('wrench', T('Нечего чинить', 'Нічого лагодити', 'Nothing to fix'), T('Осмотрите вещи на складе — найдутся скрытые дефекты.', 'Огляньте речі на складі — знайдуться приховані дефекти.', 'Inspect items to reveal hidden issues.'))}`;
}
function repairItem(p) {
  const it = getItem(p.id);
  if (!it) return empty('box', T('Вещь не найдена', 'Річ не знайдено', 'Item not found'));
  const b = busy(it.id);
  const known = it.defects.filter((d) => d.known);
  const unknown = it.defects.length - known.length;
  const v = itemValue(it, G.s.player.city, 'known');
  let h = `<div class="card row"><div class="th" style="width:90px;height:90px;border-radius:14px;overflow:hidden;flex:none">${img(it)}</div><div class="grow"><b>${esc(itemTitle(it))}</b><div class="small m">${esc(itemSub(it))}</div><div class="small">${T('Оценка', 'Оцінка', 'Value')}: <b>${fmt(v)}</b></div>${tags(it)}</div></div>`;
  if (b) h += `<div class="card warn">${T('Вещь у мастера', 'Річ у майстра', 'Item is at the workshop')}</div>`;
  for (const d of known) {
    const q = repairQuote(it, d.c);
    const n = needs(it, d.c);
    h += `<div class="card"><div class="row between"><b>⚠ ${esc(defectName(d.c))}</b><span class="small r">−${Math.round(DEFECTS[d.c].sev * 100)}%</span></div>`;
    if (!q && !n) { h += `<div class="small m mt">${T('Не ремонтируется', 'Не ремонтується', 'Can’t be repaired')}</div></div>`; continue; }
    if (n) {
      const lines = [];
      if (n.key) {
        const st = n.st;
        lines.push(`<div class="row between mt"><span>🔩 ${esc(L(PART_NAMES[n.r.part]))}</span><span class="small m">${T('ориг', 'ориг', 'orig')} ${st.orig} · ${T('копия', 'копія', 'copy')} ${st.copy} · ${T('б/у', 'вжив', 'used')} ${st.used}</span></div>
          <div class="btns"><button class="btn xs dark" data-a="bpart" data-v="${it.id}" data-w="${n.r.part}" data-q="orig">${T('Оригинал', 'Оригінал', 'Original')} ${fmt(partPrice(it.m, n.r.part, 'orig'))}</button><button class="btn xs dark" data-a="bpart" data-v="${it.id}" data-w="${n.r.part}" data-q="copy">${T('Копия', 'Копія', 'Copy')} ${fmt(partPrice(it.m, n.r.part, 'copy'))}</button></div>`);
      }
      for (const c of n.r.cons) lines.push(`<div class="row between mt"><span>🧴 ${esc(L(CONS[c].n))}</span>${consLeft(c) ? `<span class="small g">${T('есть', 'є', 'have')} ${consLeft(c)}</span>` : `<button class="btn xs dark" data-a="bcons" data-v="${c}">${T('Купить', 'Купити', 'Buy')} ×${PACK} · ${fmt(consPackPrice(c))}</button>`}</div>`);
      if (n.r.tool) lines.push(`<div class="row between mt"><span>${TOOLS[n.r.tool].icon} ${esc(L(TOOLS[n.r.tool].n))}</span>${n.toolOk ? `<span class="small g">✓ ${T('есть', 'є', 'owned')}</span>` : `<button class="btn xs dark" data-a="btool" data-v="${n.r.tool}">${T('Купить', 'Купити', 'Buy')} ${fmt(TOOLS[n.r.tool].price)}</button>`}</div>`);
      h += `<div class="small m mt">${T('Этапов работы', 'Етапів роботи', 'Work steps')}: ${n.r.steps.length}${lines.length ? '' : ' · ' + T('материалы не нужны', 'матеріали не потрібні', 'no supplies needed')}</div>${lines.join('')}`;
    }
    h += `<div class="btns">${n ? `<button class="btn sm" data-a="diyp" data-v="${it.id}" data-w="${d.c}" ${b || !n.ok ? 'disabled' : ''}>🛠 ${T('Починить самому', 'Полагодити самому', 'Fix it myself')}</button>` : `<button class="btn sm" data-a="diy" data-v="${it.id}" data-w="${d.c}" ${b ? 'disabled' : ''}>🛠 ${T('Сам', 'Сам', 'DIY')} · ${fmt(q.parts)}</button>`}${q ? `<button class="btn sm dark" data-a="master" data-v="${it.id}" data-w="${d.c}" ${b ? 'disabled' : ''}>👨‍🔧 ${fmt(q.master)} · ${dur(q.time)}</button>` : ''}</div></div>`;
  }
  if (MODEL_PART_CATS[it.cat] && !it.listed && !b) {
    const y = dismantleYield(it);
    h += `<div class="card"><b>🔩 ${T('Разобрать на запчасти', 'Розібрати на запчастини', 'Dismantle for parts')}</b><div class="d">${T(`Донор: до ${y.length} рабочих деталей этой модели (${y.map((k) => L(PART_NAMES[k])).join(', ') || '—'}). Скрытые поломки найдутся при разборке. Вещь исчезнет.`, `Донор: до ${y.length} робочих деталей цієї моделі. Приховані поломки знайдуться під час розбирання. Річ зникне.`, `Donor: up to ${y.length} working parts of this model. Hidden faults show up during teardown. The item is gone.`)}</div><button class="btn sm dark mt" data-a="dismantle" data-v="${it.id}">${T('Разобрать', 'Розібрати', 'Dismantle')}</button></div>`;
  }
  if (!it.cleaned && !it.sealed) h += `<div class="card"><b>✨ ${T('Чистка и полировка', 'Чистка і полірування', 'Clean & polish')}</b><div class="d">${T('Поднимает состояние на 3–12 пунктов. Один раз.', 'Піднімає стан на 3–12 пунктів. Один раз.', 'Raises condition by 3–12 points. Once.')}</div><button class="btn sm mt" data-a="clean" data-v="${it.id}">${T('Почистить', 'Почистити', 'Clean')}</button></div>`;
  if (unknown && !it.diag) h += `<div class="card"><b>🧪 ${T('Полная диагностика', 'Повна діагностика', 'Full diagnostics')}</b><div class="d">${T('Покажет все скрытые дефекты.', 'Покаже всі приховані дефекти.', 'Reveals all hidden defects.')}</div><button class="btn sm dark mt" data-a="diag" data-v="${it.id}">${fmt(diagCost(it))}</button></div>`;
  if (['cards', 'comics'].includes(it.cat) && !it.grade && !it.sealed) h += `<div class="card"><b>🏅 ${it.cat === 'cards' ? 'PZA' : 'CGS'} ${T('грейдинг', 'грейдинг', 'grading')}</b><div class="d">${T('Профессиональная оценка в слабе. 10 баллов умножает цену в разы. ~10 мин.', 'Професійна оцінка в слабі. 10 балів множить ціну в рази.', 'Slabbed grade; a 10 multiplies the price. ~10 min.')}</div><button class="btn sm mt" data-a="grade" data-v="${it.id}" ${b ? 'disabled' : ''}>${fmt(gradeCost(it))}</button></div>`;
  return h;
}

function partsView() {
  const p = G.s.parts || {};
  const keys = Object.keys(p);
  const model = keys.filter((k) => !k.startsWith('c:'));
  const cons = Object.keys(CONS);
  return `<h2 class="sec">${T('Запчасти', 'Запчастини', 'Spare parts')}</h2><p class="p">${T('Оригинал — как с завода. Копия дешевле, но покупатель может заметить «неоригинальную запчасть». Б/у снимаются с доноров: купите сломанный телефон той же модели и разберите его.', 'Оригінал — як із заводу. Копія дешевша, але покупець може помітити «неоригінальну запчастину». Вживані знімаються з донорів: купіть зламаний телефон тієї ж моделі й розберіть.', 'Original is factory spec. A copy is cheaper but a buyer may spot it. Used parts come from donors: buy a broken one of the same model and dismantle it.')}</p>
    ${model.length ? model.map((k) => { const [m, kind] = k.split(':'); const mm = MODEL[m]; return `<div class="card"><div class="row between"><b>${esc(L(PART_NAMES[kind] || [kind, kind, kind]))}</b><span class="small m">${esc(mm ? `${mm.brand} ${mm.name}` : m)}</span></div><div class="btns">${['orig', 'copy', 'used'].filter((q) => p[k][q]).map((q) => `<button class="btn xs dark" data-a="spart" data-v="${k}" data-q="${q}">${esc(L(QUALITY[q].n))} ×${p[k][q]} · ${T('продать', 'продати', 'sell')} ${fmt(partSellPrice(m, kind, q === 'used' ? 'orig' : q) * (q === 'used' ? 0.55 : 1))}</button>`).join('')}</div></div>`; }).join('') : empty('wrench', T('Деталей пока нет', 'Деталей поки немає', 'No parts yet'), T('Купите в карточке ремонта или разберите донора.', 'Купіть у картці ремонту або розберіть донора.', 'Buy them in a repair card or dismantle a donor.'))}
    <h3 class="sub">${T('Расходники', 'Витратні матеріали', 'Consumables')}</h3>
    <div class="opt-grid">${cons.map((c) => `<button data-a="bcons" data-v="${c}">${esc(L(CONS[c].n))}<small>${T('есть', 'є', 'have')} ${consLeft(c)} · +${PACK} ${T('за', 'за', 'for')} ${fmt(consPackPrice(c))}</small></button>`).join('')}</div>`;
}
function toolsView() {
  return `<h2 class="sec">${T('Инструменты', 'Інструменти', 'Tools')}</h2><p class="p">${T('Без нужного инструмента вещь можно только отдать мастеру. Микроскоп и полировальный станок ещё и повышают качество работы.', 'Без потрібного інструменту річ можна лише віддати майстрові. Мікроскоп і полірувальний верстат ще й підвищують якість роботи.', 'Without the right tool you can only pay a technician. The microscope and polisher also raise your work quality.')}</p>
    ${Object.entries(TOOLS).map(([k, t]) => `<div class="card row"><div style="font-size:28px;width:40px;text-align:center">${t.icon}</div><div class="grow"><b>${esc(L(t.n))}</b>${t.bonus ? `<div class="small g">${T('бонус к качеству', 'бонус до якості', 'quality bonus')}</div>` : ''}</div>${hasTool(k) ? `<span class="tag g">✓ ${T('есть', 'є', 'owned')}</span>` : `<button class="btn xs" data-a="btool" data-v="${k}">${fmt(t.price)}</button>`}</div>`).join('')}`;
}
export const repairApp = {
  id: 'repair', glyph: 'wrench', lvl: 2,
  name: ['Ремонт', 'Ремонт', 'Repair'], colors: ['#20b89a', '#0d7a64'],
  badge: () => 0,
  views: { main: repairMain, item: repairItem, parts: partsView, tools: toolsView },
  tabs: [
    { v: 'main', label: ['Ремонт', 'Ремонт', 'Repair'], icon: 'wrench' },
    { v: 'parts', label: ['Запчасти', 'Запчастини', 'Parts'], icon: 'box' },
    { v: 'tools', label: ['Инструменты', 'Інструменти', 'Tools'], icon: 'gear' },
  ],
  tabOf: (v) => (v === 'item' ? 'main' : v),
  title: (v) => (v === 'item' ? T('Мастерская', 'Майстерня', 'Workshop') : v === 'parts' ? T('Запчасти', 'Запчастини', 'Parts') : v === 'tools' ? T('Инструменты', 'Інструменти', 'Tools') : T('Ремонт', 'Ремонт', 'Repair')),
  actions: {
    diy: async (id, el) => {
      const it = getItem(id); const code = el.dataset.w; const q = repairQuote(it, code);
      if (!q) return;
      if (G.s.money < q.parts) return toast(T('Не хватает на запчасти', 'Не вистачає на запчастини', 'Can’t afford parts'), 'r');
      const r = await playMini(q.game, { title: `🛠 ${defectName(code)}`, label: L(GAME_LABEL[q.game] || GAME_LABEL.align), item: it, rounds: 3 });
      if (r.quit) return;
      const res = diyRepair(it, code, r.score);
      toast(res.ok ? T('Отремонтировано!', 'Відремонтовано!', 'Repaired!') : res.msg, res.ok ? 'g' : 'r');
      rerender();
    },
    diyp: async (id, el) => {
      const it = getItem(id); const code = el.dataset.w; const n = needs(it, code);
      if (!n?.ok) return toast(T('Не хватает запчастей или инструмента', 'Не вистачає запчастин чи інструменту', 'Missing parts or tools'), 'r');
      let partQ = null;
      if (n.key) {
        partQ = n.partQs.length === 1 ? n.partQs[0] : await choose(T('Какую запчасть ставим?', 'Яку запчастину ставимо?', 'Which part goes in?'), n.partQs.map((q) => ({ v: q, label: `${L(QUALITY[q].n)} (${n.st[q]})`, cls: q === 'orig' ? '' : 'dark' })));
        if (!partQ) return;
      }
      const steps = n.r.steps;
      let total = 0;
      for (let i = 0; i < steps.length; i++) {
        const r = await playMini(steps[i], { title: `🛠 ${defectName(code)} · ${i + 1}/${steps.length}`, label: L(GAME_LABEL[steps[i]] || GAME_LABEL.align), item: it, rounds: 2 });
        if (r.quit) return toast(T('Ремонт отменён, запчасти целы', 'Ремонт скасовано, запчастини цілі', 'Repair cancelled, parts kept'));
        total += r.score;
      }
      const quality = Math.min(1, total / steps.length + toolBonus(steps));
      const res = diyWithParts(it, code, quality, partQ);
      sfx(res.ok ? 'win' : 'err');
      toast(res.ok ? (res.copy ? T('Готово! Стоит копия — честно укажите в объявлении', 'Готово! Стоїть копія — чесно вкажіть в оголошенні', 'Done! It’s a copy part — disclose it') : T('Отремонтировано!', 'Відремонтовано!', 'Repaired!')) : res.msg, res.ok ? 'g' : 'r');
      rerender();
    },
    bpart: (id, el) => { const it = getItem(id); if (buyPart(it, el.dataset.w, el.dataset.q)) { sfx('cash'); toast(T('Запчасть куплена', 'Запчастину куплено', 'Part bought'), 'g'); } else toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r'); rerender(); },
    bcons: (k) => { if (buyCons(k)) { sfx('cash'); toast(`+${PACK} ${L(CONS[k].n)}`, 'g'); } else toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r'); rerender(); },
    btool: (k) => { if (buyTool(k)) { sfx('win'); toast(`${TOOLS[k].icon} ${L(TOOLS[k].n)}`, 'g'); } else toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r'); rerender(); },
    spart: (k, el) => { const v = sellPart(k, el.dataset.q); if (v) { sfx('cash'); toast(`+${fmt(v)}`, 'g'); } rerender(); },
    dismantle: async (id) => {
      const it = getItem(id);
      if (!(await confirmBox(T('Разобрать на запчасти?', 'Розібрати на запчастини?', 'Dismantle for parts?'), T('Вещь исчезнет, рабочие детали попадут в «Запчасти».', 'Річ зникне, робочі деталі потраплять у «Запчастини».', 'The item is gone; working parts go to Parts.'), T('Разобрать', 'Розібрати', 'Dismantle'), undefined, true))) return;
      const r = await playMini('screws', { title: T('Разборка', 'Розбирання', 'Teardown'), label: L(GAME_LABEL.screws), item: it, rounds: 2 });
      if (r.quit) return;
      const kinds = dismantle(it);
      sfx('ok'); toast(T(`Снято деталей: ${kinds.length}`, `Знято деталей: ${kinds.length}`, `Parts recovered: ${kinds.length}`), 'g');
      go('parts');
    },
    master: async (id, el) => { const it = getItem(id); const r = masterRepair(it, el.dataset.w); if (r.ok) { sfx('ok'); toast(T('Отдали мастеру', 'Віддали майстру', 'Sent to the technician'), 'g'); } else if (r.msg) toast(r.msg, 'r'); rerender(); },
    clean: async (id) => { const it = getItem(id); const r = await playMini('scrub', { title: T('Чистка', 'Чистка', 'Cleaning'), item: it, pass: 0.5 }); if (r.quit) return; cleanItem(it, r.score); toast(T('Как новенькое!', 'Як новеньке!', 'Good as new!'), 'g'); rerender(); },
    diag: (id) => { const it = getItem(id); if (diagnose(it)) { sfx('ok'); toast(T('Диагностика готова', 'Діагностика готова', 'Diagnostics done'), 'g'); } else toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r'); rerender(); },
    grade: (id) => { const r = sendToGrading(getItem(id)); toast(r.ok ? T('Отправлено на грейдинг', 'Відправлено на грейдинг', 'Sent for grading') : r.msg || '', r.ok ? 'g' : 'r'); rerender(); },
  },
};

// ---------------------------------------------------------------- LEGIT CHECK
const LEGIT_CATS = ['bags', 'watches', 'sneakers', 'jewelry', 'clothing', 'perfume', 'accessories', 'cards', 'art', 'antiques', 'toys', 'collectibles', 'comics', 'instruments'];
function legitMain() {
  const items = G.s.inv.filter((i) => LEGIT_CATS.includes(i.cat) && !i.shop);
  return `<div class="termbox mb"><span class="hl">&gt; LEGIT LAB</span><br>${T('Проверяйте подлинность: логотипы, серийники, швы, цвет и вес. Подделку как оригинал продавать нельзя — будут возвраты и штрафы.', 'Перевіряйте справжність: логотипи, серійники, шви, колір і вагу. Підробку як оригінал продавати не можна.', 'Check logos, serials, stitching, colour and weight. Selling fakes as real brings refunds and fines.')}<br><span class="dim">${T('Навык эксперта', 'Навичка експерта', 'Expert skill')}: ${upLevel('expert')}/5</span></div>
    ${items.length ? items.map((it) => `<div class="card"><div class="row"><div class="th" style="width:64px;height:64px;border-radius:12px;overflow:hidden;flex:none">${img(it)}</div><div class="grow"><b>${esc(itemTitle(it))}</b><div class="small m">${esc(itemSub(it))}</div>${it.fakeKnown ? (it.fake ? `<span class="tag r">✕ ${T('Подделка', 'Підробка', 'Fake')}</span>` : `<span class="tag g">✓ ${T('Оригинал', 'Оригінал', 'Authentic')}</span>`) : `<span class="tag">❓ ${T('Не проверено', 'Не перевірено', 'Unchecked')}</span>`}</div></div>${!it.fakeKnown ? `<div class="btns"><button class="btn sm" data-a="self" data-v="${it.id}">🔎 ${T('Проверить самому', 'Перевірити самому', 'Check myself')}</button><button class="btn sm dark" data-a="paid" data-v="${it.id}">🏛 ${T('Экспертиза', 'Експертиза', 'Lab')} · ${fmt(authCost(it))}</button></div>` : ''}</div>`).join('') : empty('shield', T('Нечего проверять', 'Нічого перевіряти', 'Nothing to check'), T('Брендовые вещи появятся здесь.', 'Брендові речі зʼявляться тут.', 'Branded items will show here.'))}`;
}
export const legitApp = {
  id: 'legit', glyph: 'shield', lvl: 2,
  name: ['Легит‑чек', 'Легіт‑чек', 'Legit Check'], colors: ['#7b4dff', '#4a1fc0'],
  views: { main: legitMain },
  actions: {
    self: async (id) => { const it = getItem(id); await legitFlow(it, itemTitle(it)); },
    paid: (id) => { const it = getItem(id); if (paidAuth(it)) { sfx(it.fake ? 'lose' : 'win'); toast(it.fake ? T('Экспертиза: подделка', 'Експертиза: підробка', 'Lab: fake') : T('Экспертиза: оригинал ✓', 'Експертиза: оригінал ✓', 'Lab: authentic ✓'), it.fake ? 'r' : 'g'); } else toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r'); rerender(); },
  },
};

// ---------------------------------------------------------------- PHONE LAB (jailbreak)
function labMain(p) {
  const phones = G.s.inv.filter((i) => i.cat === 'phones' && !i.shop);
  return `<div class="termbox mb"><span class="hl">&gt; Phone Lab · iPhone + Android</span><br>${T('Подключи телефон по кабелю.', 'Підключи телефон кабелем.', 'Plug the phone in.')}<br>⚡ <span class="hl">${T('Перепрошивка', 'Перепрошивка', 'Reflash')}</span> ${T('снимает код‑пароль айфона и Gugle FRP андроида, лечит бутлуп. Pear ID и чёрный список IMEI не снимает ничто.', 'знімає код‑пароль і Gugle FRP, лікує бутлуп. Pear ID і чорний список IMEI не знімає ніщо.', 'removes passcodes and Gugle FRP, fixes bootloops. Nothing removes Pear ID or blacklisted IMEI.')}<br>🔓 <span class="hl">${T('Джейлбрейк', 'Джейлбрейк', 'Jailbreak')}</span> (iFone) ${T('и', 'і', 'and')} 🤖 <span class="hl">${T('Рут', 'Рут', 'Root')}</span> (Android) ${T('дают +6% к цене. Ошибёшься — будет бутлуп.', 'дають +6% до ціни. Помилишся — буде бутлуп.', 'add +6% value. Fail and you get a bootloop.')}<br><span class="dim">${T('Заблокированные телефоны ищи в объявлениях с пометкой 🔒: они дешевле, но часть окажется безнадёжной.', 'Заблоковані телефони шукай в оголошеннях з позначкою 🔒.', 'Find 🔒 locked phones in listings: cheaper, but some are hopeless.')}</span></div>
    ${phones.length ? phones.map((it) => {
      const m = MODEL[it.m];
      const pear = m.os === 'pear';
      const fixable = it.lock && LOCKS[it.lock].fixable;
      return `<div class="card" style="border-color:#1d3a2e"><div class="row"><div class="th" style="width:64px;height:64px;border-radius:12px;overflow:hidden;flex:none">${img(it)}</div><div class="grow"><b>${esc(itemTitle(it))}</b><div class="small m">${it.lock ? `🔒 ${esc(lockName(it.lock))}` : it.jb ? (pear ? 'Jailbreak ✓' : 'Root ✓') : T('Стоковая прошивка', 'Стокова прошивка', 'Stock firmware')}</div></div></div><div class="btns">${it.lock ? `<button class="btn sm ${fixable ? '' : 'dark'}" data-a="flash" data-v="${it.id}" style="background:${fixable ? '#1a7a4a' : ''}">⚡ ${T('Перепрошить', 'Перепрошити', 'Reflash')}</button>` : ''}${!it.lock && !it.jb && m.os ? `<button class="btn sm dark" data-a="jb" data-v="${it.id}">${pear ? '🔓 Jailbreak' : '🤖 Root'} +6%</button>` : ''}</div></div>`;
    }).join('') : `<div class="empty">${T('Телефонов на складе нет.', 'Телефонів на складі немає.', 'No phones in storage.')}<br>${T('Купи телефон в объявлениях, лучше с пометкой 🔒 «Заблокирован».', 'Купи телефон в оголошеннях, краще з позначкою 🔒.', 'Buy a phone, ideally a 🔒 locked one.')}</div>`}`;
}
export const labApp = {
  id: 'lab', glyph: 'lockphone', lvl: 2, glyphColor: '#2ef2a0',
  name: ['Джейлбрейк', 'Джейлбрейк', 'Jailbreak'], colors: ['#0d1a14', '#030806'], accent: '#2ef2a0', dark: true,
  title: () => '>_ ' + T('Джейлбрейк', 'Джейлбрейк', 'Jailbreak'),
  right: () => '<span class="pill" style="background:#0f2a1e;color:#2ef2a0">Phone Lab</span>',
  views: { main: labMain },
  actions: {
    flash: async (id) => {
      const it = getItem(id);
      if (!LOCKS[it.lock]?.fixable) { toast(T('Безнадёжно: такую блокировку не снять. Продайте на запчасти.', 'Безнадійно: таке блокування не зняти.', 'Hopeless: sell it for parts.'), 'r'); sfx('err'); return; }
      const r = await playMini('flash', { title: `${T('Перепрошивка', 'Перепрошивка', 'Reflash')} · ${itemTitle(it)}`, item: it, pass: 1 });
      if (r.quit) return;
      const res = reflash(it, r.score >= 1);
      toast(res === 'fail' ? T('Не удалось. Попробуйте ещё раз.', 'Не вдалося. Спробуйте ще.', 'Failed. Try again.') : T(`Снято: ${lockName(res)}`, `Знято: ${lockName(res)}`, `Removed: ${lockName(res)}`), res === 'fail' ? 'r' : 'g');
      rerender();
    },
    jb: async (id) => {
      const it = getItem(id);
      if (!(await confirmBox(T('Рискнуть?', 'Ризикнути?', 'Take the risk?'), T('Успех: +6% к цене. Ошибка: бутлуп (потом можно перепрошить).', 'Успіх: +6% до ціни. Помилка: бутлуп.', 'Success: +6% value. Failure: bootloop (reflash later).')))) return;
      const r = await playMini('jb', { title: `${MODEL[it.m]?.os === 'pear' ? T('Джейлбрейк', 'Джейлбрейк', 'Jailbreak') : T('Рут', 'Рут', 'Root')} · ${itemTitle(it)}`, item: it, pass: 1 });
      if (r.quit) return;
      const res = jailbreak(it, r.score >= 1);
      toast(res === 'ok' ? T('Готово! +6% к цене', 'Готово! +6% до ціни', 'Done! +6% value') : T('Бутлуп! Нужна перепрошивка', 'Бутлуп! Потрібна перепрошивка', 'Bootloop! Needs a reflash'), res === 'ok' ? 'g' : 'r');
      rerender();
    },
  },
};

// ---------------------------------------------------------------- DELIVERY
function delMain() {
  const s = G.s;
  const act = s.deliveries;
  const done = s.delivered || [];
  return `${act.length ? `<h3 class="sub">${T('В пути', 'В дорозі', 'In transit')}</h3>` + act.map((d) => {
    const it = d.item;
    return `<div class="card"><div class="row"><div class="th" style="width:64px;height:64px;border-radius:12px;overflow:hidden;flex:none">${it ? img(it) : ''}</div><div class="grow"><b>${esc(d.title || (it ? itemTitle(it) : ''))}</b><div class="small m">${d.kind === 'out' ? `${T('Покупатель', 'Покупець', 'Buyer')}: ${esc(d.who)} · ${fmt(d.sale.payout)}` : `${T('От', 'Від', 'From')}: ${esc(d.who || '')}${d.ret ? ' · ' + T('возврат', 'повернення', 'return') : ''}`}</div><div class="small">${d.kind === 'out' ? '📤' : '📥'} <span data-cd="${d.eta}" data-fmt="long"></span></div><div class="bar mt"><i data-bar-from="${d.start}" data-bar-to="${d.eta}"></i></div></div></div></div>`;
  }).join('') : ''}
    <h3 class="sub">${T('Доставлено', 'Доставлено', 'Delivered')}</h3>
    ${done.length ? done.map((d) => `<div class="list-item"><div class="th">${d.img ? img(d.img) : ''}</div><div class="grow"><div class="t">${esc(d.title || (d.img ? itemTitle(d.img) : ''))}</div><div class="s">${d.kind === 'out' ? T('Получил', 'Отримав', 'Received by') : T('От', 'Від', 'From')}: ${esc(d.who || '')}, ${ago(d.doneAt)}</div>${d.kind === 'out' ? `<div class="small g bold">${fmt(d.sale.payout)} · ${T('прибыль', 'прибуток', 'profit')} ${fmt(d.sale.payout - d.sale.paid)}</div>` : ''}</div></div>`).join('') : empty('box', T('Пока ничего', 'Поки нічого', 'Nothing yet'))}
    <div class="small m mt">${T('Ускорить доставку можно в «Улучшениях».', 'Прискорити доставку можна в «Покращеннях».', 'Speed up deliveries in Upgrades.')}</div>`;
}
export const deliveryApp = {
  id: 'delivery', glyph: 'box', lvl: 1,
  name: () => regName('delivery'), colors: () => regColors('delivery'),
  badge: () => G.s.deliveries.length,
  views: { main: delMain },
  actions: {},
};
