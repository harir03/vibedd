// ============================================================================
// ARIA — Adaptive Response & Intelligence Agent
// Reverse Proxy Gateway (Feature 01)
//
// Adapted from: maf-app/maf-engine/index.js
// This is the core traffic interception layer. Every HTTP request to protected
// banking services passes through this gateway for multi-layered threat detection.
//
// Key changes from MAF:
//   - Blockchain/ethers.js removed (commented out, see below)
//   - Auto-block replaced with human approval queue (all decisions are suggestions)
//   - Alert model replaces Log model (adds fidelity score, detection sources)
//   - Banking-specific regex patterns added
//   - Fidelity scoring engine added
//   - ProtectedService replaces Application model
//   - Redis channel renamed: maf-config-reload → aria-config-reload
// ============================================================================

const http = require('http');
const httpProxy = require('http-proxy');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const pino = require('pino');
const crypto = require('crypto');

// [ARIA] REMOVED: ethers.js blockchain dependency.
// This was used to log WAF decisions to an Ethereum smart contract (LogStorage.sol)
// for immutable audit trail. Replaced by MongoDB EvolutionChange collection.
// const { ethers } = require('ethers');

const logger = pino({ level: 'info' });
const proxy = httpProxy.createProxyServer({});

// --- Configuration ---
// [ARIA] CHANGED: Database name from maf_db → aria_db
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aria_db';
const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
// [ARIA] NEW: Ollama host made configurable via env var (for Docker networking)
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://aria-ai:11434';

// --- Database Schemas (Inline for simplicity in this microservice) ---

// [ARIA] REMOVED: Original MAF Log schema.
// This stored basic WAF request logs (ip, method, uri, status, attackType, aiAnalysis).
// Replaced by: Alert schema which adds fidelity scoring, detection source tracking,
// human triage status, and structured AI analysis.
// const LogSchema = new mongoose.Schema({
//     id: { type: String, required: true, unique: true },
//     time: { type: String, required: true },
//     ip: { type: String, required: true },
//     method: { type: String, required: true },
//     uri: { type: String, required: true },
//     status: { type: Number, required: true },
//     size: { type: String, required: true },
//     userAgent: { type: String },
//     referer: { type: String },
//     country: { type: String },
//     attackType: { type: String },
//     aiAnalysis: { type: String },
//     createdAt: { type: Date, default: Date.now },
//     applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' }
// });
// const Log = mongoose.model('Log', LogSchema);

// [ARIA] NEW: Alert schema — every gateway decision (both blocks AND allows) creates
// an alert that goes into the human triage queue. Analysts approve or reject the AI's
// decision, and that feedback drives the self-evolving agent.
const AlertSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    timestamp: { type: Date, default: Date.now },
    // Request metadata
    sourceIP: { type: String, required: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    headers: { type: mongoose.Schema.Types.Mixed },
    body: { type: String },                          // First 1KB of body
    userAgent: { type: String },
    // Detection results
    aiDecision: { type: String, enum: ['block', 'allow'], required: true },
    aiReasoning: { type: String },                    // LLM explanation
    detectionSources: [{ type: String }],             // ['regex', 'anomaly', 'ueba', 'llm']
    regexMatches: [{ type: String }],                 // Which regex patterns matched
    category: { type: String },                       // 'sqli', 'xss', 'traversal', 'credential_stuffing', etc.
    // Fidelity scoring
    fidelityScore: { type: Number, default: 0, min: 0, max: 100 },
    scores: {
        regex: { type: Number, default: 0 },          // 0-1 confidence from regex match
        llm: { type: Number, default: 0 },             // 0-1 confidence from Ollama
        anomaly: { type: Number, default: 0 },         // 0-1 from PyOD (future)
        ueba: { type: Number, default: 0 },            // 0-1 from UEBA (future)
    },
    severity: { type: String, enum: ['info', 'low', 'medium', 'high', 'critical'], default: 'info' },
    // Human triage
    triageStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'escalated'], default: 'pending' },
    analystId: { type: String },
    analystNotes: { type: String },
    triagedAt: { type: Date },
    // Context
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProtectedService' },
    serviceName: { type: String },
    responseStatus: { type: Number },
    responseSize: { type: String },
});
AlertSchema.index({ timestamp: -1 });
AlertSchema.index({ triageStatus: 1, fidelityScore: -1 });
AlertSchema.index({ sourceIP: 1, timestamp: -1 });
const Alert = mongoose.model('Alert', AlertSchema);

