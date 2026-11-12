// Builds English text prompts for the item photo generator (scripts/gen_photos.py): one realistic
// "second-hand listing photo" per catalogue model, plus worn/dirty and broken variants.
// The in-game brands are parodies; for the image model we use the real-world names they parody so the
// photos show recognisable products. Usage: node scripts/photo_prompts.mjs > photo_prompts.json
import { MODELS, COLORS } from '../js/data/catalog.js';
import { RNG } from '../js/core/rng.js';

const BRAND = {
  Vivvo: 'Vivo', Opo: 'Oppo', Nofing: 'Nothing', 'Kuler Mastar': 'Cooler Master', Montek: 'Montech',
  Intell: 'Intel', AMB: 'AMD', MSE: 'MSI', Gigabait: 'Gigabyte', ASRok: 'ASRock', Corsar: 'Corsair', 'G.Skil': 'G.Skill', 'be quite!': 'be quiet!', Seasonik: 'Seasonic', Deepkool: 'DeepCool', NZXX: 'NZXT', 'Lian Lee': 'Lian Li', Fractel: 'Fractal Design', Zalmen: 'Zalman', Noctuo: 'Noctua', Arktik: 'Arctic', 'ID‑Kuler': 'ID-COOLING',
  Kingstone: 'Kingston', SanDisc: 'SanDisk', Transcand: 'Transcend', Apricorm: 'Apricorn', Lexxar: 'Lexar', Hitachy: 'Hitachi', 'Westen Digital': 'Western Digital', Seagait: 'Seagate', Toshibo: 'Toshiba', Crucal: 'Crucial', LaCi: 'LaCie', Synologi: 'Synology', Quantim: 'Quantum', Iomego: 'Iomega', Verbatum: 'Verbatim', TDQ: 'TDK', Olimpus: 'Olympus',
  Pear: 'Apple', Samsong: 'Samsung', Xiaomo: 'Xiaomi', Gugle: 'Google', Huawai: 'Huawei', OnePlas: 'OnePlus', Tekno: 'Tecno', Honar: 'Honor', Sonny: 'Sony', Nokla: 'Nokia', Motorolla: 'Motorola', Vertuo: 'Vertu', BlackBerri: 'BlackBerry',
  ThinkPed: 'Lenovo ThinkPad', Delll: 'Dell', Azus: 'Asus', Razar: 'Razer', Microsaft: 'Microsoft', Lenova: 'Lenovo', Acerr: 'Acer', HPP: 'HP', Kindel: 'Amazon Kindle', Canonn: 'Canon', Fujifim: 'Fujifilm', Nikkon: 'Nikon', Leyca: 'Leica', 'Зенитт': 'Zenit', GoPra: 'GoPro', DGI: 'DJI', Nvidio: 'Nvidia', Radeen: 'AMD Radeon', Metta: 'Meta', Kayschron: 'Keychron', 'Teenage Engeneering': 'Teenage Engineering',
  Nintendu: 'Nintendo', Segga: 'Sega', Steem: 'Valve Steam', Atary: 'Atari', 'Денди': 'Dendy', Anbernyk: 'Anbernic', Boze: 'Bose', Beets: 'Beats', Marshell: 'Marshall', JBK: 'JBL', 'Ray‑Bann': 'Ray-Ban', Oaklee: 'Oakley', 'Gentle Monsta': 'Gentle Monster', Cartie: 'Cartier',
  'Louis Vuittan': 'Louis Vuitton', Hermez: 'Hermes', Gucchi: 'Gucci', Ferragamma: 'Ferragamo', 'New Eraa': 'New Era', Supremo: 'Supreme', Stanli: 'Stanley', Ankerr: 'Anker', 'Тамагоша': 'Tamagotchi', Nikey: 'Nike', Adibas: 'Adidas', 'New Balanse': 'New Balance', Asiks: 'Asics', Pumo: 'Puma', Vanz: 'Vans', Converze: 'Converse', Salamon: 'Salomon', Balenciago: 'Balenciaga', Hokka: 'Hoka', Onn: 'On Running', 'Golden Gooze': 'Golden Goose', Timberlend: 'Timberland', MSCHIF: 'MSCHF', Kroks: 'Crocs',
  'Stone Iland': 'Stone Island', 'Off‑Whyte': 'Off-White', 'The Nord Face': 'The North Face', Pataguna: 'Patagonia', 'Canada Goos': 'Canada Goose', Monkler: 'Moncler', Prado: 'Prada', Balensiago: 'Balenciaga', 'Carhart WIP': 'Carhartt WIP', Stussi: 'Stussy', Baip: 'BAPE', 'Fear of Goats': 'Fear of God', 'Ralf Laurent': 'Ralph Lauren', "Levvi's": "Levi's", Uniclo: 'Uniqlo', Zarra: 'Zara', "Arc'tryx": "Arc'teryx", Burberri: 'Burberry', Kortez: 'Corteiz', Vetemenz: 'Vetements', 'Chrome Hartz': 'Chrome Hearts', 'Gallery Depo': 'Gallery Dept', Champyon: 'Champion', Moskino: 'Moschino', 'Ватник': 'Soviet',
  Shanel: 'Chanel', Diorr: 'Dior', Goyar: 'Goyard', 'Bottega Venetto': 'Bottega Veneta', Celinne: 'Celine', Fendy: 'Fendi', 'Saint Laurant': 'Saint Laurent', Lowee: 'Loewe', Coatch: 'Coach', 'Michael Corrs': 'Michael Kors', Jakemus: 'Jacquemus', 'Сумка из СССР': 'Soviet era',
  Rolecks: 'Rolex', Omego: 'Omega', 'Pateck Filip': 'Patek Philippe', 'Audemar Pigé': 'Audemars Piguet', 'TAG Hoyer': 'TAG Heuer', Breitlang: 'Breitling', Panerey: 'Panerai', IVC: 'IWC', Tudar: 'Tudor', Seyko: 'Seiko', 'Grand Seyko': 'Grand Seiko', Cassio: 'Casio', Citisen: 'Citizen', Hamiltan: 'Hamilton', Swotch: 'Swatch', 'Ракетта': 'Raketa', 'Полётт': 'Poljot', 'Вастокк': 'Vostok', 'Победда': 'Pobeda',
  'Van Klif': 'Van Cleef & Arpels', Tiffani: 'Tiffany', Bulgary: 'Bulgari', Pandorra: 'Pandora', Swarovsky: 'Swarovski', Mikimotto: 'Mikimoto', 'Ювелир': '',
  Kreed: 'Creed', 'Tom Fort': 'Tom Ford', 'Maison Francis Kurkdjan': 'Maison Francis Kurkdjian', 'La Labo': 'Le Labo', Bayredo: 'Byredo', 'Juliet Has a Spoon': 'Juliette Has a Gun', Guerlen: 'Guerlain', Armany: 'Armani', Versache: 'Versace', 'Pako Rabann': 'Paco Rabanne', JPG: 'Jean Paul Gaultier', Initto: 'Initio', 'Parfum de Marlie': 'Parfums de Marly', Lattifa: 'Lattafa', 'Новая Заря': 'Soviet Novaya Zarya',
  'Pocketmon TCG': 'Pokemon', 'Magik: The Gathering': 'Magic The Gathering', 'Yu‑Gi‑Uh!': 'Yu-Gi-Oh', Flier: 'Fleer', Toppz: 'Topps', Paninni: 'Panini', 'O‑Pi‑Chi': 'O-Pee-Chee', Marvle: 'Marvel', 'DK Comix': 'DC Comics', Shuueisha: 'Shueisha manga', Kodanshya: 'Kodansha manga', Hakusenshya: 'Hakusensha manga', 'Мурзилка': 'Soviet children magazine', 'Весёлые картинки': 'Soviet children magazine',
  LEGGO: 'LEGO', LEPINO: 'LEPIN', 'Funky Pop': 'Funko Pop', Bearbrik: 'Bearbrick', KAWZ: 'KAWS', 'Hot Toyz': 'Hot Toys', 'Pop Marte': 'Pop Mart', Lafufu: 'Labubu', Bandaii: 'Bandai', Taiger: 'Tiger Electronics', 'Hot Wheelz': 'Hot Wheels', Mattell: 'Mattel', Hasbroh: 'Hasbro', Kennerr: 'Kenner', Rubikk: 'Rubik', 'Электронника': 'Soviet Elektronika', 'СССР': 'Soviet',
  Fander: 'Fender', Gibsen: 'Gibson', Martyn: 'Martin', Taylar: 'Taylor', Yamahha: 'Yamaha', 'Урал': 'Ural', Korgg: 'Korg', Rolland: 'Roland', Mogg: 'Moog', Stradivarri: 'old', Selmar: 'Selmer', Pearll: 'Pearl', Kalla: 'Kala',
  'Ладда': 'Lada', 'Волго': 'GAZ Volga', 'Москвичок': 'Moskvich', 'Запорожик': 'ZAZ Zaporozhets', 'Уазон': 'UAZ', BMV: 'BMW', Merzedes: 'Mercedes-Benz', Audy: 'Audi', Volksvagon: 'Volkswagen', Toyoda: 'Toyota', Nissen: 'Nissan', Hondo: 'Honda', Mazdo: 'Mazda', Mitsubishy: 'Mitsubishi', Subaro: 'Subaru', Hyondai: 'Hyundai', Kio: 'Kia', Fard: 'Ford', Chevi: 'Chevrolet', Dodje: 'Dodge', Tesler: 'Tesla', Porshe: 'Porsche', Ferrara: 'Ferrari', Lamborjini: 'Lamborghini', Bentlee: 'Bentley', 'Rols‑Roys': 'Rolls-Royce', 'Range Rovar': 'Range Rover', Lexsus: 'Lexus', Gilly: 'Geely', Cheri: 'Chery', Havall: 'Haval', 'Lee Auto': 'Li Auto', Zeeker: 'Zeekr', BYT: 'BYD', Deo: 'Daewoo', Reno: 'Renault', Shkoda: 'Skoda', Opal: 'Opel', Pejo: 'Peugeot', Fiet: 'Fiat', Mimi: 'Mini Cooper', Smarty: 'Smart', Valvo: 'Volvo',
  'Стелс': 'Stels', Gaint: 'Giant', Speshalized: 'Specialized', Trekk: 'Trek', Cannondal: 'Cannondale', Brompten: 'Brompton', Mongus: 'Mongoose', 'Кама': 'Soviet Kama', 'Аист': 'Soviet Aist', Ninebott: 'Ninebot', 'Кугу': 'Kugoo', Vesppa: 'Vespa', Kawasakki: 'Kawasaki', Duccati: 'Ducati', 'Harlee‑Davidsan': 'Harley-Davidson', 'Уралл': 'Ural', 'Ява': 'Jawa', 'Минскк': 'Minsk', 'Восход': 'Voskhod',
  'Claude Monnay': 'Claude Monet', 'Vincent van Goff': 'Vincent van Gogh', 'Pablo Picazzo': 'Pablo Picasso', 'Kazimir Malevsky': 'Kazimir Malevich', 'Mark Rotkko': 'Mark Rothko', 'Jean‑Michel Baskia': 'Jean-Michel Basquiat', 'Frida Kallo': 'Frida Kahlo', 'Andy Warhole': 'Andy Warhol', Banksi: 'Banksy', 'Yayoi Kusamma': 'Yayoi Kusama', 'Damien Hirsch': 'Damien Hirst', 'Takashi Murakamy': 'Takashi Murakami', 'Jeff Kuns': 'Jeff Koons',
  'The Beatlz': 'The Beatles', 'Pink Floid': 'Pink Floyd', 'Michael Jaxon': 'Michael Jackson', Nirvanna: 'Nirvana', 'Daft Punkk': 'Daft Punk', 'Фаберджи': 'Faberge', 'Баташов': 'Batashev', 'ЛФЗ': 'Lomonosov porcelain', 'Андервуд': 'Underwood', "His Master's Vois": "His Master's Voice", 'Павел Бурэ': 'Pavel Buhre', 'Тонет': 'Thonet', 'Монетный двор': '', 'US Mint': 'US', 'Банк России': 'Russian', 'НБУ': 'Ukrainian', 'US Treasury': 'US', 'Royal Post': 'British', 'US Post': 'US', 'Почта СССР': 'Soviet',
  'Tasmanian Tigr': 'Tasmanian Tiger', 'Mil‑Tek': 'Mil-Tec', Eastpack: 'Eastpak', Fjallraven: 'Fjallraven', Samsonaite: 'Samsonite', Rimova: 'Rimowa', Filsen: 'Filson', Shoeii: 'Shoei', 'AGV‑X': 'AGV', Araii: 'Arai', Bel: 'Bell', 'Opz‑Kor': 'Ops-Core', Zippa: 'Zippo', BIK: 'BIC', Victorinoks: 'Victorinox',
};
const FIX = [[/iPud/g, 'iPod'], [/DataTravelar/g, 'DataTraveler'], [/Cruzar/g, 'Cruzer'], [/JetFlesh/g, 'JetFlash'], [/AliExpres/g, 'AliExpress'], [/iFone/g, 'iPhone'], [/Galaxi/g, 'Galaxy'], [/Pixl/g, 'Pixel'], [/Redmo/g, 'Redmi'], [/Poko/g, 'Poco'], [/MacBuk/g, 'MacBook'], [/AirBuds/g, 'AirPods'], [/PlayStatien/g, 'PlayStation'], [/Jordon/g, 'Jordan'], [/Yeezo/g, 'Yeezy'], [/Birkan/g, 'Birkin'], [/Submarine\b/g, 'Submariner'], [/Stratocastor/g, 'Stratocaster'], [/Charizzard/g, 'Charizard'], [/Lotos/g, 'Lotus'], [/Batmann/g, 'Batman'], [/Star Warz/g, 'Star Wars'], [/Millennium Hawk/g, 'Millennium Falcon'], [/Daytone/g, 'Daytona'], [/Speedmaster/g, 'Speedmaster'], [/Forse/g, 'Force'], [/Dunck/g, 'Dunk'], [/Yeezi/g, 'Yeezy'], [/Gameboy|GameBoi/g, 'Game Boy'], [/\bDank\b/g, 'Dunk'], [/Gyaradoss/g, 'Gyarados'], [/Piace/g, 'Piece'], [/Fyrby/g, 'Furby'], [/Blastoisse/g, 'Blastoise'], [/Pikachoo/g, 'Pikachu'], [/Mewtwoo/g, 'Mewtwo'], [/Statien/g, 'Station']];
const NOUN = {
  pcparts: (a) => ({ cpu: 'desktop CPU processor chip, top view of the heat spreader', mb: 'computer motherboard', ram: 'pair of DDR desktop RAM memory sticks', psu: 'ATX computer power supply unit with cables', case: 'empty PC tower case with a glass side panel', cooler: 'CPU cooler' }[a.t] || 'computer part'),
  storage: (a) => ({ usb: 'USB flash drive', secure: 'encrypted USB flash drive with a numeric keypad', sd: 'SD memory card', microsd: 'microSD memory card with an SD adapter', dashcam: 'microSD memory card from a dashcam',
    cf: 'CompactFlash memory card', memstick: 'Sony Memory Stick PRO Duo card', hdd: 'bare 3.5-inch internal hard disk drive with a white label', office: 'old bare 3.5-inch internal hard disk drive with a white label and a handwritten sticker',
    hdd25: 'bare 2.5-inch laptop hard disk drive', ssd: '2.5-inch SATA SSD drive', nvme: 'M.2 NVMe SSD stick', exthdd: 'portable external hard drive with a USB cable', extssd: 'portable external SSD',
    nas: 'two-bay NAS network storage box', tape: 'LTO backup tape cartridge', zip: 'Iomega Zip disk', cd: 'burned CD-R disc with a handwritten marker title in a cracked jewel case',
    dvd: 'burned DVD-R disc with a handwritten marker title', gamecd: 'PC game CD in a cardboard box from 2004', floppy: 'old floppy disk with a handwritten label', cassette: 'audio cassette tape with a handwritten label',
    vhs: 'VHS video cassette with a handwritten label', minidv: 'MiniDV camcorder tape cassette', minidisc: 'MiniDisc', ipod: 'iPod classic music player', dictaphone: 'digital voice recorder dictaphone' }[a.t] || 'data storage device'),
  phones: (a) => (a.f === 'flip' || a.f === 'flipold' ? 'flip phone' : a.f === 'fold' ? 'foldable smartphone' : a.f === 'qwerty' ? 'BlackBerry style phone with keyboard' : a.f === 'retro' || a.f === 'slider' ? 'old mobile phone' : 'smartphone'),
  electronics: (a) => ({ laptop: 'laptop', tablet: 'tablet', camera: 'camera', drone: 'drone', gpu: 'graphics card', vr: 'VR headset', monitor: 'monitor', box: 'device', keyboard: 'keyboard', pc: 'custom-built gaming desktop PC tower with a glass side panel and RGB lighting' }[a.t] || 'gadget'),
  consoles: (a) => ({ ps1: 'original grey PS1 console from 1994 with a grey controller', ps2: 'black PS2 fat console with a DualShock 2 controller', ps2s: 'slim black PS2 console', ps3: 'glossy black PS3 console with controller', ps4: 'black PS4 console with a DualShock 4 controller', ps5: 'white PS5 console standing upright with a DualSense controller', psp: 'black PSP handheld console', xbox: 'original black Xbox console from 2001 with controller', x360: 'white Xbox 360 console with a white controller', xone: 'black Xbox One console with controller', xss: 'small white Xbox Series S console', xsx: 'black Xbox Series X tower console', nes: 'grey NES console with a rectangular controller', snes: 'grey Super Nintendo console with controller', n64: 'black Nintendo 64 console with its three-handled controller', cube: 'purple cube-shaped GameCube console', wii: 'white Wii console with a Wii remote', switch: 'Nintendo Switch console with red and blue joy-con controllers', switchlite: 'Nintendo Switch Lite handheld', gb: 'original grey Game Boy handheld from 1989', gbc: 'Game Boy Color handheld', gba: 'Game Boy Advance handheld', ds: 'Nintendo DS clamshell handheld', mega: 'black Sega Mega Drive console with controller', dream: 'white Sega Dreamcast console with controller', deck: 'Steam Deck handheld gaming pc', atari: 'Atari 2600 console with wood panel and joystick', dendy: 'retro famiclone console with a yellow cartridge' }[a.t] || 'video game console'),
  accessories: (a) => ({ buds: 'wireless earbuds in charging case', headphones: 'headphones', speaker: 'bluetooth speaker', speaker2: 'portable speaker', glasses: 'sunglasses', aviator: 'aviator sunglasses', wallet: 'wallet', belt: 'leather belt', cap: 'baseball cap', cup: 'tumbler cup', brick: 'brick', tracker: 'tracker tag', pencil: 'stylus pencil', powerbank: 'power bank', action: 'action camera', keyfob: 'keychain' }[a.t] || 'accessory'),
  sneakers: (a) => ({ high: 'high-top sneakers', low: 'low sneakers', mid: 'mid sneakers', runner: 'running shoes', knit: 'knit sneakers', chunky: 'chunky sneakers', slide: 'slides', court: 'court sneakers', skate: 'skate shoes', canvas: 'canvas sneakers', boot: 'boots', cartoon: 'big red cartoon boots', clog: 'clogs' }[a.t] || 'sneakers'),
  clothing: (a) => ({ hoodie: 'hoodie', tee: 't-shirt', jacket: 'jacket', puffer: 'puffer jacket', sweat: 'sweatshirt', fleece: 'fleece jacket', parka: 'parka', track: 'track jacket', beanie: 'beanie hat', pants: 'pants', knit: 'knit sweater', polo: 'polo shirt', jeans: 'jeans', coat: 'coat' }[a.t] || 'clothing'),
  bags: (a) => (a.t === 'backpack' ? 'leather backpack' : a.t === 'net' ? 'string net shopping bag' : a.t === 'clutch' ? 'clutch bag' : a.t === 'tote' ? 'tote bag' : 'handbag'),
  watches: (a) => (a.t === 'digital' ? 'digital watch' : a.t === 'smart' ? 'smartwatch' : 'wristwatch'),
  jewelry: (a) => ({ ring: 'ring', band: 'ring', signet: 'signet ring', nail: 'nail bracelet', love: 'bracelet', cuff: 'cuff bracelet', serpent: 'snake bracelet', pendant: 'pendant necklace', pearls: 'pearl necklace', chain: 'gold chain', cuban: 'cuban link chain', earrings: 'earrings', cross: 'cross pendant', heart: 'heart pendant', charm: 'charm bracelet', clover: 'clover necklace', clovers: 'clover bracelet', trinity: 'trinity ring' }[a.t] || 'jewelry'),
  perfume: () => 'perfume bottle', cards: (a) => (a.t === 'box' ? 'sealed trading card booster box' : a.t === 'pack' ? 'sealed booster pack' : a.t === 'album' ? 'sticker album' : 'trading card in a protective sleeve'),
  comics: () => 'printed paper comic book issue (a real physical magazine, not on a screen)', toys: (a) => ({ brickbox: 'sealed LEGO set box', minifig: 'LEGO minifigure', pop: 'vinyl figure in box', bear: 'designer bear figure', kawz: 'designer art toy', boxfig: 'action figure in box', labobo: 'plush monster toy', tama: 'tamagotchi virtual pet', furby: 'furby toy', diecast: 'die-cast toy car', doll: 'doll', robot: 'toy robot', blister: 'action figure in blister pack', cube: 'rubik cube', handheld: 'handheld electronic game', plush: 'plush toy', matryoshka: 'matryoshka doll' }[a.t] || 'toy'),
  antiques: (a) => ({ samovar: 'antique brass samovar', teapot: 'antique porcelain teapot', vase: 'antique vase', egg: 'jeweled Faberge style egg', icon: 'antique orthodox icon', badge: 'vintage soviet pin badge', typewriter: 'vintage typewriter', gramophone: 'antique gramophone', pocketwatch: 'antique pocket watch', mantel: 'antique bronze mantel clock', carpet: 'persian carpet', spoons: 'antique silver spoons', radio: 'vintage tube radio', globe: 'antique globe', candle: 'antique candlestick', chess: 'vintage chess set', chest: 'antique wooden chest', chair: 'antique bentwood chair', rotary: 'vintage rotary phone', sword: 'katana sword' }[a.t] || 'antique'),
  art: (a) => (a.t === 'sculpt' ? 'small sculpture' : a.t === 'print' ? 'framed art print' : `framed ${a.style || ''} painting`),
  collectibles: (a) => ({ coin: `old ${a.metal || ''} coin`, banknote: 'old banknote', stamp: 'rare postage stamp', album: 'stamp album', vinyl: 'vinyl record with sleeve', ball: 'signed football', jersey: 'signed sports jersey', baseball: 'signed baseball', rock: 'meteorite rock', fossil: 'fossil', tooth: 'dinosaur tooth fossil', wrappers: 'vintage gum wrappers collection', pogs: 'pogs collection', kinder: 'kinder surprise toys collection', poster: 'vintage movie poster', pins: 'olympic pins collection', saber: 'replica lightsaber prop', ticket: 'old concert ticket' }[a.t] || 'collectible'),
  instruments: (a) => ({ strat: 'electric guitar', tele: 'electric guitar', bass: 'bass guitar', lp: 'electric guitar', sg: 'electric guitar', 335: 'semi-hollow guitar', acoustic: 'acoustic guitar', ural: 'old soviet electric guitar', keys: 'digital piano keyboard', synth: 'analog synthesizer', drummachine: 'drum machine', violin: 'violin', sax: 'saxophone', drums: 'drum kit', ukulele: 'ukulele' }[a.t] || 'musical instrument'),
  cars: (a) => ({ suv: 'SUV', pickup: 'pickup truck', van: 'van', hatch: 'hatchback', wagon: 'station wagon', coupe: 'coupe', sport: 'sports car', super: 'supercar', limo: 'limousine', jeep: 'off-road jeep', micro: 'small city car', roadster: 'roadster' }[a.body] || 'car'),
  bikes: (a) => ({ mtb: 'mountain bike', road: 'road bike', fold: 'folding bike', bmx: 'BMX bike', city: 'city bicycle', scooter: 'electric kick scooter', moped: 'moped', vespa: 'scooter', sport: 'sport motorcycle', naked: 'motorcycle', cruiser: 'cruiser motorcycle', adv: 'adventure motorcycle', sidecar: 'motorcycle with sidecar', classic: 'old soviet motorcycle' }[a.t] || 'bicycle'),
  gear: (a) => (/helmet/.test(a.sprite) ? 'helmet' : /suitcase/.test(a.sprite) ? 'suitcase' : /duffel/.test(a.sprite) ? 'duffel bag' : /mess/.test(a.sprite) ? 'messenger bag' : /gasmask/.test(a.sprite) ? 'old soviet gas mask' : /tactical/.test(a.sprite) ? 'tactical vest' : 'backpack'),
  misc: (a) => (/zippo|lighter|bic/.test(a.sprite) ? 'lighter' : /teddy/.test(a.sprite) ? 'old teddy bear' : /keys|keyfob/.test(a.sprite) ? 'keychain with keys' : /dogtag/.test(a.sprite) ? 'military dog tag' : /medal|star|wings/.test(a.sprite) ? 'military medal' : /skull/.test(a.sprite) ? 'skull keychain' : /compass/.test(a.sprite) ? 'vintage compass' : /flask/.test(a.sprite) ? 'hip flask' : /bottle/.test(a.sprite) ? 'vintage bottle' : /tin/.test(a.sprite) ? 'vintage tin box' : /usb/.test(a.sprite) ? 'usb flash drive' : /swiss/.test(a.sprite) ? 'swiss army knife' : 'small item'),
};
const SCENE = {
  phones: ['lying on a wooden kitchen table', 'held in a hand', 'on a white bed sheet', 'on a granite countertop', 'on a car seat', 'on an office desk next to a keyboard'],
  electronics: ['on an office desk', 'on a wooden table at home', 'on a bed', 'on a carpet floor'],
  consoles: ['on a carpet next to a TV stand', 'on a wooden floor', 'on a sofa', 'on a desk'],
  accessories: ['on a wooden table', 'on a bed sheet', 'on a desk', 'in a hand'],
  sneakers: ['standing on a wooden floor', 'standing on concrete pavement', 'lying on a bed', 'standing on a doormat in a hallway', 'standing next to the original box on a floor'],
  clothing: ['laid flat on a bed', 'hanging on a hanger on a door', 'laid flat on a wooden floor', 'on a sofa'],
  bags: ['on a sofa', 'on a bed', 'on a wooden table', 'on a shelf'],
  watches: ['lying on a wooden desk', 'lying on a leather notebook', 'in an open watch box', 'lying on a bed sheet'],
  jewelry: ['on a black velvet cloth', 'in an open jewelry box', 'on a white marble table', 'on a palm of a hand'],
  perfume: ['on a bathroom shelf', 'on a dresser', 'on a white table', 'next to the box on a table'],
  cards: ['on a wooden table', 'held in fingers', 'on a desk mat'], comics: ['on a wooden table', 'on a bed', 'on a shelf'],
  toys: ['on a shelf', 'on a wooden floor', 'on a table', 'on a carpet'], antiques: ['on an old wooden table', 'on a flea market stall', 'in a dusty attic', 'on a shelf'],
  art: ['hanging on a wall in an apartment', 'leaning against a wall on a floor', 'on an easel'], collectibles: ['on a wooden table', 'on a desk', 'in a hand'],
  instruments: ['leaning against a wall', 'on a sofa', 'in a home studio', 'on a bed'],
  cars: ['parked on a city street', 'parked in a residential yard', 'parked in a parking lot', 'parked by a garage'],
  bikes: ['parked on a sidewalk', 'leaning against a wall', 'in a garage', 'parked in a yard'],
  pcparts: ['on a wooden desk', 'on an anti-static mat', 'on a cardboard box', 'on a desk next to a keyboard', 'on a wooden table'],
  storage: ['on a wooden desk next to a keyboard', 'on a wooden table', 'in a hand', 'on a desk', 'on a cutting mat', 'on a dark cloth'],
  gear: ['on a floor', 'on a bed', 'on a table', 'in a garage'], misc: ['on a wooden table', 'in a hand', 'on a desk', 'on a dark cloth'],
};
const WORN = {
  phones: 'heavily used, scratched and scuffed body, dirty fingerprints, worn edges', sneakers: 'heavily worn, dirty, creased, scuffed, stained, dirty soles', clothing: 'worn, faded, stained, pilling fabric', bags: 'worn, scuffed corners, stained, cracked leather',
  pcparts: 'dusty, old, worn, scratched', storage: 'old, scratched, dusty, worn label, fingerprints', watches: 'worn, scratched case and glass, worn strap', cars: 'old, dirty, dusty, scratched paint, small dents', bikes: 'old, dirty, rusty chain, scratched frame', default: 'heavily used, dirty, dusty, scratched, worn',
};
const BROKEN = {
  phones: 'with a badly cracked shattered screen', electronics: 'broken, cracked, missing parts', consoles: 'broken, cracked case, missing buttons', sneakers: 'torn, sole coming apart, holes', clothing: 'torn, holes, ripped seams, stains', bags: 'torn, broken strap, peeling leather',
  pcparts: 'damaged, bent pins, burnt marks, broken parts', storage: 'damaged, cracked casing, bent connector', watches: 'with cracked glass, broken strap', cars: 'damaged, crashed bumper, dents, rust, broken headlight', bikes: 'damaged, bent wheel, rusty, broken parts', instruments: 'damaged, cracked body, broken strings', default: 'broken, damaged, cracked',
};
const colorEn = (k) => (COLORS[k]?.n?.[2] || '').toLowerCase();
const latin = (s) => s.replace(/[«»"]/g, '').replace(/[^\x20-\x7E‑]+/g, ' ').replace(/‑/g, '-').replace(/(^|\s)[-–(),.]+(?=\s|$)/g, ' ').replace(/\s+/g, ' ').trim();
// search terms for real photos (Wikimedia Commons): exact product first, then shorter fallbacks
export function searchFor(m) {
  const a = m.art || {};
  let name = m.name.replace(/(\d{3,4})[‑-]х/g, '$1s').replace(/«([^»]*)»/g, '$1');
  for (const [re, to] of FIX) name = name.replace(re, to);
  const real = latin(BRAND[m.brand] ?? m.brand);
  const nm = latin(name).replace(/\b(OG|GB|TB|ГБ)\b/g, '').replace(/\s+/g, ' ').trim();
  const noun = (NOUN[m.cat] || (() => 'item'))(a).replace(/^(original|used|old|antique|vintage|framed|small|signed|rare|sealed) /, '');
  const kind = a.t || a.body || '';
  const qs = [];
  const full = [real, nm].filter(Boolean).join(' ').trim();
  if (full.length > 3) qs.push(full);
  const short = [real, nm.split(' ').slice(0, 2).join(' ')].filter(Boolean).join(' ').trim();
  if (short.length > 3 && short !== full) qs.push(short);
  if (['antiques', 'collectibles', 'toys', 'misc', 'gear', 'art', 'jewelry', 'instruments'].includes(m.cat)) qs.push([real, noun].filter(Boolean).join(' '));
  if (!qs.length) qs.push(noun);
  const clip = `a photo of ${/^[aeiou]/i.test(full || noun) ? 'an' : 'a'} ${[full, noun].filter(Boolean).join(' ')}`.replace(/\s+/g, ' ');
  return { id: m.id, file: photoFile(m.id), cat: m.cat, kind, queries: [...new Set(qs)], clip, noun };
}
export const photoFile = (id) => { let h = 2166136261 >>> 0; for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
// other sides of the same item: same room/scene and seed as the clean shot, different angle
const ANGLE = {
  back: {
    phones: 'turned over, showing the back of the phone with the camera module', cars: 'seen from behind, rear view of the car with tail lights', bikes: 'seen from behind, rear view',
    sneakers: 'seen from the back, showing the heels', clothing: 'turned over, laid flat showing the back of the garment', watches: 'turned over, showing the steel caseback',
    bags: 'turned around, showing the back side of the bag', cards: 'turned over, showing the back of the card', comics: 'turned over, showing the back cover',
    art: 'turned around, showing the back of the canvas and the stretcher frame', electronics: 'seen from the back, showing the rear panel and ports', consoles: 'seen from the back, showing the rear ports and cables',
    perfume: 'turned around, showing the back of the bottle and the label', jewelry: 'turned over, showing the inside and the hallmark', instruments: 'turned over, showing the back of the instrument',
    pcparts: 'turned over, showing the back side', storage: 'turned over, showing the back side with the label and the serial number sticker', toys: 'turned around, showing the back of the box or figure', collectibles: 'turned over, showing the reverse side', default: 'turned around, showing the back side of the item',
  },
  side: {
    phones: 'lying on its back, seen from the side edge showing the buttons and the frame', cars: 'side profile view of the whole car', bikes: 'side profile view of the whole vehicle',
    sneakers: 'side profile view of one shoe', clothing: 'folded, showing the sleeve, the label and the stitching up close', watches: 'seen from the side, showing the crown and the case profile',
    bags: 'seen from the side, showing the side panel and the strap', cards: 'seen at a low angle from the side, showing the edges and the corners', comics: 'seen from the side, showing the spine',
    art: 'seen at an angle from the side, showing the frame edge', electronics: 'seen from the side, showing the edge and the ports', consoles: 'seen from the side at a low angle',
    perfume: 'seen from the side, showing the bottle profile and the cap', jewelry: 'seen from the side, showing the clasp and the profile', instruments: 'seen from the side, showing the body edge',
    pcparts: 'seen from the side at a low angle', storage: 'seen from the side, showing the connector and the edge', toys: 'seen from the side', collectibles: 'seen from the side at a low angle', default: 'seen from the side at a low angle',
  },
};
export function promptFor(m, variant = 'clean') {
  const angle = ANGLE[variant] ? variant : null;
  const r = new RNG('ph|' + m.id + '|' + (angle ? 'clean' : variant));
  const a = m.art || {};
  let name = m.name.replace(/(\d{3,4})[‑-]х/g, '$1s').replace(/\(([^)]*)\)/g, (x, y) => (/[a-z]/i.test(y) ? x : ''));
  for (const [re, to] of FIX) name = name.replace(re, to);
  const real = BRAND[m.brand] ?? m.brand;
  const nm = latin(name);
  const noun = (NOUN[m.cat] || (() => 'item'))(a);
  const col = m.cat === 'cars' ? colorEn(m.colors?.[0]) : ['sneakers', 'cards', 'comics', 'toys', 'antiques', 'art', 'collectibles', 'perfume', 'jewelry', 'gear', 'misc', 'storage', 'pcparts'].includes(m.cat) ? '' : colorEn(m.colors?.[0]);
  const year = m.cat === 'cars' || m.cat === 'bikes' ? (m.year || '') : '';
  const subj = [col, year, latin(real), nm && nm.length > 1 ? nm : '', noun].filter(Boolean).join(' ').replace(/\s+/g, ' ');
  const scene = r.pick(SCENE[m.cat] || SCENE.misc);
  const cond = variant === 'worn' ? (WORN[m.cat] || WORN.default) : variant === 'broken' ? (BROKEN[m.cat] || BROKEN.default) : 'used but in good condition';
  const hand = /hand|fingers|wrist/.test(scene);
  const veh = m.cat === 'cars' || m.cat === 'bikes';
  const phone = m.cat === 'phones';
  const view = angle ? ` Camera angle: ${ANGLE[angle][m.cat] || ANGLE[angle].default}.` : '';
  const prompt = `Casual snapshot taken at home by the owner: ${subj}, ${cond}, ${scene}.${view} ${veh ? 'The whole vehicle is in frame.' : angle ? 'The whole item is in frame.' : 'The whole item is in frame, shot from above at a slight angle.'} Natural light, realistic colours, an ordinary unedited photo. No text, no captions, no labels, no app interface, no screenshot, no watermark${phone ? '' : ', no smartphone in the frame'}${hand ? '' : ', no people'}.`;
  return { id: m.id, file: photoFile(m.id), cat: m.cat, variant, seed: r.int(1, 2 ** 30), prompt };
}
if (process.argv[1] && process.argv[1].endsWith('photo_prompts.mjs')) {
  if (process.argv[2] === 'search') { process.stdout.write(JSON.stringify(MODELS.map(searchFor))); process.exit(0); }
  const variants = (process.argv[2] || 'clean').split(',');
  // interleave categories so every category gets photos early
  const byCat = {};
  for (const m of MODELS) (byCat[m.cat] ||= []).push(m);
  const cats = Object.keys(byCat);
  const out = [];
  for (const v of variants) {
    const idx = Object.fromEntries(cats.map((c) => [c, 0]));
    let left = MODELS.length;
    while (left > 0) for (const c of cats) { const m = byCat[c][idx[c]++]; if (m) { out.push(promptFor(m, v)); left--; } }
  }
  process.stdout.write(JSON.stringify(out, null, 0));
}
