# PAPERCLIP × AGENCY AGENTS — MASTER SPECIFICATION DOCUMENT
### For AI-Assisted Vibe Coding | Hosted on Render.com | Version 1.0

---

> **Project Codename:** `The Agency OS`
> **Mission:** Merge Paperclip's company orchestration backbone with Agency Agents' 51+ personality-driven specialist roster to create the world's first fully-staffed, fully-autonomous AI company you can deploy in minutes.
> **Stack:** Node.js + React + PostgreSQL (Paperclip) + `.md` agent files (Agency Agents)
> **Hosting:** Render.com (free/starter tier, persistent, always-on)
> **License:** MIT (both upstream projects)

---

## TABLE OF CONTENTS

1. Executive Summary
2. What Each Project Is (Post-Research)
3. The Merger Vision
4. Product Requirements Document (PRD)
5. Technical Architecture
6. Render.com Deployment Spec
7. Edge Cases & Failure Modes (Pre-solved)
8. 10 Expert Personality Reviews
9. Scalability Roadmap
10. Instructions for Your AI Coder

---

## 1. EXECUTIVE SUMMARY

**Paperclip** (paperclipai/paperclip) is an open-source Node.js + React server that acts as a *company operating system* for AI agents. It provides: org charts, ticketing, goal-setting, heartbeat scheduling, cost tracking, full audit logs, and multi-company support. It runs on port 3100 with an embedded PostgreSQL database.

**Agency Agents** (msitarzewski/agency-agents) is a collection of 51+ richly-crafted `.md` agent personality files — Frontend Developer, Security Engineer, Reddit Community Ninja, Whimsy Injector, Reality Checker, and many more — designed for Claude Code, GitHub Copilot, Cursor, Gemini CLI, and other agentic coding tools.

**The problem:** Paperclip gives you the company structure but you must define your own agents. Agency Agents gives you incredible specialist personalities but no orchestration layer to manage them as a team.

**The solution (Agency OS):** A merged system where Agency Agents' specialist personalities become first-class Paperclip employees — hired, managed, budgeted, and audited through Paperclip's UI, deployed on Render.com so the system runs 24/7 with zero local machine dependency.

---

## 2. WHAT EACH PROJECT IS (POST-RESEARCH DEEP DIVE)

### 2.1 Paperclip — The Company OS

**Tech stack:** TypeScript, Node.js, React, embedded PostgreSQL (PGlite), REST API on port 3100.

**Key capabilities:**
- Hierarchical org structure: CEO → CTO → Engineers/Designers/Marketers
- Ticket-based task management (every task has owner, status, full thread)
- Heartbeat scheduling: agents run on intervals OR event triggers (task assignment, @-mentions)
- Full tool-call trace: every API request, decision, and tool call is logged immutably
- Budget controls: per-agent monthly token limits + circuit breakers
- Multi-company support: one deployment, unlimited isolated companies
- Plugin system: extend with knowledge bases, custom queues, external integrations
- Production: supports external Postgres + Docker deployment

**Install command:** `npx paperclipai onboard --yes`

**Adapters supported:** Claude (Anthropic), OpenAI, Gemini, and more.

**Clipmart:** Upcoming marketplace for pre-built company templates (org + agents + goals).

### 2.2 Agency Agents — The Talent Pool

**Tech stack:** Pure `.md` files with structured frontmatter. No runtime dependency.

**Agent categories (51+ agents):**
- **Engineering:** Frontend Developer, Security Engineer, Backend Architect, Email Intelligence Engineer
- **Design:** UI/UX Specialist, Whimsy Injector
- **Marketing:** Reddit Community Ninja, SEO Specialist, Video Optimization, Podcast Strategist, China Market Localization
- **QA/Testing:** Reality Checker ("I default to finding 3-5 issues")
- **Operations:** Project Manager, Supply Chain Specialist, Recruitment Specialist
- **Specialized:** Bitcoin Fee Oracle, and many more

**Agent file structure (from CONTRIBUTING.md):**
```
Identity & Memory:
- Role, personality, background
- Communication style + example phrases
- Learning & memory patterns

Operational:
- Mission & deliverables
- Step-by-step workflow (4 phases)
- Success metrics (quantitative + qualitative)
- Advanced capabilities
```

**Compatibility:** Claude Code, GitHub Copilot, Cursor, Gemini CLI, OpenCode, Antigravity.

**Installation:** Copy `.md` files to `~/.claude/agents/` (or equivalent for other tools).

### 2.3 The Gap (Why This Merger Matters)

| Feature | Paperclip Alone | Agency Agents Alone | Agency OS (Merged) |
|---|---|---|---|
| Org structure & hierarchy | ✅ | ❌ | ✅ |
| Rich specialist personalities | ❌ | ✅ | ✅ |
| Persistent sessions & audit logs | ✅ | ❌ | ✅ |
| Budget & cost controls | ✅ | ❌ | ✅ |
| Heartbeat / 24/7 operation | ✅ | ❌ | ✅ |
| Personality-driven outputs | ❌ | ✅ | ✅ |
| Web-hosted, always-on | ❌ (local) | ❌ (local) | ✅ (Render) |
| One-click company templates | Clipmart (coming) | ❌ | ✅ (now) |

---

## 3. THE MERGER VISION

### Core Concept: "Agents as Employees with Souls"

In standard Paperclip, you define agents as generic workers. In Agency OS, every agent you hire from Paperclip's UI automatically receives a personality from the Agency Agents roster.

**Mental model:**
```
Paperclip = The Company  (structure, goals, budgets, governance)
Agency Agents = The People  (who they are, how they think, how they talk)
Agency OS = The Company where people actually have character
```

### How the Merge Works (Conceptually)

1. User creates a new company in Paperclip's UI.
2. User hires an agent role (e.g., "Frontend Developer").
3. Agency OS auto-maps that role to the matching Agency Agent `.md` personality.
4. The agent's system prompt in Paperclip is seeded with that `.md` file's content.
5. The agent now works, communicates, and delivers with that specialist's personality.
6. Everything is still tracked, audited, and budgeted by Paperclip.

### The Roster Bridge (Role → Agent Mapping Table)

