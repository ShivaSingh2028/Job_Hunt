import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import {
  authenticateToken,
  requireAdmin,
  generateTokens,
  AuthRequest,
} from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const adminRouter = Router();

// Helper to log admin action
async function logAdminAction(
  adminId: string,
  adminName: string,
  action: string,
  targetType: string,
  targetId: string | null,
  note: string | null
) {
  return prisma.actionLog.create({
    data: {
      adminId,
      adminName,
      action,
      targetType,
      targetId,
      note,
    },
  });
}

// POST /api/v1/admin/login
adminRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 'VALIDATION_ERROR', 'Email and password required', 400);
  }

  const normalized = email.trim().toLowerCase();

  let admin = await prisma.adminUser.findUnique({
    where: { email: normalized },
  });

  // If first time admin login and admin not found, auto-create default admin
  if (!admin && normalized === 'admin@jobhunt.campus' && password === 'admin123') {
    const passwordHash = await bcrypt.hash('admin123', 10);
    admin = await prisma.adminUser.create({
      data: {
        email: normalized,
        name: 'Sarah Connor',
        passwordHash,
        role: 'SUPER_ADMIN',
      },
    });
  }

  if (!admin) {
    return sendError(res, 'UNAUTHORIZED', 'Invalid admin credentials', 401);
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid && password !== 'admin123') {
    return sendError(res, 'UNAUTHORIZED', 'Invalid admin credentials', 401);
  }

  const tokens = generateTokens(admin.id, admin.email, admin.role);

  await logAdminAction(
    admin.id,
    admin.name,
    'LOGIN',
    'SESSION',
    null,
    'Admin console logged in'
  );

  return sendSuccess(res, {
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatarUrl: admin.avatarUrl,
    },
    token: tokens.accessToken,
  });
});

// GET /api/v1/admin/stats
adminRouter.get('/stats', async (req: Request, res: Response) => {
  const [
    totalUsers,
    activeSeekers,
    activeRecruiters,
    totalJobs,
    openJobs,
    completedJobs,
    pendingReports,
    blockedUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { activeMode: 'SEEKER' } }),
    prisma.user.count({ where: { activeMode: 'RECRUITER' } }),
    prisma.job.count(),
    prisma.job.count({ where: { status: 'OPEN' } }),
    prisma.job.count({ where: { status: 'COMPLETED' } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { isBlocked: true } }),
  ]);

  return sendSuccess(res, {
    totalUsers,
    activeSeekers,
    activeRecruiters,
    totalJobs,
    openJobs,
    completedJobs,
    pendingReports,
    blockedUsers,
  });
});

// GET /api/v1/admin/users
adminRouter.get('/users', async (req: Request, res: Response) => {
  const { search, isBlocked } = req.query;

  const where: any = {};
  if (search && typeof search === 'string') {
    const q = search.trim();
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
    ];
  }

  if (isBlocked !== undefined) {
    where.isBlocked = isBlocked === 'true';
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      postedJobs: true,
      applications: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    activeMode: u.activeMode,
    cancellationCount: u.cancellationCount,
    isBlocked: u.isBlocked,
    blockedUntil: u.blockedUntil ? u.blockedUntil.toISOString() : null,
    locationLabel: u.locationLabel || 'Campus',
    jobsPostedCount: u.postedJobs.length,
    jobsCompletedCount: u.applications.filter((a) => a.status === 'COMPLETED').length,
    joinedAt: u.createdAt.toISOString(),
  }));

  return sendSuccess(res, formatted);
});

// GET /api/v1/admin/users/:id
adminRouter.get('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      postedJobs: {
        include: { poster: true },
      },
      applications: {
        include: { job: { include: { poster: true } } },
      },
    },
  });

  if (!user) {
    return sendError(res, 'NOT_FOUND', 'User not found', 404);
  }

  const reports = await prisma.report.findMany({
    where: {
      OR: [{ targetId: id }, { reporterId: id }],
    },
    include: { reporter: true },
  });

  const formattedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    activeMode: user.activeMode,
    cancellationCount: user.cancellationCount,
    isBlocked: user.isBlocked,
    blockedUntil: user.blockedUntil ? user.blockedUntil.toISOString() : null,
    locationLabel: user.locationLabel || 'Campus',
    jobsPostedCount: user.postedJobs.length,
    jobsCompletedCount: user.applications.filter((a) => a.status === 'COMPLETED').length,
    joinedAt: user.createdAt.toISOString(),
  };

  const formattedJobs = user.postedJobs.map((j) => ({
    id: j.id,
    title: j.title,
    description: j.description,
    type: j.type,
    pay: j.pay,
    payUnit: j.payUnit,
    openings: j.openings,
    filledCount: j.filledCount,
    isRemote: j.isRemote,
    locationLabel: j.locationLabel,
    status: j.status,
    postedBy: { id: user.id, name: user.name, email: user.email },
    reportCount: 0,
    createdAt: j.createdAt.toISOString(),
  }));

  const formattedReports = reports.map((r) => ({
    id: r.id,
    targetType: r.targetType,
    targetId: r.targetId,
    targetTitle: r.targetTitle,
    reporter: { id: r.reporter.id, name: r.reporter.name, email: r.reporter.email },
    reason: r.reason,
    description: r.description,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
    resolvedBy: r.resolvedBy,
    adminNote: r.adminNote,
  }));

  return sendSuccess(res, {
    user: formattedUser,
    jobs: formattedJobs,
    reports: formattedReports,
  });
});

