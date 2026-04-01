"""
TATVA — End-to-End NLP Pipeline.

Orchestrates the full processing pipeline for a news article:
  Article → NER → Relation Extraction → Entity Resolution →
  Credibility Scoring → Output (ready for graph upsert + ES indexing).

In production, this is triggered by Kafka consumer on `raw.news.articles`.
Publishes results to `nlp.entities.extracted`.
"""

from __future__ import annotations

import time
from datetime import date
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.models.ner_models import NERRequest
from app.models.relation_models import RelationRequest
from app.models.entity_models import EntityResolutionRequest
from app.models.credibility_models import CredibilityRequest, SourceInfo
from app.nlp.ner_pipeline import ner_pipeline
from app.nlp.relation_extractor import relation_extractor
from app.nlp.entity_resolver import entity_resolver
from app.nlp.credibility_scorer import score_credibility


# ── Pipeline I/O models ──

class ArticleInput(BaseModel):
    """Input article for the NLP pipeline."""

    article_id: str = Field(..., description="Unique article identifier.")
    title: str = Field(..., description="Article title.")
    content: str = Field(..., description="Article body text.")
    source_name: str = Field(default="Unknown", description="Source name.")
    source_tier: int = Field(default=3, ge=1, le=5, description="Source reliability tier.")
    publication_date: str = Field(
        default_factory=lambda: date.today().isoformat(),
        description="ISO-8601 publication date.",
    )
    source_url: str = Field(default="", description="Source URL.")
    language: str = Field(default="en", description="Article language.")


class ProcessedEntity(BaseModel):
    """An entity extracted and resolved from the pipeline."""

    text: str
    entity_type: str
    confidence: float
    resolved_node_id: Optional[str] = None
    canonical_name: Optional[str] = None
    auto_merged: bool = False
    needs_review: bool = False


class ProcessedRelation(BaseModel):
    """A relation extracted from the pipeline."""

    subject: str
    predicate: str
    obj: str
    relation_type: str
    is_negated: bool = False
    confidence: float = 0.0


class PipelineOutput(BaseModel):
    """Full output from the NLP pipeline."""

    article_id: str
    entities: List[ProcessedEntity] = Field(default_factory=list)
    relations: List[ProcessedRelation] = Field(default_factory=list)
    credibility_score: float = 0.0
    source_reliability: float = 0.0
    processing_time_ms: float = 0.0
    errors: List[str] = Field(default_factory=list)


def process_article(article: ArticleInput) -> PipelineOutput:
    """
    Run the full NLP pipeline on an article.

    Steps:
    1. NER — extract entities from title + content.
    2. Relation Extraction — extract typed relations.
    3. Entity Resolution — resolve each entity against the KB.
    4. Credibility Scoring — score the article's credibility.
    5. Package results for graph upsert.
    """
    t_start = time.perf_counter()
    errors: List[str] = []

    # Combine title + content for NLP
    full_text = f"{article.title}. {article.content}"

    # ── Step 1: NER ──
    try:
        ner_resp = ner_pipeline.extract(NERRequest(text=full_text, language=article.language))
        extracted_entities = ner_resp.entities
    except Exception as exc:
        errors.append(f"NER failed: {exc}")
        extracted_entities = []

    # ── Step 2: Relation Extraction ──
    try:
        rel_resp = relation_extractor.extract(RelationRequest(text=full_text))
        extracted_relations = rel_resp.relations
    except Exception as exc:
        errors.append(f"Relation extraction failed: {exc}")
        extracted_relations = []

    # ── Step 3: Entity Resolution ──
    processed_entities: List[ProcessedEntity] = []
    for ent in extracted_entities:
        try:
            res_resp = entity_resolver.resolve(
                EntityResolutionRequest(
                    entity_text=ent.text,
                    entity_type=ent.entity_type,
                )
            )
            pe = ProcessedEntity(
                text=ent.text,
                entity_type=ent.entity_type,
                confidence=ent.confidence,
                resolved_node_id=(
                    res_resp.best_match.graph_node_id
                    if res_resp.best_match
                    else None
                ),
                canonical_name=(
                    res_resp.best_match.canonical_name
                    if res_resp.best_match
                    else None
                ),
                auto_merged=(
                    res_resp.best_match.auto_merge
                    if res_resp.best_match
                    else False
                ),
                needs_review=res_resp.needs_human_review,
            )
            processed_entities.append(pe)
        except Exception as exc:
            errors.append(f"Resolution failed for '{ent.text}': {exc}")
            processed_entities.append(
                ProcessedEntity(
                    text=ent.text,
                    entity_type=ent.entity_type,
                    confidence=ent.confidence,
                    needs_review=True,
                )
            )

    # ── Step 4: Relation packaging ──
    processed_relations: List[ProcessedRelation] = []
    for rel in extracted_relations:
        processed_relations.append(
            ProcessedRelation(
                subject=rel.subject,
                predicate=rel.predicate,
                obj=rel.object,
                relation_type=rel.relation_type,
                is_negated=rel.is_negated,
                confidence=rel.confidence,
            )
        )

    # ── Step 5: Credibility Scoring ──
    try:
        cred_resp = score_credibility(
            CredibilityRequest(
                fact_text=article.title,
                sources=[
                    SourceInfo(
                        source_name=article.source_name,
                        source_tier=article.source_tier,
                        publication_date=article.publication_date,
                    )
                ],
            )
        )
        credibility = cred_resp.credibility_score
        source_rel = cred_resp.source_reliability
    except Exception as exc:
        errors.append(f"Credibility scoring failed: {exc}")
        credibility = 0.0
        source_rel = 0.0

    t_ms = (time.perf_counter() - t_start) * 1000

    return PipelineOutput(
        article_id=article.article_id,
        entities=processed_entities,
        relations=processed_relations,
        credibility_score=round(credibility, 4),
        source_reliability=round(source_rel, 4),
        processing_time_ms=round(t_ms, 1),
        errors=errors,
    )
