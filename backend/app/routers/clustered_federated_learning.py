from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.services.clustered_fl_engine import cluster_farms_by_features, run_clustered_fl_training
from app.services.clustered_federated_learning_service import run_clustered_federated_training as run_plan

router = APIRouter(prefix="/clustered-fl", tags=["Clustered Federated Learning"])


@router.get("/clusters")
def get_clusters(db: Session = Depends(get_db)):
    """Retrieve current farm cluster assignments based on environmental similarity."""
    return cluster_farms_by_features(db)


@router.post("/train")
def train_clustered_fl(n_rounds: int = Query(5, ge=1, le=20), db: Session = Depends(get_db)):
    """Run Clustered Federated Neural Network training rounds across farm clusters."""
    return run_clustered_fl_training(db, n_rounds=n_rounds)


@router.post("/plan")
def plan_training(payload: dict | None = None, db: Session = Depends(get_db)):
    """Generate cluster assignment plan and data summary."""
    farm_ids = payload.get("farm_ids") if payload else None
    return run_plan(db, farm_ids=farm_ids)
