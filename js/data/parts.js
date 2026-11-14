// Repair supplies: model-specific spare parts (original / copy / used from a donor), consumables and tools.
// Every defect has a recipe: which part, which consumables, which tool, and the minigame steps.
import { MODEL, modelValue, DEFECTS } from './catalog.js';

// tools are bought once; without the right tool you can only hand the item to a technician
export const TOOLS = {
  screwdrivers: { n: ['Набор отвёрток и присосок', 'Набір викруток і присосок', 'Screwdriver & suction kit'], price: 25, icon: '🪛' },
  heatgun: { n: ['Термофен / нагревательный коврик', 'Термофен / нагрівальний килимок', 'Heat gun / heat pad'], price: 45, icon: '🔥' },
  solder: { n: ['Паяльная станция', 'Паяльна станція', 'Soldering station'], price: 90, icon: '🔌' },
  microscope: { n: ['Микроскоп для пайки', 'Мікроскоп для пайки', 'Soldering microscope'], price: 220, icon: '🔬', bonus: { solder: 0.15, wires: 0.12 } },
  ultrasonic: { n: ['Ультразвуковая ванна', 'Ультразвукова ванна', 'Ultrasonic cleaner'], price: 70, icon: '🫧' },
  sewing: { n: ['Швейная машинка', 'Швейна машинка', 'Sewing machine'], price: 140, icon: '🧵' },
  leather_kit: { n: ['Набор для кожи (краски, кисти)', 'Набір для шкіри (фарби, пензлі)', 'Leather kit (dyes, brushes)'], price: 60, icon: '🎨' },
  polisher: { n: ['Полировальный станок', 'Полірувальний верстат', 'Polishing machine'], price: 120, icon: '💫', bonus: { scrub: 0.1 } },
  watch_tools: { n: ['Часовой набор (ключи, пинцеты, масла)', 'Годинниковий набір (ключі, пінцети, оливи)', 'Watchmaker kit'], price: 160, icon: '⌚' },
  jeweler: { n: ['Ювелирный набор (горелка, закрепки)', 'Ювелірний набір (пальник, закріпки)', 'Jeweller’s kit'], price: 180, icon: '💍' },
  lint: { n: ['Машинка от катышков', 'Машинка від катишків', 'Fabric shaver'], price: 12, icon: '🪒' },
  dent_kit: { n: ['PDR-набор для вмятин', 'PDR-набір для вмʼятин', 'PDR dent kit'], price: 150, icon: '🔨' },
  compressor: { n: ['Компрессор и краскопульт', 'Компресор і фарбопульт', 'Compressor & spray gun'], price: 400, icon: '🎯' },
  obd: { n: ['OBD-сканер', 'OBD-сканер', 'OBD scanner'], price: 60, icon: '💻' },
  lift: { n: ['Подкатной домкрат и стойки', 'Підкатний домкрат і стійки', 'Floor jack & stands'], price: 300, icon: '🛠' },
  bike_tools: { n: ['Велоключи и правильный станок', 'Велоключі й правильний верстат', 'Bike tools & truing stand'], price: 40, icon: '🚲' },
};

