"""
TATVA Credibility Scoring — Unit Tests.

Tests per T2-F4 spec:
□ Reuters (T1) + 3 corroborations → credibility ≥ 0.85
□ Anonymous blog (T5) → credibility ≤ 0.25
□ Fact with credibility < 0.3 → warning flag set
□ Circular citation (A cites B, B cites A) → corroboration = 1, NOT 2
□ Recency: 30-day-old fact scores higher than 1-year-old
□ Contradiction: conflicting source → 0.20 penalty applied
"""

from __future__ import annotations

import math
from datetime import date, timedelta
from typing import List

import pytest
from fastapi.testclient import TestClient

from app.models.credibility_models import (
    CredibilityRequest,
    CredibilityResponse,
    SourceInfo,
)
from app.nlp.credibility_scorer import score_credibility
from app.nlp.circular_citation_detector import detect_circular_citations
from app.nlp.source_tiers import get_tier_score, lookup_source_tier
from app.nlp.main import app


# ── Helpers ──

def _today() -> str:
    return date.today().isoformat()


def _days_ago(n: int) -> str:
    return (date.today() - timedelta(days=n)).isoformat()


def _make_source(
    name: str,
    tier: int,
    pub_date: str = "",
    cites: str = None,
) -> SourceInfo:
    if not pub_date:
        pub_date = _today()
    return SourceInfo(
        source_name=name,
        source_tier=tier,
        publication_date=pub_date,
        cites_source=cites,
    )


# ── Fixtures ──

@pytest.fixture(scope="module")
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


# ═══════════════════════════════════════════════
#  Source Tier Tests
# ═══════════════════════════════════════════════


class TestSourceTiers:

    def test_tier_scores(self) -> None:
        assert get_tier_score(1) == 0.9
        assert get_tier_score(2) == 0.7
        assert get_tier_score(3) == 0.5
        assert get_tier_score(4) == 0.3
        assert get_tier_score(5) == 0.1

    def test_lookup_known_source(self) -> None:
        assert lookup_source_tier("Reuters") == 1
        assert lookup_source_tier("NDTV") == 2
        assert lookup_source_tier("Twitter") == 5

    def test_lookup_unknown_defaults_to_3(self) -> None:
        assert lookup_source_tier("Unknown Newspaper XYZ") == 3


# ═══════════════════════════════════════════════
#  Circular Citation Tests
# ═══════════════════════════════════════════════


class TestCircularCitation:

    def test_no_citations(self) -> None:
        """No citation links → no circularity."""
        sources = [
            _make_source("Reuters", 1),
            _make_source("PTI", 1),
        ]
        has_circ, roots = detect_circular_citations(sources)
        assert has_circ is False
        assert len(roots) == 2

    def test_simple_circular(self) -> None:
        """A cites B, B cites A → circular, corroboration = 1, not 2."""
        sources = [
            _make_source("Source A", 3, cites="Source B"),
            _make_source("Source B", 3, cites="Source A"),
        ]
        has_circ, roots = detect_circular_citations(sources)
        assert has_circ is True
        assert len(roots) == 1  # Circular group counted as ONE

    def test_chain_no_cycle(self) -> None:
        """A cites B, B cites C (no cycle) → 3 independent sources."""
        sources = [
            _make_source("A", 3, cites="B"),
            _make_source("B", 3, cites="C"),
            _make_source("C", 3),
        ]
        has_circ, roots = detect_circular_citations(sources)
        assert has_circ is False
        assert len(roots) == 3

    def test_three_node_cycle(self) -> None:
        """A→B→C→A cycle → corroboration counted as 1."""
        sources = [
            _make_source("A", 3, cites="B"),
            _make_source("B", 3, cites="C"),
            _make_source("C", 3, cites="A"),
        ]
        has_circ, roots = detect_circular_citations(sources)
        assert has_circ is True
        assert len(roots) == 1


# ═══════════════════════════════════════════════
#  Credibility Scoring Tests
# ═══════════════════════════════════════════════


