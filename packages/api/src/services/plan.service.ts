import { CreatePlanInput, Plan, PlanBlockedResponse } from '@nurturelink/shared';
import { PlanRepository } from '../repositories/plan.repository';

function serializePlan(row: {
  id: string;
  clientId: string;
  visitId: string;
  seasonMonth: number;
  district: string;
  targetNutrients: unknown;
  foods: unknown;
  adequacy: unknown;
  rationale: unknown;
  voiceScript: string | null;
  voicePackId: string | null;
  aiEnriched: boolean;
  referenceBundleVersion: string;
  createdBy: string;
  createdAt: Date;
}): Plan {
  return {
    id: row.id,
    clientId: row.clientId,
    visitId: row.visitId,
    seasonMonth: row.seasonMonth,
    district: row.district,
    targetNutrients: row.targetNutrients as Plan['targetNutrients'],
    foods: row.foods as Plan['foods'],
    adequacy: row.adequacy as Plan['adequacy'],
    rationale: row.rationale as Plan['rationale'],
    voiceScript: row.voiceScript,
    voicePackId: row.voicePackId,
    aiEnriched: row.aiEnriched,
    referenceBundleVersion: row.referenceBundleVersion,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
  };
}

export type CreatePlanResult =
  | { blocked: true; body: PlanBlockedResponse }
  | { blocked: false; plan: Plan };

export class PlanService {
  private repo = new PlanRepository();

  /**
   * Create a plan. Enforces the safety guardrail: if a 'refer' severity flag
   * exists for the visit, returns a blocked result instead of creating a plan.
   */
  async create(input: CreatePlanInput): Promise<CreatePlanResult> {
    const flag = await this.repo.findFlagByVisitId(input.visitId);

    if (flag && flag.severity === 'refer') {
      const existingReferral = await this.repo.findReferralByVisitId(input.visitId);
      return {
        blocked: true,
        body: {
          error: 'REFER_REQUIRED',
          severity: 'refer',
          referralId: existingReferral?.id ?? null,
          flagId: flag.id,
        },
      };
    }

    const row = await this.repo.upsertPlan(input);
    return { blocked: false, plan: serializePlan(row) };
  }

  async listByClient(clientId: string): Promise<Plan[]> {
    const rows = await this.repo.findPlansByClient(clientId);
    return rows.map(serializePlan);
  }

  async findById(id: string): Promise<Plan | null> {
    const row = await this.repo.findPlanById(id);
    return row ? serializePlan(row) : null;
  }
}