// consumables: bought in packs, generic for any item
export const CONS = {
  cleaner: { n: ['Очиститель', 'Очищувач', 'Cleaner'], price: 4 }, polish: { n: ['Полировальная паста', 'Полірувальна паста', 'Polishing paste'], price: 6 },
  glue: { n: ['Клей для обуви', 'Клей для взуття', 'Shoe glue'], price: 3 }, whitener: { n: ['Отбеливатель подошв', 'Відбілювач підошов', 'Sole whitener'], price: 8 },
  leather_paint: { n: ['Краска для кожи', 'Фарба для шкіри', 'Leather paint'], price: 12 }, thread: { n: ['Нитки и заплатки', 'Нитки й латки', 'Thread & patches'], price: 2 },
  zipper: { n: ['Молния', 'Блискавка', 'Zipper'], price: 4 }, dye: { n: ['Краситель для ткани', 'Барвник для тканини', 'Fabric dye'], price: 7 },
  insoles: { n: ['Стельки', 'Устілки', 'Insoles'], price: 6 }, deodorizer: { n: ['Нейтрализатор запаха', 'Нейтралізатор запаху', 'Odour neutraliser'], price: 4 },
  stuffing: { n: ['Наполнитель для формы', 'Наповнювач для форми', 'Shape stuffing'], price: 3 }, lining: { n: ['Подкладочная ткань', 'Підкладкова тканина', 'Lining fabric'], price: 8 },
  watch_oil: { n: ['Часовое масло', 'Годинникова олива', 'Watch oil'], price: 15 }, stone: { n: ['Камень для вставки', 'Камінь для вставки', 'Replacement stone'], price: 30 },
  clasp: { n: ['Замочек', 'Замочок', 'Clasp'], price: 6 }, perfume_cap: { n: ['Крышка для флакона', 'Кришка для флакона', 'Bottle cap'], price: 10 },
  paste: { n: ['Термопаста', 'Термопаста', 'Thermal paste'], price: 5 }, retrobright: { n: ['Состав Retrobright', 'Склад Retrobright', 'Retrobright mix'], price: 9 },
  crease_guard: { n: ['Протекторы от заломов', 'Протектори від заломів', 'Crease guards'], price: 5 }, putty: { n: ['Шпатлёвка', 'Шпаклівка', 'Body filler'], price: 8 },
  car_paint: { n: ['Автоэмаль в цвет', 'Автоемаль у колір', 'Matched car paint'], price: 60 }, rust_kit: { n: ['Преобразователь ржавчины', 'Перетворювач іржі', 'Rust converter'], price: 25 },
  car_polish: { n: ['Автополироль', 'Автополіроль', 'Car polish'], price: 15 }, restore: { n: ['Реставрационный набор', 'Реставраційний набір', 'Restoration kit'], price: 20 },
};

