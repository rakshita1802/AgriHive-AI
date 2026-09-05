"""
NASA POWER client - historical weather (Section 6.1).

Docs: https://power.larc.nasa.gov/docs/services/api/

We request only the Section 6.1 candidate parameters:
  T2M            -> temperature_c
  PRECTOTCORR    -> rainfall_mm
  RH2M           -> relative_humidity_pct
  WS2M           -> wind_speed_ms
  ALLSKY_SFC_SW_DWN -> solar_radiation

Anything else NASA POWER returns for the 'AG' community is ignored - this
is the code-level enforcement of Section 7's "API Data Selection Rule".
"""
import datetime as dt
from typing import Any

import httpx

from app.config import settings

PARAMETERS = ["T2M", "PRECTOTCORR", "RH2M", "WS2M", "ALLSKY_SFC_SW_DWN"]

PARAM_TO_FIELD = {
    "T2M": "temperature_c",
    "PRECTOTCORR": "rainfall_mm",
    "RH2M": "relative_humidity_pct",
    "WS2M": "wind_speed_ms",
    "ALLSKY_SFC_SW_DWN": "solar_radiation",
}

# NASA POWER uses -999 (or similar) as a fill value for missing data.
FILL_VALUE_THRESHOLD = -900.0


class NasaPowerError(RuntimeError):
    pass


def fetch_historical_weather(
    latitude: float,
    longitude: float,
    start_date: dt.date,
    end_date: dt.date,
) -> list[dict[str, Any]]:
    """
    Returns a list of daily records:
    [{"date": date, "temperature_c": .., "rainfall_mm": .., ...}, ...]
    """
    params = {
        "parameters": ",".join(PARAMETERS),
        "community": "AG",
        "longitude": longitude,
        "latitude": latitude,
        "start": start_date.strftime("%Y%m%d"),
        "end": end_date.strftime("%Y%m%d"),
        "format": "JSON",
    }

    try:
        resp = httpx.get(settings.NASA_POWER_BASE_URL, params=params, timeout=settings.HTTP_TIMEOUT_SECONDS)
        resp.raise_for_status()
        payload = resp.json()
    except httpx.HTTPError as exc:
        raise NasaPowerError(f"NASA POWER request failed: {exc}") from exc

    try:
        param_series = payload["properties"]["parameter"]
    except (KeyError, TypeError) as exc:
        raise NasaPowerError(f"Unexpected NASA POWER response shape: {payload}") from exc

    # Collect the set of all dates present across parameters.
    all_dates: set[str] = set()
    for series in param_series.values():
        all_dates.update(series.keys())

    records: list[dict[str, Any]] = []
    for date_str in sorted(all_dates):
        record: dict[str, Any] = {
            "date": dt.datetime.strptime(date_str, "%Y%m%d").date(),
            "raw_payload": {p: param_series.get(p, {}).get(date_str) for p in PARAMETERS},
        }
        for nasa_param, field_name in PARAM_TO_FIELD.items():
            value = param_series.get(nasa_param, {}).get(date_str)
            if value is None or (isinstance(value, (int, float)) and value <= FILL_VALUE_THRESHOLD):
                record[field_name] = None
            else:
                record[field_name] = float(value)
        records.append(record)

    return records