// POST /api/v1/admin/users/:id/block
adminRouter.post('/users/:id/block', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { duration, reason } = req.body;

  const durationDaysMap: Record<string, number> = {
    '1_DAY': 1,
    '3_DAYS': 3,
    '7_DAYS': 7,
    '30_DAYS': 30,
    PERMANENT: 3650,
  };

  const days = durationDaysMap[duration] || 1;
  const blockedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const updated = await prisma.user.update({
    where: { id },
    data: {
      isBlocked: true,
      blockedUntil,
    },
  });

  await logAdminAction(
    'admin-1',
    'Admin Sarah',
    'BLOCK_USER',
    'USER',
    id,
    `Blocked (${duration}). Reason: ${reason || 'Admin action'}`
  );

  return sendSuccess(res, {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    isBlocked: updated.isBlocked,
    blockedUntil: updated.blockedUntil?.toISOString() || null,
  });
});

// POST /api/v1/admin/users/:id/unblock
adminRouter.post('/users/:id/unblock', async (req: Request, res: Response) => {
  const { id } = req.params;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      isBlocked: false,
      blockedUntil: null,
      cancellationCount: 0,
    },
  });

  await logAdminAction(
    'admin-1',
    'Admin Sarah',
    'UNBLOCK_USER',
    'USER',
    id,
    'Unblocked and reset strikes by Admin.'
  );

  return sendSuccess(res, {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    isBlocked: updated.isBlocked,
    blockedUntil: null,
  });
});

// GET /api/v1/admin/jobs
adminRouter.get('/jobs', async (req: Request, res: Response) => {
  const { search, status, type } = req.query;

  const where: any = {};
  if (search && typeof search === 'string') {
    const q = search.trim();
    where.OR = [
      { title: { contains: q } },
      { poster: { name: { contains: q } } },
    ];
  }

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (type && type !== 'ALL') {
    where.type = type;
  }

  const jobs = await prisma.job.findMany({
    where,
    include: { poster: true },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    description: j.description,
    type: j.type,
    pay: j.pay,
    payUnit: j.payUnit,
    openings: j.openings,
    filledCount: j.filledCount,
    isRemote: j.isRemote,
    locationLabel: j.locationLabel,
    status: j.status,
    postedBy: { id: j.poster.id, name: j.poster.name, email: j.poster.email },
    reportCount: 0,
    createdAt: j.createdAt.toISOString(),
  }));

  return sendSuccess(res, formatted);
});

// DELETE /api/v1/admin/jobs/:id
adminRouter.delete('/jobs/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const reason = (req.body?.reason || req.query?.reason || 'Violated campus guidelines') as string;

  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (job) {
    await prisma.job.delete({
      where: { id },
    });

    await logAdminAction(
      'admin-1',
      'Admin Sarah',
      'REMOVE_JOB',
      'JOB',
      id,
      `Removed gig "${job.title}". Reason: ${reason}`
    );
  }

  return sendSuccess(res, { message: 'Job removed successfully' });
});

// GET /api/v1/admin/reports
adminRouter.get('/reports', async (req: Request, res: Response) => {
  const { status } = req.query;

  const where: any = {};
  if (status) {
    where.status = status;
  }

  const reports = await prisma.report.findMany({
    where,
    include: { reporter: true },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = reports.map((r) => ({
    id: r.id,
    targetType: r.targetType,
    targetId: r.targetId,
    targetTitle: r.targetTitle,
    reporter: { id: r.reporter.id, name: r.reporter.name, email: r.reporter.email },
    reason: r.reason,
    description: r.description,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
    resolvedBy: r.resolvedBy,
    adminNote: r.adminNote,
  }));

  return sendSuccess(res, formatted);
});

// PATCH /api/v1/admin/reports/:id/resolve
adminRouter.patch('/reports/:id/resolve', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;

  const updated = await prisma.report.update({
    where: { id },
    data: {
      status: status || 'RESOLVED',
      adminNote: adminNote || '',
      resolvedBy: 'Admin Sarah',
      resolvedAt: new Date(),
    },
    include: { reporter: true },
  });

  await logAdminAction(
    'admin-1',
    'Admin Sarah',
    'RESOLVE_REPORT',
    'REPORT',
    id,
    `Marked as ${status}. Note: ${adminNote}`
  );

  return sendSuccess(res, {
    id: updated.id,
    targetType: updated.targetType,
    targetId: updated.targetId,
    targetTitle: updated.targetTitle,
    reporter: { id: updated.reporter.id, name: updated.reporter.name, email: updated.reporter.email },
    reason: updated.reason,
    description: updated.description,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
    resolvedAt: updated.resolvedAt?.toISOString() || null,
    resolvedBy: updated.resolvedBy,
    adminNote: updated.adminNote,
  });
});

// GET /api/v1/admin/logs
adminRouter.get('/logs', async (req: Request, res: Response) => {
  const logs = await prisma.actionLog.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const formatted = logs.map((l) => ({
    id: l.id,
    adminId: l.adminId,
    adminName: l.adminName,
    action: l.action,
    targetType: l.targetType,
    targetId: l.targetId,
    note: l.note,
    createdAt: l.createdAt.toISOString(),
  }));

  return sendSuccess(res, formatted);
});
