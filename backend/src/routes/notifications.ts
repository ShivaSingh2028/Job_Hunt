import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { sendSuccess } from '../utils/response.js';

export const notificationsRouter = Router();

// GET /api/v1/notifications
notificationsRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const unreadOnly = req.query.unreadOnly === 'true';

  const where: any = { userId: req.user!.id };
  if (unreadOnly) {
    where.isRead = false;
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({
      where: { userId: req.user!.id, isRead: false },
    }),
  ]);

  const formatted = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    isRead: n.isRead,
    relatedJobId: n.relatedJobId,
    createdAt: n.createdAt.toISOString(),
  }));

  return sendSuccess(res, {
    notifications: formatted,
    unreadCount,
  });
});

// PATCH /api/v1/notifications/:id/read
notificationsRouter.patch('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await prisma.notification.updateMany({
    where: { id, userId: req.user!.id },
    data: { isRead: true },
  });

  return sendSuccess(res, { message: 'Marked as read' });
});

// POST /api/v1/notifications/read-all
notificationsRouter.post('/read-all', authenticateToken, async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true },
  });

  return sendSuccess(res, { message: 'All notifications marked as read' });
});