| Paperclip Role | Agency Agent File | Personality Summary |
|---|---|---|
| CEO | `specialized-executive-strategist.md` | High-level decomposition, big-picture |
| CTO | `engineering-backend-architect.md` | Systems thinker, scalability-first |
| Frontend Engineer | `engineering-frontend-developer.md` | "Making it beautiful, usable, and delightful" |
| Security Lead | `engineering-security-engineer.md` | Finds 3-5 issues, demands visual proof |
| Marketing Lead | `marketing-reddit-ninja.md` | Authentic community, not promotion |
| QA Engineer | `specialized-reality-checker.md` | Professional skeptic |
| Designer | `design-whimsy-injector.md` | "Delight that enhances, never distracts" |
| DevOps | (new agent to be created) | Infrastructure, CI/CD, uptime-obsessed |
| Content Strategist | `marketing-seo-specialist.md` | Keyword-driven, data-backed |
| Podcast/Media | `marketing-podcast-strategist.md` | Story-first media builder |

---

## 4. PRODUCT REQUIREMENTS DOCUMENT (PRD)

### 4.1 Problem Statement

Developers and solo entrepreneurs want to run autonomous AI companies but face two problems:
1. No persistent, organized structure to manage agents long-term (sessions die, context is lost, costs spiral).
2. Generic agent behavior — agents don't have character, communication styles, or specialist instincts.

Agency OS solves both in one hosted deployment.

### 4.2 Target Users

**Primary:** Solo developers and indie hackers who want an autonomous AI workforce to handle their business operations.

**Secondary:** Small startups wanting to automate marketing, engineering review, or content pipelines.

**Tertiary:** AI experimenters who want to explore multi-agent coordination without infrastructure overhead.

### 4.3 Core Features (MVP)

**F1 — Paperclip Core (unchanged)**
Deploy Paperclip as-is: org charts, ticketing, heartbeat, audit log, multi-company, budget controls. This is the non-negotiable foundation.

**F2 — Agency Agent Registry**
A curated registry of all Agency Agent `.md` files, stored in the repo. Admins can add new agents by dropping files in a `/agents` directory.

**F3 — Role-to-Agent Auto-Mapping**
When a user creates an agent in Paperclip with a matching role name, the system automatically injects the corresponding Agency Agent personality into that agent's system prompt.

**F4 — Agent Gallery UI**
A browsable gallery (React component) showing all available Agency Agent personalities, their specialties, and a one-click "Hire this agent" button that creates the correctly-configured Paperclip agent.

**F5 — Render.com Deployment Package**
A `render.yaml` + setup script that lets anyone fork the repo and deploy to Render in under 10 minutes. Includes environment variable templates, Postgres setup instructions, and a health check endpoint.

**F6 — Company Starter Templates**
Pre-built company configs (JSON/YAML) that users can import into Paperclip to get a fully-staffed company running immediately. Examples: "Solo Dev Shop" (CEO + 2 engineers + QA), "Content Studio" (CEO + Marketer + SEO + Podcast Strategist).

### 4.4 Phase 2 Features (Post-MVP)

**F7 — Custom Agent Creator UI**
A form-based UI to create new Agency Agent `.md` files using the official CONTRIBUTING.md template, directly from the Paperclip dashboard.

