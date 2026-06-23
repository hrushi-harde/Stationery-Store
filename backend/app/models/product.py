from sqlalchemy import Boolean, Column, Integer, Numeric, String, Text

from app.models.base import Base

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(120), nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    offer_price = Column(Numeric(10, 2), nullable=False)
    image_url = Column(String(500), nullable=False)
    is_active = Column(Boolean, default=True)
