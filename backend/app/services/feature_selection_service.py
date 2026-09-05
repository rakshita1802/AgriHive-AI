"""
Feature Selection Engine - Module 3 (Section 8).

Runs the five checks from the plan, in order, against whatever raw data
Module 1 has ingested and whatever features Module 2 has registered:

    1. Domain Relevance   (8.1)
    2. Data Quality       (8.2)
    3. Data Leakage       (8.3)
    4. Redundancy         (8.4)
    5. Model Evaluation   (8.5)

then writes a KEEP/EXCLUDE FeatureDecision per feature plus a
FeatureSelectionRun summarising the winning feature set and its F1 score.

IMPORTANT - about step 5 (Model Evaluation):
Section 8.5 compares candidate feature subsets by training small models and
comparing F1. A real, validated Water-Stress label dataset is Phase 3
("Water-Stress Dataset and preprocessing") of the Final Build Order
(Section 31), which comes AFTER this Phase 2 engine. To let this engine run
end-to-end today rather than stub the step out, we derive a transparent,
clearly-labelled HEURISTIC water-stress label from the same domain logic
described in Section 3/4 (high temperature + low rainfall + low humidity +
low soil moisture -> HIGH risk) purely so F1 differences between feature
subsets are demonstrable now. This heuristic label is NOT a trained model
output and must be replaced by the real Phase 3 labelled dataset before any
number here is treated as a genuine model metric - every place it is used
is tagged `heuristic_label` so it is easy to find and swap out later.
"""
import itertools
import json

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score
from sklearn.model_selection import train_test_split
from sqlalchemy.orm import Session

from app.core.domain_rules import CANDIDATE_FEATURES, get_feature_definition
from app.models.farm import Farm
from app.models.feature_selection import (
    FeatureDecision,
    FeatureSelectionRun,
    _attach_real_labels,
    _impute,
    _time_based_split,
)
from app.models.raw_data import RawSoilRecord, RawWeatherRecord
from app.services.quality_checks import quality_score

NUMERIC_WEATHER_FEATURES = [
    "temperature_c",
    "rainfall_mm",
    "relative_humidity_pct",
    "wind_speed_ms",
    "solar_radiation",
    "evapotranspiration_mm",
    "soil_moisture",
]
NUMERIC_SOIL_FEATURES = ["soil_ph", "clay_content_pct", "sand_content_pct", "soil_organic_carbon"]
ALL_NUMERIC_FEATURES = NUMERIC_WEATHER_FEATURES + NUMERIC_SOIL_FEATURES

QUALITY_PASS_THRESHOLD = 0.6
REDUNDANCY_CORRELATION_THRESHOLD = 0.9
MIN_LABELLED_ROWS = 20


# ---------------------------------------------------------------------
# Step 0: build the working matrix from the Raw Data Layer
# ---------------------------------------------------------------------
def _build_feature_matrix(db: Session, farm_ids: list[int]) -> "tuple[list[dict], list[str]]":
    """
    One row per (farm, weather record date). Soil values are the farm's most
    recent SoilGrids snapshot (soil changes far slower than daily weather).
    Returns (rows, numeric_feature_names_actually_present).
    """
    rows: list[dict] = []

    soil_by_farm: dict[int, RawSoilRecord] = {}
    for farm_id in farm_ids:
        soil = (
            db.query(RawSoilRecord)
            .filter(RawSoilRecord.farm_id == farm_id)
            .order_by(RawSoilRecord.ingested_at.desc())
            .first()
        )
        if soil:
            soil_by_farm[farm_id] = soil

    weather_records = db.query(RawWeatherRecord).filter(RawWeatherRecord.farm_id.in_(farm_ids)).all()

    for wr in weather_records:
        soil = soil_by_farm.get(wr.farm_id)
        row = {
            "farm_id": wr.farm_id,
            "record_date": wr.record_date,
            "temperature_c": wr.temperature_c,
            "rainfall_mm": wr.rainfall_mm,
            "relative_humidity_pct": wr.relative_humidity_pct,
            "wind_speed_ms": wr.wind_speed_ms,
            "solar_radiation": wr.solar_radiation,
            "evapotranspiration_mm": wr.evapotranspiration_mm,
            "soil_moisture": wr.soil_moisture,
            "soil_ph": soil.soil_ph if soil else None,
            "clay_content_pct": soil.clay_content_pct if soil else None,
            "sand_content_pct": soil.sand_content_pct if soil else None,
            "soil_organic_carbon": soil.soil_organic_carbon if soil else None,
        }
        rows.append(row)

    present = [f for f in ALL_NUMERIC_FEATURES if any(r.get(f) is not None for r in rows)]
    return rows, present


