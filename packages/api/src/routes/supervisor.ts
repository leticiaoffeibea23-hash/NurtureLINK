/**
 * Supervisor routes — district-level aggregates for users with role 'supervisor'.
 * All endpoints require authentication + supervisor role.
 */
import { Router, IRouter } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const prisma = new PrismaClient();
export const supervisorRouter: IRouter = Router();

/** Format a Date as a human-readable relative sync label. */
function formatRelativeSync(date: Date | null): string {
  if (!date) return 'Never';
  const diff = Date.now() - date.getTime();
  const totalMinutes = Math.floor(diff / 60000);
  if (totalMinutes < 60) {
    return totalMinutes <= 1 ? 'Just now' : `${totalMinutes} min ago`;
  }
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) {
    const h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'pm' : 'am';
    return `${h % 12 || 12}:${m} ${ampm}`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

/**
 * GET /supervisor/chos
 * Returns the list of CHOs whose facility is in the same district as the
 * supervisor's facility, with per-CHO caseload and visit stats.
 */
supervisorRouter.get(
  '/chos',
  authenticate,
  authorize('supervisor'),
  async (req, res, next) => {
    try {
      const supervisor = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { facility: true },
      });

      if (!supervisor?.facility) {
        res.json({ chos: [] });
        return;
      }

      const district = supervisor.facility.district;

      const chos = await prisma.user.findMany({
        where: {
          role: 'CHO',
          active: true,
          facility: { district },
        },
        include: {
          facility: { select: { id: true, name: true } },
        },
        orderBy: { firstName: 'asc' },
      });

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const choStats = await Promise.all(
        chos.map(async (cho) => {
          if (!cho.facilityId) {
            return {
              id: cho.id,
              name: `${cho.firstName} ${cho.lastName}`,
              zone: cho.facility?.name ?? 'Unknown',
              clients: 0,
              visited: 0,
              pending: 0,
              lastSync: 'Never',
              synced: false,
            };
          }

          const [totalClients, visitedGroups, lastVisit] = await Promise.all([
            // Count active clients enrolled at this CHO's facility
            prisma.client.count({
              where: {
                household: { facilityId: cho.facilityId },
                deletedAt: null,
                active: true,
              },
            }),
            // Distinct clients visited this month by this CHO
            prisma.visit.groupBy({
              by: ['clientId'],
              where: {
                userId: cho.id,
                visitedAt: { gte: monthStart },
                deletedAt: null,
              },
            }),
            // Most recent visit for last-sync indicator
            prisma.visit.findFirst({
              where: { userId: cho.id, deletedAt: null },
              orderBy: { updatedAt: 'desc' },
              select: { updatedAt: true, syncedAt: true },
            }),
          ]);

          const lastSyncDate = lastVisit?.syncedAt ?? lastVisit?.updatedAt ?? null;
          // Consider "synced" if last activity within 48 hours
          const synced = lastSyncDate
            ? Date.now() - lastSyncDate.getTime() < 48 * 3600000
            : false;

          const visited = visitedGroups.length;
          const pending = Math.max(0, totalClients - visited);

          return {
            id: cho.id,
            name: `${cho.firstName} ${cho.lastName}`,
            zone: cho.facility?.name ?? 'Unknown',
            clients: totalClients,
            visited,
            pending,
            lastSync: formatRelativeSync(lastSyncDate),
            synced,
          };
        }),
      );

      res.json({ chos: choStats });
    } catch (err) {
      next(err);
    }
  },
);
