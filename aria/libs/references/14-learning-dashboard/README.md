# 14 — Learning Dashboard

**Tier:** 3 (Secondary WOW)  
**Status:** TO BUILD (reference components included)  
**Priority:** 3.3

## What This Does

A dedicated dashboard page that shows **what the AI has learned** — new regex patterns it generated, prompts it evolved, models it finetuned, thresholds it adjusted, and the accuracy improvements over time. This makes the self-evolving agent's work transparent and auditable.

### Why It Matters
Self-evolving AI is impressive, but judges will ask "how do you know it's getting better?" This dashboard answers that with data: accuracy trends, false positive reduction, and a timeline of every change the agent made.

### Reference Files Included

| File | From | Why It's Here |
|------|------|---------------|
| `StatCard.tsx` | `maf-app` | Reusable KPI card — show metrics like "FP rate: 3.2% ↓12%" |
| `DonutChartCard.tsx` | `maf-app` | Show distribution of detection sources |
| `ProgressBarCard.tsx` | `maf-app` | Rank top learned patterns by effectiveness |

### What to Build

#### 1. Evolution Timeline
Show every change the self-evolving agent made:
```tsx
// Timeline of agent actions
<EvolutionTimeline entries={[
  { time: '2h ago', type: 'regex', action: 'Added pattern for base64-encoded SQLi', status: 'validated' },
  { time: '5h ago', type: 'prompt', action: 'Updated threat analysis prompt v7', status: 'monitoring' },
  { time: '1d ago', type: 'threshold', action: 'Adjusted anomaly weight: 0.25→0.30', status: 'validated' },
  { time: '2d ago', type: 'regex', action: 'Added XSS pattern for SVG payloads', status: 'rolled_back', reason: '15% FP increase' },
]} />
```

#### 2. Accuracy Trend Charts
```tsx
// Line charts showing improvement over time
<AccuracyChart data={{
  truePositiveRate: [...],    // Should go UP over time
  falsePositiveRate: [...],   // Should go DOWN over time
  meanTimeToDetect: [...],    // Should go DOWN over time
  fidelityAccuracy: [...],    // How often top-ranked alerts were real threats
}} />
```

#### 3. Learned Patterns Viewer
```tsx
// Show what the agent has learned
<LearnedPatterns items={[
  { pattern: '/base64_decode.*select/i', source: 'agent-generated', hitCount: 45, fpCount: 2 },
  { pattern: '/\\.\\.\\/etc\\/shadow/i', source: 'human-written', hitCount: 12, fpCount: 0 },
]} />
```

#### 4. Model Version History
```tsx
// Show finetuning history
<ModelVersions versions={[
  { version: 'aria-v3', createdAt: '2h ago', accuracy: 0.94, trainingExamples: 150 },
  { version: 'aria-v2', createdAt: '1d ago', accuracy: 0.89, trainingExamples: 100 },
  { version: 'aria-v1', createdAt: '3d ago', accuracy: 0.82, trainingExamples: 50 },
]} />
```

### Tech Stack
- **Next.js** — page in the dashboard app (Feature 02)
- **Recharts** — charts (already in the project)
- **Tailwind CSS** — styling
- **MongoDB** — evolution history data

### Integration Points
- **Reads from:** Feature 10 (Self-Evolving Agent) — evolution change history
- **Reads from:** Feature 11 (Model Finetuning) — model version history
- **Renders in:** Feature 02 (Dashboard UI) — as `/learning` route

### Existing UI Patterns
All chart components from `02-dashboard-ui/src/components/dashboard/` can be reused. The reference StatCard, DonutChartCard, and ProgressBarCard in this folder show exactly how — just change the data props.
