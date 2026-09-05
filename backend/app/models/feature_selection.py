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

CHANGE LOG - Phase 3:
Step 5 (Model Evaluation) previously used `_heuristic_label`, a rule-derived
placeholder documented as NOT a real metric (temp/rain/humidity/moisture
thresholds standing in for an actual label, so F1 was really just measuring
whether a model could reconstruct the rule it was given). That function has
been REMOVED. Step 5 now trains only against real observations recorded in
`WaterStressObservation` (Phase 3, `app/models/water_stress.py`). If there
aren't enough real labelled rows yet, the run is written with
`status="insufficient_labelled_data"` and `best_model_f1=None` - never a
fabricated number - so the UI can show an honest "not enough data" state.
"""
import itertools
import json

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score, precision_score, recall_score
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Session, relationship

from app.core.domain_rules import get_feature_definition
from app.database import Base
from app.models.farm import Farm
from app.models.raw_data import RawSoilRecord, RawWeatherRecord
from app.models.water_stress import WaterStressObservation
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
MIN_LABELLED_ROWS = 20  # below this, any F1 is statistically meaningless - refuse to report one


class FeatureDecision(Base):
    __tablename__ = "feature_decisions"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("feature_selection_runs.id"), nullable=False, index=True)
    feature_name = Column(String(80), nullable=False)
    domain_relevant = Column(Boolean, nullable=True)
    domain_note = Column(Text, nullable=True)
    quality_score = Column(Float, nullable=True)
    quality_passed = Column(Boolean, nullable=True)
    leakage_safe = Column(Boolean, nullable=True)
    leakage_note = Column(Text, nullable=True)
    redundant_with = Column(Text, nullable=True)
    redundancy_flag = Column(Boolean, nullable=True)
    final_status = Column(String(20), nullable=False)
    reason_summary = Column(Text, nullable=True)

    run = relationship("FeatureSelectionRun", back_populates="decisions")


class FeatureSelectionRun(Base):
    __tablename__ = "feature_selection_runs"

    id = Column(Integer, primary_key=True, index=True)
    target = Column(String(80), nullable=False)
    notes = Column(Text, nullable=True)
    best_feature_set_json = Column(Text, nullable=True)
    best_model_f1 = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: __import__("datetime").datetime.utcnow())

    decisions = relationship("FeatureDecision", back_populates="run", cascade="all, delete-orphan")


# ---------------------------------------------------------------------
# Step 0: build the working matrix from the Raw Data Layer
# ---------------------------------------------------------------------
def _build_feature_matrix(db: Session, farm_ids: list[int]) -> "tuple[list[dict], list[str]]":
    """
    One row per (farm, weather record date). Soil values are the farm's most
    recent SoilGrids snapshot (soil changes far slower than daily weather).
    Returns (rows, numeric_feature_names_actually_present). Each row also
    carries farm_id and record_date so Step 5 can join real labels onto it.
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


def _attach_real_labels(db: Session, rows: list[dict], farm_ids: list[int]) -> list[dict]:
    """
    Joins each feature-matrix row to a real WaterStressObservation on exact
    (farm_id, date) match. Rows without a matching real observation are
    dropped from the labelled set entirely - there is no fallback label.
    """
    observations = (
        db.query(WaterStressObservation)
        .filter(WaterStressObservation.farm_id.in_(farm_ids))
        .all()
    )
    label_lookup = {(o.farm_id, o.observation_date): o.label for o in observations}

    labelled = []
    for r in rows:
        key = (r["farm_id"], r["record_date"])
        if key in label_lookup:
            labelled.append({**r, "label": label_lookup[key]})
    return labelled


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
# Step 5: Model Evaluation (8.5) - real labels only, see module docstring
# ---------------------------------------------------------------------
def _impute(train_matrix: np.ndarray, apply_to: np.ndarray) -> tuple[np.ndarray, list[float]]:
    """Median-impute each column using TRAIN-fold medians only, applied to both folds."""
    medians = []
    out = apply_to.copy()
    for col in range(train_matrix.shape[1]):
        train_col = train_matrix[:, col]
        valid = train_col[~np.isnan(train_col)]
        median = float(np.median(valid)) if valid.size else 0.0
        medians.append(median)
        col_vals = out[:, col]
        col_vals[np.isnan(col_vals)] = median
        out[:, col] = col_vals
    return out, medians


def _time_based_split(labelled_rows: list[dict], test_fraction: float = 0.3):
    """
    Splits chronologically (train = earlier dates, test = later dates) so the
    evaluation reflects real forecasting conditions rather than letting rows
    from the same short window leak between train and test.
    """
    sorted_rows = sorted(labelled_rows, key=lambda r: r["record_date"])
    n_test = max(1, int(len(sorted_rows) * test_fraction))
    train_rows = sorted_rows[: len(sorted_rows) - n_test]
    test_rows = sorted_rows[len(sorted_rows) - n_test:]
    return train_rows, test_rows


