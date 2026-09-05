"""
AuditLog model.

Stores system security and administration audit events (Section 24 of PDF spec).
Tracks user actions, role changes, model deployments, farm updates, and system events.
"""
import datetime as dt

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String(120), nullable=False)
    role = Column(String(50), nullable=False)

    action = Column(String(100), nullable=False, index=True)  # USER_CREATED, ROLE_CHANGED, etc.
    entity = Column(String(100), nullable=False)  # User, Farm, Model, etc.
    details = Column(Text, nullable=True)
    result = Column(String(50), nullable=False, default="SUCCESS")  # SUCCESS, FAILED

    timestamp = Column(DateTime, default=dt.datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.username,
            "role": self.role,
            "action": self.action,
            "entity": self.entity,
            "details": self.details,
            "result": self.result,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id} action={self.action!r} username={self.username!r}>"
