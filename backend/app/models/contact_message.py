from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.models.base import Base


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(200), nullable=False)
    subject = Column(String(200), nullable=False, default="")
    message = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="under_review")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
