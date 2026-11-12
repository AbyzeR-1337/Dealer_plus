// Catalog core: categories, colours, defects, tests and the model registry.
// All brand names are fictional look-alikes.
import { buildTech } from './models_tech.js';
import { buildFashion } from './models_fashion.js';
import { buildCollect } from './models_collect.js';
import { buildVehicles } from './models_vehicles.js';
import { buildExtra } from './models_extra.js';
import { buildStorage } from './models_storage.js';
import { buildPC } from './models_pc.js';
import { buildNew } from './models_new.js';
import { buildLines } from './models_lines.js';

export const YEAR = 2026;

// valMode: 'dep' — price is retail at release and depreciates; 'fixed' — price is today's typical value
export const CATS = {
  phones:      { name: ['Телефоны', 'Телефони', 'Phones'], icon: '📱', color: '#4da3ff', size: 1, valMode: 'dep', dep: 0.22, floor: 0.05, fake: 0.04 },
  electronics: { name: ['Электроника', 'Електроніка', 'Electronics'], icon: '💻', color: '#22c7e8', size: 2, valMode: 'dep', dep: 0.17, floor: 0.06, fake: 0.03 },
  consoles:    { name: ['Приставки', 'Приставки', 'Consoles'], icon: '🎮', color: '#7b61ff', size: 2, valMode: 'dep', dep: 0.14, floor: 0.12, fake: 0.03 },
  accessories: { name: ['Аксессуары', 'Аксесуари', 'Accessories'], icon: '🎧', color: '#ff6ea8', size: 1, valMode: 'dep', dep: 0.2, floor: 0.12, fake: 0.16 },
  sneakers:    { name: ['Кроссовки', 'Кросівки', 'Sneakers'], icon: '👟', color: '#ff8a3d', size: 2, valMode: 'dep', dep: 0.05, floor: 0.4, fake: 0.2 },
  clothing:    { name: ['Одежда', 'Одяг', 'Clothing'], icon: '🧥', color: '#3ecf8e', size: 2, valMode: 'dep', dep: 0.1, floor: 0.22, fake: 0.16 },
  bags:        { name: ['Сумки', 'Сумки', 'Bags'], icon: '👜', color: '#d4a373', size: 2, valMode: 'fixed', fake: 0.22 },
  watches:     { name: ['Часы', 'Годинники', 'Watches'], icon: '⌚', color: '#c9a227', size: 1, valMode: 'fixed', fake: 0.16 },
  jewelry:     { name: ['Украшения', 'Прикраси', 'Jewelry'], icon: '💍', color: '#f2c94c', size: 1, valMode: 'fixed', fake: 0.12 },
  perfume:     { name: ['Парфюмерия', 'Парфуми', 'Perfume'], icon: '🧴', color: '#e879f9', size: 1, valMode: 'dep', dep: 0.03, floor: 0.5, fake: 0.18 },
  cards:       { name: ['Карточки', 'Картки', 'Trading cards'], icon: '🃏', color: '#ffcc33', size: 1, valMode: 'fixed', fake: 0.1 },
  comics:      { name: ['Комиксы', 'Комікси', 'Comics'], icon: '📚', color: '#ef4444', size: 1, valMode: 'fixed', fake: 0.04 },
  toys:        { name: ['LEGGO и фигурки', 'LEGGO і фігурки', 'Bricks & figures'], icon: '🧱', color: '#f59e0b', size: 2, valMode: 'fixed', fake: 0.1 },
  antiques:    { name: ['Антиквариат', 'Антикваріат', 'Antiques'], icon: '🏺', color: '#b08968', size: 3, valMode: 'fixed', fake: 0.2 },
  art:         { name: ['Искусство', 'Мистецтво', 'Art'], icon: '🖼️', color: '#a78bfa', size: 3, valMode: 'fixed', fake: 0.15 },
  collectibles:{ name: ['Коллекционное', 'Колекційне', 'Collectibles'], icon: '🪙', color: '#94a3b8', size: 1, valMode: 'fixed', fake: 0.12 },
  instruments: { name: ['Музыкальные инструменты', 'Музичні інструменти', 'Instruments'], icon: '🎸', color: '#fb7185', size: 4, valMode: 'dep', dep: 0.05, floor: 0.45, fake: 0.07 },
  cars:        { name: ['Авто', 'Авто', 'Cars'], icon: '🚗', color: '#60a5fa', size: 0, valMode: 'dep', dep: 0.11, floor: 0.06, fake: 0 },
  bikes:       { name: ['Мото и вело', 'Мото і вело', 'Bikes & moto'], icon: '🏍️', color: '#34d399', size: 0, valMode: 'dep', dep: 0.1, floor: 0.12, fake: 0.02 },
  gear:        { name: ['Снаряжение и сумки', 'Спорядження і сумки', 'Gear & luggage'], icon: '🎒', color: '#9a8a62', size: 2, valMode: 'dep', dep: 0.08, floor: 0.3, fake: 0.08 },
  pcparts:     { name: ['Комплектующие ПК', 'Комплектуючі ПК', 'PC parts'], icon: '🧩', color: '#f97316', size: 1, valMode: 'dep', dep: 0.12, floor: 0.25, fake: 0.03 },
  storage:     { name: ['Носители данных', 'Носії даних', 'Data storage'], icon: '💾', color: '#5eead4', size: 1, valMode: 'dep', dep: 0.1, floor: 0.2, fake: 0.06 },
  misc:        { name: ['Мелочи и находки', 'Дрібниці та знахідки', 'Odds & ends'], icon: '🔑', color: '#a3a3a3', size: 1, valMode: 'dep', dep: 0.04, floor: 0.4, fake: 0.03 },
};
export const CAT_LIST = Object.keys(CATS);
for (const id of CAT_LIST) CATS[id].id = id;
export const LUXURY_CATS = ['watches', 'bags', 'jewelry', 'art', 'antiques'];
export const VEHICLE_CATS = ['cars', 'bikes'];

