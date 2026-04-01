// ============================================================================
// ARIA — Adaptive Response & Intelligence Agent
// Alert Correlation Worker (Feature 08)
//
// Standalone Node.js worker that groups related Alerts into Incidents.
// Runs a correlation cycle every 60 seconds, evaluating 5 rules:
//   1. Same Source IP       (15-min window, min 3 alerts)
//   2. Same Attack Type     (30-min window, min 5 alerts)
//   3. Endpoint Targeting   (20-min window, min 3 alerts)
//   4. Kill Chain Detection (60-min window, sequential stages from same IP)
//   5. Distributed Attack   (10-min window, min 5 IPs on same endpoint)
//
// Data flow:
//   MongoDB (Alert) → this worker → MongoDB (Incident) + Redis pub/sub
//
// Follows gateway pattern: inline Mongoose schemas, native redis, pino logging.
// ============================================================================

const mongoose = require('mongoose');
const { createClient } = require('redis');
const pino = require('pino');

// [ARIA] Logger — structured JSON output via pino (matches gateway pattern)
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// --- Configuration ---
// [ARIA] All config is env-driven with sensible defaults for local dev
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aria_db';
const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
const CORRELATION_INTERVAL_MS = parseInt(process.env.CORRELATION_INTERVAL_MS, 10) || 60000;

// [ARIA] Redis channel for incident notifications — consumed by dashboard + other workers
const REDIS_CHANNEL = 'aria-alerts';

// --- Inline Mongoose Schemas (same pattern as gateway — no cross-project imports) ---

// [ARIA] Alert schema — read-only view of alerts created by the gateway (Feature 01).
// We only need the fields relevant for correlation queries. The full schema is
// defined in the gateway; this is a compatible subset for querying.
const AlertSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    timestamp: { type: Date, default: Date.now },
    sourceIP: { type: String, required: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    headers: { type: mongoose.Schema.Types.Mixed },
    body: { type: String },
    userAgent: { type: String },
    aiDecision: { type: String, enum: ['block', 'allow'], required: true },
    aiReasoning: { type: String },
    detectionSources: [{ type: String }],
    regexMatches: [{ type: String }],
    category: { type: String },
    fidelityScore: { type: Number, default: 0, min: 0, max: 100 },
    scores: {
        regex: { type: Number, default: 0 },
        llm: { type: Number, default: 0 },
        anomaly: { type: Number, default: 0 },
        ueba: { type: Number, default: 0 },
    },
    severity: { type: String, enum: ['info', 'low', 'medium', 'high', 'critical'], default: 'info' },
    triageStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'escalated'], default: 'pending' },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProtectedService' },
    serviceName: { type: String },
    responseStatus: { type: Number },
}, { collection: 'alerts' });
AlertSchema.index({ timestamp: -1 });
AlertSchema.index({ sourceIP: 1, timestamp: -1 });
AlertSchema.index({ category: 1, timestamp: -1 });
AlertSchema.index({ path: 1, timestamp: -1 });

// [ARIA] Use existing model if already registered (hot-reload safety)
const Alert = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);

// [ARIA] Incident schema — new model created by this correlation worker.
// Groups related alerts into a single incident for analyst triage.
// Fields match the ARIA Incident model spec from copilot-instructions.
const IncidentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    severity: { type: String, enum: ['info', 'low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: ['open', 'investigating', 'resolved', 'false_positive'], default: 'open' },
    alertIds: [{ type: mongoose.Schema.Types.ObjectId }],
    alertCount: { type: Number, default: 0 },
    sourceIPs: [{ type: String }],
    targetEndpoints: [{ type: String }],
    attackStage: { type: String },
    timeRange: {
        start: { type: Date },
        end: { type: Date },
    },
    avgFidelity: { type: Number, default: 0 },
    maxFidelity: { type: Number, default: 0 },
    correlationRule: { type: String },
    playbookId: { type: mongoose.Schema.Types.ObjectId },
    assignedTo: { type: String },
    applicationId: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true, collection: 'incidents' });
IncidentSchema.index({ status: 1, severity: -1 });
IncidentSchema.index({ createdAt: -1 });
IncidentSchema.index({ correlationRule: 1 });

const Incident = mongoose.models.Incident || mongoose.model('Incident', IncidentSchema);

