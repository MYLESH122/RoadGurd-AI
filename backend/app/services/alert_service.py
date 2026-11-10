import time
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from ..database.firestore_store import db
from ..notifications.fcm import send_fcm_notification

class AlertService:
    def __init__(self):
        # Driver/Session alert timestamp tracking for cooldowns: session_id -> {level -> timestamp}
        self._last_alert_times: Dict[str, Dict[str, float]] = {}
        self.cooldown_seconds = {
            "warning": 5.0,
            "danger": 5.0,
            "critical": 8.0,
            "sos": 2.0
        }

    def should_trigger_alert(self, session_id: str, alert_level: str) -> bool:
        if alert_level == "normal":
            return False

        now = time.time()
        if session_id not in self._last_alert_times:
            self._last_alert_times[session_id] = {}

        last_time = self._last_alert_times[session_id].get(alert_level, 0.0)
        cooldown = self.cooldown_seconds.get(alert_level, 5.0)

        if (now - last_time) >= cooldown:
            self._last_alert_times[session_id][alert_level] = now
            return True
        return False

    def process_detection(
        self,
        session_id: str,
        driver_id: str,
        detection_result: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        risk_level = detection_result.get("risk_level", "normal")
        if risk_level == "normal":
            return None

        if not self.should_trigger_alert(session_id, risk_level):
            return None

        # Build alert record
        alert_id = f"alert-{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        reasons = []
        if detection_result.get("unconscious_detected"):
            reasons.append(f"CRITICAL MEDICAL EMERGENCY: {detection_result.get('unconscious_reason', 'Driver Unconscious / Fainted')}")
        if detection_result.get("eye_closure_duration", 0) >= 1.0:
            reasons.append(f"Prolonged eye closure ({detection_result['eye_closure_duration']}s)")
        if detection_result.get("yawn_detected"):
            reasons.append("Frequent/prolonged yawning detected")
        if detection_result.get("head_pose") in ["dropping", "tilted"]:
            reasons.append(f"Abnormal head position ({detection_result['head_pose']})")
        if not detection_result.get("face_detected"):
            reasons.append("Driver face obscured or absent")

        trigger_reason = "; ".join(reasons) if reasons else f"Elevated fatigue score ({detection_result.get('fatigue_score')})"

        contacts_notified = False
        if risk_level == "critical":
            # Notify registered emergency contacts
            contacts = db.query_collection("emergency_contacts", {"driver_id": driver_id, "notify_on_critical": True})
            for c in contacts:
                fcm_token = c.get("fcm_token")
                if fcm_token:
                    send_fcm_notification(
                        token=fcm_token,
                        title="ROADGUARD AI Critical Fatigue Warning",
                        body=f"Driver emergency alert: Critical fatigue detected for driver. Immediate stop required.",
                        data={"alert_id": alert_id, "driver_id": driver_id, "session_id": session_id}
                    )
            if contacts:
                contacts_notified = True

        alert_data = {
            "id": alert_id,
            "session_id": session_id,
            "driver_id": driver_id,
            "alert_level": risk_level,
            "trigger_reason": trigger_reason,
            "fatigue_score": detection_result.get("fatigue_score", 0),
            "acknowledged": False,
            "acknowledged_at": None,
            "emergency_contacts_notified": contacts_notified,
            "created_at": now_iso
        }

        db.create_document("alerts", alert_data, doc_id=alert_id)
        return alert_data

    def trigger_sos(
        self,
        driver_id: str,
        session_id: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        alert_id = f"sos-{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        # Send push notification to all emergency contacts
        contacts = db.query_collection("emergency_contacts", {"driver_id": driver_id})
        notified = False
        for c in contacts:
            fcm_token = c.get("fcm_token")
            if fcm_token:
                loc_str = f" Location: {latitude}, {longitude}" if latitude and longitude else ""
                send_fcm_notification(
                    token=fcm_token,
                    title="EMERGENCY SOS: ROADGUARD AI",
                    body=f"Emergency SOS triggered by driver!{loc_str}",
                    data={"alert_id": alert_id, "driver_id": driver_id}
                )
                notified = True

        sos_record = {
            "id": alert_id,
            "session_id": session_id or "manual_sos",
            "driver_id": driver_id,
            "alert_level": "sos",
            "trigger_reason": f"Manual Driver SOS triggered. Notes: {notes or 'Driver requested assistance'}",
            "fatigue_score": 100,
            "latitude": latitude,
            "longitude": longitude,
            "acknowledged": False,
            "acknowledged_at": None,
            "emergency_contacts_notified": notified,
            "created_at": now_iso
        }
        db.create_document("alerts", sos_record, doc_id=alert_id)
        return sos_record

alert_service = AlertService()

