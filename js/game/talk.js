// Living chats: every buyer has a character, a writing voice, a reason and a story of how they found
// the listing; they ask category-specific questions and react to the answers. What you say is kept:
// a lie in the chat becomes evidence in a dispute later on.
import { G } from '../core/state.js';
import { RNG } from '../core/rng.js';
import { L, T } from '../core/i18n.js';
import { DEFECTS, MODEL } from '../data/catalog.js';
import { defectName, fmtKm } from './items.js';
import { HELLO, FOUND, TRAIT_LINE, VOICE_BY_TRAIT, REACT, ME, MY_LOGISTICS } from '../data/talk_common.js';
import { Q, COMMON_Q, WHY_BUY, MY_WHY, MY_HOWLONG, ANS } from '../data/talk_questions.js';

export const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
export const line = (rng, arr, vars = {}) => fill(L(rng.pick(arr)), vars);

// defect codes behind every factual topic
export const TOPIC_DEFECTS = {
  battery: ['battery', 'e_battery', 'a_battery', 'bk_battery'], screen: ['crack', 'deadpix', 'e_crack', 'nonorig'], repair: ['nonorig', 'q_repair', 'm_restored', 't_dial'],
  water: ['water', 'e_water'], face: ['faceid'], scratches: ['scratches', 'e_scratch', 'c_scratch', 'j_scratch', 't_crystal', 'a_scratch', 'l_scratch', 'i_scratch', 'v_scratch', 'bk_scratch', 'b_hw'],
  body: ['bent', 'backcrack', 'camera', 'button', 'e_dent', 'e_hinge', 'v_dent', 'bk_dent', 'b_shape', 'j_bent', 'l_bent', 'l_warp'], sound: ['speaker', 'a_sound', 'e_fan', 'c_fan'], charge: ['port'],
  power: ['e_dead', 'c_dead', 'a_broken', 'q_mech'], keys: ['e_keys'], lens: ['e_lens', 'camera'], disc: ['c_drive'], video: ['c_hdmi'], drift: ['c_drift'], ban: ['c_ban'], yellow: ['c_yellow', 's_yellow'],
  sole: ['s_sole', 's_yellow'], wear: ['s_crease', 's_scuff', 'w_pill', 'b_corner', 'b_handle', 't_strap', 'a_wear'], smell: ['s_smell', 'b_smell'], insole: ['s_insole'],
  stains: ['s_stain', 'w_stain', 'b_stain', 'l_stain', 'm_stain', 'r_stain', 'k_stain'], tags: ['w_tag'], holes: ['w_hole', 'm_tear', 'r_tear', 'l_tear'], zip: ['w_zip'], fade: ['w_fade', 'm_fade', 'y_fade', 'r_fade'],
  lining: ['b_lining'], hardware: ['b_hw'], running: ['t_dead', 't_slow'], service: ['t_polish', 't_dial'], bezel: ['t_bezel'], stone: ['j_stone'], purity: ['j_lowgold'], clasp: ['j_clasp'], tarnish: ['j_tarnish'],
  batch: ['p_old', 'p_label'], cap: ['p_cap'], chip: ['p_chip', 'q_chip'], centering: ['k_center'], corners: ['k_corner', 'k_crease'], surface: ['k_scratch', 'k_trim'], spine: ['m_spine'], pages: ['m_missing'], restored: ['m_restored', 'q_repair'],
  pieces: ['y_missing'], boxdmg: ['y_boxdmg'], paint: ['y_paint', 's_paint'], broken: ['y_broken', 'a_broken', 'l_tear'], crack: ['q_crack', 'r_crack', 't_crack', 'i_crack'], patina: ['q_patina', 'l_clean'], mech: ['q_mech'], frame: ['r_frame'],
  neck: ['i_neck'], electro: ['i_electro'], frets: ['i_frets'], ikeys: ['i_keys'], accident: ['v_accident', 'bk_dent'], vpaint: ['v_paint'], rust: ['v_rust', 'bk_rust'], engine: ['v_engine', 'v_gearbox'], tires: ['v_tire', 'bk_wheel'],
  glass: ['v_glass'], docs: ['v_docs'], electric: ['v_electric'], lights: ['v_light'], brakes: ['bk_brake'], works: ['e_dead', 'c_dead', 'a_broken', 'q_mech', 't_dead'],
};
const ALIAS = { receipt: 'box', serial: 'orig', simlock: 'lock' };
export const SOCIAL = ['why', 'how_long', 'photos', 'discount', 'video', 'meet', 'ship', 'provenance'];
export const TOPIC_NAME = {
  battery: ['батарея', 'батарея', 'battery'], screen: ['экран', 'екран', 'screen'], repair: ['ремонта не было', 'ремонту не було', 'no repairs'], water: ['воды не было', 'води не було', 'no water damage'],
  face: ['Face ID', 'Face ID', 'Face ID'], body: ['корпус', 'корпус', 'body'], sound: ['звук', 'звук', 'sound'], charge: ['зарядка', 'зарядка', 'charging'], lock: ['блокировок нет', 'блокувань немає', 'no locks'],
  orig: ['это оригинал', 'це оригінал', 'it’s authentic'], mileage: ['пробег', 'пробіг', 'mileage'], engine: ['двигатель', 'двигун', 'engine'], accident: ['ДТП не было', 'ДТП не було', 'no accidents'],
};
const topicName = (t) => L(TOPIC_NAME[t] || ['всё', 'усе', 'everything']);

