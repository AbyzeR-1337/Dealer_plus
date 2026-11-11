// What the App Store knows about each app: category, description, price, size, and whether it is a
// system app (preinstalled, can't be removed) or a secret one (only visible and usable through a VPN).
const M = (cat, ru, uk, en, o = {}) => ({ cat, desc: [ru, uk, en], price: 0, mb: 40, rating: 4.6, ...o });
export const APP_CATS = {
  trade: ['Торговля', 'Торгівля', 'Trading'], money: ['Финансы', 'Фінанси', 'Finance'], work: ['Работа', 'Робота', 'Work'],
  life: ['Жизнь', 'Життя', 'Lifestyle'], service: ['Сервисы', 'Сервіси', 'Utilities'], fun: ['Развлечения', 'Розваги', 'Entertainment'],
  secret: ['Скрытые', 'Приховані', 'Hidden'],
};
export const APP_META = {
  appstore: M('service', 'Магазин приложений.', 'Магазин застосунків.', 'The app store.', { sys: true, mb: 0 }),
  map: M('life', 'Карта города: районы, рынки, свалки, магазины.', 'Мапа міста: райони, ринки, звалища, крамниці.', 'City map: districts, markets, dumps, shops.', { sys: true }),
  inventory: M('life', 'Склад: все ваши вещи, коллекции и объявления.', 'Склад: усі ваші речі, колекції й оголошення.', 'Storage: your items, collections and listings.', { sys: true }),
  profile: M('life', 'Профиль, жильё, еда и сон.', 'Профіль, житло, їжа і сон.', 'Profile, home, food and sleep.', { sys: true }),
  stats: M('life', 'Статистика ваших сделок.', 'Статистика ваших угод.', 'Your trading statistics.', { sys: true }),
  rating: M('life', 'Рейтинг игроков и друзья.', 'Рейтинг гравців і друзі.', 'Leaderboard and friends.', { sys: true }),
  quests: M('life', 'Задания и путь к империи.', 'Завдання і шлях до імперії.', 'Quests and the road to an empire.', { sys: true }),
  settings: M('service', 'Язык, валюта, звук, сохранения.', 'Мова, валюта, звук, збереження.', 'Language, currency, sound, saves.', { sys: true }),
  news: M('life', 'Новости рынка и журнал событий.', 'Новини ринку і журнал подій.', 'Market news and event log.', { sys: true }),
  market: M('trade', 'Главная доска объявлений: покупайте, продавайте, торгуйтесь.', 'Головна дошка оголошень: купуйте, продавайте, торгуйтеся.', 'The main classifieds: buy, sell, haggle.', { mb: 96, rating: 4.7 }),
  bank: M('money', 'Карта, переводы, кредиты, вклады и кредитный рейтинг.', 'Картка, перекази, кредити, вклади й кредитний рейтинг.', 'Card, transfers, loans, savings and credit score.', { mb: 120, rating: 4.9 }),
  jobs: M('work', 'Вакансии, собеседования и смены.', 'Вакансії, співбесіди та зміни.', 'Vacancies, interviews and shifts.', { mb: 58 }),
  free: M('trade', 'Отдают даром, барахолки, свалки — первые деньги.', 'Віддають даром, барахолки, звалища — перші гроші.', 'Freebies, flea markets, dumps — your first money.', { mb: 22, rating: 4.3 }),
  delivery: M('service', 'Посылки: отправка и получение.', 'Посилки: відправлення та отримання.', 'Parcels: send and receive.', { mb: 64 }),
  repair: M('work', 'Мастерская: ремонт, запчасти, инструменты, грейдинг.', 'Майстерня: ремонт, запчастини, інструменти, грейдинг.', 'Workshop: repairs, parts, tools, grading.', { mb: 70 }),
  legit: M('work', 'Проверка подлинности брендовых вещей.', 'Перевірка справжності брендових речей.', 'Authenticate branded items.', { mb: 35, price: 1.99 }),
  auction: M('trade', 'Аукционы с ставками в реальном времени.', 'Аукціони зі ставками в реальному часі.', 'Live auctions.', { mb: 54 }),
  pawn: M('trade', 'Ломбард: деньги сразу, но дёшево.', 'Ломбард: гроші одразу, але дешево.', 'Pawn shop: instant cash, low price.', { mb: 18, rating: 3.9 }),
  shop: M('life', 'Еда, товары и снаряжение.', 'Їжа, товари та спорядження.', 'Food, goods and gear.', { mb: 80 }),
  travel: M('life', 'Билеты, багаж и таможня.', 'Квитки, багаж і митниця.', 'Tickets, luggage and customs.', { mb: 72 }),
  realty: M('life', 'Аренда и покупка жилья.', 'Оренда й купівля житла.', 'Rent or buy a home.', { mb: 66 }),
  business: M('work', 'Свои точки, персонал и сети магазинов.', 'Власні точки, персонал і мережі крамниць.', 'Your shops, staff and chains.', { mb: 88 }),
  gov: M('service', 'Госуслуги: налоги, регистрация бизнеса, штрафы.', 'Держпослуги: податки, реєстрація бізнесу, штрафи.', 'Government: taxes, business registration, fines.', { mb: 110, rating: 3.6 }),
  stocks: M('money', 'Биржа: акции брендов, графики, портфель.', 'Біржа: акції брендів, графіки, портфель.', 'Stock market: brand shares, charts, portfolio.', { mb: 76, price: 4.99, rating: 4.4 }),
  numbers: M('trade', 'Красивые номера телефонов и госномера.', 'Гарні номери телефонів і держномери.', 'Vanity phone numbers and plates.', { mb: 26 }),
  upgrades: M('work', 'Прокачка навыков перекупа.', 'Прокачування навичок перекупа.', 'Level up your reseller skills.', { mb: 15 }),
  casino: M('fun', 'Слоты, рулетка, блэкджек и краш. 18+.', 'Слоти, рулетка, блекджек і краш. 18+.', 'Slots, roulette, blackjack and crash. 18+.', { mb: 140, rating: 3.2 }),
  vpn: M('service', 'VPN и защита Wi‑Fi. Скрывает трафик и открывает скрытые приложения.', 'VPN і захист Wi‑Fi. Приховує трафік і відкриває приховані застосунки.', 'VPN & Wi‑Fi protection. Hides your traffic and unlocks hidden apps.', { mb: 30, price: 2.99, rating: 4.5 }),
  lab: M('secret', 'Джейлбрейк и перепрошивка телефонов. Снимает код-пароль и FRP.', 'Джейлбрейк і перепрошивка телефонів. Знімає код-пароль і FRP.', 'Jailbreak and reflash phones. Removes passcodes and FRP.', { mb: 12, secret: true, rating: 4.1 }),
  dark: M('secret', 'Теневой рынок: дешёвый серый товар, отвязка аккаунтов, накрутки. Высокий риск.', 'Тіньовий ринок: дешевий сірий товар, відвʼязка акаунтів, накрутки. Високий ризик.', 'Shadow market: cheap grey goods, account unlocks, fake reviews. High risk.', { mb: 8, secret: true, rating: 2.9 }),
};
export const SYSTEM_APPS = Object.keys(APP_META).filter((k) => APP_META[k].sys);
// what a brand-new phone has: the system apps
export const PREINSTALLED = ['appstore', 'map', 'inventory', 'profile', 'stats', 'rating', 'quests', 'settings', 'news'];
