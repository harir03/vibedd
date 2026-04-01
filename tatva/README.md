# 🔱 TATVA — AI-Powered Global Ontology Engine

> **India Innovated Hackathon 2026** | Total Awareness through Temporal Validated Analysis
>
> *From Data to Decisions — The World's Intelligence, Connected.*

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Java 21](https://img.shields.io/badge/Java-21-orange.svg)](https://openjdk.org/projects/jdk/21/)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![Neo4j 5](https://img.shields.io/badge/Neo4j-5.x-008CC1.svg)](https://neo4j.com)
[![Spring Boot 3.3](https://img.shields.io/badge/Spring_Boot-3.3-6DB33F.svg)](https://spring.io)

---

## 🌍 The Problem

The world generates **2.5 quintillion bytes of data daily** — treaties are signed, sanctions imposed, supply chains shift, technologies emerge, climates change, and societies transform. But this intelligence lives in **isolated silos**:

- **Geopolitical** analysis teams don't see the **economic** ripple effects of a trade embargo.
- **Defense** analysts miss the **technology transfer** patterns hidden in patent filings.
- **Climate** researchers can't connect environmental degradation to **migration and social instability**.
- **Policy-makers** rely on 200-page PDF reports instead of a **live, queryable knowledge mesh**.

> **Information is everywhere. Understanding is nowhere.**

India — the world's most populous nation, a rising geopolitical power, and a digital-first economy — **cannot afford blind spots**. From Galwan to CHIPS Act to COP30, every global event cascades into India's strategy. Yet our intelligence apparatus runs on **fragmented databases, keyword searches, and manual correlation**.

---

## 💡 Our Solution: TATVA

**TATVA** is an AI-powered **Global Ontology Engine** that:

1. **COLLECTS** structured data (government datasets, economic indicators, defense databases), unstructured content (news articles, research papers, social media, speeches), and live real-time feeds (RSS, APIs, satellite data, IoT sensors) — across **6 strategic domains**.

2. **UNDERSTANDS** the content through multi-layer NLP: Named Entity Recognition, Relationship Extraction, Temporal Parsing, Sentiment Analysis, Causal Inference, and Contradiction Detection — powered by fine-tuned transformers and open-source LLMs.

3. **CONNECTS** everything into a single, unified, **constantly-updating Knowledge Graph** — a living ontology where every entity (person, organization, country, event, technology, resource) is linked to every other through typed, timestamped, confidence-scored relationships.

4. **REASONS** over the graph using multi-hop traversal, causal chain analysis, anomaly detection, influence propagation, and predictive modeling — to surface **insights humans would miss**.

5. **DELIVERS** clear, actionable intelligence through natural language queries, interactive graph exploration, strategic dashboards, automated alerts, and exportable reports — so **decision-makers can act, not just read**.

### 🎯 Six Strategic Domains

| Domain | Example Entities | Example Insights |
|--------|-----------------|-----------------|
| 🌐 **Geopolitics** | Leaders, treaties, sanctions, diplomatic relations | "How does the India-UAE CEPA affect India's position in BRICS?" |
| 💰 **Economics** | Trade flows, GDP, supply chains, commodities | "Which Indian industries are most exposed to rare earth supply from China?" |
| 🛡️ **Defense** | Military deployments, arms deals, alliances, conflicts | "Map the network of defense agreements in the Indo-Pacific since 2020" |
| 💻 **Technology** | Patents, research papers, tech transfers, cyber threats | "Track semiconductor supply chain shifts post-CHIPS Act" |
| 🌍 **Climate** | Emissions, disasters, climate agreements, resources | "Correlate monsoon anomalies with agricultural output and migration patterns" |
| 👥 **Society** | Demographics, migration, public health, education | "How does the brain drain from tier-2 cities correlate with IT sector growth?" |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TATVA — SYSTEM ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    🌐 DATA INGESTION LAYER                         │    │
│  │                                                                     │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │    │
│  │  │ RSS/Atom  │ │ REST API │ │ Web      │ │ Gov Data │ │ Realtime │ │    │
│  │  │ Feeds     │ │ Clients  │ │ Scrapers │ │ Portals  │ │ Streams  │ │    │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │    │
│  │       └─────────────┴────────────┴────────────┴────────────┘       │    │
│  │                              │                                      │    │
│  │                     ┌────────▼────────┐                             │    │
│  │                     │   Apache Kafka   │                             │    │
│  │                     │  Event Backbone  │                             │    │
│  │                     └────────┬────────┘                             │    │
│  └──────────────────────────────┼──────────────────────────────────────┘    │
│                                 │                                           │
│  ┌──────────────────────────────▼──────────────────────────────────────┐    │
│  │                  🧠 AI/NLP PROCESSING LAYER                        │    │
│  │                                                                     │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────────────────────┐  │    │
│  │  │ Entity    │ │ Relation  │ │ Temporal  │ │ Sentiment +        │  │    │
│  │  │ Extraction│ │ Mining    │ │ Parsing   │ │ Classification     │  │    │
│  │  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬──────────────┘  │    │
│  │        └──────────────┴─────────────┴─────────────┘                │    │
│  │                              │                                      │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────┐  │    │
│  │  │ Entity    │ │ Credibility│ │ Contradic-│ │ Causal Inference  │  │    │
│  │  │ Resolution│ │ Scoring   │ │ tion Det. │ │ & LLM Reasoning   │  │    │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────────────┘  │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                           │
│  ┌──────────────────────────────▼──────────────────────────────────────┐    │
│  │               🕸️ KNOWLEDGE GRAPH LAYER (Neo4j)                     │    │
│  │                                                                     │    │
│  │  Actors ──(ALLIES_WITH)──▶ Actors                                  │    │
│  │  Events ──(CAUSED_BY)────▶ Events                                  │    │
│  │  Actors ──(INVOLVED_IN)──▶ Events                                  │    │
│  │  Tech   ──(TRANSFERS_TO)─▶ Countries                               │    │
│  │  Policies ──(IMPACTS)────▶ Metrics                                 │    │
│  │                                                                     │    │
│  │  Every edge: confidence_score, source_ids[], valid_from, valid_to  │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                           │
│  ┌──────────────────────────────▼──────────────────────────────────────┐    │
│  │              📊 ANALYTICS & REASONING ENGINE                       │    │
│  │                                                                     │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────┐  │    │
│  │  │ Graph     │ │ Anomaly   │ │ Influence │ │ Predictive        │  │    │
│  │  │ Algorithms│ │ Detection │ │ Propagation│ │ Modeling          │  │    │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────────────┘  │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────────────────────────────┐│    │
│  │  │ Community │ │ Narrative │ │ Strategic Impact Assessment       ││    │
│  │  │ Detection │ │ Tracking  │ │ "If X happens → cascade effects" ││    │
│  │  └───────────┘ └───────────┘ └───────────────────────────────────┘│    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                           │
│  ┌──────────────────────────────▼──────────────────────────────────────┐    │
│  │              🖥️ INTELLIGENCE DELIVERY LAYER                        │    │
│  │                                                                     │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────┐ │    │
│  │  │ Interactive  │ │ NL Query     │ │ Strategic    │ │ Automated │ │    │
│  │  │ Graph        │ │ Interface    │ │ Dashboard    │ │ Alerts    │ │    │
│  │  │ Explorer     │ │ (Ask TATVA)  │ │ (Analytics)  │ │ & Reports │ │    │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └───────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  🔐 CROSS-CUTTING: Auth (OAuth2) │ Audit Trail │ i18n │ RBAC      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Core Components & Microservices

### Backend Services (Java 21 + Spring Boot 3.3)

| Service | Port | Responsibility |
|---------|------|---------------|
| **api-gateway** | 8080 | Central gateway, JWT auth, rate limiting, routing |
| **ingestion-service** | 8081 | RSS/API/scraper orchestration, deduplication, Kafka publishing |
| **graph-service** | 8082 | Neo4j CRUD, ontology management, entity CRUD, relationship CRUD |
| **search-service** | 8083 | Full-text search (Elasticsearch), vector similarity, faceted search |
| **analytics-service** | 8084 | Graph algorithms, trend detection, anomaly detection, predictions |
| **alert-service** | 8085 | Real-time notifications (WebSocket, email, SMS), threshold alerts |
| **audit-service** | 8086 | Immutable audit log, provenance tracking, compliance reports |

### ML/NLP Services (Python 3.12 + FastAPI)

| Service | Port | Responsibility |
|---------|------|---------------|
| **nlp-service** | 8000 | NER, relation extraction, temporal parsing, classification, embeddings |
| **reasoning-service** | 8001 | LLM orchestration, NL→Cypher query translation, causal reasoning, Q&A |

### Frontend (Next.js 14 + TypeScript)

| App | Description |
|-----|-------------|
| **Intelligence Dashboard** | Built on [dashboard_template](https://github.com/jrdevadattan/dashboard_template), extended with graph explorer (Cytoscape.js), geospatial (react-globe.gl + 2D WorldMap), analytics (Recharts), and NL query interface |

### 🎭 Dual-Panel Demo Architecture

TATVA ships with **two user-facing panels** to guarantee a flawless hackathon demo:

| Panel | Purpose | Data Source | URL |
|-------|---------|-------------|-----|
| **🟢 Live Panel** | Real demo in front of judges. RSS feeds ingested in real-time, NLP pipeline extracts entities, graph updates live. | Live pipeline → Kafka → NLP → Neo4j | `/live` |
| **🔵 Mock Panel** | Pre-loaded with realistic, curated geopolitical data. All features work identically but against a rich, pre-seeded dataset. Fallback if live pipeline has issues. | Mock API server → seeded Neo4j subgraph + JSON fixtures | `/mock` |

**Why two panels?**
- **Judges see the live pipeline** working end-to-end (RSS → NLP → Graph → Dashboard in <60s)
- **If anything breaks during live demo**, seamlessly switch to mock panel — identical UI, pre-loaded data
- **No hardcoded data in components** — both panels use the same API interfaces. The only difference is the data source backing them
- Mock data is served through a `MockDataProvider` that implements the same service interfaces as the live services

```
┌─────────────────────────────────────────────────────┐
│                   TATVA FRONTEND                     │
│                                                       │
│  ┌────────────────────┐  ┌────────────────────────┐  │
│  │  🟢 LIVE PANEL     │  │  🔵 MOCK PANEL         │  │
│  │  /live/*           │  │  /mock/*               │  │
│  │                    │  │                        │  │
│  │  Same components   │  │  Same components       │  │
│  │  Same API calls    │  │  Same API calls        │  │
│  │  ↓                 │  │  ↓                     │  │
│  │  Live API Gateway  │  │  Mock Data Provider    │  │
│  │  ↓                 │  │  ↓                     │  │
│  │  Real services     │  │  JSON fixtures +       │  │
│  │  Real Neo4j        │  │  Seeded Neo4j subgraph │  │
│  └────────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Dashboard Template Mapping (from [jrdevadattan/dashboard_template](https://github.com/jrdevadattan/dashboard_template))

| Template Component | TATVA Adaptation |
|-------------------|------------------|
| `Sidebar` (nav) | TATVA sidebar: Dashboard, Graph Explorer, Ask TATVA, Domains, Alerts, Sources, Reports, Audit Log |
| `Header` (breadcrumbs) | TATVA header: Logo, breadcrumbs, panel toggle (Live/Mock), user profile |
| `StatCard` (KPI) | Entity counts, ingestion rate, NLP accuracy, credibility avg, alert count |
| `TrafficAnalysis` (stats) | Domain Analytics: entities by domain, ingestion trends, source reliability |
| `GeoLocation` (3D globe + 2D) | Geospatial Intelligence: military deployments, conflict zones, trade routes |
| `DonutChartCard` | Entity type distribution, domain distribution, source tier breakdown |
| `ProgressBarCard` | Top entities by connections, credibility distribution, trending topics |
| `SecurityTable` | Audit log table, alert history, ingestion run history |
| `TrafficChart` (area) | Ingestion rate over time, entity creation timeline |
| `DetailsModal` (animated) | Entity detail modal with credibility, sources, relationships |
| `SecurityPosture` | System health: NLP accuracy, entity resolution quality, pipeline status |
| `DataDashboard` (logs table) | Raw ingestion logs, NLP output logs, query logs |
| `ApplicationCard` | Data source cards (RSS feeds, APIs, scrapers) with status |

---

## 🔬 The TATVA Ontology Model

### Entity Types (Graph Nodes)

```
┌────────────────────────────────────────────────────────────────┐
│                    TATVA ENTITY TAXONOMY                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ACTOR                          EVENT                          │
│  ├─ Person                      ├─ GeopoliticalEvent           │
│  │  (leader, official,          │  (summit, coup, election,    │
│  │   scientist, activist)       │   referendum, sanction)      │
│  ├─ Organization                ├─ MilitaryEvent               │
│  │  (govt, corp, NGO, think     │  (conflict, exercise, deploy)│
│  │   tank, university, media)   ├─ EconomicEvent               │
│  ├─ MilitaryUnit                │  (trade deal, crash, IPO)    │
│  │  (army, navy, air force,     ├─ TechEvent                   │
│  │   special forces, alliance)  │  (launch, breach, discovery) │
│  └─ IntelligenceAgency          ├─ ClimateEvent                │
│                                 │  (disaster, COP, agreement)  │
│  LOCATION                       └─ SocialEvent                 │
│  ├─ Country                        (protest, migration, health)│
│  ├─ Region / State                                             │
│  ├─ City                        RESOURCE                       │
│  ├─ MilitaryBase                ├─ NaturalResource             │
│  ├─ WaterBody                   ├─ Commodity (oil, gas, wheat) │
│  ├─ Territory (disputed)        ├─ Technology / WeaponSystem   │
│  └─ Infrastructure              ├─ Patent / IP                 │
│     (port, pipeline, cable)     └─ Currency / FinancialInst.   │
│                                                                │
│  DOCUMENT                       CONCEPT                        │
│  ├─ Treaty / Agreement          ├─ Ideology / Doctrine         │
│  ├─ Legislation / Policy        ├─ Strategy / Initiative       │
│  ├─ Report / WhitePaper         ├─ Threat (cyber, bio, nuclear)│
│  ├─ Speech / Statement          └─ Standard / Framework        │
│  ├─ NewsArticle / Analysis                                     │
│  └─ ResearchPaper / Patent      METRIC                         │
│                                 ├─ EconomicIndicator (GDP,CPI) │
│                                 ├─ MilitaryStrength             │
│                                 ├─ DevelopmentIndex (HDI,GII)  │
│                                 ├─ EnvironmentalMetric          │
│                                 └─ TechReadiness (AI index)    │
└────────────────────────────────────────────────────────────────┘
```

### Relationship Types (Graph Edges)

Every edge in TATVA carries:
- `confidence` (0.0–1.0) — how reliable is this relationship?
- `source_ids[]` — which documents/feeds corroborate this?
- `valid_from` / `valid_to` — temporal scope (when was this true?)
- `sentiment` (-1.0 to 1.0) — is this a positive or negative relationship?
- `extraction_method` — NLP-auto, human-verified, or rule-based

```
POLITICAL        ECONOMIC         MILITARY          TECHNOLOGY
─────────        ────────         ────────          ──────────
ALLIES_WITH      TRADES_WITH      DEPLOYS_IN        DEVELOPS
OPPOSES          INVESTS_IN       ARMS              TRANSFERS_TO
SANCTIONS        EMBARGOES        ATTACKS           PATENTS
RECOGNIZES       FUNDS            DEFENDS           COLLABORATES_ON
MEDIATES         SUPPLIES         EXERCISES_WITH    COMPETES_WITH
INFLUENCES       INDEBTS          THREATENS         DEPENDS_ON

GEOGRAPHIC       TEMPORAL         INFORMATIONAL     CAUSAL
──────────       ────────         ─────────────     ──────
LOCATED_IN       PRECEDED_BY      REPORTS_ON        CAUSES
BORDERS          FOLLOWED_BY      CITES             ENABLES
CLAIMS           CONCURRENT_WITH  CONTRADICTS       PREVENTS
OCCUPIES         ESCALATED_INTO   CORROBORATES      CORRELATES_WITH
OPERATES_IN      EVOLVED_FROM     CLASSIFIES        CASCADES_INTO
```

### Entity Properties (Common)

```json
{
  "id": "uuid",
  "canonical_name": "string",
  "aliases": ["string"],
  "type": "EntityType",
  "subtype": "string",
  "description": "string",
  "domain": "geopolitics|economics|defense|technology|climate|society",
  "first_seen": "ISO-8601",
  "last_updated": "ISO-8601",
  "credibility_score": 0.0-1.0,
  "source_count": "int",
  "embedding_vector": [float],
  "metadata": { "key": "value" },
  "tags": ["string"],
  "language": "ISO-639-1"
}
```

---

## 🛠️ Technology Stack

### Backend & Data Layer

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **API Gateway** | Spring Cloud Gateway | Routing, auth, rate limiting, circuit breaking |
| **Microservices** | Java 21 + Spring Boot 3.3 | Service logic, REST APIs, Kafka consumers |
| **Knowledge Graph** | Neo4j 5.x (Community/Enterprise) | Ontology storage, Cypher queries, graph algorithms |
| **Relational DB** | PostgreSQL 16 | User management, audit logs, pipeline metadata |
| **Search Engine** | Elasticsearch 8.x | Full-text search, vector search (kNN), faceted queries |
| **Cache** | Redis 7 | Session cache, query cache, real-time entity state |
| **Message Broker** | Apache Kafka | Event streaming, ingestion pipeline, inter-service comms |
| **Object Storage** | MinIO | Raw documents, PDFs, images, model artifacts |
| **Pipeline Orchestration** | Apache Airflow 2.x | Scheduled ingestion, batch processing, retraining |

### AI/ML & NLP

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **NLP Pipeline** | spaCy 3.7 + custom models | Tokenization, POS tagging, dependency parsing |
| **Named Entity Recognition** | Fine-tuned BERT / IndicBERT | Entity extraction in EN + 12 Indian languages |
| **Relation Extraction** | Fine-tuned RoBERTa | Relationship classification between entities |
| **Vector Embeddings** | sentence-transformers (all-MiniLM-L6) | Semantic search, entity resolution, similarity |
| **LLM Reasoning** | Ollama + Mistral/Llama3 | NL→Cypher, summarization, causal reasoning |
| **LLM Orchestration** | LangChain / LlamaIndex | Prompt chaining, RAG, tool calling |
| **Topic Classification** | Zero-shot (BART-MNLI) | Domain classification (6 domains) |
| **Temporal Parsing** | SUTime / custom rules | Date/time extraction and normalization |
| **Credibility Scoring** | Custom ensemble model | Source reliability × corroboration × recency |

### Frontend & Visualization

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | Next.js 14 (App Router) + TypeScript | SSR, API routes, responsive layout |
| **Dashboard Template** | [jrdevadattan/dashboard_template](https://github.com/jrdevadattan/dashboard_template) | Pre-built Sidebar, Header, StatCard, Tables, Modals |
| **Graph Visualization** | Cytoscape.js | Interactive knowledge graph exploration |
| **Charts & Analytics** | Recharts | Time series, distributions, donut charts, area charts |
| **Geospatial** | react-globe.gl (3D) + Custom WorldMap2D (2D) | 3D/2D globe toggle, country highlighting |
| **Animations** | framer-motion | Modal transitions, tab toggles, layout animations |
| **Icons** | lucide-react | Consistent icon set across all components |
| **Styling** | Tailwind CSS (teal/slate theme) | Consistent, responsive, accessible |
| **State Management** | Redux Toolkit + RTK Query | API caching, real-time updates, dual-panel data routing |
| **i18n** | next-intl | Hindi + English + 12 Indian languages |

### Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Containers** | Docker + Docker Compose | Local dev environment |
| **Orchestration** | Kubernetes (production) | Scalability, auto-healing |
| **CI/CD** | GitHub Actions | Test → Build → Deploy pipeline |
| **Monitoring** | Prometheus + Grafana | Metrics, dashboards, alerting |
| **Tracing** | OpenTelemetry + Jaeger | Distributed tracing across services |
| **Logging** | ELK Stack (Elasticsearch + Logstash + Kibana) | Centralized logging |

---

## 🌟 Key Features & Differentiators

### 1. 🕸️ Living Knowledge Graph
Not a static database — a **constantly evolving intelligence mesh** that updates in real-time as new data flows in. Every entity and relationship carries temporal metadata, so you can query "What was the state of the world at any point in time?"

### 2. 🧠 Multi-Hop Reasoning
Ask: *"What is the connection between a rare earth mine in Congo and India's drone manufacturing program?"*
TATVA traverses: Congo mine → Chinese mining company → rare earth processing → magnet manufacturing → motor components → drone supply chain → Indian defense procurement.

### 3. 📊 Credibility-Scored Facts
Every piece of information has a **credibility score** (0–1) based on:
- Source reliability (tier-1 news > social media > anonymous blog)
- Corroboration count (how many independent sources confirm?)
- Recency (recent reports weighted higher)
- Contradiction penalty (conflicting reports lower the score)

### 4. ⚡ Contradiction Detection
When Source A says "India and Country X signed a defense deal" and Source B says "Negotiations collapsed", TATVA flags the contradiction, shows both sources, and tracks resolution over time.

### 5. 🔮 Causal Chain Analysis
Not just correlations — **actual causal reasoning**: 
*"Semiconductor export ban → chip shortage in China → increased procurement from Taiwan → rising tensions in Taiwan Strait → QUAD response → impact on India's chip fab timeline"*

### 6. 🚨 Anomaly Detection
Identifies unusual patterns in the graph: sudden increase in military exercises near a border, unexpected trade flow changes, emerging technology transfer patterns, coordinated disinformation narratives.

### 7. 🗣️ Natural Language Queries (Ask TATVA)
Decision-makers type questions in plain English or Hindi:
- *"What are India's biggest supply chain vulnerabilities?"*
- *"Show me all defense agreements in the Indo-Pacific signed after 2022"*
- *"How would a Taiwan conflict affect Indian semiconductor imports?"*

TATVA translates NL → Cypher, executes on Neo4j, and returns visual + textual results.

### 8. 📈 Predictive Intelligence
Based on historical graph patterns, trend analysis, and LLM reasoning:
- Predict likelihood of sanctions escalation
- Forecast trade route disruptions
- Estimate technology adoption timelines
- Model alliance formation probability

### 9. 🌐 Multi-Language Intelligence
Process content in **English + 12 Indian languages** using IndicBERT and multilingual models. A Hindi news article about border tensions and an English defense report about the same event get linked to the same graph entities.

### 10. 🇮🇳 India-First Strategic Design
- **Data sovereignty**: All data stored within Indian infrastructure
- **Government-ready**: RBAC, audit trails, DPDPA compliance
- **Indian languages**: Hindi, Tamil, Telugu, Bengali, Marathi, and 7+ more
- **Indian context**: Understands Indian entities (DRDO, ISRO, MEA, NITI Aayog), Indian geography, Indian policy frameworks

### 11. 🎭 Dual-Panel Demo System
Two identical interfaces — one backed by live pipeline, one by curated mock data. **No hardcoded data anywhere.** Both panels consume the same API contracts, ensuring the mock panel is a perfect replica of the real system. Switch between panels with one click.

### 12. 🕐 Temporal Graph Animation
Timeline slider that shows how the knowledge graph evolves over time. "Play" the evolution of India-Pakistan relations from 2020-2026 as an animation. See entities and relationships appear, change, and dissolve.

### 13. 🗺️ Geospatial Intelligence Overlay
3D interactive globe (react-globe.gl) + 2D world map with entity overlay. Military bases, conflict zones, trade routes, undersea cables. Click any location for full context from the knowledge graph.

### 14. 📋 Decision Support Matrix
For major events, auto-generate: What happened? Who is involved? What is India's stake? Options? Risks? Historical precedent? What are other countries doing?

### 15. 🔄 Graph Diff
"Show me what changed in the India-China subgraph between last week and this week" — visual diff of added/removed nodes and edges.

### 16. 👁️ Source Reputation Dashboard
Track which sources have been most accurate over time. Auto-adjust reliability tiers based on historical accuracy.

### 17. 🤝 Collaborative Investigation Boards
Multiple analysts work on the same visual board, pinning entities, drawing connections, adding notes. Like a digital evidence board.

---

## 📡 Data Sources & Ingestion

### Source Categories

| Category | Examples | Update Frequency |
|----------|---------|-----------------|
| **Government Open Data** | data.gov.in, DGFT, RBI, MoD annual reports | Daily / Weekly |
| **International Organizations** | UN, WHO, IMF, World Bank, SIPRI, OECD | Weekly |
| **News & Media** | RSS feeds from 500+ sources (Reuters, PTI, ANI, NDTV, Hindu) | Real-time (< 5 min) |
| **Research & Academia** | arXiv, PubMed, SSRN, think tank reports | Daily |
| **Economic Data** | WTO trade data, commodity prices, stock indices | Real-time / Daily |
| **Defense & Security** | SIPRI arms transfers, IISS military balance, Jane's | Weekly |
| **Patent & Tech** | USPTO, WIPO, EPO patent filings | Daily |
| **Social Media** | Twitter/X firehose (filtered), Reddit (geopolitics) | Real-time |
| **Satellite / Remote Sensing** | ISRO Bhuvan, Sentinel, weather data | Hourly / Daily |
| **Legislative** | Parliament Q&A, Gazette notifications, policy docs | Daily |

### Ingestion Pipeline

```
Source → Connector → Kafka → Deduplication → NLP Pipeline → Entity Resolution → Graph Upsert → Index Update
         │                                      │                    │
         └── Raw document → MinIO               └── Embeddings → Elasticsearch (vector)
```

### Kafka Topics

| Topic | Partitions | Retention | Purpose |
|-------|-----------|-----------|---------|
| `raw.news.articles` | 12 | 30 days | Incoming news articles |
| `raw.gov.data` | 6 | 90 days | Government data feeds |
| `raw.research.papers` | 6 | 90 days | Academic content |
| `raw.social.media` | 24 | 7 days | Social media signals |
| `raw.economic.indicators` | 6 | 365 days | Economic time-series |
| `nlp.entities.extracted` | 12 | 30 days | NLP output entities |
| `nlp.relations.extracted` | 12 | 30 days | NLP output relations |
| `graph.updates` | 6 | 14 days | Graph mutation events |
| `alerts.triggered` | 6 | 30 days | Alert events |
| `audit.events` | 3 | 365 days | Audit trail |

---

## 🗄️ Database Schemas

### Neo4j — Knowledge Graph Schema

```cypher
// Core node labels
(:Actor {id, canonical_name, aliases, type, subtype, description, domain,
         credibility_score, source_count, first_seen, last_updated, embedding})

(:Event {id, canonical_name, type, subtype, description, domain,
         event_date, end_date, location_id, severity, credibility_score})

(:Location {id, canonical_name, type, country_code, coordinates,
            population, geometry_wkt})

(:Resource {id, canonical_name, type, subtype, description,
            strategic_value, current_price, supply_chain_risk})

(:Document {id, title, source_url, published_date, author_id,
            language, content_hash, credibility_score, domain})

(:Concept {id, canonical_name, type, description, domain,
           related_concepts, threat_level})

(:Metric {id, name, value, unit, country_id, measured_date, source_id})

// Indexes
CREATE INDEX FOR (a:Actor) ON (a.canonical_name);
CREATE INDEX FOR (e:Event) ON (e.event_date);
CREATE INDEX FOR (l:Location) ON (l.country_code);
CREATE FULLTEXT INDEX entity_names FOR (n:Actor|Event|Location|Resource|Concept)
  ON EACH [n.canonical_name, n.aliases];

// Constraints
CREATE CONSTRAINT FOR (a:Actor) REQUIRE a.id IS UNIQUE;
CREATE CONSTRAINT FOR (e:Event) REQUIRE e.id IS UNIQUE;
CREATE CONSTRAINT FOR (l:Location) REQUIRE l.id IS UNIQUE;
```

### PostgreSQL — Operational Schema

```sql
-- Users & auth
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin','analyst','viewer','api_consumer')),
    clearance_level INTEGER DEFAULT 0 CHECK (clearance_level BETWEEN 0 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- Ingestion pipeline metadata
CREATE TABLE ingestion_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    url TEXT,
    reliability_tier INTEGER CHECK (reliability_tier BETWEEN 1 AND 5),
    domain VARCHAR(50),
    schedule_cron VARCHAR(100),
    last_successful_run TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE ingestion_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES ingestion_sources(id),
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) CHECK (status IN ('running','success','failed','partial')),
    documents_fetched INTEGER DEFAULT 0,
    entities_extracted INTEGER DEFAULT 0,
    relations_extracted INTEGER DEFAULT 0,
    errors JSONB
);

-- Immutable audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    justification TEXT,
    session_id VARCHAR(255)
);

-- Alert configurations
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL,
    cypher_query TEXT NOT NULL,
    threshold JSONB,
    severity VARCHAR(20) CHECK (severity IN ('info','warning','critical','flash')),
    domain VARCHAR(50),
    notify_channels TEXT[] DEFAULT '{"dashboard"}',
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE
);
```

---

## 🚀 Getting Started

### Prerequisites
- Java 21+
- Python 3.12+
- Node.js 20+
- Docker & Docker Compose
- 16 GB RAM minimum (Neo4j + Elasticsearch are memory-hungry)

### Quick Start

```bash
# Clone
git clone https://github.com/your-team/tatva.git
cd tatva

# Start infrastructure (Neo4j, PostgreSQL, Elasticsearch, Kafka, Redis, MinIO)
docker compose up -d

# Backend services
cd backend && ./mvnw clean install -DskipTests
# Start each service (or use docker compose)

# ML/NLP Engine
cd ml-engine && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.api.main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend/intelligence-dashboard && npm install && npm run dev
```

### Project Structure

```
tatva/
├── README.md
├── TIER-LIST.md                        # Implementation roadmap
├── docker-compose.yml
├── .github/
│   └── copilot-instructions.md         # AI dev rules + 5-perspective review
├── backend/
│   ├── pom.xml                         # Parent POM (Java 21, Spring Boot 3.3)
│   ├── api-gateway/                    # Spring Cloud Gateway
│   ├── ingestion-service/              # Data collection & dedup
│   ├── graph-service/                  # Neo4j operations
│   ├── search-service/                 # Elasticsearch queries
│   ├── analytics-service/              # Graph algorithms & trends
│   ├── alert-service/                  # Real-time notifications
│   └── audit-service/                  # Immutable audit trail
├── ml-engine/
│   ├── nlp-service/                    # NER, relation extraction, embeddings
│   └── reasoning-service/              # LLM orchestration, NL→Cypher
├── frontend/
│   └── intelligence-dashboard/         # Next.js 14 (from dashboard_template)
│       ├── src/app/                    # Pages: dashboard, graph, ask-tatva, domains, alerts
│       ├── src/components/dashboard/   # StatCard, GeoLocation, Charts (from template)
│       ├── src/components/graph/       # Cytoscape graph explorer (custom)
│       ├── src/components/tatva/       # Ask TATVA, Entity Cards, Timeline (custom)
│       ├── src/providers/              # LiveDataProvider, MockDataProvider
│       └── src/services/              # API clients (same interface, dual backing)
├── ontology/
│   ├── schema/                         # Neo4j schema definitions
│   └── seed-data/                      # Initial entities & relationships
├── infrastructure/
│   ├── docker-compose.yml
│   ├── init-db/                        # PostgreSQL init scripts
│   ├── neo4j/                          # Neo4j config & plugins
│   ├── elasticsearch/                  # ES config & mappings
│   └── airflow/                        # DAG definitions
└── docs/
    ├── architecture.md
    ├── ontology-guide.md
    └── api-reference.md
```

---

## 📋 API Reference (Key Endpoints)

### Graph Service (`/api/v1/graph`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/entities` | Create/upsert an entity |
| `GET` | `/entities/{id}` | Get entity with relationships |
| `GET` | `/entities/{id}/neighborhood` | Get N-hop neighborhood |
| `POST` | `/relationships` | Create a relationship |
| `GET` | `/paths/{from}/{to}` | Find shortest path between entities |
| `POST` | `/query/cypher` | Execute raw Cypher query (admin only) |

### Search Service (`/api/v1/search`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/text` | Full-text search across all entities/documents |
| `POST` | `/semantic` | Vector similarity search |
| `POST` | `/faceted` | Faceted search with domain/type/date filters |

### NLP Service (`/api/v1/nlp`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/extract` | Extract entities + relations from text |
| `POST` | `/classify` | Classify text by domain + topic |
| `POST` | `/embed` | Generate embedding vector for text |
| `POST` | `/resolve` | Resolve entity mentions to graph nodes |

### Reasoning Service (`/api/v1/reason`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/query` | Natural language query → graph answer |
| `POST` | `/summarize` | Summarize entity or topic |
| `POST` | `/causal-chain` | Trace causal chain between events |
| `POST` | `/impact-assessment` | "What if X happens?" analysis |

### Analytics Service (`/api/v1/analytics`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/trends/{domain}` | Trending entities/topics by domain |
| `GET` | `/anomalies` | Recently detected anomalies |
| `POST` | `/influence/{entityId}` | Influence propagation from entity |
| `GET` | `/communities` | Detected actor communities/clusters |

---

## 🏆 Hackathon Demo Flow

For the **India Innovated 2026** demo — TWO PANELS, ZERO HARDCODED DATA:

### Phase A: Mock Panel (Show rich, pre-loaded intelligence — 5 min)
```
□ A1. Open MOCK PANEL → domain landing page with 6 domain cards, KPIs, "What's New?"
□ A2. GRAPH EXPLORER: Click "India" → see 50+ relationships → filter by defense domain
□ A3. MULTI-HOP: "Connection between Adani and Australia" → visual path with 4 hops
□ A4. NL QUERY: "India defense deals 2025" → graph + text answer + credibility scores
□ A5. CONTRADICTION: Two conflicting sources flagged with comparison view
□ A6. TEMPORAL: "India-China timeline 2020-2025" → animated timeline slider
□ A7. GEOSPATIAL: Military deployments on 3D globe → click for context
□ A8. REPORT: "Generate Brief" → formatted PDF with all sections in <30s
□ A9. DARK MODE: Toggle → full theme switch
```

### Phase B: Live Panel (Show real-time pipeline — 5 min)
```
□ B1. Switch to LIVE PANEL → show empty/sparse graph (just started)
□ B2. LIVE INGESTION: RSS feed article → entity extracted → graph updated (<60s)
□ B3. Show NLP output: extracted entities, relations, confidence scores
□ B4. CREDIBILITY: Click ingested fact → source tier + credibility score computation
□ B5. ANOMALY: Simulated unusual pattern → real-time alert notification
□ B6. Hindi: Ingest Hindi news → entities extracted → same entities as English
□ B7. CAUSAL CHAIN: "Impact of CHIPS Act" → cascading effects visualization
□ B8. Show both panels side-by-side — same UI, same APIs, different data backing
```

---

## 🔐 Security & Compliance

| Requirement | Implementation |
|-------------|---------------|
| **Authentication** | OAuth 2.0 + JWT, MFA for admin roles |
| **Authorization** | Role-Based Access Control (RBAC) with clearance levels (0–5) |
| **Data Sovereignty** | All data within Indian infrastructure (NIC Cloud / Indian DC) |
| **Audit Trail** | Every action logged immutably (user, action, timestamp, justification) |
| **DPDPA Compliance** | No personal data collected without consent, right to erasure |
| **API Security** | Rate limiting, API keys, IP whitelisting for government consumers |
| **Encryption** | TLS 1.3 in transit, AES-256 at rest, encrypted Neo4j |
| **Network** | Service mesh with mTLS between microservices |

---

## 👥 Team

| Role | Responsibility |
|------|---------------|
| **Full-Stack Architect** | System design, backend services, DevOps |
| **AI/ML Engineer** | NLP pipeline, LLM integration, model training |
| **Frontend Engineer** | Intelligence dashboard, graph visualization |
| **Domain Expert** | Ontology design, seed data, validation |

---

## 📄 License

MIT License — Open source, government-procurement friendly.

---

*TATVA — Because the world's complexity demands a system that can see all of it, connect all of it, and explain all of it.*

*India Innovated Hackathon 2026 | Team TATVA*