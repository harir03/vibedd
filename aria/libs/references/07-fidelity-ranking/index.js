// ============================================================================
// ARIA — Fidelity Ranking Engine (Feature 07)
//
// The smart prioritization engine — takes detection scores from all modules
// (regex, anomaly, UEBA, LLM, time-series) and produces a single fidelity
// score (0-100) that tells analysts which alerts to look at first.
//
// Solves the #1 problem in cybersecurity: ALERT FATIGUE.
//
// Features:
//   - Weighted multi-source score aggregation
//   - Banking-context multipliers (financial transactions, admin, after-hours)
//   - Feedback-driven weight auto-tuning (connects to Feature 10)
//   - Historical pattern scoring
//   - Per-service configurable weights
//
// Usage:
//   const { calculateFidelity, adjustWeights } = require('./index');
//   const score = calculateFidelity(scores, context, weights);
// ============================================================================

const pino = require('pino');

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    name: 'aria-fidelity',
});

// ── Default Weights ─────────────────────────────────────────────────────────
// These are the initial weights. Feature 10 (Self-Tuning Thresholds) adjusts
// them based on analyst feedback accuracy per module.

const DEFAULT_WEIGHTS = {
    regex: 0.15,            // Regex pattern match confidence (Feature 01)
    anomaly: 0.25,          // PyOD anomaly score (Feature 05)
    ueba: 0.25,             // Behavioral deviation (Feature 06)
    llm: 0.25,              // Ollama/Mistral analysis confidence (Feature 01)
    timeSeries: 0.10,       // tsfresh temporal anomaly (Feature 05)
};

// ── Priority Thresholds ─────────────────────────────────────────────────────
const SEVERITY_THRESHOLDS = {
    critical: 90,           // Investigate immediately (auto-block in Defense mode)
    high: 70,               // Next in queue (likely real threat)
    medium: 40,             // Review when possible (suspicious but uncertain)
    low: 10,                // Background review (probably benign)
    info: 0,                // Auto-allow (log for audit)
};

// ── Context Multipliers ─────────────────────────────────────────────────────
// Banking-specific risk amplifiers

const CONTEXT_MULTIPLIERS = {
    isFinancialTransaction: 1.3,    // /transfer, /payment, /remit endpoints
    isAdminEndpoint: 1.5,           // /admin, /config, /settings
    isAfterHours: 1.2,              // Outside banking hours (IST 9:30-17:30)
    hasMultipleDetections: 1.4,     // Multiple detection modules flagged this
    isCardOperation: 1.4,           // /card, /pan, /cvv endpoints
    containsSensitiveData: 1.3,     // PAN, Aadhaar detected in body
    isAuthentication: 1.2,          // /login, /auth, /token endpoints
    isHighValueTransaction: 1.5,    // Transaction amount > threshold
    isRepeatedAttacker: 1.6,        // IP has been flagged before
    isNewIP: 1.1,                   // First time seeing this IP
};

const HIGH_VALUE_THRESHOLD = 100000; // INR 1 lakh

// ── Core Scoring Function ───────────────────────────────────────────────────

/**
 * Calculate the fidelity score for an alert.
 * 
 * @param {Object} scores - Detection scores from all modules (0-1 each)
 * @param {Object} context - Banking context (from log ingestion normalizer)
 * @param {Object} [weights] - Custom weights (defaults to DEFAULT_WEIGHTS)
 * @returns {{ score: number, severity: string, breakdown: Object }}
 */
