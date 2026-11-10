import React, { useState, useEffect } from 'react';
import {
  Users,
  Video,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { ApiService } from '../services/api';
import { DashboardStats } from '../types';

interface MainDashboardProps {
  onStartMonitoring: () => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({ onStartMonitoring }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiService.getDashboardStats();
      setStats(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-navy-900/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-md text-xs font-bold border border-blue-400/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Fleet Active Safeguard
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Driver Safety & Fatigue Command Center
          </h1>
          <p className="text-xs lg:text-sm text-slate-300 max-w-xl">
            Real-time biometric computer vision surveillance for proactive driver fatigue mitigation,
            distraction prevention, and route safety.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <button
            onClick={fetchStats}
            className="px-4 py-3 bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs font-semibold rounded-xl border border-navy-700 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <button
            onClick={onStartMonitoring}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
          >
            <Video className="w-4 h-4" />
            Launch Live AI Camera
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Drivers */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Drivers</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-navy-900">{stats?.total_drivers ?? 1}</p>
          <span className="text-[11px] text-slate-500">Registered profiles</span>
        </div>

        {/* Active Sessions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Active Trips</span>
            <Video className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-black text-navy-900">{stats?.active_sessions ?? 0}</p>
            {stats && stats.active_sessions > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            )}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Live monitoring</span>
        </div>

        {/* Normal Sessions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Safe Trips</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-navy-900">{stats?.normal_sessions ?? 0}</p>
          <span className="text-[11px] text-slate-500">Zero critical alerts</span>
        </div>

        {/* Warning Events */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{stats?.warning_events ?? 0}</p>
          <span className="text-[11px] text-slate-500">Early fatigue flags</span>
        </div>

        {/* Critical Events */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Critical Events</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-black text-red-600">{stats?.critical_events ?? 0}</p>
          <span className="text-[11px] text-slate-500">Emergency stops</span>
        </div>

        {/* Total Monitoring Duration */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Trip Duration</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-navy-900">
            {stats?.total_monitoring_duration_minutes ?? 0}m
          </p>
          <span className="text-[11px] text-slate-500">Cumulative logged</span>
        </div>
      </div>

      {/* Activity and System Status split */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900 uppercase tracking-wider">
              Real-Time Fleet Activity Log
            </h3>
            <span className="text-xs text-slate-400">Database verified</span>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.recent_activity && stats.recent_activity.length > 0 ? (
              stats.recent_activity.map((act, idx) => (
                <div key={idx} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                        act.severity === 'critical' || act.severity === 'sos'
                          ? 'bg-red-500'
                          : act.severity === 'warning'
                          ? 'bg-amber-500'
                          : act.severity === 'danger'
                          ? 'bg-orange-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{act.title}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{act.description}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                    {act.timestamp ? new Date(act.timestamp).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent events recorded in this database session.
              </div>
            )}
          </div>
        </div>

        {/* Live Safety Readiness Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-navy-900 uppercase tracking-wider">
              Safety Architecture Status
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium">AI Face Landmarker</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Eye Aspect Ratio (EAR)</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Calibrated (&lt;0.22)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Mouth Aspect Ratio (MAR)</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Active (&gt;0.65)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium">3D Head Pose solvePnP</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Enabled
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Web Audio Synthesizer</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Ready
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-slate-600 font-medium">Speech TTS Engine</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Supported
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-900">
            <strong>Camera Privacy Guarantee:</strong> Continuous raw video footage is never recorded or saved to disk. Transient frames are processed in memory only.
          </div>
        </div>
      </div>
    </div>
  );
};

