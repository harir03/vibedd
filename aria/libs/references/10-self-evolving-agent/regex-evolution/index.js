// ============================================================================
// ARIA — Self-Evolving Regex Generator (Feature 10.1)
//
// Reads confirmed attack data + analyst feedback to generate NEW regex patterns
// that the gateway doesn't currently have. Generated patterns are tested against
// known-good samples to prevent false positives, then deployed via Redis pub/sub.
//
// Flow:
//   1. Collect confirmed attacks (analyst-approved alerts)
//   2. Collect recent false positives (analyst-rejected alerts)
//   3. Ask LLM to generate regex that catches attacks but not FPs
//   4. Validate regex against safety checks (no ReDoS, etc.)
//   5. Test against historical data
//   6. Deploy via Redis → Gateway hot-reload
//   7. Monitor for 1 hour → auto-rollback if FP rate > 10%
// ============================================================================

const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info', name: 'aria-regex-evolution' });

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const REGEX_MODEL = process.env.REGEX_MODEL || 'mistral';

// ── ReDoS Safety Check ──────────────────────────────────────────────────────
// Prevent catastrophic backtracking

function isReDoSSafe(pattern) {
    // Reject patterns with nested quantifiers (common ReDoS trigger)
    const nestedQuantifiers = /(\+|\*|\{[^}]+\})\s*(\+|\*|\{[^}]+\})/;
    if (nestedQuantifiers.test(pattern)) return false;

    // Reject overly complex patterns
    if (pattern.length > 300) return false;

    // Try compiling — reject invalid regex
    try {
        new RegExp(pattern, 'i');
    } catch (_) {
        return false;
    }

    // Test with a long string to detect backtracking
    try {
        const testString = 'A'.repeat(50);
        const start = Date.now();
        new RegExp(pattern, 'i').test(testString);
        if (Date.now() - start > 100) return false; // Over 100ms = suspicious
    } catch (_) {
        return false;
    }

    return true;
}

// ── Pattern Generation ──────────────────────────────────────────────────────

async function generateRegexPatterns(confirmedAttacks, falsePositives, existingPatterns) {
    const attackPayloads = confirmedAttacks
        .map(a => a.payload || a.url || '')
        .filter(Boolean)
        .slice(0, 20);

    const fpPayloads = falsePositives
        .map(fp => fp.payload || fp.url || '')
        .filter(Boolean)
        .slice(0, 10);

    const currentRegex = existingPatterns
        .map(p => p.pattern)
        .slice(0, 20);

    if (attackPayloads.length === 0) {
        logger.info('No confirmed attacks to learn from');
        return [];
    }

    const prompt = `You are a cybersecurity regex pattern engineer for a banking WAF.

TASK: Generate NEW regex patterns to detect the following confirmed attack payloads.

CONFIRMED ATTACK PAYLOADS (these MUST match):
${attackPayloads.map((p, i) => `${i + 1}. ${p}`).join('\n')}

KNOWN FALSE POSITIVES (these must NOT match):
${fpPayloads.length > 0 ? fpPayloads.map((p, i) => `${i + 1}. ${p}`).join('\n') : '(none provided)'}

EXISTING PATTERNS (do NOT duplicate these):
${currentRegex.length > 0 ? currentRegex.map((p, i) => `${i + 1}. /${p}/i`).join('\n') : '(none)'}

REQUIREMENTS:
1. Patterns must be valid JavaScript RegExp
2. Must NOT cause ReDoS (no nested quantifiers like (a+)+)
3. Target the core malicious structure, not specific strings
4. Include a category label (sqli, xss, command_injection, path_traversal, credential_stuffing, etc.)
5. Include a confidence score (0.0-1.0)

Return ONLY a JSON array:
[{"pattern": "...", "flags": "i", "category": "sqli", "description": "Catches UNION-based injection", "confidence": 0.85}]`;

    try {
        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: REGEX_MODEL,
                prompt,
                stream: false,
                options: { temperature: 0.2, top_p: 0.9 },
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama ${response.status}`);
        }

        const data = await response.json();
        return parseAndValidatePatterns(data.response || '', attackPayloads, fpPayloads);
    } catch (err) {
        logger.error({ err: err.message }, 'Regex generation failed');
        return [];
    }
}

function parseAndValidatePatterns(llmResponse, attacks, fps) {
    let parsed = [];

    // Try extracting JSON
    try {
        parsed = JSON.parse(llmResponse.trim());
    } catch (_) {
        const match = llmResponse.match(/\[[\s\S]*\]/);
        if (match) {
            try { parsed = JSON.parse(match[0]); } catch (_) {}
        }
    }

    if (!Array.isArray(parsed)) return [];

    const validated = [];

    for (const p of parsed) {
        if (!p.pattern) continue;

        // Safety check
        if (!isReDoSSafe(p.pattern)) {
            logger.warn({ pattern: p.pattern }, 'Rejected unsafe pattern (ReDoS risk)');
            continue;
        }

        const regex = new RegExp(p.pattern, p.flags || 'i');

        // Test against confirmed attacks — must match at least 1
        const matchesAttacks = attacks.filter(a => regex.test(a)).length;
        if (matchesAttacks === 0) {
            logger.debug({ pattern: p.pattern }, 'Pattern matches no attacks, skipping');
            continue;
        }

        // Test against false positives — must NOT match any
        const matchesFPs = fps.filter(fp => regex.test(fp)).length;
        if (matchesFPs > 0) {
            logger.warn({ pattern: p.pattern, fpMatches: matchesFPs }, 'Pattern matches false positives, skipping');
            continue;
        }

        validated.push({
            pattern: p.pattern,
            flags: p.flags || 'i',
            category: p.category || 'unknown',
            description: p.description || '',
            confidence: Math.min(1, Math.max(0, parseFloat(p.confidence) || 0.5)),
            source: 'ai_generated',
            status: 'proposed',
            validationResults: {
                truePositives: matchesAttacks,
                falsePositives: matchesFPs,
                testedAgainst: attacks.length + fps.length,
            },
        });
    }

    logger.info({ generated: parsed.length, validated: validated.length }, 'Regex patterns validated');
    return validated;
}

module.exports = {
    generateRegexPatterns,
    isReDoSSafe,
    parseAndValidatePatterns,
};
