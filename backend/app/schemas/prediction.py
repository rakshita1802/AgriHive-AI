import datetime as dt

from pydantic import BaseModel, ConfigDict


class TrainRequest(BaseModel):
    farm_ids: list[int] | None = None


class TrainedModelOut(BaseModel):
    model_config = ConfigDict(protected_namespaces=(), from_attributes=True)

    id: int
    target: str
    status: str
    detail: str | None
    algorithm: str | None
    n_labelled_rows: int | None
    metrics_json: str | None
    is_active: bool
    trained_at: dt.datetime


class PredictionOut(BaseModel):
    model_config = ConfigDict(protected_namespaces=(), from_attributes=True)

    farm_id: int
    farm_name: str
    as_of_date: dt.date
    predicted_label: int
    predicted_label_name: str
    probabilities: dict[str, float]  # {"LOW": .., "MEDIUM": .., "HIGH": ..}
    model_id: int
    algorithm: str
    features_used: list[str]
    note: str