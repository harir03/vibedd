// ============================================================================
// ARIA — Model Fine-Tuning Worker (Feature 11)
//
// A standalone Node.js worker that periodically fine-tunes the Ollama LLM
// using confirmed analyst feedback. This closes the feedback loop: analysts
// approve/reject AI decisions → those labeled examples become training data →
// the model improves → fewer false positives → less analyst workload.
//
// Flow:
//   1. Every 24h (configurable), query Feedback collection for analyst-confirmed threats
//   2. Format as Ollama conversation pairs (user = request, assistant = classification)
//   3. Call Ollama /api/create to build fine-tuned model `aria-policeman`
//   4. Validate the new model against known-good and known-bad samples
//   5. If validation passes (>80% accuracy), publish model name via Redis
//   6. Log everything in EvolutionChange collection
//
// Usage: node index.js (standalone worker, Docker or manual)
// ============================================================================

const mongoose = require('mongoose');
const { createClient } = require('redis');
const pino = require('pino');

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    name: 'aria-model-finetuning',
});

// ── Configuration ───────────────────────────────────────────────────────────

// [ARIA] Config: all tunable via env vars for Docker Compose overrides
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aria_db';
const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const BASE_MODEL = process.env.BASE_MODEL || 'mistral';
const FINETUNED_MODEL_NAME = process.env.FINETUNED_MODEL_NAME || 'aria-policeman';
const FINETUNE_INTERVAL_MS = parseInt(process.env.FINETUNE_INTERVAL_MS || String(24 * 60 * 60 * 1000)); // 24 hours
const MIN_TRAINING_SAMPLES = parseInt(process.env.MIN_TRAINING_SAMPLES || '20');
const VALIDATION_THRESHOLD = parseFloat(process.env.VALIDATION_THRESHOLD || '0.80'); // 80% accuracy
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3');
const RETRY_DELAY_MS = parseInt(process.env.RETRY_DELAY_MS || '5000');

// ── Mongoose Schemas (inline, like gateway pattern — mongoose ^8) ───────────

// [ARIA] Alert schema — mirrors gateway's Alert, read-only here
const AlertSchema = new mongoose.Schema({
    id: { type: String },
    sourceIP: { type: String },
    method: { type: String },
    path: { type: String },
    headers: { type: mongoose.Schema.Types.Mixed },
    body: { type: String },
    userAgent: { type: String },
    aiDecision: { type: String, enum: ['block', 'allow'] },
    aiReasoning: { type: String },
    detectionSources: [{ type: String }],
    regexMatches: [{ type: String }],
    category: { type: String },
    fidelityScore: { type: Number, default: 0 },
    severity: { type: String, enum: ['info', 'low', 'medium', 'high', 'critical'] },
    triageStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'escalated'] },
    serviceId: { type: mongoose.Schema.Types.ObjectId },
    serviceName: { type: String },
}, { timestamps: true });
const Alert = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);

// [ARIA] Feedback schema — analyst decisions on alerts, our training data source
const FeedbackSchema = new mongoose.Schema({
    alertId: { type: String, required: true },
    analystId: { type: String, default: 'default-analyst' },
    aiDecision: { type: String, enum: ['block', 'allow'] },
    humanDecision: { type: String, enum: ['approve', 'reject', 'escalate'], required: true },
    wasCorrect: { type: Boolean, required: true },
    fidelityScore: { type: Number },
    detectionSources: [{ type: String }],
    notes: { type: String },
    correctCategory: { type: String },
    timestamp: { type: Date, default: Date.now },
});
FeedbackSchema.index({ timestamp: -1 });
const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);

