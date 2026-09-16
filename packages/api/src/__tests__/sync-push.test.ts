/**
 * Sync push — entity routing and idempotency tests.
 *
 * Verifies that the sync service:
 * - Accepts all supported entity types
 * - Returns idempotency keys for accepted mutations
 * - Isolates errors per mutation (one bad mutation doesn't fail others)
 */

import { SyncService } from '../services/sync.service';

// ── Mock sync + audit repos ───────────────────────────────────────────────────

const mockUpsert = jest.fn();
const mockLog = jest.fn();

jest.mock('../repositories/sync.repository', () => ({
  SyncRepository: jest.fn().mockImplementation(() => ({
    upsert: mockUpsert,
    pullSince: jest.fn().mockResolvedValue({}),
  })),
}));

jest.mock('../repositories/audit.repository', () => ({
  AuditRepository: jest.fn().mockImplementation(() => ({
    log: mockLog,
  })),
}));

import type { SyncMutation } from '@nurturelink/shared';
import type { AuthUser } from '../middleware/authenticate';

const actor: AuthUser = {
  id: 'user-uuid-0000-0000-0000-000000000001',
  role: 'CHO',
  facilityId: 'facility-uuid-0000-0000-0000-000000000001',
};

function makeMutation(entityType: string, idempotencyKey?: string): SyncMutation {
  return {
    idempotencyKey: idempotencyKey ?? 'idem-key-0000-0000-0000-000000000001',
    entityType: entityType as SyncMutation['entityType'],
    entityId: 'entity-uuid-000-0000-0000-000000000001',
    operation: 'insert',
    payload: { name: 'Test' },
  };
}

describe('SyncService — push', () => {
  let svc: SyncService;

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new SyncService();
    mockUpsert.mockResolvedValue(undefined);
    mockLog.mockResolvedValue(undefined);
  });

  it('accepts a valid mutation and returns its idempotency key', async () => {
    const mutation = makeMutation('clients');
    const result = await svc.push({ mutations: [mutation] }, actor);

    expect(result.accepted).toContain(mutation.idempotencyKey);
    expect(result.errors).toHaveLength(0);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockLog).toHaveBeenCalledTimes(1);
  });

  it('handles multiple mutations in a single batch', async () => {
    const mutations: SyncMutation[] = [
      makeMutation('clients', 'idem-0000-0000-0000-000000000001'),
      makeMutation('visits', 'idem-0000-0000-0000-000000000002'),
      makeMutation('referrals', 'idem-0000-0000-0000-000000000003'),
    ];
    const result = await svc.push({ mutations }, actor);

    expect(result.accepted).toHaveLength(3);
    expect(result.errors).toHaveLength(0);
  });

  it('isolates errors — bad mutation does not fail the rest', async () => {
    const mutations: SyncMutation[] = [
      makeMutation('clients', 'idem-ok-0000-0000-0000-000000000001'),
      makeMutation('clients', 'idem-bad-000-0000-0000-000000000002'),
      makeMutation('visits', 'idem-ok-0000-0000-0000-000000000003'),
    ];

    mockUpsert
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Constraint violation'))
      .mockResolvedValueOnce(undefined);

    const result = await svc.push({ mutations }, actor);

    expect(result.accepted).toContain('idem-ok-0000-0000-0000-000000000001');
    expect(result.accepted).toContain('idem-ok-0000-0000-0000-000000000003');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].idempotencyKey).toBe('idem-bad-000-0000-0000-000000000002');
    expect(result.errors[0].reason).toContain('Constraint violation');
  });

  it('audit log is called for every accepted mutation', async () => {
    const mutation = makeMutation('clients');
    await svc.push({ mutations: [mutation] }, actor);

    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: actor.id,
        entityType: 'clients',
        action: 'insert',
      }),
    );
  });
});