// ---------------------------------------------------------------- facts the honest answer is built from
export function topicFacts(it, rawTopic) {
  const topic = ALIAS[rawTopic] || rawTopic;
  const r = new RNG((it.seed || 1) + topic.length * 31);
  const out = { topic, social: SOCIAL.includes(topic), real: false, known: false, codes: [], fact: '' };
  if (out.social) return out;
  if (topic === 'orig') { out.real = !!it.fake; out.known = !!(it.fake && it.fakeKnown); return out; }
  if (topic === 'lock') { out.real = !!it.lock; out.known = !!it.lock; out.fact = it.lock ? it.lock : ''; return out; }
  if (topic === 'box') {
    const parts = [it.box ? T('коробка', 'коробка', 'box') : '', it.docs ? T('документы и чек', 'документи й чек', 'papers and receipt') : ''].filter(Boolean);
    out.known = out.real = !parts.length; out.fact = parts.length ? parts.join(', ') : T('без коробки и документов', 'без коробки й документів', 'no box or papers');
    return out;
  }
  if (topic === 'mileage') { const d = it.defects.find((x) => x.c === 'v_mileage'); out.real = !!d; out.known = !!d?.known; out.codes = d ? ['v_mileage'] : []; out.fact = it.km != null ? fmtKm(it.km) : '—'; return out; }
  if (topic === 'owners') { out.social = true; out.fact = String(it.owners || 1); return out; }
  if (topic === 'age') { out.social = true; out.fact = String(it.year || MODEL[it.m]?.year || '—'); return out; }
  if (topic === 'fill') { const d = it.defects.find((x) => x.c === 'p_old'); out.real = !!d; out.known = !!d?.known; out.codes = d ? ['p_old'] : []; out.fact = `${it.fill ?? 100}%`; return out; }
  if (topic === 'size') { const d = it.defects.find((x) => x.c === 'w_shrink'); out.real = !!d; out.known = !!d?.known; out.codes = d ? ['w_shrink'] : []; out.fact = it.size || '—'; return out; }
  if (topic === 'grade') { out.social = true; out.fact = it.grade ? T(`В слабе, оценка ${it.grade}`, `У слабі, оцінка ${it.grade}`, `Slabbed, grade ${it.grade}`) : T('Не грейдилась, сырая', 'Не грейдилася, сира', 'Raw, never graded'); return out; }
  const codes = topic === 'defects' ? it.defects.map((d) => d.c) : TOPIC_DEFECTS[topic] || [];
  const rel = it.defects.filter((d) => codes.includes(d.c));
  const known = rel.filter((d) => d.known);
  out.real = rel.length > 0; out.known = known.length > 0; out.codes = rel.map((d) => d.c);
  out.fact = known.map((d) => defectName(d.c).toLowerCase()).join(', ');
  if (topic === 'battery') out.fact = out.known ? `${r.int(71, 79)}%` : `${r.int(86, 100)}%`;
  return out;
}

