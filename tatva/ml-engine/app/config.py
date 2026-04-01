"""
TATVA ML Engine — Configuration
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_prefix="TATVA_", env_file=".env")

    app_name: str = "TATVA ML Engine"
    app_version: str = "1.0.0"
    debug: bool = False

    # NLP Service
    nlp_host: str = "0.0.0.0"
    nlp_port: int = 8000

    # Reasoning Service
    reasoning_host: str = "0.0.0.0"
    reasoning_port: int = 8001

    # Neo4j
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "tatva_neo4j_pass"

    # PostgreSQL
    postgres_url: str = "postgresql://tatva:tatva_pg_pass@localhost:5432/tatva"

    # Elasticsearch
    elasticsearch_url: str = "http://localhost:9200"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Kafka
    kafka_bootstrap_servers: str = "localhost:9092"

    # Ollama (Local LLM — NEVER use external APIs for sensitive data)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "mistral:7b"

    # Embedding model
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dims: int = 384

    # NLP Thresholds
    ner_min_confidence: float = 0.70
    entity_resolution_min_similarity: float = 0.80
    auto_merge_threshold: float = 0.90
    credibility_warning_threshold: float = 0.30

    # Credibility scoring weights
    credibility_w1_source: float = 0.35
    credibility_w2_corroboration: float = 0.30
    credibility_w3_recency: float = 0.15
    credibility_w4_contradiction: float = 0.20

    # Performance
    nlp_batch_size: int = 50
    llm_max_queue_size: int = 20
    query_timeout_seconds: int = 30


settings = Settings()
