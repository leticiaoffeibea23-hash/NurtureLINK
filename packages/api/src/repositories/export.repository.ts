import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TallyData {
  facilityId: string;
  periodStart: Date;
  periodEnd: Date;
  totalClients: number;
  pregnantClients: number;
  childClients: number;
  totalVisits: number;
  referralsIssued: number;
  plansGenerated: number;
}

export class ExportRepository {
  async aggregateForPeriod(
    facilityId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<TallyData> {
    const [clients, visits, referrals, plans] = await Promise.all([
      prisma.client.findMany({
        where: { household: { facilityId }, active: true },
        select: { type: true },
      }),
      prisma.visit.count({
        where: {
          visitedAt: { gte: periodStart, lte: periodEnd },
          client: { household: { facilityId } },
          deletedAt: null,
        },
      }),
      prisma.referral.count({
        where: {
          issuedAt: { gte: periodStart, lte: periodEnd },
          client: { household: { facilityId } },
        },
      }),
      prisma.plan.count({
        where: {
          createdAt: { gte: periodStart, lte: periodEnd },
          client: { household: { facilityId } },
        },
      }),
    ]);

    return {
      facilityId,
      periodStart,
      periodEnd,
      totalClients: clients.length,
      pregnantClients: clients.filter((c) => c.type === 'pregnant').length,
      childClients: clients.filter((c) => c.type === 'child').length,
      totalVisits: visits,
      referralsIssued: referrals,
      plansGenerated: plans,
    };
  }
}
