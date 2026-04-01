"""
TATVA — Named Entity Recognition models.

Entity types: PERSON, ORGANIZATION, LOCATION, EVENT, TECHNOLOGY,
RESOURCE, DOCUMENT, DATETIME, METRIC.
"""

from typing import List

from pydantic import BaseModel, Field


class NERRequest(BaseModel):
    """Input for NER extraction."""

    text: str = Field(
        ...,
        min_length=1,
        max_length=50000,
        description="Text to extract entities from (English, Hindi, or mixed).",
    )
    language: str = Field(
        default="auto",
        description="Language hint: 'en', 'hi', or 'auto' for detection.",
    )
    min_confidence: float = Field(
        default=0.70,
        ge=0.0,
        le=1.0,
        description="Minimum confidence threshold for returned entities.",
    )


class ExtractedEntity(BaseModel):
    """A single extracted entity."""

    text: str = Field(..., description="Surface form as found in text.")
    entity_type: str = Field(
        ...,
        description="Entity type: PERSON, ORGANIZATION, LOCATION, EVENT, "
        "TECHNOLOGY, RESOURCE, DOCUMENT, DATETIME, METRIC.",
    )
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Model confidence score."
    )
    start_char: int = Field(..., ge=0, description="Character offset start.")
    end_char: int = Field(..., ge=0, description="Character offset end.")
    language: str = Field(
        default="en", description="Detected language of this entity mention."
    )


class NERResponse(BaseModel):
    """Output from NER extraction."""

    entities: List[ExtractedEntity] = Field(
        default_factory=list, description="List of extracted entities."
    )
    text_language: str = Field(
        default="en", description="Detected primary language of input text."
    )
    processing_time_ms: float = Field(
        default=0.0, description="Processing time in milliseconds."
    )
