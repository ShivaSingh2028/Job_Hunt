import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import {
  authenticateToken,
  optionalAuthenticate,
  AuthRequest,
} from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { calculateDistanceKm } from '../utils/distance.js';

export const jobsRouter = Router();

// Helper to format a job for response
export async function formatJob(
  job: any,
  currentUserId?: string,
  userLat?: number,
  userLng?: number
) {
  let isSaved = false;
  let canViewExactLocation = false;

  if (currentUserId) {
    if (job.posterId === currentUserId) {
      canViewExactLocation = true;
    } else {
      const app = await prisma.application.findFirst({
        where: {
          jobId: job.id,
          seekerId: currentUserId,
          status: { in: ['ACCEPTED', 'IN_PROGRESS'] },
        },
      });
      if (app) canViewExactLocation = true;
    }

    const saved = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: currentUserId,
          jobId: job.id,
        },
      },
    });
    isSaved = !!saved;
  }

  let approxDist: number | null = null;
  if (!job.isRemote && userLat !== undefined && userLng !== undefined) {
    approxDist = calculateDistanceKm(
      userLat,
      userLng,
      job.locationLat,
      job.locationLng
    );
  }

  return {
    id: job.id,
    type: job.type,
    title: job.title,
    description: job.description,
    pay: job.pay,
    payUnit: job.payUnit,
    openings: job.openings,
    filledCount: job.filledCount,
    isRemote: job.isRemote,
    approximateDistance: approxDist,
    location: {
      lat: job.locationLat,
      lng: job.locationLng,
      label: canViewExactLocation ? job.locationLabel : 'HIDDEN',
    },
    startDate: job.startDate,
    endDate: job.endDate,
    startTime: job.startTime,
    endTime: job.endTime,
    status: job.status,
    postedBy: {
      id: job.poster.id,
      name: job.poster.name,
      avatarUrl: job.poster.avatarUrl,
    },
    isSaved,
    createdAt: job.createdAt.toISOString(),
  };
}

