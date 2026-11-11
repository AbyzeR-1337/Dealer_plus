// Headless smoke test of the game logic (no DOM): builds a world, simulates a few game days and
// exercises buying, selling, repairs, jobs, business and finance. Fails loudly on any exception.
const mem = {};
globalThis.localStorage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
globalThis.document = { hidden: false, documentElement: {}, addEventListener() {} };
globalThis.window = { GR_CONFIG: {}, addEventListener() {} };

export async function smoke() {
  const { G, newState } = await import('../js/core/state.js');
  const { setLang } = await import('../js/core/i18n.js');
  const { MODELS, CATS } = await import('../js/data/catalog.js');
  const { makeItem, itemValue, itemTitle, itemSub } = await import('../js/game/items.js');
  const { RNG } = await import('../js/core/rng.js');
  const sim = await import('../js/game/sim.js');
  const market = await import('../js/game/market.js');
  const sell = await import('../js/game/sell.js');
  const player = await import('../js/game/player.js');
  const jobs = await import('../js/game/jobs.js');
  const biz = await import('../js/game/business.js');
  const fin = await import('../js/game/finance.js');
  const src = await import('../js/game/sources.js');
  const ws = await import('../js/game/workshop.js');
  const travel = await import('../js/game/travel.js');
  const { fmt } = await import('../js/core/money.js');

  for (const lang of ['ru', 'uk', 'en']) {
    setLang(lang);
    G.s = newState({ name: 'Smoke', lang, country: lang === 'uk' ? 'UA' : lang === 'ru' ? 'RU' : 'US', city: lang === 'uk' ? 'kyiv' : lang === 'ru' ? 'msk' : 'nyc' });
    sim.initWorld();
    const rng = new RNG('smoke' + lang);
    // every model must produce a valid item & value
    for (const m of MODELS) {
      const it = makeItem(rng, { model: m });
      const v = itemValue(it, G.s.player.city);
      if (!(v > 0) || !Number.isFinite(v)) throw new Error(`bad value for ${m.id}: ${v}`);
      itemTitle(it); itemSub(it);
    }
    const feed = market.feedFor();
    if (feed.items.length < 10) throw new Error('feed too small');
    G.s.money = 50000;
    const l = feed.items.find((x) => !x.sold);
    const r = market.buyListing(l, 'pickup');
    if (!r.ok) throw new Error('buy failed: ' + r.msg);
    const it = G.s.inv[0];
    sell.listItem(it.id, 'classifieds', l.price * 0.9, true);
    jobs.apply('flyers');
    src.freeFeed(); src.pawnShop(); src.wholesale(); src.auctions(); fin.numbersMarket();
    const p = biz.acquireProp('kiosk', false);
    if (p.ok) biz.openShop(p.prop.id, 'Test', 'mix');
    fin.takeLoan(100, 0);
    for (const x of G.s.inv.slice(0, 3)) for (const d of x.defects) { if (ws.repairQuote(x, d.c)) { ws.masterRepair(x, d.c); break; } }
    sim.advance(1440 * 3 + 30);
    const chats = G.s.chats.filter((c) => c.kind === 'sell' && c.st === 'open');
    for (const c of chats) { sell.chatAccept(c); if (c.st === 'agreed') sell.completeSale(c, 'meet'); }
    travel.startTrip(G.s.player.city === 'msk' ? 'spb' : 'msk', 'train', []);
    sim.advance(800);
    console.log(`✓ ${lang}: models=${MODELS.length} money=${fmt(G.s.money)} worth=${fmt(player.netWorth())} inv=${G.s.inv.length} chats=${G.s.chats.length} day=${Math.floor(G.s.t / 1440)} city=${G.s.player.city}`);
  }
}
if (import.meta.url === `file://${process.argv[1]}`) smoke().catch((e) => { console.error(e); process.exit(1); });
