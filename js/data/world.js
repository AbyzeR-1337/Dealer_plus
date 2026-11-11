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

// more cities for every country: [id, ru, uk, en, lat, lon, price index, size]
const MORE_CITIES = {
  RU: [['nnv', 'Нижний Новгород', 'Нижній Новгород', 'Nizhny Novgorod', 56.33, 44.0, 0.93, 2], ['sam', 'Самара', 'Самара', 'Samara', 53.2, 50.15, 0.92, 2], ['oms', 'Омск', 'Омськ', 'Omsk', 54.99, 73.37, 0.88, 2], ['chel', 'Челябинск', 'Челябінськ', 'Chelyabinsk', 55.16, 61.4, 0.9, 2], ['rnd', 'Ростов‑на‑Дону', 'Ростов‑на‑Дону', 'Rostov‑on‑Don', 47.23, 39.72, 0.93, 2], ['ufa', 'Уфа', 'Уфа', 'Ufa', 54.74, 55.97, 0.9, 2], ['kja', 'Красноярск', 'Красноярськ', 'Krasnoyarsk', 56.01, 92.85, 0.94, 2], ['perm', 'Пермь', 'Перм', 'Perm', 58.01, 56.23, 0.89, 2], ['vrn', 'Воронеж', 'Воронеж', 'Voronezh', 51.67, 39.18, 0.88, 2], ['vog', 'Волгоград', 'Волгоград', 'Volgograd', 48.71, 44.51, 0.86, 2], ['krr', 'Краснодар', 'Краснодар', 'Krasnodar', 45.04, 38.98, 0.97, 2], ['rtw', 'Саратов', 'Саратов', 'Saratov', 51.53, 46.03, 0.84, 1], ['tjm', 'Тюмень', 'Тюмень', 'Tyumen', 57.15, 65.53, 0.96, 1], ['tlt', 'Тольятти', 'Тольятті', 'Tolyatti', 53.51, 49.42, 0.84, 1], ['ijk', 'Ижевск', 'Іжевськ', 'Izhevsk', 56.85, 53.2, 0.84, 1], ['bax', 'Барнаул', 'Барнаул', 'Barnaul', 53.35, 83.77, 0.82, 1], ['ikt', 'Иркутск', 'Іркутськ', 'Irkutsk', 52.29, 104.28, 0.92, 1], ['khv', 'Хабаровск', 'Хабаровськ', 'Khabarovsk', 48.48, 135.08, 1.0, 1], ['iar', 'Ярославль', 'Ярославль', 'Yaroslavl', 57.63, 39.87, 0.88, 1], ['tof', 'Томск', 'Томськ', 'Tomsk', 56.48, 84.95, 0.87, 1], ['ren', 'Оренбург', 'Оренбург', 'Orenburg', 51.77, 55.1, 0.83, 1], ['kej', 'Кемерово', 'Кемерово', 'Kemerovo', 55.35, 86.09, 0.84, 1], ['kgd', 'Калининград', 'Калінінград', 'Kaliningrad', 54.71, 20.51, 0.95, 1], ['mmk', 'Мурманск', 'Мурманськ', 'Murmansk', 68.97, 33.08, 1.02, 1], ['yks', 'Якутск', 'Якутськ', 'Yakutsk', 62.03, 129.73, 1.1, 1], ['arh', 'Архангельск', 'Архангельськ', 'Arkhangelsk', 64.54, 40.54, 0.94, 1], ['tula', 'Тула', 'Тула', 'Tula', 54.19, 37.62, 0.86, 1], ['ryz', 'Рязань', 'Рязань', 'Ryazan', 54.63, 39.74, 0.85, 1], ['ast', 'Астрахань', 'Астрахань', 'Astrakhan', 46.35, 48.04, 0.82, 1], ['penz', 'Пенза', 'Пенза', 'Penza', 53.2, 45.0, 0.81, 1]],
  UA: [['zp', 'Запорожье', 'Запоріжжя', 'Zaporizhzhia', 47.84, 35.14, 0.88, 2], ['kr', 'Кривой Рог', 'Кривий Ріг', 'Kryvyi Rih', 47.91, 33.39, 0.84, 1], ['mk', 'Николаев', 'Миколаїв', 'Mykolaiv', 46.98, 31.99, 0.85, 1], ['vn', 'Винница', 'Вінниця', 'Vinnytsia', 49.23, 28.47, 0.9, 1], ['pl', 'Полтава', 'Полтава', 'Poltava', 49.59, 34.55, 0.87, 1], ['cn', 'Чернигов', 'Чернігів', 'Chernihiv', 51.49, 31.29, 0.85, 1], ['ck', 'Черкассы', 'Черкаси', 'Cherkasy', 49.44, 32.06, 0.86, 1], ['zt', 'Житомир', 'Житомир', 'Zhytomyr', 50.25, 28.66, 0.85, 1], ['sm', 'Сумы', 'Суми', 'Sumy', 50.91, 34.8, 0.84, 1], ['km', 'Хмельницкий', 'Хмельницький', 'Khmelnytskyi', 49.42, 26.99, 0.86, 1], ['cv', 'Черновцы', 'Чернівці', 'Chernivtsi', 48.29, 25.94, 0.88, 1], ['rv', 'Ровно', 'Рівне', 'Rivne', 50.62, 26.25, 0.86, 1], ['if', 'Ивано‑Франковск', 'Івано‑Франківськ', 'Ivano‑Frankivsk', 48.92, 24.71, 0.92, 1], ['kropy', 'Кропивницкий', 'Кропивницький', 'Kropyvnytskyi', 48.51, 32.26, 0.83, 1], ['te', 'Тернополь', 'Тернопіль', 'Ternopil', 49.55, 25.59, 0.86, 1], ['lt', 'Луцк', 'Луцьк', 'Lutsk', 50.75, 25.34, 0.86, 1], ['uz', 'Ужгород', 'Ужгород', 'Uzhhorod', 48.62, 22.29, 0.9, 1], ['bc', 'Белая Церковь', 'Біла Церква', 'Bila Tserkva', 49.8, 30.12, 0.86, 1], ['kremen', 'Кременчуг', 'Кременчук', 'Kremenchuk', 49.07, 33.42, 0.84, 1], ['muk', 'Мукачево', 'Мукачево', 'Mukachevo', 48.44, 22.72, 0.85, 1], ['kamp', 'Каменец‑Подольский', 'Камʼянець‑Подільський', 'Kamianets‑Podilskyi', 48.68, 26.58, 0.84, 1], ['bukovel', 'Буковель', 'Буковель', 'Bukovel', 48.36, 24.4, 1.15, 1]],
  BY: [['gomel', 'Гомель', 'Гомель', 'Gomel', 52.44, 30.99, 0.85, 2], ['mogilev', 'Могилёв', 'Могильов', 'Mogilev', 53.9, 30.33, 0.83, 1], ['vitebsk', 'Витебск', 'Вітебськ', 'Vitebsk', 55.19, 30.2, 0.83, 1], ['grodno', 'Гродно', 'Гродно', 'Grodno', 53.68, 23.83, 0.86, 1], ['brest', 'Брест', 'Брест', 'Brest', 52.1, 23.69, 0.87, 1], ['bobr', 'Бобруйск', 'Бобруйськ', 'Babruysk', 53.14, 29.23, 0.8, 1], ['baran', 'Барановичи', 'Барановичі', 'Baranovichi', 53.13, 26.01, 0.8, 1], ['borisov', 'Борисов', 'Борисов', 'Barysaw', 54.23, 28.5, 0.8, 1], ['pinsk', 'Пинск', 'Пінськ', 'Pinsk', 52.11, 26.1, 0.79, 1]],
  KZ: [['shym', 'Шымкент', 'Шимкент', 'Shymkent', 42.34, 69.6, 0.86, 2], ['krg', 'Караганда', 'Караганда', 'Karaganda', 49.8, 73.1, 0.88, 2], ['aktobe', 'Актобе', 'Актобе', 'Aktobe', 50.28, 57.17, 0.87, 1], ['taraz', 'Тараз', 'Тараз', 'Taraz', 42.9, 71.37, 0.82, 1], ['pvl', 'Павлодар', 'Павлодар', 'Pavlodar', 52.29, 76.97, 0.86, 1], ['ukk', 'Усть‑Каменогорск', 'Усть‑Каменогорськ', 'Oskemen', 49.95, 82.61, 0.87, 1], ['semey', 'Семей', 'Семей', 'Semey', 50.41, 80.23, 0.83, 1], ['atyrau', 'Атырау', 'Атирау', 'Atyrau', 47.11, 51.92, 0.98, 1], ['kst', 'Костанай', 'Костанай', 'Kostanay', 53.21, 63.62, 0.85, 1], ['kzo', 'Кызылорда', 'Кизилорда', 'Kyzylorda', 44.85, 65.51, 0.82, 1], ['ural', 'Уральск', 'Уральськ', 'Oral', 51.23, 51.37, 0.86, 1], ['aktau', 'Актау', 'Актау', 'Aktau', 43.65, 51.17, 0.97, 1], ['ppk', 'Петропавловск', 'Петропавловськ', 'Petropavl', 54.87, 69.15, 0.84, 1], ['turk', 'Туркестан', 'Туркестан', 'Turkistan', 43.3, 68.27, 0.8, 1]],
  PL: [['lodz', 'Лодзь', 'Лодзь', 'Łódź', 51.76, 19.46, 0.93, 2], ['wro', 'Вроцлав', 'Вроцлав', 'Wrocław', 51.11, 17.03, 0.98, 2], ['poz', 'Познань', 'Познань', 'Poznań', 52.41, 16.93, 0.97, 2], ['gdn', 'Гданьск', 'Гданськ', 'Gdańsk', 54.35, 18.65, 0.99, 2], ['szz', 'Щецин', 'Щецин', 'Szczecin', 53.43, 14.55, 0.92, 1], ['byd', 'Быдгощ', 'Бидгощ', 'Bydgoszcz', 53.12, 18.0, 0.9, 1], ['lub', 'Люблин', 'Люблін', 'Lublin', 51.25, 22.57, 0.9, 1], ['bia', 'Белосток', 'Білосток', 'Białystok', 53.13, 23.16, 0.89, 1], ['ktw', 'Катовице', 'Катовіце', 'Katowice', 50.26, 19.02, 0.94, 1], ['gdy', 'Гдыня', 'Гдиня', 'Gdynia', 54.52, 18.53, 0.97, 1], ['cze', 'Ченстохова', 'Ченстохова', 'Częstochowa', 50.81, 19.12, 0.88, 1], ['rze', 'Жешув', 'Жешув', 'Rzeszów', 50.04, 22.0, 0.89, 1], ['tor', 'Торунь', 'Торунь', 'Toruń', 53.01, 18.6, 0.9, 1], ['zak', 'Закопане', 'Закопане', 'Zakopane', 49.3, 19.95, 1.05, 1]],
  DE: [['ham', 'Гамбург', 'Гамбург', 'Hamburg', 53.55, 9.99, 1.05, 3], ['cgn', 'Кёльн', 'Кельн', 'Cologne', 50.94, 6.96, 1.02, 2], ['fra', 'Франкфурт', 'Франкфурт', 'Frankfurt', 50.11, 8.68, 1.06, 2], ['str', 'Штутгарт', 'Штутгарт', 'Stuttgart', 48.78, 9.18, 1.05, 2], ['dus', 'Дюссельдорф', 'Дюссельдорф', 'Düsseldorf', 51.23, 6.78, 1.04, 2], ['lej', 'Лейпциг', 'Лейпциг', 'Leipzig', 51.34, 12.37, 0.94, 2], ['dtm', 'Дортмунд', 'Дортмунд', 'Dortmund', 51.51, 7.47, 0.96, 1], ['ess', 'Эссен', 'Ессен', 'Essen', 51.46, 7.01, 0.96, 1], ['bre', 'Бремен', 'Бремен', 'Bremen', 53.08, 8.8, 0.97, 1], ['drs', 'Дрезден', 'Дрезден', 'Dresden', 51.05, 13.74, 0.95, 1], ['haj', 'Ганновер', 'Ганновер', 'Hanover', 52.38, 9.73, 0.97, 1], ['nue', 'Нюрнберг', 'Нюрнберг', 'Nuremberg', 49.45, 11.08, 0.99, 1], ['bonn', 'Бонн', 'Бонн', 'Bonn', 50.74, 7.1, 0.99, 1]],
  FR: [['mrs', 'Марсель', 'Марсель', 'Marseille', 43.3, 5.37, 0.97, 2], ['lys', 'Лион', 'Ліон', 'Lyon', 45.76, 4.84, 1.0, 2], ['tls', 'Тулуза', 'Тулуза', 'Toulouse', 43.6, 1.44, 0.96, 2], ['nce', 'Ницца', 'Ніцца', 'Nice', 43.7, 7.27, 1.08, 2], ['nte', 'Нант', 'Нант', 'Nantes', 47.22, -1.55, 0.95, 1], ['sxb', 'Страсбург', 'Страсбург', 'Strasbourg', 48.57, 7.75, 0.97, 1], ['mpl', 'Монпелье', 'Монпельє', 'Montpellier', 43.61, 3.88, 0.95, 1], ['bod', 'Бордо', 'Бордо', 'Bordeaux', 44.84, -0.58, 0.99, 1], ['lil', 'Лилль', 'Лілль', 'Lille', 50.63, 3.06, 0.94, 1], ['rns', 'Ренн', 'Ренн', 'Rennes', 48.11, -1.68, 0.94, 1], ['rhe', 'Реймс', 'Реймс', 'Reims', 49.26, 4.03, 0.93, 1], ['cannes', 'Канны', 'Канни', 'Cannes', 43.55, 7.01, 1.15, 1]],
  IT: [['rom', 'Рим', 'Рим', 'Rome', 41.9, 12.5, 1.04, 3], ['nap', 'Неаполь', 'Неаполь', 'Naples', 40.85, 14.27, 0.92, 2], ['trn', 'Турин', 'Турин', 'Turin', 45.07, 7.69, 0.98, 2], ['pmo', 'Палермо', 'Палермо', 'Palermo', 38.12, 13.36, 0.88, 1], ['goa', 'Генуя', 'Генуя', 'Genoa', 44.41, 8.93, 0.96, 1], ['blq', 'Болонья', 'Болонья', 'Bologna', 44.49, 11.34, 1.0, 1], ['flr', 'Флоренция', 'Флоренція', 'Florence', 43.77, 11.26, 1.04, 1], ['bri', 'Бари', 'Барі', 'Bari', 41.12, 16.87, 0.9, 1], ['vce', 'Венеция', 'Венеція', 'Venice', 45.44, 12.32, 1.1, 1], ['vrn_it', 'Верона', 'Верона', 'Verona', 45.44, 10.99, 1.0, 1]],
  GB: [['bhx', 'Бирмингем', 'Бірмінгем', 'Birmingham', 52.49, -1.89, 0.98, 2], ['man', 'Манчестер', 'Манчестер', 'Manchester', 53.48, -2.24, 1.0, 2], ['gla', 'Глазго', 'Глазго', 'Glasgow', 55.86, -4.25, 0.96, 2], ['lpl', 'Ливерпуль', 'Ліверпуль', 'Liverpool', 53.41, -2.98, 0.95, 2], ['lba', 'Лидс', 'Лідс', 'Leeds', 53.8, -1.55, 0.96, 1], ['edi', 'Эдинбург', 'Единбург', 'Edinburgh', 55.95, -3.19, 1.03, 1], ['brs', 'Бристоль', 'Бристоль', 'Bristol', 51.45, -2.59, 1.02, 1], ['shf', 'Шеффилд', 'Шеффілд', 'Sheffield', 53.38, -1.47, 0.94, 1], ['ncl', 'Ньюкасл', 'Ньюкасл', 'Newcastle', 54.98, -1.61, 0.94, 1], ['cwl', 'Кардифф', 'Кардіфф', 'Cardiff', 51.48, -3.18, 0.95, 1], ['bfs', 'Белфаст', 'Белфаст', 'Belfast', 54.6, -5.93, 0.93, 1], ['oxf', 'Оксфорд', 'Оксфорд', 'Oxford', 51.75, -1.26, 1.08, 1]],
  US: [['chi', 'Чикаго', 'Чикаго', 'Chicago', 41.88, -87.63, 1.04, 3], ['hou', 'Хьюстон', 'Г’юстон', 'Houston', 29.76, -95.37, 0.98, 3], ['phx', 'Финикс', 'Фінікс', 'Phoenix', 33.45, -112.07, 0.97, 2], ['phl', 'Филадельфия', 'Філадельфія', 'Philadelphia', 39.95, -75.17, 1.01, 2], ['sat', 'Сан‑Антонио', 'Сан‑Антоніо', 'San Antonio', 29.42, -98.49, 0.94, 2], ['san', 'Сан‑Диего', 'Сан‑Дієго', 'San Diego', 32.72, -117.16, 1.06, 2], ['dfw', 'Даллас', 'Даллас', 'Dallas', 32.78, -96.8, 1.0, 2], ['sjc', 'Сан‑Хосе', 'Сан‑Хосе', 'San Jose', 37.34, -121.89, 1.12, 2], ['aus', 'Остин', 'Остін', 'Austin', 30.27, -97.74, 1.03, 2], ['sea', 'Сиэтл', 'Сіетл', 'Seattle', 47.61, -122.33, 1.08, 2], ['den', 'Денвер', 'Денвер', 'Denver', 39.74, -104.99, 1.03, 2], ['bos', 'Бостон', 'Бостон', 'Boston', 42.36, -71.06, 1.09, 2], ['las', 'Лас‑Вегас', 'Лас‑Вегас', 'Las Vegas', 36.17, -115.14, 1.0, 2], ['atl', 'Атланта', 'Атланта', 'Atlanta', 33.75, -84.39, 1.0, 2], ['sfo', 'Сан‑Франциско', 'Сан‑Франциско', 'San Francisco', 37.77, -122.42, 1.15, 2], ['dtw', 'Детройт', 'Детройт', 'Detroit', 42.33, -83.05, 0.92, 1], ['pdx', 'Портленд', 'Портленд', 'Portland', 45.52, -122.68, 1.03, 1], ['bna', 'Нэшвилл', 'Нешвілл', 'Nashville', 36.16, -86.78, 0.99, 1], ['msy', 'Новый Орлеан', 'Новий Орлеан', 'New Orleans', 29.95, -90.07, 0.96, 1], ['hnl', 'Гонолулу', 'Гонолулу', 'Honolulu', 21.31, -157.86, 1.18, 1], ['anc', 'Анкоридж', 'Анкоридж', 'Anchorage', 61.22, -149.9, 1.1, 1]],
  JP: [['yok', 'Иокогама', 'Йокогама', 'Yokohama', 35.44, 139.64, 1.0, 2], ['ngo', 'Нагоя', 'Нагоя', 'Nagoya', 35.18, 136.91, 0.97, 2], ['spk', 'Саппоро', 'Саппоро', 'Sapporo', 43.06, 141.35, 0.95, 2], ['fuk', 'Фукуока', 'Фукуока', 'Fukuoka', 33.59, 130.4, 0.95, 2], ['ukb', 'Кобе', 'Кобе', 'Kobe', 34.69, 135.2, 0.97, 1], ['kyo', 'Киото', 'Кіото', 'Kyoto', 35.01, 135.77, 1.02, 1], ['kwj', 'Кавасаки', 'Кавасакі', 'Kawasaki', 35.53, 139.7, 0.99, 1], ['hij', 'Хиросима', 'Хіросіма', 'Hiroshima', 34.39, 132.46, 0.94, 1], ['sdj', 'Сендай', 'Сендай', 'Sendai', 38.27, 140.87, 0.94, 1], ['oka', 'Наха', 'Наха', 'Naha', 26.21, 127.68, 0.96, 1]],
  CN: [['pek', 'Пекин', 'Пекін', 'Beijing', 39.9, 116.4, 0.92, 3], ['can', 'Гуанчжоу', 'Гуанчжоу', 'Guangzhou', 23.13, 113.26, 0.84, 3], ['ctu', 'Чэнду', 'Ченду', 'Chengdu', 30.57, 104.07, 0.8, 2], ['ckg', 'Чунцин', 'Чунцін', 'Chongqing', 29.56, 106.55, 0.78, 2], ['wuh', 'Ухань', 'Ухань', 'Wuhan', 30.59, 114.31, 0.8, 2], ['hgh', 'Ханчжоу', 'Ханчжоу', 'Hangzhou', 30.27, 120.16, 0.88, 2], ['xiy', 'Сиань', 'Сіань', 'Xi’an', 34.34, 108.94, 0.78, 2], ['nkg', 'Нанкин', 'Нанкін', 'Nanjing', 32.06, 118.8, 0.84, 2], ['tsn', 'Тяньцзинь', 'Тяньцзінь', 'Tianjin', 39.34, 117.36, 0.83, 2], ['hkg', 'Гонконг', 'Гонконг', 'Hong Kong', 22.32, 114.17, 1.12, 3], ['yiw', 'Иу', 'Іу', 'Yiwu', 29.31, 120.08, 0.72, 1], ['sya', 'Санья', 'Санья', 'Sanya', 18.25, 109.51, 0.95, 1]],
  AE: [['auh', 'Абу‑Даби', 'Абу‑Дабі', 'Abu Dhabi', 24.45, 54.38, 1.12, 2], ['shj', 'Шарджа', 'Шарджа', 'Sharjah', 25.35, 55.42, 0.98, 2], ['aan', 'Эль‑Айн', 'Ель‑Айн', 'Al Ain', 24.21, 55.75, 0.95, 1], ['ajm', 'Аджман', 'Аджман', 'Ajman', 25.41, 55.51, 0.93, 1], ['rkt', 'Рас‑эль‑Хайма', 'Рас‑ель‑Хайма', 'Ras Al Khaimah', 25.79, 55.94, 0.96, 1], ['fjr', 'Фуджейра', 'Фуджейра', 'Fujairah', 25.12, 56.33, 0.94, 1]],
  TR: [['ank', 'Анкара', 'Анкара', 'Ankara', 39.93, 32.86, 0.86, 2], ['izm', 'Измир', 'Ізмір', 'İzmir', 38.42, 27.14, 0.88, 2], ['bur', 'Бурса', 'Бурса', 'Bursa', 40.19, 29.06, 0.84, 2], ['ayt', 'Анталья', 'Анталія', 'Antalya', 36.9, 30.7, 0.92, 2], ['ada', 'Адана', 'Адана', 'Adana', 37.0, 35.32, 0.8, 1], ['kya', 'Конья', 'Конья', 'Konya', 37.87, 32.48, 0.79, 1], ['gzt', 'Газиантеп', 'Газіантеп', 'Gaziantep', 37.07, 37.38, 0.78, 1], ['mer', 'Мерсин', 'Мерсін', 'Mersin', 36.81, 34.64, 0.8, 1], ['asr', 'Кайсери', 'Кайсері', 'Kayseri', 38.73, 35.48, 0.78, 1], ['tzx', 'Трабзон', 'Трабзон', 'Trabzon', 41.0, 39.72, 0.82, 1], ['bjv', 'Бодрум', 'Бодрум', 'Bodrum', 37.03, 27.43, 1.0, 1]],
  GE: [['batumi', 'Батуми', 'Батумі', 'Batumi', 41.64, 41.64, 0.92, 2], ['kut', 'Кутаиси', 'Кутаїсі', 'Kutaisi', 42.27, 42.7, 0.8, 1], ['rus', 'Рустави', 'Руставі', 'Rustavi', 41.55, 45.0, 0.8, 1], ['zug', 'Зугдиди', 'Зугдіді', 'Zugdidi', 42.51, 41.87, 0.76, 1], ['gori', 'Гори', 'Горі', 'Gori', 41.98, 44.11, 0.76, 1], ['poti', 'Поти', 'Поті', 'Poti', 42.15, 41.67, 0.78, 1], ['telavi', 'Телави', 'Телаві', 'Telavi', 41.92, 45.47, 0.77, 1], ['gudauri', 'Гудаури', 'Гудаурі', 'Gudauri', 42.48, 44.48, 1.05, 1]],
  TH: [['cnx', 'Чиангмай', 'Чіангмай', 'Chiang Mai', 18.79, 98.98, 0.78, 2], ['hkt', 'Пхукет', 'Пхукет', 'Phuket', 7.88, 98.39, 0.98, 2], ['pyx', 'Паттайя', 'Паттайя', 'Pattaya', 12.93, 100.88, 0.92, 2], ['hdy', 'Хатъяй', 'Хатьяй', 'Hat Yai', 7.01, 100.47, 0.75, 1], ['nak', 'Накхонратчасима', 'Накхонратчасіма', 'Nakhon Ratchasima', 14.97, 102.1, 0.72, 1], ['uth', 'Удонтхани', 'Удонтхані', 'Udon Thani', 17.41, 102.79, 0.72, 1], ['kkc', 'Кхонкэн', 'Кхонкен', 'Khon Kaen', 16.44, 102.84, 0.73, 1], ['kbv', 'Краби', 'Крабі', 'Krabi', 8.09, 98.91, 0.9, 1], ['hhq', 'Хуахин', 'Хуахін', 'Hua Hin', 12.57, 99.96, 0.92, 1], ['usm', 'Самуи', 'Самуї', 'Koh Samui', 9.51, 100.06, 1.0, 1]],
};
for (const c of COUNTRIES) for (const [id, ru, uk, en, lat, lon, idx, size] of MORE_CITIES[c.id] || []) if (!c.cities.some((x) => x.id === id)) c.cities.push({ id, name: [ru, uk, en], lat, lon, idx, size });
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
