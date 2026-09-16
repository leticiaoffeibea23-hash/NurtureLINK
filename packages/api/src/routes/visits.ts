import { Router, IRouter } from 'express';
import { z } from 'zod';
import { CreateVisitSchema, CreateFlagSchema } from '@nurturelink/shared';
import { authenticate } from '../middleware/authenticate';
import { VisitService } from '../services/visit.service';

const svc = new VisitService();
export const visitsRouter: IRouter = Router();

// POST /visits — upsert a visit + its computed flag atomically
visitsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const body = z
      .object({ visit: CreateVisitSchema, flag: CreateFlagSchema })
      .parse(req.body);
    const result = await svc.create(body.visit, body.flag);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /visits/client/:clientId — full visit history for a client
visitsRouter.get('/client/:clientId', authenticate, async (req, res, next) => {
  try {
    const visits = await svc.listByClient(String(req.params.clientId));
    res.json({ visits });
  } catch (err) {
    next(err);
  }
});