// [ARIA] NEW: Feedback schema — records analyst approve/reject decisions.
// This is the primary input for the self-evolving agent (Feature 10).
const FeedbackSchema = new mongoose.Schema({
    alertId: { type: String, required: true },
    analystId: { type: String, default: 'default-analyst' },
    aiDecision: { type: String, enum: ['block', 'allow'], required: true },
    humanDecision: { type: String, enum: ['approve', 'reject', 'escalate'], required: true },
    wasCorrect: { type: Boolean, required: true },
    fidelityScore: { type: Number },
    detectionSources: [{ type: String }],
    notes: { type: String },
    correctCategory: { type: String },
    timestamp: { type: Date, default: Date.now },
});
FeedbackSchema.index({ timestamp: -1 });
const Feedback = mongoose.model('Feedback', FeedbackSchema);

// [ARIA] REMOVED: Original MAF Application schema.
// This stored multi-app configs with ports, upstreams, defense modes, and blockchain config.
// Replaced by: ProtectedService schema which removes blockchain fields and adds
// ARIA-specific configuration (fidelity weights, banking context).
// const ApplicationSchema = new mongoose.Schema({
//     name: String,
//     domain: String,
//     ports: [{ protocol: String, port: String }],
//     upstreams: [String],
//     type: String,
//     defenseMode: String,
//     defenseStatus: Boolean,
//     loggingEnabled: { type: Boolean, default: true },
//     blockchainConfig: {
//         enabled: { type: Boolean, default: false },
//         rpcUrl: String,
//         privateKey: String,
//         contractAddress: String
//     }
// });
// const Application = mongoose.model('Application', ApplicationSchema);

// [ARIA] NEW: ProtectedService schema — config for the banking app being protected.
// Removes blockchain fields, adds ARIA-specific defense config.
const ProtectedServiceSchema = new mongoose.Schema({
    name: String,
    domain: String,
    ports: [{ protocol: String, port: String }],
    upstreams: [String],
    type: { type: String, default: 'Reverse Proxy' },       // 'Reverse Proxy', 'Static', 'Redirect'
    defenseMode: { type: String, default: 'Defense' },       // 'Defense', 'Audited', 'Offline'
    defenseStatus: { type: Boolean, default: true },
    loggingEnabled: { type: Boolean, default: true },
    aiModel: { type: String, default: 'mistral' },           // Ollama model name
    // [ARIA] NEW: Fidelity weight configuration (self-tuned by Feature 10)
    fidelityWeights: {
        regex: { type: Number, default: 0.20 },
        llm: { type: Number, default: 0.35 },
        anomaly: { type: Number, default: 0.25 },
        ueba: { type: Number, default: 0.20 },
    },
});
const ProtectedService = mongoose.model('ProtectedService', ProtectedServiceSchema);

// --- Proxy Logic ---
const activeServers = new Map(); // port -> server instance
const appConfigs = new Map(); // port -> latest app config

// Helper to buffer request body
// [ARIA] IMPROVED: Added MAX_BODY_SIZE limit to prevent memory exhaustion attacks.
// Original getRawBody had no size limit — an attacker could send a multi-GB body
// and crash the gateway. Now rejects bodies > 1MB.
const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1MB max body buffer

const getRawBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = [];
        let totalSize = 0;
        req.on('data', (chunk) => {
            totalSize += chunk.length;
            if (totalSize > MAX_BODY_SIZE) {
                req.destroy();
                reject(new Error(`Body exceeds maximum size of ${MAX_BODY_SIZE} bytes`));
                return;
            }
            body.push(chunk);
        }).on('end', () => {
            resolve(Buffer.concat(body));
        }).on('error', (err) => {
            reject(err);
        });
    });
};

