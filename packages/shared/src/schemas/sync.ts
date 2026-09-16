import { z } from 'zod';
import { FoodSchema, SeasonalAvailabilitySchema, NutrientTargetSchema, ClinicalThresholdSchema, AgroZoneSchema } from './food';

// ── Outbox mutations (push) ───────────────────────────────────────────────────

export const SyncOperationSchema = z.enum(['insert', 'update', 'delete']);
export type SyncOperation = z.infer<typeof SyncOperationSchema>;

export const SyncEntityTypeSchema = z.enum([
  'clients',
  'households',
  'visits',
  'flags',
  'plans',
  'referrals',
]);
export type SyncEntityType = z.infer<typeof SyncEntityTypeSchema>;

export const SyncMutationSchema = z.object({
  idempotencyKey: z.string().uuid(),
  entityType: SyncEntityTypeSchema,
  entityId: z.string().uuid(),
  operation: SyncOperationSchema,
  payload: z.record(z.unknown()),
});
export type SyncMutation = z.infer<typeof SyncMutationSchema>;

export const SyncPushSchema = z.object({
  mutations: z.array(SyncMutationSchema).min(1).max(500),
});
export type SyncPushInput = z.infer<typeof SyncPushSchema>;

export const SyncPushResponseSchema = z.object({
  accepted: z.array(z.string()),   // idempotencyKey[]
  errors: z.array(z.object({
    idempotencyKey: z.string(),
    reason: z.string(),
  })),
});
export type SyncPushResponse = z.infer<typeof SyncPushResponseSchema>;

// ── Pull (incremental) ────────────────────────────────────────────────────────

export const SyncPullResponseSchema = z.object({
  rows: z.object({
    clients: z.array(z.record(z.unknown())).optional(),
    households: z.array(z.record(z.unknown())).optional(),
    visits: z.array(z.record(z.unknown())).optional(),
    flags: z.array(z.record(z.unknown())).optional(),
    plans: z.array(z.record(z.unknown())).optional(),
    referrals: z.array(z.record(z.unknown())).optional(),
  }),
  cursor: z.string().datetime(),   // advance local cursor to this value on success
  hasMore: z.boolean(),
});
export type SyncPullResponse = z.infer<typeof SyncPullResponseSchema>;

// ── Reference bundle ─────────────────────────────────────────────────────────

export const ReferenceBundleManifestEntrySchema = z.object({
  versionTag: z.string(),
  description: z.string().nullable(),
  checksum: z.string(),          // SHA-256 hex of the bundle JSON
  publishedAt: z.string().datetime(),
  tablesIncluded: z.array(z.string()),
  active: z.boolean(),
});
export type ReferenceBundleManifestEntry = z.infer<typeof ReferenceBundleManifestEntrySchema>;

export const ReferenceBundleManifestSchema = z.object({
  bundles: z.array(ReferenceBundleManifestEntrySchema),
});
export type ReferenceBundleManifest = z.infer<typeof ReferenceBundleManifestSchema>;

// Full bundle payload — downloaded and stored in SQLite.
export const ReferenceBundlePayloadSchema = z.object({
  versionTag: z.string(),
  checksum: z.string(),
  agroZones: z.array(AgroZoneSchema),
  foods: z.array(FoodSchema),
  seasonalAvailability: z.array(SeasonalAvailabilitySchema),
  nutrientTargets: z.array(NutrientTargetSchema),
  clinicalThresholds: z.array(ClinicalThresholdSchema),
});
export type ReferenceBundlePayload = z.infer<typeof ReferenceBundlePayloadSchema>;
