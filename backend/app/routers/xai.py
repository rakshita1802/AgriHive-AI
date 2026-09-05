from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.xai_service import compute_shap_explanations

router = APIRouter(prefix="/xai", tags=["Explainable AI (XAI)"])


@router.get("/explain/{farm_id}")
def get_xai_explanation(farm_id: int, db: Session = Depends(get_db)):
    """Retrieve SHAP feature importance, top risk factors, and plain language explanations for a farm."""
    try:
        return compute_shap_explanations(db, farm_id=farm_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
