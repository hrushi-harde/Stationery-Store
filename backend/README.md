# Backend Blueprint (FastAPI + PostgreSQL + FAISS)

This folder is a production-ready blueprint for the stationery store backend. It is intentionally light on runtime dependencies in this repo and focuses on architecture, structure, and integration points for the frontend.

## Key Capabilities
- Product, order, and user management
- RAG-enabled AI search and chatbot
- Recommendation service using vector similarity
- PostgreSQL for metadata, FAISS for vector search

## RAG Flow
1. User query -> embed using Gemini embedding-001
2. FAISS similarity search returns product IDs
3. Fetch product metadata from PostgreSQL
4. Return ranked results to the frontend

## API Endpoints (Draft)
- `POST /api/v1/products/search`
- `GET /api/v1/products/{id}`
- `POST /api/v1/orders`
- `POST /api/v1/auth/login`
- `POST /api/v1/ai/search`
- `POST /api/v1/ai/chat`
- `POST /api/v1/ai/recommendations`

## Local Development (Example)
1. Copy `.env.example` to `.env`
2. Update database and Gemini API keys
3. Start the backend with `run-backend.bat` on Windows, or `powershell -ExecutionPolicy Bypass -File .\run-backend.ps1`
4. The launcher starts Docker Desktop if needed, brings up Postgres, and then runs `uvicorn app.main:app --reload`

This is a blueprint for production integration. See code comments for extension points.
