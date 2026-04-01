# 05 — Anomaly Detection

**Tier:** 1 (Core Requirements)  
**Status:** IMPLEMENTED  
**Priority:** 1.2, 1.3

## What This Does

The **statistical threat detection layer** — uses machine learning to find requests that are "weird" compared to normal traffic patterns, even if they don't match any known attack signature. This catches **zero-day attacks** that regex can't detect.

### Why It Matters for the Hackathon
The problem statement requires "Machine Learning for Threat Detection" and "Advanced Anomaly Detection." Pure regex misses novel attacks. ML-based anomaly detection catches unusual patterns like: a user suddenly making 100x more API calls, strange request timing, or unusual parameter combinations.

### What to Build

#### 1. Feature Extraction
Convert each normalized event into a numerical feature vector:
```python
features = {
    'request_length': len(body),
    'param_count': count(params),
    'special_char_ratio': special_chars / total_chars,
    'entropy': shannon_entropy(body),
    'hour_of_day': timestamp.hour,
    'requests_per_minute': rolling_count(source_ip, '1min'),
    'unique_endpoints_per_session': unique_count(session_id, 'endpoint'),
    'avg_time_between_requests': mean_diff(timestamps),
    # ... banking-specific features
    'transaction_amount_zscore': zscore(amount),
    'geo_distance_from_usual': haversine(current_loc, usual_loc),
}
```

#### 2. Anomaly Detection Models (PyOD)
Use PyOD (Python Outlier Detection) library — provides 40+ anomaly detection algorithms with a unified API:
```python
from pyod.models.iforest import IForest
from pyod.models.lof import LOF
from pyod.models.ecod import ECOD

# Ensemble approach — combine multiple detectors
detectors = [
    IForest(contamination=0.05),   # Isolation Forest — good at high-dim data
    LOF(contamination=0.05),       # Local Outlier Factor — density-based
    ECOD(contamination=0.05),      # Empirical CDF — non-parametric
]

# Train on historical "normal" traffic
for det in detectors:
    det.fit(normal_traffic_features)

# Score new request (higher = more anomalous)
scores = [det.decision_function(new_request) for det in detectors]
anomaly_score = np.mean(scores)
```

#### 3. Time-Series Analysis (tsfresh)
Extract time-series features from traffic patterns:
```python
from tsfresh import extract_features

# Extract statistical features from sliding windows of traffic
ts_features = extract_features(
    traffic_timeseries, 
    column_id='source_ip',
    column_sort='timestamp'
)
# Features include: mean, variance, trend, periodicity, spikes, etc.
```

### Architecture
```
Normalized Event → Feature Extraction → [PyOD Ensemble] → Anomaly Score (0-1)
                                      → [tsfresh]       → Time-Series Score
                                      → Combined score sent to Feature 07 (Fidelity Ranking)
```

### Tech Stack
- **Python 3.11** — ML ecosystem
- **PyOD** — anomaly detection ensemble
- **tsfresh** — time-series feature extraction
- **scikit-learn** — preprocessing, scaling, utilities
- **NumPy / Pandas** — data manipulation

### Integration Points
- **Receives from:** Feature 04 (Log Ingestion) — normalized events
- **Sends to:** Feature 07 (Fidelity Ranking) — anomaly scores
- **Feedback from:** Feature 17 (Human Triage) — analyst corrections improve the model

### How to Run It
This will be a **separate Python microservice** that:
1. Subscribes to Redis for new normalized events
2. Runs anomaly detection
3. Publishes anomaly scores back to Redis
4. The Node.js gateway/dashboard reads these scores

### Existing Code to Reference
- `01-reverse-proxy-gateway/index.js` — `analyzeRequest()` function shows the current (basic) threat analysis flow
- `03-middleware-sdk-reference/core/index.ts` — `scanLocally()` method shows feature extraction from requests
