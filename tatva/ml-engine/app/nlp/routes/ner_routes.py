"""
TATVA NLP Service — Named Entity Recognition routes.

Entity types: PERSON, ORGANIZATION, LOCATION, EVENT, TECHNOLOGY,
RESOURCE, DOCUMENT, DATE/TIME, METRIC.
Supports English + Hindi (IndicBERT/MuRIL).
"""

from fastapi import APIRouter, HTTPException
from app.models.ner_models import NERRequest, NERResponse
from app.nlp.ner_pipeline import ner_pipeline

router = APIRouter(prefix="/nlp/ner", tags=["Named Entity Recognition"])


@router.post("/extract", response_model=NERResponse)
async def extract_entities(request: NERRequest) -> NERResponse:
    """
    Extract named entities from text.

    Supports multilingual input (English, Hindi, mixed code-switching).
    Returns entities with type, confidence score, and character offsets.
    """
    if not ner_pipeline.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="NER model is not loaded yet. Service starting up.",
        )
    return ner_pipeline.extract(request)
