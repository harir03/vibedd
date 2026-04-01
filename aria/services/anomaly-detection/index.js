// =============================================================================
// [ARIA] Feature 05 — Anomaly Detection Service
// =============================================================================
// Standalone Node.js worker that consumes raw events from Redis, runs statistical
// anomaly detection + a simplified Isolation Forest, and writes anomaly scores
// back to MongoDB (Alert.scores.anomaly) and Redis (aria:scores:{requestId}).
//
// Data flow:
//   Gateway → Redis LPUSH aria:events:raw → THIS SERVICE → MongoDB Alert update
//                                                        → Redis LPUSH aria:scores:{requestId}
// =============================================================================

'use strict';

const mongoose = require('mongoose');
const { createClient } = require('redis');
const pino = require('pino');
const crypto = require('crypto');

// =============================================================================
// [ARIA] Logger — pino with pretty printing in dev
// =============================================================================
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
    : undefined,
});

// =============================================================================
// [ARIA] Configuration constants for anomaly detection thresholds
// =============================================================================
const CONFIG = {
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/aria_db',

  // [ARIA] Sliding window for IP baselines (hours)
  BASELINE_WINDOW_HOURS: 24,

  // [ARIA] Standard-deviation multiplier for request-rate anomaly
  RATE_ANOMALY_THRESHOLD: 2,

  // [ARIA] Standard-deviation multiplier for payload-size anomaly
  SIZE_ANOMALY_THRESHOLD: 3,

  // [ARIA] Isolation Forest hyper-parameters
  ISOLATION_FOREST_TREES: 100,
  ISOLATION_FOREST_SAMPLE_SIZE: 256,

  // [ARIA] How often to persist in-memory baselines to MongoDB (ms)
  SYNC_INTERVAL_MS: 60_000,

  // [ARIA] BRPOP timeout in seconds (0 = block forever)
  BRPOP_TIMEOUT: 5,

  // [ARIA] Maximum baseline entries per IP before pruning
  MAX_BASELINE_ENTRIES: 1440, // 24h * 60 one-per-minute slots
};

// =============================================================================
// [ARIA] Mongoose model — Alert (inline schema, Mongoose ^8 style)
// Uses strict: false so we can do partial $set updates without declaring every field.
// Anti-re-registration pattern: mongoose.models.X || mongoose.model(...)
// =============================================================================
const AlertSchema = new mongoose.Schema(
  {
    requestId: { type: String, index: true },
    ip: String,
    method: String,
    uri: String,
    fidelityScore: Number,
    scores: {
      regex: Number,
      llm: Number,
      anomaly: Number, // [ARIA] THIS is the field we update
      ueba: Number,
    },
    decision: String,
    details: mongoose.Schema.Types.Mixed,
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProtectedService' },
    timestamp: { type: Date, default: Date.now },
  },
  { strict: false, timestamps: true }
);
const Alert = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);

// =============================================================================
// [ARIA] Mongoose model — AnomalyBaseline
// Persists per-IP statistical baselines so they survive restarts.
// =============================================================================
const BaselineSchema = new mongoose.Schema(
  {
    ip: { type: String, unique: true, index: true },
    requestRates: [Number],
    bodySizes: [Number],
    errorRates: [Number],
    endpoints: [String],
    hourHistogram: [Number], // 24 buckets (index 0–23)
    updatedAt: { type: Date, default: Date.now },
  },
  { strict: false }
);
const AnomalyBaseline =
  mongoose.models.AnomalyBaseline || mongoose.model('AnomalyBaseline', BaselineSchema);

// =============================================================================
// [ARIA] In-memory per-IP baselines (sliding window, last 24h)
// Structure: ip → { requestRates, bodySizes, errorRates, endpoints, hourHistogram, lastSeen }
// =============================================================================
const ipBaselines = new Map();

// [ARIA] Helper — create a fresh baseline entry for an IP
function createEmptyBaseline() {
  return {
    requestRates: [],   // requests-per-minute samples
    bodySizes: [],      // body sizes in bytes
    errorRates: [],     // error-rate samples (0–1 per window)
    endpoints: new Set(),
    hourHistogram: new Array(24).fill(0), // per-hour counters
    lastSeen: Date.now(),
    // [ARIA] Counters for the current measurement window (1 minute)
    _windowRequests: 0,
    _windowErrors: 0,
    _windowStart: Date.now(),
  };
}

