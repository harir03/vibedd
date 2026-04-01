"""
TATVA — Circular citation detector.

Detects when sources cite each other in a chain (A→B→A), which
would falsely inflate corroboration counts if not caught.

Returns the set of unique *root* sources after removing circular
chains, and a flag indicating whether any circularity was found.
"""

from __future__ import annotations

from typing import Dict, FrozenSet, List, Optional, Set, Tuple

from app.models.credibility_models import SourceInfo


def build_citation_graph(
    sources: List[SourceInfo],
) -> Dict[str, Optional[str]]:
    """
    Build a directed citation graph from SourceInfo list.

    Returns {source_name_lower → cited_source_name_lower | None}.
    """
    graph: Dict[str, Optional[str]] = {}
    for src in sources:
        key = src.source_name.strip().lower()
        cited = (
            src.cites_source.strip().lower()
            if src.cites_source
            else None
        )
        graph[key] = cited
    return graph


def detect_circular_citations(
    sources: List[SourceInfo],
) -> Tuple[bool, FrozenSet[str]]:
    """
    Detect circular citations and return unique root sources.

    Returns:
        (has_circular, root_sources)
        - has_circular: True if at least one cycle found.
        - root_sources: frozenset of source names that are independent
          (not part of a citation chain that loops back).
    """
    graph = build_citation_graph(sources)
    all_names: Set[str] = set(graph.keys())
    visited_global: Set[str] = set()
    circular_participants: Set[str] = set()

    for start in all_names:
        # Walk the citation chain from this source.
        path: List[str] = []
        path_set: Set[str] = set()
        current: Optional[str] = start

        while current is not None:
            if current in path_set:
                # Found a cycle — mark all participants from the cycle start.
                cycle_start = path.index(current)
                for node in path[cycle_start:]:
                    circular_participants.add(node)
                break
            if current in visited_global:
                break
            path.append(current)
            path_set.add(current)
            current = graph.get(current)

        visited_global.update(path)

    has_circular = len(circular_participants) > 0

    # Root sources: those NOT purely citing a circular partner.
    # For corroboration counting, each circular group counts as ONE source.
    root_sources: Set[str] = set()
    circular_counted = False
    for name in all_names:
        if name in circular_participants:
            if not circular_counted:
                # Count the entire circular group as one root source.
                root_sources.add(name)
                circular_counted = True
        else:
            root_sources.add(name)

    return has_circular, frozenset(root_sources)
