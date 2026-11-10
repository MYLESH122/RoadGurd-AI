import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "ROADGUARD AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "roadguard-ai-secret-key-prod-super-secure-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "roadguard-ai-safety")

    # CORS
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()

