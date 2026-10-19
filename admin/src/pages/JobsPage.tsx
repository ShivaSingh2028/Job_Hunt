import { useEffect, useState } from 'react';
import { Search, Trash2, MapPin, List, Map } from 'lucide-react';
import { adminService } from '../services/adminService';
import type { AdminJob } from '../types';
import { JobsMapView } from '../components/jobs/JobsMapView';

export function JobsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'MAP'>('TABLE');
  const [loading, setLoading] = useState(true);

  // Remove modal
  const [removingJob, setRemovingJob] = useState<AdminJob | null>(null);
  const [removeReason, setRemoveReason] = useState('Violates campus guidelines / Spam');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    const list = await adminService.getJobs(search, statusFilter, typeFilter);
    setJobs(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, typeFilter]);

  const handleConfirmRemove = async () => {
    if (!removingJob) return;
    setActionLoading(true);
    try {
      await adminService.removeJob(removingJob.id, removeReason);
      setRemovingJob(null);
      fetchJobs();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Job Moderation</h1>
        <p className="text-sm text-slate-400 mt-1">Audit active campus listings, inspect openings, and remove fraudulent gigs</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by gig title or student poster..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Only</option>
            <option value="FILLED">Filled Only</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Type selector */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="SHORT_TERM">Short-Term (≤5h)</option>
            <option value="LONG_TERM">Long-Term (1-2 mo)</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'TABLE' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Table
            </button>
            <button
              onClick={() => setViewMode('MAP')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'MAP' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              Campus Map
            </button>
          </div>
        </div>
      </div>

      {/* Content: Map or Table */}
      {viewMode === 'MAP' ? (
        <JobsMapView jobs={jobs} onRemoveJob={setRemovingJob} />
      ) : (
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400 tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Gig Title & Description</th>
                <th className="py-3.5 px-6">Type & Location</th>
                <th className="py-3.5 px-6">Pay & Slots</th>
                <th className="py-3.5 px-6">Posted By</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading jobs...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No job posts found.
                  </td>
                </tr>
              ) : (
                jobs.map((job: AdminJob) => (
                  <tr key={job.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-4 px-6 max-w-xs">
                      <p className="font-semibold text-white leading-tight">{job.title}</p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{job.description}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        job.type === 'SHORT_TERM' ? 'bg-amber-950 text-amber-400 border border-amber-800/50' : 'bg-violet-950 text-violet-400 border border-violet-800/50'
                      }`}>
                        {job.type === 'SHORT_TERM' ? '⚡ Short-Term' : '📅 Long-Term'}
                      </span>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[150px]">{job.isRemote ? 'Remote' : job.location.label}</span>
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-violet-400 text-sm">₹{job.pay} <span className="text-xs text-slate-400 font-normal">({job.payUnit})</span></p>
                      <p className="text-xs text-slate-400 mt-0.5">{job.filledCount} / {job.openings} claimed</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-slate-200 text-xs">{job.postedBy.name}</p>
                      <p className="text-[11px] text-slate-500">{job.postedBy.email}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        job.status === 'OPEN' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' :
                        job.status === 'FILLED' ? 'bg-amber-950 text-amber-400 border border-amber-800/50' :
                        'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setRemovingJob(job)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition inline-flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {removingJob && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Remove Job Listing</h3>
            <p className="text-xs text-slate-400">
              Removing "{removingJob.title}" will unpublish it immediately and cancel any pending claims.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Removal</label>
              <input
                type="text"
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRemovingJob(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
