"""
TATVA NLP Service — Entity Resolution routes.

Multi-signal entity resolution: exact match, fuzzy string similarity,
embedding cosine similarity, co-occurrence, Wikidata linking.
Cross-lingual: Hindi ↔ English same entity.
"""

from fastapi import APIRouter
from app.models.entity_models import (
    EntityResolutionRequest,
    EntityResolutionResponse,
)
from app.nlp.entity_resolver import entity_resolver

router = APIRouter(prefix="/nlp/entity-resolution", tags=["Entity Resolution"])


@router.post("/resolve", response_model=EntityResolutionResponse)
async def resolve_entity(
    request: EntityResolutionRequest,
) -> EntityResolutionResponse:
    """
    Resolve an entity mention to a canonical graph node.

    Uses multi-signal strategy: exact match on aliases, fuzzy string
    similarity (Jaro-Winkler > 0.85), embedding cosine similarity (> 0.90),
    co-occurrence context, and Wikidata QID linking.
    Never auto-merges with confidence < 0.80.
    """
    return entity_resolver.resolve(request)
