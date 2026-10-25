import type { Job, User, Application, JobPost, Notification, AuthResponse, CreateJobPayload, JobFilters, ReportPayload, Conversation, ChatMessage } from '../types';

export interface IAuthService {
  login(email: string, password: string): Promise<AuthResponse>;
  register(name: string, email: string, password: string, phone?: string): Promise<AuthResponse>;
  forgotPassword(email: string): Promise<void>;
  sendVerificationOtp(email: string): Promise<{ message: string; email: string; demoOtp?: string }>;
  verifyEmailOtp(email: string, otp: string): Promise<{ message: string; user: User }>;
  logout(refreshToken: string): Promise<void>;
  refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
}

export interface IJobService {
  getJobs(lat: number, lng: number, filters?: JobFilters, page?: number): Promise<{ jobs: Job[]; total: number; totalPages: number }>;
  getJobById(id: string): Promise<Job>;
  acceptJob(id: string): Promise<{ applicationId: string; status: string; job: Job }>;
  cancelAcceptance(id: string): Promise<{ cancellationCount: number; isBlocked: boolean; blockedUntil: string | null; warning: string | null; message: string }>;
  createJob(payload: CreateJobPayload): Promise<Job>;
  cancelJob(id: string): Promise<void>;
  saveJob(id: string): Promise<{ isSaved: boolean }>;
  getSavedJobs(): Promise<Job[]>;
  getMyApplications(status?: string): Promise<Application[]>;
  getMyPosts(status?: string): Promise<JobPost[]>;
}

export interface IUserService {
  getMe(): Promise<User>;
  updateMe(data: Partial<Pick<User, 'name' | 'phone' | 'avatarUrl' | 'location'>>): Promise<User>;
  switchMode(mode: 'SEEKER' | 'RECRUITER'): Promise<{ activeMode: string } | { error: { code: string; message: string; pendingItems: any[] } }>;
  updateLocation(lat: number, lng: number, label: string): Promise<void>;
}

export interface INotificationService {
  getNotifications(page?: number, unreadOnly?: boolean): Promise<{ notifications: Notification[]; unreadCount: number }>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

export interface IReportService {
  submitReport(payload: ReportPayload): Promise<{ reportId: string }>;
}

export interface IChatService {
  getConversations(): Promise<Conversation[]>;
  getMessages(conversationId: string): Promise<ChatMessage[]>;
  sendMessage(conversationId: string, text: string): Promise<ChatMessage>;
  getOrCreateJobChat(jobId: string, seekerId?: string): Promise<{ conversationId: string }>;
}
