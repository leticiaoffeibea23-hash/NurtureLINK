import { z } from 'zod';

export const ClientTypeSchema = z.enum(['pregnant', 'child']);
export type ClientType = z.infer<typeof ClientTypeSchema>;

// ── Household ─────────────────────────────────────────────────────────────────

export const HouseholdSchema = z.object({
  id: z.string().uuid(),
  facilityId: z.string().uuid(),
  label: z.string().min(1),
  community: z.string().min(1),
  geo: z.object({ lat: z.number(), lng: z.number() }).nullable(),
  notes: z.string().nullable(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});
export type Household = z.infer<typeof HouseholdSchema>;

export const CreateHouseholdSchema = HouseholdSchema.omit({ deletedAt: true });
export type CreateHouseholdInput = z.infer<typeof CreateHouseholdSchema>;

// ── Client ────────────────────────────────────────────────────────────────────

export const ClientSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  type: ClientTypeSchema,
  name: z.string().min(1),
  dob: z.string().date().nullable(),
  eddGestation: z.string().nullable(),  // e.g. "32w4d" for gestational age
  sex: z.enum(['M', 'F', 'unknown']).nullable(),
  consentAt: z.string().datetime(),
  active: z.boolean().default(true),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
  syncedAt: z.string().datetime().nullable(),
});
export type Client = z.infer<typeof ClientSchema>;

export const CreateClientSchema = ClientSchema.omit({ syncedAt: true, deletedAt: true });
export type CreateClientInput = z.infer<typeof CreateClientSchema>;

// Mobile registration creates household + client in one call.
export const RegisterClientSchema = z.object({
  household: CreateHouseholdSchema,
  client: CreateClientSchema,
});
export type RegisterClientInput = z.infer<typeof RegisterClientSchema>;

export const RegisterClientResponseSchema = z.object({
  household: HouseholdSchema,
  client: ClientSchema,
});
export type RegisterClientResponse = z.infer<typeof RegisterClientResponseSchema>;

// Paginated client list (for facility dashboard / pull).
export const ClientListResponseSchema = z.object({
  clients: z.array(ClientSchema),
  cursor: z.string().datetime().nullable(),  // updatedAt of last row; null if no more pages
  hasMore: z.boolean(),
});
export type ClientListResponse = z.infer<typeof ClientListResponseSchema>;
