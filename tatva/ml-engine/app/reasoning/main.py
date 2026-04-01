"""
TATVA Reasoning Service — FastAPI Application (Port 8001)

LLM-powered intelligence analysis: RAG-based Q&A, scenario modeling,
report generation, decision support matrices. Uses Ollama with
Mistral-7B / Llama3-8B for local inference only.
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI

from app.config import settings
from app.reasoning.routes import (
    health_routes,
    reasoning_routes,
    scenario_routes,
    report_routes,
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: connect to Ollama at startup."""
    print(f"🔱 {settings.app_name} — Reasoning Service v{settings.app_version} starting...")
    print(f"   Ollama URL: {settings.ollama_base_url}")
    print(f"   LLM model: {settings.ollama_model}")
    print(f"   Max queue size: {settings.llm_max_queue_size}")
    yield
    print(f"🔱 {settings.app_name} — Reasoning Service shutting down...")


app = FastAPI(
    title="TATVA Reasoning Service",
    version=settings.app_version,
    description=(
        "LLM-powered reasoning for TATVA — AI-Powered Global Ontology Engine. "
        "RAG-based intelligence Q&A, scenario modeling with cascading effects, "
        "automated report generation, and decision support matrices. "
        "Uses local LLMs via Ollama only — no external API calls for sensitive data."
    ),
    lifespan=lifespan,
)

app.include_router(health_routes.router)
app.include_router(reasoning_routes.router)
app.include_router(scenario_routes.router)
app.include_router(report_routes.router)
