import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import _require_owner
from app.core.database import get_db
from app.models import Product
from app.schemas.product import (
    ProductCreateRequest,
    ProductOut,
    ProductSearchRequest,
    ProductSearchResponse,
    ProductUpdateRequest,
)

router = APIRouter()
upload_products_dir = Path("uploads") / "products"
upload_products_dir.mkdir(parents=True, exist_ok=True)
allowed_content_types = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
}


def _to_product_out(product: Product) -> ProductOut:
    return ProductOut(
        id=product.id,
        name=product.name,
        price=float(product.price),
        offer_price=float(product.offer_price),
        category=product.category,
        description=product.description,
        image_url=product.image_url,
        is_active=bool(product.is_active),
    )


@router.post("")
def search_products(payload: ProductSearchRequest, db: Session = Depends(get_db)) -> ProductSearchResponse:
    page = max(1, payload.page)
    page_size = max(1, min(payload.page_size, 100))

    query = db.query(Product).filter(Product.is_active.is_(True))

    if payload.query:
        term = f"%{payload.query.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(term),
                Product.category.ilike(term),
                Product.description.ilike(term),
            )
        )

    if payload.category:
        query = query.filter(Product.category.ilike(payload.category.strip()))

    total = query.count()

    if payload.sort == "price_low":
        query = query.order_by(Product.offer_price.asc(), Product.id.asc())
    elif payload.sort == "price_high":
        query = query.order_by(Product.offer_price.desc(), Product.id.asc())
    else:
        query = query.order_by(Product.id.asc())

    offset = (page - 1) * page_size
    rows = query.offset(offset).limit(page_size).all()

    return ProductSearchResponse(items=[_to_product_out(item) for item in rows], total=total)


@router.get("/admin", dependencies=[Depends(_require_owner)])
def list_products_admin(db: Session = Depends(get_db)) -> ProductSearchResponse:
    rows = db.query(Product).order_by(Product.id.asc()).all()
    return ProductSearchResponse(items=[_to_product_out(item) for item in rows], total=len(rows))


@router.post("/admin/upload-image", dependencies=[Depends(_require_owner)])
async def upload_product_image(file: UploadFile = File(...)) -> dict:
    content_type = file.content_type or ""
    if content_type not in allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image type. Use jpg, png, webp, gif, or avif.",
        )

    data = await file.read()
    max_size_bytes = 5 * 1024 * 1024
    if len(data) > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image too large. Max allowed size is 5MB.",
        )

    extension = allowed_content_types[content_type]
    filename = f"{uuid.uuid4().hex}{extension}"
    file_path = upload_products_dir / filename
    file_path.write_bytes(data)

    return {"image_url": f"/uploads/products/{filename}"}


@router.post("/admin", dependencies=[Depends(_require_owner)])
def create_product(payload: ProductCreateRequest, db: Session = Depends(get_db)) -> ProductOut:
    product = Product(
        name=payload.name.strip(),
        category=payload.category.strip(),
        description=payload.description.strip(),
        price=payload.price,
        offer_price=payload.offer_price,
        image_url=payload.image_url.strip(),
        is_active=payload.is_active,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return _to_product_out(product)


@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)) -> ProductOut:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return _to_product_out(product)


@router.put("/admin/{product_id}", dependencies=[Depends(_require_owner)])
def update_product(
    product_id: int,
    payload: ProductUpdateRequest,
    db: Session = Depends(get_db),
) -> ProductOut:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if payload.name is not None:
        product.name = payload.name.strip()
    if payload.category is not None:
        product.category = payload.category.strip()
    if payload.description is not None:
        product.description = payload.description.strip()
    if payload.price is not None:
        product.price = payload.price
    if payload.offer_price is not None:
        product.offer_price = payload.offer_price
    if payload.image_url is not None:
        product.image_url = payload.image_url.strip()
    if payload.is_active is not None:
        product.is_active = payload.is_active

    db.commit()
    db.refresh(product)
    return _to_product_out(product)
