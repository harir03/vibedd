"""
============================================================================
ARIA — Predictive Analysis Service (Feature 13)

Builds Markov chain transition matrices from historical incident data to
predict the next attack stage for a given source IP. This powers proactive
defense: if ARIA sees 'reconnaissance' activity, it can preemptively
prepare for 'exploitation' with 73% confidence.

Kill Chain Stages (Lockheed Martin Cyber Kill Chain adapted):
  reconnaissance → weaponization → delivery → exploitation →
  installation → command_control → exfiltration → impact

Flow:
  1. Connect to MongoDB (aria_db) and Redis
  2. Build Markov transition matrix from historical Incident data
  3. Every 2 minutes, check active source IPs with recent alerts
  4. For each IP, predict next probable attack stage
  5. Store predictions in Redis hash with 1-hour TTL
  6. Publish high-confidence predictions (>60%) to Redis channel

Usage: python predictor.py
============================================================================
"""

import os
import sys
import time
import json
import signal
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta, timezone

import numpy as np
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import redis

# ── Logging Setup ────────────────────────────────────────────────────────────

# [ARIA] Configure structured logging for the predictive analysis service
logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("aria-predictive-analysis")

# ── Configuration ────────────────────────────────────────────────────────────

# [ARIA] All config via env vars for Docker Compose overrides
MONGO_URI: str = os.environ.get("MONGO_URI", "mongodb://localhost:27017/aria_db")
REDIS_URI: str = os.environ.get("REDIS_URI", "redis://localhost:6379")
PREDICTION_INTERVAL_S: int = int(os.environ.get("PREDICTION_INTERVAL_S", "120"))  # 2 minutes
PREDICTION_TTL_S: int = int(os.environ.get("PREDICTION_TTL_S", "3600"))  # 1 hour
HIGH_CONFIDENCE_THRESHOLD: float = float(os.environ.get("HIGH_CONFIDENCE_THRESHOLD", "0.60"))
LOOKBACK_HOURS: int = int(os.environ.get("LOOKBACK_HOURS", "24"))
MAX_RETRIES: int = int(os.environ.get("MAX_RETRIES", "3"))
RETRY_DELAY_S: int = int(os.environ.get("RETRY_DELAY_S", "5"))

# ── Kill Chain Stage Definitions ─────────────────────────────────────────────

# [ARIA] Ordered kill chain stages (Lockheed Martin + banking extensions)
KILL_CHAIN_STAGES: List[str] = [
    "reconnaissance",
    "weaponization",
    "delivery",
    "exploitation",
    "installation",
    "command_control",
    "exfiltration",
    "impact",
]

# [ARIA] Stage index lookup for matrix operations
STAGE_INDEX: Dict[str, int] = {stage: i for i, stage in enumerate(KILL_CHAIN_STAGES)}

# [ARIA] Default transition probabilities (domain-expert priors, used when
# historical data is sparse). These represent typical APT progression patterns
# observed in banking environments.
DEFAULT_TRANSITIONS: Dict[str, Dict[str, float]] = {
    "reconnaissance":  {"weaponization": 0.30, "delivery": 0.15, "exploitation": 0.73},
    "weaponization":   {"delivery": 0.65, "exploitation": 0.25},
    "delivery":        {"exploitation": 0.80, "installation": 0.10},
    "exploitation":    {"installation": 0.45, "command_control": 0.20, "exfiltration": 0.10},
    "installation":    {"command_control": 0.60, "exfiltration": 0.15},
    "command_control":  {"exfiltration": 0.80, "impact": 0.15},
    "exfiltration":    {"impact": 0.50},
    "impact":          {},  # terminal stage
}

# ── Global State ─────────────────────────────────────────────────────────────

is_shutting_down: bool = False
mongo_client: Optional[MongoClient] = None
redis_client: Optional[redis.Redis] = None
transition_matrix: Optional[np.ndarray] = None


# ── Utility Functions ────────────────────────────────────────────────────────

