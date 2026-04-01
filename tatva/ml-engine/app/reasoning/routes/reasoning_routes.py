"""
TATVA Reasoning Service — RAG-based Intelligence Q&A routes.

Uses Ollama (Mistral/Llama3) with graph context for answering
analyst questions. Includes hallucination detection and content filtering.
"""

from fastapi import APIRouter
from app.models.reasoning_models import (
    ReasoningRequest,
    ReasoningResponse,
)
from app.reasoning.rag_pipeline import rag_pipeline

router = APIRouter(prefix="/reasoning/ask", tags=["Intelligence Q&A"])


@router.post("/", response_model=ReasoningResponse)
async def ask_tatva(request: ReasoningRequest) -> ReasoningResponse:
    """
    Ask TATVA an intelligence question using RAG.

    Retrieves relevant graph subgraph, feeds to LLM with strict system
    prompt, validates response for hallucinations, and returns answer
    with confidence score and source citations.
    """
    return rag_pipeline.answer(request)
