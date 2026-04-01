"""
ARIA — Adaptive Response & Intelligence Agent
Feature 05: Anomaly Detection Worker Service

# [ARIA] This is the statistical threat detection layer. It uses PyOD's Isolation Forest
# to detect anomalous HTTP requests that regex patterns miss (zero-day attacks).
# Consumes normalized events from Redis queue 'aria:events:raw', extracts numerical
# features, scores each request 0-1 (anomaly score), and publishes scores back to Redis.
#
# Integration:
#   Gateway (01) → LPUSH 'aria:events:raw' → this worker → LPUSH 'aria:scores:{alertId}'
#   Dashboard (02) reads scores from Redis/MongoDB for display
#   Self-evolving agent (10) reads feedback to improve detection thresholds
#
# Design decisions:
#   - Fail-open: if anomaly detection crashes, requests are NOT blocked
#   - Sliding window: last 1000 requests used as baseline (re-fit every 100 new points)
#   - Single Isolation Forest model for speed; ensemble can be added later
"""

import json
import logging
import signal
import sys
import time
import threading
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse, parse_qs

import numpy as np
import redis

# [ARIA] PyOD Isolation Forest — best general-purpose anomaly detector for high-dimensional data.
# Chosen over LOF (too slow for real-time) and ECOD (less stable on sparse features).
from pyod.models.iforest import IForest
from sklearn.preprocessing import StandardScaler

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
# [ARIA] Structured logging with ISO timestamps for correlation with gateway logs.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S%z",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("aria.anomaly_detector")

# ---------------------------------------------------------------------------
# Configuration Constants
# ---------------------------------------------------------------------------
# [ARIA] Redis connection — same instance used by gateway and dashboard.
REDIS_URL: str = "redis://localhost:6379"
REDIS_DECODE_RESPONSES: bool = True

# [ARIA] Queue names — must match gateway LPUSH targets and copilot-instructions spec.
EVENTS_QUEUE: str = "aria:events:raw"
SCORES_QUEUE_PREFIX: str = "aria:scores"  # actual key: aria:scores:{alertId}

# [ARIA] Sliding window size — how many recent requests form the "normal" baseline.
# 1000 balances memory usage vs statistical significance for banking traffic volumes.
WINDOW_SIZE: int = 1000

# [ARIA] Re-fit interval — retrain the Isolation Forest every N new data points.
# 100 provides responsive adaptation without excessive CPU usage.
REFIT_INTERVAL: int = 100

# [ARIA] Contamination parameter — expected fraction of anomalies in training data.
# 0.05 (5%) is conservative for banking where most traffic is legitimate.
CONTAMINATION: float = 0.05

# [ARIA] BRPOP timeout in seconds — blocks waiting for new events, then loops.
# 5s keeps the worker responsive to shutdown signals without busy-waiting.
BRPOP_TIMEOUT: int = 5

# [ARIA] Feature count — number of numerical features extracted per request.
NUM_FEATURES: int = 10

# [ARIA] HTTP method encoding map — converts string methods to numeric for ML model.
METHOD_ENCODING: Dict[str, int] = {
    "GET": 0,
    "POST": 1,
    "PUT": 2,
    "PATCH": 3,
    "DELETE": 4,
    "HEAD": 5,
    "OPTIONS": 6,
}

# ---------------------------------------------------------------------------
# Graceful Shutdown Handler
# ---------------------------------------------------------------------------
# [ARIA] Thread-safe shutdown flag. When SIGINT/SIGTERM is received, the main
# loop exits cleanly, flushes pending work, and closes Redis connections.
_shutdown_event = threading.Event()


def _signal_handler(signum: int, frame: Any) -> None:
    """Handle SIGINT/SIGTERM for graceful shutdown."""
    sig_name = signal.Signals(signum).name
    logger.info("Received %s — initiating graceful shutdown…", sig_name)
    _shutdown_event.set()


signal.signal(signal.SIGINT, _signal_handler)
signal.signal(signal.SIGTERM, _signal_handler)


