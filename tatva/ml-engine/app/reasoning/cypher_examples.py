"""
TATVA — Cypher Few-Shot Examples.

20+ NL→Cypher example pairs for few-shot prompting.
Covers common patterns: find all, connections, timelines, filtering.
"""

from __future__ import annotations

from typing import Dict, List, Tuple

# Each example: (natural_language, cypher_query)
FEW_SHOT_EXAMPLES: List[Tuple[str, str]] = [
    # ── Find all / list queries ──
    (
        "Find all countries",
        "MATCH (n:Actor) WHERE n.type = $type RETURN n.canonicalName AS name, n.id AS id LIMIT 50",
    ),
    (
        "List all organizations",
        "MATCH (n:Actor) WHERE n.type = $type RETURN n.canonicalName AS name, n.id AS id LIMIT 50",
    ),
    (
        "Show all events",
        "MATCH (n:Event) RETURN n.canonicalName AS name, n.date AS date, n.id AS id ORDER BY n.date DESC LIMIT 50",
    ),
    (
        "Find all defense technologies",
        "MATCH (n:Technology) WHERE n.domain = $domain RETURN n.canonicalName AS name, n.id AS id LIMIT 50",
    ),
    # ── Connection / path queries ──
    (
        "Show connection between India and China",
        "MATCH path = shortestPath((a:Actor)-[*..5]-(b:Actor)) "
        "WHERE a.canonicalName = $entity_a AND b.canonicalName = $entity_b "
        "RETURN path",
    ),
    (
        "How are A and B connected",
        "MATCH path = shortestPath((a:Actor)-[*..5]-(b:Actor)) "
        "WHERE a.canonicalName = $entity_a AND b.canonicalName = $entity_b "
        "RETURN path",
    ),
    (
        "Find path between DRDO and BrahMos",
        "MATCH path = shortestPath((a)-[*..5]-(b)) "
        "WHERE a.canonicalName = $entity_a AND b.canonicalName = $entity_b "
        "RETURN path",
    ),
    # ── Timeline / temporal queries ──
    (
        "Show timeline of India from 2020 to 2025",
        "MATCH (a:Actor)-[r]->(b) "
        "WHERE a.canonicalName = $entity AND r.validFrom >= date($start_date) "
        "AND r.validFrom <= date($end_date) "
        "RETURN a.canonicalName AS source, type(r) AS relationship, "
        "b.canonicalName AS target, r.validFrom AS date "
        "ORDER BY r.validFrom",
    ),
    (
        "What happened after the G20 summit",
        "MATCH (e1:Event)-[:FOLLOWED_BY]->(e2:Event) "
        "WHERE e1.canonicalName = $event_name "
        "RETURN e2.canonicalName AS event, e2.date AS date "
        "ORDER BY e2.date",
    ),
    (
        "Events in 2024",
        "MATCH (e:Event) WHERE e.date >= date($start_date) AND e.date <= date($end_date) "
        "RETURN e.canonicalName AS event, e.date AS date ORDER BY e.date",
    ),
    # ── Relationship type queries ──
    (
        "Who does India trade with",
        "MATCH (a:Actor)-[:TRADES_WITH]->(b:Actor) "
        "WHERE a.canonicalName = $entity "
        "RETURN b.canonicalName AS partner, a.canonicalName AS entity",
    ),
    (
        "What alliances does India have",
        "MATCH (a:Actor)-[:ALLIES_WITH]-(b:Actor) "
        "WHERE a.canonicalName = $entity "
        "RETURN b.canonicalName AS ally",
    ),
    (
        "Show sanctions against Russia",
        "MATCH (a:Actor)-[:SANCTIONS]->(b:Actor) "
        "WHERE b.canonicalName = $entity "
        "RETURN a.canonicalName AS sanctioning_entity",
    ),
    (
        "Where is BrahMos deployed",
        "MATCH (t:Technology)-[:DEPLOYS_IN]->(l:Location) "
        "WHERE t.canonicalName = $entity "
        "RETURN l.canonicalName AS location",
    ),
    (
        "Who leads China",
        "MATCH (p:Actor)-[:LEADS]->(c:Actor) "
        "WHERE c.canonicalName = $entity AND p.type = 'PERSON' "
        "RETURN p.canonicalName AS leader",
    ),
    # ── Aggregation queries ──
    (
        "How many entities are in the defense domain",
        "MATCH (n) WHERE n.domain = $domain "
        "RETURN count(n) AS total",
    ),
    (
        "Top 10 most connected entities",
        "MATCH (n)-[r]-() "
        "RETURN n.canonicalName AS entity, count(r) AS connections "
        "ORDER BY connections DESC LIMIT 10",
    ),
    # ── Neighborhood queries ──
    (
        "Show neighborhood of Modi",
        "MATCH (a:Actor)-[r]-(b) "
        "WHERE a.canonicalName = $entity "
        "RETURN a.canonicalName AS source, type(r) AS rel, "
        "b.canonicalName AS target LIMIT 50",
    ),
    (
        "Entities related to ISRO",
        "MATCH (a)-[r]-(b) "
        "WHERE a.canonicalName = $entity "
        "RETURN a.canonicalName AS source, type(r) AS rel, "
        "b.canonicalName AS target LIMIT 50",
    ),
    # ── Credibility / filtering queries ──
    (
        "Show low credibility facts",
        "MATCH (n) WHERE n.credibilityScore < $threshold "
        "RETURN n.canonicalName AS entity, n.credibilityScore AS score "
        "ORDER BY n.credibilityScore ASC LIMIT 20",
    ),
    # ── Domain-specific queries ──
    (
        "Show geopolitical relationships",
        "MATCH (a:Actor)-[r]->(b:Actor) "
        "WHERE a.domain = $domain OR b.domain = $domain "
        "RETURN a.canonicalName AS source, type(r) AS relationship, "
        "b.canonicalName AS target LIMIT 50",
    ),
    (
        "Military deployments in Asia",
        "MATCH (t:Technology)-[:DEPLOYS_IN]->(l:Location) "
        "WHERE l.region = $region "
        "RETURN t.canonicalName AS technology, l.canonicalName AS location",
    ),
]


