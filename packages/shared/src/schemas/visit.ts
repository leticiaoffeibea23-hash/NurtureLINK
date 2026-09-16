import { z } from 'zod';

// ── Diet recall food groups (WHO IYCF minimum diet diversity) ─────────────────

export const FoodGroupSchema = z.enum([
  'grains_roots_tubers',
  'legumes_nuts',
  'dairy',
  'flesh_foods',
  'eggs',
  'vit_a_fruits_veg',
  'other_fruits_veg',
  'breastmilk',
]);
export type FoodGroup = z.infer<typeof FoodGroupSchema>;

// ── Danger signs (obstetric + paediatric) ────────────────────────────────────

export const DangerSignSchema = z.enum([
  'severe_headache_visual',
  'severe_abdominal_pain',
  'heavy_vaginal_bleeding',
  'convulsions',
  'difficulty_breathing',
  'baby_not_moving',
  'bilateral_oedema',
  'pallor_severe',
]);
export type DangerSign = z.infer<typeof DangerSignSchema>;

// ── Visit ─────────────────────────────────────────────────────────────────────

export const VisitSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  userId: z.string().uuid(),
  visitedAt: z.string().datetime(),
  weightKg: z.number().positive().nullable(),
  hbGDl: z.number().positive().nullable(),
  muacMm: z.number().positive().nullable(),
  dietRecall: z.array(FoodGroupSchema),
  dangerSigns: z.array(DangerSignSchema),
  notes: z.string().nullable(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
  syncedAt: z.string().datetime().nullable(),
});
export type Visit = z.infer<typeof VisitSchema>;

export const CreateVisitSchema = VisitSchema.omit({ syncedAt: true, deletedAt: true });
export type CreateVisitInput = z.infer<typeof CreateVisitSchema>;

// ── Flags ─────────────────────────────────────────────────────────────────────

export const FlagCodeSchema = z.enum([
  'FALLING_HB',
  'FLAT_WEIGHT',
  'LOW_DIVERSITY',
  'DANGER_SIGNS',
  'SEVERE_MUAC',
  'SEVERE_ANAEMIA',
]);
export type FlagCode = z.infer<typeof FlagCodeSchema>;

export const SeveritySchema = z.enum(['ok', 'watch', 'refer']);
export type Severity = z.infer<typeof SeveritySchema>;

export const FlagReasonSchema = z.object({
  code: FlagCodeSchema,
  value: z.number().optional(),   // the measured value that triggered the flag
  detail: z.string().optional(),  // human-readable detail
});
export type FlagReason = z.infer<typeof FlagReasonSchema>;

export const FlagSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  visitId: z.string().uuid(),
  severity: SeveritySchema,
  reasons: z.array(FlagReasonSchema),
  computedAt: z.string().datetime(),
  referenceBundleVersion: z.string(),
});
export type Flag = z.infer<typeof FlagSchema>;

// Sent to POST /flags after the engine computes flags on-device.
export const CreateFlagSchema = FlagSchema;
export type CreateFlagInput = z.infer<typeof CreateFlagSchema>;

// POST /visits response — visit + computed flag together.
export const CreateVisitResponseSchema = z.object({
  visit: VisitSchema,
  flag: FlagSchema,
});
export type CreateVisitResponse = z.infer<typeof CreateVisitResponseSchema>;