# ---------------------------------------------------------------------------
# Feature Extraction
# ---------------------------------------------------------------------------
def extract_features(event: Dict[str, Any]) -> Optional[np.ndarray]:
    """
    # [ARIA] Convert a raw event JSON into a fixed-length numeric feature vector.
    # These 10 features capture request structure, timing, and size characteristics
    # that distinguish normal banking API traffic from anomalous probing/attacks.
    #
    # Features:
    #   0. request_size    — total estimated size of the request (bytes)
    #   1. response_time   — proxy round-trip time in milliseconds
    #   2. hour_of_day     — 0-23, captures after-hours banking activity
    #   3. day_of_week     — 0=Monday..6=Sunday, captures weekend attacks
    #   4. method_encoded  — numeric encoding of HTTP method
    #   5. num_params      — count of query string parameters
    #   6. path_depth      — number of '/' segments in the URL path
    #   7. header_count    — number of HTTP headers sent
    #   8. body_length     — length of request body in bytes
    #   9. is_weekend      — binary flag (0 or 1)
    """
    try:
        # --- Request size estimation ---
        body: str = event.get("body", "") or ""
        path: str = event.get("path", "/") or "/"
        method: str = (event.get("method", "GET") or "GET").upper()
        headers: Dict[str, Any] = event.get("headers", {}) or {}
        user_agent: str = event.get("userAgent", "") or ""
        timestamp_str: str = event.get("timestamp", "") or ""

        # [ARIA] Parse timestamp — fall back to current time if missing/invalid.
        try:
            if timestamp_str:
                ts = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
            else:
                ts = datetime.now(timezone.utc)
        except (ValueError, TypeError):
            ts = datetime.now(timezone.utc)

        # [ARIA] Feature 0: request_size — rough estimate of total request bytes
        request_size = len(method) + len(path) + len(body) + len(user_agent)
        for k, v in headers.items():
            request_size += len(str(k)) + len(str(v))

        # [ARIA] Feature 1: response_time — gateway measures this in ms
        response_time = float(event.get("responseTime", 0) or 0)

        # [ARIA] Feature 2: hour_of_day — banking attacks often happen after hours
        hour_of_day = ts.hour

        # [ARIA] Feature 3: day_of_week — 0=Monday..6=Sunday
        day_of_week = ts.weekday()

        # [ARIA] Feature 4: method_encoded — unusual methods (DELETE on banking) are suspicious
        method_encoded = METHOD_ENCODING.get(method, 7)

        # [ARIA] Feature 5: num_params — excessive params may indicate fuzzing/injection
        try:
            parsed_url = urlparse(path)
            query_params = parse_qs(parsed_url.query)
            num_params = len(query_params)
        except Exception:
            num_params = 0

        # [ARIA] Feature 6: path_depth — deep paths like /../../etc/passwd are suspicious
        path_segments = [s for s in path.split("/") if s]
        path_depth = len(path_segments)

        # [ARIA] Feature 7: header_count — abnormal header counts indicate tooling
        header_count = len(headers)

        # [ARIA] Feature 8: body_length — large bodies on GET or tiny bodies on POST are odd
        body_length = len(body)

        # [ARIA] Feature 9: is_weekend — binary flag for weekend activity detection
        is_weekend = 1 if day_of_week >= 5 else 0

        features = np.array([
            request_size,
            response_time,
            hour_of_day,
            day_of_week,
            method_encoded,
            num_params,
            path_depth,
            header_count,
            body_length,
            is_weekend,
        ], dtype=np.float64)

        return features

    except Exception as exc:
        logger.error("Feature extraction failed: %s", exc, exc_info=True)
        return None


