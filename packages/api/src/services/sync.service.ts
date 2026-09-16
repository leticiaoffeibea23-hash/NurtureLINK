import { SyncPushInput, SyncPushResponse, SyncPullResponse } from '@nurturelink/shared';
import { AuthUser } from '../middleware/authenticate';
import { SyncRepository } from '../repositories/sync.repository';
import { AuditRepository } from '../repositories/audit.repository';

const SYNCABLE_TABLES = ['clients', 'households', 'visits', 'flags', 'plans', 'referrals'];

export class SyncService {
  private syncRepo = new SyncRepository();
  private auditRepo = new AuditRepository();

  async push(input: SyncPushInput, actor: AuthUser): Promise<SyncPushResponse> {
    const accepted: string[] = [];
    const errors: SyncPushResponse['errors'] = [];

    for (const mutation of input.mutations) {
      try {
        await this.syncRepo.upsert(mutation, actor);
        await this.auditRepo.log({
          userId: actor.id,
          entityType: mutation.entityType,
          entityId: mutation.entityId,
          action: mutation.operation,
          changeSummary: mutation.payload,
        });
        accepted.push(mutation.idempotencyKey);
      } catch (err) {
        errors.push({
          idempotencyKey: mutation.idempotencyKey,
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return { accepted, errors };
  }

  async pull(since: string, tables: string[], actor: AuthUser): Promise<SyncPullResponse> {
    const requestedTables = tables.filter((t) => SYNCABLE_TABLES.includes(t));
    const rows = await this.syncRepo.pullSince(since, requestedTables, actor.facilityId);
    return {
      rows,
      cursor: new Date().toISOString(),
      hasMore: false,
    };
  }
}
