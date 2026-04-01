# ============================================================
# ARIA — Python Detection Service Dockerfile
# Unified service: Anomaly Detection (Feature 05),
# Behavioral Analytics/UEBA (Feature 06),
# Predictive Analysis (Feature 13)
#
# Exposes a FastAPI server on port 5000 with endpoints for
# each detection module. Gateway calls these via HTTP.
# ============================================================

FROM python:3.11-slim

WORKDIR /app

# Install system deps for scikit-learn, numpy, tsfresh
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements first for Docker layer caching
COPY detection/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the detection service code
COPY detection/main.py .

# Copy the individual service modules from their directories
COPY anomaly-detection/anomaly_detector.py ./modules/anomaly_detector.py
COPY behavioral-analytics/ueba_engine.py ./modules/ueba_engine.py
COPY predictive-analysis/predictor.py ./modules/predictor.py

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000", "--workers", "2"]
