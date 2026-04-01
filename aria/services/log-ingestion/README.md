# 04 — Log Ingestion & Normalization

**Tier:** 1 (Core Requirements)  
**Status:** TO BUILD  
**Priority:** 1.1

## What This Does

The **data intake pipeline** — takes raw logs from multiple sources (gateway events, system logs, application logs, network logs) and converts them into a **standardized format** that all downstream features can consume.

### Why It Matters for the Hackathon
The problem statement says "Automated Log Ingestion" explicitly. The system must handle **high-volume banking transaction logs** and normalize them for analysis. Without this, no anomaly detection, correlation, or AI analysis can work.

### What to Build

#### 1. Log Normalizer
A module that converts various log formats into a unified schema:
```typescript
interface NormalizedEvent {
  id: string;
  timestamp: Date;
  source: 'gateway' | 'syslog' | 'application' | 'network';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  category: string;           // e.g., 'authentication', 'transaction', 'data_access'
  raw: string;                // original log line
  parsed: Record<string, any>; // structured fields
  metadata: {
    sourceIP: string;
    destinationIP?: string;
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    geoLocation?: { country: string; city: string; lat: number; lon: number };
  };
}
```

#### 2. Format Parsers
Individual parsers for each log format:
- **Gateway events** — already structured from Feature 01 (just map fields)
- **Syslog** — RFC 5424 parser
- **JSON logs** — flexible field mapping
- **CSV/structured** — column mapping config

#### 3. Ingestion Queue
A simple Redis-based queue that buffers incoming events and feeds them to downstream consumers:
- Gateway pushes events → Redis list
- Normalizer worker pulls, parses, and writes to MongoDB
- Anomaly detector subscribes to normalized events

### Tech Stack
- **Node.js** — parser logic (keeps everything in one runtime)
- **Redis Lists** (`LPUSH`/`BRPOP`) — simple reliable queue
- **MongoDB** — persistent storage for normalized events

### Integration Points
- **Receives from:** Feature 01 (Gateway) — every proxied request
- **Sends to:** Feature 05 (Anomaly Detection), Feature 06 (UEBA), Feature 07 (Fidelity Ranking), Feature 08 (Alert Correlation)

### Existing Code to Reference
- `02-dashboard-ui/src/lib/models/Log.ts` — current log schema (adapt fields)
- `02-dashboard-ui/src/app/api/logs/route.ts` — current log API (adapt for ingestion)
- `01-reverse-proxy-gateway/index.js` — see `logRequest()` function for how logs are currently created
