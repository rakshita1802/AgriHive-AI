import datetime as dt

from pydantic import BaseModel, ConfigDict


class FeatureRegistryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    feature_name: str
    source: str
    unit: str | None
    data_type: str
    purpose: str | None
    status: str
    availability: float | None
    quality: float | None
    required_for: str | None
    domain_relevance_note: str | None
    updated_at: dt.datetime


class FeatureRegistryUpdate(BaseModel):
    status: str | None = None
    availability: float | None = None
    quality: float | None = None
    domain_relevance_note: str | None = None
