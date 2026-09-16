import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ReferenceRepository {
  async getActiveBundles() {
    return prisma.referenceBundle.findMany({ where: { active: true } });
  }

  async findBundle(versionTag: string) {
    return prisma.referenceBundle.findUnique({ where: { versionTag } });
  }
}
