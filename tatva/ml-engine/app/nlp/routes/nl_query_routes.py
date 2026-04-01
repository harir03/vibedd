"""
TATVA NLP Service — Natural Language → Cypher Translation routes.

Translates analyst questions into Cypher queries using few-shot prompting.
Validates generated Cypher against the graph schema before execution.
Whitelists MATCH/WHERE/RETURN/ORDER BY/LIMIT — blocks destructive clauses.
"""

from fastapi import APIRouter
from app.models.query_models import NLQueryRequest, NLQueryResponse
from app.reasoning.nl_to_cypher import translate

router = APIRouter(prefix="/nlp/query", tags=["NL → Cypher Translation"])


@router.post("/translate", response_model=NLQueryResponse)
async def translate_nl_to_cypher(request: NLQueryRequest) -> NLQueryResponse:
    """
    Translate a natural language question into a Cypher query.

    Uses few-shot prompting with 20+ NL→Cypher example pairs.
    Validates Cypher against graph schema and whitelists safe clauses.
    Query timeout: 30 seconds max.
    """
    return translate(request)
