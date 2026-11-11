// PC parts for the "Build" business: every part carries the spec the compatibility check needs
// (pc: { kind, socket, ram, perf, tdp, watts, form ... }). Video cards live in electronics (art.t 'gpu')
// and drives in storage (ssd / nvme / hdd) — they plug into builds too, see game/pc.js.
export function buildPC(add) {
  const p = (kind, brand, name, price, year, pc, o = {}) => add('pcparts', brand, name, price, year, { t: kind }, { colors: ['col'], vars: [['', 1]], tier: price < 60 ? 'cheap' : price < 250 ? 'mid' : 'good', pc: { kind, ...pc }, ...o });
  // processors
  p('cpu', 'Intell', 'Core i5‑10400F', 70, 2020, { socket: 'LGA1200', perf: 34, tdp: 65 });
  p('cpu', 'Intell', 'Core i3‑12100F', 90, 2022, { socket: 'LGA1700', perf: 32, tdp: 58 });
  p('cpu', 'Intell', 'Core i5‑12400F', 120, 2022, { socket: 'LGA1700', perf: 46, tdp: 65 });
  p('cpu', 'Intell', 'Core i5‑14400F', 190, 2024, { socket: 'LGA1700', perf: 56, tdp: 65 });
  p('cpu', 'Intell', 'Core i7‑13700K', 330, 2023, { socket: 'LGA1700', perf: 76, tdp: 125 });
  p('cpu', 'Intell', 'Core i9‑14900K', 520, 2023, { socket: 'LGA1700', perf: 92, tdp: 150 });
  p('cpu', 'Intell', 'Core Ultra 7 265K', 360, 2024, { socket: 'LGA1851', perf: 84, tdp: 125 });
  p('cpu', 'AMB', 'Ryzen 5 3600', 60, 2019, { socket: 'AM4', perf: 30, tdp: 65 });
  p('cpu', 'AMB', 'Ryzen 5 5600', 100, 2022, { socket: 'AM4', perf: 45, tdp: 65 });
  p('cpu', 'AMB', 'Ryzen 7 5800X3D', 250, 2022, { socket: 'AM4', perf: 70, tdp: 105 });
  p('cpu', 'AMB', 'Ryzen 5 7600', 190, 2023, { socket: 'AM5', perf: 60, tdp: 65 });
  p('cpu', 'AMB', 'Ryzen 7 7800X3D', 380, 2023, { socket: 'AM5', perf: 90, tdp: 120 });
  p('cpu', 'AMB', 'Ryzen 9 9950X', 580, 2024, { socket: 'AM5', perf: 98, tdp: 170 });
  // motherboards
  p('mb', 'Gigabait', 'H510M S2H', 70, 2021, { socket: 'LGA1200', ram: 'DDR4', form: 'mATX' });
  p('mb', 'Azus', 'PRIME B660‑PLUS D4', 110, 2022, { socket: 'LGA1700', ram: 'DDR4', form: 'ATX' });
  p('mb', 'MSE', 'PRO B760M‑A', 120, 2023, { socket: 'LGA1700', ram: 'DDR5', form: 'mATX' });
  p('mb', 'Gigabait', 'Z790 AORUS ELITE', 230, 2023, { socket: 'LGA1700', ram: 'DDR5', form: 'ATX' });
  p('mb', 'Azus', 'ROG STRIX Z890‑E', 420, 2024, { socket: 'LGA1851', ram: 'DDR5', form: 'ATX' });
  p('mb', 'ASRok', 'B450M Pro4', 70, 2019, { socket: 'AM4', ram: 'DDR4', form: 'mATX' });
  p('mb', 'MSE', 'MAG B550 TOMAHAWK', 130, 2021, { socket: 'AM4', ram: 'DDR4', form: 'ATX' });
  p('mb', 'MSE', 'PRO B650M‑A WIFI', 150, 2023, { socket: 'AM5', ram: 'DDR5', form: 'mATX' });
  p('mb', 'Azus', 'TUF GAMING B650‑PLUS', 180, 2023, { socket: 'AM5', ram: 'DDR5', form: 'ATX' });
  // memory
  p('ram', 'Crucal', '8 ГБ DDR4‑2666', 18, 2019, { ram: 'DDR4', gb: 8 });
  p('ram', 'Kingstone', 'FURY Beast 16 ГБ (2×8) DDR4‑3200', 40, 2021, { ram: 'DDR4', gb: 16 });
  p('ram', 'Corsar', 'Vengeance 32 ГБ (2×16) DDR4‑3600', 75, 2022, { ram: 'DDR4', gb: 32 });
  p('ram', 'Kingstone', 'FURY 32 ГБ (2×16) DDR5‑6000', 110, 2023, { ram: 'DDR5', gb: 32 });
  p('ram', 'G.Skil', 'Trident Z5 RGB 64 ГБ (2×32) DDR5‑6000', 210, 2024, { ram: 'DDR5', gb: 64 });
  // power supplies
  p('psu', 'Deepkool', 'PK550D 550W', 50, 2022, { watts: 550 });
  p('psu', 'be quite!', 'System Power 10 650W', 65, 2022, { watts: 650 });
  p('psu', 'Corsar', 'RM750e 750W', 100, 2023, { watts: 750 });
  p('psu', 'Seasonik', 'FOCUS GX‑850 850W', 140, 2023, { watts: 850 });
  p('psu', 'Corsar', 'HX1200 1200W', 260, 2023, { watts: 1200 });
  // cases
  p('case', 'Zalmen', 'T3 Plus (mATX)', 35, 2021, { form: 'mATX' });
  p('case', 'Deepkool', 'CC560 (ATX)', 60, 2022, { form: 'ATX' });
  p('case', 'NZXX', 'H5 Flow (ATX)', 90, 2023, { form: 'ATX' });
  p('case', 'Fractel', 'North (ATX)', 140, 2023, { form: 'ATX' });
  p('case', 'Lian Lee', 'O11 Dynamic EVO (ATX)', 160, 2023, { form: 'ATX' });
  // cooling
  p('cooler', 'ID‑Kuler', 'SE‑214‑XT', 20, 2022, { tdp: 150 });
  p('cooler', 'Deepkool', 'AK400', 35, 2023, { tdp: 200 });
  p('cooler', 'Noctuo', 'NH‑D15', 110, 2021, { tdp: 250 });
  p('cooler', 'Arktik', 'Liquid Freezer III 360', 120, 2024, { tdp: 320 });
  // what a finished build becomes (never spawns on its own: built in the "Build" app)
  add('electronics', '', 'Сборка ПК', 600, 2025, { t: 'pc' }, { colors: ['col'], vars: [['', 1]], tier: 'good', nogen: true });
}
// video cards: performance and power for builds (by model id)
export const GPU_SPEC = {
  electronics_nvidio_rtz_3060: { perf: 38, watts: 170 }, electronics_radeen_rx_6700_xt: { perf: 46, watts: 230 }, electronics_nvidio_rtz_3080: { perf: 62, watts: 320 },
  electronics_nvidio_rtz_4070_super: { perf: 66, watts: 220 }, electronics_nvidio_rtz_3090: { perf: 70, watts: 350 }, electronics_radeen_rx_7900_xtx: { perf: 84, watts: 355 },
  electronics_nvidio_rtz_4080_super: { perf: 86, watts: 320 }, electronics_nvidio_rtz_5080: { perf: 92, watts: 360 }, electronics_nvidio_rtz_4090: { perf: 100, watts: 450 }, electronics_nvidio_rtz_5090: { perf: 118, watts: 575 },
};
