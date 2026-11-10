import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { ApiService } from '../services/api';

interface LoginProps {
  onSuccess: (token: string, user: { email: string; full_name: string; role: string }) => void;
  onNavigateRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onNavigateRegister }) => {
  const [email, setEmail] = useState<string>('driver@roadguard.ai');
  const [password, setPassword] = useState<string>('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await ApiService.login(email, password);
      localStorage.setItem('roadguard_token', res.access_token);
      onSuccess(res.access_token, {
        email: res.email,
        full_name: res.full_name,
        role: res.role
      });
    } catch (err: unknown) {
      setError((err as Error).message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-navy-900 p-8 text-center text-white">
          <div className="w-12 h-12 mx-auto rounded-xl bg-blue-600/30 flex items-center justify-center text-blue-400 mb-3 border border-blue-500/30">
            <Shield className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">ROADGUARD AI</h2>
          <p className="text-xs text-slate-300 mt-1">Driver & Fleet Security Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="driver@roadguard.ai"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Pre-configured demo account: driver@roadguard.ai / password123</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Driver Console'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-600">New driver or fleet manager? </span>
            <button
              type="button"
              onClick={onNavigateRegister}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

