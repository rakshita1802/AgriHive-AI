from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional

from app.database import get_db
from app.services.virtual_farm_service import get_virtual_farm_state, run_what_if_simulation, update_custom_farmer_entry

router = APIRouter(prefix="/virtual-farm", tags=["Virtual Farm Simulator"])


class WhatIfSimulationRequest(BaseModel):
    farm_id: int = 1
    irrigation_level_pct: float = Field(60.0, ge=0.0, le=100.0)
    rainfall_mm: float = Field(20.0, ge=0.0, le=200.0)
    temperature_c: float = Field(32.0, ge=10.0, le=50.0)
    fertilizer_npk_pct: float = Field(80.0, ge=0.0, le=100.0)
    scenario_name: str = "Scenario 1"


class CustomFarmerEntryRequest(BaseModel):
    farm_id: int = 1
    farm_name: str = "My Custom Farm"
    crop: str = "Rice"
    irrigation_method: str = "Drip"
    soil_ph: float = 6.5
    soil_moisture_pct: float = 40.0
    temperature_c: float = 31.0
    humidity_pct: float = 65.0
    rainfall_24h_mm: float = 5.0
    management_history: str = "Organic compost applied"


@router.get("/state/{farm_id}")
def get_farm_state(farm_id: int, db: Session = Depends(get_db)):
    """Retrieve current physical virtual farm state for a farm."""
    try:
        return get_virtual_farm_state(db, farm_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/simulate")
def simulate_scenario_post(req: WhatIfSimulationRequest, db: Session = Depends(get_db)):
    """Run what-if scenario simulation for a farm (POST method)."""
    try:
        return run_what_if_simulation(
            db,
            farm_id=req.farm_id,
            irrigation_level_pct=req.irrigation_level_pct,
            rainfall_mm=req.rainfall_mm,
            temperature_c=req.temperature_c,
            fertilizer_npk_pct=req.fertilizer_npk_pct,
            scenario_name=req.scenario_name
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/simulate")
def simulate_scenario_get(
    farm_id: int = Query(1),
    irrigation_level_pct: float = Query(60.0),
    rainfall_mm: float = Query(20.0),
    temperature_c: float = Query(32.0),
    fertilizer_npk_pct: float = Query(80.0),
    scenario_name: str = Query("Scenario 1"),
    db: Session = Depends(get_db)
):
    """Run what-if scenario simulation for a farm (GET method fallback)."""
    try:
        return run_what_if_simulation(
            db,
            farm_id=farm_id,
            irrigation_level_pct=irrigation_level_pct,
            rainfall_mm=rainfall_mm,
            temperature_c=temperature_c,
            fertilizer_npk_pct=fertilizer_npk_pct,
            scenario_name=scenario_name
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/custom-entry")
def process_custom_farmer_entry(req: CustomFarmerEntryRequest, db: Session = Depends(get_db)):
    """Process real farmer entries and compute custom predictions benchmarked against regional seed data."""
    try:
        return update_custom_farmer_entry(db, req.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
