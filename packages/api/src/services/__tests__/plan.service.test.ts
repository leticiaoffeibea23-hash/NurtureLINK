/**
 * Plan service — safety guardrail tests.
 *
 * The architecture invariant: "Severe cases never receive a home-management plan."
 * These tests verify that the server enforces this gate even if the device
 * sends a create-plan request for a client with a 'refer' severity flag.
 */

import { PlanService } from '../plan.service';

// ── Mock the repository ───────────────────────────────────────────────────────

jest.mock('../../repositories/plan.repository', () => {
  return {
    PlanRepository: jest.fn().mockImplementation(() => ({
      findFlagByVisitId: jest.fn(),
      findReferralByVisitId: jest.fn(),
      upsertPlan: jest.fn(),
      findPlansByClient: jest.fn(),
      findPlanById: jest.fn(),
    })),
  };
});

import { PlanRepository } from '../../repositories/plan.repository';

const mockRepo = new (PlanRepository as jest.MockedClass<typeof PlanRepository>)();

describe('PlanService — severity guardrail', () => {
  let svc: PlanService;

  const basePlanInput = {
    id: 'plan-uuid-0000-0000-0000-000000000001',
    clientId: 'client-uuid-000-0000-0000-000000000001',
    visitId: 'visit-uuid-0000-0000-0000-000000000001',
    seasonMonth: 11,
    district: 'Tamale Metro',
    targetNutrients: ['ironMg', 'folateUg'] as string[],
    foods: [],
    adequacy: {} as Record<string, number>,
    rationale: [],
    voicePackId: null,
    referenceBundleVersion: 'v1.0-seed',
    createdBy: 'user-uuid-0000-0000-0000-000000000001',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new PlanService();
    // Inject the mock repo directly into the service's private field
    (svc as unknown as { repo: typeof mockRepo })['repo'] = mockRepo;
  });

  it('blocks plan creation when a refer-severity flag exists for the visit', async () => {
    const mockFlagId = 'flag-uuid-0000-0000-0000-000000000001';
    (mockRepo.findFlagByVisitId as jest.Mock).mockResolvedValue({
      id: mockFlagId,
      clientId: basePlanInput.clientId,
      visitId: basePlanInput.visitId,
      severity: 'refer',
      reasons: [{ code: 'SEVERE_MUAC', value: 108 }],
      computedAt: new Date(),
      referenceBundleVersion: 'v1.0-seed',
    });
    (mockRepo.findReferralByVisitId as jest.Mock).mockResolvedValue(null);

    const result = await svc.create(basePlanInput);

    expect(result.blocked).toBe(true);
    if (result.blocked) {
      expect(result.body.error).toBe('REFER_REQUIRED');
      expect(result.body.severity).toBe('refer');
      expect(result.body.flagId).toBe(mockFlagId);
      expect(result.body.referralId).toBeNull();
    }
    expect(mockRepo.upsertPlan).not.toHaveBeenCalled();
  });

  it('includes existing referral ID in the blocked response', async () => {
    const mockReferralId = 'referral-uuid-000-0000-0000-000000000001';
    (mockRepo.findFlagByVisitId as jest.Mock).mockResolvedValue({
      id: 'flag-uuid-0000-0000-0000-000000000001',
      severity: 'refer',
      reasons: [{ code: 'DANGER_SIGNS' }],
      computedAt: new Date(),
      referenceBundleVersion: 'v1.0-seed',
    });
    (mockRepo.findReferralByVisitId as jest.Mock).mockResolvedValue({
      id: mockReferralId,
    });

    const result = await svc.create(basePlanInput);

    expect(result.blocked).toBe(true);
    if (result.blocked) {
      expect(result.body.referralId).toBe(mockReferralId);
    }
  });

  it('allows plan creation when flag severity is "watch"', async () => {
    (mockRepo.findFlagByVisitId as jest.Mock).mockResolvedValue({
      id: 'flag-uuid-0000-0000-0000-000000000001',
      severity: 'watch',
      reasons: [{ code: 'FALLING_HB', value: 10.2 }],
      computedAt: new Date(),
      referenceBundleVersion: 'v1.0-seed',
    });
    (mockRepo.upsertPlan as jest.Mock).mockResolvedValue({
      ...basePlanInput,
      voiceScript: null,
      voicePackId: null,
      aiEnriched: false,
      createdAt: new Date(),
    });

    const result = await svc.create(basePlanInput);

    expect(result.blocked).toBe(false);
    if (!result.blocked) {
      expect(result.plan.id).toBe(basePlanInput.id);
    }
    expect(mockRepo.upsertPlan).toHaveBeenCalledTimes(1);
  });

  it('allows plan creation when no flag exists', async () => {
    (mockRepo.findFlagByVisitId as jest.Mock).mockResolvedValue(null);
    (mockRepo.upsertPlan as jest.Mock).mockResolvedValue({
      ...basePlanInput,
      voiceScript: null,
      voicePackId: null,
      aiEnriched: false,
      createdAt: new Date(),
    });

    const result = await svc.create(basePlanInput);

    expect(result.blocked).toBe(false);
    expect(mockRepo.upsertPlan).toHaveBeenCalledTimes(1);
  });
});
