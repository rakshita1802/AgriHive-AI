from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.feature_selection import FeatureSelectionRun
from app.schemas.feature_selection import FeatureSelectionRunOut, FeatureSelectionRunRequest
from app.services import feature_selection_service

router = APIRouter(prefix="/feature-selection", tags=["Feature Selection Engine (Phase 2)"])


@router.post("/run", response_model=FeatureSelectionRunOut)
def run_engine(payload: FeatureSelectionRunRequest, db: Session = Depends(get_db)):
    return feature_selection_service.run_feature_selection(db, payload.farm_ids, payload.notes)


@router.get("/runs", response_model=list[FeatureSelectionRunOut])
def list_runs(db: Session = Depends(get_db)):
    return db.query(FeatureSelectionRun).order_by(FeatureSelectionRun.created_at.desc()).all()


@router.get("/runs/{run_id}", response_model=FeatureSelectionRunOut)
def get_run(run_id: int, db: Session = Depends(get_db)):
    run = db.get(FeatureSelectionRun, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return run