// ------------------------------------------------------------------ colours
const C3 = (ru, uk, en, h) => ({ n: [ru, uk, en], h });
export const COLORS = {
  black: C3('Чёрный', 'Чорний', 'Black', '#1c1d21'), white: C3('Белый', 'Білий', 'White', '#f1f1ee'),
  silver: C3('Серебристый', 'Сріблястий', 'Silver', '#d8dadf'), spacegray: C3('Серый космос', 'Сірий космос', 'Space Gray', '#5c5e63'),
  gold: C3('Золотой', 'Золотий', 'Gold', '#e6cfa3'), rosegold: C3('Розовое золото', 'Рожеве золото', 'Rose Gold', '#eac4b8'),
  jetblack: C3('Чёрный оникс', 'Чорний онікс', 'Jet Black', '#0b0b0d'), red: C3('Красный', 'Червоний', 'Red', '#c4162a'),
  yellow: C3('Жёлтый', 'Жовтий', 'Yellow', '#f4d74a'), blue: C3('Синий', 'Синій', 'Blue', '#2f5c9a'), coral: C3('Коралловый', 'Кораловий', 'Coral', '#f47c6b'),
  green: C3('Зелёный', 'Зелений', 'Green', '#3f6b4f'), purple: C3('Фиолетовый', 'Фіолетовий', 'Purple', '#b9a7d9'),
  midnightgreen: C3('Тёмно‑зелёный', 'Темно‑зелений', 'Midnight Green', '#3a4a40'), graphite: C3('Графитовый', 'Графітовий', 'Graphite', '#53545a'),
  pacificblue: C3('Тихоокеанский синий', 'Тихоокеанський синій', 'Pacific Blue', '#2e4a63'), midnight: C3('Тёмная ночь', 'Темна ніч', 'Midnight', '#222830'),
  starlight: C3('Сияющая звезда', 'Сяйво зірки', 'Starlight', '#efe5d6'), pink: C3('Розовый', 'Рожевий', 'Pink', '#f3c3cf'),
  sierrablue: C3('Небесно‑голубой', 'Небесно‑блакитний', 'Sierra Blue', '#9cb6cf'), alpinegreen: C3('Альпийский зелёный', 'Альпійський зелений', 'Alpine Green', '#4d5d4c'),
  spaceblack: C3('Космический чёрный', 'Космічний чорний', 'Space Black', '#2b2a2c'), deeppurple: C3('Тёмно‑фиолетовый', 'Темно‑фіолетовий', 'Deep Purple', '#4f4459'),
  natti: C3('Натуральный титан', 'Натуральний титан', 'Natural Titanium', '#bcb5a9'), blueti: C3('Синий титан', 'Синій титан', 'Blue Titanium', '#3e4656'),
  whiteti: C3('Белый титан', 'Білий титан', 'White Titanium', '#e8e6e1'), blackti: C3('Чёрный титан', 'Чорний титан', 'Black Titanium', '#3a3a3c'),
  desertti: C3('Пустынный титан', 'Пустельний титан', 'Desert Titanium', '#c6ab8c'), teal: C3('Бирюзовый', 'Бірюзовий', 'Teal', '#9bd4c8'),
  ultramarine: C3('Ультрамарин', 'Ультрамарин', 'Ultramarine', '#6e80e6'), lavender: C3('Лавандовый', 'Лавандовий', 'Lavender', '#c9b8e8'),
  sage: C3('Шалфей', 'Шавлія', 'Sage', '#b5c4a5'), mistblue: C3('Туманно‑голубой', 'Туманно‑блакитний', 'Mist Blue', '#a9bfd6'),
  cloudwhite: C3('Облачный белый', 'Хмарний білий', 'Cloud White', '#f4f4f2'), lightgold: C3('Светлое золото', 'Світле золото', 'Light Gold', '#eadbb9'),
  skyblue: C3('Небесный', 'Небесний', 'Sky Blue', '#bcd6ef'), cosmicorange: C3('Космический оранжевый', 'Космічний помаранчевий', 'Cosmic Orange', '#e3733a'),
  deepblue: C3('Глубокий синий', 'Глибокий синій', 'Deep Blue', '#2c3a5a'), navy: C3('Тёмно‑синий', 'Темно‑синій', 'Navy', '#1f2b4a'),
  olive: C3('Оливковый', 'Оливковий', 'Olive', '#6b6b3a'), orange: C3('Оранжевый', 'Помаранчевий', 'Orange', '#f2752b'),
  brown: C3('Коричневый', 'Коричневий', 'Brown', '#6b4428'), beige: C3('Бежевый', 'Бежевий', 'Beige', '#d9c3a0'),
  cream: C3('Кремовый', 'Кремовий', 'Cream', '#f1e6cf'), burgundy: C3('Бордовый', 'Бордовий', 'Burgundy', '#6d1b2b'),
  mint: C3('Мятный', 'Мʼятний', 'Mint', '#a8e6cf'), lilac: C3('Сиреневый', 'Бузковий', 'Lilac', '#c8a2c8'), grey: C3('Серый', 'Сірий', 'Grey', '#8a8d93'),
  khaki: C3('Хаки', 'Хакі', 'Khaki', '#8f8a5b'), sand: C3('Песочный', 'Пісочний', 'Sand', '#cdb88f'), sky: C3('Голубой', 'Блакитний', 'Light blue', '#8fc3ea'),
  lime: C3('Лаймовый', 'Лаймовий', 'Lime', '#b6e04a'), violet: C3('Фиалковый', 'Фіалковий', 'Violet', '#6d3fc0'), titan: C3('Титан', 'Титан', 'Titanium', '#9a9893'),
  phantom: C3('Фантомный чёрный', 'Фантомний чорний', 'Phantom Black', '#26272b'), cream2: C3('Молочный', 'Молочний', 'Milk', '#f6efe2'),
  aurora: C3('Аврора', 'Аврора', 'Aurora', '#7fd1d6'), copper: C3('Медный', 'Мідний', 'Copper', '#b8734a'), champagne: C3('Шампань', 'Шампань', 'Champagne', '#e9d9b6'),
  // car paints
  c_white: C3('Белый', 'Білий', 'White', '#eef0f2'), c_black: C3('Чёрный металлик', 'Чорний металік', 'Black metallic', '#121316'), c_silver: C3('Серебристый металлик', 'Сріблястий металік', 'Silver metallic', '#b9bdc4'),
  c_asphalt: C3('Мокрый асфальт', 'Мокрий асфальт', 'Wet asphalt', '#4a4f57'), c_red: C3('Красный', 'Червоний', 'Red', '#b3121f'), c_cherry: C3('Вишня', 'Вишня', 'Cherry', '#5e0f1c'),
  c_aubergine: C3('Баклажан', 'Баклажан', 'Aubergine', '#3c1f3a'), c_blue: C3('Синий', 'Синій', 'Blue', '#1d3f8f'), c_navy: C3('Тёмно‑синий', 'Темно‑синій', 'Navy', '#162038'),
  c_green: C3('Тёмно‑зелёный', 'Темно‑зелений', 'British green', '#1d3b2a'), c_yellow: C3('Жёлтый', 'Жовтий', 'Yellow', '#f2c218'), c_orange: C3('Оранжевый', 'Помаранчевий', 'Orange', '#e8641b'),
  c_beige: C3('Бежевый', 'Бежевий', 'Beige', '#cdbb98'), c_brown: C3('Коричневый', 'Коричневий', 'Brown', '#4b3324'), c_sky: C3('Голубой', 'Блакитний', 'Light blue', '#7fb2d9'),
  c_matte: C3('Матовый чёрный', 'Матовий чорний', 'Matte black', '#25272a'), c_khaki: C3('Хаки', 'Хакі', 'Khaki', '#6e6a45'), c_snow: C3('Белая ночь', 'Біла ніч', 'Snow pearl', '#f6f4ee'),
  c_lime: C3('Зелёный лайм', 'Зелений лайм', 'Lime green', '#7bc043'), c_purple: C3('Фиолетовый', 'Фіолетовий', 'Purple', '#5b2a86'), c_gray: C3('Серый', 'Сірий', 'Grey', '#7a7f87'),
  c_teal: C3('Морская волна', 'Морська хвиля', 'Teal', '#16707a'), c_pink: C3('Розовый', 'Рожевий', 'Pink', '#e48aa8'), c_gold: C3('Золотистый', 'Золотистий', 'Gold', '#c9a65c'),
  // materials / special
  steel: C3('Сталь', 'Сталь', 'Steel', '#c9ccd1'), ygold: C3('Жёлтое золото', 'Жовте золото', 'Yellow gold', '#e2b84a'), rgold: C3('Розовое золото', 'Рожеве золото', 'Rose gold', '#e3a68c'),
  wgold: C3('Белое золото', 'Біле золото', 'White gold', '#e6e8ec'), platinum: C3('Платина', 'Платина', 'Platinum', '#dfe3e8'), camo: C3('Камуфляж', 'Камуфляж', 'Camo', '#5f6b46'),
  sunburst: C3('Санбёрст', 'Санберст', 'Sunburst', '#a2471a'), cherry: C3('Вишнёвый', 'Вишневий', 'Cherry', '#7d1424'), goldtop: C3('Голдтоп', 'Голдтоп', 'Goldtop', '#c9a65c'),
  natural: C3('Натуральное дерево', 'Натуральне дерево', 'Natural wood', '#d2a46b'), alu: C3('Алюминий', 'Алюміній', 'Aluminium', '#cfd3d8'), titanium: C3('Титан', 'Титан', 'Titanium', '#a7a49e'),
  cw: C3('', '', '', '#888888'), bottle: C3('', '', '', '#cccccc'), card: C3('', '', '', '#f2c218'), paper: C3('', '', '', '#f2ead8'), box: C3('', '', '', '#cccccc'),
  antique: C3('', '', '', '#b08968'), art: C3('', '', '', '#a78bfa'), col: C3('', '', '', '#94a3b8'),
};
export const CAR_COLORS = Object.keys(COLORS).filter((k) => k.startsWith('c_'));
export const GEN_COLORS = ['black', 'white', 'grey', 'navy', 'blue', 'red', 'green', 'olive', 'beige', 'brown', 'pink', 'purple', 'orange', 'yellow', 'cream', 'burgundy', 'khaki', 'sky', 'mint', 'lilac'];
export const colorName = (key) => COLORS[key]?.n || [key, key, key];
export const colorHex = (key) => COLORS[key]?.h || '#888888';

