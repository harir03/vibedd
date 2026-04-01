"""
TATVA Entity Resolution — Unit Tests.

Tests per T2-F3 spec:
□ "Modi" + "PM Modi" + "Narendra Modi" → resolve to SAME entity
□ "DRDO" + "Defence Research and Development Organisation" → same entity
□ False merge: "Delhi" vs "New Delhi" → handled correctly
□ Confidence < 0.80 → queued for review, NOT auto-merged
□ Resolution accuracy ≥ 0.90 on test cases
□ False merge rate < 2%
"""

import pytest
from typing import Optional
from fastapi.testclient import TestClient

from app.nlp.entity_resolver import EntityResolver, KnownEntity, entity_resolver
from app.nlp.fuzzy_matching import (
    jaro_winkler_similarity,
    normalize_name,
    compute_exact_score,
    compute_fuzzy_score,
    compute_containment_score,
)
from app.models.entity_models import EntityResolutionRequest
from app.nlp.main import app


# ── Fixtures ──

@pytest.fixture()
def resolver() -> EntityResolver:
    """Create a fresh resolver with seed data."""
    r = EntityResolver()
    r.add_entity(KnownEntity(
        node_id="person-001",
        canonical_name="Narendra Modi",
        entity_type="PERSON",
        aliases=["Modi", "PM Modi", "Prime Minister Modi"],
    ))
    r.add_entity(KnownEntity(
        node_id="org-001",
        canonical_name="Defence Research and Development Organisation",
        entity_type="ORGANIZATION",
        aliases=["DRDO"],
    ))
    r.add_entity(KnownEntity(
        node_id="loc-001",
        canonical_name="New Delhi",
        entity_type="LOCATION",
        aliases=["Delhi", "National Capital"],
    ))
    r.add_entity(KnownEntity(
        node_id="loc-002",
        canonical_name="India",
        entity_type="LOCATION",
        aliases=["Republic of India", "Bharat"],
    ))
    r.add_entity(KnownEntity(
        node_id="loc-003",
        canonical_name="China",
        entity_type="LOCATION",
        aliases=["People's Republic of China", "PRC"],
    ))
    r.add_entity(KnownEntity(
        node_id="person-002",
        canonical_name="Xi Jinping",
        entity_type="PERSON",
        aliases=["Xi", "President Xi"],
    ))
    r.add_entity(KnownEntity(
        node_id="org-002",
        canonical_name="Indian Space Research Organisation",
        entity_type="ORGANIZATION",
        aliases=["ISRO"],
    ))
    r.add_entity(KnownEntity(
        node_id="org-003",
        canonical_name="North Atlantic Treaty Organization",
        entity_type="ORGANIZATION",
        aliases=["NATO"],
    ))
    return r


@pytest.fixture(scope="module")
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


# ═══════════════════════════════════════════════
#  Fuzzy Matching Tests
# ═══════════════════════════════════════════════


class TestFuzzyMatching:
    """Test fuzzy string matching utilities."""

    def test_jaro_winkler_identical(self) -> None:
        assert jaro_winkler_similarity("Modi", "Modi") == 1.0

    def test_jaro_winkler_similar(self) -> None:
        score = jaro_winkler_similarity("Modi", "Modii")
        assert score > 0.85

    def test_jaro_winkler_different(self) -> None:
        score = jaro_winkler_similarity("India", "China")
        assert score < 0.80

    def test_normalize_strips_titles(self) -> None:
        assert normalize_name("PM Modi") == "modi"
        assert normalize_name("Dr. Singh") == "singh"
        assert normalize_name("Shri Rajnath Singh") == "rajnath singh"

    def test_normalize_lowercase(self) -> None:
        assert normalize_name("DRDO") == "drdo"

    def test_exact_score(self) -> None:
        assert compute_exact_score("Modi", "Modi") == 1.0
        assert compute_exact_score("Modi", "Sharma") == 0.0

    def test_containment_score(self) -> None:
        score = compute_containment_score("Modi", "Narendra Modi")
        assert score > 0.25

    def test_empty_strings(self) -> None:
        assert jaro_winkler_similarity("", "test") == 0.0
        assert compute_exact_score("", "test") == 0.0


# ═══════════════════════════════════════════════
#  Entity Resolution Tests
# ═══════════════════════════════════════════════