// Regex patterns for local validation (GET/Query)
// [ARIA] KEPT: Original MAF regex patterns for SQLi, XSS, Traversal.
// These are the baseline detection patterns. The self-evolving agent (Feature 10)
// will generate additional patterns and hot-reload them via Redis pub/sub.
const SECURITY_PATTERNS = {
    SQLi: [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // Basic comments/quotes
        /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i, // logic
        /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i, // ' or '
        /((\%27)|(\'))union/i, // ' union
        /exec(\s|\+)+(s|x)p\w+/i, // exec sp_...
        /UNION(\s|\+)+SELECT/i,
        /DROP(\s|\+)+TABLE/i,
        /INSERT(\s|\+)+INTO/i,
        /SELECT(\s|\+)+.+FROM/i,
        /UPDATE(\s|\+)+.+SET/i,
        /DELETE(\s|\+)+FROM/i
    ],
    XSS: [
        /<script.*?>.*?<\/script>/is, // Basic script tag
        /javascript:/i, // javascript: protocol
        /on\w+=(\"|'|%22|%27).*/i, // Event handlers like onerror=
        /(\%3C)|<|((\%3E)|>)/i // < or > (Aggressive, might need tuning)
    ],
    Traversal: [
        /(\.\.\/)+/i, // ../../
        /(\%2e\%2e\%2f)+/i, // encoded ../
        /\/etc\/passwd/i,
        /\/windows\/win.ini/i
    ],
    // [ARIA] NEW: Command injection patterns (from mafai-package regex library)
    CommandInjection: [
        /[;&|`$]|\b(cat|ls|dir|wget|curl|bash|sh|cmd|powershell)\b/i,
        /\|\s*(cat|ls|id|whoami|uname|pwd)/i,
        /`[^`]*`/i,                          // Backtick command substitution
        /\$\([^)]+\)/i,                       // $() command substitution
    ],
    // [ARIA] NEW: Banking-specific attack patterns
    BankingThreats: [
        // Credential stuffing indicators — sequential account IDs
        /\/api\/(accounts|users)\/\d{4,}/i,
        // Mass account enumeration — numeric iteration
        /\/api\/(balance|profile|statement)\/\d+$/i,
        // Transaction manipulation — abnormally large amounts
        /"amount"\s*:\s*\d{7,}/i,                          // Amount > 1 million
        // IBAN/SWIFT injection attempts
        /['";]\s*(IBAN|SWIFT|BIC)\s*['";]/i,
        // Card number patterns in unexpected fields (PCI compliance)
        /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/,
        // Base64-encoded SQL (evasion technique)
        /(?:[A-Za-z0-9+\/]{4}){6,}(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?/,
    ],
};

// [ARIA] NEW: Dynamic patterns loaded from MongoDB (generated by self-evolving agent)
// These are hot-reloaded via Redis pub/sub channel 'aria-patterns-reload'
let dynamicPatterns = {};

// [ARIA] NEW: Merge static + dynamic patterns for analysis
function getAllPatterns() {
    const merged = { ...SECURITY_PATTERNS };
    for (const [category, patterns] of Object.entries(dynamicPatterns)) {
        if (merged[category]) {
            merged[category] = [...merged[category], ...patterns];
        } else {
            merged[category] = patterns;
        }
    }
    return merged;
}

// [ARIA] CHANGED: analyzeRequestWithRegex now returns matched patterns and confidence
// for fidelity scoring, instead of just a verdict string.
function analyzeRequestWithRegex(req, body = null) {
    const allPatterns = getAllPatterns();
    const matches = [];           // Track all pattern matches for fidelity scoring

    const checkString = (str) => {
        if (!str) return;
        for (const [type, patterns] of Object.entries(allPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(str)) {
                    matches.push({ type, pattern: pattern.toString() });
                }
            }
        }
    };

    // Check URL (includes query params)
    checkString(req.url);

    // Check Body if provided
    if (body) {
        checkString(body);
    }

    if (matches.length > 0) {
        // [ARIA] NEW: Regex confidence based on number and type of matches
        // Multiple matches from different categories = higher confidence
        const uniqueCategories = new Set(matches.map(m => m.type));
        const confidence = Math.min(1.0, 0.4 + (uniqueCategories.size * 0.15) + (matches.length * 0.05));
        const primaryCategory = matches[0].type;
        return {
            verdict: 'BLOCK',
            reason: `Pattern Match: ${[...uniqueCategories].join(', ')}`,
            matches,
            confidence,
            category: primaryCategory.toLowerCase(),
        };
    }

    return { verdict: 'ALLOW', reason: null, matches: [], confidence: 0, category: null };
}

async function startServer(app, portConfig) {
    const port = parseInt(portConfig.port);

    // Update the config map regardless of whether server exists
    appConfigs.set(port, app);

    if (activeServers.has(port)) {
        logger.info(`Server already running on port ${port} - Updated Config`);
        return;
    }

    const server = http.createServer(async (req, res) => {
        // ALWAYS fetch the latest config for this port
        const currentApp = appConfigs.get(port);
        if (!currentApp) {
            res.writeHead(500);
            res.end('Internal Server Error: App Config Missing');
            return;
        }

        const start = Date.now();
        const clientIp = req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
        req.logId = crypto.randomUUID(); // Generate unique ID for this request

        // --- DEFENSE MODES CHECK ---
        const mode = currentApp.defenseMode || (currentApp.defenseStatus ? 'Defense' : 'Audited'); // Backwards compat

        if (mode === 'Offline') {
            res.writeHead(403);
            res.end('<h1>Service Offline</h1><p>This service is currently offline.</p>');
            return;
        }

        // --- STATIC FILTERS (Optimization) ---
        // Skip all analysis for static assets
        if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|woff|woff2|ttf|svg|eot|mp4|webm|mp3|wav|json|map)$/i)) {
            // Proceed to proxy immediately, no AI, no Regex
            handleProxy(req, res, currentApp, port, start, clientIp, null);
            return;
        }

        // [ARIA] CHANGED: Complete rewrite of the security check flow.
        // OLD BEHAVIOR: Auto-block on regex/AI match → return 403 immediately.
        // NEW BEHAVIOR: Run all detection layers → compute fidelity score →
        //   create Alert in DB with triageStatus='pending' → proxy the request
        //   (or block if fidelity > 90 in Defense mode) → analyst reviews later.
        //
        // KEY PRINCIPLE: Both blocks AND allows go to the human triage queue.
        // The AI suggests, the human decides.

        let requestBodyBuffer = null;
        let regexResult = { verdict: 'ALLOW', reason: null, matches: [], confidence: 0, category: null };
        let aiResult = { verdict: 'ALLOW', reason: null, confidence: 0 };
        let bodyStr = '';

        // --- SECURITY CHECKS ---
        if (mode === 'Defense' || mode === 'Audited') {

            // 1. Regex scan (all methods)
            if (req.method === 'GET' || req.method === 'HEAD') {
                regexResult = analyzeRequestWithRegex(req);
            } else if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
                try {
                    requestBodyBuffer = await getRawBody(req);
                    bodyStr = requestBodyBuffer.toString('utf8');
                    regexResult = analyzeRequestWithRegex(req, bodyStr);
                } catch (err) {
                    logger.error("Body buffering error", err);
                }
            }

            // 2. AI analysis (for all non-GET methods, or if regex flagged a GET)
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || regexResult.verdict === 'BLOCK') {
                try {
                    aiResult = await analyzeRequestWithAI(req, currentApp, requestBodyBuffer);
                } catch (err) {
                    logger.error("AI analysis error", err);
                }
            }

            // 3. Compute fidelity score
            const fidelity = calculateFidelityScore(regexResult, aiResult, currentApp);
            const finalDecision = (regexResult.verdict === 'BLOCK' || aiResult.verdict === 'BLOCK') ? 'block' : 'allow';
            const detectionSources = [];
            if (regexResult.matches.length > 0) detectionSources.push('regex');
            if (aiResult.verdict === 'BLOCK') detectionSources.push('llm');

            // 4. Create alert in triage queue (BOTH blocks and allows)
            const severity = fidelityToSeverity(fidelity);
            try {
                await createAlert({
                    id: req.logId,
                    sourceIP: clientIp,
                    method: req.method,
                    path: req.url,
                    headers: {
                        'user-agent': req.headers['user-agent'],
                        'content-type': req.headers['content-type'],
                        'referer': req.headers['referer'],
                    },
                    body: bodyStr ? bodyStr.substring(0, 1024) : undefined,
                    userAgent: req.headers['user-agent'],
                    aiDecision: finalDecision,
                    aiReasoning: aiResult.reason || regexResult.reason || 'No threat detected',
                    detectionSources,
                    regexMatches: regexResult.matches.map(m => `${m.type}: ${m.pattern}`),
                    category: regexResult.category || aiResult.category || null,
                    fidelityScore: fidelity,
                    scores: {
                        regex: regexResult.confidence || 0,
                        llm: aiResult.confidence || 0,
                        anomaly: 0,    // Future: Feature 05
                        ueba: 0,       // Future: Feature 06
                    },
                    severity,
                    serviceId: currentApp._id,
                    serviceName: currentApp.name,
                });
            } catch (err) {
                logger.error('Failed to create alert', err);
            }

            // 5. Decision: block only high-fidelity threats in Defense mode
            // [ARIA] KEY CHANGE: In Defense mode, only auto-block if fidelity >= 90.
            // Everything else gets proxied and queued for human review.
            // In Audited mode, always proxy (log only).
            if (mode === 'Defense' && fidelity >= 90 && finalDecision === 'block') {
                req.blockReason = regexResult.reason || aiResult.reason;
                logger.warn(`BLOCKED (fidelity=${fidelity}) request from ${clientIp} to ${req.url}. Reason: ${req.blockReason}`);
                // [ARIA] Trigger detailed background AI analysis for blocked requests
                performBackgroundAnalysis(req, requestBodyBuffer, currentApp, req.logId, req.blockReason);
                // [ARIA] Still create the alert above (already done), but return 403
                if (!res.headersSent) {
                    res.writeHead(403, { 'Content-Type': 'text/plain' });
                    res.end('Blocked by ARIA Defense');
                }
                return;
            }

            // Attach for logging hook
            req.aiVerdict = aiResult;
            req.fidelityScore = fidelity;
        }

        // If we got here, request is proxied to the upstream.
        handleProxy(req, res, currentApp, port, start, clientIp, requestBodyBuffer);
    });

    // [ARIA] CHANGED: Logging hook now updates the existing Alert with response data
    // instead of creating a new Log entry. The Alert was already created during the
    // detection phase above.
    server.on('request', (req, res) => {
        let responseSize = 0;

        const originalWrite = res.write;
        const originalEnd = res.end;

        res.write = function (chunk, ...args) {
            if (chunk) responseSize += chunk.length;
            return originalWrite.apply(res, [chunk, ...args]);
        };

        res.end = function (chunk, ...args) {
            if (chunk) responseSize += chunk.length;

            res.once('finish', () => {
                const currentApp = appConfigs.get(port);
                if (currentApp && currentApp.loggingEnabled && req.logId) {
                    updateAlertWithResponse(req.logId, res.statusCode, responseSize);
                }
            });

            return originalEnd.apply(res, [chunk, ...args]);
        };
    });

    server.listen(port, () => {
        logger.info(`ARIA Gateway listening on port ${port} for service: ${app.name}`);
    });

    activeServers.set(port, server);
}

