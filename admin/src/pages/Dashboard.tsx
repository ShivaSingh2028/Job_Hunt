import React, { useEffect, useState } from 'react';
import {
  Users, Briefcase, AlertTriangle, ShieldAlert, CheckCircle2, TrendingUp, Clock,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import { adminService } from '../services/adminService';
import type { DashboardStats } from '../types';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboardStats().then(s => {
      setStats(s);
      setLoading(false);
    });
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Loading metrics...
      </div>
    );
  }

  const kpis = [
    { label: 'Total Users', value: stats.totalUsers, change: '+14% this week', icon: Users, color: 'text-violet-400', bg: 'bg-violet-950/40 border-violet-800/40' },
    { label: 'Active Gigs', value: stats.activeJobs, change: '14 in 5km radius', icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-800/40' },
    { label: 'Pending Reports', value: stats.pendingReports, change: 'Needs action', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-800/40' },
    { label: 'Blocked Accounts', value: stats.blockedUsers, change: '3 strikes or manual', icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-rose-950/40 border-rose-800/40' },
  ];

  const typeData = [
    { name: 'Short-term (≤5h)', value: stats.jobsByType.SHORT_TERM, color: '#f59e0b' },
    { name: 'Long-term (1-2 mo)', value: stats.jobsByType.LONG_TERM, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Overview</h1>
        <p className="text-sm text-slate-400 mt-1">Real-time health, job creation volume, and moderation queue</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`p-5 rounded-2xl border ${kpi.bg} backdrop-blur flex items-center justify-between shadow-sm`}
            >
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                <p className="text-3xl font-extrabold text-white mt-1.5">{kpi.value}</p>
                <p className="text-xs text-slate-400 mt-1">{kpi.change}</p>
              </div>
              <div className={`p-3 rounded-xl bg-slate-900/80 border border-slate-800 ${kpi.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Gigs Volume */}
        <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">Jobs Posted This Week</h2>
              <p className="text-xs text-slate-400 mt-0.5">Aggregated daily student postings</p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full">
              +28% vs last week
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.jobsThisWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Job Types Distribution */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Job Type Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Ratio of short-term vs long-term gigs</p>
          </div>
          <div className="h-52 my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {typeData.map((t) => (
              <div key={t.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }}></span>
                  <span className="text-slate-300">{t.name}</span>
                </div>
                <span className="font-bold text-white">{t.value} ({Math.round((t.value / stats.totalJobs) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
