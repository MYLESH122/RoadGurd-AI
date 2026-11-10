import React from 'react';
import { Shield, Eye, AlertOctagon, Activity, Smartphone, Laptop, CheckCircle2, ArrowRight } from 'lucide-react';

interface SplashLandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const SplashLanding: React.FC<SplashLandingProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-navy-900 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center text-blue-400 font-black shadow-lg shadow-navy-900/10">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-navy-900">ROADGUARD</span>
              <span className="ml-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">AI</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onLogin}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-navy-900 transition"
            >
              Driver Login
            </button>
            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-md shadow-blue-600/20 transition flex items-center gap-2"
            >
              Launch Platform
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-bold text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Automotive AI Vision Technology
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-navy-900 leading-[1.1] tracking-tight">
            Stay Awake. <br />
            Stay Alert. <br />
            <span className="text-blue-600">Stay Safe.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
            Real-time computer vision driver safety monitoring. Evaluates Eye Aspect Ratio (EAR),
            Mouth Aspect Ratio (MAR), and 3D Head Pose to prevent fatigue-related road incidents
            with instant audible warnings and authorized emergency notifications.
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <button
              onClick={onGetStarted}
              className="px-6 py-3.5 bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-navy-900/20 transition flex items-center gap-2"
            >
              Start Live Camera Monitoring
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLogin}
              className="px-6 py-3.5 border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold text-sm rounded-xl transition"
            >
              Sign In to Fleet Portal
            </button>
          </div>

          <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200 text-xs">
            <div>
              <p className="font-extrabold text-navy-900 text-base">&lt; 350ms</p>
              <p className="text-slate-500">Alert Latency</p>
            </div>
            <div>
              <p className="font-extrabold text-navy-900 text-base">Zero Hardware</p>
              <p className="text-slate-500">Camera-Only Operation</p>
            </div>
            <div>
              <p className="font-extrabold text-navy-900 text-base">Multi-Platform</p>
              <p className="text-slate-500">Web, Android & iOS</p>
            </div>
          </div>
        </div>

        {/* Visual Showcase Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Vision Engine Active</span>
            </div>
            <span className="text-xs font-mono text-slate-500">640x480 @ 15fps</span>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <Eye className="w-6 h-6 text-blue-600" />
              <h3 className="font-bold text-sm text-navy-900">Eye Aspect Ratio</h3>
              <p className="text-xs text-slate-600">Calculates sub-millimeter eyelid aperture to distinguish blinks from microsleep.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <Activity className="w-6 h-6 text-blue-600" />
              <h3 className="font-bold text-sm text-navy-900">Yawn & Mouth Ratio</h3>
              <p className="text-xs text-slate-600">Monitors sustained lip displacement over temporal thresholds, filtering conversational speech.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <AlertOctagon className="w-6 h-6 text-red-600" />
              <h3 className="font-bold text-sm text-navy-900">Head Pose Estimation</h3>
              <p className="text-xs text-slate-600">3D solvePnP projection detects nod-offs, drooping chins, and severe driver distraction.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <Shield className="w-6 h-6 text-emerald-600" />
              <h3 className="font-bold text-sm text-navy-900">Audible & SOS Safeguard</h3>
              <p className="text-xs text-slate-600">Multi-tier audible chimes, spoken voice synthesis, and authorized emergency contact dispatch.</p>
            </div>
          </div>

          {/* Platforms Supported */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Laptop className="w-5 h-5 text-blue-700" />
              <Smartphone className="w-5 h-5 text-blue-700" />
              <span className="text-xs font-semibold text-blue-900">Unified Laptop Web, Android & iPhone Support</span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-slate-500">
          ROADGUARD AI Platform • Commercial Automotive Safety Technology • Zero continuous raw footage stored
        </div>
      </footer>
    </div>
  );
};

