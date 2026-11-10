import React, { useState, useEffect } from 'react';
import { Activity, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { ApiService } from '../services/api';
import { MonitoringSession } from '../types';

export const DetectionHistory: React.FC = () => {
  const [sessions, setSessions] = useState<MonitoringSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHistory = () => {
    setLoading(true);
    ApiService.getMonitoringHistory()
      .then((data) => setSessions(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">Monitoring & Detection Log</h2>
          <p className="text-xs text-slate-500">Historical trips, durations, and AI frame metrics.</p>
        </div>
        <button
          onClick={fetchHistory}
          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Session ID</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Started At</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Frames Analyzed</th>
                <th className="py-3 px-4">Warnings</th>
                <th className="py-3 px-4">Critical Flags</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-navy-900">{s.session_id}</td>
                  <td className="py-3 px-4 font-semibold uppercase text-slate-600">{s.device_type}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {new Date(s.started_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">
                    {Math.round(s.duration_seconds / 60)} min {Math.round(s.duration_seconds % 60)}s
                  </td>
                  <td className="py-3 px-4 font-mono">{s.total_frames}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-amber-600">{s.warning_count}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-red-600">{s.critical_count}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === 'completed'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No monitoring sessions recorded yet. Start a session from Live Monitoring.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

