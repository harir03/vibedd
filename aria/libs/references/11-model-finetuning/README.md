# 11 — Model Finetuning

**Tier:** 2 (Primary WOW Factor)  
**Status:** TO BUILD (reference files included)  
**Priority:** 2.3

## What This Does

**Finetunes the Ollama/Mistral model** with confirmed threat data so the LLM gets better at recognizing banking-specific attacks. Instead of using a generic LLM, ARIA creates a **specialized banking security model** that learns from every incident the analysts confirm.

### Why It Matters
A generic Mistral model knows about security in general, but not about YOUR specific banking environment. After finetuning:
- It knows your API endpoint patterns
- It recognizes your specific attack patterns
- It understands your business context (transactions, accounts, etc.)
- False positive rate drops significantly

### Reference Files Included

| File | From | Why It's Here |
|------|------|---------------|
| `ollama-reference.ts` | `maf-app/src/lib/ollama.ts` | Shows Ollama API integration: pulling models, creating custom models with system prompts, checking model status |
| `actions-reference.ts` | `maf-app/src/app/policy/actions.ts` | Shows `createPolicyModel()` — creates a new Ollama model from a base model + custom system prompt (Modelfile pattern) |

### Finetuning Approaches (From Simple to Advanced)

#### Level 1: Prompt-Based Customization (Easiest — START HERE)
Use Ollama's Modelfile to create a custom model with a banking-specific system prompt:
```
FROM mistral
SYSTEM """
You are ARIA, a banking cybersecurity threat analyst.
You analyze HTTP requests to banking APIs and determine if they are malicious.

Known attack patterns for this environment:
- Account enumeration via sequential account IDs: /api/accounts/1001, /api/accounts/1002, ...
- Credential stuffing: rapid POST /auth/login with different credentials
- SQL injection in transaction queries: /api/transactions?filter='; DROP TABLE--
[... patterns learned from confirmed incidents ...]

Respond with: { "threat": true/false, "confidence": 0-1, "category": "...", "reasoning": "..." }
"""
```

This is what `actions-reference.ts` already does! Just change the system prompt to include confirmed threat patterns.

#### Level 2: Few-Shot Learning (Medium)
Include confirmed examples in the prompt:
```
Here are examples of confirmed attacks:
INPUT: POST /api/transfer {"from":"1001","to":"9999","amount":"999999"}
OUTPUT: {"threat":true,"confidence":0.95,"category":"fraudulent_transfer","reasoning":"Unusually large transfer to unknown account"}

Here are examples of confirmed safe requests:
INPUT: GET /api/balance/1001
OUTPUT: {"threat":false,"confidence":0.98,"category":"normal","reasoning":"Standard balance check during business hours"}
```

#### Level 3: LoRA Finetuning (Advanced — Tier 4)
Use unsloth + LoRA to actually modify model weights:
```python
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained("mistral-7b")

# Train on confirmed incident data
training_data = [
    {"input": attack_payload, "output": analyst_classification}
    for attack_payload, analyst_classification in confirmed_incidents
]

# LoRA only modifies ~1% of weights — fast training, small model delta
model = FastLanguageModel.get_peft_model(model, r=16, lora_alpha=16)
trainer = SFTTrainer(model=model, train_dataset=training_data, ...)
trainer.train()

# Export and load into Ollama
model.save_pretrained("aria-banking-v1")
```

### Architecture
```
Confirmed Incidents (Feature 17) → Training Data Curator → Finetuning Pipeline
                                                          → Level 1: Update system prompt
                                                          → Level 2: Update few-shot examples
                                                          → Level 3: LoRA weight update
                                                          → New Model Version → Ollama reload
                                                          → Validation against test set
                                                          → Rollback if accuracy drops
```

### Tech Stack
- **Ollama API** — model management (create, pull, generate)
- **Node.js** — Level 1 & 2 (prompt/example management)
- **Python + unsloth** — Level 3 (LoRA finetuning, needs GPU)
- **MongoDB** — training data storage, model version history

### Integration Points
- **Receives from:** Feature 17 (Human Triage) — confirmed incident data for training
- **Modifies:** Feature 01 (Gateway) — the model used for LLM analysis
- **Orchestrated by:** Feature 10 (Self-Evolving Agent) — decides when to retrain
- **Monitored by:** Feature 14 (Learning Dashboard) — model accuracy over time
- **Validated by:** Feature 10/validation-rollback — test before deploy

### Hackathon Strategy
**Start with Level 1** (prompt customization via Modelfile). It takes 5 minutes to implement using the existing `createPolicyModel()` pattern. Show that confirmed threats automatically get added to the system prompt. Level 2 (few-shot) is the next step if time allows. Level 3 is impressive but requires GPU and significant setup time.
