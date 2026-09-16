import { Router, IRouter } from 'express';
import { CreatePlanSchema } from '@nurturelink/shared';
import { authenticate } from '../middleware/authenticate';
import { PlanService } from '../services/plan.service';

const svc = new PlanService();
export const plansRouter: IRouter = Router();

// POST /plans — create a plan; returns 422 if a severe flag blocks it
plansRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const body = CreatePlanSchema.parse(req.body);
    const result = await svc.create(body);
    if (result.blocked) {
      res.status(422).json(result.body);
      return;
    }
    res.status(201).json(result.plan);
  } catch (err) {
    next(err);
  }
});

// GET /plans/client/:clientId — all plans for a client
plansRouter.get('/client/:clientId', authenticate, async (req, res, next) => {
  try {
    const plans = await svc.listByClient(String(req.params.clientId));
    res.json({ plans });
  } catch (err) {
    next(err);
  }
});

// GET /plans/:id — single plan
plansRouter.get('/:id', authenticate, async (req, res, next) => {
  try {
    const plan = await svc.findById(String(req.params.id));
    if (!plan) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }
    res.json(plan);
  } catch (err) {
    next(err);
  }
});
