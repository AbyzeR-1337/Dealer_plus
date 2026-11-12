// Car market, Yo.Market (with Split) and Supplier (Shenzhen wholesale) apps.
import { G } from '../core/state.js';
import { T, L, dur } from '../core/i18n.js';
import { esc } from '../core/util.js';
import { fmt } from '../core/money.js';
import { MODEL } from '../data/catalog.js';
import { CITY } from '../data/world.js';
import { rerender, toast, choose, confirmBox, openApp, go, askPrice, sheet, resolveSheet } from '../ui/shell.js';
import { img, empty, specs, defectList, tags } from '../ui/comp.js';
import { itemTitle, itemSub, isVehicle } from '../game/items.js';
import { getItem, freeSpace } from '../game/player.js';
import { findListing, marketEstimate } from '../game/market.js';
import { buyFlow, sellFlow } from './common.js';
import { playMini } from '../mini/engine.js';
import { sfx } from '../ui/sfx.js';
import {
  CAR_CLASSES, carClass, autoFeed, vinReport, VIN_PRICE, buyoutPrice, dealerBuyout,
  YM_BRANDS, ymState, ymFeed, splitDebt, splitLimit, ymBuy,
  supState, cnyRate, lots, buyYuan, sellYuan, setDeal, lotTotal, payLot, inShenzhen, cargoHome, SZX, lotQty, pickQty, unitFor, lotRisk, VOL, findLot, lotTitle, boxes, findBox, boxTitle, myBoxes, orderBox, openBox, boxRefreshAt, boxWindow, BOX_THEMES, BOX_SIZES, BOX_DELIVERY,
} from '../game/shops2.js';