# ---------------------------------------------------------------------------
# Anomaly Detector Engine
# ---------------------------------------------------------------------------
class AnomalyDetectorEngine:
    """
    # [ARIA] Core anomaly detection engine using PyOD Isolation Forest.
    # Maintains a sliding window of recent request features and periodically
    # re-fits the model to adapt to changing traffic patterns (concept drift).
    #
    # Scoring: 0.0 = perfectly normal, 1.0 = extreme anomaly.
    # The model is only trained once MIN_SAMPLES requests have been collected,
    # to avoid fitting on insufficient data.
    """

    # [ARIA] Minimum samples before the model can be trained.
    # Below this, all requests are scored 0.0 (assumed normal) — fail-open design.
    MIN_SAMPLES: int = 50

    def __init__(
        self,
        window_size: int = WINDOW_SIZE,
        refit_interval: int = REFIT_INTERVAL,
        contamination: float = CONTAMINATION,
    ) -> None:
        self._window_size = window_size
        self._refit_interval = refit_interval
        self._contamination = contamination

        # [ARIA] Sliding window buffer — circular buffer of feature vectors
        self._buffer: List[np.ndarray] = []
        self._new_since_fit: int = 0
        self._total_processed: int = 0

        # [ARIA] Model and scaler — None until first fit
        self._model: Optional[IForest] = None
        self._scaler: Optional[StandardScaler] = None
        self._is_fitted: bool = False

        # [ARIA] Thread lock — protects buffer and model during concurrent access
        self._lock = threading.Lock()

        logger.info(
            "AnomalyDetectorEngine initialized (window=%d, refit_every=%d, contamination=%.2f)",
            window_size,
            refit_interval,
            contamination,
        )

    def _fit_model(self) -> None:
        """
        # [ARIA] Train (or re-train) the Isolation Forest on the current sliding window.
        # StandardScaler normalizes features so that no single feature dominates distance
        # calculations (e.g., request_size in bytes vs. hour_of_day 0-23).
        """
        if len(self._buffer) < self.MIN_SAMPLES:
            logger.debug(
                "Not enough samples to fit (%d/%d)", len(self._buffer), self.MIN_SAMPLES
            )
            return

        try:
            data = np.array(self._buffer)

            # [ARIA] StandardScaler — zero mean, unit variance per feature
            self._scaler = StandardScaler()
            scaled_data = self._scaler.fit_transform(data)

            # [ARIA] Isolation Forest — fast, handles high-dimensional data well,
            # and naturally assigns anomaly scores without needing labeled data.
            self._model = IForest(
                contamination=self._contamination,
                n_estimators=100,
                random_state=42,
            )
            self._model.fit(scaled_data)
            self._is_fitted = True
            self._new_since_fit = 0

            logger.info(
                "Model fitted on %d samples (window=%d)",
                len(self._buffer),
                self._window_size,
            )
        except Exception as exc:
            logger.error("Model fitting failed: %s", exc, exc_info=True)

    def add_and_score(self, features: np.ndarray) -> float:
        """
        # [ARIA] Add a feature vector to the sliding window and return its anomaly score.
        # Returns 0.0-1.0 where higher = more anomalous.
        # If the model isn't trained yet, returns 0.0 (fail-open).
        #
        # Side effect: triggers model re-fit every `refit_interval` new data points.
        """
        with self._lock:
            # [ARIA] Append to sliding window, evict oldest if over capacity
            self._buffer.append(features.copy())
            if len(self._buffer) > self._window_size:
                self._buffer = self._buffer[-self._window_size:]

            self._new_since_fit += 1
            self._total_processed += 1

            # [ARIA] Re-fit model periodically to adapt to traffic pattern changes
            should_refit = (
                self._new_since_fit >= self._refit_interval
                or (not self._is_fitted and len(self._buffer) >= self.MIN_SAMPLES)
            )
            if should_refit:
                self._fit_model()

            # [ARIA] Score the current request — fail-open if model not ready
            if not self._is_fitted or self._model is None or self._scaler is None:
                return 0.0

            try:
                scaled = self._scaler.transform(features.reshape(1, -1))
                # [ARIA] decision_function returns raw anomaly scores.
                # Higher = more anomalous. We normalize to 0-1 using a sigmoid-like mapping.
                raw_score = self._model.decision_function(scaled)[0]
                # [ARIA] Normalize: PyOD decision_function can return any real number.
                # We use a logistic sigmoid centered at 0 to map to [0, 1].
                normalized_score = 1.0 / (1.0 + np.exp(-raw_score))
                # [ARIA] Clamp to valid range for safety
                return float(np.clip(normalized_score, 0.0, 1.0))
            except Exception as exc:
                logger.error("Scoring failed: %s", exc, exc_info=True)
                return 0.0

    @property
    def total_processed(self) -> int:
        """Total number of events processed since startup."""
        return self._total_processed

    @property
    def buffer_size(self) -> int:
        """Current number of samples in the sliding window."""
        return len(self._buffer)

    @property
    def is_fitted(self) -> bool:
        """Whether the model has been trained at least once."""
        return self._is_fitted


# ---------------------------------------------------------------------------
# Redis Connection Helper
# ---------------------------------------------------------------------------
def create_redis_client(url: str = REDIS_URL) -> redis.Redis:
    """
    # [ARIA] Create a Redis client with retry logic.
    # Uses decode_responses=True so all data comes back as str (not bytes).
    # The gateway uses the 'redis' npm package; this Python worker uses
    # the 'redis' Python package — same server, different client libraries.
    """
    try:
        client = redis.Redis.from_url(
            url,
            decode_responses=REDIS_DECODE_RESPONSES,
            socket_connect_timeout=10,
            socket_keepalive=True,
            retry_on_timeout=True,
        )
        client.ping()
        logger.info("Connected to Redis at %s", url)
        return client
    except redis.ConnectionError as exc:
        logger.error("Failed to connect to Redis at %s: %s", url, exc)
        raise