def with_retry(fn, label: str, retries: int = MAX_RETRIES):
    """
    [ARIA] Retry wrapper for network operations.
    Exponential backoff with configurable retries.
    """
    for attempt in range(1, retries + 1):
        try:
            return fn()
        except Exception as e:
            logger.warning(
                f"[ARIA] {label} failed (attempt {attempt}/{retries}): {e}"
            )
            if attempt == retries:
                raise
            time.sleep(RETRY_DELAY_S * attempt)


def normalize_category_to_stage(category: str) -> Optional[str]:
    """
    [ARIA] Map alert/incident category strings to kill chain stages.
    Categories from the gateway (sqli, xss, traversal, etc.) need to be
    mapped to kill chain stages for Markov chain analysis.
    """
    category_lower = (category or "").lower().strip()

    # Direct match
    if category_lower in STAGE_INDEX:
        return category_lower

    # Category → stage mapping for common ARIA alert categories
    mapping: Dict[str, str] = {
        # Reconnaissance patterns
        "port_scan": "reconnaissance",
        "directory_enumeration": "reconnaissance",
        "account_enumeration": "reconnaissance",
        "fingerprinting": "reconnaissance",
        "info_disclosure": "reconnaissance",
        # Delivery / weaponization
        "phishing": "delivery",
        "spear_phishing": "delivery",
        "malicious_attachment": "delivery",
        # Exploitation patterns
        "sqli": "exploitation",
        "xss": "exploitation",
        "traversal": "exploitation",
        "rce": "exploitation",
        "injection": "exploitation",
        "credential_stuffing": "exploitation",
        "brute_force": "exploitation",
        "buffer_overflow": "exploitation",
        "deserialization": "exploitation",
        # Installation
        "webshell": "installation",
        "backdoor": "installation",
        "dropper": "installation",
        "persistence": "installation",
        # Command & Control
        "c2_beacon": "command_control",
        "dns_tunneling": "command_control",
        "reverse_shell": "command_control",
        "command_control": "command_control",
        # Exfiltration
        "data_exfiltration": "exfiltration",
        "data_theft": "exfiltration",
        "exfiltration": "exfiltration",
        # Impact
        "ransomware": "impact",
        "defacement": "impact",
        "dos": "impact",
        "ddos": "impact",
        "fraud": "impact",
        "fraudulent_transfer": "impact",
    }

    return mapping.get(category_lower)


# ── Markov Chain Builder ─────────────────────────────────────────────────────

