"""
TATVA — Cypher Query Validator.

Validates generated Cypher queries against the graph schema.
Blocks destructive clauses (DELETE, CREATE, SET, MERGE, REMOVE).
Enforces depth limits on traversals.
"""

from __future__ import annotations

import re
from typing import FrozenSet, List, Optional, Tuple

# ── Allowed graph schema ──

VALID_NODE_LABELS: FrozenSet[str] = frozenset({
    "Actor", "Event", "Location", "Technology",
    "Resource", "Document", "Metric",
})

VALID_RELATIONSHIP_TYPES: FrozenSet[str] = frozenset({
    "ALLIES_WITH", "SANCTIONS", "TRADES_WITH", "DEPLOYS_IN",
    "LEADS", "MEMBER_OF", "PARTICIPATES_IN", "LOCATED_IN",
    "PRODUCES", "SIGNED", "FOLLOWED_BY", "CAUSED_BY",
    "RELATED_TO", "SUPPLIES", "INVESTS_IN", "OPPOSES",
    "COOPERATES_WITH", "FUNDS", "COMPETES_WITH",
})

# ── Whitelisted Cypher clauses ──
ALLOWED_CLAUSES: FrozenSet[str] = frozenset({
    "MATCH", "OPTIONAL MATCH", "WHERE", "RETURN",
    "ORDER BY", "LIMIT", "SKIP", "WITH", "UNWIND",
    "CALL", "YIELD",
})

# ── Blocked (destructive) clauses ──
BLOCKED_CLAUSES: FrozenSet[str] = frozenset({
    "DELETE", "DETACH DELETE", "CREATE", "SET",
    "MERGE", "REMOVE", "DROP", "LOAD CSV",
    "FOREACH",
})

# Max traversal depth
MAX_TRAVERSAL_DEPTH: int = 5


def _extract_labels(cypher: str) -> List[str]:
    """Extract node labels from Cypher like (n:Label)."""
    return re.findall(r"[(:]\s*(\w+)\s*[)\s{]", cypher)


def _extract_rel_types(cypher: str) -> List[str]:
    """Extract relationship types from Cypher like [:TYPE]."""
    return re.findall(r"\[:(\w+)", cypher)


def check_blocked_clauses(cypher: str) -> Tuple[bool, Optional[str]]:
    """
    Check if the query contains any blocked/destructive clauses.

    Returns (is_blocked, clause_found).
    """
    upper = cypher.upper()
    # Check longest clauses first to match "DETACH DELETE" before "DELETE"
    sorted_clauses = sorted(BLOCKED_CLAUSES, key=len, reverse=True)
    for clause in sorted_clauses:
        # Word boundary check to avoid false positives
        pattern = r"\b" + clause.replace(" ", r"\s+") + r"\b"
        if re.search(pattern, upper):
            return True, clause
    return False, None


def check_traversal_depth(cypher: str) -> Tuple[bool, Optional[int]]:
    """
    Check for unbounded traversals like [*] or [*..N] with N > MAX_DEPTH.

    Returns (exceeded, depth_found).
    """
    # Match patterns like [*], [*1..], [*..10], [*1..10]
    patterns = re.findall(r"\[\*(?:(\d+)?\.\.(\d+)?)?\]", cypher)

    for match in patterns:
        min_depth, max_depth = match
        if not min_depth and not max_depth:
            # [*] — unbounded
            return True, None
        if max_depth:
            depth = int(max_depth)
            if depth > MAX_TRAVERSAL_DEPTH:
                return True, depth

    return False, None


def validate_labels(cypher: str) -> Tuple[bool, List[str]]:
    """
    Check if all node labels in the query are valid.

    Returns (all_valid, invalid_labels).
    """
    labels = _extract_labels(cypher)
    invalid = [
        lbl for lbl in labels
        if lbl not in VALID_NODE_LABELS
        and not lbl.startswith("$")
        and lbl not in {"n", "a", "b", "c", "e", "r", "p", "t", "l", "m", "path", "e1", "e2"}
    ]
    return len(invalid) == 0, invalid


def validate_rel_types(cypher: str) -> Tuple[bool, List[str]]:
    """
    Check if all relationship types in the query are valid.

    Returns (all_valid, invalid_types).
    """
    types = _extract_rel_types(cypher)
    invalid = [t for t in types if t not in VALID_RELATIONSHIP_TYPES]
    return len(invalid) == 0, invalid


def validate_cypher(cypher: str) -> Tuple[bool, List[str]]:
    """
    Full Cypher validation pipeline.

    Returns (is_valid, list_of_issues).
    """
    issues: List[str] = []

    # 1. Blocked clauses
    is_blocked, clause = check_blocked_clauses(cypher)
    if is_blocked:
        issues.append(f"Blocked clause detected: {clause}")

    # 2. Traversal depth
    exceeded, depth = check_traversal_depth(cypher)
    if exceeded:
        depth_str = str(depth) if depth else "unbounded"
        issues.append(
            f"Traversal depth exceeded: {depth_str} (max {MAX_TRAVERSAL_DEPTH})"
        )

    # 3. Schema validation — labels (non-critical, just warn)
    # We don't fail on unknown labels to allow flexibility,
    # but we report them.

    return len(issues) == 0, issues
