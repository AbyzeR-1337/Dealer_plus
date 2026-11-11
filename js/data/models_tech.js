// Phones, electronics, consoles, accessories (fictional brands).
const GB = (arr) => arr.map((g, i) => [g >= 1024 ? `${g / 1024} ТБ` : `${g} ГБ`, 1 + i * 0.11]);
const storFor = (year, pro) => year <= 2010 ? [8, 16, 32] : year <= 2015 ? [16, 64, 128] : year <= 2019 ? [64, 128, 256] : year <= 2022 ? [128, 256, 512] : pro ? [256, 512, 1024] : [128, 256, 512];

export function buildTech(add) {
  // ------------------------------------------------------------------ PHONES
  const pear = [
    ['2G', 2007, 499, 'bezel', 'p1old', ['silver'], { retro: 12, hype: 1.4, rare: 2 }],
    ['3GS', 2009, 599, 'bezel', 'p1old', ['black', 'white'], { retro: 12 }],
    ['4', 2010, 599, 'bezel', 'p1', ['black', 'white'], { retro: 12 }],
    ['5s', 2013, 649, 'bezel', 'p1', ['spacegray', 'silver', 'gold']],
    ['6', 2014, 649, 'bezel', 'p1', ['spacegray', 'silver', 'gold']],
    ['6s', 2015, 649, 'bezel', 'p1', ['spacegray', 'silver', 'gold', 'rosegold']],
    ['SE', 2016, 399, 'bezel', 'p1', ['spacegray', 'silver', 'gold', 'rosegold']],
    ['7', 2016, 649, 'bezel', 'p1', ['jetblack', 'black', 'silver', 'gold', 'rosegold', 'red']],
    ['7 Plus', 2016, 769, 'bezel', 'p2h', ['jetblack', 'black', 'silver', 'gold', 'rosegold', 'red']],
    ['8', 2017, 699, 'bezel', 'p1', ['spacegray', 'silver', 'gold', 'red']],
    ['8 Plus', 2017, 799, 'bezel', 'p2v', ['spacegray', 'silver', 'gold', 'red']],
    ['X', 2017, 999, 'notch', 'p2v', ['spacegray', 'silver']],
    ['XR', 2018, 749, 'notch', 'p1', ['black', 'white', 'red', 'yellow', 'blue', 'coral']],
    ['XS', 2018, 999, 'notch', 'p2v', ['spacegray', 'silver', 'gold']],
    ['XS Max', 2018, 1099, 'notch', 'p2v', ['spacegray', 'silver', 'gold']],
    ['11', 2019, 699, 'notch', 'p2sq', ['black', 'white', 'red', 'yellow', 'green', 'purple']],
    ['11 Pro', 2019, 999, 'notch', 'p3', ['spacegray', 'silver', 'gold', 'midnightgreen']],
    ['11 Pro Max', 2019, 1099, 'notch', 'p3', ['spacegray', 'silver', 'gold', 'midnightgreen']],
    ['SE 2', 2020, 399, 'bezel', 'p1', ['black', 'white', 'red']],
    ['12 mini', 2020, 699, 'notch', 'p2d', ['black', 'white', 'red', 'green', 'blue', 'purple']],
    ['12', 2020, 799, 'notch', 'p2d', ['black', 'white', 'red', 'green', 'blue', 'purple']],
    ['12 Pro', 2020, 999, 'notch', 'p3', ['graphite', 'silver', 'gold', 'pacificblue']],
    ['12 Pro Max', 2020, 1099, 'notch', 'p3', ['graphite', 'silver', 'gold', 'pacificblue']],
    ['13 mini', 2021, 699, 'notch', 'p2d', ['midnight', 'starlight', 'red', 'blue', 'pink', 'green']],
    ['13', 2021, 799, 'notch', 'p2d', ['midnight', 'starlight', 'red', 'blue', 'pink', 'green']],
    ['13 Pro', 2021, 999, 'notch', 'p3', ['graphite', 'silver', 'gold', 'sierrablue', 'alpinegreen']],
    ['13 Pro Max', 2021, 1099, 'notch', 'p3', ['graphite', 'silver', 'gold', 'sierrablue', 'alpinegreen']],
    ['SE 3', 2022, 429, 'bezel', 'p1', ['midnight', 'starlight', 'red']],
    ['14', 2022, 799, 'notch', 'p2d', ['midnight', 'starlight', 'red', 'blue', 'purple', 'yellow']],
    ['14 Plus', 2022, 899, 'notch', 'p2d', ['midnight', 'starlight', 'red', 'blue', 'purple', 'yellow']],
    ['14 Pro', 2022, 999, 'island', 'p3', ['spaceblack', 'silver', 'gold', 'deeppurple']],
    ['14 Pro Max', 2022, 1099, 'island', 'p3', ['spaceblack', 'silver', 'gold', 'deeppurple']],
    ['15', 2023, 799, 'island', 'p2d', ['black', 'blue', 'green', 'yellow', 'pink']],
    ['15 Plus', 2023, 899, 'island', 'p2d', ['black', 'blue', 'green', 'yellow', 'pink']],
    ['15 Pro', 2023, 999, 'island', 'p3', ['natti', 'blueti', 'whiteti', 'blackti']],
    ['15 Pro Max', 2023, 1199, 'island', 'p3', ['natti', 'blueti', 'whiteti', 'blackti']],
    ['16', 2024, 799, 'island', 'p2v', ['black', 'white', 'pink', 'teal', 'ultramarine']],
    ['16 Plus', 2024, 899, 'island', 'p2v', ['black', 'white', 'pink', 'teal', 'ultramarine']],
    ['16e', 2025, 599, 'notch', 'p1', ['black', 'white']],
    ['16 Pro', 2024, 999, 'island', 'p3', ['natti', 'desertti', 'whiteti', 'blackti']],
    ['16 Pro Max', 2024, 1199, 'island', 'p3', ['natti', 'desertti', 'whiteti', 'blackti']],
    ['17', 2025, 799, 'island', 'p2v', ['black', 'white', 'lavender', 'sage', 'mistblue']],
    ['Air', 2025, 999, 'island', 'pbar', ['spaceblack', 'cloudwhite', 'lightgold', 'skyblue']],
    ['17 Pro', 2025, 1099, 'island', 'p3bar', ['cosmicorange', 'deepblue', 'silver']],
    ['17 Pro Max', 2025, 1199, 'island', 'p3bar', ['cosmicorange', 'deepblue', 'silver']],
  ];
  for (const [g, year, price, f, cam, colors, o = {}] of pear) {
    const pro = /Pro/.test(g);
    add('phones', 'Pear', 'iFone ' + g, price, year, { f, cam, logo: 'pear' }, { colors, vars: GB(storFor(year, pro)), os: 'pear', ...o });
  }
  const sam = [];
  [['S8', 2017, 720], ['S9', 2018, 720], ['S10', 2019, 900], ['S20', 2020, 999], ['S21', 2021, 799], ['S22', 2022, 799], ['S23', 2023, 799], ['S24', 2024, 799], ['S25', 2025, 799], ['S26', 2026, 829]].forEach(([n, y, p]) => {
    sam.push([`Galaxi ${n}`, y, p, 'punch', 's3v']);
    sam.push([`Galaxi ${n}+`, y, p + 200, 'punch', 's3v']);
    if (y >= 2020) sam.push([`Galaxi ${n} Ultra`, y, p + 400, 'punch', 's4u']);
  });
  [['Note 9', 2018, 999], ['Note 10+', 2019, 1099], ['Note 20 Ultra', 2020, 1299]].forEach(([n, y, p]) => sam.push(['Galaxi ' + n, y, p, 'punch', 's4u']));
  [3, 4, 5, 6, 7].forEach((v, i) => { sam.push([`Galaxi Z Flip${v}`, 2021 + i, 999 + i * 20, 'flip', 'flip']); sam.push([`Galaxi Z Fold${v}`, 2021 + i, 1799 + i * 20, 'fold', 's3v']); });
  [['A12', 2021, 179], ['A32', 2021, 279], ['A52', 2021, 449], ['A54', 2023, 449], ['A55', 2024, 449], ['A15', 2023, 199], ['A25', 2023, 299], ['A35', 2024, 379], ['A56', 2025, 499], ['A06', 2024, 129]].forEach(([n, y, p]) => sam.push(['Galaxi ' + n, y, p, 'punch', 's3v']));
  for (const [n, y, p, f, cam] of sam) add('phones', 'Samsong', n, p, y, { f, cam, logo: 'text', txt: 'SAMSONG' }, { colors: ['phantom', 'white', 'lavender', 'green', 'cream', 'graphite', 'violet', 'sky'], vars: GB(storFor(y, p > 900)), os: 'droid' });

  const xm = [];
  [8, 9, 10, 11, 12, 13, 14].forEach((v, i) => {
    xm.push([`Redmo Note ${v}`, 2019 + i, 199, 'punch', 'sq4']); xm.push([`Redmo Note ${v} Pro`, 2019 + i, 279, 'punch', 'sq4']);
    if (v >= 12) xm.push([`Redmo Note ${v} Pro+`, 2019 + i, 379, 'punch', 'sq4']);
  });
  [['Redmo 9A', 2020, 109], ['Redmo 10C', 2022, 139], ['Redmo 13C', 2023, 129], ['Redmo 14C', 2024, 119], ['Redmo A3', 2024, 99]].forEach((r) => xm.push([...r, 'punch', 'sq4']));
  [11, 12, 13, 14, 15].forEach((v, i) => { xm.push([`Xiaomo ${v}`, 2021 + i, 749, 'punch', 'sq4']); xm.push([`Xiaomo ${v} Ultra`, 2021 + i, 1199, 'punch', 'circle']); xm.push([`Xiaomo ${v}T Pro`, 2021 + i, 649, 'punch', 'sq4']); });
  [['Poko X3 Pro', 2021, 249], ['Poko X4 Pro', 2022, 299], ['Poko X5 Pro', 2023, 299], ['Poko X6 Pro', 2024, 329], ['Poko X7 Pro', 2025, 349], ['Poko F3', 2021, 349], ['Poko F5', 2023, 399], ['Poko F6 Pro', 2024, 499], ['Poko F7 Ultra', 2025, 649], ['Poko M6 Pro', 2024, 229]].forEach((r) => xm.push([...r, 'punch', 'sq4']));
  for (const [n, y, p, f, cam] of xm) add('phones', 'Xiaomo', n, p, y, { f, cam, logo: 'text', txt: n.startsWith('Poko') ? 'POKO' : n.startsWith('Redmo') ? 'Redmo' : 'Xiaomo' }, { colors: ['black', 'blue', 'green', 'white', 'purple', 'graphite', 'mint', 'aurora'], vars: GB(storFor(y)), os: 'droid' });

  [3, 4, 5, 6, 7, 8, 9, 10].forEach((v, i) => {
    const y = 2018 + i;
    add('phones', 'Gugle', `Pixl ${v}`, 699 + (v > 6 ? 100 : 0), y, { f: 'punch', cam: 'bar', logo: 'g' }, { colors: ['black', 'white', 'mint', 'sky', 'pink', 'lilac'], vars: GB(storFor(y)), os: 'droid' });
    add('phones', 'Gugle', `Pixl ${v} Pro`, 899 + (v > 6 ? 100 : 0), y, { f: 'punch', cam: 'bar', logo: 'g' }, { colors: ['black', 'white', 'sky', 'cream', 'graphite'], vars: GB(storFor(y, true)), os: 'droid' });
    if (v >= 4) add('phones', 'Gugle', `Pixl ${v}a`, 449, y + 1 > 2026 ? 2026 : y + 1, { f: 'punch', cam: 'bar', logo: 'g' }, { colors: ['black', 'white', 'sky', 'mint'], vars: GB([128, 256]), os: 'droid' });
  });
  [['P30 Pro', 2019, 999], ['P40 Pro', 2020, 999], ['P50 Pro', 2021, 1199], ['P60 Pro', 2023, 1199], ['P70 Pro', 2024, 999], ['Mate 20 Pro', 2018, 1049], ['Mate 40 Pro', 2020, 1199], ['Mate 60 Pro', 2023, 999], ['Mate 70 Pro', 2024, 1099], ['Mate X5', 2023, 1799], ['Nova 12', 2024, 449], ['Pura 80 Ultra', 2025, 1399]]
    .forEach(([n, y, p]) => add('phones', 'Huawai', n, p, y, { f: n.includes('X5') ? 'fold' : 'punch', cam: 'circle', logo: 'text', txt: 'HUAWAI' }, { colors: ['black', 'white', 'green', 'purple', 'gold', 'aurora'], vars: GB(storFor(y)), os: 'droid' }));
  [['7T', 2019, 599], ['8 Pro', 2020, 899], ['9 Pro', 2021, 969], ['10 Pro', 2022, 899], ['11', 2023, 699], ['12', 2024, 799], ['13', 2025, 899], ['Nord 3', 2023, 449], ['Nord 4', 2024, 499], ['Nord CE4', 2024, 329]]
    .forEach(([n, y, p]) => add('phones', 'OnePlas', n, p, y, { f: 'punch', cam: 'circle', logo: 'text', txt: '1+' }, { colors: ['black', 'green', 'white', 'blue', 'graphite'], vars: GB(storFor(y)), os: 'droid' }));
  [['Spark 10 Pro', 2023, 169], ['Spark 20 Pro', 2024, 199], ['Spark 30 Pro', 2025, 219], ['Camon 20 Pro', 2023, 279], ['Camon 30', 2024, 299], ['Camon 40 Pro', 2025, 349], ['Pova 6 Pro', 2024, 249], ['Phantom V Flip', 2023, 599]]
    .forEach(([n, y, p]) => add('phones', 'Tekno', n, p, y, { f: n.includes('Flip') ? 'flip' : 'punch', cam: 'dual', logo: 'text', txt: 'TEKNO' }, { colors: ['black', 'gold', 'cream', 'blue', 'green', 'champagne'], vars: GB([128, 256]), os: 'droid' }));
  [['X8', 2022, 249], ['90', 2023, 449], ['200 Pro', 2024, 699], ['400', 2025, 599], ['Magic 5 Pro', 2023, 1199], ['Magic 6 Pro', 2024, 1299], ['Magic 7 Pro', 2025, 1299]]
    .forEach(([n, y, p]) => add('phones', 'Honar', n, p, y, { f: 'punch', cam: 'circle', logo: 'text', txt: 'HONAR' }, { colors: ['black', 'green', 'white', 'sky', 'pink'], vars: GB(storFor(y)), os: 'droid' }));
  [['1 III', 2021, 1299], ['1 V', 2023, 1399], ['1 VI', 2024, 1399], ['1 VII', 2025, 1499], ['5 V', 2023, 999], ['10 VI', 2024, 449]]
    .forEach(([n, y, p]) => add('phones', 'Sonny', 'Xperio ' + n, p, y, { f: 'bezel2', cam: 's3v', logo: 'text', txt: 'SONNY' }, { colors: ['black', 'white', 'green', 'purple'], vars: GB([128, 256, 512]), os: 'droid' }));
  // retro & luxury phones
  add('phones', 'Nokla', '3310 (2000)', 120, 2000, { f: 'retro' }, { colors: ['navy', 'grey', 'red'], retro: 15, vars: [['', 1]], rare: 1 });
  add('phones', 'Nokla', '8800 Sirocco', 900, 2006, { f: 'slider' }, { colors: ['black', 'gold', 'silver'], retro: 12, hype: 1.2, vars: [['', 1]] });
  add('phones', 'Nokla', 'N95', 600, 2007, { f: 'slider' }, { colors: ['silver', 'black'], retro: 12, vars: [['8 ГБ', 1]] });
  add('phones', 'Nokla', '6300', 220, 2007, { f: 'retro' }, { colors: ['silver', 'black'], retro: 12, vars: [['', 1]] });
  add('phones', 'Nokla', 'Lumio 1020', 599, 2013, { f: 'bezel2', cam: 'circle', logo: 'text', txt: 'NOKLA' }, { colors: ['yellow', 'black', 'white'], retro: 12, vars: [['32 ГБ', 1]] });
  add('phones', 'Motorolla', 'Raze V3', 499, 2004, { f: 'flipold' }, { colors: ['silver', 'black', 'pink'], retro: 14, hype: 1.1, vars: [['', 1]] });
  add('phones', 'Motorolla', 'Raze 50 Ultra', 999, 2024, { f: 'flip', cam: 'flip' }, { colors: ['mint', 'navy', 'orange'], vars: GB([256, 512]), os: 'droid' });
  add('phones', 'Motorolla', 'Edge 50 Pro', 599, 2024, { f: 'punch', cam: 'sq4', logo: 'text', txt: 'moto' }, { colors: ['black', 'lilac', 'cream'], vars: GB([256, 512]), os: 'droid' });
  add('phones', 'Vertuo', 'Signature Touch', 10900, 2015, { f: 'bezel2', cam: 'single', logo: 'text', txt: 'VERTUO' }, { colors: ['black', 'gold'], fixed: true, price: 2400, vars: [['64 ГБ', 1]], rare: 1 });
  add('phones', 'Vertuo', 'Aster P Baroque', 4900, 2017, { f: 'bezel2', cam: 'single', logo: 'text', txt: 'VERTUO' }, { colors: ['black', 'brown', 'gold'], fixed: true, price: 1200, vars: [['64 ГБ', 1]] });
  add('phones', 'BlackBerri', 'Bold 9900', 499, 2011, { f: 'qwerty' }, { colors: ['black'], retro: 12, vars: [['', 1]] });
  add('phones', 'BlackBerri', 'Passport', 599, 2014, { f: 'qwerty' }, { colors: ['black', 'white'], retro: 12, vars: [['32 ГБ', 1]] });

  // ------------------------------------------------------------------ ELECTRONICS
  const lap = (brand, name, price, year, colors, o = {}) => add('electronics', brand, name, price, year, { t: 'laptop', logo: brand === 'Pear' ? 'pear' : 'text', txt: brand.toUpperCase() }, { colors, vars: o.vars || [['8/256 ГБ', 1], ['16/512 ГБ', 1.25], ['32/1 ТБ', 1.55]], ...o });
  lap('Pear', 'MacBuk Air M1', 999, 2020, ['silver', 'spacegray', 'gold']);
  lap('Pear', 'MacBuk Air M2', 1199, 2022, ['midnight', 'starlight', 'silver', 'spacegray']);
  lap('Pear', 'MacBuk Air M3 15"', 1299, 2024, ['midnight', 'starlight', 'silver', 'spacegray']);
  lap('Pear', 'MacBuk Air M4', 999, 2025, ['skyblue', 'midnight', 'starlight', 'silver']);
  lap('Pear', 'MacBuk Pro 13" M1', 1299, 2020, ['silver', 'spacegray']);
  lap('Pear', 'MacBuk Pro 14" M1 Pro', 1999, 2021, ['silver', 'spacegray']);
  lap('Pear', 'MacBuk Pro 16" M1 Max', 3499, 2021, ['silver', 'spacegray']);
  lap('Pear', 'MacBuk Pro 14" M3 Pro', 1999, 2023, ['spaceblack', 'silver']);
  lap('Pear', 'MacBuk Pro 16" M4 Max', 3999, 2024, ['spaceblack', 'silver']);
  lap('Pear', 'MacBuk Pro 15" (2015)', 1999, 2015, ['silver'], { retro: 99 });
  lap('ThinkPed', 'X1 Carbon Gen 11', 1899, 2023, ['black']);
  lap('ThinkPed', 'T14 Gen 3', 1299, 2022, ['black']);
  lap('Delll', 'XPS 13 Plus', 1399, 2023, ['graphite', 'silver']);
  lap('Delll', 'XPS 15', 1799, 2022, ['silver']);
  lap('Azus', 'RAG Zephyrus G14', 1599, 2024, ['grey', 'white']);
  lap('Azus', 'RAG Strix Scar 18', 2999, 2024, ['black']);
  lap('Razar', 'Blade 16', 2999, 2024, ['black']);
  lap('Microsaft', 'Surfase Laptop 7', 1199, 2024, ['silver', 'navy', 'sand']);
  lap('Lenova', 'Legion Pro 7i', 2499, 2024, ['black']);
  lap('Acerr', 'Nitro 5', 899, 2022, ['black']);
  lap('HPP', 'Pavilion 15', 699, 2023, ['silver', 'navy']);
  const tab = (brand, name, price, year, colors, o = {}) => add('electronics', brand, name, price, year, { t: 'tablet', logo: brand === 'Pear' ? 'pear' : 'text', txt: brand.toUpperCase() }, { colors, vars: o.vars || GB([64, 256, 512]), ...o });
  tab('Pear', 'iPed 9', 329, 2021, ['silver', 'spacegray']);
  tab('Pear', 'iPed 10', 449, 2022, ['silver', 'blue', 'pink', 'yellow']);
  tab('Pear', 'iPed Air M2', 599, 2024, ['spacegray', 'blue', 'purple', 'starlight']);
  tab('Pear', 'iPed Pro 11" M4', 999, 2024, ['spaceblack', 'silver']);
  tab('Pear', 'iPed Pro 12.9" M2', 1099, 2022, ['spacegray', 'silver']);
  tab('Pear', 'iPed mini 6', 499, 2021, ['spacegray', 'pink', 'purple', 'starlight']);
  tab('Samsong', 'Galaxi Tab S9 Ultra', 1199, 2023, ['graphite', 'beige']);
  tab('Samsong', 'Galaxi Tab S10+', 999, 2024, ['graphite', 'silver']);
  tab('Xiaomo', 'Pad 6', 399, 2023, ['graphite', 'blue', 'gold']);
  tab('Kindel', 'Paperwhite', 149, 2024, ['black', 'green'], { vars: GB([16, 32]) });
  const cam = (brand, name, price, year, o = {}) => add('electronics', brand, name, price, year, { t: 'camera', style: o.style || 'mirrorless', txt: brand.toUpperCase() }, { colors: o.colors || ['black'], vars: [[['Только тушка', 'Тільки тушка', 'Body only'], 1], [['С объективом (кит)', 'З обʼєктивом (кіт)', 'With kit lens'], 1.18]], ...o });
  cam('Canonn', 'EOS R5', 3899, 2020); cam('Canonn', 'EOS R6 II', 2499, 2022); cam('Canonn', 'EOS 5D Mark IV', 3499, 2016, { style: 'dslr' }); cam('Canonn', 'EOS 250D', 549, 2019, { style: 'dslr', colors: ['black', 'silver'] });
  cam('Sonny', 'Alfa 7 IV', 2499, 2021); cam('Sonny', 'Alfa 7S III', 3499, 2020); cam('Sonny', 'Alfa 6400', 899, 2019); cam('Sonny', 'ZV‑E10', 699, 2021, { colors: ['black', 'white'] });
  cam('Fujifim', 'X100V', 1399, 2020, { style: 'rangefinder', colors: ['silver', 'black'], hype: 1.55, dep: 0.03 }); cam('Fujifim', 'X100VI', 1599, 2024, { style: 'rangefinder', colors: ['silver', 'black'], hype: 1.35, dep: 0.03 }); cam('Fujifim', 'X‑T5', 1699, 2022, { style: 'rangefinder', colors: ['silver', 'black'] });
  cam('Nikkon', 'Z8', 3999, 2023); cam('Nikkon', 'D750', 2299, 2014, { style: 'dslr' }); cam('Nikkon', 'Zf', 1999, 2023, { style: 'rangefinder', colors: ['black', 'silver'] });
  cam('Leyca', 'M6 (плёнка)', 1500, 1985, { style: 'rangefinder', colors: ['silver', 'black'], fixed: true, price: 3200, rare: 1 }); cam('Leyca', 'Q3', 5995, 2023, { style: 'rangefinder', dep: 0.05 });
  cam('Зенитт', 'Е (СССР)', 60, 1975, { style: 'dslr', colors: ['black', 'silver'], fixed: true, price: 45 });
  cam('GoPra', 'Hero 12 Black', 399, 2023, { style: 'action' }); cam('GoPra', 'Hero 13 Black', 429, 2024, { style: 'action' });
  const drone = (brand, name, price, year) => add('electronics', brand, name, price, year, { t: 'drone' }, { colors: ['grey', 'white'], vars: [['', 1], [['Fly More Combo', 'Fly More Combo', 'Fly More Combo'], 1.3]] });
  drone('DGI', 'Mavik 3 Pro', 2199, 2023); drone('DGI', 'Mini 4 Pro', 759, 2023); drone('DGI', 'Air 3', 1099, 2023); drone('DGI', 'Avata 2', 999, 2024); drone('DGI', 'Mini 2', 449, 2020);
  const gpu = (brand, name, price, year, o = {}) => add('electronics', brand, name, price, year, { t: 'gpu', fans: o.fans || 3, txt: brand.toUpperCase() }, { colors: ['black'], vars: [['', 1]], ...o });
  gpu('Nvidio', 'RTZ 3060', 329, 2021, { fans: 2 }); gpu('Nvidio', 'RTZ 3080', 699, 2020); gpu('Nvidio', 'RTZ 3090', 1499, 2020); gpu('Nvidio', 'RTZ 4070 Super', 599, 2024, { fans: 2 }); gpu('Nvidio', 'RTZ 4080 Super', 999, 2024);
  gpu('Nvidio', 'RTZ 4090', 1599, 2022, { hype: 1.3, dep: 0.08 }); gpu('Nvidio', 'RTZ 5080', 999, 2025); gpu('Nvidio', 'RTZ 5090', 1999, 2025, { hype: 1.4 }); gpu('Radeen', 'RX 7900 XTX', 999, 2022); gpu('Radeen', 'RX 6700 XT', 479, 2021, { fans: 2 });
  add('electronics', 'Pear', 'Vizion Pro', 3499, 2024, { t: 'vr', pear: true }, { colors: ['silver'], vars: GB([256, 512, 1024]) });
  add('electronics', 'Metta', 'Quest 3', 499, 2023, { t: 'vr' }, { colors: ['white'], vars: GB([128, 512]) });
  add('electronics', 'Pear', 'iMak 24" M3', 1299, 2023, { t: 'monitor', pear: true }, { colors: ['blue', 'green', 'pink', 'silver', 'yellow', 'orange', 'purple'], vars: [['8/256 ГБ', 1], ['16/512 ГБ', 1.3]] });
  add('electronics', 'Pear', 'Mak Studio M2 Max', 1999, 2023, { t: 'box' }, { colors: ['silver'], vars: [['32/512 ГБ', 1], ['64/1 ТБ', 1.4]] });
  add('electronics', 'Samsong', 'Odyssey G9 49"', 1299, 2023, { t: 'monitor' }, { colors: ['white'], vars: [['', 1]] });
  add('electronics', 'Kayschron', 'Q1 Pro (клавиатура)', 199, 2023, { t: 'keyboard' }, { colors: ['grey', 'navy', 'black'], vars: [['', 1]] });
  add('electronics', 'Teenage Engeneering', 'OP‑2', 1999, 2023, { t: 'keyboard', synth: true }, { colors: ['silver'], vars: [['', 1]], hype: 1.1 });

  // ------------------------------------------------------------------ CONSOLES
  const con = (brand, name, price, year, t, colors, o = {}) => add('consoles', brand, name, price, year, { t }, { colors, vars: o.vars || [['', 1], [['С 2 геймпадами и играми', 'З 2 геймпадами та іграми', 'Bundle: 2 pads + games'], 1.25]], ...o });
  con('Sonny', 'PlayStatien 1', 299, 1995, 'ps1', ['grey'], { retro: 15 });
  con('Sonny', 'PlayStatien 2 Fat', 299, 2000, 'ps2', ['black'], { retro: 15 });
  con('Sonny', 'PlayStatien 2 Slim', 149, 2004, 'ps2s', ['black', 'silver'], { retro: 15 });
  con('Sonny', 'PlayStatien 3 Fat', 499, 2006, 'ps3', ['black'], { retro: 15 });
  con('Sonny', 'PlayStatien 3 Super Slim', 249, 2012, 'ps3', ['black', 'white'], { retro: 15 });
  con('Sonny', 'PlayStatien 4', 399, 2013, 'ps4', ['black', 'white'], { vars: GB([500, 1024]) });
  con('Sonny', 'PlayStatien 4 Pro', 399, 2016, 'ps4', ['black'], { vars: GB([1024]) });
  con('Sonny', 'PlayStatien 5', 499, 2020, 'ps5', ['white'], { vars: [[['С дисководом', 'З дисководом', 'Disc edition'], 1], [['Digital', 'Digital', 'Digital'], 0.86]] });
  con('Sonny', 'PlayStatien 5 Slim', 449, 2023, 'ps5', ['white'], { vars: [[['С дисководом', 'З дисководом', 'Disc'], 1], ['Digital', 0.88]] });
  con('Sonny', 'PlayStatien 5 Pro', 699, 2024, 'ps5', ['white'], { vars: GB([2048]) });
  con('Sonny', 'PS5 30th Anniversary', 999, 2024, 'ps5', ['grey'], { hype: 1.9, dep: 0, rare: 2, vars: [[['Лимитка', 'Лімітка', 'Limited'], 1]] });
  con('Sonny', 'PSP 3000', 169, 2008, 'psp', ['black', 'white', 'red'], { retro: 13 });
  con('Sonny', 'PS Vita', 249, 2012, 'psp', ['black', 'white'], { retro: 10 });
  con('Sonny', 'PlayStatien Portal', 199, 2023, 'psp', ['white'], {});
  con('Microsaft', 'Ybox Original', 299, 2001, 'xbox', ['black'], { retro: 15 });
  con('Microsaft', 'Ybox 360', 399, 2005, 'x360', ['white', 'black'], { retro: 15 });
  con('Microsaft', 'Ybox One S', 299, 2016, 'xone', ['white'], {});
  con('Microsaft', 'Ybox Series S', 299, 2020, 'xss', ['white', 'black'], { vars: GB([512, 1024]) });
  con('Microsaft', 'Ybox Series X', 499, 2020, 'xsx', ['black'], { vars: GB([1024, 2048]) });
  con('Nintendu', 'NES', 99, 1985, 'nes', ['grey'], { retro: 15, hype: 1.2 });
  con('Nintendu', 'Super NES', 199, 1991, 'snes', ['grey'], { retro: 15, hype: 1.2 });
  con('Nintendu', 'N64', 199, 1996, 'n64', ['black', 'teal', 'orange'], { retro: 15, hype: 1.3 });
  con('Nintendu', 'GameCub', 199, 2001, 'cube', ['purple', 'black', 'orange'], { retro: 15, hype: 1.4 });
  con('Nintendu', 'Wii', 249, 2006, 'wii', ['white', 'black'], { retro: 15 });
  con('Nintendu', 'Switsh', 299, 2017, 'switch', ['grey', 'red'], {});
  con('Nintendu', 'Switsh OLED', 349, 2021, 'switch', ['white', 'red'], {});
  con('Nintendu', 'Switsh 2', 449, 2025, 'switch', ['grey'], { hype: 1.1 });
  con('Nintendu', 'Switsh Lite', 199, 2019, 'switchlite', ['yellow', 'teal', 'grey', 'coral', 'blue'], {});
  con('Nintendu', 'GameBoi (1989)', 89, 1989, 'gb', ['grey'], { retro: 15, hype: 1.3 });
  con('Nintendu', 'GameBoi Color', 79, 1998, 'gbc', ['purple', 'yellow', 'teal', 'red', 'lime'], { retro: 15, hype: 1.2 });
  con('Nintendu', 'GameBoi Advance SP', 99, 2003, 'gba', ['silver', 'blue', 'red', 'black'], { retro: 15, hype: 1.3 });
  con('Nintendu', 'DS Lite', 129, 2006, 'ds', ['white', 'black', 'pink'], { retro: 15 });
  con('Nintendu', '3DS XL', 199, 2012, 'ds', ['blue', 'red', 'black'], { retro: 10 });
  con('Segga', 'Mega Drive', 189, 1990, 'mega', ['black'], { retro: 15 });
  con('Segga', 'Dreamcust', 199, 1999, 'dream', ['white'], { retro: 15, hype: 1.2 });
  con('Steem', 'Dek LCD', 399, 2022, 'deck', ['black'], { vars: GB([64, 256, 512]) });
  con('Steem', 'Dek OLED', 549, 2023, 'deck', ['black', 'white'], { vars: GB([512, 1024]) });
  con('Atary', '2600', 199, 1977, 'atari', ['black'], { retro: 15 });
  con('Денди', 'Junior (клон)', 30, 1993, 'dendy', ['black'], { retro: 15, hype: 1.5 });
  con('Anbernyk', 'RG35XX (ретро)', 79, 2023, 'gbc', ['grey', 'purple', 'white'], {});
  con('Azus', 'RAG Ally', 699, 2023, 'deck', ['white'], { vars: GB([512]) });

  // ------------------------------------------------------------------ ACCESSORIES
  const acc = (brand, name, price, year, t, colors, o = {}) => add('accessories', brand, name, price, year, { t }, { colors, vars: o.vars || [['', 1]], ...o });
  acc('Pear', 'AirBuds 2', 159, 2019, 'buds', ['white']); acc('Pear', 'AirBuds 3', 179, 2021, 'buds', ['white']); acc('Pear', 'AirBuds 4', 129, 2024, 'buds', ['white']);
  acc('Pear', 'AirBuds Pro 2', 249, 2022, 'buds', ['white']); acc('Pear', 'AirBuds Pro 3', 249, 2025, 'buds', ['white']);
  acc('Pear', 'AirBuds Max', 549, 2020, 'headphones', ['silver', 'spacegray', 'sky', 'pink', 'green', 'midnight', 'orange']);
  acc('Sonny', 'WH‑1000XM4', 349, 2020, 'headphones', ['black', 'silver', 'navy']); acc('Sonny', 'WH‑1000XM5', 399, 2022, 'headphones', ['black', 'silver', 'navy']); acc('Sonny', 'WH‑1000XM6', 449, 2025, 'headphones', ['black', 'platinum', 'sky']);
  acc('Boze', 'QC Ultra', 429, 2023, 'headphones', ['black', 'white', 'sand']); acc('Beets', 'Studio Pro', 349, 2023, 'headphones', ['black', 'navy', 'sand', 'brown']); acc('Marshell', 'Major IV', 149, 2020, 'headphones', ['black', 'brown']);
  acc('Samsong', 'Galaxi Buds 3 Pro', 249, 2024, 'buds', ['silver', 'white']); acc('Xiaomo', 'Redmo Buds 5', 49, 2024, 'buds', ['black', 'white', 'blue']);
  acc('JBK', 'Flip 6', 129, 2022, 'speaker', ['black', 'blue', 'red', 'teal', 'grey']); acc('JBK', 'Charge 5', 179, 2021, 'speaker', ['black', 'blue', 'red', 'camo']); acc('Marshell', 'Emberton III', 169, 2024, 'speaker2', ['black', 'cream']);
  acc('Ray‑Bann', 'Wayfarer', 171, 2023, 'glasses', ['black', 'brown', 'navy']); acc('Ray‑Bann', 'Aviator', 171, 2023, 'aviator', ['gold', 'silver', 'black']);
  acc('Oaklee', 'Holbrook', 163, 2023, 'glasses', ['black', 'blue']); acc('Gentle Monsta', 'Lang', 290, 2024, 'glasses', ['black', 'brown'], { hype: 1.1 }); acc('Cartie', 'Santo Sunglasses', 1100, 2023, 'aviator', ['gold'], { dep: 0.05 });
  acc('Louis Vuittan', 'Slender Wallet', 560, 2023, 'wallet', ['brown', 'black'], { dep: 0.03 }); acc('Hermez', 'Bearn Wallet', 2900, 2023, 'wallet', ['orange', 'black', 'gold'], { dep: 0.0 });
  acc('Gucchi', 'GG Marmon Wallet', 590, 2023, 'wallet', ['black', 'pink', 'beige'], { dep: 0.05 });
  acc('Hermez', 'H Belt 32mm', 1050, 2023, 'belt', ['black', 'brown', 'orange'], { dep: 0.01 }); acc('Gucchi', 'GG Belt', 480, 2023, 'belt', ['black', 'brown'], { dep: 0.06 }); acc('Ferragamma', 'Gancino Belt', 490, 2023, 'belt', ['black', 'brown'], { dep: 0.06 });
  acc('New Eraa', '59Fifty Yankees', 45, 2024, 'cap', ['navy', 'black', 'red', 'white']); acc('Supremo', 'Box Logo Cap', 54, 2024, 'cap', ['red', 'black', 'navy'], { hype: 1.6 });
  acc('Stanli', 'Quencher 40oz', 45, 2024, 'cup', ['pink', 'mint', 'cream', 'black', 'lilac'], { hype: 1.3 }); acc('Stanli', 'Quencher «Розовый парад»', 50, 2024, 'cup', ['pink'], { hype: 3.5, rare: 1 });
  acc('Supremo', 'Кирпич с логотипом', 30, 2016, 'brick', ['red'], { hype: 6, dep: 0 }); acc('Pear', 'AirTeg (4 шт.)', 99, 2021, 'tracker', ['white']); acc('Pear', 'Pencil Pro', 129, 2024, 'pencil', ['white']);
  acc('Pear', 'Watch‑зарядка', 29, 2023, 'powerbank', ['white']); acc('Ankerr', 'PowerCore 20K', 49, 2023, 'powerbank', ['black', 'white']); acc('DGI', 'Osmo Pocket 3', 519, 2023, 'action', ['black']);
  acc('Тамагоша', 'Брелок‑сигналка', 15, 2024, 'keyfob', ['black']); acc('Bellroy', 'Tech Kit', 69, 2023, 'wallet', ['grey', 'navy']);
}
