"""
AgriHive AI - FastAPI Application Entrypoint.

Privacy-preserving collaborative agricultural risk intelligence platform.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


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

# --- Strict Production CORS Domain Policy ---
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
        "phase": "Complete Phase 1 to Phase 8+ Implementation (Clustered Federated Learning Stack)",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