// [ARIA] EvolutionChange schema — audit trail for every fine-tuning attempt
const EvolutionChangeSchema = new mongoose.Schema({
    type: { type: String, enum: ['regex', 'prompt', 'pipeline', 'threshold', 'model', 'weight'], required: true },
    description: { type: String },
    reason: { type: String },
    previousValue: { type: mongoose.Schema.Types.Mixed },
    proposedValue: { type: mongoose.Schema.Types.Mixed },
    trigger: { type: String, enum: ['feedback', 'scheduled', 'threshold_breach', 'manual', 'auto_tune', 'auto_rollback'], default: 'scheduled' },
    feedbackIds: [{ type: mongoose.Schema.Types.ObjectId }],
    validationScore: { type: Number, min: 0, max: 100 },
    validationDetails: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: ['proposed', 'testing', 'deployed', 'monitoring', 'validated', 'rolled_back', 'rejected'], default: 'proposed' },
    performanceMetrics: { type: mongoose.Schema.Types.Mixed },
    affectedModule: { type: String },
    createdBy: { type: String, default: 'aria-model-finetuning' },
}, { timestamps: true });
const EvolutionChange = mongoose.models.EvolutionChange || mongoose.model('EvolutionChange', EvolutionChangeSchema);

// ── State ───────────────────────────────────────────────────────────────────

let redisClient = null;
let isShuttingDown = false;
let finetuneTimer = null;
let lastFinetuneTimestamp = null;

// ── Known Validation Samples ────────────────────────────────────────────────

// [ARIA] Known-good requests (should be classified as ALLOW / safe)
const KNOWN_GOOD_SAMPLES = [
    { method: 'GET', path: '/api/accounts/balance', body: '', expected: 'allow' },
    { method: 'POST', path: '/api/transfer', body: '{"from":"ACC001","to":"ACC002","amount":50.00}', expected: 'allow' },
    { method: 'GET', path: '/api/users/profile', body: '', expected: 'allow' },
    { method: 'POST', path: '/api/login', body: '{"username":"john","password":"securePass123"}', expected: 'allow' },
    { method: 'GET', path: '/api/transactions?page=1&limit=20', body: '', expected: 'allow' },
    { method: 'PUT', path: '/api/users/settings', body: '{"notifications":true,"language":"en"}', expected: 'allow' },
    { method: 'GET', path: '/api/exchange-rates', body: '', expected: 'allow' },
    { method: 'POST', path: '/api/payments', body: '{"payee":"Electric Co","amount":120.50,"reference":"BILL-2025"}', expected: 'allow' },
    { method: 'GET', path: '/api/cards/list', body: '', expected: 'allow' },
    { method: 'DELETE', path: '/api/notifications/12345', body: '', expected: 'allow' },
];

// [ARIA] Known-bad requests (should be classified as BLOCK / malicious)
const KNOWN_BAD_SAMPLES = [
    { method: 'GET', path: "/api/users?id=1' OR 1=1--", body: '', expected: 'block' },
    { method: 'POST', path: '/api/data', body: '{"name":"<script>alert(document.cookie)</script>"}', expected: 'block' },
    { method: 'GET', path: '/api/files?path=../../etc/passwd', body: '', expected: 'block' },
    { method: 'POST', path: '/api/login', body: '{"username":"admin\' OR \'1\'=\'1","password":"x"}', expected: 'block' },
    { method: 'POST', path: '/api/transfer', body: '{"from":"ACC001","to":"ACC002","amount":99999999999}', expected: 'block' },
    { method: 'GET', path: '/api/users?callback=<img src=x onerror=alert(1)>', body: '', expected: 'block' },
    { method: 'POST', path: '/api/comment', body: '{"text":"test\'); DROP TABLE users;--"}', expected: 'block' },
    { method: 'PUT', path: '/api/users/1; EXEC xp_cmdshell(\'net user hacker pass /add\')', body: '', expected: 'block' },
    { method: 'GET', path: '/api/search?q=UNION SELECT username,password FROM users--', body: '', expected: 'block' },
    { method: 'POST', path: '/api/upload', body: '<?php system($_GET["cmd"]); ?>', expected: 'block' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

// [ARIA] Retry wrapper for network calls (Ollama, Redis)
async function withRetry(fn, label, retries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            logger.warn({ attempt, retries, err: err.message }, `[ARIA] ${label} failed, attempt ${attempt}/${retries}`);
            if (attempt === retries) throw err;
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
        }
    }
}

