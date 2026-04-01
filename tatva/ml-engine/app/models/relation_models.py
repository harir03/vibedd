"""
TATVA — Relation Extraction models.

Typed relationships: ALLIES_WITH, SANCTIONS, TRADES_WITH, DEPLOYS_IN,
LEADS, MEMBER_OF, SIGNED, OPPOSES, SUPPORTS, FUNDS, etc.
Handles negation and multi-sentence relations.
"""

from typing import Dict, List

from pydantic import BaseModel, Field


class RelationRequest(BaseModel):
    """Input for relation extraction."""

    text: str = Field(
        ...,
        min_length=1,
        max_length=50000,
        description="Text to extract relations from.",
    )
    entities: List[Dict] = Field(
        default_factory=list,
        description="Pre-extracted entities (optional; if empty, NER runs first).",
    )


class ExtractedRelation(BaseModel):
    """A single extracted relation between two entities."""

    subject: str = Field(..., description="Source entity text.")
    subject_type: str = Field(..., description="Source entity type.")
    predicate: str = Field(
        ...,
        description="Relationship type (e.g., ALLIES_WITH, TRADES_WITH).",
    )
    object: str = Field(..., description="Target entity text.")
    object_type: str = Field(..., description="Target entity type.")
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Extraction confidence."
    )
    negated: bool = Field(
        default=False,
        description="True if the relation is negated (e.g., 'did NOT agree').",
    )
    evidence_sentence: str = Field(
        default="", description="Source sentence(s) supporting this relation."
    )


class RelationResponse(BaseModel):
    """Output from relation extraction."""

    relations: List[ExtractedRelation] = Field(
        default_factory=list, description="List of extracted relations."
    )
    processing_time_ms: float = Field(
        default=0.0, description="Processing time in milliseconds."
    )