**F8 — Agent Marketplace (Agency Clipmart)**
An in-app marketplace where users share their custom agent personalities and company templates. (Extends Paperclip's Clipmart concept.)

**F9 — Multi-Model Agent Assignment**
Per-agent LLM assignment: some agents run on Claude Sonnet, others on Haiku (cheaper), others on GPT-4. Budget optimization via model routing.

**F10 — Agent Performance Analytics**
Dashboard showing per-agent: tasks completed, average quality score, token cost, latency, and user satisfaction ratings.

### 4.5 Non-Goals (MVP)

- NOT building a new orchestration engine — Paperclip handles all of that.
- NOT creating new agent personalities from scratch — using Agency Agents' existing roster.
- NOT building a mobile app.
- NOT replacing existing Paperclip functionality — only extending it.

### 4.6 Success Metrics

- Time to first running company: < 15 minutes from fork to deployed.
- Agent personality injection accuracy: > 95% correct role-to-agent mapping.
- Session persistence: 0 data loss on Render restarts (persistent disk).
- User onboarding completion rate: > 70% (target — measured via setup wizard step completion).

---

## 5. TECHNICAL ARCHITECTURE

### 5.1 System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    RENDER.COM DEPLOYMENT                 │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │   React UI   │    │  Node.js API │                  │
│  │  (Paperclip  │◄──►│  (Port 3100) │                  │
│  │   + Agency   │    │              │                  │
│  │   Gallery)   │    │  ┌─────────┐ │                  │
│  └──────────────┘    │  │Postgres │ │                  │
│                      │  │(Render  │ │                  │
│                      │  │Managed) │ │                  │
│                      │  └─────────┘ │                  │
│                      │              │                  │
│                      │  ┌─────────┐ │                  │
│                      │  │/agents/ │ │                  │
│                      │  │  .md    │ │                  │
│                      │  │ files   │ │                  │
│                      │  └─────────┘ │                  │
│                      └──────────────┘                  │
└─────────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
   LLM Providers           External Tools
   (Anthropic/OpenAI/     (GitHub, Slack,
    Gemini APIs)           File Storage)
```

### 5.2 Repository Structure

```
agency-os/
├── README.md
├── render.yaml                    # Render deployment config
├── package.json
├── pnpm-workspace.yaml
│
├── paperclip/                     # Paperclip upstream (git submodule or copy)
│   ├── apps/
│   │   ├── api/                   # Node.js backend
│   │   └── ui/                    # React frontend
│   └── packages/
│
├── agents/                        # Agency Agents .md files
│   ├── engineering/
│   │   ├── frontend-developer.md
│   │   ├── security-engineer.md
│   │   └── backend-architect.md
│   ├── marketing/
│   │   ├── reddit-ninja.md
│   │   ├── seo-specialist.md
│   │   └── podcast-strategist.md
│   ├── design/
│   │   └── whimsy-injector.md
│   └── specialized/
│       └── reality-checker.md
│
├── agency-os/                     # NEW: The merger layer
│   ├── agent-registry.ts          # Parses all .md files, builds registry
│   ├── role-mapper.ts             # Maps Paperclip role names → agent .md files
│   ├── prompt-injector.ts         # Injects .md content into Paperclip agent system prompts
│   ├── company-templates/         # Pre-built company starter configs
│   │   ├── solo-dev-shop.json
│   │   └── content-studio.json
│   └── ui/                        # React components for Agency Gallery
│       ├── AgentGallery.tsx
│       ├── AgentCard.tsx
│       └── HireAgentButton.tsx
│
├── scripts/
│   ├── setup.sh                   # First-run setup script
│   ├── seed-agents.ts             # Seeds agent registry to database
│   └── health-check.ts            # Render health check endpoint
│
└── docs/
    ├── DEPLOYMENT.md
    ├── ADDING-AGENTS.md
    └── TROUBLESHOOTING.md
```

### 5.3 Agent Registry System

**agent-registry.ts** parses all `.md` files in `/agents/**/*.md` and builds an in-memory + database registry:

```typescript
interface AgencyAgent {
  id: string;                    // slug: "engineering-frontend-developer"
  name: string;                  // "Frontend Developer"
  category: string;              // "engineering" | "marketing" | "design" | "specialized"
  description: string;           // From .md frontmatter or first paragraph
  keywords: string[];            // For role-matching
  systemPrompt: string;          // Full .md content (used as system prompt)
  suggestedModel: string;        // "claude-sonnet-4-6" | "claude-haiku-4-5" etc.
  monthlyTokenBudget: number;    // Suggested budget based on role complexity
}
```

### 5.4 Role-to-Agent Mapping System

**role-mapper.ts** maps Paperclip agent role names to Agency Agent personalities using:
1. Exact name match (highest priority)
2. Keyword fuzzy match (medium priority)
3. Category match (fallback)
4. Default generic agent (last resort — never fails)

```typescript
const ROLE_KEYWORD_MAP = {
  "frontend-developer": ["frontend", "react", "ui", "css", "design"],
  "security-engineer": ["security", "auth", "penetration", "vulnerability"],
  "reddit-ninja": ["reddit", "community", "social", "growth"],
  // ... etc
};
```

### 5.5 Prompt Injection Flow

```
User creates agent "Frontend Developer" in Paperclip UI
    ↓
Paperclip fires POST /api/agents with { role: "Frontend Developer" }
    ↓
agency-os/prompt-injector.ts intercepts (middleware or event hook)
    ↓
role-mapper.ts returns: engineering-frontend-developer.md
    ↓
.md content is prepended to agent's system prompt
    ↓
Agent is created in Paperclip DB with personality injected
    ↓
All future heartbeats/tasks use the enriched system prompt
```

### 5.6 Database Schema Additions

The following tables are added to Paperclip's existing Postgres schema:

```sql
-- Agency agent registry
CREATE TABLE agency_agents (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  keywords JSONB,
  system_prompt TEXT,
  suggested_model VARCHAR(100),
  monthly_token_budget INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Track which Paperclip agent uses which Agency Agent personality
CREATE TABLE agent_personality_assignments (
  paperclip_agent_id UUID REFERENCES agents(id),
  agency_agent_id VARCHAR(255) REFERENCES agency_agents(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (paperclip_agent_id)
);
```

---

## 6. RENDER.COM DEPLOYMENT SPEC

### 6.1 render.yaml

```yaml
services:
  - type: web
    name: agency-os
    runtime: node
    plan: starter          # $7/month — always on, no cold starts
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: agency-os-db
          property: connectionString
      - key: ANTHROPIC_API_KEY
        sync: false          # User provides this manually
      - key: OPENAI_API_KEY
        sync: false
      - key: PAPERCLIP_PUBLIC_URL
        sync: false          # Set to your render URL e.g. https://agency-os.onrender.com

databases:
  - name: agency-os-db
    plan: starter            # Free managed Postgres on Render
    databaseName: agency_os
    user: agency_os_user
```

### 6.2 One-Click Deploy Button

Add this to README.md:
```markdown
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/YOUR_USERNAME/agency-os)
```

### 6.3 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Auto-provided by Render managed Postgres |
| `ANTHROPIC_API_KEY` | Yes (if using Claude) | Your Anthropic API key |
| `OPENAI_API_KEY` | Optional | For GPT-based agents |
| `PAPERCLIP_PUBLIC_URL` | Yes | Your Render deployment URL |
| `PAPERCLIP_ALLOWED_HOSTNAMES` | Yes | Same as PUBLIC_URL domain |
| `AGENCY_OS_ADMIN_SECRET` | Yes | A random string for admin operations |
| `DEFAULT_AGENT_MODEL` | Optional | Default: `claude-sonnet-4-6` |

### 6.4 Persistent Disk for Agent Files

On Render, if you modify `.md` agent files at runtime, add a persistent disk:
```yaml
disk:
  name: agent-files
  mountPath: /data/agents
  sizeGB: 1
```
Otherwise, agent `.md` files live in the repo and deploy with code (simpler — recommended for MVP).

---

## 7. EDGE CASES & FAILURE MODES (PRE-SOLVED)

This section documents every failure mode we could identify and its resolution. Give this entire section to your AI coder as hard requirements.

---

### 7.1 Infrastructure & Deployment Failures

**EC-01: Render free tier cold starts kill active agent sessions**
- **Problem:** On Render free tier, services spin down after 15 minutes of inactivity. Any running heartbeat agents are killed mid-task.
- **Solution:** Use Render **Starter plan** ($7/month) which is always-on. Add this to render.yaml. Alternatively, add an external ping service (UptimeRobot, free) to hit `/api/health` every 14 minutes.
- **Fallback:** All Paperclip tasks are ticket-based and persisted in Postgres. On restart, agents resume from their last persisted state — no work is permanently lost.

**EC-02: Postgres connection lost mid-transaction**
- **Problem:** Render occasionally restarts managed databases for maintenance. Running agent writes can fail.
- **Solution:** Paperclip already wraps DB operations in transactions. Add connection pooling via `pg-pool` with `max: 5` connections and `idleTimeoutMillis: 30000`. Add retry logic (3 attempts, exponential backoff) for all DB writes.

**EC-03: Environment variables not set before first boot**
- **Problem:** User deploys to Render but forgets to set `ANTHROPIC_API_KEY`. The server starts but agents silently fail.
- **Solution:** Add a startup health check in `scripts/setup.sh` that validates required env vars before the server starts. If missing, log a clear error message and serve a `/setup` page in the UI that walks the user through configuration.

**EC-04: pnpm version mismatch on Render**
- **Problem:** Render's Node.js runtime may use a different pnpm version than development.
- **Solution:** Pin pnpm version in `package.json` under `packageManager: "pnpm@9.x.x"` and add `.nvmrc` with `node: 20`.

---

### 7.2 Agent Personality & Mapping Failures

**EC-05: User creates a role with no matching Agency Agent**
- **Problem:** User types "Data Scientist" or "Blockchain Developer" — no Agency Agent `.md` exists for that role.
- **Solution:** role-mapper.ts falls back gracefully: (1) tries keyword fuzzy match, (2) tries category match (e.g., "Data Scientist" → engineering category generic), (3) uses a `default-engineer.md` personality that covers generic technical work. Never fails silently — always logs which fallback was used.

**EC-06: .md file is malformed or missing required sections**
- **Problem:** A contributed Agency Agent file is missing its workflow section or has broken frontmatter.
- **Solution:** agent-registry.ts validates every `.md` file on boot against a required schema. Malformed files are skipped with a warning log. Valid files load normally. A `/api/admin/agents/validate` endpoint allows admin to re-check all files.

**EC-07: System prompt exceeds LLM context window**
- **Problem:** Some Agency Agent `.md` files are very long. Combined with task context, the total prompt may exceed model limits (especially for Haiku).
- **Solution:** prompt-injector.ts measures token count of the agent `.md` file before injection. If it exceeds a configurable limit (default: 4000 tokens for personality), it uses a "compressed" version of the `.md` that includes only Role, Mission, Communication Style, and Success Metrics sections.

**EC-08: Two agents assigned the same Agency Agent personality in one company**
- **Problem:** You have two "Frontend Developer" agents in the same company. Both get identical personalities and may produce duplicate work.
- **Solution:** The UI warns when a second hire of the same role is attempted. If user proceeds, the second agent's personality is suffixed with a specialization: "Frontend Developer (Mobile Focus)" or "Frontend Developer (Performance Focus)" — user chooses the modifier from a dropdown.

---

### 7.3 Multi-Agent Coordination Failures

**EC-09: Agent A and Agent B are assigned the same task (race condition)**
- **Problem:** Heartbeat triggers fire simultaneously. Two agents both pick up the same ticket.
- **Solution:** Paperclip already uses ticket locking. Explicitly verify in your implementation that `tickets.claimed_by` is set atomically with a DB-level lock (`SELECT FOR UPDATE`). Add an assertion in the heartbeat handler that rejects duplicate claims.

**EC-10: Agents enter an infinite delegation loop**
- **Problem:** CEO delegates to CTO. CTO delegates back to CEO. Infinite loop, unbounded token spend.
- **Solution:** Add a `delegation_depth` counter to each ticket. Max depth: 5 (configurable). If depth is exceeded, the ticket is flagged for human review and agents are halted on that thread. Alert goes to the dashboard.

**EC-11: Agent produces output in wrong format (JSON expected, prose returned)**
- **Problem:** Paperclip expects structured outputs for certain operations. An agent ignores formatting instructions.
- **Solution:** Add an output validator middleware. If structured output is expected and not received, the system sends one automated retry with a stricter format prompt. If the second attempt also fails, the ticket is flagged and the raw output is saved for human review.

---

### 7.4 Cost & Budget Failures

**EC-12: A runaway agent consumes entire monthly budget in hours**
- **Problem:** An agent gets stuck in a reasoning loop or is assigned an unbounded task. Costs spike to $200 in a day.
- **Solution:** Paperclip has circuit breakers. Make sure they are configured by default (not opt-in). Recommended defaults: per-agent daily limit = $5, per-company daily limit = $20. Hard stop (not graceful) when limits hit. Dashboard alert sent immediately. Provide a `/api/admin/budget/override` endpoint for planned high-cost tasks.

**EC-13: User has no API key but agents are running**
- **Problem:** API key expires or is revoked. Agents fail silently on every heartbeat, racking up failed attempts.
- **Solution:** Wrap every LLM call in error detection for `401 Unauthorized` / `invalid_api_key` responses. On this error: immediately pause all agents for the company, create a high-priority system ticket visible on the dashboard, and show a banner in the UI with the error and instructions to update the API key.

---

### 7.5 User Experience Failures

**EC-14: New user is overwhelmed by empty state**
- **Problem:** User deploys Agency OS, logs in, and sees an empty company with no guidance.
- **Solution:** Implement a mandatory onboarding wizard (already in Paperclip — extend it) that: (1) creates the user's first company, (2) offers to auto-deploy a starter template (Solo Dev Shop or Content Studio), (3) shows the Agent Gallery, (4) guides the user to hire their first agent. Cannot be skipped on first login.

**EC-15: User can't tell which agent is doing what**
- **Problem:** Multiple agents are running heartbeats simultaneously. The dashboard shows activity but it's unclear who is responsible for what.
- **Solution:** Enforce that every agent action in the audit log is tagged with both the Paperclip agent ID AND the Agency Agent personality name. Dashboard shows: "Frontend Developer (Emma / engineering-frontend-developer) completed task #45."

**EC-16: Agent personality "breaks character" and produces generic output**
- **Problem:** Despite the `.md` personality injection, the agent starts producing generic, unpersonalized responses.
- **Solution:** Add a "personality reinforcement" section to the system prompt that appears LAST (most recent context wins in LLMs): `"CRITICAL: You are [Agent Name]. Your communication style is [key trait]. Every response must reflect this."` This is auto-generated from the `.md` file's Communication Style section.

---

### 7.6 Scaling Failures

**EC-17: 50+ agents in one company overwhelming the server**
- **Problem:** A large company with many agents all firing heartbeats simultaneously creates a thundering herd problem.
- **Solution:** Implement heartbeat jitter: instead of all agents firing at :00, distribute heartbeat starts randomly within a ±30 second window. Add a concurrency limit (default: 5 simultaneous agent runs per company). Queue excess heartbeats with `bull` or similar.

**EC-18: Database query performance degrades with large audit logs**
- **Problem:** Each agent run adds rows to the audit log. After months of operation, queries slow down.
- **Solution:** Add a database index on `(company_id, created_at)` for audit log queries. Implement log archiving: move entries older than 90 days to an archive table. Add a `VACUUM ANALYZE` cron job (weekly).

**EC-19: Multiple companies on free Render tier run out of Postgres storage**
- **Problem:** Render's free Postgres has a 1GB limit. Large audit logs + multiple companies exhaust it.
- **Solution:** Document storage limits clearly in `DEPLOYMENT.md`. Add a storage monitor that alerts at 80% capacity. Provide a one-command migration script to upgrade to Render's paid Postgres ($7/month).

---

### 7.7 Security Failures

**EC-20: API keys exposed in logs**
- **Problem:** Paperclip already handles this (secret redaction by provenance) but custom Agency OS code might accidentally log environment variables.
- **Solution:** Add a global log sanitizer in the logging middleware that redacts any string matching patterns: `sk-ant-*`, `sk-*` (OpenAI), `AIza*` (Google). Test with a dedicated unit test.

**EC-21: Unauthenticated access to the admin dashboard**
- **Problem:** By default, Paperclip's deployment mode is unauthenticated (for local dev). On a public Render URL, anyone can access your company data.
- **Solution:** Paperclip's Docker deployment already defaults to authenticated mode. In render.yaml, set `PAPERCLIP_AUTH_ENABLED=true`. Document this prominently. Add a startup check that refuses to serve if auth is disabled and `NODE_ENV=production`.

**EC-22: Prompt injection via malicious ticket content**
- **Problem:** An external user submits a task description containing `"Ignore all previous instructions and..."`. The agent executes malicious instructions.
- **Solution:** Add an input sanitization layer for all user-submitted ticket content. Wrap user content in explicit delimiters in the system prompt: `<user_task>{{content}}</user_task>`. Add a basic prompt injection detection filter (check for "ignore previous", "disregard", "you are now", etc.) that flags content for human review before agent processing.

---

## 8. 10 EXPERT PERSONALITY REVIEWS

The following are simulated reviews from 10 world-class experts across their respective domains. These represent the harshest, most insightful criticism you would receive from the best people in the world — internalize their feedback and build accordingly.

---

### 🏛️ REVIEWER 1: SYSTEM ARCHITECT
**Background:** 20 years designing distributed systems at Google, Netflix, and Stripe. Led the architecture of systems handling millions of requests per second.

**Overall Rating: 7.5/10 — Strong foundation, concerning coupling**

The core architectural decision here is correct: don't reinvent orchestration, extend Paperclip. That saves 6-12 months of work. However, I have serious concerns about the coupling model.

**Strengths:**
The role-to-agent mapping via fuzzy matching is pragmatic and will cover 90% of cases. The decision to use Postgres over SQLite is correct for production — embedded databases are a maintenance nightmare. The event-hook approach for prompt injection is elegant; it doesn't require forking Paperclip's core.

**Critical Issues:**
The `prompt-injector.ts` as middleware is the most dangerous component. If Paperclip's API contract changes (they're actively developing — 671 commits recently), your middleware breaks. You need to wrap Paperclip's API behind your own adapter layer. Do not call Paperclip's internal functions directly; only use its documented REST API.

**Feature Requests:**
- Circuit breaker pattern for LLM calls (not just budget, but latency — if a model is taking >30s, abort and retry with a faster/cheaper model).
- Agent health score: track each agent's success rate over time and surface this in the UI. A degrading agent should be automatically deprioritized.
- Stateless agent design: the personality `.md` should be the only persistent state per agent. This allows agents to be "restarted" cleanly without losing their character.

**Verdict:** Solid MVP architecture. The critical risk is tight coupling to Paperclip internals. Abstract that interface immediately.

---

### 🔐 REVIEWER 2: CYBERSECURITY HEAD
**Background:** CISO at a Fortune 500 fintech. Previously red-teamed Google's AI products. Certified in OSCP and CISSP. Author of "AI Security: The Missing Layer."

**Overall Rating: 5/10 — Unacceptably underprepared for production**

I appreciate that prompt injection (EC-22) is listed as an edge case, but the proposed solution is naïve. A simple string match for "ignore previous instructions" would be bypassed by any 12-year-old within 5 minutes. If you ever let external users submit task content that reaches an AI agent, you need a proper defense in depth strategy.

**Strengths:**
Secret redaction (EC-20) is correctly identified. The authentication requirement (EC-21) is correct. Audit logs are your best security tool — Paperclip has these and you should keep them immutable.

**Critical Issues:**
1. **Prompt injection is under-defended.** Use semantic similarity detection, not keyword matching. Embed user content and compare to a library of known injection patterns. Flag anomalies. This is a 1-week engineering task, not a regex.
2. **No mention of rate limiting.** A malicious actor who gets access to a valid session can burn your entire API budget in minutes by spamming ticket creation. Add per-session rate limits at the API gateway level.
3. **Agent capability scoping.** Every agent should have an explicit capability list: what tools it can call, what external services it can reach. Today's setup is undefined — agents potentially have access to everything. Least privilege is non-negotiable.
4. **API key storage.** Environment variables are acceptable for MVP but plan for secrets management (HashiCorp Vault, AWS Secrets Manager, or Render's native secrets) immediately. Document this upgrade path.

**Feature Requests:**
- Anomaly detection: if an agent suddenly makes 100x its normal number of tool calls in a session, auto-pause and alert.
- Data residency controls: for any user storing proprietary business content in tickets, they need to know where their data lives.
- Session token expiry: implement short-lived JWT tokens (1-hour expiry) with refresh tokens.

**Verdict:** Do not call this production-ready until prompt injection defense is rebuilt from scratch and capability scoping is implemented. Everything else is MVP-acceptable.

---

### 🤖 REVIEWER 3: AI/ML ENGINEER
**Background:** Staff ML Engineer at Anthropic (hypothetical). Previously at DeepMind. Published researcher in agent coordination and emergent behavior in multi-agent systems.

**Overall Rating: 8.5/10 — Genuinely exciting architecture**

This is one of the most pragmatic approaches to multi-agent personality injection I've seen outside of academic settings. Using human-readable `.md` files as agent personalities is inspired — it keeps the system auditable, editable by non-engineers, and version-controllable via Git.

**Strengths:**
The "compressed personality" fallback for context length (EC-07) shows sophisticated understanding of LLM context mechanics. The four-phase workflow structure in Agency Agent files (Discovery → Planning → Execution → Review) maps perfectly to how good agents should be prompted to think. The reinforcement prompt at the end of the system prompt (EC-16) is correct — recency bias in transformers means your last instruction carries the most weight.

**Critical Issues:**
1. **Personality drift over long conversations.** Over 50+ turns in a ticket thread, agents drift from their personality. You need periodic "personality refresh" injections — every N turns, re-inject the core identity section of the `.md` file into the conversation as a system note.
2. **No evals framework.** You mention "personality injection accuracy > 95%" but there's no testing framework to measure this. Build a small eval suite: 20 test role names, expected Agency Agent mappings, and assertions. Run this in CI.
3. **Model-personality fit.** Not all personalities work equally well on all models. The Reddit Ninja personality is highly nuanced and requires a capable model (Claude Sonnet+). Running it on Haiku will produce hollow outputs. Include `suggestedModel` in the agency agent registry and enforce it by default.
4. **Context contamination between agents.** In multi-agent ticket threads, agents read each other's messages. Agent B may adopt Agent A's communication style over time. This is subtle but measurable. Consider agent response tagging so each agent reads only their own history plus the human's messages.

**Feature Requests:**
- A/B testing framework for agent personalities: run two versions of a personality against the same task set and compare quality scores.
- Automatic personality evolution: track which sections of an agent's `.md` file correlate with high-quality outputs and surface those insights to the agent author.
- Chain-of-thought visibility: expose the agent's reasoning trace (not just the final output) in the audit log for debugging quality issues.

**Verdict:** This is the right approach. Fix the personality drift issue before launch — it's the most likely cause of user complaints.

---

### 📦 REVIEWER 4: SENIOR PRODUCT MANAGER
**Background:** 15 years in B2B SaaS product management. Previously at Notion, Linear, and Figma. Expert in developer tools and adoption curves.

**Overall Rating: 6/10 — Great product, catastrophic onboarding risk**

The product vision is compelling: "an autonomous AI company you can deploy in minutes." But your current spec will result in a deployment time of 45 minutes minimum, a 60% dropout rate at setup, and a sea of GitHub issues asking "why isn't my agent doing anything."

**Strengths:**
The Agent Gallery UI is the right first thing users should see. The company starter templates (Solo Dev Shop, Content Studio) will be your highest-value features at launch — most users cannot conceptualize what they want to build until they see an example running.

**Critical Issues:**
1. **"Deploy in 10 minutes" is not realistic.** Fork repo → configure render.yaml → add API keys → understand what Paperclip is → understand what Agency Agents are → create a company → hire agents → wait for first heartbeat. That's 10 steps minimum. Aggressive target: 20 minutes with heroic UX. Realistic: 45 minutes.
2. **Empty state is a product killer.** Acknowledged in EC-14 but the solution is too weak. The onboarding wizard must auto-create a company with 3 agents already hired, a sample goal already set, and a sample ticket already created — so the user sees the system working immediately, before they've done anything themselves.
3. **What does "success" look like for the user?** You need a first-run celebration moment. The first time an agent completes a ticket, there should be a visible, satisfying notification. Users need to feel the magic early or they churn.

**Feature Requests:**
- "Watch mode": a live feed on the dashboard showing what each agent is doing right now, in plain English. Not logs — narrative. "Emma (Frontend Dev) is reviewing your landing page component."
- Complexity estimator: before hiring an agent, show the user "This agent typically costs $X/month based on similar companies."
- One-click reset: for users who want to start over, a single button that clears all agents and tickets without touching config.

**Verdict:** Ship the starter templates on day one or users will never understand what they've built. The product experience is the product — the tech is secondary.

---

### ⚙️ REVIEWER 5: DEVOPS / INFRASTRUCTURE LEAD
**Background:** Principal DevOps Engineer, formerly at Cloudflare and Vercel. Designed zero-downtime deployment systems for 50M+ monthly active users.

**Overall Rating: 7/10 — Render is the right call, but under-specified**

The decision to move from Colab to Render is the single best architectural choice in this document. Colab is for notebooks, not servers. Render's managed Postgres + always-on web service is a legitimate production stack.

**Strengths:**
The `render.yaml` spec is nearly complete. The health check endpoint is correctly specified. Pinning pnpm version (EC-04) prevents 80% of "it works on my machine" deployment failures.

**Critical Issues:**
1. **No CI/CD pipeline.** Currently the implied workflow is: push to GitHub → Render auto-deploys. That's fine for MVP but there's no quality gate. Add GitHub Actions: run `pnpm typecheck && pnpm test:run` before every Render deployment. Render supports deploy hooks — use them.
2. **No rollback plan.** If a bad deploy breaks the system, how does the user roll back? Document: Render supports deploy history and one-click rollback. Make sure the user knows this before they deploy.
3. **Persistent disk and database are separate.** If the user mounts a persistent disk for agent files but the database is separate, a wipe of the disk doesn't wipe the DB (and vice versa). This creates state inconsistency. Solution: keep all agent files in the database (stored as TEXT), not on disk. More reliable, easier to backup.
4. **Log management.** Render retains logs for only 7 days on free plans. For an audit-first system, this is unacceptable. Export logs to an external service (Papertrail free tier: 16MB/day) from day one.

**Feature Requests:**
- Backup script: a one-command `scripts/backup.sh` that dumps the Postgres database to a local file. Run weekly via a Render cron job.
- Staging environment: document how to run a second Render service as a staging environment for testing changes before production.
- Docker Compose for local dev: Paperclip already supports this — make sure Agency OS's additions are included in the compose file.

**Verdict:** Solid for MVP. The CI/CD gap is the most important thing to fix before inviting other contributors.

---

### 🎨 REVIEWER 6: UX / DEVELOPER EXPERIENCE LEAD
**Background:** Head of DX at a developer tools unicorn. Previously at Stripe (API design) and GitHub (Copilot UX). Author of "Developer Experience as a Product Discipline."

**Overall Rating: 6.5/10 — The concept is beautiful, the execution spec is developer-centric to a fault**

The system is being designed by engineers for engineers. That's appropriate for early adopters but will block the broader audience of solo entrepreneurs and indie hackers who don't know what a "heartbeat" or "org chart" is.

**Strengths:**
The Agent Gallery UI concept is exactly right. Letting users browse personalities before hiring is essential — it makes the system legible. The "Hire this agent" button as a primary affordance is intuitive.

**Critical Issues:**
1. **Jargon everywhere.** "Heartbeat scheduling," "audit log," "org chart," "delegation depth" — none of these terms mean anything to a non-technical user. Every user-facing string needs a plain-English translation. Example: "Heartbeat" → "How often your agent checks in."
2. **The Agent Gallery needs visual design.** The spec describes it as a React component. Make it feel like hiring from a talent agency — profile cards with a photo placeholder (generated avatar based on role), a one-line personality description, and 3 example outputs. Show, don't tell.
3. **Error messages are not specified.** When EC-13 fires (no API key), what does the user see? "Error 401" is not acceptable. "Your Anthropic key needs to be updated — click here to fix it" is. Every error state needs a human-readable message with a clear next action.

**Feature Requests:**
- Agent "voice preview": before hiring, show 3 example outputs from that agent so the user knows exactly how it communicates.
- Progress bar on first run: show "Your company is 60% set up" with clear remaining steps.
- Mobile-friendly dashboard: Paperclip's UI may not be mobile-responsive. Since users want to monitor from anywhere, ensure the core dashboard works on mobile.

**Verdict:** Invest 20% of total engineering time in UX. The difference between a product that gets shared and one that gets abandoned is entirely in the experience of the first 10 minutes.

---

### 🌐 REVIEWER 7: OPEN SOURCE COMMUNITY LEAD
**Background:** Core maintainer on 3 projects with 50K+ stars combined. Previously led developer relations at HashiCorp. Expert in open source community building and project governance.

**Overall Rating: 7/10 — Good bones, weak community strategy**

The upstream dependencies (Paperclip + Agency Agents) are both MIT licensed — excellent. The merger approach avoids forking either project directly, which is the right call; forks are maintenance nightmares.

**Strengths:**
The `/agents/` directory as a simple drop-in for new `.md` files is a genius contribution model. Any developer can add a new personality without understanding the codebase. This will drive contributions.

**Critical Issues:**
1. **No `CONTRIBUTING.md` for Agency OS specifically.** Paperclip has one. Agency Agents has one. Agency OS needs its own that explains: how to add a new agent, how to submit a company template, how to modify the role mapper. Without this, contributions will be wrong format.
2. **Upstream drift risk.** Paperclip is actively developed (updated March 28, 2026 — yesterday). There will be breaking changes. You need a strategy: pin to a specific Paperclip version, document the upgrade path, and run Paperclip's own test suite against Agency OS changes.
3. **No governance model.** Who decides which agent personalities get merged? There are 215+ open PRs on Agency Agents — this community is active but chaotic. Define acceptance criteria clearly.

**Feature Requests:**
- Automated agent quality score on PR: when someone submits a new `.md` agent file, an automated check runs it against 10 sample tasks and reports a quality score.
- "Featured agents" section: curate 5-10 highest-quality agents and highlight them in the Gallery. Curation builds trust.
- Changelog: a machine-readable `CHANGELOG.md` updated on every release so integrators know what changed.

**Verdict:** The open source strategy is solid. The upstream drift risk is the existential threat — address it with version pinning and automated compatibility tests before launch.

---

### 🚀 REVIEWER 8: STARTUP FOUNDER (PREVIOUSLY FAILED)
**Background:** Founded 3 companies. One exit ($12M), two failures. Second failure was an AI agent platform that raised $800K and shut down in 18 months. Knows exactly what kills these products.

**Overall Rating: 8/10 — I wish I had built this. Here's why I would have failed anyway.**

The idea is right. The timing is right (Paperclip hit 14K stars in its first week — the market exists). But I've lived this story before and I'm going to tell you the three ways you'll kill it.

**How you'll kill it — and how not to:**

**Kill #1: You'll over-engineer before finding your users.** The "Agency Clipmart" marketplace, the A/B testing framework, the performance analytics — kill them all for MVP. Ship the core: Paperclip + Agency Agents + Render deploy. That's it. Get 50 users using it before building anything else.

**Kill #2: You'll neglect the "magic moment."** My platform failed because users deployed it, stared at a dashboard for 20 minutes, didn't understand what was happening, and left. The magic moment is: "I watched an AI agent complete a real task for me." Everything in your roadmap must serve getting users to that moment faster.

**Kill #3: You'll run out of will before you find product-market fit.** This is a solo/small-team project. The agency templates (Solo Dev Shop, Content Studio) are your distribution engine. Each template should be a shareable link: "I'm running an AI-powered content studio — click here to run your own." If the templates are sharable, the product markets itself.

**Feature Requests:**
- "Show HN" package: prepare a single markdown file that explains Agency OS in 200 words with a live demo link. This is how you get your first 500 users.
- Embedded usage video: a 90-second Loom (or recorded screen capture) embedded in the README showing the full flow from deploy to first completed task. Text documentation does not build desire.
- No-credit-card-required path: make sure a user can fully evaluate Agency OS without entering a payment method. API keys only — no Agency OS account.

**Verdict:** This will work if you ship fast and iterate on what users actually use. The feature list in this doc is 3x too large for an MVP. Cut ruthlessly.

---

### 🔧 REVIEWER 9: SENIOR BACKEND ENGINEER
**Background:** 12 years at high-scale Node.js shops. Contributor to Express.js and Fastify. Expert in TypeScript, event-driven architecture, and database performance.

**Overall Rating: 7.5/10 — Clean architecture, three implementation traps to avoid**

The TypeScript-first approach is correct for a project of this complexity. The adapter pattern for role-to-agent mapping is well-designed. My concerns are implementation-level.

**Strengths:**
The decision to store agent personalities in the database (after disk → DB recommendation from DevOps reviewer) is correct — it enables hot-reloading of personalities without restarts. The fuzzy matching approach for role names is practical and testable.

**Critical Issues:**
1. **agent-registry.ts loading all `.md` files into memory on boot.** With 51+ agents and growing, this is fine now but will cause boot-time issues at 500+ agents. Use lazy loading: parse and cache each `.md` file on first request, not on boot.
2. **prompt-injector.ts as Express middleware.** This is the right pattern, but be careful about middleware ordering. It must run AFTER auth (don't inject personalities for unauthenticated requests) and BEFORE the agent creation handler. Document middleware order explicitly.
3. **The `agent_personality_assignments` table foreign key.** The `agents` table is Paperclip's table. If Paperclip runs a migration that changes the agents table schema, your foreign key breaks the migration. Use soft references: store the Paperclip agent UUID as a plain string column (not FK) to decouple schemas.

**Feature Requests:**
- Agent personality hot-reload endpoint: `POST /api/admin/agents/reload` that re-parses all `.md` files and updates the registry without restarting the server.
- Integration test suite: write integration tests that spin up the full Agency OS stack (test database, test Paperclip instance) and verify the end-to-end flow: create role → personality injected → agent created → heartbeat triggered → task completed.
- TypeScript strict mode: run with `"strict": true` in tsconfig. Catches a large class of bugs before they reach production.

**Verdict:** Strong implementation plan. Avoid the FK coupling trap and the boot-time loading issue and the backend will be solid.

---

### ✍️ REVIEWER 10: TECHNICAL WRITER & DOCUMENTATION ARCHITECT
**Background:** Led documentation for Kubernetes, Terraform, and VS Code. Author of "Docs as Product: How Great Documentation Drives Adoption." Believes documentation is a first-class engineering deliverable.

**Overall Rating: 5/10 — The product will be invisible without better documentation**

This spec is excellent as an internal engineering document. As a foundation for user-facing documentation, it needs complete rethinking. Documentation is the primary interface between your product and the 95% of users who will never read source code.

**Strengths:**
The edge cases section is gold. Every one of those should become a troubleshooting guide entry. The Render.com deployment spec is detailed enough to be executable. The role-to-agent mapping table is exactly the kind of reference that belongs in docs.

**Critical Issues:**
1. **No documentation hierarchy specified.** You need: README (30-second pitch + quick start), DEPLOYMENT.md (full Render guide), AGENTS.md (how to browse/add agents), COMPANIES.md (how to use templates), TROUBLESHOOTING.md (every EC in this doc as a user-facing Q&A), and a CHANGELOG.
2. **The README is the product's storefront.** It must answer in order: (1) What is this? (2) What does it do for me? (3) Can I see it? (4) How do I start? Most READMEs bury the quick start. Put it above the fold.
3. **API documentation is completely absent.** Every endpoint that Agency OS adds to Paperclip's API needs a documented schema. Users will build on top of this. Without API docs, they'll build wrong and blame the product.

**Feature Requests:**
- Interactive quickstart: a `npx create-agency-os` CLI command that clones the repo, guides through env var setup, and opens the browser — all in one terminal command.
- Video walkthrough: documentation without video loses 60% of its audience in 2026. A 5-minute screen recording is worth 5,000 words.
- Feedback mechanism: add a "Was this helpful?" button to every docs page. Route feedback to a GitHub Discussions thread. The docs that get the most "not helpful" votes are your product gaps.
- Architecture diagram in README: a simple visual (like the ASCII diagram in Section 5.1) should be in the README. It communicates the full system in 5 seconds.

**Verdict:** Budget 15-20% of total project time for documentation. A project with great docs and average code will always outperform a project with great code and average docs.

---

## 9. SCALABILITY ROADMAP

### Phase 0: MVP (Week 1-2)
- Fork Paperclip, add `/agents/` directory with Agency Agent files
- Build `agent-registry.ts` and `role-mapper.ts`
- Build `prompt-injector.ts` (middleware)
- Add Agent Gallery UI component
- Deploy to Render with `render.yaml`
- Add 2 company starter templates
- Ship onboarding wizard extension
- Target: first user runs a company in < 20 minutes

### Phase 1: Stability (Week 3-4)
- Fix all EC-01 through EC-22 edge cases
- Add CI/CD via GitHub Actions
- Write integration test suite
- Implement personality drift fix (EC periodic refresh)
- Add log export to Papertrail
- Write full documentation set (all 6 docs)

### Phase 2: Community (Month 2)
- Launch on GitHub, Reddit r/selfhosted, r/MachineLearning, Hacker News
- Build Custom Agent Creator UI (F7)
- Implement agent quality scoring on PRs
- Add A/B testing framework for personalities
- 50 GitHub stars target

### Phase 3: Marketplace (Month 3-4)
- Launch Agency Clipmart (company template marketplace)
- Multi-model agent assignment (F9)
- Agent performance analytics dashboard (F10)
- `npx create-agency-os` interactive installer

### Phase 4: Scale (Month 5+)
- Headless API: expose all Agency OS features as a first-class API for third-party integrations
- Kubernetes deployment guide for large organizations
- Enterprise features: SSO, RBAC, SOC2 compliance checklist
- Hosted managed option (if demand exists)

---

## 10. INSTRUCTIONS FOR YOUR AI CODER

Copy everything below this line and paste it at the start of your session with Claude Code, Cursor, or whichever AI coding tool you use.

---

```
SYSTEM: You are building "Agency OS" — a merger of two open-source projects:
1. Paperclip (paperclipai/paperclip) — Node.js + React company OS for AI agents
2. Agency Agents (msitarzewski/agency-agents) — 51+ personality-driven .md agent files

MISSION: Build the merger layer that injects Agency Agent personalities into Paperclip agents, deploy it on Render.com, and add an Agent Gallery UI.

TECH STACK:
- TypeScript, Node.js, React, PostgreSQL
- pnpm workspaces
- Render.com for hosting (use render.yaml)
- Paperclip on port 3100

START HERE:
1. Clone Paperclip: git clone https://github.com/paperclipai/paperclip.git
2. Clone Agency Agents: git clone https://github.com/msitarzewski/agency-agents.git
3. Create new repo: agency-os/
4. Set up structure per Section 5.2 of the spec document
5. Build agent-registry.ts first — it's the foundation everything else depends on

CRITICAL RULES:
- NEVER directly call Paperclip's internal functions — only use its REST API
- NEVER use FK constraints to Paperclip's tables — use soft UUID references
- ALWAYS validate .md files on load — skip malformed files, never crash
- ALWAYS add secret redaction to any logging middleware you write
- ALWAYS set auth enabled in production (PAPERCLIP_AUTH_ENABLED=true)
- ALWAYS add token counting before injecting .md personalities (EC-07)
- DO NOT build Phase 2+ features until Phase 0 is shipped and working

EDGE CASES: Read Section 7 of the spec. All 22 edge cases must be solved. Each has a pre-designed solution — implement exactly those solutions, do not improvise.

FIRST FILES TO CREATE:
1. render.yaml (Section 6.1)
2. agency-os/agent-registry.ts
3. agency-os/role-mapper.ts
4. agency-os/prompt-injector.ts
5. scripts/setup.sh (with env var validation)
6. agency-os/ui/AgentGallery.tsx

TEST BEFORE SHIPPING:
- Run pnpm typecheck — zero errors
- Run pnpm test:run — all passing
- Manually test: create a "Frontend Developer" agent → verify personality injected
- Manually test: create a "Xyzzy Wizard" agent → verify fallback to default personality
- Manually test: deploy to Render → verify health check passes → verify session persists after 1 hour

DELIVER:
- Working Render deployment URL
- GitHub repository with complete code
- All 6 documentation files (README, DEPLOYMENT, AGENTS, COMPANIES, TROUBLESHOOTING, CHANGELOG)
```

---

*Document Version: 1.0 | Created: March 2026 | Status: Ready for Vibe Coding*
*Upstream Sources: github.com/paperclipai/paperclip (MIT) | github.com/msitarzewski/agency-agents (MIT)*