// [ARIA] REMOVED: Original blockRequest function that auto-blocked and logged to blockchain.
// The old flow was: detect threat → immediately return 403 → log to blockchain.
// The new flow is: detect threat → create alert in triage queue → block only if fidelity >= 90.
// All blocking logic is now inline in the server handler above.
//
// function blockRequest(res, reason, req, start, clientIp, currentApp, body = null) {
//     logger.warn(`BLOCKED request from ${clientIp} to ${req.url}. Reason: ${reason}`);
//     req.blockReason = reason;
//     if (req.logId) {
//         performBackgroundAnalysis(req, body, currentApp, req.logId, reason);
//         logToBlockchain(currentApp, req.logId, clientIp, req.method, req.url, reason);
//     }
//     if (!res.headersSent) {
//         res.writeHead(403, { 'Content-Type': 'text/plain' });
//         res.end('Blocked by MAF Defense');
//     }
// }

// [ARIA] NEW: Fidelity score calculator — combines scores from all detection modules
// into a single 0-100 priority score. Weights are configurable per-service and
// auto-tuned by the self-evolving agent (Feature 10 / threshold-tuning).
function calculateFidelityScore(regexResult, aiResult, app) {
    const weights = app.fidelityWeights || { regex: 0.20, llm: 0.35, anomaly: 0.25, ueba: 0.20 };

    const rawScore =
        (weights.regex * (regexResult.confidence || 0)) +
        (weights.llm * (aiResult.confidence || 0)) +
        (weights.anomaly * 0) +  // Future: Feature 05 anomaly score
        (weights.ueba * 0);       // Future: Feature 06 UEBA score

    // Context multipliers for banking scenarios
    let multiplier = 1.0;
    if (regexResult.category === 'bankingthreats') multiplier *= 1.3;
    if (regexResult.matches && regexResult.matches.length > 2) multiplier *= 1.2; // Multiple pattern hits
    // Future: add after-hours, admin endpoint, financial transaction multipliers

    return Math.min(100, Math.round(rawScore * 100 * multiplier));
}

