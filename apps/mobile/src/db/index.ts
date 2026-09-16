/**
 * On-device SQLCipher database — NurtureLink mobile.
 *
 * Uses @op-engineering/op-sqlite which compiles SQLite with SQLCipher for
 * at-rest encryption. The native module is only available in a custom dev
 * client (EAS Build) — not in Expo Go.
 *
 * When the native module is absent the DB layer becomes a safe no-op so the
 * app runs with in-memory demo data in Expo Go or CI without crashing.
 */

// Type-only imports are erased at runtime — safe regardless of native availability.
import type { DB, Scalar } from '@op-engineering/op-sqlite';
import { TurboModuleRegistry } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { CREATE_TABLES } from './schema';

export type { Scalar };

const DB_NAME = 'nurturelink.db';
const KEY_ALIAS = 'nl_db_key';

// ─── Native module availability check ────────────────────────────────────────

/**
 * Use TurboModuleRegistry.get() — returns null instead of throwing when the
 * native module isn't compiled into the binary (e.g. Expo Go).
 * Never use require() for this check: Metro's "Base module not found" error
 * is not a catchable JS exception in Hermes.
 */
let _nativeAvailable: boolean | null = null;
function nativeAvailable(): boolean {
  if (_nativeAvailable === null) {
    _nativeAvailable = TurboModuleRegistry.get('OPSQLite') !== null;
  }
  return _nativeAvailable;
}

// ─── Key management ───────────────────────────────────────────────────────────

async function getOrCreateKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_ALIAS);
  if (existing) return existing;

  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const key = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  await SecureStore.setItemAsync(KEY_ALIAS, key, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return key;
}

// ─── Database singleton ───────────────────────────────────────────────────────

let _db: DB | null = null;
let _initPromise: Promise<DB> | null = null;

/** Split a multi-statement SQL string into individual executable statements. */
function splitStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));
}

async function initDb(): Promise<DB> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { open } = require('@op-engineering/op-sqlite') as typeof import('@op-engineering/op-sqlite');

  const encryptionKey = await getOrCreateKey();
  const db = open({ name: DB_NAME, encryptionKey });

  for (const stmt of splitStatements(CREATE_TABLES)) {
    try {
      await db.execute(stmt);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('duplicate column name')) throw e;
    }
  }

  return db;
}

/**
 * Returns the initialised database instance, creating it on first call.
 * Safe to call from multiple places — opens the DB exactly once.
 *
 * Returns null when the op-sqlite native module isn't available (Expo Go /
 * CI). All callers must handle null.
 */
export async function getDb(): Promise<DB | null> {
  if (!nativeAvailable()) {
    console.log('[DB] op-sqlite native module not available — running without SQLite');
    return null;
  }
  if (_db) return _db;
  if (!_initPromise) {
    _initPromise = initDb().then((db) => {
      _db = db;
      return db;
    });
  }
  return _initPromise;
}

export async function closeDb(): Promise<void> {
  if (_db) {
    _db.close();
    _db = null;
    _initPromise = null;
  }
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

/** Execute a write statement. Returns 0 (no-op) when SQLite is unavailable. */
export async function execute(sql: string, params: Scalar[] = []): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.execute(sql, params);
  return result.rowsAffected;
}

/** Query rows. Returns an empty array when SQLite is unavailable. */
export async function query<T = Record<string, Scalar>>(
  sql: string,
  params: Scalar[] = [],
): Promise<T[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.execute(sql, params);
  return result.rows as T[];
}

/**
 * Run multiple write statements in a transaction.
 * No-op when SQLite is unavailable.
 */
export async function transaction(
  statements: Array<{ sql: string; params?: Scalar[] }>,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.transaction(async (tx) => {
    for (const { sql, params } of statements) {
      await tx.execute(sql, params ?? []);
    }
  });
}