// [ARIA] Collect confirmed feedback data for training
async function collectTrainingData() {
    logger.info('[ARIA] Collecting confirmed feedback for training data...');

    // Find feedback where analyst approved the AI decision (confirmed threats)
    // or rejected it (false positives/negatives) — both are valuable training signals
    const query = { humanDecision: { $in: ['approve', 'reject'] } };

    // If we've fine-tuned before, only collect new feedback since last run
    if (lastFinetuneTimestamp) {
        query.timestamp = { $gte: lastFinetuneTimestamp };
    }

    const feedbackDocs = await Feedback.find(query).sort({ timestamp: -1 }).lean();
    logger.info(`[ARIA] Found ${feedbackDocs.length} feedback records`);

    if (feedbackDocs.length < MIN_TRAINING_SAMPLES) {
        logger.info(`[ARIA] Not enough samples (${feedbackDocs.length}/${MIN_TRAINING_SAMPLES}), skipping fine-tune`);
        return null;
    }

    // Fetch the corresponding alerts for request context
    const alertIds = feedbackDocs.map(f => f.alertId);
    const alerts = await Alert.find({ id: { $in: alertIds } }).lean();
    const alertMap = new Map(alerts.map(a => [a.id, a]));

    // [ARIA] Build conversation pairs for Ollama fine-tuning format
    const trainingPairs = [];
    for (const fb of feedbackDocs) {
        const alert = alertMap.get(fb.alertId);
        if (!alert) {
            logger.warn({ alertId: fb.alertId }, '[ARIA] Alert not found for feedback, skipping');
            continue;
        }

        // User message = the HTTP request details the model should analyze
        const userMessage = [
            `Analyze this HTTP request for security threats:`,
            `Method: ${alert.method ?? 'UNKNOWN'}`,
            `Path: ${alert.path ?? '/'}`,
            `User-Agent: ${alert.userAgent ?? 'N/A'}`,
            `Body: ${(alert.body ?? '').substring(0, 500)}`,
        ].join('\n');

        // Determine the correct classification based on analyst feedback
        let correctDecision;
        let correctReason;
        if (fb.humanDecision === 'approve') {
            // Analyst agreed with AI — the AI's decision was correct
            correctDecision = fb.aiDecision ?? 'block';
            correctReason = `Confirmed: ${alert.category ?? 'suspicious'} activity detected. ${alert.aiReasoning ?? ''}`;
        } else {
            // Analyst rejected the AI decision — opposite is correct
            correctDecision = fb.aiDecision === 'block' ? 'allow' : 'block';
            correctReason = fb.notes ?? `Analyst corrected: AI said ${fb.aiDecision}, actual was ${correctDecision}`;
        }

        // Assistant message = the correct classification (what the model should learn)
        const assistantMessage = JSON.stringify({
            success: correctDecision === 'allow',
            reason: correctReason,
            category: fb.correctCategory ?? alert.category ?? 'unknown',
            severity: alert.severity ?? 'medium',
        });

        trainingPairs.push({ user: userMessage, assistant: assistantMessage });
    }

    logger.info(`[ARIA] Built ${trainingPairs.length} training pairs from feedback`);
    return { pairs: trainingPairs, feedbackIds: feedbackDocs.map(f => f._id) };
}

// [ARIA] Build the system prompt incorporating training signals
function buildSystemPrompt(trainingPairs) {
    // Build a comprehensive system prompt with embedded examples
    const exampleSection = trainingPairs.slice(0, 50).map((pair, i) => {
        return `Example ${i + 1}:\nRequest: ${pair.user}\nCorrect Response: ${pair.assistant}`;
    }).join('\n\n');

    return [
        'You are ARIA-Policeman, a strict cybersecurity firewall AI protecting banking web applications.',
        'Your job is to analyze each HTTP request and determine if it is safe or malicious.',
        '',
        'You MUST respond ONLY with a JSON object: { "success": boolean, "reason": string, "category": string, "severity": string }',
        '- "success": true means the request is SAFE and should be ALLOWED',
        '- "success": false means the request is MALICIOUS and should be BLOCKED',
        '- "category": one of sqli, xss, traversal, credential_stuffing, rce, data_exfiltration, or safe',
        '- "severity": one of info, low, medium, high, critical',
        '',
        'Known attack patterns to watch for:',
        '- SQL injection: UNION SELECT, OR 1=1, DROP TABLE, etc.',
        '- XSS: <script>, onerror=, javascript:, event handlers',
        '- Path traversal: ../, /etc/passwd, /windows/win.ini',
        '- Command injection: ; exec, $(), backticks, pipe commands',
        '- Banking fraud: impossible transfer amounts, credential stuffing patterns',
        '',
        'Here are confirmed analyst-verified examples to learn from:',
        '',
        exampleSection,
    ].join('\n');
}

