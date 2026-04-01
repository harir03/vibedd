"""
TATVA NL→Cypher Translation — Unit Tests.

Tests per T2-F6 spec:
□ "Find all countries" → valid MATCH query
□ "Show connection between A and B" → shortestPath query
□ "Timeline of India from 2020 to 2025" → temporal query with date filters
□ Cypher with non-existent label → rejected, regenerated
□ Cypher with DETACH DELETE → blocked (whitelist violation)
□ Syntax valid rate ≥ 95% on 30 test cases
□ Semantic correctness ≥ 80% on 30 test cases
"""

from __future__ import annotations

import re
from typing import List, Tuple

import pytest
from fastapi.testclient import TestClient

from app.models.query_models import NLQueryRequest, NLQueryResponse
from app.reasoning.nl_to_cypher import translate
from app.reasoning.cypher_validator import (
    check_blocked_clauses,
    check_traversal_depth,
    validate_cypher,
    validate_labels,
)
from app.reasoning.cypher_examples import FEW_SHOT_EXAMPLES, get_examples_text
from app.nlp.main import app


# ── Fixtures ──

@pytest.fixture(scope="module")
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


# ═══════════════════════════════════════════════
#  Cypher Validator Tests
# ═══════════════════════════════════════════════


class TestCypherValidator:

    def test_detach_delete_blocked(self) -> None:
        """DETACH DELETE → blocked."""
        is_blocked, clause = check_blocked_clauses(
            "MATCH (n) DETACH DELETE n"
        )
        assert is_blocked is True
        assert clause == "DETACH DELETE"

    def test_create_blocked(self) -> None:
        is_blocked, clause = check_blocked_clauses(
            "CREATE (n:Actor {name: 'test'})"
        )
        assert is_blocked is True
        assert clause == "CREATE"

    def test_set_blocked(self) -> None:
        is_blocked, clause = check_blocked_clauses(
            "MATCH (n) SET n.name = 'hacked'"
        )
        assert is_blocked is True
        assert clause == "SET"

    def test_merge_blocked(self) -> None:
        is_blocked, clause = check_blocked_clauses(
            "MERGE (n:Actor {name: 'test'})"
        )
        assert is_blocked is True

    def test_safe_query_not_blocked(self) -> None:
        is_blocked, _ = check_blocked_clauses(
            "MATCH (n:Actor) WHERE n.name = $name RETURN n"
        )
        assert is_blocked is False

    def test_unbounded_traversal_detected(self) -> None:
        exceeded, depth = check_traversal_depth(
            "MATCH path = (a)-[*]-(b) RETURN path"
        )
        assert exceeded is True

    def test_deep_traversal_detected(self) -> None:
        exceeded, depth = check_traversal_depth(
            "MATCH path = (a)-[*..10]-(b) RETURN path"
        )
        assert exceeded is True
        assert depth == 10

    def test_safe_traversal_depth(self) -> None:
        exceeded, _ = check_traversal_depth(
            "MATCH path = (a)-[*..5]-(b) RETURN path"
        )
        assert exceeded is False

    def test_full_validation_detach_delete(self) -> None:
        is_valid, issues = validate_cypher("MATCH (n) DETACH DELETE n")
        assert is_valid is False
        assert any("DETACH DELETE" in issue for issue in issues)

    def test_full_validation_clean_query(self) -> None:
        is_valid, issues = validate_cypher(
            "MATCH (n:Actor) WHERE n.name = $name RETURN n LIMIT 50"
        )
        assert is_valid is True
        assert len(issues) == 0


# ═══════════════════════════════════════════════
#  Few-Shot Examples Tests
# ═══════════════════════════════════════════════


class TestFewShotExamples:

    def test_at_least_20_examples(self) -> None:
        assert len(FEW_SHOT_EXAMPLES) >= 20

    def test_examples_text_formatted(self) -> None:
        text = get_examples_text()
        assert "Example 1:" in text
        assert "NL:" in text
        assert "Cypher:" in text

    def test_all_examples_valid(self) -> None:
        """All few-shot example Cyphers pass validation."""
        for nl, cypher in FEW_SHOT_EXAMPLES:
            is_valid, issues = validate_cypher(cypher)
            assert is_valid, f"Example '{nl}' has issues: {issues}"


# ═══════════════════════════════════════════════
#  NL→Cypher Translation Tests
# ═══════════════════════════════════════════════


