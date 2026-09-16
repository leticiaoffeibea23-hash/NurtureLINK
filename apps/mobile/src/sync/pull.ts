import type { Scalar } from '@op-engineering/op-sqlite';
import { execute, query, transaction } from '../db';
import { getToken } from '../auth/session';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8181';
const SYNCABLE_TABLES = ['households', 'clients', 'visits', 'flags', 'plans', 'referrals'];

interface SyncStateRow {
  table_name: string;
  last_cursor: string;
}

/** Reads the pull cursor for a given table from sync_state. */
async function getCursor(tableName: string): Promise<string> {
  const rows = await query<SyncStateRow>(
    'SELECT last_cursor FROM sync_state WHERE table_name = ?',
    [tableName],
  );
  return rows[0]?.last_cursor ?? new Date(0).toISOString();
}

/** Advances the cursor for a table after a successful pull. */
async function advanceCursor(tableName: string, cursor: string): Promise<void> {
  await execute(
    `INSERT INTO sync_state (table_name, last_cursor, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(table_name) DO UPDATE SET last_cursor = excluded.last_cursor, updated_at = excluded.updated_at`,
    [tableName, cursor, Date.now()],
  );
}

function j(v: unknown): string {
  return typeof v === 'string' ? v : JSON.stringify(v ?? []);
}

/**
 * Applies a batch of pulled rows to the local SQLite database.
 * Uses table-specific upsert queries — never executes user-supplied SQL.
 * Soft-deleted rows (deleted_at set) are applied as-is for consistency.
 */
