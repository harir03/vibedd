// ============================================================================
// ARIA — Log Ingestion & Normalization Pipeline (Feature 04)
//
// This worker process:
//   1. Pulls raw events from Redis queue (aria:events:raw) using BRPOP
//   2. Normalizes them via format-specific parsers (gateway, syslog, JSON, CSV)
//   3. Enriches with geo-location and session context
//   4. Writes normalized events to MongoDB (NormalizedEvent collection)
//   5. Republishes to downstream queues for anomaly detection (Feature 05),
//      UEBA analysis (Feature 06), and alert correlation (Feature 08)
//
// Integration:
//   - Gateway pushes via: LPUSH aria:events:raw <JSON>
//   - This worker pulls via: BRPOP aria:events:raw
//   - After normalization, publishes to:
//       aria:events:normalized  (for anomaly detection + UEBA)
//       aria:alerts:new         (for correlation engine)
// ============================================================================

const mongoose = require('mongoose');
const Redis = require('ioredis');
const pino = require('pino');
const { v4: uuidv4 } = require('uuid');

// ── Configuration ───────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aria_db';
const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10');
const QUEUE_TIMEOUT = parseInt(process.env.QUEUE_TIMEOUT || '5');       // BRPOP timeout in seconds
const WORKER_ID = process.env.WORKER_ID || `ingestion-${process.pid}`;

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
});

// ── Redis Queues ────────────────────────────────────────────────────────────
const QUEUE_RAW = 'aria:events:raw';                  // Input queue from gateway
const QUEUE_NORMALIZED = 'aria:events:normalized';    // Output for anomaly detection + UEBA
const QUEUE_ALERTS_NEW = 'aria:alerts:new';           // Output for alert correlation

// ── MongoDB Schema: NormalizedEvent ─────────────────────────────────────────
const NormalizedEventSchema = new mongoose.Schema({
    eventId: { type: String, required: true, unique: true },
    timestamp: { type: Date, required: true, default: Date.now },
    source: { type: String, enum: ['gateway', 'syslog', 'application', 'network'], required: true },
    severity: { type: String, enum: ['info', 'low', 'medium', 'high', 'critical'], default: 'info' },
    category: { type: String },                          // e.g., 'authentication', 'transaction', 'data_access'
    raw: { type: String },                               // Original log line / JSON string
    parsed: { type: mongoose.Schema.Types.Mixed },       // Structured fields
    metadata: {
        sourceIP: { type: String },
        destinationIP: { type: String },
        userId: { type: String },
        sessionId: { type: String },
        userAgent: { type: String },
        geoLocation: {
            country: { type: String },
            city: { type: String },
            lat: { type: Number },
            lon: { type: Number },
        },
    },
    // [ARIA] Fields for downstream processing
    applicationId: { type: String },                     // Which protected service this belongs to
    alertId: { type: String },                           // Reference to Alert document if threat detected
    processingMetadata: {
        ingestedAt: { type: Date, default: Date.now },
        normalizedAt: { type: Date },
        workerId: { type: String },
        parserUsed: { type: String },
        processingTimeMs: { type: Number },
    },
}, { timestamps: true });

NormalizedEventSchema.index({ timestamp: -1 });
NormalizedEventSchema.index({ source: 1, category: 1 });
NormalizedEventSchema.index({ 'metadata.sourceIP': 1 });
NormalizedEventSchema.index({ applicationId: 1 });

const NormalizedEvent = mongoose.models.NormalizedEvent ||
    mongoose.model('NormalizedEvent', NormalizedEventSchema);

// ── Format Parsers ──────────────────────────────────────────────────────────

// [ARIA] Parser: Gateway events — already structured JSON from Feature 01
function parseGatewayEvent(data) {
    const start = Date.now();
    return {
        eventId: data.requestId || uuidv4(),
        timestamp: data.time ? new Date(data.time) : new Date(),
        source: 'gateway',
        severity: data.severity || categorizeSeverity(data),
        category: categorizeRequest(data),
        raw: JSON.stringify(data),
        parsed: {
            method: data.method,
            uri: data.uri,
            status: data.status,
            attackType: data.attackType,
            decision: data.decision || data.aiDecision,
            detectionSource: data.detectionSource,
            fidelityScore: data.fidelityScore,
            regexMatches: data.regexMatches,
            aiAnalysis: data.aiAnalysis,
            aiConfidence: data.aiConfidence,
            responseTime: data.duration,
            bodySize: data.body ? data.body.length : 0,
        },
        metadata: {
            sourceIP: data.ip || data.sourceIP,
            userAgent: data.userAgent,
            geoLocation: data.country ? { country: data.country } : undefined,
            sessionId: extractSessionId(data),
            userId: extractUserId(data),
        },
        applicationId: data.applicationId,
        alertId: data.alertId,
        processingMetadata: {
            ingestedAt: new Date(),
            normalizedAt: new Date(),
            workerId: WORKER_ID,
            parserUsed: 'gateway',
            processingTimeMs: Date.now() - start,
        },
    };
}

