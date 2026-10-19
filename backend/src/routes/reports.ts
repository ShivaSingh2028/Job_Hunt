import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const reportsRouter = Router();

// POST /api/v1/reports
reportsRouter.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { targetType, targetId, targetTitle, reason, description } = req.body;

  if (!targetType || !targetId || !reason || !description) {
    return sendError(res, 'VALIDATION_ERROR', 'All report fields are required.', 400);
  }

  const report = await prisma.report.create({
    data: {
      targetType,
      targetId,
      targetTitle: targetTitle || 'Target',
      reporterId: req.user!.id,
      reason,
      description,
      status: 'PENDING',
    },
  });

  return sendSuccess(res, { reportId: report.id }, 201);
});
