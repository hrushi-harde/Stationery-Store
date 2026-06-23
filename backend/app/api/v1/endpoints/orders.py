from fastapi import APIRouter
from app.schemas.order import OrderCreate, OrderOut

router = APIRouter()

@router.post("")
def create_order(payload: OrderCreate) -> OrderOut:
    # TODO: persist order and return status
    return OrderOut(id="order_x", status="created", totals=payload.totals)
