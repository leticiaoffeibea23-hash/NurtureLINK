import { CreateReferralInput, UpdateReferralStatusInput, Referral, ReferralListResponse } from '@nurturelink/shared';
import { ReferralRepository } from '../repositories/referral.repository';

const repo = new ReferralRepository();

function serializeReferral(row: {
  id: string;
  clientId: string;
  visitId: string;
  reason: string;
  flagCodes: unknown;
  facilityTo: string | null;
  status: string;
  queuedOffline: boolean;
  issuedAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
}): Referral {
  return {
    id: row.id,
    clientId: row.clientId,
    visitId: row.visitId,
    reason: row.reason,
    flagCodes: row.flagCodes as Referral['flagCodes'],
    facilityTo: row.facilityTo,
    status: row.status as Referral['status'],
    queuedOffline: row.queuedOffline,
    issuedAt: row.issuedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    syncedAt: row.syncedAt ? row.syncedAt.toISOString() : null,
  };
}

export class ReferralService {
  async create(input: CreateReferralInput): Promise<Referral> {
    const row = await repo.upsertReferral(input);
    return serializeReferral(row);
  }

  async updateStatus(id: string, input: UpdateReferralStatusInput): Promise<Referral> {
    const row = await repo.updateStatus(id, input.status);
    return serializeReferral(row);
  }

  async listByFacility(facilityId: string): Promise<ReferralListResponse> {
    const rows = await repo.findByFacility(facilityId);
    return {
      referrals: rows.map(serializeReferral),
      cursor: rows.length > 0 ? rows[rows.length - 1].updatedAt.toISOString() : null,
      hasMore: false,
    };
  }

  async findById(id: string): Promise<Referral | null> {
    const row = await repo.findById(id);
    return row ? serializeReferral(row) : null;
  }
}
