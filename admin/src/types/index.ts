export type JobType = 'SHORT_TERM' | 'LONG_TERM';
export type JobStatus = 'OPEN' | 'FILLED' | 'COMPLETED' | 'CANCELLED';
export type UserMode = 'SEEKER' | 'RECRUITER';
export type ReportReason = 'SPAM' | 'INAPPROPRIATE' | 'FRAUD' | 'HARASSMENT' | 'OTHER';
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED';
export type BlockDuration = '1_DAY' | '3_DAYS' | '7_DAYS' | '30_DAYS' | 'PERMANENT';
export type AdminAction = 'BLOCK_USER' | 'UNBLOCK_USER' | 'REMOVE_JOB' | 'RESOLVE_REPORT' | 'LOGIN';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN';
  avatarUrl: string | null;
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  activeMode: UserMode;
  isBlocked: boolean;
  blockedUntil: string | null;
  cancellationCount: number;
  totalJobsPosted: number;
  totalJobsAccepted: number;
  createdAt: string;
}

export interface AdminJob {
  id: string;
  type: JobType;
  title: string;
  description: string;
  pay: number;
  payUnit: 'FIXED' | 'PER_HOUR' | 'PER_MONTH';
  openings: number;
  filledCount: number;
  isRemote: boolean;
  location: { lat: number; lng: number; label: string };
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  status: JobStatus;
  postedBy: { id: string; name: string; email: string };
  createdAt: string;
}

export interface AdminReport {
  id: string;
  targetType: 'JOB' | 'USER';
  targetId: string;
  targetTitle: string;
  reporter: { id: string; name: string; email: string };
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  adminNote: string | null;
  resolvedBy: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface ActionLogItem {
  id: string;
  adminId: string;
  adminName: string;
  action: AdminAction;
  targetType: 'USER' | 'JOB' | 'REPORT' | 'SESSION';
  targetId: string | null;
  note: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  pendingReports: number;
  blockedUsers: number;
  jobsThisWeek: { date: string; count: number }[];
  usersThisWeek: { date: string; count: number }[];
  jobsByType: {
    SHORT_TERM: number;
    LONG_TERM: number;
  };
}
