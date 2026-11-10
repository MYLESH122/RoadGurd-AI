import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("roadguard.fcm")

def send_fcm_notification(
    token: str,
    title: str,
    body: str,
    data: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Sends push notification via Firebase Cloud Messaging (FCM).
    Gracefully logs and handles when credentials/token are in mock or testing mode.
    """
    if not token:
        return {"status": "skipped", "reason": "No token provided"}

    try:
        from firebase_admin import messaging
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
        )
        response = messaging.send(message)
        logger.info(f"FCM notification sent successfully: {response}")
        return {"status": "sent", "message_id": response}
    except Exception as e:
        logger.warning(f"FCM send simulation (Firebase Admin not linked or invalid token): {e}")
        return {"status": "simulated", "error": str(e), "title": title, "body": body}

