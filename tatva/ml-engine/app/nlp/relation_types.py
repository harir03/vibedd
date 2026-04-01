"""
TATVA — Relation Type Taxonomy for Geopolitical Analysis.

Defines the canonical set of typed relationships used in the knowledge graph.
Maps natural language predicate patterns to typed relation types.
"""

from __future__ import annotations

from enum import Enum
from typing import Dict, FrozenSet, List, Tuple
import re


class RelationType(str, Enum):
    """TATVA canonical relation types for the knowledge graph."""

    # Diplomatic / Political
    ALLIES_WITH = "ALLIES_WITH"
    OPPOSES = "OPPOSES"
    SANCTIONS = "SANCTIONS"
    RECOGNIZES = "RECOGNIZES"
    SUPPORTS = "SUPPORTS"
    MEDIATES = "MEDIATES"

    # Agreements / Treaties
    SIGNED = "SIGNED"
    RATIFIED = "RATIFIED"
    VIOLATED = "VIOLATED"
    WITHDREW_FROM = "WITHDREW_FROM"

    # Trade / Economic
    TRADES_WITH = "TRADES_WITH"
    INVESTS_IN = "INVESTS_IN"
    FUNDS = "FUNDS"
    IMPORTS_FROM = "IMPORTS_FROM"
    EXPORTS_TO = "EXPORTS_TO"

    # Military / Defense
    DEPLOYS_IN = "DEPLOYS_IN"
    ATTACKS = "ATTACKS"
    DEFENDS = "DEFENDS"
    SUPPLIES_ARMS_TO = "SUPPLIES_ARMS_TO"
    CONDUCTS_EXERCISE_WITH = "CONDUCTS_EXERCISE_WITH"

    # Organizational
    LEADS = "LEADS"
    MEMBER_OF = "MEMBER_OF"
    PART_OF = "PART_OF"
    FOUNDED = "FOUNDED"
    HEADQUARTERED_IN = "HEADQUARTERED_IN"

    # Event-related
    PARTICIPATED_IN = "PARTICIPATED_IN"
    HOSTED = "HOSTED"
    CAUSED = "CAUSED"
    FOLLOWED_BY = "FOLLOWED_BY"
    RESULTED_IN = "RESULTED_IN"

    # Technology / Science
    DEVELOPED = "DEVELOPED"
    TESTED = "TESTED"
    LAUNCHED = "LAUNCHED"
    OPERATES = "OPERATES"

    # Location-based
    LOCATED_IN = "LOCATED_IN"
    BORDERS = "BORDERS"
    CLAIMS = "CLAIMS"

    # Social / People
    MET_WITH = "MET_WITH"
    VISITED = "VISITED"
    APPOINTED = "APPOINTED"
    SUCCEEDED = "SUCCEEDED"

    # Unknown / Open IE
    UNKNOWN_RELATION = "UNKNOWN_RELATION"


# ── Predicate patterns → relation type mapping ──
# Each entry: (compiled regex pattern, RelationType, is_directional)
# Patterns are applied to the dependency-parsed predicate (verb phrase).

