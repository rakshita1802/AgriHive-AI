import datetime as dt
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/alerts", tags=["Regional & Farm Risk Alerts"])


@router.get("/")
def get_alerts(db: Session = Depends(get_db)):
    """Retrieve recent risk alerts and regional intelligence notifications."""
    return [
        {
            "id": 1,
            "title": "High disease probability detected in 10 km radius",
            "time_ago": "2 hr ago",
            "level": "high",
            "category": "Regional Risk",
            "timestamp": (dt.datetime.utcnow() - dt.timedelta(hours=2)).isoformat(),
        },
        {
            "id": 2,
            "title": "Rainfall expected in your region tomorrow (25mm forecast)",
            "time_ago": "5 hr ago",
            "level": "medium",
            "category": "Weather Alert",
            "timestamp": (dt.datetime.utcnow() - dt.timedelta(hours=5)).isoformat(),
        },
        {
            "id": 3,
            "title": "Farm C water-stress risk escalated to 86%",
            "time_ago": "8 hr ago",
            "level": "high",
            "category": "Farm Alert",
            "timestamp": (dt.datetime.utcnow() - dt.timedelta(hours=8)).isoformat(),
        },
        {
            "id": 4,
            "title": "Soil moisture deficit detected in Cluster 1 semi-arid zone",
            "time_ago": "12 hr ago",
            "level": "medium",
            "category": "Cluster Alert",
            "timestamp": (dt.datetime.utcnow() - dt.timedelta(hours=12)).isoformat(),
        },
    ]
