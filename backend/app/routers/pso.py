from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.pso_optimizer import pso_search_intervention

router = APIRouter(prefix="/optimization", tags=["Swarm Intelligence Optimization"])


@router.post("/pso/{farm_id}")
def run_pso_optimization(
    farm_id: int,
    max_water_available_l: float = Query(150.0, ge=10.0, le=500.0),
    db: Session = Depends(get_db)
):
    """Run Particle Swarm Optimization to search optimal intervention under resource constraints."""
    try:
        return pso_search_intervention(db, farm_id=farm_id, max_water_available_l=max_water_available_l)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
