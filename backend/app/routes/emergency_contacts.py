import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from ..models.schemas import EmergencyContactCreate, EmergencyContactResponse
from ..database.firestore_store import db
from ..authentication.security import get_current_user

router = APIRouter(prefix="/emergency-contacts", tags=["Emergency Contacts"])

@router.get("", response_model=List[EmergencyContactResponse])
async def get_emergency_contacts(current_user: dict = Depends(get_current_user)):
    driver_id = current_user["id"]
    contacts = db.query_collection("emergency_contacts", {"driver_id": driver_id})
    return contacts

@router.post("", response_model=EmergencyContactResponse)
async def create_emergency_contact(
    req: EmergencyContactCreate,
    current_user: dict = Depends(get_current_user)
):
    driver_id = current_user["id"]
    contact_id = f"contact-{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    contact_doc = {
        "id": contact_id,
        "driver_id": driver_id,
        "name": req.name,
        "phone_number": req.phone_number,
        "relationship": req.relationship,
        "notify_on_critical": req.notify_on_critical,
        "consent_status": req.consent_status,
        "fcm_token": req.fcm_token,
        "created_at": now
    }
    db.create_document("emergency_contacts", contact_doc, doc_id=contact_id)
    return contact_doc

@router.delete("/{contact_id}")
async def delete_emergency_contact(
    contact_id: str,
    current_user: dict = Depends(get_current_user)
):
    contact = db.get_document("emergency_contacts", contact_id)
    if not contact or contact.get("driver_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Contact not found")

    db.delete_document("emergency_contacts", contact_id)
    return {"status": "success", "message": "Emergency contact deleted"}

