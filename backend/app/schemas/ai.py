from pydantic import BaseModel, ConfigDict, Field
from typing import Any, List

class AiSearchRequest(BaseModel):
    query: str
    top_k: int = 10

class AiSearchResponse(BaseModel):
    items: List[Any]

class AiChatRequest(BaseModel):
    message: str
    session_id: str | None = None

class AiChatResponse(BaseModel):
    reply: str
    items: List[Any] = []

class RecommendationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    product_id: int = Field(alias="productId")
