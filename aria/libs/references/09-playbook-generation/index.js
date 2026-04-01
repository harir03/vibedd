// ============================================================================
// ARIA — Playbook Generation Engine (Feature 09)
//
// When an incident is detected, this module generates step-by-step response
// playbooks using Ollama/Mistral, tailored to the specific attack type and
// banking regulatory requirements (NIST 800-61, PCI-DSS, RBI framework).
//
// Modes:
//   1. Template-based — fast, pre-built steps for known attack categories
//   2. LLM-generated — full custom playbook for novel incidents
//   3. Hybrid — template base + LLM enhancement for context
//
// Usage:
//   Standalone worker: node index.js
//   As library: const { generatePlaybook } = require('./index');
// ============================================================================

const mongoose = require('mongoose');
const Redis = require('ioredis');
const pino = require('pino');

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    name: 'aria-playbook',
});

// ── Config ──────────────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aria_db';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const PLAYBOOK_MODEL = process.env.PLAYBOOK_MODEL || 'mistral';

// ── Mongoose Schemas (inline for standalone operation) ──────────────────────

const PlaybookStepSchema = new mongoose.Schema({
    order: { type: Number, required: true },
    action: { type: String, required: true },
    assignee: { type: String, enum: ['SOC-L1', 'SOC-L2', 'SOC-L3', 'IT-Ops', 'DBA', 'Management', 'Legal', 'CERT-In'], default: 'SOC-L1' },
    estimatedTime: { type: String, default: '15m' },
    verification: { type: String, default: '' },
    automated: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'skipped'], default: 'pending' },
});

const PlaybookSchema = new mongoose.Schema({
    incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
    alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert' },
    title: { type: String, required: true },
    generatedBy: { type: String, enum: ['template', 'llm', 'hybrid'], default: 'hybrid' },
    category: { type: String, required: true },
    steps: [PlaybookStepSchema],
    estimatedResolutionTime: { type: String, default: '1h' },
    regulatoryRequirements: [{ type: String }],
    status: { type: String, enum: ['generated', 'approved', 'in_progress', 'completed', 'rejected'], default: 'generated' },
    llmModel: { type: String },
    llmPrompt: { type: String },
    effectiveness: { type: Number, min: 0, max: 100 },
}, { timestamps: true });

const Playbook = mongoose.models.Playbook || mongoose.model('Playbook', PlaybookSchema);

const IncidentSchema = new mongoose.Schema({
    title: String,
    description: String,
    category: String,
    severity: { type: String, enum: ['critical', 'high', 'medium', 'low', 'info'] },
    status: { type: String, enum: ['open', 'investigating', 'resolved', 'false_positive'] },
    alertIds: [{ type: mongoose.Schema.Types.ObjectId }],
    sourceIPs: [String],
    targetEndpoints: [String],
    attackStage: String,
    timeRange: { start: Date, end: Date },
    avgFidelity: Number,
    maxFidelity: Number,
    playbookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Playbook' },
}, { timestamps: true });

const Incident = mongoose.models.Incident || mongoose.model('Incident', IncidentSchema);

const AlertSchema = new mongoose.Schema({
    sourceIP: String,
    method: String,
    url: String,
    attackType: String,
    category: String,
    severity: String,
    fidelityScore: Number,
    decision: String,
    detectionSource: String,
    requestBody: mongoose.Schema.Types.Mixed,
    requestHeaders: mongoose.Schema.Types.Mixed,
    responseStatus: Number,
    applicationId: { type: mongoose.Schema.Types.ObjectId },
    appName: String,
}, { timestamps: true });

const Alert = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);

// ── Playbook Templates ──────────────────────────────────────────────────────
// Pre-built response procedures for common banking attack categories

