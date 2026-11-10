import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, AlertOctagon, CheckCircle2, ShieldAlert, RefreshCw } from 'lucide-react';
import { ApiService } from '../services/api';
import { AlertEvent } from '../types';

export const AlertHistory: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAlerts = () => {
    setLoading(true);
    ApiService.getAlertsHistory()
      .then((data) => setAlerts(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await ApiService.acknowledgeAlert(alertId, 'Acknowledged via Alert History view');
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">Driver Alert & Emergency Log</h2>
          <p className="text-xs text-slate-500">
            Real-time record of Level 1 Warning, Level 2 Danger, Level 3 Critical, and SOS events.
          </p>
        </div>
        <button
          onClick={fetchAlerts}
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
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Trigger Reason</th>
                <th className="py-3 px-4">Fatigue Score</th>
                <th className="py-3 px-4">Emergency Dispatched</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {alerts.map((a) => {
                const isCritical = a.alert_level === 'critical' || a.alert_level === 'sos';
                const isWarning = a.alert_level === 'warning';
                return (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isCritical
                            ? 'bg-red-100 text-red-800'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {a.alert_level}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-xs">{a.trigger_reason}</td>
                    <td className="py-3 px-4 font-mono font-bold text-navy-900">{a.fatigue_score}/100</td>
                    <td className="py-3 px-4">
                      {a.emergency_contacts_notified ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Notified
                        </span>
                      ) : (
                        <span className="text-slate-400">Not queued</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {a.acknowledged ? (
                        <span className="text-slate-600 font-medium">Acknowledged</span>
                      ) : (
                        <span className="text-red-600 font-bold">Unacknowledged</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!a.acknowledged ? (
                        <button
                          onClick={() => handleAcknowledge(a.id)}
                          className="px-2.5 py-1 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded text-[11px] transition"
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Resolved</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No safety alerts recorded. All monitored sessions have operated within safe tolerances.
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

