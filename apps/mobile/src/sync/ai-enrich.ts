/**
 * AI enrichment — calls POST /ai/enrich-plan to get a counselling voice script.
 *
 * No PII is sent: only food names, nutrient keys, client profile category, and plan ID.
 * Falls back gracefully if the server is unreachable or the API returns an error.
 */

import { execute } from '../db';
import { getToken } from '../auth/session';
import type { AiEnrichRequest, AiEnrichResponse } from '@nurturelink/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8181';

/**
 * Fetch an AI-enriched voice script for a plan.
 *
 * On success, the script is persisted to the local `plans` table and returned.
 * On failure, returns null — caller should display the template script instead.
 */
export async function enrichPlan(req: AiEnrichRequest): Promise<string | null> {
  const token = await getToken();

  try {
    const res = await fetch(`${API_URL}/ai/enrich-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      console.warn(`[AI] Server returned ${res.status}`);
      return null;
    }

    const { voiceScript } = (await res.json()) as AiEnrichResponse;

    // Persist the script so it's available offline
    await execute(
      `UPDATE plans SET voice_script = ?, ai_enriched = 1 WHERE id = ?`,
      [voiceScript, req.planId],
    );

    return voiceScript;
  } catch (err) {
    console.warn('[AI] Enrichment failed (offline or error):', err);
    return null;
  }
}