// ---------------------------------------------------------------- car market
const AV = { cls: null, tab: 'feed' };
const pct = (l) => Math.round((1 - l.price / Math.max(1, marketEstimate(l.item, l.city))) * 100);
const carRow = (l) => { const d = pct(l); return `<div class="au-row" data-a="auopen" data-v="${l.id}"><div class="au-img">${img(l.item)}${d >= 8 ? `<span class="au-good">−${d}% ${T('к рынку', 'до ринку', 'below market')}</span>` : ''}</div><div class="au-body"><b>${esc(itemTitle(l.item))}</b><div class="au-price">${fmt(l.price)}</div><small>${l.item.km != null ? `${Math.round(l.item.km / 1000)} ${T('тыс. км', 'тис. км', 'k km')} · ` : ''}${esc(l.item.eng || '')} ${esc(l.item.tr || '')}${l.item.vin ? ' · ✅ VIN' : ''}</small>${l.sold ? `<small class="r">${T('Продано', 'Продано', 'Sold')}</small>` : ''}</div></div>`; };
function autoMain() {
  const s = G.s, f = autoFeed();
  if (AV.tab === 'item') return autoItem();
  const mine = s.inv.filter((it) => isVehicle(it));
  const favs = f.items.filter((l) => s.favs.includes(l.id));
  const hist = (s.autoHist || []).map(findListing).filter(Boolean);
  let list = f.items.filter((l) => !l.sold || l.buyer === 'me');
  if (AV.cls) list = list.filter((l) => carClass(l.item) === AV.cls);
  const deals = list.filter((l) => pct(l) >= 8).sort((a, b) => pct(b) - pct(a));
  let h = `<div class="au-search">🔍 ${T('Марка или модель', 'Марка або модель', 'Make or model')}</div>
    <div class="au-sell" data-a="ausell"><b>🏷 ${T('Продать свою машину', 'Продати свою машину', 'Sell your car')}</b><small>${mine.length ? T(`Выкуп дилером за минуту или объявление · ${mine.length} в гараже`, `Викуп дилером за хвилину або оголошення · ${mine.length} у гаражі`, `Instant dealer buyout or a listing · ${mine.length} in your garage`) : T('Сначала купите машину', 'Спершу купіть машину', 'Buy a car first')}</small></div>
    <div class="au-tiles"><div data-a="autab" data-v="mine"><b>🚘 ${T('Мои авто', 'Мої авто', 'My cars')}</b><small>${mine.length}</small></div><div data-a="autab" data-v="fav"><b>❤️ ${T('Избранное', 'Обране', 'Saved')}</b><small>${favs.length}</small></div><div data-a="autab" data-v="hist"><b>🕘 ${T('История', 'Історія', 'History')}</b><small>${hist.length}</small></div></div>
    <h3 class="sub">${T('Категории', 'Категорії', 'Categories')}</h3><div class="chips wrap">${CAR_CLASSES.map(([k, n]) => `<button class="chip${AV.cls === k ? ' on' : ''}" data-a="aucls" data-v="${k}">${esc(L(n))}</button>`).join('')}</div>`;
  if (AV.tab === 'mine') h += `<h3 class="sub">${T('Мои авто', 'Мої авто', 'My cars')}</h3>` + (mine.map((it) => `<div class="list-item" data-a="ausellone" data-v="${it.id}"><div class="th">${img(it)}</div><div class="grow"><div class="t">${esc(itemTitle(it))}</div><div class="s">${T('Выкуп', 'Викуп', 'Buyout')}: ${fmt(buyoutPrice(it))}</div></div></div>`).join('') || `<p class="p">${T('Гараж пуст', 'Гараж порожній', 'Garage is empty')}</p>`);
  else if (AV.tab === 'fav') h += `<h3 class="sub">${T('Избранное', 'Обране', 'Saved')}</h3>` + (favs.map(carRow).join('') || `<p class="p">${T('Пусто', 'Порожньо', 'Empty')}</p>`);
  else if (AV.tab === 'hist') h += `<h3 class="sub">${T('Вы смотрели', 'Ви дивилися', 'You viewed')}</h3>` + (hist.map(carRow).join('') || `<p class="p">${T('Пусто', 'Порожньо', 'Empty')}</p>`);
  else h += `${deals.length ? `<h3 class="sub">🔥 ${T('Выгодные предложения', 'Вигідні пропозиції', 'Good deals')}</h3>` + deals.slice(0, 4).map(carRow).join('') : ''}<h3 class="sub">${T('Все объявления', 'Усі оголошення', 'All listings')} · ${list.length}</h3>` + list.map(carRow).join('');
  return h;
}
function autoItem() {
  const l = findListing(AV.id); if (!l) { AV.tab = 'feed'; return autoMain(); }
  const it = l.item, fav = G.s.favs.includes(l.id);
  return `<button class="btn xs dark" data-a="autab" data-v="feed">‹ ${T('Назад', 'Назад', 'Back')}</button><div class="au-big">${img(it, { size: 640 })}</div>
    <div style="font-size:19px;font-weight:700">${esc(itemTitle(it))}</div><div class="au-price">${fmt(l.price)}</div><div class="small m">${T('Оценка рынка', 'Оцінка ринку', 'Market estimate')} ≈ ${fmt(marketEstimate(it, l.city))} · ${esc(l.seller.name)}</div>${tags(it)}
    <div class="btns"><button class="btn" data-a="aubuy" data-v="${l.id}" ${l.sold ? 'disabled' : ''}>${l.sold ? T('Продано', 'Продано', 'Sold') : T('Купить', 'Купити', 'Buy')}</button><button class="btn dark" data-a="aufav" data-v="${l.id}">${fav ? '❤️' : '🤍'}</button></div>
    <button class="btn dark block mt" data-a="auvin" data-v="${l.id}" ${it.vin ? 'disabled' : ''}>🔎 ${it.vin ? T('Отчёт по VIN получен', 'Звіт за VIN отримано', 'VIN report done') : T(`Проверить по VIN · ${fmt(VIN_PRICE)}`, `Перевірити за VIN · ${fmt(VIN_PRICE)}`, `Check the VIN · ${fmt(VIN_PRICE)}`)}</button>
    <h3 class="sub">${T('Состояние', 'Стан', 'Condition')}</h3>${defectList(it)}<h3 class="sub">${T('Характеристики', 'Характеристики', 'Specs')}</h3><div class="card">${specs(it)}</div>`;
}
export const autoApp = {
  id: 'auto', glyph: 'car', lvl: 2,
  name: ['Авторынок', 'Авторинок', 'Car Market'], colors: ['#ef2d3d', '#b3101f'], glyphColor: '#fff',
  views: { main: autoMain },
  onOpen: () => { AV.tab = 'feed'; },
  actions: {
    aucls: (k) => { AV.cls = AV.cls === k ? null : k; AV.tab = 'feed'; rerender(); },
    autab: (v) => { AV.tab = AV.tab === v && v !== 'feed' ? 'feed' : v; rerender(); },
    auopen: (id) => { const s = G.s; s.autoHist = [id, ...(s.autoHist || []).filter((x) => x !== id)].slice(0, 20); AV.id = id; AV.tab = 'item'; rerender(); document.querySelector('.abody')?.scrollTo(0, 0); },
    aufav: (id) => { const s = G.s; s.favs = s.favs.includes(id) ? s.favs.filter((x) => x !== id) : [...s.favs, id]; rerender(); },
    aubuy: async (id) => { const l = findListing(id); if (!l || l.sold) return; if (await buyFlow(l)) rerender(); },
    auvin: async (id) => {
      const l = findListing(id); if (!l) return;
      const r = vinReport(l.item); if (!r) return toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r');
      sfx('ok');
      await sheet(`<h2>🔎 ${T('Отчёт по VIN', 'Звіт за VIN', 'VIN report')}</h2><div class="kv"><span>${T('Владельцев', 'Власників', 'Owners')}</span><b>${r.owners}</b></div><div class="kv"><span>${T('ДТП', 'ДТП', 'Accidents')}</span><b class="${r.crashes ? 'r' : 'g'}">${r.crashes ? r.crashes + ' ' + T('записи', 'записи', 'records') : T('нет', 'немає', 'none')}</b></div><div class="kv"><span>${T('Пробег', 'Пробіг', 'Mileage')}</span><b class="${r.realKm !== r.km ? 'r' : 'g'}">${r.realKm !== r.km ? T(`скручен: было ${Math.round(r.realKm / 1000)} тыс. км`, `скручено: було ${Math.round(r.realKm / 1000)} тис. км`, `rolled back: was ${Math.round(r.realKm / 1000)}k km`) : T('совпадает', 'збігається', 'matches')}</b></div><div class="kv"><span>${T('Залог / ограничения', 'Застава / обмеження', 'Liens')}</span><b class="${r.pledge ? 'r' : 'g'}">${r.pledge ? T('есть проблемы с документами', 'є проблеми з документами', 'paperwork issues') : T('чисто', 'чисто', 'clean')}</b></div><div class="kv"><span>${T('Скрытые проблемы', 'Приховані проблеми', 'Hidden issues')}</span><b>${r.found.length}</b></div><button class="btn block mt" onclick="">OK</button>`, { after(el) { el.querySelector('.btn').onclick = () => resolveSheet(1); } });
      rerender();
    },
    ausell: async () => { const mine = G.s.inv.filter((it) => isVehicle(it)); if (!mine.length) return toast(T('В гараже пусто', 'У гаражі порожньо', 'Your garage is empty')); AV.tab = 'mine'; rerender(); },
    ausellone: async (id) => {
      const it = getItem(id); if (!it) return;
      const v = await choose(itemTitle(it), [{ v: 'buyout', label: T(`Выкуп дилером: ${fmt(buyoutPrice(it))}`, `Викуп дилером: ${fmt(buyoutPrice(it))}`, `Dealer buyout: ${fmt(buyoutPrice(it))}`), sub: T('деньги сразу, ~80% рынка', 'гроші одразу, ~80% ринку', 'cash now, ~80% of market') }, { v: 'list', label: T('Разместить объявление', 'Розмістити оголошення', 'Post a listing'), sub: T('дороже, но ждать покупателя', 'дорожче, але чекати покупця', 'more money, but you wait'), cls: 'dark' }]);
      if (v === 'buyout') { if (!(await confirmBox(T('Продать дилеру?', 'Продати дилеру?', 'Sell to the dealer?'), fmt(buyoutPrice(it)), T('Продать', 'Продати', 'Sell')))) return; const p = dealerBuyout(it); sfx('cash'); toast(`+${fmt(p)}`, 'g'); }
      else if (v === 'list') await sellFlow(id);
      rerender();
    },
  },
};

