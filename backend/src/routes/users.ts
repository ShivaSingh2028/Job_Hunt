import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { formatUserResponse } from './auth.js';

export const usersRouter = Router();

// GET /api/v1/users/me
usersRouter.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userFormatted = await formatUserResponse(req.user!.id);
  if (!userFormatted) {
    return sendError(res, 'NOT_FOUND', 'User not found.', 404);
  }
  return sendSuccess(res, userFormatted);
});

// PATCH /api/v1/users/me
usersRouter.patch('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { name, phone, avatarUrl, location } = req.body;

  const updateData: any = {};
  if (name !== undefined) updateData.name = name.trim();
  if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
  if (location) {
    if (location.lat !== undefined) updateData.locationLat = location.lat;
    if (location.lng !== undefined) updateData.locationLng = location.lng;
    if (location.label !== undefined) updateData.locationLabel = location.label;
  }

  await prisma.user.update({
    where: { id: req.user!.id },
    data: updateData,
  });

  const userFormatted = await formatUserResponse(req.user!.id);
  return sendSuccess(res, userFormatted);
});

// PATCH /api/v1/users/me/location
usersRouter.patch('/me/location', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { lat, lng, label } = req.body;

  if (lat === undefined || lng === undefined) {
    return sendError(res, 'VALIDATION_ERROR', 'lat and lng are required.', 400);
  }

  await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      locationLat: lat,
      locationLng: lng,
      locationLabel: label || 'Current Location',
    },
  });

  return sendSuccess(res, { message: 'Location updated successfully' });
});

// POST /api/v1/users/me/switch-mode
usersRouter.post('/me/switch-mode', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { mode } = req.body;

  if (mode !== 'SEEKER' && mode !== 'RECRUITER') {
    return sendError(res, 'VALIDATION_ERROR', 'Mode must be SEEKER or RECRUITER', 400);
  }

  // Check locks
  if (mode === 'SEEKER') {
    // If switching from RECRUITER to SEEKER, check if user has active posted jobs
    const activePosts = await prisma.job.findMany({
      where: {
        posterId: req.user!.id,
        status: { in: ['OPEN', 'FILLED'] },
      },
    });

    if (activePosts.length > 0) {
      return sendError(
        res,
        'MODE_LOCK_RECRUITER',
        'Complete or cancel all active job postings first.',
        409,
        activePosts.map((p) => ({
          id: p.id,
          title: p.title,
          status: p.status,
        }))
      );
    }
  } else {
    // If switching from SEEKER to RECRUITER, check if user has active accepted jobs
    const activeApps = await prisma.application.findMany({
      where: {
        seekerId: req.user!.id,
        status: { in: ['ACCEPTED', 'IN_PROGRESS'] },
      },
      include: { job: true },
    });

    if (activeApps.length > 0) {
      return sendError(
        res,
        'MODE_LOCK_SEEKER',
        'Complete or cancel all active accepted jobs first.',
        409,
        activeApps.map((a) => ({
          id: a.id,
          title: a.job.title,
          status: a.status,
        }))
      );
    }
  }

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { activeMode: mode },
  });

  return sendSuccess(res, { activeMode: mode });
});