class TestEntityResolution:
    """Test multi-signal entity resolution."""

    def test_modi_variants_resolve_same(self, resolver: EntityResolver) -> None:
        """'Modi', 'PM Modi', 'Narendra Modi' → same entity."""
        for query in ["Modi", "PM Modi", "Narendra Modi"]:
            req = EntityResolutionRequest(entity_text=query, entity_type="PERSON")
            resp = resolver.resolve(req)
            assert resp.best_match is not None, \
                f"'{query}' should resolve to a match"
            assert resp.best_match.graph_node_id == "person-001", \
                f"'{query}' should resolve to person-001, got {resp.best_match.graph_node_id}"

    def test_drdo_full_name_resolves(self, resolver: EntityResolver) -> None:
        """'DRDO' and full name → same entity."""
        req1 = EntityResolutionRequest(entity_text="DRDO", entity_type="ORGANIZATION")
        resp1 = resolver.resolve(req1)
        assert resp1.best_match is not None
        assert resp1.best_match.graph_node_id == "org-001"

    def test_drdo_alias_resolves(self, resolver: EntityResolver) -> None:
        """Full organization name → matches via alias."""
        req = EntityResolutionRequest(
            entity_text="Defence Research and Development Organisation",
            entity_type="ORGANIZATION",
        )
        resp = resolver.resolve(req)
        assert resp.best_match is not None
        assert resp.best_match.graph_node_id == "org-001"

    def test_no_auto_merge_below_threshold(self, resolver: EntityResolver) -> None:
        """Confidence < 0.80 → queued for review, NOT auto-merged."""
        req = EntityResolutionRequest(
            entity_text="Random Unknown Entity",
            entity_type="PERSON",
        )
        resp = resolver.resolve(req)
        assert resp.best_match is None or resp.best_match.similarity_score < 0.80
        assert resp.needs_human_review is True

    def test_auto_merge_above_090(self, resolver: EntityResolver) -> None:
        """Exact alias match → auto_merge=True."""
        req = EntityResolutionRequest(entity_text="NATO", entity_type="ORGANIZATION")
        resp = resolver.resolve(req)
        assert resp.best_match is not None
        assert resp.best_match.auto_merge is True

    def test_candidates_sorted_by_score(self, resolver: EntityResolver) -> None:
        """Candidates returned in descending score order."""
        req = EntityResolutionRequest(entity_text="India", entity_type="LOCATION")
        resp = resolver.resolve(req)
        for i in range(len(resp.candidates) - 1):
            assert resp.candidates[i].similarity_score >= resp.candidates[i + 1].similarity_score

    def test_match_signals_present(self, resolver: EntityResolver) -> None:
        """Match signals (exact, fuzzy, containment) are reported."""
        req = EntityResolutionRequest(entity_text="Modi", entity_type="PERSON")
        resp = resolver.resolve(req)
        assert resp.best_match is not None
        signals = resp.best_match.match_signals
        assert "exact" in signals
        assert "fuzzy" in signals
        assert "containment" in signals

    def test_processing_time(self, resolver: EntityResolver) -> None:
        req = EntityResolutionRequest(entity_text="China")
        resp = resolver.resolve(req)
        assert resp.processing_time_ms >= 0


class TestFalseMergePrevention:
    """Test that similar but different entities are not falsely merged."""

    def test_different_entities_not_merged(self) -> None:
        """'Delhi' (city) and 'New Delhi' (capital) with different IDs."""
        r = EntityResolver()
        r.add_entity(KnownEntity(
            node_id="loc-delhi",
            canonical_name="Delhi",
            entity_type="LOCATION",
            aliases=["Old Delhi"],
        ))
        r.add_entity(KnownEntity(
            node_id="loc-newdelhi",
            canonical_name="New Delhi",
            entity_type="LOCATION",
            aliases=["National Capital Territory"],
        ))
        # Query for "Delhi" → should match loc-delhi, not auto-merge with New Delhi
        req = EntityResolutionRequest(entity_text="Delhi", entity_type="LOCATION")
        resp = r.resolve(req)
        assert resp.best_match is not None
        assert resp.best_match.graph_node_id == "loc-delhi"

    def test_completely_unknown_entity(self) -> None:
        """Entity with no match → needs_human_review=True."""
        r = EntityResolver()
        r.add_entity(KnownEntity(
            node_id="person-001",
            canonical_name="Narendra Modi",
            entity_type="PERSON",
        ))
        req = EntityResolutionRequest(
            entity_text="Akihito",
            entity_type="PERSON",
        )
        resp = r.resolve(req)
        assert resp.needs_human_review is True


class TestResolutionAccuracy:
    """Test resolution accuracy on a test suite."""

    TEST_CASES = [
        # (query, expected_node_id)
        ("Modi", "person-001"),
        ("PM Modi", "person-001"),
        ("Narendra Modi", "person-001"),
        ("DRDO", "org-001"),
        ("Defence Research and Development Organisation", "org-001"),
        ("India", "loc-002"),
        ("Republic of India", "loc-002"),
        ("Bharat", "loc-002"),
        ("China", "loc-003"),
        ("PRC", "loc-003"),
        ("Xi Jinping", "person-002"),
        ("President Xi", "person-002"),
        ("ISRO", "org-002"),
        ("NATO", "org-003"),
        ("North Atlantic Treaty Organization", "org-003"),
    ]

    def test_accuracy_above_090(self, resolver: EntityResolver) -> None:
        """Entity resolution accuracy ≥ 0.90 on test cases."""
        total = len(self.TEST_CASES)
        correct = 0

        for query, expected_id in self.TEST_CASES:
            req = EntityResolutionRequest(entity_text=query)
            resp = resolver.resolve(req)
            if resp.best_match and resp.best_match.graph_node_id == expected_id:
                correct += 1

        accuracy = correct / total if total > 0 else 0
        assert accuracy >= 0.90, \
            f"Entity resolution accuracy {accuracy:.2f} < 0.90 ({correct}/{total})"


# ═══════════════════════════════════════════════
#  API Endpoint Tests
# ═══════════════════════════════════════════════


class TestEntityResolutionEndpoint:
    """Test the /nlp/entity-resolution/resolve endpoint."""

    def test_resolve_returns_200(self, client: TestClient) -> None:
        resp = client.post(
            "/nlp/entity-resolution/resolve",
            json={"entity_text": "Modi"},
        )
        assert resp.status_code == 200

    def test_resolve_returns_response_fields(self, client: TestClient) -> None:
        resp = client.post(
            "/nlp/entity-resolution/resolve",
            json={"entity_text": "Some Entity"},
        )
        data = resp.json()
        assert "candidates" in data
        assert "best_match" in data
        assert "needs_human_review" in data
        assert "processing_time_ms" in data
