import React from 'react';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, CheckCircle2, FileText, Download } from 'lucide-react';

export const ReportsAnalytics: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">Safety Reports & Biometric Analytics</h2>
          <p className="text-xs text-slate-500">
            Longitudinal fatigue risk patterns, blink distribution, and PERCLOS safety compliance.
          </p>
        </div>
        <button
          onClick={() => alert("Report downloaded: ROADGUARD_Safety_Compliance_Audit.pdf")}
          className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5 self-start"
        >
          <Download className="w-4 h-4" />
          Export Compliance PDF
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Average PERCLOS</span>
          <p className="text-2xl font-black text-emerald-600">4.2%</p>
          <span className="text-[11px] text-slate-500">Benchmark: &lt; 12.0% safe operational limit</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Blink Rate Distribution</span>
          <p className="text-2xl font-black text-navy-900">16.4 / min</p>
          <span className="text-[11px] text-slate-500">Normal healthy range (12 - 20 bpm)</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Fleet Safety Index</span>
          <p className="text-2xl font-black text-blue-600">97.8 / 100</p>
          <span className="text-[11px] text-emerald-600 font-semibold">+1.4% improvement this month</span>
        </div>
      </div>

      {/* Hourly Risk Distribution Analysis */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-navy-900 uppercase tracking-wider">
          Fatigue Incidence vs Time of Driving Shift
        </h3>
        <p className="text-xs text-slate-500">
          Distribution of Level 1 and Level 2 warning cues across hours into driver shifts.
        </p>

        {/* Visual Bar Breakdown */}
        <div className="space-y-3 pt-2">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
              <span>0h - 2h (Initial Shift)</span>
              <span className="font-bold text-emerald-600">0.8% Incidence (Ultra Safe)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '8%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
              <span>2h - 4h (Mid Shift)</span>
              <span className="font-bold text-blue-600">3.4% Incidence (Normal)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: '22%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
              <span>4h - 6h (Extended Shift)</span>
              <span className="font-bold text-amber-600">8.9% Incidence (Elevated Risk)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '48%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
              <span>6h+ (Critical Drowsiness Window)</span>
              <span className="font-bold text-red-600">18.2% Incidence (Mandatory Break Required)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="bg-red-500 h-full rounded-full" style={{ width: '82%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