// ---------------------------------------------------------------- Yo.Market
const YV = { brand: 'Pear' };
function ymMain() {
  const st = ymState(), f = ymFeed(), s = G.s;
  const debt = splitDebt();
  const blocked = st.block > s.t;
  let h = `<div class="ym-search">🔍 ${T('Найти телефон', 'Знайти телефон', 'Find a phone')}</div>
    <div class="ym-split"><span class="ym-tag">${T('Сплит', 'Спліт', 'Split')}</span><small>${T('Долг по сплитам', 'Борг за сплітами', 'Split debt')}</small><b>${fmt(debt)}</b><div class="ym-bar"><i style="width:${Math.min(100, (debt / splitLimit()) * 100)}%"></i></div><small>${T(`Лимит ${fmt(splitLimit())} · подозрение антифрода ${Math.round(st.sus)}%`, `Ліміт ${fmt(splitLimit())} · підозра антифроду ${Math.round(st.sus)}%`, `Limit ${fmt(splitLimit())} · anti‑fraud suspicion ${Math.round(st.sus)}%`)}</small>${blocked ? `<small class="r">⛔ ${T('Сплит заблокирован ещё', 'Спліт заблоковано ще', 'Split blocked for')} ${dur(st.block - s.t)}</small>` : ''}${st.plans.length ? st.plans.map((p) => `<small>• ${esc(p.title)}: ${p.left.length} × ${fmt(p.left[0].amt)}, ${T('след. платёж через', 'наст. платіж через', 'next in')} ${dur(p.left[0].due - s.t)}</small>`).join('') : ''}</div>
    <div class="chips wrap">${YM_BRANDS.map((b) => `<button class="chip${YV.brand === b ? ' on' : ''}" data-a="ymbrand" data-v="${b}">${esc(b)}</button>`).join('')}</div>
    <p class="tiny m">${T('Сплит: 25% сейчас и три платежа раз в 2 дня. Если брать много телефонов в сплит и быстро перепродавать — антифрод заподозрит перекупа и потребует весь долг сразу.', 'Спліт: 25% зараз і три платежі раз на 2 дні. Якщо брати багато телефонів у спліт і швидко перепродувати — антифрод запідозрить перекупа й вимагатиме весь борг одразу.', 'Split: 25% now and three payments every 2 days. Buy lots of phones on Split and flip them fast — anti‑fraud will suspect a reseller and call in the whole debt.')}</p>`;
  const list = f.items.filter((x) => x.brand === YV.brand);
  h += `<div class="ym-grid">${list.map((x) => `<div class="ym-card"><div class="ym-img">${img(x.it, { size: 240 })}${x.off ? `<span>−${x.off}%</span>` : ''}</div><b class="ym-price">${fmt(x.price)} ${x.off ? `<s>${fmt(x.old)}</s>` : ''}</b><span class="ym-sp">${fmt(Math.round(x.price * 25) / 100)} × 4 ${T('Сплит', 'Спліт', 'Split')}</span><small>${esc(itemTitle(x.it))}</small><div class="ym-btns"><button data-a="ymbuy" data-v="${x.id}">${T('Купить', 'Купити', 'Buy')}</button><button class="sp" data-a="ymsplit" data-v="${x.id}" ${blocked ? 'disabled' : ''}>${T('Сплитом', 'Сплітом', 'Split')}</button></div></div>`).join('')}</div>`;
  return h;
}
const ymDo = async (id, split) => {
  const x = ymFeed().items.find((y) => y.id === id); if (!x) return;
  if (!(await confirmBox(itemTitle(x.it), split ? T(`Сейчас ${fmt(Math.round(x.price * 25) / 100)}, потом 3 платежа раз в 2 дня`, `Зараз ${fmt(Math.round(x.price * 25) / 100)}, потім 3 платежі раз на 2 дні`, `${fmt(Math.round(x.price * 25) / 100)} now, then 3 payments every 2 days`) : fmt(x.price), split ? T('Оформить сплит', 'Оформити спліт', 'Take Split') : T('Купить', 'Купити', 'Buy')))) return;
  const r = ymBuy(x, split);
  if (r.ok) { sfx('cash'); toast(T('Заказ оформлен, доставка сегодня', 'Замовлення оформлено, доставка сьогодні', 'Ordered, arriving today'), 'g'); } else toast(r.msg, 'r');
  rerender();
};
export const ymApp = {
  id: 'ymarket', glyph: 'bag', lvl: 2,
  name: ['Ё.Маркет', 'Ё.Маркет', 'Yo.Market'], colors: ['#ffdb4d', '#f5b700'], glyphColor: '#1a1a1a',
  views: { main: ymMain },
  actions: { ymbrand: (b) => { YV.brand = b; rerender(); }, ymbuy: (id) => ymDo(id, false), ymsplit: (id) => ymDo(id, true) },
};

