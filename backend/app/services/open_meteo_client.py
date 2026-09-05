"""
Open-Meteo client - forward-looking forecast data + soil moisture
(Section 6.2). Docs: https://open-meteo.com/en/docs

Only the Section 6.2 candidate variables are requested:
  temperature_2m_max/min          -> temperature_c (averaged)
  precipitation_sum               -> rainfall_mm
  relative_humidity_2m_mean       -> relative_humidity_pct
  wind_speed_10m_max              -> wind_speed_ms
  et0_fao_evapotranspiration      -> evapotranspiration_mm
  soil_moisture_0_to_7cm_mean     -> soil_moisture (via hourly, aggregated to daily)
"""
import datetime as dt
from typing import Any

import httpx

from app.config import settings

DAILY_PARAMS = [
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "relative_humidity_2m_mean",
    "wind_speed_10m_max",
    "et0_fao_evapotranspiration",
]
HOURLY_PARAMS = ["soil_moisture_0_to_7cm"]


class OpenMeteoError(RuntimeError):
    pass


def _aggregate_hourly_to_daily(hourly_time: list[str], hourly_values: list[float | None]) -> dict[str, float]:
    buckets: dict[str, list[float]] = {}
    for ts, val in zip(hourly_time, hourly_values):
        if val is None:
            continue
        day = ts.split("T")[0]
        buckets.setdefault(day, []).append(val)
    return {day: sum(vals) / len(vals) for day, vals in buckets.items() if vals}


def fetch_forecast_weather(latitude: float, longitude: float, forecast_days: int = 7) -> list[dict[str, Any]]:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": ",".join(DAILY_PARAMS),
        "hourly": ",".join(HOURLY_PARAMS),
        "forecast_days": forecast_days,
        "timezone": "auto",
    }
    try:
        resp = httpx.get(settings.OPEN_METEO_FORECAST_URL, params=params, timeout=settings.HTTP_TIMEOUT_SECONDS)
        resp.raise_for_status()
        payload = resp.json()
    except httpx.HTTPError as exc:
        raise OpenMeteoError(f"Open-Meteo forecast request failed: {exc}") from exc

    try:
        daily = payload["daily"]
    except (KeyError, TypeError) as exc:
        raise OpenMeteoError(f"Unexpected Open-Meteo response shape: {payload}") from exc

    soil_moisture_by_day: dict[str, float] = {}
    hourly = payload.get("hourly")
    if hourly and "time" in hourly and "soil_moisture_0_to_7cm" in hourly:
        soil_moisture_by_day = _aggregate_hourly_to_daily(hourly["time"], hourly["soil_moisture_0_to_7cm"])

    records: list[dict[str, Any]] = []
    dates = daily.get("time", [])
    for i, date_str in enumerate(dates):
        record_date = dt.datetime.strptime(date_str, "%Y-%m-%d").date()

        t_max = daily.get("temperature_2m_max", [None] * len(dates))[i]
        t_min = daily.get("temperature_2m_min", [None] * len(dates))[i]
        temp_avg = None
        if t_max is not None and t_min is not None:
            temp_avg = (t_max + t_min) / 2

        record = {
            "date": record_date,
            "temperature_c": temp_avg,
            "rainfall_mm": daily.get("precipitation_sum", [None] * len(dates))[i],
            "relative_humidity_pct": daily.get("relative_humidity_2m_mean", [None] * len(dates))[i],
            "wind_speed_ms": _kmh_to_ms(daily.get("wind_speed_10m_max", [None] * len(dates))[i]),
            "evapotranspiration_mm": daily.get("et0_fao_evapotranspiration", [None] * len(dates))[i],
            "soil_moisture": soil_moisture_by_day.get(date_str),
            "raw_payload": {k: daily.get(k, [None] * len(dates))[i] for k in DAILY_PARAMS},
        }
        records.append(record)

    return records


def fetch_historical_archive_weather(
    latitude: float, longitude: float, start_date: dt.date, end_date: dt.date
) -> list[dict[str, Any]]:
    """Open-Meteo historical archive - used as a cross-check / gap-fill for NASA POWER."""
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "daily": ",".join(DAILY_PARAMS),
        "timezone": "auto",
    }
    try:
        resp = httpx.get(settings.OPEN_METEO_ARCHIVE_URL, params=params, timeout=settings.HTTP_TIMEOUT_SECONDS)
        resp.raise_for_status()
        payload = resp.json()
    except httpx.HTTPError as exc:
        raise OpenMeteoError(f"Open-Meteo archive request failed: {exc}") from exc

    daily = payload.get("daily", {})
    dates = daily.get("time", [])
    records = []
    for i, date_str in enumerate(dates):
        t_max = daily.get("temperature_2m_max", [None] * len(dates))[i]
        t_min = daily.get("temperature_2m_min", [None] * len(dates))[i]
        temp_avg = (t_max + t_min) / 2 if t_max is not None and t_min is not None else None
        records.append(
            {
                "date": dt.datetime.strptime(date_str, "%Y-%m-%d").date(),
                "temperature_c": temp_avg,
                "rainfall_mm": daily.get("precipitation_sum", [None] * len(dates))[i],
                "relative_humidity_pct": daily.get("relative_humidity_2m_mean", [None] * len(dates))[i],
                "wind_speed_ms": _kmh_to_ms(daily.get("wind_speed_10m_max", [None] * len(dates))[i]),
                "evapotranspiration_mm": daily.get("et0_fao_evapotranspiration", [None] * len(dates))[i],
                "soil_moisture": None,
                "raw_payload": {k: daily.get(k, [None] * len(dates))[i] for k in DAILY_PARAMS},
            }
        )
    return records


def _kmh_to_ms(value: float | None) -> float | None:
    if value is None:
        return None
    return round(value / 3.6, 3)
