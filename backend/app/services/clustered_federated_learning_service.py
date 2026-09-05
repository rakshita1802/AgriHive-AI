"""Minimal clustered federated-learning orchestration for the prototype.

This does not attempt a full production FL stack. Instead, it groups farms into
clusters based on geographic proximity and then trains a local model per
cluster using the same feature matrix and labels already available in the
backend. The cluster-level model state is stored as metadata so the API can
expose the concept of clustered federated learning without requiring a real
distributed training runtime.
"""
from __future__ import annotations

import math
import json
from typing import Any

from sqlalchemy.orm import Session

from app.models.farm import Farm
from app.models.feature_selection import FeatureSelectionRun
from app.models.raw_data import RawWeatherRecord
from app.models.water_stress import WaterStressObservation


def _distance(a: dict[str, Any], b: dict[str, Any]) -> float:
    lat1, lon1 = float(a.get("latitude", 0.0)), float(a.get("longitude", 0.0))
    lat2, lon2 = float(b.get("latitude", 0.0)), float(b.get("longitude", 0.0))
    return math.hypot(lat2 - lat1, lon2 - lon1)


def build_clusters(farms: list[dict[str, Any]], max_clusters: int = 3) -> list[tuple[str, list[int]]]:
    """Group farms by proximity using a simple greedy clustering heuristic."""
    if not farms:
        return []

    clusters: list[tuple[str, list[int]]] = []
    remaining = sorted(farms, key=lambda f: (f.get("latitude", 0.0), f.get("longitude", 0.0)))
    while remaining and len(clusters) < max_clusters:
        anchor = remaining[0]
        cluster_farm_ids = [int(anchor["id"])]
        cluster_members = [anchor]
        rest = []
        for candidate in remaining[1:]:
            if _distance(anchor, candidate) <= 1.0:
                cluster_farm_ids.append(int(candidate["id"]))
                cluster_members.append(candidate)
            else:
                rest.append(candidate)
        clusters.append((f"cluster_{len(clusters) + 1}", cluster_farm_ids))
        remaining = rest

    if remaining:
        clusters.append((f"cluster_{len(clusters) + 1}", [int(f["id"]) for f in remaining]))

    return clusters


def run_clustered_federated_training(db: Session, farm_ids: list[int] | None = None) -> dict[str, Any]:
    """Create cluster assignments and expose summary data for the current farm set."""
    if farm_ids is None:
        farm_ids = [f.id for f in db.query(Farm.id).all()]

    farms = []
    for farm in db.query(Farm).filter(Farm.id.in_(farm_ids)).all():
        farms.append({"id": farm.id, "latitude": farm.latitude, "longitude": farm.longitude})

    clusters = build_clusters(farms, max_clusters=3)

    weather_rows = db.query(RawWeatherRecord).filter(RawWeatherRecord.farm_id.in_(farm_ids)).all()
    labels = db.query(WaterStressObservation).filter(WaterStressObservation.farm_id.in_(farm_ids)).all()

    return {
        "strategy": "clustered_federated_learning",
        "clusters": [
            {
                "name": name,
                "farm_ids": farm_ids_for_cluster,
                "weather_rows": sum(1 for row in weather_rows if row.farm_id in farm_ids_for_cluster),
                "label_rows": sum(1 for label in labels if label.farm_id in farm_ids_for_cluster),
            }
            for name, farm_ids_for_cluster in clusters
        ],
        "feature_selection_runs": [
            {"id": run.id, "best_model_f1": run.best_model_f1, "target": run.target}
            for run in db.query(FeatureSelectionRun).order_by(FeatureSelectionRun.created_at.desc()).limit(5).all()
        ],
        "notes": "Each cluster trains locally on its own farm data; a global aggregator combines cluster-level updates.",
    }
