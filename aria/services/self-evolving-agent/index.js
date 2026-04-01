// ============================================================================
// ARIA — Self-Evolving Agent Orchestrator (Feature 10)
//
// The core innovation — an AI agent that improves its own detection system.
// Coordinates all sub-modules:
//   - regex-evolution: generates new regex patterns
//   - prompt-evolution: rewrites LLM prompts
//   - threshold-tuning: adjusts fidelity weights & severity thresholds
//   - validation-rollback: validates + auto-rolls back bad changes
//
// Runs as a standalone worker: reads analyst feedback from MongoDB,
// proposes improvements, validates them, deploys via Redis, monitors results.
//
// Usage: node index.js (standalone worker)
// ============================================================================

const mongoose = require('mongoose');
const Redis = require('ioredis');
const pino = require('pino');

const { generateRegexPatterns } = require('./regex-evolution');
const { evolvePrompt, deployPrompt } = require('./prompt-evolution');
const { calculateModuleAccuracy, optimizeWeights, optimizeThresholds } = require('./threshold-tuning');
const { validateChange, createMonitoringPlan, evaluateRollback, buildRollback } = require('./validation-rollback');

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    name: 'aria-self-evolving',
});

// ── Config ──────────────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aria_db';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const EVOLUTION_INTERVAL_MS = parseInt(process.env.EVOLUTION_INTERVAL || '300000'); // 5 minutes
const MIN_FEEDBACK_FOR_EVOLUTION = parseInt(process.env.MIN_FEEDBACK || '5');

// ── Mongoose Schemas (inline for standalone operation) ──────────────────────

const FeedbackSchema = new mongoose.Schema({
    alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert' },
    decision: { type: String, enum: ['approve', 'reject', 'escalate'] },
    wasCorrect: { type: Boolean },
    analystNotes: String,
    analystId: String,
    originalScores: mongoose.Schema.Types.Mixed,
    fidelityScore: Number,
    category: String,
    method: String,
    url: String,
    payload: mongoose.Schema.Types.Mixed,
    sourceIP: String,
}, { timestamps: true });

const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);

