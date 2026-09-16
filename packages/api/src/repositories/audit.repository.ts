import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditEntry {
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  changeSummary: unknown;
}

export class AuditRepository {
  async log(entry: AuditEntry): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        changeSummary: entry.changeSummary as object,
      },
    });
  }
}
