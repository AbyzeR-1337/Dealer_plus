// NPCs (buyers & sellers): names, personalities and chat phrases.
import { RNG } from '../core/rng.js';
import { NAMES, countryOf } from '../data/world.js';
import { T, L } from '../core/i18n.js';

export const TRAITS = {
  greedy:    { n: ['Жадный', 'Жадібний', 'Greedy'], offer: [0.58, 0.76], max: 0.9, patience: 2 },
  polite:    { n: ['Вежливый', 'Ввічливий', 'Polite'], offer: [0.86, 0.97], max: 1.03, patience: 3 },
  reseller:  { n: ['Перекуп', 'Перекуп', 'Reseller'], offer: [0.5, 0.68], max: 0.8, patience: 2 },
  collector: { n: ['Коллекционер', 'Колекціонер', 'Collector'], offer: [0.9, 1.06], max: 1.18, patience: 3 },
  newbie:    { n: ['Новичок', 'Новачок', 'Newbie'], offer: [0.88, 1.0], max: 1.05, patience: 4 },
  haggler:   { n: ['Торгаш', 'Торгаш', 'Haggler'], offer: [0.62, 0.8], max: 0.95, patience: 4 },
  rich:      { n: ['Мажор', 'Мажор', 'Big spender'], offer: [0.95, 1.05], max: 1.12, patience: 1 },
  angry:     { n: ['Скандалист', 'Скандаліст', 'Hothead'], offer: [0.68, 0.84], max: 0.95, patience: 1 },
  scammer:   { n: ['Подозрительный', 'Підозрілий', 'Suspicious'], offer: [1.0, 1.12], max: 1.2, patience: 3 },
};
export const SELLER_TRAITS = {
  honest:  { n: ['Честный', 'Чесний', 'Honest'], honesty: 0.95, flex: [0.88, 0.95] },
  normal:  { n: ['Обычный', 'Звичайний', 'Regular'], honesty: 0.6, flex: [0.86, 0.94] },
  urgent:  { n: ['Срочно продаёт', 'Терміново продає', 'Needs cash fast'], honesty: 0.7, flex: [0.72, 0.85] },
  shady:   { n: ['Мутный', 'Мутний', 'Shady'], honesty: 0.15, flex: [0.82, 0.92] },
  clueless:{ n: ['Не разбирается', 'Не розбирається', 'Clueless'], honesty: 0.8, flex: [0.8, 0.9] },
  dealer:  { n: ['Перекупщик', 'Перекупник', 'Dealer'], honesty: 0.4, flex: [0.92, 0.98] },
  granny:  { n: ['Бабушка', 'Бабуся', 'Grandma'], honesty: 1, flex: [0.7, 0.85] },
};

export function npcName(rng, cityId) {
  const c = countryOf(cityId);
  const pool = NAMES[c.names] || NAMES.en;
  const fem = rng.chance(0.4);
  return { name: rng.pick(fem ? pool.f : pool.m), fem };
}
export function makeBuyer(rng, cityId, o = {}) {
  const { name, fem } = npcName(rng, cityId);
  const trait = o.trait || rng.weighted(Object.keys(TRAITS), (k) => ({ greedy: 2.2, polite: 2, reseller: 1.4, collector: o.collectible ? 1.6 : 0.4, newbie: 1.5, haggler: 1.8, rich: 0.6, angry: 0.7, scammer: o.noScam ? 0 : 0.45 }[k]));
  return { name, fem, trait, mood: 0, hue: rng.int(0, 359) };
}
export function makeSeller(rng, cityId) {
  const { name, fem } = npcName(rng, cityId);
  const trait = rng.weighted(Object.keys(SELLER_TRAITS), (k) => ({ honest: 2, normal: 4, urgent: 1.3, shady: 1.3, clueless: 1.1, dealer: 1.5, granny: 0.5 }[k]));
  return { name: trait === 'granny' ? T('Галина Петровна', 'Галина Петрівна', 'Grandma Rose') : name, fem: trait === 'granny' || fem, trait, hue: rng.int(0, 359), rating: +(trait === 'shady' ? rng.float(3.2, 4.4) : rng.float(4.1, 5)).toFixed(1), deals: rng.int(0, 240) };
}
export const traitName = (k) => L(TRAITS[k]?.n || SELLER_TRAITS[k]?.n || k);