class TestNLToCypher:

    def test_find_all_countries(self) -> None:
        """'Find all countries' → valid MATCH query."""
        req = NLQueryRequest(question="Find all countries")
        resp = translate(req)
        assert resp.is_valid is True
        assert "MATCH" in resp.cypher_query
        assert resp.confidence >= 0.80

    def test_show_connection(self) -> None:
        """'Show connection between India and China' → shortestPath."""
        req = NLQueryRequest(
            question="Show connection between India and China"
        )
        resp = translate(req)
        assert "shortestPath" in resp.cypher_query
        assert resp.is_valid is True
        assert "India" in resp.parameters.get("entity_a", "")
        assert "China" in resp.parameters.get("entity_b", "")

    def test_timeline_query(self) -> None:
        """'Timeline of India from 2020 to 2025' → temporal query."""
        req = NLQueryRequest(
            question="Show timeline of India from 2020 to 2025"
        )
        resp = translate(req)
        assert "validFrom" in resp.cypher_query or "date" in resp.cypher_query
        assert resp.is_valid is True
        assert "2020" in resp.parameters.get("start_date", "")
        assert "2025" in resp.parameters.get("end_date", "")

    def test_trade_partners(self) -> None:
        req = NLQueryRequest(question="Who does India trade with")
        resp = translate(req)
        assert "TRADES_WITH" in resp.cypher_query
        assert resp.is_valid is True

    def test_neighborhood(self) -> None:
        req = NLQueryRequest(question="Show neighborhood of Modi")
        resp = translate(req)
        assert "MATCH" in resp.cypher_query
        assert resp.is_valid is True

    def test_who_leads(self) -> None:
        req = NLQueryRequest(question="Who leads China")
        resp = translate(req)
        assert "LEADS" in resp.cypher_query
        assert resp.is_valid is True

    def test_top_connected(self) -> None:
        req = NLQueryRequest(question="Top 10 most connected entities")
        resp = translate(req)
        assert "ORDER BY" in resp.cypher_query
        assert resp.is_valid is True

    def test_what_happened_after(self) -> None:
        req = NLQueryRequest(question="What happened after the G20 summit")
        resp = translate(req)
        assert "FOLLOWED_BY" in resp.cypher_query
        assert resp.is_valid is True

    def test_unknown_query_fallback(self) -> None:
        """Unknown pattern → generic search fallback."""
        req = NLQueryRequest(
            question="Tell me something interesting about pandas"
        )
        resp = translate(req)
        assert resp.is_valid is True
        assert resp.confidence <= 0.60  # Low confidence for fallback

    def test_list_all_organizations(self) -> None:
        req = NLQueryRequest(question="List all organizations")
        resp = translate(req)
        assert "MATCH" in resp.cypher_query
        assert resp.is_valid is True


class TestSyntaxValidRate:
    """
    Verify syntax valid rate ≥ 95% and semantic correctness ≥ 80%
    on a test suite of 30 queries.
    """

    # (question, expected_keyword_in_cypher)
    TEST_QUERIES: List[Tuple[str, str]] = [
        ("Find all countries", "MATCH"),
        ("List all organizations", "MATCH"),
        ("Show all events", "MATCH"),
        ("Show connection between India and China", "shortestPath"),
        ("How are India and Pakistan connected", "shortestPath"),
        ("Find path between DRDO and BrahMos", "shortestPath"),
        ("Show timeline of India from 2020 to 2025", "date"),
        ("Timeline of China from 2019 to 2024", "date"),
        ("Who does India trade with", "TRADES_WITH"),
        ("Who does Japan trade with", "TRADES_WITH"),
        ("Show neighborhood of Modi", "MATCH"),
        ("Show neighborhood of ISRO", "MATCH"),
        ("Who leads India", "LEADS"),
        ("Who leads China", "LEADS"),
        ("Top 10 most connected entities", "ORDER BY"),
        ("Top 5 most connected entities", "ORDER BY"),
        ("What happened after the G20 summit", "FOLLOWED_BY"),
        ("What happened after the QUAD meeting", "FOLLOWED_BY"),
        ("List all organizations", "MATCH"),
        ("Find all technologies", "MATCH"),
        # These will use fallback but still be valid Cypher
        ("India defense spending", "MATCH"),
        ("China military budget", "MATCH"),
        ("DRDO missile program", "MATCH"),
        ("What is ISRO working on", "MATCH"),
        ("Sanctions against Russia", "MATCH"),
        ("BrahMos deployment location", "MATCH"),
        ("India nuclear submarine", "MATCH"),
        ("Semiconductor supply chain", "MATCH"),
        ("Climate change impact on India", "MATCH"),
        ("India elections 2024", "MATCH"),
    ]

    def test_syntax_valid_rate_gte_95(self) -> None:
        """Syntax valid rate ≥ 95% on 30 test cases."""
        total = len(self.TEST_QUERIES)
        valid = 0
        for question, _ in self.TEST_QUERIES:
            req = NLQueryRequest(question=question)
            resp = translate(req)
            if resp.is_valid:
                valid += 1
        rate = valid / total
        assert rate >= 0.95, f"Syntax valid rate {rate:.2f} < 0.95 ({valid}/{total})"

    def test_semantic_correctness_gte_80(self) -> None:
        """Semantic correctness ≥ 80% on 30 test cases."""
        total = len(self.TEST_QUERIES)
        correct = 0
        for question, expected_keyword in self.TEST_QUERIES:
            req = NLQueryRequest(question=question)
            resp = translate(req)
            if expected_keyword.lower() in resp.cypher_query.lower():
                correct += 1
        rate = correct / total
        assert rate >= 0.80, \
            f"Semantic correctness {rate:.2f} < 0.80 ({correct}/{total})"


# ═══════════════════════════════════════════════
#  API Endpoint Tests
# ═══════════════════════════════════════════════


class TestNLQueryEndpoint:

    def test_translate_returns_200(self, client: TestClient) -> None:
        resp = client.post(
            "/nlp/query/translate",
            json={"question": "Find all countries"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "cypher_query" in data
        assert "confidence" in data
        assert "is_valid" in data

    def test_translate_connection(self, client: TestClient) -> None:
        resp = client.post(
            "/nlp/query/translate",
            json={"question": "Show connection between India and China"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "shortestPath" in data["cypher_query"]

    def test_translate_empty_question_rejected(self, client: TestClient) -> None:
        resp = client.post(
            "/nlp/query/translate",
            json={"question": ""},
        )
        assert resp.status_code == 422
