"""
ARIA — Adaptive Response & Intelligence Agent
Feature 06: User & Entity Behavior Analytics (UEBA) Worker Service

# [ARIA] Builds per-IP behavioral profiles and scores deviation from "normal" behavior.
# Unlike anomaly detection (Feature 05) which looks at individual request features,
# UEBA looks at patterns across multiple requests over time for each entity (IP address).
#
# Integration:
#   Gateway (01) → LPUSH 'aria:events:raw' → this worker → LPUSH 'aria:ueba:{alertId}'
#   Baselines stored in Redis hashes: aria:baseline:{ip} (30-day TTL)
#   Dashboard (02) reads deviation scores for display
#
# Detections:
#   - Impossible travel (two locations too fast for physical travel)
#   - Unusual hours (requests outside typical activity windows)
#   - Endpoint deviation (accessing unusual endpoints for this IP)
#   - Method anomaly (unusual HTTP methods compared to history)
#   - Frequency spike (sudden increase in request rate)
#   - Session duration anomaly (sessions much longer/shorter than usual)
#
# Design decisions:
#   - Fail-open: if UEBA scoring fails, requests get 0.0 score (not suspicious)
#   - Baselines in Redis hashes with 30-day TTL for fast lookups and auto-expiry
#   - IST timezone for banking hour analysis (Indian Standard Time, UTC+5:30)
#   - Per-IP profiles — entity = IP address (expandable to user/session later)
"""

import json
import logging
import math
import signal
import sys
import time
import threading
from collections import Counter
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Set, Tuple

import numpy as np
import redis
from dateutil import tz as dateutil_tz

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
logger = logging.getLogger("aria.ueba_engine")

# ---------------------------------------------------------------------------
# Configuration Constants
# ---------------------------------------------------------------------------
# [ARIA] Redis connection — same instance used by gateway, anomaly detector, and dashboard.
REDIS_URL: str = "redis://localhost:6379"
REDIS_DECODE_RESPONSES: bool = True

# [ARIA] Queue names — must match gateway LPUSH targets and copilot-instructions spec.
EVENTS_QUEUE: str = "aria:events:raw"
UEBA_SCORES_PREFIX: str = "aria:ueba"  # actual key: aria:ueba:{alertId}

# [ARIA] Baseline key prefix — Redis hashes storing per-IP behavioral profiles.
BASELINE_PREFIX: str = "aria:baseline"  # actual key: aria:baseline:{ip}

# [ARIA] Baseline TTL — 30 days. Profiles auto-expire if an IP goes inactive.
# This prevents unbounded Redis memory growth from transient IPs.
BASELINE_TTL_SECONDS: int = 30 * 24 * 3600  # 30 days

# [ARIA] BRPOP timeout in seconds — blocks waiting for new events, then loops.
BRPOP_TIMEOUT: int = 5

# [ARIA] IST timezone — Indian Standard Time (UTC+5:30) for banking hour analysis.
# Banking attacks outside business hours (9:00-18:00 IST) are more suspicious.
IST = dateutil_tz.gettz("Asia/Kolkata")

# [ARIA] Business hours range in IST for banking context
BUSINESS_HOUR_START: int = 9   # 9:00 AM IST
BUSINESS_HOUR_END: int = 18    # 6:00 PM IST

# [ARIA] Impossible travel threshold — maximum plausible speed in km/h.
# Commercial flights max ~900 km/h; we use 1000 km/h to be generous.
IMPOSSIBLE_TRAVEL_SPEED_KMH: float = 1000.0

# [ARIA] Frequency spike threshold — multiplier over baseline request rate.
# If current rate > baseline * this multiplier, flag as spike.
FREQUENCY_SPIKE_MULTIPLIER: float = 5.0

# [ARIA] Minimum requests before a baseline is considered "established".
# Below this, deviation scoring is suppressed (fail-open) to avoid false positives
# on new/infrequent visitors.
MIN_BASELINE_REQUESTS: int = 10

# [ARIA] Maximum number of recent endpoints/methods to track per IP.
MAX_TRACKED_ITEMS: int = 100

# [ARIA] Score TTL — scores expire from Redis after 1 hour
SCORE_TTL_SECONDS: int = 3600

