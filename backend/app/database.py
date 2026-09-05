"""
Database engine and session management (SQLAlchemy).

Features production-grade SQLAlchemy Connection Pooling for PostgreSQL,
AWS RDS, Azure Database for PostgreSQL, and Supabase managed database clusters,
with SQLite fallback for local development.
"""
import os
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

# Determine database dialect
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

if is_sqlite:
    os.makedirs("data", exist_ok=True)
    connect_args = {"check_same_thread": False}
    # Create SQLite engine
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        future=True
    )
else:
    # Production Managed PostgreSQL Connection Pooling
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=20,
        max_overflow=10,
        pool_timeout=30,
        pool_recycle=1800,
        pool_pre_ping=True,
        future=True
    )

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