// =============================================================================
// [ARIA] Statistical utility functions
// =============================================================================

// [ARIA] Compute arithmetic mean of a numeric array
function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// [ARIA] Compute population standard deviation
function stddev(arr) {
  if (!arr || arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

// [ARIA] Clamp a value between min and max
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// =============================================================================
// [ARIA] Isolation Forest — simplified pure-JS implementation
// =============================================================================
// An Isolation Forest works by randomly partitioning data. Points that are easier
// to isolate (shorter average path length) are more anomalous.
//
// Algorithm:
//   1. Build `nTrees` random trees, each from a random subsample of size `sampleSize`.
//   2. Each internal node picks a random feature and a random split value
//      between the feature's min and max in the subsample.
//   3. To score a point, traverse each tree and record the depth at which the
//      point is isolated. Average across trees.
//   4. Normalize using the expected average path length c(n) of an unsuccessful
//      search in a BST of n elements.
// =============================================================================

// [ARIA] Build a single isolation tree recursively
function buildIsolationTree(data, heightLimit, currentHeight) {
  // [ARIA] Base case — single point or height limit reached → return leaf
  if (currentHeight >= heightLimit || data.length <= 1) {
    return { type: 'leaf', size: data.length };
  }

  // [ARIA] Pick a random feature index (0 to #features - 1)
  const nFeatures = data[0].length;
  const featureIdx = Math.floor(Math.random() * nFeatures);

  // [ARIA] Find min/max of chosen feature in current data
  let fMin = Infinity;
  let fMax = -Infinity;
  for (const point of data) {
    if (point[featureIdx] < fMin) fMin = point[featureIdx];
    if (point[featureIdx] > fMax) fMax = point[featureIdx];
  }

  // [ARIA] If all values identical, can't split → leaf
  if (fMin === fMax) {
    return { type: 'leaf', size: data.length };
  }

  // [ARIA] Random split value between min and max
  const splitValue = fMin + Math.random() * (fMax - fMin);

  // [ARIA] Partition data into left (<=) and right (>)
  const left = [];
  const right = [];
  for (const point of data) {
    if (point[featureIdx] <= splitValue) {
      left.push(point);
    } else {
      right.push(point);
    }
  }

  return {
    type: 'internal',
    featureIdx,
    splitValue,
    left: buildIsolationTree(left, heightLimit, currentHeight + 1),
    right: buildIsolationTree(right, heightLimit, currentHeight + 1),
  };
}

// [ARIA] Compute the path length for a single point in a single tree
function pathLength(point, tree, currentHeight) {
  if (tree.type === 'leaf') {
    // [ARIA] Add the expected additional path length for a BST subtree of tree.size
    return currentHeight + cFactor(tree.size);
  }
  if (point[tree.featureIdx] <= tree.splitValue) {
    return pathLength(point, tree.left, currentHeight + 1);
  }
  return pathLength(point, tree.right, currentHeight + 1);
}

// [ARIA] c(n): average path length of unsuccessful search in a BST with n nodes
// Formula: 2*H(n-1) - 2*(n-1)/n  where H(i) = ln(i) + 0.5772156649 (Euler–Mascheroni)
function cFactor(n) {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  const harmonicNumber = Math.log(n - 1) + 0.5772156649;
  return 2.0 * harmonicNumber - (2.0 * (n - 1)) / n;
}

// [ARIA] Build a full Isolation Forest: an array of trees
function buildIsolationForest(data, nTrees, sampleSize) {
  const heightLimit = Math.ceil(Math.log2(Math.max(sampleSize, 2)));
  const trees = [];

  for (let t = 0; t < nTrees; t++) {
    // [ARIA] Subsample (with replacement if data is smaller than sampleSize)
    const sample = [];
    for (let i = 0; i < Math.min(sampleSize, data.length); i++) {
      const idx = Math.floor(Math.random() * data.length);
      sample.push(data[idx]);
    }
    trees.push(buildIsolationTree(sample, heightLimit, 0));
  }

  return trees;
}

// [ARIA] Score a point using the Isolation Forest
// Returns a value in [0, 1] where 1 = most anomalous
function isolationForestScore(point, trees, sampleSize) {
  if (trees.length === 0) return 0;

  // [ARIA] Average path length across all trees
  let totalPath = 0;
  for (const tree of trees) {
    totalPath += pathLength(point, tree, 0);
  }
  const avgPath = totalPath / trees.length;

  // [ARIA] Anomaly score: s(x, n) = 2^(-avgPath / c(n))
  const c = cFactor(sampleSize);
  if (c === 0) return 0;
  const score = Math.pow(2, -(avgPath / c));

  return clamp(score, 0, 1);
}

// =============================================================================
// [ARIA] Global Isolation Forest state — retrained periodically from baselines
// =============================================================================
let iForestTrees = [];
let iForestSampleSize = CONFIG.ISOLATION_FOREST_SAMPLE_SIZE;
let lastForestRebuild = 0;
const FOREST_REBUILD_INTERVAL_MS = 5 * 60_000; // [ARIA] Rebuild every 5 minutes

// [ARIA] Rebuild the Isolation Forest from current baseline data
function rebuildIsolationForest() {
  const dataPoints = [];

  // [ARIA] Extract feature vectors from every IP baseline
  for (const [, baseline] of ipBaselines) {
    const rateAvg = mean(baseline.requestRates);
    const sizeAvg = mean(baseline.bodySizes);
    const errAvg = mean(baseline.errorRates);
    const uniqueEndpoints = baseline.endpoints.size;
    // [ARIA] Peak activity hour — index of max in hourHistogram
    const peakHour = baseline.hourHistogram.indexOf(Math.max(...baseline.hourHistogram));

    dataPoints.push([rateAvg, sizeAvg, errAvg, uniqueEndpoints, peakHour]);
  }

  if (dataPoints.length < 10) {
    // [ARIA] Not enough data to build a meaningful forest — skip
    logger.debug({ dataPoints: dataPoints.length }, 'Not enough baseline data for Isolation Forest');
    return;
  }

  iForestSampleSize = Math.min(CONFIG.ISOLATION_FOREST_SAMPLE_SIZE, dataPoints.length);
  iForestTrees = buildIsolationForest(dataPoints, CONFIG.ISOLATION_FOREST_TREES, iForestSampleSize);
  lastForestRebuild = Date.now();
  logger.info({ trees: iForestTrees.length, dataPoints: dataPoints.length }, 'Isolation Forest rebuilt');
}

// =============================================================================
// [ARIA] Statistical anomaly detectors — each returns a sub-score in [0, 1]
// =============================================================================

// [ARIA] 1. Request Rate Anomaly
// Flag if the IP's current request rate exceeds mean + RATE_ANOMALY_THRESHOLD * stddev
function detectRateAnomaly(baseline, currentRate) {
  const m = mean(baseline.requestRates);
  const s = stddev(baseline.requestRates);
  if (s === 0 && baseline.requestRates.length < 5) return 0; // [ARIA] Not enough data
  const threshold = m + CONFIG.RATE_ANOMALY_THRESHOLD * (s || 1);
  if (currentRate <= threshold) return 0;
  // [ARIA] Proportional score: how far above the threshold
  return clamp((currentRate - threshold) / (threshold || 1), 0, 1);
}

// [ARIA] 2. Payload Size Anomaly
// Flag if body size exceeds mean + SIZE_ANOMALY_THRESHOLD * stddev
function detectSizeAnomaly(baseline, bodySize) {
  if (baseline.bodySizes.length < 3) return 0; // [ARIA] Not enough data
  const m = mean(baseline.bodySizes);
  const s = stddev(baseline.bodySizes);
  const threshold = m + CONFIG.SIZE_ANOMALY_THRESHOLD * (s || 1);
  if (bodySize <= threshold) return 0;
  return clamp((bodySize - threshold) / (threshold || 1), 0, 1);
}

// [ARIA] 3. Error Rate Anomaly
// Flag if the IP's recent error rate suddenly spikes above historical baseline
function detectErrorRateAnomaly(baseline, currentErrorRate) {
  if (baseline.errorRates.length < 3) return 0;
  const m = mean(baseline.errorRates);
  const s = stddev(baseline.errorRates);
  const threshold = m + CONFIG.RATE_ANOMALY_THRESHOLD * (s || 0.1);
  if (currentErrorRate <= threshold) return 0;
  return clamp((currentErrorRate - threshold) / (threshold || 0.1), 0, 1);
}

// [ARIA] 4. Endpoint Frequency Anomaly
// Flag if the IP is accessing an endpoint it has never accessed before
function detectEndpointAnomaly(baseline, uri) {
  if (baseline.endpoints.size === 0) return 0; // [ARIA] First-time IP, nothing to compare
  // [ARIA] Normalize URI (strip query strings, trailing slashes)
  const normalizedUri = (uri || '/').split('?')[0].replace(/\/+$/, '') || '/';
  const isNew = !baseline.endpoints.has(normalizedUri);
  // [ARIA] Score: 0 if known endpoint, scaled by how many endpoints IP normally uses
  if (!isNew) return 0;
  // [ARIA] The more established the baseline, the more suspicious a new endpoint is
  const noveltyWeight = clamp(baseline.endpoints.size / 20, 0.1, 1);
  return noveltyWeight;
}

// [ARIA] 5. Time-of-Day Anomaly
// Flag requests outside the IP's normal activity hours
function detectTimeAnomaly(baseline, hour) {
  const totalRequests = baseline.hourHistogram.reduce((s, v) => s + v, 0);
  if (totalRequests < 10) return 0; // [ARIA] Not enough history
  // [ARIA] Compute how unusual this hour is relative to the IP's pattern
  const hourCount = baseline.hourHistogram[hour] || 0;
  const hourFraction = hourCount / totalRequests;
  // [ARIA] If < 1% of historical traffic is at this hour, it's unusual
  if (hourFraction >= 0.01) return 0;
  // [ARIA] Score inversely proportional to how common this hour is
  return clamp(1 - hourFraction * 100, 0, 0.8);
}

// =============================================================================
// [ARIA] Composite anomaly scoring — combines all detectors into single 0–1 score
// =============================================================================

// [ARIA] Weights for each anomaly detector in the composite score
const DETECTOR_WEIGHTS = {
  rate: 0.20,
  size: 0.15,
  error: 0.20,
  endpoint: 0.15,
  time: 0.10,
  isolationForest: 0.20,
};

function computeAnomalyScore(event, baseline) {
  const hour = new Date(event.timestamp || Date.now()).getUTCHours();
  const bodySize = event.bodySize || 0;
  const isError = (event.status || 200) >= 400;

  // [ARIA] Measure the current minute's request rate for this IP
  const now = Date.now();
  const windowElapsedMs = now - (baseline._windowStart || now);
  const windowMinutes = Math.max(windowElapsedMs / 60_000, 1 / 60); // at least 1 second
  const currentRate = (baseline._windowRequests || 0) / windowMinutes;

  // [ARIA] Current error rate in this window
  const currentErrorRate =
    baseline._windowRequests > 0
      ? (baseline._windowErrors || 0) / baseline._windowRequests
      : 0;

  // [ARIA] Run each statistical detector
  const rateScore = detectRateAnomaly(baseline, currentRate);
  const sizeScore = detectSizeAnomaly(baseline, bodySize);
  const errorScore = detectErrorRateAnomaly(baseline, currentErrorRate);
  const endpointScore = detectEndpointAnomaly(baseline, event.uri);
  const timeScore = detectTimeAnomaly(baseline, hour);

  // [ARIA] Run Isolation Forest if trained
  let iForestScore = 0;
  if (iForestTrees.length > 0) {
    const featureVector = [
      currentRate,
      bodySize,
      currentErrorRate,
      baseline.endpoints.size,
      hour,
    ];
    iForestScore = isolationForestScore(featureVector, iForestTrees, iForestSampleSize);
  }

  // [ARIA] Weighted composite
  const composite =
    DETECTOR_WEIGHTS.rate * rateScore +
    DETECTOR_WEIGHTS.size * sizeScore +
    DETECTOR_WEIGHTS.error * errorScore +
    DETECTOR_WEIGHTS.endpoint * endpointScore +
    DETECTOR_WEIGHTS.time * timeScore +
    DETECTOR_WEIGHTS.isolationForest * iForestScore;

  // [ARIA] Normalize final score to [0, 1]
  const finalScore = clamp(parseFloat(composite.toFixed(4)), 0, 1);

  return {
    score: finalScore,
    details: {
      rateScore: parseFloat(rateScore.toFixed(4)),
      sizeScore: parseFloat(sizeScore.toFixed(4)),
      errorScore: parseFloat(errorScore.toFixed(4)),
      endpointScore: parseFloat(endpointScore.toFixed(4)),
      timeScore: parseFloat(timeScore.toFixed(4)),
      iForestScore: parseFloat(iForestScore.toFixed(4)),
      currentRate: parseFloat(currentRate.toFixed(2)),
      bodySize,
      windowRequests: baseline._windowRequests,
      baselineDepth: baseline.requestRates.length,
    },
  };
}

// =============================================================================
// [ARIA] Baseline management — update per-IP baselines with new event data
// =============================================================================

function updateBaseline(event) {
  const ip = event.ip || 'unknown';
  if (!ipBaselines.has(ip)) {
    ipBaselines.set(ip, createEmptyBaseline());
  }

  const baseline = ipBaselines.get(ip);
  const now = Date.now();

  // [ARIA] Update the current measurement window
  baseline._windowRequests += 1;
  if ((event.status || 200) >= 400) {
    baseline._windowErrors += 1;
  }

  // [ARIA] Roll the window every 60 seconds — push summary into history arrays
  const windowAge = now - (baseline._windowStart || now);
  if (windowAge >= 60_000) {
    const minutes = Math.max(windowAge / 60_000, 1);
    baseline.requestRates.push(baseline._windowRequests / minutes);
    baseline.errorRates.push(
      baseline._windowRequests > 0
        ? baseline._windowErrors / baseline._windowRequests
        : 0
    );
    // [ARIA] Reset window
    baseline._windowRequests = 0;
    baseline._windowErrors = 0;
    baseline._windowStart = now;

    // [ARIA] Prune old entries to stay within the sliding window
    if (baseline.requestRates.length > CONFIG.MAX_BASELINE_ENTRIES) {
      baseline.requestRates = baseline.requestRates.slice(-CONFIG.MAX_BASELINE_ENTRIES);
    }
    if (baseline.errorRates.length > CONFIG.MAX_BASELINE_ENTRIES) {
      baseline.errorRates = baseline.errorRates.slice(-CONFIG.MAX_BASELINE_ENTRIES);
    }
  }

  // [ARIA] Track body sizes
  const bodySize = event.bodySize || 0;
  baseline.bodySizes.push(bodySize);
  if (baseline.bodySizes.length > CONFIG.MAX_BASELINE_ENTRIES) {
    baseline.bodySizes = baseline.bodySizes.slice(-CONFIG.MAX_BASELINE_ENTRIES);
  }

  // [ARIA] Track unique endpoints (normalized)
  const normalizedUri = (event.uri || '/').split('?')[0].replace(/\/+$/, '') || '/';
  baseline.endpoints.add(normalizedUri);

  // [ARIA] Update hourly histogram
  const hour = new Date(event.timestamp || Date.now()).getUTCHours();
  baseline.hourHistogram[hour] = (baseline.hourHistogram[hour] || 0) + 1;

  // [ARIA] Update last-seen timestamp
  baseline.lastSeen = now;

  return baseline;
}

// =============================================================================
// [ARIA] Prune stale baselines — remove IPs not seen in >24 hours
// =============================================================================
function pruneStaleBaselines() {
  const cutoff = Date.now() - CONFIG.BASELINE_WINDOW_HOURS * 60 * 60 * 1000;
  let pruned = 0;
  for (const [ip, baseline] of ipBaselines) {
    if (baseline.lastSeen < cutoff) {
      ipBaselines.delete(ip);
      pruned++;
    }
  }
  if (pruned > 0) {
    logger.info({ pruned, remaining: ipBaselines.size }, 'Pruned stale IP baselines');
  }
}

// =============================================================================
// [ARIA] Persist in-memory baselines to MongoDB (periodic sync)
// =============================================================================
async function syncBaselinesToMongo() {
  try {
    const ops = [];
    for (const [ip, baseline] of ipBaselines) {
      ops.push({
        updateOne: {
          filter: { ip },
          update: {
            $set: {
              ip,
              requestRates: baseline.requestRates.slice(-200), // [ARIA] Save last 200 samples
              bodySizes: baseline.bodySizes.slice(-200),
              errorRates: baseline.errorRates.slice(-200),
              endpoints: Array.from(baseline.endpoints).slice(-500),
              hourHistogram: baseline.hourHistogram,
              updatedAt: new Date(),
            },
          },
          upsert: true,
        },
      });
    }
    if (ops.length > 0) {
      await AnomalyBaseline.bulkWrite(ops, { ordered: false });
      logger.info({ ips: ops.length }, 'Baselines synced to MongoDB');
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to sync baselines to MongoDB');
  }
}

// =============================================================================
// [ARIA] Load baselines from MongoDB on startup (survive restarts)
// =============================================================================
async function loadBaselinesFromMongo() {
  try {
    const docs = await AnomalyBaseline.find({}).lean();
    for (const doc of docs) {
      const baseline = createEmptyBaseline();
      baseline.requestRates = doc.requestRates || [];
      baseline.bodySizes = doc.bodySizes || [];
      baseline.errorRates = doc.errorRates || [];
      baseline.endpoints = new Set(doc.endpoints || []);
      baseline.hourHistogram = doc.hourHistogram || new Array(24).fill(0);
      baseline.lastSeen = doc.updatedAt ? new Date(doc.updatedAt).getTime() : Date.now();
      ipBaselines.set(doc.ip, baseline);
    }
    logger.info({ ips: docs.length }, 'Baselines loaded from MongoDB');
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to load baselines from MongoDB');
  }
}

// =============================================================================
// [ARIA] Process a single raw event: update baseline → compute score → publish
// =============================================================================
async function processEvent(event, redisClient) {
  const requestId = event.requestId;
  if (!requestId) {
    logger.warn({ event }, 'Event missing requestId — skipping');
    return;
  }

  // [ARIA] Step 1: Update per-IP baseline with this event's data
  const baseline = updateBaseline(event);

  // [ARIA] Step 2: Compute composite anomaly score
  const { score, details } = computeAnomalyScore(event, baseline);

  // [ARIA] Step 3: Update Alert document in MongoDB with anomaly score
  try {
    await Alert.updateOne(
      { requestId },
      {
        $set: {
          'scores.anomaly': score,
          'anomalyDetails': details,
        },
      }
    );
  } catch (err) {
    logger.error({ err: err.message, requestId }, 'Failed to update Alert with anomaly score');
  }

  // [ARIA] Step 4: Publish anomaly score to Redis for other consumers
  try {
    const payload = JSON.stringify({
      anomaly: score,
      details,
      requestId,
      ip: event.ip,
      timestamp: new Date().toISOString(),
    });
    await redisClient.lPush(`aria:scores:${requestId}`, payload);
  } catch (err) {
    logger.error({ err: err.message, requestId }, 'Failed to publish anomaly score to Redis');
  }

  // [ARIA] Log at appropriate level based on score severity
  if (score >= 0.7) {
    logger.warn({ requestId, ip: event.ip, uri: event.uri, score, details }, 'HIGH anomaly detected');
  } else if (score >= 0.4) {
    logger.info({ requestId, ip: event.ip, score }, 'Moderate anomaly detected');
  } else {
    logger.debug({ requestId, ip: event.ip, score }, 'Normal event processed');
  }
}

// =============================================================================
// [ARIA] Main event loop — BRPOP from Redis, process, repeat
// =============================================================================
async function eventLoop(redisClient) {
  logger.info('Event loop started — waiting for events on aria:events:raw');

  // [ARIA] Continuous loop: block-pop from Redis, process event, repeat
  while (!shuttingDown) {
    try {
      // [ARIA] BRPOP blocks until an event is available (or timeout)
      const result = await redisClient.brPop('aria:events:raw', CONFIG.BRPOP_TIMEOUT);

      if (!result) {
        // [ARIA] Timeout, no event — loop back to BRPOP
        continue;
      }

      // [ARIA] result = { key, element } from redis v4 client
      let event;
      try {
        event = JSON.parse(result.element);
      } catch (parseErr) {
        logger.error({ raw: result.element, err: parseErr.message }, 'Failed to parse event JSON');
        continue;
      }

      // [ARIA] Process the event (update baseline, score, publish)
      await processEvent(event, redisClient);

      // [ARIA] Periodically rebuild the Isolation Forest
      if (Date.now() - lastForestRebuild > FOREST_REBUILD_INTERVAL_MS) {
        rebuildIsolationForest();
      }
    } catch (err) {
      // [ARIA] Fail open — log the error and continue processing
      if (shuttingDown) break;
      logger.error({ err: err.message, stack: err.stack }, 'Error in event loop');
      // [ARIA] Brief pause to avoid tight error loops
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  logger.info('Event loop stopped');
}

// =============================================================================
// [ARIA] Graceful shutdown handling
// =============================================================================
let shuttingDown = false;

async function shutdown(redisClient) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('Shutting down anomaly detection service...');

  // [ARIA] Persist baselines before exiting
  await syncBaselinesToMongo();

  // [ARIA] Close connections
  try {
    await redisClient.quit();
    logger.info('Redis connection closed');
  } catch (err) {
    logger.error({ err: err.message }, 'Error closing Redis');
  }

  try {
    await mongoose.disconnect();
    logger.info('MongoDB connection closed');
  } catch (err) {
    logger.error({ err: err.message }, 'Error closing MongoDB');
  }

  logger.info('Anomaly detection service stopped');
  process.exit(0);
}

// =============================================================================
// [ARIA] Entry point — connect to Redis + MongoDB, then start event loop
// =============================================================================
async function main() {
  logger.info('=== ARIA Anomaly Detection Service v1.0.0 ===');
  logger.info({
    redis: CONFIG.REDIS_URL,
    mongo: CONFIG.MONGO_URI,
    baselineWindow: `${CONFIG.BASELINE_WINDOW_HOURS}h`,
    iForestTrees: CONFIG.ISOLATION_FOREST_TREES,
    iForestSampleSize: CONFIG.ISOLATION_FOREST_SAMPLE_SIZE,
  }, 'Configuration');

  // [ARIA] Connect to MongoDB
  try {
    await mongoose.connect(CONFIG.MONGO_URI);
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.fatal({ err: err.message }, 'Failed to connect to MongoDB');
    process.exit(1);
  }

  // [ARIA] Connect to Redis
  const redisClient = createClient({ url: CONFIG.REDIS_URL });
  redisClient.on('error', (err) => {
    logger.error({ err: err.message }, 'Redis client error');
  });
  redisClient.on('reconnecting', () => {
    logger.warn('Redis reconnecting...');
  });

  try {
    await redisClient.connect();
    logger.info('Connected to Redis');
  } catch (err) {
    logger.fatal({ err: err.message }, 'Failed to connect to Redis');
    process.exit(1);
  }

  // [ARIA] Register graceful shutdown handlers
  process.on('SIGINT', () => shutdown(redisClient));
  process.on('SIGTERM', () => shutdown(redisClient));

  // [ARIA] Load persisted baselines from MongoDB
  await loadBaselinesFromMongo();

  // [ARIA] Build initial Isolation Forest if we have enough baseline data
  rebuildIsolationForest();

  // [ARIA] Start periodic baseline sync to MongoDB
  const syncTimer = setInterval(async () => {
    await syncBaselinesToMongo();
    pruneStaleBaselines();
  }, CONFIG.SYNC_INTERVAL_MS);

  // [ARIA] Ensure timer doesn't prevent process exit
  syncTimer.unref();

  // [ARIA] Start the main event consumption loop
  await eventLoop(redisClient);
}

// [ARIA] Launch the service
main().catch((err) => {
  logger.fatal({ err: err.message, stack: err.stack }, 'Unhandled fatal error');
  process.exit(1);
});
