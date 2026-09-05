"""
Feature Registry Service - Module 2 (Section 9).

Responsibilities:
  1. Seed the registry from the known candidate feature list
     (app/core/domain_rules.py), each starting life as CANDIDATE.
  2. Recompute availability/quality against the Raw Data Layer that
     Module 1 (ingestion) has populated.
  3. Detect brand-new farm attributes not in the static candidate list
     (Section 11 - New Farm and New Feature Handling) and register them
     as CANDIDATE + status LOCAL-pending-evaluation.
"""
import json

from sqlalchemy.orm import Session

from app.core.domain_rules import CANDIDATE_FEATURES
from app.models.farm import Farm
from app.models.feature_registry import FeatureRegistryEntry, FeatureStatus
from app.models.raw_data import RawSoilRecord, RawWeatherRecord

# Maps a feature_name to the raw-data column it's stored in, and which raw
# table to look at, so availability/quality can be computed generically.
_WEATHER_FIELDS = {
    "temperature_c",
    "rainfall_mm",
    "relative_humidity_pct",
    "wind_speed_ms",
    "solar_radiation",
    "evapotranspiration_mm",
    "soil_moisture",
}
_SOIL_FIELDS = {"soil_ph", "clay_content_pct", "sand_content_pct", "soil_organic_carbon"}
_FARM_FIELDS = {"crop", "irrigation_method"}


def seed_registry(db: Session) -> list[FeatureRegistryEntry]:
    """Idempotently insert every statically-known candidate feature."""
    created = []
    for fd in CANDIDATE_FEATURES:
        existing = db.query(FeatureRegistryEntry).filter_by(feature_name=fd.name).first()
        if existing:
            continue
        entry = FeatureRegistryEntry(
            feature_name=fd.name,
            source=fd.source,
            unit=fd.unit,
            data_type=fd.data_type,
            purpose=fd.purpose,
            status=FeatureStatus.CANDIDATE,
            required_for="water_stress_risk",
            domain_relevance_note=fd.domain_note,
        )
        db.add(entry)
        created.append(entry)
    db.commit()
    return created


def _compute_weather_stats(db: Session, field: str, farm_ids: list[int]) -> tuple[float, float]:
    rows = (
        db.query(getattr(RawWeatherRecord, field))
        .filter(RawWeatherRecord.farm_id.in_(farm_ids))
        .all()
    )
    total = len(rows)
    if total == 0:
        return 0.0, 0.0
    valid = sum(1 for (v,) in rows if v is not None)
    return valid / total, valid / total  # availability == quality here (missingness is the main quality issue)


def _compute_soil_stats(db: Session, field: str, farm_ids: list[int]) -> tuple[float, float]:
    rows = (
        db.query(getattr(RawSoilRecord, field))
        .filter(RawSoilRecord.farm_id.in_(farm_ids))
        .all()
    )
    total = len(rows)
    if total == 0:
        return 0.0, 0.0
    valid = sum(1 for (v,) in rows if v is not None)
    return valid / total, valid / total


def _compute_farm_field_stats(db: Session, field: str, farm_ids: list[int]) -> tuple[float, float]:
    rows = db.query(getattr(Farm, field)).filter(Farm.id.in_(farm_ids)).all()
    total = len(rows)
    if total == 0:
        return 0.0, 0.0
    valid = sum(1 for (v,) in rows if v not in (None, ""))
    return valid / total, valid / total


def refresh_availability_and_quality(db: Session, farm_ids: list[int] | None = None) -> list[FeatureRegistryEntry]:
    """Recompute availability + quality for every registered feature against
    whatever raw data currently exists for the given farms (or all farms)."""
    if farm_ids is None:
        farm_ids = [f.id for f in db.query(Farm.id).all()]

    entries = db.query(FeatureRegistryEntry).all()
    for entry in entries:
        if entry.feature_name in _WEATHER_FIELDS:
            availability, quality = _compute_weather_stats(db, entry.feature_name, farm_ids)
        elif entry.feature_name in _SOIL_FIELDS:
            availability, quality = _compute_soil_stats(db, entry.feature_name, farm_ids)
        elif entry.feature_name in _FARM_FIELDS:
            availability, quality = _compute_farm_field_stats(db, entry.feature_name, farm_ids)
        else:
            continue  # unknown/new feature - left untouched here
        entry.availability = round(availability, 3)
        entry.quality = round(quality, 3)
    db.commit()
    return entries


def detect_new_farm_features(db: Session, farm_id: int) -> list[str]:
    """
    Section 11 - New Farm and New Feature Handling: inspect a farm's
    extra_attributes_json for keys not already present in the registry, and
    register them as CANDIDATE/LOCAL-only pending evidence from more farms.
    Returns the list of newly discovered feature names.
    """
    farm = db.get(Farm, farm_id)
    if farm is None or not farm.extra_attributes_json:
        return []

    try:
        extra = json.loads(farm.extra_attributes_json)
    except json.JSONDecodeError:
        return []

    known_names = {e.feature_name for e in db.query(FeatureRegistryEntry).all()}
    discovered = []
    for key, value in extra.items():
        if key in known_names:
            continue
        entry = FeatureRegistryEntry(
            feature_name=key,
            source="farm_input",
            unit=None,
            data_type="numeric" if isinstance(value, (int, float)) else "text",
            purpose=(
                "New farm-specific attribute discovered via new-farm onboarding "
                "(Section 11). Retained locally until enough farms report it to "
                "evaluate as a candidate shared feature."
            ),
            status=FeatureStatus.LOCAL,
            availability=None,
            quality=None,
            required_for=None,
            domain_relevance_note="Not yet evaluated - insufficient cross-farm evidence.",
        )
        db.add(entry)
        discovered.append(key)
    db.commit()
    return discovered


def list_registry(db: Session, status: str | None = None) -> list[FeatureRegistryEntry]:
    q = db.query(FeatureRegistryEntry)
    if status:
        q = q.filter(FeatureRegistryEntry.status == status)
    return q.order_by(FeatureRegistryEntry.feature_name).all()
