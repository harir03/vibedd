# 03 — Middleware SDK Reference

**Tier:** Reference only (not deployed directly)  
**Status:** EXISTS — pattern library  
**Source:** `mafai-package/` (npm middleware SDK)

## What This Is

This is the **mafai npm package** — a framework-agnostic middleware SDK that shows how to integrate WAF analysis into any Node.js app. It's included as a **reference for coding patterns**, not as something we'll deploy. The patterns here are useful for building ARIA's detection pipeline.

### Key Patterns to Reuse

#### 1. Regex Pattern Library (`core/index.ts`)
The `MafaiCore` class contains battle-tested regex patterns for:
- **SQL Injection** — `/(union\s+select|or\s+1\s*=\s*1|drop\s+table|insert\s+into|delete\s+from|update\s+.*set|'--)/i`
- **XSS** — `/<script|javascript:|on\w+\s*=|<iframe|<object|<embed|<form/i`
- **Path Traversal** — `/(\.\.\/)|(\.\.\\)|(%2e%2e%2f)|(%2e%2e\/)/i`
- **Command Injection** — `/[;&|`$]|\b(cat|ls|dir|wget|curl|bash|sh|cmd|powershell)\b/i`

These should be copied to the gateway's regex module as the **baseline** detection patterns before the self-evolving agent starts generating new ones.

#### 2. Hybrid Analysis Flow (`core/index.ts`)
Shows the pattern of: fast local regex scan → if suspicious, send to remote engine for deeper analysis. ARIA's pipeline follows the same idea but extends it to: regex → anomaly detection → UEBA → LLM → fidelity scoring.

#### 3. Adapter Pattern (`adapters/`)
Each adapter converts a framework-specific request/response into a `UnifiedContext` object:
- `express.ts` — Express middleware adapter
- `fastify.ts` — Fastify hook adapter
- `next-api.ts` — Next.js API route adapter

This pattern is useful if ARIA ever needs to provide an SDK for protected apps to embed.

#### 4. Fail-Open Design (`core/index.ts`)
The `processRequest` method wraps all analysis in try/catch and returns `ALLOW` on any error — ensuring the protected app stays available even if analysis fails. ARIA should adopt this for production, but for the hackathon demo, fail-closed (block on error) may be more impressive.

#### 5. Type Definitions (`core/types.ts`)
`MafaiConfig` and `UnifiedContext` interfaces show how to structure configuration and request context objects. Adapt for ARIA's richer context (banking metadata, user session, fidelity score).

### Files

| File | What It Shows |
|------|---------------|
| `core/index.ts` | MafaiCore class: regex patterns, hybrid analysis, fail-open |
| `core/types.ts` | Config + context TypeScript interfaces |
| `adapters/express.ts` | Express middleware wrapper pattern |
| `adapters/fastify.ts` | Fastify hook wrapper pattern |
| `adapters/next-api.ts` | Next.js API route wrapper pattern |
| `index.ts` | Package entry point / re-exports |
| `package.json` | Build config (CJS + ESM + Types triple build) |
| `tsconfig.json` | TypeScript configuration |

### How ARIA Uses These Patterns
1. **Import regex patterns** into the gateway's detection module
2. **Use adapter pattern** if building a lightweight agent SDK
3. **Follow fail-open pattern** for production resilience
4. **Extend UnifiedContext** type for banking-specific fields
