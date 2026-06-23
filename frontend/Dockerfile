# ── Frontend Dockerfile (multi-stage) ───────────────────────────────────────
# Stage 1 – build the Vite/React app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
# VITE_API_BASE_URL is injected at build time via --build-arg / compose build args
ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build

# ────────────────────────────────────────────────────────────────────────────
# Stage 2 – serve the built files with Nginx
# Nginx listens on port 80 inside the container;
# we map it to 5173 on the host so the existing CORS allow-list in main.py
# (http://localhost:5173) keeps working without touching any backend code.
FROM nginx:stable-alpine

# Remove the default nginx site and copy our own config
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the Vite build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
