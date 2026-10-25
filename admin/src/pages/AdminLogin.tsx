import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAdminAuthStore } from '../store/adminAuthStore';

export function AdminLogin() {
  const [email, setEmail] = useState('admin@jobhunt.campus');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const { login } = useAdminAuthStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      navigate('/');
    } else {
      setError('Invalid admin credentials. Use admin@jobhunt.campus / admin123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="JobHunt Logo" className="w-16 h-16 rounded-2xl mx-auto shadow-lg shadow-violet-600/30 mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Console</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to moderate the JobHunt platform</p>
        </div>

        {error && (
          <div className="bg-rose-950/50 border border-rose-800 text-rose-300 text-xs p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition shadow-lg shadow-violet-600/25"
          >
            Access Console
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
