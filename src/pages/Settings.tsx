import React, { useState } from 'react';
import { Settings as SettingsIcon, Sliders, Volume2, Shield, Bell, Save, RotateCcw, CheckCircle } from 'lucide-react';
import { audioAlertSystem } from '../services/audioAlerts';

export const SettingsPage: React.FC = () => {
  const [earThresh, setEarThresh] = useState<number>(0.22);
  const [marThresh, setMarThresh] = useState<number>(0.65);
  const [headPitchThresh, setHeadPitchThresh] = useState<number>(-18.0);
  const [warningCooldown, setWarningCooldown] = useState<number>(5);
  const [speechAlerts, setSpeechAlerts] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = () => {
    setEarThresh(0.22);
    setMarThresh(0.65);
    setHeadPitchThresh(-18.0);
    setWarningCooldown(5);
    setSpeechAlerts(true);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-extrabold text-navy-900">System Safety & Threshold Parameters</h2>
        <p className="text-xs text-slate-500">Fine-tune computer vision sensitivity, audio alarms, and privacy policies.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Parameters calibrated and saved successfully.</span>
          </div>
        )}

        {/* Vision Algorithm Thresholds */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-navy-900 uppercase tracking-wider">
              Computer Vision Biometric Thresholds
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Eye Aspect Ratio (EAR) Threshold</span>
                <span className="font-mono text-blue-600">{earThresh.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.15"
                max="0.30"
                step="0.01"
                value={earThresh}
                onChange={(e) => setEarThresh(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Lower value increases tolerance for narrow eyes or glasses; higher values trigger earlier alerts.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Mouth Aspect Ratio (MAR) Yawn Threshold</span>
                <span className="font-mono text-blue-600">{marThresh.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.80"
                step="0.01"
                value={marThresh}
                onChange={(e) => setMarThresh(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Distinguishes conversational speech phonemes from sustained involuntary yawning.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Head Dropping Pitch Angle (Degrees)</span>
                <span className="font-mono text-blue-600">{headPitchThresh.toFixed(1)}°</span>
              </div>
              <input
                type="range"
                min="-30"
                max="-10"
                step="1"
                value={headPitchThresh}
                onChange={(e) => setHeadPitchThresh(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Pitch tilt indicating driver head nodding down into the chest.
              </p>
            </div>
          </div>
        </div>

        {/* Audio Alerts & Speech Options */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Volume2 className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-navy-900 uppercase tracking-wider">
              Audio Chimes & Voice Dispatch
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Spoken Voice Warnings (TTS)</h4>
                <p className="text-[11px] text-slate-500">
                  Speaks urgent verbal commands ("PLEASE STAY ALERT", "DANGER! TAKE A SAFE BREAK")
                </p>
              </div>
              <input
                type="checkbox"
                checked={speechAlerts}
                onChange={(e) => setSpeechAlerts(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Alert Cooldown Interval (Seconds)</span>
                <span className="font-mono text-blue-600">{warningCooldown}s</span>
              </div>
              <input
                type="range"
                min="3"
                max="15"
                step="1"
                value={warningCooldown}
                onChange={(e) => setWarningCooldown(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Suppresses repetitive duplicate chimes within this cooldown window.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};

