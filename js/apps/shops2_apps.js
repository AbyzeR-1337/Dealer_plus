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
  supState, cnyRate, lots, buyYuan, sellYuan, setDeal, lotTotal, payLot, inShenzhen, cargoHome, SZX, lotQty, pickQty, unitFor, lotRisk, VOL,
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
    <h3 class="sub">${T('Партии сегодня', 'Партії сьогодні', 'Lots today')}</h3><div class="sup-grid">`;
  h += ls.map((l) => {
    const d = l.deal, paid = d?.paid;
    const q = lotQty(l), u = unitFor(l, q);
    return `<div class="sup-card" data-a="go" data-v="lot" data-id="${l.id}"><div class="sup-img">${img(l.it, { size: 240 })}<span>−${l.off}% ${T('к рынку', 'до ринку', 'vs market')}</span></div><b class="sup-price">${u.toLocaleString('ru')} ¥ <small>/ ${T('шт', 'шт', 'pc')}</small></b><small class="m">≈ ${fmt(u / cnyRate())}</small><small>${esc(itemTitle(l.it))}</small><span class="sup-qty">${q} ${T('шт', 'шт', 'pcs')} · ${lotTotal(l, q).toLocaleString('ru')} ¥${d?.disc ? ` · −${d.disc}%` : ''}</span><small class="m">${esc(l.seller)} · ★ ${l.rating} · ${T('до', 'до', 'up to')} ${l.stock} ${T('шт', 'шт', 'pcs')}</small>${paid ? `<span class="g small">✅ ${T('Куплено', 'Куплено', 'Bought')}</span>` : `<button class="btn xs">📦 ${T('Выбрать партию', 'Вибрати партію', 'Choose a lot')}</button>`}</div>`;
  }).join('') || `<p class="p">${T('Партий пока нет — загляните позже', 'Партій поки немає — загляньте пізніше', 'No lots yet — check back later')}</p>`;
  h += '</div>';
  if (st.reports.length) h += `<h3 class="sub">${T('Мои партии', 'Мої партії', 'My lots')}</h3>` + st.reports.map(repCard).join('');
  return h;
}
// what you saw when you picked the lot up (clones and Chinese firmware only show up on inspection)
function repCard(r) {
  const m = MODEL[r.m];
  const issues = [];
  if (r.short) issues.push(`📉 ${T('недовложение', 'недовкладення', 'short count')} −${r.short} ${T('шт', 'шт', 'pcs')}${r.refund ? T(` (вернули ${r.refund.toLocaleString('ru')} ¥)`, ` (повернули ${r.refund.toLocaleString('ru')} ¥)`, ` (refunded ${r.refund.toLocaleString('ru')} ¥)`) : T(' (денег не вернули)', ' (грошей не повернули)', ' (no refund)')}`);
  if (r.resort) issues.push(`🔀 ${T('пересорт', 'пересорт', 'mixed‑up models')}: ${r.resort} ${T('шт другой модели', 'шт іншої моделі', 'pcs of another model')}`);
  if (r.opened) issues.push(`📦 ${T('вскрытые коробки', 'розкриті коробки', 'opened boxes')}: ${r.opened} ${T('шт (возвраты)', 'шт (повернення)', 'pcs (returns)')}`);
  return `<div class="card sup-rep"><div class="row between"><b>${esc(m ? (m.name.startsWith(m.brand + ' ') ? m.name : `${m.brand} ${m.name}`) : r.m)}</b><span class="small m">${r.got}/${r.qty} ${T('шт', 'шт', 'pcs')}</span></div><div class="small m">${esc(r.seller)} · ${r.total.toLocaleString('ru')} ¥</div>${issues.length ? issues.map((x) => `<div class="small o">${x}</div>`).join('') : `<div class="small g">✅ ${T('При приёмке всё сошлось', 'Під час приймання все зійшлося', 'Everything checked out at pickup')}</div>`}<div class="tiny m">${T('Клоны и прошивку видно только при проверке телефона.', 'Клони й прошивку видно лише під час перевірки телефона.', 'Clones and firmware only show when you check a phone.')}</div></div>`;
}
// one lot: pick the size, see the price per phone, the total and the risks, then haggle → yuan → fly → pay
function supLot(p) {
  const l = lots().find((x) => x.id === p.id);
  if (!l) return empty('box', T('Партия уже ушла', 'Партія вже пішла', 'The lot is gone'));
  const st = supState(), s = G.s, here = s.player.city === SZX, d = l.deal, paid = d?.paid;
  const q = lotQty(l), u = unitFor(l, q), total = lotTotal(l, q), risk = lotRisk(l, q);
  const step = paid ? 4 : !d ? 1 : st.cny < total ? 2 : !here ? 3 : 4;
  const sizes = l.sizes.map((n) => `<button class="${n === q ? 'on' : ''}" data-a="supqty" data-v="${l.id}" data-n="${n}" ${paid ? 'disabled' : ''}><b>${n} ${T('шт', 'шт', 'pcs')}</b><small>${unitFor(l, n).toLocaleString('ru')} ¥/${T('шт', 'шт', 'pc')}</small>${VOL[n] ? `<i>−${Math.round(VOL[n] * 100)}%</i>` : ''}<small class="m">${lotTotal(l, n).toLocaleString('ru')} ¥</small></button>`).join('');
  const RL = [[T('низкий', 'низький', 'low'), 'g'], [T('средний', 'середній', 'medium'), 'y'], [T('повышенный', 'підвищений', 'elevated'), 'r']][risk.level];
  const btn = paid ? `<div class="card center g">✅ ${T(`Куплено ${q} шт`, `Куплено ${q} шт`, `Bought ${q} pcs`)}</div>` : step === 1 ? `<button class="btn block" data-a="supdeal" data-v="${l.id}">🤝 ${T('Торговаться за партию', 'Торгуватися за партію', 'Haggle for the lot')}</button>` : step === 2 ? `<button class="btn block" data-a="supcny" data-v="${total - st.cny}">¥ ${T(`Докупить ${(total - st.cny).toLocaleString('ru')} ¥`, `Докупити ${(total - st.cny).toLocaleString('ru')} ¥`, `Top up ${(total - st.cny).toLocaleString('ru')} ¥`)}</button>` : step === 3 ? `<button class="btn block" data-a="open" data-v="travel">✈️ ${T('Лететь в Шэньчжэнь — платить лично', 'Летіти в Шеньчжень — платити особисто', 'Fly to Shenzhen — pay in person')}</button>` : `<button class="btn block green" data-a="suppay" data-v="${l.id}">💴 ${T('Оплатить', 'Оплатити', 'Pay')} ${total.toLocaleString('ru')} ¥</button>`;
  return `<div class="sup-lothead">${img(l.it, { size: 460 })}</div>
    <h2 style="margin:8px 0 2px">${esc(itemTitle(l.it))}</h2><div class="small m">${esc(l.seller)} · ★ ${l.rating} · ${T('на складе до', 'на складі до', 'in stock up to')} ${l.stock} ${T('шт', 'шт', 'pcs')} · −${l.off}% ${T('к рынку', 'до ринку', 'vs market')}</div>
    <h3 class="sub">${T('Размер партии', 'Розмір партії', 'Lot size')}</h3><div class="sup-sizes">${sizes}</div>
    <div class="card"><div class="kv"><span>${T('Цена за штуку', 'Ціна за штуку', 'Per phone')}</span><b>${u.toLocaleString('ru')} ¥ · ≈ ${fmt(u / cnyRate())}</b></div>${d?.disc ? `<div class="kv"><span>${T('Скидка после торга', 'Знижка після торгу', 'Haggled discount')}</span><b class="g">−${d.disc}%</b></div>` : ''}<div class="kv"><span>${T('Итого за партию', 'Разом за партію', 'Lot total')}</span><b>${total.toLocaleString('ru')} ¥ · ≈ ${fmt(total / cnyRate())}</b></div><div class="kv"><span>${T('Ваши юани', 'Ваші юані', 'Your yuan')}</span><b>${st.cny.toLocaleString('ru')} ¥</b></div><div class="kv"><span>${T('Место дома после доставки', 'Місце вдома після доставки', 'Room at home after delivery')}</span><b class="${freeSpace() >= q ? '' : 'r'}">${freeSpace()} / ${q}</b></div></div>
    <div class="card sup-risk"><div class="row between"><b>⚠️ ${T('Риски партии', 'Ризики партії', 'Lot risks')}</b><span class="tag ${RL[1]}">${RL[0]} · ≈${Math.round(risk.p * 100)}%</span></div><div class="small m">${T('Редко, но бывает — и тем чаще, чем больше партия и ниже рейтинг продавца:', 'Рідко, але буває — і тим частіше, чим більша партія й нижчий рейтинг продавця:', 'Rare, but it happens — more often with bigger lots and lower‑rated sellers:')}</div>
      <ul class="sup-rl"><li>📉 ${T('недовложение — пара коробок «потерялась» (честные продавцы с ★4.3+ вернут юани)', 'недовкладення — пара коробок «загубилася» (чесні продавці з ★4.3+ повернуть юані)', 'short count — a couple of boxes “went missing” (honest ★4.3+ sellers refund the yuan)')}</li><li>🔀 ${T('пересорт — часть партии старой моделью', 'пересорт — частина партії старою моделлю', 'mixed‑up models — some boxes hold an older model')}</li><li>📦 ${T('вскрытые возвраты с дефектами', 'розкриті повернення з дефектами', 'opened returns with defects')}</li><li>🎭 ${T('клоны 1:1 в оригинальных коробках — таможня может изъять и оштрафовать', 'клони 1:1 в оригінальних коробках — митниця може вилучити й оштрафувати', '1:1 clones in original boxes — customs may seize them and fine you')}</li><li>🇨🇳 ${T('китайская прошивка без Google — перепрошивка в мастерской', 'китайська прошивка без Google — перепрошивка в майстерні', 'Chinese ROM without Google — reflash in the workshop')}</li><li>🛃 ${T('в карго: задержка на таможне с доначислением, помятая коробка', 'у карго: затримка на митниці з донарахуванням, помʼята коробка', 'in cargo: a customs hold with extra duty, a crushed box')}</li></ul></div>
    ${btn}`;
}
export const supplierApp = {
  id: 'supplier', glyph: 'truck', lvl: 3,
  name: ['Поставщик', 'Постачальник', 'Supplier'], colors: ['#ff7a1a', '#e2480f'], glyphColor: '#fff',
  views: { main: supMain, lot: supLot },
  actions: {
    supbrand: (b) => { SV.brand = b || null; rerender(); },
    supqty: (id, el) => { const l = lots().find((x) => x.id === id); if (l) pickQty(l, +el.dataset.n); rerender(); },
    supcny: async (need) => {
      const st = supState();
      const want = need ? +need / cnyRate() / 0.985 + 1 : 100;
      const usd = await askPrice({ title: T('Купить юани', 'Купити юані', 'Buy yuan'), sub: T(`Курс 1 $ = ${cnyRate().toFixed(2)} ¥, комиссия 1.5%. Сейчас у вас ${st.cny} ¥.`, `Курс 1 $ = ${cnyRate().toFixed(2)} ¥, комісія 1.5%. Зараз у вас ${st.cny} ¥.`, `Rate 1 $ = ${cnyRate().toFixed(2)} ¥, 1.5% fee. You have ${st.cny} ¥.`), value: Math.min(Math.max(1, G.s.money), Math.ceil(want)), min: 1, max: Math.max(1, G.s.money) });
      if (!usd) return;
      const r = buyYuan(usd); if (r.ok) { sfx('cash'); toast(`+${r.cny.toLocaleString('ru')} ¥`, 'g'); } else toast(r.msg, 'r'); rerender();
    },
    supcnysell: async () => { const st = supState(); if (!(await confirmBox(T('Продать все юани?', 'Продати всі юані?', 'Sell all yuan?'), `${st.cny} ¥ → ${fmt(st.cny / cnyRate() * 0.985)}`, T('Продать', 'Продати', 'Sell')))) return; sellYuan(st.cny); rerender(); },
    supdeal: async (id) => {
      const l = lots().find((x) => x.id === id); if (!l) return;
      const r = await playMini('haggle', { title: T(`Торг: ${l.seller}`, `Торг: ${l.seller}`, `Haggling: ${l.seller}`), item: l.it, pass: 0 });
      if (r.quit) return;
      setDeal(l, r.disc || 0);
      toast(r.disc ? T(`Договорились: −${r.disc}% на партию`, `Домовилися: −${r.disc}% на партію`, `Deal: −${r.disc}% on the lot`) : T('Цена без скидки, но договорились', 'Ціна без знижки, але домовилися', 'No discount, but it’s a deal'), 'g');
      rerender();
    },
    suppay: async (id) => {
      const l = lots().find((x) => x.id === id); if (!l) return;
      const q = lotQty(l);
      if (!(await confirmBox(T(`Оплатить партию ${q} шт?`, `Оплатити партію ${q} шт?`, `Pay for ${q} pcs?`), `${lotTotal(l, q).toLocaleString('ru')} ¥ · ${esc(itemTitle(l.it))}`, T('Оплатить', 'Оплатити', 'Pay')))) return;
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
