"""
SoilGrids client (Section 6.3). Docs: https://docs.isric.org/globaldata/soilgrids/index.html

Uses the ISRIC REST 'properties/query' endpoint, which is the stable
delivery method noted in the plan ("use a stable available SoilGrids
delivery method ... rather than depending on an unavailable endpoint").

Requested properties (Section 6.3 Version 1 candidates):
  phh2o -> soil_ph        (returned in pH*10, so divided by 10)
  clay  -> clay_content_pct (returned in g/kg, so divided by 10 for %)
  sand  -> sand_content_pct (returned in g/kg, so divided by 10 for %)
  soc   -> soil_organic_carbon (returned in dg/kg)
"""
from typing import Any

import httpx

from app.config import settings

PROPERTIES = ["phh2o", "clay", "sand", "soc"]

PROPERTY_TO_FIELD = {
    "phh2o": "soil_ph",
    "clay": "clay_content_pct",
    "sand": "sand_content_pct",
    "soc": "soil_organic_carbon",
}

# SoilGrids returns scaled integers; these divisors convert to natural units.
PROPERTY_DIVISOR = {
    "phh2o": 10.0,   # pH*10 -> pH
    "clay": 10.0,    # g/kg -> %
    "sand": 10.0,    # g/kg -> %
    "soc": 10.0,     # dg/kg -> g/kg
}


class SoilGridsError(RuntimeError):
    pass


def fetch_soil_properties(latitude: float, longitude: float, depth: str = "0-5cm") -> dict[str, Any]:
    params = [("lon", longitude), ("lat", latitude)]
    for p in PROPERTIES:
        params.append(("property", p))
    params.append(("depth", depth))
    params.append(("value", "mean"))

    try:
        resp = httpx.get(settings.SOILGRIDS_BASE_URL, params=params, timeout=settings.HTTP_TIMEOUT_SECONDS)
        resp.raise_for_status()
        payload = resp.json()
    except httpx.HTTPError as exc:
        raise SoilGridsError(f"SoilGrids request failed: {exc}") from exc

    result: dict[str, Any] = {"depth": depth, "raw_payload": payload}

    try:
        layers = payload["properties"]["layers"]
    except (KeyError, TypeError) as exc:
        raise SoilGridsError(f"Unexpected SoilGrids response shape: {payload}") from exc

    for layer in layers:
        prop_name = layer.get("name")
        if prop_name not in PROPERTY_TO_FIELD:
            continue
        depths = layer.get("depths", [])
        matching = next((d for d in depths if d.get("label") == depth), depths[0] if depths else None)
        if not matching:
            continue
        raw_value = matching.get("values", {}).get("mean")
        field = PROPERTY_TO_FIELD[prop_name]
        if raw_value is None:
            result[field] = None
        else:
            result[field] = round(raw_value / PROPERTY_DIVISOR[prop_name], 3)

    for field in PROPERTY_TO_FIELD.values():
        result.setdefault(field, None)

    return result
