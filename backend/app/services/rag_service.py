import google.generativeai as genai
import re
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.faiss_index import search_vectors
from app.models import Product
from app.schemas.ai import (
    AiChatRequest,
    AiChatResponse,
    AiSearchRequest,
    AiSearchResponse,
    RecommendationRequest,
)


def rag_search(payload: AiSearchRequest, session: Session) -> AiSearchResponse:
    try:
        results = search_vectors(payload.query, payload.top_k, session)
    except Exception:
        results = []

    if not results:
        results = _local_search(payload.query, session, payload.top_k)

    return AiSearchResponse(items=results)


def _build_context(items: list[dict]) -> str:
    if not items:
        return "No related products were found in the catalog."

    lines = []
    for item in items:
        lines.append(
            f"- {item['name']} ({item['category']}): {item['description']} | "
            f"Offer Price: INR {item['offer_price']}"
        )
    return "\n".join(lines)


def _catalog_items(session: Session) -> list[dict]:
    products = (
        session.query(Product)
        .filter(Product.is_active.is_(True))
        .order_by(Product.id.asc())
        .all()
    )

    return [
        {
            "id": product.id,
            "name": product.name,
            "category": product.category,
            "description": product.description,
            "price": float(product.price),
            "offer_price": float(product.offer_price),
            "image_url": product.image_url,
        }
        for product in products
    ]


def _local_search(query: str, session: Session, limit: int = 5) -> list[dict]:
    query_terms = [term for term in re.findall(r"[a-z0-9]+", query.lower()) if len(term) > 1]
    items = _catalog_items(session)

    scored_items = []
    for item in items:
        haystack = " ".join(
            [item["name"], item["category"], item["description"]]
        ).lower()
        score = sum(1 for term in query_terms if term in haystack)
        if score:
            scored_items.append((score, item))

    scored_items.sort(key=lambda entry: (-entry[0], entry[1]["id"]))
    return [item for _, item in scored_items[:limit]]


def _greeting_reply() -> str:
    return (
        "Hi! I can help you find pens, notebooks, diaries, sticky notes, art supplies, "
        "or gift ideas. Try asking for a product type, category, or budget."
    )

def _gemini_chat_response(message: str, context: str) -> str:
    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = (
        "You are a helpful stationery shopping assistant. "
        "Answer only using the provided product context, and keep answers concise.\n\n"
        f"Product context:\n{context}\n\n"
        f"User question: {message}"
    )
    response = model.generate_content(prompt)
    text = getattr(response, "text", "")
    return text.strip() if text else "I could not generate a response right now."


def rag_chat(payload: AiChatRequest, session: Session) -> AiChatResponse:
    try:
        related = search_vectors(payload.message, 5, session)
    except Exception:
        related = []

    if not related:
        related = _local_search(payload.message, session, 5)

    context = _build_context(related)

    if not related and payload.message.strip().lower() in {"hi", "hello", "hey", "hii", "help"}:
        return AiChatResponse(reply=_greeting_reply(), items=[])

    try:
        reply = _gemini_chat_response(payload.message, context)
    except Exception:
        if related:
            top = related[0]
            reply = (
                f"I found {top['name']} in {top['category']} for INR {top['offer_price']}. "
                f"{top['description']}"
            )
        else:
            reply = _greeting_reply()

    return AiChatResponse(reply=reply, items=related)


def recommend_similar(payload: RecommendationRequest, session: Session):
    results = search_vectors(str(payload.product_id), 6, session)
    return {"items": results}
