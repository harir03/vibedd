# 06 — Behavioral Analytics (UEBA)

**Tier:** 1 (Core Requirements)  
**Status:** IMPLEMENTED  
**Priority:** 1.4

## What This Does

**User and Entity Behavior Analytics** — builds a "normal behavior profile" for each user/IP/session over time, then flags when behavior deviates from that baseline. Unlike anomaly detection (Feature 05) which looks at individual requests, UEBA looks at **patterns across multiple requests over time**.

### Why It Matters for the Hackathon
The problem statement emphasizes behavioral analysis for banking. UEBA catches things like:
- A user who normally logs in from Mumbai at 9am suddenly logs in from Nigeria at 3am
- An API key that usually makes 10 requests/hour suddenly makes 10,000
- A session that normally accesses account balances suddenly tries to initiate wire transfers
- Credential stuffing: many failed logins from different IPs targeting the same account

### What to Build

#### 1. Baseline Builder
Collects and aggregates behavior over time to build "normal" profiles:
```python
class UserBaseline:
    user_id: str
    typical_hours: List[int]           # [9, 10, 11, 14, 15, 16, 17]
    typical_geos: List[str]            # ['IN-MH', 'IN-KA']
    avg_requests_per_hour: float       # 12.5
    typical_endpoints: Set[str]        # {'/balance', '/history', '/profile'}
    typical_methods: Dict[str, float]  # {'GET': 0.8, 'POST': 0.2}
    avg_session_duration: float        # 1200 seconds
    typical_transaction_range: Tuple   # (100, 50000) INR
    
    def deviation_score(self, current_event) -> float:
        """Returns 0-1 score of how much this event deviates from baseline"""
        ...
```

#### 2. Session Tracker
Groups individual requests into sessions and tracks session-level patterns:
```python
class SessionAnalyzer:
    def analyze_session(self, session_events: List[Event]) -> SessionProfile:
        return SessionProfile(
            duration=...,
            request_count=...,
            unique_endpoints=...,
            methods_used=...,
            escalation_pattern=...,  # Did they go from read → write → admin?
            error_rate=...,          # High 4xx/5xx = probing
            data_volume=...,         # Unusual data exfiltration
        )
```

#### 3. Banking-Specific Behavior Rules
Hard-coded behavioral rules for banking scenarios:
- **Impossible travel:** Same user from two geographic locations too fast
- **Privilege escalation:** Read-only user attempting writes
- **Account enumeration:** Sequential account ID access
- **Credential stuffing:** Many failed logins, same account, different IPs
- **Transaction anomaly:** Amount or frequency outside normal range
- **After-hours activity:** Sensitive operations outside business hours

### Architecture
```
Normalized Event → Session Tracker → Baseline Comparison → Deviation Score (0-1)
                                   → Rule Engine          → Rule Violations
                                   → Combined output to Feature 07 (Fidelity Ranking)
```

### Tech Stack
- **Python 3.11** — analytics logic
- **scikit-learn** — clustering, statistical models for baselines
- **Pandas** — time-series aggregation and windowing
- **Redis** — session state storage (fast lookups)
- **MongoDB** — baseline persistence

### Integration Points
- **Receives from:** Feature 04 (Log Ingestion) — normalized events
- **Sends to:** Feature 07 (Fidelity Ranking) — deviation scores + rule violations
- **Updates from:** Feature 17 (Human Triage) — confirmed incidents refine baselines

### Baselines Bootstrap
For the hackathon demo, pre-seed baselines from synthetic "normal" banking traffic data. This gives the system something to compare against immediately.
