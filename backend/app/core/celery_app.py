"""
AgriHive AI - Celery Asynchronous Task Queue Initialization.

Provides distributed background worker execution for long-running AI computations,
Particle Swarm Optimization (PSO), Clustered Federated Learning, and Fast2SMS dispatch.
"""
from celery import Celery
from app.config import settings

celery_app = Celery(
    "agrihive_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.async_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 minutes max per long-running task
)
