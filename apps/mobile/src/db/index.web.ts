/**
 * Web stub for the SQLite database layer.
 * op-sqlite is a native-only module — on web all operations are no-ops.
 * The app runs on demo seed data from the Zustand store instead.
 */

export type Scalar = string | number | boolean | null;

// Matches the shape callers use from the native implementation.
export async function getDb(): Promise<null> {
  return null;
}

export async function closeDb(): Promise<void> {}

export async function execute(_sql: string, _params: Scalar[] = []): Promise<number> {
  return 0;
}

export async function query<T = Record<string, Scalar>>(
  _sql: string,
  _params: Scalar[] = [],
): Promise<T[]> {
  return [];
}

export async function transaction(
  _statements: Array<{ sql: string; params?: Scalar[] }>,
): Promise<void> {}