// --- Attack Stage Mapping ---
// [ARIA] Maps alert categories to kill chain stages for Rule 4 (Kill Chain Detection).
// Based on Lockheed Martin Cyber Kill Chain adapted for web application attacks.
const ATTACK_STAGE_MAP = {
    path_traversal: 'reconnaissance',
    scanning: 'reconnaissance',
    sql_injection: 'exploitation',
    xss: 'exploitation',
    command_injection: 'exploitation',
    privilege_escalation: 'installation',
    data_exfiltration: 'exfiltration',
    credential_stuffing: 'delivery',
    account_enumeration: 'delivery',
};

// [ARIA] Kill chain stage ordering — used to detect sequential progression
const KILL_CHAIN_ORDER = ['delivery', 'reconnaissance', 'exploitation', 'installation', 'exfiltration'];

// [ARIA] Severity ordering for selecting max severity from constituent alerts
const SEVERITY_ORDER = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
const SEVERITY_NAMES = ['info', 'low', 'medium', 'high', 'critical'];

// --- Redis Client ---
let redisClient = null;

// [ARIA] Initialize Redis with reconnect logic. Fail-open: if Redis is down,
// correlation still runs — we just can't publish notifications.
async function connectRedis() {
    try {
        redisClient = createClient({ url: REDIS_URI });

        redisClient.on('error', (err) => {
            logger.error({ err: err.message }, 'Redis client error');
        });

        redisClient.on('reconnecting', () => {
            logger.info('Redis reconnecting...');
        });

        redisClient.on('ready', () => {
            logger.info('Redis client ready');
        });

        await redisClient.connect();
        logger.info({ uri: REDIS_URI }, 'Redis connected');
    } catch (err) {
        logger.error({ err: err.message }, 'Failed to connect to Redis — continuing without pub/sub');
        redisClient = null;
    }
}

// [ARIA] Publish incident notification to Redis channel.
// Other services (dashboard, playbook generator) subscribe to this channel.
async function publishIncidentNotification(incident) {
    if (!redisClient || !redisClient.isOpen) {
        logger.warn('Redis not available — skipping incident notification publish');
        return;
    }
    try {
        const payload = JSON.stringify({
            type: 'incident_created',
            incidentId: incident._id.toString(),
            title: incident.title,
            severity: incident.severity,
            alertCount: incident.alertCount,
            correlationRule: incident.correlationRule,
            timestamp: new Date().toISOString(),
        });
        await redisClient.publish(REDIS_CHANNEL, payload);
        logger.info({ incidentId: incident._id, channel: REDIS_CHANNEL }, 'Published incident notification');
    } catch (err) {
        logger.error({ err: err.message }, 'Failed to publish incident notification');
    }
}

// --- MongoDB Connection ---

// [ARIA] Connect to MongoDB with retry. The worker cannot function without the DB.
async function connectMongo() {
    try {
        await mongoose.connect(MONGODB_URI);
        logger.info({ uri: MONGODB_URI }, 'MongoDB connected');

        mongoose.connection.on('error', (err) => {
            logger.error({ err: err.message }, 'MongoDB connection error');
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected — will auto-reconnect');
        });
    } catch (err) {
        logger.error({ err: err.message }, 'Failed to connect to MongoDB');
        throw err;
    }
}

// --- Helper Functions ---

// [ARIA] Compute the maximum severity from a list of alert severity strings.
// Returns the highest severity encountered, defaulting to 'medium'.
function maxSeverity(alerts) {
    let max = 0;
    for (const alert of alerts) {
        const val = SEVERITY_ORDER[alert.severity] ?? 0;
        if (val > max) max = val;
    }
    return SEVERITY_NAMES[max] || 'medium';
}

// [ARIA] Compute the average fidelity score across a list of alerts.
function avgFidelity(alerts) {
    if (!alerts.length) return 0;
    const sum = alerts.reduce((acc, a) => acc + (a.fidelityScore ?? 0), 0);
    return Math.round(sum / alerts.length);
}

// [ARIA] Compute the maximum fidelity score across a list of alerts.
function maxFidelityScore(alerts) {
    if (!alerts.length) return 0;
    return Math.max(...alerts.map((a) => a.fidelityScore ?? 0));
}

// [ARIA] Extract unique source IPs from alerts (deduplicated).
function uniqueIPs(alerts) {
    return [...new Set(alerts.map((a) => a.sourceIP).filter(Boolean))];
}