_PREDICATE_PATTERNS: List[Tuple[re.Pattern, RelationType]] = [
    # Agreements
    (re.compile(r"\b(sign(ed|s)?|ink(ed|s)?)\b.*\b(deal|agreement|treaty|pact|accord|mou)\b", re.I), RelationType.SIGNED),
    (re.compile(r"\b(ratif(y|ied|ies))\b", re.I), RelationType.RATIFIED),
    (re.compile(r"\b(violat(e|ed|es|ing))\b", re.I), RelationType.VIOLATED),
    (re.compile(r"\b(with(drew|draw)(s)?(\s+from)?)\b", re.I), RelationType.WITHDREW_FROM),

    # Diplomatic
    (re.compile(r"\b(all(y|ied|ies))\b", re.I), RelationType.ALLIES_WITH),
    (re.compile(r"\b(oppos(e|ed|es|ing)|condemn(ed|s)?|criticiz(e|ed|es|ing))\b", re.I), RelationType.OPPOSES),
    (re.compile(r"\b(sanction(ed|s|ing)?|embargo(ed|es)?)\b", re.I), RelationType.SANCTIONS),
    (re.compile(r"\b(recogniz(e|ed|es|ing)|acknowledg(e|ed|es|ing))\b", re.I), RelationType.RECOGNIZES),
    (re.compile(r"\b(support(ed|s|ing)?|back(ed|s|ing)?|endors(e|ed|es|ing))\b", re.I), RelationType.SUPPORTS),
    (re.compile(r"\b(mediat(e|ed|es|ing))\b", re.I), RelationType.MEDIATES),

    # Trade / Economic
    (re.compile(r"\b(trad(e|ed|es|ing))\b.*\b(with|between)\b", re.I), RelationType.TRADES_WITH),
    (re.compile(r"\b(invest(ed|s|ing)?)\b", re.I), RelationType.INVESTS_IN),
    (re.compile(r"\b(fund(ed|s|ing)?|financ(e|ed|es|ing))\b", re.I), RelationType.FUNDS),
    (re.compile(r"\b(import(ed|s|ing)?)\b", re.I), RelationType.IMPORTS_FROM),
    (re.compile(r"\b(export(ed|s|ing)?)\b", re.I), RelationType.EXPORTS_TO),
    (re.compile(r"\b(sign(ed|s)?|ink(ed|s)?)\b.*\b(trade|economic)\b", re.I), RelationType.TRADES_WITH),

    # Military
    (re.compile(r"\b(deploy(ed|s|ing)?|station(ed|s|ing)?)\b", re.I), RelationType.DEPLOYS_IN),
    (re.compile(r"\b(attack(ed|s|ing)?|struck|bomb(ed|s|ing)?|shell(ed|s|ing)?)\b", re.I), RelationType.ATTACKS),
    (re.compile(r"\b(defend(ed|s|ing)?|protect(ed|s|ing)?)\b", re.I), RelationType.DEFENDS),
    (re.compile(r"\b(suppl(y|ied|ies|ying))\b.*\b(arms?|weapon|missile|defense|defence)\b", re.I), RelationType.SUPPLIES_ARMS_TO),
    (re.compile(r"\b(exercis(e|ed|es|ing)|drill(ed|s)?|maneuver|manoeuvre)\b", re.I), RelationType.CONDUCTS_EXERCISE_WITH),

    # Organization / Leadership
    (re.compile(r"\b(lead(s|ing)?|head(s|ed|ing)?|chair(s|ed|ing)?)\b", re.I), RelationType.LEADS),
    (re.compile(r"\b(join(ed|s|ing)?|member)\b", re.I), RelationType.MEMBER_OF),
    (re.compile(r"\b(found(ed|s|ing)?|establish(ed|es|ing)?|creat(e|ed|es|ing))\b", re.I), RelationType.FOUNDED),

    # Events
    (re.compile(r"\b(participat(e|ed|es|ing)|attend(ed|s|ing)?)\b", re.I), RelationType.PARTICIPATED_IN),
    (re.compile(r"\b(host(ed|s|ing)?)\b", re.I), RelationType.HOSTED),
    (re.compile(r"\b(caus(e|ed|es|ing)|trigger(ed|s|ing)?|spark(ed|s|ing)?)\b", re.I), RelationType.CAUSED),
    (re.compile(r"\b(result(ed|s|ing)?)\b", re.I), RelationType.RESULTED_IN),

    # Technology
    (re.compile(r"\b(develop(ed|s|ing)?|built|build(s|ing)?|design(ed|s|ing)?)\b", re.I), RelationType.DEVELOPED),
    (re.compile(r"\b(test(ed|s|ing)?|trial(l?ed|s)?)\b", re.I), RelationType.TESTED),
    (re.compile(r"\b(launch(ed|es|ing)?|fire(d|s|ing)?|deploy(ed|s|ing)?)\b.*\b(missile|rocket|satellite|spacecraft)\b", re.I), RelationType.LAUNCHED),
    (re.compile(r"\b(operat(e|ed|es|ing))\b", re.I), RelationType.OPERATES),

    # Location
    (re.compile(r"\b(locat(e|ed|es|ing))\b", re.I), RelationType.LOCATED_IN),
    (re.compile(r"\b(border(s|ed|ing)?|adjoin(s|ed|ing)?)\b", re.I), RelationType.BORDERS),
    (re.compile(r"\b(claim(s|ed|ing)?|disput(e|ed|es|ing)?)\b", re.I), RelationType.CLAIMS),

    # People
    (re.compile(r"\b(m(et|eet)(s|ing)?|held\s+talks?)\b", re.I), RelationType.MET_WITH),
    (re.compile(r"\b(visit(ed|s|ing)?|travel(l?ed|s|l?ing)?)\b", re.I), RelationType.VISITED),
    (re.compile(r"\b(appoint(ed|s|ing)?|nominat(e|ed|es|ing))\b", re.I), RelationType.APPOINTED),
]

# ── Negation cues ──
NEGATION_CUES: FrozenSet[str] = frozenset({
    "not", "n't", "no", "never", "neither", "nor",
    "didn't", "doesn't", "don't", "hasn't", "haven't",
    "hadn't", "won't", "wouldn't", "couldn't", "shouldn't",
    "refused", "declined", "rejected", "denied", "failed",
    "unable", "unwilling",
})


def match_predicate_to_relation(predicate_text: str) -> RelationType:
    """
    Match a predicate phrase to a TATVA relation type.

    Args:
        predicate_text: The verb phrase / predicate extracted from the sentence.

    Returns:
        Matched RelationType, or UNKNOWN_RELATION if no pattern matches.
    """
    for pattern, rel_type in _PREDICATE_PATTERNS:
        if pattern.search(predicate_text):
            return rel_type
    return RelationType.UNKNOWN_RELATION


def detect_negation(sentence: str) -> bool:
    """
    Check if a sentence contains negation cues.

    Args:
        sentence: Full sentence text.

    Returns:
        True if negation is detected.
    """
    tokens = sentence.lower().split()
    return bool(NEGATION_CUES.intersection(tokens))
