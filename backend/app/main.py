"""
AgriHive AI - FastAPI Application Entrypoint.

Privacy-preserving collaborative agricultural risk intelligence platform.
Includes Observability, Structured JSON Logging, Sentry APM, Prometheus Metrics,
and /healthz /readyz Kubernetes load balancing probes.
"""
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, Counter, Histogram

from app.config import settings
from app.database import init_db, SessionLocal, engine
from app.core.logging_config import setup_structured_logging, CorrelationIdMiddleware
from app.routers import (
    alerts,
    auth,
    clustered_federated_learning,
    farms,
    feature_registry,
    feature_selection,
    ingestion,
    labels,
    predict,
    pso,
    virtual_farm,
    xai,
)

# Initialize Structured JSON Logging
setup_structured_logging(logging.INFO)
logger = logging.getLogger("agrihive.main")

# Sentry APM Integration
if settings.SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            integrations=[FastApiIntegration()],
            traces_sample_rate=1.0,
            profiles_sample_rate=1.0,
        )
        logger.info("Sentry APM Error Tracking initialized successfully.")
    except Exception as e:
        logger.warning(f"Failed to initialize Sentry: {e}")

# Prometheus Metrics Counters
REQUEST_COUNT = Counter("agrihive_http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"])
REQUEST_LATENCY = Histogram("agrihive_http_request_duration_seconds", "HTTP request latency in seconds", ["endpoint"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AgriHive AI application server...")
    init_db()
    yield
    logger.info("Shutting down AgriHive AI application server...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Privacy-preserving collaborative agricultural risk intelligence platform. "
        "Complete Phase 1 to Phase 8+ system with Clustered Federated Learning, Virtual Farm Digital Twin, "
        "PSO Optimization, SHAP Explainable AI, and interactive frontend."
    ),
    lifespan=lifespan,
)

# Correlation ID Middleware for Request Tracing
app.add_middleware(CorrelationIdMiddleware)

# Strict Production CORS Domain Policy
allowed_origins = settings.CORS_ORIGINS
if isinstance(allowed_origins, str):
    allowed_origins = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(farms.router)
app.include_router(ingestion.router)
app.include_router(feature_registry.router)
app.include_router(feature_selection.router)
app.include_router(labels.router)
app.include_router(predict.router)
app.include_router(clustered_federated_learning.router)
app.include_router(virtual_farm.router)
app.include_router(pso.router)
app.include_router(xai.router)
app.include_router(alerts.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


# --- Kubernetes Liveness Probe ---
@app.get("/healthz", tags=["Observability"])
def liveness_probe():
    """Liveness probe: verifies process is running."""
    return {"status": "alive", "app": settings.APP_NAME}


# --- Kubernetes Readiness Probe ---
@app.get("/readyz", tags=["Observability"])
def readiness_probe(response: Response):
    """Readiness probe: verifies database connectivity and system readiness for load balancing."""
    checks = {"database": "unknown"}
    is_ready = True

    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        checks["database"] = "healthy"
    except Exception as e:
        checks["database"] = f"unhealthy: {str(e)}"
        is_ready = False

    if is_ready:
        return {"status": "ready", "checks": checks}
    else:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "not_ready", "checks": checks}


# --- Prometheus Metrics Exporter ---
@app.get("/metrics", tags=["Observability"])
def prometheus_metrics():
    """Expose Prometheus metrics endpoint."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