const AlertSchema = new mongoose.Schema({
    sourceIP: String, method: String, url: String,
    attackType: String, category: String, severity: String,
    fidelityScore: Number, decision: String, detectionSource: String,
    requestBody: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const Alert = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);

const LearnedPatternSchema = new mongoose.Schema({
    pattern: { type: String, required: true },
    flags: { type: String, default: 'i' },
    category: String,
    description: String,
    confidence: { type: Number, min: 0, max: 1 },
    source: { type: String, enum: ['ai_generated', 'human_created', 'evolved'], default: 'ai_generated' },
    status: { type: String, enum: ['proposed', 'testing', 'active', 'disabled', 'rolled_back'], default: 'proposed' },
    hitCount: { type: Number, default: 0 },
    falsePositiveCount: { type: Number, default: 0 },
    validationResults: mongoose.Schema.Types.Mixed,
    evolutionChangeId: { type: mongoose.Schema.Types.ObjectId, ref: 'EvolutionChange' },
}, { timestamps: true });

const LearnedPattern = mongoose.models.LearnedPattern || mongoose.model('LearnedPattern', LearnedPatternSchema);

const EvolutionChangeSchema = new mongoose.Schema({
    type: { type: String, enum: ['regex', 'prompt', 'pipeline', 'threshold', 'model', 'weight'], required: true },
    description: String,
    reason: String,
    previousValue: mongoose.Schema.Types.Mixed,
    proposedValue: mongoose.Schema.Types.Mixed,
    trigger: { type: String, enum: ['feedback', 'scheduled', 'threshold_breach', 'manual', 'auto_tune', 'auto_rollback'], default: 'feedback' },
    feedbackIds: [{ type: mongoose.Schema.Types.ObjectId }],
    validationScore: { type: Number, min: 0, max: 100 },
    validationDetails: mongoose.Schema.Types.Mixed,
    status: { type: String, enum: ['proposed', 'testing', 'deployed', 'monitoring', 'validated', 'rolled_back', 'rejected'], default: 'proposed' },
    performanceMetrics: mongoose.Schema.Types.Mixed,
    affectedModule: String,
    createdBy: { type: String, default: 'aria-agent' },
}, { timestamps: true });

const EvolutionChange = mongoose.models.EvolutionChange || mongoose.model('EvolutionChange', EvolutionChangeSchema);

// ── State ───────────────────────────────────────────────────────────────────

let redis = null;
let lastEvolutionRun = new Date(0);
let currentWeights = {
    regex: 0.15, anomaly: 0.25, ueba: 0.25, llm: 0.25, timeSeries: 0.10,
};
let currentThresholds = { critical: 90, high: 70, medium: 40, low: 10 };

// ── Evolution Orchestrator ──────────────────────────────────────────────────

async function runEvolutionCycle() {
    logger.info('Starting evolution cycle...');

    // 1. Gather recent unprocessed feedback
    const feedback = await Feedback.find({
        createdAt: { $gt: lastEvolutionRun },
    }).lean();

    if (feedback.length < MIN_FEEDBACK_FOR_EVOLUTION) {
        logger.info({ feedbackCount: feedback.length, required: MIN_FEEDBACK_FOR_EVOLUTION },
            'Not enough new feedback for evolution');
        return;
    }

    const falsePositives = feedback.filter(f => f.decision === 'approve' && f.wasCorrect === false);
    const falseNegatives = feedback.filter(f => f.decision === 'reject');
    const truePositives = feedback.filter(f => f.decision === 'approve' && f.wasCorrect !== false);

    logger.info({
        totalFeedback: feedback.length,
        falsePositives: falsePositives.length,
        falseNegatives: falseNegatives.length,
        truePositives: truePositives.length,
    }, 'Feedback analysis');

    // 2. Run all evolution sub-modules
    const results = {
        regex: null,
        prompt: null,
        weights: null,
        thresholds: null,
    };

    // 2a. Regex Evolution
    try {
        results.regex = await evolveRegexPatterns(falseNegatives, falsePositives);
    } catch (err) {
        logger.error({ err: err.message }, 'Regex evolution failed');
    }

    // 2b. Prompt Evolution
    try {
        results.prompt = await evolveAnalysisPrompt(falsePositives, falseNegatives, truePositives);
    } catch (err) {
        logger.error({ err: err.message }, 'Prompt evolution failed');
    }

    // 2c. Weight Optimization
    try {
        results.weights = await evolveWeights(feedback);
    } catch (err) {
        logger.error({ err: err.message }, 'Weight evolution failed');
    }

    // 2d. Threshold Optimization
    try {
        results.thresholds = await evolveThresholds(feedback);
    } catch (err) {
        logger.error({ err: err.message }, 'Threshold evolution failed');
    }

    lastEvolutionRun = new Date();

    logger.info({
        newPatterns: results.regex?.length || 0,
        promptEvolved: !!results.prompt,
        weightsChanged: !!results.weights,
        thresholdsChanged: !!results.thresholds,
    }, 'Evolution cycle complete');
}

// ── Sub-Module Runners ──────────────────────────────────────────────────────

async function evolveRegexPatterns(falseNegatives, falsePositives) {
    // Get existing patterns from DB
    const existingPatterns = await LearnedPattern.find({
        status: { $in: ['active', 'testing'] },
    }).select('pattern flags category').lean();

    // Get confirmed attack data (alerts that analysts approved as real threats)
    const confirmedAttacks = await Alert.find({
        _id: { $in: falseNegatives.map(f => f.alertId).filter(Boolean) },
    }).select('url method requestBody attackType').lean();

    if (confirmedAttacks.length === 0) {
        logger.info('No confirmed attacks for regex evolution');
        return [];
    }

    // Generate new patterns via LLM
    const newPatterns = await generateRegexPatterns(
        confirmedAttacks.map(a => ({
            payload: a.requestBody ? JSON.stringify(a.requestBody) : a.url,
            url: a.url,
        })),
        falsePositives.map(fp => ({ payload: fp.payload || fp.url, url: fp.url })),
        existingPatterns,
    );

    // Validate each pattern
    const deployed = [];
    for (const pattern of newPatterns) {
        // Create evolution change record
        const change = await EvolutionChange.create({
            type: 'regex',
            description: `New ${pattern.category} pattern: /${pattern.pattern}/${pattern.flags}`,
            reason: `Generated from ${confirmedAttacks.length} confirmed attacks`,
            proposedValue: pattern,
            trigger: 'feedback',
            feedbackIds: falseNegatives.map(f => f._id),
            validationScore: Math.round(pattern.confidence * 100),
            validationDetails: pattern.validationResults,
            status: 'testing',
            affectedModule: 'gateway-regex',
            createdBy: 'aria-agent',
        });

        // Save as learned pattern
        const learned = await LearnedPattern.create({
            ...pattern,
            evolutionChangeId: change._id,
        });

        // Publish to gateway for hot-reload
        await redis.publish('aria-patterns-reload', JSON.stringify({
            action: 'add',
            pattern: pattern.pattern,
            flags: pattern.flags,
            category: pattern.category,
            patternId: learned._id.toString(),
        }));

        // Update change status
        await EvolutionChange.findByIdAndUpdate(change._id, { status: 'deployed' });

        deployed.push(learned);
        logger.info({ pattern: pattern.pattern, category: pattern.category }, 'New regex pattern deployed');
    }

    return deployed;
}

async function evolveAnalysisPrompt(falsePositives, falseNegatives, truePositives) {
    if (falsePositives.length + falseNegatives.length < 3) {
        return null; // Not enough errors to justify a prompt change
    }

    // Get current prompt from Redis or use default
    const currentPrompt = await redis.get('aria:current-prompt') || getDefaultPrompt();

    const result = await evolvePrompt(
        currentPrompt,
        falsePositives,
        falseNegatives,
        truePositives,
    );

    if (!result) return null;

    // Create evolution change record
    const change = await EvolutionChange.create({
        type: 'prompt',
        description: `Prompt evolution: ${result.changes.join('; ')}`,
        reason: `${falsePositives.length} FPs + ${falseNegatives.length} FNs`,
        previousValue: currentPrompt,
        proposedValue: result.newPrompt,
        trigger: 'feedback',
        feedbackIds: [...falsePositives, ...falseNegatives].map(f => f._id),
        validationScore: Math.round(result.confidence * 100),
        status: 'testing',
        affectedModule: 'gateway-llm',
        createdBy: 'aria-agent',
    });

    // Deploy to Ollama
    const deployResult = await deployPrompt(result.newPrompt);

    if (deployResult.success) {
        await redis.set('aria:current-prompt', result.newPrompt);
        await EvolutionChange.findByIdAndUpdate(change._id, { status: 'deployed' });

        // Notify gateway to use new model
        await redis.publish('aria-config-reload', JSON.stringify({
            type: 'prompt-update',
            model: 'aria-policeman',
        }));

        logger.info({ changeId: change._id, confidence: result.confidence }, 'Prompt evolution deployed');
        return result;
    } else {
        await EvolutionChange.findByIdAndUpdate(change._id, {
            status: 'rejected',
            validationDetails: { error: deployResult.error },
        });
        return null;
    }
}

async function evolveWeights(feedback) {
    const moduleAccuracy = calculateModuleAccuracy(feedback);
    const { newWeights, recommendation } = optimizeWeights(moduleAccuracy, currentWeights);

    // Check if weights actually changed
    const changed = Object.keys(newWeights).some(k =>
        Math.abs((newWeights[k] || 0) - (currentWeights[k] || 0)) > 0.01
    );

    if (!changed) return null;

    // Create evolution change record
    const change = await EvolutionChange.create({
        type: 'weight',
        description: recommendation,
        reason: 'Module accuracy analysis',
        previousValue: currentWeights,
        proposedValue: newWeights,
        trigger: 'auto_tune',
        validationScore: 70,
        validationDetails: moduleAccuracy,
        status: 'deployed',
        affectedModule: 'fidelity-ranking',
        createdBy: 'aria-agent',
    });

    // Update state and broadcast
    currentWeights = newWeights;
    await redis.set('aria:fidelity-weights', JSON.stringify(newWeights));
    await redis.publish('aria-config-reload', JSON.stringify({
        type: 'weight-update',
        weights: newWeights,
    }));

    logger.info({ changeId: change._id, newWeights }, 'Fidelity weights updated');
    return newWeights;
}

async function evolveThresholds(feedback) {
    const { newThresholds, changes } = optimizeThresholds(feedback, currentThresholds);

    if (changes.length === 0) return null;

    const change = await EvolutionChange.create({
        type: 'threshold',
        description: changes.join('; '),
        reason: 'FP rate analysis per severity level',
        previousValue: currentThresholds,
        proposedValue: newThresholds,
        trigger: 'auto_tune',
        validationScore: 65,
        status: 'deployed',
        affectedModule: 'fidelity-ranking',
        createdBy: 'aria-agent',
    });

    currentThresholds = newThresholds;
    await redis.set('aria:severity-thresholds', JSON.stringify(newThresholds));
    await redis.publish('aria-config-reload', JSON.stringify({
        type: 'threshold-update',
        thresholds: newThresholds,
    }));

    logger.info({ changeId: change._id, newThresholds, changes }, 'Severity thresholds updated');
    return newThresholds;
}

// ── Monitoring Loop ─────────────────────────────────────────────────────────

async function monitorDeployedChanges() {
    const monitoring = await EvolutionChange.find({
        status: 'deployed',
        createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // Last 2 hours
    }).lean();

    for (const change of monitoring) {
        const plan = createMonitoringPlan(change);

        // Calculate current FP rate from recent feedback
        const recentFeedback = await Feedback.find({
            createdAt: { $gte: change.createdAt },
        }).lean();

        if (recentFeedback.length < 3) continue; // Not enough data to evaluate

        const fpRate = recentFeedback.filter(f => !f.wasCorrect).length / recentFeedback.length;
        const evaluation = evaluateRollback(plan, fpRate);

        if (evaluation.shouldRollback) {
            logger.warn({ changeId: change._id, reason: evaluation.reason }, 'Rolling back change');

            const rollbackOp = buildRollback(change);
            const rollbackRecord = await EvolutionChange.create(rollbackOp);

            // Apply rollback based on type
            if (change.type === 'regex') {
                await redis.publish('aria-patterns-reload', JSON.stringify({
                    action: 'remove',
                    pattern: change.proposedValue?.pattern,
                }));
                await LearnedPattern.updateMany(
                    { evolutionChangeId: change._id },
                    { status: 'rolled_back' },
                );
            } else if (change.type === 'prompt' && change.previousValue) {
                await deployPrompt(change.previousValue);
                await redis.set('aria:current-prompt', change.previousValue);
            } else if (change.type === 'weight' && change.previousValue) {
                currentWeights = change.previousValue;
                await redis.set('aria:fidelity-weights', JSON.stringify(change.previousValue));
            } else if (change.type === 'threshold' && change.previousValue) {
                currentThresholds = change.previousValue;
                await redis.set('aria:severity-thresholds', JSON.stringify(change.previousValue));
            }

            await EvolutionChange.findByIdAndUpdate(change._id, { status: 'rolled_back' });
            await EvolutionChange.findByIdAndUpdate(rollbackRecord._id, { status: 'deployed' });

            logger.info({ changeId: change._id, rollbackId: rollbackRecord._id }, 'Rollback complete');
        } else if (new Date() > new Date(plan.monitorUntil)) {
            // Monitoring passed — validate the change
            await EvolutionChange.findByIdAndUpdate(change._id, { status: 'validated' });
            logger.info({ changeId: change._id }, 'Change validated after monitoring window');
        }
    }
}

// ── Default Prompt ──────────────────────────────────────────────────────────

function getDefaultPrompt() {
    return `You are a strict firewall protecting a banking web application. Your job is to analyze incoming HTTP requests for malicious payloads, security violations, and suspicious patterns.

Focus on detecting:
- SQL Injection (UNION, OR 1=1, DROP TABLE, etc.)
- Cross-Site Scripting (XSS) (<script>, onerror, javascript:, etc.)
- Command Injection (|, ;, &&, backticks, etc.)
- Path Traversal (../, etc., /etc/passwd, etc.)
- Credential Stuffing (rapid repeated login attempts)
- Data Exfiltration (unusual data access patterns)

Banking-specific considerations:
- Flag attempts to access transaction endpoints with SQL payloads
- Block attempts to manipulate account numbers or amounts
- Watch for unusual patterns in payment/transfer endpoints

Return a JSON response: { "success": boolean, "reason": string }
"success": true means the request is SAFE.
"success": false means the request should be BLOCKED.`;
}

// ── Worker Startup ──────────────────────────────────────────────────────────

async function startWorker() {
    logger.info('Starting ARIA Self-Evolving Agent...');

    await mongoose.connect(MONGO_URI);
    logger.info({ db: MONGO_URI.replace(/\/\/.*@/, '//***@') }, 'MongoDB connected');

    redis = new Redis(REDIS_URL);
    logger.info('Redis connected');

    // Load saved weights/thresholds
    const savedWeights = await redis.get('aria:fidelity-weights');
    if (savedWeights) currentWeights = JSON.parse(savedWeights);

    const savedThresholds = await redis.get('aria:severity-thresholds');
    if (savedThresholds) currentThresholds = JSON.parse(savedThresholds);

    logger.info({ currentWeights, currentThresholds }, 'Loaded saved configuration');

    // Run evolution cycle periodically
    const evolutionLoop = async () => {
        try {
            await runEvolutionCycle();
            await monitorDeployedChanges();
        } catch (err) {
            logger.error({ err: err.message }, 'Evolution cycle error');
        }
    };

    // First run after 30 seconds (let system stabilize)
    setTimeout(evolutionLoop, 30000);

    // Then every EVOLUTION_INTERVAL_MS
    setInterval(evolutionLoop, EVOLUTION_INTERVAL_MS);

    logger.info({ intervalMs: EVOLUTION_INTERVAL_MS }, 'Self-evolving agent running');

    // Graceful shutdown
    const shutdown = async () => {
        logger.info('Shutting down self-evolving agent...');
        redis.disconnect();
        await mongoose.disconnect();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

// If run directly, start worker
if (require.main === module) {
    startWorker().catch(err => {
        logger.fatal({ err: err.message }, 'Self-evolving agent crashed');
        process.exit(1);
    });
}

module.exports = {
    runEvolutionCycle,
    monitorDeployedChanges,
    evolveRegexPatterns,
    evolveAnalysisPrompt,
    evolveWeights,
    evolveThresholds,
};
