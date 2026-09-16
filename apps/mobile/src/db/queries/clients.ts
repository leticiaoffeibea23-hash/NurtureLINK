// TODO: Replace with @op-engineering/op-sqlite DB instance from db/index.ts once wired
// All queries use parameterised statements — never string-concatenate user input

export interface ClientRow {
  id: string;
  householdId: string;
  type: 'pregnant' | 'child';
  name: string;
  dob: string | null;
  eddGestation: string | null;
  sex: string | null;
  consentAt: string;
  active: number;
  updatedAt: string;
  deletedAt: string | null;
  syncedAt: string | null;
}

export const clientQueries = {
  findAll: `
    SELECT * FROM clients
    WHERE active = 1 AND deleted_at IS NULL
    ORDER BY name ASC
  `,

  findById: `
    SELECT * FROM clients WHERE id = ?
  `,

  upsert: `
    INSERT INTO clients
      (id, household_id, type, name, dob, edd_gestation, sex, consent_at, active, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      dob = excluded.dob,
      edd_gestation = excluded.edd_gestation,
      sex = excluded.sex,
      active = excluded.active,
      updated_at = excluded.updated_at
  `,

  softDelete: `
    UPDATE clients SET deleted_at = ?, updated_at = ? WHERE id = ?
  `,

  findUnsynced: `
    SELECT * FROM clients WHERE synced_at IS NULL AND deleted_at IS NULL
  `,
};
