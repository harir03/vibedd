# 08 — Alert Correlation

**Tier:** 1 (Core Requirements)  
**Status:** TO BUILD  
**Priority:** 1.6

## What This Does

The **pattern connector** — takes individual alerts and groups them into **incidents** by finding connections between seemingly unrelated events. A single attacker might generate 50 separate alerts; correlation recognizes they're all part of ONE coordinated attack.

### Why It Matters for the Hackathon
The problem statement requires "Automated Incident Correlation." Without correlation, analysts see 50 individual alerts instead of 1 incident. Correlation turns noise into actionable intelligence.

### Examples of Correlation
- **IP-based:** 15 different SQLi attempts from the same IP → one "SQLi campaign" incident
- **Session-based:** Login attempt + account enumeration + privilege escalation in same session → one "account takeover attempt"
- **Time-based:** 200 failed logins across 50 accounts in 2 minutes → one "credential stuffing attack"
- **Kill-chain:** Recon (port scan) → Initial access (SQLi) → Lateral movement (API abuse) → Exfiltration (data download) → one "advanced persistent threat"

### What to Build

#### 1. Correlation Rules Engine
Define rules for when alerts should be grouped:
```typescript
interface CorrelationRule {
  name: string;
  description: string;
  conditions: {
    timeWindow: string;           // '5m', '1h', '24h'
    minAlerts: number;            // at least N alerts to trigger
    groupBy: string[];            // ['sourceIP', 'targetEndpoint', 'sessionId']
    alertTypes?: string[];        // filter to specific attack categories
    fidelityThreshold?: number;   // only correlate alerts above this score
  };
  incidentSeverity: 'low' | 'medium' | 'high' | 'critical';
  incidentCategory: string;
}

// Example rules:
const rules: CorrelationRule[] = [
  {
    name: 'Credential Stuffing',
    description: 'Many failed logins targeting multiple accounts',
    conditions: { timeWindow: '5m', minAlerts: 10, groupBy: ['sourceIP'], alertTypes: ['auth_failure'] },
    incidentSeverity: 'high',
    incidentCategory: 'credential_stuffing'
  },
  {
    name: 'Kill Chain Detection',
    description: 'Sequential attack stages from same source',
    conditions: { timeWindow: '1h', minAlerts: 3, groupBy: ['sourceIP'], alertTypes: ['recon', 'initial_access', 'lateral_movement'] },
    incidentSeverity: 'critical',
    incidentCategory: 'advanced_threat'
  },
];
```

#### 2. LangGraph Correlation Agent (Advanced)
Use LangGraph to create an AI agent that reasons about alert relationships:
```python
from langgraph.graph import StateGraph

# The agent takes a batch of recent alerts and reasons:
# "Are these related? What's the attacker trying to do? What's the kill chain stage?"
correlation_graph = StateGraph(CorrelationState)
correlation_graph.add_node("fetch_alerts", fetch_recent_alerts)
correlation_graph.add_node("find_patterns", find_common_patterns)
correlation_graph.add_node("classify_campaign", classify_attack_campaign)
correlation_graph.add_node("create_incident", create_correlated_incident)
```

#### 3. Incident Creator
When correlation finds related alerts, create an incident:
```typescript
interface Incident {
  id: string;
  title: string;                     // Auto-generated: "Credential Stuffing from 103.x.x.x"
  severity: string;
  category: string;
  alertIds: string[];                // All correlated alert IDs
  attackStage: string;               // 'reconnaissance' | 'initial_access' | 'exploitation' | 'exfiltration'
  sourceIPs: string[];
  targetEndpoints: string[];
  timeRange: { start: Date; end: Date };
  fidelityScore: number;             // Highest score from constituent alerts
  suggestedPlaybook?: string;        // Link to Feature 09
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
}
```

### Architecture
```
Scored Alerts (Feature 07) → Correlation Rules Engine → Incident Groups
                           → LangGraph Agent (optional) → AI-reasoned connections
                           → Incident Creator → MongoDB → Dashboard (Feature 17)
```

### Tech Stack
- **Node.js** — rule engine (simple pattern matching)
- **Python + LangGraph** — AI correlation agent (advanced)
- **LangChain** — LLM orchestration for reasoning
- **Redis Streams** — alert aggregation window
- **MongoDB** — incident storage

### Integration Points
- **Receives from:** Feature 07 (Fidelity Ranking) — scored alerts
- **Sends to:** Feature 09 (Playbook Generation) — correlated incidents trigger playbooks
- **Sends to:** Feature 17 (Human Triage) — incidents appear in analyst queue
- **Sends to:** Feature 12 (Attack Chain Visualization) — incident data for graphs

### Hackathon Strategy
Start with **rule-based correlation only** (groupBy IP + time window). Add LangGraph reasoning as a wow factor if time permits. The rules alone handle 80% of cases.
