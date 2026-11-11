// World: countries, cities, currencies and the local (fictional) service brands per region.
export const CURRENCIES = {
  USD: { sym: '$', rate: 1, before: true, name: ['Доллар США', 'Долар США', 'US Dollar'] },
  EUR: { sym: '€', rate: 0.92, before: false, name: ['Евро', 'Євро', 'Euro'] },
  GBP: { sym: '£', rate: 0.78, before: true, name: ['Фунт', 'Фунт', 'Pound'] },
  RUB: { sym: '₽', rate: 92, before: false, name: ['Рубль', 'Рубль', 'Ruble'] },
  UAH: { sym: '₴', rate: 41.5, before: false, name: ['Гривна', 'Гривня', 'Hryvnia'] },
  BYN: { sym: 'Br', rate: 3.25, before: false, name: ['Бел. рубль', 'Біл. рубль', 'Bel. ruble'] },
  KZT: { sym: '₸', rate: 495, before: false, name: ['Тенге', 'Теньге', 'Tenge'] },
  PLN: { sym: 'zł', rate: 3.9, before: false, name: ['Злотый', 'Злотий', 'Zloty'] },
  JPY: { sym: '¥', rate: 152, before: true, name: ['Иена', 'Єна', 'Yen'] },
  CNY: { sym: 'CN¥', rate: 7.2, before: true, name: ['Юань', 'Юань', 'Yuan'] },
  AED: { sym: 'AED', rate: 3.67, before: false, name: ['Дирхам', 'Дирхам', 'Dirham'] },
  TRY: { sym: '₺', rate: 38, before: false, name: ['Лира', 'Ліра', 'Lira'] },
  GEL: { sym: '₾', rate: 2.7, before: false, name: ['Лари', 'Ларі', 'Lari'] },
  THB: { sym: '฿', rate: 34, before: true, name: ['Бат', 'Бат', 'Baht'] },
};

