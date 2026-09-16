import { FoodCandidate, NutrientKey, NutrientTargetMap } from './types';

/**
 * Step 5: Compute nutrient adequacy for the selected basket.
 * Returns fraction of daily target met (0–1, can exceed 1).
 */
export function computeAdequacy(
  basket: FoodCandidate[],
  targets: NutrientTargetMap,
): Partial<Record<NutrientKey, number>> {
  const totals: Partial<Record<NutrientKey, number>> = {};

  for (const food of basket) {
    for (const [nutrient, value] of Object.entries(food.nutrients) as [NutrientKey, number][]) {
      totals[nutrient] = (totals[nutrient] ?? 0) + value;
    }
  }

  const adequacy: Partial<Record<NutrientKey, number>> = {};
  for (const [nutrient, target] of Object.entries(targets) as [NutrientKey, number][]) {
    adequacy[nutrient] = Math.round(((totals[nutrient] ?? 0) / target) * 100) / 100;
  }

  return adequacy;
}
