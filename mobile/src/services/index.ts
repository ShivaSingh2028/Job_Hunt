import { mockAuthService, mockUserService, mockJobService, mockNotificationService, mockReportService } from './mockService';
import { realAuthService, realUserService, realJobService, realNotificationService, realReportService } from './realService';
import type { IAuthService, IJobService, IUserService, INotificationService, IReportService } from './types';

// Real persistent backend by default (can be toggled back with EXPO_PUBLIC_USE_MOCK=true)
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

export const authService: IAuthService = USE_MOCK ? mockAuthService : realAuthService;
export const userService: IUserService = USE_MOCK ? mockUserService : realUserService;
export const jobService: IJobService = USE_MOCK ? mockJobService : realJobService;
export const notificationService: INotificationService = USE_MOCK ? mockNotificationService : realNotificationService;
export const reportService: IReportService = USE_MOCK ? mockReportService : realReportService;
