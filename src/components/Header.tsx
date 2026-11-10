import React from 'react';
import { Shield, Bell, PhoneCall, Volume2, LogOut, User as UserIcon, AlertTriangle } from 'lucide-react';
import { audioAlertSystem } from '../services/audioAlerts';

interface HeaderProps {
  userEmail?: string;
  onOpenAudioTest: () => void;
  onOpenSOS: () => void;
  onLogout: () => void;
  activeSessionDuration?: string;
}

export const Header: React.FC<HeaderProps> = ({
  userEmail,
  onOpenAudioTest,
  onOpenSOS,
  onLogout,
  activeSessionDuration
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center text-blue-400 font-bold shadow-md shadow-navy-900/10">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-navy-900">ROADGUARD</span>
            <span className="ml-1 text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">AI</span>
          </div>
        </div>

        {activeSessionDuration && (
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-semibold text-slate-700">Trip Active:</span>
            <span className="font-mono text-xs font-bold text-navy-900 bg-slate-100 px-2 py-0.5 rounded">
              {activeSessionDuration}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Warning Sound Direct Test */}
        <button
          onClick={() => {
            audioAlertSystem.unlockAudio();
            audioAlertSystem.playWarningSound();
            setTimeout(() => audioAlertSystem.speak("PLEASE STAY ALERT."), 450);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition"
          title="Play Warning Beep + Voice Immediately"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Warning Sound</span>
        </button>

        {/* Audio Test Button */}
        <button
          onClick={onOpenAudioTest}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          title="Verify Siren & Speech Audio"
        >
          <Volume2 className="w-4 h-4 text-blue-600" />
          <span className="hidden sm:inline">Audio Check</span>
        </button>

        {/* SOS Button */}
        <button
          onClick={onOpenSOS}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>SOS</span>
        </button>

        {/* User Profile info */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            <UserIcon className="w-4 h-4" />
          </div>
          <span className="hidden lg:inline text-xs font-medium text-slate-700 max-w-[140px] truncate">
            {userEmail || 'driver@roadguard.ai'}
          </span>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-red-600 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

