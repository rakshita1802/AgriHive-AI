from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.feature_registry import FeatureRegistryEntry
from app.schemas.feature_registry import FeatureRegistryOut, FeatureRegistryUpdate
from app.services import feature_registry_service

router = APIRouter(prefix="/feature-registry", tags=["Feature Registry (Phase 2)"])


@router.post("/seed", response_model=list[FeatureRegistryOut])
def seed_registry(db: Session = Depends(get_db)):
    """Insert every statically-known Section 6/7 candidate feature (idempotent)."""
    feature_registry_service.seed_registry(db)
    return feature_registry_service.list_registry(db)


@router.post("/refresh", response_model=list[FeatureRegistryOut])
def refresh_registry(farm_ids: list[int] | None = None, db: Session = Depends(get_db)):
    """Recompute availability/quality from the current Raw Data Layer."""
    feature_registry_service.refresh_availability_and_quality(db, farm_ids)
    return feature_registry_service.list_registry(db)


@router.post("/discover/{farm_id}", response_model=list[str])
def discover_new_features(farm_id: int, db: Session = Depends(get_db)):
    """Section 11 - detect new farm-specific attributes not yet in the registry."""
    return feature_registry_service.detect_new_farm_features(db, farm_id)


@router.get("", response_model=list[FeatureRegistryOut])
def list_registry(status: str | None = None, db: Session = Depends(get_db)):
    return feature_registry_service.list_registry(db, status)


@router.patch("/{feature_name}", response_model=FeatureRegistryOut)
def update_feature(feature_name: str, payload: FeatureRegistryUpdate, db: Session = Depends(get_db)):
    entry = db.query(FeatureRegistryEntry).filter_by(feature_name=feature_name).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Feature not found in registry")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(entry, k, v)
    db.commit()
    db.refresh(entry)
    return entry