const P = (arr) => arr; // phrase arrays are [ru, uk, en]
export const PH = {
  greet: [
    P(['Привет. {item} ещё не продан?', 'Привіт. {item} ще не продано?', 'Hi. Is the {item} still available?']),
    P(['Здравствуйте! Актуально?', 'Добрий день! Актуально?', 'Hello! Still available?']),
    P(['Добрый вечер, {item} в наличии?', 'Добрий вечір, {item} в наявності?', 'Good evening, do you still have the {item}?']),
    P(['Ку. Ещё продаёшь?', 'Ку. Ще продаєш?', 'Yo, still selling?']),
  ],
  greetTrait: {
    greedy: P(['Цены завышены, как обычно.', 'Ціни завищені, як завжди.', 'Overpriced as usual.']),
    reseller: P(['Беру сразу, если отдашь по‑нормальному.', 'Беру одразу, якщо віддаси по‑нормальному.', 'I’ll take it now if the price is right.']),
    collector: P(['Давно ищу именно такой экземпляр!', 'Давно шукаю саме такий екземпляр!', 'I’ve been hunting this exact piece!']),
    newbie: P(['А он точно рабочий? Я в этом не разбираюсь…', 'А він точно робочий? Я в цьому не розбираюся…', 'Does it definitely work? I’m not an expert…']),
    haggler: P(['Давайте поторгуемся, я не богач.', 'Давайте поторгуємося, я не багатій.', 'Let’s haggle, I’m not rich.']),
    rich: P(['Без лишних слов. Устроит?', 'Без зайвих слів. Влаштує?', 'No small talk. Deal?']),
    angry: P(['Только быстро, у меня мало времени.', 'Тільки швидко, у мене мало часу.', 'Make it quick, I’m busy.']),
    polite: P(['Если можно, чуть‑чуть скидки 🙏', 'Якщо можна, трохи знижки 🙏', 'A small discount would be lovely 🙏']),
    scammer: P(['Беру за полную цену, даже больше! Оплачу через доставку.', 'Беру за повну ціну, навіть більше! Оплачу через доставку.', 'I’ll pay full price, even more! I’ll pay via delivery.']),
  },
  offer: [
    P(['Могу {price}. Это нормальная цена, не обижайтесь.', 'Можу {price}. Це нормальна ціна, не ображайтеся.', 'I can do {price}. That’s fair, no offence.']),
    P(['Предлагаю {price}.', 'Пропоную {price}.', 'I offer {price}.']),
    P(['{price} — и забираю сегодня.', '{price} — і забираю сьогодні.', '{price} and I pick it up today.']),
    P(['Отдадите за {price}?', 'Віддасте за {price}?', 'Would you take {price}?']),
  ],
  counter: [
    P(['Ну хорошо, {price}. Это максимум.', 'Ну добре, {price}. Це максимум.', 'Fine, {price}. That’s my max.']),
    P(['Давайте сойдёмся на {price}.', 'Давайте зійдемося на {price}.', 'Let’s meet at {price}.']),
    P(['{price}, и по рукам?', '{price}, і по руках?', '{price} and we have a deal?']),
  ],
  accept: [
    P(['Договорились! 🤝', 'Домовилися! 🤝', 'Deal! 🤝']),
    P(['Отлично, беру.', 'Чудово, беру.', 'Great, I’ll take it.']),
    P(['По рукам. Оформляйте.', 'По руках. Оформлюйте.', 'Done. Let’s do it.']),
  ],
  decline: [
    P(['Нет, дорого. Удачи.', 'Ні, дорого. Удачі.', 'Nah, too pricey. Good luck.']),
    P(['Не, я пас.', 'Ні, я пас.', 'I’ll pass.']),
    P(['Найду дешевле.', 'Знайду дешевше.', 'I’ll find it cheaper.']),
  ],
  angryLeave: P(['Сами его носите за такие деньги 😤', 'Самі його носіть за такі гроші 😤', 'Keep it at that price 😤']),
  scamLink: P(['Я оплатил! Подтвердите получение денег по ссылке: {link}', 'Я оплатив! Підтвердіть отримання грошей за посиланням: {link}', 'Paid! Confirm the payment here: {link}']),
  thanks: P(['Спасибо, всё пришло, всё отлично! 👍', 'Дякую, все прийшло, все чудово! 👍', 'Thanks, it arrived, all good! 👍']),
  claim: P(['Вы продали мне вещь с дефектом: {defect}. Верните деньги!', 'Ви продали мені річ із дефектом: {defect}. Поверніть гроші!', 'You sold me a faulty item: {defect}. I want a refund!']),
  claimFake: P(['Я проверил — это ПОДДЕЛКА! Возвращайте деньги, или пишу в полицию.', 'Я перевірив — це ПІДРОБКА! Повертайте гроші, або пишу в поліцію.', 'I checked — it’s a FAKE! Refund me or I’m going to the police.']),
  // seller side
  sellerHi: [
    P(['Да, актуально. Цена {price}.', 'Так, актуально. Ціна {price}.', 'Yes, available. Price is {price}.']),
    P(['Здравствуйте, в наличии.', 'Добрий день, в наявності.', 'Hello, it’s available.']),
  ],
  sellerNo: [
    P(['Нет, за столько не отдам.', 'Ні, за стільки не віддам.', 'No, not for that much.']),
    P(['Это очень мало. Не обижайте.', 'Це дуже мало. Не ображайте.', 'That’s way too low.']),
  ],
  sellerCounter: [
    P(['Могу уступить до {price}, не меньше.', 'Можу поступитися до {price}, не менше.', 'I can go down to {price}, not lower.']),
    P(['Последняя цена — {price}.', 'Остання ціна — {price}.', 'Final price — {price}.']),
  ],
  sellerYes: [
    P(['Хорошо, забирайте за {price}.', 'Добре, забирайте за {price}.', 'Okay, it’s yours for {price}.']),
    P(['Ладно, договорились: {price}.', 'Гаразд, домовилися: {price}.', 'Alright, deal: {price}.']),
  ],
  sellerGone: P(['Всё, уже продал, извините.', 'Все, вже продав, вибачте.', 'Sorry, already sold.']),
  sellerDefects: P(['Есть нюансы: {list}.', 'Є нюанси: {list}.', 'There are some issues: {list}.']),
  sellerClean: P(['Всё работает, без проблем.', 'Все працює, без проблем.', 'Everything works, no issues.']),
  sellerOrig: P(['Оригинал, 100%.', 'Оригінал, 100%.', '100% authentic.']),
  sellerRepl: P(['Это реплика, сразу говорю.', 'Це репліка, одразу кажу.', 'It’s a replica, to be clear.']),
};
export const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
export const say = (arr, vars = {}, rng) => fill(L(rng ? rng.pick(arr.length && Array.isArray(arr[0]) ? arr : [arr]) : (Array.isArray(arr[0]) ? arr[0] : arr)), vars);
export const SCAM_LINKS = ['dostavka-pay.top/confirm', 'olx-safe.site/pay', 'avito-dostavka.icu/money', 'secure-deliv.xyz/card', 'nova-p0shta.pay/claim'];
