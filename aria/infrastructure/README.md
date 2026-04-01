# Infrastructure

This folder contains shared infrastructure configuration for the ARIA system.

## Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Full Docker Compose setup — 7 services: dashboard, gateway, MongoDB, Redis, Ollama, model-puller, ChromaDB |

## Services Overview

| Service | Port | Purpose |
|---------|------|---------|
| `aria-dashboard` | 3000 | Next.js dashboard UI |
| `aria-gateway` | 80, 443 | Reverse proxy gateway |
| `aria-mongo` | 27017 | MongoDB 6.0 (persistent storage) |
| `aria-redis` | 6379 | Redis 7.0 (pub/sub, caching, queues) |
| `aria-ai` | 11434 | Ollama (local LLM, GPU required) |
| `aria-model-puller` | — | Init container, pulls Mistral model |
| `aria-chromadb` | 8000 | ChromaDB vector database |
| `aria-detection` | 5000 | Python ML service (TODO — commented out) |

## Quick Start

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f aria-gateway
docker-compose logs -f aria-dashboard

# Restart after code changes
docker-compose up -d --build aria-gateway aria-dashboard
```

## Development Mode (without Docker)

For development, you can run MongoDB, Redis, Ollama, and ChromaDB in Docker while running the gateway and dashboard locally:

```bash
# Start infrastructure services only
docker-compose up -d mongo redis aria-ai aria-model-puller chromadb

# Run gateway locally
cd ../01-reverse-proxy-gateway && npm install && node index.js

# Run dashboard locally (separate terminal)
cd ../02-dashboard-ui && npm install && npm run dev
```

## Environment Variables

| Variable | Default | Used By |
|----------|---------|---------|
| `MONGODB_URI` | `mongodb://mongo:27017/aria_db` | Dashboard, Gateway, Detection |
| `REDIS_URI` | `redis://redis:6379` | Dashboard, Gateway, Detection |
| `OLLAMA_HOST` | `http://aria-ai:11434` | Dashboard, Gateway, Detection |
| `CHROMADB_HOST` | `http://chromadb:8000` | Dashboard, Gateway, Detection |

## GPU Requirement

The Ollama service requires an NVIDIA GPU for efficient Mistral model inference. If no GPU is available, remove the `deploy.resources` section from `aria-ai` and use CPU mode (slower but functional).
