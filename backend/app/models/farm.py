"""
Farm model.

Represents a simulated farm client (Section 22 - Flower: Client 1 = Farm A,
etc.). Holds only the farm-provided attributes described in the plan:
location, crop, irrigation method, soil pH (farm-declared), and management
history notes. This is intentionally NOT the Virtual Farm (Section 16,
Phase 9) - it is the registration record used by the Data Ingestion layer.
"""
import datetime as dt

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from app.database import Base


class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, unique=True, index=True)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    crop = Column(String(80), nullable=True)
    irrigation_method = Column(String(80), nullable=True)

    # Farm-declared soil pH (may differ / supplement SoilGrids estimate).
    soil_ph_farm_declared = Column(Float, nullable=True)

    # Free-text farm management history (Section 2 - Local Intelligence).
    management_history = Column(Text, nullable=True)

    # Arbitrary JSON-ish text blob for any additional farm-specific
    # attribute a new farm might introduce (Section 11 - New Farm and
    # New Feature Handling). Stored as raw text; Feature Detection parses it.
    extra_attributes_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=dt.datetime.utcnow)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Farm id={self.id} name={self.name!r}>"
