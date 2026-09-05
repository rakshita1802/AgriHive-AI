import datetime as dt

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from app.database import Base


class TrainedModel(Base):
    __tablename__ = "trained_models"

    id = Column(Integer, primary_key=True, index=True)
    target = Column(String(80), nullable=False)
    status = Column(String(40), nullable=False)
    detail = Column(Text, nullable=True)
    algorithm = Column(String(80), nullable=True)
    feature_set_json = Column(Text, nullable=True)
    impute_medians_json = Column(Text, nullable=True)
    metrics_json = Column(Text, nullable=True)
    file_path = Column(String(255), nullable=True)
    n_labelled_rows = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=False, nullable=False)
    trained_at = Column(DateTime, default=lambda: dt.datetime.utcnow(), nullable=False)