// ------------------------------------------------------------------ tests (inspection tools)
export const TESTS = {
  battery: ['Батарея', 'Батарея', 'Battery', '🔋'], bio: ['Face/Touch ID', 'Face/Touch ID', 'Face/Touch ID', '👤'],
  water: ['Индикатор влаги', 'Індикатор вологи', 'Water indicator', '💧'], sound: ['Звук', 'Звук', 'Sound', '🔊'],
  charge: ['Зарядка', 'Зарядка', 'Charging', '🔌'], display: ['Тест дисплея', 'Тест дисплея', 'Display test', '🌈'],
  keys: ['Клавиши', 'Клавіші', 'Keys', '⌨️'], pc: ['Подключить к ПК', 'Підключити до ПК', 'Plug into a PC', '🖥'], power: ['Включение', 'Увімкнення', 'Power on', '⏻'], disc: ['Диск/картридж', 'Диск/картридж', 'Disc/cart', '💿'],
  video: ['Видеовыход', 'Відеовихід', 'Video out', '📺'], pad: ['Геймпад', 'Геймпад', 'Controller', '🎮'], net: ['Онлайн‑проверка', 'Онлайн‑перевірка', 'Online check', '🌐'],
  inside: ['Фонарик внутрь', 'Ліхтарик всередину', 'Look inside', '🔦'], zip: ['Молния', 'Блискавка', 'Zipper', '🤐'], tag: ['Бирки', 'Бирки', 'Tags', '🏷'],
  size: ['Замер', 'Замір', 'Measure', '📏'], tick: ['Ход часов', 'Хід годинника', 'Movement', '⏱'], loupe: ['Лупа ×10', 'Лупа ×10', 'Loupe ×10', '🔍'],
  clasp: ['Замок', 'Замок', 'Clasp', '🔗'], acid: ['Проба металла', 'Проба металу', 'Acid test', '🧪'], smell: ['Аромат', 'Аромат', 'Scent', '👃'],
  pages: ['Страницы', 'Сторінки', 'Pages', '📄'], uv: ['УФ‑лампа', 'УФ‑лампа', 'UV lamp', '🟣'], pieces: ['Комплектность', 'Комплектність', 'Inventory', '🧩'],
  mech: ['Механизм', 'Механізм', 'Mechanism', '⚙️'], play: ['Проиграть', 'Програти', 'Play test', '🎵'], neck: ['Гриф', 'Гриф', 'Neck', '📐'],
  engine: ['Двигатель', 'Двигун', 'Engine', '🔧'], drive: ['Тест‑драйв', 'Тест‑драйв', 'Test drive', '🛞'], obd: ['OBD‑сканер', 'OBD‑сканер', 'OBD scan', '💻'],
  thick: ['Толщиномер', 'Товщиномір', 'Paint gauge', '📟'], vin: ['Проверка VIN', 'Перевірка VIN', 'VIN check', '🆔'], ride: ['Прокатиться', 'Прокататися', 'Ride', '🚲'],
};

