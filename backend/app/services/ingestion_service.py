"""
Ingestion Service - Module 1 (Data Ingestion), Phase 1.

Implements Section 5's pipeline up to the Raw Data Layer:

    DATA SOURCES -> RAW DATA -> Feature Registry -> ... (Phase 2 picks up from here)

Each fetch_* function calls the relevant API client, then writes rows into
the Raw Data Layer (RawWeatherRecord / RawSoilRecord), and logs an
IngestionRun audit row - success, partial (some days failed / null) or
failed. Nothing here touches the Feature Registry or any ML step directly;
that separation is deliberate (Section 15).
"""
import datetime as dt
import json

from sqlalchemy.orm import Session

from app.models.farm import Farm
from app.models.raw_data import IngestionRun, RawSoilRecord, RawWeatherRecord
from app.services import nasa_power_client, open_meteo_client, soilgrids_client


def _get_farm_or_raise(db: Session, farm_id: int) -> Farm:
    farm = db.get(Farm, farm_id)
    if farm is None:
        raise ValueError(f"Farm {farm_id} not found")
    return farm


def ingest_historical_weather(db: Session, farm_id: int, start_date: dt.date, end_date: dt.date) -> IngestionRun:
    farm = _get_farm_or_raise(db, farm_id)
    run = IngestionRun(farm_id=farm.id, source="nasa_power", status="running", started_at=dt.datetime.utcnow())
    db.add(run)
    db.commit()
    db.refresh(run)

    try:
        records = nasa_power_client.fetch_historical_weather(farm.latitude, farm.longitude, start_date, end_date)
        count = 0
        for rec in records:
            db.add(
                RawWeatherRecord(
                    farm_id=farm.id,
                    source="nasa_power",
                    record_date=rec["date"],
                    temperature_c=rec.get("temperature_c"),
                    rainfall_mm=rec.get("rainfall_mm"),
                    relative_humidity_pct=rec.get("relative_humidity_pct"),
                    wind_speed_ms=rec.get("wind_speed_ms"),
                    solar_radiation=rec.get("solar_radiation"),
                    raw_payload_json=json.dumps(rec.get("raw_payload", {}), default=str),
                )
            )
            count += 1
        run.status = "success"
        run.detail = f"Ingested {count} daily historical weather records from NASA POWER."
    except Exception as exc:  # noqa: BLE001
        run.status = "failed"
        run.detail = str(exc)
    finally:
        run.finished_at = dt.datetime.utcnow()
        db.commit()
        db.refresh(run)

    return run


def ingest_forecast_weather(db: Session, farm_id: int, forecast_days: int = 7) -> IngestionRun:
    farm = _get_farm_or_raise(db, farm_id)
    run = IngestionRun(farm_id=farm.id, source="open_meteo_forecast", status="running", started_at=dt.datetime.utcnow())
    db.add(run)
    db.commit()
    db.refresh(run)

    try:
        records = open_meteo_client.fetch_forecast_weather(farm.latitude, farm.longitude, forecast_days)
        count = 0
        for rec in records:
            db.add(
                RawWeatherRecord(
                    farm_id=farm.id,
                    source="open_meteo_forecast",
                    record_date=rec["date"],
                    temperature_c=rec.get("temperature_c"),
                    rainfall_mm=rec.get("rainfall_mm"),
                    relative_humidity_pct=rec.get("relative_humidity_pct"),
                    wind_speed_ms=rec.get("wind_speed_ms"),
                    evapotranspiration_mm=rec.get("evapotranspiration_mm"),
                    soil_moisture=rec.get("soil_moisture"),
                    raw_payload_json=json.dumps(rec.get("raw_payload", {}), default=str),
                )
            )
            count += 1
        run.status = "success"
        run.detail = f"Ingested {count} daily forecast records from Open-Meteo."
    except Exception as exc:  # noqa: BLE001
        run.status = "failed"
        run.detail = str(exc)
    finally:
        run.finished_at = dt.datetime.utcnow()
        db.commit()
        db.refresh(run)

    return run


def ingest_soil_data(db: Session, farm_id: int, depth: str = "0-5cm") -> IngestionRun:
    farm = _get_farm_or_raise(db, farm_id)
    run = IngestionRun(farm_id=farm.id, source="soilgrids", status="running", started_at=dt.datetime.utcnow())
    db.add(run)
    db.commit()
    db.refresh(run)

    try:
        result = soilgrids_client.fetch_soil_properties(farm.latitude, farm.longitude, depth)
        db.add(
            RawSoilRecord(
                farm_id=farm.id,
                source="soilgrids",
                depth=result.get("depth"),
                soil_ph=result.get("soil_ph"),
                clay_content_pct=result.get("clay_content_pct"),
                sand_content_pct=result.get("sand_content_pct"),
                soil_organic_carbon=result.get("soil_organic_carbon"),
                raw_payload_json=json.dumps(result.get("raw_payload", {}), default=str),
            )
        )
        run.status = "success"
        run.detail = "Ingested SoilGrids soil property snapshot."
    except Exception as exc:  # noqa: BLE001
        run.status = "failed"
        run.detail = str(exc)
    finally:
        run.finished_at = dt.datetime.utcnow()
        db.commit()
        db.refresh(run)

    return run


def ingest_all_sources_for_farm(
    db: Session,
    farm_id: int,
    history_days: int = 60,
    forecast_days: int = 7,
) -> list[IngestionRun]:
    """Convenience orchestrator: pull historical + forecast + soil in one call."""
    end_date = dt.date.today() - dt.timedelta(days=1)  # NASA POWER lags ~1 day
    start_date = end_date - dt.timedelta(days=history_days)

    runs = [
        ingest_historical_weather(db, farm_id, start_date, end_date),
        ingest_forecast_weather(db, farm_id, forecast_days),
        ingest_soil_data(db, farm_id),
    ]
    return runs
