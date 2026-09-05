import datetime as dt

from pydantic import BaseModel, ConfigDict, Field


class FarmCreate(BaseModel):
    name: str = Field(..., examples=["Farm A"])
    latitude: float
    longitude: float
    crop: str | None = None
    irrigation_method: str | None = None
    soil_ph_farm_declared: float | None = None
    management_history: str | None = None
    extra_attributes_json: str | None = Field(
        default=None,
        description="Optional JSON string of any new farm-specific attribute "
        "not yet known to the platform (Section 11 - New Farm and New Feature Handling).",
    )


class FarmOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    latitude: float
    longitude: float
    crop: str | None
    irrigation_method: str | None
    soil_ph_farm_declared: float | None
    management_history: str | None
    extra_attributes_json: str | None
    created_at: dt.datetime
