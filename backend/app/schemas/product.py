from pydantic import BaseModel
from typing import List

class ProductOut(BaseModel):
    id: int
    name: str
    price: float
    offer_price: float
    category: str
    description: str
    image_url: str
    is_active: bool

class ProductSearchRequest(BaseModel):
    query: str | None = None
    category: str | None = None
    sort: str | None = None
    page: int = 1
    page_size: int = 20

class ProductSearchResponse(BaseModel):
    items: List[ProductOut]
    total: int


class ProductCreateRequest(BaseModel):
    name: str
    category: str
    description: str
    price: float
    offer_price: float
    image_url: str
    is_active: bool = True


class ProductUpdateRequest(BaseModel):
    name: str | None = None
    category: str | None = None
    description: str | None = None
    price: float | None = None
    offer_price: float | None = None
    image_url: str | None = None
    is_active: bool | None = None
