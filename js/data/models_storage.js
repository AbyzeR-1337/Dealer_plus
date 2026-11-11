// Data storage: flash drives, memory cards, hard drives and SSDs, discs, floppies, tapes, players.
// Every one of them can be plugged in to look at what the previous owner left on it (see game/files.js).
// art.t is the kind of medium: it picks the photo prompt and what the files look like.
export function buildStorage(add) {
  const d = (brand, name, price, year, t, o = {}) => add('storage', brand, name, price, year, { t }, { colors: ['col'], vars: [['', 1]], tier: o.tier || (price < 20 ? 'cheap' : price < 120 ? 'mid' : 'good'), ...o });
  // USB flash drives
  d('Kingstone', 'DataTravelar 1 ГБ (2006)', 3, 2006, 'usb', { fixed: true });
  d('Kingstone', 'DataTravelar 8 ГБ', 4, 2012, 'usb');
  d('SanDisc', 'Cruzar Blade 16 ГБ', 5, 2015, 'usb');
  d('Transcand', 'JetFlesh 32 ГБ, металл', 7, 2018, 'usb');
  d('SanDisc', 'Ultra Dual 64 ГБ (USB‑C)', 12, 2021, 'usb');
  d('Samsong', 'BAR Plus 128 ГБ', 18, 2022, 'usb');
  d('Kingstone', 'DataTravelar Max 256 ГБ', 30, 2023, 'usb');
  d('', 'Флешка «2 ТБ» с AliExpres', 6, 2023, 'usb', { fakeCap: 8 });
  d('', 'Флешка‑ключ 16 ГБ', 6, 2016, 'usb');
  d('', 'Флешка‑мишка 8 ГБ', 5, 2014, 'usb');
  d('', 'Промо‑флешка с конференции 4 ГБ', 3, 2011, 'usb');
  d('Apricorm', 'Aegis Secure Key 64 ГБ (PIN)', 90, 2020, 'secure');
  // memory cards
  d('SanDisc', 'Extreme SD 64 ГБ', 15, 2020, 'sd');
  d('SanDisc', 'Extreme PRO SD 256 ГБ', 45, 2023, 'sd');
  d('Samsong', 'EVO Plus microSD 128 ГБ', 14, 2022, 'microsd');
  d('Kingstone', 'Canvas microSD 32 ГБ', 6, 2019, 'microsd');
  d('', 'Карта из видеорегистратора 32 ГБ', 4, 2019, 'dashcam');
  d('Lexxar', 'Professional CFexpress 128 ГБ', 120, 2022, 'cf');
  d('SanDisc', 'Extreme CompactFlash 32 ГБ', 25, 2014, 'cf');
  d('Sonny', 'Memory Stick PRO Duo 4 ГБ', 8, 2008, 'memstick');
  // hard drives and SSDs
  d('Hitachy', 'Deskstar 250 ГБ (3.5")', 8, 2008, 'hdd');
  d('Westen Digital', 'WD Blue 500 ГБ (3.5")', 15, 2012, 'hdd');
  d('Seagait', 'Barracuda 1 ТБ (3.5")', 30, 2016, 'hdd');
  d('Westen Digital', 'WD Red 4 ТБ (NAS)', 70, 2019, 'hdd');
  d('', 'HDD из списанного офисного ПК 250 ГБ', 6, 2010, 'office');
  d('Toshibo', 'MQ01 320 ГБ (2.5", из ноутбука)', 7, 2011, 'hdd25');
  d('Crucal', 'MX500 500 ГБ (SSD)', 30, 2020, 'ssd');
  d('Samsong', '870 EVO 1 ТБ (SSD)', 60, 2022, 'ssd');
  d('Westen Digital', 'WD Black SN850X 1 ТБ (M.2)', 80, 2023, 'nvme');
  d('Samsong', '990 PRO 2 ТБ (M.2)', 140, 2023, 'nvme');
  d('Westen Digital', 'My Passport 2 ТБ', 55, 2020, 'exthdd');
  d('Seagait', 'Expansion 4 ТБ', 75, 2021, 'exthdd');
  d('LaCi', 'Rugged 2 ТБ', 90, 2019, 'exthdd');
  d('Samsong', 'T7 Shield 1 ТБ', 85, 2023, 'extssd');
  d('Synologi', 'DiskStation DS220+ (NAS)', 260, 2021, 'nas');
  d('Quantim', 'Картридж LTO‑5 1,5 ТБ (бэкап)', 20, 2012, 'tape');
  // discs and old media
  d('Iomego', 'Zip‑диск 100 МБ', 5, 1998, 'zip', { fixed: true });
  d('Verbatum', 'CD‑R «Сборник 2007»', 1, 2007, 'cd');
  d('Verbatum', 'DVD‑R «Свадьба»', 1, 2009, 'dvd');
  d('', 'CD с игрой в коробке (2004)', 15, 2004, 'gamecd', { fixed: true });
  d('Verbatum', 'Дискета 3,5″ 1,44 МБ', 2, 1997, 'floppy', { fixed: true });
  d('', 'Дискета 5,25″ (СССР)', 4, 1990, 'floppy', { fixed: true, rare: 1 });
  d('TDQ', 'Аудиокассета D90', 3, 1995, 'cassette', { fixed: true });
  d('', 'Видеокассета VHS «Домашнее»', 4, 1996, 'vhs', { fixed: true });
  d('Sonny', 'Кассета MiniDV DVM60', 4, 2005, 'minidv', { fixed: true });
  d('Sonny', 'MiniDisc 80 мин', 6, 2001, 'minidisc', { fixed: true });
  // players and recorders
  d('Pear', 'iPud classic 160 ГБ', 180, 2009, 'ipod', { fixed: true, rare: 1 });
  d('Olimpus', 'Диктофон WS‑853', 40, 2016, 'dictaphone');
}
