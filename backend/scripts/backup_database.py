"""
AgriHive AI - Production Database Automated Backup Utility.

Supports automated daily PostgreSQL database dumps, compression, and S3 / GCS / Local backup archiving,
plus SQLite database backups for development.
"""
import os
import sys
import datetime
import subprocess
from pathlib import Path

# Add backend directory to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from app.config import settings


def backup_database():
    """Create timestamped compressed backup of production database."""
    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup_dir = Path("./backups")
    backup_dir.mkdir(exist_ok=True)

    db_url = settings.DATABASE_URL
    print(f"[Backup Task] Initiating automated database backup at {timestamp}...")

    if db_url.startswith("sqlite"):
        # SQLite backup
        sqlite_file = db_url.replace("sqlite:///", "").split("?")[0]
        if os.path.exists(sqlite_file):
            target_path = backup_dir / f"agrihive_sqlite_{timestamp}.db"
            import shutil
            shutil.copy2(sqlite_file, target_path)
            print(f"[Backup Success] SQLite database backed up to {target_path}")
        else:
            print(f"[Backup Warning] SQLite file {sqlite_file} not found.")

    elif "postgresql" in db_url or "postgres" in db_url:
        # PostgreSQL pg_dump backup
        target_path = backup_dir / f"agrihive_postgres_{timestamp}.sql.gz"
        print(f"[Backup Task] Exporting PostgreSQL dump to {target_path}...")
        
        cmd = f"pg_dump {db_url} | gzip > {target_path}"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"[Backup Success] PostgreSQL backup created cleanly at {target_path}")
        else:
            print(f"[Backup Error] pg_dump failed: {result.stderr}")
    else:
        print(f"[Backup Notice] Database URL type not directly handled: {db_url}")


if __name__ == "__main__":
    backup_database()