# ---------------------------------------------------------------------------
# Event Processing
# ---------------------------------------------------------------------------
def process_event(
    event_data: str,
    engine: AnomalyDetectorEngine,
    redis_client: redis.Redis,
) -> None:
    """
    # [ARIA] Process a single event from the Redis queue.
    # Steps:
    #   1. Parse JSON event
    #   2. Extract numerical features
    #   3. Score with Isolation Forest
    #   4. Publish score back to Redis for the fidelity ranker (Feature 07) to consume
    #
    # Fail-open: any error in processing results in a 0.0 score (not suspicious),
    # logged as a warning, and processing continues with the next event.
    """
    try:
        event: Dict[str, Any] = json.loads(event_data)
    except (json.JSONDecodeError, TypeError) as exc:
        logger.warning("Failed to parse event JSON: %s — skipping", exc)
        return

    alert_id: str = event.get("id", "") or event.get("alertId", "")
    if not alert_id:
        logger.warning("Event missing 'id'/'alertId' field — skipping: %s", event_data[:200])
        return

    # [ARIA] Extract feature vector from raw event
    features = extract_features(event)
    if features is None:
        logger.warning("Feature extraction returned None for alert %s — scoring 0.0", alert_id)
        _publish_score(redis_client, alert_id, 0.0, event)
        return

    # [ARIA] Score the request using the Isolation Forest model
    anomaly_score = engine.add_and_score(features)

    # [ARIA] Publish score to Redis for downstream consumption (fidelity ranking, dashboard)
    _publish_score(redis_client, alert_id, anomaly_score, event)

    # [ARIA] Log at appropriate level based on score severity
    if anomaly_score >= 0.8:
        logger.warning(
            "HIGH anomaly score=%.3f alert=%s ip=%s path=%s method=%s",
            anomaly_score,
            alert_id,
            event.get("sourceIP", "?"),
            event.get("path", "?"),
            event.get("method", "?"),
        )
    elif anomaly_score >= 0.5:
        logger.info(
            "MEDIUM anomaly score=%.3f alert=%s ip=%s path=%s",
            anomaly_score,
            alert_id,
            event.get("sourceIP", "?"),
            event.get("path", "?"),
        )
    else:
        logger.debug(
            "LOW anomaly score=%.3f alert=%s",
            anomaly_score,
            alert_id,
        )


def _publish_score(
    redis_client: redis.Redis,
    alert_id: str,
    score: float,
    event: Dict[str, Any],
) -> None:
    """
    # [ARIA] Publish anomaly score to Redis list for the fidelity ranker to consume.
    # Key format: aria:scores:{alertId}
    # Payload: JSON with score, source identifier, timestamp, and basic context.
    # TTL: 1 hour — scores are ephemeral; fidelity ranker should consume quickly.
    """
    try:
        score_key = f"{SCORES_QUEUE_PREFIX}:{alert_id}"
        score_payload = json.dumps({
            "alertId": alert_id,
            "source": "anomaly",
            "score": round(score, 4),
            "modelType": "iforest",
            "bufferSize": None,  # will be populated below
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "features": {
                "sourceIP": event.get("sourceIP", ""),
                "path": event.get("path", ""),
                "method": event.get("method", ""),
            },
        })

        # [ARIA] LPUSH — matches the integration pattern defined in copilot-instructions.md
        redis_client.lpush(score_key, score_payload)
        # [ARIA] Set TTL so orphaned scores don't fill Redis memory forever
        redis_client.expire(score_key, 3600)

    except redis.RedisError as exc:
        logger.error("Failed to publish score for alert %s: %s", alert_id, exc)


