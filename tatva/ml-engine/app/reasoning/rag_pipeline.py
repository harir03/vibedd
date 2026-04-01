"""
TATVA — RAG Pipeline.

Retrieval-Augmented Generation: graph context → LLM prompt → validated answer.
"""

from __future__ import annotations

import time
from typing import FrozenSet, List, Optional

from app.models.reasoning_models import (
    ReasoningRequest,
    ReasoningResponse,
    SourceCitation,
)
from app.reasoning.llm_client import LLMClient, llm_client
from app.reasoning.prompt_templates import (
    INTELLIGENCE_ANALYST_SYSTEM,
    build_rag_prompt,
)
from app.reasoning.hallucination_detector import detect_hallucination
from app.reasoning.response_validator import validate_response


class RAGPipeline:
    """
    Retrieval-Augmented Generation pipeline.

    Steps:
    1. Retrieve relevant graph context (entities + relationships).
    2. Build prompt with system instructions + context + question.
    3. Call local LLM (Ollama) for inference.
    4. Validate response (hallucination, bias, prompt leak).
    5. Return structured answer with confidence and sources.
    """

    def __init__(
        self,
        client: Optional[LLMClient] = None,
    ) -> None:
        self._client = client or llm_client
        # Known entities from graph — populated at startup or per-query.
        self._known_entities: FrozenSet[str] = frozenset()

    def set_known_entities(self, entities: FrozenSet[str]) -> None:
        """Update the set of known graph entities (lowercase names)."""
        self._known_entities = entities

    def answer(
        self,
        request: ReasoningRequest,
        graph_context: str = "",
    ) -> ReasoningResponse:
        """
        Answer an intelligence question using RAG.

        Args:
            request: The reasoning request with the question.
            graph_context: Serialised graph subgraph as context text.
                           If empty, LLM operates without context.
        """
        t_start = time.perf_counter()

        # Build prompt
        user_prompt = build_rag_prompt(request.question, graph_context)

        # Call LLM
        raw_answer = self._client.generate(
            system_prompt=INTELLIGENCE_ANALYST_SYSTEM,
            user_prompt=user_prompt,
        )

        # Validate response
        cleaned_answer, was_filtered, filter_reason = validate_response(raw_answer)

        # Hallucination detection
        is_hallucinated, hall_rate, unknown_entities = detect_hallucination(
            cleaned_answer,
            self._known_entities,
        )

        # Compute confidence
        confidence = self._compute_confidence(
            has_context=bool(graph_context),
            was_filtered=was_filtered,
            hallucination_rate=hall_rate,
        )

        t_ms = (time.perf_counter() - t_start) * 1000

        return ReasoningResponse(
            answer=cleaned_answer,
            confidence=round(confidence, 2),
            sources=[],  # Populated from graph context in production
            entities_referenced=[],
            hallucination_flag=is_hallucinated,
            processing_time_ms=round(t_ms, 1),
        )

    @staticmethod
    def _compute_confidence(
        has_context: bool,
        was_filtered: bool,
        hallucination_rate: float,
    ) -> float:
        """Heuristic confidence score for the answer."""
        base = 0.90 if has_context else 0.50
        if was_filtered:
            base *= 0.3
        base *= (1.0 - hallucination_rate)
        return max(0.0, min(1.0, base))


# Module singleton
rag_pipeline = RAGPipeline()
