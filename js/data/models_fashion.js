// Sneakers, clothing, bags, watches, jewelry, perfume (fictional brands).
export function buildFashion(add) {
  // ------------------------------------------------------------------ SNEAKERS
  // [name, retail, year, hype, colorway name, [upper, accent, sole, extra], rare]
  const sn = (brand, line, art, list) => {
    for (const [cw, price, year, hype, c, rare] of list) {
      add('sneakers', brand, `${line} «${cw}»`, price, year, { ...art, c }, { hype, colorway: cw, rare: rare || 0, colors: ['cw'] });
    }
  };
  sn('Nikey', 'Air Jordon 1 High OG', { t: 'high', logo: 'swoosh' }, [
    ['Chicago', 180, 2015, 6, ['#ffffff', '#c8102e', '#ffffff', '#111111']],
    ['Bred Toe', 160, 2018, 2.4, ['#ffffff', '#c8102e', '#ffffff', '#111111']],
    ['Royal Reimagined', 180, 2024, 1.0, ['#111111', '#2a5bd7', '#f5f0e6', '#2a5bd7']],
    ['Shadow 2.0', 170, 2021, 1.3, ['#9a9ca1', '#111111', '#ffffff', '#111111']],
    ['University Blue', 170, 2021, 1.8, ['#ffffff', '#86b4dc', '#ffffff', '#111111']],
    ['Dark Mocha', 170, 2020, 2.5, ['#ffffff', '#4b2e1f', '#f3e6d2', '#111111']],
    ['Lost & Found', 180, 2022, 2.0, ['#f2ead8', '#c8102e', '#efe2c4', '#111111']],
    ['Travi$ Scotch Mocha', 175, 2019, 7.5, ['#f1e6d6', '#5a3a26', '#efe2c4', '#2a1d14'], 2],
    ['Off‑Whyte Chicago', 190, 2017, 22, ['#ffffff', '#c8102e', '#f6f0e4', '#111111'], 3],
  ]);
  sn('Nikey', 'Air Jordon 1 Low', { t: 'low', logo: 'swoosh' }, [
    ['Travi$ Scotch Reverse Mocha', 150, 2022, 6, ['#f1e6d6', '#4b2e1f', '#efe2c4', '#2a1d14'], 2],
    ['Bred Toe', 110, 2021, 1.2, ['#ffffff', '#c8102e', '#ffffff', '#111111']],
    ['Wolf Grey', 110, 2023, 0.9, ['#ffffff', '#a9abae', '#ffffff', '#a9abae']],
  ]);
  sn('Nikey', 'Air Jordon 1 Mid', { t: 'mid', logo: 'swoosh' }, [
    ['Banned', 125, 2020, 0.95, ['#111111', '#c8102e', '#ffffff', '#c8102e']],
    ['Light Smoke Grey', 125, 2021, 0.8, ['#ffffff', '#9fa2a6', '#ffffff', '#111111']],
  ]);
  sn('Nikey', 'Air Jordon 3', { t: 'mid', logo: 'swoosh2' }, [
    ['White Cement', 200, 2023, 1.4, ['#f4f4f4', '#9b9b9b', '#ffffff', '#c8102e']],
    ['Black Cement', 200, 2024, 1.5, ['#1a1a1a', '#9b9b9b', '#ffffff', '#c8102e']],
  ]);
  sn('Nikey', 'Air Jordon 4', { t: 'mid', logo: 'wing' }, [
    ['Black Cat', 210, 2020, 2.2, ['#141414', '#2a2a2a', '#141414', '#2a2a2a']],
    ['Military Black', 210, 2022, 1.4, ['#ffffff', '#111111', '#ffffff', '#9b9b9b']],
    ['Bred Reimagined', 215, 2024, 1.2, ['#141414', '#c8102e', '#f4f0e6', '#9b9b9b']],
    ['Thunder', 210, 2023, 1.3, ['#141414', '#f6d800', '#141414', '#f6d800']],
    ['White Oreo', 200, 2021, 1.3, ['#ffffff', '#3a3a3a', '#ffffff', '#c8102e']],
  ]);
  sn('Nikey', 'Air Jordon 11', { t: 'mid', logo: 'jumpman' }, [
    ['Concord', 220, 2018, 1.6, ['#ffffff', '#111111', '#e9eef8', '#3b2e8c']],
    ['Space Jam', 220, 2016, 1.6, ['#111111', '#111111', '#e9eef8', '#3b2e8c']],
    ['Cool Grey', 230, 2021, 1.2, ['#9a9a9e', '#7a7a7e', '#ffffff', '#ffffff']],
  ]);
  sn('Nikey', 'Dank Low', { t: 'low', logo: 'swoosh' }, [
    ['Panda', 110, 2021, 1.0, ['#ffffff', '#141414', '#ffffff', '#141414']],
    ['Chicago', 110, 2022, 2.1, ['#ffffff', '#c8102e', '#ffffff', '#111111']],
    ['University Red', 110, 2021, 1.3, ['#ffffff', '#c8102e', '#ffffff', '#c8102e']],
    ['Grey Fog', 110, 2021, 1.0, ['#ffffff', '#bfc1c4', '#ffffff', '#bfc1c4']],
    ['Kentucky', 110, 2020, 1.5, ['#ffffff', '#1e4fb5', '#ffffff', '#1e4fb5']],
  ]);
  sn('Nikey', 'SB Dank Low', { t: 'low', logo: 'swoosh', sb: true }, [
    ['Jarritos', 120, 2023, 2.5, ['#e9dfcf', '#e47a1f', '#2c8f4b', '#2a5bd7']],
    ['Pigeon (2005)', 300, 2005, 40, ['#9ea3a8', '#5c6066', '#ffffff', '#c8102e'], 4],
    ['Travi$ Scotch', 150, 2020, 8, ['#d9cdb6', '#6f5b45', '#e5d5ba', '#a07a50'], 2],
  ]);
  sn('Nikey', 'Air Forse 1 ’07', { t: 'low', logo: 'swoosh' }, [
    ['Triple White', 115, 2024, 0.85, ['#ffffff', '#ffffff', '#ffffff', '#ffffff']],
    ['Triple Black', 115, 2024, 0.85, ['#161616', '#161616', '#161616', '#161616']],
    ['Off‑Whyte Volt', 170, 2018, 7, ['#e9ff3d', '#f1f1f1', '#e9ff3d', '#ff7a00'], 2],
  ]);
  sn('Nikey', 'Air Maxx', { t: 'runner', logo: 'swoosh', air: true }, [
    ['90 Infrared', 140, 2020, 1.2, ['#ffffff', '#ff4d4d', '#ffffff', '#6b6e72']],
    ['95 Neon', 185, 2020, 1.35, ['#6b6e72', '#c6ff00', '#111111', '#9a9a9a']],
    ['97 Silver Bullet', 185, 2022, 1.3, ['#c9ccd1', '#d1182a', '#ffffff', '#c9ccd1']],
    ['1 Patta Waves', 160, 2021, 2.4, ['#ffffff', '#3e6b40', '#ffffff', '#c6a25e'], 1],
  ]);
  sn('Nikey', 'Blazzer Mid ’77', { t: 'high', logo: 'swoosh' }, [['Vintage White', 105, 2023, 0.9, ['#ffffff', '#111111', '#f2e6cf', '#111111']]]);
  sn('Nikey', 'Vaporfly 3', { t: 'runner', logo: 'swoosh' }, [['Volt', 260, 2024, 0.75, ['#e9ff3d', '#111111', '#ffffff', '#e9ff3d']]]);
  sn('Adibas', 'Yeezo Boost 350 V2', { t: 'knit', logo: 'stripe1' }, [
    ['Zebra', 230, 2022, 1.25, ['#f2f2f2', '#141414', '#ffffff', '#c8102e']],
    ['Beluga', 230, 2021, 1.2, ['#8a8d93', '#ff6a1f', '#f2f2f2', '#ff6a1f']],
    ['Bred', 230, 2020, 1.45, ['#141414', '#c8102e', '#141414', '#c8102e']],
    ['Cream White', 230, 2022, 1.0, ['#f3eadb', '#f3eadb', '#f3eadb', '#f3eadb']],
    ['Onyx', 230, 2022, 1.0, ['#2a2a2a', '#2a2a2a', '#2a2a2a', '#2a2a2a']],
  ]);
  sn('Adibas', 'Yeezo 700', { t: 'chunky', logo: 'none' }, [['Wave Runner', 300, 2019, 1.5, ['#c9c4bb', '#1e7fcf', '#f2f2f2', '#2b2b2b']]]);
  sn('Adibas', 'Yeezo Slide', { t: 'slide', logo: 'none' }, [['Onyx', 70, 2023, 1.4, ['#2a2a2a', '#2a2a2a', '#2a2a2a', '#2a2a2a']], ['Bone', 70, 2022, 1.3, ['#efe7d9', '#efe7d9', '#efe7d9', '#efe7d9']]]);
  sn('Adibas', 'Sombra OG', { t: 'court', logo: 'stripes' }, [['White Black Gum', 100, 2024, 1.3, ['#ffffff', '#141414', '#b7814a', '#141414']], ['Black White', 100, 2024, 1.2, ['#141414', '#ffffff', '#b7814a', '#ffffff']]]);
  sn('Adibas', 'Gazzel Indoor', { t: 'court', logo: 'stripes' }, [['Collegiate Green', 120, 2024, 1.2, ['#1f6b3f', '#f2ead8', '#b7814a', '#c9a227']], ['Scarlet', 120, 2024, 1.15, ['#d42a2a', '#f2ead8', '#b7814a', '#c9a227']]]);
  sn('Adibas', 'Superstarr', { t: 'court', logo: 'stripes', shell: true }, [['Cloud White', 100, 2024, 0.8, ['#ffffff', '#141414', '#ffffff', '#c9a227']]]);
  sn('Adibas', 'Ultrabust 1.0', { t: 'runner', logo: 'cage' }, [['Triple Black', 190, 2023, 0.6, ['#1f1f1f', '#1f1f1f', '#1f1f1f', '#1f1f1f']]]);
  sn('Adibas', 'Campuss 00s', { t: 'court', logo: 'stripes' }, [['Core Black', 110, 2024, 1.1, ['#222222', '#ffffff', '#ffffff', '#c9a227']], ['Grey', 110, 2024, 1.0, ['#8a8d93', '#ffffff', '#ffffff', '#c9a227']]]);
  sn('New Balanse', '550', { t: 'low', logo: 'n' }, [['White Green', 110, 2023, 1.15, ['#ffffff', '#1f6b3f', '#ffffff', '#1f6b3f']], ['UNC', 110, 2022, 1.2, ['#ffffff', '#86b4dc', '#ffffff', '#86b4dc']]]);
  sn('New Balanse', '990v6', { t: 'runner', logo: 'n' }, [['Grey', 200, 2023, 1.0, ['#a3a5a8', '#7f8287', '#ffffff', '#7f8287']]]);
  sn('New Balanse', '990v3', { t: 'runner', logo: 'n' }, [['Grey Teddy', 200, 2022, 1.15, ['#a3a5a8', '#6e7176', '#ffffff', '#6e7176']]]);
  sn('New Balanse', '2002R', { t: 'runner', logo: 'n' }, [['Protection Pack Rain Cloud', 150, 2021, 1.8, ['#9ea2a6', '#d8d9db', '#e9e6df', '#76797d'], 1]]);
  sn('New Balanse', '9060', { t: 'chunky', logo: 'n' }, [['Sea Salt', 150, 2024, 1.1, ['#efe7d9', '#c9b892', '#f2ecdf', '#8a7d62']]]);
  sn('New Balanse', '1906R', { t: 'runner', logo: 'n' }, [['Silver Metallic', 160, 2024, 1.0, ['#d0d2d6', '#9ea2a6', '#ffffff', '#5a5e63']]]);
  sn('Asiks', 'Gel‑Lyte III', { t: 'runner', logo: 'tiger' }, [['Kith Volcano', 140, 2023, 2.0, ['#a33b2b', '#f2ead8', '#f2ead8', '#2a2a2a'], 1]]);
  sn('Asiks', 'Gel‑Kayano 14', { t: 'runner', logo: 'tiger' }, [['Cream Pure Silver', 150, 2024, 1.3, ['#f3eadb', '#b9bcc0', '#ffffff', '#b9bcc0']]]);
  sn('Asiks', 'Gel‑1130', { t: 'runner', logo: 'tiger' }, [['White Pure Silver', 110, 2024, 1.1, ['#ffffff', '#b9bcc0', '#ffffff', '#3b6fb6']]]);
  sn('Pumo', 'Speedcat OG', { t: 'court', logo: 'formstrip' }, [['Red White', 100, 2025, 1.2, ['#c8102e', '#ffffff', '#ffffff', '#ffffff']]]);
  sn('Pumo', 'Suede Classic', { t: 'court', logo: 'formstrip' }, [['Black White', 75, 2023, 0.8, ['#1d1d1d', '#ffffff', '#ffffff', '#ffffff']]]);
  sn('Pumo', 'Palermo', { t: 'court', logo: 'formstrip' }, [['Vapor Grey', 90, 2024, 0.9, ['#c9cbd0', '#2a5bd7', '#b7814a', '#2a5bd7']]]);
  sn('Vanz', 'Old Skule', { t: 'skate', logo: 'jazz' }, [['Black White', 70, 2024, 0.85, ['#141414', '#ffffff', '#ffffff', '#ffffff']], ['Checkerboard', 75, 2023, 0.9, ['#141414', '#ffffff', '#ffffff', '#ffffff']]]);
  sn('Vanz', 'Knu Skool', { t: 'skate', logo: 'jazz', puffy: true }, [['Black', 90, 2024, 1.0, ['#141414', '#ffffff', '#ffffff', '#ffffff']]]);
  sn('Converze', 'Chack 70 Hi', { t: 'canvas', logo: 'star' }, [['Parchment', 90, 2024, 1.0, ['#efe7d3', '#141414', '#f2ead8', '#141414']], ['Black', 90, 2024, 1.0, ['#141414', '#ffffff', '#f2ead8', '#141414']]]);
  sn('Salamon', 'XT‑6', { t: 'runner', logo: 'none', trail: true }, [['Black Phantom', 200, 2024, 1.15, ['#1c1c1c', '#3a3a3a', '#1c1c1c', '#5a5a5a']], ['Vanilla Ice', 200, 2024, 1.1, ['#efe7d9', '#c9b892', '#efe7d9', '#8a7d62']]]);
  sn('Balenciago', 'Triple Z', { t: 'chunky', logo: 'none' }, [['Black', 1100, 2022, 0.5, ['#1f1f1f', '#2a2a2a', '#1f1f1f', '#2a2a2a']], ['White', 1100, 2022, 0.45, ['#f1f1f1', '#e6e6e6', '#f1f1f1', '#e6e6e6']]]);
  sn('Balenciago', 'Track', { t: 'chunky', logo: 'none' }, [['White', 1050, 2022, 0.45, ['#f1f1f1', '#c9cbd0', '#f1f1f1', '#c9cbd0']]]);
  sn('Hokka', 'Clifton 9', { t: 'runner', logo: 'none', thick: true }, [['Black White', 145, 2024, 0.7, ['#1c1c1c', '#ffffff', '#ffffff', '#1c1c1c']]]);
  sn('Onn', 'Cloudmonster', { t: 'runner', logo: 'none', pods: true }, [['Undyed', 170, 2024, 0.7, ['#f1f1f1', '#d0d2d6', '#f1f1f1', '#d0d2d6']]]);
  sn('Golden Gooze', 'Superstar', { t: 'court', logo: 'gooze' }, [['White Silver (состаренные)', 585, 2024, 0.55, ['#f6f3ec', '#c0c0c0', '#f3ead8', '#141414']]]);
  sn('Timberlend', '6" Premium Boot', { t: 'boot', logo: 'none' }, [['Wheat', 210, 2024, 0.8, ['#c8913f', '#7a4f20', '#5a3a1a', '#5a3a1a']]]);
  sn('MSCHIF', 'Big Red Boot', { t: 'cartoon', logo: 'none' }, [['Red', 350, 2023, 1.8, ['#d1191f', '#a40f14', '#1c1c1c', '#1c1c1c'], 1]]);
  sn('Kroks', 'Classic Clog', { t: 'clog', logo: 'none' }, [['Black', 50, 2024, 0.8, ['#1f1f1f', '#1f1f1f', '#1f1f1f', '#1f1f1f']], ['Lightning McQueen', 60, 2023, 2.5, ['#d1191f', '#f6d800', '#1f1f1f', '#f6d800'], 1]]);

  // ------------------------------------------------------------------ CLOTHING
  const cl = (brand, name, price, year, t, colors, o = {}) => add('clothing', brand, name, price, year, { t, print: o.print || 'logo', txt: o.txt || brand.toUpperCase() }, { colors, ...o });
  cl('Supremo', 'Box Logo Hoodie', 168, 2023, 'hoodie', ['black', 'red', 'grey', 'navy', 'olive'], { hype: 3.4, print: 'box', txt: 'Supremo', dep: 0 });
  cl('Supremo', 'Box Logo Tee', 44, 2024, 'tee', ['white', 'black', 'grey'], { hype: 2.2, print: 'box', txt: 'Supremo', dep: 0 });
  cl('Supremo', 'Motion Logo Tee', 48, 2023, 'tee', ['white', 'black', 'navy'], { hype: 1.4, print: 'script', txt: 'Supremo' });
  cl('Supremo', 'Varsity Jacket', 398, 2023, 'jacket', ['navy', 'black', 'burgundy'], { hype: 1.5, print: 'patch', txt: 'S' });
  cl('Supremo', '× The Nord Face Nuptsi', 378, 2022, 'puffer', ['red', 'black', 'yellow'], { hype: 2.4, print: 'box', txt: 'Supremo', rare: 1 });
  cl('Stone Iland', 'Crewneck Badge', 280, 2024, 'sweat', ['black', 'navy', 'olive', 'white', 'grey'], { hype: 0.8, print: 'badge' });
  cl('Stone Iland', 'Overshirt', 450, 2024, 'jacket', ['olive', 'navy', 'black'], { hype: 0.7, print: 'badge' });
  cl('Stone Iland', 'Soft Shell‑R Jacket', 690, 2023, 'jacket', ['black', 'navy', 'khaki'], { hype: 0.65, print: 'badge' });
  cl('Off‑Whyte', 'Arrows Hoodie', 650, 2023, 'hoodie', ['black', 'white'], { hype: 0.55, print: 'arrows' });
  cl('Off‑Whyte', 'Diag Tee', 380, 2023, 'tee', ['black', 'white'], { hype: 0.5, print: 'diag' });
  cl('The Nord Face', '1996 Retro Nuptsi', 330, 2024, 'puffer', ['black', 'yellow', 'navy', 'green', 'orange'], { hype: 1.0, print: 'half', txt: 'NORD FACE' });
  cl('The Nord Face', 'Denali Fleece', 180, 2023, 'fleece', ['black', 'grey', 'navy'], { hype: 0.8, print: 'half', txt: 'NORD FACE' });
  cl('Pataguna', 'Retro‑X Fleece', 229, 2023, 'fleece', ['cream', 'navy', 'brown'], { hype: 0.9, print: 'patch', txt: 'pataguna' });
  cl('Canada Goos', 'Expedition Parka', 1495, 2023, 'parka', ['black', 'navy', 'red', 'khaki'], { hype: 0.6, print: 'disc' });
  cl('Monkler', 'Maya Puffer', 1650, 2023, 'puffer', ['black', 'navy', 'beige'], { hype: 0.6, print: 'disc' });
  cl('Gucchi', 'Web Tracksuit Jacket', 1800, 2022, 'track', ['navy', 'black', 'burgundy'], { hype: 0.45, print: 'web' });
  cl('Gucchi', 'Logo Tee', 590, 2023, 'tee', ['white', 'black'], { hype: 0.5, print: 'script', txt: 'GUCCHI' });
  cl('Prado', 'Re‑Nylon Jacket', 2200, 2023, 'jacket', ['black', 'navy'], { hype: 0.5, print: 'triangle' });
  cl('Balensiago', 'Oversized Hoodie', 950, 2023, 'hoodie', ['black', 'grey', 'white'], { hype: 0.45, print: 'text' });
  cl('Carhart WIP', 'Detroit Jacket', 230, 2024, 'jacket', ['sand', 'brown', 'black', 'navy'], { hype: 0.9, print: 'patch', txt: 'C' });
  cl('Carhart WIP', 'Watch Beanie', 25, 2024, 'beanie', ['black', 'orange', 'grey', 'brown', 'green'], { hype: 1.0, print: 'patch', txt: 'C' });
  cl('Carhart WIP', 'Double Knee Pants', 110, 2024, 'pants', ['brown', 'black', 'sand'], { hype: 1.1, print: 'none' });
  cl('Stussi', '8 Ball Tee', 50, 2024, 'tee', ['black', 'white', 'pink'], { hype: 1.3, print: 'ball' });
  cl('Stussi', 'Stock Logo Hoodie', 130, 2024, 'hoodie', ['black', 'grey', 'navy'], { hype: 1.2, print: 'script', txt: 'Stussi' });
  cl('Baip', 'Shark Full Zip Hoodie', 450, 2023, 'hoodie', ['green', 'pink', 'navy', 'black'], { hype: 1.1, print: 'shark' });
  cl('Baip', '1st Camo Tee', 120, 2023, 'tee', ['olive', 'pink', 'sky'], { hype: 1.2, print: 'camo' });
  cl('Fear of Goats', 'Essentialz Hoodie', 90, 2024, 'hoodie', ['beige', 'black', 'grey', 'mint'], { hype: 1.0, print: 'text', txt: 'ESSENTIALZ' });
  cl('Fear of Goats', 'Essentialz Sweatpants', 90, 2024, 'pants', ['beige', 'black', 'grey'], { hype: 0.9, print: 'none' });
  cl('Ralf Laurent', 'Polo Bear Knit', 398, 2023, 'knit', ['navy', 'cream', 'red'], { hype: 1.1, print: 'bear' });
  cl('Ralf Laurent', 'Classic Polo', 110, 2024, 'polo', ['navy', 'white', 'red', 'green', 'pink'], { hype: 0.7, print: 'horse' });
  cl("Levvi's", '501 Vintage (90‑е)', 98, 1995, 'jeans', ['blue', 'navy', 'black'], { hype: 1.2, print: 'none', dep: 0, retro: 20 });
  cl("Levvi's", 'Trucker Jacket', 98, 2024, 'jacket', ['blue', 'black'], { hype: 0.9, print: 'none' });
  cl('Uniclo', 'Ultra Light Down', 70, 2024, 'puffer', ['black', 'navy', 'olive', 'beige'], { hype: 0.6, print: 'none' });
  cl('Zarra', 'Кожаная куртка', 130, 2024, 'jacket', ['black', 'brown'], { hype: 0.4, print: 'none' });
  cl('Adibas', 'Firebird Track Jacket', 85, 2024, 'track', ['black', 'navy', 'red', 'green'], { hype: 1.0, print: 'stripes' });
  cl('Adibas', 'Олимпийка «Москва‑80»', 30, 1980, 'track', ['red', 'navy'], { hype: 3, print: 'stripes', dep: 0, fixed: true, price: 90, rare: 1 });
  cl('Nikey', 'Tech Fleece Hoodie', 130, 2024, 'hoodie', ['black', 'grey', 'navy', 'olive'], { hype: 1.1, print: 'swoosh' });
  cl('Nikey', 'Windrunner', 100, 2024, 'jacket', ['black', 'navy', 'red'], { hype: 0.8, print: 'swoosh' });
  cl("Arc'tryx", 'Beta LT Jacket', 450, 2024, 'jacket', ['black', 'green', 'orange', 'navy'], { hype: 1.1, print: 'bird' });
  cl("Arc'tryx", 'Atom Hoody', 280, 2024, 'puffer', ['black', 'grey', 'olive'], { hype: 1.0, print: 'bird' });
  cl('Burberri', 'Kensington Trench', 2290, 2023, 'coat', ['beige', 'black', 'khaki'], { hype: 0.5, print: 'check' });
  cl('Kortez', 'Alcatraz Cargos', 110, 2024, 'pants', ['black', 'olive', 'khaki'], { hype: 1.5, print: 'none' });
  cl('Kortez', 'Alcatraz Hoodie', 95, 2024, 'hoodie', ['black', 'grey', 'navy'], { hype: 1.4, print: 'alcatraz' });
  cl('Vetemenz', 'DHX Tee', 330, 2016, 'tee', ['yellow'], { hype: 0.9, print: 'text', txt: 'DHX', dep: 0.02 });
  cl('Chrome Hartz', 'Cross Hoodie', 1200, 2023, 'hoodie', ['black', 'grey'], { hype: 1.1, print: 'cross' });
  cl('Gallery Depo', 'Flare Jeans (painted)', 500, 2023, 'jeans', ['blue', 'black'], { hype: 1.0, print: 'paint' });
  cl('Champyon', 'Reverse Weave Hoodie', 70, 2024, 'hoodie', ['grey', 'navy', 'black'], { hype: 0.8, print: 'script', txt: 'Champyon' });
  cl('Moskino', 'Teddy Tee', 290, 2023, 'tee', ['white', 'black'], { hype: 0.5, print: 'bear' });
  cl('Ватник', 'Бушлат ВМФ (СССР)', 25, 1985, 'coat', ['navy', 'black'], { fixed: true, price: 60, print: 'none' });

  // ------------------------------------------------------------------ BAGS (fixed = today’s resale value)
  const bag = (brand, name, price, t, pat, colors, o = {}) => add('bags', brand, name, price, o.year || 2022, { t, pat, hw: o.hw || 'gold' }, { colors, tier: 'lux', ...o });
  bag('Hermez', 'Birkan 25 Togo', 28000, 'birkin', 'smooth', ['black', 'brown', 'beige', 'red', 'navy', 'pink'], { rare: 1 });
  bag('Hermez', 'Birkan 30 Togo', 22000, 'birkin', 'smooth', ['black', 'brown', 'beige', 'orange', 'green']);
  bag('Hermez', 'Birkan 35 Clemence', 16500, 'birkin', 'smooth', ['black', 'brown', 'sand']);
  bag('Hermez', 'Kelli 25 Epsom', 25000, 'kelly', 'smooth', ['black', 'brown', 'cream', 'red']);
  bag('Hermez', 'Kelli 28 Sellier', 20000, 'kelly', 'smooth', ['black', 'brown', 'navy']);
  bag('Hermez', 'Constance 18', 14000, 'flapH', 'smooth', ['black', 'red', 'beige']);
  bag('Hermez', 'Evelyn 29', 3500, 'bucket', 'perfH', ['black', 'brown', 'sand']);
  bag('Hermez', 'Picotin Lock 18', 4500, 'bucket', 'smooth', ['black', 'brown', 'beige', 'orange']);
  bag('Hermez', 'Garden Party 36', 3400, 'tote', 'smooth', ['black', 'navy', 'brown']);
  bag('Louis Vuittan', 'Speedi 25', 1400, 'speedy', 'mono', ['brown'], { hw: 'gold' });
  bag('Louis Vuittan', 'Speedi 30 Damier Ebene', 1250, 'speedy', 'damier', ['brown']);
  bag('Louis Vuittan', 'Neverfool MM', 1600, 'tote', 'mono', ['brown']);
  bag('Louis Vuittan', 'Neverfool GM Damier Azur', 1500, 'tote', 'damier', ['cream']);
  bag('Louis Vuittan', 'Alma BB', 1500, 'alma', 'mono', ['brown']);
  bag('Louis Vuittan', 'Pochette Metis', 2600, 'flap', 'mono', ['brown']);
  bag('Louis Vuittan', 'Keepall 55', 1700, 'duffle', 'mono', ['brown']);
  bag('Louis Vuittan', 'Multi Pochette', 2100, 'pochette', 'mono', ['brown']);
  bag('Louis Vuittan', 'Christopher PM', 3000, 'backpack', 'damier', ['grey', 'brown']);
  bag('Louis Vuittan', 'Onthego GM', 2800, 'tote', 'mono', ['brown', 'cream']);
  bag('Shanel', 'Classic Flap Small', 8500, 'flapC', 'quilt', ['black', 'beige', 'navy', 'pink', 'red'], { hw: 'gold' });
  bag('Shanel', 'Classic Flap Medium', 9500, 'flapC', 'quilt', ['black', 'beige', 'navy'], { hw: 'gold' });
  bag('Shanel', 'Classic Flap Jumbo', 9000, 'flapC', 'quilt', ['black', 'beige'], { hw: 'silver' });
  bag('Shanel', 'Boy Bag', 4800, 'flapC', 'quilt', ['black', 'grey', 'navy'], { hw: 'silver' });
  bag('Shanel', '22 Bag', 5500, 'tote', 'quilt', ['black', 'white', 'pink']);
  bag('Shanel', 'Wallet on Chain', 3200, 'flapC', 'quilt', ['black', 'beige', 'red']);
  bag('Shanel', '2.55 Reissue', 6500, 'flapC', 'quilt', ['black', 'grey']);
  bag('Diorr', 'Saddle', 3200, 'saddle', 'oblique', ['navy', 'black', 'beige']);
  bag('Diorr', 'Lady Diorr Medium', 4800, 'lady', 'cannage', ['black', 'white', 'pink', 'red']);
  bag('Diorr', 'Book Tote', 2600, 'tote', 'oblique', ['navy', 'beige']);
  bag('Gucchi', 'Marmon Small', 1300, 'flapC', 'quiltV', ['black', 'pink', 'burgundy', 'white'], { hw: 'gold' });
  bag('Gucchi', 'Jackye 1961', 1600, 'hobo', 'gg', ['beige', 'black']);
  bag('Gucchi', 'Dionisus', 1500, 'flap', 'gg', ['beige', 'black']);
  bag('Gucchi', 'Horsebit 1955', 1700, 'flap', 'gg', ['beige', 'black', 'brown']);
  bag('Prado', 'Re‑Edition 2005', 1200, 'hobo', 'nylon', ['black', 'white', 'pink', 'navy'], { hw: 'silver' });
  bag('Prado', 'Galleria', 2000, 'tote', 'saffiano', ['black', 'beige', 'navy']);
  bag('Prado', 'Cleo', 1700, 'hobo', 'smooth', ['black', 'white', 'sky']);
  bag('Goyar', 'St Louis PM', 1700, 'tote', 'chevron', ['black', 'brown', 'navy', 'green', 'red', 'yellow']);
  bag('Goyar', 'Saigon', 4000, 'kelly', 'chevron', ['black', 'brown', 'navy']);
  bag('Bottega Venetto', 'Jodie', 2200, 'hobo', 'weave', ['black', 'green', 'beige', 'burgundy']);
  bag('Bottega Venetto', 'Cassette', 2300, 'flap', 'weave', ['black', 'green', 'beige']);
  bag('Bottega Venetto', 'The Pouch', 1500, 'clutch', 'smooth', ['black', 'beige', 'green']);
  bag('Celinne', 'Luggage Nano', 2200, 'tote', 'smooth', ['black', 'beige', 'brown']);
  bag('Celinne', 'Triomphe', 2600, 'flap', 'smooth', ['black', 'brown', 'beige']);
  bag('Fendy', 'Baguette', 2400, 'baguette', 'ff', ['brown', 'black', 'pink']);
  bag('Fendy', 'Peekaboo', 3500, 'tote', 'smooth', ['black', 'beige', 'grey']);
  bag('Saint Laurant', 'Loulou', 1700, 'flapC', 'quiltV', ['black', 'beige']);
  bag('Saint Laurant', 'Kate', 1500, 'flap', 'smooth', ['black', 'red', 'beige']);
  bag('Lowee', 'Puzzle', 2300, 'puzzle', 'smooth', ['brown', 'black', 'beige', 'green']);
  bag('Coatch', 'Tabby 26', 300, 'flap', 'smooth', ['black', 'brown', 'cream', 'pink'], { tier: 'mid' });
  bag('Coatch', 'Pillow Tabby', 350, 'flap', 'quiltV', ['cream', 'black', 'pink', 'sky'], { tier: 'mid', hype: 1.1 });
  bag('Michael Corrs', 'Jet Set Tote', 120, 'tote', 'mk', ['brown', 'black'], { tier: 'mid' });
  bag('Jakemus', 'Le Chiquito', 450, 'mini', 'smooth', ['black', 'beige', 'pink', 'brown'], { tier: 'mid', hype: 1.1 });
  bag('Сумка из СССР', 'Авоська', 3, 'net', 'net', ['beige', 'green', 'brown'], { tier: 'cheap' });

  // ------------------------------------------------------------------ WATCHES (fixed)
  const w = (brand, name, price, a, o = {}) => add('watches', brand, name, price, o.year || 2022, a, { colors: o.colors || ['steel'], tier: o.tier || 'lux', vars: [[['Только часы', 'Тільки годинник', 'Watch only'], 0.85], [['Полный комплект', 'Повний комплект', 'Full set (box & papers)'], 1.0]], ...o });
  w('Rolecks', 'Submarine Date 126610LN', 13500, { t: 'round', bezel: 'dive', dial: '#121316', bzl: '#121316', metal: 'steel', strap: 'oyster', date: true });
  w('Rolecks', 'Submarine No Date', 10500, { t: 'round', bezel: 'dive', dial: '#121316', bzl: '#121316', metal: 'steel', strap: 'oyster' });
  w('Rolecks', 'Submarine «Hulk»', 17500, { t: 'round', bezel: 'dive', dial: '#0d5c32', bzl: '#0d5c32', metal: 'steel', strap: 'oyster', date: true }, { rare: 1 });
  w('Rolecks', 'Submarine «Kermit»', 17000, { t: 'round', bezel: 'dive', dial: '#121316', bzl: '#1c7a3a', metal: 'steel', strap: 'oyster', date: true });
  w('Rolecks', 'Submarine «Smurf» (белое золото)', 38000, { t: 'round', bezel: 'dive', dial: '#1e3f9a', bzl: '#1e3f9a', metal: 'white', strap: 'oyster', date: true });
  w('Rolecks', 'Daytrona «Panda» 116500LN', 28000, { t: 'round', bezel: 'tachy', dial: '#f4f4f2', bzl: '#121316', metal: 'steel', strap: 'oyster', sub: '#121316' });
  w('Rolecks', 'Daytrona 126500LN Black', 30000, { t: 'round', bezel: 'tachy', dial: '#121316', bzl: '#121316', metal: 'steel', strap: 'oyster', sub: '#d8dadf' });
  w('Rolecks', 'Daytrona Yellow Gold', 45000, { t: 'round', bezel: 'tachy', dial: '#c9a227', bzl: '#d4af37', metal: 'gold', strap: 'oyster', sub: '#121316' });
  w('Rolecks', 'Daytrona «Paul Newmann» 6239', 300000, { t: 'round', bezel: 'tachy', dial: '#f4f1e8', bzl: '#121316', metal: 'steel', strap: 'leather', sub: '#121316', vintage: true }, { year: 1968, rare: 4 });
  w('Rolecks', 'GMT‑Mister II «Pepsi»', 21000, { t: 'round', bezel: 'gmt', dial: '#121316', bzl: '#c8102e', bzl2: '#1e3f9a', metal: 'steel', strap: 'jubilee', date: true });
  w('Rolecks', 'GMT‑Mister II «Batman»', 19000, { t: 'round', bezel: 'gmt', dial: '#121316', bzl: '#1e3f9a', bzl2: '#121316', metal: 'steel', strap: 'oyster', date: true });
  w('Rolecks', 'GMT‑Mister II «Sprite»', 19000, { t: 'round', bezel: 'gmt', dial: '#121316', bzl: '#1c7a3a', bzl2: '#121316', metal: 'steel', strap: 'oyster', date: true, left: true });
  w('Rolecks', 'Datejustin 41', 11000, { t: 'round', bezel: 'fluted', dial: '#25406e', metal: 'two', strap: 'jubilee', date: true }, { colors: ['steel'] });
  w('Rolecks', 'Datejustin 36 «Wimbledon»', 12000, { t: 'round', bezel: 'fluted', dial: '#4a4e53', metal: 'two', strap: 'jubilee', date: true });
  w('Rolecks', 'Day‑Date 40 «President»', 38000, { t: 'round', bezel: 'fluted', dial: '#c9a227', metal: 'gold', strap: 'president', date: true });
  w('Rolecks', 'Explorer I 36', 8000, { t: 'round', bezel: 'smooth', dial: '#121316', metal: 'steel', strap: 'oyster', exp: true });
  w('Rolecks', 'Yacht‑Mister 40', 13000, { t: 'round', bezel: 'dive', dial: '#cfd2d6', bzl: '#cfd2d6', metal: 'steel', strap: 'oyster', date: true });
  w('Rolecks', 'Oyster Perpetual 41 «Tiffani»', 22000, { t: 'round', bezel: 'smooth', dial: '#81d8d0', metal: 'steel', strap: 'oyster' }, { rare: 1, hype: 1 });
  w('Rolecks', 'Air‑King', 8000, { t: 'round', bezel: 'smooth', dial: '#121316', metal: 'steel', strap: 'oyster' });
  w('Omego', 'Speedmeister Moonwatch', 6500, { t: 'round', bezel: 'tachy', dial: '#121316', bzl: '#121316', metal: 'steel', strap: 'oyster', sub: '#121316' });
  w('Omego', 'Speedmeister «Snoopy»', 12000, { t: 'round', bezel: 'tachy', dial: '#f4f4f2', bzl: '#121316', metal: 'steel', strap: 'nato', sub: '#121316' }, { rare: 1 });
  w('Omego', 'Seamastor Diver 300M', 4600, { t: 'round', bezel: 'dive', dial: '#1f3f80', bzl: '#1f3f80', metal: 'steel', strap: 'oyster', waves: true, date: true });
  w('Omego', 'Aqua Terra 41', 5000, { t: 'round', bezel: 'smooth', dial: '#2b4d7a', metal: 'steel', strap: 'oyster', date: true });
  w('Omego', 'Constellation', 4500, { t: 'round', bezel: 'smooth', dial: '#d8dadf', metal: 'two', strap: 'oyster', date: true });
  w('Pateck Filip', 'Nautilos 5711 Blue', 110000, { t: 'octagon', bezel: 'none', dial: '#1e3f6e', metal: 'steel', strap: 'oyster', date: true }, { rare: 2 });
  w('Pateck Filip', 'Nautilos 5711 Olive', 250000, { t: 'octagon', bezel: 'none', dial: '#56603a', metal: 'steel', strap: 'oyster', date: true }, { rare: 3 });
  w('Pateck Filip', 'Aquanot 5167', 60000, { t: 'octagon', bezel: 'none', dial: '#1c1c1c', metal: 'steel', strap: 'rubber', date: true });
  w('Pateck Filip', 'Calatrava 5227', 25000, { t: 'round', bezel: 'smooth', dial: '#f4f1e8', metal: 'gold', strap: 'leather' });
  w('Audemar Pigé', 'Royal Oaker 15500', 55000, { t: 'octagon', bezel: 'screws', dial: '#1f3058', metal: 'steel', strap: 'oyster', date: true }, { rare: 1 });
  w('Audemar Pigé', 'Royal Oaker «Jumbo» 15202', 120000, { t: 'octagon', bezel: 'screws', dial: '#1f3058', metal: 'steel', strap: 'oyster' }, { rare: 2 });
  w('Audemar Pigé', 'Royal Oaker Offshore', 25000, { t: 'octagon', bezel: 'screws', dial: '#1c1c1c', metal: 'steel', strap: 'rubber', sub: '#2a2a2a' });
  w('Cartie', 'Santo Medium', 6500, { t: 'square', bezel: 'screws', dial: '#f4f1e8', metal: 'steel', strap: 'oyster', roman: true });
  w('Cartie', 'Tank Louie', 9000, { t: 'tank', bezel: 'none', dial: '#f4f1e8', metal: 'gold', strap: 'leather', roman: true });
  w('Cartie', 'Tank Must', 2700, { t: 'tank', bezel: 'none', dial: '#f4f1e8', metal: 'steel', strap: 'leather', roman: true });
  w('Cartie', 'Ballon Bleu 36', 5500, { t: 'round', bezel: 'smooth', dial: '#f0efe9', metal: 'steel', strap: 'oyster', roman: true, crownGuard: true });
  w('TAG Hoyer', 'Carerra', 4000, { t: 'round', bezel: 'tachy', dial: '#1f3058', bzl: '#1c1c1c', metal: 'steel', strap: 'oyster', sub: '#d8dadf' }, { tier: 'premium' });
  w('TAG Hoyer', 'Monako', 5000, { t: 'square', bezel: 'none', dial: '#1e4fb5', metal: 'steel', strap: 'leather', sub: '#f4f4f2' }, { tier: 'premium' });
  w('TAG Hoyer', 'Aquaracer', 2400, { t: 'round', bezel: 'dive', dial: '#121316', bzl: '#121316', metal: 'steel', strap: 'oyster', date: true }, { tier: 'premium' });
  w('Breitlang', 'Navitimer B01', 6500, { t: 'round', bezel: 'slide', dial: '#121316', metal: 'steel', strap: 'leather', sub: '#d8dadf' }, { tier: 'premium' });
  w('Breitlang', 'Superocean 42', 3500, { t: 'round', bezel: 'dive', dial: '#f2c218', bzl: '#121316', metal: 'steel', strap: 'rubber' }, { tier: 'premium' });
  w('Panerey', 'Luminor Marina', 6000, { t: 'cushion', bezel: 'smooth', dial: '#2a2a2a', metal: 'steel', strap: 'leather' }, { tier: 'premium' });
  w('IVC', 'Portugieser Chrono', 8000, { t: 'round', bezel: 'smooth', dial: '#f4f4f2', metal: 'steel', strap: 'leather', sub: '#1e3f6e' }, { tier: 'premium' });
  w('IVC', 'Big Pilot', 11000, { t: 'pilot', bezel: 'smooth', dial: '#121316', metal: 'steel', strap: 'leather' }, { tier: 'premium' });
  w('Tudar', 'Black Bay 58', 3500, { t: 'round', bezel: 'dive', dial: '#121316', bzl: '#1e3f6e', metal: 'steel', strap: 'oyster' }, { tier: 'premium' });
  w('Tudar', 'Pelagos 39', 4000, { t: 'round', bezel: 'dive', dial: '#121316', bzl: '#121316', metal: 'titanium', strap: 'oyster' }, { tier: 'premium' });
  w('Seyko', 'Presago «Cocktail Time»', 350, { t: 'round', bezel: 'smooth', dial: '#2c6fb5', metal: 'steel', strap: 'leather', date: true }, { tier: 'mid' });
  w('Seyko', 'Prospex «Turtle»', 400, { t: 'cushion', bezel: 'dive', dial: '#121316', bzl: '#121316', metal: 'steel', strap: 'rubber', date: true }, { tier: 'mid' });
  w('Seyko', '5 Sports', 250, { t: 'round', bezel: 'dive', dial: '#1e3f6e', bzl: '#1e3f6e', metal: 'steel', strap: 'oyster', date: true }, { tier: 'mid' });
  w('Grand Seyko', '«Snowflake» SBGA211', 5500, { t: 'round', bezel: 'smooth', dial: '#f4f6f8', metal: 'titanium', strap: 'oyster', date: true }, { tier: 'premium' });
  w('Cassio', 'G‑Shok DW‑5600', 60, { t: 'digital', bezel: 'none', dial: '#9da78a', metal: 'plastic', strap: 'resin', case: '#1c1c1c' }, { tier: 'cheap', colors: ['black'] });
  w('Cassio', 'G‑Shok GA‑2100 «CasiOak»', 100, { t: 'octagon', bezel: 'none', dial: '#1c1c1c', metal: 'plastic', strap: 'resin', case: '#1c1c1c' }, { tier: 'cheap' });
  w('Cassio', 'F‑91W', 20, { t: 'digital', bezel: 'none', dial: '#9da78a', metal: 'plastic', strap: 'resin', case: '#2a2a2a' }, { tier: 'cheap' });
  w('Cassio', 'A168 Gold', 50, { t: 'digital', bezel: 'none', dial: '#9da78a', metal: 'gold', strap: 'mesh', case: '#d4af37' }, { tier: 'cheap' });
  w('Cassio', 'G‑Shok Full Metal', 450, { t: 'digital', bezel: 'none', dial: '#1c1c1c', metal: 'steel', strap: 'oyster', case: '#bfc2c6' }, { tier: 'mid' });
  w('Citisen', 'Promaster Diver', 250, { t: 'round', bezel: 'dive', dial: '#121316', bzl: '#121316', metal: 'steel', strap: 'rubber', date: true }, { tier: 'mid' });
  w('Hamiltan', 'Khaki Field Mechanical', 450, { t: 'round', bezel: 'smooth', dial: '#2a2c22', metal: 'steel', strap: 'nato' }, { tier: 'mid' });
  w('Swotch', 'MoonSwotch «Mission to Mars»', 270, { t: 'round', bezel: 'tachy', dial: '#c84a2a', bzl: '#c84a2a', metal: 'plastic', strap: 'rubber', sub: '#1c1c1c', case: '#c84a2a' }, { tier: 'mid', hype: 1.2 });
  w('Pear', 'Watch Series 7', 150, { t: 'smart', bezel: 'none', dial: '#000000', metal: 'alu', strap: 'rubber' }, { tier: 'mid', colors: ['midnight', 'starlight', 'red', 'green'] });
  w('Pear', 'Watch Series 10', 300, { t: 'smart', bezel: 'none', dial: '#000000', metal: 'alu', strap: 'rubber' }, { tier: 'mid', colors: ['jetblack', 'silver', 'rosegold'] });
  w('Pear', 'Watch Ultra 2', 550, { t: 'smart', bezel: 'ultra', dial: '#000000', metal: 'titanium', strap: 'nato' }, { tier: 'mid', colors: ['natti', 'blackti'] });
  w('Samsong', 'Galaxi Watch 7', 160, { t: 'round', bezel: 'none', dial: '#000000', metal: 'alu', strap: 'rubber', smart: true }, { tier: 'mid', colors: ['graphite', 'silver', 'green'] });
  w('Ракетта', 'СССР 2609', 80, { t: 'round', bezel: 'smooth', dial: '#e9e2cf', metal: 'steel', strap: 'leather', vintage: true }, { tier: 'vintage', year: 1975 });
  w('Полётт', '«Штурманские» 1950‑х', 450, { t: 'round', bezel: 'smooth', dial: '#121316', metal: 'steel', strap: 'leather', vintage: true, sub: '#2a2a2a' }, { tier: 'vintage', year: 1955, rare: 1 });
  w('Вастокк', 'Амфибия', 90, { t: 'round', bezel: 'dive', dial: '#1e3f6e', bzl: '#121316', metal: 'steel', strap: 'mesh' }, { tier: 'vintage', year: 1985 });
  w('Вастокк', '«Командирские»', 60, { t: 'round', bezel: 'smooth', dial: '#2d4b2a', metal: 'steel', strap: 'leather', star: true }, { tier: 'vintage', year: 1988 });
  w('Победда', 'ЧЧЗ 1950‑х', 120, { t: 'round', bezel: 'smooth', dial: '#efe6cf', metal: 'steel', strap: 'leather', vintage: true }, { tier: 'vintage', year: 1952 });

  // ------------------------------------------------------------------ JEWELRY (fixed)
  const j = (brand, name, price, a, o = {}) => add('jewelry', brand, name, price, o.year || 2022, a, { colors: o.colors || ['yellow'], tier: o.tier || 'lux', vars: o.vars || [['', 1]], ...o });
  const metals = ['ygold', 'rgold', 'wgold'];
  j('Cartie', 'Love Bracelet', 7500, { t: 'love' }, { colors: metals, vars: [['16', 1], ['17', 1], ['18', 0.98], ['19', 0.95]] });
  j('Cartie', 'Love Bracelet с бриллиантами', 15000, { t: 'love', gem: '#e8f4ff' }, { colors: metals, rare: 1 });
  j('Cartie', 'Love Ring', 1900, { t: 'ring', love: true }, { colors: metals });
  j('Cartie', 'Juste un Clou', 6500, { t: 'nail' }, { colors: metals });
  j('Cartie', 'Trinity Ring', 1500, { t: 'trinity' }, { colors: ['ygold'] });
  for (const [n, h, p] of [['Malachite', '#1f8a4c', 3800], ['Onyx', '#121316', 3600], ['Mother‑of‑Pearl', '#f2efe8', 3700], ['Carnelian', '#c4441c', 3900], ['Turquoise', '#3fc1c9', 4600]]) {
    j('Van Klif', `Vintage Alhambro ${n}`, p, { t: 'clover', gem: h }, { colors: ['ygold'] });
  }
  j('Van Klif', 'Magic Alhambro Bracelet', 6500, { t: 'clovers', gem: '#121316' }, { colors: ['ygold'] });
  j('Van Klif', 'Sweet Alhambro', 1800, { t: 'clover', gem: '#c4441c', small: true }, { colors: ['ygold', 'rgold'] });
  j('Tiffani', 'T Wire Bracelet', 2400, { t: 'cuff' }, { colors: ['ygold', 'rgold', 'silver'] });
  j('Tiffani', 'Return to Tiffani Heart Tag', 450, { t: 'heart' }, { colors: ['silver'], tier: 'mid' });
  j('Tiffani', 'Solitaire 1 ct', 12000, { t: 'ring', gem: '#eef7ff', big: true }, { colors: ['platinum'], vars: [['0.5 ct', 0.45], ['1 ct', 1], ['1.5 ct', 1.9], ['2 ct', 3.1]] });
  j('Tiffani', 'Elsa Peretto Bean', 450, { t: 'pendant', bean: true }, { colors: ['silver', 'ygold'], tier: 'mid' });
  j('Bulgary', 'Serpenti Viper', 3500, { t: 'serpent' }, { colors: ['rgold', 'ygold'] });
  j('Bulgary', 'B.zero1 Ring', 1800, { t: 'band' }, { colors: ['ygold', 'rgold', 'wgold'] });
  j('Pandorra', 'Moments Bracelet', 80, { t: 'charm' }, { colors: ['silver'], tier: 'cheap' });
  j('Swarovsky', 'Колье с кристаллами', 120, { t: 'pendant', gem: '#cfe8ff' }, { colors: ['silver'], tier: 'cheap' });
  j('Mikimotto', 'Жемчужное ожерелье', 3500, { t: 'pearls' }, { colors: ['cream2'] });
  j('Ювелир', 'Цепь «Бисмарк» 585, 20 г', 1100, { t: 'chain', thick: 2 }, { colors: ['ygold'], tier: 'gold' });
  j('Ювелир', 'Браслет «Кубинка» 585, 50 г', 2700, { t: 'cuban' }, { colors: ['ygold'], tier: 'gold' });
  j('Ювелир', 'Кольцо 585 с бриллиантом 0.3 ct', 900, { t: 'ring', gem: '#eef7ff' }, { colors: ['ygold', 'wgold'], tier: 'gold' });
  j('Ювелир', 'Серьги‑пусеты 0.5 ct', 1200, { t: 'earrings', gem: '#eef7ff' }, { colors: ['wgold'], tier: 'gold' });
  j('Ювелир', 'Обручальное кольцо 585', 250, { t: 'band' }, { colors: ['ygold', 'rgold'], tier: 'gold' });
  j('Ювелир', 'Печатка 583 (СССР)', 520, { t: 'signet' }, { colors: ['rgold'], tier: 'gold', year: 1980 });
  j('Ювелир', 'Крестик 585', 300, { t: 'cross' }, { colors: ['ygold'], tier: 'gold' });
  j('Ювелир', 'Цепь Cuban 925 серебро', 150, { t: 'chain', thick: 3 }, { colors: ['silver'], tier: 'cheap' });
  j('Ювелир', 'Кольцо с рубином 1 ct', 2200, { t: 'ring', gem: '#c4102a' }, { colors: ['ygold', 'wgold'], tier: 'gold' });
  j('Ювелир', 'Кольцо с изумрудом 1 ct', 2600, { t: 'ring', gem: '#1f9a5a' }, { colors: ['ygold', 'wgold'], tier: 'gold' });
  j('Ювелир', 'Кольцо с сапфиром 1 ct', 2000, { t: 'ring', gem: '#1e3f9a' }, { colors: ['wgold'], tier: 'gold' });

  // ------------------------------------------------------------------ PERFUME
  const pf = (brand, name, price, year, a, o = {}) => add('perfume', brand, name, price, year, a, { colors: ['bottle'], vars: o.vars || [['50 мл', 0.65], ['100 мл', 1], ['200 мл', 1.6]], ...o });
  pf('Shanel', 'N°6 Eau de Parfum', 155, 2024, { t: 'rect', liquid: '#f1d27a', cap: '#f4f4f2', label: 'N°6' });
  pf('Shanel', 'Coco Mamuazel', 160, 2024, { t: 'rect', liquid: '#f2b6a0', cap: '#f4f4f2', label: 'COCO' });
  pf('Shanel', 'Bleu de Shanel', 165, 2024, { t: 'rect', liquid: '#1d2a4a', cap: '#1d2a4a', label: 'BLEU' });
  pf('Shanel', 'Chance Eau Tendre', 150, 2024, { t: 'round', liquid: '#f6c9d4', cap: '#f4f4f2', label: 'CHANCE' });
  pf('Diorr', 'Savage EDT', 115, 2024, { t: 'tall', liquid: '#3a5a8a', cap: '#1c1c1c', label: 'SAVAGE' });
  pf('Diorr', 'Savage Elixir', 175, 2024, { t: 'tall', liquid: '#7a3a1a', cap: '#1c1c1c', label: 'ELIXIR' });
  pf('Diorr', "J'adorr", 150, 2024, { t: 'amphora', liquid: '#f1d27a', cap: '#d4af37', label: "J'ADORR" });
  pf('Diorr', 'Miss Diorr', 160, 2024, { t: 'square', liquid: '#f6b8c8', cap: '#d8dadf', label: 'MISS' });
  pf('Kreed', 'Adventus', 495, 2024, { t: 'apothecary', liquid: '#f2ead8', cap: '#1c1c1c', label: 'ADVENTUS' }, { hype: 1.05 });
  pf('Kreed', 'Adventus (батч 2010)', 495, 2010, { t: 'apothecary', liquid: '#efe0b8', cap: '#1c1c1c', label: 'ADVENTUS' }, { fixed: true, price: 1300, rare: 2 });
  pf('Kreed', 'Silver Mountain Water', 445, 2024, { t: 'apothecary', liquid: '#cfe8ff', cap: '#c0c0c0', label: 'SILVER' });
  pf('Tom Fort', 'Tobacco Vanille', 360, 2024, { t: 'square', liquid: '#7a4a1a', cap: '#3a2a1a', label: 'TOBACCO' });
  pf('Tom Fort', 'Lost Cherri', 395, 2024, { t: 'square', liquid: '#9a0f2a', cap: '#9a0f2a', label: 'CHERRI' });
  pf('Tom Fort', 'Oud Wood', 350, 2024, { t: 'square', liquid: '#3a2a1a', cap: '#3a2a1a', label: 'OUD' });
  pf('Maison Francis Kurkdjan', 'Bakkara Rouge 540', 325, 2024, { t: 'facet', liquid: '#e85a3a', cap: '#d4af37', label: '540' }, { hype: 1.05 });
  pf('La Labo', 'Santal 34', 330, 2024, { t: 'lab', liquid: '#efe7d3', cap: '#1c1c1c', label: 'SANTAL 34' });
  pf('Bayredo', 'Gypsy Water', 210, 2024, { t: 'cyl', liquid: '#f3ead8', cap: '#1c1c1c', label: 'GYPSY' });
  pf('Juliet Has a Spoon', 'Not a Perfume', 90, 2024, { t: 'spray', liquid: '#f6f3ec', cap: '#d8dadf', label: 'NOT A' });
  pf('Gucchi', 'Bloom', 140, 2024, { t: 'rect', liquid: '#f6b8c8', cap: '#f6b8c8', label: 'BLOOM' });
  pf('Saint Laurant', 'Libre', 150, 2024, { t: 'rect', liquid: '#f1d27a', cap: '#1c1c1c', label: 'LIBRE' });
  pf('Saint Laurant', 'Black Opiumm', 140, 2024, { t: 'cyl', liquid: '#1c1c1c', cap: '#c88ab8', label: 'OPIUMM' });
  pf('Guerlen', 'Shalimarr', 130, 2024, { t: 'amphora', liquid: '#d4a23a', cap: '#1e3f9a', label: 'SHALIMARR' });
  pf('Armany', 'Acqua di Gioo', 110, 2024, { t: 'rect', liquid: '#cfe8ff', cap: '#c0c0c0', label: 'GIOO' });
  pf('Versache', 'Eross', 100, 2024, { t: 'rect', liquid: '#1fa38a', cap: '#d4af37', label: 'EROSS' });
  pf('Pako Rabann', '1 Billion', 100, 2024, { t: 'bar', liquid: '#d4af37', cap: '#d4af37', label: '1 BILLION' });
  pf('JPG', 'Le Malle', 110, 2024, { t: 'torso', liquid: '#5a8ad4', cap: '#c0c0c0', label: 'LE MALLE' });
  pf('Hermez', "Terre d'Hermez", 130, 2024, { t: 'square', liquid: '#c47a2a', cap: '#c47a2a', label: 'TERRE' });
  pf('Initto', 'Oud for Greatness', 360, 2024, { t: 'cyl', liquid: '#3a1a4a', cap: '#d4af37', label: 'OUD' });
  pf('Parfum de Marlie', 'Layton', 335, 2024, { t: 'apothecary', liquid: '#efe0b8', cap: '#c0c0c0', label: 'LAYTON' });
  pf('Lattifa', 'Khamrah', 35, 2024, { t: 'facet', liquid: '#c4441c', cap: '#d4af37', label: 'KHAMRAH' }, { hype: 1.0 });
  pf('Zarra', 'Vibrant Leather', 30, 2024, { t: 'rect', liquid: '#7a4a1a', cap: '#1c1c1c', label: 'ZARRA' });
  pf('Новая Заря', 'Красная Москва (СССР)', 40, 1975, { t: 'kremlin', liquid: '#9a3a1a', cap: '#9a0f2a', label: 'КМ' }, { fixed: true, price: 85, vars: [['45 мл', 1]] });
  pf('Новая Заря', 'Шипр (винтаж)', 10, 1980, { t: 'flask', liquid: '#2a6a3a', cap: '#c0c0c0', label: 'ШИПР' }, { fixed: true, price: 25, vars: [['100 мл', 1]] });
}
