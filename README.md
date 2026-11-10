# ROADGUARD AI
> **"Stay Awake. Stay Alert. Stay Safe."**

An enterprise-grade, real-time AI driver fatigue detection and road safety monitoring platform.

ROADGUARD AI operates exclusively using a standard camera (laptop webcam, Android front camera, iPhone camera) without requiring external sensors, wearable hardware, or proprietary in-cabin devices.

---

## 🌟 Key Capabilities

- **Zero Additional Hardware**: Works purely using optical camera input.
- **Eye Aspect Ratio (EAR)**: Computes 6-point sub-millimeter eyelid aperture to distinguish normal involuntary blinks from prolonged closure and microsleep.
- **Mouth Aspect Ratio (MAR)**: Monitors oral displacement to identify fatigue-induced yawning while temporally filtering speech phonemes.
- **3D Head Pose Estimation (solvePnP)**: Detects head nodding (pitch), distraction looking away (yaw), and slumping (roll).
- **Temporal PERCLOS Scoring**: Aggregates continuous observations over sliding 60-second evaluation windows.
- **Immediate Multi-Tier Alerts**:
  - **Level 1 (Warning)**: Yellow banner + audible chime + voice: *"PLEASE STAY ALERT."*
  - **Level 2 (Danger)**: Red alert banner + pulsating alarm + voice: *"WARNING! SIGNS OF DRIVER FATIGUE DETECTED. PLEASE TAKE A SAFE BREAK."*
  - **Level 3 (Critical)**: Full-screen red alert + continuous siren + voice: *"DANGER! PLEASE STOP AT A SAFE PLACE."* + emergency contact notification.
- **Manual SOS**: 2-step confirmation with a 5-second accidental cancel window.
- **Audio Verification Bench**: Enables driver to test warning, danger, and critical audio + speech synthesis prior to starting trip.
- **Zero Raw Video Storage**: Transient frames are evaluated in memory and discarded immediately; continuous video is never stored on disk.

---

## 🏗️ Monorepo Architecture

```
ROADGUARD AI/
├── ai-engine/               # Core computer vision & fatigue analysis engine
│   ├── config.py            # Calibrated thresholds (EAR: 0.22, MAR: 0.65, Pitch: -18°)
│   ├── face_detection.py    # MediaPipe Face Landmarker & Haar fallback
│   ├── eye_detection.py     # EAR calculation & blink frequency tracker
│   ├── yawn_detection.py    # MAR calculation & sustained yawn detection
│   ├── head_pose.py         # solvePnP 3D pose estimator (Pitch, Yaw, Roll)
│   ├── fatigue_engine.py    # Sensor fusion, PERCLOS sliding window & decision logic
│   └── tests/               # Automated unit tests (4/4 passed)
│
├── backend/                 # FastAPI REST and Secure WebSocket gateway
│   ├── app/
│   │   ├── main.py          # FastAPI application & lifespan
│   │   ├── config.py        # Environment & security config
│   │   ├── database/        # Google Cloud Firestore & thread-safe store
│   │   ├── authentication/  # JWT & bcrypt security
│   │   ├── routes/          # Auth, Drivers, Monitoring, Alerts, SOS, Dashboard
│   │   ├── websocket/       # /ws/monitoring/{session_id} real-time streaming
│   │   ├── notifications/   # Firebase Cloud Messaging (FCM) push
│   │   └── services/        # AI service, Alert service, Auth service
│   └── tests/               # Pytest REST & WebSocket test suite (8/8 passed)
│
├── web-dashboard/           # Production React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/      # Header, Sidebar, AudioTestModal, SOSModal, CriticalAlertOverlay
│   │   ├── pages/           # All 12 pages (Landing, Login, Register, Dashboard, Live Monitoring, etc.)
│   │   ├── services/        # Web Audio API Synth, Speech TTS, WebSocket client, REST API
│   │   └── hooks/           # useWebcam (MediaDevices API frame extractor)
│   └── dist/                # Production build ready for HTTPS deployment
│
├── mobile-app/              # Native Flutter application for Android & iOS
│   ├── lib/
│   │   ├── screens/         # All 14 mobile screens (Live Monitoring, SOS, Danger, Profile, etc.)
│   │   ├── camera/          # Front camera capture & memory frame streamer
│   │   ├── services/        # WebSocket stream, Native TTS (flutter_tts), REST API
│   │   └── models/          # DetectionResult, AlertEvent, DriverProfile, EmergencyContact
│   ├── android/             # AndroidManifest.xml configured with camera permissions
│   └── ios/                 # Info.plist configured with iOS camera permissions
│
└── documentation/           # Comprehensive professional documentation
    ├── architecture.md      # Detailed system architecture & math models
    ├── api.md               # REST and WebSocket API specification
    ├── installation.md      # Setup guide for Web, Backend, and Mobile
    ├── testing.md           # 17 real-world test scenarios & validation report
    ├── privacy.md           # Zero-retention & GDPR/CCPA compliance
    └── deployment.md        # Cloud Run, HTTPS Web, Android AAB, and iOS TestFlight
```

---

## 🚀 Quick Start

### 1. Launch Backend
```bash
source venv/bin/activate
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation: `http://localhost:8000/docs`

### 2. Launch Web Dashboard
```bash
cd web-dashboard
npm run dev
```
Open `http://localhost:5173` in your browser.  
Default demo credentials:
- **Email**: `driver@roadguard.ai`
- **Password**: `password123`

### 3. Launch Mobile App
```bash
cd mobile-app
flutter run
```

---

## 🧪 Testing Verification

- **AI Engine Unit Tests**: `./venv/bin/python -m unittest discover -s ai-engine/tests` (Passed)
- **Backend API & WebSocket Tests**: `./venv/bin/pytest backend/tests/` (Passed)
- **Flutter Mobile Tests**: `cd mobile-app && flutter test` (Passed)
- **Web Dashboard Build**: `cd web-dashboard && npm run build` (Passed)

---

## 📄 License
Commercial Automotive Safety Platform — RoadGuard AI.

