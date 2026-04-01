"""
TATVA — Natural Language → Cypher Translation.

Translates analyst questions to Neo4j Cypher queries using:
1. Rule-based pattern matching (fast, high confidence).
2. LLM-based translation with few-shot examples (fallback).

Validates all generated Cypher before returning.
"""

from __future__ import annotations

import re
import time
from typing import Dict, List, Optional, Tuple

from app.models.query_models import NLQueryRequest, NLQueryResponse
from app.reasoning.cypher_examples import QUERY_PATTERNS
from app.reasoning.cypher_validator import validate_cypher


# ── Label mapping for "find all X" queries ──
_ENTITY_TYPE_MAP: Dict[str, str] = {
    "countries": "Actor",
    "country": "Actor",
    "organizations": "Actor",
    "organisation": "Actor",
    "organization": "Actor",
    "actors": "Actor",
    "people": "Actor",
    "persons": "Actor",
    "person": "Actor",
    "events": "Event",
    "event": "Event",
    "locations": "Location",
    "location": "Location",
    "places": "Location",
    "technologies": "Technology",
    "technology": "Technology",
    "weapons": "Technology",
    "resources": "Resource",
    "resource": "Resource",
    "documents": "Document",
    "document": "Document",
    "treaties": "Document",
}


def _try_pattern_match(
    question: str,
) -> Optional[Tuple[str, str, float, Dict]]:
    """
    Try to match the question against rule-based patterns.

    Returns (cypher, explanation, confidence, params) or None.
    """
    q_lower = question.strip().lower()

    for pat in QUERY_PATTERNS:
        match = re.search(pat["pattern"], q_lower, re.IGNORECASE)
        if not match:
            continue

        groups = match.groups()
        template = pat["template"]
        confidence = pat["confidence"]
        params: Dict = {}

        # ── Pattern-specific param extraction ──
        if "find all" in q_lower or "list all" in q_lower or "show all" in q_lower:
            entity_type = groups[0] if groups else "entities"
            label = _ENTITY_TYPE_MAP.get(entity_type, "Actor")
            cypher = template.replace("{label}", label)
            params = {"type": entity_type.upper().rstrip("S")}
            return cypher, f"Finding all {entity_type}", confidence, params

        if "connection" in q_lower or "connected" in q_lower:
            if len(groups) >= 2:
                entity_a = groups[0].strip().title()
                entity_b = groups[1].strip().rstrip("?.!").title()
                params = {"entity_a": entity_a, "entity_b": entity_b}
                return template, f"Finding path between {entity_a} and {entity_b}", confidence, params

        if "timeline" in q_lower:
            if len(groups) >= 3:
                entity = groups[0].strip().title()
                start_year = groups[1]
                end_year = groups[2]
                params = {
                    "entity": entity,
                    "start_date": f"{start_year}-01-01",
                    "end_date": f"{end_year}-12-31",
                }
                return template, f"Timeline of {entity} from {start_year} to {end_year}", confidence, params

        if "trade" in q_lower:
            entity = groups[0].strip().title() if groups else "Unknown"
            params = {"entity": entity}
            return template, f"Trade partners of {entity}", confidence, params

        if "neighborhood" in q_lower:
            entity = groups[0].strip().title() if groups else "Unknown"
            params = {"entity": entity}
            return template, f"Neighborhood of {entity}", confidence, params

        if "leads" in q_lower or "lead" in q_lower:
            entity = groups[0].strip().title() if groups else "Unknown"
            params = {"entity": entity}
            return template, f"Leader of {entity}", confidence, params

        if "top" in q_lower and "connected" in q_lower:
            limit = int(groups[0]) if groups else 10
            params = {"limit": limit}
            cypher = template.replace("$limit", str(limit))
            return cypher, f"Top {limit} most connected entities", confidence, params

        if "happened after" in q_lower:
            event = groups[0].strip().title() if groups else "Unknown"
            params = {"event_name": event}
            return template, f"Events after {event}", confidence, params

    return None


def translate(request: NLQueryRequest) -> NLQueryResponse:
    """
    Translate a natural language question to Cypher.

    Uses rule-based patterns first (fast, high confidence).
    Falls back to a generic MATCH query for unrecognised patterns.
    """
    t_start = time.perf_counter()

    question = request.question.strip()

    # 1. Try rule-based pattern matching
    result = _try_pattern_match(question)

    if result:
        cypher, explanation, confidence, params = result
    else:
        # Fallback: generic search by name
        cypher = (
            "MATCH (n) WHERE toLower(n.canonicalName) CONTAINS toLower($query) "
            "RETURN n.canonicalName AS name, labels(n) AS type, n.id AS id LIMIT 20"
        )
        explanation = f"Searching for entities matching '{question}'"
        confidence = 0.50
        params = {"query": question}

    # 2. Validate generated Cypher
    is_valid, issues = validate_cypher(cypher)

    if not is_valid:
        # Return the issues but still provide the query for transparency
        explanation += f" [VALIDATION ISSUES: {'; '.join(issues)}]"

    t_ms = (time.perf_counter() - t_start) * 1000

    return NLQueryResponse(
        cypher_query=cypher,
        explanation=explanation,
        confidence=round(confidence, 2),
        is_valid=is_valid,
        parameters=params,
    )
