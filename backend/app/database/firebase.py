import os
import logging
from typing import Optional, Any

logger = logging.getLogger("roadguard.database")

_firestore_client = None
_firebase_app = None
_firebase_initialized = False

def init_firebase():
    global _firestore_client, _firebase_app, _firebase_initialized
    if _firebase_initialized:
        return _firestore_client
    _firebase_initialized = True
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "")

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        if not firebase_admin._apps:
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                _firebase_app = firebase_admin.initialize_app(cred)
                logger.info(f"Firebase initialized successfully with credentials from {cred_path}")
            elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
                _firebase_app = firebase_admin.initialize_app()
                logger.info("Firebase initialized with default application credentials")
            else:
                logger.info("Firebase credentials not supplied; using local resilient database adapter.")
                return None

        _firestore_client = firestore.client()
        return _firestore_client
    except Exception as e:
        logger.warning(f"Could not connect to live Firestore: {e}. Active fallback store will handle operations.")
        return None

def get_firestore_client() -> Optional[Any]:
    global _firestore_client
    if _firestore_client is None:
        _firestore_client = init_firebase()
    return _firestore_client

