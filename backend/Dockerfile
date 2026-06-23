# ── Backend Dockerfile ──────────────────────────────────────────────────────
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps: libpq-dev + gcc for psycopg binary, netcat for the health wait
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        gcc \
        netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Ensure uploads directory exists for StaticFiles mount
RUN mkdir -p /app/uploads/products

# Entrypoint: extract host/port from DATABASE_URL and wait for TCP connectivity
# before starting uvicorn. Works for both local Docker and Render external DB.
RUN printf '#!/bin/sh\n\
set -e\n\
# Strip driver prefix (postgresql+psycopg:// -> postgresql://) for parsing\n\
CLEAN_URL=$(echo "$DATABASE_URL" | sed "s|+[^:]*||")\n\
# Extract host and port from the URL\n\
HOST=$(echo "$CLEAN_URL" | sed "s|.*@||" | cut -d: -f1 | cut -d/ -f1)\n\
PORT=$(echo "$CLEAN_URL" | sed "s|.*@||" | grep ":" | cut -d: -f2 | cut -d/ -f1)\n\
PORT=${PORT:-5432}\n\
echo "Waiting for database at $HOST:$PORT ..."\n\
until nc -z "$HOST" "$PORT" 2>/dev/null; do\n\
  echo "  not reachable yet, retrying in 3s"\n\
  sleep 3\n\
done\n\
echo "Database is reachable — starting uvicorn"\n\
exec uvicorn app.main:app --host 0.0.0.0 --port 8000\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 8000

CMD ["/app/entrypoint.sh"]
