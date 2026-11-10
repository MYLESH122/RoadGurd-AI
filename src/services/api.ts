import { DashboardStats, DriverProfile, EmergencyContact, MonitoringSession, AlertEvent, DetectionResult } from '../types';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:8000/api/v1`;
  }
  return 'http://localhost:8000/api/v1';
};

export class ApiService {
  private static get baseUrl(): string {
    return getApiBaseUrl();
  }

  private static getHeaders(): HeadersInit {
    const token = localStorage.getItem('roadguard_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  // Auth
  static async login(email: string, password: string) {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  }

  static async register(data: { email: string; password: string; full_name: string; phone_number?: string }) {
    const res = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  }

  static async getMe() {
    const res = await fetch(`${this.baseUrl}/auth/me`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  }

  // Dashboard Stats
  static async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${this.baseUrl}/dashboard/statistics`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch statistics');
    return res.json();
  }

  // Driver Profile
  static async getDriverProfile(): Promise<DriverProfile> {
    const res = await fetch(`${this.baseUrl}/drivers/profile`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch driver profile');
    return res.json();
  }

  static async updateDriverProfile(updates: Partial<DriverProfile>): Promise<DriverProfile> {
    const res = await fetch(`${this.baseUrl}/drivers/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update driver profile');
    return res.json();
  }

  static async listDrivers(): Promise<DriverProfile[]> {
    const res = await fetch(`${this.baseUrl}/drivers/list`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to list drivers');
    return res.json();
  }

  // Monitoring
  static async startMonitoring(deviceType: string = 'web', vehiclePlate?: string): Promise<MonitoringSession> {
    const res = await fetch(`${this.baseUrl}/monitoring/start`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ device_type: deviceType, vehicle_plate: vehiclePlate, consent_given: true })
    });
    if (!res.ok) throw new Error('Failed to start monitoring session');
    return res.json();
  }

  static async stopMonitoring(sessionId: string, summaryNotes?: string): Promise<MonitoringSession> {
    const res = await fetch(`${this.baseUrl}/monitoring/stop`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ session_id: sessionId, summary_notes: summaryNotes })
    });
    if (!res.ok) throw new Error('Failed to stop monitoring session');
    return res.json();
  }

  static async getMonitoringHistory(): Promise<MonitoringSession[]> {
    const res = await fetch(`${this.baseUrl}/monitoring/history`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch monitoring history');
    return res.json();
  }

  // Alerts
  static async getAlertsHistory(): Promise<AlertEvent[]> {
    const res = await fetch(`${this.baseUrl}/alerts/history`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch alert history');
    return res.json();
  }

  static async acknowledgeAlert(alertId: string, feedback?: string) {
    const res = await fetch(`${this.baseUrl}/alerts/acknowledge`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ alert_id: alertId, feedback })
    });
    if (!res.ok) throw new Error('Failed to acknowledge alert');
    return res.json();
  }

  static async triggerSOS(sessionId?: string, notes?: string): Promise<AlertEvent> {
    const res = await fetch(`${this.baseUrl}/alerts/sos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ session_id: sessionId, notes })
    });
    if (!res.ok) throw new Error('Failed to send SOS');
    return res.json();
  }

  // Emergency Contacts
  static async getEmergencyContacts(): Promise<EmergencyContact[]> {
    const res = await fetch(`${this.baseUrl}/emergency-contacts`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch emergency contacts');
    return res.json();
  }

  static async createEmergencyContact(data: { name: string; phone_number: string; relationship: string; notify_on_critical: boolean }): Promise<EmergencyContact> {
    const res = await fetch(`${this.baseUrl}/emergency-contacts`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...data, consent_status: true })
    });
    if (!res.ok) throw new Error('Failed to create emergency contact');
    return res.json();
  }

  static async deleteEmergencyContact(contactId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/emergency-contacts/${contactId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete emergency contact');
  }
}

