# ROADGUARD AI — Architecture Specification

## 1. Executive Summary
**ROADGUARD AI** ("Stay Awake. Stay Alert. Stay Safe.") is an enterprise-grade automotive safety platform engineered for real-time driver fatigue detection, distraction monitoring, and emergency response.

Operating exclusively using standard optical cameras (laptop webcams, Android front cameras, iPhone TrueDepth/front cameras) without specialized infrared or wearable sensors, RoadGuard AI computes dense facial topology and temporal dynamics to identify microsleep, prolonged eye closure, repeated yawning, and nodding head drop.

```
                      ┌─────────────────────────────────────────┐
                      │              CLIENT TIERS               │
                      ├───────────────────┬─────────────────────┤
                      │  Laptop Web (Vite)│  Flutter App (Dart) │
                      │  MediaDevices API │  Camera Plugin      │
                      │  Web Audio Synth  │  Native TTS & Audio │
                      └─────────┬─────────┴──────────┬──────────┘
                                │                    │
                WSS / HTTPS Frame Stream (15 FPS)    │
                                │                    │
                                ▼                    ▼
                      ┌─────────────────────────────────────────┐
                      │         FASTAPI BACKEND GATEWAY         │
                      ├─────────────────────────────────────────┤
                      │  WebSocket Stream Handler               │
                      │  JWT Authentication & Session Mgmt      │
                      │  Rate Limiting & Dynamic Cooldown       │
                      └─────────────────┬───────────────────────┘
                                        │
                                        ▼
                      ┌─────────────────────────────────────────┐
                      │             AI VISION ENGINE            │
                      ├─────────────────────────────────────────┤
                      │ • MediaPipe FaceLandmarker / Dense Mesh │
                      │ • Eye Aspect Ratio (EAR) Calculator     │
                      │ • Mouth Aspect Ratio (MAR) Yawn Engine  │
                      │ • 3D Head Pose Estimator (solvePnP)     │
                      │ • Sliding Window PERCLOS & Fusion Model │
                      └─────────────────┬───────────────────────┘
                                        │
                    Detection Telemetry & Alert Trigger
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
        ┌───────────────────────┐               ┌───────────────────────┐
        │   STORAGE LAYER       │               │ NOTIFICATION DISPATCH │
        ├───────────────────────┤               ├───────────────────────┤
        │ Google Cloud Firestore│               │ Firebase Cloud Msg    │
        │ • users               │               │ • Critical Push Alert │
        │ • drivers             │               │ • Emergency Contacts  │
        │ • monitoring_sessions │               │ • SOS Geo-broadcast   │
        │ • alerts & events     │               └───────────────────────┘
        └───────────────────────┘
```

---

## 2. Computer Vision & Fatigue Mathematical Models

### 2.1 Eye Aspect Ratio (EAR)
For each detected eye, 6 key landmark indices are tracked:
$$p_1, p_4$$ represent the lateral corners of the eye, and $$p_2, p_3, p_5, p_6$$ represent the superior and inferior eyelid margins.

$$\text{EAR} = \frac{\|p_2 - p_6\| + \|p_3 - p_5\|}{2 \|p_1 - p_4\|}$$

- **Operational Calibration**: $\text{EAR}_{\text{threshold}} = 0.22$.
- **Normal Blink**: Duration of 100ms - 300ms (1 - 4 frames at 15 FPS).
- **Drowsiness Closure**: Sustained closure $\ge 1.0\text{s}$ ($\ge 15$ frames).
- **Critical Microsleep**: Sustained closure $\ge 2.0\text{s}$ ($\ge 30$ frames).

### 2.2 Percentage of Eye Closure (PERCLOS)
PERCLOS measures the proportion of time the driver's eyes are at least 80% closed within a sliding temporal evaluation window ($T = 60\text{s}$):

$$\text{PERCLOS} = \frac{1}{N} \sum_{i=1}^{N} \mathbb{I}(\text{EAR}_i < \text{EAR}_{\text{threshold}})$$

- Normal: $\text{PERCLOS} < 0.15$
- Warning: $0.15 \le \text{PERCLOS} < 0.30$
- Danger: $0.30 \le \text{PERCLOS} < 0.50$
- Critical: $\text{PERCLOS} \ge 0.50$

### 2.3 Mouth Aspect Ratio (MAR)
Distinguishes involuntary yawning from rapid conversational speech phonemes:

$$\text{MAR} = \frac{\|p_{14} - p_{18}\| + \|p_{15} - p_{17}\| + \|p_{81} - p_{178}\|}{3 \|p_{\text{left}} - p_{\text{right}}\|}$$

- **Threshold**: $\text{MAR} \ge 0.65$ sustained for $> 1.3\text{s}$ (20 consecutive frames) triggers a confirmed yawn episode.

### 2.4 3D Head Pose Estimation (solvePnP)
Utilizes the Levenberg-Marquardt or iterative perspective-n-point algorithm mapping 2D image coordinates to canonical 3D facial landmarks:
- Nose tip $(0.0, 0.0, 0.0)$
- Chin $(0.0, -330.0, -65.0)$
- Left/Right Eye corners
- Left/Right Mouth corners

Euler angle extraction computes:
- **Pitch**: Head dropping downward ($< -18^\circ$) indicates chin nodding during drowsy sleep onset.
- **Yaw**: Head turning laterally ($| \text{Yaw} | > 30^\circ$) flags visual distraction.
- **Roll**: Lateral head slumping ($| \text{Roll} | > 22^\circ$) flags postural collapse.

---

## 3. Real-Time Alert Hierarchy

| Risk Level | Trigger Conditions | Audio / Voice Action | Visual Display | Escalation |
| :--- | :--- | :--- | :--- | :--- |
| **Level 1: Warning** | Repeated eye blinks, initial yawn, PERCLOS $\ge 15\%$ | 880Hz/1200Hz Chime + *"PLEASE STAY ALERT."* | Yellow HUD Banner | Local event log |
| **Level 2: Danger** | Sustained closure $> 1.0\text{s}$ or multiple fatigue cues | Dual-tone alternating siren + *"WARNING! SIGNS OF DRIVER FATIGUE DETECTED. PLEASE TAKE A SAFE BREAK."* | Orange/Red Alert Dialog | Vibration, cooldown enforced |
| **Level 3: Critical** | Sustained closure $\ge 2.0\text{s}$ or head drop + closed eyes | High-intensity pulsing siren + *"DANGER! PLEASE STOP AT A SAFE PLACE."* | Full-Screen Red Modal | Push notifications dispatched to Emergency Contacts |
| **Manual SOS** | Driver activates SOS button | Repeating SOS chime + *"EMERGENCY S.O.S. ACTIVATED."* | 5-Second Cancel Countdown | High-priority FCM push to contacts |