async function applyRows(table: string, records: Record<string, unknown>[]): Promise<void> {
  if (records.length === 0) return;

  const stmts = records
    .map((row) => {
      const now = new Date().toISOString();

      switch (table) {
        case 'households':
          return {
            sql: `INSERT INTO households
                    (id, facility_id, label, community, geo, notes, updated_at, deleted_at, synced_at)
                  VALUES (?,?,?,?,?,?,?,?,?)
                  ON CONFLICT(id) DO UPDATE SET
                    label=excluded.label, community=excluded.community,
                    geo=excluded.geo, notes=excluded.notes,
                    updated_at=excluded.updated_at, deleted_at=excluded.deleted_at,
                    synced_at=excluded.synced_at`,
            params: [
              row['id'],
              row['facilityId'] ?? row['facility_id'],
              row['label'],
              row['community'],
              row['geo'] != null ? j(row['geo']) : null,
              row['notes'] ?? null,
              row['updatedAt'] ?? row['updated_at'],
              row['deletedAt'] ?? row['deleted_at'] ?? null,
              row['syncedAt'] ?? row['synced_at'] ?? now,
            ],
          };

        case 'clients':
          return {
            sql: `INSERT INTO clients
                    (id, household_id, type, name, dob, edd_gestation, sex, consent_at, active, updated_at, deleted_at, synced_at)
                  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                  ON CONFLICT(id) DO UPDATE SET
                    name=excluded.name, active=excluded.active,
                    updated_at=excluded.updated_at, deleted_at=excluded.deleted_at,
                    synced_at=excluded.synced_at`,
            params: [
              row['id'],
              row['householdId'] ?? row['household_id'],
              row['type'],
              row['name'],
              row['dob'] ?? null,
              row['eddGestation'] ?? row['edd_gestation'] ?? null,
              row['sex'] ?? null,
              row['consentAt'] ?? row['consent_at'],
              row['active'] ? 1 : 0,
              row['updatedAt'] ?? row['updated_at'],
              row['deletedAt'] ?? row['deleted_at'] ?? null,
              row['syncedAt'] ?? row['synced_at'] ?? now,
            ],
          };

        case 'visits':
          return {
            sql: `INSERT INTO visits
                    (id, client_id, user_id, visited_at, weight_kg, hb_g_dl, muac_mm,
                     diet_recall, danger_signs, notes, updated_at, deleted_at, synced_at)
                  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
                  ON CONFLICT(id) DO UPDATE SET
                    weight_kg=excluded.weight_kg, hb_g_dl=excluded.hb_g_dl,
                    muac_mm=excluded.muac_mm, diet_recall=excluded.diet_recall,
                    danger_signs=excluded.danger_signs, notes=excluded.notes,
                    updated_at=excluded.updated_at, deleted_at=excluded.deleted_at,
                    synced_at=excluded.synced_at`,
            params: [
              row['id'],
              row['clientId'] ?? row['client_id'],
              row['userId'] ?? row['user_id'],
              row['visitedAt'] ?? row['visited_at'],
              row['weightKg'] ?? row['weight_kg'] ?? null,
              row['hbGDl'] ?? row['hb_g_dl'] ?? null,
              row['muacMm'] ?? row['muac_mm'] ?? null,
              j(row['dietRecall'] ?? row['diet_recall'] ?? []),
              row['dangerSigns'] != null ? j(row['dangerSigns'] ?? row['danger_signs']) : null,
              row['notes'] ?? null,
              row['updatedAt'] ?? row['updated_at'],
              row['deletedAt'] ?? row['deleted_at'] ?? null,
              row['syncedAt'] ?? row['synced_at'] ?? now,
            ],
          };

        case 'flags':
          return {
            sql: `INSERT INTO flags
                    (id, client_id, visit_id, severity, reasons, computed_at, reference_bundle_version)
                  VALUES (?,?,?,?,?,?,?)
                  ON CONFLICT(id) DO UPDATE SET
                    severity=excluded.severity, reasons=excluded.reasons,
                    computed_at=excluded.computed_at,
                    reference_bundle_version=excluded.reference_bundle_version`,
            params: [
              row['id'],
              row['clientId'] ?? row['client_id'],
              row['visitId'] ?? row['visit_id'],
              row['severity'],
              j(row['reasons'] ?? []),
              row['computedAt'] ?? row['computed_at'],
              row['referenceBundleVersion'] ?? row['reference_bundle_version'],
            ],
          };

        case 'plans':
          return {
            sql: `INSERT INTO plans
                    (id, client_id, visit_id, season_month, district, target_nutrients,
                     foods, adequacy, rationale, voice_script, voice_pack_id, ai_enriched,
                     reference_bundle_version, created_by, created_at)
                  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                  ON CONFLICT(id) DO UPDATE SET
                    foods=excluded.foods, adequacy=excluded.adequacy,
                    voice_script=excluded.voice_script, ai_enriched=excluded.ai_enriched,
                    reference_bundle_version=excluded.reference_bundle_version`,
            params: [
              row['id'],
              row['clientId'] ?? row['client_id'],
              row['visitId'] ?? row['visit_id'],
              row['seasonMonth'] ?? row['season_month'],
              row['district'],
              j(row['targetNutrients'] ?? row['target_nutrients'] ?? []),
              j(row['foods'] ?? []),
              j(row['adequacy'] ?? {}),
              j(row['rationale'] ?? []),
              row['voiceScript'] ?? row['voice_script'] ?? null,
              row['voicePackId'] ?? row['voice_pack_id'] ?? null,
              row['aiEnriched'] ?? row['ai_enriched'] ? 1 : 0,
              row['referenceBundleVersion'] ?? row['reference_bundle_version'],
              row['createdBy'] ?? row['created_by'],
              row['createdAt'] ?? row['created_at'],
            ],
          };

        case 'referrals':
          return {
            sql: `INSERT INTO referrals
                    (id, client_id, visit_id, reason, flag_codes, facility_to, status,
                     queued_offline, issued_at, updated_at, synced_at)
                  VALUES (?,?,?,?,?,?,?,?,?,?,?)
                  ON CONFLICT(id) DO UPDATE SET
                    status=excluded.status, facility_to=excluded.facility_to,
                    updated_at=excluded.updated_at, synced_at=excluded.synced_at`,
            params: [
              row['id'],
              row['clientId'] ?? row['client_id'],
              row['visitId'] ?? row['visit_id'],
              row['reason'],
              j(row['flagCodes'] ?? row['flag_codes'] ?? []),
              row['facilityTo'] ?? row['facility_to'] ?? null,
              row['status'] ?? 'issued',
              0, // pulled records are not queued for push
              row['issuedAt'] ?? row['issued_at'],
              row['updatedAt'] ?? row['updated_at'],
              row['syncedAt'] ?? row['synced_at'] ?? now,
            ],
          };

        default:
          return null;
      }
    })
    .filter(Boolean) as Array<{ sql: string; params: Scalar[] }>;

  if (stmts.length > 0) {
    await transaction(stmts);
  }
}

export async function pullChanges(): Promise<void> {
  const token = await getToken();

  // Use the oldest cursor across all syncable tables (conservative)
  const cursors = await Promise.all(SYNCABLE_TABLES.map(getCursor));
  const cursor = cursors.sort()[0]; // earliest ISO string

  const tables = SYNCABLE_TABLES.join(',');

  const res = await fetch(
    `${API_URL}/sync/pull?since=${encodeURIComponent(cursor)}&tables=${tables}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );

  if (!res.ok) throw new Error(`Pull failed: ${res.status}`);

  const { rows, cursor: newCursor } = (await res.json()) as {
    rows: Record<string, Record<string, unknown>[]>;
    cursor: string;
    hasMore: boolean;
  };

  // Apply each table's rows to local SQLite
  for (const [table, records] of Object.entries(rows)) {
    if (!records || records.length === 0) continue;
    await applyRows(table, records);
    console.log(`[Pull] ${table}: applied ${records.length} records`);
  }

  // Advance cursor for all syncable tables
  await Promise.all(SYNCABLE_TABLES.map((t) => advanceCursor(t, newCursor)));
  console.log('[Pull] New cursor:', newCursor);
}
