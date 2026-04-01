# 08 — Alert Correlation Worker

## Overview

Standalone Node.js worker service that runs periodic correlation cycles to group related **Alerts** into **Incidents**. This is the core engine that transforms raw detection events into actionable security incidents for analyst triage.

## How It Works

The worker connects to MongoDB and Redis on startup, then runs a correlation cycle every **60 seconds**. Each cycle evaluates 5 correlation rules against recent uncorrelated alerts:

| # | Rule | Window | Min Alerts | Logic |
|---|------|--------|-----------|-------|
| 1 | Same Source IP | 15 min | 3 | Multiple alerts from one IP → likely single attacker |
| 2 | Same Attack Type | 30 min | 5 | Same category alerts across requests → campaign |
| 3 | Endpoint Targeting | 20 min | 3 | Multiple alerts on same URI → targeted attack |
| 4 | Kill Chain Detection | 60 min | 2+ stages | Sequential recon → exploit → escalation from one IP |
| 5 | Distributed Attack | 10 min | 5 IPs | Same attack type from many IPs on same endpoint → DDoS/coordinated |

## Attack Stage Mapping

| Attack Category | Kill Chain Stage |
|----------------|-----------------|
| `path_traversal`, `scanning` | reconnaissance |
| `sql_injection`, `xss`, `command_injection` | exploitation |
| `privilege_escalation` | installation |
| `data_exfiltration` | exfiltration |
| `credential_stuffing`, `account_enumeration` | delivery |

## Data Flow

```
MongoDB (Alert collection) → Correlation Worker → MongoDB (Incident collection)
                                                → Redis pub/sub (aria-alerts)
```

## Configuration

| Env Variable | Default | Description |
|-------------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017/aria_db` | MongoDB connection string |
| `REDIS_URI` | `redis://localhost:6379` | Redis connection string |
| `CORRELATION_INTERVAL_MS` | `60000` | Cycle interval in milliseconds |
| `LOG_LEVEL` | `info` | Pino log level |

## Running

```bash
# Install dependencies
npm install

# Start worker
npm start

# Or with custom config
MONGODB_URI=mongodb://mongo:27017/aria_db REDIS_URI=redis://redis:6379 node index.js
```

## Dependencies

- `mongoose` ^8 — MongoDB ODM (inline schemas, same pattern as gateway)
- `redis` ^4 — Native Redis client (pub/sub for incident notifications)
- `pino` ^8 — Structured JSON logger

---

## Original Design Notes (Archived)

<details>
<summary>Click to expand original design spec</summary>

### Examples of Correlation
- **IP-based:** 15 different SQLi attempts from the same IP → one "SQLi campaign" incident
- **Session-based:** Login attempt + account enumeration + privilege escalation in same session → one "account takeover attempt"
- **Time-based:** 200 failed logins across 50 accounts in 2 minutes → one "credential stuffing attack"
- **Kill-chain:** Recon (port scan) → Initial access (SQLi) → Lateral movement (API abuse) → Exfiltration (data download) → one "advanced persistent threat"

### Original Correlation Rule Interface
```typescript
interface CorrelationRule {
  name: string;
  description: string;
  conditions: {
    timeWindow: string;
    minAlerts: number;
    groupBy: string[];
    alertTypes?: string[];
    fidelityThreshold?: number;
  };
  incidentSeverity: 'low' | 'medium' | 'high' | 'critical';
  incidentCategory: string;
}
```

</details>