def _heuristic_label(row: dict) -> int | None:
    """
    heuristic_label: SEE MODULE DOCSTRING. Combines Section 3/4's stated
    drivers (temperature, rainfall, humidity, soil moisture) into a 0/1/2
    (LOW/MEDIUM/HIGH) water-stress label for demonstration purposes only.
    """
    temp = row.get("temperature_c")
    rain = row.get("rainfall_mm")
    hum = row.get("relative_humidity_pct")
    moisture = row.get("soil_moisture")

    if temp is None or rain is None:
        return None

    score = 0
    if temp >= 33:
        score += 1
    if rain <= 10:
        score += 1
    if hum is not None and hum <= 50:
        score += 1
    if moisture is not None and moisture <= 0.2:
        score += 1

    if score >= 3:
        return 2  # HIGH
    if score >= 1:
        return 1  # MEDIUM
    return 0  # LOW


# ---------------------------------------------------------------------
# Step 1: Domain Relevance (8.1)
# ---------------------------------------------------------------------
def _check_domain(feature_name: str) -> tuple[bool, str]:
    fd = get_feature_definition(feature_name)
    if fd is None:
        return False, "No domain-relevance entry found for this feature; treat as unvalidated."
    relevant = fd.relevance.value in ("relevant", "highly_relevant")
    return relevant, f"[{fd.relevance.value}] {fd.domain_note}"


# ---------------------------------------------------------------------
# Step 2: Data Quality (8.2) - see app/services/quality_checks.py
# ---------------------------------------------------------------------
def _check_quality(feature_name: str, rows: list[dict]) -> tuple[float, bool]:
    values = [r.get(feature_name) for r in rows]
    score = quality_score(feature_name, values)
    return score, score >= QUALITY_PASS_THRESHOLD


# ---------------------------------------------------------------------
# Step 3: Data Leakage (8.3)
# ---------------------------------------------------------------------
def _check_leakage(feature_name: str) -> tuple[bool, str]:
    fd = get_feature_definition(feature_name)
    if fd is None:
        return False, "Unknown feature - cannot confirm availability at prediction time."
    if fd.available_at_prediction_time:
        return True, "Available at or before prediction time (current/forecast/farm-declared)."
    return False, "Would only be known after the prediction horizon - excluded to prevent leakage."


# ---------------------------------------------------------------------
# Step 4: Redundancy (8.4)
# ---------------------------------------------------------------------
def _check_redundancy(rows: list[dict], present_features: list[str]) -> dict[str, list[str]]:
    """Returns {feature_name: [other feature names it is redundant with]}."""
    redundant_with: dict[str, list[str]] = {f: [] for f in present_features}

    matrices = {}
    for f in present_features:
        vals = np.array([r.get(f) if r.get(f) is not None else np.nan for r in rows], dtype=float)
        matrices[f] = vals

    for f1, f2 in itertools.combinations(present_features, 2):
        v1, v2 = matrices[f1], matrices[f2]
        mask = ~np.isnan(v1) & ~np.isnan(v2)
        if mask.sum() < 5:
            continue
        if np.std(v1[mask]) == 0 or np.std(v2[mask]) == 0:
            continue
        corr = np.corrcoef(v1[mask], v2[mask])[0, 1]
        if abs(corr) >= REDUNDANCY_CORRELATION_THRESHOLD:
            redundant_with[f1].append(f2)
            redundant_with[f2].append(f1)

    return redundant_with