const TEMPLATES = {
    sql_injection: {
        title: 'SQL Injection Response Playbook',
        regulatoryRequirements: ['PCI-DSS 6.5.1', 'NIST SP 800-61 §3.2', 'RBI Master Direction §4.2'],
        estimatedResolutionTime: '2h',
        steps: [
            { order: 1, action: 'Block attacking IP ranges at WAF/gateway level', assignee: 'SOC-L1', estimatedTime: '5m', verification: 'Verify IP is blocked by testing a request from the same range', automated: true },
            { order: 2, action: 'Capture and preserve attack payloads and logs for forensic analysis', assignee: 'SOC-L2', estimatedTime: '15m', verification: 'Forensic packet capture saved to evidence folder', automated: false },
            { order: 3, action: 'Audit database for unauthorized queries or data exfiltration', assignee: 'DBA', estimatedTime: '30m', verification: 'DB audit log reviewed — no unauthorized SELECT/INSERT/UPDATE/DELETE', automated: false },
            { order: 4, action: 'Check for successful data exfiltration (unusual outbound data volume)', assignee: 'SOC-L2', estimatedTime: '20m', verification: 'Network flow analysis shows no anomalous outbound transfers', automated: false },
            { order: 5, action: 'Patch the vulnerable endpoint with parameterized queries', assignee: 'IT-Ops', estimatedTime: '30m', verification: 'Endpoint tested with SQLi payloads returns 400, not 500', automated: false },
            { order: 6, action: 'Run full database integrity check on affected tables', assignee: 'DBA', estimatedTime: '45m', verification: 'Checksum matches pre-attack baseline', automated: false },
            { order: 7, action: 'Update WAF rules with newly discovered attack patterns', assignee: 'SOC-L2', estimatedTime: '15m', verification: 'New rules deployed and tested against attack payloads', automated: true },
            { order: 8, action: 'Report incident to CERT-In within 6 hours if data breach confirmed', assignee: 'Management', estimatedTime: '1h', verification: 'CERT-In ticket number obtained', automated: false },
        ],
    },

    credential_stuffing: {
        title: 'Credential Stuffing Response Playbook',
        regulatoryRequirements: ['PCI-DSS 8.1.6', 'NIST SP 800-63B', 'RBI Master Direction §3.1'],
        estimatedResolutionTime: '1h 30m',
        steps: [
            { order: 1, action: 'Block source IPs at WAF level (rate-limit remaining IPs)', assignee: 'SOC-L1', estimatedTime: '5m', verification: 'Source IPs return 429 Too Many Requests', automated: true },
            { order: 2, action: 'Force password reset for all targeted accounts', assignee: 'IT-Ops', estimatedTime: '15m', verification: 'Password reset emails sent, old passwords invalidated', automated: true },
            { order: 3, action: 'Enable CAPTCHA on login and registration endpoints', assignee: 'IT-Ops', estimatedTime: '10m', verification: 'CAPTCHA challenge appears on login page', automated: false },
            { order: 4, action: 'Check for successful logins from attacking IP addresses', assignee: 'SOC-L2', estimatedTime: '20m', verification: 'List of compromised accounts generated', automated: false },
            { order: 5, action: 'Lock compromised accounts and initiate customer notification', assignee: 'SOC-L2', estimatedTime: '30m', verification: 'Compromised accounts locked, notification sent', automated: false },
            { order: 6, action: 'Review and strengthen account lockout policies', assignee: 'SOC-L3', estimatedTime: '15m', verification: 'Lockout threshold set to 5 attempts / 15 minutes', automated: false },
            { order: 7, action: 'Report to CERT-In if customer data compromised', assignee: 'Management', estimatedTime: '1h', verification: 'CERT-In ticket number obtained', automated: false },
        ],
    },

    xss: {
        title: 'Cross-Site Scripting (XSS) Response Playbook',
        regulatoryRequirements: ['PCI-DSS 6.5.7', 'NIST SP 800-61 §3.4', 'OWASP Top 10 A7'],
        estimatedResolutionTime: '1h 30m',
        steps: [
            { order: 1, action: 'Block attacking IP and add XSS pattern to WAF rules', assignee: 'SOC-L1', estimatedTime: '5m', verification: 'XSS payload returns 403 Forbidden', automated: true },
            { order: 2, action: 'Identify all affected pages/endpoints where XSS was injected', assignee: 'SOC-L2', estimatedTime: '20m', verification: 'List of XSS injection points compiled', automated: false },
            { order: 3, action: 'Check for stored XSS — scan database for script tags in user content', assignee: 'DBA', estimatedTime: '30m', verification: 'No <script> or event handler attributes in data columns', automated: false },
            { order: 4, action: 'Sanitize affected endpoint inputs (implement output encoding)', assignee: 'IT-Ops', estimatedTime: '30m', verification: 'HTML entities properly escaped in response', automated: false },
            { order: 5, action: 'Deploy Content-Security-Policy headers on all endpoints', assignee: 'IT-Ops', estimatedTime: '15m', verification: 'CSP header present in all responses', automated: false },
            { order: 6, action: 'Check for session cookie theft or unauthorized account access', assignee: 'SOC-L2', estimatedTime: '20m', verification: 'No unauthorized session activity detected', automated: false },
        ],
    },

    path_traversal: {
        title: 'Path Traversal Response Playbook',
        regulatoryRequirements: ['PCI-DSS 6.5.8', 'NIST SP 800-61 §3.2'],
        estimatedResolutionTime: '1h',
        steps: [
            { order: 1, action: 'Block attacking IP and update path traversal patterns', assignee: 'SOC-L1', estimatedTime: '5m', verification: 'Path traversal payloads return 403', automated: true },
            { order: 2, action: 'Check for successful file reads (200 responses to traversal attempts)', assignee: 'SOC-L2', estimatedTime: '15m', verification: 'No sensitive files exposed via access logs', automated: false },
            { order: 3, action: 'Audit file system permissions on the affected server', assignee: 'IT-Ops', estimatedTime: '20m', verification: 'Application process runs with minimal filesystem permissions', automated: false },
            { order: 4, action: 'Implement strict input validation — resolve and validate file paths', assignee: 'IT-Ops', estimatedTime: '30m', verification: 'All file access APIs use allowlist-based path validation', automated: false },
            { order: 5, action: 'Rotate any credentials that may have been exposed (config files)', assignee: 'SOC-L2', estimatedTime: '15m', verification: 'All exposed credentials rotated, old ones invalidated', automated: false },
        ],
    },

    command_injection: {
        title: 'Command Injection Response Playbook',
        regulatoryRequirements: ['PCI-DSS 6.5.1', 'NIST SP 800-61 §3.3', 'RBI Master Direction §4.3'],
        estimatedResolutionTime: '3h',
        steps: [
            { order: 1, action: 'Immediately isolate the affected server from the network', assignee: 'SOC-L1', estimatedTime: '5m', verification: 'Server is unreachable from external network', automated: false },
            { order: 2, action: 'Block attacking IP ranges at all levels (WAF, firewall, IDS)', assignee: 'SOC-L1', estimatedTime: '5m', verification: 'IP blocked at WAF and network firewall', automated: true },
            { order: 3, action: 'Capture memory dump and disk image for forensic analysis', assignee: 'SOC-L3', estimatedTime: '30m', verification: 'Forensic images captured and hash-verified', automated: false },
            { order: 4, action: 'Check for persistence mechanisms (cron jobs, SSH keys, backdoors)', assignee: 'SOC-L3', estimatedTime: '45m', verification: 'No unauthorized persistence mechanisms found', automated: false },
            { order: 5, action: 'Audit all outbound connections from compromised server', assignee: 'SOC-L2', estimatedTime: '20m', verification: 'No C2 communication or data exfiltration detected', automated: false },
            { order: 6, action: 'Rebuild the server from a clean image (do NOT patch in place)', assignee: 'IT-Ops', estimatedTime: '1h', verification: 'Fresh server deployed from verified source image', automated: false },
            { order: 7, action: 'Rotate ALL credentials the compromised server had access to', assignee: 'SOC-L2', estimatedTime: '30m', verification: 'All credentials rotated, old ones invalidated', automated: false },
            { order: 8, action: 'Mandatory CERT-In report (OS-level compromise)', assignee: 'Management', estimatedTime: '1h', verification: 'CERT-In ticket number obtained', automated: false },
        ],
    },

    ddos: {
        title: 'DDoS / Rate Abuse Response Playbook',
        regulatoryRequirements: ['RBI Master Direction §3.5', 'NIST SP 800-61 §3.1'],
        estimatedResolutionTime: '45m',
        steps: [
            { order: 1, action: 'Enable rate limiting at WAF level for affected endpoints', assignee: 'SOC-L1', estimatedTime: '5m', verification: 'Requests from burst IPs receive 429', automated: true },
            { order: 2, action: 'Identify attack pattern (volumetric, application-layer, slowloris)', assignee: 'SOC-L2', estimatedTime: '15m', verification: 'Attack type classified in incident notes', automated: false },
            { order: 3, action: 'Block identified botnet IP ranges', assignee: 'SOC-L1', estimatedTime: '10m', verification: 'Botnet IPs blocked, traffic volume dropping', automated: true },
            { order: 4, action: 'Scale infrastructure if legitimate traffic is being impacted', assignee: 'IT-Ops', estimatedTime: '15m', verification: 'Additional capacity online, latency normalized', automated: false },
            { order: 5, action: 'Monitor for attack pattern changes (attackers often pivot)', assignee: 'SOC-L2', estimatedTime: '30m', verification: 'No new attack vectors detected in 30-minute window', automated: false },
        ],
    },

    data_exfiltration: {
        title: 'Data Exfiltration Response Playbook',
        regulatoryRequirements: ['PCI-DSS 12.10.1', 'RBI Master Direction §5.1', 'IT Act 2000 §43A'],
        estimatedResolutionTime: '4h',
        steps: [
            { order: 1, action: 'Block all outbound connections from the affected system', assignee: 'SOC-L1', estimatedTime: '5m', verification: 'No outbound traffic from affected system', automated: false },
            { order: 2, action: 'Identify the scope of data accessed/exfiltrated', assignee: 'SOC-L2', estimatedTime: '30m', verification: 'List of affected tables/records compiled', automated: false },
            { order: 3, action: 'Determine if PII or cardholder data was exposed', assignee: 'SOC-L3', estimatedTime: '30m', verification: 'Data classification assessment complete', automated: false },
            { order: 4, action: 'Preserve all forensic evidence (logs, memory, disk)', assignee: 'SOC-L3', estimatedTime: '45m', verification: 'Forensic chain of custody documented', automated: false },
            { order: 5, action: 'Notify legal team for regulatory breach assessment', assignee: 'Legal', estimatedTime: '30m', verification: 'Legal team briefed, breach assessment initiated', automated: false },
            { order: 6, action: 'Report to CERT-In within 6 hours (mandatory for banking)', assignee: 'Management', estimatedTime: '1h', verification: 'CERT-In ticket number obtained', automated: false },
            { order: 7, action: 'Notify affected customers if PII was exposed (RBI mandate)', assignee: 'Management', estimatedTime: '2h', verification: 'Customer notification sent via registered channels', automated: false },
        ],
    },
};

