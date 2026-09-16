export const visitQueries = {
  findByClient: `
    SELECT * FROM visits
    WHERE client_id = ? AND deleted_at IS NULL
    ORDER BY visited_at DESC
  `,

  findLatestByClient: `
    SELECT * FROM visits
    WHERE client_id = ? AND deleted_at IS NULL
    ORDER BY visited_at DESC
    LIMIT 1
  `,

  insert: `
    INSERT INTO visits
      (id, client_id, user_id, visited_at, weight_kg, hb_g_dl, muac_mm,
       diet_recall, danger_signs, notes, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,

  findUnsynced: `
    SELECT * FROM visits WHERE synced_at IS NULL AND deleted_at IS NULL
  `,
};
