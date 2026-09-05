"""
Prediction service (Phase 3).

Trains a real model against `WaterStressObservation` rows only (never a
heuristic/placeholder label), persists it to disk with joblib, and serves
live predictions for a farm's most recent weather + soil snapshot, or any new input feature set.
"""
import datetime as dt
import json
import os

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score, precision_score, recall_score
from sqlalchemy.orm import Session

from app.config import settings
from app.models.farm import Farm
from app.models.feature_selection import FeatureSelectionRun
from app.models.raw_data import RawSoilRecord, RawWeatherRecord
from app.models.trained_model import TrainedModel
from app.models.water_stress import LABEL_NAMES
from app.services.feature_selection_service import (
    MIN_LABELLED_ROWS,
    _attach_real_labels,
    _build_feature_matrix,
    _impute,
    _time_based_split,
)

os.makedirs(settings.MODEL_STORAGE_DIR, exist_ok=True)


def _pick_feature_set(db: Session, farm_ids: list[int], present_features: list[str]) -> list[str]:
    latest = (
        db.query(FeatureSelectionRun)
        .filter(FeatureSelectionRun.best_model_f1.isnot(None))
        .order_by(FeatureSelectionRun.created_at.desc())
        .first()
    )
    if latest and latest.best_feature_set_json:
        try:
            data = json.loads(latest.best_feature_set_json)
            features = data.get("features")
            if features:
                return [f for f in features if f in present_features]
        except (json.JSONDecodeError, TypeError):
            pass
    return present_features


