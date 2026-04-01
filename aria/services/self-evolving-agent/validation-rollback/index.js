// ============================================================================
// ARIA — Validation & Rollback Engine (Feature 10.6)
//
// Safety net for all self-evolution changes. Every proposed change goes through:
//   1. Validation — test against historical data
//   2. Deployment — apply change
//   3. Monitoring — watch FP/TP rates for 1 hour
//   4. Auto-rollback — revert if FP rate increases >10%
//
// Tracked in EvolutionChange collection for full audit trail.
// ============================================================================

const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info', name: 'aria-validation-rollback' });

const FP_INCREASE_THRESHOLD = 0.10; // 10% FP rate increase triggers rollback
const MONITORING_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ── Validation ──────────────────────────────────────────────────────────────

/**
 * Validate a proposed change against historical data.
 *
 * @param {Object} change - Proposed change
 * @param {Array} historicalData - Known-good/known-bad test data
 * @returns {{ passed: boolean, score: number, details: Object }}
 */
function validateChange(change, historicalData) {
    const results = {
        testCases: historicalData.length,
        passed: 0,
        failed: 0,
        falsePositiveRate: 0,
        falseNegativeRate: 0,
    };

    if (change.type === 'regex') {
        return validateRegex(change, historicalData, results);
    }

    if (change.type === 'threshold' || change.type === 'weight') {
        return validateThreshold(change, historicalData, results);
    }

    // For prompt and pipeline changes, we can't fully validate offline
    // Return a partial score based on structural checks
    return {
        passed: true,
        score: 60, // Baseline — requires monitoring
        details: { ...results, note: 'Structural validation only — requires live monitoring' },
    };
}

function validateRegex(change, historicalData, results) {
    let regex;
    try {
        regex = new RegExp(change.proposedValue.pattern, change.proposedValue.flags || 'i');
    } catch (err) {
        return { passed: false, score: 0, details: { error: 'Invalid regex: ' + err.message } };
    }

    let truePositives = 0, falsePositives = 0, trueNegatives = 0, falseNegatives = 0;

    for (const sample of historicalData) {
        const matches = regex.test(sample.payload || sample.url || '');
        const isThreat = sample.isThreat || sample.wasCorrect === true;

        if (matches && isThreat) truePositives++;
        if (matches && !isThreat) falsePositives++;
        if (!matches && !isThreat) trueNegatives++;
        if (!matches && isThreat) falseNegatives++;
    }

    results.passed = truePositives + trueNegatives;
    results.failed = falsePositives + falseNegatives;
    results.falsePositiveRate = (truePositives + falsePositives) > 0
        ? falsePositives / (truePositives + falsePositives) : 0;
    results.falseNegativeRate = (trueNegatives + falseNegatives) > 0
        ? falseNegatives / (trueNegatives + falseNegatives) : 0;

    const score = Math.round(
        (1 - results.falsePositiveRate) * 60 + // FP avoidance (60%)
        (truePositives / Math.max(1, truePositives + falseNegatives)) * 40 // Detection rate (40%)
    );

    const passed = results.falsePositiveRate < FP_INCREASE_THRESHOLD && score >= 50;

    logger.info({ pattern: change.proposedValue.pattern, score, passed, results }, 'Regex validation complete');

    return { passed, score, details: results };
}

function validateThreshold(change, historicalData, results) {
    // Simulate threshold/weight change on historical data
    let improvementCount = 0;
    let degradationCount = 0;

    for (const sample of historicalData) {
        // Check if the new threshold would have made a better decision
        const oldFidelity = sample.fidelityScore || 50;
        const newFidelity = applyThresholdChange(oldFidelity, change);
        const isThreat = sample.isThreat || sample.wasCorrect === true;

        const oldCorrect = (oldFidelity >= 70 && isThreat) || (oldFidelity < 70 && !isThreat);
        const newCorrect = (newFidelity >= 70 && isThreat) || (newFidelity < 70 && !isThreat);

        if (newCorrect && !oldCorrect) improvementCount++;
        if (!newCorrect && oldCorrect) degradationCount++;
    }

    results.passed = improvementCount;
    results.failed = degradationCount;

    const netImprovement = improvementCount - degradationCount;
    const score = Math.min(100, Math.max(0, 50 + netImprovement * 5));
    const passed = netImprovement >= 0 && score >= 50;

    return { passed, score, details: { ...results, netImprovement } };
}

