"""
TATVA — Relation Extraction Pipeline.

Extracts typed relationships between entities from text using:
1. spaCy dependency parsing to find subject-verb-object triples
2. Predicate pattern matching to assign relation types
3. Negation detection
4. Multi-sentence relation linking

Returns ExtractedRelation objects with confidence scores.
"""

from __future__ import annotations

import time
from typing import Dict, List, Optional, Set, Tuple

import spacy
from spacy.tokens import Doc, Span, Token

from app.models.ner_models import NERRequest
from app.models.relation_models import (
    ExtractedRelation,
    RelationRequest,
    RelationResponse,
)
from app.nlp.entity_types import EntityType, map_spacy_label
from app.nlp.ner_pipeline import ner_pipeline
from app.nlp.relation_types import (
    RelationType,
    detect_negation,
    match_predicate_to_relation,
)


class RelationExtractor:
    """
    Extracts typed relations from text using dependency parsing.

    Strategy:
    1. Run NER to identify entities in the text
    2. Parse dependency tree to find subject-verb-object patterns
    3. For each (subject_entity, verb, object_entity) triple:
       a. Match verb to relation type via predicate patterns
       b. Detect negation in the verb phrase
    4. Handle multi-sentence relations by tracking entity co-references
    """

    def __init__(self) -> None:
        self._nlp: Optional[spacy.language.Language] = None

    def _ensure_model(self) -> spacy.language.Language:
        """Get spaCy model, loading if needed."""
        if self._nlp is None:
            if ner_pipeline.is_loaded:
                self._nlp = ner_pipeline._nlp
            else:
                self._nlp = spacy.load("en_core_web_sm")
        return self._nlp

    def extract(self, request: RelationRequest) -> RelationResponse:
        """
        Extract relations from text.

        Args:
            request: Contains text and optional pre-extracted entities.

        Returns:
            RelationResponse with typed relations and timing info.
        """
        start_time = time.perf_counter()

        nlp = self._ensure_model()
        doc = nlp(request.text)

        # Step 1: Get entities (from request or NER)
        if request.entities:
            entity_spans = self._entities_from_request(doc, request.entities)
        else:
            entity_spans = self._entities_from_doc(doc)

        # Step 2: Extract relations from each sentence
        relations: List[ExtractedRelation] = []
        sentences = list(doc.sents)

        for sent in sentences:
            sent_relations = self._extract_from_sentence(
                sent, entity_spans, doc
            )
            relations.extend(sent_relations)

        # Step 3: Multi-sentence relation linking
        if len(sentences) > 1:
            cross_relations = self._extract_cross_sentence(
                sentences, entity_spans, doc
            )
            relations.extend(cross_relations)

        # Deduplicate
        relations = self._deduplicate(relations)

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        return RelationResponse(
            relations=relations,
            processing_time_ms=round(elapsed_ms, 2),
        )

    def _entities_from_doc(
        self, doc: Doc
    ) -> List[Tuple[str, str, int, int]]:
        """Extract entities from spaCy doc as (text, type, start_char, end_char)."""
        entities = []
        for ent in doc.ents:
            tatva_type = map_spacy_label(ent.label_)
            if tatva_type and tatva_type in (
                EntityType.PERSON, EntityType.ORGANIZATION,
                EntityType.LOCATION, EntityType.EVENT,
                EntityType.TECHNOLOGY,
            ):
                entities.append((ent.text, tatva_type.value, ent.start_char, ent.end_char))
        return entities

    def _entities_from_request(
        self, doc: Doc, entities: List[Dict]
    ) -> List[Tuple[str, str, int, int]]:
        """Convert request entities to internal format."""
        result = []
        for ent in entities:
            text = ent.get("text", "")
            etype = ent.get("entity_type", ent.get("type", ""))
            start = ent.get("start_char", ent.get("start", 0))
            end = ent.get("end_char", ent.get("end", len(text)))
            result.append((text, etype, start, end))
        return result

    def _extract_from_sentence(
        self,
        sent: Span,
        entity_spans: List[Tuple[str, str, int, int]],
        doc: Doc,
    ) -> List[ExtractedRelation]:
        """Extract relations from a single sentence."""
        relations: List[ExtractedRelation] = []

        # Find entities that overlap with this sentence
        sent_entities = [
            (text, etype, sc, ec)
            for text, etype, sc, ec in entity_spans
            if sc >= sent.start_char and ec <= sent.end_char
        ]

        if len(sent_entities) < 2:
            return relations

        # Find the main verb(s) in the sentence
        verbs = [token for token in sent if token.pos_ == "VERB"]
        if not verbs:
            # Try AUX verbs as fallback
            verbs = [token for token in sent if token.pos_ == "AUX"]

        sent_text = sent.text
        is_negated = detect_negation(sent_text)

        # For each verb, try to find subject and object entities
        for verb in verbs:
            subject = self._find_subject(verb, sent)
            obj = self._find_object(verb, sent)

            if subject is None or obj is None:
                continue

            # Match subject and object to known entities
            subj_entity = self._match_span_to_entity(subject, sent_entities)
            obj_entity = self._match_span_to_entity(obj, sent_entities)

            if subj_entity is None or obj_entity is None:
                continue

            # Build predicate text (verb + particles + prepositions)
            predicate_text = self._build_predicate_text(verb, sent)
            rel_type = match_predicate_to_relation(predicate_text)

            # Estimate confidence
            confidence = self._estimate_confidence(rel_type, verb, sent_text)

            relations.append(
                ExtractedRelation(
                    subject=subj_entity[0],
                    subject_type=subj_entity[1],
                    predicate=rel_type.value,
                    object=obj_entity[0],
                    object_type=obj_entity[1],
                    confidence=round(confidence, 3),
                    negated=is_negated,
                    evidence_sentence=sent_text.strip(),
                )
            )

        # If no verb-based relations found, try entity pair heuristics
        if not relations and len(sent_entities) >= 2:
            rel = self._heuristic_relation(sent_entities, sent_text, is_negated)
            if rel:
                relations.append(rel)

        return relations

    def _extract_cross_sentence(
        self,
        sentences: List[Span],
        entity_spans: List[Tuple[str, str, int, int]],
        doc: Doc,
    ) -> List[ExtractedRelation]:
        """
        Extract relations that span multiple sentences.

        Strategy: If sentence N mentions entities A and B, and sentence N+1
        mentions entity C with a relation verb, link them.
        """
        relations: List[ExtractedRelation] = []

        for i in range(len(sentences) - 1):
            sent1 = sentences[i]
            sent2 = sentences[i + 1]

            ents1 = [
                (t, tp, s, e) for t, tp, s, e in entity_spans
                if s >= sent1.start_char and e <= sent1.end_char
            ]
            ents2 = [
                (t, tp, s, e) for t, tp, s, e in entity_spans
                if s >= sent2.start_char and e <= sent2.end_char
            ]

            # Look for pronouns or references in sent2 that link back to sent1 entities
            sent2_text = sent2.text
            is_negated = detect_negation(sent2_text)

            # Check if sent2 starts with "The deal", "The agreement", "It", "This"
            # linking back to sent1's context
            if ents1 and ents2:
                for verb in [t for t in sent2 if t.pos_ == "VERB"]:
                    predicate_text = self._build_predicate_text(verb, sent2)
                    rel_type = match_predicate_to_relation(predicate_text)

                    if rel_type != RelationType.UNKNOWN_RELATION:
                        # Link first entity from sent1 with entities from sent2
                        subj = ents1[0]
                        for obj in ents2:
                            if subj[0] != obj[0]:  # Don't self-relate
                                combined_evidence = (
                                    sent1.text.strip() + " " + sent2.text.strip()
                                )
                                relations.append(
                                    ExtractedRelation(
                                        subject=subj[0],
                                        subject_type=subj[1],
                                        predicate=rel_type.value,
                                        object=obj[0],
                                        object_type=obj[1],
                                        confidence=round(0.65, 3),
                                        negated=is_negated,
                                        evidence_sentence=combined_evidence,
                                    )
                                )
                        break  # Only use first verb

        return relations

    def _find_subject(
        self, verb: Token, sent: Span
    ) -> Optional[Span]:
        """Find the subject of a verb in the dependency tree."""
        for child in verb.children:
            if child.dep_ in ("nsubj", "nsubjpass"):
                # Expand to full noun phrase
                return self._expand_noun_phrase(child, sent)
        # Check if verb's head has a subject
        if verb.head != verb and verb.head.pos_ in ("VERB", "AUX"):
            for child in verb.head.children:
                if child.dep_ in ("nsubj", "nsubjpass"):
                    return self._expand_noun_phrase(child, sent)
        return None

    def _find_object(
        self, verb: Token, sent: Span
    ) -> Optional[Span]:
        """Find the object of a verb in the dependency tree."""
        for child in verb.children:
            if child.dep_ in ("dobj", "pobj", "attr", "oprd"):
                return self._expand_noun_phrase(child, sent)
            # Follow prepositions
            if child.dep_ == "prep":
                for grandchild in child.children:
                    if grandchild.dep_ == "pobj":
                        return self._expand_noun_phrase(grandchild, sent)
        return None

    def _expand_noun_phrase(
        self, token: Token, sent: Span
    ) -> Span:
        """Expand a token to its full noun phrase (including compounds and modifiers)."""
        start = token.i
        end = token.i + 1
        for child in token.subtree:
            if child.i < start:
                start = child.i
            if child.i + 1 > end:
                end = child.i + 1
        return sent.doc[start:end]

    def _match_span_to_entity(
        self,
        span: Span,
        entities: List[Tuple[str, str, int, int]],
    ) -> Optional[Tuple[str, str]]:
        """Match a dependency span to a known entity."""
        span_text_lower = span.text.lower()
        for text, etype, sc, ec in entities:
            # Check if entity text is in the span or overlaps
            if (
                text.lower() in span_text_lower
                or span_text_lower in text.lower()
                or (span.start_char < ec and sc < span.end_char)
            ):
                return (text, etype)
        return None

    def _build_predicate_text(self, verb: Token, sent: Span) -> str:
        """Build the full predicate text including particles and prepositions."""
        parts = [verb.text]
        for child in verb.children:
            if child.dep_ in ("prt", "prep", "advmod", "neg"):
                parts.append(child.text)
            if child.dep_ == "prep":
                for gc in child.children:
                    if gc.dep_ == "pobj":
                        parts.append(gc.text)
        # Also include the broader sentence context for better matching
        return " ".join(parts) + " " + sent.text

    def _estimate_confidence(
        self, rel_type: RelationType, verb: Token, sent_text: str
    ) -> float:
        """Estimate relation extraction confidence."""
        base = 0.75

        # Known relation type boosts confidence
        if rel_type != RelationType.UNKNOWN_RELATION:
            base += 0.10

        # Short, clear sentences are more reliable
        if len(sent_text.split()) < 20:
            base += 0.05

        return min(1.0, base)

    def _heuristic_relation(
        self,
        entities: List[Tuple[str, str, int, int]],
        sent_text: str,
        is_negated: bool,
    ) -> Optional[ExtractedRelation]:
        """
        Fallback: try to infer a relation from the sentence text
        when dependency parsing doesn't find subject-verb-object.
        """
        rel_type = match_predicate_to_relation(sent_text)
        if rel_type == RelationType.UNKNOWN_RELATION:
            return None

        # Use first two entities as subject and object
        subj = entities[0]
        obj = entities[1]

        return ExtractedRelation(
            subject=subj[0],
            subject_type=subj[1],
            predicate=rel_type.value,
            object=obj[0],
            object_type=obj[1],
            confidence=0.70,
            negated=is_negated,
            evidence_sentence=sent_text.strip(),
        )

    @staticmethod
    def _deduplicate(
        relations: List[ExtractedRelation],
    ) -> List[ExtractedRelation]:
        """Remove duplicate relations, keep highest confidence."""
        seen: Dict[Tuple[str, str, str, bool], ExtractedRelation] = {}
        for rel in relations:
            key = (
                rel.subject.lower(),
                rel.object.lower(),
                rel.predicate,
                rel.negated,
            )
            if key not in seen or rel.confidence > seen[key].confidence:
                seen[key] = rel
        return list(seen.values())


# ── Module-level singleton ──
relation_extractor = RelationExtractor()
