"""
Authentication and User Management Router.

Enforces Role-Based Access Control (RBAC) and Audit Logging.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, log_audit, require_role, require_user
from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User

router = APIRouter(prefix="", tags=["Authentication & Security"])


# --- Schemas ---
class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = "farmer"  # farmer, officer, admin
    farm_id: Optional[int] = None


class SendOtpRequest(BaseModel):
    mobile_number: str


class VerifyOtpRequest(BaseModel):
    mobile_number: str
    otp_code: str


class UserCreateRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str
    farm_id: Optional[int] = None


class UserUpdateRequest(BaseModel):
    role: Optional[str] = None
    status: Optional[str] = None  # active, disabled
    full_name: Optional[str] = None
    farm_id: Optional[int] = None


# --- Endpoints ---

@router.post("/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with username or email + password, returning JWT token."""
    login_str = req.username.strip()
    user = (
        db.query(User)
        .filter((User.username == login_str) | (User.email == login_str))
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password.",
        )

    if not verify_password(req.password, user.password_hash):
        log_audit(db, user, "LOGIN_ATTEMPT", "Auth", "Invalid password", result="FAILED")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password.",
        )

    if user.status != "active":
        log_audit(db, user, "LOGIN_ATTEMPT", "Auth", "Account disabled", result="FAILED")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account disabled. Please contact administrator.",
        )

    payload = {
        "sub": str(user.id),
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "name": user.full_name,
        "role": user.role,
        "farm_id": user.farm_id,
    }
    token = create_access_token(payload)

    log_audit(db, user, "USER_LOGIN", "Auth", f"Successful login for role '{user.role}'")

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict(),
    }


@router.post("/auth/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Public registration for new users."""
    if db.query(User).filter((User.username == req.username) | (User.email == req.email)).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered.",
        )

    role = req.role.lower()
    if role not in ["farmer", "officer", "admin"]:
        role = "farmer"

    user = User(
        username=req.username,
        email=req.email,
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        role=role,
        status="active",
        farm_id=req.farm_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit(db, user, "USER_REGISTER", "Auth", f"New user registered with role {role}")

    payload = {
        "sub": str(user.id),
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "name": user.full_name,
        "role": user.role,
        "farm_id": user.farm_id,
    }
    token = create_access_token(payload)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict(),
    }


@router.post("/auth/send-otp")
def send_mobile_otp(req: SendOtpRequest):
    """Generate and send real Fast2SMS OTP to Indian mobile number (+91)."""
    import random
    from app.services.otp_service import send_fast2sms_otp
    otp_code = str(random.randint(100000, 999999))
    return send_fast2sms_otp(req.mobile_number, otp_code)


@router.post("/auth/verify-otp")
def verify_mobile_otp_endpoint(req: VerifyOtpRequest):
    """Verify input OTP code against cached OTP or Fast2SMS verification."""
    from app.services.otp_service import verify_mobile_otp
    is_valid = verify_mobile_otp(req.mobile_number, req.otp_code)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid OTP code. Verification failed.")
    return {"verified": True, "message": "Mobile number verified successfully."}


@router.get("/auth/me")
def get_me(current_user: User = Depends(require_user)):
    """Return currently authenticated user profile."""
    return current_user.to_dict()


# --- Admin User Management Endpoints ---

@router.get("/auth/users")
def list_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"])),
):
    """List all registered system users (Admin only)."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    users = query.order_by(User.id.asc()).all()
    return [u.to_dict() for u in users]


@router.post("/auth/users")
def create_user(
    req: UserCreateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"])),
):
    """Create a new user account (Admin only)."""
    if db.query(User).filter((User.username == req.username) | (User.email == req.email)).first():
        raise HTTPException(status_code=400, detail="Username or email already exists.")

    user = User(
        username=req.username,
        email=req.email,
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        role=req.role.lower(),
        status="active",
        farm_id=req.farm_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit(
        db,
        admin_user,
        "USER_CREATED",
        "User",
        f"Admin created user {user.username} with role {user.role}",
    )

    return user.to_dict()


@router.patch("/auth/users/{user_id}")
def update_user(
    user_id: int,
    req: UserUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"])),
):
    """Update user role, status, or details (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    changes = []
    if req.role and req.role.lower() != user.role:
        changes.append(f"role: {user.role} -> {req.role.lower()}")
        user.role = req.role.lower()

    if req.status and req.status.lower() != user.status:
        changes.append(f"status: {user.status} -> {req.status.lower()}")
        user.status = req.status.lower()

    if req.full_name:
        user.full_name = req.full_name

    if req.farm_id is not None:
        user.farm_id = req.farm_id

    db.commit()
    db.refresh(user)

    log_audit(
        db,
        admin_user,
        "ROLE_CHANGED" if req.role else "USER_UPDATED",
        "User",
        f"Admin updated user {user.username}: {', '.join(changes)}",
    )

    return user.to_dict()


# --- Admin System Audit Logs Endpoints ---

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"])),
):
    """Retrieve system security and administrative audit log history (Admin only)."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [l.to_dict() for l in logs]