// ------------------------------------------------------------------ defects
// sev: value penalty, vis: visible|subtle|hidden, viz: overlay kind, view: front|back|any,
// test: inspection tool that reveals it, fix: [minigame, cost as share of model value, minutes]
const D = (ru, uk, en, sev, vis, viz, view, test, fix) => ({ n: [ru, uk, en], sev, vis, viz, view, test, fix });
export const DEFECTS = {
  // phones
  crack: D('Разбит экран', 'Розбитий екран', 'Cracked screen', 0.28, 'visible', 'crack', 'front', null, ['screen', 0.14, 90]),
  backcrack: D('Трещина задней крышки', 'Тріщина задньої кришки', 'Cracked back glass', 0.12, 'visible', 'crack', 'back', null, ['screws', 0.07, 60]),
  scratches: D('Царапины на корпусе', 'Подряпини на корпусі', 'Body scratches', 0.06, 'subtle', 'scratch', 'back', null, ['scrub', 0.01, 30]),
  deadpix: D('Полоса/битые пиксели', 'Смуга/биті пікселі', 'Dead pixels / line', 0.18, 'subtle', 'line', 'front', 'display', ['screen', 0.14, 90]),
  battery: D('Износ батареи (≈76%)', 'Знос батареї (≈76%)', 'Worn battery (~76%)', 0.08, 'hidden', null, 'any', 'battery', ['solder', 0.04, 45]),
  button: D('Не работает боковая кнопка', 'Не працює бічна кнопка', 'Side button dead', 0.07, 'hidden', null, 'any', 'button', ['solder', 0.02, 40]),
  faceid: D('Не работает Face ID', 'Не працює Face ID', 'Face ID broken', 0.16, 'hidden', null, 'any', 'bio', ['wires', 0.09, 120]),
  water: D('Был в воде (окисление)', 'Був у воді (окислення)', 'Water damage', 0.3, 'subtle', 'stain', 'front', 'water', ['wires', 0.1, 150]),
  camera: D('Разбито стекло камеры', 'Розбите скло камери', 'Cracked camera lens', 0.09, 'visible', 'crack', 'back', null, ['screws', 0.03, 40]),
  bent: D('Погнут корпус', 'Погнутий корпус', 'Bent frame', 0.15, 'subtle', 'bend', 'back', null, ['align', 0.05, 60]),
  speaker: D('Хрипит динамик', 'Хрипить динамік', 'Crackling speaker', 0.05, 'hidden', null, 'any', 'sound', ['screws', 0.02, 30]),
  port: D('Не заряжается', 'Не заряджається', 'Charging port dead', 0.07, 'hidden', null, 'any', 'charge', ['solder', 0.02, 40]),
  cnrom: D('Китайская прошивка (без Google, только CN)', 'Китайська прошивка (без Google, лише CN)', 'Chinese ROM (no Google, CN only)', 0.12, 'hidden', null, 'any', 'display', ['wires', 0.03, 45]),
  nonorig: D('Неоригинальный дисплей', 'Неоригінальний дисплей', 'Aftermarket screen', 0.1, 'hidden', null, 'any', 'display', ['screen', 0.14, 90]),
  // electronics
  e_crack: D('Разбит экран', 'Розбитий екран', 'Cracked screen', 0.25, 'visible', 'crack', 'front', null, ['screen', 0.12, 90]),
  e_keys: D('Западают клавиши', 'Западають клавіші', 'Sticky keys', 0.07, 'hidden', null, 'any', 'keys', ['screws', 0.03, 50]),
  e_battery: D('Батарея не держит', 'Батарея не тримає', 'Battery dying', 0.08, 'hidden', null, 'any', 'battery', ['solder', 0.05, 45]),
  e_hinge: D('Разболтана петля', 'Розхитана петля', 'Loose hinge', 0.08, 'subtle', 'scratch', 'front', null, ['screws', 0.03, 40]),
  e_dent: D('Вмятина на корпусе', 'Вмʼятина на корпусі', 'Dented body', 0.08, 'visible', 'dent', 'any', null, ['align', 0.04, 50]),
  e_scratch: D('Потёртости', 'Потертості', 'Scuffs', 0.05, 'subtle', 'scratch', 'any', null, ['scrub', 0.01, 30]),
  e_fan: D('Шумит кулер', 'Шумить кулер', 'Noisy fan', 0.06, 'hidden', null, 'any', 'sound', ['scrub', 0.02, 40]),
  e_os: D('Не загружается система', 'Не завантажується система', 'OS won’t boot', 0.31, 'hidden', null, 'any', 'power', null),
  e_dead: D('Не включается', 'Не вмикається', 'Won’t power on', 0.6, 'hidden', null, 'any', 'power', ['wires', 0.2, 180]),
  e_water: D('Следы залития', 'Сліди залиття', 'Liquid damage', 0.3, 'hidden', null, 'any', 'water', ['wires', 0.12, 150]),
  e_lens: D('Царапина на объективе', 'Подряпина на обʼєктиві', 'Scratched lens', 0.15, 'subtle', 'scratch', 'front', 'loupe', ['align', 0.08, 60]),
  // consoles
  c_drive: D('Не читает диски', 'Не читає диски', 'Drive won’t read', 0.15, 'hidden', null, 'any', 'disc', ['screws', 0.06, 60]),
  c_hdmi: D('Сломан видеовыход', 'Зламаний відеовихід', 'Broken HDMI port', 0.2, 'hidden', null, 'any', 'video', ['solder', 0.07, 60]),
  c_fan: D('Гудит вентилятор', 'Гуде вентилятор', 'Loud fan', 0.06, 'hidden', null, 'any', 'sound', ['scrub', 0.02, 40]),
  c_scratch: D('Потёртый корпус', 'Потертий корпус', 'Scuffed shell', 0.05, 'subtle', 'scratch', 'front', null, ['scrub', 0.01, 30]),
  c_yellow: D('Пожелтел пластик', 'Пожовтів пластик', 'Yellowed plastic', 0.1, 'visible', 'yellow', 'front', null, ['scrub', 0.02, 60]),
  // PC parts
  x_pins: D('Погнуты ножки', 'Погнуті ніжки', 'Bent pins', 0.45, 'subtle', 'scratch', 'front', 'loupe', ['align', 0.12, 60]),
  x_dead: D('Не стартует', 'Не стартує', 'Won’t POST', 0.65, 'hidden', null, 'any', 'pc', null),
  x_oc: D('После майнинга / разгона', 'Після майнінгу / розгону', 'Ex‑mining / overclocked', 0.15, 'hidden', null, 'any', 'pc', null),
  x_fan: D('Шумит вентилятор', 'Шумить вентилятор', 'Noisy fan', 0.06, 'hidden', null, 'any', 'sound', ['scrub', 0.02, 30]),
  x_scratch: D('Потёртости', 'Потертості', 'Scuffs', 0.04, 'subtle', 'scratch', 'any', null, ['scrub', 0.01, 20]),
  // data storage
  s_dead: D('Не определяется', 'Не визначається', 'Not detected', 0.7, 'hidden', null, 'any', 'pc', ['solder', 0.2, 90]),
  s_click: D('Щёлкает, не читается', 'Клацає, не читається', 'Clicking, won’t read', 0.65, 'hidden', null, 'any', 'pc', null),
  s_bad: D('Битые сектора', 'Биті сектори', 'Bad sectors', 0.3, 'hidden', null, 'any', 'pc', null),
  s_slow: D('Очень медленная запись', 'Дуже повільний запис', 'Very slow writes', 0.12, 'hidden', null, 'any', 'pc', null),
  s_crack: D('Трещина корпуса', 'Тріщина корпусу', 'Cracked casing', 0.12, 'visible', 'crack', 'front', null, ['align', 0.05, 30]),
  s_scratch: D('Царапины на поверхности', 'Подряпини на поверхні', 'Surface scratches', 0.08, 'subtle', 'scratch', 'front', null, ['scrub', 0.01, 20]),
  c_dead: D('Не включается', 'Не вмикається', 'Won’t turn on', 0.6, 'hidden', null, 'any', 'power', ['wires', 0.2, 150]),
  c_drift: D('Дрифт стиков', 'Дрифт стіків', 'Stick drift', 0.07, 'hidden', null, 'any', 'pad', ['screws', 0.03, 40]),
  c_ban: D('Бан консоли в сети', 'Бан консолі в мережі', 'Console banned online', 0.22, 'hidden', null, 'any', 'net', null),
  // sneakers
  s_crease: D('Заломы на носке', 'Заломи на носку', 'Toe box creases', 0.1, 'visible', 'crease', 'front', null, ['align', 0.02, 30]),
  s_yellow: D('Пожелтевшая подошва', 'Пожовкла підошва', 'Yellowed sole', 0.12, 'visible', 'yellow', 'front', null, ['scrub', 0.03, 40]),
  s_scuff: D('Потёртости', 'Потертості', 'Scuffs', 0.08, 'visible', 'scuff', 'front', null, ['scrub', 0.01, 25]),
  s_stain: D('Пятна', 'Плями', 'Stains', 0.08, 'visible', 'stain', 'front', null, ['scrub', 0.01, 25]),
  s_sole: D('Отклеивается подошва', 'Відклеюється підошва', 'Sole separation', 0.2, 'subtle', 'tear', 'front', null, ['align', 0.04, 45]),
  s_insole: D('Стёрты стельки', 'Стерті устілки', 'Worn insoles', 0.05, 'hidden', null, 'any', 'inside', ['align', 0.02, 20]),
  s_smell: D('Неприятный запах', 'Неприємний запах', 'Bad smell', 0.04, 'hidden', null, 'any', 'inside', ['scrub', 0.01, 20]),
  s_paint: D('Облупилась краска', 'Облупилася фарба', 'Paint chipping', 0.1, 'subtle', 'chip', 'front', null, ['color', 0.02, 40]),
  // clothing
  w_stain: D('Пятно', 'Пляма', 'Stain', 0.12, 'visible', 'stain', 'front', null, ['scrub', 0.01, 25]),
  w_hole: D('Дырка', 'Дірка', 'Hole', 0.2, 'subtle', 'tear', 'front', null, ['align', 0.02, 40]),
  w_fade: D('Выцвел', 'Вилинялий', 'Faded', 0.1, 'visible', 'fade', 'front', null, ['color', 0.02, 40]),
  w_pill: D('Катышки', 'Катишки', 'Pilling', 0.06, 'subtle', 'scuff', 'front', null, ['scrub', 0.01, 20]),
  w_zip: D('Сломана молния', 'Зламана блискавка', 'Broken zipper', 0.08, 'hidden', null, 'any', 'zip', ['screws', 0.02, 30]),
  w_tag: D('Срезаны бирки', 'Зрізані бирки', 'Tags cut off', 0.1, 'hidden', null, 'any', 'tag', null),
  w_shrink: D('Сел после стирки', 'Сів після прання', 'Shrunk', 0.1, 'hidden', null, 'any', 'size', null),
  // bags
  b_corner: D('Потёрты углы', 'Потерті кути', 'Worn corners', 0.12, 'visible', 'scuff', 'front', null, ['color', 0.03, 40]),
  b_handle: D('Потемнели ручки', 'Потемніли ручки', 'Darkened handles', 0.1, 'visible', 'stain', 'front', null, ['scrub', 0.02, 30]),
  b_stain: D('Пятна', 'Плями', 'Stains', 0.1, 'visible', 'stain', 'front', null, ['scrub', 0.02, 30]),
  b_hw: D('Царапины на фурнитуре', 'Подряпини на фурнітурі', 'Scratched hardware', 0.05, 'subtle', 'scratch', 'front', null, ['scrub', 0.01, 20]),
  b_lining: D('Порвана подкладка', 'Порвана підкладка', 'Torn lining', 0.1, 'hidden', null, 'any', 'inside', ['align', 0.03, 40]),
  b_smell: D('Запах сигарет', 'Запах сигарет', 'Smoke smell', 0.05, 'hidden', null, 'any', 'inside', ['scrub', 0.01, 20]),
  b_shape: D('Потеряла форму', 'Втратила форму', 'Lost shape', 0.1, 'subtle', 'bend', 'front', null, ['align', 0.03, 40]),
  // watches
  t_crystal: D('Царапины на стекле', 'Подряпини на склі', 'Scratched crystal', 0.08, 'subtle', 'scratch', 'front', null, ['scrub', 0.02, 30]),
  t_crack: D('Трещина стекла', 'Тріщина скла', 'Cracked crystal', 0.15, 'visible', 'crack', 'front', null, ['align', 0.04, 45]),
  t_dead: D('Не идут', 'Не йдуть', 'Not running', 0.25, 'hidden', null, 'any', 'tick', ['wires', 0.06, 120]),
  t_slow: D('Сильно отстают', 'Сильно відстають', 'Losing time', 0.08, 'hidden', null, 'any', 'tick', ['align', 0.03, 60]),
  t_bezel: D('Сколы на безеле', 'Сколи на безелі', 'Bezel chips', 0.08, 'subtle', 'chip', 'front', null, ['color', 0.03, 40]),
  t_strap: D('Износ браслета', 'Знос браслета', 'Worn bracelet', 0.06, 'visible', 'scuff', 'front', null, ['scrub', 0.02, 30]),
  t_polish: D('Переполирован корпус', 'Переполірований корпус', 'Over‑polished case', 0.1, 'hidden', null, 'any', 'loupe', null),
  t_dial: D('Неродной циферблат', 'Нерідний циферблат', 'Service/redial', 0.3, 'hidden', null, 'any', 'loupe', null),
  // jewelry
  j_scratch: D('Царапины', 'Подряпини', 'Scratches', 0.05, 'subtle', 'scratch', 'front', null, ['scrub', 0.01, 20]),
  j_stone: D('Выпал камень', 'Випав камінь', 'Missing stone', 0.25, 'visible', 'chip', 'front', null, ['align', 0.08, 60]),
  j_bent: D('Деформация', 'Деформація', 'Bent', 0.1, 'subtle', 'bend', 'front', null, ['align', 0.02, 30]),
  j_clasp: D('Сломан замок', 'Зламаний замок', 'Broken clasp', 0.08, 'hidden', null, 'any', 'clasp', ['solder', 0.02, 30]),
  j_tarnish: D('Потемнение', 'Потемніння', 'Tarnish', 0.06, 'visible', 'scuff', 'front', null, ['scrub', 0.01, 20]),
  j_lowgold: D('Проба ниже заявленной', 'Проба нижча за заявлену', 'Lower gold purity', 0.4, 'hidden', null, 'any', 'acid', null),
  // perfume
  p_cap: D('Нет крышки', 'Немає кришки', 'Missing cap', 0.08, 'visible', 'chip', 'front', null, null),
  p_old: D('Испортился аромат', 'Зіпсувався аромат', 'Turned scent', 0.4, 'hidden', null, 'any', 'smell', null),
  p_label: D('Потёртая этикетка', 'Потерта етикетка', 'Worn label', 0.05, 'subtle', 'scuff', 'front', null, null),
  p_chip: D('Скол флакона', 'Скол флакона', 'Chipped bottle', 0.1, 'subtle', 'chip', 'front', null, null),
  // accessories
  a_scratch: D('Царапины', 'Подряпини', 'Scratches', 0.06, 'subtle', 'scratch', 'front', null, ['scrub', 0.01, 20]),
  a_broken: D('Сломан элемент', 'Зламаний елемент', 'Broken part', 0.25, 'subtle', 'tear', 'front', null, ['align', 0.05, 40]),
  a_battery: D('Слабая батарея', 'Слабка батарея', 'Weak battery', 0.15, 'hidden', null, 'any', 'battery', ['solder', 0.06, 40]),
  a_sound: D('Не работает один канал', 'Не працює один канал', 'One side dead', 0.3, 'hidden', null, 'any', 'sound', ['wires', 0.08, 60]),
  a_wear: D('Потёртости', 'Потертості', 'Wear', 0.08, 'visible', 'scuff', 'front', null, ['scrub', 0.01, 20]),
  // cards
  k_crease: D('Залом', 'Залом', 'Crease', 0.45, 'visible', 'crease', 'front', null, null),
  k_corner: D('Потёртые углы', 'Потерті кути', 'Whitened corners', 0.15, 'subtle', 'scuff', 'front', 'loupe', null),
  k_center: D('Смещённая центровка', 'Зміщене центрування', 'Off‑center', 0.1, 'subtle', null, 'front', 'loupe', null),
  k_scratch: D('Царапины на голо', 'Подряпини на голо', 'Holo scratches', 0.12, 'subtle', 'scratch', 'front', null, null),
  k_trim: D('Подрезана', 'Підрізана', 'Trimmed', 0.5, 'hidden', null, 'any', 'loupe', null),
  k_stain: D('Пятно', 'Пляма', 'Stain', 0.2, 'visible', 'stain', 'front', null, null),
  // comics
  m_spine: D('Заломы корешка', 'Заломи корінця', 'Spine stress', 0.15, 'visible', 'crease', 'front', null, ['align', 0.02, 40]),
  m_tear: D('Надрыв обложки', 'Надрив обкладинки', 'Cover tear', 0.2, 'visible', 'tear', 'front', null, ['align', 0.03, 50]),
  m_stain: D('Следы влаги', 'Сліди вологи', 'Water stain', 0.2, 'subtle', 'stain', 'front', null, null),
  m_fade: D('Выцвела обложка', 'Вицвіла обкладинка', 'Faded cover', 0.12, 'visible', 'fade', 'front', null, null),
  m_missing: D('Не хватает страницы', 'Бракує сторінки', 'Missing page', 0.35, 'hidden', null, 'any', 'pages', null),
  m_restored: D('Следы реставрации', 'Сліди реставрації', 'Restored (color touch)', 0.3, 'hidden', null, 'any', 'uv', null),
  // toys
  y_missing: D('Не хватает деталей', 'Бракує деталей', 'Missing pieces', 0.25, 'hidden', null, 'any', 'pieces', ['align', 0.05, 40]),
  y_boxdmg: D('Помята коробка', 'Мʼята коробка', 'Box damage', 0.12, 'visible', 'dent', 'front', null, null),
  y_fade: D('Выцвела на солнце', 'Вицвіла на сонці', 'Sun faded', 0.1, 'visible', 'fade', 'front', null, null),
  y_paint: D('Стёрта краска', 'Стерта фарба', 'Paint wear', 0.1, 'subtle', 'scuff', 'front', null, ['color', 0.02, 30]),
  y_broken: D('Сломана деталь', 'Зламана деталь', 'Broken part', 0.2, 'subtle', 'tear', 'front', null, ['align', 0.03, 30]),
  // antiques
  q_chip: D('Скол', 'Скол', 'Chip', 0.15, 'visible', 'chip', 'front', null, ['color', 0.04, 60]),
  q_crack: D('Трещина', 'Тріщина', 'Crack', 0.25, 'visible', 'crack', 'front', null, ['align', 0.06, 80]),
  q_repair: D('Следы реставрации', 'Сліди реставрації', 'Old restoration', 0.2, 'hidden', null, 'any', 'uv', null),
  q_patina: D('Патина и потёртости', 'Патина і потертості', 'Patina & wear', 0.04, 'visible', 'fade', 'front', null, ['scrub', 0.01, 30]),
  q_mech: D('Не работает механизм', 'Не працює механізм', 'Mechanism broken', 0.2, 'hidden', null, 'any', 'mech', ['wires', 0.06, 100]),
  // art
  r_tear: D('Порыв холста', 'Розрив полотна', 'Canvas tear', 0.3, 'visible', 'tear', 'front', null, ['align', 0.08, 120]),
  r_crack: D('Кракелюр', 'Кракелюр', 'Craquelure', 0.1, 'subtle', 'crack', 'front', null, ['color', 0.05, 90]),
  r_fade: D('Выцветание красок', 'Вицвітання фарб', 'Faded paint', 0.15, 'visible', 'fade', 'front', null, ['color', 0.06, 90]),
  r_frame: D('Повреждена рама', 'Пошкоджена рама', 'Damaged frame', 0.05, 'visible', 'chip', 'front', null, ['align', 0.02, 30]),
  r_stain: D('Пятна', 'Плями', 'Stains', 0.15, 'subtle', 'stain', 'front', null, ['scrub', 0.04, 60]),
  // collectibles
  l_scratch: D('Царапины', 'Подряпини', 'Scratches', 0.1, 'subtle', 'scratch', 'front', null, null),
  l_clean: D('Чищена (потеря патины)', 'Чищена (втрата патини)', 'Cleaned', 0.3, 'hidden', null, 'any', 'loupe', null),
  l_bent: D('Погнута', 'Погнута', 'Bent', 0.2, 'subtle', 'bend', 'front', null, null),
  l_stain: D('Пятна', 'Плями', 'Stains', 0.12, 'visible', 'stain', 'front', null, ['scrub', 0.02, 30]),
  l_warp: D('Покороблена', 'Покороблена', 'Warped', 0.25, 'hidden', null, 'any', 'play', null),
  l_tear: D('Надрыв', 'Надрив', 'Tear', 0.2, 'visible', 'tear', 'front', null, null),
  // instruments
  i_scratch: D('Царапины на деке', 'Подряпини на деці', 'Body scratches', 0.05, 'subtle', 'scratch', 'front', null, ['scrub', 0.01, 30]),
  i_neck: D('Повело гриф', 'Повело гриф', 'Warped neck', 0.2, 'hidden', null, 'any', 'neck', ['align', 0.06, 60]),
  i_electro: D('Не работает звукосниматель', 'Не працює звукознімач', 'Dead pickup', 0.15, 'hidden', null, 'any', 'sound', ['solder', 0.04, 40]),
  i_crack: D('Трещина корпуса', 'Тріщина корпусу', 'Body crack', 0.25, 'visible', 'crack', 'front', null, ['align', 0.08, 90]),
  i_frets: D('Стёрты лады', 'Стерті лади', 'Worn frets', 0.1, 'subtle', 'scratch', 'front', null, ['scrub', 0.05, 60]),
  i_keys: D('Западают клавиши', 'Западають клавіші', 'Sticky keys', 0.12, 'hidden', null, 'any', 'keys', ['screws', 0.04, 50]),
  // cars
  v_dent: D('Вмятины', 'Вмʼятини', 'Dents', 0.08, 'visible', 'dent', 'any', null, ['dent', 0.03, 80]),
  v_rust: D('Ржавчина', 'Іржа', 'Rust', 0.15, 'visible', 'rust', 'any', null, ['scrub', 0.05, 120]),
  v_scratch: D('Царапины по кузову', 'Подряпини кузова', 'Paint scratches', 0.04, 'visible', 'scratch', 'any', null, ['color', 0.015, 60]),
  v_paint: D('Крашеный элемент', 'Фарбований елемент', 'Repainted panel', 0.06, 'subtle', 'panel', 'any', 'thick', null),
  v_light: D('Разбита фара', 'Розбита фара', 'Broken headlight', 0.04, 'visible', 'lightcrack', 'any', null, ['screws', 0.015, 40]),
  v_engine: D('Стук в двигателе', 'Стук у двигуні', 'Engine knock', 0.3, 'hidden', null, 'any', 'engine', ['wires', 0.12, 240]),
  v_gearbox: D('Пинается коробка', 'Штовхається коробка', 'Rough gearbox', 0.2, 'hidden', null, 'any', 'drive', ['screws', 0.08, 180]),
  v_mileage: D('Скручен пробег', 'Скручений пробіг', 'Rolled‑back odometer', 0.15, 'hidden', null, 'any', 'obd', null),
  v_accident: D('Серьёзное ДТП в прошлом', 'Серйозна ДТП у минулому', 'Major accident history', 0.25, 'hidden', null, 'any', 'thick', null),
  v_tire: D('Спущено колесо', 'Спущене колесо', 'Flat tire', 0.02, 'visible', 'flat', 'any', null, ['screws', 0.004, 20]),
  v_glass: D('Трещина лобового стекла', 'Тріщина лобового скла', 'Cracked windshield', 0.04, 'visible', 'glass', 'any', null, ['align', 0.015, 60]),
  v_docs: D('Залог / ограничения', 'Застава / обмеження', 'Lien / legal block', 0.5, 'hidden', null, 'any', 'vin', null),
  v_electric: D('Глючит электрика', 'Глючить електрика', 'Electrical faults', 0.1, 'hidden', null, 'any', 'obd', ['wires', 0.04, 90]),
  // bikes
  bk_rust: D('Ржавчина', 'Іржа', 'Rust', 0.12, 'visible', 'rust', 'front', null, ['scrub', 0.03, 60]),
  bk_scratch: D('Царапины', 'Подряпини', 'Scratches', 0.05, 'visible', 'scratch', 'front', null, ['color', 0.01, 40]),
  bk_brake: D('Не держат тормоза', 'Не тримають гальма', 'Weak brakes', 0.1, 'hidden', null, 'any', 'ride', ['screws', 0.02, 30]),
  bk_wheel: D('Восьмёрка колеса', 'Вісімка колеса', 'Bent wheel', 0.08, 'hidden', null, 'any', 'ride', ['align', 0.02, 30]),
  bk_battery: D('Батарея на исходе', 'Батарея на виході', 'Dying battery', 0.25, 'hidden', null, 'any', 'battery', ['solder', 0.1, 60]),
  bk_dent: D('Вмятина на баке/раме', 'Вмʼятина на баку/рамі', 'Dented tank/frame', 0.1, 'visible', 'dent', 'front', null, ['dent', 0.03, 60]),
  // added by repairs with copy/used parts
  aftermarket: D('Неоригинальная запчасть', 'Неоригінальна запчастина', 'Aftermarket part', 0.06, 'hidden', null, 'any', 'loupe', null),
};
for (const k of Object.keys(DEFECTS)) DEFECTS[k].id = k;