// ── LLM Playbook Generation ────────────────────────────────────────────────

/**
 * Generate a playbook using Ollama/Mistral for a given incident.
 *
 * @param {Object} incident - Incident document from MongoDB
 * @param {Object} [options] - { model, useTemplate, alertDetails }
 * @returns {Object} Generated playbook document
 */
async function generatePlaybook(incident, options = {}) {
    const {
        model = PLAYBOOK_MODEL,
        useTemplate = true,
        alertDetails = [],
    } = options;

    const category = (incident.category || 'unknown').toLowerCase().replace(/[\s-]+/g, '_');

    // Try template first
    const template = useTemplate ? TEMPLATES[category] : null;

    if (template && !options.forceLLM) {
        // Hybrid mode: use template as base, enhance with LLM context
        logger.info({ category, incidentId: incident._id }, 'Using template + LLM hybrid');
        return await hybridGeneration(incident, template, alertDetails, model);
    }

    // Full LLM generation for unknown categories
    logger.info({ category, incidentId: incident._id }, 'Full LLM generation (no template)');
    return await llmGeneration(incident, alertDetails, model);
}

/**
 * Hybrid: template base + LLM contextual enhancement
 */
async function hybridGeneration(incident, template, alertDetails, model) {
    const prompt = buildEnhancementPrompt(incident, template, alertDetails);

    let enhancedSteps = template.steps;
    let llmResponse = null;

    try {
        llmResponse = await callOllama(model, prompt);
        const parsed = parseStepsFromLLM(llmResponse);
        if (parsed && parsed.length > 0) {
            // Merge: keep template steps, add LLM-suggested additional steps
            enhancedSteps = mergeSteps(template.steps, parsed);
        }
    } catch (err) {
        // [ARIA] Fail-open: if LLM fails, use template as-is
        logger.warn({ err: err.message }, 'LLM enhancement failed, using template only');
    }

    const playbook = {
        incidentId: incident._id,
        title: template.title + ` — ${incident.title || incident.category}`,
        generatedBy: llmResponse ? 'hybrid' : 'template',
        category: incident.category,
        steps: enhancedSteps.map((s, i) => ({ ...s, order: i + 1, status: 'pending' })),
        estimatedResolutionTime: template.estimatedResolutionTime,
        regulatoryRequirements: template.regulatoryRequirements,
        status: 'generated',
        llmModel: model,
        llmPrompt: prompt,
    };

    return playbook;
}

