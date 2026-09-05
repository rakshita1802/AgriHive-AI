"""
Database engine and session management (SQLAlchemy).

Design principle from the plan (Section 15 - Raw Data vs Model Results):
this central database stores feature metadata, model/version info, farm
configuration and RAW DATA THAT THE PROTOTYPE SIMULATES AS "LOCAL" PER FARM.
In a real multi-node deployment each farm's raw dataset would live on the
farm's own machine/local DB and only model updates would leave it; for this
software-only prototype we keep each farm's raw rows logically partitioned
by farm_id so the separation is explicit and enforceable, and the ingestion
service never forwards this raw layer to any ML training step directly -
it always goes through the Feature Registry / Feature Selection Engine first.
"""
import os
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

# Ensure the ./data directory exists for the default SQLite file.
if settings.DATABASE_URL.startswith("sqlite"):
    os.makedirs("data", exist_ok=True)

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a request-scoped DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def session_scope():
    """Context manager for scripts (seeding, CLI tools) outside FastAPI."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """Create all tables. Called on app startup and by seed scripts."""
    from app.models import (  # noqa: F401
        audit_log,
        farm,
        feature_registry,
        feature_selection,
        raw_data,
        trained_model,
        user,
        water_stress,
    )

    Base.metadata.create_all(bind=engine)
