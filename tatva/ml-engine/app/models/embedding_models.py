"""
TATVA — Embedding & Vector Search models.

all-MiniLM-L6-v2 (384d) for English.
multilingual-e5-base for Hindi and other Indian languages.
"""

from typing import List

from pydantic import BaseModel, Field


class EmbeddingRequest(BaseModel):
    """Input for embedding generation."""

    text: str = Field(
        ...,
        min_length=1,
        max_length=50000,
        description="Text to generate embedding for.",
    )
    language: str = Field(
        default="auto",
        description="Language hint for model selection: 'en', 'hi', or 'auto'.",
    )


class EmbeddingResponse(BaseModel):
    """Output from embedding generation."""

    embedding: List[float] = Field(
        ..., description="Embedding vector (384 dimensions)."
    )
    model_used: str = Field(
        ..., description="Name of the embedding model used."
    )
    dimensions: int = Field(default=384, description="Number of dimensions.")


class SimilaritySearchRequest(BaseModel):
    """Input for similarity search."""

    query_text: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Text query for semantic search.",
    )
    entity_types: List[str] = Field(
        default_factory=list,
        description="Filter by entity types (empty = search all).",
    )
    top_k: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Number of results to return.",
    )
    min_similarity: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Minimum cosine similarity threshold.",
    )


class SimilarityResult(BaseModel):
    """A single similarity search result."""

    entity_id: str = Field(..., description="Graph node ID.")
    canonical_name: str = Field(..., description="Entity canonical name.")
    entity_type: str = Field(..., description="Entity type.")
    similarity: float = Field(
        ..., ge=0.0, le=1.0, description="Cosine similarity score."
    )
    source: str = Field(
        default="elasticsearch",
        description="Search backend: 'elasticsearch' or 'neo4j'.",
    )


class SimilaritySearchResponse(BaseModel):
    """Output from similarity search."""

    results: List[SimilarityResult] = Field(
        default_factory=list, description="Ranked similarity results."
    )
    query_embedding_model: str = Field(
        default="", description="Model used for query embedding."
    )
    processing_time_ms: float = Field(
        default=0.0, description="Processing time in milliseconds."
    )
