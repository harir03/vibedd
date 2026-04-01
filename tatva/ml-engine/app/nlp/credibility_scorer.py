"""
TATVA — Credibility Scorer.

Formula:
    credibility = w1 * source_reliability
                + w2 * corroboration_score
                + w3 * recency_score
                - w4 * contradiction_penalty

Default weights: w1=0.35, w2=0.30, w3=0.15, w4=0.20  (configurable).

Components:
    source_reliability  (0–1): Highest-tier source in the list.
    corroboration_score (0–1): 1 - 1/(1 + log(num_independent_sources)).
    recency_score       (0–1): exp(-λ * days_since_first_report), λ=0.01.
    contradiction_penalty:     0.20 per contradicting source.
"""

from __future__ import annotations

import math
import time
from datetime import date, datetime, timedelta
from typing import List, Optional

from app.models.credibility_models import (
    CredibilityRequest,
    CredibilityResponse,
    SourceInfo,
)
from app.nlp.circular_citation_detector import detect_circular_citations
from app.nlp.source_tiers import get_tier_score


# ── Default weights (configurable) ──
W_SOURCE: float = 0.45
W_CORROBORATION: float = 0.35
W_RECENCY: float = 0.20
W_CONTRADICTION: float = 0.20
RECENCY_LAMBDA: float = 0.01
CONTRADICTION_PER_SOURCE: float = 0.20
LOW_CREDIBILITY_THRESHOLD: float = 0.30


def _parse_date(iso_str: str) -> date:
    """Parse an ISO-8601 date string to a date object."""
    # Accept both YYYY-MM-DD and full ISO datetimes.
    try:
        return datetime.fromisoformat(iso_str.replace("Z", "+00:00")).date()
    except (ValueError, AttributeError):
        return date.today()


def _compute_source_reliability(sources: List[SourceInfo]) -> float:
    """
    Return the best (highest) reliability score among all sources.

    Uses the tier number attached to each SourceInfo.
    """
    if not sources:
        return 0.0
    return max(get_tier_score(s.source_tier) for s in sources)


def _compute_corroboration(num_independent: int) -> float:
    """
    Corroboration score: 1 - 1/N.

    N = number of independent root sources (after removing circular citations).
    Single source → 0.0.  Two sources → 0.5.  Four sources → 0.75.
    """
    if num_independent <= 0:
        return 0.0
    return 1.0 - 1.0 / num_independent


def _compute_recency(sources: List[SourceInfo]) -> float:
    """
    Recency score: exp(-λ * days) where days = age of the most recent source.
    """
    if not sources:
        return 0.0
    today = date.today()
    min_days = min(
        max((today - _parse_date(s.publication_date)).days, 0)
        for s in sources
    )
    return math.exp(-RECENCY_LAMBDA * min_days)


def _compute_contradiction_penalty(
    contradicting_sources: List[SourceInfo],
) -> float:
    """0.20 penalty per contradicting source, capped at 1.0."""
    penalty = CONTRADICTION_PER_SOURCE * len(contradicting_sources)
    return min(penalty, 1.0)


def score_credibility(request: CredibilityRequest) -> CredibilityResponse:
    """
    Compute credibility score for a fact/claim.

    Steps:
    1. Detect circular citations → compute unique root sources.
    2. Source reliability = best tier score.
    3. Corroboration = f(num_root_sources).
    4. Recency = exp(-λ * days_since_newest_source).
    5. Contradiction penalty = 0.20 * num_contradicting_sources.
    6. Combine: w1*src + w2*corr + w3*rec - w4*contra.
    7. Clamp to [0, 1].
    """
    t_start = time.perf_counter()

    # 1. Circular citation detection
    has_circular, root_sources = detect_circular_citations(request.sources)
    num_independent = len(root_sources)

    # 2–5. Component scores
    src_rel = _compute_source_reliability(request.sources)
    corr = _compute_corroboration(num_independent)
    rec = _compute_recency(request.sources)
    contra = _compute_contradiction_penalty(request.contradicting_sources)

    # 6. Combine
    raw = (
        W_SOURCE * src_rel
        + W_CORROBORATION * corr
        + W_RECENCY * rec
        - W_CONTRADICTION * contra
    )

    # 7. Clamp
    credibility = max(0.0, min(1.0, raw))

    # Warning for low credibility
    warning: Optional[str] = None
    if credibility < LOW_CREDIBILITY_THRESHOLD:
        warning = (
            f"LOW CREDIBILITY ({credibility:.2f}): This fact has insufficient "
            f"corroboration or comes from unreliable sources. "
            f"Treat with extreme caution."
        )

    return CredibilityResponse(
        credibility_score=round(credibility, 4),
        source_reliability=round(src_rel, 4),
        corroboration_score=round(corr, 4),
        recency_score=round(rec, 4),
        contradiction_penalty=round(contra, 4),
        unique_root_sources=num_independent,
        circular_citations_detected=has_circular,
        warning=warning,
    )