def build_transition_matrix(db) -> np.ndarray:
    """
    [ARIA] Build a Markov chain transition matrix from historical alert data.

    Scans alerts grouped by source IP and sorted by timestamp. For each IP,
    extracts the sequence of attack stages and counts transitions between
    consecutive stages. Normalizes rows to get transition probabilities.

    Falls back to DEFAULT_TRANSITIONS for stages with no observed transitions.

    Returns:
        np.ndarray: N×N matrix where entry [i][j] = P(stage_j | stage_i)
    """
    n = len(KILL_CHAIN_STAGES)
    counts = np.zeros((n, n), dtype=np.float64)

    logger.info("[ARIA] Building Markov transition matrix from historical data...")

    # [ARIA] Query alerts from the last LOOKBACK_HOURS, grouped by IP
    cutoff = datetime.now(timezone.utc) - timedelta(hours=LOOKBACK_HOURS * 30)  # 30x lookback for matrix building
    alerts_collection = db["alerts"]

    try:
        # Aggregate alerts by sourceIP, sort by timestamp
        pipeline = [
            {"$match": {"timestamp": {"$gte": cutoff}, "category": {"$exists": True, "$ne": None}}},
            {"$sort": {"sourceIP": 1, "timestamp": 1}},
            {"$group": {
                "_id": "$sourceIP",
                "stages": {"$push": "$category"},
                "timestamps": {"$push": "$timestamp"},
            }},
        ]

        results = list(alerts_collection.aggregate(pipeline))
        logger.info(f"[ARIA] Found attack sequences for {len(results)} source IPs")

        total_transitions = 0
        for doc in results:
            # Convert categories to kill chain stages
            stages = []
            for cat in doc.get("stages", []):
                stage = normalize_category_to_stage(cat)
                if stage is not None:
                    stages.append(stage)

            # Count transitions between consecutive stages
            for i in range(len(stages) - 1):
                from_stage = stages[i]
                to_stage = stages[i + 1]
                if from_stage != to_stage:  # Skip self-transitions
                    from_idx = STAGE_INDEX[from_stage]
                    to_idx = STAGE_INDEX[to_stage]
                    counts[from_idx][to_idx] += 1.0
                    total_transitions += 1

        logger.info(f"[ARIA] Counted {total_transitions} stage transitions from historical data")

    except Exception as e:
        logger.error(f"[ARIA] Error querying historical data: {e}")

    # [ARIA] Blend with default priors (Bayesian smoothing)
    # This ensures we have reasonable predictions even with sparse data
    prior_weight = 5.0  # Equivalent to 5 pseudo-observations per default transition
    for from_stage, transitions in DEFAULT_TRANSITIONS.items():
        from_idx = STAGE_INDEX[from_stage]
        for to_stage, prob in transitions.items():
            if to_stage in STAGE_INDEX:
                to_idx = STAGE_INDEX[to_stage]
                counts[from_idx][to_idx] += prior_weight * prob

    # [ARIA] Normalize rows to get probabilities
    matrix = np.zeros((n, n), dtype=np.float64)
    for i in range(n):
        row_sum = counts[i].sum()
        if row_sum > 0:
            matrix[i] = counts[i] / row_sum

    # Log the matrix for debugging
    for i, stage in enumerate(KILL_CHAIN_STAGES):
        nonzero = [(KILL_CHAIN_STAGES[j], f"{matrix[i][j]:.2f}") for j in range(n) if matrix[i][j] > 0.01]
        if nonzero:
            logger.debug(f"[ARIA] {stage} → {nonzero}")

    logger.info("[ARIA] Transition matrix built successfully")
    return matrix


def predict_next_stages(
    current_stage: str,
    matrix: np.ndarray,
    top_k: int = 3,
) -> List[Dict]:
    """
    [ARIA] Given the current attack stage, predict the most probable next stages
    using the Markov transition matrix.

    Args:
        current_stage: The current observed kill chain stage
        matrix: The N×N transition probability matrix
        top_k: Number of top predictions to return

    Returns:
        List of dicts with 'stage', 'probability', and 'description' keys
    """
    if current_stage not in STAGE_INDEX:
        logger.warning(f"[ARIA] Unknown stage '{current_stage}', cannot predict")
        return []

    idx = STAGE_INDEX[current_stage]
    probs = matrix[idx]

    # Get top-k transitions sorted by probability
    top_indices = np.argsort(probs)[::-1][:top_k]

    predictions = []
    for j in top_indices:
        prob = float(probs[j])
        if prob < 0.01:  # Skip negligible probabilities
            continue
        predictions.append({
            "stage": KILL_CHAIN_STAGES[j],
            "probability": round(prob, 4),
            "description": _stage_description(KILL_CHAIN_STAGES[j]),
        })

    return predictions


def _stage_description(stage: str) -> str:
    """[ARIA] Human-readable descriptions for kill chain stages."""
    descriptions: Dict[str, str] = {
        "reconnaissance": "Scanning and information gathering about the target",
        "weaponization": "Creating exploit payloads tailored to discovered vulnerabilities",
        "delivery": "Transmitting the weaponized payload to the target",
        "exploitation": "Executing the exploit against a vulnerability",
        "installation": "Installing persistent backdoor or malware",
        "command_control": "Establishing command and control channel",
        "exfiltration": "Extracting sensitive data from the target",
        "impact": "Causing damage, disruption, or financial loss",
    }
    return descriptions.get(stage, "Unknown stage")


