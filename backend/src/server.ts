import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { jobsRouter } from './routes/jobs.js';
import { notificationsRouter } from './routes/notifications.js';
import { reportsRouter } from './routes/reports.js';
import { adminRouter } from './routes/admin.js';
import { sendSuccess, sendError } from './utils/response.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

// Enable CORS for Expo Mobile App & Vite Admin Console
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Health check
app.get('/api/v1/health', (_req: Request, res: Response) => {
  return sendSuccess(res, {
    status: 'ONLINE',
    service: 'JobHunt Unified REST API',
    timestamp: new Date().toISOString(),
  });
});

// Route modules
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/jobs', jobsRouter);
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

// Start listening on 0.0.0.0 so phone and local network devices can connect
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 JobHunt Backend REST API running at http://0.0.0.0:${PORT}/api/v1`);
  console.log(`📡 Local Network: http://10.162.68.159:${PORT}/api/v1`);
  console.log(`💻 Local Machine: http://localhost:${PORT}/api/v1`);
});
