import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, X, Check, PhoneCall } from 'lucide-react';
import { ApiService } from '../services/api';
import { audioAlertSystem } from '../services/audioAlerts';

interface SOSModalProps {
  isOpen: boolean;
  sessionId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({ isOpen, sessionId, onClose, onSuccess }) => {
  const [step, setStep] = useState<'confirm' | 'countdown' | 'sent'>('confirm');
  const [countdown, setCountdown] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    let timer: number;
    if (step === 'countdown' && countdown > 0) {
      timer = window.setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (step === 'countdown' && countdown === 0) {
      triggerConfirmedSOS();
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const startCountdown = () => {
    setCountdown(5);
    setStep('countdown');
    audioAlertSystem.playCriticalAlarm();
  };

  const cancelCountdown = () => {
    setStep('confirm');
    setCountdown(5);
    onClose();
  };

  const triggerConfirmedSOS = async () => {
    setIsSubmitting(true);
    try {
      await ApiService.triggerSOS(sessionId, notes || 'Manual Driver SOS Activated');
      audioAlertSystem.triggerAlert('sos');
      setStep('sent');
      setTimeout(() => {
        onSuccess();
        onClose();
        setStep('confirm');
      }, 2500);
    } catch (e) {
      console.error('Failed to dispatch SOS:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-red-500 overflow-hidden">
        {step === 'confirm' && (
          <div>
            <div className="bg-red-600 text-white p-6 text-center">
              <div className="inline-flex p-3 bg-white/20 rounded-full mb-3">
                <ShieldAlert className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">Request Emergency Assistance</h3>
              <p className="text-red-100 text-xs mt-1">
                This transmits an immediate alert to your designated emergency contacts.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Optional Situation Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Extreme fatigue, vehicle issue on I-95"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="p-3 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800">
                  You will have 5 seconds to cancel after confirmation to prevent accidental alarms.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={startCountdown}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  Activate SOS
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'countdown' && (
          <div className="p-8 text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-red-100 border-4 border-red-500 flex items-center justify-center animate-pulse">
              <span className="text-4xl font-extrabold text-red-600">{countdown}</span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">Broadcasting Emergency SOS...</h3>
              <p className="text-sm text-slate-600 mt-1">
                Dispatching in {countdown} seconds unless cancelled.
              </p>
            </div>

            <button
              onClick={cancelCountdown}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-base shadow-lg transition"
            >
              Cancel Accidental SOS
            </button>
          </div>
        )}

        {step === 'sent' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">SOS Transmitted</h3>
            <p className="text-sm text-slate-600">
              Emergency contacts have been notified with high-priority push notification and telemetry.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

