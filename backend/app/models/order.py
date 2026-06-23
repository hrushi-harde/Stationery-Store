from datetime import datetime

from sqlalchemy import Column, DateTime, JSON, String

from app.models.base import Base

class Order(Base):
    __tablename__ = "orders"
    id = Column(String(64), primary_key=True, index=True)
    status = Column(String(50), default="created")
    payload = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
