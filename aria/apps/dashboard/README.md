# 02 — Dashboard UI

**Tier:** 0 (Must Ship)  
**Status:** EXISTS — needs adaptation  
**Source:** `maf-app/` (full Next.js 16 application)

## What This Does

The **command center dashboard** — a Next.js 16 web app for security analysts to monitor traffic, review incidents, approve/reject decisions, and configure the system. Built with React 19, Tailwind CSS 4, Recharts, Three.js globe, and Framer Motion.

### Current Pages → ARIA Mapping

| Current Route | Current Purpose | ARIA Adaptation |
|---------------|----------------|-----------------|
| `/` (page.tsx) | Statistics overview | → **Incident Overview** (KPIs, live metrics) |
| `/statistics` | Detailed analytics | → **Learning Dashboard** (Feature 14) |
| `/attacks` | Attack log viewer | → **Incident Feed + Human Triage** (Feature 17) |
| `/policy` | Ollama model/policy management | → **Playbook Manager** (Feature 09) |
| `/applications` | Protected app CRUD | → **REMOVE or simplify** (single banking app) |
| `/allow-deny` | IP allow/deny lists | → **Adapt for rule management** or remove |

### Reusable Components (no changes needed)

| Component | What It Does |
|-----------|--------------|
| `StatCard.tsx` | Animated KPI card (icon, value, label, trend) |
| `DonutChartCard.tsx` | Recharts donut with center text |
| `ProgressBarCard.tsx` | Ranked list with animated bars |
| `TrafficChart.tsx` | Area/line time-series chart |
| `VerticalCharts.tsx` | Horizontal bar charts |
| `GeoLocation.tsx` | IP → country mapping display |
| `MAFGlobe.tsx` | 3D globe with attack origins (Three.js + react-globe.gl) |
| `WorldMap2D.tsx` | 2D world map with markers |
| `RecentEvents.tsx` | Live scrolling event feed |
| `DetailsModal.tsx` | Full-screen detail view for any log entry |
| `Header.tsx` | Top bar with search and user info |

### Components Needing Adaptation

| Component | Current | ARIA Change |
|-----------|---------|-------------|
| `Sidebar.tsx` | WAF nav menu | → Incident/Triage/Playbook/Learning nav |
| `DataDashboard.tsx` | WAF log table with polling | → Alert/incident table with triage actions |
| `SecurityTable.tsx` | Paginated event table | → Incident table with approve/reject buttons |
| `SecurityFilters.tsx` | Category/severity filters | → Add fidelity score, detection source filters |
| `TrafficAnalysis.tsx` | 12 stat cards + chart | → Incident KPIs + banking-specific metrics |
| `SecurityPosture.tsx` | Threat trend charts | → Incident trend + MTTR/MTTD metrics |
| `AttackDistribution.tsx` | Attack type breakdown | → Incident category breakdown |
| `ApplicationSelector.tsx` | Multi-app selector | → Single service / all services toggle |

### Lib (Infrastructure)

| File | Purpose | Changes |
|------|---------|---------|
| `db.ts` | Mongoose connection (singleton) | Keep as-is |
| `redis.ts` | ioredis client | Keep as-is |
| `ollama.ts` | Ollama model creation helper | Adapt for ARIA model names |
| `logger.ts` | Pino logger | Keep as-is |
| `utils.ts` | `cn()` class merger (clsx + tailwind-merge) | Keep as-is |
| `models/Application.ts` | App config schema | → Replace with `ProtectedService.ts` |
| `models/Event.ts` | Security event schema | → Replace with `Incident.ts` |
| `models/Log.ts` | Request log schema | → Replace with `Alert.ts` |

### New Models to Create
- `Alert.ts` — individual detection alerts with fidelity scores
- `Incident.ts` — correlated alert groups → human-reviewable incidents
- `Feedback.ts` — analyst approve/reject decisions with notes
- `LearnedPattern.ts` — patterns discovered by the self-evolving agent
- `Playbook.ts` — auto-generated response playbooks

### New Pages to Create
- `/triage` — Human approval queue (both blocked AND allowed requests)
- `/learning` — AI learning dashboard (what the agent has learned)
- `/playbooks` — Auto-generated playbook viewer
- `/query` — Natural language incident query interface

### Tech Stack
- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS 4** with `@theme` custom properties
- **Recharts** for charts, **Three.js / react-globe.gl** for 3D globe
- **Framer Motion** for animations
- **Mongoose 9** for MongoDB models
- **ioredis** for Redis pub/sub and caching

### Special Note: `common/ApplicationSelector.tsx`
This file was copied from mafai-app (not maf-app) because it has cleaner TypeScript prop typing. It can serve as a reference for component patterns.
