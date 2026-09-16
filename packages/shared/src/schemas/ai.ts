import { z } from 'zod';
import { NutrientProfileSchema } from './plan';

/**
 * AI enrichment schemas — POST /ai/enrich-plan
 *
 * No PII is ever sent to the LLM. The request contains only plan facts:
 * food names, nutrient gaps, and the client profile category.
 */

export const AiEnrichFoodSchema = z.object({
  name: z.string(),
  localName: z.string(),
  foodGroup: z.string(),
  why: z.string(),   // one-line reason from the deterministic engine
});

export const AiEnrichRequestSchema = z.object({
  planId: z.string().uuid(),
  clientProfile: NutrientProfileSchema,
  seasonMonth: z.number().int().min(1).max(12),
  district: z.string(),
  targetNutrients: z.array(z.string()),      // nutrient keys the plan addresses
  foods: z.array(AiEnrichFoodSchema),
  language: z.enum(['en', 'dag']),
});
export type AiEnrichRequest = z.infer<typeof AiEnrichRequestSchema>;

export const AiEnrichResponseSchema = z.object({
  planId: z.string().uuid(),
  voiceScript: z.string().max(500),   // counselling script, max ~150 words
  language: z.enum(['en', 'dag']),
  model: z.string(),                  // e.g. 'claude-haiku-4-5'
  cached: z.boolean(),                // true if served from cache
  validatedAt: z.string().datetime(),
});
export type AiEnrichResponse = z.infer<typeof AiEnrichResponseSchema>;

// Logged to telemetry_events for every LLM call — no PII.
export const AiCallLogSchema = z.object({
  planId: z.string().uuid(),
  inputHash: z.string(),    // SHA-256 of the serialised request
  outputHash: z.string(),   // SHA-256 of the returned script
  model: z.string(),
  latencyMs: z.number().int(),
  validationPassed: z.boolean(),
  fallbackUsed: z.boolean(),
});
export type AiCallLog = z.infer<typeof AiCallLogSchema>;
