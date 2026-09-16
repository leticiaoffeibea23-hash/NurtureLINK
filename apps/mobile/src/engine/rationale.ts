import { FoodCandidate, NutrientKey, RationaleEntry } from './types';

/**
 * Step 6: Build a plain-language rationale for each selected food.
 * These reasons are shown in the UI as the "why" for each food choice.
 */
export function buildRationale(
  basket: FoodCandidate[],
  activeNutrients: NutrientKey[],
): RationaleEntry[] {
  return basket.map((food) => {
    const reasons: string[] = [];

    if (food.availability === 'abundant') reasons.push('in_season_abundant');
    else if (food.availability === 'available') reasons.push('in_season_available');
    if (food.storable) reasons.push('storable_year_round');
    if (food.gardenWild) reasons.push('garden_or_wild');
    if (food.tier === 'staple_cheap') reasons.push('affordable_staple');
    else if (food.tier === 'market') reasons.push('affordable_market');

    for (const nutrient of activeNutrients) {
      const value = food.nutrients[nutrient] ?? 0;
      if (value > 0) {
        reasons.push(`closes_${nutrient}_gap`);
      }
    }

    return { foodId: food.id, reasons };
  });
}

/** Map nutrient keys to plain English labels for display */
export const NUTRIENT_LABELS: Record<NutrientKey, string> = {
  ironMg: 'iron',
  folateUg: 'folate',
  proteinG: 'protein',
  energyKcal: 'energy',
  vitAUgRae: 'vitamin A',
  zincMg: 'zinc',
};
