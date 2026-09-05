"""
AgriHive AI - Asynchronous Worker Task Definitions.

Offloads heavy computational AI tasks (PSO swarm iterations, Clustered FL model aggregation)
and network I/O (Fast2SMS OTP delivery) to background Celery workers.
"""
import time
from typing import Dict, Any
from app.core.celery_app import celery_app
from app.services import otp_service, pso_optimizer, clustered_fl_engine


@celery_app.task(name="async_send_fast2sms_otp", bind=True, max_retries=3)
def async_send_fast2sms_otp(self, mobile_number: str, otp_code: str) -> Dict[str, Any]:
    """Asynchronously send SMS OTP via Fast2SMS gateway without blocking API response."""
    try:
        print(f"[Async Celery Task] Dispatching Fast2SMS OTP to {mobile_number}...")
        result = otp_service.send_fast2sms_otp(mobile_number, otp_code)
        return result
    except Exception as exc:
        print(f"[Async Celery Task Error] Retrying Fast2SMS OTP task due to error: {exc}")
        raise self.retry(exc=exc, countdown=5)


@celery_app.task(name="async_run_pso_optimization", bind=True)
def async_run_pso_optimization(self, farm_id: int, telemetry_data: Dict[str, Any]) -> Dict[str, Any]:
    """Asynchronously execute 50-particle Particle Swarm Optimization (PSO) in background worker."""
    print(f"[Async Celery Task] Running PSO 50-particle optimization for farm_id={farm_id}...")
    start_time = time.time()
    
    # Run Swarm optimization
    pso_result = pso_optimizer.run_pso_optimization(farm_id, telemetry_data)
    
    execution_ms = round((time.time() - start_time) * 1000, 2)
    pso_result["execution_ms"] = execution_ms
    print(f"[Async Celery Task Complete] PSO optimization finished in {execution_ms}ms for farm_id={farm_id}")
    return pso_result


@celery_app.task(name="async_run_cfl_aggregation", bind=True)
def async_run_cfl_aggregation(self, num_clusters: int = 3, global_rounds: int = 5) -> Dict[str, Any]:
    """Asynchronously execute Clustered Federated Learning (CFL) model aggregation in background worker."""
    print(f"[Async Celery Task] Executing Clustered Federated Learning (clusters={num_clusters}, rounds={global_rounds})...")
    start_time = time.time()
    
    cfl_result = clustered_fl_engine.train_clustered_federated_learning(
        num_clusters=num_clusters,
        global_rounds=global_rounds
    )
    
    execution_ms = round((time.time() - start_time) * 1000, 2)
    cfl_result["execution_ms"] = execution_ms
    print(f"[Async Celery Task Complete] CFL aggregation finished in {execution_ms}ms.")
    return cfl_result
