from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.farm import Farm
from app.models.raw_data import IngestionRun, RawSoilRecord, RawWeatherRecord
from app.models.water_stress import WaterStressObservation
from app.schemas.farm import FarmCreate, FarmOut

router = APIRouter(prefix="/farms", tags=["Farms"])


@router.post("", response_model=FarmOut, status_code=201)
def create_farm(payload: FarmCreate, db: Session = Depends(get_db)):
    name_clean = payload.name.strip()
    if not name_clean:
        raise HTTPException(status_code=400, detail="Farm name cannot be empty")

    existing = db.query(Farm).filter(func.lower(Farm.name) == func.lower(name_clean)).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Farm '{name_clean}' already exists")

    payload_dict = payload.model_dump()
    payload_dict["name"] = name_clean
    farm = Farm(**payload_dict)
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("", response_model=list[FarmOut])
def list_farms(db: Session = Depends(get_db)):
    return db.query(Farm).order_by(Farm.id).all()


@router.get("/{farm_id}", response_model=FarmOut)
def get_farm(farm_id: int, db: Session = Depends(get_db)):
    farm = db.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm


@router.delete("/{farm_id}", status_code=204)
def delete_farm(farm_id: int, db: Session = Depends(get_db)):
    farm = db.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")

    # Cascade delete child records referencing this farm_id to satisfy foreign key constraints
    db.query(RawWeatherRecord).filter(RawWeatherRecord.farm_id == farm_id).delete(synchronize_session=False)
    db.query(RawSoilRecord).filter(RawSoilRecord.farm_id == farm_id).delete(synchronize_session=False)
    db.query(IngestionRun).filter(IngestionRun.farm_id == farm_id).delete(synchronize_session=False)
    db.query(WaterStressObservation).filter(WaterStressObservation.farm_id == farm_id).delete(synchronize_session=False)

    db.delete(farm)
    db.commit()

