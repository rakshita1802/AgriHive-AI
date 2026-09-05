from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.water_stress import WaterStressObservation
from app.schemas.water_stress import (
    BulkImportRequest,
    BulkImportResult,
    LabelSummary,
    WaterStressObservationCreate,
    WaterStressObservationOut,
)
from app.services import label_service

router = APIRouter(prefix="/labels", tags=["Water-Stress Labels (Phase 3)"])


@router.post("", response_model=WaterStressObservationOut, status_code=201)
def create_observation(payload: WaterStressObservationCreate, db: Session = Depends(get_db)):
    from app.models.farm import Farm

    if db.get(Farm, payload.farm_id) is None:
        raise HTTPException(status_code=404, detail=f"Farm {payload.farm_id} not found")

    obs = WaterStressObservation(**payload.model_dump())
    db.add(obs)
    db.commit()
    db.refresh(obs)
    return obs


@router.post("/bulk", response_model=BulkImportResult)
def bulk_import(payload: BulkImportRequest, db: Session = Depends(get_db)):
    imported, skipped, errors = label_service.bulk_import_csv(db, payload.csv_text)
    return BulkImportResult(imported=imported, skipped=skipped, errors=errors)


@router.get("", response_model=list[WaterStressObservationOut])
def list_observations(farm_id: int | None = None, db: Session = Depends(get_db)):
    return label_service.list_observations(db, farm_id)


@router.get("/summary", response_model=list[LabelSummary])
def label_summary(db: Session = Depends(get_db)):
    return label_service.summary(db)


@router.delete("/{observation_id}", status_code=204)
def delete_observation(observation_id: int, db: Session = Depends(get_db)):
    if not label_service.delete_observation(db, observation_id):
        raise HTTPException(status_code=404, detail="Observation not found")