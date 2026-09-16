/**
 * Reference bundle sync — downloads and applies the latest reference bundle
 * from the server into local SQLite.
 *
 * Called by the sync orchestrator on foreground/network events.
 * Safe to call repeatedly — is a no-op if the local version matches the server.
 */

import type { Scalar } from '@op-engineering/op-sqlite';
import { execute, query, transaction } from '../db';
import { getToken } from '../auth/session';
import type { ReferenceBundlePayload, ReferenceBundleManifest } from '@nurturelink/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8181';
const BUNDLE_STATE_KEY = '__reference_bundle__';

async function getStoredVersion(): Promise<string | null> {
  const rows = await query<{ last_cursor: string }>(
    'SELECT last_cursor FROM sync_state WHERE table_name = ?',
    [BUNDLE_STATE_KEY],
  );
  return rows[0]?.last_cursor ?? null;
}

async function setStoredVersion(versionTag: string): Promise<void> {
  await execute(
    `INSERT INTO sync_state (table_name, last_cursor, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(table_name) DO UPDATE SET
       last_cursor = excluded.last_cursor,
       updated_at  = excluded.updated_at`,
    [BUNDLE_STATE_KEY, versionTag, Date.now()],
  );
}

function j(v: unknown): string {
  return JSON.stringify(v);
}

async function applyBundle(payload: ReferenceBundlePayload): Promise<void> {
  // Replace all reference tables atomically — clear then insert.
  const stmts: Array<{ sql: string; params: Scalar[] }> = [];

  stmts.push({ sql: 'DELETE FROM clinical_thresholds', params: [] });
  stmts.push({ sql: 'DELETE FROM nutrient_targets', params: [] });
  stmts.push({ sql: 'DELETE FROM seasonal_availability', params: [] });
  stmts.push({ sql: 'DELETE FROM foods', params: [] });

  for (const food of payload.foods) {
    stmts.push({
      sql: `INSERT INTO foods
              (id, name, local_names, food_group, nutrients, affordability_tier, storable, garden_wild)
            VALUES (?,?,?,?,?,?,?,?)`,
      params: [
        food.id,
        food.name,
        j(food.localNames),
        food.foodGroup,
        j(food.nutrients),
        food.affordabilityTier,
        food.storable ? 1 : 0,
        food.gardenWild ? 1 : 0,
      ],
    });
  }

  for (const s of payload.seasonalAvailability) {
    stmts.push({
      sql: `INSERT INTO seasonal_availability (id, agro_zone_id, month, food_id, availability)
            VALUES (?,?,?,?,?)`,
      params: [s.id, s.agroZoneId, s.month, s.foodId, s.availability],
    });
  }

  for (const t of payload.nutrientTargets) {
    stmts.push({
      sql: `INSERT INTO nutrient_targets (id, profile, nutrient, daily_target, source)
            VALUES (?,?,?,?,?)`,
      params: [t.id, t.profile, t.nutrient, t.dailyTarget, t.source],
    });
  }

  for (const t of payload.clinicalThresholds) {
    stmts.push({
      sql: `INSERT INTO clinical_thresholds (id, metric, condition, severity, threshold_value, threshold_direction, source)
            VALUES (?,?,?,?,?,?,?)`,
      params: [t.id, t.metric, t.condition, t.severity, t.thresholdValue, t.thresholdDirection, t.source],
    });
  }

  await transaction(stmts);
}

/**
 * Checks the server manifest and downloads a new bundle if one is available.
 * Returns true if a new bundle was applied (caller should reload from SQLite).
 */
export async function checkAndDownloadBundle(): Promise<boolean> {
  const token = await getToken();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const manifestRes = await fetch(`${API_URL}/reference/manifest`, { headers });
  if (!manifestRes.ok) {
    throw new Error(`Manifest fetch failed: ${manifestRes.status}`);
  }

  const manifest = (await manifestRes.json()) as ReferenceBundleManifest;

  // Find the most recently published active bundle
  const latest = manifest.bundles
    .filter((b) => b.active)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];

  if (!latest) return false;

  const stored = await getStoredVersion();
  if (stored === latest.versionTag) return false; // already up to date

  console.log(`[Bundle] Downloading ${latest.versionTag} (was: ${stored ?? 'none'})`);

  // fetch transparently decompresses gzip on Android (OkHttp) and iOS (NSURLSession)
  const bundleRes = await fetch(`${API_URL}/reference/${latest.versionTag}`, { headers });
  if (!bundleRes.ok) {
    throw new Error(`Bundle download failed: ${bundleRes.status}`);
  }

  const payload = (await bundleRes.json()) as ReferenceBundlePayload;

  await applyBundle(payload);
  await setStoredVersion(latest.versionTag);

  console.log(`[Bundle] Applied ${latest.versionTag}: ${payload.foods.length} foods`);
  return true;
}
