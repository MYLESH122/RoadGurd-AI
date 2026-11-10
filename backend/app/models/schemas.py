from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    phone_number: Optional[str] = None
    role: str = "driver"  # driver, fleet_manager, admin

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: str
    role: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    role: str
    created_at: str

# --- Driver Schemas ---
class DriverProfile(BaseModel):
    user_id: str
    full_name: str
    license_number: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_type: Optional[str] = "sedan"
    total_driving_hours: float = 0.0
    safety_score: int = 100
    status: str = "inactive"  # active, inactive, resting
    created_at: str

class DriverProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    license_number: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_type: Optional[str] = None

# --- Monitoring Schemas ---
class MonitoringStartRequest(BaseModel):
    device_type: str = "web"  # web, android, ios
    vehicle_plate: Optional[str] = None
    consent_given: bool = True

class MonitoringStopRequest(BaseModel):
    session_id: str
    summary_notes: Optional[str] = None

class MonitoringSessionResponse(BaseModel):
    session_id: str
    driver_id: str
    device_type: str
    status: str  # active, completed, interrupted
    started_at: str
    ended_at: Optional[str] = None
    duration_seconds: float = 0.0
    total_frames: int = 0
    warning_count: int = 0
    danger_count: int = 0
    critical_count: int = 0

# --- Detection Event Schema ---
class DetectionOutput(BaseModel):
    face_detected: bool
    eye_status: str
    eye_closure_duration: float
    yawn_detected: bool
    head_pose: str
    fatigue_score: int
    risk_level: str  # normal, warning, danger, critical
    confidence: float
    timestamp: str
    metrics: Optional[Dict[str, Any]] = None

class DetectionEventRecord(BaseModel):
    id: str
    session_id: str
    driver_id: str
    event_type: str
    risk_level: str
    fatigue_score: int
    eye_closure_duration: float
    yawn_detected: bool
    head_pose: str
    timestamp: str

# --- Alert Schemas ---
class AlertEvent(BaseModel):
    id: str
    session_id: str
    driver_id: str
    alert_level: str  # warning, danger, critical, sos
    trigger_reason: str
    fatigue_score: int
    acknowledged: bool = False
    acknowledged_at: Optional[str] = None
    emergency_contacts_notified: bool = False
    created_at: str

class AlertAcknowledgeRequest(BaseModel):
    alert_id: str
    feedback: Optional[str] = None

class SOSRequest(BaseModel):
    session_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None

# --- Emergency Contact Schemas ---
class EmergencyContactCreate(BaseModel):
    name: str
    phone_number: str
    relationship: str
    notify_on_critical: bool = True
    fcm_token: Optional[str] = None
    consent_status: bool = True

class EmergencyContactResponse(BaseModel):
    id: str
    driver_id: str
    name: str
    phone_number: str
    relationship: str
    notify_on_critical: bool
    consent_status: bool
    created_at: str

# --- Dashboard Statistics ---
class DashboardStatistics(BaseModel):
    total_drivers: int
    active_sessions: int
    normal_sessions: int
    warning_events: int
    critical_events: int
    total_monitoring_duration_minutes: float
    recent_activity: List[Dict[str, Any]]

