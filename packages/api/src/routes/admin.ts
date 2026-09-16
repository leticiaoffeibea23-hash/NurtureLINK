import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { AdminService } from '../services/admin.service';

const svc = new AdminService();
export const adminRouter: Router = Router();

// All admin routes require authentication and an admin-tier role.
adminRouter.use(
  authenticate,
  authorize('nutrition_officer', 'district_admin', 'system_admin'),
);

// ── Foods ──────────────────────────────────────────────────────────────────────

adminRouter.get('/foods', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await svc.listFoods());
  } catch (err) { next(err); }
});

adminRouter.put('/foods/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { affordabilityTier, active } = req.body as { affordabilityTier?: string; active?: boolean };
    res.json(await svc.patchFood(req.params.id as string, { affordabilityTier, active }));
  } catch (err) { next(err); }
});

// CSV is sent as plain text in the request body.
// Frontend reads the file via FileReader.readAsText() and posts { csv: "..." }.
adminRouter.post('/foods/import', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { csv } = req.body as { csv: string };
    if (!csv) { res.status(400).json({ error: 'Missing csv field' }); return; }
    res.json(await svc.importFoodsFromCsv(csv));
  } catch (err) { next(err); }
});

// ── Agro Zones ────────────────────────────────────────────────────────────────

adminRouter.get('/agro-zones', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await svc.listAgroZones());
  } catch (err) { next(err); }
});

// ── Seasonal Availability ─────────────────────────────────────────────────────

adminRouter.get('/seasonal/:agroZoneId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await svc.getSeasonalMatrix(req.params.agroZoneId as string));
  } catch (err) { next(err); }
});

adminRouter.put('/seasonal/:agroZoneId/:month/:foodId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agroZoneId = req.params.agroZoneId as string;
    const month      = req.params.month      as string;
    const foodId     = req.params.foodId     as string;
    const { availability } = req.body as { availability: 'abundant' | 'available' | 'scarce' };
    if (!['abundant', 'available', 'scarce'].includes(availability)) {
      res.status(400).json({ error: 'Invalid availability value' }); return;
    }
    res.json(await svc.updateSeasonalCell(agroZoneId, parseInt(month, 10), foodId, availability));
  } catch (err) { next(err); }
});

// ── Reference Bundle ──────────────────────────────────────────────────────────

adminRouter.post('/reference/publish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await svc.publishBundle(req.user.id));
  } catch (err) { next(err); }
});

// ── Clinical Thresholds ───────────────────────────────────────────────────────

adminRouter.get('/clinical-thresholds', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await svc.listThresholds());
  } catch (err) { next(err); }
});

adminRouter.get('/clinical-thresholds/proposals', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(svc.listProposals());
  } catch (err) { next(err); }
});

adminRouter.post('/clinical-thresholds/propose', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { thresholdId, id, proposedValue, newValue, justification } = req.body as {
      thresholdId?: string; id?: string;
      proposedValue?: number; newValue?: number;
      justification: string;
    };
    const result = await svc.proposeThresholdChange({
      thresholdId: (thresholdId ?? id)!,
      proposedValue: (proposedValue ?? newValue)!,
      justification,
      proposedBy: req.user.id,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
});

// ── Facilities ────────────────────────────────────────────────────────────────

adminRouter.get('/facilities', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await svc.listFacilities());
  } catch (err) { next(err); }
});

// ── Voice Packs ───────────────────────────────────────────────────────────────

adminRouter.get('/voice-packs', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await svc.listVoicePacks());
  } catch (err) { next(err); }
});

// Accepts { language, phraseKey, audioUrl } where audioUrl may be a data URI
// for hackathon scope (no S3 in this environment).
adminRouter.post('/voice-packs/phrase', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { language, phraseKey, audioUrl } = req.body as {
      language: string; phraseKey: string; audioUrl: string;
    };
    if (!language || !phraseKey || !audioUrl) {
      res.status(400).json({ error: 'language, phraseKey, and audioUrl are required' }); return;
    }
    res.status(201).json(await svc.addVoicePhrase({ language, phraseKey, audioUrl }));
  } catch (err) { next(err); }
});
