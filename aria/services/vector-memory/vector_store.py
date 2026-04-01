"""
============================================================================
ARIA — Vector Memory Service (Feature 15)

A vector database service using ChromaDB that stores embeddings of past
incidents, enabling similarity search ("what incidents looked like this
before?"). This is ARIA's long-term memory.

Provides:
  - POST /search  — find top-5 similar past incidents
  - POST /index   — index a new incident
  - GET  /health  — health check

Background:
  - On startup, indexes all existing incidents from MongoDB
  - Polls MongoDB every 5 minutes for new incidents
  - Uses TF-IDF based embedding (lightweight, no GPU required)

Usage: python vector_store.py
============================================================================
"""

import os
import sys
import json
import signal
import hashlib
import logging
import threading
import time
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone

import numpy as np
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import chromadb
from chromadb.config import Settings
from flask import Flask, request, jsonify

# ── Logging Setup ────────────────────────────────────────────────────────────

# [ARIA] Configure structured logging for the vector memory service
logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("aria-vector-memory")

# [ARIA] Suppress noisy Flask/werkzeug request logs in production
logging.getLogger("werkzeug").setLevel(logging.WARNING)

# ── Configuration ────────────────────────────────────────────────────────────

# [ARIA] All config via env vars for Docker Compose overrides
MONGO_URI: str = os.environ.get("MONGO_URI", "mongodb://localhost:27017/aria_db")
CHROMA_HOST: str = os.environ.get("CHROMA_HOST", "localhost")
CHROMA_PORT: int = int(os.environ.get("CHROMA_PORT", "8000"))
API_PORT: int = int(os.environ.get("API_PORT", "8001"))
COLLECTION_NAME: str = os.environ.get("COLLECTION_NAME", "aria_incidents")
POLL_INTERVAL_S: int = int(os.environ.get("POLL_INTERVAL_S", "300"))  # 5 minutes
MAX_SEARCH_RESULTS: int = int(os.environ.get("MAX_SEARCH_RESULTS", "5"))
MAX_RETRIES: int = int(os.environ.get("MAX_RETRIES", "3"))
RETRY_DELAY_S: int = int(os.environ.get("RETRY_DELAY_S", "5"))

# ── Global State ─────────────────────────────────────────────────────────────

mongo_client: Optional[MongoClient] = None
chroma_client: Optional[chromadb.HttpClient] = None
collection: Optional[Any] = None
is_shutting_down: bool = False
indexed_ids: set = set()  # Track which incident IDs are already indexed
poll_thread: Optional[threading.Thread] = None


# ── TF-IDF Embedding Engine ─────────────────────────────────────────────────

class SimpleEmbedder:
    """
    [ARIA] Lightweight TF-IDF-based text embedding.

    Avoids heavy sentence-transformers dependencies. Builds a vocabulary
    from indexed documents and produces fixed-size embeddings using term
    frequency and inverse document frequency weighting.

    For production, replace with sentence-transformers or Ollama embeddings.
    """

    def __init__(self, vocab_size: int = 512):
        """Initialize the embedder with a fixed vocabulary size."""
        self.vocab_size = vocab_size
        self.vocab: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.doc_count: int = 0

    def _tokenize(self, text: str) -> List[str]:
        """[ARIA] Simple whitespace + punctuation tokenizer."""
        import re
        text = text.lower().strip()
        # Split on non-alphanumeric characters, keep meaningful tokens
        tokens = re.findall(r"[a-z0-9_]+", text)
        # Filter very short tokens
        return [t for t in tokens if len(t) > 1]

    def _hash_token(self, token: str) -> int:
        """[ARIA] Hash a token to a fixed vocab index (hashing trick)."""
        return int(hashlib.md5(token.encode()).hexdigest(), 16) % self.vocab_size

    def embed(self, text: str) -> List[float]:
        """
        [ARIA] Generate a fixed-size embedding vector for text.

        Uses the hashing trick to map tokens to a fixed-size vector space,
        then applies L2 normalization. This produces consistent-dimension
        embeddings regardless of vocabulary size.

        Args:
            text: Input text to embed

        Returns:
            List of floats (length = vocab_size)
        """
        tokens = self._tokenize(text)
        if not tokens:
            return [0.0] * self.vocab_size

        # Build term frequency vector using hashing trick
        vector = np.zeros(self.vocab_size, dtype=np.float64)
        for token in tokens:
            idx = self._hash_token(token)
            vector[idx] += 1.0

        # Apply log-normalization (smoothed TF)
        vector = np.log1p(vector)

        # L2 normalize to unit vector for cosine similarity
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm

        return vector.tolist()


