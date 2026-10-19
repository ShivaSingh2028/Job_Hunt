import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, Flag, History, LogOut, Shield,
} from 'lucide-react';
import { useAdminAuthStore } from '../../store/adminAuthStore';

export function AdminLayout() {
  const { admin, logout } = useAdminAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/users', label: 'User Directory', icon: Users },
    { to: '/jobs', label: 'Job Moderation', icon: Briefcase },
    { to: '/reports', label: 'Reports Queue', icon: Flag },
    { to: '/logs', label: 'Audit Trail', icon: History },
  ];

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between">
        <div>
          {/* Logo Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
            <img src="/logo.png" alt="JobHunt Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-violet-600/30 object-contain" />
            <div>
              <h1 className="font-bold text-lg text-white leading-tight">JobHunt</h1>
              <p className="text-xs text-violet-400 font-semibold uppercase tracking-wider">Campus Admin</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Admin User Footer */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-violet-900/60 border border-violet-500/30 flex items-center justify-center font-bold text-xs text-violet-300">
                SC
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-200 leading-tight">{admin?.name}</p>
                <p className="text-[10px] text-slate-500">{admin?.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 border border-rose-900/40 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-900">
        <header className="h-16 bg-slate-950/60 border-b border-slate-800 px-8 flex items-center justify-between backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-medium text-slate-400">Environment: <strong className="text-slate-200">Local Campus Demo (Mock Mode)</strong></span>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-950/80 border border-violet-600/40 text-violet-300">
              Admin Access: Unrestricted
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
