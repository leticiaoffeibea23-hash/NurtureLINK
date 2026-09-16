import { PrismaClient } from '@prisma/client';
import {
  SyncMutation,
  CreateHouseholdSchema,
  CreateClientSchema,
  CreateVisitSchema,
  CreateFlagSchema,
  CreatePlanSchema,
  CreateReferralSchema,
} from '@nurturelink/shared';
import { AuthUser } from '../middleware/authenticate';
import { ClientRepository } from './client.repository';
import { VisitRepository } from './visit.repository';
import { PlanRepository } from './plan.repository';
import { ReferralRepository } from './referral.repository';

const prisma = new PrismaClient();
const clientRepo = new ClientRepository();
const visitRepo = new VisitRepository();
const planRepo = new PlanRepository();
const referralRepo = new ReferralRepository();

export class SyncRepository {
  async upsert(mutation: SyncMutation, _actor: AuthUser): Promise<void> {
    const { entityType, entityId, operation, payload } = mutation;

    switch (entityType) {
      case 'households': {
        const data = CreateHouseholdSchema.parse({ ...payload, id: entityId });
        await clientRepo.upsertHousehold(data);
        break;
      }

      case 'clients': {
        if (operation === 'delete') {
          await prisma.client.update({
            where: { id: entityId },
            data: { deletedAt: new Date(), syncedAt: new Date() },
          });
        } else {
          const data = CreateClientSchema.parse({ ...payload, id: entityId });
          await clientRepo.upsertClient(data);
        }
        break;
      }

      case 'visits': {
        if (operation !== 'delete') {
          const data = CreateVisitSchema.parse({ ...payload, id: entityId });
          await visitRepo.upsertVisit(data);
        }
        break;
      }

      case 'flags': {
        const data = CreateFlagSchema.parse({ ...payload, id: entityId });
        await visitRepo.upsertFlag(data);
        break;
      }

      case 'plans': {
        const data = CreatePlanSchema.parse({ ...payload, id: entityId });
        await planRepo.upsertPlan(data);
        break;
      }

      case 'referrals': {
        const data = CreateReferralSchema.parse({ ...payload, id: entityId });
        await referralRepo.upsertReferral(data);
        break;
      }

      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  async pullSince(
    since: string,
    tables: string[],
    facilityId: string | null,
  ): Promise<{
    clients?: Record<string, unknown>[];
    households?: Record<string, unknown>[];
    visits?: Record<string, unknown>[];
    flags?: Record<string, unknown>[];
    plans?: Record<string, unknown>[];
    referrals?: Record<string, unknown>[];
  }> {
    const sinceDate = new Date(since);
    const facilityFilter = facilityId ?? undefined;
    const rows: ReturnType<SyncRepository['pullSince']> extends Promise<infer R> ? R : never = {};

    if (tables.includes('households')) {
      rows.households = (
        await prisma.household.findMany({
          where: { updatedAt: { gt: sinceDate }, facilityId: facilityFilter },
        })
      ) as Record<string, unknown>[];
    }

    if (tables.includes('clients')) {
      rows.clients = (
        await prisma.client.findMany({
          where: {
            updatedAt: { gt: sinceDate },
            household: { facilityId: facilityFilter },
          },
        })
      ) as Record<string, unknown>[];
    }

    if (tables.includes('visits')) {
      rows.visits = (
        await prisma.visit.findMany({
          where: {
            updatedAt: { gt: sinceDate },
            client: { household: { facilityId: facilityFilter } },
          },
        })
      ) as Record<string, unknown>[];
    }

    if (tables.includes('flags')) {
      rows.flags = (
        await prisma.flag.findMany({
          where: {
            computedAt: { gt: sinceDate },
            client: { household: { facilityId: facilityFilter } },
          },
        })
      ) as Record<string, unknown>[];
    }

    if (tables.includes('plans')) {
      rows.plans = (
        await prisma.plan.findMany({
          where: {
            createdAt: { gt: sinceDate },
            client: { household: { facilityId: facilityFilter } },
          },
        })
      ) as Record<string, unknown>[];
    }

    if (tables.includes('referrals')) {
      rows.referrals = (
        await prisma.referral.findMany({
          where: {
            updatedAt: { gt: sinceDate },
            client: { household: { facilityId: facilityFilter } },
          },
        })
      ) as Record<string, unknown>[];
    }

    return rows;
  }
}
