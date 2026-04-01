"""
TATVA — Credibility Scoring models.

Formula: credibility = w1*source_reliability + w2*corroboration_score
         + w3*recency_score - w4*contradiction_penalty
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class SourceInfo(BaseModel):
    """Information about a single source for a fact."""

    source_name: str = Field(..., description="Name of the source.")
    source_tier: int = Field(
        ...,
        ge=1,
        le=5,
        description="Reliability tier: 1=Reuters/PTI/GoI, 2=major national, "
        "3=regional, 4=blogs, 5=anonymous social media.",
    )
    publication_date: str = Field(
        ..., description="ISO 8601 date of publication."
    )
    source_url: str = Field(default="", description="URL of the source.")
    cites_source: Optional[str] = Field(
        default=None,
        description="If this source cites another source, its name (for circular citation detection).",
    )


class CredibilityRequest(BaseModel):
    """Input for credibility scoring."""

    fact_text: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="The fact or claim to score.",
    )
    sources: List[SourceInfo] = Field(
        ...,
        min_length=1,
        description="List of sources reporting this fact.",
    )
    contradicting_sources: List[SourceInfo] = Field(
        default_factory=list,
        description="Sources that contradict this fact.",
    )


class CredibilityResponse(BaseModel):
    """Output from credibility scoring."""

    credibility_score: float = Field(
        ..., ge=0.0, le=1.0, description="Overall credibility score (0.0–1.0)."
    )
    source_reliability: float = Field(
        ..., ge=0.0, le=1.0, description="Weighted source reliability component."
    )
    corroboration_score: float = Field(
        ..., ge=0.0, le=1.0, description="Corroboration component."
    )
    recency_score: float = Field(
        ..., ge=0.0, le=1.0, description="Recency decay component."
    )
    contradiction_penalty: float = Field(
        ..., ge=0.0, description="Contradiction penalty applied."
    )
    unique_root_sources: int = Field(
        ..., ge=0, description="Number of independent (non-circular) sources."
    )
    circular_citations_detected: bool = Field(
        default=False,
        description="True if circular citation chain detected.",
    )
    warning: Optional[str] = Field(
        default=None,
        description="Warning message if credibility < 0.3.",
    )
