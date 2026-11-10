# ROADGUARD AI — API Reference

Base URL: `http://localhost:8000/api/v1`  
WebSocket URL: `ws://localhost:8000/ws/monitoring/{session_id}`

---

## 1. Authentication

### `POST /auth/register`
Creates a new driver account.
```json
// Request
{
  "email": "driver@roadguard.ai",
  "password": "password123",
  "full_name": "Marcus Vance",
  "phone_number": "+1 (555) 234-5678",
  "role": "driver"
}

// Response: 200 OK
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user_id": "user-a9b8c7d6e5f4",
  "email": "driver@roadguard.ai",
  "full_name": "Marcus Vance",
  "role": "driver"
}
```

### `POST /auth/login`
Authenticates existing credentials and returns JWT bearer token.
```json
// Request
{
  "email": "driver@roadguard.ai",
  "password": "password123"
}

// Response: 200 OK
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user_id": "driver-demo-001",
  "email": "driver@roadguard.ai",
  "full_name": "Marcus Vance",
  "role": "driver"
}
```

### `GET /auth/me`
Retrieves authenticated session user. Headers: `Authorization: Bearer <token>`.

---

## 2. Driver Management

### `GET /drivers/profile`
Retrieves current driver license, assigned vehicle plate, and safety score.

### `PUT /drivers/profile`
Updates driver credentials:
```json
{
  "full_name": "Marcus Vance",
  "license_number": "DL-9482014-A",
  "vehicle_plate": "RG-772-AI",
  "vehicle_type": "Commercial Van"
}
```

### `GET /drivers/list`
Lists fleet drivers (available to fleet manager and admin roles).

---

## 3. Live Monitoring

### `POST /monitoring/start`
Starts a safety session.
```json
// Request
{
  "device_type": "web", // "web" | "android" | "ios"
  "vehicle_plate": "RG-772-AI",
  "consent_given": true
}

// Response: 200 OK
{
  "session_id": "sess-b827364591a2",
  "driver_id": "driver-demo-001",
  "device_type": "web",
  "status": "active",
  "started_at": "2026-11-10T08:30:00Z",
  "duration_seconds": 0.0,
  "total_frames": 0,
  "warning_count": 0,
  "danger_count": 0,
  "critical_count": 0
}
```

### `POST /monitoring/stop`
Concludes a monitoring session.
```json
{
  "session_id": "sess-b827364591a2",
  "summary_notes": "Shift ended cleanly"
}
```

### `GET /monitoring/history`
Retrieves past trip sessions.

---

## 4. WebSocket Streaming API

### `WSS /ws/monitoring/{session_id}`
Establishes bidirectional real-time video stream.

#### Client -> Server: Frame Transmission
```json
{
  "type": "frame",
  "data": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "fps": 15.0,
  "timestamp": "2026-11-10T08:30:01.250Z"
}
```

#### Server -> Client: Real-Time Detection Output
```json
{
  "type": "detection",
  "session_id": "sess-b827364591a2",
  "frame_index": 142,
  "result": {
    "face_detected": true,
    "eye_status": "open",
    "eye_closure_duration": 0.0,
    "yawn_detected": false,
    "head_pose": "normal",
    "fatigue_score": 12,
    "risk_level": "normal",
    "confidence": 0.95,
    "timestamp": "2026-11-10T08:30:01.320Z",
    "metrics": {
      "ear": 0.298,
      "mar": 0.165,
      "pitch": -2.4,
      "yaw": 1.1,
      "roll": 0.5,
      "perclos": 0.035,
      "total_blinks": 14,
      "total_yawns": 0
    }
  },
  "alert": null
}
```

---

## 5. Alerts & SOS

### `GET /alerts/history`
Returns all logged alert events.

### `POST /alerts/acknowledge`
```json
{
  "alert_id": "alert-c7a8b9e0f1",
  "feedback": "Pulled over at rest area"
}
```

### `POST /alerts/sos`
```json
{
  "session_id": "sess-b827364591a2",
  "notes": "Driver experiencing acute dizziness on route"
}
```

---

## 6. Emergency Contacts

### `GET /emergency-contacts`
Lists authorized emergency contacts.

### `POST /emergency-contacts`
```json
{
  "name": "Sarah Vance",
  "phone_number": "+1 (555) 987-6543",
  "relationship": "Spouse",
  "notify_on_critical": true,
  "consent_status": true
}
```

### `DELETE /emergency-contacts/{contact_id}`
Deletes emergency contact.

---

## 7. Dashboard Statistics

### `GET /dashboard/statistics`
Returns real fleet-wide aggregated metrics.

