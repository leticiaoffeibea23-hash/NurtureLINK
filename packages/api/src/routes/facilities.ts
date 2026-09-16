import { Router, IRouter } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const facilitiesRouter: IRouter = Router();

// GET /facilities — public list used during CHO registration
facilitiesRouter.get('/', async (_req, res, next) => {
  try {
    const facilities = await prisma.facility.findMany({
      where: { active: true },
      select: { id: true, name: true, district: true, region: true },
      orderBy: [{ district: 'asc' }, { name: 'asc' }],
    });
    res.json({ facilities });
  } catch (err) {
    next(err);
  }
});
