# 17 — Human Triage Interface

**Tier:** 0 (Must Ship)  
**Status:** TO BUILD (reference files included)  
**Priority:** 0.6, 0.7, 0.8

## What This Does

The **analyst approval queue** — the single most important UI in ARIA. Every automated decision (both BLOCKS and ALLOWS) goes through this queue for human review. Analysts approve or reject the AI's decisions, and their feedback drives the entire learning loop.

### KEY DESIGN PRINCIPLE
> **Both blocked AND allowed requests need human review.** The AI never has full autonomy. Every decision is a suggestion that humans validate.

### Reference Files Included

| File | From | Why It's Here |
|------|------|---------------|
| `SecurityTable.tsx` | `maf-app` | Paginated table with sorting — adapt for triage queue |
| `SecurityFilters.tsx` | `maf-app` | Filter component — add fidelity score, decision type filters |
| `attacks-page-reference.tsx` | `maf-app/attacks/page.tsx` | Current attacks page — adapt as triage page layout |

### What to Build

#### 1. Triage Queue Page (`/triage`)
Two-panel layout:
```
┌─────────────────────────────────────────────────────────────────┐
│ TRIAGE QUEUE                                   [Filters] [Sort] │
├──────────────────────────────┬──────────────────────────────────┤
│ Alert List (left panel)      │ Detail View (right panel)        │
│                              │                                  │
│ 🔴 95 SQLi - POST /transfer │ Fidelity: 95/100                 │
│ 🟡 72 Anomaly - GET /api/..│ AI Decision: BLOCK               │
│ 🟢 15 Normal - GET /balance │ Source: 103.24.xx.xx (Nigeria)   │
│ 🟡 68 UEBA - unusual hours  │ Detection: regex + anomaly + LLM  │
│ 🟢 08 Normal - POST /login  │                                  │
│ ...                          │ Request Body: { ... }            │
│                              │ AI Reasoning: "..."              │
│                              │ Similar Past Incidents: [...]     │
│                              │ Suggested Playbook: [...]         │
│                              │                                  │
│                              │ [✅ Approve] [❌ Reject] [📝 Notes]│
└──────────────────────────────┴──────────────────────────────────┘
```

#### 2. Decision Actions
```typescript
interface TriageDecision {
  alertId: string;
  analystId: string;
  decision: 'approve' | 'reject' | 'escalate';
  notes?: string;
  correctCategory?: string;     // If analyst reclassifies
  timestamp: Date;
}

// When analyst approves a BLOCK → confirm the AI was right
// When analyst rejects a BLOCK → false positive! Feed to learning
// When analyst approves an ALLOW → confirm safe (low priority)
// When analyst rejects an ALLOW → false negative! Critical learning
```

#### 3. Feedback Storage
```typescript
interface Feedback {
  alertId: string;
  analystId: string;
  aiDecision: 'block' | 'allow';
  humanDecision: 'approve' | 'reject';
  wasCorrect: boolean;              // aiDecision matches humanDecision
  fidelityScore: number;            // Original score
  detectionSources: string[];       // Which modules flagged it
  notes: string;
  correctCategory?: string;
  timestamp: Date;
}
```

#### 4. Batch Actions
For efficiency, analysts should be able to:
- Select multiple alerts and approve/reject in bulk
- Auto-approve all alerts below a fidelity threshold
- Filter by: severity, fidelity score, detection source, AI decision, time range

#### 5. Real-Time Updates
When the gateway detects a new threat, it should appear in the triage queue immediately (polling or SSE).

### Architecture
```
Gateway Decision → MongoDB → Triage Queue UI
                                    ↓
                              Analyst Review
                                    ↓
                              Feedback → MongoDB → Feature 10 (Self-Evolving Agent)
                                                 → Feature 11 (Model Finetuning)
                                                 → Feature 07 (Weight Adjustment)
```

### Tech Stack
- **Next.js** — page in dashboard app
- **React** — interactive table with selection, filtering, sorting
- **Polling** or **SSE** — real-time new alerts
- **MongoDB** — alert + feedback storage
- **Tailwind CSS** — styling (use existing maf-app design system)

### Integration Points
- **Receives from:** Feature 01 (Gateway) — automated decisions
- **Receives from:** Feature 07 (Fidelity Ranking) — scored + prioritized alerts
- **Receives from:** Feature 08 (Alert Correlation) — correlated incidents
- **Receives from:** Feature 09 (Playbook Generation) — suggested response steps
- **Sends to:** Feature 10 (Self-Evolving Agent) — analyst feedback drives learning
- **Sends to:** Feature 11 (Model Finetuning) — confirmed incidents for training
- **Renders in:** Feature 02 (Dashboard UI) — as `/triage` route

### Why This Is Tier 0
This is the **primary interface** for the hackathon demo. Judges will see:
1. Attack hitting the gateway → auto-detected
2. Alert appearing in triage queue with fidelity score
3. AI reasoning explaining why it's suspicious
4. Analyst clicking "Approve" or "Reject"
5. System learning from the decision

Without this, there's no demo.
