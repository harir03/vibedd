"""
TATVA Reasoning Service — Health & Validation Tests.
"""

import pytest
from fastapi.testclient import TestClient

from app.reasoning.main import app

client = TestClient(app)


class TestReasoningHealth:
    """Tests for the Reasoning service health endpoint."""

    def test_health_returns_ok(self) -> None:
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_has_correct_service_name(self) -> None:
        response = client.get("/health")
        data = response.json()
        assert data["service"] == "tatva-reasoning-service"
        assert data["status"] == "UP"

    def test_health_reports_llm_status(self) -> None:
        response = client.get("/health")
        data = response.json()
        assert "llm_available" in data
        assert "ollama_model" in data


class TestReasoningStubEndpoints:
    """Tests that all Reasoning stub endpoints return 501 Not Implemented."""

    def test_ask_returns_501(self) -> None:
        response = client.post(
            "/reasoning/ask/",
            json={"question": "What are India's defense ties with France?"},
        )
        assert response.status_code == 501

    def test_scenario_model_returns_501(self) -> None:
        response = client.post(
            "/reasoning/scenario/model",
            json={
                "scenario_description": "What if China invades Taiwan?",
            },
        )
        assert response.status_code == 501

    def test_report_generate_returns_501(self) -> None:
        response = client.post(
            "/reasoning/report/generate",
            json={"topic": "India-China relations 2024"},
        )
        assert response.status_code == 501


class TestReasoningInputValidation:
    """Tests for Pydantic input validation on Reasoning endpoints."""

    def test_ask_rejects_empty_question(self) -> None:
        response = client.post(
            "/reasoning/ask/",
            json={"question": ""},
        )
        assert response.status_code == 422

    def test_scenario_rejects_short_description(self) -> None:
        response = client.post(
            "/reasoning/scenario/model",
            json={"scenario_description": "Short"},
        )
        assert response.status_code == 422

    def test_report_rejects_empty_topic(self) -> None:
        response = client.post(
            "/reasoning/report/generate",
            json={"topic": ""},
        )
        assert response.status_code == 422

    def test_ask_rejects_invalid_max_context(self) -> None:
        response = client.post(
            "/reasoning/ask/",
            json={
                "question": "What happened?",
                "max_context_entities": 0,
            },
        )
        assert response.status_code == 422

    def test_scenario_rejects_invalid_depth(self) -> None:
        response = client.post(
            "/reasoning/scenario/model",
            json={
                "scenario_description": "What if China invades Taiwan and causes global disruption?",
                "max_cascade_depth": 10,
            },
        )
        assert response.status_code == 422