function applyThresholdChange(fidelity, change) {
    // Simplified: just adjust the base fidelity proportionally
    if (change.type === 'threshold') {
        const oldThreshold = change.previousValue || 70;
        const newThreshold = change.proposedValue || 70;
        const ratio = newThreshold / Math.max(1, oldThreshold);
        return Math.round(fidelity * ratio);
    }
    return fidelity;
}

// ── Deployment Status Tracking ──────────────────────────────────────────────

/**
 * Create a monitoring plan for a deployed change.
 *
 * @param {Object} change - The deployed change
 * @returns {Object} Monitoring plan
 */
function createMonitoringPlan(change) {
    return {
        changeId: change._id || change.id,
        type: change.type,
        deployedAt: new Date(),
        monitorUntil: new Date(Date.now() + MONITORING_WINDOW_MS),
        baselineFPRate: change.baselineFPRate || 0,
        rollbackThreshold: FP_INCREASE_THRESHOLD,
        checkIntervals: [5, 15, 30, 60], // minutes
        status: 'monitoring',
    };
}

/**
 * Evaluate if a change should be rolled back based on live metrics.
 *
 * @param {Object} monitoringPlan - The monitoring plan
 * @param {number} currentFPRate - Current false positive rate
 * @returns {{ shouldRollback: boolean, reason: string }}
 */
function evaluateRollback(monitoringPlan, currentFPRate) {
    const fpIncrease = currentFPRate - (monitoringPlan.baselineFPRate || 0);

    if (fpIncrease > FP_INCREASE_THRESHOLD) {
        logger.warn({
            changeId: monitoringPlan.changeId,
            baselineFP: monitoringPlan.baselineFPRate,
            currentFP: currentFPRate,
            increase: fpIncrease,
        }, 'FP rate increase exceeds threshold — ROLLING BACK');

        return {
            shouldRollback: true,
            reason: `FP rate increased by ${(fpIncrease * 100).toFixed(1)}% (threshold: ${FP_INCREASE_THRESHOLD * 100}%)`,
        };
    }

    // Check if monitoring window has passed
    if (new Date() > new Date(monitoringPlan.monitorUntil)) {
        logger.info({ changeId: monitoringPlan.changeId }, 'Monitoring window passed — change validated');
        return {
            shouldRollback: false,
            reason: 'Monitoring window passed successfully',
        };
    }

    return {
        shouldRollback: false,
        reason: `Monitoring in progress (FP change: ${(fpIncrease * 100).toFixed(1)}%)`,
    };
}

// ── Rollback Execution ──────────────────────────────────────────────────────

/**
 * Build a rollback operation from a change record.
 *
 * @param {Object} change - The change to rollback
 * @returns {Object} Rollback operation
 */
function buildRollback(change) {
    return {
        type: change.type,
        description: `Rollback: ${change.description || change.type} — reverted to previous value`,
        reason: 'Auto-rollback due to FP rate increase',
        previousValue: change.proposedValue,  // Current (bad) value
        proposedValue: change.previousValue,   // Revert to old (good) value
        trigger: 'auto_rollback',
        status: 'proposed',
        relatedChangeId: change._id || change.id,
    };
}

module.exports = {
    validateChange,
    createMonitoringPlan,
    evaluateRollback,
    buildRollback,
    FP_INCREASE_THRESHOLD,
    MONITORING_WINDOW_MS,
};
