import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from backend.app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "ROADGUARD AI"
    assert data["status"] == "online"

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_auth_login_demo_driver():
    response = client.post("/api/v1/auth/login", json={
        "email": "driver@roadguard.ai",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["email"] == "driver@roadguard.ai"

def test_driver_profile():
    # Login first
    login_res = client.post("/api/v1/auth/login", json={
        "email": "driver@roadguard.ai",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    profile_res = client.get("/api/v1/drivers/profile", headers=headers)
    assert profile_res.status_code == 200
    pdata = profile_res.json()
    assert pdata["full_name"] == "Marcus Vance"
    assert pdata["vehicle_plate"] == "RG-772-AI"

def test_monitoring_start_and_stop():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "driver@roadguard.ai",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Start session
    start_res = client.post("/api/v1/monitoring/start", json={
        "device_type": "web",
        "vehicle_plate": "RG-772-AI",
        "consent_given": True
    }, headers=headers)
    assert start_res.status_code == 200
    sess = start_res.json()
    assert sess["status"] == "active"
    session_id = sess["session_id"]

    # Stop session
    stop_res = client.post("/api/v1/monitoring/stop", json={
        "session_id": session_id,
        "summary_notes": "Shift completed safely"
    }, headers=headers)
    assert stop_res.status_code == 200
    stopped_sess = stop_res.json()
    assert stopped_sess["status"] == "completed"

def test_dashboard_statistics():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "driver@roadguard.ai",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    stats_res = client.get("/api/v1/dashboard/statistics", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_drivers" in stats
    assert "active_sessions" in stats
    assert "recent_activity" in stats

