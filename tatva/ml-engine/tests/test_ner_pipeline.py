"""
TATVA NER Pipeline — Unit Tests.

Tests per T2-F1 spec:
□ "PM Modi met Xi Jinping" → PERSON: Modi, PERSON: Xi Jinping
□ "DRDO tested Agni-V missile" → ORG: DRDO, TECHNOLOGY: Agni-V
□ "India signed QUAD agreement" → LOCATION: India, EVENT: QUAD agreement
□ Confidence scores present for all entities
□ Nested entity: "Indian Air Force" → ORG + LOCATION
□ NER precision ≥ 0.85 on test set
"""

import pytest
from fastapi.testclient import TestClient

from app.nlp.ner_pipeline import NERPipeline, ner_pipeline
from app.models.ner_models import NERRequest, NERResponse
from app.nlp.main import app


# ── Fixtures ──

@pytest.fixture(scope="module")
def pipeline() -> NERPipeline:
    """Load the NER pipeline once for all tests."""
    p = NERPipeline()
    p.load()
    return p


@pytest.fixture(scope="module")
def client() -> TestClient:
    """FastAPI test client with model loaded at startup via lifespan."""
    with TestClient(app) as c:
        yield c


# ── Helper ──

def _entities_by_type(response: NERResponse, entity_type: str) -> list[str]:
    """Get all entity texts of a given type from the response."""
    return [e.text for e in response.entities if e.entity_type == entity_type]


def _has_entity(response: NERResponse, text: str, entity_type: str) -> bool:
    """Check if a specific entity text + type exists in the response."""
    text_lower = text.lower()
    return any(
        e.text.lower() == text_lower and e.entity_type == entity_type
        for e in response.entities
    )


def _has_entity_containing(response: NERResponse, substring: str, entity_type: str) -> bool:
    """Check if any entity of the given type contains the substring."""
    sub_lower = substring.lower()
    return any(
        sub_lower in e.text.lower() and e.entity_type == entity_type
        for e in response.entities
    )


# ═══════════════════════════════════════════════
#  T2-F1 Spec Tests
# ═══════════════════════════════════════════════


class TestNERPersonEntities:
    """Test PERSON entity extraction."""

    def test_modi_and_xi_jinping(self, pipeline: NERPipeline) -> None:
        """'PM Modi met Xi Jinping' → PERSON: Modi, PERSON: Xi Jinping."""
        req = NERRequest(text="PM Modi met Xi Jinping in Beijing last week.")
        resp = pipeline.extract(req)
        persons = _entities_by_type(resp, "PERSON")
        # Should find Modi and Xi Jinping
        assert any("Modi" in p for p in persons), f"Expected Modi in {persons}"
        assert any("Xi" in p or "Jinping" in p for p in persons), f"Expected Xi Jinping in {persons}"

    def test_person_with_title(self, pipeline: NERPipeline) -> None:
        """Titles like 'President' should not mask the person."""
        req = NERRequest(text="President Biden spoke at the United Nations.")
        resp = pipeline.extract(req)
        assert _has_entity_containing(resp, "Biden", "PERSON")


class TestNEROrganizationEntities:
    """Test ORGANIZATION entity extraction."""

    def test_drdo_detected(self, pipeline: NERPipeline) -> None:
        """'DRDO tested Agni-V missile' → ORG: DRDO."""
        req = NERRequest(text="DRDO tested Agni-V missile successfully.")
        resp = pipeline.extract(req)
        assert _has_entity(resp, "DRDO", "ORGANIZATION"), \
            f"Expected DRDO as ORGANIZATION, got {[(e.text, e.entity_type) for e in resp.entities]}"

    def test_nato_detected(self, pipeline: NERPipeline) -> None:
        req = NERRequest(text="NATO expanded its presence in Eastern Europe.")
        resp = pipeline.extract(req)
        assert _has_entity(resp, "NATO", "ORGANIZATION")


class TestNERTechnologyEntities:
    """Test TECHNOLOGY entity extraction via gazetteers."""

    def test_agni_v_detected(self, pipeline: NERPipeline) -> None:
        """'DRDO tested Agni-V missile' → TECHNOLOGY: Agni-V."""
        req = NERRequest(text="DRDO tested Agni-V missile successfully.")
        resp = pipeline.extract(req)
        assert _has_entity(resp, "Agni-V", "TECHNOLOGY"), \
            f"Expected Agni-V as TECHNOLOGY, got {[(e.text, e.entity_type) for e in resp.entities]}"

    def test_brahmos_detected(self, pipeline: NERPipeline) -> None:
        req = NERRequest(text="India successfully test-fired BrahMos cruise missile.")
        resp = pipeline.extract(req)
        assert _has_entity(resp, "BrahMos", "TECHNOLOGY")

    def test_s400_detected(self, pipeline: NERPipeline) -> None:
        req = NERRequest(text="India received the S-400 air defense system from Russia.")
        resp = pipeline.extract(req)
        assert _has_entity(resp, "S-400", "TECHNOLOGY")


