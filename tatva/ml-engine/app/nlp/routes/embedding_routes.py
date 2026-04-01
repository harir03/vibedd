"""
TATVA NLP Service — Embedding & Vector Search routes.

Models: all-MiniLM-L6-v2 (384d, English), multilingual-e5-base (Hindi+).
Stored in Neo4j + Elasticsearch for graph-aware and fast kNN search.
"""

from fastapi import APIRouter, HTTPException
from app.models.embedding_models import (
    EmbeddingRequest,
    EmbeddingResponse,
    SimilaritySearchRequest,
    SimilaritySearchResponse,
)

router = APIRouter(prefix="/nlp/embeddings", tags=["Embeddings & Vector Search"])


@router.post("/generate", response_model=EmbeddingResponse)
async def generate_embedding(request: EmbeddingRequest) -> EmbeddingResponse:
    """
    Generate embedding vector for text input.

    Uses all-MiniLM-L6-v2 (384 dims) for English,
    multilingual-e5-base for Hindi and other Indian languages.
    """
    raise HTTPException(
        status_code=501,
        detail="Embedding generation not yet implemented. Scheduled for Tier 1.",
    )


@router.post("/search", response_model=SimilaritySearchResponse)
async def similarity_search(
    request: SimilaritySearchRequest,
) -> SimilaritySearchResponse:
    """
    Find semantically similar entities/documents using vector search.

    Searches both Neo4j (graph-aware) and Elasticsearch (fast kNN).
    """
    raise HTTPException(
        status_code=501,
        detail="Similarity search not yet implemented. Scheduled for Tier 1.",
    )
