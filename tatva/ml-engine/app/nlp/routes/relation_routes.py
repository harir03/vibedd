"""
TATVA NLP Service — Relation Extraction routes.

Extracts typed relationships between entities: ALLIES_WITH, SANCTIONS,
TRADES_WITH, DEPLOYS_IN, etc. Handles negation and multi-sentence relations.
"""

from fastapi import APIRouter, HTTPException
from app.models.relation_models import RelationRequest, RelationResponse
from app.nlp.relation_extractor import relation_extractor

router = APIRouter(prefix="/nlp/relations", tags=["Relation Extraction"])


@router.post("/extract", response_model=RelationResponse)
async def extract_relations(request: RelationRequest) -> RelationResponse:
    """
    Extract typed relationships from text between identified entities.

    Handles negation ("did NOT agree"), multi-sentence relations,
    and discovers new relation types via OpenIE.
    """
    return relation_extractor.extract(request)
