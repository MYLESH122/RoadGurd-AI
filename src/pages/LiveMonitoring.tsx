import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Play,
  Square,
  AlertTriangle,
  AlertOctagon,
  Eye,
  Activity,
  Compass,
  Shield,
  Volume2,
  RefreshCw,
  PhoneCall,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useWebcam } from '../hooks/useWebcam';
import { MonitoringWebSocket } from '../services/websocket';
import { ApiService } from '../services/api';
import { audioAlertSystem } from '../services/audioAlerts';
import { DetectionResult, AlertEvent, RiskLevel } from '../types';
import { CriticalAlertOverlay } from '../components/CriticalAlertOverlay';
import { SOSModal } from '../components/SOSModal';
import { AudioTestModal } from '../components/AudioTestModal';

interface LiveMonitoringProps {
  onSessionStateChange?: (active: boolean, durationStr: string) => void;
}

export const LiveMonitoring: React.FC<LiveMonitoringProps> = ({ onSessionStateChange }) => {
  const { videoRef, isActive: isCameraActive, error: cameraError, startCamera, stopCamera, captureFrameBase64 } = useWebcam({
    width: 640,
    height: 480,
    fps: 15
  });

  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [currentAlert, setCurrentAlert] = useState<AlertEvent | null>(null);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('normal');
  const [activeDurationSec, setActiveDurationSec] = useState<number>(0);
  const [fpsCounter, setFpsCounter] = useState<number>(0);
  const [acknowledgedMessage, setAcknowledgedMessage] = useState<string | null>(null);

  // Modals
  const [isSOSOpen, setIsSOSOpen] = useState<boolean>(false);
  const [isAudioTestOpen, setIsAudioTestOpen] = useState<boolean>(false);

  // Active refs
  const wsRef = useRef<MonitoringWebSocket | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const frameCounterRef = useRef<number>(0);
  const ackCooldownRef = useRef<number>(0);

  // Formatting duration string
  const formatDuration = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start Monitoring Session
  const handleStartMonitoring = async () => {
    try {
      audioAlertSystem.unlockAudio();
      await startCamera();
      const session = await ApiService.startMonitoring('web');
      setSessionId(session.session_id);
      setIsMonitoring(true);
      setActiveDurationSec(0);

      // Initialize WebSocket connection
      const ws = new MonitoringWebSocket(session.session_id);
      wsRef.current = ws;

      ws.onStatusChange = (status) => {
        setConnectionStatus(status);
      };

      ws.onDetection = (result, alert) => {
        setDetection(result);

        // Driver Grace Period Check:
        // If driver recently clicked "I Am Alert", maintain normal state during grace period
        if (Date.now() < ackCooldownRef.current) {
          setRiskLevel('normal');
          return;
        }

        // Automatic Physical Recovery:
        // When driver wakes up, opens eyes, and sits upright, automatically return to normal!
        if (result.eye_status === 'open' && !result.unconscious_detected && result.risk_level === 'normal') {
          setRiskLevel('normal');
          if (currentAlert && currentAlert.alert_level !== 'critical') {
            setCurrentAlert(null);
          }
          return;
        }

        setRiskLevel(result.risk_level);

        // 1. UNCONSCIOUSNESS / FAINTING (MAYAKKAM) EMERGENCY TRIGGER:
        if (result.unconscious_detected || (result.risk_level === 'critical' && result.unconscious_reason)) {
          audioAlertSystem.triggerUnconsciousAlert(result.unconscious_reason);
        } else {
          // 2. REAL-TIME EYE-TRACKING ALERT LOGIC:
          const closureSec = result.eye_closure_duration || 0;
          const isEyeClosed = result.eye_status === 'closed' || result.eye_status === 'prolonged_closed';

          // As soon as eyes are closed for >= 0.45s (filters involuntary blinks):
          if ((isEyeClosed && closureSec >= 0.45) || (result.risk_level !== 'normal' && isEyeClosed)) {
            const levelToPlay = closureSec >= 1.7 || result.risk_level === 'critical'
              ? 'critical'
              : closureSec >= 1.0 || result.risk_level === 'danger'
                ? 'danger'
                : 'warning';
            audioAlertSystem.triggerAlert(levelToPlay);
          }
        }

        if (alert) {
          setCurrentAlert(alert);
          if (alert.alert_level === 'critical' || alert.alert_level === 'danger' || alert.alert_level === 'warning') {
            audioAlertSystem.triggerAlert(alert.alert_level as 'warning' | 'danger' | 'critical');
          }
        }
      };

      ws.connect();

      // Start frame capture loop at ~12-15 FPS (every 70ms)
      frameCounterRef.current = 0;
      frameIntervalRef.current = window.setInterval(() => {
        const frameB64 = captureFrameBase64();
        if (frameB64 && wsRef.current) {
          wsRef.current.sendFrame(frameB64, 15.0);
          frameCounterRef.current++;
        }
      }, 70);

      // Start duration timer
      timerIntervalRef.current = window.setInterval(() => {
        setActiveDurationSec((prev) => {
          const next = prev + 1;
          onSessionStateChange?.(true, formatDuration(next));
          return next;
        });
      }, 1000);

    } catch (err: unknown) {
      console.error('Failed to initiate monitoring session:', err);
    }
  };

  // Stop Monitoring Session
  const handleStopMonitoring = async () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    stopCamera();

    if (sessionId) {
      try {
        await ApiService.stopMonitoring(sessionId, 'Driver requested trip conclusion');
      } catch (e) {
        console.warn('Error recording session completion:', e);
      }
    }

    setIsMonitoring(false);
    setConnectionStatus('disconnected');
    setRiskLevel('normal');
    setCurrentAlert(null);
    onSessionStateChange?.(false, '00:00:00');
  };

  const handleAcknowledgeAlert = async (alertId?: string) => {
    // 1. Immediately silence all active sirens, voice synthesis, and alarms
    audioAlertSystem.stopAllAlerts();
    audioAlertSystem.playClearSound();

    // 2. Restore normal state and activate 5-second driver recovery grace window
    setCurrentAlert(null);
    setRiskLevel('normal');
    ackCooldownRef.current = Date.now() + 5000;

    // 3. Show green confirmation message
    setAcknowledgedMessage("✓ I Am Alert Confirmed — Safe Driving Resumed (விழிப்பாக உள்ளீர்கள் - இயல்பு நிலைக்கு திரும்பியது)");
    setTimeout(() => setAcknowledgedMessage(null), 5000);

    // 4. Update backend if alert ID exists
    if (alertId && alertId !== 'manual_ack') {
      try {
        await ApiService.acknowledgeAlert(alertId, 'Driver confirmed awake & alert');
      } catch (e) {
        console.warn('Error acknowledging alert:', e);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (wsRef.current) wsRef.current.disconnect();
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="space-y-6">
      {/* Top Controller Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${isMonitoring ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-navy-900">Live AI Fatigue Surveillance</h2>
              {isMonitoring && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                  RECORDING & ANALYZING
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Webcam MediaDevices API • Secure WebSocket streaming • Real-time EAR/MAR analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              audioAlertSystem.unlockAudio();
              audioAlertSystem.playWarningSound();
              setTimeout(() => audioAlertSystem.speak("PLEASE STAY ALERT."), 450);
            }}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5"
            title="Play Level 1 Warning Sound"
          >
            <Volume2 className="w-4 h-4 animate-pulse" />
            Warning Sound
          </button>

          <button
            onClick={() => setIsAudioTestOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
          >
            <Volume2 className="w-4 h-4 text-blue-600" />
            Audio Check
          </button>

          <button
            onClick={() => setIsSOSOpen(true)}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Manual SOS
          </button>

          {!isMonitoring ? (
            <button
              onClick={handleStartMonitoring}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/20 transition flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Monitoring
            </button>
          ) : (
            <button
              onClick={handleStopMonitoring}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-md transition flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop Monitoring
            </button>
          )}
        </div>
      </div>

      {/* Level 1 Warning Banner */}
      {riskLevel === 'warning' && (
        <div className="bg-amber-500 text-white p-4 rounded-xl shadow-lg flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white shrink-0" />
            <div>
              <h4 className="font-extrabold text-sm uppercase tracking-wide">
                Level 1 Fatigue Warning — Please Stay Alert
              </h4>
              <p className="text-xs text-amber-100">
                {currentAlert?.trigger_reason || 'Repeated blinks, yawning, or early fatigue indicators identified.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                audioAlertSystem.unlockAudio();
                audioAlertSystem.playWarningSound();
                setTimeout(() => audioAlertSystem.speak("PLEASE STAY ALERT."), 450);
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-md shadow-sm transition flex items-center gap-1"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Replay Sound
            </button>
            <button
              onClick={() => handleAcknowledgeAlert(currentAlert?.id)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              I Am Alert (நான் விழிப்பாக உள்ளேன்)
            </button>
          </div>
        </div>
      )}

      {/* Driver Alert Confirmation Message */}
      {acknowledgedMessage && (
        <div className="bg-emerald-600 text-white px-5 py-3.5 rounded-xl shadow-lg flex items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-white shrink-0" />
            <span className="font-bold text-sm tracking-wide">{acknowledgedMessage}</span>
          </div>
          <button
            onClick={() => setAcknowledgedMessage(null)}
            className="text-emerald-100 hover:text-white text-xs font-semibold px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Camera and Real-time Telemetry Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Camera Video Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className={`relative aspect-[4/3] bg-navy-900 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300 ${
            detection && (detection.eye_status === 'closed' || detection.eye_status === 'prolonged_closed') && detection.eye_closure_duration >= 0.8
              ? 'ring-4 ring-red-500 shadow-2xl shadow-red-500/40 animate-pulse'
              : 'border border-slate-200'
          }`}>
            {/* The actual HTML5 Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${isCameraActive ? 'opacity-100' : 'opacity-0'
                }`}
            />

            {/* Standby Placeholder */}
            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-3">
                <div className="p-4 rounded-full bg-navy-800 text-slate-400 border border-navy-700">
                  <VideoOff className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">Camera Feed Inactive</h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Press "Start Monitoring" to request webcam permission and initiate real-time AI computer vision processing.
                  </p>
                </div>
                {cameraError && (
                  <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-lg max-w-md">
                    {cameraError}
                  </div>
                )}
              </div>
            )}

            {/* Camera Overlay HUD (when active) */}
            {isCameraActive && (
              <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
                {/* Top HUD */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-navy-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <span>LIVE</span>
                    <span className="text-slate-400">|</span>
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>{formatDuration(activeDurationSec)}</span>
                  </div>

                  <div className="flex items-center gap-2 bg-navy-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs">
                    <span className="text-slate-400">Socket:</span>
                    <span className={`font-bold capitalize ${connectionStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {connectionStatus}
                    </span>
                  </div>
                </div>

                {/* Critical Unconsciousness / Fainting (Mayakkam) Emergency HUD Banner */}
                {detection && detection.unconscious_detected && (
                  <div className="self-center px-6 py-3 rounded-2xl border-4 border-red-600 bg-red-950/95 text-white font-black text-xs sm:text-sm tracking-wide shadow-2xl animate-bounce flex flex-col sm:flex-row items-center gap-3 pointer-events-auto">
                    <span className="w-4 h-4 rounded-full bg-red-500 animate-ping shrink-0"></span>
                    <div className="text-center sm:text-left">
                      <div className="text-red-300 text-[10px] uppercase font-extrabold tracking-widest">CRITICAL MEDICAL EMERGENCY</div>
                      <div className="text-sm font-black">🚨 DRIVER UNRESPONSIVE / FAINTED! (மயக்கம்)</div>
                      <div className="text-[11px] text-red-200 font-normal">{detection.unconscious_reason}</div>
                    </div>
                    <button
                      onClick={() => handleAcknowledgeAlert(currentAlert?.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer ml-auto shrink-0"
                    >
                      <CheckCircle className="w-4 h-4" />
                      I Am Awake & Okay (விழித்துவிட்டேன்)
                    </button>
                  </div>
                )}

                {/* Eye Closure Alarm Reticle Banner */}
                {detection && !detection.unconscious_detected && detection.face_detected && (detection.eye_status === 'closed' || detection.eye_status === 'prolonged_closed') && detection.eye_closure_duration >= 0.8 && (
                  <div className="self-center px-5 py-2.5 rounded-xl border-2 border-red-500 bg-red-950/90 text-white font-black text-xs sm:text-sm tracking-wide shadow-2xl animate-bounce flex items-center gap-3 pointer-events-auto">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0"></span>
                    <span>⚠️ EYES CLOSED! PLEASE STAY ALERT! ({detection.eye_closure_duration.toFixed(1)}s)</span>
                    <button
                      onClick={() => handleAcknowledgeAlert(currentAlert?.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow transition flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      I'm Alert
                    </button>
                  </div>
                )}

                {/* Face Tracker HUD Box Overlay */}
                {detection && detection.face_detected && (
                  <div className="self-center p-3 rounded-lg border-2 border-emerald-400/60 bg-emerald-950/20 text-emerald-300 text-xs font-mono backdrop-blur-sm">
                    Driver Face Locked • Confidence {Math.round(detection.confidence * 100)}%
                  </div>
                )}

                {detection && !detection.face_detected && (
                  <div className="self-center p-3 rounded-lg border-2 border-amber-400/80 bg-amber-950/40 text-amber-300 text-xs font-semibold backdrop-blur-sm animate-pulse">
                    ⚠️ Driver Face Not Visible in Camera
                  </div>
                )}

                {/* Bottom HUD */}
                <div className="flex items-center justify-between">
                  <div className="bg-navy-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs space-x-2">
                    <span className="text-slate-400">FPS:</span>
                    <span className="font-mono font-bold text-blue-400">15.0</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-400">Score:</span>
                    <span className="font-mono font-bold text-white">{detection?.fatigue_score ?? 0}/100</span>
                  </div>

                  <div className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider backdrop-blur-md ${riskLevel === 'critical'
                      ? 'bg-red-600 text-white animate-pulse'
                      : riskLevel === 'danger'
                        ? 'bg-orange-600 text-white'
                        : riskLevel === 'warning'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                    }`}>
                    Risk: {riskLevel}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Input: Internal/USB Webcam (640x480 @ 15fps)</span>
            <span>Security: Ephemeral Frames • No Cloud Video Storage</span>
          </div>
        </div>

        {/* Right Col: Real AI Biometric Meters */}
        <div className="space-y-4">
          {/* Fatigue Score Meter */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Composite Fatigue Score
              </span>
              <span className="text-xs font-mono font-bold text-navy-900">
                {detection?.fatigue_score ?? 0} / 100
              </span>
            </div>

            {/* Score Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-300 ${(detection?.fatigue_score ?? 0) >= 80
                    ? 'bg-red-600'
                    : (detection?.fatigue_score ?? 0) >= 50
                      ? 'bg-orange-500'
                      : (detection?.fatigue_score ?? 0) >= 30
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                style={{ width: `${Math.min(100, Math.max(5, detection?.fatigue_score ?? 0))}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] font-semibold text-slate-400">
              <span>0 (Alert)</span>
              <span>30 (Warning)</span>
              <span>60 (Danger)</span>
              <span>100 (Critical)</span>
            </div>
          </div>

          {/* Eye Aspect Ratio (EAR) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Eye Aspect Ratio (EAR)
                </h4>
              </div>
              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${detection?.eye_status === 'prolonged_closed'
                  ? 'bg-red-100 text-red-700'
                  : detection?.eye_status === 'closed'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                {detection?.eye_status ?? 'Calibrated'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Avg EAR Ratio</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {detection?.metrics?.ear?.toFixed(3) ?? '0.312'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Closure Duration</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {detection?.eye_closure_duration?.toFixed(1) ?? '0.0'}s
                </span>
              </div>
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 pt-1">
              <span>Total Blinks: {detection?.metrics?.total_blinks ?? 0}</span>
              <span>PERCLOS: {Math.round((detection?.metrics?.perclos ?? 0) * 100)}%</span>
            </div>
          </div>

          {/* Mouth Aspect Ratio (MAR) / Yawn */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Mouth Aspect Ratio (MAR)
                </h4>
              </div>
              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${detection?.yawn_detected
                  ? 'bg-red-100 text-red-700'
                  : 'bg-emerald-100 text-emerald-700'
                }`}>
                {detection?.yawn_detected ? 'Yawning' : 'Normal'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Current MAR</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {detection?.metrics?.mar?.toFixed(3) ?? '0.145'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Yawn Episodes</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {detection?.metrics?.total_yawns ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Head Pose Projection */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  3D Head Pose (PnP)
                </h4>
              </div>
              <span className="text-xs font-bold text-slate-700 capitalize">
                {detection?.head_pose ?? 'Normal'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase block">Pitch</span>
                <span className="font-mono font-bold text-slate-800">
                  {detection?.metrics?.pitch ?? 0}°
                </span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase block">Yaw</span>
                <span className="font-mono font-bold text-slate-800">
                  {detection?.metrics?.yaw ?? 0}°
                </span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase block">Roll</span>
                <span className="font-mono font-bold text-slate-800">
                  {detection?.metrics?.roll ?? 0}°
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical and Danger Full-Screen Alert Overlay */}
      <CriticalAlertOverlay
        alert={currentAlert}
        riskLevel={riskLevel}
        onAcknowledge={handleAcknowledgeAlert}
      />

      {/* Emergency SOS Modal */}
      <SOSModal
        isOpen={isSOSOpen}
        sessionId={sessionId || undefined}
        onClose={() => setIsSOSOpen(false)}
        onSuccess={() => {
          setIsSOSOpen(false);
        }}
      />

      {/* Audio Test Modal */}
      <AudioTestModal
        isOpen={isAudioTestOpen}
        onClose={() => setIsAudioTestOpen(false)}
      />
    </div>
  );
};
