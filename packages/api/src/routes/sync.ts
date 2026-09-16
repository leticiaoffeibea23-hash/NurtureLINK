import { Router, IRouter } from 'express';
import { z } from 'zod';
import { SyncPushSchema } from '@nurturelink/shared';
import { authenticate } from '../middleware/authenticate';
import { SyncService } from '../services/sync.service';

const syncService = new SyncService();
export const syncRouter: IRouter = Router();

// POST /sync/push  — batch mutations from device outbox
syncRouter.post('/push', authenticate, async (req, res, next) => {
  try {
    const body = SyncPushSchema.parse(req.body);
    const result = await syncService.push(body, req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /sync/pull?since=<cursor>&tables=clients,visits,...
syncRouter.get('/pull', authenticate, async (req, res, next) => {
  try {
    const query = z
      .object({
        since: z.string().datetime(),
        tables: z.string().transform((t) => t.split(',')),
      })
      .parse(req.query);
    const result = await syncService.pull(query.since, query.tables, req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
