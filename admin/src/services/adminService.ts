import type {
  PlatformUser, AdminJob, AdminReport, ActionLogItem, DashboardStats, BlockDuration, ReportStatus, AdminAction,
} from '../types';
import {
  MOCK_USERS, MOCK_JOBS, MOCK_REPORTS, MOCK_ACTION_LOG, MOCK_DASHBOARD_STATS,
} from './mockAdminData';

import { realAdminService } from './realAdminService';

const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

let _users = [...MOCK_USERS];
let _jobs = [...MOCK_JOBS];
let _reports = [...MOCK_REPORTS];
let _logs = [...MOCK_ACTION_LOG];
let _stats = { ...MOCK_DASHBOARD_STATS };

const logAdminAction = (action: AdminAction, targetType: 'USER' | 'JOB' | 'REPORT' | 'SESSION', targetId: string | null, note: string | null) => {
  _logs.unshift({
    id: `log-${Date.now()}`,
    adminId: 'admin-1',
    adminName: 'Admin Sarah',
    action,
    targetType,
    targetId,
    note,
    createdAt: new Date().toISOString(),
  });
};

export const mockAdminService = {
  async getDashboardStats(): Promise<DashboardStats> {
    await delay(300);
    return {
      ..._stats,
      totalUsers: _users.length + 137,
      totalJobs: _jobs.length + 54,
      pendingReports: _reports.filter(r => r.status === 'PENDING').length,
      blockedUsers: _users.filter(u => u.isBlocked).length,
    };
  },

  async getUsers(search = '', isBlocked?: boolean): Promise<PlatformUser[]> {
    await delay(350);
    let list = _users;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (isBlocked !== undefined) {
      list = list.filter(u => u.isBlocked === isBlocked);
    }
    return list;
  },

  async getUserById(id: string): Promise<{ user: PlatformUser; jobs: AdminJob[]; reports: AdminReport[] }> {
    await delay(300);
    const user = _users.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    const jobs = _jobs.filter(j => j.postedBy.id === id);
    const reports = _reports.filter(r => r.targetId === id || r.reporter.id === id);
    return { user, jobs, reports };
  },

  async blockUser(id: string, duration: BlockDuration, reason: string): Promise<PlatformUser> {
    await delay(500);
    const idx = _users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');

    const durationDaysMap: Record<BlockDuration, number> = {
      '1_DAY': 1,
      '3_DAYS': 3,
      '7_DAYS': 7,
      '30_DAYS': 30,
      'PERMANENT': 3650,
    };
    const days = durationDaysMap[duration] || 1;
    const blockedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    _users[idx] = {
      ..._users[idx],
      isBlocked: true,
      blockedUntil,
    };

    logAdminAction('BLOCK_USER', 'USER', id, `Blocked (${duration}). Reason: ${reason}`);
    return _users[idx];
  },

  async unblockUser(id: string): Promise<PlatformUser> {
    await delay(400);
    const idx = _users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');

    _users[idx] = {
      ..._users[idx],
      isBlocked: false,
      blockedUntil: null,
      cancellationCount: 0,
    };

    logAdminAction('UNBLOCK_USER', 'USER', id, 'Unblocked and reset strikes by Admin.');
    return _users[idx];
  },

  async getJobs(search = '', status?: string, type?: string): Promise<AdminJob[]> {
    await delay(350);
    let list = _jobs;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(j => j.title.toLowerCase().includes(q) || j.postedBy.name.toLowerCase().includes(q));
    }
    if (status && status !== 'ALL') {
      list = list.filter(j => j.status === status);
    }
    if (type && type !== 'ALL') {
      list = list.filter(j => j.type === type);
    }
    return list;
  },

  async removeJob(id: string, reason: string): Promise<void> {
    await delay(450);
    const job = _jobs.find(j => j.id === id);
    _jobs = _jobs.filter(j => j.id !== id);
    logAdminAction('REMOVE_JOB', 'JOB', id, `Removed gig "${job?.title || id}". Reason: ${reason}`);
  },

  async getReports(status?: ReportStatus): Promise<AdminReport[]> {
    await delay(300);
    let list = _reports;
    if (status) {
      list = list.filter(r => r.status === status);
    }
    return list;
  },

  async updateReport(id: string, status: ReportStatus, adminNote: string): Promise<AdminReport> {
    await delay(400);
    const idx = _reports.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Report not found');

    _reports[idx] = {
      ..._reports[idx],
      status,
      adminNote,
      resolvedBy: 'Admin Sarah',
      resolvedAt: new Date().toISOString(),
    };

    logAdminAction('RESOLVE_REPORT', 'REPORT', id, `Marked as ${status}. Note: ${adminNote}`);
    return _reports[idx];
  },

  async getActionLogs(): Promise<ActionLogItem[]> {
    await delay(250);
    return _logs;
  },
};

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
export const adminService = USE_MOCK ? mockAdminService : realAdminService;