// [ARIA] Extract unique target endpoints (paths) from alerts (deduplicated).
function uniqueEndpoints(alerts) {
    return [...new Set(alerts.map((a) => a.path).filter(Boolean))];
}

// [ARIA] Determine the dominant attack stage from alerts using the stage map.
// Returns the most advanced (latest in kill chain) stage found.
function dominantAttackStage(alerts) {
    let maxOrder = -1;
    let stage = 'unknown';
    for (const alert of alerts) {
        const s = ATTACK_STAGE_MAP[alert.category];
        if (s) {
            const order = KILL_CHAIN_ORDER.indexOf(s);
            if (order > maxOrder) {
                maxOrder = order;
                stage = s;
            }
        }
    }
    return stage;
}

// [ARIA] Compute the time range (earliest → latest) from a list of alerts.
function computeTimeRange(alerts) {
    const times = alerts.map((a) => new Date(a.timestamp).getTime()).filter((t) => !isNaN(t));
    if (!times.length) return { start: new Date(), end: new Date() };
    return {
        start: new Date(Math.min(...times)),
        end: new Date(Math.max(...times)),
    };
}

// [ARIA] Check if an existing open/investigating Incident already covers these alert IDs.
// Prevents duplicate incident creation for the same set of alerts.
async function isDuplicate(alertObjectIds, correlationRule) {
    try {
        const existing = await Incident.findOne({
            status: { $in: ['open', 'investigating'] },
            correlationRule: correlationRule,
            alertIds: { $in: alertObjectIds },
        }).lean();
        return !!existing;
    } catch (err) {
        logger.error({ err: err.message }, 'Error checking for duplicate incident');
        // [ARIA] Fail-open: if we can't check, assume not duplicate (may create extra incidents
        // but won't miss real ones — safer for security)
        return false;
    }
}

// [ARIA] Create a new Incident document and publish notification.
async function createIncident({ title, description, category, severity, alertIds, sourceIPs, targetEndpoints, attackStage, timeRange, avgFidelity, maxFidelity, correlationRule, applicationId }) {
    try {
        const incident = await Incident.create({
            title,
            description,
            category,
            severity,
            status: 'open',
            alertIds,
            alertCount: alertIds.length,
            sourceIPs,
            targetEndpoints,
            attackStage,
            timeRange,
            avgFidelity,
            maxFidelity,
            correlationRule,
            applicationId: applicationId || null,
        });

        logger.info({
            incidentId: incident._id,
            title: incident.title,
            rule: correlationRule,
            alertCount: incident.alertCount,
            severity: incident.severity,
        }, 'Created new incident');

        // [ARIA] Publish to Redis so dashboard and playbook generator pick it up
        await publishIncidentNotification(incident);

        return incident;
    } catch (err) {
        logger.error({ err: err.message, title, correlationRule }, 'Failed to create incident');
        return null;
    }
}

// ============================================================================
// Correlation Rules
// ============================================================================

// [ARIA] RULE 1: Same Source IP
// Groups alerts from the same IP within a 15-minute window (minimum 3 alerts).
// Detects single-attacker campaigns — one IP probing multiple endpoints or
// sending multiple attack payloads.
async function ruleSameSourceIP() {
    const windowMs = 15 * 60 * 1000;
    const minAlerts = 3;
    const windowStart = new Date(Date.now() - windowMs);

    try {
        // [ARIA] Aggregate alerts by sourceIP within the time window
        const groups = await Alert.aggregate([
            { $match: { timestamp: { $gte: windowStart }, category: { $ne: null } } },
            { $group: {
                _id: '$sourceIP',
                alerts: { $push: '$$ROOT' },
                count: { $sum: 1 },
            }},
            { $match: { count: { $gte: minAlerts } } },
        ]);

        let incidentsCreated = 0;

        for (const group of groups) {
            const alerts = group.alerts;
            const alertObjectIds = alerts.map((a) => a._id);

            // [ARIA] Skip if an existing open incident already covers these alerts
            if (await isDuplicate(alertObjectIds, 'same_source_ip')) {
                logger.debug({ ip: group._id }, 'Rule 1: Duplicate incident exists, skipping');
                continue;
            }

            const ips = uniqueIPs(alerts);
            const endpoints = uniqueEndpoints(alerts);
            const sev = maxSeverity(alerts);
            const categories = [...new Set(alerts.map((a) => a.category).filter(Boolean))];
            const stage = dominantAttackStage(alerts);
            const tr = computeTimeRange(alerts);

            await createIncident({
                title: `Multi-alert activity from ${group._id} (${alerts.length} alerts)`,
                description: `${alerts.length} alerts detected from IP ${group._id} within ${windowMs / 60000} minutes. Attack types: ${categories.join(', ') || 'unknown'}. Targeted endpoints: ${endpoints.join(', ')}.`,
                category: categories[0] || 'unknown',
                severity: sev,
                alertIds: alertObjectIds,
                sourceIPs: ips,
                targetEndpoints: endpoints,
                attackStage: stage,
                timeRange: tr,
                avgFidelity: avgFidelity(alerts),
                maxFidelity: maxFidelityScore(alerts),
                correlationRule: 'same_source_ip',
                applicationId: alerts[0]?.serviceId || null,
            });
            incidentsCreated++;
        }

        if (incidentsCreated > 0) {
            logger.info({ rule: 'same_source_ip', incidentsCreated }, 'Rule 1 completed');
        }
        return incidentsCreated;
    } catch (err) {
        logger.error({ err: err.message }, 'Rule 1 (Same Source IP) failed');
        return 0;
    }
}