function calculateFidelity(scores, context = {}, weights = null) {
    const w = weights || DEFAULT_WEIGHTS;

    // 1. Weighted score aggregation
    const rawScore =
        (w.regex || 0) * (scores.regexScore || 0) +
        (w.anomaly || 0) * (scores.anomalyScore || 0) +
        (w.ueba || 0) * (scores.uebaScore || 0) +
        (w.llm || 0) * (scores.llmScore || 0) +
        (w.timeSeries || 0) * (scores.timeSeriesScore || 0);

    // 2. Count how many detection sources fired
    const activeDetections = [
        scores.regexScore > 0.3,
        scores.anomalyScore > 0.3,
        scores.uebaScore > 0.3,
        scores.llmScore > 0.3,
        scores.timeSeriesScore > 0.3,
    ].filter(Boolean).length;

    // 3. Apply context multipliers
    let multiplier = 1.0;
    if (context.isFinancialTransaction) multiplier *= CONTEXT_MULTIPLIERS.isFinancialTransaction;
    if (context.isAdminEndpoint) multiplier *= CONTEXT_MULTIPLIERS.isAdminEndpoint;
    if (context.isAfterHours) multiplier *= CONTEXT_MULTIPLIERS.isAfterHours;
    if (activeDetections >= 2) multiplier *= CONTEXT_MULTIPLIERS.hasMultipleDetections;
    if (context.isCardOperation) multiplier *= CONTEXT_MULTIPLIERS.isCardOperation;
    if (context.containsSensitiveData) multiplier *= CONTEXT_MULTIPLIERS.containsSensitiveData;
    if (context.isAuthentication) multiplier *= CONTEXT_MULTIPLIERS.isAuthentication;
    if (context.transactionAmount > HIGH_VALUE_THRESHOLD) multiplier *= CONTEXT_MULTIPLIERS.isHighValueTransaction;
    if (context.isRepeatedAttacker) multiplier *= CONTEXT_MULTIPLIERS.isRepeatedAttacker;
    if (context.isNewIP) multiplier *= CONTEXT_MULTIPLIERS.isNewIP;

    // 4. Historical pattern bonus
    const historyBonus = (scores.historicalScore || 0) * 0.1; // Up to 10 points from history

    // 5. Compute final score (0-100)
    const finalScore = Math.min(100, Math.round((rawScore * 100 * multiplier) + historyBonus));

    // 6. Map to severity level
    const severity = scoreToSeverity(finalScore);

    // 7. Build breakdown for transparency
    const breakdown = {
        regexContribution: Math.round((w.regex || 0) * (scores.regexScore || 0) * 100),
        anomalyContribution: Math.round((w.anomaly || 0) * (scores.anomalyScore || 0) * 100),
        uebaContribution: Math.round((w.ueba || 0) * (scores.uebaScore || 0) * 100),
        llmContribution: Math.round((w.llm || 0) * (scores.llmScore || 0) * 100),
        timeSeriesContribution: Math.round((w.timeSeries || 0) * (scores.timeSeriesScore || 0) * 100),
        contextMultiplier: Math.round(multiplier * 100) / 100,
        historyBonus: Math.round(historyBonus),
        activeDetections,
        rawScore: Math.round(rawScore * 100),
        finalScore,
    };

    logger.debug({ scores, context: Object.keys(context).filter(k => context[k]), breakdown }, 'Fidelity calculated');

    return { score: finalScore, severity, breakdown };
}

// ── Severity Mapping ────────────────────────────────────────────────────────

function scoreToSeverity(score) {
    if (score >= SEVERITY_THRESHOLDS.critical) return 'critical';
    if (score >= SEVERITY_THRESHOLDS.high) return 'high';
    if (score >= SEVERITY_THRESHOLDS.medium) return 'medium';
    if (score >= SEVERITY_THRESHOLDS.low) return 'low';
    return 'info';
}

// ── Feedback-Weighted Adjustment ────────────────────────────────────────────
// When analysts approve/reject alerts, adjust future weights.
// This connects to Feature 10 (Self-Tuning Thresholds).

/**
 * Adjust detection module weights based on analyst feedback.
 * 
 * Algorithm:
 *   - For each feedback, check which modules had the highest/lowest scores
 *   - If the analyst says "false positive" → decrease weight of modules that scored high
 *   - If the analyst says "true positive" → increase weight of modules that scored high
 *   - Normalize weights to sum to 1.0
 *   - Use exponential moving average to smooth changes
 * 
 * @param {Array} feedbackBatch - Array of { wasCorrect, originalScores, decision }
 * @param {Object} currentWeights - Current module weights
 * @param {number} [learningRate=0.05] - How aggressively to adjust (0-1)
 * @returns {{ newWeights: Object, changes: Array }}
 */
