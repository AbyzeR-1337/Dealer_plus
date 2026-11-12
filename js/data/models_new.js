// The newest phones (2025–2026: foldables, "Duo", trifolds, Xiaomo 17/18…) and more PC hardware.
const GB = (arr) => arr.map((g, i) => [g >= 1024 ? `${g / 1024} ТБ` : `${g} ГБ`, 1 + i * 0.11]);
export function buildNew(add) {
  const ph = (brand, name, year, price, f, cam, txt, colors, o = {}) => add('phones', brand, name, price, year, { f, cam, logo: brand === 'Pear' ? 'pear' : brand === 'Gugle' ? 'g' : 'text', txt }, { colors, vars: GB(o.gb || (price >= 900 ? [256, 512, 1024] : [128, 256, 512])), os: brand === 'Pear' ? 'pear' : 'droid', ...o });
  // Pear
  ph('Pear', 'iFone 17e', 2026, 599, 'notch', 'p1', '', ['black', 'white', 'pink']);
  ph('Pear', 'iFone Duo', 2026, 1999, 'fold', 'p2v', '', ['black', 'white', 'silver'], { hype: 1.3 });
  ph('Pear', 'iFone 18 Pro', 2026, 1099, 'island', 'p3bar', '', ['cosmicorange', 'deepblue', 'silver', 'black']);
  ph('Pear', 'iFone 18 Pro Max', 2026, 1199, 'island', 'p3bar', '', ['cosmicorange', 'deepblue', 'silver', 'black']);
  // Samsong
  ph('Samsong', 'Galaxi S25 Edge', 2025, 1099, 'punch', 'dual', 'SAMSONG', ['titanium', 'black', 'sky']);
  ph('Samsong', 'Galaxi Z Fold8', 2026, 1999, 'fold', 's3v', 'SAMSONG', ['navy', 'black', 'silver']);
  ph('Samsong', 'Galaxi Z Flip8', 2026, 1099, 'flip', 'flip', 'SAMSONG', ['navy', 'mint', 'black']);
  ph('Samsong', 'Galaxi Z TriFold', 2025, 2899, 'fold', 's3v', 'SAMSONG', ['black'], { hype: 1.2, rare: 1 });
  ph('Samsong', 'Galaxi A57', 2026, 499, 'punch', 's3v', 'SAMSONG', ['navy', 'lilac', 'white']);
  ph('Samsong', 'Galaxi A37', 2026, 399, 'punch', 's3v', 'SAMSONG', ['black', 'mint', 'lilac']);
  // Xiaomo
  ph('Xiaomo', 'Xiaomo 17', 2025, 799, 'punch', 'sq4', 'Xiaomo', ['black', 'white', 'green', 'pink']);
  ph('Xiaomo', 'Xiaomo 17 Pro', 2025, 999, 'punch', 'sq4', 'Xiaomo', ['black', 'white', 'purple']);
  ph('Xiaomo', 'Xiaomo 17 Pro Max', 2025, 1199, 'punch', 'sq4', 'Xiaomo', ['black', 'white', 'purple']);
  ph('Xiaomo', 'Xiaomo 17 Ultra', 2026, 1299, 'punch', 'circle', 'Xiaomo', ['black', 'white', 'green']);
  ph('Xiaomo', 'Xiaomo 18', 2026, 849, 'punch', 'sq4', 'Xiaomo', ['black', 'white', 'sky']);
  ph('Xiaomo', 'Xiaomo 18 Pro', 2026, 1049, 'punch', 'sq4', 'Xiaomo', ['black', 'white', 'violet']);
  ph('Xiaomo', 'Mix Flip 2', 2025, 999, 'flip', 'flip', 'Xiaomo', ['black', 'gold', 'pink']);
  ph('Xiaomo', 'Redmo Note 15', 2026, 229, 'punch', 'sq4', 'Redmo', ['black', 'blue', 'green']);
  ph('Xiaomo', 'Redmo Note 15 Pro', 2026, 329, 'punch', 'sq4', 'Redmo', ['black', 'blue', 'purple']);
  ph('Xiaomo', 'Redmo Note 15 Pro+', 2026, 429, 'punch', 'sq4', 'Redmo', ['black', 'white', 'purple']);
  ph('Xiaomo', 'Redmo K90 Pro', 2025, 599, 'punch', 'circle', 'Redmo', ['black', 'white', 'sky']);
  ph('Xiaomo', 'Poko F8 Ultra', 2025, 749, 'punch', 'sq4', 'POKO', ['black', 'yellow', 'white']);
  // Gugle
  ph('Gugle', 'Pixl 10 Pro Fold', 2025, 1799, 'fold', 'bar', '', ['graphite', 'mint']);
  ph('Gugle', 'Pixl 11', 2026, 799, 'punch', 'bar', '', ['black', 'white', 'sky', 'mint']);
  ph('Gugle', 'Pixl 11 Pro', 2026, 999, 'punch', 'bar', '', ['black', 'white', 'cream']);
  ph('Gugle', 'Pixl 11 Pro XL', 2026, 1199, 'punch', 'bar', '', ['black', 'white', 'cream']);
  // OnePlas
  ph('OnePlas', '15', 2025, 899, 'punch', 'sq4', '1+', ['black', 'sky', 'cream']);
  ph('OnePlas', '15R', 2025, 649, 'punch', 'sq4', '1+', ['black', 'mint']);
  ph('OnePlas', 'Nord 5', 2025, 449, 'punch', 'dual', '1+', ['black', 'sky', 'cream']);
  // Huawai
  ph('Huawai', 'Mate 80 Pro', 2025, 1199, 'punch', 'circle', 'HUAWAI', ['black', 'white', 'green', 'gold']);
  ph('Huawai', 'Pura 80 Pro', 2025, 999, 'punch', 'circle', 'HUAWAI', ['black', 'white', 'gold']);
  ph('Huawai', 'Mate X7', 2025, 1999, 'fold', 'circle', 'HUAWAI', ['black', 'red', 'white']);
  ph('Huawai', 'Mate XT2 (трифолд)', 2025, 2799, 'fold', 'circle', 'HUAWAI', ['black', 'red'], { hype: 1.2, rare: 1 });
  // Honar
  ph('Honar', 'Magic 8 Pro', 2025, 1199, 'punch', 'circle', 'HONAR', ['black', 'white', 'sky']);
  ph('Honar', 'Magic V5', 2025, 1799, 'fold', 'circle', 'HONAR', ['black', 'white', 'gold']);
  // Vivvo / Opo / Nofing
  ph('Vivvo', 'X300 Pro', 2025, 1099, 'punch', 'circle', 'VIVVO', ['black', 'white', 'cream']);
  ph('Vivvo', 'X Fold5', 2025, 1699, 'fold', 'circle', 'VIVVO', ['black', 'white']);
  ph('Vivvo', 'V60', 2025, 449, 'punch', 'dual', 'VIVVO', ['black', 'sky', 'pink']);
  ph('Opo', 'Find X9 Pro', 2025, 1099, 'punch', 'circle', 'OPO', ['black', 'white', 'cream']);
  ph('Opo', 'Find N5', 2025, 1799, 'fold', 'circle', 'OPO', ['black', 'white']);
  ph('Opo', 'Reno 14', 2025, 499, 'punch', 'dual', 'OPO', ['black', 'mint', 'white']);
  ph('Nofing', 'Phone (3)', 2025, 799, 'punch', 'dual', 'NOFING', ['black', 'white'], { hype: 1.15 });
  ph('Nofing', 'Phone (3a)', 2025, 379, 'punch', 'dual', 'NOFING', ['black', 'white', 'blue']);
  // Motorolla
  ph('Motorolla', 'Raze 60 Ultra', 2025, 1099, 'flip', 'flip', 'moto', ['navy', 'green', 'red']);
  ph('Motorolla', 'Edge 60 Pro', 2025, 549, 'punch', 'sq4', 'moto', ['navy', 'lilac', 'green']);

  // more video cards
  const gpu = (brand, name, price, year) => add('electronics', brand, name, price, year, { t: 'gpu', fans: 3, txt: brand.toUpperCase() }, { colors: ['black'], vars: [['', 1]] });
  gpu('Nvidio', 'RTZ 3070', 499, 2020); gpu('Nvidio', 'RTZ 4060', 299, 2023); gpu('Nvidio', 'RTZ 4060 Ti', 399, 2023);
  gpu('Nvidio', 'RTZ 5060 Ti', 429, 2025); gpu('Nvidio', 'RTZ 5070', 549, 2025); gpu('Nvidio', 'RTZ 5070 Ti', 749, 2025);
  gpu('Radeen', 'RX 6600', 199, 2021); gpu('Radeen', 'RX 7800 XT', 499, 2023); gpu('Radeen', 'RX 9070 XT', 599, 2025);

  // more PC parts
  const p = (kind, brand, name, price, year, pc) => add('pcparts', brand, name, price, year, { t: kind }, { colors: ['col'], vars: [['', 1]], tier: price < 60 ? 'cheap' : price < 250 ? 'mid' : 'good', pc: { kind, ...pc } });
  p('cpu', 'Intell', 'Core i3‑10100F', 50, 2020, { socket: 'LGA1200', perf: 24, tdp: 65 });
  p('cpu', 'Intell', 'Core i5‑13400F', 150, 2023, { socket: 'LGA1700', perf: 52, tdp: 65 });
  p('cpu', 'Intell', 'Core i7‑14700K', 390, 2023, { socket: 'LGA1700', perf: 84, tdp: 125 });
  p('cpu', 'Intell', 'Core Ultra 5 245K', 280, 2024, { socket: 'LGA1851', perf: 70, tdp: 125 });
  p('cpu', 'Intell', 'Core Ultra 9 285K', 560, 2024, { socket: 'LGA1851', perf: 95, tdp: 125 });
  p('cpu', 'AMB', 'Ryzen 5 5500', 75, 2022, { socket: 'AM4', perf: 38, tdp: 65 });
  p('cpu', 'AMB', 'Ryzen 7 5700X3D', 200, 2024, { socket: 'AM4', perf: 64, tdp: 105 });
  p('cpu', 'AMB', 'Ryzen 5 9600X', 230, 2024, { socket: 'AM5', perf: 66, tdp: 65 });
  p('cpu', 'AMB', 'Ryzen 7 9700X', 320, 2024, { socket: 'AM5', perf: 78, tdp: 65 });
  p('cpu', 'AMB', 'Ryzen 7 9800X3D', 480, 2024, { socket: 'AM5', perf: 100, tdp: 120 });
  p('cpu', 'AMB', 'Ryzen 9 7950X3D', 600, 2023, { socket: 'AM5', perf: 96, tdp: 120 });
  p('mb', 'Azus', 'PRIME H610M‑E D4', 80, 2022, { socket: 'LGA1700', ram: 'DDR4', form: 'mATX' });
  p('mb', 'ASRok', 'B760M Pro RS', 130, 2023, { socket: 'LGA1700', ram: 'DDR5', form: 'mATX' });
  p('mb', 'MSE', 'PRO Z890‑P', 250, 2024, { socket: 'LGA1851', ram: 'DDR5', form: 'ATX' });
  p('mb', 'MSE', 'MAG B850 TOMAHAWK', 220, 2025, { socket: 'AM5', ram: 'DDR5', form: 'ATX' });
  p('mb', 'Azus', 'ROG STRIX X870E‑E', 480, 2024, { socket: 'AM5', ram: 'DDR5', form: 'ATX' });
  p('mb', 'Gigabait', 'B650I AORUS ULTRA (ITX)', 260, 2023, { socket: 'AM5', ram: 'DDR5', form: 'ITX' });
  p('ram', 'Kingstone', 'FURY Beast 16 ГБ (2×8) DDR5‑5600', 60, 2023, { ram: 'DDR5', gb: 16 });
  p('ram', 'Corsar', 'Vengeance 48 ГБ (2×24) DDR5‑6000', 150, 2024, { ram: 'DDR5', gb: 48 });
  p('ram', 'G.Skil', 'Ripjaws 64 ГБ (2×32) DDR4‑3200', 120, 2022, { ram: 'DDR4', gb: 64 });
  p('psu', 'MSE', 'MAG A650BN 650W', 55, 2022, { watts: 650 });
  p('psu', 'Seasonik', 'VERTEX GX‑1000 1000W', 200, 2023, { watts: 1000 });
  p('psu', 'be quite!', 'Dark Power 13 1000W', 250, 2023, { watts: 1000 });
  p('case', 'Kuler Mastar', 'NR200P (ITX)', 100, 2022, { form: 'ITX' });
  p('case', 'Lian Lee', 'A4‑H2O (ITX)', 150, 2022, { form: 'ITX' });
  p('case', 'Deepkool', 'CH560 (ATX)', 80, 2023, { form: 'ATX' });
  p('case', 'Montek', 'Air 903 MAX (ATX)', 90, 2023, { form: 'ATX' });
  p('cooler', 'Arktik', 'Liquid Freezer III 240', 90, 2024, { tdp: 260 });
  p('cooler', 'Deepkool', 'AK620', 65, 2023, { tdp: 260 });
  p('cooler', 'Noctuo', 'NH‑L9i (низкопрофильный)', 50, 2022, { tdp: 95 });
}
export const GPU_SPEC_NEW = {
  electronics_nvidio_rtz_3070: { perf: 52, watts: 220 }, electronics_nvidio_rtz_4060: { perf: 42, watts: 115 }, electronics_nvidio_rtz_4060_ti: { perf: 50, watts: 160 },
  electronics_nvidio_rtz_5060_ti: { perf: 56, watts: 180 }, electronics_nvidio_rtz_5070: { perf: 72, watts: 250 }, electronics_nvidio_rtz_5070_ti: { perf: 82, watts: 300 },
  electronics_radeen_rx_6600: { perf: 34, watts: 132 }, electronics_radeen_rx_7800_xt: { perf: 66, watts: 263 }, electronics_radeen_rx_9070_xt: { perf: 80, watts: 304 },
};
