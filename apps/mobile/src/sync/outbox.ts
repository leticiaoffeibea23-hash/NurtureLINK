import { v4 as uuidv4 } from 'uuid';
import { SyncMutation, SyncOperation, SyncEntityType } from '@nurturelink/shared';
import { execute, query } from '../db';

interface OutboxRow {
  id: number;
  idempotency_key: string;
  entity_type: string;
  entity_id: string;
  operation: string;
  payload: string;
  created_at: number;
}

/**
 * Adds a mutation to the local outbox for later push to the server.
 * Every local write should call this immediately after writing to SQLite
 * to guarantee eventual delivery via sync.
 */
export async function enqueue(
  entityType: SyncEntityType,
  entityId: string,
  operation: SyncOperation,
  payload: Record<string, unknown>,
): Promise<void> {
  const idempotencyKey = uuidv4();
  const createdAt = Date.now();

  await execute(
    `INSERT INTO outbox
       (idempotency_key, entity_type, entity_id, operation, payload, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [idempotencyKey, entityType, entityId, operation, JSON.stringify(payload), createdAt],
  );
}

/** Returns all pending outbox mutations ordered by creation time. */
export async function drain(): Promise<SyncMutation[]> {
  const rows = await query<OutboxRow>('SELECT * FROM outbox ORDER BY id ASC');
  return rows.map((row) => ({
    idempotencyKey: row.idempotency_key,
    entityType: row.entity_type as SyncEntityType,
    entityId: row.entity_id,
    operation: row.operation as SyncOperation,
    payload: JSON.parse(row.payload) as Record<string, unknown>,
  }));
}

/** Removes successfully accepted mutations from the outbox. */
export async function acknowledge(idempotencyKeys: string[]): Promise<void> {
  if (idempotencyKeys.length === 0) return;
  const placeholders = idempotencyKeys.map(() => '?').join(', ');
  await execute(
    `DELETE FROM outbox WHERE idempotency_key IN (${placeholders})`,
    idempotencyKeys,
  );
}