// GET /api/v1/jobs/saved (Placed before /:id to avoid router conflict)
jobsRouter.get('/saved', authenticateToken, async (req: AuthRequest, res: Response) => {
  const savedJobs = await prisma.savedJob.findMany({
    where: { userId: req.user!.id },
    include: {
      job: {
        include: { poster: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = await Promise.all(
    savedJobs.map((s) => formatJob(s.job, req.user!.id))
  );

  return sendSuccess(res, formatted);
});

// GET /api/v1/jobs/my-applications
jobsRouter.get('/my-applications', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { status } = req.query;

  const whereClause: any = { seekerId: req.user!.id };
  if (status && typeof status === 'string') {
    whereClause.status = status;
  }

  const applications = await prisma.application.findMany({
    where: whereClause,
    include: {
      job: {
        include: { poster: true },
      },
    },
    orderBy: { acceptedAt: 'desc' },
  });

  const formatted = await Promise.all(
    applications.map(async (app) => {
      const formattedJob = await formatJob(app.job, req.user!.id);
      return {
        applicationId: app.id,
        status: app.status,
        job: formattedJob,
        acceptedAt: app.acceptedAt.toISOString(),
        cancelledAt: app.cancelledAt ? app.cancelledAt.toISOString() : null,
      };
    })
  );

  return sendSuccess(res, formatted);
});

// GET /api/v1/jobs/my-posts
jobsRouter.get('/my-posts', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { status } = req.query;

  const whereClause: any = { posterId: req.user!.id };
  if (status && typeof status === 'string') {
    whereClause.status = status;
  }

  const posts = await prisma.job.findMany({
    where: whereClause,
    include: {
      poster: true,
      applications: {
        where: { status: 'ACCEPTED' },
        include: { seeker: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = await Promise.all(
    posts.map(async (job) => {
      const base = await formatJob(job, req.user!.id);
      return {
        ...base,
        acceptedSeekers: job.applications.map((a) => ({
          applicationId: a.id,
          status: a.status,
          acceptedAt: a.acceptedAt.toISOString(),
          seeker: {
            id: a.seeker.id,
            name: a.seeker.name,
            email: a.seeker.email,
            avatarUrl: a.seeker.avatarUrl,
          },
        })),
      };
    })
  );

  return sendSuccess(res, formatted);
});

// GET /api/v1/jobs
jobsRouter.get('/', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : 28.6139;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : 77.2090;
  const radiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 5.0;
  const keyword = req.query.keyword as string | undefined;
  const type = req.query.type as string | undefined;
  const minPay = req.query.minPay ? parseFloat(req.query.minPay as string) : undefined;
  const maxPay = req.query.maxPay ? parseFloat(req.query.maxPay as string) : undefined;

  const where: any = {
    status: 'OPEN',
  };

  // Exclude current user's posted jobs
  if (req.user) {
    where.posterId = { not: req.user.id };
  }

  if (type) {
    where.type = type;
  }

  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { description: { contains: keyword } },
    ];
  }

  if (minPay !== undefined) {
    where.pay = { ...where.pay, gte: minPay };
  }

  if (maxPay !== undefined) {
    where.pay = { ...where.pay, lte: maxPay };
  }

  const jobs = await prisma.job.findMany({
    where,
    include: { poster: true },
    orderBy: { createdAt: 'desc' },
  });

  // Filter distance for on-site jobs
  const formattedJobs = [];
  for (const job of jobs) {
    const formatted = await formatJob(job, req.user?.id, lat, lng);
    if (!job.isRemote) {
      if (formatted.approximateDistance !== null && formatted.approximateDistance > radiusKm) {
        continue; // Outside 5km radius
      }
    }
    formattedJobs.push(formatted);
  }

  return sendSuccess(res, {
    jobs: formattedJobs,
    total: formattedJobs.length,
    totalPages: 1,
  });
});

// GET /api/v1/jobs/:id
jobsRouter.get('/:id', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: { poster: true },
  });

  if (!job) {
    return sendError(res, 'NOT_FOUND', 'Job not found.', 404);
  }

  const formatted = await formatJob(job, req.user?.id);
  return sendSuccess(res, formatted);
});

// POST /api/v1/jobs
jobsRouter.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = req.user!;

  if (user.isBlocked) {
    return sendError(res, 'USER_BLOCKED', 'Your account is currently blocked.', 403);
  }

  if (user.isVerified === false) {
    return sendError(
      res,
      'USER_NOT_VERIFIED',
      'Please verify your email address with the 6-digit OTP code before posting gigs.',
      403
    );
  }

  if (user.activeMode !== 'RECRUITER') {
    return sendError(res, 'FORBIDDEN', 'Switch to Recruiter mode first.', 403);
  }

  const {
    type,
    title,
    description,
    pay,
    payUnit,
    openings,
    isRemote,
    location,
    startDate,
    endDate,
    startTime,
    endTime,
  } = req.body;

  if (!title || !description || !type || pay === undefined || !payUnit || !startDate) {
    return sendError(res, 'VALIDATION_ERROR', 'Missing required job fields.', 400);
  }

  // Validate Short-term <= 5 hours (300 mins)
  if (type === 'SHORT_TERM') {
    if (!startTime || !endTime) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'Start time and end time are required for short-term gigs.',
        400
      );
    }
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const totalMinutes = eh * 60 + em - (sh * 60 + sm);
    if (totalMinutes <= 0 || totalMinutes > 300) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'Short-term jobs cannot exceed 5 hours.',
        400
      );
    }
  }

  const newJob = await prisma.job.create({
    data: {
      posterId: user.id,
      type,
      title: title.trim(),
      description: description.trim(),
      pay: Number(pay),
      payUnit,
      openings: openings ? Number(openings) : 1,
      filledCount: 0,
      isRemote: Boolean(isRemote),
      locationLat: location?.lat || 0,
      locationLng: location?.lng || 0,
      locationLabel: location?.label || (isRemote ? 'Remote' : 'Campus'),
      startDate,
      endDate: endDate || null,
      startTime: startTime || null,
      endTime: endTime || null,
      status: 'OPEN',
    },
    include: { poster: true },
  });

  const formatted = await formatJob(newJob, user.id);
  return sendSuccess(res, formatted, 201);
});

