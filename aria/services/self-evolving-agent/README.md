# 10 — Self-Evolving Agent

**Tier:** 2 (Primary WOW Factor)  
**Status:** TO BUILD (reference file included)  
**Priority:** 2.1–2.6

## What This Does

The **core innovation of ARIA** — an AI agent that doesn't just detect threats, it **improves its own architecture**. It rewrites regex patterns, rewrites LLM prompts, adds pipeline modules, tunes detection thresholds, finetunes the model, and validates its own changes with automated rollback. This is what makes ARIA truly "adaptive."

### Why It Is THE Wow Factor
Most security tools are static — they detect what they were programmed to detect. ARIA **writes its own detection code**. When it encounters a new attack pattern, it generates new regex rules, updates its AI prompts, and retrains itself. The system gets smarter with every attack it sees.

### Sub-Features

This folder contains sub-directories for each self-evolution capability:

---

### `regex-evolution/` — Feature 2.1: Self-Evolving Regex

The agent generates **new regex patterns** from attack data:

```typescript
async function evolveRegex(confirmedAttacks: Attack[]): Promise<RegexRule[]> {
  const prompt = `
    Analyze these confirmed attack payloads and generate new regex patterns:
    ${confirmedAttacks.map(a => a.payload).join('\n')}
    
    Current regex patterns: ${existingPatterns.join('\n')}
    
    Generate new patterns that would catch these attacks but NOT false-positive on:
    ${recentFalsePositives.map(fp => fp.payload).join('\n')}
    
    Return patterns in format: { pattern: "...", flags: "i", category: "...", confidence: 0.95 }
  `;
  
  const newRules = await ollama.generate({ model: 'aria-regex-gen', prompt });
  return validateAndTestRegex(newRules); // Test against known good/bad samples
}
```

**Key point:** The generated regex is **actually written to the gateway's config** — not saved to a text file. The gateway hot-reloads via Redis pub/sub.

---

### `prompt-evolution/` — Feature 2.2: Self-Evolving Prompts

The agent improves the prompts used for LLM threat analysis:

```typescript
async function evolvePrompt(feedback: AnalystFeedback[]): Promise<string> {
  // Gather cases where the current prompt gave wrong answers
  const falsePositives = feedback.filter(f => f.wasCorrect === false && f.aiDecision === 'block');
  const falseNegatives = feedback.filter(f => f.wasCorrect === false && f.aiDecision === 'allow');
  
  const metaPrompt = `
    You are improving your own threat analysis prompt.
    
    Current prompt: ${currentPrompt}
    
    Cases where the prompt incorrectly BLOCKED (false positives):
    ${falsePositives.map(summarize).join('\n')}
    
    Cases where the prompt incorrectly ALLOWED (false negatives):
    ${falseNegatives.map(summarize).join('\n')}
    
    Rewrite the prompt to fix these errors while maintaining accuracy on:
    ${recentCorrectDecisions.map(summarize).join('\n')}
  `;
  
  const improvedPrompt = await ollama.generate({ model: 'mistral', prompt: metaPrompt });
  return improvedPrompt;
}
```

**Reference file included:** `ollama.ts` — shows how to create Ollama models with custom system prompts. The evolved prompt is applied by creating a new model version.

---

### `pipeline-evolution/` — Feature 2.4: Self-Evolving Pipeline

The agent can **add new detection modules** to the pipeline:
- Discovers that a certain attack type is missed by all existing modules
- Generates a new detector module (code generation)
- Registers it in the pipeline
- Tests it against historical data before activation

---

### `threshold-tuning/` — Feature 2.5: Self-Tuning Thresholds

Automatically adjusts detection thresholds and fidelity weights:
```typescript
// If analysts keep marking HIGH fidelity alerts as false positives,
// the system adjusts weights to reduce the contribution of the module
// that's causing the false positives
function autoTuneWeights(recentFeedback: Feedback[]): Weights {
  const moduleAccuracy = calculateAccuracyPerModule(recentFeedback);
  return normalizeWeights(moduleAccuracy);
}
```

---

### `validation-rollback/` — Feature 2.6: Self-Validation & Rollback

**Safety net** — every self-evolution change is:
1. **Tested** against a validation dataset before deployment
2. **Monitored** for 1 hour after deployment
3. **Auto-rolled back** if false positive rate increases by >10%

```typescript
interface EvolutionChange {
  id: string;
  type: 'regex' | 'prompt' | 'pipeline' | 'threshold' | 'model';
  previous: any;           // The old value (for rollback)
  proposed: any;           // The new value
  validationScore: number; // Score on test dataset
  deployedAt?: Date;
  rolledBackAt?: Date;
  status: 'proposed' | 'testing' | 'deployed' | 'monitoring' | 'validated' | 'rolled_back';
}
```

### Architecture
```
Analyst Feedback (Feature 17) ──┐
Attack Data (Feature 04) ───────┼──→ Evolution Agent ──→ Proposed Changes
Historical Patterns ────────────┘         │
                                          ↓
                                    Validation Tests
                                          │
                                    ┌─────┴─────┐
                                    │ Pass       │ Fail
                                    ↓            ↓
                              Deploy Change   Discard
                                    │
                              Monitor (1hr)
                                    │
                              ┌─────┴─────┐
                              │ Stable     │ Degraded
                              ↓            ↓
                           Validate     Rollback
```

### Tech Stack
- **Node.js / TypeScript** — evolution orchestrator
- **Ollama + Mistral** — generates new regex, prompts, and code
- **Redis** — hot-reload changes to gateway
- **MongoDB** — evolution history + rollback snapshots
- **Git-like versioning** — track all changes with diffs

### Integration Points
- **Receives from:** Feature 17 (Human Triage) — analyst feedback drives evolution
- **Modifies:** Feature 01 (Gateway regex), Feature 01 (LLM prompts), Feature 07 (Fidelity weights), Feature 11 (Model weights)
- **Monitored by:** Feature 14 (Learning Dashboard) — shows what changed and why

### The Key Innovation
Traditional systems: Human writes rules → System applies rules  
ARIA: System writes rules → Human approves rules → System applies rules → System monitors results → System writes better rules

The human is always in the loop, but the **creative work** (writing new detection logic) is done by the AI.
