"""
User model.

Represents an authenticated user in AgriHive AI with Role-Based Access Control (RBAC).
Supported roles: farmer, officer, admin.
"""
import datetime as dt

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(120), nullable=False, unique=True, index=True)
    email = Column(String(160), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(160), nullable=False)

    # Role: "farmer", "officer", or "admin"
    role = Column(String(50), nullable=False, default="farmer", index=True)

    # Account Status: "active" or "disabled"
    status = Column(String(50), nullable=False, default="active")

    # Optional association to a farm for farmer users
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True)

    created_at = Column(DateTime, default=dt.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "status": self.status,
            "farm_id": self.farm_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r} role={self.role!r}>"
