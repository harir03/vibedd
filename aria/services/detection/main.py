import os
import asyncio
from fastapi import FastAPI, BackgroundTasks
from modules.anomaly_detector import AnomalyDetectorEngine, extract_features
import numpy as np
import logging

app = FastAPI(title="ARIA Python Detection Service")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aria.detection")

anomaly_engine = AnomalyDetectorEngine()

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up unified detection service...")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/analyze/anomaly")
async def analyze_anomaly(request: dict):
    features = extract_features(request)
    if features is None:
        return {"score": 0.0}
    score = anomaly_engine.add_and_score(features)
    return {"score": score}

@app.post("/analyze/ueba")
async def analyze_ueba(request: dict):
    from modules.ueba_engine import analyze_behavior
    return analyze_behavior(request)

@app.post("/analyze/predict")
async def predict_next(request: dict):
    from modules.ueba_engine import predict_next
    return predict_next(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
