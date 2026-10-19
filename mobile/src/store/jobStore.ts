import { create } from 'zustand';
import type { Job, JobFilters } from '../types';

interface JobState {
  jobs: Job[];
  savedJobs: Job[];
  filters: JobFilters;
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  setJobs: (jobs: Job[]) => void;
  setSavedJobs: (jobs: Job[]) => void;
  setFilters: (filters: JobFilters) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setUnreadCount: (n: number) => void;
  updateJob: (id: string, patch: Partial<Job>) => void;
}

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  savedJobs: [],
  filters: {},
  isLoading: false,
  error: null,
  unreadCount: 0,
  setJobs: (jobs) => set({ jobs }),
  setSavedJobs: (jobs) => set({ savedJobs: jobs }),
  setFilters: (filters) => set({ filters }),
  setLoading: (v) => set({ isLoading: v }),
  setError: (e) => set({ error: e }),
  setUnreadCount: (n) => set({ unreadCount: n }),
  updateJob: (id, patch) => set((s) => ({ jobs: s.jobs.map(j => j.id === id ? { ...j, ...patch } : j) })),
}));
