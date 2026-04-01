"""TATVA NLP Service — Health endpoint."""

from fastapi import APIRouter
from app.config import settings
from app.nlp.ner_pipeline import ner_pipeline

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health() -> dict:
    """Health check for the NLP service."""
    return {
        "service": "tatva-nlp-service",
        "status": "UP",
        "version": settings.app_version,
        "models_loaded": {
            "ner_english": ner_pipeline.is_loaded,
            "ner_hindi": False,
            "relation_extraction": False,
            "embedding": False,
            "nl_to_cypher": False,
        },
    }
