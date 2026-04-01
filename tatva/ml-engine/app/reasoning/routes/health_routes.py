"""TATVA Reasoning Service — Health endpoint."""

from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health() -> dict:
    """Health check for the Reasoning service."""
    return {
        "service": "tatva-reasoning-service",
        "status": "UP",
        "version": settings.app_version,
        "llm_available": False,
        "ollama_model": settings.ollama_model,
    }
