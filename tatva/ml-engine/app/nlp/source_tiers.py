"""
TATVA — Source reliability tiers.

| Tier | Score | Examples                                      |
|------|-------|-----------------------------------------------|
| T1   | 0.9   | Reuters, PTI, GoI press releases              |
| T2   | 0.7   | Times of India, NDTV, The Hindu               |
| T3   | 0.5   | Regional/state-level newspapers               |
| T4   | 0.3   | Blogs, Medium, Substack                       |
| T5   | 0.1   | Anonymous social media (Twitter, Reddit)      |
"""

from __future__ import annotations

from typing import Dict

# Tier number → base reliability score
TIER_SCORES: Dict[int, float] = {
    1: 0.9,
    2: 0.7,
    3: 0.5,
    4: 0.3,
    5: 0.1,
}

# Known sources → tier mappings (lowercase normalised)
SOURCE_TIER_MAP: Dict[str, int] = {
    # Tier 1 — Government / Wire services
    "reuters": 1,
    "associated press": 1,
    "ap": 1,
    "pti": 1,
    "press trust of india": 1,
    "ani": 1,
    "goi": 1,
    "government of india": 1,
    "ministry of defence": 1,
    "ministry of external affairs": 1,
    "mea": 1,
    "pib": 1,
    "press information bureau": 1,
    "un": 1,
    "united nations": 1,
    "world bank": 1,
    "imf": 1,
    "international monetary fund": 1,
    # Tier 2 — Major national media
    "times of india": 2,
    "the hindu": 2,
    "hindustan times": 2,
    "ndtv": 2,
    "india today": 2,
    "indian express": 2,
    "the indian express": 2,
    "economic times": 2,
    "the economic times": 2,
    "bbc": 2,
    "al jazeera": 2,
    "cnn": 2,
    "the guardian": 2,
    "the new york times": 2,
    "washington post": 2,
    "the washington post": 2,
    # Tier 3 — Regional media
    "deccan herald": 3,
    "telegraph india": 3,
    "the tribune": 3,
    "the statesman": 3,
    "the pioneer": 3,
    "dna india": 3,
    "firstpost": 3,
    "the wire": 3,
    "scroll": 3,
    "the print": 3,
    # Tier 4 — Blogs/opinion
    "medium": 4,
    "substack": 4,
    "wordpress": 4,
    "blogspot": 4,
    "blogger": 4,
    "opindia": 4,
    "swarajya": 4,
    # Tier 5 — Anonymous social media
    "twitter": 5,
    "x.com": 5,
    "reddit": 5,
    "facebook": 5,
    "whatsapp": 5,
    "telegram": 5,
    "4chan": 5,
}


def get_tier_score(tier: int) -> float:
    """Return reliability score for a given tier number (1–5)."""
    return TIER_SCORES.get(tier, 0.1)


def lookup_source_tier(source_name: str) -> int:
    """
    Lookup the tier for a named source.

    Returns the tier number (1–5). Defaults to 3 (regional) if unknown.
    """
    normalised = source_name.strip().lower()
    return SOURCE_TIER_MAP.get(normalised, 3)