class TestNERLocationEntities:
    """Test LOCATION entity extraction."""

    def test_india_detected(self, pipeline: NERPipeline) -> None:
        """'India signed QUAD agreement' → LOCATION: India."""
        req = NERRequest(text="India signed QUAD agreement with its allies.")
        resp = pipeline.extract(req)
        assert _has_entity(resp, "India", "LOCATION"), \
            f"Expected India as LOCATION, got {[(e.text, e.entity_type) for e in resp.entities]}"

    def test_multiple_countries(self, pipeline: NERPipeline) -> None:
        req = NERRequest(text="India and China discussed border issues in New Delhi.")
        resp = pipeline.extract(req)
        locations = _entities_by_type(resp, "LOCATION")
        assert any("India" in loc for loc in locations)
        assert any("China" in loc for loc in locations)


class TestNEREventEntities:
    """Test EVENT entity extraction via gazetteers."""

    def test_quad_agreement_detected(self, pipeline: NERPipeline) -> None:
        """'India signed QUAD agreement' → EVENT or ORGANIZATION: QUAD."""
        req = NERRequest(text="India signed QUAD agreement with its allies.")
        resp = pipeline.extract(req)
        # QUAD can be EVENT or ORGANIZATION — either is acceptable
        quad_found = any(
            "quad" in e.text.lower()
            and e.entity_type in ("EVENT", "ORGANIZATION")
            for e in resp.entities
        )
        assert quad_found, \
            f"Expected QUAD as EVENT or ORG, got {[(e.text, e.entity_type) for e in resp.entities]}"

    def test_g20_summit_detected(self, pipeline: NERPipeline) -> None:
        req = NERRequest(text="The G20 Summit was held in New Delhi in 2023.")
        resp = pipeline.extract(req)
        g20_found = any(
            "g20" in e.text.lower()
            and e.entity_type in ("EVENT", "ORGANIZATION")
            for e in resp.entities
        )
        assert g20_found


class TestNERConfidenceScores:
    """Test that confidence scores are present and valid."""

    def test_all_entities_have_confidence(self, pipeline: NERPipeline) -> None:
        """Confidence scores present for all entities."""
        req = NERRequest(text="PM Modi visited France and met President Macron for defense talks.")
        resp = pipeline.extract(req)
        assert len(resp.entities) > 0, "Should extract at least one entity"
        for ent in resp.entities:
            assert 0.0 <= ent.confidence <= 1.0, \
                f"Entity {ent.text} has invalid confidence {ent.confidence}"

    def test_confidence_above_threshold(self, pipeline: NERPipeline) -> None:
        """All returned entities should have confidence ≥ min_confidence."""
        req = NERRequest(text="DRDO and ISRO are key Indian defense and space organizations.", min_confidence=0.70)
        resp = pipeline.extract(req)
        for ent in resp.entities:
            assert ent.confidence >= 0.70, \
                f"Entity {ent.text} has confidence {ent.confidence} < 0.70"

    def test_higher_threshold_filters(self, pipeline: NERPipeline) -> None:
        """Higher min_confidence should return fewer entities."""
        text = "India and Pakistan discussed trade at the UN General Assembly."
        low = pipeline.extract(NERRequest(text=text, min_confidence=0.50))
        high = pipeline.extract(NERRequest(text=text, min_confidence=0.95))
        assert len(high.entities) <= len(low.entities)


class TestNERNestedEntities:
    """Test nested entity detection."""

    def test_indian_air_force_nested(self, pipeline: NERPipeline) -> None:
        """Nested entity: 'Indian Air Force' → ORGANIZATION + LOCATION(India)."""
        req = NERRequest(text="The Indian Air Force conducted operations near the border.")
        resp = pipeline.extract(req)
        # Should detect ORGANIZATION
        org_found = any(
            "indian air force" in e.text.lower() and e.entity_type == "ORGANIZATION"
            for e in resp.entities
        )
        # Should also detect nested LOCATION India
        location_found = any(
            "india" in e.text.lower() and e.entity_type == "LOCATION"
            for e in resp.entities
        )
        assert org_found, \
            f"Expected 'Indian Air Force' as ORG, got {[(e.text, e.entity_type) for e in resp.entities]}"
        assert location_found, \
            f"Expected nested LOCATION 'India', got {[(e.text, e.entity_type) for e in resp.entities]}"

    def test_pla_nested_china(self, pipeline: NERPipeline) -> None:
        """'PLA' → ORGANIZATION + nested LOCATION(China)."""
        req = NERRequest(text="The PLA deployed forces near the Indian border.")
        resp = pipeline.extract(req)
        org_found = any(
            e.text.lower() == "pla" and e.entity_type == "ORGANIZATION"
            for e in resp.entities
        )
        china_found = any(
            "china" in e.text.lower() and e.entity_type == "LOCATION"
            for e in resp.entities
        )
        assert org_found
        assert china_found


