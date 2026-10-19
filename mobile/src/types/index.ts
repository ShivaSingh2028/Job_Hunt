// ─── Enums ────────────────────────────────────────────────────────────────────

export type JobType = 'SHORT_TERM' | 'LONG_TERM';
export type JobStatus = 'OPEN' | 'FILLED' | 'COMPLETED' | 'CANCELLED';
export type PayUnit = 'PER_HOUR' | 'FIXED' | 'PER_MONTH';
export type AppStatus = 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ReportReason = 'SPAM' | 'INAPPROPRIATE' | 'FRAUD' | 'HARASSMENT' | 'OTHER';
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED';
export type UserMode = 'SEEKER' | 'RECRUITER';
export type NotifType =
  | 'JOB_ACCEPTED'
  | 'SEEKER_CANCELLED'
  | 'RECRUITER_CANCELLED'
  | 'BLOCKED'
  | 'REMINDER'
  | 'REPORT_RESOLVED';

// ─── Location ─────────────────────────────────────────────────────────────────

export interface Location {
  lat: number;
  lng: number;
  label: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  activeMode: UserMode;
  cancellationCount: number;
  isBlocked: boolean;
  blockedUntil: string | null;
  savedJobIds: string[];
  location: Location | null;
  createdAt: string;
}

// ─── Job ──────────────────────────────────────────────────────────────────────

export interface JobPoster {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Job {
  id: string;
  type: JobType;
  title: string;
  description: string;
  pay: number;
  payUnit: PayUnit;
  openings: number;
  filledCount: number;
  isRemote: boolean;
  approximateDistance: number | null;
  location: Location;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  status: JobStatus;
  postedBy: JobPoster;
  isSaved: boolean;
  createdAt: string;
}

export interface CreateJobPayload {
  type: JobType;
  title: string;
  description: string;
  pay: number;
  payUnit: PayUnit;
  openings: number;
  isRemote: boolean;
  location?: Location;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}

// ─── Application ──────────────────────────────────────────────────────────────

export interface AcceptedSeeker {
  applicationId: string;
  seeker: {
    id: string;
    name: string;
    avatarUrl: string | null;
    email: string;
  };
  status: AppStatus;
  acceptedAt: string;
}

export interface Application {
  applicationId: string;
  status: AppStatus;
  job: Job;
  acceptedAt: string;
  cancelledAt: string | null;
}

export interface JobPost extends Job {
  acceptedSeekers: AcceptedSeeker[];
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  isRead: boolean;
  relatedJobId: string | null;
  createdAt: string;
}

// ─── Report ───────────────────────────────────────────────────────────────────

export interface ReportPayload {
  targetType: 'JOB' | 'USER';
  targetId: string;
  reason: ReportReason;
  description: string;
}

// ─── API Envelope ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string; pendingItems?: any[] } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface JobFilters {
  type?: JobType;
  minPay?: number;
  maxPay?: number;
  keyword?: string;
}
