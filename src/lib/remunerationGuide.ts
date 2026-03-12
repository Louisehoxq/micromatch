export const REMUNERATION_GUIDE: Record<string, { min: number; max: number }> = {
  Culinary:   { min: 8,  max: 15 },
  Fitness:    { min: 15, max: 25 },
  Healthcare: { min: 20, max: 35 },
  Education:  { min: 15, max: 30 },
  Handyman:   { min: 12, max: 20 },
  Admin:      { min: 10, max: 18 },
};

export function suggestPay(
  categoryName: string | undefined,
  maxProficiency: 1 | 2 | 3,
  hasEvening: boolean,
  hasWeekend: boolean,
): { min: number; max: number; labels: string[] } | null {
  const base = categoryName ? REMUNERATION_GUIDE[categoryName] : null;
  if (!base) return null;

  const labels: string[] = [`${categoryName} base`];
  let bonus = 0;

  if (maxProficiency === 3) { bonus += 2; labels.push('Expert skill +$2'); }
  else if (maxProficiency === 2) { bonus += 1; labels.push('Intermediate skill +$1'); }

  if (hasEvening) { bonus += 1.5; labels.push('Evening +$1.50'); }
  if (hasWeekend) { bonus += 1; labels.push('Weekend +$1'); }

  return { min: base.min + bonus, max: base.max + bonus, labels };
}
