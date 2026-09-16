import { Router, IRouter } from 'express';
import { CreateReferralSchema, UpdateReferralStatusSchema } from '@nurturelink/shared';
import { authenticate } from '../middleware/authenticate';
import { ReferralService } from '../services/referral.service';

const svc = new ReferralService();
export const referralsRouter: IRouter = Router();

// POST /referrals — issue a new referral
referralsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const body = CreateReferralSchema.parse(req.body);
    const referral = await svc.create(body);
    res.status(201).json(referral);
  } catch (err) {
    next(err);
  }
});

// GET /referrals — list referrals for the authenticated user's facility
referralsRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    if (!facilityId) {
      res.json({ referrals: [], cursor: null, hasMore: false });
      return;
    }
    const result = await svc.listByFacility(facilityId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PATCH /referrals/:id/status — update referral status (in_transit, arrived, etc.)
referralsRouter.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const body = UpdateReferralStatusSchema.parse(req.body);
    const referral = await svc.updateStatus(String(req.params.id), body);
    res.json(referral);
  } catch (err) {
    next(err);
  }
});

// GET /referrals/:id — single referral
referralsRouter.get('/:id', authenticate, async (req, res, next) => {
  try {
    const referral = await svc.findById(String(req.params.id));
    if (!referral) {
      res.status(404).json({ error: 'Referral not found' });
      return;
    }
    res.json(referral);
  } catch (err) {
    next(err);
  }
});