class TestCredibilityScoring:

    def test_reuters_plus_3_corroborations(self) -> None:
        """Reuters (T1) + 3 independent corroborations → credibility ≥ 0.85."""
        req = CredibilityRequest(
            fact_text="India signed a defense deal with France.",
            sources=[
                _make_source("Reuters", 1),
                _make_source("PTI", 1),
                _make_source("NDTV", 2),
                _make_source("The Hindu", 2),
            ],
        )
        resp = score_credibility(req)
        assert resp.credibility_score >= 0.85, \
            f"Reuters+3: score={resp.credibility_score} < 0.85"

    def test_anonymous_blog_low_score(self) -> None:
        """Single anonymous blog (T5) → credibility ≤ 0.25."""
        req = CredibilityRequest(
            fact_text="Aliens landed in Rajasthan.",
            sources=[
                _make_source("Anonymous Reddit", 5),
            ],
        )
        resp = score_credibility(req)
        assert resp.credibility_score <= 0.25, \
            f"Anonymous blog: score={resp.credibility_score} > 0.25"

    def test_low_credibility_warning(self) -> None:
        """Fact with credibility < 0.3 → warning flag set."""
        req = CredibilityRequest(
            fact_text="Secret base on moon.",
            sources=[
                _make_source("4chan", 5),
            ],
        )
        resp = score_credibility(req)
        assert resp.credibility_score < 0.30
        assert resp.warning is not None
        assert "LOW CREDIBILITY" in resp.warning

    def test_recency_30_days_vs_1_year(self) -> None:
        """30-day-old fact scores higher than 1-year-old fact (same source)."""
        recent = CredibilityRequest(
            fact_text="Recent event.",
            sources=[_make_source("Reuters", 1, pub_date=_days_ago(30))],
        )
        old = CredibilityRequest(
            fact_text="Old event.",
            sources=[_make_source("Reuters", 1, pub_date=_days_ago(365))],
        )
        resp_recent = score_credibility(recent)
        resp_old = score_credibility(old)
        assert resp_recent.recency_score > resp_old.recency_score
        assert resp_recent.credibility_score > resp_old.credibility_score

    def test_contradiction_penalty(self) -> None:
        """Contradicting source → 0.20 penalty applied."""
        no_contra = CredibilityRequest(
            fact_text="Claim A.",
            sources=[_make_source("Reuters", 1)],
            contradicting_sources=[],
        )
        with_contra = CredibilityRequest(
            fact_text="Claim A.",
            sources=[_make_source("Reuters", 1)],
            contradicting_sources=[_make_source("PTI", 1)],
        )
        resp_clean = score_credibility(no_contra)
        resp_contra = score_credibility(with_contra)
        penalty_diff = resp_clean.credibility_score - resp_contra.credibility_score
        # Penalty contribution: W_CONTRADICTION * 0.20 = 0.20 * 0.20 = 0.04
        assert resp_contra.contradiction_penalty == 0.20
        assert penalty_diff > 0.03

    def test_circular_citation_score(self) -> None:
        """Circular A↔B → corroboration counted as 1 source, not 2."""
        req = CredibilityRequest(
            fact_text="Mutual citation claim.",
            sources=[
                _make_source("Blog A", 4, cites="Blog B"),
                _make_source("Blog B", 4, cites="Blog A"),
            ],
        )
        resp = score_credibility(req)
        assert resp.circular_citations_detected is True
        assert resp.unique_root_sources == 1

    def test_credibility_clamped_to_0_1(self) -> None:
        """Score must be clamped between 0 and 1."""
        # Many contradictions that would make the formula negative
        req = CredibilityRequest(
            fact_text="Heavily contradicted claim.",
            sources=[_make_source("Twitter user", 5)],
            contradicting_sources=[
                _make_source("Reuters", 1),
                _make_source("PTI", 1),
                _make_source("BBC", 2),
                _make_source("NDTV", 2),
                _make_source("The Hindu", 2),
            ],
        )
        resp = score_credibility(req)
        assert 0.0 <= resp.credibility_score <= 1.0

    def test_source_reliability_uses_best_tier(self) -> None:
        """Source reliability = best (highest score) among sources."""
        req = CredibilityRequest(
            fact_text="Mixed sources.",
            sources=[
                _make_source("Reddit", 5),
                _make_source("Reuters", 1),
                _make_source("Blog", 4),
            ],
        )
        resp = score_credibility(req)
        assert resp.source_reliability == 0.9  # T1 = Reuters

    def test_multiple_contradictions_stack(self) -> None:
        """Multiple contradictions stack: 3 × 0.20 = 0.60 penalty."""
        req = CredibilityRequest(
            fact_text="Contradicted claim.",
            sources=[_make_source("Reuters", 1)],
            contradicting_sources=[
                _make_source("BBC", 2),
                _make_source("NDTV", 2),
                _make_source("The Hindu", 2),
            ],
        )
        resp = score_credibility(req)
        assert resp.contradiction_penalty == 0.60

    def test_today_recency_near_1(self) -> None:
        """Fact published today → recency ≈ 1.0."""
        req = CredibilityRequest(
            fact_text="Today's fact.",
            sources=[_make_source("Reuters", 1, pub_date=_today())],
        )
        resp = score_credibility(req)
        assert resp.recency_score > 0.99


# ═══════════════════════════════════════════════
#  API Endpoint Tests
# ═══════════════════════════════════════════════


class TestCredibilityEndpoint:

    def test_score_returns_200(self, client: TestClient) -> None:
        resp = client.post(
            "/nlp/credibility/score",
            json={
                "fact_text": "India tested a missile.",
                "sources": [
                    {
                        "source_name": "Reuters",
                        "source_tier": 1,
                        "publication_date": _today(),
                    }
                ],
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "credibility_score" in data
        assert "circular_citations_detected" in data

    def test_score_with_contradictions(self, client: TestClient) -> None:
        resp = client.post(
            "/nlp/credibility/score",
            json={
                "fact_text": "Disputed claim.",
                "sources": [
                    {
                        "source_name": "PTI",
                        "source_tier": 1,
                        "publication_date": _today(),
                    }
                ],
                "contradicting_sources": [
                    {
                        "source_name": "Blog",
                        "source_tier": 4,
                        "publication_date": _today(),
                    }
                ],
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["contradiction_penalty"] > 0

    def test_missing_sources_returns_422(self, client: TestClient) -> None:
        """Empty sources list → validation error."""
        resp = client.post(
            "/nlp/credibility/score",
            json={
                "fact_text": "No sources.",
                "sources": [],
            },
        )
        assert resp.status_code == 422
