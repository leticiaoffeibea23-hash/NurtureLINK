import { PrismaClient, Prisma } from '@prisma/client';
import { CreateVisitInput, CreateFlagInput } from '@nurturelink/shared';

const prisma = new PrismaClient();

export class VisitRepository {
  async upsertVisit(data: CreateVisitInput) {
    return prisma.visit.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        clientId: data.clientId,
        userId: data.userId,
        visitedAt: new Date(data.visitedAt),
        weightKg: data.weightKg ?? null,
        hbGDl: data.hbGDl ?? null,
        muacMm: data.muacMm ?? null,
        dietRecall: data.dietRecall as Prisma.InputJsonValue,
        dangerSigns: data.dangerSigns as Prisma.InputJsonValue,
        notes: data.notes,
        syncedAt: new Date(),
      },
      update: {
        visitedAt: new Date(data.visitedAt),
        weightKg: data.weightKg ?? null,
        hbGDl: data.hbGDl ?? null,
        muacMm: data.muacMm ?? null,
        dietRecall: data.dietRecall as Prisma.InputJsonValue,
        dangerSigns: data.dangerSigns as Prisma.InputJsonValue,
        notes: data.notes,
        syncedAt: new Date(),
      },
    });
  }

  async upsertFlag(data: CreateFlagInput) {
    return prisma.flag.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        clientId: data.clientId,
        visitId: data.visitId,
        severity: data.severity,
        reasons: data.reasons as Prisma.InputJsonValue,
        computedAt: new Date(data.computedAt),
        referenceBundleVersion: data.referenceBundleVersion,
      },
      update: {
        severity: data.severity,
        reasons: data.reasons as Prisma.InputJsonValue,
        computedAt: new Date(data.computedAt),
        referenceBundleVersion: data.referenceBundleVersion,
      },
    });
  }

  async findVisitsByClient(clientId: string) {
    return prisma.visit.findMany({
      where: { clientId, deletedAt: null },
      orderBy: { visitedAt: 'desc' },
    });
  }

  async findFlagsByClient(clientId: string) {
    return prisma.flag.findMany({
      where: { clientId },
      orderBy: { computedAt: 'desc' },
    });
  }
}
