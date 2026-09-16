import { PrismaClient, Prisma } from '@prisma/client';
import { CreateReferralInput, ReferralStatus } from '@nurturelink/shared';

const prisma = new PrismaClient();

export class ReferralRepository {
  async upsertReferral(data: CreateReferralInput) {
    return prisma.referral.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        clientId: data.clientId,
        visitId: data.visitId,
        reason: data.reason,
        flagCodes: data.flagCodes as Prisma.InputJsonValue,
        facilityTo: data.facilityTo,
        status: data.status,
        queuedOffline: data.queuedOffline,
        issuedAt: new Date(data.issuedAt),
        syncedAt: new Date(),
      },
      update: {
        reason: data.reason,
        facilityTo: data.facilityTo,
        status: data.status,
        syncedAt: new Date(),
      },
    });
  }

  async updateStatus(id: string, status: ReferralStatus) {
    return prisma.referral.update({
      where: { id },
      data: { status },
    });
  }

  async findByFacility(facilityId: string) {
    return prisma.referral.findMany({
      where: {
        client: { household: { facilityId } },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.referral.findUnique({ where: { id } });
  }
}
