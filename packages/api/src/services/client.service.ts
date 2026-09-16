import {
  RegisterClientInput,
  RegisterClientResponse,
  Client,
} from '@nurturelink/shared';
import { ClientRepository } from '../repositories/client.repository';

const repo = new ClientRepository();

function serializeClient(row: {
  id: string;
  householdId: string;
  type: string;
  name: string;
  dob: Date | null;
  eddGestation: string | null;
  sex: string | null;
  consentAt: Date;
  active: boolean;
  updatedAt: Date;
  deletedAt: Date | null;
  syncedAt: Date | null;
}): Client {
  return {
    id: row.id,
    householdId: row.householdId,
    type: row.type as Client['type'],
    name: row.name,
    dob: row.dob ? row.dob.toISOString().slice(0, 10) : null,
    eddGestation: row.eddGestation,
    sex: row.sex as Client['sex'],
    consentAt: row.consentAt.toISOString(),
    active: row.active,
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    syncedAt: row.syncedAt ? row.syncedAt.toISOString() : null,
  };
}

export class ClientService {
  async register(input: RegisterClientInput): Promise<RegisterClientResponse> {
    const [householdRow, clientRow] = await Promise.all([
      repo.upsertHousehold(input.household),
      repo.upsertClient(input.client),
    ]);

    return {
      household: {
        id: householdRow.id,
        facilityId: householdRow.facilityId,
        label: householdRow.label,
        community: householdRow.community,
        geo: householdRow.geo as { lat: number; lng: number } | null,
        notes: householdRow.notes,
        updatedAt: householdRow.updatedAt.toISOString(),
        deletedAt: householdRow.deletedAt ? householdRow.deletedAt.toISOString() : null,
      },
      client: serializeClient(clientRow),
    };
  }

  async listByFacility(facilityId: string): Promise<{ clients: (Client & { community: string })[]; cursor: string | null; hasMore: boolean }> {
    const rows = await repo.findClientsByFacility(facilityId);
    return {
      clients: rows.map((row) => ({
        ...serializeClient(row),
        community: row.household?.community ?? '',
      })),
      cursor: rows.length > 0 ? rows[rows.length - 1].updatedAt.toISOString() : null,
      hasMore: false,
    };
  }

  async findById(id: string): Promise<Client | null> {
    const row = await repo.findClientById(id);
    return row ? serializeClient(row) : null;
  }
}