/**
 * Full LLM generation (no template available)
 */
async function llmGeneration(incident, alertDetails, model) {
    const prompt = buildFullGenerationPrompt(incident, alertDetails);

    let steps = [];
    let llmResponse = null;

    try {
        llmResponse = await callOllama(model, prompt);
        steps = parseStepsFromLLM(llmResponse);

        if (!steps || steps.length === 0) {
            // [ARIA] Fallback: generate generic response steps
            steps = generateGenericSteps(incident);
        }
    } catch (err) {
        logger.error({ err: err.message }, 'LLM generation failed entirely');
        steps = generateGenericSteps(incident);
    }

    const playbook = {
        incidentId: incident._id,
        title: `Incident Response: ${incident.title || incident.category || 'Unknown Threat'}`,
        generatedBy: llmResponse ? 'llm' : 'template',
        category: incident.category || 'unknown',
        steps: steps.map((s, i) => ({ ...s, order: i + 1, status: 'pending' })),
        estimatedResolutionTime: estimateTime(steps),
        regulatoryRequirements: ['NIST SP 800-61', 'RBI Master Direction'],
        status: 'generated',
        llmModel: model,
        llmPrompt: prompt,
    };

    return playbook;
}

// ── Prompt Builders ─────────────────────────────────────────────────────────

