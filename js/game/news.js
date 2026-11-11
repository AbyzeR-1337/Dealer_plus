// News feed: market events, rivals, world flavour and tips.
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { RNG } from '../core/rng.js';
import { eventText, day } from './economy.js';
import { fmt } from '../core/money.js';
import { CATS } from '../data/catalog.js';

export function pushNews(n) {
  const s = G.s;
  s.news.unshift({ t: s.t, ...n });
  if (s.news.length > 80) s.news.length = 80;
  emit('news');
}
export const newsText = (n) => (n.ev ? eventText(n.ev, L) : L(n.tx));

const TIPS = [
  ['Заблокированные телефоны дешевле на ~30%. Снять код‑пароль или FRP можно в «Phone Lab». iCloud и чёрный IMEI — нет.', 'Заблоковані телефони дешевші на ~30%. Зняти код‑пароль або FRP можна в «Phone Lab». iCloud і чорний IMEI — ні.', 'Locked phones are ~30% cheaper. Phone Lab removes passcodes and FRP — not Pear ID or blacklisted IMEI.'],
  ['Осмотр перед покупкой раскрывает скрытые дефекты: нажимай на подозрительные места и проверяй кнопки.', 'Огляд перед покупкою розкриває приховані дефекти.', 'Inspect before buying to reveal hidden defects.'],
  ['Указывай дефекты в объявлении честно — иначе покупатель вернёт вещь и оставит плохой отзыв.', 'Вказуй дефекти чесно — інакше буде повернення й поганий відгук.', 'Disclose defects honestly or face returns and bad reviews.'],
  ['Подделки часто продают как оригинал. Проверяй подлинность в «Легит‑чек».', 'Підробки часто продають як оригінал. Перевіряй у «Легіт‑чек».', 'Fakes are often sold as authentic. Use Legit Check.'],
  ['В разных городах разные цены. Покупай дешевле — продавай дороже.', 'У різних містах різні ціни. Купуй дешевше — продавай дорожче.', 'Prices differ by city: buy low, sell high.'],
  ['Ссылки «подтвердить оплату» в чатах — это мошенники. Не переходи!', 'Посилання «підтвердити оплату» в чатах — це шахраї!', '“Confirm payment” links in chats are scams!'],
  ['Платите налоги вовремя — налоговый долг портит кредитный рейтинг.', 'Сплачуйте податки вчасно — борг псує кредитний рейтинг.', 'Pay taxes on time — debt hurts your credit rating.'],
  ['Коллекции дают постоянный бонус к цене продажи в категории.', 'Колекції дають постійний бонус до ціни продажу.', 'Completed collections give a permanent price bonus.'],
  ['Карточки и комиксы в слабе с высоким грейдом стоят в разы дороже.', 'Картки й комікси в слабі з високим грейдом коштують у рази дорожче.', 'High‑grade slabs are worth multiples of raw copies.'],
  ['Продавец в магазине продаёт, даже когда тебя нет в городе.', 'Продавець у магазині продає, навіть коли тебе немає в місті.', 'A store clerk sells even while you’re away.'],
];
const WORLD = [
  ['Курс валют штормит — проверьте «Банк» перед поездкой.', 'Курс валют штормить — перевірте «Банк» перед поїздкою.', 'FX is volatile — check the Bank before travelling.'],
  ['В Шэньчжэне открылся новый рынок электроники.', 'У Шеньчжені відкрився новий ринок електроніки.', 'A new electronics market opened in Shenzhen.'],
  ['Таможня усилила проверки на подделки люкса.', 'Митниця посилила перевірки на підробки люксу.', 'Customs tightened checks on luxury fakes.'],
  ['В Токио стартовал сезон коллекционных карточек.', 'У Токіо стартував сезон колекційних карток.', 'Trading card season kicked off in Tokyo.'],
  ['В Дубае прошла выставка часов — спрос на люкс растёт.', 'У Дубаї пройшла виставка годинників — попит на люкс зростає.', 'A watch fair in Dubai boosts luxury demand.'],
];
export function dailyNews(events) {
  const s = G.s;
  for (const ev of events) pushNews({ kind: 'market', ev });
  const rng = new RNG(`${s.id}:news:${day()}`);
  // rivals grow
  for (const r of s.rivals) r.worth *= 1 + r.g * rng.float(0.3, 1.6);
  if (rng.chance(0.6)) {
    const r = rng.pick(s.rivals);
    pushNews({ kind: 'rival', tx: [`Перекупщик ${r.name} хвастается капиталом ${fmt(r.worth)}.`, `Перекупник ${r.name} хизується капіталом ${fmt(r.worth)}.`, `Reseller ${r.name} brags about a net worth of ${fmt(r.worth)}.`] });
  }
  if (rng.chance(0.5)) pushNews({ kind: 'world', tx: rng.pick(WORLD) });
  pushNews({ kind: 'tip', tx: rng.pick(TIPS) });
}
export function seedNews() {
  if (G.s.news.length) return;
  pushNews({ kind: 'tip', tx: TIPS[0] });
  pushNews({ kind: 'tip', tx: TIPS[1] });
  pushNews({ kind: 'world', tx: ['Добро пожаловать в Global Reseller! Начни с работы и бесплатных вещей.', 'Ласкаво просимо до Global Reseller! Почни з роботи та безкоштовних речей.', 'Welcome to Global Reseller! Start with a job and free stuff.'] });
}
