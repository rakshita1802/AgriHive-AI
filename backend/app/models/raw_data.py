"""
Raw Data Layer models (Section 5 - Data Architecture, Section 15).

AgriHive never sends the complete API response to the ML model. These
tables store the RAW ingested payloads (already limited to the candidate
variables listed in Section 6, not the full API surface - see
`app/core/domain_rules.py::CANDIDATE_VARIABLES` for the whitelist applied
at ingestion time) tagged by source and farm, kept separate from anything
the ML engine will eventually consume. The Feature Registry and Feature
Selection Engine sit between this layer and any model.
"""
import datetime as dt

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class RawWeatherRecord(Base):
    """One row = one farm, one date, one source (historical or forecast)."""

    __tablename__ = "raw_weather_records"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)

    source = Column(String(30), nullable=False)  # 'nasa_power' | 'open_meteo_forecast' | 'open_meteo_archive'
    record_date = Column(Date, nullable=False, index=True)

    temperature_c = Column(Float, nullable=True)
    rainfall_mm = Column(Float, nullable=True)
    relative_humidity_pct = Column(Float, nullable=True)
    wind_speed_ms = Column(Float, nullable=True)
    solar_radiation = Column(Float, nullable=True)
    evapotranspiration_mm = Column(Float, nullable=True)
    soil_moisture = Column(Float, nullable=True)

    # Full raw API payload for this single record, kept for audit/debug only.
    # This is NEVER read directly by the ML engine - only the typed columns
    # above (already filtered to Section 6/7 candidate variables) are.
    raw_payload_json = Column(Text, nullable=True)

    ingested_at = Column(DateTime, default=dt.datetime.utcnow)

    farm = relationship("Farm", backref="weather_records")


class RawSoilRecord(Base):
    """One row = one farm's most recent SoilGrids snapshot."""

    __tablename__ = "raw_soil_records"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)

    source = Column(String(30), nullable=False, default="soilgrids")
    depth = Column(String(20), nullable=True)  # e.g. "0-5cm"

    soil_ph = Column(Float, nullable=True)
    clay_content_pct = Column(Float, nullable=True)
    sand_content_pct = Column(Float, nullable=True)
    soil_organic_carbon = Column(Float, nullable=True)

    raw_payload_json = Column(Text, nullable=True)

    ingested_at = Column(DateTime, default=dt.datetime.utcnow)

    farm = relationship("Farm", backref="soil_records")


class IngestionRun(Base):
    """Audit trail of every ingestion pipeline execution (Section 15 - audit)."""

    __tablename__ = "ingestion_runs"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)
    source = Column(String(30), nullable=False)
    status = Column(String(20), nullable=False)  # 'success' | 'failed' | 'partial'
    detail = Column(Text, nullable=True)
    started_at = Column(DateTime, default=dt.datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)

    farm = relationship("Farm", backref="ingestion_runs")
