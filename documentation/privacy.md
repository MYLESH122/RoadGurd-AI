# ROADGUARD AI — Privacy, Security & Compliance Policy

RoadGuard AI is engineered under a strict **Zero-Video-Retention & Privacy-by-Design** architecture.

---

## 1. Zero Continuous Video Storage
- **Ephemeral Frame Processing**: Camera frames captured from the laptop webcam or mobile device are decoded transiently in system memory (RAM) and evaluated by the computer vision pipeline.
- **Immediate Discard**: Upon computing EAR, MAR, and Head Pose, the raw image frame is discarded immediately.
- **No Disk Recording**: Under no operational setting are video clips or photo archives stored on user devices or server storage.

---

## 2. Telemetry Stored in Database
Only structured numeric telemetry is preserved:
- Session start and conclusion timestamps.
- Device type (`web`, `android`, `ios`).
- Aggregated numerical fatigue metrics (EAR average, PERCLOS percentage, total blinks, total yawns).
- Alert events (Alert level, trigger reason, acknowledgement status).

---

## 3. Emergency Contact Notification Privacy
- **Consent-Driven**: Only contacts entered by the driver and marked `notify_on_critical: true` are alerted.
- **No Video Sharing**: Emergency contacts never receive video feeds. They only receive concise text notifications stating the fatigue risk alert level and situational metadata.
- **No Automatic 911 Calls**: Public emergency medical/police services are never automatically dialed to prevent false dispatch burdens; response remains human-authorized.

---

## 4. Security & Cryptographic Standards
- **Transport Encryption**: All communication is secured via HTTPS and WSS (WebSockets over TLS).
- **Authentication**: JWT tokens signed using HS256 algorithm with strict expiration.
- **Credential Storage**: Driver passwords hashed via bcrypt.
- **Access Control**: Role-based access ensures drivers only see their own telemetry, while fleet managers see authorized aggregated driver logs.

