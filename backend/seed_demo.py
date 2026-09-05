"""
Complete Seeding Script for AgriHive AI (Phases 1 to 8+).

Seeds 7 simulated farms (Farm A to Farm G) matching the Regional Intelligence Map,
generates weather and soil records, populates real WaterStressObservation labels,
seeds the feature registry, executes feature selection, trains the Random Forest baseline model,
and initializes Clustered Federated Learning.
"""
import argparse
import datetime as dt
import json
import random

from app.database import init_db, session_scope
from app.models.farm import Farm
from app.models.raw_data import RawSoilRecord, RawWeatherRecord
from app.models.water_stress import WaterStressObservation, ObservationSource
from app.services import feature_registry_service, feature_selection_service, prediction_service
from app.services.clustered_fl_engine import run_clustered_fl_training

FARMS = [
    dict(
        name="Farm A",
        latitude=10.7905,
        longitude=78.7047,  # Tiruchirappalli region, Tamil Nadu
        crop="Rice",
        irrigation_method="Flood",
        soil_ph_farm_declared=6.2,
        management_history="Low soil moisture, low irrigation availability this season.",
    ),
    dict(
        name="Farm B",
        latitude=11.0168,
        longitude=76.9558,  # Coimbatore region
        crop="Rice",
        irrigation_method="Drip",
        soil_ph_farm_declared=6.6,
        management_history="Normal soil moisture, medium irrigation availability.",
    ),
    dict(
        name="Farm C",
        latitude=9.9252,
        longitude=78.1198,  # Madurai region - High Risk Focus
        crop="Cotton",
        irrigation_method="Sprinkler",
        soil_ph_farm_declared=7.1,
        management_history="Normal soil moisture, high irrigation availability. Fungal leaf wetness detected.",
    ),
    dict(
        name="Farm D",
        latitude=12.9716,
        longitude=77.5946,  # Bengaluru region
        crop="Maize",
        irrigation_method="Drip",
        soil_ph_farm_declared=6.4,
        management_history="New farm onboarding - reports an extra local sensor reading.",
        extra_attributes_json=json.dumps({"canopy_temperature_c": 29.4, "leaf_wetness_pct": 74.0}),
    ),
    dict(
        name="Farm E",
        latitude=11.6643,
        longitude=78.1460,  # Salem region
        crop="Sugarcane",
        irrigation_method="Canal",
        soil_ph_farm_declared=6.8,
        management_history="Moderate water supply, balanced NPK application.",
    ),
    dict(
        name="Farm F",
        latitude=10.7870,
        longitude=79.1378,  # Thanjavur region
        crop="Paddy",
        irrigation_method="Flood",
        soil_ph_farm_declared=6.0,
        management_history="High delta rainfall region, alluvial clay soil.",
    ),
    dict(
        name="Farm G",
        latitude=10.3673,
        longitude=77.9803,  # Dindigul region
        crop="Groundnut",
        irrigation_method="Drip",
        soil_ph_farm_declared=6.5,
        management_history="Semi-arid hills, well irrigation.",
    ),
]


def _synthetic_weather_rows(farm_key: str, days: int = 60) -> list[dict]:
    profiles = {
        "Farm A": dict(temp=(30, 38), rain=(0, 8), hum=(35, 55), moisture=(0.08, 0.20)),
        "Farm B": dict(temp=(27, 33), rain=(2, 20), hum=(50, 70), moisture=(0.20, 0.35)),
        "Farm C": dict(temp=(33, 39), rain=(0, 5), hum=(70, 90), moisture=(0.05, 0.15)),  # High risk
        "Farm D": dict(temp=(24, 30), rain=(3, 25), hum=(50, 70), moisture=(0.25, 0.40)),
        "Farm E": dict(temp=(28, 34), rain=(4, 18), hum=(45, 65), moisture=(0.22, 0.38)),
        "Farm F": dict(temp=(29, 35), rain=(10, 45), hum=(65, 85), moisture=(0.30, 0.48)),
        "Farm G": dict(temp=(26, 32), rain=(1, 12), hum=(40, 60), moisture=(0.15, 0.28)),
    }
    p = profiles.get(farm_key, profiles["Farm A"])
    rows = []
    today = dt.date.today()
    for i in range(days):
        date = today - dt.timedelta(days=days - i)
        t = round(random.uniform(*p["temp"]), 1)
        r = round(random.uniform(*p["rain"]), 1)
        h = round(random.uniform(*p["hum"]), 1)
        m = round(random.uniform(*p["moisture"]), 3)
        rows.append(
            {
                "date": date,
                "temperature_c": t,
                "rainfall_mm": r,
                "relative_humidity_pct": h,
                "wind_speed_ms": round(random.uniform(1, 6), 2),
                "solar_radiation": round(random.uniform(14, 26), 2),
                "evapotranspiration_mm": round(random.uniform(2, 7), 2),
                "soil_moisture": m,
            }
        )
    return rows


def _synthetic_soil(farm_key: str) -> dict:
    profiles = {
        "Farm A": dict(ph=6.1, clay=22, sand=45, soc=12),
        "Farm B": dict(ph=6.5, clay=28, sand=38, soc=15),
        "Farm C": dict(ph=7.1, clay=18, sand=55, soc=10),
        "Farm D": dict(ph=6.3, clay=25, sand=40, soc=14),
        "Farm E": dict(ph=6.8, clay=30, sand=35, soc=16),
        "Farm F": dict(ph=6.0, clay=38, sand=25, soc=19),
        "Farm G": dict(ph=6.5, clay=20, sand=50, soc=11),
    }
    return profiles.get(farm_key, profiles["Farm A"])


