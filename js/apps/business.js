// Business app: company, stores, shelves, staff, renovation, interior, advertising.
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { esc, shade } from '../core/util.js';
import { fmt, nicePrice } from '../core/money.js';
import { CATS, CAT_LIST } from '../data/catalog.js';
import { CITY, countryOf } from '../data/world.js';
import { icon } from '../ui/icons.js';
import { go, rerender, toast, askPrice, confirmBox, choose, sheet, resolveSheet, ago, openApp, UI } from '../ui/shell.js';
import { img, empty, bar, kv, row, avatar } from '../ui/comp.js';
import { PROPS, RENO, STYLES, ROLES, staffTrait, shopById, propById, openShop, closeShop, shelf, stockItem, unstock, renovate, renoCost, styleCost, setStyle, candidates, hire, fire, shopTraffic, runAds, adsCost, countriesWithShops } from '../game/business.js';
import { itemTitle, itemSub, itemValue, isVehicle } from '../game/items.js';
import { getItem, spend } from '../game/player.js';
import { sfx } from '../ui/sfx.js';

const SH = { tab: 'shelf' };

function storefront(shop) {
  const st = STYLES.find((x) => x.id === shop.style) || STYLES[0];
  const [a, b] = st.c;
  const reno = shop.reno;
  const neon = shop.style === 'neon';
  return `<div class="storefront"><svg viewBox="0 0 400 200"><rect width="400" height="200" fill="${reno ? b : '#3a3a3a'}"/><rect x="0" y="150" width="400" height="50" fill="#2a2f38"/><rect x="40" y="30" width="320" height="130" fill="${reno >= 2 ? shade(b, 0.15) : '#555'}" stroke="${a}" stroke-width="${reno ? 4 : 1}"/><rect x="60" y="70" width="130" height="85" fill="#9fd3ff" opacity="${reno ? 0.55 : 0.25}"/><rect x="210" y="70" width="70" height="90" fill="#222"/><rect x="295" y="70" width="50" height="85" fill="#9fd3ff" opacity="${reno ? 0.55 : 0.25}"/><rect x="60" y="38" width="280" height="26" rx="4" fill="${neon ? '#0b0b14' : a}"/><text x="200" y="57" font-size="16" font-weight="800" text-anchor="middle" fill="${neon ? '#ff2bd6' : shade(a, -0.7)}" font-family="-apple-system,Arial" ${neon ? 'style="filter:drop-shadow(0 0 4px #ff2bd6)"' : ''}>${esc(shop.name.toUpperCase().slice(0, 26))}</text>${reno >= 3 ? `<rect x="40" y="160" width="320" height="6" fill="${a}"/>` : ''}${shelf(shop).slice(0, 4).map((it, i) => `<circle cx="${80 + i * 28}" cy="${140}" r="9" fill="${CATS[it.cat].color}"/>`).join('')}${shop.open ? '' : '<text x="245" y="120" font-size="12" fill="#ff5468" text-anchor="middle" font-weight="800">CLOSED</text>'}</svg></div>`;
}

