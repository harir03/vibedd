"""
TATVA — Named Entity Recognition Pipeline.

Uses spaCy for base NER + custom gazetteer matching for domain-specific
entity types (TECHNOLOGY, RESOURCE, DOCUMENT, EVENT). Provides confidence
scores and handles nested entities (e.g., "Indian Air Force" → ORG + LOCATION).

Supports English text with spaCy en_core_web_sm model.
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple

import spacy
from spacy.language import Language

from app.models.ner_models import ExtractedEntity, NERRequest, NERResponse
from app.nlp.entity_types import (
    DOCUMENT_GAZETTEER,
    EVENT_GAZETTEER,
    NESTED_LOCATION_IN_ORG,
    ORGANIZATION_GAZETTEER,
    PERSON_GAZETTEER,
    RESOURCE_GAZETTEER,
    TECHNOLOGY_GAZETTEER,
    EntityType,
    get_all_gazetteers,
    map_spacy_label,
)


@dataclass
class _GazetteerMatch:
    """Internal gazetteer match result."""

    text: str
    entity_type: EntityType
    start: int
    end: int
    confidence: float = 0.85


# ── Confidence estimation heuristics ──
# spaCy's small model doesn't provide per-entity confidence.
# We estimate confidence based on multiple signals.

_BASE_SPACY_CONFIDENCE: float = 0.82
_GAZETTEER_BOOST: float = 0.08  # Boost when also in gazetteer
_SHORT_ENTITY_PENALTY: float = 0.05  # Penalty for 1-char entities
_TITLE_CASE_BOOST: float = 0.03  # Boost for proper title-case
_GAZETTEER_ONLY_CONFIDENCE: float = 0.85  # Confidence for gazetteer-only matches


class NERPipeline:
    """
    Named Entity Recognition pipeline for geopolitical text.

    Combines spaCy NER with domain-specific gazetteer matching,
    confidence estimation, and nested entity detection.
    """

    def __init__(self, model_name: str = "en_core_web_sm") -> None:
        self._nlp: Optional[Language] = None
        self._model_name = model_name
        self._loaded = False

    def load(self) -> None:
        """Load the spaCy model. Call once at startup."""
        if self._loaded:
            return
        self._nlp = spacy.load(self._model_name)
        self._loaded = True

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def extract(self, request: NERRequest) -> NERResponse:
        """
        Extract named entities from text.

        1. Run spaCy NER to get base entities
        2. Run gazetteer matching for domain-specific entities
        3. Merge results, resolve overlaps (spaCy wins for overlapping spans)
        4. Estimate confidence scores
        5. Detect nested entities (e.g., "Indian Air Force" → ORG + LOCATION)
        6. Filter by min_confidence threshold

        Args:
            request: NER extraction request with text and options.

        Returns:
            NERResponse with extracted entities, language, and timing.
        """
        if not self._loaded or self._nlp is None:
            raise RuntimeError("NER model not loaded. Call load() first.")

        start_time = time.perf_counter()

        doc = self._nlp(request.text)

        # Step 1: Extract spaCy entities
        spacy_entities = self._extract_spacy_entities(doc)

        # Step 2: Extract gazetteer matches
        gazetteer_entities = self._extract_gazetteer_entities(request.text)

        # Step 3: Merge — spaCy entities take priority for overlaps,
        # but gazetteer can re-type entities or add new ones
        merged = self._merge_entities(spacy_entities, gazetteer_entities)

        # Step 4: Detect nested entities
        nested = self._detect_nested_entities(merged, request.text)
        merged.extend(nested)

        # Step 5: Deduplicate (same span + type)
        merged = self._deduplicate(merged)

        # Step 6: Filter by min_confidence
        filtered = [
            e for e in merged if e.confidence >= request.min_confidence
        ]

        # Sort by start position
        filtered.sort(key=lambda e: (e.start_char, -e.confidence))

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        return NERResponse(
            entities=filtered,
            text_language=request.language if request.language != "auto" else "en",
            processing_time_ms=round(elapsed_ms, 2),
        )

    def _extract_spacy_entities(self, doc: spacy.tokens.Doc) -> List[ExtractedEntity]:
        """Extract entities from spaCy Doc and map to TATVA types."""
        entities: List[ExtractedEntity] = []
        for ent in doc.ents:
            tatva_type = map_spacy_label(ent.label_)
            if tatva_type is None:
                continue

            confidence = self._estimate_confidence(
                ent.text, tatva_type, ent.label_
            )

            entities.append(
                ExtractedEntity(
                    text=ent.text,
                    entity_type=tatva_type.value,
                    confidence=round(confidence, 3),
                    start_char=ent.start_char,
                    end_char=ent.end_char,
                    language="en",
                )
            )
        return entities

    def _extract_gazetteer_entities(
        self, text: str
    ) -> List[ExtractedEntity]:
        """Match text against domain-specific gazetteers."""
        entities: List[ExtractedEntity] = []
        text_lower = text.lower()

        for gazetteer, entity_type in get_all_gazetteers():
            for term in gazetteer:
                # Find all occurrences (case-insensitive, word-boundary)
                pattern = r"\b" + re.escape(term) + r"\b"
                for match in re.finditer(pattern, text_lower):
                    # Use the original-case text from the input
                    original_text = text[match.start() : match.end()]
                    entities.append(
                        ExtractedEntity(
                            text=original_text,
                            entity_type=entity_type.value,
                            confidence=_GAZETTEER_ONLY_CONFIDENCE,
                            start_char=match.start(),
                            end_char=match.end(),
                            language="en",
                        )
                    )
        return entities

    def _merge_entities(
        self,
        spacy_entities: List[ExtractedEntity],
        gazetteer_entities: List[ExtractedEntity],
    ) -> List[ExtractedEntity]:
        """
        Merge spaCy and gazetteer entities.

        Rules:
        - If a gazetteer entity overlaps with a spaCy entity at the same span,
          keep the gazetteer type (more domain-specific) but boost confidence.
        - If a gazetteer entity overlaps with a spaCy entity at different span,
          keep the spaCy entity (more precise boundaries).
        - Non-overlapping gazetteer entities are added as new entities.
        """
        merged: List[ExtractedEntity] = []
        used_gaz_indices: Set[int] = set()

        for sp_ent in spacy_entities:
            best_gaz: Optional[Tuple[int, ExtractedEntity]] = None
            for idx, gz_ent in enumerate(gazetteer_entities):
                if idx in used_gaz_indices:
                    continue
                # Check overlap
                if self._spans_overlap(
                    sp_ent.start_char, sp_ent.end_char,
                    gz_ent.start_char, gz_ent.end_char,
                ):
                    if best_gaz is None or gz_ent.confidence > best_gaz[1].confidence:
                        best_gaz = (idx, gz_ent)

            if best_gaz is not None:
                idx, gz_ent = best_gaz
                used_gaz_indices.add(idx)
                # Use gazetteer type (more specific) with boosted confidence
                boosted_confidence = min(
                    1.0, sp_ent.confidence + _GAZETTEER_BOOST
                )
                merged.append(
                    ExtractedEntity(
                        text=sp_ent.text,
                        entity_type=gz_ent.entity_type,
                        confidence=round(boosted_confidence, 3),
                        start_char=sp_ent.start_char,
                        end_char=sp_ent.end_char,
                        language=sp_ent.language,
                    )
                )
            else:
                merged.append(sp_ent)

        # Add non-overlapping gazetteer entities
        for idx, gz_ent in enumerate(gazetteer_entities):
            if idx not in used_gaz_indices:
                # Check no overlap with any existing merged entity
                overlaps = any(
                    self._spans_overlap(
                        gz_ent.start_char, gz_ent.end_char,
                        m.start_char, m.end_char,
                    )
                    for m in merged
                )
                if not overlaps:
                    merged.append(gz_ent)

        return merged

    def _detect_nested_entities(
        self, entities: List[ExtractedEntity], text: str
    ) -> List[ExtractedEntity]:
        """
        Detect nested entities.

        E.g., "Indian Air Force" is an ORG, but also contains LOCATION "India".
        Handles "The Indian Air Force" by stripping common prefixes.
        """
        nested: List[ExtractedEntity] = []
        for ent in entities:
            if ent.entity_type == EntityType.ORGANIZATION.value:
                ent_lower = ent.text.lower()
                # Strip common prefixes
                for prefix in ("the ", "a ", "an "):
                    if ent_lower.startswith(prefix):
                        ent_lower = ent_lower[len(prefix):]
                        break
                location = NESTED_LOCATION_IN_ORG.get(ent_lower)
                if location:
                    nested.append(
                        ExtractedEntity(
                            text=location,
                            entity_type=EntityType.LOCATION.value,
                            confidence=round(ent.confidence * 0.95, 3),
                            start_char=ent.start_char,
                            end_char=ent.start_char + len(location),
                            language=ent.language,
                        )
                    )
        return nested

    def _estimate_confidence(
        self, text: str, tatva_type: EntityType, spacy_label: str
    ) -> float:
        """Estimate entity confidence from heuristics."""
        confidence = _BASE_SPACY_CONFIDENCE

        # Short entities (1-2 chars) get penalised
        if len(text) <= 2:
            confidence -= _SHORT_ENTITY_PENALTY

        # Proper title case boosts confidence
        if text[0].isupper() and not text.isupper():
            confidence += _TITLE_CASE_BOOST

        # Known gazetteer matches boost confidence
        text_lower = text.lower()
        all_gazetteers = (
            PERSON_GAZETTEER
            | TECHNOLOGY_GAZETTEER
            | RESOURCE_GAZETTEER
            | DOCUMENT_GAZETTEER
            | EVENT_GAZETTEER
            | ORGANIZATION_GAZETTEER
        )
        if text_lower in all_gazetteers:
            confidence += _GAZETTEER_BOOST

        return min(1.0, max(0.0, confidence))

    @staticmethod
    def _spans_overlap(
        start1: int, end1: int, start2: int, end2: int
    ) -> bool:
        """Check if two character spans overlap."""
        return start1 < end2 and start2 < end1

    @staticmethod
    def _deduplicate(entities: List[ExtractedEntity]) -> List[ExtractedEntity]:
        """Remove duplicate entities with same span and type, keep highest confidence."""
        seen: Dict[Tuple[int, int, str], ExtractedEntity] = {}
        for ent in entities:
            key = (ent.start_char, ent.end_char, ent.entity_type)
            if key not in seen or ent.confidence > seen[key].confidence:
                seen[key] = ent
        return list(seen.values())


# ── Module-level singleton ──
ner_pipeline = NERPipeline()
