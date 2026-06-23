import google.generativeai as genai
from app.core.config import settings


def embed_texts(texts: list[str]) -> list[list[float]]:
    genai.configure(api_key=settings.gemini_api_key)
    model = "embedding-001"
    response = genai.embed_content(model=model, content=texts, task_type="retrieval_document")

    if hasattr(response, "embeddings"):
        return [item.values for item in response.embeddings]

    if isinstance(response, dict):
        if "embedding" in response and response["embedding"]:
            first = response["embedding"]
            if isinstance(first, list) and first and isinstance(first[0], (int, float)):
                return [first]
            return first
        if "embeddings" in response and response["embeddings"]:
            return [item.get("values", item) for item in response["embeddings"]]

    return response