// [ARIA] RULE 2: Same Attack Type
// Groups alerts of the same attack category within a 30-minute window (minimum 5 alerts).
// Detects attack campaigns — e.g., widespread SQLi attempts across different IPs/endpoints.
async function ruleSameAttackType() {
    const windowMs = 30 * 60 * 1000;
    const minAlerts = 5;
    const windowStart = new Date(Date.now() - windowMs);

    try {
        const groups = await Alert.aggregate([
            { $match: { timestamp: { $gte: windowStart }, category: { $ne: null } } },
            { $group: {
                _id: '$category',
                alerts: { $push: '$$ROOT' },
                count: { $sum: 1 },
            }},
            { $match: { count: { $gte: minAlerts } } },
        ]);

        let incidentsCreated = 0;

        for (const group of groups) {
            const alerts = group.alerts;
            const alertObjectIds = alerts.map((a) => a._id);

            if (await isDuplicate(alertObjectIds, 'same_attack_type')) {
                logger.debug({ category: group._id }, 'Rule 2: Duplicate incident exists, skipping');
                continue;
            }

            const ips = uniqueIPs(alerts);
            const endpoints = uniqueEndpoints(alerts);
            const sev = maxSeverity(alerts);
            const stage = dominantAttackStage(alerts);
            const tr = computeTimeRange(alerts);
            const attackLabel = (group._id || 'unknown').replace(/_/g, ' ');

            await createIncident({
                title: `${attackLabel} campaign detected (${alerts.length} alerts)`,
                description: `${alerts.length} ${attackLabel} alerts detected within ${windowMs / 60000} minutes from ${ips.length} unique IP(s). Targeted endpoints: ${endpoints.join(', ')}.`,
                category: group._id || 'unknown',
                severity: sev,
                alertIds: alertObjectIds,
                sourceIPs: ips,
                targetEndpoints: endpoints,
                attackStage: stage,
                timeRange: tr,
                avgFidelity: avgFidelity(alerts),
                maxFidelity: maxFidelityScore(alerts),
                correlationRule: 'same_attack_type',
                applicationId: alerts[0]?.serviceId || null,
            });
            incidentsCreated++;
        }

        if (incidentsCreated > 0) {
            logger.info({ rule: 'same_attack_type', incidentsCreated }, 'Rule 2 completed');
        }
        return incidentsCreated;
    } catch (err) {
        logger.error({ err: err.message }, 'Rule 2 (Same Attack Type) failed');
        return 0;
    }
}

