import { Router, IRouter } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { ReferenceService } from '../services/reference.service';

const referenceService = new ReferenceService();
export const referenceRouter: IRouter = Router();

// GET /reference/manifest — current bundle versions
referenceRouter.get('/manifest', authenticate, async (_req, res, next) => {
  try {
    const manifest = await referenceService.getManifest();
    res.json(manifest);
  } catch (err) {
    next(err);
  }
});

// GET /reference/:versionTag — download a bundle by version tag (gzipped JSON)
referenceRouter.get('/:versionTag', authenticate, async (req, res, next) => {
  try {
    const { versionTag } = z.object({ versionTag: z.string() }).parse(req.params);
    const bundle = await referenceService.getBundle(versionTag);
    res.set('Content-Type', 'application/json');
    res.set('Content-Encoding', 'gzip');
    res.send(bundle);
  } catch (err) {
    next(err);
  }
});
