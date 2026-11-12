// Difficulty: Relaxed (no pressure timers in mini-games, ×0.85 pay for the same mini-games),
// Normal (×1), Hardcore (×1.15 pay, but game time runs 25% faster, mini-game timers are 30% shorter,
// needs drain faster and the police are less forgiving).
import { G } from '../core/state.js';
import { T } from '../core/i18n.js';

export const DIFF = {
  relaxed: { id: 'relaxed', earn: 0.85, timer: 2.5, needs: 0.8, crime: 0.6, jail: 0.6, fast: false, icon: '🌿', n: () => T('Спокойная', 'Спокійна', 'Relaxed'), d: () => T('В мини-играх нет таймеров давления, на игры «на время» — в 2,5 раза больше времени. Заработок за мини-игры ×0.85.', 'У міні-іграх немає таймерів тиску, на ігри «на час» — у 2,5 раза більше часу. Заробіток за міні-ігри ×0.85.', 'No pressure timers in mini-games, 2.5× time in timed ones. Mini-game pay ×0.85.') },
  normal: { id: 'normal', earn: 1, timer: 1, needs: 1, crime: 1, jail: 1, fast: false, icon: '⚖️', n: () => T('Нормал', 'Нормал', 'Normal'), d: () => T('Как задумано. Заработок ×1.', 'Як задумано. Заробіток ×1.', 'As designed. Pay ×1.') },
  hard: { id: 'hard', earn: 1.15, timer: 0.7, needs: 1.3, crime: 1.4, jail: 1.5, fast: true, icon: '💀', n: () => T('Хардкор', 'Хардкор', 'Hardcore'), d: () => T('Заработок за мини-игры ×1.15, но время в игре бежит на 25% быстрее, таймеры короче на 30%, голод и усталость сильнее, полиция строже.', 'Заробіток за міні-ігри ×1.15, але час у грі біжить на 25% швидше, таймери коротші на 30%, голод і втома сильніші, поліція суворіша.', 'Mini-game pay ×1.15, but game time runs 25% faster, timers are 30% shorter, hunger and fatigue hit harder, police are harsher.') },
};
export const dv = () => DIFF[G.s?.settings?.diff] || DIFF.normal;
// earnings that come from playing mini-games
export const MINI_EARN = new Set(['job', 'tip']);
