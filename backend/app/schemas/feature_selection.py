import datetime as dt

from pydantic import BaseModel, ConfigDict


class FeatureDecisionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    feature_name: str
    domain_relevant: bool | None
    domain_note: str | None
    quality_score: float | None
    quality_passed: bool | None
    leakage_safe: bool | None
    leakage_note: str | None
    redundant_with: str | None
    redundancy_flag: bool | None
    final_status: str
    reason_summary: str | None


class FeatureSelectionRunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    target: str
    notes: str | None
    best_feature_set_json: str | None
    best_model_f1: float | None
    created_at: dt.datetime
    decisions: list[FeatureDecisionOut] = []


class FeatureSelectionRunRequest(BaseModel):
    """Optionally scope the run to specific farms; defaults to all farms."""

    farm_ids: list[int] | None = None
    notes: str | None = None
