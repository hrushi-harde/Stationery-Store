from pydantic import BaseModel
from typing import List, Dict

class OrderItem(BaseModel):
    id: int
    name: str
    quantity: int
    price: float

class OrderTotals(BaseModel):
    subtotal: float
    shipping: float
    total: float

class OrderCreate(BaseModel):
    customer: Dict[str, str]
    items: List[OrderItem]
    totals: OrderTotals

class OrderOut(BaseModel):
    id: str
    status: str
    totals: OrderTotals
