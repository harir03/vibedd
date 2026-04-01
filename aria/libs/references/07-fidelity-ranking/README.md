# 07 — Fidelity Ranking

**Tier:** 1 (Core Requirements)  
**Status:** TO BUILD  
**Priority:** 1.5

## What This Does

The **smart prioritization engine** — takes scores from all detection modules (regex, anomaly, UEBA, LLM) and produces a single **fidelity score** (0-100) that tells analysts which alerts to look at first. This solves the #1 problem in security: **alert fatigue**.

### Why It Matters for the Hackathon
The problem statement specifically requires "Automated Fidelity Ranking of alerts." Without this, analysts drown in thousands of alerts. With fidelity ranking, the top 10 alerts are the ones that actually matter.

### What to Build

#### 1. Score Aggregation Engine
Combines scores from multiple detection sources:
```typescript
interface AlertScores {
  regexScore: number;      // 0-1, from Feature 01 (regex pattern match confidence)
  anomalyScore: number;    // 0-1, from Feature 05 (PyOD ensemble)
  uebaScore: number;       // 0-1, from Feature 06 (behavioral deviation)
  llmScore: number;        // 0-1, from Feature 01 (Ollama analysis confidence)
  timeSeriesScore: number; // 0-1, from Feature 05 (tsfresh)
}

function calculateFidelity(scores: AlertScores, context: AlertContext): number {
  // Weighted combination — weights are self-tuning (Feature 10/threshold-tuning)
  const weights = {
    regex: 0.15,
    anomaly: 0.25,
    ueba: 0.25,
    llm: 0.25,
    timeSeries: 0.10,
  };
  
  let fidelity = Object.entries(weights).reduce(
    (sum, [key, w]) => sum + w * scores[key + 'Score'], 0
  );
  
  // Context multipliers (banking-specific)
  if (context.isFinancialTransaction) fidelity *= 1.3;
  if (context.isAdminEndpoint) fidelity *= 1.5;
  if (context.isAfterHours) fidelity *= 1.2;
  if (context.hasMultipleDetections) fidelity *= 1.4;
  
  return Math.min(100, Math.round(fidelity * 100));
}
```

#### 2. Priority Categories
Map fidelity scores to actionable priority levels:
```
90-100: CRITICAL — Investigate immediately (auto-block, human reviews after)
70-89:  HIGH     — Next in queue (likely real threat)
40-69:  MEDIUM   — Review when possible (suspicious but uncertain)
10-39:  LOW      — Background review (probably benign)
0-9:    INFO     — Auto-allow (log for audit)
```

#### 3. Feedback-Weighted Adjustment
When analysts approve/reject alerts, adjust future scores:
```typescript
// If analyst says "this was a false positive" for alerts with high regex + low UEBA,
// decrease regex weight slightly and increase UEBA weight
function adjustWeights(feedback: AnalystFeedback, originalScores: AlertScores): void {
  // This connects to Feature 10 (Self-Tuning Thresholds)
}
```

### Architecture
```
Feature 01 (regex) ─────────┐
Feature 05 (anomaly) ───────┤
Feature 05 (time-series) ───┼──→ Score Aggregation → Fidelity Score (0-100) → Feature 08, 17
Feature 06 (UEBA) ──────────┤
Feature 01 (LLM) ───────────┘
                                   ↑
                            Feedback Loop (Feature 17)
```

### Tech Stack
- **Node.js / TypeScript** — runs in the gateway or as a separate module
- **Redis** — cache recent scores, store current weights
- **MongoDB** — persist historical fidelity data for analytics

### Integration Points
- **Receives from:** Features 01, 05, 06 — detection scores from all modules
- **Sends to:** Feature 08 (Alert Correlation) — scored alerts for grouping
- **Sends to:** Feature 17 (Human Triage) — prioritized alert queue
- **Feedback from:** Feature 17 — analyst corrections adjust weights
- **Self-tuned by:** Feature 10 (Self-Tuning Thresholds)

### Hackathon Tip
Start with **equal weights** and hard-coded multipliers. Demonstrate that the system CAN learn better weights from feedback — even if you only show 2-3 learning iterations in the demo.