// model-specific parts by category (also what a donor gives when dismantled)
export const PART_NAMES = {
  display: ['Дисплей', 'Дисплей', 'Display'], battery: ['Аккумулятор', 'Акумулятор', 'Battery'], backglass: ['Задняя крышка', 'Задня кришка', 'Back glass'],
  lens: ['Стекло/модуль камеры', 'Скло/модуль камери', 'Camera lens/module'], speaker: ['Динамик', 'Динамік', 'Speaker'], port: ['Разъём зарядки', 'Розʼєм зарядки', 'Charging port'],
  flex: ['Шлейф кнопок', 'Шлейф кнопок', 'Button flex'], faceid: ['Модуль Face ID', 'Модуль Face ID', 'Face ID module'], frame: ['Корпус/рамка', 'Корпус/рамка', 'Frame'],
  keyboard: ['Клавиатура', 'Клавіатура', 'Keyboard'], hinge: ['Петли', 'Петлі', 'Hinges'], fan: ['Кулер', 'Кулер', 'Fan'], board: ['Плата', 'Плата', 'Logic board'],
  drive: ['Привод', 'Привід', 'Disc drive'], hdmi: ['Порт HDMI', 'Порт HDMI', 'HDMI port'], psu: ['Блок питания', 'Блок живлення', 'Power supply'], stick: ['Стики геймпада', 'Стіки геймпада', 'Analog sticks'],
  crystal: ['Сапфировое стекло', 'Сапфірове скло', 'Sapphire crystal'], bezel: ['Вставка безеля', 'Вставка безеля', 'Bezel insert'],
  headlight: ['Фара', 'Фара', 'Headlight'], engine_kit: ['Ремкомплект двигателя', 'Ремкомплект двигуна', 'Engine rebuild kit'], gearbox_kit: ['Ремкомплект КПП', 'Ремкомплект КПП', 'Gearbox kit'],
  tire: ['Шина', 'Шина', 'Tyre'], windshield: ['Лобовое стекло', 'Лобове скло', 'Windscreen'], wiring: ['Проводка/блок', 'Проводка/блок', 'Wiring/module'], brake_pads: ['Тормозные колодки', 'Гальмівні колодки', 'Brake pads'],
};
export const MODEL_PART_CATS = {
  phones: ['display', 'battery', 'backglass', 'lens', 'speaker', 'port', 'flex', 'faceid', 'frame'],
  electronics: ['display', 'battery', 'keyboard', 'hinge', 'fan', 'board', 'lens', 'frame'],
  consoles: ['board', 'drive', 'hdmi', 'psu', 'stick', 'fan', 'frame'],
  watches: ['crystal', 'bezel'],
  cars: ['headlight', 'engine_kit', 'gearbox_kit', 'tire', 'windshield', 'wiring'],
  bikes: ['brake_pads', 'battery', 'tire'],
};
// share of the model's value a new original part costs
const PART_SHARE = { display: 0.16, battery: 0.05, backglass: 0.08, lens: 0.04, speaker: 0.03, port: 0.03, flex: 0.02, faceid: 0.09, frame: 0.06, keyboard: 0.06, hinge: 0.04, fan: 0.03, board: 0.25, drive: 0.08, hdmi: 0.05, psu: 0.1, stick: 0.04, crystal: 0.04, bezel: 0.04, headlight: 0.025, engine_kit: 0.08, gearbox_kit: 0.06, tire: 0.012, windshield: 0.02, wiring: 0.03, brake_pads: 0.02 };
export const QUALITY = {
  orig: { n: ['Оригинал', 'Оригінал', 'Original'], k: 1 },
  copy: { n: ['Копия (аналог)', 'Копія (аналог)', 'Copy (aftermarket)'], k: 0.42 },
  used: { n: ['Б/у с донора', 'Вживана з донора', 'Used, from a donor'], k: 0.3 },
};
export function partPrice(modelId, kind, q = 'orig') {
  const m = MODEL[modelId];
  if (!m) return 0;
  return Math.max(3, modelValue(m) * (PART_SHARE[kind] || 0.05)) * (QUALITY[q]?.k || 1);
}
export const partKey = (modelId, kind) => `${modelId}:${kind}`;

