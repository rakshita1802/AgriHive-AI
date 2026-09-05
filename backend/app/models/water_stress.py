"""
Water-Stress Dataset models (Phase 3 of the Final Build Order, Section 31).

This is the REAL ground-truth label store the Feature Selection Engine's
model-evaluation step (Section 8.5) needs. Phase 2 shipped without it and
used a transparent placeholder (`_heuristic_label`, since removed) purely
so the pipeline could be exercised end-to-end. That placeholder is gone as
of Phase 3 - the engine now trains and evaluates only against observations
recorded here.

An observation is a single (farm, date) water-stress assessment from a
source outside the model itself - a field visit, an agronomist review, a
calibrated sensor reading, or a remote-sensing derived index - never a
value computed from the same weather/soil features used as model inputs.
Mixing those would make the "prediction" a restatement of its own inputs.
"""
import datetime as dt
import enum

from sqlalchemy import Column, Date, DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class ObservationSource(str, enum.Enum):
    FIELD_VISIT = "field_visit"          # agronomist / extension worker walked the field
    FARMER_REPORTED = "farmer_reported"  # farmer-logged observation
    SENSOR = "sensor"                    # calibrated in-field soil moisture / stress sensor
    REMOTE_SENSING = "remote_sensing"    # e.g. NDVI/NDWI derived index from satellite imagery
    OTHER = "other"


# 0/1/2 kept consistent with the ordinal risk scale already used
# throughout the Feature Selection Engine and the UI (LOW/MEDIUM/HIGH).
LABEL_NAMES = {0: "LOW", 1: "MEDIUM", 2: "HIGH"}
LABEL_CODES = {v: k for k, v in LABEL_NAMES.items()}


class WaterStressObservation(Base):
    """One real, externally-sourced water-stress label for one farm/date."""

    __tablename__ = "water_stress_observations"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)

    observation_date = Column(Date, nullable=False, index=True)
    label = Column(Integer, nullable=False)  # 0=LOW, 1=MEDIUM, 2=HIGH - see LABEL_NAMES

    source = Column(SAEnum(ObservationSource), nullable=False)
    confidence = Column(Float, nullable=True)  # optional 0-1, e.g. sensor calibration confidence
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=dt.datetime.utcnow)

    farm = relationship("Farm", backref="water_stress_observations")

    @property
    def label_name(self) -> str:
        return LABEL_NAMES.get(self.label, "UNKNOWN")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<WaterStressObservation farm_id={self.farm_id} date={self.observation_date} label={self.label}>"