import { PrismaClient } from '@prisma/client';
import { CreateHouseholdInput, CreateClientInput } from '@nurturelink/shared';

const prisma = new PrismaClient();

export class ClientRepository {
  async upsertHousehold(data: CreateHouseholdInput) {
    return prisma.household.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        facilityId: data.facilityId,
        label: data.label,
        community: data.community,
        geo: data.geo ?? undefined,
        notes: data.notes,
      },
      update: {
        label: data.label,
        community: data.community,
        geo: data.geo ?? undefined,
        notes: data.notes,
        syncedAt: new Date(),
      } as Parameters<typeof prisma.household.upsert>[0]['update'],
    });
  }

  async upsertClient(data: CreateClientInput) {
    return prisma.client.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        householdId: data.householdId,
        type: data.type,
        name: data.name,
        dob: data.dob ? new Date(data.dob) : null,
        eddGestation: data.eddGestation,
        sex: data.sex,
        consentAt: new Date(data.consentAt),
        active: data.active,
        syncedAt: new Date(),
      },
      update: {
        name: data.name,
        dob: data.dob ? new Date(data.dob) : null,
        eddGestation: data.eddGestation,
        sex: data.sex,
        consentAt: new Date(data.consentAt),
        active: data.active,
        syncedAt: new Date(),
      },
    });
  }

  async findClientsByFacility(facilityId: string) {
    return prisma.client.findMany({
      where: {
        household: { facilityId },
        deletedAt: null,
      },
      include: { household: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findClientById(id: string) {
    return prisma.client.findUnique({
      where: { id },
    });
  }
}
