import type { Job, Application } from '../types';

/** Check if two short-term jobs have overlapping times on the same date */
export function hasTimeConflict(newJob: Job, existingApps: Application[]): boolean {
  if (newJob.type !== 'SHORT_TERM') return false;
  return existingApps.some(app => {
    if (app.job.type !== 'SHORT_TERM') return false;
    if (app.status === 'CANCELLED' || app.status === 'COMPLETED') return false;
    if (app.job.startDate !== newJob.startDate) return false;
    // Check overlap: [s1, e1] overlaps [s2, e2] if s1 < e2 && s2 < e1
    return app.job.startTime! < newJob.endTime! && newJob.startTime! < app.job.endTime!;
  });
}

/** Check if seeker is in locked mode (has active jobs) */
export function isSeekerLocked(apps: Application[]): Application[] {
  return apps.filter(a => a.status === 'ACCEPTED' || a.status === 'IN_PROGRESS');
}

/** Format pay display */
export function formatPay(pay: number, unit: string): string {
  const formatted = pay.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  const unitLabels: Record<string, string> = {
    PER_HOUR: '/hr',
    PER_MONTH: '/mo',
    FIXED: ' fixed',
  };
  return `${formatted}${unitLabels[unit] ?? ''}`;
}

/** Calculate distance in kilometers between two GPS coordinates using Haversine formula */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/** Format approximate distance */
export function formatDistance(km: number | null): string {
  if (km === null) return 'Remote';
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km.toFixed(1)}km away`;
}

/** Returns block time remaining string */
export function blockTimeRemaining(blockedUntil: string | null): string {
  if (!blockedUntil) return '';
  const diff = new Date(blockedUntil).getTime() - Date.now();
  if (diff <= 0) return 'Unblocking...';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.round((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/** Validate short-term job: max 5 hours */
export function validateShortTermHours(startTime: string, endTime: string): boolean {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const totalMins = (eh * 60 + em) - (sh * 60 + sm);
  return totalMins > 0 && totalMins <= 300; // 5 hours = 300 mins
}

/** Format date nicely */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Format time nicely */
export function formatTime(timeStr: string | null): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}
