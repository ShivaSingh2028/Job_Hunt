import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { generateTokens, verifyRefreshToken } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { sendOtpEmail } from '../utils/mailer.js';

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
    isVerified: user.isVerified,
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

  // Check email verification status
  if (!user.isVerified) {
    return sendError(
      res,
      'EMAIL_NOT_VERIFIED',
      'Please verify your email address before logging in.',
      403,
      { email: normalizedEmail }
    );
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

// In-memory OTP rate limiter and attempts tracker
interface OtpState {
  attempts: number;
  lastSentAt: number;
  lockedUntil?: number;
}
const otpStateMap = new Map<string, OtpState>();

// POST /api/v1/auth/signup
authRouter.post('/signup', async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return sendError(res, 'VALIDATION_ERROR', 'Name, email, and password are required.', 400);
  }

  const normalized = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalized },
  });

  if (existing) {
    return sendError(res, 'EMAIL_ALREADY_REGISTERED', 'This email is already registered.', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalized,
      passwordHash,
      phone: phone ? phone.trim() : null,
      activeMode: 'SEEKER',
      isVerified: false,
      verificationOtp: otp,
      verificationOtpExpiresAt: expiresAt,
    },
  });

  otpStateMap.set(normalized, {
    attempts: 0,
    lastSentAt: Date.now(),
  });

  // Dispatch real email via nodemailer SMTP
  await sendOtpEmail(normalized, otp);

  return sendSuccess(
    res,
    {
      email: normalized,
      verificationRequired: true,
      resendAvailableInSeconds: 30,
    },
    201
  );
});

// POST /api/v1/auth/verify-email
authRouter.post('/verify-email', async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return sendError(res, 'VALIDATION_ERROR', 'Email and 6-digit code are required.', 400);
  }

  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
  });

  if (!user) {
    return sendError(res, 'NOT_FOUND', 'User not found.', 404);
  }

  const state = otpStateMap.get(normalized) || { attempts: 0, lastSentAt: 0 };
  const now = Date.now();

  // Check if locked due to too many failed attempts
  if (state.lockedUntil && now < state.lockedUntil) {
    const retryAfterSeconds = Math.ceil((state.lockedUntil - now) / 1000);
    return sendError(res, 'TOO_MANY_ATTEMPTS', 'Too many failed attempts. Please try again later.', 429, { retryAfterSeconds });
  }

  // Check code expiration (10 minutes)
  if (!user.verificationOtpExpiresAt || now > user.verificationOtpExpiresAt.getTime()) {
    return sendError(res, 'CODE_EXPIRED', 'Verification code has expired. Please request a new one.', 410);
  }

  // Check code match
  if (user.verificationOtp !== code.trim()) {
    state.attempts += 1;
    const attemptsLeft = Math.max(0, 5 - state.attempts);
    if (attemptsLeft === 0) {
      state.lockedUntil = now + 5 * 60 * 1000; // lock for 5 minutes
      otpStateMap.set(normalized, state);
      return sendError(res, 'TOO_MANY_ATTEMPTS', 'Too many failed attempts. Please request a new code.', 429, { retryAfterSeconds: 300 });
    }
    otpStateMap.set(normalized, state);
    return sendError(res, 'INVALID_CODE', `Invalid verification code. ${attemptsLeft} attempt(s) remaining.`, 400, { attemptsLeft });
  }

  // Code verified!
  otpStateMap.delete(normalized);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationOtp: null,
      verificationOtpExpiresAt: null,
    },
  });

  const tokens = generateTokens(updated.id, updated.email, 'USER');
  const userFormatted = await formatUserResponse(updated.id);

  return sendSuccess(res, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: userFormatted,
  }, 200);
});

// POST /api/v1/auth/resend-verification
authRouter.post('/resend-verification', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, 'VALIDATION_ERROR', 'Email is required.', 400);
  }

  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
  });

  if (!user) {
    return sendError(res, 'NOT_FOUND', 'No account found with this email.', 404);
  }

  if (user.isVerified) {
    return sendSuccess(res, { resendAvailableInSeconds: 0 });
  }

  const state = otpStateMap.get(normalized) || { attempts: 0, lastSentAt: 0 };
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - state.lastSentAt) / 1000);

  if (state.lastSentAt > 0 && elapsedSeconds < 30) {
    const retryAfterSeconds = 30 - elapsedSeconds;
    return sendError(res, 'RESEND_TOO_SOON', `Please wait ${retryAfterSeconds}s before requesting a new code.`, 429, { retryAfterSeconds });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(now + 10 * 60 * 1000); // 10 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationOtp: otp,
      verificationOtpExpiresAt: expiresAt,
    },
  });

  otpStateMap.set(normalized, {
    attempts: 0,
    lastSentAt: now,
    lockedUntil: undefined,
  });

  await sendOtpEmail(normalized, otp);

  return sendSuccess(res, {
    resendAvailableInSeconds: 30,
  }, 200);
});

// POST /api/v1/auth/send-verification-otp
authRouter.post('/send-verification-otp', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, 'VALIDATION_ERROR', 'Email is required', 400);
  }

  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
  });

  if (!user) {
    return sendError(res, 'NOT_FOUND', 'No account found with this email', 404);
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationOtp: otp,
      verificationOtpExpiresAt: expiresAt,
    },
  });

  // Dispatch real email via nodemailer SMTP
  const mailResult = await sendOtpEmail(normalized, otp);

  return sendSuccess(res, {
    message: mailResult.sent
      ? `Verification code sent to ${normalized}. Please check your inbox.`
      : `Verification code generated for ${normalized}.`,
    email: normalized,
    expiresAt: expiresAt.toISOString(),
    delivered: mailResult.sent,
  });
});

// POST /api/v1/auth/verify-email-otp
authRouter.post('/verify-email-otp', async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return sendError(res, 'VALIDATION_ERROR', 'Email and 6-digit OTP code are required', 400);
  }

  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
  });

  if (!user) {
    return sendError(res, 'NOT_FOUND', 'User not found', 404);
  }

  const isMatch = user.verificationOtp === otp.trim();
  const isNotExpired = user.verificationOtpExpiresAt && new Date() <= user.verificationOtpExpiresAt;

  if (!isMatch || !isNotExpired) {
    return sendError(res, 'INVALID_OTP', 'Invalid or expired verification code. Please request a new one.', 400);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationOtp: null,
      verificationOtpExpiresAt: null,
    },
  });

  const formatted = await formatUserResponse(updated.id);

  return sendSuccess(res, {
    message: 'Email successfully verified! You can now accept and post gigs.',
    user: formatted,
  });
});
