import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';
import type {
  IAuthService,
  IJobService,
  IUserService,
  INotificationService,
  IReportService,
  IChatService,
} from './types';
import type {
  User,
  Job,
  Application,
  JobPost,
  Notification,
  AuthResponse,
  CreateJobPayload,
  JobFilters,
  ReportPayload,
  Conversation,
  ChatMessage,
} from '../types';

// Default to host IP on local Wi-Fi, with localhost for Web
const DEFAULT_URL =
  Platform.OS === 'web'
    ? 'http://localhost:8080/api/v1'
    : 'http://10.162.68.159:8080/api/v1';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_URL;

async function request<T>(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const token = await SecureStore.getItemAsync('accessToken').catch(() => null);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint}`;
  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (netErr: any) {
    const e = new Error('Network request failed. Is the JobHunt backend running?') as any;
    e.code = 'NETWORK_ERROR';
    throw e;
  }

  // Automatic token refresh on 401
  if (res.status === 401 && !isRetry && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
    const refreshToken = await SecureStore.getItemAsync('refreshToken').catch(() => null);
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const refreshData = await refreshRes.json().catch(() => null);
        if (refreshRes.ok && refreshData?.data?.accessToken) {
          await SecureStore.setItemAsync('accessToken', refreshData.data.accessToken);
          if (refreshData.data.refreshToken) {
            await SecureStore.setItemAsync('refreshToken', refreshData.data.refreshToken);
          }
          return request<T>(endpoint, options, true);
        }
      } catch {}
    }
  }

  const json = await res.json().catch(() => null);

  if (!res.ok || (json && json.success === false)) {
    const errorInfo = json?.error || {
      code: 'UNKNOWN_ERROR',
      message: `Request failed with status ${res.status}`,
    };
    const error = new Error(errorInfo.message) as any;
    error.code = errorInfo.code;
    error.status = res.status;
    error.pendingItems = errorInfo.pendingItems;
    throw error;
  }

  return json.data as T;
}

export const realAuthService: IAuthService = {
  async login(email, password): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(name, email, password, phone): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
    });
  },

  async forgotPassword(email): Promise<void> {
    await request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async sendVerificationOtp(email): Promise<{ message: string; email: string }> {
    return request<{ message: string; email: string }>('/auth/send-verification-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async verifyEmailOtp(email, otp): Promise<{ message: string; user: User }> {
    return request<{ message: string; user: User }>('/auth/verify-email-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  async logout(refreshToken): Promise<void> {
    await request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  },

  async refreshToken(refreshToken): Promise<{ accessToken: string; refreshToken: string }> {
    return request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
};

export const realUserService: IUserService = {
  async getMe(): Promise<User> {
    return request<User>('/users/me');
  },

  async updateMe(data): Promise<User> {
    return request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async switchMode(mode): Promise<{ activeMode: string } | { error: { code: string; message: string; pendingItems: any[] } }> {
    try {
      return await request<{ activeMode: string }>('/users/me/switch-mode', {
        method: 'POST',
        body: JSON.stringify({ mode }),
      });
    } catch (err: any) {
      if (err.code === 'MODE_LOCK_SEEKER' || err.code === 'MODE_LOCK_RECRUITER') {
        return {
          error: {
            code: err.code,
            message: err.message,
            pendingItems: err.pendingItems || [],
          },
        };
      }
      throw err;
    }
  },

  async updateLocation(lat, lng, label): Promise<void> {
    await request('/users/me/location', {
      method: 'PATCH',
      body: JSON.stringify({ lat, lng, label }),
    });
  },
};

export const realJobService: IJobService = {
  async getJobs(lat, lng, filters, page = 1): Promise<{ jobs: Job[]; total: number; totalPages: number }> {
    const params = new URLSearchParams();
    if (lat !== undefined) params.append('lat', String(lat));
    if (lng !== undefined) params.append('lng', String(lng));
    if (filters?.type) params.append('type', filters.type);
    if (filters?.keyword) params.append('keyword', filters.keyword);
    if (filters?.minPay !== undefined) params.append('minPay', String(filters.minPay));
    if (filters?.maxPay !== undefined) params.append('maxPay', String(filters.maxPay));
    if (page) params.append('page', String(page));

    return request<{ jobs: Job[]; total: number; totalPages: number }>(`/jobs?${params.toString()}`);
  },

  async getJobById(id): Promise<Job> {
    return request<Job>(`/jobs/${id}`);
  },

  async acceptJob(id): Promise<{ applicationId: string; status: string; job: Job }> {
    return request<{ applicationId: string; status: string; job: Job }>(`/jobs/${id}/accept`, {
      method: 'POST',
    });
  },

  async cancelAcceptance(id): Promise<{
    cancellationCount: number;
    isBlocked: boolean;
    blockedUntil: string | null;
    warning: string | null;
    message: string;
  }> {
    return request<{
      cancellationCount: number;
      isBlocked: boolean;
      blockedUntil: string | null;
      warning: string | null;
      message: string;
    }>(`/jobs/${id}/cancel-acceptance`, {
      method: 'POST',
    });
  },

  async createJob(payload: CreateJobPayload): Promise<Job> {
    return request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async cancelJob(id: string): Promise<void> {
    await request(`/jobs/${id}`, {
      method: 'DELETE',
    });
  },

  async saveJob(id: string): Promise<{ isSaved: boolean }> {
    return request<{ isSaved: boolean }>(`/jobs/${id}/save`, {
      method: 'POST',
    });
  },

  async getSavedJobs(): Promise<Job[]> {
    return request<Job[]>('/jobs/saved');
  },

  async getMyApplications(status?: string): Promise<Application[]> {
    const query = status ? `?status=${status}` : '';
    return request<Application[]>(`/jobs/my-applications${query}`);
  },

  async getMyPosts(status?: string): Promise<JobPost[]> {
    const query = status ? `?status=${status}` : '';
    return request<JobPost[]>(`/jobs/my-posts${query}`);
  },
};

export const realNotificationService: INotificationService = {
  async getNotifications(page = 1, unreadOnly = false): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    if (unreadOnly) params.append('unreadOnly', 'true');
    return request<{ notifications: Notification[]; unreadCount: number }>(`/notifications?${params.toString()}`);
  },

  async markRead(id: string): Promise<void> {
    await request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllRead(): Promise<void> {
    await request('/notifications/read-all', {
      method: 'POST',
    });
  },
};

export const realReportService: IReportService = {
  async submitReport(payload: ReportPayload): Promise<{ reportId: string }> {
    return request<{ reportId: string }>('/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const realChatService: IChatService = {
  async getConversations(): Promise<Conversation[]> {
    return request<Conversation[]>('/chat/conversations');
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    return request<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`);
  },

  async sendMessage(conversationId: string, text: string): Promise<ChatMessage> {
    return request<ChatMessage>(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async getOrCreateJobChat(jobId: string, seekerId?: string): Promise<{ conversationId: string }> {
    return request<{ conversationId: string }>(`/chat/job/${jobId}`, {
      method: 'POST',
      body: JSON.stringify({ seekerId }),
    });
  },
};

let _socketInstance: Socket | null = null;

export function getChatSocket(): Socket {
  if (!_socketInstance) {
    const socketUrl = BASE_URL.replace(/\/api\/v1\/?$/, '');
    _socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  } else if (!_socketInstance.connected) {
    _socketInstance.connect();
  }
  return _socketInstance;
}
