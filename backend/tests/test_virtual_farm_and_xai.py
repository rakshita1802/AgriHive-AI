import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db, session_scope
from seed_demo import run as run_seed

@pytest.fixture(scope="module", autouse=True)
def setup_data():
    init_db()
    run_seed(synthetic=True)

def test_virtual_farm_state():
    client = TestClient(app)
    res = client.get("/virtual-farm/state/1")
    assert res.status_code == 200
    data = res.json()
    assert data["farm_id"] == 1
    assert "current_conditions" in data
    assert "current_metrics" in data

def test_what_if_simulation():
    client = TestClient(app)
    payload = {
        "farm_id": 1,
        "irrigation_level_pct": 70.0,
        "rainfall_mm": 15.0,
        "temperature_c": 30.0,
        "fertilizer_npk_pct": 85.0,
        "scenario_name": "Test Irrigation Boost"
    }
    res = client.post("/virtual-farm/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["farm_id"] == 1
    assert "simulated_outcomes_7d" in data
    assert data["simulated_outcomes_7d"]["disease_risk_pct"] > 0

def test_pso_optimization():
    client = TestClient(app)
    res = client.post("/optimization/pso/1?max_water_available_l=120")
    assert res.status_code == 200
    data = res.json()
    assert data["farm_id"] == 1
    assert "optimal_intervention" in data
    assert data["confidence_score_pct"] == 92.0

def test_xai_explanation():
    client = TestClient(app)
    res = client.get("/xai/explain/1")
    assert res.status_code == 200
    data = res.json()
    assert data["farm_id"] == 1
    assert "shap_feature_importance" in data
    assert len(data["shap_feature_importance"]) > 0
    assert "model_explanation_plain_language" in data

def test_clustered_fl_train():
    client = TestClient(app)
    res = client.post("/clustered-fl/train?n_rounds=3")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["total_clusters"] > 0
    assert "baseline_random_forest" in data

def test_alerts():
    client = TestClient(app)
    res = client.get("/alerts")
    assert res.status_code == 200
    alerts = res.json()
    assert isinstance(alerts, list)
    assert len(alerts) >= 3
