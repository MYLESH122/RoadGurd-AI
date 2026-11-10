import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from ..models.schemas import UserRegister, UserLogin, Token, UserResponse
from ..database.firestore_store import db
from ..authentication.security import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
async def register(req: UserRegister):
    # Check if email exists
    existing = db.query_collection("users", {"email": req.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email is already registered"
        )

    user_id = f"user-{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "id": user_id,
        "email": req.email.lower(),
        "hashed_password": get_password_hash(req.password),
        "full_name": req.full_name,
        "phone_number": req.phone_number,
        "role": req.role,
        "created_at": now
    }
    db.create_document("users", user_doc, doc_id=user_id)

    # Initialize Driver profile record
    driver_doc = {
        "user_id": user_id,
        "full_name": req.full_name,
        "phone_number": req.phone_number,
        "license_number": "PENDING-VERIFY",
        "vehicle_plate": "NOT-ASSIGNED",
        "vehicle_type": "sedan",
        "total_driving_hours": 0.0,
        "safety_score": 100,
        "status": "inactive",
        "created_at": now
    }
    db.create_document("drivers", driver_doc, doc_id=user_id)

    # Issue JWT token
    access_token = create_access_token(data={"sub": user_id, "email": req.email.lower(), "role": req.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user_id,
        "email": req.email.lower(),
        "full_name": req.full_name,
        "role": req.role
    }

@router.post("/login", response_model=Token)
async def login(req: UserLogin):
    users = db.query_collection("users", {"email": req.email.lower()})
    if not users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    user = users[0]
    if not verify_password(req.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    access_token = create_access_token(data={"sub": user["id"], "email": user["email"], "role": user.get("role", "driver")})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user["id"],
        "email": user["email"],
        "full_name": user.get("full_name", ""),
        "role": user.get("role", "driver")
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "full_name": current_user.get("full_name", ""),
        "phone_number": current_user.get("phone_number"),
        "role": current_user.get("role", "driver"),
        "created_at": current_user.get("created_at", "")
    }

