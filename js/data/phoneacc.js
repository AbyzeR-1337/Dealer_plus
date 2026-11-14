// Screen protectors and cases. Each one fits exactly one phone model (a glass for a Pear 13 won't go on a 14).
// mult: how much a phone sells for with it fitted; price: [base, share of the phone's value, cap] in USD.
export const PHONE_ACC = {
  glass: {
    basic: { n: ['Защитное стекло', 'Захисне скло', 'Screen protector'], mult: 1.03, price: [3, 0.006, 8] },
    full: { n: ['Стекло 9D Full Glue', 'Скло 9D Full Glue', '9D full‑glue glass'], mult: 1.045, price: [6, 0.012, 16] },
    bubble: { n: ['Стекло с пузырями', 'Скло з бульбашками', 'Glass with bubbles'], mult: 1.005, price: null },
  },
  case: {
    silicone: { n: ['Силиконовый чехол', 'Силіконовий чохол', 'Silicone case'], mult: 1.025, price: [4, 0.008, 12] },
    orig: { n: ['Оригинальный чехол', 'Оригінальний чохол', 'Original case'], mult: 1.05, price: [12, 0.03, 49] },
  },
};
export const ACC_KIND_NAME = { glass: ['Стекло', 'Скло', 'Glass'], case: ['Чехол', 'Чохол', 'Case'] };
export function accMult(it) {
  const a = it?.acc;
  if (!a) return 1;
  return (PHONE_ACC.glass[a.glass]?.mult || 1) * (PHONE_ACC.case[a.case]?.mult || 1);
}