function bizMain() {
  const s = G.s;
  const canOpen = ['ip', 'company'].includes(s.tax.regime);
  const freeProps = s.props.filter((p) => ['shop', 'showroom'].includes(p.kind) && !s.biz.shops.some((sh) => sh.propId === p.id));
  let h = `<div class="card"><div class="small m">${T('Компания', 'Компанія', 'Company')}</div><div class="row between"><h3 style="font-size:22px">${esc(s.biz.name || T('Без названия', 'Без назви', 'Unnamed'))}</h3><button class="btn xs dark" data-a="rename">✎</button></div><div class="small m">${T('Магазинов', 'Магазинів', 'Stores')}: ${s.biz.shops.length} · ${T('стран', 'країн', 'countries')}: ${countriesWithShops()} · ${T('сотрудников', 'співробітників', 'staff')}: ${s.biz.shops.reduce((a, sh) => a + sh.staff.length, 0)}</div></div>`;
  if (!canOpen) h += `<div class="card warn"><h3>${T('Нужна регистрация бизнеса', 'Потрібна реєстрація бізнесу', 'Business registration needed')}</h3><div class="d">${T('Чтобы открывать магазины, оформите ИП или компанию в госуслугах.', 'Щоб відкривати магазини, оформіть ФОП або компанію.', 'Register as a business in the gov app to open stores.')}</div><button class="btn sm mt" data-a="open" data-v="gov">${T('Перейти', 'Перейти', 'Go')}</button></div>`;
  else if (!s.biz.shops.length) h += `<div class="card"><h3>${T('Открой свой бизнес', 'Відкрий свій бізнес', 'Start your business')}</h3><div class="d">${T('Придумай название и выбери первую точку продаж. Точки покупаются или арендуются в «Недвижимость» → «Коммерция».', 'Придумай назву й обери першу точку продажу. Точки купуються або орендуються в «Нерухомість» → «Комерція».', 'Name it and pick your first spot. Spots are bought or leased in Real estate → Commercial.')}</div></div>`;
  if (canOpen) h += `<div class="card"><h3>${T('Точка продаж', 'Точка продажу', 'Sales point')}</h3>${freeProps.length ? freeProps.map((p) => { const d = PROPS.find((x) => x.id === p.def); return `<div class="kv"><span>${d.icon} ${esc(L(d.n))} · ${esc(L(CITY[p.city].name))}</span><button class="btn xs" data-a="newshop" data-v="${p.id}">${T('Открыть', 'Відкрити', 'Open')}</button></div>`; }).join('') : `<div class="d">${T('У тебя пока нет свободных точек.', 'У тебе поки немає вільних точок.', 'No free spots yet.')}</div>`}<button class="btn block mt" data-a="open" data-v="realty">${T('Выбрать в «Недвижимости»', 'Обрати в «Нерухомості»', 'Pick in Real estate')}</button></div>`;
  for (const sh of s.biz.shops) h += `<div class="card click" data-a="go" data-v="shop" data-id="${sh.id}">${storefront(sh)}<div class="row between"><b>${esc(sh.name)}</b><span class="tag ${sh.open ? 'g' : 'r'}">${sh.open ? T('открыт', 'відкрито', 'open') : T('закрыт', 'закрито', 'closed')}</span></div><div class="small m">${countryOf(sh.city).flag} ${esc(L(CITY[sh.city].name))} · ${T('полки', 'полиці', 'shelves')} ${shelf(sh).length}/${sh.slots} · ${T('выручка', 'виручка', 'revenue')} ${fmt(sh.rev)} · ${T('продано', 'продано', 'sold')} ${sh.sold}</div></div>`;
  return h;
}