// [ARIA] NEW: Map fidelity score to severity level for UI display
function fidelityToSeverity(fidelity) {
    if (fidelity >= 90) return 'critical';
    if (fidelity >= 70) return 'high';
    if (fidelity >= 40) return 'medium';
    if (fidelity >= 10) return 'low';
    return 'info';
}

// [ARIA] NEW: Create alert in MongoDB triage queue
async function createAlert(alertData) {
    try {
        if (mongoose.connection.readyState === 1) {
            await Alert.create(alertData);
            // Publish event for real-time dashboard updates
            if (redisClient.isOpen) {
                await redisClient.publish('aria-alerts', JSON.stringify({
                    id: alertData.id,
                    fidelityScore: alertData.fidelityScore,
                    severity: alertData.severity,
                    aiDecision: alertData.aiDecision,
                    sourceIP: alertData.sourceIP,
                    path: alertData.path,
                    category: alertData.category,
                    timestamp: new Date().toISOString(),
                }));
            }
        }
    } catch (err) {
        logger.error('Failed to create alert', err);
    }
}

function handleProxy(req, res, currentApp, port, start, clientIp, buffer) {
    const proxyOptions = {
        changeOrigin: true,
        xfwd: true,              // Add X-Forwarded-* headers
        autoRewrite: true,       // Rewrite redirects to match the proxy host
        cookieDomainRewrite: "", // Remove domain from cookies to make them host-only (fixes localhost issues)
        secure: false            // Allow self-signed certs on upstream
    };

    // Logic for different types
    if (currentApp.type === 'Reverse Proxy') {
        // Load balancing (Random selection if multiple upstreams)
        const upstreams = currentApp.upstreams && currentApp.upstreams.length > 0
            ? currentApp.upstreams
            : (currentApp.domain && currentApp.domain.startsWith('http') ? [currentApp.domain] : []);

        if (upstreams.length === 0) {
            res.writeHead(502);
            res.end('Bad Gateway: No upstream configured');
            return;
        }

        const target = upstreams[Math.floor(Math.random() * upstreams.length)];
        proxyOptions.target = target;

        // IMPORTANT: If we buffered the body, we must provide it to the proxy
        if (buffer) {
            const { Readable } = require('stream');
            proxyOptions.buffer = Readable.from(buffer);
        }

        proxy.web(req, res, proxyOptions, (err) => {
            logger.error(`Proxy error for ${currentApp.name} on port ${port} to ${target}:`, err);
            if (!res.headersSent) {
                res.writeHead(502);
                res.end('Bad Gateway');
            }
        });

    } else if (currentApp.type === 'Redirect') {
        let target = currentApp.upstreams[0] || (currentApp.domain && currentApp.domain.startsWith('http') ? currentApp.domain : null);
        if (target) {
            res.writeHead(307, { 'Location': target, 'Cache-Control': 'no-cache' });
            res.end();
        } else {
            res.writeHead(404);
            res.end('Not Found: No redirect target');
        }
    } else {
        res.writeHead(200);
        res.end('ARIA Protected Service (Static Placeholder)');
    }
}