export const CAT_DEFECTS = {
  phones: ['crack', 'backcrack', 'scratches', 'deadpix', 'battery', 'button', 'faceid', 'water', 'camera', 'bent', 'speaker', 'port', 'nonorig'],
  electronics: ['e_crack', 'e_keys', 'e_battery', 'e_hinge', 'e_dent', 'e_scratch', 'e_fan', 'e_dead', 'e_water', 'e_lens', 'e_os'],
  consoles: ['c_drive', 'c_hdmi', 'c_fan', 'c_scratch', 'c_yellow', 'c_dead', 'c_drift', 'c_ban'],
  accessories: ['a_scratch', 'a_broken', 'a_battery', 'a_sound', 'a_wear'],
  sneakers: ['s_crease', 's_yellow', 's_scuff', 's_stain', 's_sole', 's_insole', 's_smell', 's_paint'],
  clothing: ['w_stain', 'w_hole', 'w_fade', 'w_pill', 'w_zip', 'w_tag', 'w_shrink'],
  bags: ['b_corner', 'b_handle', 'b_stain', 'b_hw', 'b_lining', 'b_smell', 'b_shape'],
  watches: ['t_crystal', 't_crack', 't_dead', 't_slow', 't_bezel', 't_strap', 't_polish', 't_dial'],
  jewelry: ['j_scratch', 'j_stone', 'j_bent', 'j_clasp', 'j_tarnish', 'j_lowgold'],
  perfume: ['p_cap', 'p_old', 'p_label', 'p_chip'],
  cards: ['k_crease', 'k_corner', 'k_center', 'k_scratch', 'k_trim', 'k_stain'],
  comics: ['m_spine', 'm_tear', 'm_stain', 'm_fade', 'm_missing', 'm_restored'],
  toys: ['y_missing', 'y_boxdmg', 'y_fade', 'y_paint', 'y_broken'],
  antiques: ['q_chip', 'q_crack', 'q_repair', 'q_patina', 'q_mech'],
  art: ['r_tear', 'r_crack', 'r_fade', 'r_frame', 'r_stain'],
  collectibles: ['l_scratch', 'l_clean', 'l_bent', 'l_stain', 'l_warp', 'l_tear'],
  instruments: ['i_scratch', 'i_neck', 'i_electro', 'i_crack', 'i_frets', 'i_keys'],
  cars: ['v_dent', 'v_rust', 'v_scratch', 'v_paint', 'v_light', 'v_engine', 'v_gearbox', 'v_mileage', 'v_accident', 'v_tire', 'v_glass', 'v_docs', 'v_electric'],
  bikes: ['bk_rust', 'bk_scratch', 'bk_brake', 'bk_wheel', 'bk_battery', 'bk_dent'],
  gear: ['a_scratch', 'a_wear', 'a_broken', 'b_stain', 'b_smell', 'w_zip'],
  misc: ['l_scratch', 'a_wear', 'a_broken', 'l_stain'],
  storage: ['s_dead', 's_click', 's_bad', 's_slow', 's_crack', 's_scratch'],
  pcparts: ['x_pins', 'x_dead', 'x_oc', 'x_fan', 'x_scratch'],
};