# ---------------------------------------------------------------------
# Step 5: Model Evaluation (8.5) - uses heuristic_label, see module docstring
# ---------------------------------------------------------------------
def _evaluate_feature_subsets(
    rows: list[dict], candidate_sets: dict[str, list[str]]
) -> tuple[str, float, dict[str, float]]:
    labelled_rows = []
    for r in rows:
        label = _heuristic_label(r)
        if label is not None:
            labelled_rows.append({**r, "label": label})

    results: dict[str, float] = {}
    if len(labelled_rows) < 20:
        # Not enough ingested data yet to train/evaluate meaningfully.
        for name in candidate_sets:
            results[name] = 0.0
        return next(iter(candidate_sets)), 0.0, results

    y = np.array([r["label"] for r in labelled_rows])

    for name, feature_list in candidate_sets.items():
        X = np.array(
            [[float(r.get(f)) if r.get(f) is not None else 0.0 for f in feature_list] for r in labelled_rows]
        )
        if X.shape[0] < 10 or len(set(y.tolist())) < 2:
            results[name] = 0.0
            continue
        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.3, random_state=42, stratify=y if len(set(y.tolist())) > 1 else None
            )
            model = RandomForestClassifier(n_estimators=100, random_state=42)
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            score = f1_score(y_test, preds, average="macro")
        except Exception:  # noqa: BLE001
            score = 0.0
        results[name] = round(float(score), 4)

    best_name = max(results, key=results.get)
    return best_name, results[best_name], results


# ---------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------
def run_feature_selection(db: Session, farm_ids: list[int] | None = None, notes: str | None = None) -> FeatureSelectionRun:
    if farm_ids is None:
        farm_ids = [f.id for f in db.query(Farm.id).all()]

    rows, present_features = _build_feature_matrix(db, farm_ids)
    redundancy_map = _check_redundancy(rows, present_features)

    decisions_data = []
    kept_features = []

    for feature_name in present_features:
        domain_ok, domain_note = _check_domain(feature_name)
        quality, quality_ok = _check_quality(feature_name, rows)
        leakage_ok, leakage_note = _check_leakage(feature_name)
        redundant_partners = redundancy_map.get(feature_name, [])

        # If redundant with another feature, keep only the alphabetically
        # first of the pair/group to avoid double-counting (Section 8.4:
        # "test whether keeping all of them actually improves performance" -
        # the model-evaluation step below is the actual arbiter; this just
        # avoids feeding obviously duplicate signals into that step).
        redundancy_flag = len(redundant_partners) > 0
        is_redundancy_survivor = not redundancy_flag or feature_name == min([feature_name, *redundant_partners])

        keep = domain_ok and quality_ok and leakage_ok and is_redundancy_survivor

        reasons = []
        reasons.append("domain-relevant" if domain_ok else "not domain-relevant")
        reasons.append(f"quality={quality:.2f} ({'pass' if quality_ok else 'fail'})")
        reasons.append("leakage-safe" if leakage_ok else "leakage risk")
        if redundancy_flag:
            reasons.append(
                f"redundant with [{', '.join(redundant_partners)}]"
                + (" - kept as representative" if is_redundancy_survivor else " - dropped as duplicate")
            )

        decisions_data.append(
            dict(
                feature_name=feature_name,
                domain_relevant=domain_ok,
                domain_note=domain_note,
                quality_score=quality,
                quality_passed=quality_ok,
                leakage_safe=leakage_ok,
                leakage_note=leakage_note,
                redundant_with=", ".join(redundant_partners) if redundant_partners else None,
                redundancy_flag=redundancy_flag,
                final_status="KEEP" if keep else "EXCLUDE",
                reason_summary="; ".join(reasons),
            )
        )
        if keep:
            kept_features.append(feature_name)

    # Model evaluation (8.5): compare a small core subset vs the full kept
    # set vs a couple of ablations, matching the plan's "Model A/B/C" style.
    core = [f for f in ["temperature_c", "rainfall_mm", "soil_moisture"] if f in kept_features]
    core_plus_humidity = core + (["relative_humidity_pct"] if "relative_humidity_pct" in kept_features else [])
    candidate_sets = {
        "core_min": core or kept_features[:3],
        "core_plus_humidity": core_plus_humidity or kept_features[:4],
        "all_kept_features": kept_features,
    }
    best_name, best_f1, all_scores = _evaluate_feature_subsets(rows, candidate_sets)

    run = FeatureSelectionRun(
        target="water_stress_risk",
        notes=notes,
        best_feature_set_json=json.dumps(
            {
                "chosen_subset_name": best_name,
                "features": candidate_sets[best_name],
                "all_subset_scores_f1_macro": all_scores,
                "label_source": "heuristic_label (placeholder pending Phase 3 dataset - see module docstring)",
            }
        ),
        best_model_f1=best_f1,
    )
    db.add(run)
    db.flush()

    for d in decisions_data:
        db.add(FeatureDecision(run_id=run.id, **d))

    db.commit()
    db.refresh(run)
    return run
