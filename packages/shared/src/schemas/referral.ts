import { z } from 'zod';
import { FlagCodeSchema } from './visit';

export const ReferralStatusSchema = z.enum([
  'issued',
  'in_transit',
  'arrived',
  'outcome_good',
  'outcome_poor',
  'lost_to_follow_up',
]);
export type ReferralStatus = z.infer<typeof ReferralStatusSchema>;

export const ReferralSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  visitId: z.string().uuid(),
  reason: z.string(),
  flagCodes: z.array(FlagCodeSchema),
  facilityTo: z.string().nullable(),    // facility UUID or free-text name
  status: ReferralStatusSchema.default('issued'),
  queuedOffline: z.boolean().default(true),
  issuedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  syncedAt: z.string().datetime().nullable(),
});
export type Referral = z.infer<typeof ReferralSchema>;

// Used by mobile when creating a referral (syncedAt added by server on accept).
export const CreateReferralSchema = ReferralSchema.omit({ syncedAt: true });
export type CreateReferralInput = z.infer<typeof CreateReferralSchema>;

// PATCH /referrals/:id/status
export const UpdateReferralStatusSchema = z.object({
  status: ReferralStatusSchema,
  updatedAt: z.string().datetime(),
});
export type UpdateReferralStatusInput = z.infer<typeof UpdateReferralStatusSchema>;

// Paginated list response.
export const ReferralListResponseSchema = z.object({
  referrals: z.array(ReferralSchema),
  cursor: z.string().datetime().nullable(),
  hasMore: z.boolean(),
});
export type ReferralListResponse = z.infer<typeof ReferralListResponseSchema>;
