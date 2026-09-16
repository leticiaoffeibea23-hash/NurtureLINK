/**
 * Reference bundle loader — reads reference data from local SQLite
 * and assembles it into the ReferenceBundle shape the engine expects.
 *
 * Call loadReferenceBundle() after the database has been initialised
 * (i.e. after getDb() resolves on app startup). The result can be stored
 * in the Zustand store and passed to generatePlan().
 *
 * When no rows exist (first launch before a bundle download), returns null
 * so the caller can fall back to a bundled static fixture.
 */

import { query } from './index';
import type { ReferenceBundle } from '../engine/types';
import type { NutrientProfile, NutrientKey } from '../engine/types';
import type { Availability } from '@nurturelink/shared';
import type { AffordabilityTier } from '@nurturelink/shared';

// ─── SQLite row shapes ────────────────────────────────────────────────────────

interface FoodRow {
  id: string;
  name: string;
  local_names: string;   // JSON: { "dagbani": "zogale" }
  food_group: string;
  nutrients: string;     // JSON: { ironMg: 4.0, ... }
  affordability_tier: string;
  storable: number;      // 0 | 1
  garden_wild: number;
}

interface SeasonalRow {
  id: string;
  agro_zone_id: string;
  month: number;
  food_id: string;
  availability: string;
}

interface NutrientTargetRow {
  id: string;
  profile: string;
  nutrient: string;
  daily_target: number;
}

interface ClinicalThresholdRow {
  id: string;
  metric: string;
  condition: string;
  severity: string;
  threshold_value: number;
  threshold_direction: string;
}

// ─── Loader ───────────────────────────────────────────────────────────────────

/**
 * Load and assemble a ReferenceBundle from local SQLite.
 * Returns null if the foods table is empty (bundle not yet downloaded).
 */
export async function loadReferenceBundle(
  version = 'local',
): Promise<ReferenceBundle | null> {
  const foodRows = await query<FoodRow>('SELECT * FROM foods');
  if (foodRows.length === 0) return null;

  const [seasonalRows, targetRows, thresholdRows] = await Promise.all([
    query<SeasonalRow>('SELECT * FROM seasonal_availability'),
    query<NutrientTargetRow>('SELECT * FROM nutrient_targets'),
    query<ClinicalThresholdRow>('SELECT * FROM clinical_thresholds'),
  ]);

  const foods: ReferenceBundle['foods'] = foodRows.map((row) => {
    const localNames: Record<string, string> = JSON.parse(row.local_names);
    const nutrients = JSON.parse(row.nutrients) as Record<NutrientKey, number>;
    return {
      id: row.id,
      name: row.name,
      localName: localNames['dagbani'] ?? localNames['en'] ?? row.name,
      foodGroup: row.food_group,
      tier: row.affordability_tier as AffordabilityTier,
      storable: row.storable === 1,
      gardenWild: row.garden_wild === 1,
      // availability placeholder — overridden by seasonalAvailability map in engine
      availability: 'available' as Availability,
      nutrients: {
        ironMg:    nutrients['ironMg']    ?? 0,
        folateUg:  nutrients['folateUg']  ?? 0,
        proteinG:  nutrients['proteinG']  ?? 0,
        energyKcal: nutrients['energyKcal'] ?? 0,
        vitAUgRae: nutrients['vitAUgRae'] ?? 0,
        zincMg:    nutrients['zincMg']    ?? 0,
      },
    };
  });

  const seasonalAvailability: ReferenceBundle['seasonalAvailability'] = seasonalRows.map((row) => ({
    agroZoneId: row.agro_zone_id,
    month: row.month,
    foodId: row.food_id,
    availability: row.availability as Availability,
  }));

  const nutrientTargets: ReferenceBundle['nutrientTargets'] = targetRows.map((row) => ({
    profile: row.profile as NutrientProfile,
    nutrient: row.nutrient as NutrientKey,
    dailyTarget: row.daily_target,
  }));

  const clinicalThresholds: ReferenceBundle['clinicalThresholds'] = thresholdRows.map((row) => ({
    metric: row.metric,
    condition: row.condition,
    severity: row.severity,
    thresholdValue: row.threshold_value,
    thresholdDirection: row.threshold_direction as 'lt' | 'lte' | 'gte' | 'gt',
  }));

  return { version, foods, seasonalAvailability, nutrientTargets, clinicalThresholds };
}
