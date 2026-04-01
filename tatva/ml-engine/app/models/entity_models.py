"""
TATVA — Entity Resolution models.

Multi-signal resolution: exact match, fuzzy string (Jaro-Winkler),
embedding cosine similarity, co-occurrence, Wikidata linking.
Cross-lingual: Hindi ↔ English same entity.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class EntityResolutionRequest(BaseModel):
    """Input for entity resolution."""

    entity_text: str = Field(
        ..., min_length=1, description="Entity mention to resolve."
    )
    entity_type: str = Field(
        default="",
        description="Hint for entity type (PERSON, ORGANIZATION, etc.).",
    )
    context: str = Field(
        default="",
        max_length=10000,
        description="Surrounding text context for disambiguation.",
    )
    language: str = Field(
        default="auto",
        description="Language of the entity mention: 'en', 'hi', or 'auto'.",
    )


class ResolutionCandidate(BaseModel):
    """A candidate match from the knowledge graph."""

    graph_node_id: str = Field(..., description="Neo4j node ID.")
    canonical_name: str = Field(..., description="Canonical name in graph.")
    entity_type: str = Field(..., description="Entity type in graph.")
    similarity_score: float = Field(
        ..., ge=0.0, le=1.0, description="Overall similarity score."
    )
    match_signals: dict = Field(
        default_factory=dict,
        description="Individual signal scores: exact, fuzzy, embedding, cooccurrence, wikidata.",
    )
    auto_merge: bool = Field(
        default=False,
        description="True if similarity ≥ 0.90 (safe for automatic merge).",
    )


class EntityResolutionResponse(BaseModel):
    """Output from entity resolution."""

    candidates: List[ResolutionCandidate] = Field(
        default_factory=list,
        description="Ranked list of candidate matches from the graph.",
    )
    best_match: Optional[ResolutionCandidate] = Field(
        default=None,
        description="Best candidate (if similarity ≥ 0.80).",
    )
    needs_human_review: bool = Field(
        default=True,
        description="True if no candidate exceeds auto-merge threshold (0.90).",
    )
    processing_time_ms: float = Field(
        default=0.0, description="Processing time in milliseconds."
    )
