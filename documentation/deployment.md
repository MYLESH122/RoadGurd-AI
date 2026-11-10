# ROADGUARD AI — Deployment & Production Release Guide

This document outlines deployment procedures for Web Dashboard, FastAPI Backend, Android APK/AAB, and iOS App Store / TestFlight builds.

---

## 1. Laptop Web Application (Production)

### 1.1 Building the Production Web Bundle
```bash
cd web-dashboard
npm run build
```
Generates optimized static assets in `web-dashboard/dist/`.

### 1.2 HTTPS Deployment (Firebase Hosting / Vercel / Nginx)
> [!IMPORTANT]
> The browser `navigator.mediaDevices.getUserMedia` API **strictly requires** HTTPS when deployed to a public domain. (Only `localhost` is permitted over plain HTTP).

**Deploy with Firebase Hosting:**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Set public directory to 'dist' and configure as single-page app
firebase deploy --only hosting
```

---

## 2. FastAPI Backend Deployment

### 2.1 Containerized Dockerfile
Create a `backend/Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8000
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2.2 Google Cloud Run Deployment
```bash
# Build & Deploy to Google Cloud Run with WSS support
gcloud run deploy roadguard-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_PROJECT_ID="roadguard-ai-safety"
```

---

## 3. Native Android Build (APK & AAB)

### 3.1 Generating Release Keystore
```bash
keytool -genkey -v -keystore android-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias roadguard-key
```

### 3.2 Configure `android/key.properties`
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=roadguard-key
storeFile=/path/to/android-release-key.jks
```

### 3.3 Building Signed Android App Bundle (AAB) & APK
```bash
cd mobile-app

# 1. Build Android App Bundle (for Google Play Store upload)
flutter build appbundle --release

# 2. Build standalone Release APK (for direct device installation)
flutter build apk --release --split-per-abi
```
Outputs:
- AAB: `build/app/outputs/bundle/release/app-release.aab`
- APKs: `build/app/outputs/flutter-apk/app-arm64-v8a-release.apk`

---

## 4. Native iPhone Build (TestFlight & App Store)

### 4.1 Bundle Identifier & Signing
- **Bundle ID**: `com.roadguard.ai.app`
- In Apple Developer Portal, enable **Push Notifications** and register Provisioning Profiles.

### 4.2 Building iOS Archive
```bash
cd mobile-app
flutter build ipa --release
```
Outputs archive at: `build/ios/archive/Runner.xcarchive`

### 4.3 Uploading to TestFlight via Xcode / Fastlane
```bash
# Upload via xcrun altool
xcrun altool --upload-app -f build/ios/ipa/roadguard_app.ipa \
  -t ios -u YOUR_APPLE_ID -p YOUR_APP_SPECIFIC_PASSWORD
```
Distribute to drivers via Apple TestFlight internal testing prior to final App Store approval.

