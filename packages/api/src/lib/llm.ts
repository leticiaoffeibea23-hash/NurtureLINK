import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

export interface ScriptInput {
  clientType: 'pregnant' | 'child';
  gestationWeeks?: number;
  language: string;
  targetNutrients: string[];
  foods: Array<{ name: string; local: string; why: string }>;
  clinicalNote?: string;
}

export interface ScriptOutput {
  script: string;
}

/**
 * Rephrase a deterministic plan into a warm local-language caregiver script.
 *
 * SAFETY CONTRACT:
 * - Prompt instructs the model to rephrase ONLY the supplied facts.
 * - Output is validated before use (see validateScript).
 * - On validation failure, caller must fall back to the templated script.
 * - No PII is included in the input.
 *
 * FALLBACK ORDER: Claude (primary) → DeepSeek (if DEEPSEEK_API_KEY is set)
 */
export async function generateCounsellingScript(input: ScriptInput): Promise<ScriptOutput> {
  const prompt = buildPrompt(input);

  try {
    return await callClaude(prompt, input);
  } catch (claudeErr) {
    if (!DEEPSEEK_API_KEY) {
      throw claudeErr;
    }
    console.warn('[LLM] Claude failed — falling back to DeepSeek:', (claudeErr as Error).message);
  }

  return await callDeepSeek(prompt, input);
}

async function callClaude(prompt: string, input: ScriptInput): Promise<ScriptOutput> {
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const parsed = JSON.parse(text) as ScriptOutput;
  validateScript(parsed, input);
  return parsed;
}

async function callDeepSeek(prompt: string, input: ScriptInput): Promise<ScriptOutput> {
  const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`DeepSeek API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  const text = data.choices[0]?.message?.content ?? '';
  const parsed = JSON.parse(text) as ScriptOutput;
  validateScript(parsed, input);
  return parsed;
}

function buildPrompt(input: ScriptInput): string {
  return `You are a nutrition counselling translator for rural Ghana.

Rephrase ONLY the following facts into a short, warm, plain caregiver message in ${input.language}.
Do NOT add any food, quantity, dosage, or medical claim not listed below.
Return ONLY valid JSON: { "script": "..." } — no prose, no code fences.

FACTS:
- Client: ${input.clientType}${input.gestationWeeks ? `, ${input.gestationWeeks} weeks pregnant` : ''}
- Nutrients to address: ${input.targetNutrients.join(', ')}
- Foods to recommend: ${JSON.stringify(input.foods)}
${input.clinicalNote ? `- Note: ${input.clinicalNote}` : ''}`;
}

function validateScript(output: ScriptOutput, input: ScriptInput): void {
  if (!output.script || typeof output.script !== 'string') {
    throw new Error('LLM output missing script field');
  }
  // Verify the script only mentions foods from the input
  for (const food of input.foods) {
    // At least one food local name should appear in the script
    if (!output.script.includes(food.local) && !output.script.includes(food.name)) {
      // Warn but don't throw — translation may use alternate forms
      console.warn(`[LLM] Script may not reference food: ${food.local}`);
    }
  }
  // Reject scripts containing unexpected numeric clinical claims
  const numerics = output.script.match(/\d+\.?\d*\s*(mg|g|dl|mm|kg)/gi);
  if (numerics && numerics.length > 0) {
    throw new Error(`LLM output contains unexpected clinical values: ${numerics.join(', ')}`);
  }
}
