import React, { useState } from 'react';
import { Shield, Lock, Mail, User, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { ApiService } from '../services/api';

interface RegisterProps {
  onSuccess: (token: string, user: { email: string; full_name: string; role: string }) => void;
  onNavigateLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSuccess, onNavigateLogin }) => {
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await ApiService.register({
        full_name: fullName,
        email,
        phone_number: phone,
        password
      });
      localStorage.setItem('roadguard_token', res.access_token);
      onSuccess(res.access_token, {
        email: res.email,
        full_name: res.full_name,
        role: res.role
      });
    } catch (err: unknown) {
      setError((err as Error).message || 'Registration failed');
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
          <h2 className="text-2xl font-black tracking-tight text-white">Driver Registration</h2>
          <p className="text-xs text-slate-300 mt-1">Enroll into RoadGuard Safety Monitoring</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. David Miller"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="david@transport.com"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
              Mobile Phone
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
              Password (min 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-600">Already registered? </span>
            <button
              type="button"
              onClick={onNavigateLogin}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

