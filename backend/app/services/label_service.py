"""
Water-Stress label service (Phase 3).

Handles storage of real, externally-sourced ground-truth observations, and
bulk import from CSV text produced by field-visit logs, agronomist exports,
sensor exports, or a remote-sensing pipeline. This module never generates
label values itself - it only validates and stores what's handed to it.
"""
import csv
import datetime as dt
import io

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.farm import Farm
from app.models.water_stress import LABEL_CODES, LABEL_NAMES, ObservationSource, WaterStressObservation

REQUIRED_ANY_OF = ({"farm_id"}, {"farm_name"})


def _resolve_label(raw: str) -> int:
    raw = (raw or "").strip()
    if raw.upper() in LABEL_CODES:
        return LABEL_CODES[raw.upper()]
    if raw in ("0", "1", "2"):
        return int(raw)
    raise ValueError(f"invalid label '{raw}' (expected LOW/MEDIUM/HIGH or 0/1/2)")


def _resolve_source(raw: str) -> ObservationSource:
    raw = (raw or "").strip().lower()
    try:
        return ObservationSource(raw)
    except ValueError:
        valid = ", ".join(s.value for s in ObservationSource)
        raise ValueError(f"invalid source '{raw}' (expected one of: {valid})")


def bulk_import_csv(db: Session, csv_text: str) -> tuple[int, int, list[str]]:
    """
    Parses real observation rows from CSV text and inserts them.
    Expected columns (header row required): farm_id or farm_name,
    observation_date, label, source, confidence (optional), notes (optional).
    Returns (imported_count, skipped_count, error_messages).
    """
    reader = csv.DictReader(io.StringIO(csv_text.strip()))
    if reader.fieldnames is None:
        return 0, 0, ["CSV has no header row."]

    fieldnames = {f.strip().lower() for f in reader.fieldnames}
    if "farm_id" not in fieldnames and "farm_name" not in fieldnames:
        return 0, 0, ["CSV must include a 'farm_id' or 'farm_name' column."]
    for required in ("observation_date", "label", "source"):
        if required not in fieldnames:
            return 0, 0, [f"CSV is missing required column '{required}'."]

    name_to_id = {f.name: f.id for f in db.query(Farm.id, Farm.name).all()} if "farm_name" in fieldnames else {}

    imported = 0
    skipped = 0
    errors: list[str] = []
    to_add = []

    for i, row in enumerate(reader, start=2):  # start=2: header is row 1
        row = {k.strip().lower(): (v.strip() if v is not None else v) for k, v in row.items()}
        try:
            if row.get("farm_id"):
                farm_id = int(row["farm_id"])
            else:
                farm_name = row.get("farm_name")
                if farm_name not in name_to_id:
                    raise ValueError(f"unknown farm_name '{farm_name}'")
                farm_id = name_to_id[farm_name]

            observation_date = dt.date.fromisoformat(row["observation_date"])
            label = _resolve_label(row["label"])
            source = _resolve_source(row["source"])
            confidence = float(row["confidence"]) if row.get("confidence") else None
            notes = row.get("notes") or None

            to_add.append(
                WaterStressObservation(
                    farm_id=farm_id,
                    observation_date=observation_date,
                    label=label,
                    source=source,
                    confidence=confidence,
                    notes=notes,
                )
            )
            imported += 1
        except Exception as exc:  # noqa: BLE001
            skipped += 1
            errors.append(f"row {i}: {exc}")

    if to_add:
        db.add_all(to_add)
        db.commit()

    return imported, skipped, errors


def list_observations(db: Session, farm_id: int | None = None) -> list[WaterStressObservation]:
    q = db.query(WaterStressObservation)
    if farm_id is not None:
        q = q.filter(WaterStressObservation.farm_id == farm_id)
    return q.order_by(WaterStressObservation.observation_date.desc()).all()


def delete_observation(db: Session, observation_id: int) -> bool:
    obs = db.get(WaterStressObservation, observation_id)
    if obs is None:
        return False
    db.delete(obs)
    db.commit()
    return True


def summary(db: Session) -> list[dict]:
    """Per-farm counts, used by the dashboard and the Labels tab."""
    rows = (
        db.query(
            WaterStressObservation.farm_id,
            Farm.name,
            WaterStressObservation.label,
            func.count(WaterStressObservation.id),
            func.min(WaterStressObservation.observation_date),
            func.max(WaterStressObservation.observation_date),
        )
        .join(Farm, Farm.id == WaterStressObservation.farm_id)
        .group_by(WaterStressObservation.farm_id, WaterStressObservation.label)
        .all()
    )

    by_farm: dict[int, dict] = {}
    for farm_id, farm_name, label, count, min_d, max_d in rows:
        entry = by_farm.setdefault(
            farm_id,
            {"farm_id": farm_id, "farm_name": farm_name, "total": 0, "low": 0, "medium": 0, "high": 0,
             "earliest_date": None, "latest_date": None},
        )
        entry["total"] += count
        entry[LABEL_NAMES[label].lower()] += count
        if entry["earliest_date"] is None or min_d < entry["earliest_date"]:
            entry["earliest_date"] = min_d
        if entry["latest_date"] is None or max_d > entry["latest_date"]:
            entry["latest_date"] = max_d

    return list(by_farm.values())