function buildEnhancementPrompt(incident, template, alertDetails) {
    return `You are a banking cybersecurity incident response expert for an Indian bank.

An incident has been detected. There is a standard template playbook, but you need to add context-specific steps.

INCIDENT DETAILS:
- Type: ${incident.category || 'Unknown'}
- Severity: ${incident.severity || 'medium'}
- Attack Stage: ${incident.attackStage || 'initial_access'}
- Source IPs: ${(incident.sourceIPs || []).join(', ') || 'N/A'}
- Affected Endpoints: ${(incident.targetEndpoints || []).join(', ') || 'N/A'}
- Number of Related Alerts: ${(incident.alertIds || []).length}
- Max Fidelity Score: ${incident.maxFidelity || 'N/A'}
${alertDetails.length > 0 ? `\nALERT SAMPLES:\n${alertDetails.slice(0, 3).map(a => `  - ${a.method} ${a.url} from ${a.sourceIP} (${a.attackType})`).join('\n')}` : ''}

EXISTING TEMPLATE STEPS:
${template.steps.map((s, i) => `${i + 1}. ${s.action} (${s.assignee}, ${s.estimatedTime})`).join('\n')}

Based on the specific incident context, provide 1-3 ADDITIONAL steps that are NOT in the template but are relevant to this specific attack. Consider:
1. Industry-specific risks (banking, payments, customer data)
2. Indian regulatory requirements (RBI, CERT-In, IT Act 2000)
3. The specific endpoints and attack patterns involved

Return ONLY a JSON array of additional steps:
[{"action": "...", "assignee": "SOC-L1|SOC-L2|SOC-L3|IT-Ops|DBA|Management|Legal|CERT-In", "estimatedTime": "15m", "verification": "...", "automated": false}]`;
}

function buildFullGenerationPrompt(incident, alertDetails) {
    return `You are a banking cybersecurity incident response expert for an Indian bank.

Generate a complete step-by-step incident response playbook for the following incident.

INCIDENT DETAILS:
- Type: ${incident.category || 'Unknown'}
- Severity: ${incident.severity || 'medium'}
- Description: ${incident.description || 'No description'}
- Attack Stage: ${incident.attackStage || 'unknown'}
- Source IPs: ${(incident.sourceIPs || []).join(', ') || 'N/A'}
- Affected Endpoints: ${(incident.targetEndpoints || []).join(', ') || 'N/A'}
- Number of Related Alerts: ${(incident.alertIds || []).length}
- Fidelity Score: ${incident.maxFidelity || 'N/A'} / 100
${alertDetails.length > 0 ? `\nALERT SAMPLES:\n${alertDetails.slice(0, 5).map(a => `  - ${a.method} ${a.url} from ${a.sourceIP} (fidelity: ${a.fidelityScore})`).join('\n')}` : ''}

REQUIREMENTS:
1. Follow NIST SP 800-61 (Incident Response Lifecycle)
2. Include PCI-DSS requirements if payment data is involved
3. Follow RBI cybersecurity framework for Indian banking
4. Include CERT-In reporting requirements (6-hour window for critical)
5. Each step must have: action, assignee, estimated time, verification criteria

ASSIGNEE OPTIONS: SOC-L1, SOC-L2, SOC-L3, IT-Ops, DBA, Management, Legal, CERT-In

Return a JSON array of steps:
[{"action": "...", "assignee": "...", "estimatedTime": "15m", "verification": "...", "automated": false}]`;
}

