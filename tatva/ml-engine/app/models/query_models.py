"""
TATVA — NL Query → Cypher Translation models.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class NLQueryRequest(BaseModel):
    """Input for NL→Cypher translation."""

    question: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Natural language question from analyst.",
    )
    language: str = Field(
        default="en",
        description="Query language: 'en' or 'hi'.",
    )


class NLQueryResponse(BaseModel):
    """Output from NL→Cypher translation."""

    cypher_query: str = Field(
        ..., description="Generated Cypher query (read-only, validated)."
    )
    explanation: str = Field(
        default="",
        description="Human-readable explanation of what the query does.",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Translation confidence score.",
    )
    is_valid: bool = Field(
        default=True,
        description="True if query passed schema validation.",
    )
    parameters: dict = Field(
        default_factory=dict,
        description="Parameterized values for safe Cypher execution.",
    )
