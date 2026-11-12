// Full phone line-ups people actually search for: every Gugle Pixl worth knowing (from the first Pixl to the
// 11 Pro Fold), the whole Xiaomo family (Mi 9 … Xiaomo 18 Ultra and the 18 Fold, Mix Fold / Flip, more
// Redmo and Poko), Nofing Phone (1)…(4a) with CMF, and the Pear iFones that were missing (3G, 4s, 5, 5c,
// the Plus models, iFone 18 and Air 2). The iFone Duo, Xiaomo 17/18 and Pixl 10/11 live in models_new.js.
const GB = (arr) => arr.map((g, i) => [g >= 1024 ? `${g / 1024} ТБ` : `${g} ГБ`, 1 + i * 0.11]);
const stor = (y, p) => (y <= 2009 ? [8, 16, 32] : y <= 2013 ? [16, 32, 64] : y <= 2016 ? [16, 64, 128] : y <= 2019 ? [64, 128, 256] : y <= 2022 && p < 400 ? [64, 128, 256] : p >= 900 ? [256, 512, 1024] : p >= 400 ? [128, 256, 512] : [128, 256]);
export function buildLines(add) {
  // Pear
  const pear = (name, y, p, f, cam, colors, o = {}) => add('phones', 'Pear', `iFone ${name}`, p, y, { f, cam, logo: 'pear' }, { colors, vars: GB(o.gb || stor(y, p)), os: 'pear', ...o });
  pear('3G', 2008, 599, 'bezel', 'p1old', ['black', 'white'], { retro: 12, hype: 1.2 });
  pear('4s', 2011, 649, 'bezel', 'p1', ['black', 'white'], { retro: 12 });
  pear('5', 2012, 649, 'bezel', 'p1', ['black', 'white']);
  pear('5c', 2013, 549, 'bezel', 'p1', ['white', 'pink', 'yellow', 'blue', 'green']);
  pear('6 Plus', 2014, 749, 'bezel', 'p1', ['spacegray', 'silver', 'gold']);
  pear('6s Plus', 2015, 749, 'bezel', 'p1', ['spacegray', 'silver', 'gold', 'rosegold']);
  pear('18', 2026, 829, 'island', 'p2v', ['black', 'white', 'sage', 'mistblue', 'lavender']);
  pear('Air 2', 2026, 999, 'island', 'pbar', ['spaceblack', 'cloudwhite', 'lightgold', 'skyblue']);

  // Gugle Pixl
  const px = (name, y, p, f, colors, o = {}) => add('phones', 'Gugle', name ? `Pixl ${name}` : 'Pixl', p, y, { f, cam: o.cam || 'bar', logo: 'g' }, { colors, vars: GB(o.gb || stor(y, p)), os: 'droid', ...o });
  px('', 2016, 649, 'bezel', ['black', 'silver', 'blue'], { cam: 'single', retro: 10, gb: [32, 128] });
  px('XL', 2016, 769, 'bezel', ['black', 'silver', 'blue'], { cam: 'single', retro: 10, gb: [32, 128] });
  px('2', 2017, 649, 'bezel', ['black', 'white', 'blue'], { cam: 'single', gb: [64, 128] });
  px('2 XL', 2017, 849, 'bezel', ['black', 'white'], { cam: 'single', gb: [64, 128] });
  px('3a', 2019, 399, 'bezel', ['black', 'white', 'lilac'], { cam: 'single', gb: [64] });
  px('3a XL', 2019, 479, 'bezel', ['black', 'white', 'lilac'], { cam: 'single', gb: [64] });
  px('Fold', 2023, 1799, 'fold', ['black', 'cream'], { gb: [256, 512] });
  px('9 Pro XL', 2024, 1099, 'punch', ['black', 'cream', 'mint', 'pink']);
  px('9 Pro Fold', 2024, 1799, 'fold', ['black', 'cream'], { gb: [256, 512] });
  px('10 Pro XL', 2025, 1199, 'punch', ['black', 'cream', 'mistblue', 'mint']);
  px('11 Pro Fold', 2026, 1799, 'fold', ['black', 'cream', 'mistblue'], { gb: [256, 512, 1024], hype: 1.1 });

  // Xiaomo
  const xm = (name, y, p, f, cam, colors, o = {}) => add('phones', 'Xiaomo', name, p, y, { f, cam, logo: 'text', txt: name.startsWith('Poko') ? 'POKO' : name.startsWith('Redmo') ? 'Redmo' : 'Xiaomo' }, { colors, vars: GB(o.gb || stor(y, p)), os: 'droid', ...o });
  xm('Mi 9', 2019, 449, 'punch', 'sq4', ['black', 'blue', 'purple']);
  xm('Mi 9T Pro', 2019, 399, 'punch', 'sq4', ['black', 'blue', 'red']);
  xm('Mi 10', 2020, 799, 'punch', 'sq4', ['grey', 'green', 'white']);
  xm('Mi 10 Pro', 2020, 999, 'punch', 'sq4', ['grey', 'white']);
  xm('Mi 10T Pro', 2020, 599, 'punch', 'sq4', ['black', 'silver', 'blue']);
  xm('Mi 11 Lite', 2021, 299, 'punch', 'sq4', ['black', 'pink', 'blue']);
  xm('Xiaomo 11T', 2021, 499, 'punch', 'sq4', ['grey', 'white', 'blue']);
  xm('Xiaomo 12 Pro', 2022, 999, 'punch', 'sq4', ['grey', 'blue', 'purple']);
  xm('Xiaomo 12 Lite', 2022, 399, 'punch', 'sq4', ['black', 'green', 'pink']);
  xm('Xiaomo 12T', 2022, 549, 'punch', 'sq4', ['black', 'silver', 'blue']);
  xm('Xiaomo 13 Pro', 2023, 999, 'punch', 'circle', ['black', 'white']);
  xm('Xiaomo 13 Lite', 2023, 449, 'punch', 'sq4', ['black', 'sky', 'pink']);
  xm('Xiaomo 13T', 2023, 549, 'punch', 'sq4', ['black', 'green', 'sky']);
  xm('Xiaomo 14 Pro', 2024, 899, 'punch', 'sq4', ['black', 'white', 'green']);
  xm('Xiaomo 14T', 2024, 599, 'punch', 'sq4', ['black', 'grey', 'sky']);
  xm('Xiaomo 15 Pro', 2025, 899, 'punch', 'sq4', ['black', 'white', 'green']);
  xm('Xiaomo 15T', 2025, 649, 'punch', 'sq4', ['black', 'grey', 'champagne']);
  xm('Xiaomo 17T', 2026, 649, 'punch', 'sq4', ['black', 'grey', 'sky']);
  xm('Xiaomo 17T Pro', 2026, 849, 'punch', 'sq4', ['black', 'grey', 'champagne']);
  xm('Xiaomo 18 Pro Max', 2026, 1249, 'punch', 'sq4', ['black', 'white', 'violet']);
  xm('Xiaomo 18 Ultra', 2026, 1399, 'punch', 'circle', ['black', 'white', 'green'], { hype: 1.1 });
  xm('Xiaomo 18 Fold', 2026, 1899, 'fold', 'circle', ['black', 'white', 'gold'], { gb: [512, 1024], hype: 1.25 });
  xm('Mix Fold 2', 2022, 1399, 'fold', 'circle', ['black', 'gold']);
  xm('Mix Fold 3', 2023, 1399, 'fold', 'circle', ['black', 'gold']);
  xm('Mix Fold 4', 2024, 1499, 'fold', 'circle', ['black', 'white', 'sky']);
  xm('Mix Flip', 2024, 999, 'flip', 'flip', ['black', 'white', 'purple']);
  xm('Redmo Note 7', 2019, 179, 'notch', 'dual', ['black', 'blue', 'white'], { gb: [32, 64, 128] });
  xm('Redmo 15C', 2025, 129, 'punch', 'sq4', ['black', 'blue', 'green'], { gb: [128, 256] });
  xm('Redmo A5', 2025, 99, 'punch', 'sq4', ['black', 'sky', 'sand'], { gb: [64, 128] });
  xm('Poko X7', 2025, 279, 'punch', 'sq4', ['black', 'green', 'silver']);
  xm('Poko F7', 2025, 449, 'punch', 'sq4', ['black', 'white', 'sky']);
  xm('Poko F7 Pro', 2025, 549, 'punch', 'sq4', ['black', 'blue', 'silver']);

  // Nofing (transparent backs with light strips) and its budget sub-brand CMF
  const nf = (name, y, p, colors, o = {}) => add('phones', 'Nofing', name, p, y, { f: 'punch', cam: o.cam || 'dual', logo: 'text', txt: name.startsWith('CMF') ? 'CMF' : 'NOFING' }, { colors, vars: GB(o.gb || stor(y, p)), os: 'droid', ...o });
  nf('Phone (1)', 2022, 469, ['black', 'white'], { hype: 1.1 });
  nf('Phone (2)', 2023, 599, ['black', 'white']);
  nf('Phone (2a)', 2024, 349, ['black', 'white', 'blue']);
  nf('Phone (2a) Plus', 2024, 399, ['black', 'grey']);
  nf('Phone (3a) Pro', 2025, 459, ['black', 'grey'], { cam: 'circle' });
  nf('Phone (4a)', 2026, 399, ['black', 'white', 'blue']);
  nf('Phone (4a) Pro', 2026, 499, ['black', 'grey'], { cam: 'circle' });
  nf('CMF Phone 1', 2024, 199, ['black', 'orange', 'lime', 'blue'], { gb: [128, 256] });
  nf('CMF Phone 2 Pro', 2025, 279, ['black', 'white', 'orange', 'lime'], { gb: [128, 256] });
}
