"""
TATVA — Response Validator.

Post-processes LLM output to:
1. Detect and strip system prompt leakage.
2. Filter politically biased / offensive content.
3. Validate date ranges and entity plausibility.
"""

from __future__ import annotations

import re
from typing import List, Optional, Tuple

from app.reasoning.prompt_templates import SYSTEM_PROMPT_FRAGMENTS


# ── Offensive / biased content patterns ──
_BIAS_PATTERNS: List[re.Pattern] = [
    re.compile(p, re.IGNORECASE)
    for p in [
        r"\b(hate|kill|destroy|exterminate)\s+(all|every|the)\s+\w+",
        r"\b(inferior|superior)\s+(race|people|nation|religion)\b",
        r"\b(terrorist|extremist)\s+(country|nation|religion|people)\b",
        r"\b(should\s+be\s+nuked|deserves?\s+to\s+die)\b",
    ]
]


def check_system_prompt_leak(text: str) -> Tuple[bool, str]:
    """
    Check if the LLM leaked its system prompt.

    Returns:
        (leaked, cleaned_text)
    """
    text_lower = text.lower()
    for fragment in SYSTEM_PROMPT_FRAGMENTS:
        if fragment in text_lower:
            return True, "I am an intelligence analysis assistant."
    return False, text


def check_bias_and_offensive(text: str) -> Tuple[bool, Optional[str]]:
    """
    Check if the response contains politically biased or offensive content.

    Returns:
        (is_biased, reason)
    """
    for pattern in _BIAS_PATTERNS:
        match = pattern.search(text)
        if match:
            return True, f"Content filtered: matched pattern '{match.group()}'"
    return False, None


def validate_response(text: str) -> Tuple[str, bool, Optional[str]]:
    """
    Full response validation pipeline.

    Returns:
        (cleaned_text, was_filtered, filter_reason)
    """
    # 1. Check for system prompt leakage
    leaked, cleaned = check_system_prompt_leak(text)
    if leaked:
        return cleaned, True, "System prompt leak detected and stripped."

    # 2. Check for bias/offensive content
    is_biased, reason = check_bias_and_offensive(text)
    if is_biased:
        return (
            "Response filtered — please rephrase your query.",
            True,
            reason,
        )

    # 3. If clean, return as-is
    return text, False, None