def _evaluate_feature_subsets(labelled_rows: list[dict], candidate_sets: dict[str, list[str]]) -> dict:
    """
    Returns a dict describing what happened - never a bare number. Possible
    top-level "status": "insufficient_data" or "evaluated".
    """
    if len(labelled_rows) < MIN_LABELLED_ROWS:
        return {
            "status": "insufficient_data",
            "labelled_rows_available": len(labelled_rows),
            "labelled_rows_required": MIN_LABELLED_ROWS,
            "chosen_subset_name": None,
            "best_model_f1": None,
            "all_subset_scores": {},
            "algorithm": None,
        }

    labels_present = {r["label"] for r in labelled_rows}
    if len(labels_present) < 2:
        return {
            "status": "insufficient_data",
            "labelled_rows_available": len(labelled_rows),
            "labelled_rows_required": MIN_LABELLED_ROWS,
            "detail": "All available real labels are the same class - need at least two classes represented to evaluate.",
            "chosen_subset_name": None,
            "best_model_f1": None,
            "all_subset_scores": {},
            "algorithm": None,
        }

    train_rows, test_rows = _time_based_split(labelled_rows)
    y_train_full = np.array([r["label"] for r in train_rows])
    y_test_full = np.array([r["label"] for r in test_rows])

    results: dict[str, dict] = {}
    for name, feature_list in candidate_sets.items():
        if not feature_list:
            results[name] = {"f1_macro": None, "algorithm": None, "detail": "empty feature set"}
            continue

        X_train_raw = np.array(
            [[r.get(f) if r.get(f) is not None else np.nan for f in feature_list] for r in train_rows], dtype=float
        )
        X_test_raw = np.array(
            [[r.get(f) if r.get(f) is not None else np.nan for f in feature_list] for r in test_rows], dtype=float
        )

        if X_train_raw.shape[0] < 6 or X_test_raw.shape[0] < 2 or len(set(y_train_full.tolist())) < 2:
            results[name] = {"f1_macro": None, "algorithm": None, "detail": "not enough rows in this split for this subset"}
            continue

        X_train, _ = _impute(X_train_raw, X_train_raw)
        X_test, _ = _impute(X_train_raw, X_test_raw)  # impute test using TRAIN medians, never test's own

        best_algo_name = None
        best_f1 = -1.0
        best_precision = best_recall = None

        candidates = {
            "random_forest": RandomForestClassifier(n_estimators=150, class_weight="balanced", random_state=42),
            "logistic_regression": LogisticRegression(max_iter=2000, class_weight="balanced"),
        }
        for algo_name, model in candidates.items():
            try:
                model.fit(X_train, y_train_full)
                preds = model.predict(X_test)
                f1 = f1_score(y_test_full, preds, average="macro", zero_division=0)
                precision = precision_score(y_test_full, preds, average="macro", zero_division=0)
                recall = recall_score(y_test_full, preds, average="macro", zero_division=0)
            except Exception:  # noqa: BLE001
                continue
            if f1 > best_f1:
                best_f1, best_algo_name = f1, algo_name
                best_precision, best_recall = precision, recall

        if best_algo_name is None:
            results[name] = {"f1_macro": None, "algorithm": None, "detail": "training failed for both algorithms"}
        else:
            results[name] = {
                "f1_macro": round(float(best_f1), 4),
                "precision_macro": round(float(best_precision), 4),
                "recall_macro": round(float(best_recall), 4),
                "algorithm": best_algo_name,
                "n_train": int(X_train.shape[0]),
                "n_test": int(X_test.shape[0]),
            }

    scored = {k: v for k, v in results.items() if v.get("f1_macro") is not None}
    if not scored:
        return {
            "status": "insufficient_data",
            "labelled_rows_available": len(labelled_rows),
            "labelled_rows_required": MIN_LABELLED_ROWS,
            "detail": "No candidate feature subset had enough usable rows in the time-based split to train.",
            "chosen_subset_name": None,
            "best_model_f1": None,
            "all_subset_scores": results,
            "algorithm": None,
        }

    best_name = max(scored, key=lambda k: scored[k]["f1_macro"])
    return {
        "status": "evaluated",
        "labelled_rows_available": len(labelled_rows),
        "split_method": "time_based (train=earlier dates, test=later dates)",
        "chosen_subset_name": best_name,
        "best_model_f1": scored[best_name]["f1_macro"],
        "algorithm": scored[best_name]["algorithm"],
        "all_subset_scores": results,
    }


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
    # Only ever scored against REAL labels - see _attach_real_labels.
    labelled_rows = _attach_real_labels(db, rows, farm_ids)

    core = [f for f in ["temperature_c", "rainfall_mm", "soil_moisture"] if f in kept_features]
    core_plus_humidity = core + (["relative_humidity_pct"] if "relative_humidity_pct" in kept_features else [])
    candidate_sets = {
        "core_min": core or kept_features[:3],
        "core_plus_humidity": core_plus_humidity or kept_features[:4],
        "all_kept_features": kept_features,
    }
    evaluation = _evaluate_feature_subsets(labelled_rows, candidate_sets)

    best_name = evaluation["chosen_subset_name"]
    run = FeatureSelectionRun(
        target="water_stress_risk",
        notes=notes,
        best_feature_set_json=json.dumps(
            {
                "chosen_subset_name": best_name,
                "features": candidate_sets.get(best_name) if best_name else None,
                "candidate_sets": candidate_sets,
                "evaluation": evaluation,
                "label_source": "real WaterStressObservation records only (Phase 3) - no heuristic/placeholder label is used",
            }
        ),
        best_model_f1=evaluation["best_model_f1"],
    )
    db.add(run)
    db.flush()

    for d in decisions_data:
        db.add(FeatureDecision(run_id=run.id, **d))

    db.commit()
    db.refresh(run)
    return run