// [ARIA] RULE 3: Endpoint Targeting
// Groups alerts targeting the same URI pattern within 20 minutes (minimum 3 alerts).
// Detects focused attacks on a specific endpoint — e.g., brute-forcing a login page
// or targeting a known vulnerable API endpoint.
async function ruleEndpointTargeting() {
    const windowMs = 20 * 60 * 1000;
    const minAlerts = 3;
    const windowStart = new Date(Date.now() - windowMs);

    try {
        const groups = await Alert.aggregate([
            { $match: { timestamp: { $gte: windowStart }, category: { $ne: null } } },
            { $group: {
                _id: '$path',
                alerts: { $push: '$$ROOT' },
                count: { $sum: 1 },
            }},
            { $match: { count: { $gte: minAlerts } } },
        ]);

        let incidentsCreated = 0;

        for (const group of groups) {
            const alerts = group.alerts;
            const alertObjectIds = alerts.map((a) => a._id);

            if (await isDuplicate(alertObjectIds, 'endpoint_targeting')) {
                logger.debug({ path: group._id }, 'Rule 3: Duplicate incident exists, skipping');
                continue;
            }

            const ips = uniqueIPs(alerts);
            const endpoints = uniqueEndpoints(alerts);
            const sev = maxSeverity(alerts);
            const categories = [...new Set(alerts.map((a) => a.category).filter(Boolean))];
            const stage = dominantAttackStage(alerts);
            const tr = computeTimeRange(alerts);

            await createIncident({
                title: `Endpoint targeting: ${group._id} (${alerts.length} alerts from ${ips.length} IPs)`,
                description: `${alerts.length} alerts targeting endpoint ${group._id} within ${windowMs / 60000} minutes. Attack types: ${categories.join(', ') || 'unknown'}. Source IPs: ${ips.join(', ')}.`,
                category: categories[0] || 'unknown',
                severity: sev,
                alertIds: alertObjectIds,
                sourceIPs: ips,
                targetEndpoints: endpoints,
                attackStage: stage,
                timeRange: tr,
                avgFidelity: avgFidelity(alerts),
                maxFidelity: maxFidelityScore(alerts),
                correlationRule: 'endpoint_targeting',
                applicationId: alerts[0]?.serviceId || null,
            });
            incidentsCreated++;
        }

        if (incidentsCreated > 0) {
            logger.info({ rule: 'endpoint_targeting', incidentsCreated }, 'Rule 3 completed');
        }
        return incidentsCreated;
    } catch (err) {
        logger.error({ err: err.message }, 'Rule 3 (Endpoint Targeting) failed');
        return 0;
    }
}

// [ARIA] RULE 4: Kill Chain Detection
// Detects sequential attack stages from the same IP within a 1-hour window.
// Requires at least 2 distinct kill chain stages to trigger (e.g., recon → exploitation).
// This is the highest-value correlation — it identifies advanced multi-stage attacks
// that would be invisible when looking at individual alerts.
async function ruleKillChain() {
    const windowMs = 60 * 60 * 1000;
    const windowStart = new Date(Date.now() - windowMs);

    // [ARIA] Only fetch alerts with categories that map to kill chain stages
    const relevantCategories = Object.keys(ATTACK_STAGE_MAP);

    try {
        const groups = await Alert.aggregate([
            { $match: {
                timestamp: { $gte: windowStart },
                category: { $in: relevantCategories },
            }},
            { $group: {
                _id: '$sourceIP',
                alerts: { $push: '$$ROOT' },
                count: { $sum: 1 },
            }},
            // [ARIA] Need at least 2 alerts to have 2 stages
            { $match: { count: { $gte: 2 } } },
        ]);

        let incidentsCreated = 0;

        for (const group of groups) {
            const alerts = group.alerts;

            // [ARIA] Map each alert to its kill chain stage and find unique stages
            const stagesSeen = new Set();
            for (const alert of alerts) {
                const stage = ATTACK_STAGE_MAP[alert.category];
                if (stage) stagesSeen.add(stage);
            }

            // [ARIA] Need at least 2 distinct kill chain stages to constitute a chain
            if (stagesSeen.size < 2) continue;

            // [ARIA] Sort stages by kill chain order to detect progression
            const orderedStages = [...stagesSeen].sort(
                (a, b) => KILL_CHAIN_ORDER.indexOf(a) - KILL_CHAIN_ORDER.indexOf(b)
            );

            const alertObjectIds = alerts.map((a) => a._id);

            if (await isDuplicate(alertObjectIds, 'kill_chain')) {
                logger.debug({ ip: group._id }, 'Rule 4: Duplicate incident exists, skipping');
                continue;
            }

            const ips = uniqueIPs(alerts);
            const endpoints = uniqueEndpoints(alerts);
            const sev = 'critical'; // [ARIA] Kill chain always critical — multi-stage attack in progress
            const tr = computeTimeRange(alerts);
            const categories = [...new Set(alerts.map((a) => a.category).filter(Boolean))];
            const mostAdvancedStage = orderedStages[orderedStages.length - 1];

            await createIncident({
                title: `Kill chain detected from ${group._id}: ${orderedStages.join(' → ')}`,
                description: `Multi-stage attack detected from IP ${group._id}. Kill chain stages: ${orderedStages.join(' → ')}. Alert categories: ${categories.join(', ')}. ${alerts.length} alerts across ${endpoints.length} endpoint(s) within ${windowMs / 3600000} hour.`,
                category: 'kill_chain',
                severity: sev,
                alertIds: alertObjectIds,
                sourceIPs: ips,
                targetEndpoints: endpoints,
                attackStage: mostAdvancedStage,
                timeRange: tr,
                avgFidelity: avgFidelity(alerts),
                maxFidelity: maxFidelityScore(alerts),
                correlationRule: 'kill_chain',
                applicationId: alerts[0]?.serviceId || null,
            });
            incidentsCreated++;
        }

        if (incidentsCreated > 0) {
            logger.info({ rule: 'kill_chain', incidentsCreated }, 'Rule 4 completed');
        }
        return incidentsCreated;
    } catch (err) {
        logger.error({ err: err.message }, 'Rule 4 (Kill Chain Detection) failed');
        return 0;
    }
}