# ── Prediction Cycle ─────────────────────────────────────────────────────────

def run_prediction_cycle(db, redis_conn: redis.Redis, matrix: np.ndarray) -> None:
    """
    [ARIA] Main prediction cycle. Finds active source IPs with recent alerts,
    determines their current attack stage, predicts next stages, and stores
    predictions in Redis.
    """
    logger.info("[ARIA] ═══════════════════════════════════════")
    logger.info("[ARIA] Running prediction cycle...")

    alerts_collection = db["alerts"]
    cutoff = datetime.now(timezone.utc) - timedelta(hours=LOOKBACK_HOURS)

    try:
        # [ARIA] Find active IPs with recent malicious alerts
        pipeline = [
            {"$match": {
                "timestamp": {"$gte": cutoff},
                "aiDecision": "block",
                "category": {"$exists": True, "$ne": None},
            }},
            {"$sort": {"timestamp": -1}},
            {"$group": {
                "_id": "$sourceIP",
                "latestCategory": {"$first": "$category"},
                "latestTimestamp": {"$first": "$timestamp"},
                "alertCount": {"$sum": 1},
                "categories": {"$push": "$category"},
            }},
            {"$match": {"alertCount": {"$gte": 1}}},
        ]

        active_ips = list(alerts_collection.aggregate(pipeline))
        logger.info(f"[ARIA] Found {len(active_ips)} active threat source IPs")

        predictions_published = 0

        for ip_doc in active_ips:
            source_ip = ip_doc["_id"]
            if not source_ip:
                continue

            latest_category = ip_doc.get("latestCategory", "")
            current_stage = normalize_category_to_stage(latest_category)

            if current_stage is None:
                logger.debug(f"[ARIA] Could not map category '{latest_category}' for IP {source_ip}")
                continue

            # [ARIA] Predict next stages using the Markov chain
            predictions = predict_next_stages(current_stage, matrix)

            if not predictions:
                continue

            # [ARIA] Build prediction data for Redis storage
            prediction_data = {
                "sourceIP": source_ip,
                "currentStage": current_stage,
                "predictions": predictions,
                "alertCount": ip_doc.get("alertCount", 0),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "confidence": predictions[0]["probability"] if predictions else 0,
            }

            # [ARIA] Store in Redis hash with TTL
            redis_key = f"aria:predictions:{source_ip}"
            try:
                redis_conn.set(redis_key, json.dumps(prediction_data), ex=PREDICTION_TTL_S)
            except redis.RedisError as e:
                logger.error(f"[ARIA] Failed to store prediction for {source_ip}: {e}")
                continue

            # [ARIA] Publish high-confidence predictions to channel
            top_prediction = predictions[0]
            if top_prediction["probability"] >= HIGH_CONFIDENCE_THRESHOLD:
                publish_data = {
                    "type": "attack-prediction",
                    "sourceIP": source_ip,
                    "currentStage": current_stage,
                    "predictedStage": top_prediction["stage"],
                    "probability": top_prediction["probability"],
                    "description": top_prediction["description"],
                    "alertCount": ip_doc.get("alertCount", 0),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
                try:
                    redis_conn.publish("aria-predictions", json.dumps(publish_data))
                    predictions_published += 1
                except redis.RedisError as e:
                    logger.error(f"[ARIA] Failed to publish prediction: {e}")

                logger.info(
                    f"[ARIA] HIGH CONFIDENCE: {source_ip} | "
                    f"{current_stage} → {top_prediction['stage']} "
                    f"({top_prediction['probability']:.0%})"
                )

        logger.info(
            f"[ARIA] Prediction cycle complete: "
            f"{len(active_ips)} IPs analyzed, "
            f"{predictions_published} high-confidence predictions published"
        )

    except Exception as e:
        logger.error(f"[ARIA] Prediction cycle error: {e}", exc_info=True)


# ── Connection Helpers ───────────────────────────────────────────────────────

def connect_mongo() -> MongoClient:
    """[ARIA] Connect to MongoDB with retry logic."""
    def _connect():
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
        # Force a connection test
        client.admin.command("ping")
        logger.info(f"[ARIA] Connected to MongoDB: {MONGO_URI}")
        return client

    return with_retry(_connect, "MongoDB connection")


def connect_redis() -> redis.Redis:
    """[ARIA] Connect to Redis with retry logic."""
    def _connect():
        client = redis.from_url(REDIS_URI, decode_responses=True)
        client.ping()
        logger.info(f"[ARIA] Connected to Redis: {REDIS_URI}")
        return client

    return with_retry(_connect, "Redis connection")


# ── Graceful Shutdown ────────────────────────────────────────────────────────

def shutdown_handler(signum, frame):
    """[ARIA] Handle SIGINT/SIGTERM for graceful shutdown."""
    global is_shutting_down
    if is_shutting_down:
        return
    is_shutting_down = True

    sig_name = signal.Signals(signum).name if hasattr(signal, "Signals") else str(signum)
    logger.info(f"[ARIA] Received {sig_name}, shutting down gracefully...")

    # Close connections
    try:
        if redis_client:
            redis_client.close()
            logger.info("[ARIA] Redis disconnected")
    except Exception as e:
        logger.warning(f"[ARIA] Error closing Redis: {e}")

    try:
        if mongo_client:
            mongo_client.close()
            logger.info("[ARIA] MongoDB disconnected")
    except Exception as e:
        logger.warning(f"[ARIA] Error closing MongoDB: {e}")

    logger.info("[ARIA] Shutdown complete")
    sys.exit(0)


# ── Entry Point ──────────────────────────────────────────────────────────────

def main() -> None:
    """[ARIA] Main entry point for the predictive analysis service."""
    global mongo_client, redis_client, transition_matrix, is_shutting_down

    logger.info("═══════════════════════════════════════════════════")
    logger.info("[ARIA] Predictive Analysis Service starting...")
    logger.info(f"[ARIA] Config: interval={PREDICTION_INTERVAL_S}s, "
                f"lookback={LOOKBACK_HOURS}h, "
                f"threshold={HIGH_CONFIDENCE_THRESHOLD:.0%}, "
                f"ttl={PREDICTION_TTL_S}s")

    # Register signal handlers
    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    # Connect to services
    mongo_client = connect_mongo()
    redis_client = connect_redis()

    db = mongo_client.get_database()

    # Build initial transition matrix
    transition_matrix = build_transition_matrix(db)

    # Run first cycle immediately
    run_prediction_cycle(db, redis_client, transition_matrix)

    # Periodic loop
    matrix_rebuild_counter = 0
    MATRIX_REBUILD_INTERVAL = 30  # Rebuild matrix every 30 cycles (~1 hour at 2-min intervals)

    logger.info(f"[ARIA] Entering prediction loop (every {PREDICTION_INTERVAL_S}s)")

    while not is_shutting_down:
        try:
            time.sleep(PREDICTION_INTERVAL_S)

            if is_shutting_down:
                break

            # Periodically rebuild the transition matrix with fresh data
            matrix_rebuild_counter += 1
            if matrix_rebuild_counter >= MATRIX_REBUILD_INTERVAL:
                logger.info("[ARIA] Rebuilding transition matrix with fresh data...")
                transition_matrix = build_transition_matrix(db)
                matrix_rebuild_counter = 0

            run_prediction_cycle(db, redis_client, transition_matrix)

        except KeyboardInterrupt:
            break
        except Exception as e:
            logger.error(f"[ARIA] Error in prediction loop: {e}", exc_info=True)
            time.sleep(RETRY_DELAY_S)

    logger.info("[ARIA] Predictive Analysis Service stopped")


if __name__ == "__main__":
    main()