// POST /api/v1/jobs/:id/accept
jobsRouter.post('/:id/accept', authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = req.user!;

  if (user.isBlocked) {
    return sendError(res, 'USER_BLOCKED', 'Your account is blocked.', 403);
  }

  if (user.isVerified === false) {
    return sendError(
      res,
      'USER_NOT_VERIFIED',
      'Please verify your email address with the 6-digit OTP code before accepting gigs.',
      403
    );
  }

  if (user.activeMode !== 'SEEKER') {
    return sendError(res, 'FORBIDDEN', 'Switch to Seeker mode first.', 403);
  }

  const { id } = req.params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id },
        include: { poster: true },
      });

      if (!job) {
        throw { code: 'NOT_FOUND', message: 'Job not found.', status: 404 };
      }

      if (job.posterId === user.id) {
        throw { code: 'OWN_JOB', message: 'You cannot accept your own job.', status: 400 };
      }

      if (job.status !== 'OPEN' || job.filledCount >= job.openings) {
        throw {
          code: 'ALREADY_TAKEN',
          message: 'This job was just filled. Try another one.',
          status: 409,
        };
      }

      // Check for duplicate acceptance
      const existingApp = await tx.application.findFirst({
        where: {
          jobId: job.id,
          seekerId: user.id,
          status: { in: ['ACCEPTED', 'IN_PROGRESS'] },
        },
      });

      if (existingApp) {
        throw {
          code: 'ALREADY_ACCEPTED',
          message: 'You have already accepted this job.',
          status: 400,
        };
      }

      // Short term overlap conflict check
      if (job.type === 'SHORT_TERM' && job.startTime && job.endTime) {
        const userActiveApps = await tx.application.findMany({
          where: {
            seekerId: user.id,
            status: 'ACCEPTED',
          },
          include: { job: true },
        });

        for (const app of userActiveApps) {
          if (
            app.job.type === 'SHORT_TERM' &&
            app.job.startDate === job.startDate &&
            app.job.startTime &&
            app.job.endTime
          ) {
            // Overlap check: app.job.startTime < job.endTime && job.startTime < app.job.endTime
            if (
              app.job.startTime < job.endTime &&
              job.startTime < app.job.endTime
            ) {
              throw {
                code: 'TIME_CONFLICT',
                message: 'You already have an overlapping job at that time.',
                status: 409,
              };
            }
          }
        }
      }

      // Update job filledCount
      const updatedFilledCount = job.filledCount + 1;
      const updatedStatus = updatedFilledCount >= job.openings ? 'FILLED' : 'OPEN';

      const updatedJob = await tx.job.update({
        where: { id: job.id },
        data: {
          filledCount: updatedFilledCount,
          status: updatedStatus,
        },
        include: { poster: true },
      });

      // Create application
      const application = await tx.application.create({
        data: {
          jobId: job.id,
          seekerId: user.id,
          status: 'ACCEPTED',
        },
      });

      // Auto-create chat conversation between seeker and recruiter
      const existingConv = await tx.conversation.findUnique({
        where: {
          jobId_seekerId: {
            jobId: job.id,
            seekerId: user.id,
          },
        },
      });

      if (!existingConv) {
        const newConv = await tx.conversation.create({
          data: {
            jobId: job.id,
            seekerId: user.id,
            recruiterId: job.posterId,
          },
        });

        await tx.message.create({
          data: {
            conversationId: newConv.id,
            senderId: user.id,
            text: `Hi! I just accepted the "${job.title}" gig. Looking forward to connecting!`,
          },
        });
      }

      // Create notifications
      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'JOB_ACCEPTED',
          title: 'Job Accepted!',
          body: `You accepted "${job.title}". Check My Jobs for exact location and details.`,
          relatedJobId: job.id,
        },
      });

      await tx.notification.create({
        data: {
          userId: job.posterId,
          type: 'JOB_ACCEPTED',
          title: 'Spot Filled!',
          body: `${user.name} accepted your gig "${job.title}".`,
          relatedJobId: job.id,
        },
      });

      return {
        applicationId: application.id,
        status: 'ACCEPTED',
        job: updatedJob,
      };
    });

    const formattedJob = await formatJob(result.job, user.id);
    return sendSuccess(res, {
      applicationId: result.applicationId,
      status: result.status,
      job: formattedJob,
    });
  } catch (err: any) {
    if (err.code && err.message) {
      return sendError(res, err.code, err.message, err.status || 400);
    }
    return sendError(res, 'INTERNAL_ERROR', 'Failed to accept job.', 500);
  }
});

