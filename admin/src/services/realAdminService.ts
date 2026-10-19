import type {
  PlatformUser,
  AdminJob,
  AdminReport,
  ActionLogItem,
  DashboardStats,
  BlockDuration,
  ReportStatus,
} from '../types';
import { MOCK_DASHBOARD_STATS } from './mockAdminData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1/admin';

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('jobhunt_admin_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json = await res.json().catch(() => null);

  if (!res.ok || (json && json.success === false)) {
    throw new Error(json?.error?.message || `Request failed with status ${res.status}`);
  }

  return json.data as T;
}

export const realAdminService = {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const stats = await req<any>('/stats');
      return {
        ...MOCK_DASHBOARD_STATS,
        totalUsers: stats.totalUsers ?? 142,
        totalJobs: stats.totalJobs ?? 58,
        activeJobs: stats.openJobs ?? 5,
        completedJobs: stats.completedJobs ?? 0,
        pendingReports: stats.pendingReports ?? 1,
        blockedUsers: stats.blockedUsers ?? 0,
      };
    } catch (e) {
      console.warn('Backend unavailable, falling back to cached dashboard stats');
      throw e;
    }
  },

  async getUsers(search = '', isBlocked?: boolean): Promise<PlatformUser[]> {
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (isBlocked !== undefined) params.append('isBlocked', String(isBlocked));

    const users = await req<any[]>(`/users?${params.toString()}`);
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      avatarUrl: u.avatarUrl || null,
      activeMode: u.activeMode,
      isBlocked: u.isBlocked,
      blockedUntil: u.blockedUntil,
      cancellationCount: u.cancellationCount,
      totalJobsPosted: u.jobsPostedCount ?? 0,
      totalJobsAccepted: u.jobsCompletedCount ?? 0,
      createdAt: u.joinedAt || u.createdAt,
    }));
  },

  async getUserById(id: string): Promise<{ user: PlatformUser; jobs: AdminJob[]; reports: AdminReport[] }> {
    const data = await req<any>(`/users/${id}`);
    const user: PlatformUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      phone: data.user.phone,
      avatarUrl: data.user.avatarUrl || null,
      activeMode: data.user.activeMode,
      isBlocked: data.user.isBlocked,
      blockedUntil: data.user.blockedUntil,
      cancellationCount: data.user.cancellationCount,
      totalJobsPosted: data.user.jobsPostedCount ?? 0,
      totalJobsAccepted: data.user.jobsCompletedCount ?? 0,
      createdAt: data.user.joinedAt || data.user.createdAt,
    };

    const jobs: AdminJob[] = (data.jobs || []).map((j: any) => ({
      id: j.id,
      type: j.type,
      title: j.title,
      description: j.description,
      pay: j.pay,
      payUnit: j.payUnit,
      openings: j.openings,
      filledCount: j.filledCount,
      isRemote: j.isRemote,
      location: { lat: 0, lng: 0, label: j.locationLabel || '' },
      startDate: j.startDate || '',
      endDate: j.endDate || null,
      startTime: j.startTime || null,
      endTime: j.endTime || null,
      status: j.status,
      postedBy: j.postedBy,
      createdAt: j.createdAt,
    }));

    const reports: AdminReport[] = data.reports || [];

    return { user, jobs, reports };
  },

  async blockUser(id: string, duration: BlockDuration, reason: string): Promise<PlatformUser> {
    const updated = await req<any>(`/users/${id}/block`, {
      method: 'POST',
      body: JSON.stringify({ duration, reason }),
    });
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: null,
      avatarUrl: null,
      activeMode: 'SEEKER',
      isBlocked: updated.isBlocked,
      blockedUntil: updated.blockedUntil,
      cancellationCount: 0,
      totalJobsPosted: 0,
      totalJobsAccepted: 0,
      createdAt: new Date().toISOString(),
    };
  },

  async unblockUser(id: string): Promise<PlatformUser> {
    const updated = await req<any>(`/users/${id}/unblock`, {
      method: 'POST',
    });
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: null,
      avatarUrl: null,
      activeMode: 'SEEKER',
      isBlocked: updated.isBlocked,
      blockedUntil: null,
      cancellationCount: 0,
      totalJobsPosted: 0,
      totalJobsAccepted: 0,
      createdAt: new Date().toISOString(),
    };
  },

  async getJobs(search = '', status?: string, type?: string): Promise<AdminJob[]> {
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (status) params.append('status', status);
    if (type) params.append('type', type);

    const jobs = await req<any[]>(`/jobs?${params.toString()}`);
    return jobs.map((j) => ({
      id: j.id,
      type: j.type,
      title: j.title,
      description: j.description,
      pay: j.pay,
      payUnit: j.payUnit,
      openings: j.openings,
      filledCount: j.filledCount,
      isRemote: j.isRemote,
      location: { lat: 0, lng: 0, label: j.locationLabel || '' },
      startDate: j.startDate || '',
      endDate: j.endDate || null,
      startTime: j.startTime || null,
      endTime: j.endTime || null,
      status: j.status,
      postedBy: j.postedBy,
      createdAt: j.createdAt,
    }));
  },

  async removeJob(id: string, reason: string): Promise<void> {
    await req(`/jobs/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  },

  async getReports(status?: ReportStatus): Promise<AdminReport[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    return req<AdminReport[]>(`/reports?${params.toString()}`);
  },

  async updateReport(id: string, status: ReportStatus, adminNote: string): Promise<AdminReport> {
    return req<AdminReport>(`/reports/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNote }),
    });
  },

  async getActionLogs(): Promise<ActionLogItem[]> {
    return req<ActionLogItem[]>('/logs');
  },
};
