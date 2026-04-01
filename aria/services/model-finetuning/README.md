# 11 — Model Fine-Tuning Worker

**Tier:** 2 (Primary WOW Factor)  
**Status:** IMPLEMENTED  
**Priority:** 2.3

## Overview

A standalone Node.js worker that periodically creates fine-tuned Ollama models using confirmed analyst feedback. This closes the learning loop that makes ARIA's detection improve over time:

```
Analyst Feedback → Training Data → Fine-Tuned Model → Better Detection → Less Analyst Work
```

**Finetunes the Ollama/Mistral model** with confirmed threat data so the LLM gets better at recognizing banking-specific attacks. Instead of using a generic LLM, ARIA creates a **specialized banking security model** (`aria-policeman`) that learns from every incident the analysts confirm.

### Why It Matters
A generic Mistral model knows about security in general, but not about YOUR specific banking environment. After finetuning:
- It knows your API endpoint patterns
- It recognizes your specific attack patterns
- It understands your business context (transactions, accounts, etc.)
- False positive rate drops significantly

## How It Works

1. **Collect** — Queries the `Feedback` collection for analyst-confirmed decisions (approve/reject)
2. **Format** — Converts feedback + alert pairs into Ollama conversation training format
3. **Train** — Calls Ollama `/api/create` to build `aria-policeman` model with enriched system prompt
4. **Validate** — Tests the new model against 10 known-good + 10 known-bad samples
5. **Deploy** — If accuracy > 80%, publishes model name to Redis `aria-config-reload` channel
6. **Audit** — Every attempt (success or failure) is logged in `EvolutionChange` collection

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `MONGO_URI` | `mongodb://localhost:27017/aria_db` | MongoDB connection string |
| `REDIS_URI` | `redis://localhost:6379` | Redis connection string |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama API base URL |
| `BASE_MODEL` | `mistral` | Base model to fine-tune from |
| `FINETUNED_MODEL_NAME` | `aria-policeman` | Name for the fine-tuned model |
| `FINETUNE_INTERVAL_MS` | `86400000` (24h) | Interval between fine-tuning cycles |
| `MIN_TRAINING_SAMPLES` | `20` | Minimum feedback records before fine-tuning |
| `VALIDATION_THRESHOLD` | `0.80` | Minimum accuracy to deploy (0.0–1.0) |
| `MAX_RETRIES` | `3` | Retry count for network operations |
| `LOG_LEVEL` | `info` | Pino log level |

## Prerequisites

- **MongoDB** running with `aria_db` database
- **Redis** running for pub/sub
- **Ollama** running with `mistral` model pulled
- Analyst feedback in the `Feedback` collection (from Feature 17 triage interface)

## Usage

```bash
# Install dependencies
npm install

# Run the worker
node index.js

# Or with Docker
docker build -t aria-model-finetuning .
docker run --env MONGO_URI=mongodb://mongo:27017/aria_db aria-model-finetuning
```

## Data Flow

```
Feedback (MongoDB)
    │
    ▼
collectTrainingData()  ──→  { user: request details, assistant: correct classification }
    │
    ▼
buildSystemPrompt()    ──→  System prompt with embedded analyst-verified examples
    │
    ▼
Ollama /api/create     ──→  aria-policeman model
    │
    ▼
validateModel()        ──→  Test against 20 known samples
    │
    ├── accuracy ≥ 80%  ──→  Redis PUBLISH aria-config-reload  ──→  Gateway reloads model
    │
    └── accuracy < 80%  ──→  Log failure in EvolutionChange, skip deployment
```

## MongoDB Collections Used

| Collection | Access | Purpose |
|-----------|--------|---------|
| `feedbacks` | Read | Analyst decisions (training data source) |
| `alerts` | Read | Original request details for training pairs |
| `evolutionchanges` | Write | Audit trail of all fine-tuning attempts |

### Reference Files Included

| File | From | Why It's Here |
|------|------|---------------|
| `ollama-reference.ts` | `maf-app/src/lib/ollama.ts` | Shows Ollama API integration: pulling models, creating custom models with system prompts, checking model status |
| `actions-reference.ts` | `maf-app/src/app/policy/actions.ts` | Shows `createPolicyModel()` — creates a new Ollama model from a base model + custom system prompt (Modelfile pattern) |

## Integration Points
- **Receives from:** Feature 17 (Human Triage) — confirmed incident data for training
- **Modifies:** Feature 01 (Gateway) — the model used for LLM analysis
- **Orchestrated by:** Feature 10 (Self-Evolving Agent) — decides when to retrain
- **Monitored by:** Feature 14 (Learning Dashboard) — model accuracy over time
- **Validated by:** Feature 10/validation-rollback — test before deploy
