import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.js';
import { prisma } from '../prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'jobhunt_super_secure_jwt_secret_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'jobhunt_super_secure_refresh_secret_key_2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
  type?: 'access' | 'refresh';
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role?: string;
    activeMode?: string;
    isVerified?: boolean;
    isBlocked?: boolean;
    blockedUntil?: Date | null;
  };
}

export function generateTokens(userId: string, email: string, role = 'USER') {
  const accessToken = jwt.sign(
    { userId, email, role, type: 'access' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { userId, email, role, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 'UNAUTHORIZED', 'Access token required.', 401);
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;

    if (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN') {
      const admin = await prisma.adminUser.findUnique({
        where: { id: payload.userId },
      });
      if (!admin) {
        return sendError(res, 'UNAUTHORIZED', 'Admin account not found.', 401);
      }
      req.user = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      };
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found.', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'USER',
      activeMode: user.activeMode,
      isVerified: user.isVerified,
      isBlocked: user.isBlocked,
      blockedUntil: user.blockedUntil,
    };

    next();
  } catch (err: any) {
    return sendError(res, 'UNAUTHORIZED', 'Invalid or expired token.', 401);
  }
}

export async function optionalAuthenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'USER',
        activeMode: user.activeMode,
        isBlocked: user.isBlocked,
        blockedUntil: user.blockedUntil,
      };
    }
  } catch {}

  next();
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
    return sendError(res, 'FORBIDDEN', 'Administrator access required.', 403);
  }
  next();
}
