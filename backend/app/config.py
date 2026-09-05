"""
AgriHive AI - Application configuration.

Central place for environment-driven settings. No Docker is used anywhere in
this project; PostgreSQL is optional and SQLite is the default so the app
runs immediately after `pip install -r requirements.txt`.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Database -----------------------------------------------------
    DATABASE_URL: str = "sqlite:///./data/agrihive.db"

    # --- External data sources (Section 6 of the plan) -----------------
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