def get_examples_text() -> str:
    """Format few-shot examples as prompt text."""
    lines: List[str] = []
    for i, (nl, cypher) in enumerate(FEW_SHOT_EXAMPLES, 1):
        lines.append(f"Example {i}:")
        lines.append(f"  NL: {nl}")
        lines.append(f"  Cypher: {cypher}")
        lines.append("")
    return "\n".join(lines)


# ── Pattern templates for rule-based translation ──
# (regex_pattern, cypher_template, param_extraction_hints)
QUERY_PATTERNS: List[Dict] = [
    {
        "pattern": r"(?:find|list|show)\s+all\s+(\w+)",
        "template": "MATCH (n:{label}) RETURN n.canonicalName AS name, n.id AS id LIMIT 50",
        "confidence": 0.90,
    },
    {
        "pattern": r"(?:show|find)\s+connection(?:s)?\s+between\s+(.+?)\s+and\s+(.+)",
        "template": (
            "MATCH path = shortestPath((a)-[*..5]-(b)) "
            "WHERE a.canonicalName = $entity_a AND b.canonicalName = $entity_b "
            "RETURN path"
        ),
        "confidence": 0.85,
    },
    {
        "pattern": r"(?:show\s+)?timeline\s+of\s+(.+?)\s+from\s+(\d{4})\s+to\s+(\d{4})",
        "template": (
            "MATCH (a)-[r]->(b) "
            "WHERE a.canonicalName = $entity "
            "AND r.validFrom >= date($start_date) "
            "AND r.validFrom <= date($end_date) "
            "RETURN a.canonicalName AS source, type(r) AS relationship, "
            "b.canonicalName AS target, r.validFrom AS date "
            "ORDER BY r.validFrom"
        ),
        "confidence": 0.85,
    },
    {
        "pattern": r"who\s+(?:does|do)\s+(.+?)\s+trade\s+with",
        "template": (
            "MATCH (a:Actor)-[:TRADES_WITH]->(b:Actor) "
            "WHERE a.canonicalName = $entity "
            "RETURN b.canonicalName AS partner"
        ),
        "confidence": 0.85,
    },
    {
        "pattern": r"(?:show|find)\s+neighborhood\s+of\s+(.+)",
        "template": (
            "MATCH (a)-[r]-(b) WHERE a.canonicalName = $entity "
            "RETURN a.canonicalName AS source, type(r) AS rel, "
            "b.canonicalName AS target LIMIT 50"
        ),
        "confidence": 0.85,
    },
    {
        "pattern": r"who\s+leads?\s+(.+)",
        "template": (
            "MATCH (p:Actor)-[:LEADS]->(c:Actor) "
            "WHERE c.canonicalName = $entity AND p.type = 'PERSON' "
            "RETURN p.canonicalName AS leader"
        ),
        "confidence": 0.85,
    },
    {
        "pattern": r"top\s+(\d+)\s+most\s+connected",
        "template": (
            "MATCH (n)-[r]-() "
            "RETURN n.canonicalName AS entity, count(r) AS connections "
            "ORDER BY connections DESC LIMIT $limit"
        ),
        "confidence": 0.80,
    },
    {
        "pattern": r"what\s+happened\s+after\s+(.+)",
        "template": (
            "MATCH (e1:Event)-[:FOLLOWED_BY]->(e2:Event) "
            "WHERE e1.canonicalName = $event_name "
            "RETURN e2.canonicalName AS event, e2.date AS date "
            "ORDER BY e2.date"
        ),
        "confidence": 0.80,
    },
]
