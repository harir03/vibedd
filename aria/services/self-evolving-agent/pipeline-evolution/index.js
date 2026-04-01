// ============================================================================
// ARIA — Pipeline Evolution Engine (Feature 10.4)
//
// Auto-generates and restructures the detection processing pipeline based on
// analyst feedback and per-stage performance metrics. The default pipeline is:
//   regex → anomaly → UEBA → LLM
//
// This module can propose:
//   - Reordering stages (e.g., move UEBA before anomaly if more accurate)
//   - Skipping stages for certain HTTP methods (e.g., skip LLM for GET)
//   - Running stages in parallel (e.g., anomaly + UEBA simultaneously)
//   - Temporarily disabling underperforming stages
//
// All proposed changes go through validation before deployment via Redis.
// ============================================================================

const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info', name: 'aria-pipeline-evolution' });

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const PIPELINE_MODEL = process.env.PIPELINE_MODEL || 'mistral';

// [ARIA] Default detection pipeline — baseline config consumed by the gateway
const DEFAULT_PIPELINE = {
    stages: [
        { name: 'regex', enabled: true, order: 1, parallel: false, skipFor: [], weight: 0.15 },
        { name: 'anomaly', enabled: true, order: 2, parallel: false, skipFor: [], weight: 0.25 },
        { name: 'ueba', enabled: true, order: 3, parallel: true, skipFor: [], weight: 0.25 },
        { name: 'llm', enabled: true, order: 4, parallel: false, skipFor: ['GET'], weight: 0.25 },
    ],
    parallelGroups: [],
    maxLatencyMs: 5000,
    failOpenOnTimeout: true,
};

// [ARIA] Valid stage names — used for validation
const VALID_STAGES = ['regex', 'anomaly', 'ueba', 'llm', 'timeSeries', 'behavioral'];
const REQUIRED_STAGES = ['regex', 'llm']; // At least one must be active

// ── Per-Stage Performance Analysis ──────────────────────────────────────────

/**
 * Analyze per-stage contribution from analyst feedback.
 * Calculates unique catches, false positives, and effectiveness per stage.
 *
 * @param {Array} feedback - Analyst feedback with per-module scores
 * @param {Object} currentPipeline - Current pipeline config
 * @returns {Object} Performance stats keyed by stage name
 */
function analyzePipelinePerformance(feedback, currentPipeline) {
    // [ARIA] Build stage list from current pipeline config
    const stages = (currentPipeline?.stages || DEFAULT_PIPELINE.stages)
        .filter(s => s.enabled)
        .map(s => s.name);

    const performance = {};

    // [ARIA] Initialize metrics for each active stage
    for (const stage of stages) {
        performance[stage] = {
            uniqueCatches: 0,
            falsePositives: 0,
            totalDetections: 0,
            avgWeight: 0,
            weightSum: 0,
            feedbackCount: 0,
        };
    }

    // [ARIA] Iterate feedback and attribute detections to each stage
    for (const fb of feedback) {
        const scores = fb.originalScores || fb.scores || {};
        const wasThreat = fb.wasCorrect ? fb.decision === 'block' : fb.decision !== 'block';

        // [ARIA] Track which stages flagged this alert (score > 0.5)
        const flaggedBy = [];
        for (const stage of stages) {
            const scoreKey = stage + 'Score';
            const score = scores[scoreKey] ?? 0;

            if (score > 0.5) {
                flaggedBy.push(stage);
                performance[stage].totalDetections++;

                // [ARIA] Count false positives per stage
                if (!wasThreat) {
                    performance[stage].falsePositives++;
                }
            }

            // [ARIA] Accumulate weight for averaging
            performance[stage].weightSum += score;
            performance[stage].feedbackCount++;
        }

        // [ARIA] A "unique catch" means ONLY this stage detected the threat
        if (flaggedBy.length === 1 && wasThreat) {
            performance[flaggedBy[0]].uniqueCatches++;
        }
    }

    // [ARIA] Finalize average weights
    for (const stage of stages) {
        const p = performance[stage];
        p.avgWeight = p.feedbackCount > 0
            ? Math.round((p.weightSum / p.feedbackCount) * 1000) / 1000
            : 0;
        delete p.weightSum;
        delete p.feedbackCount;
    }

    logger.info({ stages: Object.keys(performance), feedbackSize: feedback.length }, 'Pipeline performance analyzed');
    return performance;
}

// ── LLM-Driven Pipeline Restructuring ───────────────────────────────────────

/**
 * Use LLM to propose pipeline restructuring based on performance data.
 *
 * @param {Object} performance - Output from analyzePipelinePerformance
 * @param {Object} currentPipeline - Current pipeline config
 * @returns {Object|null} Proposed changes or null on failure
 */
