import crypto from 'crypto';
import { AiEnrichRequest, AiEnrichResponse } from '@nurturelink/shared';
import { generateCounsellingScript, ScriptInput } from '../lib/llm';

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001';

// In-process cache: SHA-256(request JSON) → AiEnrichResponse
// In production replace with a DB table or Redis.
const cache = new Map<string, AiEnrichResponse>();

function hashRequest(req: AiEnrichRequest): string {
  return crypto.createHash('sha256').update(JSON.stringify(req)).digest('hex');
}

function buildFallback(req: AiEnrichRequest): string {
  const names = req.foods.map((f) => f.localName || f.name).join(', ');
  if (req.language === 'dag') {
    return `Dasiba. A bindiri zaa mali ${names}. Di simdi ti mali a tia ni a bihi nyɔŋa.`;
  }
  return `Good morning. Please eat these foods regularly: ${names}. They will help you stay strong and healthy.`;
}

export class AiService {
  async enrichPlan(req: AiEnrichRequest): Promise<AiEnrichResponse> {
    const inputHash = hashRequest(req);

    // Serve from cache if available
    const cached = cache.get(inputHash);
    if (cached) {
      return { ...cached, cached: true };
    }

    const scriptInput: ScriptInput = {
      clientType: req.clientProfile.startsWith('child') ? 'child' : 'pregnant',
      language: req.language === 'dag' ? 'Dagbani' : 'English',
      targetNutrients: req.targetNutrients,
      foods: req.foods.map((f) => ({ name: f.name, local: f.localName, why: f.why })),
    };

    let voiceScript: string;
    let validationPassed: boolean;
    let fallbackUsed: boolean;

    try {
      const result = await generateCounsellingScript(scriptInput);
      voiceScript = result.script;
      validationPassed = true;
      fallbackUsed = false;
    } catch (err) {
      // LLM call failed or output failed validation — use safe template
      console.warn('[AI] Falling back to template:', err instanceof Error ? err.message : err);
      voiceScript = buildFallback(req);
      validationPassed = false;
      fallbackUsed = true;
    }

    const outputHash = crypto.createHash('sha256').update(voiceScript).digest('hex');
    const validatedAt = new Date().toISOString();

    // Log call (non-PII)
    console.log('[AI]', JSON.stringify({
      planId: req.planId,
      inputHash,
      outputHash,
      model: MODEL,
      validationPassed,
      fallbackUsed,
    }));

    const response: AiEnrichResponse = {
      planId: req.planId,
      voiceScript,
      language: req.language,
      model: MODEL,
      cached: false,
      validatedAt,
    };

    // Cache validated results (not fallbacks, so retry gets a real LLM call)
    if (validationPassed) {
      cache.set(inputHash, response);
    }

    return response;
  }
}
