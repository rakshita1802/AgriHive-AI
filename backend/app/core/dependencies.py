"""
FastAPI Dependencies for Role-Based Access Control (RBAC).

Provides current user resolution, role authorization checks, and audit logging helpers.
"""
from typing import Callable, List, Optional

from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Extract and validate JWT token from 'Authorization: Bearer <token>' header.
    Returns the User model if valid, or None if anonymous/unauthenticated.
    """
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None

    payload = decode_access_token(token)
    if not payload:
        return None

    user_id = payload.get("sub") or payload.get("user_id")
    if not user_id:
        return None

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or user.status != "active":
        return None

    return user


def require_user(user: Optional[User] = Depends(get_current_user)) -> User:
    """Enforce that the request is made by an active authenticated user."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in with a valid user account.",
        )
    return user


def require_role(allowed_roles: List[str]) -> Callable:
    """
    Dependency factory to enforce specific roles (e.g. ['admin'], ['farmer', 'officer', 'admin']).
    """
    def _role_checker(user: User = Depends(require_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}. Your role is '{user.role}'.",
            )
        return user

    return _role_checker


def log_audit(
    db: Session,
    user: Optional[User],
    action: str,
    entity: str,
    details: str = "",
    result: str = "SUCCESS",
):
    """Utility to log a system event to audit_logs table."""
    try:
        log_entry = AuditLog(
            user_id=user.id if user else None,
            username=user.username if user else "SYSTEM",
            role=user.role if user else "SYSTEM",
            action=action,
            entity=entity,
            details=details,
            result=result,
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Audit log failed: {e}")
