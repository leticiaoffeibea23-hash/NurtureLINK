import { PrismaClient, Prisma } from '@prisma/client';
import { CreatePlanInput } from '@nurturelink/shared';

const prisma = new PrismaClient();

export class PlanRepository {
  /** Find the flag for a visit to check severity before creating a plan. */
  async findFlagByVisitId(visitId: string) {
    return prisma.flag.findFirst({ where: { visitId } });
  }

  /** Find the most recent referral for a client/visit. */
  async findReferralByVisitId(visitId: string) {
    return prisma.referral.findFirst({ where: { visitId } });
  }

  async upsertPlan(data: CreatePlanInput) {
    return prisma.plan.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        clientId: data.clientId,
        visitId: data.visitId,
        seasonMonth: data.seasonMonth,
        district: data.district,
        targetNutrients: data.targetNutrients as Prisma.InputJsonValue,
        foods: data.foods as Prisma.InputJsonValue,
        adequacy: data.adequacy as Prisma.InputJsonValue,
        rationale: data.rationale as Prisma.InputJsonValue,
        voiceScript: null,
        aiEnriched: false,
        referenceBundleVersion: data.referenceBundleVersion,
        createdBy: data.createdBy,
      },
      update: {
        seasonMonth: data.seasonMonth,
        targetNutrients: data.targetNutrients as Prisma.InputJsonValue,
        foods: data.foods as Prisma.InputJsonValue,
        adequacy: data.adequacy as Prisma.InputJsonValue,
        rationale: data.rationale as Prisma.InputJsonValue,
        referenceBundleVersion: data.referenceBundleVersion,
      },
    });
  }

  async findPlansByClient(clientId: string) {
    return prisma.plan.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPlanById(id: string) {
    return prisma.plan.findUnique({ where: { id } });
  }
}
