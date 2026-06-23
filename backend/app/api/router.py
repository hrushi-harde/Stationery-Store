from fastapi import APIRouter
from app.api.v1.endpoints import ai, auth, contact_messages, orders, products

api_router = APIRouter()
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(contact_messages.router, prefix="/contact-requests", tags=["contact-requests"])
