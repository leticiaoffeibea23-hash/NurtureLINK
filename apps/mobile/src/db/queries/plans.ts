export const planQueries = {
  findByClient: `
    SELECT * FROM plans WHERE client_id = ? ORDER BY created_at DESC
  `,

  findByVisit: `
    SELECT * FROM plans WHERE visit_id = ? LIMIT 1
  `,

  insert: `
    INSERT INTO plans
      (id, client_id, visit_id, season_month, district, target_nutrients,
       foods, adequacy, rationale, voice_script, voice_pack_id, ai_enriched,
       reference_bundle_version, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
  `,

  updateVoiceScript: `
    UPDATE plans SET voice_script = ?, ai_enriched = 1 WHERE id = ?
  `,
};
