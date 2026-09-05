"""
Data Quality helpers (Section 8.2) used by the Feature Selection Engine.

Checks: missing values, invalid/out-of-range values, and (for numeric
series) simple outlier flags. Duplicate/time-consistency checks are done at
the ingestion level (one row per farm/date/source, enforced by the caller
deduplicating on write) - here we focus on the value-level checks described
in Section 8.2's example ("Humidity: 98% valid -> Candidate").
"""
import statistics

# Loose physically-plausible ranges used only to flag obviously invalid
# values (not a scientific bound, just a sanity filter for the prototype).
VALID_RANGES = {
    "temperature_c": (-10, 55),
    "rainfall_mm": (0, 500),
    "relative_humidity_pct": (0, 100),
    "wind_speed_ms": (0, 60),
    "solar_radiation": (0, 40),
    "evapotranspiration_mm": (0, 20),
    "soil_moisture": (0, 1),
    "soil_ph": (2, 11),
    "clay_content_pct": (0, 100),
    "sand_content_pct": (0, 100),
    "soil_organic_carbon": (0, 500),
}


def quality_score(feature_name: str, values: list[float | None]) -> float:
    """Fraction of values that are present AND within a plausible range."""
    if not values:
        return 0.0
    lo, hi = VALID_RANGES.get(feature_name, (float("-inf"), float("inf")))
    valid = sum(1 for v in values if v is not None and lo <= v <= hi)
    return round(valid / len(values), 3)


def flag_outliers(values: list[float]) -> list[float]:
    """Simple z-score based outlier flag (|z| > 3), used only for reporting."""
    clean = [v for v in values if v is not None]
    if len(clean) < 3:
        return []
    mean = statistics.mean(clean)
    stdev = statistics.pstdev(clean) or 1e-9
    return [v for v in clean if abs((v - mean) / stdev) > 3]
