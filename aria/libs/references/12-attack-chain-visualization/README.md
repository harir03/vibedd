# 12 — Attack Chain Visualization

**Tier:** 3 (Secondary WOW)  
**Status:** TO BUILD  
**Priority:** 3.1

## What This Does

Renders **interactive attack chain graphs** that show how individual alerts connect into a multi-stage attack. Analysts see the kill chain visually — from initial reconnaissance to data exfiltration — with each node representing an event and edges showing the progression.

### Why It Matters
A table of 50 alerts is hard to understand. A visual graph that shows "attacker did recon → found SQLi → pivoted to admin API → exfiltrated data" tells the story instantly. This is a major demo wow factor.

### What to Build

#### 1. Attack Chain Graph (React Flow)
```tsx
import ReactFlow, { Node, Edge } from 'reactflow';

// Each alert becomes a node
const nodes: Node[] = incident.alerts.map((alert, i) => ({
  id: alert.id,
  type: 'attackNode',
  position: { x: i * 200, y: stageToY(alert.attackStage) },
  data: {
    label: alert.category,
    severity: alert.severity,
    timestamp: alert.timestamp,
    sourceIP: alert.sourceIP,
    fidelity: alert.fidelityScore,
  },
}));

// Edges connect sequential events from same attacker
const edges: Edge[] = generateEdges(incident.alerts);
```

#### 2. Kill Chain Stages (MITRE ATT&CK Mapping)
Map alerts to standard kill chain stages:
```
Reconnaissance → Initial Access → Execution → Persistence →
Privilege Escalation → Lateral Movement → Collection → Exfiltration
```

#### 3. Custom Node Components
```tsx
function AttackNode({ data }) {
  return (
    <div className={cn('rounded-lg border-2 p-3', severityColors[data.severity])}>
      <div className="text-xs font-semibold">{data.label}</div>
      <div className="text-[10px] text-gray-500">{formatTime(data.timestamp)}</div>
      <div className="text-[10px]">Fidelity: {data.fidelity}%</div>
    </div>
  );
}
```

### Tech Stack
- **React Flow** — interactive node/edge graph library
- **Next.js dynamic import** with `{ ssr: false }` (heavy client-side component)
- **Tailwind CSS** — styling for nodes

### Integration Points
- **Receives from:** Feature 08 (Alert Correlation) — correlated incident data
- **Renders in:** Feature 02 (Dashboard UI) — as a page/component

### Existing Code Patterns
- `02-dashboard-ui/src/components/dashboard/MAFGlobe.tsx` — shows how to use `next/dynamic` with `{ ssr: false }` for heavy client components
- `02-dashboard-ui/src/components/dashboard/DonutChartCard.tsx` — shows Recharts integration pattern