// apps: [name, color1, color2]
export const COUNTRIES = [
  { id: 'RU', name: ['Россия', 'Росія', 'Russia'], flag: '🇷🇺', cur: 'RUB', lang: 'ru', names: 'ru', land: 'eu',
    tax: 0.13, price: 1.0, rent: 0.75, wage: 0.85, fake: 0.12, customs: 0.15, plate: 'ru', phone: '+7',
    demand: { phones: 1.1, electronics: 1.15, consoles: 1.08, cars: 1.12, sneakers: 1.05, watches: 1.05, bags: 1.05, perfume: 1.05 },
    apps: { classifieds: ['Авитон', '#00b4ff', '#0062ff'], marketplace: ['ВайлдМаркет', '#d61fb5', '#6d0fb8'], bank: ['Т‑Копилка', '#ffd42a', '#d9a600'], delivery: ['СДЭКС', '#1fbf55', '#0d8a37'], gov: ['Госуслуги', '#3c7bf0', '#1d4fc2'], jobs: ['ХэдХант', '#e5172f', '#a10a1d'], auction: ['Молоток', '#ff9a1f', '#e2620a'] },
    cities: [
      { id: 'msk', name: ['Москва', 'Москва', 'Moscow'], lat: 55.75, lon: 37.62, idx: 1.10, size: 3 },
      { id: 'spb', name: ['Санкт‑Петербург', 'Санкт‑Петербург', 'St. Petersburg'], lat: 59.94, lon: 30.31, idx: 1.05, size: 3 },
      { id: 'kzn', name: ['Казань', 'Казань', 'Kazan'], lat: 55.79, lon: 49.12, idx: 0.95, size: 2 },
      { id: 'ekb', name: ['Екатеринбург', 'Єкатеринбург', 'Yekaterinburg'], lat: 56.84, lon: 60.6, idx: 0.97, size: 2 },
      { id: 'nsk', name: ['Новосибирск', 'Новосибірськ', 'Novosibirsk'], lat: 55.03, lon: 82.92, idx: 0.96, size: 2 },
      { id: 'vvo', name: ['Владивосток', 'Владивосток', 'Vladivostok'], lat: 43.12, lon: 131.89, idx: 1.04, size: 2 },
      { id: 'pkc', name: ['Петропавловск‑Камчатский', 'Петропавловськ‑Камчатський', 'Petropavlovsk‑Kamchatsky'], lat: 53.04, lon: 158.65, idx: 1.15, size: 1 },
      { id: 'mcx', name: ['Махачкала', 'Махачкала', 'Makhachkala'], lat: 42.98, lon: 47.5, idx: 0.77, size: 1 },
      { id: 'aer', name: ['Сочи', 'Сочі', 'Sochi'], lat: 43.6, lon: 39.73, idx: 1.08, size: 1 },
    ] },
  { id: 'UA', name: ['Украина', 'Україна', 'Ukraine'], flag: '🇺🇦', cur: 'UAH', lang: 'uk', names: 'uk', land: 'eu',
    tax: 0.18, price: 0.92, rent: 0.6, wage: 0.65, fake: 0.12, customs: 0.2, plate: 'ua', phone: '+380',
    demand: { phones: 1.05, electronics: 1.08, cars: 1.05, clothing: 0.95, bikes: 1.1 },
    apps: { classifieds: ['ОЛІКС', '#23e5db', '#00877f'], marketplace: ['Промікс', '#7a3cff', '#4a16c9'], bank: ['Монокіт', '#2b2b2b', '#000000'], delivery: ['Нова Доставка', '#ff2d2d', '#c00d0d'], gov: ['Держпослуги', '#111111', '#3a3a3a'], jobs: ['Ворк.юа', '#2a8cff', '#1a5fd0'], auction: ['Лот.ua', '#ffb000', '#d68000'] },
    cities: [
      { id: 'kyiv', name: ['Киев', 'Київ', 'Kyiv'], lat: 50.45, lon: 30.52, idx: 1.05, size: 3 },
      { id: 'lviv', name: ['Львов', 'Львів', 'Lviv'], lat: 49.84, lon: 24.03, idx: 1.0, size: 2 },
      { id: 'odesa', name: ['Одесса', 'Одеса', 'Odesa'], lat: 46.48, lon: 30.72, idx: 0.98, size: 2 },
      { id: 'kharkiv', name: ['Харьков', 'Харків', 'Kharkiv'], lat: 49.99, lon: 36.23, idx: 0.92, size: 2 },
      { id: 'dnipro', name: ['Днепр', 'Дніпро', 'Dnipro'], lat: 48.46, lon: 35.04, idx: 0.95, size: 2 },
    ] },
  { id: 'BY', name: ['Беларусь', 'Білорусь', 'Belarus'], flag: '🇧🇾', cur: 'BYN', lang: 'ru', names: 'ru', land: 'eu',
    tax: 0.13, price: 0.9, rent: 0.55, wage: 0.6, fake: 0.1, customs: 0.15, plate: 'by', phone: '+375',
    demand: { phones: 1.08, cars: 1.0, electronics: 1.1 },
    apps: { classifieds: ['Куфер', '#ffd400', '#d4a000'], marketplace: ['Онлайнэр', '#3b82f6', '#1d4ed8'], bank: ['Беларусик', '#00a650', '#00753a'], delivery: ['ЕвроПошта', '#ffcc00', '#e0a800'], gov: ['Е‑паслугі', '#b22234', '#7d1724'], jobs: ['Рабочий.by', '#ff6a00', '#c94f00'], auction: ['Лот.by', '#9b5cff', '#6b2ee0'] },
    cities: [{ id: 'minsk', name: ['Минск', 'Мінськ', 'Minsk'], lat: 53.9, lon: 27.56, idx: 0.92, size: 2 }] },
  { id: 'KZ', name: ['Казахстан', 'Казахстан', 'Kazakhstan'], flag: '🇰🇿', cur: 'KZT', lang: 'ru', names: 'kk', land: 'eu',
    tax: 0.1, price: 0.95, rent: 0.6, wage: 0.7, fake: 0.14, customs: 0.12, plate: 'kz', phone: '+7',
    demand: { cars: 1.05, phones: 1.05, electronics: 1.05 },
    apps: { classifieds: ['OLIX.kz', '#23e5db', '#00877f'], marketplace: ['Каспер Маркет', '#f14635', '#b5281a'], bank: ['Каспер Банк', '#f14635', '#b5281a'], delivery: ['КазЭкспресс', '#00a3e0', '#0070a8'], gov: ['еГов+', '#00afca', '#007b8f'], jobs: ['ХэдХант.kz', '#e5172f', '#a10a1d'], auction: ['Лот.kz', '#ffb000', '#d68000'] },
    cities: [
      { id: 'almaty', name: ['Алматы', 'Алмати', 'Almaty'], lat: 43.24, lon: 76.89, idx: 0.95, size: 2 },
      { id: 'astana', name: ['Астана', 'Астана', 'Astana'], lat: 51.17, lon: 71.45, idx: 0.98, size: 2 },
    ] },
  { id: 'PL', name: ['Польша', 'Польща', 'Poland'], flag: '🇵🇱', cur: 'PLN', lang: 'en', names: 'pl', land: 'eu',
    tax: 0.12, price: 1.0, rent: 1.0, wage: 1.4, fake: 0.08, customs: 0.1, plate: 'eu', phone: '+48',
    demand: { cars: 0.95, clothing: 1.05, sneakers: 1.05 },
    apps: { classifieds: ['OLIX.pl', '#23e5db', '#00877f'], marketplace: ['Allegrio', '#ff5a00', '#d14400'], bank: ['mBanko', '#e3001b', '#a80014'], delivery: ['InPostman', '#ffcd00', '#d9a900'], gov: ['e‑Urząd', '#dc143c', '#9e0f2b'], jobs: ['Pracujemy', '#0058e6', '#003fa8'], auction: ['Allegrio Aukcje', '#ff8a00', '#d16200'] },
    cities: [
      { id: 'waw', name: ['Варшава', 'Варшава', 'Warsaw'], lat: 52.23, lon: 21.01, idx: 1.0, size: 3 },
      { id: 'krk', name: ['Краков', 'Краків', 'Kraków'], lat: 50.06, lon: 19.94, idx: 0.97, size: 2 },
    ] },
  { id: 'DE', name: ['Германия', 'Німеччина', 'Germany'], flag: '🇩🇪', cur: 'EUR', lang: 'en', names: 'de', land: 'eu',
    tax: 0.25, price: 1.05, rent: 1.6, wage: 2.6, fake: 0.06, customs: 0.1, plate: 'de', phone: '+49',
    demand: { cars: 0.88, instruments: 0.95, electronics: 0.95, antiques: 1.05, bikes: 0.95 },
    apps: { classifieds: ['KleinBörse', '#86b817', '#4f7a00'], marketplace: ['Ottoh', '#e2001a', '#a60013'], bank: ['N27', '#36a18b', '#1f6f5f'], delivery: ['DHX', '#ffcc00', '#d40511'], gov: ['Finanzamt+', '#333333', '#000000'], jobs: ['StepUp', '#0c2577', '#06154a'], auction: ['eBuy.de', '#e53238', '#0064d2'] },
    cities: [
      { id: 'ber', name: ['Берлин', 'Берлін', 'Berlin'], lat: 52.52, lon: 13.4, idx: 1.0, size: 3 },
      { id: 'muc', name: ['Мюнхен', 'Мюнхен', 'Munich'], lat: 48.14, lon: 11.58, idx: 1.08, size: 2 },
    ] },
  { id: 'FR', name: ['Франция', 'Франція', 'France'], flag: '🇫🇷', cur: 'EUR', lang: 'en', names: 'fr', land: 'eu',
    tax: 0.25, price: 1.08, rent: 1.8, wage: 2.5, fake: 0.08, customs: 0.1, plate: 'eu', phone: '+33',
    demand: { bags: 1.15, perfume: 0.9, clothing: 1.1, art: 1.15, jewelry: 1.08 },
    apps: { classifieds: ['LeBonDeal', '#ff6e14', '#d14f00'], marketplace: ['Cdiskount', '#0057a3', '#003c73'], bank: ['Boursa+', '#d6006e', '#9e0051'], delivery: ['ColiPost', '#ffc800', '#e09d00'], gov: ['Impôts+', '#000091', '#00005e'], jobs: ['Indid', '#2164f3', '#1747b3'], auction: ['Drouhaut', '#8c1b3d', '#5c0f26'] },
    cities: [{ id: 'par', name: ['Париж', 'Париж', 'Paris'], lat: 48.86, lon: 2.35, idx: 1.08, size: 3 }] },
  { id: 'IT', name: ['Италия', 'Італія', 'Italy'], flag: '🇮🇹', cur: 'EUR', lang: 'en', names: 'it', land: 'eu',
    tax: 0.23, price: 1.05, rent: 1.5, wage: 2.1, fake: 0.12, customs: 0.1, plate: 'eu', phone: '+39',
    demand: { bags: 1.1, clothing: 1.12, cars: 1.05, art: 1.1, sneakers: 0.95 },
    apps: { classifieds: ['Subitto', '#f9423a', '#c42520'], marketplace: ['eBuy.it', '#e53238', '#0064d2'], bank: ['Finecco', '#004b8d', '#00305c'], delivery: ['PosteIT', '#ffd500', '#d6a800'], gov: ['Entrate+', '#0066cc', '#004080'], jobs: ['InfoJobb', '#167db7', '#0d5580'], auction: ['Catawiko', '#003a70', '#00224a'] },
    cities: [{ id: 'mil', name: ['Милан', 'Мілан', 'Milan'], lat: 45.46, lon: 9.19, idx: 1.06, size: 3 }] },
  { id: 'GB', name: ['Великобритания', 'Велика Британія', 'United Kingdom'], flag: '🇬🇧', cur: 'GBP', lang: 'en', names: 'en', land: 'uk',
    tax: 0.2, price: 1.1, rent: 2.0, wage: 2.6, fake: 0.08, customs: 0.2, plate: 'gb', phone: '+44',
    demand: { antiques: 1.15, art: 1.15, watches: 1.05, sneakers: 1.08, comics: 1.05 },
    apps: { classifieds: ['Gumbranch', '#72ef36', '#3e9d0e'], marketplace: ['Amazin', '#ff9900', '#232f3e'], bank: ['Monzi', '#ff4f40', '#14233c'], delivery: ['Royal Mails', '#da202a', '#9d121a'], gov: ['TaxGov.uk', '#0b0c0c', '#1d70b8'], jobs: ['Reeds', '#e3165b', '#a10e40'], auction: ['eBuy.uk', '#e53238', '#0064d2'] },
    cities: [{ id: 'lon', name: ['Лондон', 'Лондон', 'London'], lat: 51.5, lon: -0.12, idx: 1.12, size: 3 }] },
  { id: 'US', name: ['США', 'США', 'USA'], flag: '🇺🇸', cur: 'USD', lang: 'en', names: 'en', land: 'am',
    tax: 0.22, price: 1.0, rent: 2.2, wage: 3.0, fake: 0.08, customs: 0.12, plate: 'us', phone: '+1',
    demand: { sneakers: 1.18, cards: 1.15, comics: 1.15, cars: 0.92, toys: 1.08, instruments: 1.05, clothing: 1.05 },
    apps: { classifieds: ['CraigBoard', '#6a1b9a', '#3b0d5c'], marketplace: ['Amazin', '#ff9900', '#232f3e'], bank: ['Chaze', '#117aca', '#0b4f86'], delivery: ['UPZ', '#7b4b24', '#ffb500'], gov: ['IRZ', '#1a4480', '#0f2a50'], jobs: ['Indid', '#2164f3', '#1747b3'], auction: ['eBuy', '#e53238', '#0064d2'] },
    cities: [
      { id: 'nyc', name: ['Нью‑Йорк', 'Нью‑Йорк', 'New York'], lat: 40.71, lon: -74.0, idx: 1.12, size: 3 },
      { id: 'lax', name: ['Лос‑Анджелес', 'Лос‑Анджелес', 'Los Angeles'], lat: 34.05, lon: -118.24, idx: 1.06, size: 3 },
      { id: 'mia', name: ['Майами', 'Маямі', 'Miami'], lat: 25.76, lon: -80.19, idx: 1.03, size: 2 },
    ] },
  { id: 'JP', name: ['Япония', 'Японія', 'Japan'], flag: '🇯🇵', cur: 'JPY', lang: 'en', names: 'ja', land: 'jp',
    tax: 0.2, price: 0.95, rent: 1.4, wage: 2.2, fake: 0.03, customs: 0.1, plate: 'jp', phone: '+81',
    demand: { cards: 1.22, toys: 1.18, consoles: 0.82, watches: 0.92, cars: 0.85, cameras: 0.85, electronics: 0.92, comics: 1.1 },
    apps: { classifieds: ['Merkaru', '#ff0211', '#b5000b'], marketplace: ['Rakuden', '#bf0000', '#7a0000'], bank: ['MUFJ', '#d6000f', '#8f000a'], delivery: ['Yamaton', '#ffcc00', '#1c1c1c'], gov: ['e‑Tax JP', '#2b5797', '#1a3a66'], jobs: ['Baito+', '#00a0e9', '#006fa3'], auction: ['Yahu! Oku', '#ff0033', '#b30024'] },
    cities: [
      { id: 'tyo', name: ['Токио', 'Токіо', 'Tokyo'], lat: 35.68, lon: 139.69, idx: 1.0, size: 3 },
      { id: 'osa', name: ['Осака', 'Осака', 'Osaka'], lat: 34.69, lon: 135.5, idx: 0.97, size: 2 },
    ] },
  { id: 'CN', name: ['Китай', 'Китай', 'China'], flag: '🇨🇳', cur: 'CNY', lang: 'en', names: 'zh', land: 'eu',
    tax: 0.2, price: 0.82, rent: 0.8, wage: 1.0, fake: 0.32, customs: 0.1, plate: 'cn', phone: '+86',
    demand: { electronics: 0.78, phones: 0.82, clothing: 0.8, consoles: 0.9, toys: 0.85, cars: 0.9, watches: 1.1, bags: 1.1 },
    apps: { classifieds: ['Xianyou', '#ffe60f', '#d6ba00'], marketplace: ['TaoBuy', '#ff5000', '#c23d00'], bank: ['AliPey', '#1677ff', '#0b4fc2'], delivery: ['SF Expres', '#111111', '#d40000'], gov: ['TaxCN', '#c8102e', '#8a0b20'], jobs: ['BossJob', '#00bebd', '#008a89'], auction: ['Paipai', '#e60012', '#a3000d'] },
    cities: [
      { id: 'szx', name: ['Шэньчжэнь', 'Шеньчжень', 'Shenzhen'], lat: 22.54, lon: 114.06, idx: 0.8, size: 3 },
      { id: 'sha', name: ['Шанхай', 'Шанхай', 'Shanghai'], lat: 31.23, lon: 121.47, idx: 0.9, size: 3 },
    ] },
  { id: 'AE', name: ['ОАЭ', 'ОАЕ', 'UAE'], flag: '🇦🇪', cur: 'AED', lang: 'en', names: 'ar', land: 'eu',
    tax: 0.0, price: 1.1, rent: 2.0, wage: 2.4, fake: 0.1, customs: 0.05, plate: 'ae', phone: '+971',
    demand: { watches: 1.25, bags: 1.2, cars: 1.18, jewelry: 1.12, perfume: 1.15, phones: 1.05, art: 1.05 },
    apps: { classifieds: ['Dubizzy', '#e21c21', '#a01014'], marketplace: ['Nuun', '#feee00', '#d1c300'], bank: ['Emirat Bank', '#0b2e59', '#061b36'], delivery: ['Aramix', '#e40000', '#a30000'], gov: ['Tamm+', '#00843d', '#005a2a'], jobs: ['Bayyt', '#00a6e6', '#0075a3'], auction: ['Mazad', '#c9a227', '#8f7019'] },
    cities: [{ id: 'dxb', name: ['Дубай', 'Дубай', 'Dubai'], lat: 25.2, lon: 55.27, idx: 1.15, size: 3 }] },
  { id: 'TR', name: ['Турция', 'Туреччина', 'Türkiye'], flag: '🇹🇷', cur: 'TRY', lang: 'en', names: 'tr', land: 'eu',
    tax: 0.15, price: 0.85, rent: 0.7, wage: 0.8, fake: 0.3, customs: 0.15, plate: 'eu', phone: '+90',
    demand: { jewelry: 0.85, clothing: 0.78, bags: 0.95, phones: 1.15, electronics: 1.12, cars: 1.2 },
    apps: { classifieds: ['Sahibim', '#ffe800', '#c9b700'], marketplace: ['Trendiyol', '#f27a1a', '#c25c0c'], bank: ['Ziraatt', '#e30a17', '#a50710'], delivery: ['YurtKargo', '#0057b8', '#003a7a'], gov: ['e‑Devlet+', '#c8102e', '#8a0b20'], jobs: ['Kariyerim', '#8a2be2', '#5d1a9c'], auction: ['Letsgo', '#ff3f55', '#c22038'] },
    cities: [{ id: 'ist', name: ['Стамбул', 'Стамбул', 'Istanbul'], lat: 41.0, lon: 28.97, idx: 0.9, size: 3 }] },
  { id: 'GE', name: ['Грузия', 'Грузія', 'Georgia'], flag: '🇬🇪', cur: 'GEL', lang: 'ru', names: 'ka', land: 'eu',
    tax: 0.01, price: 0.9, rent: 0.7, wage: 0.7, fake: 0.15, customs: 0.05, plate: 'eu', phone: '+995',
    demand: { cars: 0.86, phones: 1.05, wine: 1 },
    apps: { classifieds: ['MyBazar', '#ff7a00', '#c45c00'], marketplace: ['Velo.ge', '#00b6f0', '#0081ab'], bank: ['TBS Bank', '#00aeef', '#0078a6'], delivery: ['GeoPost', '#e30613', '#a1040d'], gov: ['Mof.ge', '#cf142b', '#8f0d1d'], jobs: ['Jobs.ge', '#3b5998', '#263d6b'], auction: ['Lot.ge', '#ffb000', '#d68000'] },
    cities: [{ id: 'tbs', name: ['Тбилиси', 'Тбілісі', 'Tbilisi'], lat: 41.72, lon: 44.79, idx: 0.88, size: 2 }] },
  { id: 'TH', name: ['Таиланд', 'Таїланд', 'Thailand'], flag: '🇹🇭', cur: 'THB', lang: 'en', names: 'th', land: 'eu',
    tax: 0.1, price: 0.85, rent: 0.6, wage: 0.7, fake: 0.3, customs: 0.2, plate: 'eu', phone: '+66',
    demand: { clothing: 0.8, watches: 0.95, bikes: 1.1, phones: 1.0 },
    apps: { classifieds: ['Kaidii', '#2ab24b', '#178033'], marketplace: ['Shopie', '#ee4d2d', '#b8381c'], bank: ['K‑Bang', '#138f2d', '#0b5e1d'], delivery: ['Kerri', '#f37021', '#b8500f'], gov: ['RD Tax', '#2d2a7a', '#1b194d'], jobs: ['JobThai+', '#e31e24', '#a31318'], auction: ['ThaiLot', '#ffb000', '#d68000'] },
    cities: [{ id: 'bkk', name: ['Бангкок', 'Бангкок', 'Bangkok'], lat: 13.75, lon: 100.5, idx: 0.85, size: 3 }] },
];

