import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShieldAlert, ShieldCheck, Briefcase, AlertTriangle, Calendar, Phone, Mail,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import type { PlatformUser, AdminJob, AdminReport, BlockDuration } from '../types';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<PlatformUser | null>(null);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Block modal
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockDuration, setBlockDuration] = useState<BlockDuration>('1_DAY');
  const [blockReason, setBlockReason] = useState('Multiple no-shows / Policy violation');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUser = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await adminService.getUserById(id);
      setUser(data.user);
      setJobs(data.jobs);
      setReports(data.reports);
    } catch {
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleBlock = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const updated = await adminService.blockUser(user.id, blockDuration, blockReason);
      setUser(updated);
      setBlockModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const updated = await adminService.unblockUser(user.id);
      setUser(updated);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Loading user dossier...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/users')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to User Directory
      </button>

      {/* Main Profile Header Card */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-violet-950 border border-violet-700/50 flex items-center justify-center font-extrabold text-2xl text-violet-300 shadow-inner">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                user.activeMode === 'SEEKER'
                  ? 'bg-sky-950 text-sky-400 border border-sky-800/40'
                  : 'bg-amber-950 text-amber-400 border border-amber-800/40'
              }`}>
                {user.activeMode} MODE
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
              {user.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {user.phone}</span>}
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {user.isBlocked ? (
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Blocked
              </span>
              <button
                onClick={handleUnblock}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
              >
                Unblock Account
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Active
              </span>
              <button
                onClick={() => setBlockModalOpen(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition"
              >
                Block Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs uppercase font-semibold text-slate-400">Cancellation Record</p>
          <p className={`text-2xl font-bold mt-1 ${user.cancellationCount >= 3 ? 'text-rose-400' : 'text-white'}`}>
            {user.cancellationCount} / 3 Strikes
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {user.cancellationCount === 2 ? '⚠️ Next cancellation triggers 24h block' : '3 strikes resets after 24h suspension'}
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs uppercase font-semibold text-slate-400">Gigs Accepted</p>
          <p className="text-2xl font-bold text-sky-400 mt-1">{user.totalJobsAccepted}</p>
          <p className="text-xs text-slate-500 mt-1">Completed campus gigs</p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs uppercase font-semibold text-slate-400">Gigs Posted</p>
          <p className="text-2xl font-bold text-violet-400 mt-1">{user.totalJobsPosted}</p>
          <p className="text-xs text-slate-500 mt-1">Recruiter listings created</p>
        </div>
      </div>

      {/* Posted Gigs List */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-violet-400" />
          Job Listings Posted by Student ({jobs.length})
        </h2>
        {jobs.length === 0 ? (
          <p className="text-xs text-slate-500 p-4 bg-slate-900/40 rounded-xl">No job listings posted yet.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {jobs.map(j => (
              <div key={j.id} className="py-3.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-white text-sm">{j.title}</p>
                  <p className="text-slate-400 mt-0.5">
                    ₹{j.pay} ({j.payUnit}) · {j.filledCount}/{j.openings} claimed · {j.isRemote ? 'Remote' : j.location.label}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-violet-950 text-violet-300 border border-violet-800/40">
                    {j.type}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-900 text-slate-300 border border-slate-800">
                    {j.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reports Associated */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Reports Involving Student ({reports.length})
        </h2>
        {reports.length === 0 ? (
          <p className="text-xs text-slate-500 p-4 bg-slate-900/40 rounded-xl">No reports on file for this student.</p>
        ) : (
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-950 text-amber-400 border border-amber-800/50">
                    {r.reason}
                  </span>
                  <span className="text-slate-400 font-mono">{r.status}</span>
                </div>
                <p className="text-slate-200">"{r.description}"</p>
                {r.adminNote && (
                  <p className="text-violet-300 bg-violet-950/30 p-2.5 rounded-lg border border-violet-800/30">
                    <strong>Admin Note:</strong> {r.adminNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Block Confirmation Modal */}
      {blockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Block Student Account</h3>
            <p className="text-xs text-slate-400">
              Blocked students cannot accept gigs or post new listings. Viewing remains available.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Duration</label>
              <select
                value={blockDuration}
                onChange={(e) => setBlockDuration(e.target.value as BlockDuration)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="1_DAY">1 Day (Standard Strike Suspension)</option>
                <option value="3_DAYS">3 Days</option>
                <option value="7_DAYS">7 Days</option>
                <option value="30_DAYS">30 Days</option>
                <option value="PERMANENT">Permanent Expulsion</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reason</label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setBlockModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
              >
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