// [ARIA] REMOVED: Blockchain logging via ethers.js → LogStorage.sol smart contract.
// This function logged every blocked request to an Ethereum smart contract for
// immutable audit trail. Required gas fees and a deployed contract.
// Replaced by: MongoDB Alert collection with triageStatus tracking + EvolutionChange
// collection for audit trail. Much simpler, no blockchain infrastructure needed.
//
// async function logToBlockchain(app, logId, ip, method, url, reason) {
//     if (!app.blockchainConfig || !app.blockchainConfig.enabled || !app.blockchainConfig.privateKey || !app.blockchainConfig.rpcUrl) {
//         return;
//     }
//     try {
//         const provider = new ethers.JsonRpcProvider(app.blockchainConfig.rpcUrl);
//         const wallet = new ethers.Wallet(app.blockchainConfig.privateKey, provider);
//         const abi = [
//             "function logBlockedRequest(string id, string ip, string method, string url, string reason) public"
//         ];
//         const contractAddress = app.blockchainConfig.contractAddress || process.env.LOG_CONTRACT_ADDRESS;
//         if (!contractAddress) {
//             logger.warn(`Blockchain logging enabled for ${app.name} but no Contract Address found.`);
//             return;
//         }
//         const contract = new ethers.Contract(contractAddress, abi, wallet);
//         const tx = await contract.logBlockedRequest(logId, ip, method, url, reason);
//         logger.info(`Blockchain Log TX Sent: ${tx.hash}`);
//     } catch (err) {
//         logger.error(`Blockchain logging failed for ${app.name}`, err);
//     }
// }