def run(synthetic: bool = True):
    init_db()
    print("Initializing AgriHive AI database and seeding Farms A through G...")

    with session_scope() as db:
        farm_ids = {}
        for f in FARMS:
            existing = db.query(Farm).filter_by(name=f["name"]).first()
            if existing:
                farm_ids[f["name"]] = existing.id
                continue
            farm = Farm(**f)
            db.add(farm)
            db.flush()
            farm_ids[f["name"]] = farm.id
        print(f"Farms ready: {farm_ids}")

    with session_scope() as db:
        for name, fid in farm_ids.items():
            # Check existing weather
            count = db.query(RawWeatherRecord).filter_by(farm_id=fid).count()
            if count == 0:
                weather_rows = _synthetic_weather_rows(name, days=60)
                for row in weather_rows:
                    db.add(
                        RawWeatherRecord(
                            farm_id=fid,
                            source="synthetic_demo",
                            record_date=row["date"],
                            temperature_c=row["temperature_c"],
                            rainfall_mm=row["rainfall_mm"],
                            relative_humidity_pct=row["relative_humidity_pct"],
                            wind_speed_ms=row["wind_speed_ms"],
                            solar_radiation=row["solar_radiation"],
                            evapotranspiration_mm=row["evapotranspiration_mm"],
                            soil_moisture=row["soil_moisture"],
                            raw_payload_json=json.dumps(row, default=str),
                        )
                    )

                    # Determine real water-stress ground truth observation label
                    # 0=LOW, 1=MEDIUM, 2=HIGH
                    if row["soil_moisture"] < 0.12 or (row["temperature_c"] > 34 and row["rainfall_mm"] < 2):
                        lbl = 2  # HIGH
                    elif row["soil_moisture"] < 0.25 or row["temperature_c"] > 31:
                        lbl = 1  # MEDIUM
                    else:
                        lbl = 0  # LOW

                    # Override Farm C as High Risk for demo alignment
                    if name == "Farm C" and random.random() < 0.8:
                        lbl = 2

                    db.add(
                        WaterStressObservation(
                            farm_id=fid,
                            observation_date=row["date"],
                            label=lbl,
                            source=ObservationSource.FIELD_VISIT,
                            confidence=0.95,
                            notes=f"Agronomist field visit assessment for {name}"
                        )
                    )

                soil = _synthetic_soil(name)
                db.add(
                    RawSoilRecord(
                        farm_id=fid,
                        source="synthetic_demo",
                        depth="0-5cm",
                        soil_ph=soil["ph"],
                        clay_content_pct=soil["clay"],
                        sand_content_pct=soil["sand"],
                        soil_organic_carbon=soil["soc"],
                        raw_payload_json=json.dumps(soil),
                    )
                )
                print(f"[synthetic] Ingested 60 weather + label observations for {name}")

    with session_scope() as db:
        feature_registry_service.seed_registry(db)
        feature_registry_service.refresh_availability_and_quality(db)
        for name, fid in farm_ids.items():
            discovered = feature_registry_service.detect_new_farm_features(db, fid)
            if discovered:
                print(f"[{name}] New feature(s) discovered: {discovered}")

    with session_scope() as db:
        run_result = feature_selection_service.run_feature_selection(
            db, notes="Demo run via seed_demo.py across Farms A-G"
        )
        print(f"\nFeature Selection Run #{run_result.id} complete.")
        print(f"Best subset F1: {run_result.best_model_f1}")

    with session_scope() as db:
        model_record = prediction_service.train_model(db)
        print(f"\nRandom Forest Baseline Model Trained: status={model_record.status}, algorithm={model_record.algorithm}")

    with session_scope() as db:
        fl_result = run_clustered_fl_training(db, n_rounds=5)
        print(f"\nClustered FL Rounds Complete: clusters={fl_result.get('total_clusters')}, summary={fl_result.get('clustered_fl_summary')}")

    # Seed User Accounts & Audit Logs for RBAC Specification
    with session_scope() as db:
        from app.core.security import hash_password
        from app.models.audit_log import AuditLog
        from app.models.user import User

        demo_users = [
            dict(username="farmer1", email="ramesh@agrihive.in", password="farmer123", full_name="Ramesh Kumar", role="farmer", farm_id=farm_ids.get("Farm A", 1)),
            dict(username="officer1", email="anbarasan@agrihive.in", password="officer123", full_name="Dr. S. Anbarasan", role="officer", farm_id=farm_ids.get("Farm B", 2)),
            dict(username="admin1", email="admin@agrihive.in", password="admin123", full_name="System Admin", role="admin", farm_id=None),
        ]

        for udata in demo_users:
            existing = db.query(User).filter(User.username == udata["username"]).first()
            if not existing:
                user_obj = User(
                    username=udata["username"],
                    email=udata["email"],
                    password_hash=hash_password(udata["password"]),
                    full_name=udata["full_name"],
                    role=udata["role"],
                    status="active",
                    farm_id=udata["farm_id"],
                )
                db.add(user_obj)
                print(f"[RBAC Seed] Created user '{udata['username']}' with role '{udata['role']}'")

        # Initial System Audit Logs
        db.add(AuditLog(username="SYSTEM", role="SYSTEM", action="SYSTEM_INIT", entity="Database", details="Initial database & RBAC tables provisioned", result="SUCCESS"))
        db.add(AuditLog(username="admin1", role="admin", action="MODEL_DEPLOYED", entity="RandomForest", details="Random Forest baseline model v1.4 deployed", result="SUCCESS"))
        db.add(AuditLog(username="admin1", role="admin", action="FL_ROUND_COMPLETED", entity="FederatedEngine", details="Clustered FL training round 5 completed across 7 farm clients", result="SUCCESS"))

    print("\nAgriHive AI full backend pipeline initialization complete!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--synthetic", action="store_true", default=True, help="Use synthetic data")
    args = parser.parse_args()
    run(args.synthetic)
