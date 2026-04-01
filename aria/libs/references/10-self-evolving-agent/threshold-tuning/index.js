// ============================================================================
// ARIA — Self-Tuning Thresholds (Feature 10.5)
//
// Automatically adjusts detection thresholds and fidelity weights based on
// analyst feedback accuracy per detection module. If a module consistently
// produces false positives, its weight decreases. If it reliably catches
// threats, its weight increases.
//
// Integrates with Feature 07 (Fidelity Ranking) to update score calculations.
// ============================================================================

const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info', name: 'aria-threshold-tuning' });

// ── Per-Module Accuracy Calculator ──────────────────────────────────────────

/**
 * Calculate detection accuracy per module from analyst feedback.
 *
 * @param {Array} feedbackBatch - Analyst feedback with original detection scores
 * @returns {Object} Per-module accuracy metrics
 */
function calculateModuleAccuracy(feedbackBatch) {
    const modules = ['regex', 'anomaly', 'ueba', 'llm', 'timeSeries'];
    const metrics = {};

    for (const mod of modules) {
        const scoreKey = mod + 'Score';
        let truePositives = 0;
        let falsePositives = 0;
        let trueNegatives = 0;
        let falseNegatives = 0;

        for (const fb of feedbackBatch) {
            const scores = fb.originalScores || fb.scores || {};
            const moduleScore = scores[scoreKey] || 0;
            const wasThreat = fb.wasCorrect ? fb.decision === 'block' : fb.decision !== 'block';

            if (moduleScore > 0.5 && wasThreat) truePositives++;
            if (moduleScore > 0.5 && !wasThreat) falsePositives++;
            if (moduleScore <= 0.5 && !wasThreat) trueNegatives++;
            if (moduleScore <= 0.5 && wasThreat) falseNegatives++;
        }

        const total = truePositives + falsePositives + trueNegatives + falseNegatives;
        const precision = truePositives + falsePositives > 0
            ? truePositives / (truePositives + falsePositives) : 0;
        const recall = truePositives + falseNegatives > 0
            ? truePositives / (truePositives + falseNegatives) : 0;
        const f1 = precision + recall > 0
            ? 2 * (precision * recall) / (precision + recall) : 0;

        metrics[mod] = {
            truePositives,
            falsePositives,
            trueNegatives,
            falseNegatives,
            total,
            precision: Math.round(precision * 1000) / 1000,
            recall: Math.round(recall * 1000) / 1000,
            f1Score: Math.round(f1 * 1000) / 1000,
            accuracy: total > 0 ? Math.round(((truePositives + trueNegatives) / total) * 1000) / 1000 : 0,
        };
    }

    return metrics;
}

/**
 * Generate optimized weights from module accuracy metrics.
 * Modules with higher F1 scores get more weight.
 *
 * @param {Object} moduleAccuracy - Output from calculateModuleAccuracy
 * @param {Object} currentWeights - Current fidelity weights
 * @param {number} [learningRate=0.1] - Adjustment speed
 * @returns {{ newWeights: Object, recommendation: string }}
 */
function optimizeWeights(moduleAccuracy, currentWeights, learningRate = 0.1) {
    const modules = Object.keys(moduleAccuracy);
    const newWeights = { ...currentWeights };

    for (const mod of modules) {
        const metrics = moduleAccuracy[mod];
        if (metrics.total < 5) continue; // Need minimum sample size

        const currentWeight = currentWeights[mod] || 0.2;
        const targetWeight = metrics.f1Score; // F1 as target weight

        // Gradual adjustment toward target
        newWeights[mod] = currentWeight + learningRate * (targetWeight - currentWeight);
        newWeights[mod] = Math.max(0.05, Math.min(0.5, newWeights[mod])); // Clamp 5-50%
    }

    // Normalize to sum to 1.0
    const total = modules.reduce((sum, mod) => sum + (newWeights[mod] || 0), 0);
    for (const mod of modules) {
        newWeights[mod] = Math.round((newWeights[mod] / total) * 1000) / 1000;
    }

    // Build recommendation
    const recommendations = [];
    for (const mod of modules) {
        const diff = newWeights[mod] - (currentWeights[mod] || 0);
        if (Math.abs(diff) > 0.02) {
            recommendations.push(`${mod}: ${diff > 0 ? '↑' : '↓'} ${Math.abs(diff * 100).toFixed(1)}%`);
        }
    }

    const recommendation = recommendations.length > 0
        ? `Adjust weights: ${recommendations.join(', ')}`
        : 'Weights are already well-calibrated';

    logger.info({ currentWeights, newWeights, recommendation }, 'Weight optimization complete');

    return { newWeights, recommendation };
}

/**
 * Calculate optimal severity thresholds from false-positive data.
 * If analysts frequently reject alerts at a certain fidelity level,
 * that threshold should be raised.
 *
 * @param {Array} feedbackBatch - Analyst feedback
 * @param {Object} currentThresholds - Current severity thresholds
 * @returns {{ newThresholds: Object, changes: string[] }}
 */
function optimizeThresholds(feedbackBatch, currentThresholds) {
    // Group feedback by fidelity score ranges
    const buckets = { critical: [], high: [], medium: [], low: [] };

    for (const fb of feedbackBatch) {
        const score = fb.fidelityScore || 0;
        if (score >= currentThresholds.critical) buckets.critical.push(fb);
        else if (score >= currentThresholds.high) buckets.high.push(fb);
        else if (score >= currentThresholds.medium) buckets.medium.push(fb);
        else buckets.low.push(fb);
    }

    const newThresholds = { ...currentThresholds };
    const changes = [];

    for (const [level, fbs] of Object.entries(buckets)) {
        if (fbs.length < 3) continue;

        const fpRate = fbs.filter(fb => !fb.wasCorrect).length / fbs.length;

        // If FP rate is too high at this level, raise the threshold
        if (fpRate > 0.3) {
            const increase = Math.round(fpRate * 5); // Up to 5 points
            newThresholds[level] = Math.min(95, (newThresholds[level] || 50) + increase);
            changes.push(`${level} threshold ↑ ${increase} points (FP rate: ${(fpRate * 100).toFixed(0)}%)`);
        }
        // If FP rate is very low, we could lower it slightly to catch more
        else if (fpRate < 0.05 && fbs.length >= 10) {
            const decrease = 2;
            newThresholds[level] = Math.max(5, (newThresholds[level] || 50) - decrease);
            changes.push(`${level} threshold ↓ ${decrease} points (FP rate: ${(fpRate * 100).toFixed(0)}%)`);
        }
    }

    logger.info({ currentThresholds, newThresholds, changes }, 'Threshold optimization complete');

    return { newThresholds, changes };
}

module.exports = {
    calculateModuleAccuracy,
    optimizeWeights,
    optimizeThresholds,
};
