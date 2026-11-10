export type RiskLevel = 'normal' | 'warning' | 'danger' | 'critical';

export interface DetectionResult {
  face_detected: boolean;
  eye_status: 'open' | 'closed' | 'prolonged_closed' | 'not_visible' | 'unknown';
  eye_closure_duration: number;
  yawn_detected: boolean;
  head_pose: 'normal' | 'dropping' | 'distracted' | 'tilted' | 'not_visible' | 'unknown';
  unconscious_detected?: boolean;
  unconscious_reason?: string;
  fatigue_score: number;
  risk_level: RiskLevel;
  confidence: number;
  timestamp: string;
  metrics?: {
    ear?: number;
    mar?: number;
    pitch?: number;
    yaw?: number;
    roll?: number;
    perclos?: number;
    total_blinks?: number;
    total_yawns?: number;
    lighting?: {
      brightness: number;
      status: string;
    };
  };
}

export interface AlertEvent {
  id: string;
  session_id: string;
  driver_id: string;
  alert_level: RiskLevel | 'sos';
  trigger_reason: string;
  fatigue_score: number;
  acknowledged: boolean;
  acknowledged_at?: string;
  emergency_contacts_notified: boolean;
  created_at: string;
}

export interface MonitoringSession {
  id: string;
  session_id: string;
  driver_id: string;
  device_type: string;
  vehicle_plate?: string;
  status: 'active' | 'completed' | 'interrupted';
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
  total_frames: number;
  warning_count: number;
  danger_count: number;
  critical_count: number;
}

export interface DriverProfile {
  user_id: string;
  full_name: string;
  phone_number?: string;
  license_number: string;
  vehicle_plate: string;
  vehicle_type: string;
  total_driving_hours: number;
  safety_score: number;
  status: 'active' | 'inactive' | 'resting';
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  driver_id: string;
  name: string;
  phone_number: string;
  relationship: string;
  notify_on_critical: boolean;
  consent_status: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_drivers: number;
  active_sessions: number;
  normal_sessions: number;
  warning_events: number;
  critical_events: number;
  total_monitoring_duration_minutes: number;
  recent_activity: Array<{
    type: string;
    title: string;
    description: string;
    timestamp: string;
    severity: string;
  }>;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

