# ── Backend Dockerfile ──────────────────────────────────────────────────────
# Python 3.11 slim keeps the image small while supporting all dependencies.
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required by psycopg (binary), faiss-cpu,
# and netcat (used by the wait-for-db script)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        gcc \
        netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (layer-cache friendly)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application source
COPY . .

# Create the uploads directory so StaticFiles mount never fails on cold start
RUN mkdir -p /app/uploads/products

# Startup script: wait until Postgres is accepting TCP connections, then start uvicorn.
# This is a safety net on top of compose's healthcheck-based depends_on.
RUN printf '#!/bin/sh\n\
set -e\n\
HOST=$(echo "$DATABASE_URL" | sed "s|.*@||" | cut -d: -f1)\n\
PORT=$(echo "$DATABASE_URL" | sed "s|.*@||" | cut -d: -f2 | cut -d/ -f1)\n\
echo "Waiting for database at $HOST:$PORT ..."\n\
until nc -z "$HOST" "$PORT"; do\n\
  echo "  db not ready, retrying in 2s"\n\
  sleep 2\n\
done\n\
echo "Database is up — starting uvicorn"\n\
exec uvicorn app.main:app --host 0.0.0.0 --port 8000\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 8000

CMD ["/app/entrypoint.sh"]
