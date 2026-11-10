import React, { useState } from 'react';
import { Volume2, VolumeX, AlertTriangle, AlertOctagon, BellRing, X, CheckCircle2 } from 'lucide-react';
import { audioAlertSystem } from '../services/audioAlerts';

interface AudioTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioTestModal: React.FC<AudioTestModalProps> = ({ isOpen, onClose }) => {
  const [volume, setVolume] = useState<number>(0.9);
  const [lastTested, setLastTested] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioAlertSystem.setVolume(val);
  };

  const testWarning = () => {
    audioAlertSystem.unlockAudio();
    audioAlertSystem.testAudioLevel('warning');
    setLastTested('Level 1: 3-Pulse Warning Chime + Voice "PLEASE STAY ALERT."');
  };

  const testDanger = () => {
    audioAlertSystem.unlockAudio();
    audioAlertSystem.testAudioLevel('danger');
    setLastTested('Level 2: Danger Alarm + Voice "WARNING! SIGNS OF DRIVER FATIGUE DETECTED"');
  };

  const testCritical = () => {
    audioAlertSystem.unlockAudio();
    audioAlertSystem.testAudioLevel('critical');
    setLastTested('Level 3: Critical Siren + Voice "DANGER! PLEASE STOP AT A SAFE PLACE"');
  };

  const testUnconscious = () => {
    audioAlertSystem.unlockAudio();
    audioAlertSystem.triggerUnconsciousAlert("Driver Unresponsive / Fainted (மயக்கம்)");
    setLastTested('Unconsciousness: Emergency Alarm + Voice "CRITICAL EMERGENCY! DRIVER UNRESPONSIVE! PLEASE WAKE UP!"');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 rounded-lg text-blue-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Audio & Voice Alert Verification</h3>
              <p className="text-xs text-slate-300">Mandatory hardware safety check prior to trip</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              System Volume Level: {Math.round(volume * 100)}%
            </label>
            <div className="flex items-center gap-4">
              <VolumeX className="w-4 h-4 text-slate-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <Volume2 className="w-4 h-4 text-blue-600" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Test Alert Levels
            </label>

            {/* Level 1 */}
            <div className="flex items-center justify-between p-3.5 border border-amber-200 bg-amber-50/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-md">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-slate-900">Level 1: Warning Alert</h4>
                  <p className="text-xs text-slate-600">Soft chime + "PLEASE STAY ALERT."</p>
                </div>
              </div>
              <button
                onClick={testWarning}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md shadow-sm transition"
              >
                Play Test
              </button>
            </div>

            {/* Level 2 */}
            <div className="flex items-center justify-between p-3.5 border border-orange-200 bg-orange-50/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-700 rounded-md">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-slate-900">Level 2: Danger Alert</h4>
                  <p className="text-xs text-slate-600">Pulsing alarm + Break voice prompt</p>
                </div>
              </div>
              <button
                onClick={testDanger}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-md shadow-sm transition"
              >
                Play Test
              </button>
            </div>

            {/* Level 3 */}
            <div className="flex items-center justify-between p-3.5 border border-red-200 bg-red-50/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-700 rounded-md">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-slate-900">Level 3: Critical Alarm</h4>
                  <p className="text-xs text-slate-600">High siren + Emergency voice directive</p>
                </div>
              </div>
              <button
                onClick={testCritical}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md shadow-sm transition"
              >
                Play Test
              </button>
            </div>

            {/* Level 4: Medical Emergency / Unconsciousness */}
            <div className="flex items-center justify-between p-3.5 border border-purple-200 bg-purple-50/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-md">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-slate-900">Unconsciousness / Fainting (மயக்கம்)</h4>
                  <p className="text-xs text-slate-600">Piercing alarm + "CRITICAL EMERGENCY! PLEASE WAKE UP!"</p>
                </div>
              </div>
              <button
                onClick={testUnconscious}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-md shadow-sm transition"
              >
                Play Test
              </button>
            </div>
          </div>

          {lastTested && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Verified: {lastTested}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium rounded-lg shadow transition"
          >
            Audio Confirmed & Ready
          </button>
        </div>
      </div>
    </div>
  );
};

