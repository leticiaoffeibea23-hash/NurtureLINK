import { FoodCandidate, NutrientKey, NutrientTargetMap } from './types';

const AVAILABILITY_WEIGHT: Record<string, number> = {
  abundant: 1.0,
  available: 0.8,
  scarce: 0.4,
};

const TIER_WEIGHT: Record<string, number> = {
  staple_cheap: 1.0,
  market: 0.8,
  premium: 0.6,
};

/**
 * Step 4: Greedy basket selection.
 *
 * Selects 5–6 foods that maximise nutrient gap coverage with minimum cost.
 * Algorithm:
 *   1. Score each candidate for coverage of the active nutrient gaps.
 *   2. Pick the highest-scoring food for the primary uncovered gap.
 *   3. Add to basket, recompute remaining gaps.
 *   4. Prefer different food groups (diversity heuristic).
 *   5. Repeat until 5–6 items or all gaps are adequately covered.
 */
export function selectBasket(
  candidates: FoodCandidate[],
  activeNutrients: NutrientKey[],
  targets: NutrientTargetMap,
  maxItems = 6,
): FoodCandidate[] {
  const basket: FoodCandidate[] = [];
  const coveredGroups = new Set<string>();
  const remainingNutrients = new Set(activeNutrients);
  const accumulatedNutrients: Partial<Record<NutrientKey, number>> = {};

  while (basket.length < maxItems && remainingNutrients.size > 0) {
    const scored = candidates
      .filter((f) => !basket.includes(f))
      .map((food) => ({
        food,
        score: scoreFood(food, remainingNutrients, targets, accumulatedNutrients, coveredGroups),
      }))
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0 || scored[0].score <= 0) break;

    const chosen = scored[0].food;
    basket.push(chosen);
    coveredGroups.add(chosen.foodGroup);

    // Accumulate nutrients and remove adequately covered gaps
    for (const nutrient of remainingNutrients) {
      const prev = accumulatedNutrients[nutrient] ?? 0;
      accumulatedNutrients[nutrient] = prev + (chosen.nutrients[nutrient] ?? 0);
      const target = targets[nutrient] ?? 1;
      if ((accumulatedNutrients[nutrient] ?? 0) >= target * 0.7) {
        remainingNutrients.delete(nutrient);
      }
    }
  }

  return basket;
}

function scoreFood(
  food: FoodCandidate,
  remainingNutrients: Set<NutrientKey>,
  targets: NutrientTargetMap,
  accumulated: Partial<Record<NutrientKey, number>>,
  coveredGroups: Set<string>,
): number {
  let nutrientScore = 0;
  for (const nutrient of remainingNutrients) {
    const value = food.nutrients[nutrient] ?? 0;
    const target = targets[nutrient] ?? 1;
    const alreadyCovered = accumulated[nutrient] ?? 0;
    const remaining = Math.max(0, target - alreadyCovered);
    nutrientScore += Math.min(value, remaining) / target;
  }

  // Bonus for food-group diversity (encourages different groups)
  const diversityBonus = coveredGroups.has(food.foodGroup) ? 0 : 0.2;

  // Availability and affordability multipliers
  const availMult = AVAILABILITY_WEIGHT[food.availability] ?? 0.5;
  const tierMult = TIER_WEIGHT[food.tier] ?? 0.6;

  return (nutrientScore + diversityBonus) * availMult * tierMult;
}
