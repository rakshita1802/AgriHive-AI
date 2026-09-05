"""
AgriHive AI - MLOps & Model Artifact Management Service.

Provides:
1. Cloud Object Storage Integration (AWS S3 / GCS / DigitalOcean Spaces) for model binaries (.joblib)
2. MLflow Experiment Tracking & Model Versioning (F1-score, accuracy, hyperparameters)
3. Automated Model Drift Monitoring & Retraining Engine
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, Tuple

from app.config import settings

# Attempt MLflow import
try:
    import mlflow
    import mlflow.sklearn
    HAS_MLFLOW = True
except ImportError:
    HAS_MLFLOW = False

# Attempt Boto3 import for Cloud S3 Storage
try:
    import boto3
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False


S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "agrihive-ai-models")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")


def upload_model_to_cloud_storage(local_file_path: str, model_name: str) -> Dict[str, Any]:
    """Upload trained model binary (.joblib) to Cloud Object Storage (AWS S3 / Spaces)."""
    aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")

    if HAS_BOTO3 and aws_access_key and aws_secret_key:
        try:
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=aws_access_key,
                aws_secret_access_key=aws_secret_key,
                region_name=AWS_REGION
            )
            s3_key = f"models/{os.path.basename(local_file_path)}"
            s3_client.upload_file(local_file_path, S3_BUCKET_NAME, s3_key)
            s3_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
            print(f"[MLOps Storage] Successfully uploaded model {model_name} to S3: {s3_url}")
            return {"status": "success", "storage": "s3", "url": s3_url, "key": s3_key}
        except Exception as e:
            print(f"[MLOps Storage Error] Failed S3 upload: {e}. Keeping local binary.")

    # Local storage fallback
    return {
        "status": "local",
        "storage": "local_disk",
        "local_path": local_file_path,
        "message": "Cloud S3 credentials pending; stored in local model registry."
    }


def log_model_experiment_mlflow(
    model_name: str,
    metrics: Dict[str, Any],
    hyperparams: Dict[str, Any],
    model_artifact_path: Optional[str] = None
) -> Optional[str]:
    """Log model run metrics, hyperparameters, and lineage into MLflow Tracking Server."""
    if not HAS_MLFLOW:
        print("[MLOps Tracking] MLflow not installed; skipping experiment logging.")
        return None

    try:
        mlflow.set_experiment("AgriHive_AI_WaterStress_Prediction")

        with mlflow.start_run(run_name=f"Run_{model_name}") as run:
            # Log hyperparameters
            for key, val in hyperparams.items():
                mlflow.log_param(key, str(val))

            # Log numerical metrics
            for key, val in metrics.items():
                try:
                    num_val = float(val)
                    mlflow.log_metric(key, num_val)
                except (ValueError, TypeError):
                    mlflow.log_param(key, str(val))

            # Log artifact if present
            if model_artifact_path and os.path.exists(model_artifact_path):
                mlflow.log_artifact(model_artifact_path, artifact_path="model_binaries")

            run_id = run.info.run_id
            print(f"[MLOps Tracking] Successfully logged MLflow Run ID: {run_id} for model {model_name}")
            return run_id
    except Exception as e:
        print(f"[MLOps Tracking Warning] Could not log to MLflow: {e}")
        return None


def detect_model_drift(
    reference_data: pd.DataFrame,
    current_data: pd.DataFrame,
    drift_threshold: float = 0.25
) -> Tuple[bool, Dict[str, Any]]:
    """
    Detect population distribution drift between training baseline and live sensor telemetry.
    Calculates Normalized Mean Shift (PSI metric equivalent).
    """
    drift_results = {}
    is_drift_detected = False

    num_cols = reference_data.select_dtypes(include=[np.number]).columns

    for col in num_cols:
        if col in current_data.columns:
            ref_mean = reference_data[col].mean()
            ref_std = reference_data[col].std() + 1e-6
            curr_mean = current_data[col].mean()

            # Normalized Shift Metric
            shift = abs(curr_mean - ref_mean) / ref_std
            col_drifted = shift > drift_threshold
            
            drift_results[col] = {
                "reference_mean": round(float(ref_mean), 3),
                "current_mean": round(float(curr_mean), 3),
                "normalized_shift": round(float(shift), 3),
                "drift_detected": bool(col_drifted)
            }

            if col_drifted:
                is_drift_detected = True

    return is_drift_detected, drift_results