# [ARIA] Global embedder instance
embedder = SimpleEmbedder(vocab_size=512)


# ── Helper Functions ─────────────────────────────────────────────────────────

def with_retry(fn, label: str, retries: int = MAX_RETRIES):
    """[ARIA] Retry wrapper for network operations with exponential backoff."""
    for attempt in range(1, retries + 1):
        try:
            return fn()
        except Exception as e:
            logger.warning(f"[ARIA] {label} failed (attempt {attempt}/{retries}): {e}")
            if attempt == retries:
                raise
            time.sleep(RETRY_DELAY_S * attempt)


def build_incident_text(incident: Dict) -> str:
    """
    [ARIA] Convert an incident/alert document into searchable text.

    Combines all relevant fields into a single text string for embedding.
    Handles both Incident and Alert document shapes.
    """
    parts = []

    # Title / description
    if incident.get("title"):
        parts.append(str(incident["title"]))
    if incident.get("description"):
        parts.append(str(incident["description"]))

    # Category and severity
    if incident.get("category"):
        parts.append(f"category:{incident['category']}")
    if incident.get("severity"):
        parts.append(f"severity:{incident['severity']}")

    # Attack details
    if incident.get("attackType"):
        parts.append(f"attack:{incident['attackType']}")
    if incident.get("method"):
        parts.append(f"method:{incident['method']}")
    if incident.get("path"):
        parts.append(f"path:{incident['path']}")
    if incident.get("sourceIP"):
        parts.append(f"source:{incident['sourceIP']}")

    # AI analysis
    if incident.get("aiReasoning"):
        parts.append(str(incident["aiReasoning"]))
    if incident.get("aiAnalysis"):
        parts.append(str(incident["aiAnalysis"]))

    # Detection sources
    if incident.get("detectionSources"):
        sources = incident["detectionSources"]
        if isinstance(sources, list):
            parts.append(f"detection:{','.join(sources)}")

    # Regex matches
    if incident.get("regexMatches"):
        matches = incident["regexMatches"]
        if isinstance(matches, list):
            parts.append(f"patterns:{','.join(matches)}")

    # Body (truncated)
    if incident.get("body"):
        parts.append(str(incident["body"])[:200])

    # User agent
    if incident.get("userAgent"):
        parts.append(f"ua:{incident['userAgent']}")

    return " ".join(parts) if parts else "unknown incident"


def build_metadata(incident: Dict) -> Dict[str, Any]:
    """
    [ARIA] Extract metadata fields from an incident for ChromaDB storage.

    ChromaDB metadata values must be str, int, float, or bool.
    """
    metadata: Dict[str, Any] = {}

    # String fields
    for field in ["category", "severity", "method", "path", "sourceIP",
                  "aiDecision", "triageStatus", "serviceName", "title"]:
        val = incident.get(field)
        if val is not None:
            metadata[field] = str(val)

    # Numeric fields
    for field in ["fidelityScore", "responseStatus"]:
        val = incident.get(field)
        if val is not None:
            try:
                metadata[field] = float(val)
            except (ValueError, TypeError):
                pass

    # Timestamp
    ts = incident.get("timestamp") or incident.get("createdAt")
    if ts is not None:
        if hasattr(ts, "isoformat"):
            metadata["timestamp"] = ts.isoformat()
        else:
            metadata["timestamp"] = str(ts)

    return metadata


