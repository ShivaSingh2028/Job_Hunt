import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ShieldAlert, ShieldCheck, Eye, X, AlertTriangle, Briefcase, ExternalLink,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import type { PlatformUser, BlockDuration, AdminJob, AdminReport } from '../types';

export function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [search, setSearch] = useState('');
  const [blockedFilter, setBlockedFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [userDetails, setUserDetails] = useState<{ jobs: AdminJob[]; reports: AdminReport[] } | null>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockDuration, setBlockDuration] = useState<BlockDuration>('1_DAY');
  const [blockReason, setBlockReason] = useState('Repeated cancellations');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const filter = blockedFilter === 'ALL' ? undefined : blockedFilter === 'BLOCKED';
    const list = await adminService.getUsers(search, filter);
    setUsers(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [blockedFilter]);

  const handleOpenDetail = async (user: PlatformUser) => {
    setSelectedUser(user);
    const details = await adminService.getUserById(user.id);
    setUserDetails({ jobs: details.jobs, reports: details.reports });
  };

  const handleBlockUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const updated = await adminService.blockUser(selectedUser.id, blockDuration, blockReason);
      setSelectedUser(updated);
      setBlockModalOpen(false);
      fetchUsers();
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const updated = await adminService.unblockUser(selectedUser.id);
      setSelectedUser(updated);
      fetchUsers();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">User Directory</h1>
          <p className="text-sm text-slate-400 mt-1">Audit students, monitor cancellation strikes, and enforce restrictions</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name or campus email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'ACTIVE', 'BLOCKED'].map((f) => (
            <button
              key={f}
              onClick={() => setBlockedFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                blockedFilter === f
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f === 'ACTIVE' ? 'Active Only' : f === 'BLOCKED' ? 'Blocked Only' : 'All Students'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/80 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400 tracking-wider">
            <tr>
              <th className="py-3.5 px-6">Student</th>
              <th className="py-3.5 px-6">Current Mode</th>
              <th className="py-3.5 px-6">Cancellation Strikes</th>
              <th className="py-3.5 px-6">Account Status</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  No users found matching query.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet-950 border border-violet-700/40 flex items-center justify-center font-bold text-xs text-violet-300">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white leading-tight">{u.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      u.activeMode === 'SEEKER' ? 'bg-sky-950 text-sky-400 border border-sky-800/40' : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                    }`}>
                      {u.activeMode}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 font-semibold text-xs ${
                      u.cancellationCount >= 3
                        ? 'text-rose-400 font-bold'
                        : u.cancellationCount === 2
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}>
                      {u.cancellationCount} / 3 strikes
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {u.isBlocked ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800/50">
                        <ShieldAlert className="w-3 h-3" />
                        Blocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                        <ShieldCheck className="w-3 h-3" />
                        Good Standing
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleOpenDetail(u)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Detail Drawer / Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-xl bg-slate-950 border-l border-slate-800 h-full p-8 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedUser.name}</h2>
                <p className="text-xs text-slate-400">{selectedUser.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/users/${selectedUser.id}`)}
                  className="px-2.5 py-1 text-xs font-semibold text-violet-300 hover:text-white bg-violet-950/60 border border-violet-800/50 rounded-lg flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Full Dossier
                </button>
                <button
                  onClick={() => { setSelectedUser(null); setUserDetails(null); }}
                  className="p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400 uppercase font-semibold">Active Mode</p>
                <p className="text-lg font-bold text-white mt-1">{selectedUser.activeMode}</p>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400 uppercase font-semibold">Cancellations</p>
                <p className={`text-lg font-bold mt-1 ${selectedUser.cancellationCount >= 3 ? 'text-rose-400' : 'text-white'}`}>
                  {selectedUser.cancellationCount} / 3 Strikes
                </p>
              </div>
            </div>

            {/* Block / Unblock Actions */}
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Account Status</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedUser.isBlocked
                      ? `Blocked until: ${new Date(selectedUser.blockedUntil!).toLocaleString()}`
                      : 'Account is in good standing.'}
                  </p>
                </div>
                {selectedUser.isBlocked ? (
                  <button
                    onClick={handleUnblockUser}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Unblock User
                  </button>
                ) : (
                  <button
                    onClick={() => setBlockModalOpen(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Block User
                  </button>
                )}
              </div>
            </div>

            {/* Posted Jobs */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-violet-400" />
                Gigs Posted by Student ({userDetails?.jobs.length || 0})
              </h3>
              {userDetails?.jobs.length === 0 ? (
                <p className="text-xs text-slate-500 bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">
                  No gigs posted yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {userDetails?.jobs.map((job) => (
                    <div key={job.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-white">{job.title}</p>
                        <p className="text-slate-400">₹{job.pay} ({job.payUnit}) · Status: {job.status}</p>
                      </div>
                      <span className="text-[11px] text-violet-400 font-mono">{job.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reports Filed */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Reports Associated ({userDetails?.reports.length || 0})
              </h3>
              {userDetails?.reports.length === 0 ? (
                <p className="text-xs text-slate-500 bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">
                  Clean record — no reports filed.
                </p>
              ) : (
                <div className="space-y-2">
                  {userDetails?.reports.map((rep) => (
                    <div key={rep.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="font-semibold text-amber-300">{rep.reason}</span>
                        <span className="text-slate-400 font-mono">{rep.status}</span>
                      </div>
                      <p className="text-slate-300">{rep.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {blockModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Block Student Account</h3>
            <p className="text-xs text-slate-400">
              Blocked users cannot accept gigs or post new listings. They can still log in and view.
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
                onClick={handleBlockUser}
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