// [ARIA] Parser: Syslog (RFC 5424 format)
function parseSyslogEvent(rawLine) {
    const start = Date.now();
    // RFC 5424: <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA MSG
    const syslogRegex = /^<(\d+)>(\d+)?\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.*)/;
    const match = rawLine.match(syslogRegex);

    if (!match) {
        // Fallback: treat as unstructured text
        return {
            eventId: uuidv4(),
            timestamp: new Date(),
            source: 'syslog',
            severity: 'info',
            category: 'unknown',
            raw: rawLine,
            parsed: { message: rawLine },
            metadata: {},
            processingMetadata: {
                ingestedAt: new Date(),
                normalizedAt: new Date(),
                workerId: WORKER_ID,
                parserUsed: 'syslog-fallback',
                processingTimeMs: Date.now() - start,
            },
        };
    }

    const [, pri, , timestamp, hostname, appName, procId, msgId, msg] = match;
    const facility = Math.floor(parseInt(pri) / 8);
    const severityLevel = parseInt(pri) % 8;

    return {
        eventId: uuidv4(),
        timestamp: new Date(timestamp),
        source: 'syslog',
        severity: syslogSeverityMap(severityLevel),
        category: appName,
        raw: rawLine,
        parsed: {
            facility,
            severityLevel,
            hostname,
            appName,
            procId,
            msgId,
            message: msg,
        },
        metadata: {
            sourceIP: hostname,
        },
        processingMetadata: {
            ingestedAt: new Date(),
            normalizedAt: new Date(),
            workerId: WORKER_ID,
            parserUsed: 'syslog',
            processingTimeMs: Date.now() - start,
        },
    };
}

// [ARIA] Parser: Generic JSON logs
function parseJsonEvent(data) {
    const start = Date.now();
    return {
        eventId: data.id || data.event_id || data.eventId || uuidv4(),
        timestamp: new Date(data.timestamp || data.time || data['@timestamp'] || Date.now()),
        source: 'application',
        severity: data.severity || data.level || 'info',
        category: data.category || data.type || 'unknown',
        raw: JSON.stringify(data),
        parsed: data,
        metadata: {
            sourceIP: data.ip || data.source_ip || data.client_ip || data.remote_addr,
            destinationIP: data.dest_ip || data.destination_ip || data.server_ip,
            userId: data.user_id || data.userId || data.user,
            sessionId: data.session_id || data.sessionId,
            userAgent: data.user_agent || data.userAgent,
        },
        processingMetadata: {
            ingestedAt: new Date(),
            normalizedAt: new Date(),
            workerId: WORKER_ID,
            parserUsed: 'json',
            processingTimeMs: Date.now() - start,
        },
    };
}

// ── Helper Functions ────────────────────────────────────────────────────────

// [ARIA] Categorize request type for banking context
function categorizeRequest(data) {
    const uri = (data.uri || '').toLowerCase();
    if (uri.includes('/auth') || uri.includes('/login') || uri.includes('/token')) return 'authentication';
    if (uri.includes('/transfer') || uri.includes('/payment') || uri.includes('/transaction')) return 'transaction';
    if (uri.includes('/account') || uri.includes('/balance') || uri.includes('/statement')) return 'data_access';
    if (uri.includes('/admin') || uri.includes('/config') || uri.includes('/settings')) return 'administrative';
    if (uri.includes('/api')) return 'api_call';
    return 'general';
}

// [ARIA] Determine severity from gateway event data
function categorizeSeverity(data) {
    if (data.fidelityScore >= 90) return 'critical';
    if (data.fidelityScore >= 70) return 'high';
    if (data.fidelityScore >= 40) return 'medium';
    if (data.fidelityScore >= 10) return 'low';
    if (data.attackType && data.attackType !== 'none') return 'low';
    return 'info';
}

// [ARIA] Map syslog severity levels to ARIA severity
function syslogSeverityMap(level) {
    // Syslog: 0=Emergency, 1=Alert, 2=Critical, 3=Error, 4=Warning, 5=Notice, 6=Info, 7=Debug
    if (level <= 2) return 'critical';
    if (level === 3) return 'high';
    if (level === 4) return 'medium';
    if (level === 5) return 'low';
    return 'info';
}

// [ARIA] Extract session ID from request headers/cookies
function extractSessionId(data) {
    if (!data.headers) return undefined;
    const cookies = data.headers.cookie || data.headers.Cookie || '';
    const sessionMatch = cookies.match(/(?:session|sid|JSESSIONID|connect\.sid)=([^;]+)/i);
    return sessionMatch ? sessionMatch[1] : undefined;
}

