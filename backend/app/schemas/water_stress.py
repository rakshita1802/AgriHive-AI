import datetime as dt
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.water_stress import ObservationSource


class WaterStressObservationCreate(BaseModel):
    farm_id: int
    observation_date: dt.date
    label: int  # 0=LOW, 1=MEDIUM, 2=HIGH
    source: ObservationSource = ObservationSource.FIELD_VISIT
    confidence: Optional[float] = 1.0
    notes: Optional[str] = None


class WaterStressObservationOut(WaterStressObservationCreate):
    id: int
    created_at: dt.datetime
    label_name: str

    model_config = ConfigDict(from_attributes=True)


class BulkImportRequest(BaseModel):
    csv_text: str


class BulkImportResult(BaseModel):
    imported: int
    skipped: int
    errors: List[str]


class LabelSummary(BaseModel):
    farm_id: int
    farm_name: str
    total_observations: int
    counts: dict