// [ARIA] Create the fine-tuned model via Ollama API
async function createFinetunedModel(systemPrompt) {
    logger.info(`[ARIA] Creating fine-tuned model "${FINETUNED_MODEL_NAME}" from "${BASE_MODEL}"...`);

    const createBody = {
        model: FINETUNED_MODEL_NAME,
        from: BASE_MODEL,
        system: systemPrompt,
        stream: false,
    };

    const response = await withRetry(async () => {
        const res = await fetch(`${OLLAMA_HOST}/api/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createBody),
            signal: AbortSignal.timeout(120000), // 2 minute timeout for model creation
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Ollama /api/create failed: ${res.status} — ${errorText}`);
        }

        return await res.json();
    }, 'Ollama model creation');

    logger.info(`[ARIA] Model "${FINETUNED_MODEL_NAME}" created successfully`);
    return response;
}

// [ARIA] Test the model with a single sample via Ollama chat API
async function testSample(sample) {
    const userMessage = [
        'Analyze this HTTP request for security threats:',
        `Method: ${sample.method}`,
        `Path: ${sample.path}`,
        `Body: ${sample.body}`,
    ].join('\n');

    try {
        const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: FINETUNED_MODEL_NAME,
                messages: [{ role: 'user', content: userMessage }],
                stream: false,
                options: { temperature: 0.1 },
            }),
            signal: AbortSignal.timeout(30000), // 30s per sample
        });

        if (!res.ok) {
            logger.warn({ status: res.status }, '[ARIA] Ollama chat call failed during validation');
            return { passed: false, reason: `HTTP ${res.status}` };
        }

        const data = await res.json();
        const content = data?.message?.content ?? '';

        // Try to parse the JSON response from the model
        let parsed;
        try {
            // Handle cases where model wraps JSON in markdown code blocks
            const jsonMatch = content.match(/\{[\s\S]*?\}/);
            parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
        } catch {
            logger.warn({ content: content.substring(0, 200) }, '[ARIA] Model returned non-JSON, treating as fail');
            return { passed: false, reason: 'Non-JSON response' };
        }

        // Check if the model's decision matches expected
        const modelDecision = parsed.success === true ? 'allow' : 'block';
        const passed = modelDecision === sample.expected;

        return { passed, modelDecision, expectedDecision: sample.expected, reason: parsed.reason ?? '' };
    } catch (err) {
        logger.warn({ err: err.message }, '[ARIA] Validation sample test error');
        return { passed: false, reason: err.message };
    }
}

// [ARIA] Validate the fine-tuned model against known samples
async function validateModel() {
    logger.info('[ARIA] Validating fine-tuned model against known samples...');

    const allSamples = [...KNOWN_GOOD_SAMPLES, ...KNOWN_BAD_SAMPLES];
    const results = [];

    for (const sample of allSamples) {
        const result = await testSample(sample);
        results.push({ ...result, sample });

        // Small delay between calls to avoid overwhelming Ollama
        await new Promise(r => setTimeout(r, 500));
    }

    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const accuracy = total > 0 ? passed / total : 0;

    // Break down results by category
    const goodResults = results.slice(0, KNOWN_GOOD_SAMPLES.length);
    const badResults = results.slice(KNOWN_GOOD_SAMPLES.length);
    const goodAccuracy = goodResults.filter(r => r.passed).length / KNOWN_GOOD_SAMPLES.length;
    const badAccuracy = badResults.filter(r => r.passed).length / KNOWN_BAD_SAMPLES.length;

    logger.info({
        passed,
        total,
        accuracy: (accuracy * 100).toFixed(1) + '%',
        goodAccuracy: (goodAccuracy * 100).toFixed(1) + '%',
        badAccuracy: (badAccuracy * 100).toFixed(1) + '%',
    }, '[ARIA] Validation results');

    return {
        accuracy,
        passed,
        total,
        goodAccuracy,
        badAccuracy,
        details: results,
    };
}