export const LOCKS = {
  passcode: { n: ['Код‑пароль', 'Код‑пароль', 'Passcode'], sev: 0.35, fixable: true },
  frp: { n: ['Gugle FRP', 'Gugle FRP', 'Gugle FRP'], sev: 0.35, fixable: true },
  icloud: { n: ['Pear ID (iCloud)', 'Pear ID (iCloud)', 'Pear ID lock'], sev: 0.75, fixable: false },
  blacklist: { n: ['IMEI в чёрном списке', 'IMEI у чорному списку', 'Blacklisted IMEI'], sev: 0.7, fixable: false },
  bootloop: { n: ['Бутлуп', 'Бутлуп', 'Bootloop'], sev: 0.6, fixable: true },
};

export const RARITY = [
  { n: ['Обычный', 'Звичайний', 'Common'], m: 1, w: 1000 },
  { n: ['Необычный', 'Незвичайний', 'Uncommon'], m: 1.15, w: 140 },
  { n: ['Редкий', 'Рідкісний', 'Rare'], m: 1.5, w: 40 },
  { n: ['Эпический', 'Епічний', 'Epic'], m: 2.4, w: 9 },
  { n: ['Легендарный', 'Легендарний', 'Legendary'], m: 4.5, w: 2 },
  { n: ['Мифический', 'Міфічний', 'Mythic'], m: 10, w: 0.35 },
];
// rare traits per category (rarity tier → label)
export const RARE_TRAITS = {
  phones: [['Лимитированный цвет', 'Лімітований колір', 'Limited color'], ['Прототип (dev‑fused)', 'Прототип (dev‑fused)', 'Prototype unit'], ['Запечатан с завода', 'Запечатаний з заводу', 'Factory sealed'], ['Серийник из первой партии', 'Серійник з першої партії', 'First batch serial']],
  sneakers: [['Сэмпл (не для продажи)', 'Семпл (не для продажу)', 'Sample (not for resale)'], ['Friends & Family', 'Friends & Family', 'Friends & Family'], ['С автографом', 'З автографом', 'Signed'], ['Дедсток 2000‑х', 'Дедсток 2000‑х', '2000s deadstock']],
  watches: [['Редкий циферблат', 'Рідкісний циферблат', 'Rare dial'], ['Полный комплект 1980‑х', 'Повний комплект 1980‑х', 'Full set 1980s'], ['Принадлежали знаменитости', 'Належали знаменитості', 'Celebrity provenance'], ['Тропический циферблат', 'Тропічний циферблат', 'Tropical dial']],
  cards: [['1‑е издание', '1‑ше видання', '1st Edition'], ['Ошибка печати', 'Помилка друку', 'Misprint'], ['Промо‑тираж', 'Промо‑тираж', 'Promo print'], ['Японский релиз', 'Японський реліз', 'Japanese release']],
  toys: [['Снят с производства', 'Знятий з виробництва', 'Retired set'], ['Эксклюзив выставки', 'Ексклюзив виставки', 'Convention exclusive'], ['Chase‑вариант', 'Chase‑варіант', 'Chase variant'], ['Прототип', 'Прототип', 'Prototype']],
  cars: [['Один владелец', 'Один власник', 'One owner'], ['Музейное состояние', 'Музейний стан', 'Museum condition'], ['Редкая комплектация', 'Рідкісна комплектація', 'Rare spec'], ['Из гаража коллекционера', 'З гаража колекціонера', 'Collector garage find']],
  default: [['Редкая версия', 'Рідкісна версія', 'Rare version'], ['Лимитированная серия', 'Лімітована серія', 'Limited edition'], ['С автографом', 'З автографом', 'Signed'], ['Из известной коллекции', 'З відомої колекції', 'Famous collection']],
};

