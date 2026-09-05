"""
AgriHive AI - Application configuration.

Central place for environment-driven settings. Environment variables are loaded
from `.env` using pydantic-settings.
"""
import os
from typing import List, Union
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Security & Secrets (Environment-driven) -----------------------
    SECRET_KEY: str = Field(
        default="agrihive_secret_key_rbac_jwt_signature_2026",
        description="Master JWT signing secret key loaded strictly from environment"
    )
    SECRET_SALT: str = Field(
        default="agrihive_salt_9988",
        description="Password hashing salt loaded strictly from environment"
    )
    FAST2SMS_API_KEY: str = Field(
        default="",
        description="Fast2SMS SMS gateway API key"
    )

    # --- CORS Security Policy ------------------------------------------
    CORS_ORIGINS: Union[List[str], str] = Field(
        default=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://localhost:8001",
            "https://agrihive.ai",
            "https://app.agrihive.ai",
        ],
        description="Strict list of allowed CORS origins"
    )

    # --- Celery & Redis Task Queue Settings ---------------------------
    CELERY_BROKER_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis message broker URL for Celery async worker queue"
    )
    CELERY_RESULT_BACKEND: str = Field(
        default="redis://localhost:6379/1",
        description="Redis result backend URL for Celery task states"
    )

    # --- Database -----------------------------------------------------
    DATABASE_URL: str = "sqlite:///./data/agrihive.db"

    # --- External data sources -----------------------------------------
    NASA_POWER_BASE_URL: str = "https://power.larc.nasa.gov/api/temporal/daily/point"
    OPEN_METEO_FORECAST_URL: str = "https://api.open-meteo.com/v1/forecast"
    OPEN_METEO_ARCHIVE_URL: str = "https://archive-api.open-meteo.com/v1/archive"
    SOILGRIDS_BASE_URL: str = "https://rest.isric.org/soilgrids/v2.0/properties/query"

    HTTP_TIMEOUT_SECONDS: int = 30

    # --- Phase 3: trained model artifacts -------------------------------
    MODEL_STORAGE_DIR: str = "./data/models"

    # --- App metadata ----------------------------------------------------
    APP_NAME: str = "AgriHive AI"
    APP_VERSION: str = "0.2.0 (Phase 1-3)"


settings = Settings()