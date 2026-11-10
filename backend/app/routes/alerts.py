from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from ..models.schemas import AlertEvent, AlertAcknowledgeRequest, SOSRequest
from ..database.firestore_store import db
from ..authentication.security import get_current_user
from ..services.alert_service import alert_service

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("/history", response_model=List[AlertEvent])
async def get_alerts_history(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    driver_id = current_user["id"]
    # Allow admin/fleet managers to see all, or driver to see their own
    if current_user.get("role") in ["admin", "fleet_manager"]:
        alerts = db.query_collection("alerts", limit=limit)
    else:
        alerts = db.query_collection("alerts", {"driver_id": driver_id}, limit=limit)
    return alerts

@router.post("/acknowledge")
async def acknowledge_alert(
    req: AlertAcknowledgeRequest,
    current_user: dict = Depends(get_current_user)
):
    alert = db.get_document("alerts", req.alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    now = datetime.now(timezone.utc).isoformat()
    updated = db.update_document("alerts", req.alert_id, {
        "acknowledged": True,
        "acknowledged_at": now,
        "feedback": req.feedback
    })
    return {"status": "success", "alert": updated}

@router.post("/sos", response_model=AlertEvent)
async def trigger_manual_sos(
    req: SOSRequest,
    current_user: dict = Depends(get_current_user)
):
    driver_id = current_user["id"]
    sos_record = alert_service.trigger_sos(
        driver_id=driver_id,
        session_id=req.session_id,
        latitude=req.latitude,
        longitude=req.longitude,
        notes=req.notes
    )
    return sos_record

