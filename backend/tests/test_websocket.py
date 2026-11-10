import pytest
from fastapi.testclient import TestClient
import base64
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from backend.app.main import app

client = TestClient(app)

def test_websocket_monitoring_ping_pong():
    with client.websocket_connect("/ws/monitoring/test-sess-001") as websocket:
        websocket.send_json({"type": "ping", "timestamp": 1234567890})
        data = websocket.receive_json()
        assert data["type"] == "pong"
        assert data["timestamp"] == 1234567890

def test_websocket_monitoring_frame_detection():
    # 1x1 black pixel PNG base64
    dummy_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    with client.websocket_connect("/ws/monitoring/test-sess-002") as websocket:
        websocket.send_json({
            "type": "frame",
            "data": dummy_b64,
            "fps": 15.0
        })
        data = websocket.receive_json()
        assert data["type"] == "detection"
        assert "result" in data
        assert data["result"]["face_detected"] is False
        assert data["result"]["eye_status"] == "not_visible"
        assert "risk_level" in data["result"]

