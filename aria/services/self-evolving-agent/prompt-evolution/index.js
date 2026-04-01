// ============================================================================
// ARIA — Self-Evolving Prompt Engine (Feature 10.2)
//
// Improves the LLM prompts used for threat analysis by learning from
// analyst feedback. When analysts mark decisions as incorrect, the system
// generates improved prompts that fix those errors while maintaining accuracy.
//
// The AI literally rewrites its own instructions to be better at its job.
// ============================================================================

const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info', name: 'aria-prompt-evolution' });

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

// ── Prompt Evolution ────────────────────────────────────────────────────────

/**
 * Generate an improved prompt based on analyst feedback.
 *
 * @param {string} currentPrompt - The current system prompt used by the gateway
 * @param {Array} falsePositives - Alerts incorrectly blocked (analyst approved)
 * @param {Array} falseNegatives - Alerts incorrectly allowed (analyst rejected)
 * @param {Array} truePositives - Correctly flagged (for reference)
 * @returns {{ newPrompt: string, changes: string[], confidence: number }}
 */
async function evolvePrompt(currentPrompt, falsePositives, falseNegatives, truePositives) {
    const fpSummaries = falsePositives.slice(0, 5).map(summarizeFeedback);
    const fnSummaries = falseNegatives.slice(0, 5).map(summarizeFeedback);
    const tpSummaries = truePositives.slice(0, 5).map(summarizeFeedback);

    const metaPrompt = `You are a meta-AI that improves threat detection prompts for a banking WAF.

CURRENT PROMPT (what the threat analysis model uses):
"""
${currentPrompt}
"""

ERRORS TO FIX:

False Positives (blocked but were actually SAFE — prompt was too aggressive):
${fpSummaries.length > 0 ? fpSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n') : '(none)'}

False Negatives (allowed but were actually THREATS — prompt was too lenient):
${fnSummaries.length > 0 ? fnSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n') : '(none)'}

CORRECT DECISIONS (do NOT break these — the prompt MUST still handle these correctly):
${tpSummaries.length > 0 ? tpSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n') : '(none)'}

RULES:
1. Keep the same JSON output format: { "success": boolean, "reason": string }
2. "success": true means SAFE, "success": false means BLOCKED
3. Focus on banking-specific threats (SQL injection in transactions, XSS in forms, etc.)
4. Do NOT make the prompt overly long — keep it focused and clear
5. Add specific rules/examples to address the false positives and false negatives above

Rewrite the prompt. Return ONLY the improved prompt text (no explanation, no markdown).`;

    try {
        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'mistral',
                prompt: metaPrompt,
                stream: false,
                options: { temperature: 0.3 },
            }),
        });

        if (!response.ok) throw new Error(`Ollama ${response.status}`);

        const data = await response.json();
        const newPrompt = (data.response || '').trim();

        if (!newPrompt || newPrompt.length < 50) {
            logger.warn('LLM returned empty or too-short prompt evolution');
            return null;
        }

        // Validate the prompt contains required JSON format instructions
        const hasJsonFormat = newPrompt.includes('success') && newPrompt.includes('reason');
        if (!hasJsonFormat) {
            logger.warn('Evolved prompt missing required JSON format specs');
            return null;
        }

        // Estimate confidence based on how well it addresses the feedback
        const addressesFPs = fpSummaries.some(fp =>
            newPrompt.toLowerCase().includes(fp.split(' ').slice(0, 3).join(' ').toLowerCase())
        );
        const addressesFNs = fnSummaries.some(fn =>
            newPrompt.toLowerCase().includes(fn.split(' ').slice(0, 3).join(' ').toLowerCase())
        );

        const confidence = 0.5 +
            (addressesFPs ? 0.2 : 0) +
            (addressesFNs ? 0.2 : 0) +
            (hasJsonFormat ? 0.1 : 0);

        const changes = [];
        if (newPrompt.length > currentPrompt.length) changes.push('Prompt expanded with more detail');
        if (newPrompt.length < currentPrompt.length) changes.push('Prompt condensed');
        if (addressesFPs) changes.push('Added rules to reduce false positives');
        if (addressesFNs) changes.push('Added rules to catch missed threats');

        logger.info({
            oldLength: currentPrompt.length,
            newLength: newPrompt.length,
            confidence,
            fpCount: falsePositives.length,
            fnCount: falseNegatives.length,
        }, 'Prompt evolved');

        return { newPrompt, changes, confidence };
    } catch (err) {
        logger.error({ err: err.message }, 'Prompt evolution failed');
        return null;
    }
}

function summarizeFeedback(feedback) {
    const method = feedback.method || 'GET';
    const url = feedback.url || feedback.targetEndpoint || '/unknown';
    const payload = feedback.payload || feedback.requestBody || '';
    const payloadPreview = typeof payload === 'string'
        ? payload.slice(0, 100)
        : JSON.stringify(payload).slice(0, 100);
    const decision = feedback.decision || feedback.aiDecision || 'unknown';
    return `${method} ${url} (payload: ${payloadPreview}) → AI said: ${decision}`;
}

// ── Deploy Evolved Prompt ───────────────────────────────────────────────────

/**
 * Create a new Ollama model with the evolved prompt.
 * Uses the same pattern as actions.ts → createPolicyModel().
 *
 * @param {string} newPrompt - The evolved system prompt
 * @param {string} [modelName='aria-policeman'] - Target model name
 * @returns {{ success: boolean, error?: string }}
 */
async function deployPrompt(newPrompt, modelName = 'aria-policeman') {
    try {
        const response = await fetch(`${OLLAMA_HOST}/api/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelName,
                from: 'mistral',
                system: newPrompt,
                stream: false,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error({ status: response.status, error: errorText }, 'Failed to deploy evolved prompt');
            return { success: false, error: errorText };
        }

        logger.info({ model: modelName }, 'Evolved prompt deployed to Ollama');
        return { success: true };
    } catch (err) {
        logger.error({ err: err.message }, 'Prompt deployment failed');
        return { success: false, error: err.message };
    }
}

module.exports = {
    evolvePrompt,
    deployPrompt,
};