export const COUNTRY = Object.fromEntries(COUNTRIES.map((c) => [c.id, c]));
export const CITIES = [];
for (const c of COUNTRIES) for (const city of c.cities) { city.country = c.id; CITIES.push(city); }
export const CITY = Object.fromEntries(CITIES.map((c) => [c.id, c]));
export const countryOf = (cityId) => COUNTRY[CITY[cityId]?.country] || COUNTRIES[0];
export const defaultCity = (countryId) => COUNTRY[countryId]?.cities[0]?.id || 'msk';

export function distanceKm(a, b) {
  const A = CITY[a], B = CITY[b];
  if (!A || !B || a === b) return 0;
  const R = 6371, toR = Math.PI / 180;
  const dLat = (B.lat - A.lat) * toR, dLon = (B.lon - A.lon) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(A.lat * toR) * Math.cos(B.lat * toR) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
// land groups that can be reached by ground transport
export const sameLand = (a, b) => countryOf(a).land === countryOf(b).land;

// Transport options between two cities (times in game minutes = real seconds).
export function routes(from, to, hasCar) {
  const km = distanceKm(from, to);
  const cross = countryOf(from).id !== countryOf(to).id;
  const fee = cross ? 25 : 0;
  const out = [];
  if (km > 250) out.push({ mode: 'plane', price: 50 + km * 0.015 + fee, time: Math.round(45 + km / 62) });
  if (sameLand(from, to)) {
    if (km < 9000) out.push({ mode: 'train', price: 15 + km * 0.008 + fee, time: Math.round(10 + km / 15.6) });
    if (km < 3500) out.push({ mode: 'bus', price: 8 + km * 0.005 + fee, time: Math.round(15 + km / 11) });
    if (hasCar && km < 6000) out.push({ mode: 'car', price: km * 0.009 + fee, time: Math.round(10 + km / 13) });
  }
  return out;
}
export const MODES = {
  plane: ['Самолёт', 'Літак', 'Plane', '✈️'],
  train: ['Поезд', 'Потяг', 'Train', '🚆'],
  bus: ['Автобус', 'Автобус', 'Bus', '🚌'],
  car: ['На своей машине', 'Своїм авто', 'Own car', '🚗'],
};

// Name pools for NPCs, by naming group
export const NAMES = {
  ru: { m: ['Игорь', 'Максим', 'Вадим', 'Артём', 'Денис', 'Сергей', 'Олег', 'Никита', 'Руслан', 'Тимур', 'Андрей', 'Павел', 'Егор', 'Кирилл', 'Дмитрий', 'Алексей', 'Роман', 'Илья', 'Стас', 'Гоша', 'Валера', 'Михаил', 'Юрий', 'Анатолий', 'Виктор', 'Константин'], f: ['Анна', 'Мария', 'Ольга', 'Наталья', 'Екатерина', 'Дарья', 'Алина', 'Ксения', 'Полина', 'Виктория', 'Светлана', 'Ирина', 'Елена', 'Юлия', 'Татьяна', 'Галина Петровна', 'Людмила'] },
  uk: { m: ['Андрій', 'Олександр', 'Тарас', 'Богдан', 'Дмитро', 'Максим', 'Ярослав', 'Остап', 'Володимир', 'Микола', 'Віталій', 'Сергій', 'Іван', 'Роман', 'Назар', 'Петро', 'Юрій', 'Василь'], f: ['Олена', 'Оксана', 'Ірина', 'Наталія', 'Марія', 'Софія', 'Катерина', 'Юлія', 'Анастасія', 'Христина', 'Леся', 'Галина', 'Тетяна', 'Дарина'] },
  kk: { m: ['Нурлан', 'Ерлан', 'Арман', 'Данияр', 'Асхат', 'Айдар', 'Максат', 'Тимур', 'Руслан', 'Дмитрий'], f: ['Айгерим', 'Динара', 'Асель', 'Жанна', 'Алия', 'Камила', 'Мадина', 'Ольга'] },
  pl: { m: ['Piotr', 'Krzysztof', 'Tomasz', 'Paweł', 'Michał', 'Jakub', 'Marcin', 'Kamil', 'Łukasz'], f: ['Anna', 'Katarzyna', 'Magdalena', 'Agnieszka', 'Joanna', 'Zuzanna', 'Ola'] },
  de: { m: ['Lukas', 'Jonas', 'Felix', 'Maximilian', 'Paul', 'Tobias', 'Stefan', 'Jürgen', 'Klaus', 'Florian'], f: ['Anna', 'Lena', 'Sophie', 'Laura', 'Mia', 'Hannah', 'Petra', 'Sabine'] },
  fr: { m: ['Lucas', 'Hugo', 'Louis', 'Jules', 'Antoine', 'Pierre', 'Mathis', 'Théo', 'Julien'], f: ['Camille', 'Chloé', 'Léa', 'Manon', 'Inès', 'Juliette', 'Margaux', 'Sophie'] },
  it: { m: ['Marco', 'Luca', 'Giuseppe', 'Matteo', 'Alessandro', 'Lorenzo', 'Davide', 'Francesco'], f: ['Giulia', 'Sofia', 'Chiara', 'Francesca', 'Martina', 'Alessia', 'Valentina'] },
  en: { m: ['James', 'John', 'Mike', 'Chris', 'Tyler', 'Jake', 'Ryan', 'Kevin', 'Brandon', 'Daniel', 'Tom', 'Josh', 'Marcus', 'Ethan'], f: ['Emily', 'Jessica', 'Ashley', 'Sarah', 'Olivia', 'Emma', 'Megan', 'Hannah', 'Chloe', 'Grace'] },
  ja: { m: ['Haruto', 'Yuto', 'Sota', 'Ren', 'Kenji', 'Takeshi', 'Hiroshi', 'Daiki', 'Kaito'], f: ['Yui', 'Sakura', 'Hina', 'Aoi', 'Mei', 'Yuna', 'Rin', 'Akari'] },
  zh: { m: ['Wei', 'Hao', 'Jun', 'Lei', 'Ming', 'Tao', 'Chen', 'Yang', 'Bo'], f: ['Li Na', 'Xiu', 'Mei', 'Ying', 'Jing', 'Fang', 'Lan'] },
  ar: { m: ['Ahmed', 'Mohammed', 'Omar', 'Khalid', 'Yousef', 'Hamdan', 'Saeed', 'Rashid', 'Ali'], f: ['Fatima', 'Aisha', 'Mariam', 'Noor', 'Layla', 'Sara'] },
  tr: { m: ['Mehmet', 'Mustafa', 'Ahmet', 'Emre', 'Burak', 'Can', 'Murat', 'Kerem'], f: ['Ayşe', 'Elif', 'Zeynep', 'Fatma', 'Merve', 'Selin'] },
  ka: { m: ['Giorgi', 'Levan', 'Nika', 'Davit', 'Irakli', 'Luka', 'Zurab'], f: ['Nino', 'Mariam', 'Ana', 'Tamar', 'Salome', 'Eka'] },
  th: { m: ['Somchai', 'Anan', 'Krit', 'Niran', 'Prasert', 'Chai'], f: ['Malee', 'Siriporn', 'Nok', 'Pim', 'Ploy', 'Fah'] },
};