function adjustWeights(feedbackBatch, currentWeights, learningRate = 0.05) {
    const w = { ...currentWeights };
    const changes = [];
    const modules = Object.keys(DEFAULT_WEIGHTS);

    for (const feedback of feedbackBatch) {
        const { wasCorrect, originalScores } = feedback;

        if (!originalScores) continue;

        for (const mod of modules) {
            const scoreKey = mod + 'Score';
            const moduleScore = originalScores[scoreKey] || 0;

            if (wasCorrect) {
                // True positive/negative — reward modules that scored correctly
                if (moduleScore > 0.5) {
                    // Module helped make the right call, increase weight
                    const adjustment = learningRate * moduleScore;
                    w[mod] = (w[mod] || DEFAULT_WEIGHTS[mod]) + adjustment;
                    changes.push({ module: mod, direction: 'increase', amount: adjustment, reason: 'correct_high_score' });
                }
            } else {
                // False positive/negative — penalize modules that scored high
                if (moduleScore > 0.5) {
                    // Module contributed to wrong decision, decrease weight
                    const adjustment = learningRate * moduleScore;
                    w[mod] = Math.max(0.05, (w[mod] || DEFAULT_WEIGHTS[mod]) - adjustment);
                    changes.push({ module: mod, direction: 'decrease', amount: adjustment, reason: 'incorrect_high_score' });
                }
            }
        }
    }

    // Normalize weights to sum to 1.0
    const total = modules.reduce((sum, mod) => sum + (w[mod] || 0), 0);
    for (const mod of modules) {
        w[mod] = Math.round((w[mod] / total) * 1000) / 1000; // Round to 3 decimals
    }

    logger.info({ oldWeights: currentWeights, newWeights: w, feedbackCount: feedbackBatch.length, changeCount: changes.length }, 'Weights adjusted from feedback');

    return { newWeights: w, changes };
}

// ── Historical IP Scoring ───────────────────────────────────────────────────
// Check if this IP has been seen before in alerts

/**
 * Calculate historical score based on IP reputation.
 * 
 * @param {string} ip - Source IP address
 * @param {Object} recentAlerts - Map of IP → { count, maxFidelity, lastSeen }
 * @returns {number} Historical score 0-1
 */
function calculateHistoricalScore(ip, recentAlerts = {}) {
    const history = recentAlerts[ip];
    if (!history) return 0;

    // More previous alerts = higher historical score
    const countFactor = Math.min(1.0, history.count / 10); // Max out at 10 previous alerts
    // Higher previous fidelity = higher historical score
    const fidelityFactor = (history.maxFidelity || 0) / 100;
    // Recent alerts matter more
    const recencyMs = Date.now() - (history.lastSeen || 0);
    const recencyFactor = Math.max(0, 1 - (recencyMs / (24 * 60 * 60 * 1000))); // Decay over 24h

    return (countFactor * 0.4) + (fidelityFactor * 0.4) + (recencyFactor * 0.2);
}

// ── Batch Ranking ───────────────────────────────────────────────────────────

/**
 * Rank a batch of alerts by fidelity score (highest first).
 * Used by the triage queue to determine display order.
 * 
 * @param {Array} alerts - Array of alert objects with scores and context
 * @param {Object} [weights] - Custom weights
 * @returns {Array} Sorted alerts with fidelity scores attached
 */
function rankAlerts(alerts, weights = null) {
    return alerts
        .map(alert => {
            const result = calculateFidelity(
                alert.scores || {},
                alert.context || {},
                weights
            );
            return { ...alert, fidelityScore: result.score, severity: result.severity, fidelityBreakdown: result.breakdown };
        })
        .sort((a, b) => b.fidelityScore - a.fidelityScore);
}

// ── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
    calculateFidelity,
    adjustWeights,
    calculateHistoricalScore,
    rankAlerts,
    scoreToSeverity,
    DEFAULT_WEIGHTS,
    SEVERITY_THRESHOLDS,
    CONTEXT_MULTIPLIERS,
};
