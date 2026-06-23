import threading

import faiss
import numpy as np
from sqlalchemy.orm import Session

from app.models import Product
from app.services.embedding_service import embed_texts


_index_lock = threading.Lock()
_cached_signature = None
_cached_index = None
_cached_products = []


def _to_text(product: Product) -> str:
    return (
        f"{product.name}. Category: {product.category}. "
        f"Description: {product.description}. Price: {float(product.offer_price)}"
    )


def _active_products(session: Session) -> list[Product]:
    return (
        session.query(Product)
        .filter(Product.is_active.is_(True))
        .order_by(Product.id.asc())
        .all()
    )


def _signature(products: list[Product]) -> tuple:
    return tuple(
        (
            product.id,
            product.name,
            product.category,
            product.description,
            float(product.price),
            float(product.offer_price),
            bool(product.is_active),
        )
        for product in products
    )


def _ensure_index(session: Session):
    global _cached_signature, _cached_index, _cached_products

    products = _active_products(session)
    signature = _signature(products)

    with _index_lock:
        if _cached_index is not None and _cached_signature == signature:
            return _cached_index, _cached_products

        if not products:
            _cached_index = None
            _cached_products = []
            _cached_signature = signature
            return None, []

        embeddings = embed_texts([_to_text(product) for product in products])
        vectors = np.array(embeddings, dtype="float32")

        faiss.normalize_L2(vectors)
        index = faiss.IndexFlatIP(vectors.shape[1])
        index.add(vectors)

        _cached_index = index
        _cached_products = products
        _cached_signature = signature

        return _cached_index, _cached_products


def search_vectors(query: str, top_k: int, session: Session):
    index, products = _ensure_index(session)
    if index is None or not products:
        return []

    query_embedding = embed_texts([query])
    query_vector = np.array(query_embedding, dtype="float32")
    faiss.normalize_L2(query_vector)

    limit = max(1, min(top_k, len(products)))
    scores, ids = index.search(query_vector, limit)

    results = []
    for product_idx, score in zip(ids[0], scores[0]):
        if product_idx < 0:
            continue

        product = products[int(product_idx)]
        results.append(
            {
                "id": product.id,
                "name": product.name,
                "category": product.category,
                "description": product.description,
                "price": float(product.price),
                "offer_price": float(product.offer_price),
                "image_url": product.image_url,
                "score": float(score),
            }
        )

    return results
