"""
TATVA — Ollama LLM Client.

Local LLM inference via Ollama. NO external API calls for sensitive data.
Supports request deduplication, timeouts, and queue management.
"""

from __future__ import annotations

import hashlib
import time
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings


class LLMClient:
    """
    Client for Ollama local LLM inference.

    Features:
    - Request deduplication (same query within 30s → cached result)
    - Queue management (reject if queue > max_queue_size)
    - Timeout handling (graceful fallback after 30s)
    - No external API calls (Ollama only)
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        timeout: float = 30.0,
        max_queue: int = 20,
    ) -> None:
        self.base_url = base_url or settings.ollama_base_url
        self.model = model or settings.ollama_model
        self.timeout = timeout
        self.max_queue = max_queue

        # Deduplication cache: hash → (response_text, timestamp)
        self._dedup_cache: Dict[str, tuple] = {}
        self._dedup_window: float = 30.0  # seconds
        self._active_requests: int = 0

    def _query_hash(self, system: str, prompt: str) -> str:
        """Compute deterministic hash of a query for dedup."""
        content = f"{system}||{prompt}"
        return hashlib.sha256(content.encode()).hexdigest()

    def _cleanup_stale_cache(self) -> None:
        """Remove dedup cache entries older than the window."""
        now = time.time()
        expired = [
            k for k, (_, ts) in self._dedup_cache.items()
            if now - ts > self._dedup_window
        ]
        for k in expired:
            del self._dedup_cache[k]

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
    ) -> str:
        """
        Generate a response from the local LLM.

        Returns the text response, or a fallback message on failure.
        Deduplicates identical requests within 30s.
        """
        self._cleanup_stale_cache()
        query_hash = self._query_hash(system_prompt, user_prompt)

        # Dedup check
        if query_hash in self._dedup_cache:
            cached_text, _ = self._dedup_cache[query_hash]
            return cached_text

        # Queue overflow check
        if self._active_requests >= self.max_queue:
            return (
                "High traffic — answer delayed. Your query has been queued "
                "for processing. Please try again shortly."
            )

        self._active_requests += 1
        try:
            response = httpx.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "system": system_prompt,
                    "prompt": user_prompt,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "num_predict": 1024,
                    },
                },
                timeout=self.timeout,
            )
            response.raise_for_status()
            result = response.json().get("response", "")

            # Cache for dedup
            self._dedup_cache[query_hash] = (result, time.time())
            return result

        except httpx.TimeoutException:
            return (
                "LLM inference timed out. The system is under heavy load. "
                "Please try a simpler query or try again later."
            )
        except httpx.ConnectError:
            return (
                "LLM service is unavailable. Ollama may not be running. "
                "Please ensure the LLM service is started."
            )
        except Exception as exc:
            return f"LLM inference failed: {str(exc)}"
        finally:
            self._active_requests -= 1

    def is_available(self) -> bool:
        """Check if Ollama is reachable."""
        try:
            resp = httpx.get(f"{self.base_url}/api/tags", timeout=5.0)
            return resp.status_code == 200
        except Exception:
            return False


# Module-level singleton
llm_client = LLMClient()
