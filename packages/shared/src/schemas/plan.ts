import { z } from 'zod';

// ── Enums ─────────────────────────────────────────────────────────────────────

export const AffordabilityTierSchema = z.enum(['staple_cheap', 'market', 'premium']);
export type AffordabilityTier = z.infer<typeof AffordabilityTierSchema>;

export const AvailabilitySchema = z.enum(['abundant', 'available', 'scarce']);
export type Availability = z.infer<typeof AvailabilitySchema>;

export const NutrientProfileSchema = z.enum(['pregnant', 'child_6_23m', 'child_24_59m']);
export type NutrientProfile = z.infer<typeof NutrientProfileSchema>;

// ── Selected food in a plan ───────────────────────────────────────────────────

export const SelectedFoodSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  localName: z.string(),
  foodGroup: z.string(),
  tier: AffordabilityTierSchema,
  reasons: z.array(z.string()),
});
export type SelectedFood = z.infer<typeof SelectedFoodSchema>;

// ── Nutrient adequacy map ─────────────────────────────────────────────────────

// Keys are NutrientKey strings; values are 0–1+ ratio of target met.
export const AdequacySchema = z.record(z.string(), z.number().min(0));
export type Adequacy = z.infer<typeof AdequacySchema>;

// ── Plan rationale ────────────────────────────────────────────────────────────

export const PlanRationaleItemSchema = z.object({
  foodId: z.string().uuid(),
  reasons: z.array(z.string()),
});
export type PlanRationaleItem = z.infer<typeof PlanRationaleItemSchema>;

// ── Plan ─────────────────────────────────────────────────────────────────────

export const PlanSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  visitId: z.string().uuid(),
  seasonMonth: z.number().int().min(1).max(12),
  district: z.string(),
  targetNutrients: z.array(z.string()),      // NutrientKey[]
  foods: z.array(SelectedFoodSchema),
  adequacy: AdequacySchema,
  rationale: z.array(PlanRationaleItemSchema),
  voiceScript: z.string().nullable(),        // null until AI enrichment completes
  voicePackId: z.string().uuid().nullable(),
  aiEnriched: z.boolean().default(false),
  referenceBundleVersion: z.string(),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type Plan = z.infer<typeof PlanSchema>;

// Client sends this; server adds createdAt.
export const CreatePlanSchema = PlanSchema.omit({ createdAt: true, voiceScript: true, aiEnriched: true });
export type CreatePlanInput = z.infer<typeof CreatePlanSchema>;

// Server returns 422 with this body when a severe flag blocks plan creation.
export const PlanBlockedResponseSchema = z.object({
  error: z.literal('REFER_REQUIRED'),
  severity: z.literal('refer'),
  referralId: z.string().uuid().nullable(),  // existing referral if already issued
  flagId: z.string().uuid(),
});
export type PlanBlockedResponse = z.infer<typeof PlanBlockedResponseSchema>;