# ── ChromaDB Operations ──────────────────────────────────────────────────────

def index_incident(incident: Dict) -> bool:
    """
    [ARIA] Index a single incident into ChromaDB.

    Args:
        incident: MongoDB document dict

    Returns:
        True if indexed successfully, False otherwise
    """
    doc_id = str(incident.get("_id", incident.get("id", "")))
    if not doc_id:
        logger.warning("[ARIA] Incident missing _id/id, skipping")
        return False

    if doc_id in indexed_ids:
        return False  # Already indexed

    try:
        text = build_incident_text(incident)
        embedding = embedder.embed(text)
        metadata = build_metadata(incident)

        collection.add(
            ids=[doc_id],
            embeddings=[embedding],
            documents=[text],
            metadatas=[metadata],
        )
        indexed_ids.add(doc_id)
        return True

    except Exception as e:
        logger.error(f"[ARIA] Failed to index incident {doc_id}: {e}")
        return False


def search_similar(query_text: str, n_results: int = MAX_SEARCH_RESULTS,
                   filters: Optional[Dict] = None) -> List[Dict]:
    """
    [ARIA] Search for similar incidents in ChromaDB.

    Args:
        query_text: Natural language query or incident description
        n_results: Number of results to return
        filters: Optional ChromaDB where-clause filters

    Returns:
        List of result dicts with 'id', 'score', 'text', 'metadata'
    """
    try:
        query_embedding = embedder.embed(query_text)

        query_params = {
            "query_embeddings": [query_embedding],
            "n_results": min(n_results, MAX_SEARCH_RESULTS),
            "include": ["documents", "metadatas", "distances"],
        }
        if filters:
            query_params["where"] = filters

        results = collection.query(**query_params)

        # Format results
        formatted = []
        ids = results.get("ids", [[]])[0]
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        for i in range(len(ids)):
            # ChromaDB returns L2 distances; convert to similarity score (0-1)
            distance = distances[i] if i < len(distances) else 1.0
            similarity = max(0.0, 1.0 - (distance / 2.0))

            formatted.append({
                "id": ids[i],
                "score": round(similarity, 4),
                "text": documents[i] if i < len(documents) else "",
                "metadata": metadatas[i] if i < len(metadatas) else {},
            })

        return formatted

    except Exception as e:
        logger.error(f"[ARIA] Search error: {e}")
        return []


# ── Initial Indexing & Polling ───────────────────────────────────────────────

def index_all_existing(db) -> int:
    """
    [ARIA] Index all existing incidents/alerts from MongoDB into ChromaDB.
    Called once on startup.

    Returns:
        Number of documents indexed
    """
    logger.info("[ARIA] Indexing all existing incidents from MongoDB...")
    count = 0

    # Index from alerts collection (main data source)
    try:
        alerts = db["alerts"].find(
            {"category": {"$exists": True, "$ne": None}},
            batch_size=100,
        )

        for alert in alerts:
            if index_incident(alert):
                count += 1
                if count % 100 == 0:
                    logger.info(f"[ARIA] Indexed {count} documents so far...")

    except Exception as e:
        logger.error(f"[ARIA] Error indexing alerts: {e}")

    # Index from incidents collection (if it exists)
    try:
        if "incidents" in db.list_collection_names():
            incidents = db["incidents"].find({}, batch_size=100)
            for incident in incidents:
                if index_incident(incident):
                    count += 1

    except Exception as e:
        logger.error(f"[ARIA] Error indexing incidents: {e}")

    logger.info(f"[ARIA] Initial indexing complete: {count} documents indexed")
    return count