async function proposePipelineChanges(performance, currentPipeline) {
    // [ARIA] Build performance summary for the LLM prompt
    const perfSummary = Object.entries(performance)
        .map(([stage, stats]) =>
            `${stage}: uniqueCatches=${stats.uniqueCatches}, FPs=${stats.falsePositives}, ` +
            `totalDetections=${stats.totalDetections}, avgWeight=${stats.avgWeight}`
        )
        .join('\n');

    const currentConfig = JSON.stringify(currentPipeline || DEFAULT_PIPELINE, null, 2);

    // [ARIA] Meta-prompt asking LLM to optimize the detection pipeline
    const prompt = `You are a cybersecurity pipeline architect for a banking WAF (Web Application Firewall).

CURRENT PIPELINE CONFIG:
${currentConfig}

PER-STAGE PERFORMANCE METRICS:
${perfSummary}

TASK: Analyze the performance metrics and propose pipeline restructuring to improve detection accuracy and reduce false positives.

ALLOWED CHANGES:
1. Reorder stages (move more accurate stages earlier)
2. Add skipFor rules (skip expensive stages for safe HTTP methods)
3. Enable parallel groups (run independent stages simultaneously)
4. Disable underperforming stages (high FP, low unique catches)
5. Adjust stage weights based on accuracy

CONSTRAINTS:
- At least 2 stages must remain active
- At least one of "regex" or "llm" must be active
- Maximum 6 stages total
- "regex" should stay early (fast pre-filter)

Return ONLY valid JSON in this format:
{
  "changes": [
    { "action": "reorder|skip|parallel|disable|enable|weight", "stage": "name", "value": "..." , "reason": "..." }
  ],
  "summary": "Brief explanation of overall strategy",
  "expectedImprovement": "Estimated improvement description"
}`;

    try {
        // [ARIA] Call Ollama for pipeline restructuring suggestions
        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: PIPELINE_MODEL,
                prompt,
                stream: false,
                options: { temperature: 0.2, top_p: 0.9 },
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama ${response.status}`);
        }

        const data = await response.json();
        const raw = (data.response || '').trim();

        // [ARIA] Parse LLM response — try direct parse, then extract JSON block
        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (_) {
            const match = raw.match(/\{[\s\S]*\}/);
            if (match) {
                try { parsed = JSON.parse(match[0]); } catch (_) { /* fall through */ }
            }
        }

        if (!parsed || !Array.isArray(parsed.changes)) {
            logger.warn('LLM returned invalid pipeline proposal — no changes array');
            return null;
        }

        logger.info({
            changeCount: parsed.changes.length,
            summary: parsed.summary || 'N/A',
        }, 'Pipeline changes proposed by LLM');

        return parsed;
    } catch (err) {
        logger.error({ err: err.message }, 'Pipeline proposal generation failed');
        return null;
    }
}

// ── Pipeline Config Validation ──────────────────────────────────────────────

/**
 * Safety-validate a proposed pipeline configuration.
 *
 * @param {Object} proposedConfig - The proposed pipeline config to validate
 * @returns {{ valid: boolean, issues: string[] }}
 */
function validatePipelineConfig(proposedConfig) {
    const issues = [];

    // [ARIA] Check that stages array exists and is non-empty
    if (!proposedConfig?.stages || !Array.isArray(proposedConfig.stages)) {
        issues.push('Missing or invalid stages array');
        return { valid: false, issues };
    }

    // [ARIA] Filter to enabled stages
    const activeStages = proposedConfig.stages.filter(s => s.enabled);

    // [ARIA] Must have at least 2 active detection stages
    if (activeStages.length < 2) {
        issues.push(`Only ${activeStages.length} active stage(s) — minimum is 2`);
    }

    // [ARIA] Total stage count must be between 2 and 6
    if (proposedConfig.stages.length > 6) {
        issues.push(`Too many stages (${proposedConfig.stages.length}) — maximum is 6`);
    }

    // [ARIA] At least one of regex or llm must be active (fast + smart)
    const hasRequired = activeStages.some(s => REQUIRED_STAGES.includes(s.name));
    if (!hasRequired) {
        issues.push('Must include at least one of: regex, llm (fast + smart detection)');
    }

    // [ARIA] Validate all stage names are recognized
    for (const stage of proposedConfig.stages) {
        if (!VALID_STAGES.includes(stage.name)) {
            issues.push(`Unknown stage name: "${stage.name}" — valid: ${VALID_STAGES.join(', ')}`);
        }
    }

    // [ARIA] Check for duplicate stage names (circular dependency proxy)
    const names = proposedConfig.stages.map(s => s.name);
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
    if (duplicates.length > 0) {
        issues.push(`Duplicate stages detected: ${[...new Set(duplicates)].join(', ')}`);
    }

    // [ARIA] Validate order values are unique and sequential
    const orders = proposedConfig.stages.map(s => s.order).filter(Boolean);
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
        issues.push('Duplicate order values — each stage must have a unique execution order');
    }

    // [ARIA] Validate weights sum to approximately 1.0 (±0.1 tolerance)
    const totalWeight = activeStages.reduce((sum, s) => sum + (s.weight || 0), 0);
    if (Math.abs(totalWeight - 1.0) > 0.1) {
        issues.push(`Active stage weights sum to ${totalWeight.toFixed(2)} — should be ~1.0`);
    }

    const valid = issues.length === 0;
    logger.info({ valid, issueCount: issues.length, activeStages: activeStages.length }, 'Pipeline config validated');

    return { valid, issues };
}

// ── Build Deployable Pipeline Config ────────────────────────────────────────

/**
 * Merge proposed changes into the current pipeline config to produce
 * a deployable configuration for the gateway (consumed via Redis pub/sub).
 *
 * @param {Object} changes - Output from proposePipelineChanges
 * @param {Object} currentPipeline - Current pipeline config
 * @returns {Object} New pipeline configuration
 */
function buildPipelineConfig(changes, currentPipeline) {
    // [ARIA] Deep clone the current pipeline to avoid mutation
    const newConfig = JSON.parse(JSON.stringify(currentPipeline || DEFAULT_PIPELINE));
    const parallelCandidates = [];

    // [ARIA] Apply each proposed change to the pipeline
    for (const change of (changes?.changes || [])) {
        const stage = newConfig.stages.find(s => s.name === change.stage);
        if (!stage && change.action !== 'enable') continue;

        switch (change.action) {
            case 'reorder': {
                // [ARIA] Update stage execution order
                const newOrder = parseInt(change.value, 10);
                if (!isNaN(newOrder) && newOrder >= 1 && newOrder <= 6) {
                    stage.order = newOrder;
                }
                break;
            }
            case 'skip': {
                // [ARIA] Add HTTP methods to skipFor list
                const methods = Array.isArray(change.value) ? change.value : [change.value];
                stage.skipFor = [...new Set([...stage.skipFor, ...methods.map(m => m.toUpperCase())])];
                break;
            }
            case 'parallel': {
                // [ARIA] Mark stage for parallel execution
                stage.parallel = change.value === true || change.value === 'true';
                if (stage.parallel) parallelCandidates.push(stage.name);
                break;
            }
            case 'disable': {
                // [ARIA] Disable an underperforming stage
                stage.enabled = false;
                logger.info({ stage: stage.name, reason: change.reason }, 'Stage disabled');
                break;
            }
            case 'enable': {
                // [ARIA] Re-enable a previously disabled stage
                if (stage) {
                    stage.enabled = true;
                } else {
                    // Add new stage if it's a valid name
                    if (VALID_STAGES.includes(change.stage)) {
                        newConfig.stages.push({
                            name: change.stage,
                            enabled: true,
                            order: newConfig.stages.length + 1,
                            parallel: false,
                            skipFor: [],
                            weight: 0.15,
                        });
                    }
                }
                break;
            }
            case 'weight': {
                // [ARIA] Adjust stage weight
                const newWeight = parseFloat(change.value);
                if (!isNaN(newWeight) && newWeight >= 0.05 && newWeight <= 0.5) {
                    stage.weight = Math.round(newWeight * 1000) / 1000;
                }
                break;
            }
            default:
                logger.warn({ action: change.action }, 'Unknown pipeline change action');
        }
    }

    // [ARIA] Sort stages by order for clean config output
    newConfig.stages.sort((a, b) => a.order - b.order);

    // [ARIA] Build parallel groups from stages marked as parallel
    if (parallelCandidates.length >= 2) {
        newConfig.parallelGroups = [parallelCandidates];
    }

    // [ARIA] Normalize weights of active stages to sum to 1.0
    const activeStages = newConfig.stages.filter(s => s.enabled);
    const totalWeight = activeStages.reduce((sum, s) => sum + (s.weight || 0), 0);
    if (totalWeight > 0 && Math.abs(totalWeight - 1.0) > 0.01) {
        for (const s of activeStages) {
            s.weight = Math.round((s.weight / totalWeight) * 1000) / 1000;
        }
    }

    logger.info({
        activeStages: activeStages.map(s => s.name),
        parallelGroups: newConfig.parallelGroups,
    }, 'Pipeline config built');

    return newConfig;
}

module.exports = {
    analyzePipelinePerformance,
    proposePipelineChanges,
    validatePipelineConfig,
    buildPipelineConfig,
    DEFAULT_PIPELINE,
};
