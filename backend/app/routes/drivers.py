from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from ..models.schemas import DriverProfile, DriverProfileUpdate
from ..database.firestore_store import db
from ..authentication.security import get_current_user

router = APIRouter(prefix="/drivers", tags=["Drivers"])

@router.get("/profile", response_model=DriverProfile)
async def get_driver_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    driver = db.get_document("drivers", user_id)
    if not driver:
        # Auto-create if not yet exists
        driver = {
            "user_id": user_id,
            "full_name": current_user.get("full_name", "Driver"),
            "license_number": "PENDING",
            "vehicle_plate": "N/A",
            "vehicle_type": "sedan",
            "total_driving_hours": 0.0,
            "safety_score": 100,
            "status": "inactive",
            "created_at": current_user.get("created_at", "")
        }
        db.create_document("drivers", driver, doc_id=user_id)
    return driver

@router.put("/profile", response_model=DriverProfile)
async def update_driver_profile(
    req: DriverProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    updated = db.update_document("drivers", user_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Driver record not found")
    return updated

@router.get("/list", response_model=List[DriverProfile])
async def list_drivers(current_user: dict = Depends(get_current_user)):
    # In fleet management / admin view
    drivers = db.query_collection("drivers", limit=100)
    return drivers

