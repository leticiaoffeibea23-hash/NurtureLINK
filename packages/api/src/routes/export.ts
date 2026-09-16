import { Router, IRouter } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { ExportService } from '../services/export.service';

const exportService = new ExportService();
export const exportRouter: IRouter = Router();

// POST /export/dhims2 — generate DHIMS2-compatible tally export
exportRouter.post(
  '/dhims2',
  authenticate,
  authorize('system_admin', 'district_admin', 'supervisor'),
  async (req, res, next) => {
    try {
      const body = z
        .object({
          facilityId: z.string().uuid(),
          periodStart: z.string().date(),
          periodEnd: z.string().date(),
        })
        .parse(req.body);
      const csv = await exportService.generateDhims2Tally(body);
      res.set('Content-Type', 'text/csv');
      res.set(
        'Content-Disposition',
        `attachment; filename="dhims2-tally-${body.periodStart}-${body.periodEnd}.csv"`,
      );
      res.send(csv);
    } catch (err) {
      next(err);
    }
  },
);
