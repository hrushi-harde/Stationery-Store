from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.ai import AiChatRequest, AiChatResponse, AiSearchRequest, AiSearchResponse, RecommendationRequest
from app.services.rag_service import rag_search, rag_chat, recommend_similar

router = APIRouter()

@router.post("/search")
def ai_search(payload: AiSearchRequest, db: Session = Depends(get_db)) -> AiSearchResponse:
    return rag_search(payload, db)

@router.post("/chat")
def ai_chat(payload: AiChatRequest, db: Session = Depends(get_db)) -> AiChatResponse:
    return rag_chat(payload, db)

@router.post("/recommendations")
def recommendations(payload: RecommendationRequest, db: Session = Depends(get_db)):
    return recommend_similar(payload, db)
