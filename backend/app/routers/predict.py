from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.trained_model import TrainedModel
from app.schemas.prediction import PredictionOut, TrainedModelOut, TrainRequest
from app.services import prediction_service

router = APIRouter(prefix="/predict", tags=["Prediction (Phase 3)"])


@router.post("/train", response_model=TrainedModelOut)
def train(payload: TrainRequest, db: Session = Depends(get_db)):
    return prediction_service.train_model(db, payload.farm_ids)


@router.get("/models", response_model=list[TrainedModelOut])
def list_models(db: Session = Depends(get_db)):
    return db.query(TrainedModel).order_by(TrainedModel.trained_at.desc()).all()


@router.get("/models/active", response_model=TrainedModelOut | None)
def active_model(db: Session = Depends(get_db)):
    return prediction_service.get_active_model(db)


@router.post("/{farm_id}", response_model=PredictionOut)
def predict(farm_id: int, db: Session = Depends(get_db)):
    try:
        return prediction_service.predict_for_farm(db, farm_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))