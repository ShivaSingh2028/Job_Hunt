import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Clock, Check } from 'lucide-react';
import { adminService } from '../services/adminService';
import type { AdminReport, ReportStatus } from '../types';

export function ReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [tab, setTab] = useState<ReportStatus>('PENDING');
  const [loading, setLoading] = useState(true);

  // Resolution modal
  const [activeReport, setActiveReport] = useState<AdminReport | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    const list = await adminService.getReports(tab);
    setReports(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [tab]);

  const handleResolve = async (status: ReportStatus) => {
    if (!activeReport) return;
    setActionLoading(true);
    try {
      await adminService.updateReport(activeReport.id, status, adminNote || 'Reviewed and addressed by admin.');
      setActiveReport(null);
      setAdminNote('');
      fetchReports();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Reports Queue</h1>
        <p className="text-sm text-slate-400 mt-1">Review student reports, investigate misconduct, and document resolutions</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        {[
          { key: 'PENDING', label: 'Pending Review', icon: Clock, countColor: 'bg-amber-950 text-amber-400 border-amber-800' },
          { key: 'REVIEWED', label: 'Under Review', icon: AlertCircle, countColor: 'bg-sky-950 text-sky-400 border-sky-800' },
          { key: 'RESOLVED', label: 'Resolved Archive', icon: CheckCircle2, countColor: 'bg-emerald-950 text-emerald-400 border-emerald-800' },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as ReportStatus)}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition ${
                isActive
                  ? 'border-violet-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <Check className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
            <p className="font-semibold text-slate-300">Queue is clear</p>
            <p className="text-xs text-slate-500 mt-1">No {tab.toLowerCase()} reports at this time.</p>
          </div>
        ) : (
          reports.map((r) => (
            <div
              key={r.id}
              className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-400 border border-amber-800/50">
                    {r.reason}
                  </span>
                  <span className="text-xs text-slate-400">
                    Target: <strong className="text-white">{r.targetType}: {r.targetTitle}</strong>
                  </span>
                  <span className="text-xs text-slate-500">
                    · {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
                  "{r.description}"
                </p>

                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Reported by:</span>
                  <strong className="text-slate-300">{r.reporter.name}</strong>
                  <span className="text-slate-500">({r.reporter.email})</span>
                </div>

                {r.adminNote && (
                  <div className="bg-violet-950/30 border border-violet-800/40 p-3 rounded-xl text-xs text-violet-300">
                    <p className="font-semibold text-violet-200">Admin Resolution Note ({r.resolvedBy}):</p>
                    <p className="mt-0.5 text-slate-300">{r.adminNote}</p>
                  </div>
                )}
              </div>

              {tab !== 'RESOLVED' && (
                <div className="flex md:flex-col justify-end gap-2 shrink-0">
                  <button
                    onClick={() => { setActiveReport(r); setAdminNote(r.adminNote || ''); }}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Action Report
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Resolution Modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Action Report</h3>
            <p className="text-xs text-slate-400">
              Provide an administrative note documenting the investigation or outcome.
            </p>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <p><strong className="text-white">Target:</strong> {activeReport.targetTitle}</p>
              <p><strong className="text-white">Issue:</strong> {activeReport.reason}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Action Note *</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="e.g. Investigated job requirements. Spoke with poster. Job removed."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveReport(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolve('REVIEWED')}
                disabled={actionLoading}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
              >
                Mark Under Review
              </button>
              <button
                onClick={() => handleResolve('RESOLVED')}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                Resolve Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