# ---------------------------------------------------------------------------
# Graceful Shutdown Handler
# ---------------------------------------------------------------------------
# [ARIA] Thread-safe shutdown flag. SIGINT/SIGTERM triggers clean exit.
_shutdown_event = threading.Event()


def _signal_handler(signum: int, frame: Any) -> None:
    """Handle SIGINT/SIGTERM for graceful shutdown."""
    sig_name = signal.Signals(signum).name
    logger.info("Received %s — initiating graceful shutdown…", sig_name)
    _shutdown_event.set()


signal.signal(signal.SIGINT, _signal_handler)
signal.signal(signal.SIGTERM, _signal_handler)


# ---------------------------------------------------------------------------
# Geo-location Utilities
# ---------------------------------------------------------------------------
# [ARIA] Approximate geo-location mapping from IP to coordinates.
# In production, this would use MaxMind GeoIP2 or similar. For the hackathon demo,
# we extract geo hints from the event data if available, or default to Mumbai.
DEFAULT_LOCATION: Tuple[float, float] = (19.0760, 72.8777)  # Mumbai, India


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    # [ARIA] Calculate great-circle distance between two points on Earth.
    # Used for impossible travel detection — if two requests from the same IP
    # come from locations too far apart given the time difference, it's suspicious.
    """
    R = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def extract_location(event: Dict[str, Any]) -> Tuple[float, float]:
    """
    # [ARIA] Extract geo-location from event data.
    # Looks for lat/lon fields, or falls back to DEFAULT_LOCATION (Mumbai).
    # Future: integrate MaxMind GeoIP2 for IP-to-location resolution.
    """
    try:
        lat = float(event.get("latitude", 0) or 0)
        lon = float(event.get("longitude", 0) or 0)
        if lat != 0 and lon != 0:
            return (lat, lon)
    except (ValueError, TypeError):
        pass
    return DEFAULT_LOCATION


# ---------------------------------------------------------------------------
# Behavioral Baseline Manager
# ---------------------------------------------------------------------------
class BaselineManager:
    """
    # [ARIA] Manages per-IP behavioral baselines stored in Redis hashes.
    #
    # Each IP's baseline tracks:
    #   - request_count: total requests seen
    #   - hour_histogram: JSON array of 24 ints (request counts per hour IST)
    #   - endpoints: JSON object of endpoint → count
    #   - methods: JSON object of method → count
    #   - avg_requests_per_minute: rolling average request frequency
    #   - last_request_time: ISO timestamp of last request
    #   - last_lat / last_lon: last known geo-location
    #   - session_durations: JSON array of recent session durations (seconds)
    #   - first_seen: ISO timestamp when this IP was first observed
    #
    # Redis hash fields are strings; complex structures are JSON-serialized.
    # TTL is refreshed on every update to ensure active IPs don't expire.
    """

    def __init__(self, redis_client: redis.Redis) -> None:
        self._redis = redis_client

    def _baseline_key(self, ip: str) -> str:
        """Redis key for an IP's behavioral baseline."""
        return f"{BASELINE_PREFIX}:{ip}"

    def get_baseline(self, ip: str) -> Dict[str, Any]:
        """
        # [ARIA] Retrieve the full behavioral baseline for an IP from Redis.
        # Returns a dict with parsed fields, or an empty dict if no baseline exists.
        """
        try:
            key = self._baseline_key(ip)
            raw = self._redis.hgetall(key)
            if not raw:
                return {}

            baseline: Dict[str, Any] = {}
            baseline["request_count"] = int(raw.get("request_count", "0"))
            baseline["first_seen"] = raw.get("first_seen", "")
            baseline["last_request_time"] = raw.get("last_request_time", "")
            baseline["avg_requests_per_minute"] = float(raw.get("avg_requests_per_minute", "0"))
            baseline["last_lat"] = float(raw.get("last_lat", "0"))
            baseline["last_lon"] = float(raw.get("last_lon", "0"))

            # [ARIA] Parse JSON-serialized complex fields
            try:
                baseline["hour_histogram"] = json.loads(raw.get("hour_histogram", "[]"))
            except (json.JSONDecodeError, TypeError):
                baseline["hour_histogram"] = [0] * 24

            try:
                baseline["endpoints"] = json.loads(raw.get("endpoints", "{}"))
            except (json.JSONDecodeError, TypeError):
                baseline["endpoints"] = {}

            try:
                baseline["methods"] = json.loads(raw.get("methods", "{}"))
            except (json.JSONDecodeError, TypeError):
                baseline["methods"] = {}

            try:
                baseline["session_durations"] = json.loads(raw.get("session_durations", "[]"))
            except (json.JSONDecodeError, TypeError):
                baseline["session_durations"] = []

            return baseline

        except redis.RedisError as exc:
            logger.error("Failed to get baseline for IP %s: %s", ip, exc)
            return {}

    def update_baseline(
        self,
        ip: str,
        hour_ist: int,
        endpoint: str,
        method: str,
        timestamp_iso: str,
        lat: float,
        lon: float,
    ) -> Dict[str, Any]:
        """
        # [ARIA] Incrementally update the behavioral baseline for an IP.
        # Called on every request from this IP. Updates counters, histograms,
        # and rolling averages. Returns the updated baseline.
        """
        try:
            key = self._baseline_key(ip)
            baseline = self.get_baseline(ip)

            now_iso = timestamp_iso or datetime.now(timezone.utc).isoformat()

            if not baseline:
                # [ARIA] First time seeing this IP — initialize baseline
                baseline = {
                    "request_count": 0,
                    "hour_histogram": [0] * 24,
                    "endpoints": {},
                    "methods": {},
                    "avg_requests_per_minute": 0.0,
                    "last_request_time": now_iso,
                    "last_lat": lat,
                    "last_lon": lon,
                    "session_durations": [],
                    "first_seen": now_iso,
                }

            # [ARIA] Update request count
            baseline["request_count"] = baseline.get("request_count", 0) + 1

            # [ARIA] Update hour histogram (24 buckets, IST timezone)
            hour_hist = baseline.get("hour_histogram", [0] * 24)
            if len(hour_hist) < 24:
                hour_hist = [0] * 24
            hour_hist[hour_ist % 24] += 1
            baseline["hour_histogram"] = hour_hist

            # [ARIA] Update endpoint frequency map (capped to prevent unbounded growth)
            endpoints = baseline.get("endpoints", {})
            endpoints[endpoint] = endpoints.get(endpoint, 0) + 1
            if len(endpoints) > MAX_TRACKED_ITEMS:
                # [ARIA] Evict least-frequent endpoints to cap memory usage
                sorted_eps = sorted(endpoints.items(), key=lambda x: x[1], reverse=True)
                endpoints = dict(sorted_eps[:MAX_TRACKED_ITEMS])
            baseline["endpoints"] = endpoints

            # [ARIA] Update method frequency map
            methods = baseline.get("methods", {})
            methods[method] = methods.get(method, 0) + 1
            baseline["methods"] = methods

            # [ARIA] Update rolling average request rate (requests per minute)
            last_time_str = baseline.get("last_request_time", "")
            if last_time_str:
                try:
                    last_time = datetime.fromisoformat(last_time_str.replace("Z", "+00:00"))
                    now_time = datetime.fromisoformat(now_iso.replace("Z", "+00:00"))
                    delta_minutes = max((now_time - last_time).total_seconds() / 60.0, 0.001)
                    current_rate = 1.0 / delta_minutes
                    old_avg = baseline.get("avg_requests_per_minute", 0.0)
                    # [ARIA] Exponential moving average with alpha=0.1 for smooth adaptation
                    alpha = 0.1
                    baseline["avg_requests_per_minute"] = (1 - alpha) * old_avg + alpha * current_rate
                except (ValueError, TypeError):
                    pass

            # [ARIA] Update location and timestamp
            baseline["last_request_time"] = now_iso
            baseline["last_lat"] = lat
            baseline["last_lon"] = lon

            # [ARIA] Persist to Redis hash
            self._redis.hset(key, mapping={
                "request_count": str(baseline["request_count"]),
                "hour_histogram": json.dumps(baseline["hour_histogram"]),
                "endpoints": json.dumps(baseline["endpoints"]),
                "methods": json.dumps(baseline["methods"]),
                "avg_requests_per_minute": str(round(baseline["avg_requests_per_minute"], 4)),
                "last_request_time": baseline["last_request_time"],
                "last_lat": str(baseline["last_lat"]),
                "last_lon": str(baseline["last_lon"]),
                "session_durations": json.dumps(baseline.get("session_durations", [])),
                "first_seen": baseline.get("first_seen", now_iso),
            })

            # [ARIA] Refresh TTL to keep active baselines alive
            self._redis.expire(key, BASELINE_TTL_SECONDS)

            return baseline

        except redis.RedisError as exc:
            logger.error("Failed to update baseline for IP %s: %s", ip, exc)
            return baseline if baseline else {}
        except Exception as exc:
            logger.error("Unexpected error updating baseline for IP %s: %s", ip, exc, exc_info=True)
            return baseline if baseline else {}