// --- AI Analysis Logic ---
async function analyzeRequestWithAI(req, app, bodyBuffer) {
    try {
        const bodyStr = bodyBuffer ? bodyBuffer.toString('utf8').substring(0, 1024) : ""; // Cap at 1KB

        // [ARIA] CHANGED: Enhanced prompt with banking context and confidence scoring.
        // Original prompt only asked for verdict + reason. New prompt adds:
        //   - Banking-specific threat categories
        //   - Confidence score output
        //   - Attack category classification
        const prompt = `
        You are ARIA, a cybersecurity threat analyst for banking applications.
        Analyze the following HTTP request for malicious content.
        
        Threat categories to check:
        - SQL Injection, XSS, Path Traversal, Command Injection
        - Credential Stuffing, Account Enumeration, Transaction Manipulation
        - Data Exfiltration, Privilege Escalation, API Abuse
        
        Method: ${req.method}
        URL: ${req.url}
        User-Agent: ${req.headers['user-agent']}
        Body (First 1KB): ${bodyStr}

        Reply strictly in JSON:
        {
            "verdict": "BLOCK" or "ALLOW",
            "reason": "Short summary (Max 20 words)",
            "confidence": 0.0 to 1.0,
            "category": "sqli|xss|traversal|command_injection|credential_stuffing|account_enumeration|transaction_manipulation|data_exfiltration|privilege_escalation|api_abuse|none"
        }
        `;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const modelToUse = app?.aiModel || 'mistral';

        // [ARIA] CHANGED: Use configurable Ollama host instead of hardcoded 'maf-ai'
        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelToUse,
                prompt: prompt,
                stream: false,
                format: "json"
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) return { verdict: 'ALLOW', reason: null, confidence: 0 };

        const data = await response.json();
        let result = { verdict: 'ALLOW', reason: null, confidence: 0 };

        try {
            const rawResponse = data.response.trim();
            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : rawResponse;
            const parsed = JSON.parse(jsonStr);
            result.verdict = parsed.verdict?.toUpperCase() || 'ALLOW';
            result.reason = parsed.reason || null;
            // [ARIA] NEW: Extract confidence from LLM response if provided
            result.confidence = parsed.confidence || (result.verdict === 'BLOCK' ? 0.8 : 0.2);
            result.category = parsed.category || null;
        } catch (e) {
            if (data.response.toUpperCase().includes('BLOCK')) {
                result.verdict = 'BLOCK';
                result.reason = "AI Triggered (Parse Error)";
                result.confidence = 0.6;
            }
        }

        if (result.verdict.includes('BLOCK')) return { verdict: 'BLOCK', reason: result.reason, confidence: result.confidence, category: result.category };
        return { verdict: 'ALLOW', reason: null, confidence: result.confidence, category: null };

    } catch (error) {
        return { verdict: 'ALLOW', reason: null };
    }
}

// [ARIA] CHANGED: performBackgroundAnalysis now uses OLLAMA_HOST and updates Alert
// instead of Log. Also enhanced the prompt for banking context.
async function performBackgroundAnalysis(req, body, app, logId, blockReason) {
    try {
        const bodyStr = body ? body.toString('utf8').substring(0, 1024) : "";

        const prompt = `
        You are ARIA, a cybersecurity analyst for a banking application.
        A request was flagged as suspicious.
        Initial Detection Reason: ${blockReason}
        
        Request:
        Method: ${req.method}
        URL: ${req.url}
        Body: ${bodyStr}
        
        Provide a detailed technical explanation (Max 50 words) of:
        1. The specific attack vector
        2. The potential impact on a banking system
        3. Recommended response action
        Do NOT use JSON. Return plain text.
        `;

        const modelToUse = app?.aiModel || 'mistral';

        // [ARIA] CHANGED: Use configurable OLLAMA_HOST instead of hardcoded 'maf-ai'
        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelToUse,
                prompt: prompt,
                stream: false
            })
        });

        if (response.ok) {
            const data = await response.json();
            const analysis = data.response.trim();

            // [ARIA] CHANGED: Update Alert instead of Log
            let retries = 3;
            while (retries > 0) {
                const updateProc = await Alert.updateOne(
                    { id: logId },
                    { $set: { aiReasoning: analysis } }
                );

                if (updateProc.modifiedCount > 0 || updateProc.matchedCount > 0) {
                    break;
                }

                await new Promise(r => setTimeout(r, 500));
                retries--;
            }
        }

    } catch (err) {
        logger.error("Background AI Analysis Failed", err);
    }
}

