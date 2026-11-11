// Life apps: Profile (needs, sleep, food), Real estate, Travel, City map (flea market) and Pawn shop.
import { G, emit } from '../core/state.js';
import { T, L, dur } from '../core/i18n.js';
import { esc, clamp, uid } from '../core/util.js';
import { RNG } from '../core/rng.js';
import { fmt, nicePrice } from '../core/money.js';
import { CITY, CITIES, COUNTRY, countryOf, distanceKm, MODES } from '../data/world.js';
import { CATS, CAT_LIST } from '../data/catalog.js';
import { icon } from '../ui/icons.js';
import { go, rerender, toast, askPrice, confirmBox, choose, sheet, closeSheet, resolveSheet, openApp, UI, refreshAll } from '../ui/shell.js';
import { img, empty, bar, tags, row, kv, stars } from '../ui/comp.js';
import { itemTitle, itemSub, itemValue, makeItem, isVehicle, sizeUnits } from '../game/items.js';
import { HOUSING, houseDef, capacity, used, xpNeed, repScore, getItem, spend, addItem, canStore, stat, addXP, luggageCap, garage, vehiclesOwned, netWorth } from '../game/player.js';
import { FOOD, foodPrice, eat, rentFor, housePrice, rentHouse, buyHouse, leaveHouse, afterSleep, awayFromHome, hotelPrice } from '../game/life.js';
import { PROPS, propPrice, propRent, acquireProp, releaseProp } from '../game/business.js';
import { tripOptions, startTrip, inTransit } from '../game/travel.js';
import { regionMult } from '../game/economy.js';
import { pawnShop, buyPawn } from '../game/sources.js';
import { pawnSell } from '../game/sell.js';
import { advance } from '../game/sim.js';
import { cityName } from './common.js';
import { sfx } from '../ui/sfx.js';
import { playMini } from '../mini/engine.js';

