import { describe, it, expect } from 'vitest';
import {
  hasTimeConflict,
  isSeekerLocked,
  validateShortTermHours,
  formatPay,
  formatDistance,
  blockTimeRemaining,
} from '../src/utils/businessRules';
import type { Job, Application } from '../src/types';

describe('JobHunt Business Rules Verification', () => {
  describe('Rule 1: Short-term jobs duration max 5 hours', () => {
    it('accepts short-term job within 5 hours', () => {
      expect(validateShortTermHours('09:00', '13:00')).toBe(true); // 4 hours
      expect(validateShortTermHours('10:00', '15:00')).toBe(true); // exactly 5 hours
      expect(validateShortTermHours('14:30', '16:00')).toBe(true); // 1.5 hours
    });

    it('rejects short-term job exceeding 5 hours', () => {
      expect(validateShortTermHours('09:00', '14:30')).toBe(false); // 5.5 hours
      expect(validateShortTermHours('08:00', '15:00')).toBe(false); // 7 hours
    });

    it('rejects invalid or backwards times', () => {
      expect(validateShortTermHours('14:00', '10:00')).toBe(false);
      expect(validateShortTermHours('12:00', '12:00')).toBe(false);
    });
  });

  describe('Rule 5: Seeker cannot accept overlapping short-term jobs', () => {
    const existingApps: Application[] = [
      {
        applicationId: 'app-1',
        status: 'ACCEPTED',
        acceptedAt: '2026-10-18T10:00:00Z',
        cancelledAt: null,
        job: {
          id: 'job-1',
          type: 'SHORT_TERM',
          title: 'Morning Event Help',
          description: '',
          pay: 300,
          payUnit: 'FIXED',
          openings: 2,
          filledCount: 1,
          isRemote: false,
          approximateDistance: 1.0,
          location: { lat: 28.6, lng: 77.2, label: 'Block A' },
          startDate: '2026-10-25',
          endDate: '2026-10-25',
          startTime: '09:00',
          endTime: '12:00',
          status: 'OPEN',
          postedBy: { id: 'u-1', name: 'Poster', avatarUrl: null },
          isSaved: false,
          createdAt: '',
        },
      },
    ];

    it('detects direct overlap on same day', () => {
      const conflictingJob: Job = {
        ...existingApps[0].job,
        id: 'job-2',
        startTime: '10:00',
        endTime: '13:00',
      };
      expect(hasTimeConflict(conflictingJob, existingApps)).toBe(true);
    });

    it('allows non-overlapping job on the same day', () => {
      const afterJob: Job = {
        ...existingApps[0].job,
        id: 'job-3',
        startTime: '13:00',
        endTime: '16:00',
      };
      expect(hasTimeConflict(afterJob, existingApps)).toBe(false);
    });

    it('allows same hours on a DIFFERENT day', () => {
      const differentDayJob: Job = {
        ...existingApps[0].job,
        id: 'job-4',
        startDate: '2026-10-26',
        endDate: '2026-10-26',
        startTime: '09:00',
        endTime: '12:00',
      };
      expect(hasTimeConflict(differentDayJob, existingApps)).toBe(false);
    });

    it('ignores cancelled previous jobs when checking conflicts', () => {
      const cancelledApps: Application[] = [
        { ...existingApps[0], status: 'CANCELLED' },
      ];
      const sameTimeJob: Job = {
        ...existingApps[0].job,
        id: 'job-5',
        startTime: '09:00',
        endTime: '12:00',
      };
      expect(hasTimeConflict(sameTimeJob, cancelledApps)).toBe(false);
    });
  });

  describe('Rule 8: Mode switching lock verification', () => {
    it('detects seeker locked when active gigs are pending', () => {
      const activeApps: Application[] = [
        {
          applicationId: 'app-1',
          status: 'ACCEPTED',
          acceptedAt: '',
          cancelledAt: null,
          job: {} as any,
        },
      ];
      expect(isSeekerLocked(activeApps).length).toBe(1);
    });

    it('unlocks seeker when all gigs are completed or cancelled', () => {
      const completedApps: Application[] = [
        {
          applicationId: 'app-1',
          status: 'COMPLETED',
          acceptedAt: '',
          cancelledAt: null,
          job: {} as any,
        },
        {
          applicationId: 'app-2',
          status: 'CANCELLED',
          acceptedAt: '',
          cancelledAt: null,
          job: {} as any,
        },
      ];
      expect(isSeekerLocked(completedApps).length).toBe(0);
    });
  });

  describe('Formatting & UX Helpers', () => {
    it('formats pay correctly', () => {
      expect(formatPay(300, 'FIXED')).toContain('300');
      expect(formatPay(150, 'PER_HOUR')).toContain('/hr');
      expect(formatPay(8000, 'PER_MONTH')).toContain('/mo');
    });

    it('formats distance correctly (approximate privacy rule)', () => {
      expect(formatDistance(null)).toBe('Remote');
      expect(formatDistance(0.4)).toBe('400m away');
      expect(formatDistance(2.3)).toBe('2.3km away');
    });

    it('calculates remaining block time', () => {
      const future = new Date(Date.now() + 3 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString();
      expect(blockTimeRemaining(future)).toBe('3h 15m');
      expect(blockTimeRemaining(null)).toBe('');
    });
  });
});
