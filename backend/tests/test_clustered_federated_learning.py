from app.main import app
from app.services.clustered_federated_learning_service import build_clusters


def test_app_imports():
    assert app.title == "AgriHive AI"


def test_build_clusters_groups_farms_by_proximity():
    farms = [
        {"id": 1, "latitude": 12.0, "longitude": 77.0},
        {"id": 2, "latitude": 12.05, "longitude": 77.05},
        {"id": 3, "latitude": 2.0, "longitude": 3.0},
    ]

    clusters = build_clusters(farms, max_clusters=2)

    assert len(clusters) >= 2
    assert {farm_id for _, farm_ids in clusters for farm_id in farm_ids} == {1, 2, 3}