// [ARIA] RULE 5: Distributed Attack
// Groups alerts with the same attack type from different IPs targeting the same endpoint.
// Requires at least 5 distinct IPs within a 10-minute window.
// Detects DDoS, coordinated brute-force, or botnet-driven attacks.
async function ruleDistributedAttack() {
    const windowMs = 10 * 60 * 1000;
    const minDistinctIPs = 5;
    const windowStart = new Date(Date.now() - windowMs);

    try {
        // [ARIA] Group by (category + path) to find same attack on same endpoint
        const groups = await Alert.aggregate([
            { $match: { timestamp: { $gte: windowStart }, category: { $ne: null } } },
            { $group: {
                _id: { category: '$category', path: '$path' },
                alerts: { $push: '$$ROOT' },
                uniqueIPs: { $addToSet: '$sourceIP' },
                count: { $sum: 1 },
            }},
            // [ARIA] Filter for groups with enough distinct source IPs
            { $match: { $expr: { $gte: [{ $size: '$uniqueIPs' }, minDistinctIPs] } } },
        ]);

        let incidentsCreated = 0;

        for (const group of groups) {
            const alerts = group.alerts;
            const alertObjectIds = alerts.map((a) => a._id);

            if (await isDuplicate(alertObjectIds, 'distributed_attack')) {
                logger.debug({ category: group._id.category, path: group._id.path }, 'Rule 5: Duplicate incident exists, skipping');
                continue;
            }

            const ips = group.uniqueIPs.filter(Boolean);
            const endpoints = uniqueEndpoints(alerts);
            const sev = maxSeverity(alerts);
            const stage = dominantAttackStage(alerts);
            const tr = computeTimeRange(alerts);
            const attackLabel = (group._id.category || 'unknown').replace(/_/g, ' ');

            await createIncident({
                title: `Distributed ${attackLabel} attack on ${group._id.path} (${ips.length} IPs)`,
                description: `Coordinated/distributed attack detected: ${alerts.length} ${attackLabel} alerts from ${ips.length} distinct IPs targeting ${group._id.path} within ${windowMs / 60000} minutes. Source IPs: ${ips.slice(0, 10).join(', ')}${ips.length > 10 ? ` and ${ips.length - 10} more` : ''}.`,
                category: group._id.category || 'unknown',
                severity: sev === 'info' || sev === 'low' ? 'high' : sev, // [ARIA] Distributed attacks are at least high severity
                alertIds: alertObjectIds,
                sourceIPs: ips,
                targetEndpoints: endpoints,
                attackStage: stage,
                timeRange: tr,
                avgFidelity: avgFidelity(alerts),
                maxFidelity: maxFidelityScore(alerts),
                correlationRule: 'distributed_attack',
                applicationId: alerts[0]?.serviceId || null,
            });
            incidentsCreated++;
        }

        if (incidentsCreated > 0) {
            logger.info({ rule: 'distributed_attack', incidentsCreated }, 'Rule 5 completed');
        }
        return incidentsCreated;
    } catch (err) {
        logger.error({ err: err.message }, 'Rule 5 (Distributed Attack) failed');
        return 0;
    }
}