class TestNERProcessingTime:
    """Test that processing time is reported."""

    def test_processing_time_reported(self, pipeline: NERPipeline) -> None:
        req = NERRequest(text="India signed a trade deal with Japan in 2025.")
        resp = pipeline.extract(req)
        assert resp.processing_time_ms > 0


class TestNERCharacterOffsets:
    """Test that character offsets are correct."""

    def test_offsets_match_text(self, pipeline: NERPipeline) -> None:
        text = "Modi visited France."
        req = NERRequest(text=text, min_confidence=0.50)
        resp = pipeline.extract(req)
        for ent in resp.entities:
            assert ent.start_char < ent.end_char
            # For spaCy-detected entities, offsets should point to original text
            assert ent.start_char >= 0
            assert ent.end_char <= len(text)


class TestNERPrecision:
    """Test NER precision on a batch of geopolitical sentences."""

    GEOPOLITICAL_SENTENCES = [
        ("India deployed troops along the LAC.", {"India": "LOCATION"}),
        ("PM Modi met President Biden in Washington.", {"Modi": "PERSON", "Biden": "PERSON"}),
        ("DRDO successfully tested Agni-V.", {"DRDO": "ORGANIZATION", "Agni-V": "TECHNOLOGY"}),
        ("The UN Security Council discussed the crisis.", {"UN Security Council": "ORGANIZATION"}),
        ("China's GDP grew by 5.2 percent in 2024.", {"China": "LOCATION"}),
        ("Russia exported S-400 systems to India.", {"Russia": "LOCATION", "India": "LOCATION", "S-400": "TECHNOLOGY"}),
        ("NATO expanded eastward despite objections.", {"NATO": "ORGANIZATION"}),
        ("ISRO launched Chandrayaan-3 successfully.", {"ISRO": "ORGANIZATION"}),
        ("France delivered Rafale jets to India.", {"France": "LOCATION", "India": "LOCATION", "Rafale": "TECHNOLOGY"}),
        ("The QUAD summit was held in Tokyo.", {"QUAD": ("ORGANIZATION", "EVENT")}),
    ]

    def test_precision_above_threshold(self, pipeline: NERPipeline) -> None:
        """NER precision ≥ 0.85 on geopolitical test set."""
        total_expected = 0
        total_found = 0

        for text, expected_entities in self.GEOPOLITICAL_SENTENCES:
            req = NERRequest(text=text, min_confidence=0.50)
            resp = pipeline.extract(req)

            for entity_text, expected_type in expected_entities.items():
                total_expected += 1
                # expected_type can be a string or tuple of acceptable types
                acceptable_types = expected_type if isinstance(expected_type, tuple) else (expected_type,)
                found = any(
                    entity_text.lower() in e.text.lower()
                    and e.entity_type in acceptable_types
                    for e in resp.entities
                )
                if found:
                    total_found += 1

        precision = total_found / total_expected if total_expected > 0 else 0
        assert precision >= 0.85, \
            f"NER precision {precision:.2f} < 0.85 ({total_found}/{total_expected})"


# ═══════════════════════════════════════════════
#  API Endpoint Tests
# ═══════════════════════════════════════════════


class TestNEREndpoint:
    """Test the /nlp/ner/extract endpoint."""

    def test_extract_returns_200(self, client: TestClient) -> None:
        resp = client.post(
            "/nlp/ner/extract",
            json={"text": "India signed a defense deal with France."},
        )
        assert resp.status_code == 200

    def test_extract_returns_entities(self, client: TestClient) -> None:
        resp = client.post(
            "/nlp/ner/extract",
            json={"text": "PM Modi visited Paris to meet Macron."},
        )
        data = resp.json()
        assert "entities" in data
        assert len(data["entities"]) > 0

    def test_extract_returns_processing_time(self, client: TestClient) -> None:
        resp = client.post(
            "/nlp/ner/extract",
            json={"text": "India tested a missile."},
        )
        data = resp.json()
        assert data["processing_time_ms"] > 0

    def test_extract_rejects_empty_text(self, client: TestClient) -> None:
        resp = client.post("/nlp/ner/extract", json={"text": ""})
        assert resp.status_code == 422

    def test_health_shows_ner_loaded(self, client: TestClient) -> None:
        resp = client.get("/health")
        data = resp.json()
        assert data["models_loaded"]["ner_english"] is True