function shopView(p) {
  const s = G.s;
  const sh = shopById(p.id);
  if (!sh) return empty('store', T('Магазин закрыт', 'Магазин закрито', 'Store closed'));
  const tabs = ['shelf', 'staff', 'look', 'log'].map((t) => `<button class="${SH.tab === t ? 'on' : ''}" data-a="stab" data-v="${t}">${{ shelf: T('Полки', 'Полиці', 'Shelves'), staff: T('Персонал', 'Персонал', 'Staff'), look: T('Ремонт', 'Ремонт', 'Fit‑out'), log: T('Журнал', 'Журнал', 'Log') }[t]}</button>`).join('');
  const traffic = shopTraffic(sh);
  const hasSeller = sh.staff.some((x) => x.role === 'seller');
  let h = storefront(sh) + `<div class="stats"><div class="stat"><small>${T('Покупателей/час', 'Покупців/год', 'Visitors/h')}</small><b>${traffic.toFixed(1)}</b></div><div class="stat"><small>${T('Выручка', 'Виручка', 'Revenue')}</small><b class="g">${fmt(sh.rev)}</b></div></div>`;
  if (!hasSeller && sh.city !== s.player.city) h += `<div class="card warn small">${T('Нет продавца — магазин работает, только когда вы в этом городе.', 'Немає продавця — магазин працює, лише коли ви в цьому місті.', 'No clerk — the store only sells while you’re in town.')}</div>`;
  h += `<div class="seg mt">${tabs}</div>`;
  if (SH.tab === 'shelf') {
    const items = shelf(sh);
    const avail = s.inv.filter((i) => !i.shop && !i.listed && (i.loc || s.player.city) === sh.city && (!isVehicle(i) || sh.def === 'showroom'));
    h += `<div class="small m mb">${T('Полки', 'Полиці', 'Shelves')}: ${items.length}/${sh.slots}. ${T('Цена выше рынка — продаётся медленнее.', 'Ціна вища за ринок — продається повільніше.', 'Above‑market prices sell slower.')}</div>` + (items.length ? items.map((it) => { const v = itemValue(it, sh.city, 'known'); return row(it, `<div style="text-align:right;flex:none"><b>${fmt(it.shopPrice)}</b><div class="small ${it.shopPrice <= v ? 'g' : 'o'}">${Math.round((it.shopPrice / v) * 100)}%</div><button class="btn xs dark" data-a="unstock" data-v="${it.id}">✕</button></div>`, esc(itemSub(it)), 'reprice', it.id); }).join('') : `<p class="p">${T('Полки пустые.', 'Полиці порожні.', 'Shelves are empty.')}</p>`);
    if (items.length < sh.slots) h += `<h3 class="sub">${T('Добавить со склада', 'Додати зі складу', 'Add from storage')}</h3>` + (avail.length ? avail.map((it) => row(it, `<button class="btn xs" data-a="stock" data-v="${it.id}">+</button>`, `${T('рынок', 'ринок', 'market')} ${fmt(itemValue(it, sh.city, 'known'))}`, 'stock', it.id)).join('') : `<p class="p">${T('Нет подходящих вещей в этом городе.', 'Немає відповідних речей у цьому місті.', 'No eligible items in this city.')}</p>`);
  }
  if (SH.tab === 'staff') {
    h += sh.staff.map((st) => `<div class="list-item">${avatar(st.name, st.hue)}<div class="grow"><div class="t">${ROLES[st.role].icon} ${esc(st.name)} · ${esc(L(ROLES[st.role].n))}</div><div class="s">${'★'.repeat(st.skill)} · ${esc(staffTrait(st.trait))} · ${fmt(st.wage)}/${T('день', 'день', 'day')}</div></div><button class="btn xs dark" data-a="fire" data-v="${st.id}">${T('Уволить', 'Звільнити', 'Fire')}</button></div>`).join('') || `<p class="p">${T('Нет сотрудников.', 'Немає співробітників.', 'No staff.')}</p>`;
    if (sh.staff.some((x) => x.role === 'buyer')) h += `<div class="card"><b>🛒 ${T('Бюджет закупщика', 'Бюджет закупника', 'Buyer budget')}: ${fmt(sh.budget)}</b><div class="d">${T('Закупщик сам скупает выгодные объявления в этом городе.', 'Закупник сам скуповує вигідні оголошення.', 'The buyer snaps up good local deals.')}</div><button class="btn sm mt" data-a="budget">${T('Пополнить', 'Поповнити', 'Top up')}</button></div>`;
    h += `<h3 class="sub">${T('Кандидаты', 'Кандидати', 'Candidates')}</h3>` + candidates().map((c) => `<div class="list-item">${avatar(c.name, c.hue)}<div class="grow"><div class="t">${ROLES[c.role].icon} ${esc(c.name)} · ${esc(L(ROLES[c.role].n))}</div><div class="s">${'★'.repeat(c.skill)}${'☆'.repeat(5 - c.skill)} · ${esc(staffTrait(c.trait))}</div></div><button class="btn xs" data-a="hire" data-v="${c.id}">${fmt(c.wage)}/${T('д', 'д', 'd')}</button></div>`).join('') + `<p class="small m">${T('«Подозрительные» могут воровать. Охранник снижает кражи, управляющий повышает продажи и экономит зарплаты.', '«Підозрілі» можуть красти. Охоронець зменшує крадіжки.', 'Shady staff may steal; guards reduce theft, managers boost sales.')}</p>`;
  }
  if (SH.tab === 'look') {
    h += `<div class="card"><h3>${T('Ремонт', 'Ремонт', 'Renovation')}: ${esc(L(RENO[sh.reno].n))}</h3>${RENO.map((r, i) => `<div class="kv"><span>${esc(L(r.n))} · ×${r.mult} ${T('трафик', 'трафік', 'traffic')}</span>${i <= sh.reno ? (i === sh.reno ? '<span class="tag g">✓</span>' : '') : `<button class="btn xs" data-a="reno" data-v="${i}">${fmt(renoCost(sh, i))}</button>`}</div>`).join('')}</div>
      <div class="card"><h3>${T('Интерьер', 'Інтерʼєр', 'Interior')}</h3><div class="d">${T('Стиль под категорию товаров даёт больше покупателей.', 'Стиль під категорію товарів дає більше покупців.', 'A style matching your goods draws more buyers.')}</div>${STYLES.map((st) => `<div class="kv"><span><b>${esc(L(st.n))}</b><br><span class="small">${st.cats.map((c) => CATS[c].icon).join(' ')}</span></span>${sh.style === st.id ? '<span class="tag g">✓</span>' : `<button class="btn xs dark" data-a="style" data-v="${st.id}">${fmt(styleCost(sh))}</button>`}</div>`).join('')}</div>
      <div class="card"><h3>📣 ${T('Реклама', 'Реклама', 'Advertising')}</h3><div class="d">${T('+25% трафика за уровень, действует несколько дней.', '+25% трафіку за рівень, діє кілька днів.', '+25% traffic per level for a few days.')} ${T('Сейчас', 'Зараз', 'Now')}: ${sh.ads}</div><button class="btn sm mt" data-a="ads">${fmt(adsCost(sh))}</button></div>
      <div class="btns"><button class="btn dark" data-a="toggle">${sh.open ? T('Закрыть на время', 'Закрити тимчасово', 'Close temporarily') : T('Открыть', 'Відкрити', 'Open')}</button><button class="btn red" data-a="closeshop">${T('Закрыть магазин', 'Закрити магазин', 'Shut down')}</button></div>`;
  }
  if (SH.tab === 'log') h += sh.log.map((l) => `<div class="kv"><span>${esc(l.tx)}</span><span class="tiny">${ago(l.t)}</span></div>`).join('') || `<p class="p">—</p>`;
  return h;
}
export const businessApp = {
  id: 'business', glyph: 'store', lvl: 5,
  name: ['Бизнес', 'Бізнес', 'Business'], colors: ['#14a085', '#0b6b58'],
  views: { main: bizMain, shop: shopView },
  title: (v, p) => (v === 'shop' ? shopById(p.id)?.name || '' : T('Бизнес', 'Бізнес', 'Business')),
  actions: {
    rename: async () => {
      const v = await sheet(`<h2>${T('Название компании', 'Назва компанії', 'Company name')}</h2><input class="input" id="bn" maxlength="28" value="${esc(G.s.biz.name)}" placeholder="${T('Например, «Перекуп Plus»', 'Наприклад, «Перекуп Plus»', 'e.g. “Flip Plus”')}"><button class="btn block mt" id="bnok">OK</button>`, { after(el) { el.querySelector('#bnok').onclick = () => resolveSheet(el.querySelector('#bn').value.trim()); } });
      if (v) { G.s.biz.name = v; rerender(); }
    },
    newshop: async (propId) => {
      const s = G.s;
      if (!s.biz.name) await businessApp.actions.rename();
      const cat = await choose(T('Специализация', 'Спеціалізація', 'Specialization'), [{ v: 'mix', label: T('Всё подряд', 'Усе підряд', 'Everything') }, ...CAT_LIST.map((c) => ({ v: c, label: `${CATS[c].icon} ${L(CATS[c].name)}` }))]);
      if (!cat) return;
      const sh = openShop(propId, s.biz.name || T('Мой магазин', 'Мій магазин', 'My store'), cat);
      if (sh) { sfx('win'); toast(T('Магазин открыт!', 'Магазин відкрито!', 'Store opened!'), 'g'); go('shop', { id: sh.id }); }
    },
    stab: (v) => { SH.tab = v; rerender(); },
    stock: async (id) => { const sh = shopById(UI.params.id); const it = getItem(id); const p = await askPrice({ title: T('Цена на полке', 'Ціна на полиці', 'Shelf price'), value: nicePrice(itemValue(it, sh.city, 'known') * 1.08), min: 1, max: itemValue(it, sh.city, 'known') * 3 }); if (p && stockItem(sh, id, p)) { sfx('ok'); rerender(); } },
    unstock: (id, el, ev) => { ev.stopPropagation(); unstock(id); rerender(); },
    reprice: async (id) => { const it = getItem(id); const p = await askPrice({ title: T('Новая цена', 'Нова ціна', 'New price'), value: it.shopPrice, min: 1, max: it.shopPrice * 3 }); if (p) { it.shopPrice = p; rerender(); } },
    hire: (id) => { if (hire(shopById(UI.params.id), id)) { sfx('ok'); toast(T('Сотрудник нанят', 'Співробітника найнято', 'Hired'), 'g'); } else toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r'); rerender(); },
    fire: async (id) => { if (await confirmBox(T('Уволить?', 'Звільнити?', 'Fire?'), '', T('Уволить', 'Звільнити', 'Fire'), undefined, true)) { fire(shopById(UI.params.id), id); rerender(); } },
    budget: async () => { const sh = shopById(UI.params.id); const v = await askPrice({ title: T('Пополнить бюджет', 'Поповнити бюджет', 'Top up budget'), value: Math.min(G.s.money, 200), min: 1, max: Math.max(1, G.s.money) }); if (v && spend(v, 'biz', T('Бюджет закупки', 'Бюджет закупівлі', 'Buying budget'))) { sh.budget += v; rerender(); } },
    reno: async (lvl) => { const sh = shopById(UI.params.id); if (!(await confirmBox(L(RENO[+lvl].n), fmt(renoCost(sh, +lvl)), T('Сделать', 'Зробити', 'Do it')))) return; if (renovate(sh, +lvl)) { sfx('win'); rerender(); } else toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r'); },
    style: (id) => { if (setStyle(shopById(UI.params.id), id)) { sfx('ok'); rerender(); } else toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r'); },
    ads: () => { if (runAds(shopById(UI.params.id))) { sfx('ok'); rerender(); } else toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r'); },
    toggle: () => { const sh = shopById(UI.params.id); sh.open = !sh.open; rerender(); },
    closeshop: async () => { if (await confirmBox(T('Закрыть магазин навсегда?', 'Закрити магазин назавжди?', 'Shut down the store?'), T('Товары вернутся на склад.', 'Товари повернуться на склад.', 'Goods return to storage.'), T('Закрыть', 'Закрити', 'Shut down'), undefined, true)) { closeShop(UI.params.id); go('main'); } },
  },
};
