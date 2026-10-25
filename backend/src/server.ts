import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { jobsRouter } from './routes/jobs.js';
import { notificationsRouter } from './routes/notifications.js';
import { reportsRouter } from './routes/reports.js';
import { adminRouter } from './routes/admin.js';
import { chatRouter } from './routes/chat.js';
import { sendSuccess, sendError } from './utils/response.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

// Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

// Rate Limiter: Protect Auth endpoints from brute-force password cracking
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
  },
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600, // 600 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded. Please slow down your requests.',
    },
  },
});

// Enable CORS for Expo Mobile App & Vite Admin Console
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Initialize Real-Time WebSocket Server
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  // Join a user channel for direct personal notifications
  socket.on('join_user', (userId: string) => {
    socket.join(`user_${userId}`);
  });

  // Join a specific gig conversation room
  socket.on('join_conversation', (conversationId: string) => {
    socket.join(conversationId);
  });

  socket.on('leave_conversation', (conversationId: string) => {
    socket.leave(conversationId);
  });
});

// Apply rate limiters
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', apiLimiter);

// Health check
app.get('/api/v1/health', (_req: Request, res: Response) => {
  return sendSuccess(res, {
    status: 'ONLINE',
    service: 'JobHunt Unified REST API (Secured)',
    security: {
      rateLimiter: 'ACTIVE',
      helmet: 'ACTIVE',
      otpVerification: 'ACTIVE',
      realTimeSockets: 'ACTIVE',
    },
    timestamp: new Date().toISOString(),
  });
});

// Route modules
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/jobs', jobsRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/admin', adminRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  return sendError(res, 'NOT_FOUND', 'Endpoint does not exist', 404);
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Server Error]:', err);
  return sendError(res, 'INTERNAL_SERVER_ERROR', err?.message || 'Server error occurred', 500);
});

// Start listening on 0.0.0.0
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 JobHunt Backend REST & Real-Time API running at http://0.0.0.0:${PORT}/api/v1`);
  console.log(`📡 Local Network: http://10.162.68.159:${PORT}/api/v1`);
  console.log(`💻 Local Machine: http://localhost:${PORT}/api/v1`);
});
