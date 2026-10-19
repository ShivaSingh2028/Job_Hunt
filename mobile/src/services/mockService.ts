import type { IAuthService, IJobService, IUserService, INotificationService, IReportService } from './types';
import type { User, Job, Application, JobPost, Notification, AuthResponse, CreateJobPayload, JobFilters, ReportPayload } from '../types';
import { MOCK_USER, MOCK_JOBS, MOCK_APPLICATIONS, MOCK_POSTS, MOCK_NOTIFICATIONS } from './mockData';

const delay = (ms = 600) => new Promise(res => setTimeout(res, ms));
const err = (code: string, message: string) => { const e = new Error(message) as any; e.code = code; throw e; };

let _user = { ...MOCK_USER };
let _jobs = [...MOCK_JOBS];
let _applications = [...MOCK_APPLICATIONS];
let _posts = [...MOCK_POSTS];
let _notifications = [...MOCK_NOTIFICATIONS];
let _savedJobIds = [...MOCK_USER.savedJobIds];

export const mockAuthService: IAuthService = {
  async login(email, password) {
    await delay(800);
    if (email !== 'alex@college.edu') err('NOT_FOUND', 'No account with that email.');
    if (password !== 'password123') err('UNAUTHORIZED', 'Incorrect password.');
    return { user: _user, accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' };
  },
  async register(name, email, _password, phone) {
    await delay(1000);
    if (email === 'alex@college.edu') err('CONFLICT', 'Email already registered.');
    _user = { ..._user, name, email, phone: phone || null };
    return { user: _user, accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' };
  },
  async forgotPassword(_email) { await delay(700); },
  async logout(_refreshToken) { await delay(300); },
  async refreshToken(_refreshToken) {
    await delay(200);
    return { accessToken: 'mock-access-token-new', refreshToken: 'mock-refresh-token-new' };
  },
};

export const mockUserService: IUserService = {
  async getMe() { await delay(400); return { ..._user, savedJobIds: _savedJobIds }; },
  async updateMe(data) {
    await delay(600);
    _user = { ..._user, ...data } as User;
    return _user;
  },
  async switchMode(targetMode) {
    await delay(150);
    _user = { ..._user, activeMode: targetMode };
    return { activeMode: targetMode };
  },
  async updateLocation(lat, lng, label) {
    await delay(300);
    _user = { ..._user, location: { lat, lng, label } };
  },
};

export const mockJobService: IJobService = {
  async getJobs(lat, lng, filters, _page = 1) {
    await delay(500);
    const userLat = lat ?? _user.location?.lat ?? 28.6139;
    const userLng = lng ?? _user.location?.lng ?? 77.2090;

    // Relative offsets to position mock campus gigs realistically near the user's live GPS coordinates
    const nearbyOffsets = [
      { dLat: 0.0032, dLng: -0.0025 }, // ~400m
      { dLat: -0.0085, dLng: 0.0071 }, // ~1.2km
      { dLat: 0, dLng: 0 },            // Remote
      { dLat: 0.0052, dLng: 0.0048 },  // ~800m
      { dLat: -0.0022, dLng: -0.0018 }, // ~320m
    ];

    // Align mock on-site gigs relative to live user GPS if they were initialized elsewhere
    _jobs.forEach((j, index) => {
      if (!j.isRemote) {
        if (Math.abs(j.location.lat - userLat) > 0.1 || Math.abs(j.location.lng - userLng) > 0.1) {
          const off = nearbyOffsets[index % nearbyOffsets.length];
          j.location = {
            ...j.location,
            lat: userLat + off.dLat,
            lng: userLng + off.dLng,
          };
        }
        const dist = ((userLat - j.location.lat) ** 2 + (userLng - j.location.lng) ** 2) ** 0.5 * 111;
        j.approximateDistance = Math.round(dist * 10) / 10;
      } else {
        j.approximateDistance = null;
      }
    });

    let jobs = _jobs.filter(j => j.status === 'OPEN' && j.postedBy.id !== _user.id);

    // Rule 2: Seekers see only ON-SITE jobs within 5 km. REMOTE jobs visible from anywhere.
    jobs = jobs.filter(j => j.isRemote || (j.approximateDistance !== null && j.approximateDistance <= 5.0));

    if (filters?.type) jobs = jobs.filter(j => j.type === filters.type);
    if (filters?.keyword) jobs = jobs.filter(j => j.title.toLowerCase().includes(filters.keyword!.toLowerCase()));
    if (filters?.minPay !== undefined) jobs = jobs.filter(j => j.pay >= filters.minPay!);
    if (filters?.maxPay !== undefined) jobs = jobs.filter(j => j.pay <= filters.maxPay!);
    return { jobs: jobs.map(j => ({ ...j, isSaved: _savedJobIds.includes(j.id) })), total: jobs.length, totalPages: 1 };
  },
  async getJobById(id) {
    await delay(400);
    const job = _jobs.find(j => j.id === id);
    if (!job) err('NOT_FOUND', 'Job not found.');
    const isAccepted = _applications.some(a => a.job.id === id && a.status === 'ACCEPTED');
    return { ...job!, isSaved: _savedJobIds.includes(id), location: isAccepted ? { ...job!.location, label: 'Main Campus, Block A, Room 101' } : job!.location };
  },
  async acceptJob(id) {
    await delay(800);
    if (_user.isBlocked) err('USER_BLOCKED', 'Your account is blocked.');
    if (_user.activeMode !== 'SEEKER') err('FORBIDDEN', 'Switch to Seeker mode first.');
    const job = _jobs.find(j => j.id === id);
    if (!job) err('NOT_FOUND', 'Job not found.');
    if (job!.postedBy.id === _user.id) err('OWN_JOB', 'You cannot accept your own job.');
    if (job!.status !== 'OPEN') err('ALREADY_TAKEN', 'This job was just filled. Try another one.');
    if (job!.type === 'SHORT_TERM') {
      const conflict = _applications.find(a => {
        if (a.job.type !== 'SHORT_TERM' || a.status === 'CANCELLED') return false;
        if (a.job.startDate !== job!.startDate) return false;
        return a.job.startTime! < job!.endTime! && a.job.endTime! > job!.startTime!;
      });
      if (conflict) err('TIME_CONFLICT', 'You already have an overlapping job at that time.');
    }
    const jobIndex = _jobs.findIndex(j => j.id === id);
    _jobs[jobIndex] = { ..._jobs[jobIndex], filledCount: _jobs[jobIndex].filledCount + 1, status: _jobs[jobIndex].filledCount + 1 >= _jobs[jobIndex].openings ? 'FILLED' : 'OPEN' };
    const application: Application = {
      applicationId: `app-${Date.now()}`,
      status: 'ACCEPTED',
      job: { ..._jobs[jobIndex], location: { ..._jobs[jobIndex].location, label: 'Main Campus, Block A, Room 101' } },
      acceptedAt: new Date().toISOString(),
      cancelledAt: null,
    };
    _applications.push(application);
    _notifications.unshift({ id: `notif-${Date.now()}`, type: 'JOB_ACCEPTED', title: 'Job Accepted!', body: `You accepted "${job!.title}". Check My Jobs.`, isRead: false, relatedJobId: id, createdAt: new Date().toISOString() });
    return { applicationId: application.applicationId, status: 'ACCEPTED', job: application.job };
  },
  async cancelAcceptance(id) {
    await delay(600);
    const appIndex = _applications.findIndex(a => a.job.id === id && (a.status === 'ACCEPTED' || a.status === 'IN_PROGRESS'));
    if (appIndex === -1) err('NOT_FOUND', 'Application not found.');
    _applications[appIndex] = { ..._applications[appIndex], status: 'CANCELLED', cancelledAt: new Date().toISOString() };
    const jobIndex = _jobs.findIndex(j => j.id === id);
    if (jobIndex !== -1) _jobs[jobIndex] = { ..._jobs[jobIndex], filledCount: Math.max(0, _jobs[jobIndex].filledCount - 1), status: 'OPEN' };
    _user = { ..._user, cancellationCount: _user.cancellationCount + 1 };
    let isBlocked = false, blockedUntil: string | null = null, warning: string | null = null;
    if (_user.cancellationCount >= 3) {
      blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      isBlocked = true;
      _user = { ..._user, isBlocked: true, blockedUntil, cancellationCount: 0 };
    } else if (_user.cancellationCount === 2) {
      warning = 'Warning: next cancellation will block your account for 1 day.';
    } else {
      warning = `You have ${_user.cancellationCount} cancellation(s). After 3, you will be blocked for 1 day.`;
    }
    return { cancellationCount: _user.cancellationCount, isBlocked, blockedUntil, warning, message: 'Acceptance cancelled.' };
  },
  async createJob(payload) {
    await delay(900);
    if (_user.isBlocked) err('USER_BLOCKED', 'Your account is blocked.');
    if (_user.activeMode !== 'RECRUITER') err('FORBIDDEN', 'Switch to Recruiter mode first.');
    const newJob: Job = {
      id: `job-${Date.now()}`,
      ...payload,
      filledCount: 0,
      approximateDistance: null,
      location: payload.location || { lat: 0, lng: 0, label: 'Remote' },
      endDate: payload.endDate || null,
      startTime: payload.startTime || null,
      endTime: payload.endTime || null,
      status: 'OPEN',
      postedBy: { id: _user.id, name: _user.name, avatarUrl: _user.avatarUrl },
      isSaved: false,
      createdAt: new Date().toISOString(),
    };
    _jobs.push(newJob);
    _posts.push({ ...newJob, acceptedSeekers: [] });
    return newJob;
  },
  async cancelJob(id) {
    await delay(600);
    const idx = _jobs.findIndex(j => j.id === id);
    if (idx === -1) err('NOT_FOUND', 'Job not found.');
    if (_jobs[idx].postedBy.id !== _user.id) err('FORBIDDEN', 'Not your job.');
    const hadAccepted = _jobs[idx].filledCount > 0;
    _jobs[idx] = { ..._jobs[idx], status: 'CANCELLED' };
    const pidx = _posts.findIndex(p => p.id === id);
    if (pidx !== -1) _posts[pidx] = { ..._posts[pidx], status: 'CANCELLED' };
    if (hadAccepted) {
      _user = { ..._user, cancellationCount: _user.cancellationCount + 1 };
    }
  },
  async saveJob(id) {
    await delay(300);
    const isSaved = _savedJobIds.includes(id);
    if (isSaved) _savedJobIds = _savedJobIds.filter(jid => jid !== id);
    else _savedJobIds.push(id);
    return { isSaved: !isSaved };
  },
  async getSavedJobs() {
    await delay(500);
    return _jobs.filter(j => _savedJobIds.includes(j.id)).map(j => ({ ...j, isSaved: true }));
  },
  async getMyApplications(status) {
    await delay(500);
    let apps = _applications;
    if (status) apps = apps.filter(a => a.status === status);
    return apps;
  },
  async getMyPosts(status) {
    await delay(500);
    let posts = _posts;
    if (status) posts = posts.filter(p => p.status === status);
    return posts;
  },
};

export const mockNotificationService: INotificationService = {
  async getNotifications(_page = 1, unreadOnly = false) {
    await delay(400);
    let notifs = _notifications;
    if (unreadOnly) notifs = notifs.filter(n => !n.isRead);
    return { notifications: notifs, unreadCount: _notifications.filter(n => !n.isRead).length };
  },
  async markRead(id) {
    await delay(200);
    const idx = _notifications.findIndex(n => n.id === id);
    if (idx !== -1) _notifications[idx] = { ..._notifications[idx], isRead: true };
  },
  async markAllRead() {
    await delay(300);
    _notifications = _notifications.map(n => ({ ...n, isRead: true }));
  },
};

export const mockReportService: IReportService = {
  async submitReport(_payload: ReportPayload) {
    await delay(700);
    return { reportId: `report-${Date.now()}` };
  },
};
