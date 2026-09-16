import { z } from 'zod';
import { AffordabilityTierSchema, AvailabilitySchema, NutrientProfileSchema } from './plan';

// ── Nutrients ─────────────────────────────────────────────────────────────────

export const NutrientKeySchema = z.enum([
  'ironMg',
  'folateUg',
  'proteinG',
  'energyKcal',
  'vitAUgRae',
  'zincMg',
]);
export type NutrientKey = z.infer<typeof NutrientKeySchema>;

export const NutrientsSchema = z.object({
  ironMg: z.number().min(0),
  folateUg: z.number().min(0),
  proteinG: z.number().min(0),
  energyKcal: z.number().min(0),
  vitAUgRae: z.number().min(0),
  zincMg: z.number().min(0),
});
export type Nutrients = z.infer<typeof NutrientsSchema>;

// ── Food ─────────────────────────────────────────────────────────────────────

export const FoodSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  localNames: z.record(z.string(), z.string()),  // { dagbani: 'Zogale', en: 'Moringa' }
  foodGroup: z.string(),
  nutrients: NutrientsSchema,
  affordabilityTier: AffordabilityTierSchema,
  storable: z.boolean(),
  gardenWild: z.boolean(),
  active: z.boolean(),
});
export type Food = z.infer<typeof FoodSchema>;

// ── Agro-zone ────────────────────────────────────────────────────────────────

export const AgroZoneSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  districts: z.array(z.string()),
});
export type AgroZone = z.infer<typeof AgroZoneSchema>;

// ── Seasonal availability ─────────────────────────────────────────────────────

export const SeasonalAvailabilitySchema = z.object({
  id: z.string().uuid(),
  agroZoneId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  foodId: z.string().uuid(),
  availability: AvailabilitySchema,
});
export type SeasonalAvailability = z.infer<typeof SeasonalAvailabilitySchema>;

// ── Nutrient targets ─────────────────────────────────────────────────────────

export const NutrientTargetSchema = z.object({
  id: z.string().uuid(),
  profile: NutrientProfileSchema,
  nutrient: NutrientKeySchema,
  dailyTarget: z.number().positive(),
  source: z.string(),
});
export type NutrientTarget = z.infer<typeof NutrientTargetSchema>;

// ── Clinical thresholds ───────────────────────────────────────────────────────

export const ThresholdDirectionSchema = z.enum(['lt', 'lte', 'gte', 'gt']);
export type ThresholdDirection = z.infer<typeof ThresholdDirectionSchema>;

// severity matches the DB enum: ok | watch | refer (no 'moderate').
export const ThresholdSeveritySchema = z.enum(['ok', 'watch', 'refer']);
export type ThresholdSeverity = z.infer<typeof ThresholdSeveritySchema>;

export const ClinicalThresholdSchema = z.object({
  id: z.string().uuid(),
  metric: z.string(),      // 'muac_mm' | 'hb_g_dl' | 'weight_for_age_zscore'
  condition: z.string(),   // free-text clinical condition description
  severity: ThresholdSeveritySchema,
  thresholdValue: z.number(),
  thresholdDirection: ThresholdDirectionSchema,
  source: z.string(),
});
export type ClinicalThreshold = z.infer<typeof ClinicalThresholdSchema>;
