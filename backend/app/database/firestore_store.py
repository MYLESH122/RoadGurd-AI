import threading
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from .firebase import get_firestore_client

class FirestoreStore:
    """
    Unified Data Store for RoadGuard AI.
    Interacts with Google Cloud Firestore when configured, or provides an
    in-memory thread-safe document store with identical collection semantics.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._collections: Dict[str, Dict[str, Dict[str, Any]]] = {
            "users": {},
            "drivers": {},
            "emergency_contacts": {},
            "monitoring_sessions": {},
            "detection_events": {},
            "alerts": {},
            "device_sessions": {}
        }
        self._seed_default_data()

    def _seed_default_data(self):
        # Seed an initial demo fleet driver and admin for instant out-of-the-box verification
        now = datetime.now(timezone.utc).isoformat()
        demo_driver_id = "driver-demo-001"
        from ..authentication.security import get_password_hash
        self._collections["users"][demo_driver_id] = {
            "id": demo_driver_id,
            "email": "driver@roadguard.ai",
            "hashed_password": get_password_hash("password123"),
            "full_name": "Marcus Vance",
            "phone_number": "+1 (555) 234-5678",
            "role": "driver",
            "created_at": now
        }
        self._collections["drivers"][demo_driver_id] = {
            "user_id": demo_driver_id,
            "full_name": "Marcus Vance",
            "license_number": "DL-9482014-A",
            "vehicle_plate": "RG-772-AI",
            "vehicle_type": "Commercial Van",
            "total_driving_hours": 34.5,
            "safety_score": 96,
            "status": "active",
            "created_at": now
        }
        contact_id = "contact-demo-001"
        self._collections["emergency_contacts"][contact_id] = {
            "id": contact_id,
            "driver_id": demo_driver_id,
            "name": "Sarah Vance",
            "phone_number": "+1 (555) 987-6543",
            "relationship": "Spouse",
            "notify_on_critical": True,
            "consent_status": True,
            "fcm_token": None,
            "created_at": now
        }

    # Document operations
    def create_document(self, collection: str, data: Dict[str, Any], doc_id: Optional[str] = None) -> Dict[str, Any]:
        doc_id = doc_id or data.get("id") or str(uuid.uuid4())
        data["id"] = doc_id
        if "created_at" not in data:
            data["created_at"] = datetime.now(timezone.utc).isoformat()

        fs = get_firestore_client()
        if fs:
            try:
                fs.collection(collection).document(doc_id).set(data)
            except Exception:
                pass

        with self._lock:
            if collection not in self._collections:
                self._collections[collection] = {}
            self._collections[collection][doc_id] = dict(data)

        return data

    def get_document(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        fs = get_firestore_client()
        if fs:
            try:
                doc = fs.collection(collection).document(doc_id).get()
                if doc.exists:
                    return doc.to_dict()
            except Exception:
                pass

        with self._lock:
            return self._collections.get(collection, {}).get(doc_id)

    def update_document(self, collection: str, doc_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()

        fs = get_firestore_client()
        if fs:
            try:
                fs.collection(collection).document(doc_id).update(updates)
            except Exception:
                pass

        with self._lock:
            if collection in self._collections and doc_id in self._collections[collection]:
                self._collections[collection][doc_id].update(updates)
                return self._collections[collection][doc_id]
        return None

    def query_collection(
        self,
        collection: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 100,
        order_by: str = "created_at",
        descending: bool = True
    ) -> List[Dict[str, Any]]:
        fs = get_firestore_client()
        if fs:
            try:
                q = fs.collection(collection)
                if filters:
                    for k, v in filters.items():
                        q = q.where(k, "==", v)
                docs = q.order_by(order_by, direction=firestore.Query.DESCENDING if descending else firestore.Query.ASCENDING).limit(limit).stream()
                return [d.to_dict() for d in docs]
            except Exception:
                pass

        with self._lock:
            items = list(self._collections.get(collection, {}).values())

        if filters:
            filtered = []
            for item in items:
                matches = True
                for k, v in filters.items():
                    if item.get(k) != v:
                        matches = False
                        break
                if matches:
                    filtered.append(item)
            items = filtered

        # Sort
        items.sort(
            key=lambda x: str(x.get(order_by, "")),
            reverse=descending
        )
        return items[:limit]

    def delete_document(self, collection: str, doc_id: str) -> bool:
        fs = get_firestore_client()
        if fs:
            try:
                fs.collection(collection).document(doc_id).delete()
            except Exception:
                pass

        with self._lock:
            if collection in self._collections and doc_id in self._collections[collection]:
                del self._collections[collection][doc_id]
                return True
        return False

# Global database singleton
db = FirestoreStore()