// ---------------------------------------------------------------- buyer: opening messages
export function voiceOf(rng, trait) { return rng.pick(VOICE_BY_TRAIT[trait] || ['casual']); }
export function pickQuestion(rng, it, asked = []) {
  const cat = Q[it.cat] || [];
  const pool = (rng.chance(0.62) && cat.length ? cat : COMMON_Q).filter((q) => !asked.includes(q[0]));
  const q = rng.pick(pool.length ? pool : COMMON_Q);
  return { topic: q[0], tx: L([q[1], q[2], q[3]]) };
}
export function openingLines(rng, npc, it, l, ctx) {
  const voice = npc.voice || (npc.voice = voiceOf(rng, npc.trait));
  const vars = { name: npc.name, platform: ctx.platform, district: ctx.district, city: ctx.city, model: ctx.model };
  let first = line(rng, HELLO[voice] || HELLO.casual, vars);
  const extra = [];
  if (rng.chance(0.55)) extra.push(line(rng, FOUND, vars));
  if (rng.chance(0.35) && WHY_BUY[it.cat]) extra.push(L(rng.pick(WHY_BUY[it.cat])));
  if (rng.chance(0.5) && TRAIT_LINE[npc.trait]) extra.push(L(rng.pick(TRAIT_LINE[npc.trait])));
  if (voice === 'terse' && extra.length > 1) extra.length = 1;
  if (voice === 'slang') first = first.replace(/[.!]$/, '');
  return [`${first} ${extra.join(' ')}`.trim()];
}

// ---------------------------------------------------------------- my answer options for a pending question
export function answerOptions(it, q) {
  const f = topicFacts(it, q.topic);
  if (f.social) return [{ k: 'social', label: socialAnswer(it, q.topic, f, new RNG(it.seed + q.topic.length)) }];
  const r = new RNG((it.seed || 1) * 3 + q.topic.length);
  const honest = honestAnswer(it, f, r);
  const opts = [{ k: 'honest', label: honest }, { k: 'vague', label: L(r.pick(ME.evasive)) }];
  if (f.known) opts.push({ k: 'lie', label: L(r.pick(ME.lie)) });
  return opts;
}
function honestAnswer(it, f, r) {
  const a = ANS[f.topic] || ANS.generic;
  if (f.topic === 'orig') return L(r.pick(f.known ? a.bad : a.ok));
  const bad = f.known || (f.topic === 'box' && f.real);
  const pool = bad ? a.bad || ANS.generic.bad : a.ok || ANS.generic.ok;
  return fill(L(r.pick(pool)), { fact: f.fact || T('мелочи', 'дрібниці', 'small things') });
}
function socialAnswer(it, topic, f, r) {
  if (topic === 'why') return L(r.pick(MY_WHY));
  if (topic === 'how_long') return L(r.pick(MY_HOWLONG));
  if (topic === 'meet' || topic === 'ship') return fill(L(r.pick(MY_LOGISTICS)), { district: '' }).replace(/, район \.|, \./, '.');
  if (topic === 'photos') return T('Да, сейчас пришлю 📷', 'Так, зараз надішлю 📷', 'Sure, sending now 📷');
  if (topic === 'video') return T('Да, давайте вечером созвонимся.', 'Так, давайте ввечері зідзвонимося.', 'Sure, let’s video call tonight.');
  if (topic === 'discount') return T('Небольшой торг возможен при встрече.', 'Невеликий торг можливий при зустрічі.', 'A small discount is possible in person.');
  if (topic === 'provenance') return T('Досталось от родственников.', 'Дісталося від родичів.', 'Inherited from relatives.');
  if (ANS[topic]?.any) return fill(L(r.pick(ANS[topic].any)), { fact: f.fact });
  if (topic === 'grade') return f.fact;
  return T('Да, конечно.', 'Так, звісно.', 'Yes, of course.');
}

