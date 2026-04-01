# 📦 TATVA Mock Data Fixtures

> Realistic geopolitical mock data for the 🔵 Mock Panel.

## Data Dictionary

### Entity Types

| Type | Count | Description |
|------|-------|-------------|
| `Actor` | ~55 | People, organizations, govt bodies, military units, intel agencies |
| `Event` | ~35 | Summits, conflicts, elections, agreements, sanctions, exercises |
| `Location` | ~45 | Countries, cities, regions, bases, disputed territories, water bodies |
| `Technology` | ~15 | Weapon systems, platforms, cyber tools, satellites |
| `Resource` | ~10 | Commodities, currencies, energy sources |
| `Document` | ~10 | Treaties, legislation, reports |

**Total**: ~170 entities

### Relationship Types

| Type | Description | Example |
|------|-------------|---------|
| `ALLIES_WITH` | Military/diplomatic alliance | India ↔ USA |
| `SANCTIONS` | Economic sanctions | USA → Russia |
| `TRADES_WITH` | Trade relationship | India → UAE |
| `DEPLOYS_IN` | Military deployment | India → Ladakh |
| `LEADS` | Leadership of org/country | Modi → India |
| `MEMBER_OF` | Membership in alliance/org | India → QUAD |
| `PARTICIPATES_IN` | Participation in event | India → G20 Summit |
| `MANUFACTURES` | Produces technology | DRDO → BrahMos |
| `BORDERS` | Geographic adjacency | India → China |
| `OPERATES_IN` | Organization active in region | RAW → South Asia |
| `SUPPLIES_TO` | Arms/resource supply | Russia → India |
| `COMPETES_WITH` | Strategic competition | India ↔ China |
| `PRECEDED_BY` | Temporal event sequence | Event B ← Event A |
| `FOLLOWED_BY` | Temporal event sequence | Event A → Event B |
| `LOCATED_IN` | Entity location | DRDO → New Delhi |
| `SIGNED_BY` | Treaty signatory | India → Indo-Pacific Pact |
| `AFFECTS` | Impact relationship | CHIPS Act → India |
| `THREATENS` | Threat posture | China → Taiwan |
| `SUPPORTS` | Diplomatic support | Russia → India |
| `OPPOSES` | Diplomatic opposition | China → QUAD |

**Total**: ~180 relationships

### Domains

| Domain | Color | Entities | Description |
|--------|-------|----------|-------------|
| Geopolitics | 🔵 Blue | ~45 | International relations, diplomacy, alliances |
| Economics | 🟢 Green | ~25 | Trade, finance, sanctions, markets |
| Defense | 🔴 Red | ~35 | Military, weapons, deployments, exercises |
| Technology | 🟣 Purple | ~20 | Cyber, space, AI, semiconductors |
| Climate | 🟠 Orange | ~15 | Climate events, agreements, disasters |
| Society | 🟡 Yellow | ~15 | Elections, social movements, demographics |

### Source Tiers

| Tier | Reliability | Examples |
|------|------------|---------|
| T1 (0.9) | Official/Wire | Reuters, PTI, GoI press releases |
| T2 (0.7) | Major National | The Hindu, NDTV, Times of India |
| T3 (0.5) | Regional | Regional dailies, domain-specific outlets |
| T4 (0.3) | Blogs | Think tank blogs, personal analysis |
| T5 (0.1) | Social Media | Anonymous tweets, unverified posts |

### Credibility Formula

```
credibility = 0.35 * source_reliability
            + 0.30 * corroboration_score
            + 0.15 * recency_score
            - 0.20 * contradiction_penalty
```

## File Structure

```
mock-data/
├── README.md                           ← You are here
├── fixtures/
│   ├── entities/
│   │   ├── actors.json                 ← People, orgs, agencies (55+)
│   │   ├── events.json                 ← Summits, conflicts, agreements (35+)
│   │   └── locations.json              ← Countries, cities, bases (45+)
│   ├── relationships/
│   │   ├── geopolitics.json            ← Alliance, diplomacy relations
│   │   ├── defense.json                ← Military, deployment relations
│   │   ├── economics.json              ← Trade, sanctions relations
│   │   ├── technology.json             ← Tech production, cyber relations
│   │   ├── climate.json                ← Climate event relations
│   │   └── society.json                ← Political, social relations
│   ├── sources.json                    ← 20+ source definitions with tiers
│   └── credibility-samples.json        ← Pre-computed credibility scores
├── seed-neo4j.cypher                   ← Load all mock data into Neo4j
└── seed-elasticsearch.sh               ← Bulk index mock data into ES
```

## Usage

### Load into Neo4j
```bash
cat mock-data/seed-neo4j.cypher | docker exec -i tatva-neo4j cypher-shell -u neo4j -p tatva2026
```

### Load into Elasticsearch
```bash
bash mock-data/seed-elasticsearch.sh
```

### Validate JSON
```bash
for f in mock-data/fixtures/**/*.json; do
  python3 -c "import json; json.load(open('$f'))" && echo "✓ $f"
done
```
