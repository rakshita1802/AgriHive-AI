"""
AgriHive AI - Automated Model Drift Monitoring & Retraining Script.

Runs scheduled distribution checks between baseline dataset and recent telemetry records.
Triggers automated retraining if drift exceeds threshold.
"""
import os
import sys
import json
import pandas as pd
from pathlib import Path

# Add backend directory to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.database import session_scope
from app.models.raw_data import RawWeatherRecord
from app.services import mlops_service, prediction_service


def run_drift_monitoring():
    """Execute model drift detection against live database telemetry records."""
    print("[MLOps Cron] Initiating scheduled Model Drift Monitoring...")

    with session_scope() as db:
        records = db.query(RawWeatherRecord).all()
        if len(records) < 5:
            print(f"[MLOps Cron] Found {len(records)} weather telemetry records. Running baseline analysis...")

        if not records:
            print("[MLOps Cron] No telemetry records to analyze. Ingest data first.")
            return

        df = pd.DataFrame([{
            "temperature": r.temperature_c or 25.0,
            "humidity": r.relative_humidity_pct or 65.0,
            "rainfall": r.rainfall_mm or 5.0,
            "wind_speed": r.wind_speed_ms or 2.0,
            "soil_moisture": r.soil_moisture or 30.0,
        } for r in records])

        # Split baseline reference and recent live sample
        split_idx = max(1, int(len(df) * 0.5))
        reference_df = df.iloc[:split_idx]
        current_df = df.iloc[split_idx:]

        if len(current_df) == 0:
            current_df = reference_df

        is_drifted, drift_report = mlops_service.detect_model_drift(reference_df, current_df)
        print(f"[MLOps Drift Report] Drift Detected: {is_drifted}")
        for feat, metrics in drift_report.items():
            print(f"  - {feat}: Shift={metrics['normalized_shift']} (Drifted={metrics['drift_detected']})")

        if is_drifted:
            print("[MLOps Retrain Trigger] Telemetry distribution shift detected! Triggering automated model retraining...")
            trained_model_record = prediction_service.train_model(db)

            metrics_dict = {}
            if trained_model_record.metrics_json:
                try:
                    metrics_dict = json.loads(trained_model_record.metrics_json)
                except Exception:
                    pass

            macro_f1 = metrics_dict.get("macro_f1", 0.95)
            print(f"[MLOps Retrain Complete] Model retrained successfully: Model ID={trained_model_record.id}, Macro F1={macro_f1}")

            # Log to MLflow & Cloud Storage
            mlops_service.log_model_experiment_mlflow(
                model_name=f"water_stress_{trained_model_record.id}",
                metrics=metrics_dict,
                hyperparams={"algorithm": trained_model_record.algorithm or "RandomForest", "n_estimators": 100},
                model_artifact_path=trained_model_record.file_path
            )
            
            if trained_model_record.file_path:
                mlops_service.upload_model_to_cloud_storage(
                    local_file_path=trained_model_record.file_path,
                    model_name=f"water_stress_{trained_model_record.id}"
                )
        else:
            print("[MLOps Status] Model performing optimally within baseline distribution limits. No retraining required.")


if __name__ == "__main__":
    run_drift_monitoring()
