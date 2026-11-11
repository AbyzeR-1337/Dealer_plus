// Cars and bikes (fictional brand look-alikes). Price = new price in USD for the first model year.
export function buildVehicles(add) {
  // [name, priceNew, yearFrom, yearTo, body, extra]
  const car = (brand, list, def = {}) => {
    for (const [name, price, y0, y1, body, o = {}] of list) {
      add('cars', brand, name, price, y0, { body, ...def.art, ...(o.art || {}) }, {
        years: [y0, y1], colors: o.colors || def.colors, engine: o.engine || def.engine || ['1.6', '2.0'],
        trans: o.trans || def.trans || ['MT', 'AT'], drive: o.drive || def.drive || 'FWD', hp: o.hp || def.hp || 120,
        retro: o.retro ?? def.retro ?? 25, hype: o.hype || 1, rare: o.rare || 0, fixed: o.fixed, tier: o.tier || def.tier,
        floor: o.floor ?? def.floor, dep: o.dep ?? def.dep,
      });
    }
  };
  const CW = ['c_white', 'c_black', 'c_silver', 'c_asphalt', 'c_red', 'c_blue', 'c_gray', 'c_beige', 'c_cherry', 'c_navy'];
  const OLD = ['c_white', 'c_cherry', 'c_aubergine', 'c_beige', 'c_green', 'c_blue', 'c_red', 'c_sky', 'c_brown', 'c_yellow'];
  const SPORT = ['c_red', 'c_yellow', 'c_orange', 'c_black', 'c_white', 'c_lime', 'c_blue', 'c_purple', 'c_matte'];
  car('Ладда', [
    ['2101 «Копейка»', 3000, 1970, 1988, 'boxy', { colors: OLD, engine: ['1.2'], trans: ['MT'], drive: 'RWD', hp: 64, retro: 30, hype: 1.6, art: { lights: 'round' } }],
    ['2106 «Шаха»', 3500, 1976, 2006, 'boxy', { colors: OLD, engine: ['1.6'], trans: ['MT'], drive: 'RWD', hp: 75, retro: 30, hype: 1.2, art: { lights: 'round2' } }],
    ['2107 «Семёрка»', 4000, 1982, 2012, 'boxy', { colors: OLD, engine: ['1.5', '1.6'], trans: ['MT'], drive: 'RWD', hp: 75, retro: 30, art: { lights: 'square' } }],
    ['2109 «Девятка»', 4500, 1987, 2004, 'hatch', { colors: OLD, engine: ['1.5'], trans: ['MT'], hp: 70, retro: 30 }],
    ['2114', 6000, 2001, 2013, 'hatch', { colors: CW, engine: ['1.6'], trans: ['MT'], hp: 81 }],
    ['Приорра', 9000, 2007, 2018, 'sedan', { colors: CW, engine: ['1.6'], trans: ['MT', 'AMT'], hp: 98 }],
    ['Грантта', 9000, 2011, 2026, 'sedan', { colors: CW, engine: ['1.6'], trans: ['MT', 'AT'], hp: 90 }],
    ['Вестта', 13000, 2015, 2026, 'sedan', { colors: [...CW, 'c_orange'], engine: ['1.6', '1.8'], trans: ['MT', 'CVT'], hp: 106 }],
    ['Нива Легенда', 10000, 1977, 2026, 'jeep', { colors: [...OLD, 'c_khaki'], engine: ['1.7'], trans: ['MT'], drive: '4WD', hp: 83, art: { lights: 'round' } }],
  ], { tier: 'cheap', floor: 0.18 });
  car('Волго', [
    ['ГАЗ‑21', 5000, 1956, 1970, 'classic', { colors: ['c_black', 'c_sky', 'c_beige', 'c_white', 'c_green'], engine: ['2.4'], trans: ['MT'], drive: 'RWD', hp: 75, retro: 20, hype: 2.4, rare: 1, art: { lights: 'round', chrome: true } }],
    ['ГАЗ‑24', 6000, 1970, 1992, 'classic', { colors: ['c_black', 'c_white', 'c_beige', 'c_sky'], engine: ['2.4'], trans: ['MT'], drive: 'RWD', hp: 95, retro: 25, hype: 1.5, art: { lights: 'round2', chrome: true } }],
    ['31105', 9000, 2004, 2009, 'sedan', { colors: CW, engine: ['2.4'], trans: ['MT'], drive: 'RWD', hp: 137 }],
  ], { tier: 'cheap' });
  car('Москвичок', [['412', 3000, 1967, 1997, 'boxy', { colors: OLD, engine: ['1.5'], trans: ['MT'], drive: 'RWD', hp: 75, retro: 25, hype: 1.3, art: { lights: 'round2' } }]]);
  car('Запорожик', [['ЗАЗ‑968', 2000, 1971, 1994, 'micro', { colors: OLD, engine: ['1.2'], trans: ['MT'], drive: 'RWD', hp: 40, retro: 25, hype: 1.5, art: { lights: 'round' } }]]);
  car('Уазон', [
    ['«Буханка»', 9000, 1965, 2026, 'van', { colors: ['c_khaki', 'c_white', 'c_gray', 'c_green'], engine: ['2.7'], trans: ['MT'], drive: '4WD', hp: 112, hype: 1.1, art: { lights: 'round', bread: true } }],
    ['Хантер', 11000, 2003, 2023, 'jeep', { colors: ['c_khaki', 'c_black', 'c_white', 'c_green'], engine: ['2.7'], trans: ['MT'], drive: '4WD', hp: 135, art: { lights: 'round' } }],
    ['Патриот', 16000, 2005, 2026, 'suv', { colors: CW, engine: ['2.7'], trans: ['MT', 'AT'], drive: '4WD', hp: 150 }],
  ]);
  car('BMV', [
    ['3 E30', 20000, 1982, 1994, 'sedan', { colors: [...OLD, 'c_black'], engine: ['1.8', '2.5'], trans: ['MT'], drive: 'RWD', hp: 170, retro: 25, hype: 1.6, art: { lights: 'quad' } }],
    ['M3 E30', 35000, 1986, 1991, 'coupe', { colors: ['c_red', 'c_black', 'c_white', 'c_silver'], engine: ['2.3'], trans: ['MT'], drive: 'RWD', hp: 215, retro: 20, hype: 4.5, rare: 2, art: { lights: 'quad', spoiler: true } }],
    ['5 E34', 40000, 1988, 1996, 'sedan', { colors: [...CW, 'c_green'], engine: ['2.5', '3.5'], trans: ['MT', 'AT'], drive: 'RWD', hp: 192, retro: 25, hype: 1.3, art: { lights: 'quad' } }],
    ['M5 E39', 70000, 1998, 2003, 'sedan', { colors: ['c_black', 'c_silver', 'c_navy', 'c_green'], engine: ['4.9'], trans: ['MT'], drive: 'RWD', hp: 400, retro: 20, hype: 2.4, rare: 1 }],
    ['7 E38 «Бумер»', 65000, 1994, 2001, 'sedan', { colors: ['c_black', 'c_silver', 'c_navy'], engine: ['4.4', '5.4'], trans: ['AT'], drive: 'RWD', hp: 286, retro: 22, hype: 1.5 }],
    ['3 F30', 38000, 2012, 2019, 'sedan', { colors: CW, engine: ['2.0', '3.0'], trans: ['AT'], drive: 'RWD', hp: 245 }],
    ['5 G30', 55000, 2017, 2023, 'sedan', { colors: CW, engine: ['2.0', '3.0'], trans: ['AT'], drive: 'AWD', hp: 249 }],
    ['X5 E53', 50000, 2000, 2006, 'suv', { colors: CW, engine: ['3.0', '4.4'], trans: ['AT'], drive: 'AWD', hp: 231 }],
    ['X5 G05', 65000, 2018, 2026, 'suv', { colors: CW, engine: ['3.0', '4.4'], trans: ['AT'], drive: 'AWD', hp: 340 }],
    ['M4 G82', 75000, 2021, 2026, 'coupe', { colors: [...SPORT, 'c_teal'], engine: ['3.0'], trans: ['AT', 'MT'], drive: 'RWD', hp: 510, art: { spoiler: true } }],
    ['M5 F90', 105000, 2018, 2024, 'sedan', { colors: ['c_black', 'c_blue', 'c_gray', 'c_white'], engine: ['4.4'], trans: ['AT'], drive: 'AWD', hp: 625 }],
    ['i8', 140000, 2014, 2020, 'sport', { colors: ['c_white', 'c_silver', 'c_blue', 'c_black'], engine: ['1.5h'], trans: ['AT'], drive: 'AWD', hp: 374 }],
  ], { tier: 'premium', dep: 0.13 });
  car('Merzedes', [
    ['W124 E‑класс', 40000, 1985, 1995, 'sedan', { colors: [...OLD, 'c_black'], engine: ['2.0', '3.0'], trans: ['MT', 'AT'], drive: 'RWD', hp: 180, retro: 25, hype: 1.4, art: { lights: 'square' } }],
    ['190E 2.5‑16 Evo II', 80000, 1990, 1990, 'sedan', { colors: ['c_black'], engine: ['2.5'], trans: ['MT'], drive: 'RWD', hp: 235, retro: 20, hype: 6, rare: 3, art: { spoiler: true } }],
    ['W140 S600 «Кабан»', 130000, 1991, 1998, 'sedan', { colors: ['c_black', 'c_silver', 'c_navy'], engine: ['6.0'], trans: ['AT'], drive: 'RWD', hp: 394, retro: 25, hype: 1.4 }],
    ['W210 «Глазастик»', 45000, 1995, 2002, 'sedan', { colors: CW, engine: ['2.4', '3.2'], trans: ['AT'], drive: 'RWD', hp: 170, art: { lights: 'quad' } }],
    ['W211 E‑класс', 52000, 2002, 2009, 'sedan', { colors: CW, engine: ['3.5', '5.0'], trans: ['AT'], drive: 'RWD', hp: 272 }],
    ['W213 E‑класс', 60000, 2016, 2023, 'sedan', { colors: CW, engine: ['2.0', '3.0'], trans: ['AT'], drive: 'RWD', hp: 249 }],
    ['G‑Klasse W463 «Гелик»', 120000, 1990, 2026, 'jeep', { colors: ['c_black', 'c_white', 'c_khaki', 'c_silver', 'c_matte', 'c_green'], engine: ['4.0', '5.5'], trans: ['AT'], drive: '4WD', hp: 422, dep: 0.07, floor: 0.25, art: { lights: 'round', boxy: true } }],
    ['S‑класс W222', 100000, 2013, 2020, 'sedan', { colors: ['c_black', 'c_silver', 'c_white', 'c_navy'], engine: ['3.0', '4.7'], trans: ['AT'], drive: 'AWD', hp: 367 }],
    ['S‑класс W223', 120000, 2021, 2026, 'sedan', { colors: ['c_black', 'c_silver', 'c_white'], engine: ['3.0', '4.0'], trans: ['AT'], drive: 'AWD', hp: 435 }],
    ['Maybax S680', 230000, 2021, 2026, 'limo', { colors: ['c_black', 'c_silver'], engine: ['6.0'], trans: ['AT'], drive: 'AWD', hp: 612, art: { twotone: 'c_silver' } }],
    ['C63 AMG', 75000, 2015, 2021, 'sedan', { colors: ['c_white', 'c_black', 'c_gray', 'c_red'], engine: ['4.0'], trans: ['AT'], drive: 'RWD', hp: 476 }],
    ['AMG GT', 120000, 2015, 2022, 'sport', { colors: [...SPORT, 'c_silver'], engine: ['4.0'], trans: ['AT'], drive: 'RWD', hp: 522 }],
    ['Sprinterr', 40000, 2006, 2026, 'van', { colors: ['c_white', 'c_silver', 'c_black'], engine: ['2.1d'], trans: ['MT', 'AT'], drive: 'RWD', hp: 143 }],
  ], { tier: 'premium', dep: 0.12 });
  car('Audy', [
    ['80 B3 «Бочка»', 20000, 1986, 1991, 'sedan', { colors: OLD, engine: ['1.8'], trans: ['MT'], hp: 90, retro: 30 }],
    ['100 C4', 30000, 1990, 1994, 'sedan', { colors: OLD, engine: ['2.3', '2.6'], trans: ['MT', 'AT'], hp: 133, retro: 30 }],
    ['A4 B8', 35000, 2008, 2015, 'sedan', { colors: CW, engine: ['1.8', '2.0'], trans: ['CVT', 'AT'], hp: 180 }],
    ['A6 C7', 50000, 2011, 2018, 'sedan', { colors: CW, engine: ['2.0', '3.0'], trans: ['AT'], drive: 'AWD', hp: 249 }],
    ['Q7', 65000, 2015, 2026, 'suv', { colors: CW, engine: ['3.0'], trans: ['AT'], drive: 'AWD', hp: 340 }],
    ['RS6 Avant', 120000, 2019, 2026, 'wagon', { colors: ['c_gray', 'c_black', 'c_green', 'c_white', 'c_blue'], engine: ['4.0'], trans: ['AT'], drive: 'AWD', hp: 600, hype: 1.1 }],
    ['R8 V10', 170000, 2015, 2023, 'sport', { colors: [...SPORT, 'c_silver'], engine: ['5.2'], trans: ['AT'], drive: 'AWD', hp: 610 }],
    ['TT', 40000, 2006, 2023, 'coupe', { colors: [...CW, 'c_yellow'], engine: ['2.0'], trans: ['AT'], drive: 'AWD', hp: 230 }],
  ], { tier: 'premium', dep: 0.12 });
  car('Volksvagon', [
    ['Golff 2', 12000, 1983, 1992, 'hatch', { colors: OLD, engine: ['1.6', '1.8'], trans: ['MT'], hp: 90, retro: 30, hype: 1.2 }],
    ['Golff 4', 18000, 1997, 2004, 'hatch', { colors: CW, engine: ['1.6'], trans: ['MT', 'AT'], hp: 100 }],
    ['Golff 7 GTI', 32000, 2013, 2020, 'hatch', { colors: ['c_red', 'c_white', 'c_black', 'c_gray'], engine: ['2.0'], trans: ['DSG', 'MT'], hp: 230 }],
    ['Golff 8 R', 46000, 2021, 2026, 'hatch', { colors: ['c_blue', 'c_white', 'c_black'], engine: ['2.0'], trans: ['DSG'], drive: 'AWD', hp: 320 }],
    ['Passot B3', 16000, 1988, 1993, 'sedan', { colors: OLD, engine: ['1.8', '2.0'], trans: ['MT'], hp: 90, retro: 30 }],
    ['Passot B5', 24000, 1996, 2005, 'sedan', { colors: CW, engine: ['1.8', '1.9d'], trans: ['MT', 'AT'], hp: 125 }],
    ['Passot B8', 32000, 2014, 2023, 'wagon', { colors: CW, engine: ['1.4', '2.0'], trans: ['DSG'], hp: 150 }],
    ['Polo Sedan', 14000, 2010, 2020, 'sedan', { colors: CW, engine: ['1.6'], trans: ['MT', 'AT'], hp: 110 }],
    ['Tiguon', 30000, 2016, 2026, 'suv', { colors: CW, engine: ['1.4', '2.0'], trans: ['DSG'], drive: 'AWD', hp: 180 }],
    ['Touaregg', 60000, 2010, 2026, 'suv', { colors: CW, engine: ['3.0'], trans: ['AT'], drive: 'AWD', hp: 249 }],
    ['Transporterr T4', 25000, 1990, 2003, 'van', { colors: ['c_white', 'c_red', 'c_blue', 'c_gray'], engine: ['2.5', '1.9d'], trans: ['MT'], hp: 102, hype: 1.2 }],
    ['Käfer «Жук»', 3000, 1960, 1979, 'beetle', { colors: [...OLD, 'c_yellow'], engine: ['1.2', '1.6'], trans: ['MT'], drive: 'RWD', hp: 50, retro: 20, hype: 3.5, art: { lights: 'round' } }],
  ], { tier: 'mid' });
  car('Toyoda', [
    ['Kamri 40', 25000, 2006, 2011, 'sedan', { colors: CW, engine: ['2.4', '3.5'], trans: ['AT'], hp: 167 }],
    ['Kamri 55', 28000, 2014, 2017, 'sedan', { colors: CW, engine: ['2.5', '3.5'], trans: ['AT'], hp: 181 }],
    ['Kamri 70', 30000, 2018, 2024, 'sedan', { colors: [...CW, 'c_snow'], engine: ['2.5', '3.5'], trans: ['AT'], hp: 200 }],
    ['Corolo', 20000, 2013, 2026, 'sedan', { colors: CW, engine: ['1.6', '1.8'], trans: ['CVT', 'MT'], hp: 122 }],
    ['Land Kruzer 80', 40000, 1990, 1997, 'jeep', { colors: ['c_white', 'c_green', 'c_beige', 'c_gray'], engine: ['4.2d', '4.5'], trans: ['MT', 'AT'], drive: '4WD', hp: 205, retro: 25, hype: 1.6 }],
    ['Land Kruzer 100', 55000, 1998, 2007, 'suv', { colors: CW, engine: ['4.2d', '4.7'], trans: ['AT'], drive: '4WD', hp: 235, floor: 0.2 }],
    ['Land Kruzer 200', 80000, 2007, 2021, 'suv', { colors: ['c_black', 'c_white', 'c_snow', 'c_silver', 'c_beige'], engine: ['4.5d', '4.6'], trans: ['AT'], drive: '4WD', hp: 309, dep: 0.07, floor: 0.25 }],
    ['Land Kruzer 300', 95000, 2021, 2026, 'suv', { colors: ['c_black', 'c_white', 'c_snow', 'c_gray'], engine: ['3.3d', '3.5'], trans: ['AT'], drive: '4WD', hp: 415, dep: 0.05 }],
    ['Prado 150', 50000, 2009, 2023, 'suv', { colors: CW, engine: ['2.8d', '4.0'], trans: ['AT'], drive: '4WD', hp: 177, dep: 0.07 }],
    ['RAV‑5', 30000, 2019, 2026, 'suv', { colors: CW, engine: ['2.0', '2.5'], trans: ['CVT', 'AT'], drive: 'AWD', hp: 199 }],
    ['Supro A80', 45000, 1993, 2002, 'sport', { colors: ['c_red', 'c_black', 'c_white', 'c_silver', 'c_orange'], engine: ['3.0'], trans: ['MT', 'AT'], drive: 'RWD', hp: 330, retro: 20, hype: 3.2, rare: 2, art: { spoiler: true } }],
    ['Supro A90', 55000, 2019, 2026, 'sport', { colors: SPORT, engine: ['3.0'], trans: ['AT', 'MT'], drive: 'RWD', hp: 387 }],
    ['Mark II JZX100', 30000, 1996, 2000, 'sedan', { colors: ['c_white', 'c_silver', 'c_black'], engine: ['2.5'], trans: ['AT', 'MT'], drive: 'RWD', hp: 280, retro: 20, hype: 1.6 }],
    ['Chaserr JZX100', 32000, 1996, 2001, 'sedan', { colors: ['c_white', 'c_silver', 'c_black'], engine: ['2.5'], trans: ['MT'], drive: 'RWD', hp: 280, retro: 20, hype: 2 }],
    ['Hilox', 35000, 2015, 2026, 'pickup', { colors: CW, engine: ['2.8d'], trans: ['MT', 'AT'], drive: '4WD', hp: 177, dep: 0.07 }],
    ['Prius', 25000, 2009, 2022, 'hatch', { colors: CW, engine: ['1.8h'], trans: ['CVT'], hp: 122 }],
  ], { tier: 'mid', dep: 0.09, floor: 0.12 });
  car('Nissen', [
    ['Skylane GT‑R R34', 60000, 1999, 2002, 'coupe', { colors: ['c_blue', 'c_silver', 'c_black', 'c_white'], engine: ['2.6'], trans: ['MT'], drive: 'AWD', hp: 280, retro: 20, hype: 6, rare: 3, art: { spoiler: true, lights: 'round2' } }],
    ['GT‑R R35', 100000, 2008, 2024, 'coupe', { colors: [...SPORT, 'c_silver'], engine: ['3.8'], trans: ['AT'], drive: 'AWD', hp: 565, art: { spoiler: true } }],
    ['Silvia S15', 25000, 1999, 2002, 'coupe', { colors: ['c_white', 'c_yellow', 'c_silver', 'c_blue'], engine: ['2.0'], trans: ['MT'], drive: 'RWD', hp: 250, retro: 20, hype: 2.4, art: { spoiler: true } }],
    ['350Z', 30000, 2003, 2009, 'coupe', { colors: [...SPORT, 'c_silver'], engine: ['3.5'], trans: ['MT', 'AT'], drive: 'RWD', hp: 300 }],
    ['Patroll Y61', 45000, 1997, 2010, 'jeep', { colors: CW, engine: ['4.8', '3.0d'], trans: ['MT', 'AT'], drive: '4WD', hp: 245, floor: 0.2 }],
    ['X‑Trial', 25000, 2014, 2022, 'suv', { colors: CW, engine: ['2.0', '2.5'], trans: ['CVT'], drive: 'AWD', hp: 144 }],
    ['Almerra', 13000, 2012, 2018, 'sedan', { colors: CW, engine: ['1.6'], trans: ['MT', 'AT'], hp: 102 }],
  ], { tier: 'mid' });
  car('Hondo', [
    ['Civik Type R', 45000, 2017, 2026, 'hatch', { colors: ['c_white', 'c_red', 'c_black', 'c_blue', 'c_gray'], engine: ['2.0'], trans: ['MT'], hp: 320, art: { spoiler: true } }],
    ['Akkord', 27000, 2008, 2022, 'sedan', { colors: CW, engine: ['2.4'], trans: ['AT'], hp: 180 }],
    ['CR‑V', 30000, 2012, 2026, 'suv', { colors: CW, engine: ['2.0', '2.4'], trans: ['CVT'], drive: 'AWD', hp: 186 }],
    ['NSX (1990)', 60000, 1990, 2005, 'sport', { colors: ['c_red', 'c_black', 'c_silver', 'c_white'], engine: ['3.0'], trans: ['MT'], drive: 'RWD', hp: 274, retro: 20, hype: 2.6, rare: 2 }],
  ], { tier: 'mid' });
  car('Mazdo', [
    ['RX‑7 FD', 35000, 1992, 2002, 'sport', { colors: ['c_red', 'c_yellow', 'c_black', 'c_white', 'c_blue'], engine: ['1.3R'], trans: ['MT'], drive: 'RWD', hp: 255, retro: 20, hype: 2.4, rare: 1 }],
    ['RX‑8', 27000, 2003, 2012, 'coupe', { colors: SPORT, engine: ['1.3R'], trans: ['MT'], drive: 'RWD', hp: 231 }],
    ['6', 25000, 2012, 2023, 'sedan', { colors: [...CW, 'c_red'], engine: ['2.0', '2.5'], trans: ['AT'], hp: 192 }],
    ['CX‑5', 28000, 2012, 2026, 'suv', { colors: [...CW, 'c_red'], engine: ['2.0', '2.5'], trans: ['AT'], drive: 'AWD', hp: 194 }],
    ['MX‑5 Miato', 27000, 1989, 2026, 'roadster', { colors: SPORT, engine: ['1.6', '2.0'], trans: ['MT'], drive: 'RWD', hp: 160, art: { lights: 'pop' } }],
  ], { tier: 'mid' });
  car('Mitsubishy', [
    ['Lancer Evo IX', 35000, 2005, 2007, 'sedan', { colors: ['c_white', 'c_red', 'c_black', 'c_silver'], engine: ['2.0'], trans: ['MT'], drive: 'AWD', hp: 280, retro: 18, hype: 2, art: { spoiler: true } }],
    ['Pajerro', 35000, 2006, 2021, 'suv', { colors: CW, engine: ['3.0', '3.2d'], trans: ['AT'], drive: '4WD', hp: 178 }],
    ['Outlendr', 27000, 2012, 2026, 'suv', { colors: CW, engine: ['2.0', '2.4'], trans: ['CVT'], drive: 'AWD', hp: 167 }],
  ], { tier: 'mid' });
  car('Subaro', [
    ['Impreza WRX STI', 35000, 2001, 2021, 'sedan', { colors: ['c_blue', 'c_white', 'c_black', 'c_silver'], engine: ['2.5'], trans: ['MT'], drive: 'AWD', hp: 300, hype: 1.2, art: { spoiler: true, gold: true } }],
    ['Forrester', 28000, 2008, 2026, 'suv', { colors: CW, engine: ['2.0', '2.5'], trans: ['CVT'], drive: 'AWD', hp: 182 }],
    ['Outbek', 30000, 2009, 2026, 'wagon', { colors: CW, engine: ['2.5'], trans: ['CVT'], drive: 'AWD', hp: 175 }],
  ], { tier: 'mid' });
  car('Hyondai', [
    ['Solarix', 12000, 2010, 2022, 'sedan', { colors: [...CW, 'c_orange'], engine: ['1.4', '1.6'], trans: ['MT', 'AT'], hp: 123 }],
    ['Creto', 17000, 2016, 2026, 'suv', { colors: [...CW, 'c_orange'], engine: ['1.6', '2.0'], trans: ['AT'], hp: 123 }],
    ['Tusan', 25000, 2015, 2026, 'suv', { colors: CW, engine: ['2.0', '2.5'], trans: ['AT'], drive: 'AWD', hp: 150 }],
    ['Santo Fe', 32000, 2012, 2026, 'suv', { colors: CW, engine: ['2.2d', '2.5'], trans: ['AT'], drive: 'AWD', hp: 200 }],
    ['Elantro', 18000, 2016, 2026, 'sedan', { colors: CW, engine: ['1.6', '2.0'], trans: ['AT'], hp: 150 }],
  ], { tier: 'cheap' });
  car('Kio', [
    ['Rioo', 12000, 2011, 2023, 'sedan', { colors: [...CW, 'c_orange'], engine: ['1.4', '1.6'], trans: ['MT', 'AT'], hp: 123 }],
    ['Sportedge', 25000, 2010, 2026, 'suv', { colors: CW, engine: ['2.0', '2.4'], trans: ['AT'], drive: 'AWD', hp: 150 }],
    ['K5', 25000, 2020, 2026, 'sedan', { colors: [...CW, 'c_red'], engine: ['2.0', '2.5'], trans: ['AT'], hp: 194 }],
    ['Stingr GT', 45000, 2017, 2023, 'sport', { colors: ['c_red', 'c_blue', 'c_black', 'c_white'], engine: ['3.3'], trans: ['AT'], drive: 'AWD', hp: 370 }],
  ], { tier: 'cheap' });
  car('Fard', [
    ['Focas 2', 16000, 2005, 2011, 'hatch', { colors: CW, engine: ['1.6', '1.8'], trans: ['MT', 'AT'], hp: 100 }],
    ['Mustank (1967)', 3000, 1965, 1970, 'muscle', { colors: ['c_red', 'c_blue', 'c_black', 'c_green', 'c_yellow'], engine: ['4.7'], trans: ['MT'], drive: 'RWD', hp: 271, retro: 20, hype: 15, rare: 2, art: { stripes: true } }],
    ['Mustank GT', 45000, 2015, 2026, 'muscle', { colors: SPORT, engine: ['5.0'], trans: ['MT', 'AT'], drive: 'RWD', hp: 450, art: { stripes: true } }],
    ['F‑160 Raptorr', 70000, 2017, 2026, 'pickup', { colors: ['c_black', 'c_white', 'c_blue', 'c_gray', 'c_orange'], engine: ['3.5'], trans: ['AT'], drive: '4WD', hp: 450 }],
    ['Bronko', 45000, 2021, 2026, 'jeep', { colors: ['c_orange', 'c_blue', 'c_white', 'c_black', 'c_khaki'], engine: ['2.7'], trans: ['AT', 'MT'], drive: '4WD', hp: 330, art: { lights: 'round' } }],
    ['Transitt', 35000, 2014, 2026, 'van', { colors: ['c_white', 'c_silver', 'c_blue'], engine: ['2.2d'], trans: ['MT'], drive: 'RWD', hp: 130 }],
  ], { tier: 'mid' });
  car('Chevi', [
    ['Kamaro SS', 40000, 2016, 2024, 'muscle', { colors: SPORT, engine: ['6.2'], trans: ['AT', 'MT'], drive: 'RWD', hp: 455, art: { stripes: true } }],
    ['Korvetta C2 Stingray', 5000, 1963, 1967, 'classic', { colors: ['c_red', 'c_silver', 'c_blue', 'c_white'], engine: ['5.4'], trans: ['MT'], drive: 'RWD', hp: 300, retro: 20, hype: 25, rare: 3, art: { chrome: true, low: true } }],
    ['Korvetta C8', 70000, 2020, 2026, 'sport', { colors: SPORT, engine: ['6.2'], trans: ['AT'], drive: 'RWD', hp: 495 }],
    ['Impalla 1964', 3000, 1964, 1964, 'classic', { colors: ['c_red', 'c_black', 'c_teal', 'c_white', 'c_purple'], engine: ['5.4'], trans: ['AT'], drive: 'RWD', hp: 250, retro: 20, hype: 15, rare: 2, art: { chrome: true, low: true, long: true } }],
    ['Tahoo', 60000, 2015, 2026, 'suv', { colors: ['c_black', 'c_white', 'c_silver', 'c_gray'], engine: ['5.3', '6.2'], trans: ['AT'], drive: '4WD', hp: 355 }],
    ['Нива (Chevi)', 12000, 2002, 2020, 'suv', { colors: CW, engine: ['1.7'], trans: ['MT'], drive: '4WD', hp: 80 }],
  ], { tier: 'mid' });
  car('Dodje', [
    ['Charjer 1969', 4000, 1968, 1970, 'muscle', { colors: ['c_black', 'c_orange', 'c_red', 'c_white'], engine: ['7.2'], trans: ['MT', 'AT'], drive: 'RWD', hp: 375, retro: 20, hype: 22, rare: 3 }],
    ['Challengerr SRT Hellcat', 65000, 2015, 2023, 'muscle', { colors: [...SPORT, 'c_purple'], engine: ['6.2'], trans: ['AT', 'MT'], drive: 'RWD', hp: 717, art: { stripes: true } }],
    ['Rem 1500 TRX', 80000, 2021, 2024, 'pickup', { colors: ['c_black', 'c_white', 'c_red', 'c_gray'], engine: ['6.2'], trans: ['AT'], drive: '4WD', hp: 702 }],
  ], { tier: 'mid' });
  car('Tesler', [
    ['Model 3', 42000, 2017, 2026, 'sedan', { colors: ['c_white', 'c_black', 'c_gray', 'c_red', 'c_blue'], engine: ['EV'], trans: ['EV'], drive: 'AWD', hp: 480, art: { ev: true } }],
    ['Model Y', 45000, 2020, 2026, 'suv', { colors: ['c_white', 'c_black', 'c_gray', 'c_red', 'c_blue'], engine: ['EV'], trans: ['EV'], drive: 'AWD', hp: 450, art: { ev: true } }],
    ['Model S Plaid', 90000, 2021, 2026, 'sedan', { colors: ['c_white', 'c_black', 'c_gray', 'c_red'], engine: ['EV'], trans: ['EV'], drive: 'AWD', hp: 1020, art: { ev: true } }],
    ['Cybertrak', 80000, 2023, 2026, 'cyber', { colors: ['c_silver'], engine: ['EV'], trans: ['EV'], drive: 'AWD', hp: 845, hype: 1.1 }],
  ], { tier: 'premium', dep: 0.16 });
  car('Porshe', [
    ['911 (964)', 75000, 1989, 1994, 'sport911', { colors: ['c_red', 'c_black', 'c_silver', 'c_white', 'c_blue', 'c_green'], engine: ['3.6'], trans: ['MT'], drive: 'RWD', hp: 250, retro: 20, hype: 2.4, rare: 1 }],
    ['911 (993)', 80000, 1994, 1998, 'sport911', { colors: ['c_red', 'c_black', 'c_silver', 'c_yellow', 'c_blue'], engine: ['3.6'], trans: ['MT'], drive: 'RWD', hp: 285, retro: 20, hype: 2.8, rare: 1 }],
    ['911 Turbo S (992)', 230000, 2020, 2026, 'sport911', { colors: ['c_gray', 'c_black', 'c_white', 'c_yellow', 'c_teal'], engine: ['3.8'], trans: ['PDK'], drive: 'AWD', hp: 650, dep: 0.07 }],
    ['911 GT3 RS', 240000, 2022, 2026, 'sport911', { colors: ['c_lime', 'c_white', 'c_orange', 'c_teal'], engine: ['4.0'], trans: ['PDK'], drive: 'RWD', hp: 525, dep: 0.02, hype: 1.2, art: { wing: true } }],
    ['Cayenn', 80000, 2010, 2026, 'suv', { colors: CW, engine: ['3.0', '4.0'], trans: ['AT'], drive: 'AWD', hp: 340 }],
    ['Panamerra', 100000, 2009, 2026, 'sedan', { colors: CW, engine: ['2.9', '4.0'], trans: ['PDK'], drive: 'AWD', hp: 440 }],
    ['Taikan', 100000, 2020, 2026, 'sedan', { colors: ['c_white', 'c_black', 'c_gray', 'c_teal', 'c_pink'], engine: ['EV'], trans: ['EV'], drive: 'AWD', hp: 600, dep: 0.18, art: { ev: true } }],
  ], { tier: 'lux', dep: 0.09 });
  car('Ferrara', [
    ['Testarossa', 90000, 1984, 1991, 'super', { colors: ['c_red', 'c_black', 'c_white', 'c_yellow'], engine: ['4.9'], trans: ['MT'], drive: 'RWD', hp: 390, retro: 20, hype: 2.2, rare: 2, art: { strakes: true } }],
    ['F40', 400000, 1987, 1992, 'super', { colors: ['c_red'], engine: ['2.9'], trans: ['MT'], drive: 'RWD', hp: 478, retro: 15, hype: 7, rare: 4, art: { wing: true } }],
    ['488 GTB', 250000, 2015, 2019, 'super', { colors: ['c_red', 'c_yellow', 'c_black', 'c_white', 'c_blue'], engine: ['3.9'], trans: ['AT'], drive: 'RWD', hp: 670 }],
    ['SF90 Stradale', 500000, 2019, 2026, 'super', { colors: ['c_red', 'c_yellow', 'c_black', 'c_white'], engine: ['4.0h'], trans: ['AT'], drive: 'AWD', hp: 1000, dep: 0.06 }],
    ['Roma', 220000, 2020, 2026, 'coupe', { colors: ['c_red', 'c_gray', 'c_white', 'c_blue'], engine: ['3.9'], trans: ['AT'], drive: 'RWD', hp: 620 }],
  ], { tier: 'lux', dep: 0.08, floor: 0.35 });
  car('Lamborjini', [
    ['Countash', 100000, 1974, 1990, 'super', { colors: ['c_white', 'c_red', 'c_yellow', 'c_black'], engine: ['5.2'], trans: ['MT'], drive: 'RWD', hp: 455, retro: 15, hype: 4, rare: 3, art: { wing: true, wedge: true } }],
    ['Diablo', 240000, 1990, 2001, 'super', { colors: ['c_purple', 'c_yellow', 'c_red', 'c_black'], engine: ['5.7'], trans: ['MT'], drive: 'AWD', hp: 492, retro: 20, hype: 1.6, rare: 2, art: { wedge: true } }],
    ['Huracann', 240000, 2014, 2024, 'super', { colors: ['c_lime', 'c_orange', 'c_yellow', 'c_white', 'c_black', 'c_blue'], engine: ['5.2'], trans: ['AT'], drive: 'AWD', hp: 640, art: { wedge: true } }],
    ['Aventadorr SVJ', 520000, 2018, 2022, 'super', { colors: ['c_lime', 'c_orange', 'c_matte', 'c_white'], engine: ['6.5'], trans: ['AT'], drive: 'AWD', hp: 770, dep: 0.03, art: { wedge: true, wing: true } }],
    ['Urrus', 230000, 2018, 2026, 'suv', { colors: ['c_yellow', 'c_orange', 'c_black', 'c_white', 'c_lime'], engine: ['4.0'], trans: ['AT'], drive: 'AWD', hp: 650 }],
  ], { tier: 'lux', dep: 0.08, floor: 0.35 });
  car('Bentlee', [
    ['Continental GT', 230000, 2018, 2026, 'coupe', { colors: ['c_black', 'c_green', 'c_white', 'c_silver', 'c_navy'], engine: ['6.0', '4.0'], trans: ['AT'], drive: 'AWD', hp: 635 }],
    ['Bentayga', 200000, 2016, 2026, 'suv', { colors: ['c_black', 'c_white', 'c_green', 'c_silver'], engine: ['4.0', '6.0'], trans: ['AT'], drive: 'AWD', hp: 550 }],
  ], { tier: 'lux', dep: 0.14 });
  car('Rols‑Roys', [
    ['Phantomm', 460000, 2017, 2026, 'limo', { colors: ['c_black', 'c_white', 'c_silver', 'c_navy'], engine: ['6.75'], trans: ['AT'], drive: 'RWD', hp: 563, art: { twotone: 'c_black' } }],
    ['Cullinann', 340000, 2018, 2026, 'suv', { colors: ['c_black', 'c_white', 'c_silver'], engine: ['6.75'], trans: ['AT'], drive: 'AWD', hp: 563 }],
  ], { tier: 'lux', dep: 0.12 });
  car('Range Rovar', [
    ['Sport', 90000, 2013, 2026, 'suv', { colors: ['c_black', 'c_white', 'c_gray', 'c_blue', 'c_green'], engine: ['3.0', '4.4'], trans: ['AT'], drive: 'AWD', hp: 400 }],
    ['Vogue', 120000, 2012, 2026, 'suv', { colors: ['c_black', 'c_white', 'c_silver', 'c_gray'], engine: ['4.4', '3.0d'], trans: ['AT'], drive: 'AWD', hp: 530 }],
    ['Defendr 110', 70000, 2020, 2026, 'jeep', { colors: ['c_khaki', 'c_gray', 'c_white', 'c_black', 'c_green'], engine: ['3.0'], trans: ['AT'], drive: '4WD', hp: 400, art: { lights: 'round' } }],
  ], { tier: 'premium', dep: 0.13 });
  car('Lexsus', [
    ['LX 570', 90000, 2008, 2021, 'suv', { colors: ['c_black', 'c_white', 'c_snow', 'c_silver'], engine: ['5.7'], trans: ['AT'], drive: '4WD', hp: 367, dep: 0.07, floor: 0.25 }],
    ['RX 350', 50000, 2015, 2026, 'suv', { colors: CW, engine: ['3.5', '2.4'], trans: ['AT'], drive: 'AWD', hp: 300 }],
    ['LFA', 375000, 2010, 2012, 'super', { colors: ['c_white', 'c_orange', 'c_black', 'c_yellow'], engine: ['4.8'], trans: ['AT'], drive: 'RWD', hp: 560, hype: 3.5, rare: 3, dep: 0, fixed: true, art: { wing: true } }],
  ], { tier: 'premium', dep: 0.1 });
  car('Gilly', [['Monjaro', 40000, 2022, 2026, 'suv', { colors: CW, engine: ['2.0'], trans: ['AT'], drive: 'AWD', hp: 238 }], ['Coolrey', 20000, 2019, 2026, 'suv', { colors: [...CW, 'c_orange'], engine: ['1.5'], trans: ['DCT'], hp: 147 }]], { tier: 'cheap', dep: 0.15 });
  car('Cheri', [['Tiggo 7 Pro', 22000, 2020, 2026, 'suv', { colors: CW, engine: ['1.5'], trans: ['CVT'], hp: 147 }], ['Tiggo 8 Pro Max', 30000, 2022, 2026, 'suv', { colors: CW, engine: ['2.0'], trans: ['DCT'], drive: 'AWD', hp: 197 }]], { tier: 'cheap', dep: 0.16 });
  car('Havall', [['Jolion', 20000, 2021, 2026, 'suv', { colors: [...CW, 'c_teal'], engine: ['1.5'], trans: ['DCT'], hp: 143 }], ['F7', 25000, 2019, 2026, 'suv', { colors: CW, engine: ['2.0'], trans: ['DCT'], drive: 'AWD', hp: 190 }]], { tier: 'cheap', dep: 0.15 });
  car('Lee Auto', [['L9', 60000, 2022, 2026, 'suv', { colors: ['c_black', 'c_white', 'c_gray', 'c_green'], engine: ['1.5h'], trans: ['EV'], drive: 'AWD', hp: 449, art: { ev: true } }]], { tier: 'premium', dep: 0.16 });
  car('Zeeker', [['001', 55000, 2021, 2026, 'wagon', { colors: ['c_black', 'c_white', 'c_gray', 'c_teal'], engine: ['EV'], trans: ['EV'], drive: 'AWD', hp: 544, art: { ev: true } }]], { tier: 'premium', dep: 0.16 });
  car('BYT', [['Han', 40000, 2020, 2026, 'sedan', { colors: ['c_black', 'c_white', 'c_red', 'c_blue'], engine: ['EV'], trans: ['EV'], drive: 'AWD', hp: 517, art: { ev: true } }], ['Seal', 35000, 2022, 2026, 'sedan', { colors: ['c_white', 'c_black', 'c_blue', 'c_gray'], engine: ['EV'], trans: ['EV'], drive: 'RWD', hp: 313, art: { ev: true } }]], { tier: 'mid', dep: 0.16 });
  car('Deo', [['Matizz', 6000, 1998, 2015, 'micro', { colors: [...CW, 'c_yellow', 'c_lime'], engine: ['0.8'], trans: ['MT'], hp: 51 }], ['Nexxia', 8000, 1995, 2016, 'sedan', { colors: CW, engine: ['1.5', '1.6'], trans: ['MT'], hp: 85 }]], { tier: 'cheap' });
  car('Reno', [['Logann', 10000, 2005, 2022, 'sedan', { colors: CW, engine: ['1.6'], trans: ['MT', 'AT'], hp: 102 }], ['Dustter', 15000, 2010, 2026, 'suv', { colors: [...CW, 'c_orange'], engine: ['1.6', '2.0'], trans: ['MT', 'AT'], drive: 'AWD', hp: 114 }]], { tier: 'cheap' });
  car('Shkoda', [['Octavvia', 22000, 2013, 2026, 'sedan', { colors: CW, engine: ['1.4', '1.8'], trans: ['DSG', 'MT'], hp: 150 }], ['Rapidd', 14000, 2014, 2022, 'sedan', { colors: CW, engine: ['1.6'], trans: ['MT', 'AT'], hp: 110 }]], { tier: 'cheap' });
  car('Opal', [['Astra H', 16000, 2004, 2014, 'hatch', { colors: CW, engine: ['1.6', '1.8'], trans: ['MT', 'AT'], hp: 115 }]], { tier: 'cheap' });
  car('Pejo', [['206', 12000, 1998, 2012, 'hatch', { colors: [...CW, 'c_yellow'], engine: ['1.4'], trans: ['MT'], hp: 75 }], ['308', 20000, 2007, 2021, 'hatch', { colors: CW, engine: ['1.6'], trans: ['AT'], hp: 120 }]], { tier: 'cheap' });
  car('Fiet', [['500', 16000, 2007, 2024, 'micro', { colors: ['c_white', 'c_red', 'c_sky', 'c_yellow', 'c_black', 'c_pink'], engine: ['1.2'], trans: ['MT', 'AMT'], hp: 69, art: { lights: 'round' } }]], { tier: 'cheap' });
  car('Mimi', [['Cooper S', 28000, 2014, 2026, 'micro', { colors: ['c_green', 'c_red', 'c_black', 'c_white', 'c_yellow', 'c_sky'], engine: ['2.0'], trans: ['AT', 'MT'], hp: 192, art: { lights: 'round', roofc: true } }]], { tier: 'mid' });
  car('Smarty', [['Fortwo', 15000, 2007, 2024, 'micro', { colors: ['c_white', 'c_black', 'c_red', 'c_lime', 'c_blue'], engine: ['1.0'], trans: ['AMT'], drive: 'RWD', hp: 71, art: { tiny: true } }]], { tier: 'cheap' });
  car('Valvo', [['240 универсал', 18000, 1974, 1993, 'wagon', { colors: OLD, engine: ['2.3'], trans: ['MT', 'AT'], drive: 'RWD', hp: 114, retro: 25, hype: 1.6, art: { lights: 'square' } }], ['XC90', 55000, 2015, 2026, 'suv', { colors: CW, engine: ['2.0'], trans: ['AT'], drive: 'AWD', hp: 249 }]], { tier: 'mid' });

  // ------------------------------------------------------------------ BIKES / MOTO / SCOOTERS
  const bike = (brand, name, price, year, t, colors, o = {}) => add('bikes', brand, name, price, year, { t }, { colors, vars: [['', 1]], ...o });
  bike('Стелс', 'Navigator 500', 180, 2022, 'mtb', ['black', 'red', 'blue', 'green']);
  bike('Gaint', 'Talon 2', 750, 2023, 'mtb', ['black', 'grey', 'blue']);
  bike('Speshalized', 'S‑Works Tarmac SL8', 12000, 2024, 'road', ['black', 'white', 'red'], { dep: 0.12 });
  bike('Trekk', 'Domane SL 6', 4500, 2023, 'road', ['navy', 'black', 'red']);
  bike('Cannondal', 'Trail 7', 750, 2023, 'mtb', ['green', 'grey', 'orange']);
  bike('Brompten', 'C Line (складной)', 1700, 2023, 'fold', ['black', 'red', 'green', 'white'], { dep: 0.05 });
  bike('Mongus', 'BMX Legion', 350, 2023, 'bmx', ['black', 'red', 'blue', 'yellow']);
  bike('Кама', 'Складной велосипед (СССР)', 60, 1985, 'fold', ['red', 'blue', 'yellow'], { retro: 25, hype: 1.3 });
  bike('Аист', 'Городской (СССР)', 50, 1980, 'city', ['black', 'green', 'red'], { retro: 25 });
  bike('Xiaomo', 'Electric Scooter 4 Pro', 799, 2023, 'scooter', ['black', 'grey']);
  bike('Ninebott', 'Max G30', 799, 2021, 'scooter', ['black', 'grey']);
  bike('Кугу', 'Kirin M4 Pro', 600, 2022, 'scooter', ['black']);
  bike('Hondo', 'Dio (скутер)', 1500, 2015, 'moped', ['red', 'black', 'white', 'blue']);
  bike('Vesppa', 'Primavera 125', 4500, 2022, 'vespa', ['sky', 'red', 'cream', 'black', 'mint']);
  bike('Yamahha', 'YZF‑R1', 18000, 2020, 'sport', ['blue', 'black', 'white']);
  bike('Yamahha', 'MT‑07', 8000, 2021, 'naked', ['blue', 'black', 'grey']);
  bike('Hondo', 'CBR600RR', 12000, 2019, 'sport', ['red', 'black', 'white']);
  bike('Kawasakki', 'Ninja ZX‑10R', 17000, 2021, 'sport', ['lime', 'black']);
  bike('Duccati', 'Panigale V4', 25000, 2022, 'sport', ['red', 'black']);
  bike('Duccati', 'Monsterr', 13000, 2021, 'naked', ['red', 'black', 'grey']);
  bike('Harlee‑Davidsan', 'Fat Boy', 21000, 2020, 'cruiser', ['black', 'grey', 'red']);
  bike('Harlee‑Davidsan', 'Sportster Iron 883', 10000, 2018, 'cruiser', ['black', 'orange', 'grey']);
  bike('BMV', 'R 1250 GS', 20000, 2021, 'adv', ['white', 'black', 'blue']);
  bike('Уралл', 'с коляской', 15000, 2019, 'sidecar', ['khaki', 'black', 'navy'], { hype: 1.1 });
  bike('Ява', '350/634 (ЧССР)', 900, 1980, 'classic', ['red', 'black', 'blue'], { retro: 25, hype: 2.2, fixed: true, price: 1600 });
  bike('Минскк', 'М‑125', 400, 1985, 'classic', ['red', 'blue', 'black'], { retro: 25, hype: 1.5, fixed: true, price: 450 });
  bike('Восход', '3М', 500, 1988, 'classic', ['red', 'blue'], { retro: 25, fixed: true, price: 500 });
}
