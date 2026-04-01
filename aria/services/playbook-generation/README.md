# 09 — Playbook Generation

**Tier:** 1 (Core Requirements)  
**Status:** TO BUILD (reference files included)  
**Priority:** 1.7

## What This Does

The **automated response advisor** — when an incident is detected and correlated, this module uses the LLM (Ollama/Mistral) to **generate a step-by-step response playbook** tailored to that specific incident. Analysts don't just see "there's an attack" — they get "here's exactly what to do about it."

### Why It Matters for the Hackathon
The problem statement requires "Automated Playbook Generation." This is a major wow factor — the AI doesn't just detect threats, it tells you how to respond. For banking, responses must follow regulatory procedures (RBI guidelines, PCI-DSS).

### Reference Files Included

| File | From | Why It's Here |
|------|------|---------------|
| `actions.ts` | `maf-app/src/app/policy/actions.ts` | Shows Ollama model creation with custom system prompts — same pattern used to create a "playbook generator" model |
| `page.tsx` | `maf-app/src/app/policy/page.tsx` | UI for model/policy management — adapt for playbook management |

### What to Build

#### 1. Playbook Generator (LLM-based)
Use Ollama to generate response steps:
```typescript
async function generatePlaybook(incident: Incident): Promise<Playbook> {
  const prompt = `
    You are a banking cybersecurity incident response expert.
    
    Incident Details:
    - Type: ${incident.category}
    - Severity: ${incident.severity}
    - Attack Stage: ${incident.attackStage}
    - Source IPs: ${incident.sourceIPs.join(', ')}
    - Affected Endpoints: ${incident.targetEndpoints.join(', ')}
    - Timeline: ${incident.timeRange.start} to ${incident.timeRange.end}
    - Related Alerts: ${incident.alertIds.length}
    
    Generate a step-by-step incident response playbook following these frameworks:
    1. NIST SP 800-61 (Incident Response)
    2. PCI-DSS requirements (if payment data involved)
    3. RBI cybersecurity framework (for Indian banking)
    
    For each step, provide:
    - Action description
    - Who should perform it (SOC L1/L2/L3, IT Ops, Management)
    - Estimated time
    - Verification criteria
    - Escalation conditions
  `;
  
  const response = await ollama.generate({ model: 'aria-playbook', prompt });
  return parsePlaybookFromLLM(response);
}
```

#### 2. Playbook Templates
Pre-built templates for common banking incidents:
```typescript
const templates: PlaybookTemplate[] = [
  {
    category: 'credential_stuffing',
    steps: [
      'Block source IPs at WAF level',
      'Force password reset for targeted accounts',
      'Enable CAPTCHA on login endpoints',
      'Check for successful logins from attack IPs',
      'Notify affected customers',
      'Report to CERT-In within 6 hours',
    ]
  },
  {
    category: 'sql_injection',
    steps: [
      'Block attacking IP ranges',
      'Audit database for unauthorized queries',
      'Check for data exfiltration',
      'Patch vulnerable endpoint',
      'Run full DB integrity check',
      'Update WAF rules with new patterns',
    ]
  },
  // ... more templates
];
```

#### 3. Playbook Schema
```typescript
interface Playbook {
  id: string;
  incidentId: string;
  title: string;
  generatedAt: Date;
  generatedBy: 'template' | 'llm' | 'hybrid';
  steps: PlaybookStep[];
  estimatedResolutionTime: string;
  regulatoryRequirements: string[];
  status: 'generated' | 'approved' | 'in_progress' | 'completed';
}

interface PlaybookStep {
  order: number;
  action: string;
  assignee: string;         // 'SOC-L1', 'SOC-L2', 'IT-Ops', 'Management'
  estimatedTime: string;    // '5m', '1h'
  verification: string;     // How to confirm step is done
  automated: boolean;       // Can this step be auto-executed?
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}
```

### Architecture
```
Incident (Feature 08) → Template Lookup → LLM Enhancement → Playbook
                       → If no template → Full LLM Generation → Playbook
                       → Playbook → Dashboard (Feature 17) → Analyst executes steps
                       → Completed playbook → Feed back to LLM for improvement
```

### Tech Stack
- **Node.js / TypeScript** — playbook generation logic
- **Ollama + Mistral** — LLM for generating custom steps
- **MongoDB** — playbook storage
- **Pattern from `actions.ts`** — use `createPolicyModel()` to create a dedicated `aria-playbook` model with banking-specific system prompt

### Integration Points
- **Receives from:** Feature 08 (Alert Correlation) — correlated incidents
- **Sends to:** Feature 17 (Human Triage) — generated playbooks attached to incidents
- **Improves from:** Completed playbook feedback → better templates
- **Self-evolves via:** Feature 10 (Self-Evolving Prompts) — the playbook generation prompt itself improves over time
