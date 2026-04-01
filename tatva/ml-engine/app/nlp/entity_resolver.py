"""
TATVA — Entity Resolution Pipeline.

Multi-signal entity resolution:
1. Exact match on canonical_name / aliases
2. Fuzzy string similarity (Jaro-Winkler > 0.85)
3. Containment matching ("Modi" in "Narendra Modi")
4. Abbreviation matching ("DRDO" ↔ "Defence Research and Development Organisation")

Never auto-merges with confidence < 0.80.
Entities with confidence < 0.90 flagged for human review.
Merge conflicts: keep BOTH values with sources.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from app.models.entity_models import (
    EntityResolutionRequest,
    EntityResolutionResponse,
    ResolutionCandidate,
)
from app.nlp.fuzzy_matching import (
    compute_containment_score,
    compute_exact_score,
    compute_fuzzy_score,
    normalize_name,
)


@dataclass
class KnownEntity:
    """An entity stored in the knowledge base for resolution."""

    node_id: str
    canonical_name: str
    entity_type: str
    aliases: List[str] = field(default_factory=list)
    description: str = ""


class EntityResolver:
    """
    Resolves entity mentions to canonical graph nodes.

    Uses an in-memory knowledge base for resolution.
    In production, this would query Neo4j and Elasticsearch.
    """

    def __init__(self) -> None:
        self._knowledge_base: List[KnownEntity] = []
        self._alias_index: Dict[str, str] = {}  # normalized alias → node_id

    def add_entity(self, entity: KnownEntity) -> None:
        """Add or update an entity in the knowledge base."""
        self._knowledge_base.append(entity)
        # Index canonical name and aliases
        self._alias_index[normalize_name(entity.canonical_name)] = entity.node_id
        for alias in entity.aliases:
            self._alias_index[normalize_name(alias)] = entity.node_id

    def clear(self) -> None:
        """Clear the knowledge base."""
        self._knowledge_base.clear()
        self._alias_index.clear()

    def resolve(self, request: EntityResolutionRequest) -> EntityResolutionResponse:
        """
        Resolve an entity mention to a canonical graph node.

        Multi-signal strategy:
        1. Exact match on canonical_name or aliases
        2. Fuzzy string similarity (Jaro-Winkler)
        3. Containment matching
        4. Combine signals into overall similarity score
        5. If score < 0.80 → queue for human review (no auto-merge)
        6. If score ≥ 0.90 → auto-merge
        """
        start_time = time.perf_counter()

        query = request.entity_text
        candidates: List[ResolutionCandidate] = []

        for entity in self._knowledge_base:
            signals = self._compute_signals(
                query, entity, request.entity_type
            )
            overall_score = self._aggregate_score(signals)

            if overall_score > 0.3:  # Only include plausible candidates
                candidates.append(
                    ResolutionCandidate(
                        graph_node_id=entity.node_id,
                        canonical_name=entity.canonical_name,
                        entity_type=entity.entity_type,
                        similarity_score=round(overall_score, 4),
                        match_signals=signals,
                        auto_merge=overall_score >= 0.90,
                    )
                )

        # Sort by similarity descending
        candidates.sort(key=lambda c: c.similarity_score, reverse=True)

        # Best match
        best_match: Optional[ResolutionCandidate] = None
        if candidates and candidates[0].similarity_score >= 0.80:
            best_match = candidates[0]

        # Human review needed if no auto-merge candidate
        needs_review = best_match is None or not best_match.auto_merge

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        return EntityResolutionResponse(
            candidates=candidates[:10],  # Return top 10
            best_match=best_match,
            needs_human_review=needs_review,
            processing_time_ms=round(elapsed_ms, 2),
        )

    def _compute_signals(
        self, query: str, entity: KnownEntity, query_type: str
    ) -> Dict[str, float]:
        """Compute individual match signals."""
        # Check canonical name
        exact = compute_exact_score(query, entity.canonical_name)
        fuzzy = compute_fuzzy_score(query, entity.canonical_name)
        containment = compute_containment_score(query, entity.canonical_name)

        # Check aliases — use best score across all aliases
        for alias in entity.aliases:
            alias_exact = compute_exact_score(query, alias)
            alias_fuzzy = compute_fuzzy_score(query, alias)
            alias_contain = compute_containment_score(query, alias)
            exact = max(exact, alias_exact)
            fuzzy = max(fuzzy, alias_fuzzy)
            containment = max(containment, alias_contain)

        # Type match bonus
        type_match = 1.0 if (query_type and query_type == entity.entity_type) else 0.5

        return {
            "exact": round(exact, 4),
            "fuzzy": round(fuzzy, 4),
            "containment": round(containment, 4),
            "type_match": round(type_match, 4),
        }

    def _aggregate_score(self, signals: Dict[str, float]) -> float:
        """
        Aggregate individual signals into an overall similarity score.

        Weights:
        - Exact match: 0.40 (strongest signal)
        - Fuzzy: 0.30
        - Containment: 0.20
        - Type match: 0.10
        """
        score = (
            0.40 * signals.get("exact", 0.0)
            + 0.30 * signals.get("fuzzy", 0.0)
            + 0.20 * signals.get("containment", 0.0)
            + 0.10 * signals.get("type_match", 0.0)
        )
        return min(1.0, score)


# ── Module-level singleton ──
entity_resolver = EntityResolver()