def poll_new_incidents(db) -> None:
    """
    [ARIA] Background thread that polls MongoDB for new incidents every
    POLL_INTERVAL_S seconds and indexes them into ChromaDB.
    """
    global is_shutting_down

    logger.info(f"[ARIA] Starting background poller (every {POLL_INTERVAL_S}s)")

    while not is_shutting_down:
        try:
            time.sleep(POLL_INTERVAL_S)

            if is_shutting_down:
                break

            # Query alerts not yet indexed
            new_count = 0
            try:
                # Get all alert IDs and diff against indexed set
                alerts = db["alerts"].find(
                    {"category": {"$exists": True, "$ne": None}},
                    batch_size=50,
                )

                for alert in alerts:
                    doc_id = str(alert.get("_id", alert.get("id", "")))
                    if doc_id and doc_id not in indexed_ids:
                        if index_incident(alert):
                            new_count += 1

            except Exception as e:
                logger.error(f"[ARIA] Error polling new alerts: {e}")

            if new_count > 0:
                logger.info(f"[ARIA] Indexed {new_count} new incidents (total: {len(indexed_ids)})")
            else:
                logger.debug("[ARIA] No new incidents to index")

        except Exception as e:
            logger.error(f"[ARIA] Poller error: {e}", exc_info=True)
            time.sleep(RETRY_DELAY_S)

    logger.info("[ARIA] Background poller stopped")


# ── Flask API ────────────────────────────────────────────────────────────────

# [ARIA] Create Flask app for the HTTP API
app = Flask(__name__)


@app.route("/health", methods=["GET"])
def health_check():
    """[ARIA] Health check endpoint — verifies all connections are alive."""
    status = {"status": "ok", "service": "aria-vector-memory"}

    # Check ChromaDB
    try:
        heartbeat = chroma_client.heartbeat() if chroma_client else None
        status["chromadb"] = "connected" if heartbeat else "disconnected"
    except Exception:
        status["chromadb"] = "error"
        status["status"] = "degraded"

    # Check MongoDB
    try:
        if mongo_client:
            mongo_client.admin.command("ping")
            status["mongodb"] = "connected"
        else:
            status["mongodb"] = "disconnected"
            status["status"] = "degraded"
    except Exception:
        status["mongodb"] = "error"
        status["status"] = "degraded"

    # Collection stats
    try:
        if collection:
            status["indexed_count"] = collection.count()
        else:
            status["indexed_count"] = 0
    except Exception:
        status["indexed_count"] = len(indexed_ids)

    http_status = 200 if status["status"] == "ok" else 503
    return jsonify(status), http_status


@app.route("/search", methods=["POST"])
def search_endpoint():
    """
    [ARIA] Search for similar past incidents.

    Request body:
        {
            "query": "SQL injection in login endpoint",
            "n_results": 5,          (optional, default 5)
            "filters": {}            (optional, ChromaDB where clause)
        }

    Response:
        {
            "results": [...],
            "query": "...",
            "count": 5
        }
    """
    try:
        body = request.get_json(silent=True)
        if not body or "query" not in body:
            return jsonify({"error": "Missing 'query' field in request body"}), 400

        query_text = str(body["query"]).strip()
        if not query_text:
            return jsonify({"error": "'query' cannot be empty"}), 400

        n_results = int(body.get("n_results", MAX_SEARCH_RESULTS))
        filters = body.get("filters")

        # Validate filters if provided
        if filters is not None and not isinstance(filters, dict):
            return jsonify({"error": "'filters' must be a JSON object"}), 400

        results = search_similar(query_text, n_results=n_results, filters=filters)

        return jsonify({
            "results": results,
            "query": query_text,
            "count": len(results),
        })

    except Exception as e:
        logger.error(f"[ARIA] Search endpoint error: {e}", exc_info=True)
        return jsonify({"error": f"Internal error: {str(e)}"}), 500