# ---------------------------------------------------------------------------
# UEBA Scoring Engine
# ---------------------------------------------------------------------------
class UEBAScorer:
    """
    # [ARIA] Scores behavioral deviation for each request against the IP's baseline.
    # Produces a composite score 0.0-1.0 combining multiple deviation signals:
    #
    #   1. Unusual hours       — request at time this IP rarely operates
    #   2. Endpoint deviation  — accessing endpoints not in typical set
    #   3. Method anomaly      — using HTTP methods unusual for this IP
    #   4. Frequency spike     — request rate much higher than baseline
    #   5. Impossible travel   — geo-location change faster than possible
    #   6. Session anomaly     — (reserved for future session tracking)
    #
    # Each sub-score is 0.0-1.0, and the composite is a weighted average.
    # Weights reflect relative importance for banking threat detection.
    """

    # [ARIA] Weights for each deviation signal — tuned for banking context.
    # Impossible travel and frequency spikes are strongest indicators of compromise.
    WEIGHTS: Dict[str, float] = {
        "unusual_hours": 0.15,
        "endpoint_deviation": 0.20,
        "method_anomaly": 0.15,
        "frequency_spike": 0.25,
        "impossible_travel": 0.25,
    }

    def score(
        self,
        event: Dict[str, Any],
        baseline: Dict[str, Any],
        current_hour_ist: int,
        current_location: Tuple[float, float],
        current_timestamp: datetime,
    ) -> Tuple[float, Dict[str, float], List[str]]:
        """
        # [ARIA] Score a single event against its IP's behavioral baseline.
        # Returns:
        #   - composite_score: float 0.0-1.0
        #   - sub_scores: dict of signal_name → individual score
        #   - detections: list of string descriptions of detected anomalies
        """
        request_count = baseline.get("request_count", 0)

        # [ARIA] If baseline isn't established yet, return 0.0 (fail-open)
        if request_count < MIN_BASELINE_REQUESTS:
            return 0.0, {}, []

        sub_scores: Dict[str, float] = {}
        detections: List[str] = []

        # --- 1. Unusual Hours ---
        sub_scores["unusual_hours"] = self._score_unusual_hours(
            current_hour_ist, baseline, detections
        )

        # --- 2. Endpoint Deviation ---
        sub_scores["endpoint_deviation"] = self._score_endpoint_deviation(
            event.get("path", "/"), baseline, detections
        )

        # --- 3. Method Anomaly ---
        sub_scores["method_anomaly"] = self._score_method_anomaly(
            event.get("method", "GET"), baseline, detections
        )

        # --- 4. Frequency Spike ---
        sub_scores["frequency_spike"] = self._score_frequency_spike(
            baseline, current_timestamp, detections
        )

        # --- 5. Impossible Travel ---
        sub_scores["impossible_travel"] = self._score_impossible_travel(
            baseline, current_location, current_timestamp, detections
        )

        # [ARIA] Compute weighted composite score
        composite = 0.0
        total_weight = 0.0
        for signal_name, weight in self.WEIGHTS.items():
            composite += sub_scores.get(signal_name, 0.0) * weight
            total_weight += weight

        if total_weight > 0:
            composite /= total_weight

        # [ARIA] Clamp to valid range
        composite = max(0.0, min(1.0, composite))

        return composite, sub_scores, detections

    def _score_unusual_hours(
        self,
        current_hour_ist: int,
        baseline: Dict[str, Any],
        detections: List[str],
    ) -> float:
        """
        # [ARIA] Score how unusual the current request hour is for this IP.
        # Uses the hour histogram from the baseline. If this IP rarely operates
        # at this hour, the score is high. Also flags non-business-hours for banking.
        """
        hour_hist = baseline.get("hour_histogram", [0] * 24)
        if not hour_hist or len(hour_hist) < 24:
            return 0.0

        total_requests = sum(hour_hist)
        if total_requests == 0:
            return 0.0

        # [ARIA] Calculate probability of this hour based on historical activity
        hour_probability = hour_hist[current_hour_ist % 24] / total_requests

        # [ARIA] Low probability = unusual = high score
        if hour_probability < 0.01:
            score = 0.9
            detections.append(f"very_unusual_hour:{current_hour_ist}IST")
        elif hour_probability < 0.05:
            score = 0.6
            detections.append(f"unusual_hour:{current_hour_ist}IST")
        elif hour_probability < 0.10:
            score = 0.3
        else:
            score = 0.0

        # [ARIA] Boost score if outside banking business hours (9-18 IST)
        if current_hour_ist < BUSINESS_HOUR_START or current_hour_ist >= BUSINESS_HOUR_END:
            score = min(1.0, score + 0.2)
            if score >= 0.5:
                detections.append(f"after_hours_banking:{current_hour_ist}IST")

        return score

    def _score_endpoint_deviation(
        self,
        current_endpoint: str,
        baseline: Dict[str, Any],
        detections: List[str],
    ) -> float:
        """
        # [ARIA] Score how unusual the requested endpoint is for this IP.
        # If the IP has never accessed this endpoint before, or rarely does,
        # the score is high. Critical for detecting account enumeration or
        # lateral movement in banking apps.
        """
        endpoints = baseline.get("endpoints", {})
        if not endpoints:
            return 0.0

        total_endpoint_hits = sum(endpoints.values())
        if total_endpoint_hits == 0:
            return 0.0

        # [ARIA] Normalize path — strip query params and trailing slashes
        clean_path = current_endpoint.split("?")[0].rstrip("/") or "/"

        endpoint_hits = endpoints.get(clean_path, 0)
        endpoint_probability = endpoint_hits / total_endpoint_hits

        if endpoint_hits == 0:
            # [ARIA] Never-before-seen endpoint for this IP
            detections.append(f"new_endpoint:{clean_path}")
            return 0.8
        elif endpoint_probability < 0.02:
            detections.append(f"rare_endpoint:{clean_path}")
            return 0.5
        elif endpoint_probability < 0.05:
            return 0.2
        else:
            return 0.0

    def _score_method_anomaly(
        self,
        current_method: str,
        baseline: Dict[str, Any],
        detections: List[str],
    ) -> float:
        """
        # [ARIA] Score how unusual the HTTP method is for this IP.
        # A user who normally only does GET suddenly doing DELETE is suspicious.
        # Banking context: POST/PUT to financial endpoints from a GET-only user
        # could indicate compromised credentials being used for transactions.
        """
        methods = baseline.get("methods", {})
        if not methods:
            return 0.0

        total_method_hits = sum(methods.values())
        if total_method_hits == 0:
            return 0.0

        method_upper = current_method.upper()
        method_hits = methods.get(method_upper, 0)
        method_probability = method_hits / total_method_hits

        if method_hits == 0:
            # [ARIA] Method never used by this IP before
            detections.append(f"new_method:{method_upper}")
            # [ARIA] Dangerous methods (DELETE, PATCH) score higher
            if method_upper in ("DELETE", "PATCH", "PUT"):
                return 0.9
            return 0.7
        elif method_probability < 0.05:
            detections.append(f"rare_method:{method_upper}")
            return 0.4
        else:
            return 0.0

    def _score_frequency_spike(
        self,
        baseline: Dict[str, Any],
        current_timestamp: datetime,
        detections: List[str],
    ) -> float:
        """
        # [ARIA] Score whether the current request rate is a spike over baseline.
        # Compares instantaneous rate (1/time_since_last_request) against the
        # rolling average. A sudden spike may indicate automated attack tooling,
        # credential stuffing, or DDoS.
        """
        avg_rpm = baseline.get("avg_requests_per_minute", 0.0)
        last_time_str = baseline.get("last_request_time", "")

        if not last_time_str or avg_rpm <= 0:
            return 0.0

        try:
            last_time = datetime.fromisoformat(last_time_str.replace("Z", "+00:00"))
            delta_seconds = max((current_timestamp - last_time).total_seconds(), 0.001)
            delta_minutes = delta_seconds / 60.0
            current_rate = 1.0 / delta_minutes

            # [ARIA] Compare current instantaneous rate to baseline average
            if avg_rpm > 0 and current_rate > avg_rpm * FREQUENCY_SPIKE_MULTIPLIER:
                ratio = current_rate / avg_rpm
                score = min(1.0, 0.5 + (ratio - FREQUENCY_SPIKE_MULTIPLIER) * 0.05)
                detections.append(
                    f"frequency_spike:rate={current_rate:.1f}rpm,baseline={avg_rpm:.1f}rpm,ratio={ratio:.1f}x"
                )
                return score
            else:
                return 0.0

        except (ValueError, TypeError) as exc:
            logger.debug("Frequency spike scoring error: %s", exc)
            return 0.0

    def _score_impossible_travel(
        self,
        baseline: Dict[str, Any],
        current_location: Tuple[float, float],
        current_timestamp: datetime,
        detections: List[str],
    ) -> float:
        """
        # [ARIA] Detect impossible travel — same IP from two locations too far
        # apart given the time elapsed. If the implied travel speed exceeds
        # IMPOSSIBLE_TRAVEL_SPEED_KMH (1000 km/h), flag as impossible.
        #
        # This catches: VPN hopping, credential sharing, proxy chains, and
        # actual account compromise from a different geographic location.
        """
        last_lat = baseline.get("last_lat", 0.0)
        last_lon = baseline.get("last_lon", 0.0)
        last_time_str = baseline.get("last_request_time", "")

        # [ARIA] Skip if no previous location or location is default/unknown
        if (last_lat == 0.0 and last_lon == 0.0) or not last_time_str:
            return 0.0

        curr_lat, curr_lon = current_location
        if curr_lat == 0.0 and curr_lon == 0.0:
            return 0.0

        # [ARIA] Skip if locations are the same (common case)
        if abs(curr_lat - last_lat) < 0.01 and abs(curr_lon - last_lon) < 0.01:
            return 0.0

        try:
            last_time = datetime.fromisoformat(last_time_str.replace("Z", "+00:00"))
            delta_hours = max((current_timestamp - last_time).total_seconds() / 3600.0, 0.001)

            distance_km = haversine_km(last_lat, last_lon, curr_lat, curr_lon)
            implied_speed = distance_km / delta_hours

            if implied_speed > IMPOSSIBLE_TRAVEL_SPEED_KMH:
                score = min(1.0, 0.7 + (implied_speed / IMPOSSIBLE_TRAVEL_SPEED_KMH - 1.0) * 0.1)
                detections.append(
                    f"impossible_travel:dist={distance_km:.0f}km,time={delta_hours:.2f}h,"
                    f"speed={implied_speed:.0f}km/h"
                )
                return score
            elif implied_speed > IMPOSSIBLE_TRAVEL_SPEED_KMH * 0.5:
                # [ARIA] Suspicious but not impossible — fast travel
                return 0.3
            else:
                return 0.0

        except (ValueError, TypeError) as exc:
            logger.debug("Impossible travel scoring error: %s", exc)
            return 0.0