// --- Redis Client ---
const redisClient = createClient({ url: REDIS_URI });
redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Connected to Redis'));

// [ARIA] REMOVED: Original logRequest function that created Log documents.
// The old function wrote to the Log collection and published to 'maf-logs' Redis channel.
// Replaced by: createAlert function (above) which writes to the Alert collection
// with fidelity scores, detection sources, and triage status.
//
// async function logRequest(req, status, duration, ip, appId, size, attackType = null, aiAnalysis = null) {
//     try {
//         const logEntry = {
//             id: req.logId || crypto.randomUUID(),
//             time: new Date().toISOString(),
//             ip: ip, method: req.method, uri: req.url,
//             status: status, size: `${size}B`,
//             userAgent: req.headers['user-agent'],
//             referer: req.headers['referer'],
//             country: 'Unknown', attackType: attackType,
//             aiAnalysis: aiAnalysis, createdAt: new Date(),
//             applicationId: appId
//         };
//         if (mongoose.connection.readyState === 1) {
//             await Log.create(logEntry);
//         }
//         if (redisClient.isOpen) {
//             await redisClient.publish('maf-logs', JSON.stringify(logEntry));
//         }
//     } catch (e) {
//         logger.error('Failed to write log', e);
//     }
// }

// [ARIA] NEW: Update alert with response data after proxy completes
async function updateAlertWithResponse(logId, responseStatus, responseSize) {
    try {
        if (mongoose.connection.readyState === 1) {
            await Alert.updateOne(
                { id: logId },
                { $set: { responseStatus, responseSize: `${responseSize}B` } }
            );
        }
    } catch (e) {
        logger.error('Failed to update alert with response', e);
    }
}

// [ARIA] CHANGED: Load from ProtectedService collection instead of Application
async function loadConfiguration() {
    logger.info('Loading configuration from MongoDB...');
    try {
        // [ARIA] CHANGED: Query ProtectedService instead of Application
        const apps = await ProtectedService.find({});
        logger.info(`Found ${apps.length} protected services.`);
        for (const app of apps) {
            for (const portConfig of (app.ports || [])) {
                try {
                    await startServer(app, portConfig);
                } catch (err) {
                    logger.error(`Failed to start server for ${app.name} on port ${portConfig.port}`, err);
                }
            }
        }
    } catch (err) {
        logger.error('Failed to load apps', err);
    }

    // [ARIA] NEW: Load dynamic patterns generated by self-evolving agent (Feature 10)
    try {
        // Future: load from LearnedPattern collection
        // const patterns = await LearnedPattern.find({ type: 'regex', status: 'active' });
        // dynamicPatterns = groupByCategory(patterns);
    } catch (err) {
        logger.error('Failed to load dynamic patterns', err);
    }
}

// --- Initialization ---
async function init() {
    try {
        await mongoose.connect(MONGODB_URI);
        logger.info('Connected to MongoDB');

        await redisClient.connect();

        const subscriber = redisClient.duplicate();
        await subscriber.connect();

        // [ARIA] CHANGED: Redis channel renamed from 'maf-config-reload' to 'aria-config-reload'
        await subscriber.subscribe('aria-config-reload', (message) => {
            logger.info(`Received config reload signal: ${message}`);
            loadConfiguration();
        });

        // [ARIA] NEW: Subscribe to pattern reload channel (self-evolving agent pushes new regex)
        await subscriber.subscribe('aria-patterns-reload', (message) => {
            logger.info(`Received patterns reload signal: ${message}`);
            try {
                const update = JSON.parse(message);
                if (update.category && update.patterns) {
                    dynamicPatterns[update.category] = update.patterns.map(p => new RegExp(p.pattern, p.flags || 'i'));
                    logger.info(`Loaded ${update.patterns.length} dynamic patterns for category: ${update.category}`);
                }
            } catch (err) {
                logger.error('Failed to parse patterns reload message', err);
            }
        });

        await loadConfiguration();
        setInterval(loadConfiguration, 30000);

    } catch (err) {
       console.error("CRASH ERROR:", err);
        logger.error({ err }, 'Initialization failed');
        process.exit(1);
    }
}

init();

process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Closing servers...');
    for (const server of activeServers.values()) {
        server.close();
    }
    Promise.all([
        mongoose.connection.close(),
        redisClient.quit()
    ]).then(() => {
        process.exit(0);
    });
});