// ── Ollama Integration ──────────────────────────────────────────────────────

async function callOllama(model, prompt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt,
                stream: false,
                options: { temperature: 0.3, top_p: 0.9 }, // Low temp for structured output
            }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`Ollama returned ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        return data.response || '';
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            throw new Error('Ollama request timed out (30s)');
        }
        throw err;
    }
}

// ── LLM Response Parsing ────────────────────────────────────────────────────

function parseStepsFromLLM(response) {
    if (!response) return [];

    try {
        // Try direct JSON parse first
        const parsed = JSON.parse(response.trim());
        if (Array.isArray(parsed)) return normalizeSteps(parsed);
    } catch (_) {
        // Not direct JSON, try to extract JSON from markdown code blocks
    }

    // Try extracting JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[1].trim());
            if (Array.isArray(parsed)) return normalizeSteps(parsed);
        } catch (_) {}
    }

    // Try finding JSON array in the text
    const arrayMatch = response.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
        try {
            const parsed = JSON.parse(arrayMatch[0]);
            if (Array.isArray(parsed)) return normalizeSteps(parsed);
        } catch (_) {}
    }

    logger.warn({ responseTruncated: response.slice(0, 200) }, 'Could not parse LLM response as JSON');
    return [];
}

function normalizeSteps(steps) {
    const validAssignees = ['SOC-L1', 'SOC-L2', 'SOC-L3', 'IT-Ops', 'DBA', 'Management', 'Legal', 'CERT-In'];

    return steps
        .filter(s => s && s.action)
        .map(s => ({
            action: String(s.action || '').slice(0, 500),
            assignee: validAssignees.includes(s.assignee) ? s.assignee : 'SOC-L1',
            estimatedTime: s.estimatedTime || s.estimated_time || '15m',
            verification: s.verification || '',
            automated: Boolean(s.automated),
        }));
}

// ── Merge & Utility ─────────────────────────────────────────────────────────

function mergeSteps(templateSteps, llmSteps) {
    // Remove LLM duplicates of template steps (fuzzy match by action keywords)
    const templateKeywords = templateSteps.map(s =>
        s.action.toLowerCase().split(/\s+/).filter(w => w.length > 4)
    );

    const uniqueLLMSteps = llmSteps.filter(llmStep => {
        const llmWords = llmStep.action.toLowerCase().split(/\s+/).filter(w => w.length > 4);
        return !templateKeywords.some(tWords =>
            tWords.filter(w => llmWords.includes(w)).length >= 3
        );
    });

    // Insert LLM steps after the closest related template step, or at the end
    return [...templateSteps, ...uniqueLLMSteps];
}

function generateGenericSteps(incident) {
    return [
        { action: 'Acknowledge the incident and assign to investigating analyst', assignee: 'SOC-L1', estimatedTime: '5m', verification: 'Incident status set to "investigating"', automated: false },
        { action: `Block source IPs: ${(incident.sourceIPs || []).join(', ') || 'N/A'}`, assignee: 'SOC-L1', estimatedTime: '5m', verification: 'IPs blocked at WAF/gateway level', automated: true },
        { action: 'Collect and preserve all relevant logs and evidence', assignee: 'SOC-L2', estimatedTime: '20m', verification: 'Logs exported and hash-verified', automated: false },
        { action: 'Assess impact on banking operations and customer data', assignee: 'SOC-L2', estimatedTime: '30m', verification: 'Impact assessment document completed', automated: false },
        { action: 'Implement containment measures appropriate to the attack type', assignee: 'SOC-L2', estimatedTime: '15m', verification: 'Attack vector neutralized', automated: false },
        { action: 'Evaluate if CERT-In reporting is required (6-hour window for critical)', assignee: 'Management', estimatedTime: '30m', verification: 'Reporting decision documented', automated: false },
        { action: 'Document lessons learned and update detection rules', assignee: 'SOC-L3', estimatedTime: '30m', verification: 'Post-incident report filed', automated: false },
    ];
}

function estimateTime(steps) {
    let totalMinutes = 0;
    for (const step of steps) {
        const time = step.estimatedTime || '15m';
        const match = time.match(/(\d+)\s*(m|h)/);
        if (match) {
            totalMinutes += match[2] === 'h' ? parseInt(match[1]) * 60 : parseInt(match[1]);
        }
    }
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${mins > 0 ? mins + 'm' : ''}`.trim() : `${mins}m`;
}