// ── Main Fine-Tuning Cycle ──────────────────────────────────────────────────

// [ARIA] Single fine-tuning cycle: collect → train → validate → deploy
async function runFinetuneCycle() {
    if (isShuttingDown) return;

    const cycleStart = Date.now();
    logger.info('═══════════════════════════════════════════════════');
    logger.info('[ARIA] Starting model fine-tuning cycle...');

    // Create an EvolutionChange record to track this attempt
    const evolutionRecord = new EvolutionChange({
        type: 'model',
        description: `Fine-tune ${FINETUNED_MODEL_NAME} from ${BASE_MODEL} with analyst feedback`,
        reason: 'Scheduled periodic fine-tuning from confirmed analyst feedback',
        trigger: 'scheduled',
        status: 'proposed',
        affectedModule: 'ollama-model',
        previousValue: { model: FINETUNED_MODEL_NAME, base: BASE_MODEL },
    });

    try {
        // Step 1: Collect training data
        const trainingData = await collectTrainingData();

        if (!trainingData) {
            evolutionRecord.status = 'rejected';
            evolutionRecord.validationDetails = { reason: 'Insufficient training samples' };
            await evolutionRecord.save();
            logger.info('[ARIA] Fine-tuning skipped — insufficient data');
            return;
        }

        evolutionRecord.feedbackIds = trainingData.feedbackIds;
        evolutionRecord.status = 'testing';
        await evolutionRecord.save();

        // Step 2: Build system prompt with training examples
        const systemPrompt = buildSystemPrompt(trainingData.pairs);
        evolutionRecord.proposedValue = {
            model: FINETUNED_MODEL_NAME,
            base: BASE_MODEL,
            trainingPairsCount: trainingData.pairs.length,
            systemPromptLength: systemPrompt.length,
        };
        await evolutionRecord.save();

        // Step 3: Create the model via Ollama
        await createFinetunedModel(systemPrompt);

        // Step 4: Validate the new model
        const validation = await validateModel();
        evolutionRecord.validationScore = Math.round(validation.accuracy * 100);
        evolutionRecord.validationDetails = {
            accuracy: validation.accuracy,
            passed: validation.passed,
            total: validation.total,
            goodAccuracy: validation.goodAccuracy,
            badAccuracy: validation.badAccuracy,
        };

        // Step 5: Check if validation passes threshold
        if (validation.accuracy >= VALIDATION_THRESHOLD) {
            // Deploy: publish model name to Redis so gateway picks it up
            evolutionRecord.status = 'deployed';
            await evolutionRecord.save();

            if (redisClient?.isOpen) {
                await redisClient.publish('aria-config-reload', JSON.stringify({
                    type: 'model-update',
                    model: FINETUNED_MODEL_NAME,
                    accuracy: validation.accuracy,
                    timestamp: new Date().toISOString(),
                }));
                logger.info(`[ARIA] Published model update to Redis: ${FINETUNED_MODEL_NAME} (${(validation.accuracy * 100).toFixed(1)}% accuracy)`);
            } else {
                logger.warn('[ARIA] Redis not connected, could not publish model update');
            }

            lastFinetuneTimestamp = new Date();

            logger.info({
                model: FINETUNED_MODEL_NAME,
                accuracy: (validation.accuracy * 100).toFixed(1) + '%',
                trainingPairs: trainingData.pairs.length,
                durationMs: Date.now() - cycleStart,
            }, '[ARIA] Fine-tuning SUCCEEDED — model deployed');
        } else {
            // Validation failed — do not deploy
            evolutionRecord.status = 'rejected';
            await evolutionRecord.save();

            logger.warn({
                accuracy: (validation.accuracy * 100).toFixed(1) + '%',
                threshold: (VALIDATION_THRESHOLD * 100).toFixed(1) + '%',
            }, '[ARIA] Fine-tuning FAILED validation — model NOT deployed');
        }

        evolutionRecord.performanceMetrics = {
            durationMs: Date.now() - cycleStart,
            trainingPairsUsed: trainingData.pairs.length,
        };
        await evolutionRecord.save();

    } catch (err) {
        logger.error({ err: err.message, stack: err.stack }, '[ARIA] Fine-tuning cycle ERRORED');

        evolutionRecord.status = 'rejected';
        evolutionRecord.validationDetails = { error: err.message };
        try {
            await evolutionRecord.save();
        } catch (saveErr) {
            logger.error({ err: saveErr.message }, '[ARIA] Failed to save evolution record after error');
        }
    }
}

