<div align="center">

<img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/nodejs/nodejs.png" height="50" alt="Node.js" />
<img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/react/react.png" height="50" alt="React" />
<img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/python/python.png" height="50" alt="Python" />

# 🛡️ ARIA 
### Adaptive Response & Intelligence Agent

*AI-Powered, Self-Evolving Cyber Incident Response System for Banking*

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Mistral](https://img.shields.io/badge/Mistral_7B-Ollama-blue?style=for-the-badge)](https://ollama.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com/)

[Features](#-implemented-features) · [Roadmap](#-upcoming-features-roadmap) · [Architecture](#-architecture) · [Getting Started](#-quick-start)

</div>

---

## 🌟 What is ARIA?

Most security platforms are **static**—they detect what they're programmed to find. **ARIA** is **alive**. Built for enterprise banking, it acts as a smart reverse proxy that passes traffic through a multi-layered AI pipeline. When an analyst corrects its decisions, ARIA doesn't just learn; **it natively rewrites its own rules, fine-tunes its AI prompts, and recalibrates its detection pipeline.**

---

## ⚡ Core Innovation: The Self-Evolving Engine

**ARIA is the security tool that writes its own code:**
- 🧬 **Self-Evolving Regex:** Generates and hot-swaps new detection patterns based on actual attacks.
- 🧠 **Self-Prompting LLM:** Analyzes false positives and rewrites its own Ollama/Mistral context prompts.
- ⚖️ **Self-Tuning Thresholds:** Adjusts fidelity scoring weights natively based on human-in-the-loop analyst feedback.

---

## ✨ Implemented Features

### 🛡️ Multi-Layered Threat Detection
- **Reverse Proxy Gateway (Fail-Open):** Intercepts HTTP traffic <1ms for regex, ~500ms full pipeline.
- **ML Anomaly Detection:** PyOD ensemble catches zero-day statistical outliers impossible to catch with rules.
- **UEBA Behavioral Analytics:** Tracks IP/user baselines to spot credential stuffing, impossible travel, and privilege escalation.
- **Local LLM Analysis:** Mistral 7B (via Ollama) evaluates context dynamically.

### 🧠 Intelligence & Triage
- **Fidelity Ranking (0-100):** Aggregates insights into a clean score. Zero alert fatigue.
- **Alert Correlation Engine:** Groups isolated warnings into connected MITRE ATT&CK Kill Chain incidents.
- **Human-in-the-loop Triage:** AI suggests blocks/allows; human analysts approve/reject. Every action fuels model learning.
- **Automated Playbook Generation:** Instant, LLM-generated incident response playbooks for NIST/PCI-DSS standards.
- **Predictive Response:** Uses ChromaDB vector embeddings to predict the *next* phase of an ongoing attack.

### 🌐 Next-Gen Dashboard (Next.js 16)
- **3D Interactive Attack Globe:** Real-time visual tracking of threat locations using Three.js.
- **Node-Edge Attack Chains:** Live mapping of lateral threat movements using React Flow.
- **AI Transparency & Learning Dashboard:** See exactly what new rules the AI wrote recently.
- **Natural Language Query (\NL Query\):** Ask your SIEM context questions in plain English.

---

## 🚧 Upcoming Features (Roadmap)

While the core ARIA loop is functioning, the following are actively being engineered:
- [ ] **Plug-and-Play Node.js Middleware SDK (\mafai\)**: A Node package directly integrable into standard Express/Fastify apps to bypass the proxy.
- [ ] **Blockchain Log Immutability (\LogStorage.sol\)**: Writing unchangeable, cryptographically secured logs for high-fidelity compliance audits using Smart Contracts.
- [ ] **Live External SIEM Ingestion (Splunk/Datadog)**: Extending the Redis queue to consume normalized JSON logs from enterprise architectures natively.
- [ ] **Edge-Node Caching for AI Actions**: Caching similar attack responses at the gateway edge to skip the 500ms LLM analysis roundtrip.
- [ ] **Automated Remediation API Hooks**: Directly sending IP ban requests to AWS WAF / Cloudflare from ARIA.

---

## 🏗️ Architecture

\\\mermaid
graph TD;
    Traffic(HTTP Request)-->Proxy[Reverse Proxy Gateway];
    Proxy-->L1[Fast Regex Scanner];
    Proxy-->L2[ML Anomaly PyOD];
    Proxy-->L3[Behavioral UEBA];
    Proxy-->L4[Mistral 7B LLM];
    
    L1 & L2 & L3 & L4 --> Fidelity[Fidelity Scoring];
    Fidelity --> Triage[Human Triage Queue];
    Triage -- "Analyst Decision" --> Feedback[Feedback Loop];
    
    Feedback -- "Write Code" --> Agent[Self-Evolving Agent];
    Agent -- "Update Rules" --> Proxy;
\\\

---

## 🚀 Quick Start

### 1. Fully Dockerized Deployment (Recommended)
You need Docker, Docker Compose, and ideally an NVIDIA GPU (for Ollama speed).

\\\ash
git clone https://github.com/harir03/aria.git
cd aria/infrastructure

# Spin up MongoDB, Redis, Dashboard, Gateway, Ollama, & ChromaDB
docker-compose up -d
\\\

| Service | Port / URL | Description |
| :--- | :--- | :--- |
| **Dashboard** | \http://localhost:3000\ | UI, SIEM, and Map |
| **Gateway** | \http://localhost:80\ | Traffic Interceptor |
| **Ollama** | \http://localhost:11434\ | Inference Engine |

### 2. Seeding Demo Data
To immediately see the dashboard charts, global map, and attack chains in action:

\\\ash
npm run db:seed     # Populates MongoDB with demo attack vectors
npm run dev:dashboard # Runs the dashboard
\\\

---

<div align="center">
<b>Built with 🛡️ by the ARIA Team</b><br/>
<i>Because security should evolve faster than threats.</i>
</div>