// ---------------------------------------------------------------- Supplier
const SV = { brand: null };
function supMain() {
  const st = supState(), s = G.s, here = s.player.city === SZX;
  const ls = lots().filter((l) => !SV.brand || MODEL[l.m]?.brand === SV.brand).sort((a, b) => b.at - a.at);
  const brands = [...new Set(lots().map((l) => MODEL[l.m]?.brand))].filter(Boolean);
  const wait = inShenzhen();
  let h = `<div class="sup-top"><span>📍 ${esc(L(CITY[s.player.city].name))}</span><b>${st.cny.toLocaleString('ru')} ¥</b><button data-a="supcny">${T('Купить ¥', 'Купити ¥', 'Buy ¥')}</button>${st.cny ? `<button class="dk" data-a="supcnysell">${T('Продать ¥', 'Продати ¥', 'Sell ¥')}</button>` : ''}</div>
    <div class="sup-hero"><b>${T('Опт из Шэньчжэня', 'Опт із Шеньчжені', 'Wholesale from Shenzhen')}</b><small>${T('Договоритесь о цене, привезите юани и заберите партию лично', 'Домовтеся про ціну, привезіть юані й заберіть партію особисто', 'Agree a price, bring yuan and collect the lot in person')}</small><div class="sup-steps"><span><i>1</i>${T('Торг', 'Торг', 'Haggle')}</span><span><i>2</i>${T('Юани', 'Юані', 'Yuan')}</span><span><i>3</i>${T('Вылет', 'Виліт', 'Fly')}</span><span><i>4</i>${T('Оплата', 'Оплата', 'Pay')}</span></div><small>1 $ = ${cnyRate().toFixed(2)} ¥</small></div>
    ${wait.length ? `<div class="card hl"><b>📦 ${T(`Ваш товар в Шэньчжэне: ${wait.length} шт`, `Ваш товар у Шеньчжені: ${wait.length} шт`, `Your goods in Shenzhen: ${wait.length} pcs`)}</b><div class="small m">${T('Отправьте карго «под ключ» (12% от стоимости, 2 дня, таможня включена) или везите в багаже через «Путешествия» — с риском на таможне.', 'Надішліть карго «під ключ» (12% вартості, 2 дні, митниця включена) або везіть у багажі через «Подорожі» — з ризиком на митниці.', 'Send door‑to‑door cargo (12% of value, 2 days, customs included) or carry it via Travel — with a customs risk.')}</div><div class="btns"><button class="btn sm" data-a="supcargo">${T('Карго домой', 'Карго додому', 'Cargo home')}</button><button class="btn sm dark" data-a="open" data-v="travel">✈️ ${T('Лететь с багажом', 'Летіти з багажем', 'Fly with luggage')}</button></div></div>` : ''}
    <div class="chips wrap"><button class="chip${!SV.brand ? ' on' : ''}" data-a="supbrand" data-v="">${T('Все', 'Усі', 'All')}</button>${brands.map((b) => `<button class="chip${SV.brand === b ? ' on' : ''}" data-a="supbrand" data-v="${esc(b)}">${esc(b)}</button>`).join('')}</div>
    ${myBoxes().length ? `<h3 class="sub">📦 ${T('Мои боксы', 'Мої бокси', 'My boxes')}</h3>${myBoxes().slice(0, 6).map(myBoxRow).join('')}` : ''}
    <div class="row between sup-mixhead"><h3 class="sub">🎁 ${T('Опт‑боксы', 'Опт‑бокси', 'Wholesale boxes')}</h3><span class="small m">${T('новые через', 'нові через', 'new in')} <b data-cd="${boxRefreshAt()}" data-fmt="long"></b></span></div>
    <p class="small m" style="margin:0 0 6px">${T('Запечатанный бокс с телефонами: видно только цену и что может попасться. Сколько и каких — решает рандом, узнаете, когда откроете.', 'Запечатаний бокс із телефонами: видно лише ціну й що може трапитися. Скільки й яких — вирішує рандом, дізнаєтеся, коли відкриєте.', 'A sealed box of phones: you only see the price and what can drop. How many and which — random, you find out when you open it.')}</p>
    <div class="sup-grid">${boxes().map(boxCard).join('')}</div>
    <h3 class="sub">${T('Партии одной модели', 'Партії однієї моделі', 'Single‑model lots')}</h3><div class="sup-grid">`;
  h += ls.map((l) => {
    const d = l.deal, paid = d?.paid;
    const q = lotQty(l), u = unitFor(l, q);
    return `<div class="sup-card" data-a="go" data-v="lot" data-id="${l.id}"><div class="sup-img">${img(l.it, { size: 240 })}<span>−${l.off}% ${T('к рынку', 'до ринку', 'vs market')}</span></div><b class="sup-price">${u.toLocaleString('ru')} ¥ <small>/ ${T('шт', 'шт', 'pc')}</small></b><small class="m">≈ ${fmt(u / cnyRate())}</small><small>${esc(itemTitle(l.it))}</small><span class="sup-qty">${q} ${T('шт', 'шт', 'pcs')} · ${lotTotal(l, q).toLocaleString('ru')} ¥${d?.disc ? ` · −${d.disc}%` : ''}</span><small class="m">${esc(l.seller)} · ★ ${l.rating} · ${T('до', 'до', 'up to')} ${l.stock} ${T('шт', 'шт', 'pcs')}</small>${paid ? `<span class="g small">✅ ${T('Куплено', 'Куплено', 'Bought')}</span>` : `<button class="btn xs">📦 ${T('Выбрать партию', 'Вибрати партію', 'Choose a lot')}</button>`}</div>`;
  }).join('') || `<p class="p">${T('Партий пока нет — загляните позже', 'Партій поки немає — загляньте пізніше', 'No lots yet — check back later')}</p>`;
  h += '</div>';
  if (st.reports.length) h += `<h3 class="sub">${T('Мои партии', 'Мої партії', 'My lots')}</h3>` + st.reports.map(repCard).join('');
  return h;
}
// a box in the grid: a cardboard box with the theme on it
const boxArt = (b, big = false) => `<div class="obx-art obx-${b.size}${big ? ' big' : ''}"><span class="obx-e">${BOX_THEMES[b.theme].e}</span><span class="obx-q">?</span><span class="obx-tape"></span><span class="obx-sz">${b.size}</span></div>`;
function boxCard(b) {
  const mine = myBoxes().some((x) => x.box === b.id);
  return `<div class="sup-card obx-card" data-a="go" data-v="box" data-id="${b.id}">${boxArt(b)}<b class="sup-price">${b.price.toLocaleString('ru')} ¥</b><small class="m">≈ ${fmt(b.price / cnyRate())}</small><small><b>${esc(boxTitle(b))}</b></small><span class="sup-qty">${b.nMin}–${b.nMax} ${T('телефонов', 'телефонів', 'phones')}</span><small class="m">${esc(b.seller)}</small>${mine ? `<span class="g small">✅ ${T('Заказан', 'Замовлено', 'Ordered')}</span>` : `<button class="btn xs">🎁 ${T('Что может попасться', 'Що може трапитися', 'What can drop')}</button>`}</div>`;
}
function myBoxRow(o) {
  const st = o.opened ? `${o.n} ${T('шт', 'шт', 'pcs')} · ${fmt(o.value)} <b class="${o.value >= o.usd ? 'g' : 'r'}">${o.value >= o.usd ? '+' : '−'}${fmt(Math.abs(o.value - o.usd))}</b>` : G.s.t >= o.eta ? `<b class="g">🎁 ${T('Пришёл — откройте!', 'Прийшов — відкрийте!', 'Arrived — open it!')}</b>` : `🚚 ${T('в пути', 'у дорозі', 'on the way')} <span data-cd="${o.eta}" data-fmt="long"></span>`;
  return `<div class="ms-row obx-row" data-a="go" data-v="obox" data-id="${o.id}"><span class="obx-mini obx-${o.size}">${BOX_THEMES[o.theme].e}</span><div class="grow"><b>${esc(boxTitle(o))}</b><small class="m">${st}</small></div><span class="small m">${o.price.toLocaleString('ru')} ¥</span></div>`;
}
// what can drop: rarity tiers with chances and example models
function boxPage(p) {
  const b = findBox(p.id);
  if (!b) return empty('box', T('Бокс уже разобрали', 'Бокс уже розібрали', 'The box is gone'));
  const st = supState(), live = b.win === boxWindow(), mine = myBoxes().find((x) => x.box === b.id);
  const tiers = b.tiers.map((t) => { const ex = t.models.slice(-4).reverse().map((id) => MODEL[id]).map((m) => (m.name.startsWith(m.brand + ' ') ? m.name : `${m.brand} ${m.name}`)); return `<div class="obx-tier" style="--c:${t.col}"><div class="row between"><b>${esc(L(t.n))}</b><span class="obx-p">${t.p * 100 < 1 ? (t.p * 100).toFixed(1) : Math.round(t.p * 100)}%</span></div><small>${esc(ex.join(', '))}${t.models.length > 4 ? ` ${T(`и ещё ${t.models.length - 4}`, `і ще ${t.models.length - 4}`, `and ${t.models.length - 4} more`)}` : ''}</small></div>`; }).join('');
  const btn = mine ? `<button class="btn block" data-a="go" data-v="obox" data-id="${mine.id}">📦 ${T('Ваш бокс', 'Ваш бокс', 'Your box')}</button>` : !live ? `<button class="btn block" disabled>${T('Бокс уже разобрали', 'Бокс уже розібрали', 'The box is gone')}</button>` : st.cny < b.price ? `<button class="btn block" data-a="supcny" data-v="${b.price - st.cny}">¥ ${T(`Докупить ${(b.price - st.cny).toLocaleString('ru')} ¥`, `Докупити ${(b.price - st.cny).toLocaleString('ru')} ¥`, `Top up ${(b.price - st.cny).toLocaleString('ru')} ¥`)}</button>` : `<button class="btn block green" data-a="boxorder" data-v="${b.id}">🎁 ${T('Заказать за', 'Замовити за', 'Order for')} ${b.price.toLocaleString('ru')} ¥</button>`;
  return `${boxArt(b, true)}<h2 style="margin:10px 0 2px">${esc(boxTitle(b))}</h2><div class="small m">${esc(b.seller)}${live ? ` · ${T('исчезнет через', 'зникне через', 'gone in')} <b data-cd="${b.until}" data-fmt="long"></b>` : ''}</div>
    <div class="card"><div class="kv"><span>${T('Цена бокса', 'Ціна боксу', 'Box price')}</span><b>${b.price.toLocaleString('ru')} ¥ · ≈ ${fmt(b.price / cnyRate())}</b></div><div class="kv"><span>${T('Телефонов внутри', 'Телефонів усередині', 'Phones inside')}</span><b>${T(`от ${b.nMin} до ${b.nMax}`, `від ${b.nMin} до ${b.nMax}`, `${b.nMin} to ${b.nMax}`)}</b></div><div class="kv"><span>${T('Доставка', 'Доставка', 'Delivery')}</span><b>${T('экспресс‑карго 12 ч, таможня включена', 'експрес‑карго 12 год, митниця включена', 'express cargo 12 h, customs included')}</b></div><div class="kv"><span>${T('Ваши юани', 'Ваші юані', 'Your yuan')}</span><b>${st.cny.toLocaleString('ru')} ¥</b></div></div>
    <h3 class="sub">🎰 ${T('Что может попасться', 'Що може трапитися', 'What can drop')}</h3>${tiers}
    <p class="tiny m">${T('Шанс — для каждого телефона в боксе. Сколько их и какие — решает рандом при открытии. Модели до 2019 года — б/у, новее — запечатанные. Бывают вскрытые возвраты, брак и китайская прошивка, изредка клоны.', 'Шанс — для кожного телефона в боксі. Скільки їх і які — вирішує рандом під час відкриття. Моделі до 2019 року — б/в, новіші — запечатані. Бувають розкриті повернення, брак і китайська прошивка, зрідка клони.', 'Chances are per phone. How many and which is random when you open it. Pre‑2019 models come used, newer ones sealed. Opened returns, duds and Chinese ROMs happen, clones rarely.')}</p>
    ${btn}`;
}
// your box: on the way → open → what fell out
function oboxPage(p) {
  const o = myBoxes().find((x) => x.id === p.id);
  if (!o) return empty('box', T('Бокса нет', 'Боксу немає', 'No such box'));
  const s = G.s;
  if (!o.opened) {
    if (s.t < o.eta) return `${boxArt(o, true)}<h2 style="margin:10px 0 2px">${esc(boxTitle(o))}</h2><div class="card center">🚚 ${T('Бокс едет к вам', 'Бокс їде до вас', 'Your box is on its way')} · <b data-cd="${o.eta}" data-fmt="long"></b></div><p class="small m center">${T('Что внутри — узнаете, когда откроете.', 'Що всередині — дізнаєтеся, коли відкриєте.', 'You’ll see what’s inside when you open it.')}</p>`;
    return `<div class="obx-shake">${boxArt(o, true)}</div><h2 style="margin:10px 0 2px" class="center">${esc(boxTitle(o))}</h2><p class="small m center">${T(`От ${findBox(o.box)?.nMin ?? '?'} до ${findBox(o.box)?.nMax ?? '?'} телефонов — сколько именно, сейчас узнаем.`, `Від ${findBox(o.box)?.nMin ?? '?'} до ${findBox(o.box)?.nMax ?? '?'} телефонів — скільки саме, зараз дізнаємося.`, `${findBox(o.box)?.nMin ?? '?'} to ${findBox(o.box)?.nMax ?? '?'} phones — let’s see how many.`)}</p><button class="btn block green obx-open" data-a="boxopen" data-v="${o.id}">🎁 ${T('Открыть бокс', 'Відкрити бокс', 'Open the box')}</button>`;
  }
  const anim = SV.justOpened === o.id;
  if (anim) SV.justOpened = null;
  const col = Object.fromEntries((findBox(o.box)?.tiers || []).map((t) => [t.k, t.col]));
  const byTier = {}; for (const x of o.items || []) byTier[x.t] = (byTier[x.t] || 0) + 1;
  const diff = o.value - o.usd;
  const order = ['jack', 'top', 'good', 'common'];
  const items = [...(o.items || [])].sort((a, b) => order.indexOf(a.t) - order.indexOf(b.t) || b.val - a.val);
  return `<div class="card obx-sum"><div class="row between"><b>${esc(boxTitle(o))}</b><span class="tag ${diff >= 0 ? 'g' : 'r'}">${diff >= 0 ? '+' : '−'}${fmt(Math.abs(diff))}</span></div><div class="kv"><span>${T('Выпало телефонов', 'Випало телефонів', 'Phones inside')}</span><b>${o.n}</b></div><div class="kv"><span>${T('Рыночная стоимость', 'Ринкова вартість', 'Market value')}</span><b>${fmt(o.value)}</b></div><div class="kv"><span>${T('Заплачено', 'Сплачено', 'Paid')}</span><b>${fmt(o.usd)} · ${o.price.toLocaleString('ru')} ¥</b></div><div class="obx-tiers">${order.filter((k) => byTier[k]).map((k) => `<span style="--c:${col[k] || '#888'}">${esc(L((BOX_TIERS_N[k])))} ×${byTier[k]}</span>`).join('')}</div><div class="tiny m">${T('Цена — оценка рынка; брак и клоны всплывут при проверке. Всё уже на складе.', 'Ціна — оцінка ринку; брак і клони виявляться під час перевірки. Усе вже на складі.', 'Values are market estimates; duds and clones show up on inspection. Everything is in your storage.')}</div></div>
    <div class="obx-grid${anim ? ' anim' : ''}">${items.map((x, i) => `<div class="obx-it" style="--c:${col[x.t] || '#888'};--i:${i}"><div class="obx-img">${img({ ...x, id: 'bx' + i, fake: 0, rar: 0, tests: {} }, { size: 200 })}</div><small>${esc(MODEL[x.m] ? (MODEL[x.m].name.startsWith(MODEL[x.m].brand + ' ') ? MODEL[x.m].name : `${MODEL[x.m].brand} ${MODEL[x.m].name}`) : x.m)}</small><b>${fmt(x.val)}</b></div>`).join('')}</div>
    <button class="btn block mt" data-a="open" data-v="inventory">📦 ${T('На склад', 'На склад', 'To storage')}</button>`;
}
const BOX_TIERS_N = { common: ['Обычные', 'Звичайні', 'Common'], good: ['Хорошие', 'Хороші', 'Good'], top: ['Топовые', 'Топові', 'Top'], jack: ['Джекпот', 'Джекпот', 'Jackpot'] };
// what you saw when you picked the lot up (clones and Chinese firmware only show up on inspection)
function repCard(r) {
  const m = r.m ? MODEL[r.m] : null;
  const issues = [];
  if (r.short) issues.push(`📉 ${T('недовложение', 'недовкладення', 'short count')} −${r.short} ${T('шт', 'шт', 'pcs')}${r.refund ? T(` (вернули ${r.refund.toLocaleString('ru')} ¥)`, ` (повернули ${r.refund.toLocaleString('ru')} ¥)`, ` (refunded ${r.refund.toLocaleString('ru')} ¥)`) : T(' (денег не вернули)', ' (грошей не повернули)', ' (no refund)')}`);
  if (r.resort) issues.push(r.mix ? `🔀 ${T('манифест не совпал', 'маніфест не збігся', 'manifest mismatch')}: ${r.resort} ${T('шт заменили дешёвыми', 'шт замінили дешевими', 'pcs swapped for cheap ones')}` : `🔀 ${T('пересорт', 'пересорт', 'mixed‑up models')}: ${r.resort} ${T('шт другой модели', 'шт іншої моделі', 'pcs of another model')}`);
  if (r.opened) issues.push(`📦 ${T('вскрытые коробки', 'розкриті коробки', 'opened boxes')}: ${r.opened} ${T('шт (возвраты)', 'шт (повернення)', 'pcs (returns)')}`);
  return `<div class="card sup-rep"><div class="row between"><b>${esc(r.mix ? lotTitle({ mix: r.mix, brand: r.brand }) : m ? (m.name.startsWith(m.brand + ' ') ? m.name : `${m.brand} ${m.name}`) : '?')}</b><span class="small m">${r.got}/${r.qty} ${T('шт', 'шт', 'pcs')}</span></div><div class="small m">${esc(r.seller)} · ${r.total.toLocaleString('ru')} ¥</div>${issues.length ? issues.map((x) => `<div class="small o">${x}</div>`).join('') : `<div class="small g">✅ ${T('При приёмке всё сошлось', 'Під час приймання все зійшлося', 'Everything checked out at pickup')}</div>`}<div class="tiny m">${T('Клоны и прошивку видно только при проверке телефона.', 'Клони й прошивку видно лише під час перевірки телефона.', 'Clones and firmware only show when you check a phone.')}</div></div>`;
}
// one lot: pick the size, see the price per phone, the total and the risks, then haggle → yuan → fly → pay
function supLot(p) {
  const l = findLot(p.id);
  if (!l) return empty('box', T('Партия уже ушла', 'Партія вже пішла', 'The lot is gone'));
  const st = supState(), s = G.s, here = s.player.city === SZX, d = l.deal, paid = d?.paid;
  const q = lotQty(l), u = unitFor(l, q), total = lotTotal(l, q), risk = lotRisk(l, q);
  const step = paid ? 4 : !d ? 1 : st.cny < total ? 2 : !here ? 3 : 4;
  const sizes = l.sizes.map((n) => `<button class="${n === q ? 'on' : ''}" data-a="supqty" data-v="${l.id}" data-n="${n}" ${paid ? 'disabled' : ''}><b>${n} ${T('шт', 'шт', 'pcs')}</b><small>${unitFor(l, n).toLocaleString('ru')} ¥/${T('шт', 'шт', 'pc')}</small>${VOL[n] ? `<i>−${Math.round(VOL[n] * 100)}%</i>` : ''}<small class="m">${lotTotal(l, n).toLocaleString('ru')} ¥</small></button>`).join('');
  const RL = [[T('низкий', 'низький', 'low'), 'g'], [T('средний', 'середній', 'medium'), 'y'], [T('повышенный', 'підвищений', 'elevated'), 'r']][risk.level];
  const btn = paid ? `<div class="card center g">✅ ${T(`Куплено ${q} шт`, `Куплено ${q} шт`, `Bought ${q} pcs`)}</div>` : step === 1 ? `<button class="btn block" data-a="supdeal" data-v="${l.id}">🤝 ${T('Торговаться за партию', 'Торгуватися за партію', 'Haggle for the lot')}</button>` : step === 2 ? `<button class="btn block" data-a="supcny" data-v="${total - st.cny}">¥ ${T(`Докупить ${(total - st.cny).toLocaleString('ru')} ¥`, `Докупити ${(total - st.cny).toLocaleString('ru')} ¥`, `Top up ${(total - st.cny).toLocaleString('ru')} ¥`)}</button>` : step === 3 ? `<button class="btn block" data-a="open" data-v="travel">✈️ ${T('Лететь в Шэньчжэнь — платить лично', 'Летіти в Шеньчжень — платити особисто', 'Fly to Shenzhen — pay in person')}</button>` : `<button class="btn block green" data-a="suppay" data-v="${l.id}">💴 ${T('Оплатить', 'Оплатити', 'Pay')} ${total.toLocaleString('ru')} ¥</button>`;
  return `<div class="sup-lothead">${img(l.it, { size: 460 })}</div>
    <h2 style="margin:8px 0 2px">${esc(lotTitle(l))}</h2><div class="small m">${esc(l.seller)} · ★ ${l.rating} · ${T('на складе до', 'на складі до', 'in stock up to')} ${l.stock} ${T('шт', 'шт', 'pcs')} · −${l.off}% ${T('к рынку', 'до ринку', 'vs market')}</div>
    <h3 class="sub">${T('Размер партии', 'Розмір партії', 'Lot size')}</h3><div class="sup-sizes">${sizes}</div>${q >= 50 ? `<div class="card sup-warn">📉 ${T(`${q} одинаковых телефонов один город не съест: чем больше таких объявлений и продаж, тем реже приходят покупатели и тем меньше платят. Развозите по разным городам, продавайте постепенно или берите опт‑боксы.`, `${q} однакових телефонів одне місто не зʼїсть: що більше таких оголошень і продажів, то рідше приходять покупці й то менше платять. Розвозьте по різних містах, продавайте поступово або беріть опт‑бокси.`, `One city won’t absorb ${q} identical phones: the more such ads and sales, the fewer buyers and the less they pay. Spread them over cities, sell gradually or try wholesale boxes.`)}</div>` : ''}
    <div class="card"><div class="kv"><span>${T('Цена за штуку', 'Ціна за штуку', 'Per phone')}</span><b>${u.toLocaleString('ru')} ¥ · ≈ ${fmt(u / cnyRate())}</b></div>${d?.disc ? `<div class="kv"><span>${T('Скидка после торга', 'Знижка після торгу', 'Haggled discount')}</span><b class="g">−${d.disc}%</b></div>` : ''}<div class="kv"><span>${T('Итого за партию', 'Разом за партію', 'Lot total')}</span><b>${total.toLocaleString('ru')} ¥ · ≈ ${fmt(total / cnyRate())}</b></div><div class="kv"><span>${T('Ваши юани', 'Ваші юані', 'Your yuan')}</span><b>${st.cny.toLocaleString('ru')} ¥</b></div><div class="kv"><span>${T('Место дома после доставки', 'Місце вдома після доставки', 'Room at home after delivery')}</span><b class="${freeSpace() >= q ? '' : 'r'}">${freeSpace()} / ${q}</b></div></div>
    <div class="card sup-risk"><div class="row between"><b>⚠️ ${T('Риски партии', 'Ризики партії', 'Lot risks')}</b><span class="tag ${RL[1]}">${RL[0]} · ≈${Math.round(risk.p * 100)}%</span></div><div class="small m">${T('Редко, но бывает — и тем чаще, чем больше партия и ниже рейтинг продавца:', 'Рідко, але буває — і тим частіше, чим більша партія й нижчий рейтинг продавця:', 'Rare, but it happens — more often with bigger lots and lower‑rated sellers:')}</div>
      <ul class="sup-rl"><li>📉 ${T('недовложение — пара коробок «потерялась» (честные продавцы с ★4.3+ вернут юани)', 'недовкладення — пара коробок «загубилася» (чесні продавці з ★4.3+ повернуть юані)', 'short count — a couple of boxes “went missing” (honest ★4.3+ sellers refund the yuan)')}</li><li>🔀 ${T('пересорт — часть партии старой моделью', 'пересорт — частина партії старою моделлю', 'mixed‑up models — some boxes hold an older model')}</li><li>📦 ${T('вскрытые возвраты с дефектами', 'розкриті повернення з дефектами', 'opened returns with defects')}</li><li>🎭 ${T('клоны 1:1 в оригинальных коробках — таможня может изъять и оштрафовать', 'клони 1:1 в оригінальних коробках — митниця може вилучити й оштрафувати', '1:1 clones in original boxes — customs may seize them and fine you')}</li><li>🇨🇳 ${T('китайская прошивка без Google — перепрошивка в мастерской', 'китайська прошивка без Google — перепрошивка в майстерні', 'Chinese ROM without Google — reflash in the workshop')}</li><li>🛃 ${T('в карго: задержка на таможне с доначислением, помятая коробка', 'у карго: затримка на митниці з донарахуванням, помʼята коробка', 'in cargo: a customs hold with extra duty, a crushed box')}</li></ul></div>
    ${btn}`;
}
export const supplierApp = {
  id: 'supplier', glyph: 'truck', lvl: 3,
  name: ['Поставщик', 'Постачальник', 'Supplier'], colors: ['#ff7a1a', '#e2480f'], glyphColor: '#fff',
  views: { main: supMain, lot: supLot, box: boxPage, obox: oboxPage },
  actions: {
    supbrand: (b) => { SV.brand = b || null; rerender(); },
    boxorder: async (id) => {
      const b = findBox(id); if (!b) return;
      if (!(await confirmBox(T('Заказать опт‑бокс?', 'Замовити опт‑бокс?', 'Order the box?'), esc(`${boxTitle(b)} · ${b.price.toLocaleString('ru')} ¥ · ${T(`от ${b.nMin} до ${b.nMax} телефонов`, `від ${b.nMin} до ${b.nMax} телефонів`, `${b.nMin}–${b.nMax} phones`)}. ${T('Что внутри — рандом.', 'Що всередині — рандом.', 'Contents are random.')}`), T('Заказать', 'Замовити', 'Order')))) return;
      const r = orderBox(id);
      if (r.ok) { sfx('cash'); toast(T('Бокс заказан — приедет через 12 ч', 'Бокс замовлено — приїде за 12 год', 'Box ordered — arrives in 12 h'), 'g'); go('obox', { id: r.o.id }); } else toast(r.msg, 'r');
    },
    boxopen: (id) => {
      const o = openBox(id); if (!o) return;
      SV.justOpened = id;
      const best = [...o.items].sort((a, b) => b.val - a.val)[0];
      sfx(o.value >= o.usd ? 'win' : 'lose');
      toast(T(`Выпало ${o.n} шт! Лучший: ${MODEL[best.m]?.name}`, `Випало ${o.n} шт! Найкращий: ${MODEL[best.m]?.name}`, `${o.n} phones! Best: ${MODEL[best.m]?.name}`), o.value >= o.usd ? 'g' : 'r');
      rerender();
    },
    supqty: (id, el) => { const l = findLot(id); if (l) pickQty(l, +el.dataset.n); rerender(); },
    supcny: async (need) => {
      const st = supState();
      const want = need ? +need / cnyRate() / 0.985 + 1 : 100;
      const usd = await askPrice({ title: T('Купить юани', 'Купити юані', 'Buy yuan'), sub: T(`Курс 1 $ = ${cnyRate().toFixed(2)} ¥, комиссия 1.5%. Сейчас у вас ${st.cny} ¥.`, `Курс 1 $ = ${cnyRate().toFixed(2)} ¥, комісія 1.5%. Зараз у вас ${st.cny} ¥.`, `Rate 1 $ = ${cnyRate().toFixed(2)} ¥, 1.5% fee. You have ${st.cny} ¥.`), value: Math.min(Math.max(1, G.s.money), Math.ceil(want)), min: 1, max: Math.max(1, G.s.money) });
      if (!usd) return;
      const r = buyYuan(usd); if (r.ok) { sfx('cash'); toast(`+${r.cny.toLocaleString('ru')} ¥`, 'g'); } else toast(r.msg, 'r'); rerender();
    },
    supcnysell: async () => { const st = supState(); if (!(await confirmBox(T('Продать все юани?', 'Продати всі юані?', 'Sell all yuan?'), `${st.cny} ¥ → ${fmt(st.cny / cnyRate() * 0.985)}`, T('Продать', 'Продати', 'Sell')))) return; sellYuan(st.cny); rerender(); },
    supdeal: async (id) => {
      const l = findLot(id); if (!l) return;
      const r = await playMini('haggle', { title: T(`Торг: ${l.seller}`, `Торг: ${l.seller}`, `Haggling: ${l.seller}`), item: l.it, pass: 0 });
      if (r.quit) return;
      setDeal(l, r.disc || 0);
      toast(r.disc ? T(`Договорились: −${r.disc}% на партию`, `Домовилися: −${r.disc}% на партію`, `Deal: −${r.disc}% on the lot`) : T('Цена без скидки, но договорились', 'Ціна без знижки, але домовилися', 'No discount, but it’s a deal'), 'g');
      rerender();
    },
    suppay: async (id) => {
      const l = findLot(id); if (!l) return;
      const q = lotQty(l);
      if (!(await confirmBox(T(`Оплатить партию ${q} шт?`, `Оплатити партію ${q} шт?`, `Pay for ${q} pcs?`), `${lotTotal(l, q).toLocaleString('ru')} ¥ · ${esc(lotTitle(l))}`, T('Оплатить', 'Оплатити', 'Pay')))) return;
      const r = payLot(l);
      if (r.ok) {
        const x = r.rep;
        sfx(x.short || x.resort || x.opened ? 'err' : 'win');
        toast(x.short ? T(`Пересчитали: ${x.got} из ${x.qty} шт${x.refund ? `, вернули ${x.refund.toLocaleString('ru')} ¥` : ' — денег не вернули'}`, `Перерахували: ${x.got} з ${x.qty} шт${x.refund ? `, повернули ${x.refund.toLocaleString('ru')} ¥` : ' — грошей не повернули'}`, `Counted: ${x.got} of ${x.qty} pcs${x.refund ? `, ${x.refund.toLocaleString('ru')} ¥ refunded` : ' — no refund'}`) : x.resort ? T(`Пересорт: ${x.resort} коробок с другой моделью`, `Пересорт: ${x.resort} коробок з іншою моделлю`, `Mix‑up: ${x.resort} boxes of another model`) : T('Партия ваша! Товар на складе в Шэньчжэне', 'Партія ваша! Товар на складі в Шеньчжені', 'The lot is yours! Goods are in Shenzhen'), x.short || x.resort ? 'r' : 'g');
        go('main');
      } else toast(r.msg, 'r');
      rerender();
    },
    supcargo: async () => {
      const n = inShenzhen().length;
      if (n > freeSpace() && !(await confirmBox(T('Дома не хватит места', 'Вдома не вистачить місця', 'Not enough room at home'), T(`Едет ${n} шт, а свободно ${freeSpace()} мест. Склад будет переполнен — новые вещи не влезут, пока не продадите часть. Арендуйте склад в «Недвижимости → Коммерция».`, `Їде ${n} шт, а вільно ${freeSpace()} місць. Склад буде переповнений — нові речі не влізуть, поки не продасте частину. Орендуйте склад у «Нерухомості → Комерція».`, `${n} pcs are coming but only ${freeSpace()} slots are free. Storage will overflow until you sell some. Rent a warehouse in Real estate → Commercial.`), T('Всё равно отправить', 'Все одно відправити', 'Ship anyway')))) return;
      const r = cargoHome(); if (r.ok) { sfx('ok'); toast(T(`Карго: ${r.n} шт, ${fmt(r.fee)}. Будет через 2 дня`, `Карго: ${r.n} шт, ${fmt(r.fee)}. Буде за 2 дні`, `Cargo: ${r.n} pcs, ${fmt(r.fee)}. Arrives in 2 days`), 'g'); } else if (r.msg) toast(r.msg, 'r'); rerender(); },
  },
};