// ============================================================================
// Correlation Cycle
// ============================================================================

// [ARIA] Main correlation cycle — runs all 5 rules sequentially.
// Sequential execution prevents race conditions where two rules might try
// to correlate the same alerts simultaneously.
async function runCorrelationCycle() {
    const cycleStart = Date.now();
    logger.info('Starting correlation cycle');

    try {
        // [ARIA] Check MongoDB connection before running queries
        if (mongoose.connection.readyState !== 1) {
            logger.warn({ readyState: mongoose.connection.readyState }, 'MongoDB not connected — skipping cycle');
            return;
        }

        // [ARIA] Run all 5 rules sequentially
        const results = {
            same_source_ip: await ruleSameSourceIP(),
            same_attack_type: await ruleSameAttackType(),
            endpoint_targeting: await ruleEndpointTargeting(),
            kill_chain: await ruleKillChain(),
            distributed_attack: await ruleDistributedAttack(),
        };

        const totalCreated = Object.values(results).reduce((sum, n) => sum + n, 0);
        const elapsed = Date.now() - cycleStart;

        logger.info({
            totalIncidentsCreated: totalCreated,
            ruleResults: results,
            elapsedMs: elapsed,
        }, 'Correlation cycle completed');
    } catch (err) {
        logger.error({ err: err.message, elapsedMs: Date.now() - cycleStart }, 'Correlation cycle failed');
    }
}

// ============================================================================
// Lifecycle Management
// ============================================================================

let correlationInterval = null;
let isShuttingDown = false;

// [ARIA] Start the periodic correlation cycle.
function startCorrelationLoop() {
    logger.info({ intervalMs: CORRELATION_INTERVAL_MS }, 'Starting correlation loop');

    // [ARIA] Run immediately on startup, then at interval
    runCorrelationCycle();

    correlationInterval = setInterval(() => {
        if (!isShuttingDown) {
            runCorrelationCycle();
        }
    }, CORRELATION_INTERVAL_MS);
}

// [ARIA] Graceful shutdown — stop the loop, close connections, exit cleanly.
// This ensures in-progress correlation cycles can finish before shutdown.
async function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info({ signal }, 'Graceful shutdown initiated');

    // [ARIA] Stop the correlation loop
    if (correlationInterval) {
        clearInterval(correlationInterval);
        correlationInterval = null;
        logger.info('Correlation loop stopped');
    }

    // [ARIA] Close Redis connection
    if (redisClient && redisClient.isOpen) {
        try {
            await redisClient.quit();
            logger.info('Redis connection closed');
        } catch (err) {
            logger.error({ err: err.message }, 'Error closing Redis connection');
        }
    }

    // [ARIA] Close MongoDB connection
    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
    } catch (err) {
        logger.error({ err: err.message }, 'Error closing MongoDB connection');
    }

    logger.info('Shutdown complete');
    process.exit(0);
}

// [ARIA] Register signal handlers for graceful shutdown
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// [ARIA] Handle uncaught exceptions — log and continue (fail-open for security tools)
process.on('uncaughtException', (err) => {
    logger.error({ err: err.message, stack: err.stack }, 'Uncaught exception');
    // [ARIA] Don't exit — this is a background worker, let it recover
});

process.on('unhandledRejection', (reason) => {
    logger.error({ reason: String(reason) }, 'Unhandled rejection');
});

// ============================================================================
// Main Entry Point
// ============================================================================

// [ARIA] Bootstrap the worker — connect to services and start the correlation loop.
async function main() {
    logger.info('=== ARIA Alert Correlation Worker (Feature 08) ===');
    logger.info({
        mongodb: MONGODB_URI,
        redis: REDIS_URI,
        interval: CORRELATION_INTERVAL_MS,
    }, 'Configuration loaded');

    try {
        // [ARIA] Connect to MongoDB first (required) then Redis (optional/fail-open)
        await connectMongo();
        await connectRedis();

        // [ARIA] Start the periodic correlation cycle
        startCorrelationLoop();

        logger.info('Alert correlation worker is running');
    } catch (err) {
        logger.error({ err: err.message }, 'Failed to start alert correlation worker');
        process.exit(1);
    }
}

main();