// ---------------------------------------------------------------- PROFILE
function profMain() {
  const s = G.s;
  const h = houseDef();
  const car = s.car ? getItem(s.car) : null;
  return `<div class="card"><div class="levelrow"><div class="lv">${s.level}</div><div class="grow"><b style="font-size:19px">${esc(s.player.name)}</b><div class="small m">${countryOf(s.player.city).flag} ${esc(cityName())} · ★ ${repScore() ? repScore().toFixed(2) : '—'} (${s.rep.n})</div>${bar((s.xp / xpNeed(s.level)) * 100, 'var(--acc2)')}<div class="tiny m">XP ${s.xp} / ${xpNeed(s.level)}</div></div></div></div>
    <div class="stats"><div class="stat"><small>⚡ ${T('Энергия', 'Енергія', 'Energy')}</small><b data-live="energy">${Math.round(s.energy)}</b>${bar(s.energy, s.energy < 25 ? 'var(--red)' : '')}</div><div class="stat"><small>🍔 ${T('Сытость', 'Ситість', 'Food')}</small><b data-live="food">${Math.round(s.food)}</b>${bar(s.food, 'var(--yel)')}</div></div>
    <div class="btns"><button class="btn" data-a="eatMenu">🍔 ${T('Поесть', 'Поїсти', 'Eat')}</button><button class="btn dark" data-a="sleepMenu">🌙 ${T('Спать', 'Спати', 'Sleep')}</button></div>
    ${s.food < 15 ? `<div class="card warn small">${T('Вы голодны — энергия тает быстрее.', 'Ви голодні — енергія тане швидше.', 'You’re hungry — energy drains faster.')}</div>` : ''}
    <h3 class="sub">${T('Жизнь', 'Життя', 'Life')}</h3>
    <div class="card">${kv(T('Жильё', 'Житло', 'Home'), `${esc(L(h.n))}${s.house.type !== 'none' ? ` · ${esc(L(CITY[s.house.city]?.name || ''))}` : ''}`)}${kv(T('Склад', 'Склад', 'Storage'), `${used()} / ${capacity()}`)}${kv(T('Транспорт', 'Транспорт', 'Vehicle'), car ? esc(itemTitle(car)) : T('пешком', 'пішки', 'on foot'))}${kv(T('Гараж', 'Гараж', 'Garage'), `${vehiclesOwned()} / ${garage()}`)}${kv(T('Капитал', 'Капітал', 'Net worth'), fmt(netWorth()), 'g')}</div>
    <div class="btns"><button class="btn dark" data-a="open" data-v="realty">${icon('home')} ${T('Недвижимость', 'Нерухомість', 'Real estate')}</button><button class="btn dark" data-a="open" data-v="travel">${icon('plane')} ${T('Поездки', 'Поїздки', 'Travel')}</button></div>`;
}
export const profileApp = {
  id: 'profile', glyph: 'user', lvl: 1,
  name: ['Профиль', 'Профіль', 'Profile'], colors: ['#ff6a4d', '#d63a2a'],
  views: { main: profMain },
  actions: {
    eatMenu: async () => {
      const v = await choose(T('Поесть', 'Поїсти', 'Eat'), FOOD.map((f) => ({ v: f.id, label: `${f.icon} ${L(f.n)} · ${fmt(foodPrice(f))}`, sub: `+${f.food} 🍔${f.energy ? ` +${f.energy} ⚡` : ''}` })));
      if (!v) return;
      const f0 = FOOD.find((f) => f.id === v);
      let cookQ = null;
      if (f0.home && G.s.house.type !== 'none') { const rc = await playMini('pancake', { title: T('Готовим дома', 'Готуємо вдома', 'Cooking at home'), pass: 0.6 }); if (!rc.quit) cookQ = rc.score; }
      const r = eat(f0);
      if (r.ok && cookQ != null) G.s.food = Math.max(0, Math.min(100, G.s.food + Math.round((cookQ - 0.5) * 16)));
      if (r.ok) { sfx('ok'); toast(T('Вкусно!', 'Смачно!', 'Yum!'), 'g'); } else toast(r.msg, 'r');
      refreshAll();
    },
    sleepMenu: async () => {
      const s = G.s;
      const home = s.house.type !== 'none' && s.house.city === s.player.city;
      const opts = [];
      if (home) opts.push({ v: 'home', label: `🏠 ${T('Дома, 8 часов', 'Вдома, 8 годин', 'At home, 8 hours')}`, cls: '' });
      else {
        opts.push({ v: 'hotel', label: `🏨 ${T('Хостел/отель', 'Хостел/готель', 'Hostel/hotel')} · ${fmt(hotelPrice())}`, sub: T('нормальный сон', 'нормальний сон', 'proper sleep') });
        opts.push({ v: 'street', label: `🚉 ${T('На вокзале', 'На вокзалі', 'At the station')} · ${T('бесплатно', 'безкоштовно', 'free')}`, sub: T('плохой сон, могут обокрасть', 'поганий сон, можуть обікрасти', 'poor sleep, theft risk') });
      }
      opts.push({ v: 'nap', label: `😴 ${T('Вздремнуть 2 часа', 'Подрімати 2 години', 'Nap 2 hours')}`, cls: 'dark' });
      const v = await choose(T('Сон', 'Сон', 'Sleep'), opts, T('Время пролетит быстро: сделки, доставки и аренда продолжатся.', 'Час пролетить швидко: угоди, доставки й оренда продовжаться.', 'Time skips ahead: deliveries, rent and deals continue.'));
      if (!v) return;
      if (v === 'hotel') { if (!spend(hotelPrice(), 'rent', T('Отель', 'Готель', 'Hotel'))) return toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r'); s.hotelNight = true; }
      const hours = v === 'nap' ? 2 : 8;
      // counting sheep: a calm mind sleeps better (bonus energy), a restless one a bit worse
      let sleepQ = 0.6;
      if (v !== 'nap') { const r = await playMini('sheep', { title: T('Считаем овец', 'Рахуємо овець', 'Counting sheep'), pass: 1 }); sleepQ = r.quit ? 0.6 : r.score; }
      await sheet(`<div class="center" style="padding:30px 0"><div style="font-size:64px" class="pulse">💤</div><h2>${T('Спим…', 'Спимо…', 'Sleeping…')}</h2><p class="p">${hours} ${T('ч', 'год', 'h')}</p></div>`, { modal: true, after() { setTimeout(() => { advance(hours * 60); afterSleep(hours); s.energy = Math.max(0, Math.min(100, s.energy + Math.round((sleepQ - 0.6) * 20))); resolveSheet('ok'); }, 900); } });
      sfx('ok'); toast(T('Выспались!', 'Виспалися!', 'Rested!'), 'g');
      refreshAll();
    },
  },
};

// ---------------------------------------------------------------- REAL ESTATE
const R = { tab: 'home' };
function realtyMain() {
  const s = G.s;
  const tabs = `<div class="seg"><button class="${R.tab === 'home' ? 'on' : ''}" data-a="rt" data-v="home">${T('Жильё', 'Житло', 'Homes')}</button><button class="${R.tab === 'biz' ? 'on' : ''}" data-a="rt" data-v="biz">${T('Коммерция', 'Комерція', 'Commercial')}</button><button class="${R.tab === 'mine' ? 'on' : ''}" data-a="rt" data-v="mine">${T('Моё', 'Моє', 'Mine')} (${s.props.length})</button></div>`;
  if (R.tab === 'home') {
    const cur = houseDef();
    return tabs + `<div class="card hl"><div class="small m">${T('Сейчас', 'Зараз', 'Current')}</div><b>${esc(L(cur.n))}</b>${s.house.type !== 'none' ? ` · ${esc(L(CITY[s.house.city].name))} · ${s.house.own ? T('в собственности', 'у власності', 'owned') : `${T('аренда', 'оренда', 'rent')} ${fmt(rentFor())}/${T('день', 'день', 'day')}`}` : ''}<div class="small m">${T('Склад', 'Склад', 'Storage')} ${cur.store} · ${T('гараж', 'гараж', 'garage')} ${cur.garage} · ${T('сон', 'сон', 'sleep')} ×${cur.energy}</div>${s.house.type !== 'none' ? `<button class="btn dark sm mt" data-a="leave">${s.house.own ? T('Продать', 'Продати', 'Sell') : T('Съехать', 'Зʼїхати', 'Move out')}</button>` : ''}</div>
      <p class="p">${T('Жильё в городе', 'Житло в місті', 'Homes in')} ${esc(cityName())}. ${T('Аренда списывается каждый игровой день.', 'Оренда списується щодня.', 'Rent is charged every game day.')}</p>` +
      HOUSING.filter((h) => h.id !== 'none').map((h) => `<div class="card"><div class="row between"><h3>${esc(L(h.n))}</h3>${s.house.type === h.id && s.house.city === s.player.city ? `<span class="tag g">${T('ваше', 'ваше', 'yours')}</span>` : ''}</div><div class="small m">📦 ${h.store} · 🚗 ${h.garage} · 💤 ×${h.energy}${h.rep ? ` · ⭐ +${Math.round(h.rep * 100)}%` : ''}</div><div class="btns"><button class="btn sm" data-a="rent" data-v="${h.id}">${T('Снять', 'Зняти', 'Rent')} · ${fmt(rentFor(h, s.player.city))}/${T('день', 'день', 'day')}</button>${h.price ? `<button class="btn sm dark" data-a="buyh" data-v="${h.id}">${T('Купить', 'Купити', 'Buy')} · ${fmt(housePrice(h), { short: true })}</button>` : ''}</div></div>`).join('');
  }
  if (R.tab === 'biz') return tabs + `<p class="p">${T('Точки продаж, склады и квартиры под сдачу в городе', 'Точки продажу, склади й квартири під здачу в місті', 'Stores, warehouses and rentals in')} ${esc(cityName())}. ${T('Аренда — первые 3 дня сразу.', 'Оренда — перші 3 дні одразу.', 'Rent: first 3 days up front.')}</p>` + PROPS.map((p) => `<div class="card"><div class="row"><div style="font-size:30px">${p.icon}</div><div class="grow"><h3>${esc(L(p.n))}</h3><div class="small m">${p.slots ? `${T('полок', 'полиць', 'slots')}: ${p.slots} · ${T('трафик', 'трафік', 'traffic')} ${p.traffic}` : p.cap ? `${T('вместимость', 'місткість', 'capacity')} +${p.cap}` : `${T('доход', 'дохід', 'income')} ≈ ${fmt(propPrice(p) * p.income)}/${T('день', 'день', 'day')}`}</div></div></div><div class="btns">${p.rent ? `<button class="btn sm" data-a="prent" data-v="${p.id}">${T('Аренда', 'Оренда', 'Rent')} ${fmt(propRent(p))}/${T('д', 'д', 'd')}</button>` : ''}<button class="btn sm dark" data-a="pbuy" data-v="${p.id}">${T('Купить', 'Купити', 'Buy')} ${fmt(propPrice(p), { short: true })}</button></div></div>`).join('');
  return tabs + (s.props.length ? s.props.map((p) => { const d = PROPS.find((x) => x.id === p.def); const shop = s.biz.shops.find((x) => x.propId === p.id); return `<div class="card"><div class="row between"><h3>${d.icon} ${esc(L(d.n))}</h3><span class="tag ${p.own ? 'g' : 'b'}">${p.own ? T('собственность', 'власність', 'owned') : T('аренда', 'оренда', 'rented')}</span></div><div class="small m">${esc(L(CITY[p.city].name))}${shop ? ` · 🏪 ${esc(shop.name)}` : ''}${!p.own ? ` · ${fmt(p.rent)}/${T('день', 'день', 'day')}` : ` · ${T('стоимость', 'вартість', 'value')} ${fmt(p.value)}`}</div><div class="btns">${d.kind === 'shop' || d.kind === 'showroom' ? `<button class="btn sm" data-a="open" data-v="business">${shop ? T('Управлять', 'Керувати', 'Manage') : T('Открыть магазин', 'Відкрити магазин', 'Open a store')}</button>` : ''}<button class="btn sm dark" data-a="release" data-v="${p.id}">${p.own ? T('Продать', 'Продати', 'Sell') : T('Расторгнуть', 'Розірвати', 'End lease')}</button></div></div>`; }).join('') : empty('home', T('Нет недвижимости', 'Немає нерухомості', 'No property')));
}
export const realtyApp = {
  id: 'realty', glyph: 'home', lvl: 1,
  name: ['Недвижимость', 'Нерухомість', 'Real estate'], colors: ['#ff9a5c', '#e2622a'],
  views: { main: realtyMain },
  actions: {
    rt: (v) => { R.tab = v; rerender(); },
    rent: async (id) => { const h = HOUSING.find((x) => x.id === id); if (!(await confirmBox(L(h.n), T(`Аренда ${fmt(rentFor(h, G.s.player.city))} в день. Первый день сразу.`, `Оренда ${fmt(rentFor(h, G.s.player.city))} на день.`, `${fmt(rentFor(h, G.s.player.city))} per day, first day now.`), T('Снять', 'Зняти', 'Rent')))) return; const r = rentHouse(id); toast(r.ok ? T('Добро пожаловать домой!', 'Ласкаво просимо додому!', 'Welcome home!') : r.msg, r.ok ? 'g' : 'r'); if (r.ok) sfx('win'); rerender(); },
    buyh: async (id) => { const h = HOUSING.find((x) => x.id === id); if (!(await confirmBox(L(h.n), fmt(housePrice(h)), T('Купить', 'Купити', 'Buy')))) return; const r = buyHouse(id); toast(r.ok ? T('Поздравляем с покупкой!', 'Вітаємо з покупкою!', 'Congrats on the purchase!') : r.msg, r.ok ? 'g' : 'r'); if (r.ok) sfx('win'); rerender(); },
    leave: async () => { if (await confirmBox(T('Освободить жильё?', 'Звільнити житло?', 'Leave your home?'), G.s.house.own ? T('Продадите за 90% стоимости.', 'Продасте за 90% вартості.', 'Sells for 90% of value.') : '', T('Да', 'Так', 'Yes'), undefined, true)) { leaveHouse(); rerender(); } },
    prent: async (id) => { const r = acquireProp(id, false); toast(r.ok ? T('Помещение арендовано', 'Приміщення орендовано', 'Leased') : r.msg, r.ok ? 'g' : 'r'); rerender(); },
    pbuy: async (id) => { const p = PROPS.find((x) => x.id === id); if (!(await confirmBox(L(p.n), fmt(propPrice(p)), T('Купить', 'Купити', 'Buy')))) return; const r = acquireProp(id, true); toast(r.ok ? T('Куплено!', 'Куплено!', 'Purchased!') : r.msg, r.ok ? 'g' : 'r'); rerender(); },
    release: async (id) => { if (await confirmBox(T('Вы уверены?', 'Ви впевнені?', 'Are you sure?'), T('Магазин на этой точке закроется.', 'Магазин на цій точці закриється.', 'Any store here will close.'), T('Да', 'Так', 'Yes'), undefined, true)) { releaseProp(id); rerender(); } },
  },
};

// ---------------------------------------------------------------- TRAVEL
const TV = { sort: 'near', cat: 'phones' };
function travelMain() {
  const s = G.s;
  if (s.travel) {
    const tr = s.travel;
    return `<div class="card center" style="padding:24px"><div style="font-size:60px" class="pulse">${MODES[tr.mode][3]}</div><h3>${esc(L(CITY[tr.from].name))} → ${esc(L(CITY[tr.to].name))}</h3><div class="small m">${T('Прибытие через', 'Прибуття через', 'Arriving in')} <b data-cd="${tr.eta}" data-fmt="long"></b></div><div class="bar mt"><i data-bar-from="${tr.start}" data-bar-to="${tr.eta}"></i></div><div class="small m mt">${T('В багаже', 'У багажі', 'Luggage')}: ${tr.carry.length}</div></div>`;
  }
  const here = s.player.city;
  const myIdx = regionMult(here, TV.cat);
  let cities = CITIES.filter((c) => c.id !== here).map((c) => ({ c, km: distanceKm(here, c.id), idx: regionMult(c.id, TV.cat) / myIdx }));
  if (TV.sort === 'near') cities.sort((a, b) => a.km - b.km);
  if (TV.sort === 'exp') cities.sort((a, b) => b.idx - a.idx);
  if (TV.sort === 'cheap') cities.sort((a, b) => a.idx - b.idx);
  const curIdx = regionMult(here, TV.cat);
  const label = (x) => (x > 1.08 ? T('дорогой рынок', 'дорогий ринок', 'expensive market') : x < 0.92 ? T('дешёвый рынок', 'дешевий ринок', 'cheap market') : T('обычный рынок', 'звичайний ринок', 'average market'));
  return `<div class="card"><div class="small m">${T('Вы находитесь в городе', 'Ви перебуваєте в місті', 'You are in')}</div><h3 style="font-size:24px">${countryOf(here).flag} ${esc(cityName())}</h3><div class="d">${T('Цены на', 'Ціни на', 'Prices for')} ${esc(L(CATS[TV.cat].name).toLowerCase())} ×${curIdx.toFixed(2)} · ${label(curIdx)}. ${T('Лента объявлений и оценка ваших вещей зависят от города.', 'Стрічка оголошень і оцінка речей залежать від міста.', 'Listings and valuations depend on the city.')}</div></div>
    <p class="p">${T('Покупайте там, где цены ниже, и продавайте там, где выше. Самолёт быстрее, поезд дешевле. С собой берите до', 'Купуйте там, де дешевше, продавайте там, де дорожче. Із собою беріть до', 'Buy where it’s cheap, sell where it’s pricey. Carry up to')} ${luggageCap()} ${T('мест багажа.', 'місць багажу.', 'luggage units.')}</p>
    <div class="chips">${CAT_LIST.map((c) => `<button class="chip${TV.cat === c ? ' on' : ''}" data-a="tcat" data-v="${c}">${CATS[c].icon} ${esc(L(CATS[c].name))}</button>`).join('')}</div>
    <div class="chips wrap"><button class="chip${TV.sort === 'near' ? ' on' : ''}" data-a="tsort" data-v="near">${T('Ближайшие', 'Найближчі', 'Nearest')}</button><button class="chip${TV.sort === 'exp' ? ' on' : ''}" data-a="tsort" data-v="exp">${T('Дороже цены', 'Дорожчі ціни', 'Higher prices')}</button><button class="chip${TV.sort === 'cheap' ? ' on' : ''}" data-a="tsort" data-v="cheap">${T('Дешевле цены', 'Дешевші ціни', 'Lower prices')}</button></div>
    ${cities.map(({ c, km, idx }) => { const opts = tripOptions(c.id); const pct = Math.round((idx - 1) * 100); return `<div class="card"><div class="row between"><div><h3>${countryOf(c.id).flag} ${esc(L(c.name))}</h3><div class="small m">${km} ${T('км', 'км', 'km')} · ${label(regionMult(c.id, TV.cat))}</div></div><span class="tag ${pct > 0 ? 'g' : pct < 0 ? 'r' : ''}">${T('цены', 'ціни', 'prices')} ${pct > 0 ? '+' : ''}${pct}%</span></div><div class="btns">${opts.map((o) => `<button class="btn dark sm" data-a="trip" data-v="${c.id}" data-w="${o.mode}" style="flex-direction:column;gap:0;min-height:52px"><b>${MODES[o.mode][3]} ${esc(L(MODES[o.mode]))}</b><span class="small m">${fmt(o.price)} · ${dur(o.time)}</span></button>`).join('') || `<span class="small m">${T('Нет маршрута', 'Немає маршруту', 'No route')}</span>`}</div></div>`; }).join('')}`;
}
export const travelApp = {
  id: 'travel', glyph: 'plane', lvl: 4,
  name: ['Путешествие', 'Подорожі', 'Travel'], colors: ['#36a3ff', '#1a6ad4'],
  views: { main: travelMain },
  actions: {
    tcat: (v) => { TV.cat = v; rerender(); },
    tsort: (v) => { TV.sort = v; rerender(); },
    trip: async (to, el) => {
      const s = G.s; const mode = el.dataset.w;
      const here = s.inv.filter((i) => (i.loc || s.player.city) === s.player.city && !isVehicle(i) && !i.shop && !i.listed);
      let picked = [];
      if (here.length && mode !== 'car') {
        const cap = luggageCap();
        const res = await sheet(`<h2>${T('Что взять с собой?', 'Що взяти з собою?', 'What to bring?')}</h2><p class="p">${T('Багаж', 'Багаж', 'Luggage')}: <b class="lu">0</b> / ${cap}. ${T('Остальное останется на складе здесь.', 'Решта залишиться на складі тут.', 'The rest stays in storage here.')}</p>${here.map((it) => `<label class="list-item" style="cursor:pointer"><input type="checkbox" value="${it.id}" data-u="${sizeUnits(it)}" style="width:22px;height:22px"><div class="th">${img(it)}</div><div class="grow"><div class="t">${esc(itemTitle(it))}</div><div class="s">${sizeUnits(it)} ${T('мест', 'місць', 'units')} · ${fmt(itemValue(it, to, 'known'))} ${T('там', 'там', 'there')}</div></div></label>`).join('')}<button class="btn block mt go">${T('В путь', 'У дорогу', 'Go')}</button>`, {
          after(el2) {
            const upd = () => { const sum = [...el2.querySelectorAll('input:checked')].reduce((a, x) => a + +x.dataset.u, 0); el2.querySelector('.lu').textContent = sum; el2.querySelector('.lu').className = sum > cap ? 'r' : ''; };
            el2.addEventListener('change', upd);
            el2.querySelector('.go').onclick = () => resolveSheet([...el2.querySelectorAll('input:checked')].map((x) => x.value).join(',') || '-');
          },
        });
        if (!res) return;
        picked = res === '-' ? [] : res.split(',');
      } else if (!(await confirmBox(T('Отправиться?', 'Вирушити?', 'Depart?'), `${L(CITY[to].name)} · ${L(MODES[mode])}`))) return;
      const r = startTrip(to, mode, picked);
      if (r.ok) { sfx('ok'); toast(T('Счастливого пути!', 'Щасливої дороги!', 'Bon voyage!'), 'g'); } else toast(r.msg || T('Не удалось', 'Не вдалося', 'Failed'), 'r');
      refreshAll();
    },
  },
};

// ---------------------------------------------------------------- CITY MAP + FLEA MARKET
function fleaFeed() {
  const s = G.s;
  if (!s.flea || s.flea.refreshAt <= s.t || s.flea.city !== s.player.city) {
    const rng = new RNG(`${s.id}:flea:${s.t}`);
    const items = [];
    for (let i = 0; i < 7; i++) {
      const it = makeItem(rng, { city: s.player.city, quality: rng.chance(0.5) ? 'junk' : 'any', cats: ['antiques', 'collectibles', 'comics', 'toys', 'clothing', 'accessories', 'consoles', 'phones', 'art', 'instruments', 'cards', 'jewelry'], maxVal: 1200 + s.level * 300, rareBoost: 0.6 });
      if (isVehicle(it)) continue;
      const seen = itemValue(it, s.player.city, 'known');
      items.push({ id: uid('fm'), item: it, price: nicePrice(seen * rng.float(0.45, 0.95)), sold: false, haggled: false });
    }
    s.flea = { refreshAt: s.t + 720, city: s.player.city, items };
  }
  return s.flea;
}
const POIS = [
  { id: 'flea', x: 22, y: 30, e: '🧺', n: ['Барахолка', 'Барахолка', 'Flea market'] },
  { id: 'pawn', x: 60, y: 22, e: '💍', n: ['Ломбард', 'Ломбард', 'Pawn shop'], app: 'pawn' },
  { id: 'dump', x: 80, y: 62, e: '🗑️', n: ['Мусорки', 'Смітники', 'Dumpsters'], app: 'free' },
  { id: 'mall', x: 46, y: 52, e: '🛍', n: ['ТЦ', 'ТЦ', 'Mall'], app: 'shop' },
  { id: 'auc', x: 70, y: 40, e: '🔨', n: ['Аукционный дом', 'Аукціонний дім', 'Auction house'], app: 'auction' },
  { id: 'work', x: 30, y: 70, e: '💼', n: ['Центр занятости', 'Центр зайнятості', 'Job center'], app: 'jobs' },
  { id: 'fix', x: 14, y: 52, e: '🔧', n: ['Мастерская', 'Майстерня', 'Workshop'], app: 'repair' },
  { id: 'bank', x: 52, y: 80, e: '🏦', n: ['Банк', 'Банк', 'Bank'], app: 'bank' },
  { id: 'station', x: 86, y: 86, e: '🚉', n: ['Вокзал / аэропорт', 'Вокзал / аеропорт', 'Station / airport'], app: 'travel' },
  { id: 'home', x: 12, y: 86, e: '🏠', n: ['Дом', 'Дім', 'Home'], app: 'profile' },
  { id: 'realty', x: 88, y: 18, e: '🏢', n: ['Агентство недвижимости', 'Агенція нерухомості', 'Realty agency'], app: 'realty' },
];
function mapMain() {
  const s = G.s;
  const cid = s.player.city;
  const rng = new RNG('map' + cid);
  let roads = '';
  for (let i = 0; i < 7; i++) roads += `<path d="M0 ${rng.int(0, 100)} Q ${rng.int(20, 80)} ${rng.int(0, 100)} 100 ${rng.int(0, 100)}" stroke="#24344a" stroke-width="${rng.int(2, 4)}" fill="none"/>`;
  for (let i = 0; i < 5; i++) roads += `<path d="M${rng.int(0, 100)} 0 Q ${rng.int(0, 100)} ${rng.int(30, 70)} ${rng.int(0, 100)} 100" stroke="#24344a" stroke-width="${rng.int(2, 3)}" fill="none"/>`;
  const river = `<path d="M-5 ${rng.int(40, 60)} C 30 ${rng.int(20, 80)}, 70 ${rng.int(20, 80)}, 105 ${rng.int(40, 60)}" stroke="#123a5a" stroke-width="7" fill="none" opacity=".8"/>`;
  const blocks = Array.from({ length: 26 }, () => `<rect x="${rng.int(0, 95)}" y="${rng.int(0, 95)}" width="${rng.int(4, 10)}" height="${rng.int(4, 9)}" rx="1" fill="#16222f"/>`).join('');
  return `<div class="mapwrap scanlines"><svg viewBox="0 0 100 100">${blocks}${river}${roads}${POIS.map((p) => `<g class="poi" data-a="poi" data-v="${p.id}"><circle cx="${p.x}" cy="${p.y}" r="5.5" fill="#0b1018" stroke="#2ef2a0" stroke-width=".6"/><text x="${p.x}" y="${p.y + 2}" font-size="5.5" text-anchor="middle">${p.e}</text></g>`).join('')}<circle cx="50" cy="50" r="1.6" fill="#4da3ff"><animate attributeName="r" values="1.4;2.6;1.4" dur="1.6s" repeatCount="indefinite"/></circle></svg></div>
    <div class="small m mt mb">📍 ${countryOf(cid).flag} ${esc(cityName())}</div>
    ${POIS.map((p) => `<div class="list-item" data-a="poi" data-v="${p.id}"><div style="font-size:28px;width:44px;text-align:center">${p.e}</div><div class="grow"><div class="t">${esc(L(p.n))}</div></div>${icon('back', 'style="width:18px;transform:rotate(180deg);color:var(--mute)"')}</div>`).join('')}`;
}
function fleaView() {
  const f = fleaFeed();
  return `<p class="p">${T('На барахолке всё дешевле, а продавцы любят поторговаться. Иногда среди хлама попадаются сокровища.', 'На барахолці все дешевше, а продавці люблять поторгуватися.', 'Everything’s cheaper here and sellers love to haggle. Treasures hide among junk.')} ⟳ <span data-cd="${f.refreshAt}"></span></p>` + f.items.filter((x) => !x.sold).map((x) => `<div class="card"><div class="row"><div class="th" style="width:84px;height:84px;border-radius:14px;overflow:hidden;flex:none">${img(x.item, { tilt: true })}</div><div class="grow"><b>${esc(itemTitle(x.item))}</b><div class="small m">${esc(itemSub(x.item))}</div>${tags(x.item)}<div class="price-big" style="font-size:22px">${fmt(x.price)}</div></div></div><div class="btns">${!x.haggled ? `<button class="btn dark sm" data-a="haggle" data-v="${x.id}">🎯 ${T('Торговаться', 'Торгуватися', 'Haggle')}</button>` : ''}<button class="btn sm" data-a="fbuy" data-v="${x.id}">${T('Купить', 'Купити', 'Buy')}</button></div></div>`).join('');
}
export const mapApp = {
  id: 'map', glyph: 'map', lvl: 1,
  name: ['Карта', 'Мапа', 'Map'], colors: ['#2fbf71', '#16804a'],
  views: { main: mapMain, flea: fleaView },
  title: (v) => (v === 'flea' ? T('Барахолка', 'Барахолка', 'Flea market') : T('Карта города', 'Мапа міста', 'City map')),
  actions: {
    poi: (v) => { const p = POIS.find((x) => x.id === v); if (p.id === 'flea') go('flea'); else openApp(p.app); },
    haggle: async (id) => {
      const x = fleaFeed().items.find((y) => y.id === id);
      const { playMini } = await import('../mini/engine.js');
      const r = await playMini('timing', { title: T('Торг на барахолке', 'Торг на барахолці', 'Flea market haggle'), rounds: 3, label: T('Каждое попадание — скидка', 'Кожне влучання — знижка', 'Each hit = a discount') });
      if (r.quit) return;
      x.haggled = true;
      const disc = Math.round(r.score * 30);
      x.price = nicePrice(x.price * (1 - disc / 100));
      toast(disc ? T(`Скинули ${disc}%!`, `Скинули ${disc}%!`, `${disc}% off!`) : T('Продавец не уступил', 'Продавець не поступився', 'No discount'), disc ? 'g' : '');
      rerender();
    },
    fbuy: (id) => {
      const x = fleaFeed().items.find((y) => y.id === id);
      if (!canStore(x.item)) return toast(T('Нет места', 'Немає місця', 'No space'), 'r');
      if (!spend(x.price, 'buy', itemTitle(x.item))) return toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r');
      x.sold = true; addItem(x.item, x.price, 'flea'); stat('bought'); addXP(4); sfx('cash'); toast(T('Куплено!', 'Куплено!', 'Bought!'), 'g'); rerender();
    },
  },
};

// ---------------------------------------------------------------- PAWN SHOP
const PW = { tab: 'buy' };
function pawnMain() {
  const s = G.s;
  const tabs = `<div class="seg"><button class="${PW.tab === 'buy' ? 'on' : ''}" data-a="pt" data-v="buy">${T('Купить', 'Купити', 'Buy')}</button><button class="${PW.tab === 'sell' ? 'on' : ''}" data-a="pt" data-v="sell">${T('Сдать', 'Здати', 'Pawn')}</button></div>`;
  if (PW.tab === 'buy') {
    const p = pawnShop();
    return tabs + `<p class="p">${T('Невыкупленные вещи. Ломбард сам всё проверил — дефекты указаны честно.', 'Невикуплені речі. Ломбард усе перевірив — дефекти вказано чесно.', 'Unredeemed items, all defects disclosed.')} ⟳ <span data-cd="${p.refreshAt}"></span></p><div class="tiles">${p.items.filter((x) => !x.sold).map((x) => `<div class="tile" data-a="pbuy2" data-v="${x.id}"><div class="img">${img(x.item, { tilt: true })}</div><div class="pr">${fmt(x.price)}</div><div class="nm">${esc(itemTitle(x.item))}</div><div class="ct">${esc(itemSub(x.item))}</div>${tags(x.item)}</div>`).join('')}</div>`;
  }
  const items = s.inv.filter((i) => !i.shop && !i.listed);
  return tabs + `<p class="p">${T('Мгновенные деньги: ломбард платит около половины рыночной цены.', 'Миттєві гроші: ломбард платить близько половини ринкової ціни.', 'Instant cash at about half market value.')}</p>` + (items.length ? items.map((it) => row(it, `<button class="btn xs" data-a="psell" data-v="${it.id}">${fmt(itemValue(it, s.player.city, 'known') * 0.48)}</button>`, esc(itemSub(it)), '', '')).join('') : empty('archive', T('Нечего сдать', 'Нічого здати', 'Nothing to pawn')));
}
export const pawnApp = {
  id: 'pawn', glyph: 'coin', lvl: 1,
  name: ['Ломбард', 'Ломбард', 'Pawn shop'], colors: ['#d4a017', '#8a6a0a'],
  views: { main: pawnMain },
  actions: {
    pt: (v) => { PW.tab = v; rerender(); },
    pbuy2: async (id) => { const x = pawnShop().items.find((y) => y.id === id); if (!x || !(await confirmBox(itemTitle(x.item), fmt(x.price), T('Купить', 'Купити', 'Buy')))) return; const r = buyPawn(x); toast(r.ok ? T('Куплено!', 'Куплено!', 'Bought!') : r.msg, r.ok ? 'g' : 'r'); if (r.ok) sfx('cash'); rerender(); },
    psell: async (id, el, ev) => { ev.stopPropagation(); const it = getItem(id); if (!(await confirmBox(T('Сдать в ломбард?', 'Здати в ломбард?', 'Pawn it?'), esc(itemTitle(it))))) return; const v = pawnSell(id); sfx('cash'); toast(`+${fmt(v)}`, 'g'); rerender(); },
  },
};
