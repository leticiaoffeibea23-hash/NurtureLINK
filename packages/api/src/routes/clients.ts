import { Router, IRouter } from 'express';
import { RegisterClientSchema } from '@nurturelink/shared';
import { authenticate } from '../middleware/authenticate';
import { ClientService } from '../services/client.service';

const svc = new ClientService();
export const clientsRouter: IRouter = Router();

// POST /clients/register — upsert household + client (mobile registration flow)
clientsRouter.post('/register', authenticate, async (req, res, next) => {
  try {
    const body = RegisterClientSchema.parse(req.body);
    const result = await svc.register(body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /clients — list all clients for the authenticated user's facility
clientsRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    if (!facilityId) {
      res.json({ clients: [], cursor: null, hasMore: false });
      return;
    }
    const result = await svc.listByFacility(facilityId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /clients/:id — get a single client by UUID
clientsRouter.get('/:id', authenticate, async (req, res, next) => {
  try {
    const client = await svc.findById(String(req.params.id));
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    res.json(client);
  } catch (err) {
    next(err);
  }
});