// POST /api/v1/jobs/:id/cancel-acceptance
jobsRouter.post(
  '/:id/cancel-acceptance',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { id } = req.params;

    const application = await prisma.application.findFirst({
      where: {
        jobId: id,
        seekerId: user.id,
        status: { in: ['ACCEPTED', 'IN_PROGRESS'] },
      },
      include: { job: true },
    });

    if (!application) {
      return sendError(res, 'NOT_FOUND', 'Active application not found.', 404);
    }

    // Cancel application and restore spot
    await prisma.application.update({
      where: { id: application.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    await prisma.job.update({
      where: { id },
      data: {
        filledCount: Math.max(0, application.job.filledCount - 1),
        status: 'OPEN',
      },
    });

    // Notify poster
    await prisma.notification.create({
      data: {
        userId: application.job.posterId,
        type: 'SEEKER_CANCELLED',
        title: 'Seeker Cancelled',
        body: `${user.name} had to cancel their acceptance for "${application.job.title}". The spot has reopened.`,
        relatedJobId: id,
      },
    });

    // Handle 3-strike cancellation logic
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    const newCount = (currentUser?.cancellationCount || 0) + 1;
    let isBlocked = false;
    let blockedUntil: string | null = null;
    let warning: string | null = null;

    if (newCount >= 3) {
      const blockExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      blockedUntil = blockExpiry.toISOString();
      isBlocked = true;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          cancellationCount: 0,
          isBlocked: true,
          blockedUntil: blockExpiry,
        },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'BLOCKED',
          title: 'Account Temporarily Blocked',
          body: 'Your account is blocked for 24 hours due to 3 cancellations.',
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          cancellationCount: newCount,
        },
      });

      if (newCount === 2) {
        warning = 'Warning: next cancellation will block your account for 1 day.';
      } else {
        warning = `You have ${newCount} cancellation(s). After 3, you will be blocked for 1 day.`;
      }
    }

    return sendSuccess(res, {
      cancellationCount: newCount >= 3 ? 0 : newCount,
      isBlocked,
      blockedUntil,
      warning,
      message: 'Acceptance cancelled.',
    });
  }
);

// DELETE /api/v1/jobs/:id
jobsRouter.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) {
    return sendError(res, 'NOT_FOUND', 'Job not found.', 404);
  }

  if (job.posterId !== req.user!.id) {
    return sendError(res, 'FORBIDDEN', 'You can only cancel your own job.', 403);
  }

  await prisma.job.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  // Notify any seekers who had accepted
  const acceptedApps = await prisma.application.findMany({
    where: { jobId: id, status: 'ACCEPTED' },
  });

  for (const app of acceptedApps) {
    await prisma.notification.create({
      data: {
        userId: app.seekerId,
        type: 'RECRUITER_CANCELLED',
        title: 'Job Cancelled',
        body: `The poster cancelled the gig "${job.title}".`,
        relatedJobId: id,
      },
    });
  }

  return sendSuccess(res, { message: 'Job cancelled successfully.' });
});

// POST /api/v1/jobs/:id/save
jobsRouter.post('/:id/save', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.savedJob.findUnique({
    where: {
      userId_jobId: {
        userId: req.user!.id,
        jobId: id,
      },
    },
  });

  if (existing) {
    await prisma.savedJob.delete({
      where: { id: existing.id },
    });
    return sendSuccess(res, { isSaved: false });
  } else {
    await prisma.savedJob.create({
      data: {
        userId: req.user!.id,
        jobId: id,
      },
    });
    return sendSuccess(res, { isSaved: true });
  }
});
