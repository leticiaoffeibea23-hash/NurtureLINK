import { AffordabilityTier } from '@nurturelink/shared';
import { FoodCandidate, ReferenceBundle } from './types';

const TIER_RANK: Record<AffordabilityTier, number> = {
  staple_cheap: 0,
  market: 1,
  premium: 2,
};

/**
 * Step 3: Build the candidate food set.
 *
 * A food qualifies if:
 *   (a) affordability_tier ≤ ceiling, AND
 *   (b) at least one of:
 *       - seasonal availability for (agroZoneId, month) is 'abundant' or 'available'
 *       - storable === true
 *       - gardenWild === true
 *   AND active === true (already filtered by reference bundle)
 */
export function buildCandidateSet(
  bundle: ReferenceBundle,
  agroZoneId: string,
  currentMonth: number,
  affordabilityCeiling: AffordabilityTier,
): FoodCandidate[] {
  const availabilityMap = buildAvailabilityMap(bundle, agroZoneId, currentMonth);
  const ceilingRank = TIER_RANK[affordabilityCeiling];

  return bundle.foods
    .filter((food) => {
      if (TIER_RANK[food.tier] > ceilingRank) return false;

      const avail = availabilityMap.get(food.id);
      const isInSeason = avail === 'abundant' || avail === 'available';
      const isAlwaysAvailable = food.storable || food.gardenWild;

      return isInSeason || isAlwaysAvailable;
    })
    .map((food) => ({
      ...food,
      availability: availabilityMap.get(food.id) ?? (food.storable ? 'available' : 'scarce'),
    }));
}

function buildAvailabilityMap(
  bundle: ReferenceBundle,
  agroZoneId: string,
  month: number,
): Map<string, 'abundant' | 'available' | 'scarce'> {
  const map = new Map<string, 'abundant' | 'available' | 'scarce'>();
  for (const row of bundle.seasonalAvailability) {
    if (row.agroZoneId === agroZoneId && row.month === month) {
      map.set(row.foodId, row.availability);
    }
  }
  return map;
}
