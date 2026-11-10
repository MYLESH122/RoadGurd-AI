import json
import logging
from typing import Dict, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect

from ..services.ai_service import ai_service
from ..services.alert_service import alert_service
from ..database.firestore_store import db
from ..authentication.security import decode_access_token

logger = logging.getLogger("roadguard.websocket")

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info(f"WebSocket client connected for session {session_id}")

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        ai_service.remove_engine(session_id)
        logger.info(f"WebSocket client disconnected for session {session_id}")

    async def send_json(self, session_id: str, data: Dict[str, Any]):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_text(json.dumps(data))

manager = ConnectionManager()

async def handle_monitoring_stream(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)

    # Fetch session record
    session = db.get_document("monitoring_sessions", session_id)
    driver_id = session.get("driver_id", "demo-driver") if session else "demo-driver"

    total_frames = 0
    warnings = 0
    dangers = 0
    criticals = 0

    try:
        while True:
            text_data = await websocket.receive_text()
            try:
                msg = json.loads(text_data)
            except Exception:
                continue

            msg_type = msg.get("type", "frame")

            if msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong", "timestamp": msg.get("timestamp")}))
                continue

            if msg_type == "frame":
                frame_b64 = msg.get("data")
                if not frame_b64:
                    continue

                total_frames += 1
                fps = float(msg.get("fps", 15.0))

                # Decode frame
                rgb_frame = ai_service.decode_frame(frame_b64)
                if rgb_frame is None:
                    continue

                # Run Real AI Detection
                detection = ai_service.process_frame(session_id, rgb_frame, fps=fps)

                # Check Alert Engine
                alert = alert_service.process_detection(session_id, driver_id, detection)
                if alert:
                    lvl = alert.get("alert_level")
                    if lvl == "warning":
                        warnings += 1
                    elif lvl == "danger":
                        dangers += 1
                    elif lvl == "critical":
                        criticals += 1

                # Send real-time response back to client
                response = {
                    "type": "detection",
                    "session_id": session_id,
                    "frame_index": total_frames,
                    "result": detection,
                    "alert": alert
                }
                await websocket.send_text(json.dumps(response))

    except WebSocketDisconnect:
        logger.info(f"Session {session_id} WebSocket disconnected cleanly.")
    except Exception as e:
        logger.warning(f"Session {session_id} WebSocket stream error: {e}")
    finally:
        manager.disconnect(session_id)
        # Update session stats in database
        if session:
            db.update_document("monitoring_sessions", session_id, {
                "total_frames": session.get("total_frames", 0) + total_frames,
                "warning_count": session.get("warning_count", 0) + warnings,
                "danger_count": session.get("danger_count", 0) + dangers,
                "critical_count": session.get("critical_count", 0) + criticals
            })

