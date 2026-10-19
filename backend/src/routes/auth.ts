import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { generateTokens, verifyRefreshToken } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const authRouter = Router();

// Helper to format user response
export async function formatUserResponse(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      savedJobs: { select: { jobId: true } },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    activeMode: user.activeMode,
    cancellationCount: user.cancellationCount,
    isBlocked: user.isBlocked,
    blockedUntil: user.blockedUntil ? user.blockedUntil.toISOString() : null,
    savedJobIds: user.savedJobs.map((s) => s.jobId),
    location:
      user.locationLat !== null && user.locationLng !== null
        ? {
            lat: user.locationLat,
            lng: user.locationLng,
            label: user.locationLabel || '',
          }
        : null,
    createdAt: user.createdAt.toISOString(),
  };
}

// POST /api/v1/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return sendError(res, 'VALIDATION_ERROR', 'Name, email, and password are required.', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return sendError(res, 'CONFLICT', 'Email already registered.', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone ? phone.trim() : null,
      activeMode: 'SEEKER',
    },
  });

  const tokens = generateTokens(newUser.id, newUser.email, 'USER');
  const userFormatted = await formatUserResponse(newUser.id);

  return sendSuccess(
    res,
    {
      user: userFormatted,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
    201
  );
});

// POST /api/v1/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 'VALIDATION_ERROR', 'Email and password are required.', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return sendError(res, 'NOT_FOUND', 'No account with that email.', 404);
  }

  const isValidPw = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPw) {
    return sendError(res, 'UNAUTHORIZED', 'Incorrect password.', 401);
  }

  // Check auto-unblock if block expired
  if (user.isBlocked) {
    if (user.blockedUntil && new Date() > user.blockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isBlocked: false,
          blockedUntil: null,
          cancellationCount: 0,
        },
      });
    } else {
      return sendError(
        res,
        'USER_BLOCKED',
        'Your account is temporarily blocked due to 3 cancellations.',
        403
      );
    }
  }

  const tokens = generateTokens(user.id, user.email, 'USER');
  const userFormatted = await formatUserResponse(user.id);

  return sendSuccess(res, {
    user: userFormatted,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
});

// POST /api/v1/auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendError(res, 'VALIDATION_ERROR', 'Refresh token required.', 400);
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return sendError(res, 'UNAUTHORIZED', 'Invalid or expired refresh token.', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    return sendError(res, 'NOT_FOUND', 'User not found.', 404);
  }

  const newTokens = generateTokens(user.id, user.email, payload.role || 'USER');

  return sendSuccess(res, {
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken,
  });
});

// POST /api/v1/auth/logout
authRouter.post('/logout', async (req: Request, res: Response) => {
  return sendSuccess(res, { message: 'Logged out successfully' });
});

// POST /api/v1/auth/forgot-password
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  // Mock sending reset link
  return sendSuccess(res, {
    message: `Password reset instructions sent if ${email} is registered.`,
  });
});