// defect -> recipe. part: model part kind; cons: consumables; tool; steps: minigames played in order
const R = (part, cons, tool, steps) => ({ part, cons: cons || [], tool, steps });
const OPEN = ['screws'];
const CLOSE = ['wires'];
export const RECIPES = {
  // phones: heat the glue, open in the right order, reconnect; battery strips; ultrasonic bath; press; sound check
  crack: R('display', [], 'heatgun', ['ph_heat', 'ph_open', 'wires']), deadpix: R('display', [], 'heatgun', ['ph_heat', 'ph_open', 'wires']), nonorig: R('display', [], 'heatgun', ['ph_heat', 'ph_open', 'wires']),
  backcrack: R('backglass', [], 'heatgun', ['ph_heat', 'align']), scratches: R(null, ['polish'], null, ['scrub']), battery: R('battery', [], 'screwdrivers', ['ph_open', 'ph_battery', 'wires']),
  button: R('flex', [], 'solder', ['ph_open', 'solder', 'wires']), faceid: R('faceid', [], 'microscope', ['ph_open', 'solder', 'wires']), water: R(null, ['cleaner'], 'ultrasonic', ['ph_open', 'ph_ultra', 'scrub']),
  camera: R('lens', [], 'screwdrivers', ['align']), bent: R('frame', [], 'screwdrivers', ['ph_open', 'ph_bend', 'wires']), speaker: R('speaker', [], 'screwdrivers', ['ph_open', 'align', 'ph_speaker']), port: R('port', [], 'solder', ['ph_open', 'solder', 'wires']),
  // laptops, cameras, tablets
  e_crack: R('display', [], 'heatgun', ['lt_screws', 'ph_heat', 'wires']), e_keys: R('keyboard', [], 'screwdrivers', ['lt_screws', 'lt_keys']), e_battery: R('battery', [], 'screwdrivers', ['lt_screws', 'wires']),
  e_hinge: R('hinge', [], 'screwdrivers', ['lt_screws', 'lt_hinge']), e_dent: R(null, ['putty'], null, ['lt_dent', 'scrub']), e_scratch: R(null, ['polish'], null, ['scrub']), e_fan: R('fan', ['paste'], 'screwdrivers', ['lt_screws', 'scrub', 'lt_paste']),
  e_dead: R('board', [], 'solder', ['lt_screws', 'lt_short', 'solder']), e_water: R(null, ['cleaner'], 'ultrasonic', ['lt_screws', 'ph_ultra', 'scrub']), e_lens: R('lens', [], 'screwdrivers', ['align']),
  // consoles
  c_drive: R('drive', [], 'screwdrivers', ['cn_open', 'cn_laser']), c_hdmi: R('hdmi', [], 'solder', ['cn_open', 'solder']), c_fan: R(null, ['paste'], 'screwdrivers', ['cn_open', 'scrub', 'lt_paste']),
  c_scratch: R(null, ['polish'], null, ['scrub']), c_yellow: R(null, ['retrobright'], null, ['cn_retro']), c_dead: R('psu', [], 'solder', ['cn_open', 'lt_short', 'solder']), c_drift: R('stick', [], 'solder', ['cn_open', 'cn_stick']),
  // sneakers, clothes, bags
  s_crease: R(null, ['crease_guard'], null, ['sh_steam']), s_yellow: R(null, ['whitener'], null, ['scrub']), s_scuff: R(null, ['cleaner'], null, ['scrub']), s_stain: R(null, ['cleaner'], null, ['scrub']),
  s_sole: R(null, ['glue'], null, ['sh_glue', 'sh_press']), s_insole: R(null, ['insoles'], null, ['align']), s_smell: R(null, ['deodorizer'], null, ['scrub']), s_paint: R(null, ['leather_paint'], 'leather_kit', ['color']),
  w_stain: R(null, ['cleaner'], null, ['scrub']), w_hole: R(null, ['thread'], 'sewing', ['cl_stitch']), w_fade: R(null, ['dye'], null, ['color']), w_pill: R(null, [], 'lint', ['scrub']), w_zip: R(null, ['zipper'], 'sewing', ['cl_zip']),
  b_corner: R(null, ['leather_paint'], 'leather_kit', ['bg_edge', 'color']), b_handle: R(null, ['cleaner'], null, ['scrub']), b_stain: R(null, ['cleaner'], null, ['scrub']), b_hw: R(null, ['polish'], 'polisher', ['scrub']),
  b_lining: R(null, ['lining'], 'sewing', ['cl_stitch']), b_smell: R(null, ['deodorizer'], null, ['scrub']), b_shape: R(null, ['stuffing'], null, ['bg_steam']),
  // watches, jewellery, perfume
  t_crystal: R(null, ['polish'], 'polisher', ['scrub']), t_crack: R('crystal', [], 'watch_tools', ['wt_back', 'align']), t_dead: R(null, ['watch_oil'], 'watch_tools', ['wt_back', 'align', 'wt_reg']),
  t_slow: R(null, ['watch_oil'], 'watch_tools', ['wt_back', 'wt_reg']), t_bezel: R('bezel', [], 'watch_tools', ['align']), t_strap: R(null, ['polish'], 'polisher', ['scrub']),
  j_scratch: R(null, ['polish'], 'polisher', ['scrub']), j_stone: R(null, ['stone'], 'jeweler', ['jw_prongs']), j_bent: R(null, [], 'jeweler', ['jw_size']), j_clasp: R(null, ['clasp'], 'jeweler', ['jw_solder']), j_tarnish: R(null, ['cleaner'], null, ['scrub']),
  p_cap: R(null, ['perfume_cap'], null, ['align']),
  // cars
  v_dent: R(null, [], 'dent_kit', ['car_pdr']), v_rust: R(null, ['rust_kit', 'car_paint'], 'compressor', ['scrub', 'color']), v_scratch: R(null, ['car_polish'], 'polisher', ['scrub']), v_paint: R(null, ['car_paint'], 'compressor', ['color']),
  v_light: R('headlight', [], null, ['car_lights', 'car_aim']), v_engine: R('engine_kit', [], 'lift', ['car_obd', 'car_bolts', 'car_idle']), v_gearbox: R('gearbox_kit', [], 'lift', ['car_bolts', 'car_fluid']), v_tire: R('tire', [], 'lift', ['car_lug', 'car_pump']),
  v_glass: R('windshield', [], null, ['car_seal', 'align']), v_electric: R('wiring', [], 'obd', ['car_fuse']),
  // bikes
  bk_rust: R(null, ['rust_kit'], null, ['scrub']), bk_scratch: R(null, ['polish'], null, ['scrub']), bk_brake: R('brake_pads', [], 'bike_tools', ['bk_brake']), bk_wheel: R(null, [], 'bike_tools', ['bk_true']),
  bk_battery: R('battery', [], 'bike_tools', ['bk_cells', 'solder']), bk_dent: R(null, ['putty'], 'dent_kit', ['car_pdr']),
  // instruments
  i_scratch: R(null, ['polish'], null, ['scrub']), i_neck: R(null, [], 'screwdrivers', ['in_truss', 'in_tune']), i_electro: R(null, [], 'solder', ['solder', 'in_tune']), i_crack: R(null, ['glue'], null, ['in_glue']),
  i_frets: R(null, ['polish'], null, ['scrub', 'in_tune']), i_keys: R(null, [], 'screwdrivers', ['lt_keys']),
};
// fallback for categories without a dedicated recipe (antiques, art, cards…): consumables by minigame
export function recipeFor(code) {
  if (RECIPES[code]) return RECIPES[code];
  const fix = DEFECTS[code]?.fix;
  if (!fix) return null;
  const game = { dent: 'dentfix', screen: 'align' }[fix[0]] || fix[0];
  const cons = { scrub: ['cleaner'], color: ['restore'], align: ['restore'], screws: [], solder: [], wires: [], screen: [] }[game] || ['restore'];
  const tool = { solder: 'solder', wires: 'solder', screws: 'screwdrivers', screen: 'heatgun' }[game] || null;
  return R(null, cons, tool, [game]);
}
// which defects make a part useless when the donor is dismantled
export const PART_BROKEN_BY = {
  display: ['crack', 'deadpix', 'nonorig', 'e_crack'], battery: ['battery', 'e_battery', 'bk_battery'], backglass: ['backcrack'], lens: ['camera', 'e_lens'], speaker: ['speaker'], port: ['port'], flex: ['button'],
  faceid: ['faceid'], frame: ['bent', 'e_dent', 'e_crack', 'c_scratch'], keyboard: ['e_keys'], hinge: ['e_hinge'], fan: ['e_fan', 'c_fan'], board: ['e_dead', 'e_water', 'water', 'c_dead'], drive: ['c_drive'], hdmi: ['c_hdmi'], psu: ['c_dead'], stick: ['c_drift'],
  crystal: ['t_crack'], bezel: ['t_bezel'], headlight: ['v_light'], engine_kit: ['v_engine'], gearbox_kit: ['v_gearbox'], tire: ['v_tire', 'bk_wheel'], windshield: ['v_glass'], wiring: ['v_electric'], brake_pads: ['bk_brake'],
};
