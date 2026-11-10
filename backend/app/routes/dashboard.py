from fastapi import APIRouter, Depends
from ..models.schemas import DashboardStatistics
from ..database.firestore_store import db
from ..authentication.security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/statistics", response_model=DashboardStatistics)
async def get_dashboard_statistics(current_user: dict = Depends(get_current_user)):
    drivers = db.query_collection("drivers")
    sessions = db.query_collection("monitoring_sessions", limit=500)
    alerts = db.query_collection("alerts", limit=500)

    total_drivers = max(len(drivers), 1)
    active_sessions = len([s for s in sessions if s.get("status") == "active"])
    normal_sessions = len([s for s in sessions if s.get("status") == "completed" and s.get("critical_count", 0) == 0])

    warning_events = len([a for a in alerts if a.get("alert_level") == "warning"])
    critical_events = len([a for a in alerts if a.get("alert_level") in ["critical", "danger", "sos"]])

    total_duration_sec = sum([float(s.get("duration_seconds", 0.0)) for s in sessions])
    total_monitoring_minutes = round(total_duration_sec / 60.0, 1)

    # Compile recent activity
    recent_activity = []
    for a in alerts[:8]:
        recent_activity.append({
            "type": "alert",
            "title": f"{a.get('alert_level', 'Alert').capitalize()} Alert Triggered",
            "description": a.get("trigger_reason", "Fatigue threshold exceeded"),
            "timestamp": a.get("created_at"),
            "severity": a.get("alert_level")
        })

    for s in sessions[:5]:
        status_label = "Monitoring Session Started" if s.get("status") == "active" else "Monitoring Session Concluded"
        recent_activity.append({
            "type": "session",
            "title": status_label,
            "description": f"Device: {s.get('device_type', 'web').upper()} • Duration: {round(float(s.get('duration_seconds', 0))/60.0, 1)}m",
            "timestamp": s.get("started_at"),
            "severity": "info"
        })

    recent_activity.sort(key=lambda x: str(x.get("timestamp", "")), reverse=True)

    return {
        "total_drivers": total_drivers,
        "active_sessions": active_sessions,
        "normal_sessions": normal_sessions,
        "warning_events": warning_events,
        "critical_events": critical_events,
        "total_monitoring_duration_minutes": total_monitoring_minutes,
        "recent_activity": recent_activity[:10]
    }