// ── Lifecycle ───────────────────────────────────────────────────────────────

// [ARIA] Connect to MongoDB with retry
async function connectMongo() {
    await withRetry(async () => {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        logger.info(`[ARIA] Connected to MongoDB: ${MONGO_URI}`);
    }, 'MongoDB connection');
}

// [ARIA] Connect to Redis with retry
async function connectRedis() {
    redisClient = createClient({ url: REDIS_URI });
    redisClient.on('error', (err) => logger.error({ err: err.message }, '[ARIA] Redis error'));
    redisClient.on('reconnecting', () => logger.info('[ARIA] Redis reconnecting...'));

    await withRetry(async () => {
        await redisClient.connect();
        logger.info(`[ARIA] Connected to Redis: ${REDIS_URI}`);
    }, 'Redis connection');
}

// [ARIA] Graceful shutdown handler
async function shutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`[ARIA] Received ${signal}, shutting down gracefully...`);

    // Clear the periodic timer
    if (finetuneTimer) {
        clearInterval(finetuneTimer);
        finetuneTimer = null;
    }

    // Disconnect Redis
    try {
        if (redisClient?.isOpen) {
            await redisClient.quit();
            logger.info('[ARIA] Redis disconnected');
        }
    } catch (err) {
        logger.warn({ err: err.message }, '[ARIA] Error disconnecting Redis');
    }

    // Disconnect MongoDB
    try {
        await mongoose.disconnect();
        logger.info('[ARIA] MongoDB disconnected');
    } catch (err) {
        logger.warn({ err: err.message }, '[ARIA] Error disconnecting MongoDB');
    }

    logger.info('[ARIA] Shutdown complete');
    process.exit(0);
}

// ── Entry Point ─────────────────────────────────────────────────────────────

async function main() {
    logger.info('═══════════════════════════════════════════════════');
    logger.info('[ARIA] Model Fine-Tuning Worker starting...');
    logger.info({
        mongoUri: MONGO_URI,
        redisUri: REDIS_URI,
        ollamaHost: OLLAMA_HOST,
        baseModel: BASE_MODEL,
        finetunedModelName: FINETUNED_MODEL_NAME,
        intervalMs: FINETUNE_INTERVAL_MS,
        minSamples: MIN_TRAINING_SAMPLES,
        validationThreshold: VALIDATION_THRESHOLD,
    }, '[ARIA] Configuration');

    // Register graceful shutdown
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('uncaughtException', (err) => {
        logger.fatal({ err: err.message, stack: err.stack }, '[ARIA] Uncaught exception');
        shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason) => {
        logger.fatal({ reason: String(reason) }, '[ARIA] Unhandled rejection');
    });

    // Connect to services
    await connectMongo();
    await connectRedis();

    // Run first cycle immediately
    logger.info('[ARIA] Running initial fine-tuning cycle...');
    await runFinetuneCycle();

    // Schedule periodic cycles
    finetuneTimer = setInterval(async () => {
        if (!isShuttingDown) {
            await runFinetuneCycle();
        }
    }, FINETUNE_INTERVAL_MS);

    logger.info(`[ARIA] Scheduled fine-tuning every ${FINETUNE_INTERVAL_MS / 1000}s (${(FINETUNE_INTERVAL_MS / 3600000).toFixed(1)}h)`);
    logger.info('[ARIA] Model Fine-Tuning Worker running. Press Ctrl+C to stop.');
}

main().catch((err) => {
    logger.fatal({ err: err.message, stack: err.stack }, '[ARIA] Fatal error during startup');
    process.exit(1);
});
