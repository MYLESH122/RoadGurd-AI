import os
os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib")

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database.firebase import init_firebase
from .routes.auth import router as auth_router
from .routes.drivers import router as drivers_router
from .routes.monitoring import router as monitoring_router
from .routes.alerts import router as alerts_router
from .routes.emergency_contacts import router as emergency_contacts_router
from .routes.dashboard import router as dashboard_router
from .websocket.stream_handler import handle_monitoring_stream

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("roadguard.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ROADGUARD AI Platform...")
    init_firebase()
    logger.info("ROADGUARD AI Platform operational.")
    yield
    logger.info("Shutting down ROADGUARD AI Platform...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Real-Time AI-Powered Driver Fatigue Detection & Road Safety Monitoring Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root & Health check
@app.get("/")
def read_root():
    return {
        "app": "ROADGUARD AI",
        "tagline": "Stay Awake. Stay Alert. Stay Safe.",
        "status": "online",
        "version": "1.0.0",
        "api_docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "roadguard-backend"}

# Register API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(drivers_router, prefix=settings.API_V1_STR)
app.include_router(monitoring_router, prefix=settings.API_V1_STR)
app.include_router(alerts_router, prefix=settings.API_V1_STR)
app.include_router(emergency_contacts_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)

# Real-Time Secure WebSocket Route
@app.websocket("/ws/monitoring/{session_id}")
async def websocket_monitoring_endpoint(websocket: WebSocket, session_id: str):
    await handle_monitoring_stream(websocket, session_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

