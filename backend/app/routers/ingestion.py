from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.ingestion import (
    ForecastWeatherRequest,
    HistoricalWeatherRequest,
    IngestionRunOut,
    RawSoilRecordOut,
    RawWeatherRecordOut,
    SoilIngestionRequest,
)
from app.services import ingestion_service
from app.models.raw_data import RawSoilRecord, RawWeatherRecord

router = APIRouter(prefix="/ingestion", tags=["Data Ingestion (Phase 1)"])


@router.post("/weather/historical", response_model=IngestionRunOut)
def ingest_historical(payload: HistoricalWeatherRequest, db: Session = Depends(get_db)):
    try:
        return ingestion_service.ingest_historical_weather(db, payload.farm_id, payload.start_date, payload.end_date)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/weather/forecast", response_model=IngestionRunOut)
def ingest_forecast(payload: ForecastWeatherRequest, db: Session = Depends(get_db)):
    try:
        return ingestion_service.ingest_forecast_weather(db, payload.farm_id, payload.forecast_days)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/soil", response_model=IngestionRunOut)
def ingest_soil(payload: SoilIngestionRequest, db: Session = Depends(get_db)):
    try:
        return ingestion_service.ingest_soil_data(db, payload.farm_id, payload.depth)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/farm/{farm_id}/all", response_model=list[IngestionRunOut])
def ingest_all_for_farm(farm_id: int, history_days: int = 60, forecast_days: int = 7, db: Session = Depends(get_db)):
    try:
        return ingestion_service.ingest_all_sources_for_farm(db, farm_id, history_days, forecast_days)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/weather/{farm_id}", response_model=list[RawWeatherRecordOut])
def get_weather_records(farm_id: int, source: str | None = None, db: Session = Depends(get_db)):
    q = db.query(RawWeatherRecord).filter(RawWeatherRecord.farm_id == farm_id)
    if source:
        q = q.filter(RawWeatherRecord.source == source)
    return q.order_by(RawWeatherRecord.record_date).all()


@router.get("/soil/{farm_id}", response_model=list[RawSoilRecordOut])
def get_soil_records(farm_id: int, db: Session = Depends(get_db)):
    return (
        db.query(RawSoilRecord)
        .filter(RawSoilRecord.farm_id == farm_id)
        .order_by(RawSoilRecord.ingested_at.desc())
        .all()
    )