@app.route("/index", methods=["POST"])
def index_endpoint():
    """
    [ARIA] Index a new incident into ChromaDB.

    Request body: incident/alert JSON document
        {
            "_id": "...",            (or "id")
            "category": "sqli",
            "severity": "high",
            "method": "POST",
            "path": "/api/login",
            ...
        }

    Response:
        { "success": true, "id": "..." }
    """
    try:
        body = request.get_json(silent=True)
        if not body:
            return jsonify({"error": "Missing JSON body"}), 400

        doc_id = str(body.get("_id", body.get("id", "")))
        if not doc_id:
            return jsonify({"error": "Document must have '_id' or 'id' field"}), 400

        success = index_incident(body)

        if success:
            logger.info(f"[ARIA] Indexed incident {doc_id} via API")
            return jsonify({"success": True, "id": doc_id})
        else:
            # Already indexed or failed
            if doc_id in indexed_ids:
                return jsonify({"success": True, "id": doc_id, "note": "already indexed"})
            return jsonify({"error": "Failed to index document"}), 500

    except Exception as e:
        logger.error(f"[ARIA] Index endpoint error: {e}", exc_info=True)
        return jsonify({"error": f"Internal error: {str(e)}"}), 500


# ── Connection Helpers ───────────────────────────────────────────────────────

def connect_mongo() -> MongoClient:
    """[ARIA] Connect to MongoDB with retry logic."""
    def _connect():
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
        client.admin.command("ping")
        logger.info(f"[ARIA] Connected to MongoDB: {MONGO_URI}")
        return client

    return with_retry(_connect, "MongoDB connection")


def connect_chroma() -> chromadb.HttpClient:
    """[ARIA] Connect to ChromaDB with retry logic."""
    def _connect():
        client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
        client.heartbeat()
        logger.info(f"[ARIA] Connected to ChromaDB: {CHROMA_HOST}:{CHROMA_PORT}")
        return client

    return with_retry(_connect, "ChromaDB connection")


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
        if mongo_client:
            mongo_client.close()
            logger.info("[ARIA] MongoDB disconnected")
    except Exception as e:
        logger.warning(f"[ARIA] Error closing MongoDB: {e}")

    logger.info("[ARIA] Shutdown complete")
    # Let Flask handle its own shutdown via werkzeug


# ── Entry Point ──────────────────────────────────────────────────────────────

def main() -> None:
    """[ARIA] Main entry point for the vector memory service."""
    global mongo_client, chroma_client, collection, poll_thread

    logger.info("═══════════════════════════════════════════════════")
    logger.info("[ARIA] Vector Memory Service starting...")
    logger.info(f"[ARIA] Config: chroma={CHROMA_HOST}:{CHROMA_PORT}, "
                f"api_port={API_PORT}, "
                f"poll={POLL_INTERVAL_S}s, "
                f"collection={COLLECTION_NAME}")

    # Register signal handlers
    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    # Connect to services
    mongo_client = connect_mongo()
    chroma_client = connect_chroma()

    # Get or create the ChromaDB collection
    collection = chroma_client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )
    logger.info(f"[ARIA] ChromaDB collection '{COLLECTION_NAME}' ready "
                f"(existing docs: {collection.count()})")

    # Index all existing incidents from MongoDB
    db = mongo_client.get_database()
    indexed_count = index_all_existing(db)
    logger.info(f"[ARIA] Startup indexing complete: {indexed_count} total documents in vector store")

    # Start background poller thread
    poll_thread = threading.Thread(
        target=poll_new_incidents,
        args=(db,),
        daemon=True,
        name="incident-poller",
    )
    poll_thread.start()

    # Start Flask API server
    logger.info(f"[ARIA] Starting HTTP API on port {API_PORT}...")
    logger.info(f"[ARIA] Endpoints: POST /search, POST /index, GET /health")
    app.run(
        host="0.0.0.0",
        port=API_PORT,
        debug=False,
        use_reloader=False,
    )


if __name__ == "__main__":
    main()
