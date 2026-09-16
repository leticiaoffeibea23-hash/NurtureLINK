import { Router, IRouter } from 'express';
import { AiEnrichRequestSchema } from '@nurturelink/shared';
import { authenticate } from '../middleware/authenticate';
import { AiService } from '../services/ai.service';

const svc = new AiService();
export const aiRouter: IRouter = Router();

/**
 * POST /ai/enrich-plan
 *
 * Accepts plan facts (no PII), proxies to Claude Haiku, validates output,
 * caches by request hash, and returns a counselling voice script.
 * Falls back to a templated script on LLM unavailability or validation failure.
 */
aiRouter.post('/enrich-plan', authenticate, async (req, res, next) => {
  try {
    const body = AiEnrichRequestSchema.parse(req.body);
    const result = await svc.enrichPlan(body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
