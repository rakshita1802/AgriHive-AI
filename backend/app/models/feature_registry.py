"""
Feature Registry model (Section 9 of the plan).

A central metadata structure describing every candidate feature:
feature_name, source, unit, data_type, purpose, status, availability,
quality, required_for.

Status values (Section 9):
  GLOBAL    - suitable for shared modelling (Federated Learning)
  LOCAL     - retained for farm-specific analysis only
  CANDIDATE - still being evaluated by the Feature Selection Engine
  EXCLUDED  - not used by the current model
"""
import datetime as dt
import enum
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum, Float, Integer, String, Text

from app.database import Base


class FeatureStatus(str, enum.Enum):
    GLOBAL = "GLOBAL"
    LOCAL = "LOCAL"
    CANDIDATE = "CANDIDATE"
    EXCLUDED = "EXCLUDED"


class FeatureRegistryEntry(Base):
    __tablename__ = "feature_registry"

    id = Column(Integer, primary_key=True, index=True)

    feature_name = Column(String(80), nullable=False, unique=True, index=True)
    source = Column(String(40), nullable=False)  # nasa_power | open_meteo | soilgrids | faostat | farm_input
    unit = Column(String(30), nullable=True)
    data_type = Column(String(20), nullable=False, default="numeric")  # numeric | categorical | text
    purpose = Column(Text, nullable=True)  # why this feature might matter (Section 4/8.1)

    status = Column(Enum(FeatureStatus), nullable=False, default=FeatureStatus.CANDIDATE)

    # availability: fraction (0-1) of farms/records where this feature is present
    availability = Column(Float, nullable=True)
    # quality: fraction (0-1) of valid (non-missing, in-range) values observed
    quality = Column(Float, nullable=True)

    required_for = Column(String(120), nullable=True, default="water_stress_risk")

    domain_relevance_note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: dt.datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: dt.datetime.now(timezone.utc), onupdate=lambda: dt.datetime.now(timezone.utc))

    def __repr__(self) -> str:  # pragma: no cover
        return f"<FeatureRegistryEntry {self.feature_name} status={self.status}>"
