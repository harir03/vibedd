"""
TATVA NLP Service — Credibility Scoring routes.

Formula: credibility = w1*source_reliability + w2*corroboration_score
         + w3*recency_score - w4*contradiction_penalty

Detects circular citations and adjusts corroboration accordingly.
"""

from fastapi import APIRouter
from app.models.credibility_models import (
    CredibilityRequest,
    CredibilityResponse,
)
from app.nlp.credibility_scorer import score_credibility as _score

router = APIRouter(prefix="/nlp/credibility", tags=["Credibility Scoring"])


@router.post("/score", response_model=CredibilityResponse)
async def score_credibility(
    request: CredibilityRequest,
) -> CredibilityResponse:
    """
    Compute credibility score for a fact/claim.

    Uses source reliability tiers (T1=0.9 Reuters/PTI/GoI ... T5=0.1 anon),
    corroboration count (unique root sources only), recency decay,
    and contradiction penalty. Detects circular citations.
    """
    return _score(request)