// ------------------------------------------------------------------ registry
export const MODELS = [];
export const MODEL = {};
export const BY_CAT = {};
function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9а-яёіїєґ]+/gi, '_').replace(/^_|_$/g, ''); }
export function addModel(cat, brand, name, price, year, art = {}, o = {}) {
  let id = o.id || slug(`${cat}_${brand}_${name}`); // o.id keeps an old id when a model is renamed
  if (MODEL[id]) { let i = 2; while (MODEL[id + '_' + i]) i++; id = id + '_' + i; }
  const m = { id, cat, brand, name, price, year, art, ...o };
  MODELS.push(m); MODEL[id] = m; (BY_CAT[cat] ||= []).push(m);
  return m;
}

buildTech(addModel);
buildFashion(addModel);
buildCollect(addModel);
buildVehicles(addModel);
buildExtra(addModel);
buildStorage(addModel);
buildPC(addModel);
buildNew(addModel);
buildLines(addModel);

// Typical market value for an original item in excellent used condition (USD, before regional effects)
export function modelValue(m) {
  if (m._v) return m._v;
  const c = CATS[m.cat];
  const age = Math.max(0, YEAR - (m.year || YEAR));
  let v = m.price;
  if (c.valMode === 'dep' && !m.fixed) {
    const dep = m.dep ?? c.dep;
    v = m.price * Math.max(m.floor ?? c.floor, Math.pow(1 - dep, age));
    if (m.retro && age > m.retro) v = Math.max(v, m.price * (0.12 + 0.04 * (age - m.retro)));
  }
  v *= m.hype || 1;
  m._v = Math.max(1, v);
  return m._v;
}
export const brandsOf = (cat) => [...new Set((BY_CAT[cat] || []).map((m) => m.brand))];
export const modelTitle = (m) => `${m.brand} ${m.name}`;
