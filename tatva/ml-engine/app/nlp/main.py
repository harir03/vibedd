"""
TATVA NLP Service — FastAPI Application (Port 8000)

Named Entity Recognition, Relation Extraction, Entity Resolution,
Credibility Scoring, Embedding Generation, NL→Cypher Translation.
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI

from app.config import settings
from app.nlp.routes import (
    health_routes,
    ner_routes,
    relation_routes,
    entity_resolution_routes,
    credibility_routes,
    embedding_routes,
    nl_query_routes,
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: load NLP models at startup, cleanup at shutdown."""
    print(f"🔱 {settings.app_name} — NLP Service v{settings.app_version} starting...")
    print(f"   Embedding model: {settings.embedding_model}")
    print(f"   NER min confidence: {settings.ner_min_confidence}")
    print(f"   Entity resolution threshold: {settings.entity_resolution_min_similarity}")

    # Load NER pipeline
    from app.nlp.ner_pipeline import ner_pipeline
    try:
        ner_pipeline.load()
        print("   ✅ NER model loaded")
    except Exception as e:
        print(f"   ⚠️  NER model failed to load: {e}")

    yield
    print(f"🔱 {settings.app_name} — NLP Service shutting down...")


app = FastAPI(
    title="TATVA NLP Service",
    version=settings.app_version,
    description=(
        "NLP pipeline for TATVA — AI-Powered Global Ontology Engine. "
        "Named Entity Recognition (multilingual), Relation Extraction, "
        "Entity Resolution, Credibility Scoring, Embedding Generation, "
        "and NL→Cypher Translation."
    ),
    lifespan=lifespan,
)

app.include_router(health_routes.router)
app.include_router(ner_routes.router)
app.include_router(relation_routes.router)
app.include_router(entity_resolution_routes.router)
app.include_router(credibility_routes.router)
app.include_router(embedding_routes.router)
app.include_router(nl_query_routes.router)
