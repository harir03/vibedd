# 01 — Reverse Proxy Gateway

**Tier:** 0 (Must Ship)  
**Status:** EXISTS — needs adaptation  
**Source:** `maf-app/maf-engine/index.js`

## What This Does

This is the **core traffic interception layer** — a Node.js reverse proxy that sits in front of protected banking applications. Every HTTP request passes through this gateway before reaching the real app.

### Current Flow (from maf-app):
1. Loads application configs from MongoDB (target host, port, defense mode)
2. Creates one HTTP proxy listener per protected app (ports 8000–8100)
3. **GET requests** → fast regex scan for SQLi, XSS, path traversal, command injection
4. **POST/PUT/PATCH/DELETE** → sends request body to Ollama (Mistral LLM) for AI analysis
5. Logs every request + decision to MongoDB
6. Reloads config every 30s + on Redis `maf-config-reload` pub/sub events
7. Defense modes: `Defense` (block threats), `Audited` (log only), `Offline` (reject all)

### Key Files

| File | Purpose |
|------|---------|
| `index.js` | Main engine (~611 lines) — proxy, regex, Ollama analysis, MongoDB logging |
| `package.json` | Dependencies: http-proxy, mongoose, redis, pino, ethers |
| `Dockerfile` | Container build for the engine |
| `mafai-engine-reference.js` | Alternative variant from mafai-app (Express REST API on port 3001 with `POST /evaluate` endpoint instead of reverse proxy — kept for reference) |

### What Needs to Change for ARIA

- [ ] **Remove blockchain/ethers.js code** — not needed for hackathon
- [ ] **Add human approval queue** — instead of auto-blocking, push decisions to a triage queue
- [ ] **Both blocks AND allows need human review** — never fully trust automated decisions
- [ ] **Restructure decision pipeline** to support pluggable detection modules (regex → anomaly → UEBA → LLM → fidelity score)
- [ ] **Add feedback loop endpoint** — analysts mark decisions as correct/incorrect, feeding back into learning
- [ ] **Replace WAF terminology** — "applications" → "protected services", attack types → banking incident types
- [ ] **Add banking-specific regex patterns** — credential stuffing, account enumeration, transaction manipulation
- [ ] **Structured logging for the ingestion pipeline** — emit normalized events for Feature 04

### Dependencies
- `http` / `http-proxy` — reverse proxy core
- `mongoose` — MongoDB connection (app configs + request logs)
- `redis` — pub/sub for config reload
- `pino` — structured JSON logging
- `ethers` — **TO REMOVE** (blockchain audit trail)
