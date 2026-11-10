# ROADGUARD AI — Installation & Setup Guide

This guide details steps for local development and running RoadGuard AI across Laptop Web, Backend, AI Engine, and Flutter Mobile.

---

## Prerequisites
- **Python**: 3.9+ installed
- **Node.js**: v18+ & npm
- **Flutter SDK**: 3.10+ (for Android/iOS mobile application)
- **Webcam**: Laptop integrated webcam or USB camera

---

## 1. Backend & AI Vision Engine Setup

```bash
# 1. Navigate to project root
cd "ROADGUARD AI"

# 2. Activate Python Virtual Environment
source venv/bin/activate  # Or create with: python3 -m venv venv && source venv/bin/activate

# 3. Install dependencies
pip install -r backend/requirements.txt

# 4. Run automated AI Engine & Backend test suite
python -m unittest discover -s ai-engine/tests
pytest backend/tests/

# 5. Start the FastAPI backend server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Docs: `http://localhost:8000/docs`  
Health check: `http://localhost:8000/health`

---

## 2. Laptop Web Dashboard Setup

```bash
# 1. Open new terminal and navigate to web-dashboard
cd "ROADGUARD AI/web-dashboard"

# 2. Install npm packages
npm install

# 3. Build & verify production bundle
npm run build

# 4. Start local development server
npm run dev
```
Open in browser: `http://localhost:5173`

### Pre-seeded Demo Account:
- **Email**: `driver@roadguard.ai`
- **Password**: `password123`

---

## 3. Flutter Mobile Application Setup (Android & iOS)

```bash
# 1. Navigate to mobile-app
cd "ROADGUARD AI/mobile-app"

# 2. Fetch Flutter packages
flutter pub get

# 3. Run Flutter automated unit & widget tests
flutter test

# 4. Run on connected Android or iOS device / simulator
flutter run
```

### Mobile Backend Host Configuration:
- **Android Emulator**: Automatically routes through `10.0.2.2:8000`.
- **iOS Simulator**: Connects to `127.0.0.1:8000`.
- **Physical Device**: Update IP to your local Wi-Fi machine IP in `mobile-app/lib/services/api_service.dart`.