# ---------------------------------------------------------------------------
# Main Worker Loop
# ---------------------------------------------------------------------------
def run_worker() -> None:
    """
    # [ARIA] Main event loop for the anomaly detection worker.
    # Connects to Redis, creates the detection engine, and continuously
    # consumes events via BRPOP (blocking pop) from 'aria:events:raw'.
    #
    # BRPOP ensures:
    #   - Events are consumed exactly once (popped from queue)
    #   - Worker blocks efficiently when no events are available
    #   - Multiple workers can run in parallel for horizontal scaling
    #
    # Graceful shutdown: SIGINT/SIGTERM sets _shutdown_event, loop exits,
    # Redis connection is closed cleanly.
    """
    logger.info("=" * 60)
    logger.info("ARIA Anomaly Detection Worker starting…")
    logger.info("  Redis:       %s", REDIS_URL)
    logger.info("  Queue:       %s", EVENTS_QUEUE)
    logger.info("  Window:      %d samples", WINDOW_SIZE)
    logger.info("  Refit every: %d new points", REFIT_INTERVAL)
    logger.info("  Model:       Isolation Forest (contamination=%.2f)", CONTAMINATION)
    logger.info("=" * 60)

    # [ARIA] Connect to Redis with retry — if Redis is down at startup, wait and retry
    redis_client: Optional[redis.Redis] = None
    retry_delay = 5
    while not _shutdown_event.is_set():
        try:
            redis_client = create_redis_client(REDIS_URL)
            break
        except redis.ConnectionError:
            logger.warning(
                "Redis not available, retrying in %ds…", retry_delay
            )
            _shutdown_event.wait(retry_delay)
            retry_delay = min(retry_delay * 2, 60)  # exponential backoff, cap at 60s

    if redis_client is None or _shutdown_event.is_set():
        logger.info("Shutdown before Redis connection established — exiting.")
        return

    # [ARIA] Initialize the anomaly detection engine
    engine = AnomalyDetectorEngine(
        window_size=WINDOW_SIZE,
        refit_interval=REFIT_INTERVAL,
        contamination=CONTAMINATION,
    )

    # [ARIA] Stats tracking for periodic health logging
    events_since_last_log = 0
    last_stats_time = time.time()
    STATS_LOG_INTERVAL = 60  # log stats every 60 seconds

    logger.info("Listening for events on '%s'…", EVENTS_QUEUE)

    try:
        while not _shutdown_event.is_set():
            try:
                # [ARIA] BRPOP — blocking pop from the right end of the list.
                # Returns (key, value) tuple or None on timeout.
                # Timeout allows periodic shutdown-flag checks.
                result = redis_client.brpop(EVENTS_QUEUE, timeout=BRPOP_TIMEOUT)

                if result is None:
                    # [ARIA] Timeout — no events available, just loop and check shutdown
                    continue

                _queue_name, event_data = result
                process_event(event_data, engine, redis_client)
                events_since_last_log += 1

                # [ARIA] Periodic health/stats logging
                now = time.time()
                if now - last_stats_time >= STATS_LOG_INTERVAL:
                    logger.info(
                        "STATS: processed=%d total=%d buffer=%d/%d fitted=%s events_last_%ds=%d",
                        engine.total_processed,
                        engine.total_processed,
                        engine.buffer_size,
                        WINDOW_SIZE,
                        engine.is_fitted,
                        STATS_LOG_INTERVAL,
                        events_since_last_log,
                    )
                    events_since_last_log = 0
                    last_stats_time = now

            except redis.ConnectionError as exc:
                # [ARIA] Redis connection lost — attempt reconnection
                logger.error("Redis connection lost: %s — reconnecting in 5s…", exc)
                _shutdown_event.wait(5)
                if _shutdown_event.is_set():
                    break
                try:
                    redis_client = create_redis_client(REDIS_URL)
                    logger.info("Redis reconnected successfully.")
                except redis.ConnectionError:
                    logger.error("Redis reconnection failed — will retry on next loop.")

            except Exception as exc:
                # [ARIA] Catch-all: log and continue — never crash the worker
                logger.error(
                    "Unexpected error in main loop: %s", exc, exc_info=True
                )
                _shutdown_event.wait(1)  # brief pause to avoid tight error loops

    finally:
        # [ARIA] Graceful shutdown — close Redis connection and log final stats
        logger.info("Shutting down…")
        logger.info(
            "Final stats: total_processed=%d buffer_size=%d model_fitted=%s",
            engine.total_processed,
            engine.buffer_size,
            engine.is_fitted,
        )
        if redis_client is not None:
            try:
                redis_client.close()
                logger.info("Redis connection closed.")
            except Exception:
                pass
        logger.info("ARIA Anomaly Detection Worker stopped.")


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    run_worker()