// ── Worker Mode (Standalone) ────────────────────────────────────────────────
// When run directly, listens on Redis for new incidents and auto-generates playbooks

async function startWorker() {
    logger.info('Starting ARIA Playbook Generation worker...');

    await mongoose.connect(MONGO_URI);
    logger.info({ db: MONGO_URI.replace(/\/\/.*@/, '//***@') }, 'MongoDB connected');

    const redis = new Redis(REDIS_URL);
    const subscriber = new Redis(REDIS_URL);
    logger.info('Redis connected');

    // Listen for new incidents
    await subscriber.subscribe('aria:incidents:new', 'aria:playbook:request');

    subscriber.on('message', async (channel, message) => {
        try {
            const data = JSON.parse(message);

            if (channel === 'aria:incidents:new') {
                // Auto-generate playbook for new incident
                const incident = await Incident.findById(data.incidentId);
                if (!incident) {
                    logger.warn({ incidentId: data.incidentId }, 'Incident not found');
                    return;
                }

                // Fetch related alerts for context
                const alertDetails = await Alert.find({ _id: { $in: incident.alertIds } })
                    .select('method url sourceIP attackType fidelityScore')
                    .limit(5)
                    .lean();

                const playbook = await generatePlaybook(incident, { alertDetails });

                // Save to MongoDB
                const saved = await Playbook.create(playbook);

                // Link playbook to incident
                await Incident.findByIdAndUpdate(incident._id, { playbookId: saved._id });

                // Notify dashboard
                await redis.publish('aria:playbook:generated', JSON.stringify({
                    playbookId: saved._id,
                    incidentId: incident._id,
                    title: saved.title,
                    stepCount: saved.steps.length,
                }));

                logger.info({ playbookId: saved._id, incidentId: incident._id, steps: saved.steps.length, generatedBy: saved.generatedBy }, 'Playbook generated');
            }

            if (channel === 'aria:playbook:request') {
                // Manual playbook request from dashboard
                const { incidentId, alertId, forceLLM } = data;
                let incident;

                if (incidentId) {
                    incident = await Incident.findById(incidentId);
                } else if (alertId) {
                    // Generate playbook for a single alert (creates a mini-incident)
                    const alert = await Alert.findById(alertId);
                    if (!alert) return;
                    incident = {
                        _id: alertId,
                        category: alert.category || alert.attackType,
                        severity: alert.severity,
                        sourceIPs: [alert.sourceIP],
                        targetEndpoints: [alert.url],
                        alertIds: [alertId],
                        maxFidelity: alert.fidelityScore,
                    };
                }

                if (!incident) {
                    logger.warn({ incidentId, alertId }, 'Target not found for playbook request');
                    return;
                }

                const playbook = await generatePlaybook(incident, { forceLLM });
                playbook.alertId = alertId;
                const saved = await Playbook.create(playbook);

                await redis.publish('aria:playbook:generated', JSON.stringify({
                    playbookId: saved._id,
                    incidentId: incidentId || alertId,
                    title: saved.title,
                    stepCount: saved.steps.length,
                }));

                logger.info({ playbookId: saved._id, steps: saved.steps.length }, 'Playbook generated on request');
            }
        } catch (err) {
            logger.error({ err: err.message, channel }, 'Error processing playbook request');
        }
    });

    logger.info('Playbook worker listening for incidents on Redis...');

    // Graceful shutdown
    const shutdown = async () => {
        logger.info('Shutting down playbook worker...');
        subscriber.disconnect();
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
        logger.fatal({ err: err.message }, 'Playbook worker crashed');
        process.exit(1);
    });
}

// ── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
    generatePlaybook,
    TEMPLATES,
    parseStepsFromLLM,
    callOllama,
};