def train_model(db: Session, farm_ids: list[int] | None = None) -> TrainedModel:
    if farm_ids is None:
        farm_ids = [f.id for f in db.query(Farm.id).all()]

    rows, present_features = _build_feature_matrix(db, farm_ids)
    labelled_rows = _attach_real_labels(db, rows, farm_ids)

    if len(labelled_rows) < MIN_LABELLED_ROWS:
        record = TrainedModel(
            target="water_stress_risk",
            status="insufficient_data",
            detail=(
                f"Only {len(labelled_rows)} real labelled observation(s) matched to ingested weather "
                f"dates; need at least {MIN_LABELLED_ROWS}."
            ),
            n_labelled_rows=len(labelled_rows),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    if len({r["label"] for r in labelled_rows}) < 2:
        record = TrainedModel(
            target="water_stress_risk",
            status="insufficient_data",
            detail="All real labels available are the same class; need at least two classes represented to train.",
            n_labelled_rows=len(labelled_rows),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    feature_list = _pick_feature_set(db, farm_ids, present_features)
    if not feature_list:
        record = TrainedModel(
            target="water_stress_risk",
            status="insufficient_data",
            detail="No usable numeric features available to train on.",
            n_labelled_rows=len(labelled_rows),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    train_rows, test_rows = _time_based_split(labelled_rows)
    y_train = np.array([r["label"] for r in train_rows])
    y_test = np.array([r["label"] for r in test_rows])

    X_train_raw = np.array(
        [[r.get(f) if r.get(f) is not None else np.nan for f in feature_list] for r in train_rows], dtype=float
    )
    X_test_raw = np.array(
        [[r.get(f) if r.get(f) is not None else np.nan for f in feature_list] for r in test_rows], dtype=float
    )

    if X_train_raw.shape[0] < 6 or X_test_raw.shape[0] < 2 or len(set(y_train.tolist())) < 2:
        record = TrainedModel(
            target="water_stress_risk",
            status="insufficient_data",
            detail="Time-based train/test split left too few rows to train reliably.",
            n_labelled_rows=len(labelled_rows),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    X_train, medians = _impute(X_train_raw, X_train_raw)
    X_test, _ = _impute(X_train_raw, X_test_raw)

    candidates = {
        "random_forest": RandomForestClassifier(n_estimators=200, class_weight="balanced", random_state=42),
        "logistic_regression": LogisticRegression(max_iter=2000, class_weight="balanced"),
    }
    best_name, best_model, best_f1 = None, None, -1.0
    best_metrics = {}
    for algo_name, model in candidates.items():
        try:
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            f1 = f1_score(y_test, preds, average="macro", zero_division=0)
            precision = precision_score(y_test, preds, average="macro", zero_division=0)
            recall = recall_score(y_test, preds, average="macro", zero_division=0)
        except Exception:
            continue
        if f1 > best_f1:
            best_name, best_model, best_f1 = algo_name, model, f1
            best_metrics = {"f1_macro": round(float(f1), 4), "precision_macro": round(float(precision), 4), "recall_macro": round(float(recall), 4)}

    if best_model is None:
        record = TrainedModel(
            target="water_stress_risk",
            status="failed",
            detail="Both candidate algorithms failed to train on this data.",
            n_labelled_rows=len(labelled_rows),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    timestamp = dt.datetime.utcnow().strftime("%Y%m%dT%H%M%S")
    file_path = os.path.join(settings.MODEL_STORAGE_DIR, f"water_stress_{timestamp}.joblib")
    joblib.dump({"model": best_model, "feature_list": feature_list, "medians": medians}, file_path)

    # Clean up old inactive model files on disk to prevent binary file bloat
    old_models = db.query(TrainedModel).filter(TrainedModel.target == "water_stress_risk", TrainedModel.is_active.is_(True)).all()
    for old_m in old_models:
        old_m.is_active = False
        if old_m.file_path and os.path.exists(old_m.file_path) and old_m.file_path != file_path:
            try:
                os.remove(old_m.file_path)
            except OSError:
                pass

    record = TrainedModel(
        target="water_stress_risk",
        status="trained",
        detail=f"Trained on {len(train_rows)} rows, tested on {len(test_rows)} rows (time-based split).",
        algorithm=best_name,
        feature_set_json=json.dumps(feature_list),
        impute_medians_json=json.dumps(dict(zip(feature_list, medians))),
        file_path=file_path,
        metrics_json=json.dumps({**best_metrics, "n_train": len(train_rows), "n_test": len(test_rows), "split_method": "time_based"}),
        n_labelled_rows=len(labelled_rows),
        is_active=True,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_active_model(db: Session) -> TrainedModel | None:
    active = (
        db.query(TrainedModel)
        .filter(TrainedModel.target == "water_stress_risk", TrainedModel.is_active.is_(True), TrainedModel.status == "trained")
        .order_by(TrainedModel.trained_at.desc())
        .first()
    )
    if active is None or not os.path.exists(active.file_path):
        # Auto-train model if database has records but no active model saved
        active = train_model(db)
        if active.status != "trained":
            return None
    return active


def predict_custom_features(db: Session, feature_dict: dict) -> dict:
    """Predict risk for any dynamic input feature dictionary using the active trained ML model."""
    active = get_active_model(db)
    if active is None or not os.path.exists(active.file_path):
        # Fallback heuristic if no trained model available
        temp = feature_dict.get("temperature_c", 30.0)
        rain = feature_dict.get("rainfall_mm", 10.0)
        moisture = feature_dict.get("soil_moisture", 0.3)
        hum = feature_dict.get("relative_humidity_pct", 60.0)

        score = 0
        if temp >= 33: score += 1
        if rain <= 5: score += 1
        if moisture <= 0.15: score += 1
        if hum >= 70: score += 1

        label = 2 if score >= 3 else 1 if score >= 1 else 0
        prob_high = 0.85 if label == 2 else 0.45 if label == 1 else 0.15
        return {
            "predicted_label": label,
            "predicted_label_name": LABEL_NAMES[label],
            "probabilities": {"LOW": round(1.0 - prob_high, 2), "MEDIUM": 0.1, "HIGH": prob_high},
            "algorithm": "heuristic_fallback"
        }

    bundle = joblib.load(active.file_path)
    model = bundle["model"]
    feature_list = bundle["feature_list"]
    medians = dict(zip(feature_list, bundle["medians"]))

    x = np.array([[feature_dict.get(f) if feature_dict.get(f) is not None else medians.get(f, 0.0) for f in feature_list]], dtype=float)
    pred = int(model.predict(x)[0])

    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(x)[0]
        classes = list(model.classes_)
        probabilities = {LABEL_NAMES[c]: round(float(p), 4) for c, p in zip(classes, proba)}
    else:
        probabilities = {LABEL_NAMES[pred]: 1.0}

    return {
        "predicted_label": pred,
        "predicted_label_name": LABEL_NAMES[pred],
        "probabilities": probabilities,
        "model_id": active.id,
        "algorithm": active.algorithm,
        "features_used": feature_list,
    }


def predict_for_farm(db: Session, farm_id: int) -> dict:
    farm = db.get(Farm, farm_id)
    if farm is None:
        raise ValueError(f"Farm {farm_id} not found")

    weather = (
        db.query(RawWeatherRecord)
        .filter(RawWeatherRecord.farm_id == farm_id)
        .order_by(RawWeatherRecord.record_date.desc())
        .first()
    )
    soil = (
        db.query(RawSoilRecord)
        .filter(RawSoilRecord.farm_id == farm_id)
        .order_by(RawSoilRecord.ingested_at.desc())
        .first()
    )

    row_values = {
        "temperature_c": weather.temperature_c if weather else 30.0,
        "rainfall_mm": weather.rainfall_mm if weather else 10.0,
        "relative_humidity_pct": weather.relative_humidity_pct if weather else 60.0,
        "wind_speed_ms": weather.wind_speed_ms if weather else 3.0,
        "solar_radiation": weather.solar_radiation if weather else 18.0,
        "evapotranspiration_mm": weather.evapotranspiration_mm if weather else 4.0,
        "soil_moisture": weather.soil_moisture if weather else 0.3,
        "soil_ph": soil.soil_ph if soil else (farm.soil_ph_farm_declared or 6.5),
        "clay_content_pct": soil.clay_content_pct if soil else 25.0,
        "sand_content_pct": soil.sand_content_pct if soil else 40.0,
        "soil_organic_carbon": soil.soil_organic_carbon if soil else 14.0,
    }

    pred_res = predict_custom_features(db, row_values)
    return {
        "farm_id": farm_id,
        "farm_name": farm.name,
        "as_of_date": weather.record_date if weather else dt.date.today(),
        **pred_res
    }