// [ARIA] Extract user ID from request headers/body (JWT, basic auth, etc.)
function extractUserId(data) {
    if (!data.headers) return undefined;
    const auth = data.headers.authorization || data.headers.Authorization || '';
    // Try to extract from JWT payload (base64 decode middle segment)
    if (auth.startsWith('Bearer ')) {
        try {
            const payload = JSON.parse(Buffer.from(auth.split('.')[1], 'base64').toString());
            return payload.sub || payload.user_id || payload.userId;
        } catch { /* not a valid JWT */ }
    }
    return undefined;
}

// ── Main Worker Loop ────────────────────────────────────────────────────────

let redis;
let isShuttingDown = false;

async function connectServices() {
    // Connect MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info({ uri: MONGODB_URI }, 'Connected to MongoDB');

    // Connect Redis
    redis = new Redis(REDIS_URI);
    redis.on('error', (err) => logger.error({ err }, 'Redis connection error'));
    redis.on('connect', () => logger.info('Connected to Redis'));
}

async function processEvent(rawData) {
    let parsed;

    // Try to parse as JSON first
    try {
        parsed = JSON.parse(rawData);
    } catch {
        // Not JSON — treat as syslog or raw text
        return parseSyslogEvent(rawData);
    }

    // Determine parser based on data shape
    if (parsed.requestId || (parsed.method && parsed.uri)) {
        // Gateway event (has HTTP request fields)
        return parseGatewayEvent(parsed);
    } else {
        // Generic JSON log
        return parseJsonEvent(parsed);
    }
}

async function workerLoop() {
    logger.info({ workerId: WORKER_ID, queue: QUEUE_RAW }, 'Ingestion worker started, listening for events...');

    while (!isShuttingDown) {
        try {
            // BRPOP blocks until an item is available (with timeout for graceful shutdown)
            const result = await redis.brpop(QUEUE_RAW, QUEUE_TIMEOUT);

            if (!result) continue;   // Timeout, no items — loop and check shutdown flag

            const [, rawData] = result;

            // Process single event
            const normalized = await processEvent(rawData);

            // Write to MongoDB
            await NormalizedEvent.create(normalized);

            // Publish to downstream queues for further processing
            const normalizedJson = JSON.stringify(normalized);
            await redis.lpush(QUEUE_NORMALIZED, normalizedJson);

            // If this event has a threat detection, also push to alert correlation queue
            if (normalized.parsed?.attackType && normalized.parsed.attackType !== 'none') {
                await redis.lpush(QUEUE_ALERTS_NEW, normalizedJson);
            }

            logger.debug({
                eventId: normalized.eventId,
                source: normalized.source,
                category: normalized.category,
                severity: normalized.severity,
                processingTimeMs: normalized.processingMetadata?.processingTimeMs,
            }, 'Event ingested and normalized');

        } catch (err) {
            logger.error({ err }, 'Error processing event');
            // Continue processing — fail-open design
        }
    }

    logger.info('Worker shutting down gracefully...');
}

// ── Batch Ingestion Endpoint (for bulk imports) ─────────────────────────────

async function ingestBatch(events) {
    const normalized = [];
    const errors = [];

    for (const event of events) {
        try {
            const raw = typeof event === 'string' ? event : JSON.stringify(event);
            const n = await processEvent(raw);
            normalized.push(n);
        } catch (err) {
            errors.push({ event, error: err.message });
        }
    }

    if (normalized.length > 0) {
        await NormalizedEvent.insertMany(normalized, { ordered: false });
        logger.info({ count: normalized.length, errors: errors.length }, 'Batch ingestion complete');
    }

    return { ingested: normalized.length, errors: errors.length, errorDetails: errors };
}

// ── Stats Endpoint ──────────────────────────────────────────────────────────

async function getStats() {
    const total = await NormalizedEvent.countDocuments();
    const bySource = await NormalizedEvent.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);
    const byCategory = await NormalizedEvent.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const bySeverity = await NormalizedEvent.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);
    const queueLength = await redis.llen(QUEUE_RAW);

    return { total, bySource, byCategory, bySeverity, queueLength, workerId: WORKER_ID };
}

// ── Graceful Shutdown ───────────────────────────────────────────────────────

process.on('SIGINT', () => { isShuttingDown = true; });
process.on('SIGTERM', () => { isShuttingDown = true; });

// ── Start ───────────────────────────────────────────────────────────────────

async function main() {
    try {
        await connectServices();
        await workerLoop();
    } catch (err) {
        logger.fatal({ err }, 'Fatal error in ingestion worker');
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        if (redis) await redis.quit();
        logger.info('Ingestion worker stopped');
    }
}

// Export for testing and API integration
module.exports = { processEvent, ingestBatch, getStats, NormalizedEvent };

main();
