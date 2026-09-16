import { CreateVisitInput, CreateFlagInput, CreateVisitResponse, Visit, Flag } from '@nurturelink/shared';
import { VisitRepository } from '../repositories/visit.repository';

const repo = new VisitRepository();

function serializeVisit(row: {
  id: string;
  clientId: string;
  userId: string;
  visitedAt: Date;
  weightKg: { toNumber: () => number } | null;
  hbGDl: { toNumber: () => number } | null;
  muacMm: { toNumber: () => number } | null;
  dietRecall: unknown;
  dangerSigns: unknown;
  notes: string | null;
  updatedAt: Date;
  deletedAt: Date | null;
  syncedAt: Date | null;
}): Visit {
  return {
    id: row.id,
    clientId: row.clientId,
    userId: row.userId,
    visitedAt: row.visitedAt.toISOString(),
    weightKg: row.weightKg ? row.weightKg.toNumber() : null,
    hbGDl: row.hbGDl ? row.hbGDl.toNumber() : null,
    muacMm: row.muacMm ? row.muacMm.toNumber() : null,
    dietRecall: row.dietRecall as Visit['dietRecall'],
    dangerSigns: (row.dangerSigns ?? []) as Visit['dangerSigns'],
    notes: row.notes,
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    syncedAt: row.syncedAt ? row.syncedAt.toISOString() : null,
  };
}

function serializeFlag(row: {
  id: string;
  clientId: string;
  visitId: string;
  severity: string;
  reasons: unknown;
  computedAt: Date;
  referenceBundleVersion: string;
}): Flag {
  return {
    id: row.id,
    clientId: row.clientId,
    visitId: row.visitId,
    severity: row.severity as Flag['severity'],
    reasons: row.reasons as Flag['reasons'],
    computedAt: row.computedAt.toISOString(),
    referenceBundleVersion: row.referenceBundleVersion,
  };
}

export class VisitService {
  async create(visitInput: CreateVisitInput, flagInput: CreateFlagInput): Promise<CreateVisitResponse> {
    const [visitRow, flagRow] = await Promise.all([
      repo.upsertVisit(visitInput),
      repo.upsertFlag(flagInput),
    ]);

    return {
      visit: serializeVisit(visitRow),
      flag: serializeFlag(flagRow),
    };
  }

  async listByClient(clientId: string): Promise<Visit[]> {
    const rows = await repo.findVisitsByClient(clientId);
    return rows.map(serializeVisit);
  }
}