# ---------------------------------------------------------------------------
# Redis Connection Helper
# ---------------------------------------------------------------------------
def create_redis_client(url: str = REDIS_URL) -> redis.Redis:
    """
    # [ARIA] Create a Redis client with retry logic.
    # Uses decode_responses=True so all data comes back as str (not bytes).
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
    baseline_manager: BaselineManager,
    scorer: UEBAScorer,
    redis_client: redis.Redis,
) -> None:
    """
    # [ARIA] Process a single event from the Redis queue.
    # Steps:
    #   1. Parse JSON event
    #   2. Extract IP, timestamp, location, endpoint, method
    #   3. Convert timestamp to IST for hour analysis
    #   4. Retrieve current baseline for this IP
    #   5. Score behavioral deviation
    #   6. Update baseline with this request's data
    #   7. Publish UEBA score to Redis for fidelity ranker (Feature 07)
    #
    # Fail-open: any error results in a 0.0 score, logged and continued.
    """
    try:
        event: Dict[str, Any] = json.loads(event_data)
    except (json.JSONDecodeError, TypeError) as exc:
        logger.warning("Failed to parse event JSON: %s — skipping", exc)
        return

    alert_id: str = event.get("id", "") or event.get("alertId", "")
    if not alert_id:
        logger.warning("Event missing 'id'/'alertId' — skipping: %s", event_data[:200])
        return

    source_ip: str = event.get("sourceIP", "") or event.get("ip", "")
    if not source_ip:
        logger.warning("Event missing sourceIP for alert %s — scoring 0.0", alert_id)
        _publish_score(redis_client, alert_id, 0.0, {}, [], event)
        return

    # [ARIA] Parse timestamp and convert to IST
    timestamp_str = event.get("timestamp", "") or ""
    try:
        if timestamp_str:
            ts_utc = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        else:
            ts_utc = datetime.now(timezone.utc)
    except (ValueError, TypeError):
        ts_utc = datetime.now(timezone.utc)

    ts_ist = ts_utc.astimezone(IST)
    current_hour_ist = ts_ist.hour

    # [ARIA] Extract location from event
    current_location = extract_location(event)

    # [ARIA] Get current baseline for this IP (before updating)
    baseline = baseline_manager.get_baseline(source_ip)

    # [ARIA] Score behavioral deviation against baseline
    composite_score, sub_scores, detections = scorer.score(
        event=event,
        baseline=baseline,
        current_hour_ist=current_hour_ist,
        current_location=current_location,
        current_timestamp=ts_utc,
    )

    # [ARIA] Update baseline with this request's data (after scoring, so we score
    # against the pre-update baseline — the "before" state)
    path = event.get("path", "/") or "/"
    method = (event.get("method", "GET") or "GET").upper()
    baseline_manager.update_baseline(
        ip=source_ip,
        hour_ist=current_hour_ist,
        endpoint=path.split("?")[0].rstrip("/") or "/",
        method=method,
        timestamp_iso=ts_utc.isoformat(),
        lat=current_location[0],
        lon=current_location[1],
    )

    # [ARIA] Publish score to Redis
    _publish_score(redis_client, alert_id, composite_score, sub_scores, detections, event)

    # [ARIA] Log at appropriate level based on score severity
    if composite_score >= 0.7:
        logger.warning(
            "HIGH UEBA score=%.3f alert=%s ip=%s detections=%s",
            composite_score,
            alert_id,
            source_ip,
            detections,
        )
    elif composite_score >= 0.4:
        logger.info(
            "MEDIUM UEBA score=%.3f alert=%s ip=%s detections=%s",
            composite_score,
            alert_id,
            source_ip,
            detections,
        )
    else:
        logger.debug("LOW UEBA score=%.3f alert=%s", composite_score, alert_id)


def _publish_score(
    redis_client: redis.Redis,
    alert_id: str,
    score: float,
    sub_scores: Dict[str, float],
    detections: List[str],
    event: Dict[str, Any],
) -> None:
    """
    # [ARIA] Publish UEBA deviation score to Redis list for the fidelity ranker.
    # Key format: aria:ueba:{alertId}
    # Payload includes composite score, breakdown, and detected anomalies.
    # TTL: 1 hour — fidelity ranker should consume quickly.
    """
    try:
        score_key = f"{UEBA_SCORES_PREFIX}:{alert_id}"
        score_payload = json.dumps({
            "alertId": alert_id,
            "source": "ueba",
            "score": round(score, 4),
            "subScores": {k: round(v, 4) for k, v in sub_scores.items()},
            "detections": detections,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "context": {
                "sourceIP": event.get("sourceIP", ""),
                "path": event.get("path", ""),
                "method": event.get("method", ""),
            },
        })

        # [ARIA] LPUSH — matches the integration pattern in copilot-instructions.md
        redis_client.lpush(score_key, score_payload)
        # [ARIA] Set TTL to prevent orphaned scores from filling Redis
        redis_client.expire(score_key, SCORE_TTL_SECONDS)

    except redis.RedisError as exc:
        logger.error("Failed to publish UEBA score for alert %s: %s", alert_id, exc)


# ---------------------------------------------------------------------------
# Main Worker Loop
# ---------------------------------------------------------------------------
def run_worker() -> None:
    """
    # [ARIA] Main event loop for the UEBA worker.
    # Connects to Redis, creates baseline manager and scorer, and continuously
    # consumes events via BRPOP from 'aria:events:raw'.
    #
    # NOTE: Both anomaly_detector.py and ueba_engine.py consume from the same
    # 'aria:events:raw' queue. Since BRPOP pops items, only ONE worker gets each
    # event. To run both in parallel, the gateway should push to BOTH queues,
    # or use a fan-out pattern (pub/sub or separate queues per consumer).
    # For the hackathon, we recommend using separate queues:
    #   - aria:events:anomaly (for anomaly detector)
    #   - aria:events:ueba (for UEBA engine)
    # OR use Redis pub/sub for fan-out. The current implementation uses
    # 'aria:events:raw' as specified in the integration docs.
    """
    logger.info("=" * 60)
    logger.info("ARIA UEBA Engine starting…")
    logger.info("  Redis:     %s", REDIS_URL)
    logger.info("  Queue:     %s", EVENTS_QUEUE)
    logger.info("  Baseline TTL: %d days", BASELINE_TTL_SECONDS // 86400)
    logger.info("  Min baseline requests: %d", MIN_BASELINE_REQUESTS)
    logger.info("  Timezone:  IST (Asia/Kolkata)")
    logger.info("=" * 60)

    # [ARIA] Connect to Redis with retry logic
    redis_client: Optional[redis.Redis] = None
    retry_delay = 5
    while not _shutdown_event.is_set():
        try:
            redis_client = create_redis_client(REDIS_URL)
            break
        except redis.ConnectionError:
            logger.warning("Redis not available, retrying in %ds…", retry_delay)
            _shutdown_event.wait(retry_delay)
            retry_delay = min(retry_delay * 2, 60)

    if redis_client is None or _shutdown_event.is_set():
        logger.info("Shutdown before Redis connection — exiting.")
        return

    # [ARIA] Initialize baseline manager and UEBA scorer
    baseline_manager = BaselineManager(redis_client)
    scorer = UEBAScorer()

    # [ARIA] Stats tracking
    events_processed = 0
    last_stats_time = time.time()
    STATS_LOG_INTERVAL = 60

    logger.info("Listening for events on '%s'…", EVENTS_QUEUE)

    try:
        while not _shutdown_event.is_set():
            try:
                # [ARIA] BRPOP — blocking pop from the right end of the list
                result = redis_client.brpop(EVENTS_QUEUE, timeout=BRPOP_TIMEOUT)

                if result is None:
                    continue

                _queue_name, event_data = result
                process_event(event_data, baseline_manager, scorer, redis_client)
                events_processed += 1

                # [ARIA] Periodic stats logging
                now = time.time()
                if now - last_stats_time >= STATS_LOG_INTERVAL:
                    logger.info(
                        "STATS: total_processed=%d events_last_%ds=%d",
                        events_processed,
                        STATS_LOG_INTERVAL,
                        events_processed,
                    )
                    last_stats_time = now

            except redis.ConnectionError as exc:
                logger.error("Redis connection lost: %s — reconnecting in 5s…", exc)
                _shutdown_event.wait(5)
                if _shutdown_event.is_set():
                    break
                try:
                    redis_client = create_redis_client(REDIS_URL)
                    baseline_manager = BaselineManager(redis_client)
                    logger.info("Redis reconnected.")
                except redis.ConnectionError:
                    logger.error("Reconnection failed — will retry.")

            except Exception as exc:
                # [ARIA] Catch-all: log and continue — never crash the worker
                logger.error("Unexpected error in main loop: %s", exc, exc_info=True)
                _shutdown_event.wait(1)

    finally:
        # [ARIA] Graceful shutdown
        logger.info("Shutting down…")
        logger.info("Final stats: total_processed=%d", events_processed)
        if redis_client is not None:
            try:
                redis_client.close()
                logger.info("Redis connection closed.")
            except Exception:
                pass
        logger.info("ARIA UEBA Engine stopped.")


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    run_worker()
