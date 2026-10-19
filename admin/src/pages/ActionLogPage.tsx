import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import type { ActionLogItem, AdminAction } from '../types';

export function ActionLogPage() {
  const [logs, setLogs] = useState<ActionLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  useEffect(() => {
    adminService.getActionLogs().then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const actionBadgeMap: Record<AdminAction, { label: string; color: string }> = {
    BLOCK_USER: { label: 'BLOCK USER', color: 'bg-rose-950 text-rose-400 border-rose-800' },
    UNBLOCK_USER: { label: 'UNBLOCK USER', color: 'bg-emerald-950 text-emerald-400 border-emerald-800' },
    REMOVE_JOB: { label: 'REMOVE JOB', color: 'bg-amber-950 text-amber-400 border-amber-800' },
    RESOLVE_REPORT: { label: 'RESOLVE REPORT', color: 'bg-sky-950 text-sky-400 border-sky-800' },
    LOGIN: { label: 'ADMIN LOGIN', color: 'bg-violet-950 text-violet-400 border-violet-800' },
  };

  const filteredLogs = logs.filter(log =>
    actionFilter === 'ALL' ? true : log.action === actionFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Audit Trail & Action Log</h1>
          <p className="text-sm text-slate-400 mt-1">Immutable administrative record of moderations, user blocks, and resolved incidents</p>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
        >
          <option value="ALL">All Actions</option>
          <option value="BLOCK_USER">Block User Only</option>
          <option value="UNBLOCK_USER">Unblock User Only</option>
          <option value="REMOVE_JOB">Remove Job Only</option>
          <option value="RESOLVE_REPORT">Resolve Report Only</option>
        </select>
      </div>

      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/80 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400 tracking-wider">
            <tr>
              <th className="py-3.5 px-6">Timestamp</th>
              <th className="py-3.5 px-6">Moderator</th>
              <th className="py-3.5 px-6">Action Performed</th>
              <th className="py-3.5 px-6">Target Entity</th>
              <th className="py-3.5 px-6">Administrative Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">Loading audit trail...</td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">No actions recorded.</td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const badge = actionBadgeMap[log.action] || { label: log.action, color: 'bg-slate-900 text-slate-400' };
                return (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-medium text-white text-xs">
                      {log.adminName}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs font-mono text-slate-300">
                      {log.targetType}{log.targetId ? `: ${log.targetId}` : ''}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-300 max-w-xs">
                      {log.note || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
