"""
TATVA — Reasoning Service models.

RAG-based Q&A, Scenario Modeling, Report Generation.
"""

from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# ─── RAG Q&A ───


class ReasoningRequest(BaseModel):
    """Input for RAG-based intelligence Q&A."""

    question: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Intelligence question to answer.",
    )
    domain_filter: Optional[str] = Field(
        default=None,
        description="Optional domain filter: geopolitics, economics, defense, technology, climate, society.",
    )
    max_context_entities: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Max entities to include in LLM context.",
    )


class SourceCitation(BaseModel):
    """A source citation in the reasoning response."""

    source_name: str = Field(..., description="Source name.")
    source_url: str = Field(default="", description="Source URL.")
    relevance: float = Field(
        ..., ge=0.0, le=1.0, description="Relevance to the question."
    )


class ReasoningResponse(BaseModel):
    """Output from RAG-based intelligence Q&A."""

    answer: str = Field(..., description="LLM-generated answer.")
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Answer confidence score."
    )
    sources: List[SourceCitation] = Field(
        default_factory=list, description="Source citations."
    )
    entities_referenced: List[str] = Field(
        default_factory=list,
        description="Entity IDs referenced in the answer.",
    )
    hallucination_flag: bool = Field(
        default=False,
        description="True if > 30% of referenced entities not in graph.",
    )
    processing_time_ms: float = Field(
        default=0.0, description="Processing time in milliseconds."
    )


# ─── Scenario Modeling ───


class ScenarioRequest(BaseModel):
    """Input for scenario modeling."""

    scenario_description: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="Description of the hypothetical scenario.",
    )
    domains_to_analyze: List[str] = Field(
        default_factory=lambda: [
            "geopolitics",
            "economics",
            "defense",
            "technology",
            "climate",
            "society",
        ],
        description="Domains to trace cascading effects through.",
    )
    max_cascade_depth: int = Field(
        default=3,
        ge=1,
        le=5,
        description="Maximum depth of cascading effect analysis.",
    )


class CascadeEffect(BaseModel):
    """A single downstream effect in the cascade."""

    domain: str = Field(..., description="Affected domain.")
    description: str = Field(..., description="Effect description.")
    severity: str = Field(
        ..., description="Severity: LOW, MEDIUM, HIGH, CRITICAL."
    )
    affected_entities: List[str] = Field(
        default_factory=list, description="Entity names affected."
    )
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Assessment confidence."
    )


class ScenarioResponse(BaseModel):
    """Output from scenario modeling."""

    scenario: str = Field(..., description="Input scenario description.")
    cascade_effects: List[CascadeEffect] = Field(
        default_factory=list, description="Downstream cascading effects."
    )
    total_effects: int = Field(
        default=0, description="Total number of downstream effects."
    )
    historical_precedents: List[str] = Field(
        default_factory=list, description="Similar historical events."
    )
    processing_time_ms: float = Field(
        default=0.0, description="Processing time in milliseconds."
    )


# ─── Report Generation ───


class ReportType(str, Enum):
    """Intelligence report types."""

    INTELLIGENCE_BRIEF = "INTELLIGENCE_BRIEF"
    SITUATION_REPORT = "SITUATION_REPORT"
    THREAT_ASSESSMENT = "THREAT_ASSESSMENT"
    ECONOMIC_IMPACT = "ECONOMIC_IMPACT"
    DAILY_SUMMARY = "DAILY_SUMMARY"
    FLASH_REPORT = "FLASH_REPORT"
    DECISION_MATRIX = "DECISION_MATRIX"


class ReportFormat(str, Enum):
    """Report export formats."""

    PDF = "PDF"
    DOCX = "DOCX"
    MARKDOWN = "MARKDOWN"
    JSON = "JSON"


class ReportRequest(BaseModel):
    """Input for report generation."""

    topic: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Topic or entity for the report.",
    )
    report_type: ReportType = Field(
        default=ReportType.INTELLIGENCE_BRIEF,
        description="Type of intelligence report.",
    )
    output_format: ReportFormat = Field(
        default=ReportFormat.MARKDOWN,
        description="Output format for the report.",
    )
    entity_ids: List[str] = Field(
        default_factory=list,
        description="Specific entity IDs to include in the report.",
    )
    time_range_start: Optional[str] = Field(
        default=None, description="ISO 8601 start date for temporal scope."
    )
    time_range_end: Optional[str] = Field(
        default=None, description="ISO 8601 end date for temporal scope."
    )


class ReportResponse(BaseModel):
    """Output from report generation."""

    report_id: str = Field(..., description="Unique report identifier.")
    report_type: ReportType = Field(
        ..., description="Type of generated report."
    )
    content: str = Field(..., description="Report content in requested format.")
    classification: str = Field(
        default="INTERNAL",
        description="Classification level of the report.",
    )
    entity_count: int = Field(
        default=0, description="Number of entities referenced."
    )
    source_count: int = Field(
        default=0, description="Number of sources cited."
    )
    processing_time_ms: float = Field(
        default=0.0, description="Processing time in milliseconds."
    )
