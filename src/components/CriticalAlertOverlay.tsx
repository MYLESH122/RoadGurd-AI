import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle, Volume2 } from 'lucide-react';
import { AlertEvent, RiskLevel } from '../types';

interface CriticalAlertOverlayProps {
  alert: AlertEvent | null;
  riskLevel: RiskLevel;
  onAcknowledge: (alertId: string) => void;
}

export const CriticalAlertOverlay: React.FC<CriticalAlertOverlayProps> = ({
  alert,
  riskLevel,
  onAcknowledge
}) => {
  if (riskLevel === 'normal' || riskLevel === 'warning') {
    return null;
  }

  const isCritical = riskLevel === 'critical';

  return (
    <div className={`fixed inset-0 z-40 flex items-center justify-center p-4 backdrop-blur-md transition-all ${
      isCritical ? 'bg-red-950/80 animate-pulse' : 'bg-orange-950/70'
    }`}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border-4 border-red-600 p-8 text-center space-y-6">
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
          isCritical ? 'bg-red-100 text-red-600 animate-bounce' : 'bg-orange-100 text-orange-600'
        }`}>
          {isCritical ? <AlertOctagon className="w-12 h-12" /> : <AlertTriangle className="w-12 h-12" />}
        </div>

        <div className="space-y-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isCritical ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'
          }`}>
            {isCritical ? 'CRITICAL FATIGUE WARNING' : 'DANGER DETECTED'}
          </span>
          <h2 className="text-2xl font-black text-slate-900 uppercase">
            {isCritical ? 'Immediate Stop Required!' : 'Take A Safe Break Now'}
          </h2>
          <p className="text-sm font-medium text-slate-700">
            {alert?.trigger_reason || 'Severe prolonged eye closure or multiple high-risk indicators detected.'}
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2 text-red-700 font-semibold">
            <Volume2 className="w-4 h-4 animate-spin" />
            <span>Voice & Audio Alarm Actively Sounding</span>
          </div>
          <p>1. Safely pull over into a designated rest area or parking space.</p>
          <p>2. Acknowledge this alert only when the vehicle is in a safe condition.</p>
          {isCritical && (
            <p className="text-red-600 font-semibold">
              * Emergency contacts have been queued for notification.
            </p>
          )}
        </div>

        <button
          onClick={() => onAcknowledge(alert ? alert.id : 'manual_ack')}
          className={`w-full py-4 text-white font-black text-base uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
            isCritical
              ? 'bg-red-600 hover:bg-red-700 shadow-red-600/50'
              : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/50'
          }`}
        >
          <CheckCircle className="w-5 h-5 text-white" />
          I Am Alert & Awake — Reset to Normal (நான் விழிப்பாக இருக்கிறேன்)
        </button>
      </div>
    </div>
  );
};

