import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..models.schemas import (
    MonitoringStartRequest,
    MonitoringStopRequest,
    MonitoringSessionResponse,
    DetectionOutput
)
from ..database.firestore_store import db
from ..authentication.security import get_current_user
from ..services.ai_service import ai_service
from ..services.alert_service import alert_service

router = APIRouter(prefix="/monitoring", tags=["Monitoring"])

class FrameProcessRequest(BaseModel):
    session_id: str
    frame_data: str  # Base64 string
    fps: Optional[float] = 15.0

class FrameProcessResponse(BaseModel):
    session_id: str
    result: DetectionOutput
    alert: Optional[Dict[str, Any]] = None

@router.post("/start", response_model=MonitoringSessionResponse)
async def start_monitoring(
    req: MonitoringStartRequest,
    current_user: dict = Depends(get_current_user)
):
    session_id = f"sess-{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    driver_id = current_user["id"]

    session_doc = {
        "id": session_id,
        "session_id": session_id,
        "driver_id": driver_id,
        "device_type": req.device_type,
        "vehicle_plate": req.vehicle_plate,
        "status": "active",
        "started_at": now,
        "ended_at": None,
        "duration_seconds": 0.0,
        "total_frames": 0,
        "warning_count": 0,
        "danger_count": 0,
        "critical_count": 0,
        "created_at": now
    }
    db.create_document("monitoring_sessions", session_doc, doc_id=session_id)
    db.update_document("drivers", driver_id, {"status": "active"})

    return session_doc

@router.post("/stop", response_model=MonitoringSessionResponse)
async def stop_monitoring(
    req: MonitoringStopRequest,
    current_user: dict = Depends(get_current_user)
):
    session = db.get_document("monitoring_sessions", req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Monitoring session not found")

    now = datetime.now(timezone.utc)
    started_at = datetime.fromisoformat(session["started_at"].replace("Z", "+00:00"))
    duration = (now - started_at).total_seconds()

    updates = {
        "status": "completed",
        "ended_at": now.isoformat(),
        "duration_seconds": round(duration, 1),
        "summary_notes": req.summary_notes
    }
    updated = db.update_document("monitoring_sessions", req.session_id, updates)

    # Clean up AI engine instance
    ai_service.remove_engine(req.session_id)

    # Update driver status
    driver_id = session.get("driver_id")
    if driver_id:
        driver = db.get_document("drivers", driver_id)
        if driver:
            new_hours = driver.get("total_driving_hours", 0.0) + (duration / 3600.0)
            db.update_document("drivers", driver_id, {
                "status": "inactive",
                "total_driving_hours": round(new_hours, 2)
            })

    return updated

@router.get("/status", response_model=Optional[MonitoringSessionResponse])
async def get_current_monitoring_status(current_user: dict = Depends(get_current_user)):
    driver_id = current_user["id"]
    active = db.query_collection("monitoring_sessions", {"driver_id": driver_id, "status": "active"}, limit=1)
    if active:
        return active[0]
    return None

@router.get("/history", response_model=List[MonitoringSessionResponse])
async def get_monitoring_history(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    driver_id = current_user["id"]
    sessions = db.query_collection("monitoring_sessions", {"driver_id": driver_id}, limit=limit)
    return sessions

@router.post("/process-frame", response_model=FrameProcessResponse)
async def process_single_frame(
    req: FrameProcessRequest,
    current_user: dict = Depends(get_current_user)
):
    rgb = ai_service.decode_frame(req.frame_data)
    if rgb is None:
        raise HTTPException(status_code=400, detail="Invalid frame image data")

    detection = ai_service.process_frame(req.session_id, rgb, fps=req.fps or 15.0)
    alert = alert_service.process_detection(req.session_id, current_user["id"], detection)

    return {
        "session_id": req.session_id,
        "result": detection,
        "alert": alert
    }

