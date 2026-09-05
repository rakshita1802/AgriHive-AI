import datetime as dt

from pydantic import BaseModel, ConfigDict


class HistoricalWeatherRequest(BaseModel):
    farm_id: int
    start_date: dt.date
    end_date: dt.date


class ForecastWeatherRequest(BaseModel):
    farm_id: int
    forecast_days: int = 7


class SoilIngestionRequest(BaseModel):
    farm_id: int
    depth: str = "0-5cm"


class RawWeatherRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    farm_id: int
    source: str
    record_date: dt.date
    temperature_c: float | None
    rainfall_mm: float | None
    relative_humidity_pct: float | None
    wind_speed_ms: float | None
    solar_radiation: float | None
    evapotranspiration_mm: float | None
    soil_moisture: float | None


class RawSoilRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    farm_id: int
    source: str
    depth: str | None
    soil_ph: float | None
    clay_content_pct: float | None
    sand_content_pct: float | None
    soil_organic_carbon: float | None


class IngestionRunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    farm_id: int
    source: str
    status: str
    detail: str | None
    started_at: dt.datetime
    finished_at: dt.datetime | None