// ---------------------------------------------------------------- applying an answer to a sell chat
export function applyAnswer(c, it, kind, label) {
  const q = c.q;
  if (!q) return null;
  const f = topicFacts(it, q.topic);
  const rng = new RNG(`${c.id}:ans:${(c.asked || []).length}`);
  c.msgs.push({ f: 'me', tx: label, t: G.s.t });
  c.q = null;
  let react = 'ok';
  if (kind === 'social') { react = 'social'; c.maxPay *= 1.01; }
  else if (kind === 'honest') {
    if (f.known && f.topic === 'orig') { c.told = [...(c.told || []), 'fake']; c.maxPay *= ['reseller', 'greedy', 'haggler'].includes(c.npc.trait) ? 0.45 : 0.3; react = 'bad'; }
    else if (f.known) {
      const sev = f.codes.reduce((a, code) => a + (DEFECTS[code]?.sev || 0.1), 0);
      c.maxPay *= 1 - Math.min(0.55, sev * 0.65);
      c.told = [...(c.told || []), ...f.codes];
      react = 'bad';
    } else { c.maxPay *= 1.02; }
    c.trust = (c.trust || 0) + 1;
  } else if (kind === 'vague') { c.maxPay *= 0.985; c.patience -= 0.5; react = 'vague'; c.trust = (c.trust || 0) - 1; }
  else if (kind === 'lie') { c.maxPay *= 1.01; c.lies = [...(c.lies || []), { topic: f.topic, codes: f.topic === 'orig' ? ['fake'] : f.codes }]; react = 'ok'; }
  c.msgs.push({ f: 'them', tx: L(rng.pick(REACT[react])), t: G.s.t });
  return react;
}

// ---------------------------------------------------------------- seller side (when I buy)
export function sellerAnswer(c, it, topic) {
  const sel = c.npc || {};
  const f = topicFacts(it, topic);
  const rng = new RNG(`${c.id}:sq:${topic}:${(c.askedSeller || []).length}`);
  const honesty = { honest: 0.95, normal: 0.6, urgent: 0.7, shady: 0.15, clueless: 0.8, dealer: 0.4, granny: 1 }[sel.trait] ?? 0.6;
  if (f.social) return { tx: socialAnswer(it, topic, f, rng), lie: false };
  const realCodes = f.codes;
  const truthful = rng.chance(honesty);
  if (topic === 'orig' || ALIAS[topic] === 'orig') {
    if (it.fake && truthful && sel.trait !== 'clueless') { it.fakeKnown = true; return { tx: T('Скажу честно: это реплика.', 'Скажу чесно: це репліка.', 'Honestly: it’s a replica.'), lie: false }; }
    return { tx: L(rng.pick(ANS.orig.ok)), lie: !!it.fake, codes: it.fake ? ['fake'] : [] };
  }
  if (!f.real) return { tx: L(rng.pick(ANS.generic.ok)), lie: false };
  if (sel.trait === 'clueless' && rng.chance(0.5)) return { tx: T('Честно, не знаю, я в этом не разбираюсь.', 'Чесно, не знаю, я в цьому не розбираюся.', 'Honestly, I don’t know, I’m no expert.'), lie: false };
  if (truthful) {
    const names = [];
    for (const d of it.defects) if (realCodes.includes(d.c)) { d.known = true; d.told = true; names.push(defectName(d.c).toLowerCase()); }
    return { tx: fill(L(rng.pick(ANS.generic.bad)), { fact: names.join(', ') }), lie: false, told: realCodes };
  }
  return { tx: L(rng.pick(ME.lie)), lie: true, codes: realCodes };
}
// topics I can ask a seller about
export function sellerTopics(it, rng) {
  const cat = (Q[it.cat] || []).slice();
  const picks = [];
  while (picks.length < 3 && cat.length) picks.push(cat.splice(rng.int(0, cat.length - 1), 1)[0]);
  picks.push(['defects', ...COMMON_Q.find((q) => q[0] === 'defects').slice(1)]);
  picks.push(COMMON_Q.find((q) => q[0] === 'why'));
  return picks.map((q) => ({ topic: q[0], tx: L([q[1], q[2], q[3]]) }));
}
export const lieTopicName = topicName;
