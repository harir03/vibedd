"""
TATVA NLP Service — Health & Validation Tests.
"""

import pytest
from fastapi.testclient import TestClient

from app.nlp.main import app

client = TestClient(app)


class TestNLPHealth:
    """Tests for the NLP service health endpoint."""

    def test_health_returns_ok(self) -> None:
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_has_correct_service_name(self) -> None:
        response = client.get("/health")
        data = response.json()
        assert data["service"] == "tatva-nlp-service"
        assert data["status"] == "UP"

    def test_health_reports_model_status(self) -> None:
        response = client.get("/health")
        data = response.json()
        assert "models_loaded" in data
        assert "ner_english" in data["models_loaded"]
        assert "ner_hindi" in data["models_loaded"]
        assert "embedding" in data["models_loaded"]
        assert "nl_to_cypher" in data["models_loaded"]


class TestNLPStubEndpoints:
    """Tests that all NLP stub endpoints return 501 Not Implemented."""

    def test_ner_extract_returns_501(self) -> None:
        response = client.post(
            "/nlp/ner/extract",
            json={"text": "India signed a defense deal with France."},
        )
        assert response.status_code == 501

    def test_relation_extract_returns_501(self) -> None:
        response = client.post(
            "/nlp/relations/extract",
            json={"text": "India signed a defense deal with France."},
        )
        assert response.status_code == 501

    def test_entity_resolution_returns_501(self) -> None:
        response = client.post(
            "/nlp/entity-resolution/resolve",
            json={"entity_text": "PM Modi"},
        )
        assert response.status_code == 501

    def test_credibility_score_returns_501(self) -> None:
        response = client.post(
            "/nlp/credibility/score",
            json={
                "fact_text": "India tested a new missile.",
                "sources": [
                    {
                        "source_name": "Reuters",
                        "source_tier": 1,
                        "publication_date": "2025-01-01",
                    }
                ],
            },
        )
        assert response.status_code == 501

    def test_embedding_generate_returns_501(self) -> None:
        response = client.post(
            "/nlp/embeddings/generate",
            json={"text": "India nuclear submarine program"},
        )
        assert response.status_code == 501

    def test_similarity_search_returns_501(self) -> None:
        response = client.post(
            "/nlp/embeddings/search",
            json={"query_text": "India nuclear submarine"},
        )
        assert response.status_code == 501

    def test_nl_query_translate_returns_501(self) -> None:
        response = client.post(
            "/nlp/query/translate",
            json={"question": "Show all defense deals with France"},
        )
        assert response.status_code == 501


class TestNLPInputValidation:
    """Tests for Pydantic input validation on NLP endpoints."""

    def test_ner_rejects_empty_text(self) -> None:
        response = client.post("/nlp/ner/extract", json={"text": ""})
        assert response.status_code == 422

    def test_ner_rejects_invalid_confidence(self) -> None:
        response = client.post(
            "/nlp/ner/extract",
            json={"text": "India", "min_confidence": 1.5},
        )
        assert response.status_code == 422

    def test_credibility_rejects_empty_sources(self) -> None:
        response = client.post(
            "/nlp/credibility/score",
            json={"fact_text": "Some fact.", "sources": []},
        )
        assert response.status_code == 422

    def test_credibility_rejects_invalid_tier(self) -> None:
        response = client.post(
            "/nlp/credibility/score",
            json={
                "fact_text": "Some fact.",
                "sources": [
                    {
                        "source_name": "Unknown",
                        "source_tier": 6,
                        "publication_date": "2025-01-01",
                    }
                ],
            },
        )
        assert response.status_code == 422

    def test_similarity_search_rejects_invalid_top_k(self) -> None:
        response = client.post(
            "/nlp/embeddings/search",
            json={"query_text": "India", "top_k": 0},
        )
        assert response.status_code == 422
