# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ARIA** (Adaptive Response & Intelligence Agent) is an AI-powered, self-evolving cyber incident response system for banking. Its core innovation is that it writes its own detection rules, rewrites its own LLM prompts, and fine-tunes its own model based on analyst feedback — all with automatic validation and rollback.

## Development Commands

### Root-level (from repo root)
```bash
npm run install:all        # Install all workspace dependencies
npm run dev:dashboard      # Run Next.js dashboard in dev mode
npm run start:gateway      # Start the reverse proxy gateway
npm run docker:up          # Start all infrastructure (MongoDB, Redis, Ollama, ChromaDB)
npm run docker:down        # Stop all infrastructure
```

### Dashboard (`apps/dashboard`)
```bash
npm run dev -w apps/dashboard    # Dev server (uses --webpack flag)
npm run build -w apps/dashboard  # Production build
npm run lint -w apps/dashboard   # ESLint
```

### SDK Middleware (`libs/sdk-middleware`)
```bash
npm run build -w libs/sdk-middleware   # Build all: CJS + ESM + types
```

### Infrastructure
```bash
cd infrastructure && docker-compose up -d     # Start all services
cd infrastructure && docker-compose down      # Stop all services
node infrastructure/comprehensive_seed.js     # Seed MongoDB with demo data
```

## Architecture

### Monorepo Layout
- **`apps/`** — Deployed applications: `dashboard` (Next.js 16) and `gateway` (Node.js reverse proxy)
- **`services/`** — 12 microservices for detection, analysis, and evolution
- **`libs/`** — Shared packages: `sdk-middleware` (publishable NPM package), `references/` (reference implementations)
- **`infrastructure/`** — Docker Compose orchestrating 7 services

### Request Pipeline (Gateway → Services)
```
HTTP Request → Reverse Proxy Gateway (apps/gateway)
  └→ Layer 1: Regex scan (<1ms) — GET requests stop here
  └→ Layer 2: ML anomaly detection (~50ms)
  └→ Layer 3: UEBA behavioral analysis (~100ms)
  └→ Layer 4: LLM via Ollama/Mistral (~500ms)
  └→ Fidelity Ranking (0-100 score)
  └→ Alert Correlation (group into incidents)
  └→ Human Triage Queue (analyst approval)
  └→ Feedback → Self-Evolving Agent
```

The gateway is **fail-open**: if analysis errors, requests are allowed through.

### Self-Evolution Engine (Core Innovation)
The `services/self-evolving-agent` writes/modifies its own:
1. Regex detection patterns (from confirmed attacks)
2. LLM prompts (from false positive/negative feedback)
3. Fidelity score weights (from analyst decisions)
4. Ollama model fine-tuning data
5. New pipeline detector types

Every evolution is validated against a test dataset and auto-rolled back if accuracy drops >10% within 1 hour.

### Infrastructure Services (Docker)
| Service | Port | Purpose |
|---------|------|---------|
| `aria-dashboard` | 3000 | Next.js UI |
| `aria-gateway` | 80, 443, 8001-8100 | Reverse proxy |
| `mongo` | 27017 | Primary database |
| `redis` | 6379 | Pub/sub, queues, caching |
| `aria-ai` (Ollama) | 11434 | Local LLM inference (Mistral 7B) |
| `chromadb` | 8000 | Vector DB for incident embeddings |

### Key Environment Variables
```
MONGODB_URI=mongodb://mongo:27017/aria_db
REDIS_URI=redis://redis:6379
OLLAMA_HOST=http://aria-ai:11434
CHROMADB_HOST=http://chromadb:8000
```

### Dashboard Tech Stack
- **Next.js 16** with App Router, path alias `@/*` → `src/*`
- **React 19**, **Tailwind CSS v4** (uses `@theme` custom properties)
- **Three.js / react-globe.gl** — 3D attack origin globe
- **@xyflow/react** — Attack chain node-edge graphs
- **Recharts** — Analytics charts
- **Auth0** (`@auth0/nextjs-auth0`) — Authentication
- **Framer Motion + GSAP** — Animations

### SDK Middleware (`libs/sdk-middleware`, package name: `mafai`)
A plug-and-play request gatekeeper for Node.js apps. Exports CJS + ESM + TypeScript types. Has peer dependencies on Express and Fastify. Built with three separate `tsconfig` files (`tsconfig.cjs.json`, `tsconfig.esm.json`, `tsconfig.types.json`).

## Human-in-the-Loop Design

Every AI decision (block or allow) enters the analyst triage queue. Feedback outcomes:
- **Block + Approved** → Confirmed threat → reinforce detection
- **Block + Rejected** → False positive → trigger evolution to relax rules
- **Allow + Rejected** → False negative (critical) → trigger evolution to tighten rules

This feedback loop is the engine driving continuous model improvement.
