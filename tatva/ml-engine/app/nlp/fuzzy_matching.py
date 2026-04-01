"""
TATVA — Fuzzy String Matching utilities.

Provides Jaro-Winkler similarity for entity resolution.
Includes transliteration-aware normalization for Indian names.
"""

from __future__ import annotations

import re
import unicodedata
from typing import Optional

import jellyfish


def jaro_winkler_similarity(s1: str, s2: str) -> float:
    """
    Compute Jaro-Winkler similarity between two strings.

    Returns a float in [0.0, 1.0] where 1.0 = identical.
    """
    if not s1 or not s2:
        return 0.0
    return jellyfish.jaro_winkler_similarity(s1.lower(), s2.lower())


def normalize_name(name: str) -> str:
    """
    Normalize an entity name for comparison.

    - Lowercase
    - Strip accents (ASCII folding)
    - Remove honorifics/titles
    - Collapse whitespace
    - Strip punctuation
    """
    # Lowercase
    name = name.lower().strip()

    # ASCII folding (remove diacritics)
    name = unicodedata.normalize("NFKD", name)
    name = "".join(c for c in name if not unicodedata.combining(c))

    # Remove common titles/honorifics
    titles = (
        r"\b(mr|mrs|ms|dr|prof|sir|shri|smt|hon|pm|president|"
        r"minister|gen|lt|col|maj|capt|adm|cmdr|wing\s+commander|"
        r"group\s+captain|air\s+marshal|field\s+marshal)\b\.?"
    )
    name = re.sub(titles, "", name, flags=re.IGNORECASE)

    # Remove possessives
    name = re.sub(r"'s\b", "", name)

    # Remove punctuation except hyphens
    name = re.sub(r"[^\w\s-]", "", name)

    # Collapse whitespace
    name = re.sub(r"\s+", " ", name).strip()

    return name


def contains_match(query: str, candidate: str) -> bool:
    """
    Check if one name contains the other (for partial matching).

    E.g., "Modi" is contained in "Narendra Modi".
    """
    q = normalize_name(query)
    c = normalize_name(candidate)
    return q in c or c in q


def compute_exact_score(query: str, candidate: str) -> float:
    """
    Exact match score: 1.0 if normalized forms are equal, else 0.0.
    """
    return 1.0 if normalize_name(query) == normalize_name(candidate) else 0.0


def compute_fuzzy_score(query: str, candidate: str) -> float:
    """
    Fuzzy score using Jaro-Winkler on normalized names.
    """
    return jaro_winkler_similarity(
        normalize_name(query), normalize_name(candidate)
    )


def compute_containment_score(query: str, candidate: str) -> float:
    """
    Containment score: measures how much of query is in candidate.

    "Modi" in "Narendra Modi" → high score
    "DRDO" in "Defence Research and Development Organisation" → 0 (no overlap)
    """
    q = normalize_name(query)
    c = normalize_name(candidate)
    if not q or not c:
        return 0.0
    if q == c:
        return 1.0
    if q in c:
        return len(q) / len(c) * 0.95
    if c in q:
        return len(c) / len(q) * 0.95
    return 0.0
