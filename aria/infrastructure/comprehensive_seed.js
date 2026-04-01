// comprehensive_seed.js
db = db.getSiblingDB('aria_db');

const now = new Date();
function randomTimeAgo(hours) {
    return new Date(now.getTime() - Math.floor(Math.random() * hours * 60 * 60 * 1000));
}

function generateHex(length) {
    let result = '';
    const characters = '0123456789abcdef';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

const mockApps = [
    {
        name: "Retail Banking Portal",
        domain: "retail.bank.local",
        ports: [{ protocol: "https", port: "443" }],
        upstreams: ["http://10.0.0.51"],
        type: "Reverse Proxy",
        defenseMode: "Defense",
        defenseStatus: true,
        loggingEnabled: true,
        aiModel: "mistral",
        aiSystemPrompt: "You are protecting the retail banking interface from fraud.",
        createdAt: new Date()
    },
    {
        name: "Internal HR System",
        domain: "hr.bank.local",
        ports: [{ protocol: "http", port: "80" }],
        upstreams: ["http://10.0.0.52"],
        type: "Reverse Proxy",
        defenseMode: "Audited",
        defenseStatus: true,
        loggingEnabled: true,
        aiModel: "mistral",
        aiSystemPrompt: "You are protecting an internal HR portal.",
        createdAt: new Date()
    }
];

const mockIncidents = [
    {
        title: "Distributed Credential Stuffing Campaign",
        description: "Multiple IPs attempting rapid login variations using leaked credentials",
        category: "credential_stuffing",
        severity: "critical",
        status: "investigating",
        alertIds: [],
        alertCount: 45,
        sourceIPs: ["192.168.1.100", "203.0.113.45"],
        targetEndpoints: ["/api/login", "/auth"],
        attackStage: "reconnaissance",
        timeRange: { start: randomTimeAgo(48), end: randomTimeAgo(2) },
        avgFidelity: 92.5,
        maxFidelity: 98,
        correlationRule: "High-Volume Authentication Failures",
        assignedTo: "Alice_SOC",
        createdAt: randomTimeAgo(48),
        updatedAt: randomTimeAgo(2)
    },
    {
        title: "SQL Injection on Legacy Portal",
        description: "Blind SQLi attempts mapped against the legacy reports system.",
        category: "sql_injection",
        severity: "high",
        status: "open",
        alertIds: [],
        alertCount: 12,
        sourceIPs: ["45.33.22.11"],
        targetEndpoints: ["/api/reports"],
        attackStage: "exploitation",
        timeRange: { start: randomTimeAgo(12), end: randomTimeAgo(1) },
        avgFidelity: 89.1,
        maxFidelity: 94,
        correlationRule: "SQL Syntax Injection Sequence",
        createdAt: randomTimeAgo(12),
        updatedAt: randomTimeAgo(1)
    }
];

const mockPlaybooks = [
    {
        incidentId: ObjectId(), // Will update this after inserting incidents
        title: "Credential Stuffing Response Plan",
        generatedBy: "llm",
        category: "credential_stuffing",
        steps: [
            { order: 1, action: "Identify related source IPs and temporarily blacklist them.", assignee: "SOC-L1", estimatedTime: "15m", verification: "Check WAF drop logs", automated: true, status: "completed", completedAt: randomTimeAgo(1) },
            { order: 2, action: "Force password reset for all target accounts.", assignee: "IT-Ops", estimatedTime: "2h", verification: "Check AD sync", automated: false, status: "pending" },
            { order: 3, action: "Enable rate limiting on /api/login specifically.", assignee: "SOC-L2", estimatedTime: "30m", verification: "Test with Postman requests", automated: true, status: "in_progress" }
        ],
        estimatedResolutionTime: "3h",
        regulatoryRequirements: ["PCI-DSS 8.1.6", "RBI CSCRF 5.4"],
        status: "in_progress",
        llmModel: "mistral",
        llmPrompt: "Generate a playbook for a distributed credential stuffing attack on the login portal...",
        createdAt: randomTimeAgo(40),
        updatedAt: randomTimeAgo(1)
    }
];

const mockEvolutions = [
    {
        type: "regex",
        description: "Added strict pattern for Union-Based SQLi",
        reason: "Missed 3 advanced attacks last week on reporting portal",
        previousValue: "/union.*select/i",
        proposedValue: "/(?:union\\s+(?:all\\s+)?select|\\bselect\\b.*?\\bfrom\\b)/i",
        trigger: "auto_tune",
        validationScore: 98.4,
        validationDetails: { testCases: 1000, passed: 984, failed: 16, falsePositiveRate: 0.01, falseNegativeRate: 0.02 },
        status: "deployed",
        deployedAt: randomTimeAgo(5),
        performanceMetrics: { preChangeFPRate: 0.05, postChangeFPRate: 0.01, preChangeTPRate: 0.90, postChangeTPRate: 0.98 },
        affectedModule: "gateway-regex",
        createdBy: "aria-agent",
        approvedBy: "Bob_SOC",
        createdAt: randomTimeAgo(10),
        updatedAt: randomTimeAgo(5)
    },
    {
        type: "threshold",
        description: "Lowered Fidelity Threshold for XSS",
        reason: "XSS campaigns evolving dynamically, needs proactive flagging.",
        previousValue: { xssFidelityRequirement: 90 },
        proposedValue: { xssFidelityRequirement: 85 },
        trigger: "analysis",
        validationScore: 93.0,
        validationDetails: { testCases: 500, passed: 465, failed: 35, falsePositiveRate: 0.04, falseNegativeRate: 0.03 },
        status: "monitoring",
        monitoringStartedAt: randomTimeAgo(2),
        affectedModule: "fidelity-weights",
        createdBy: "aria-agent",
        createdAt: randomTimeAgo(4),
        updatedAt: randomTimeAgo(2)
    }
];

const mockLearnedPatterns = [
    {
        pattern: "(?i)(?:<script.*?>|onload=|onerror=)",
        flags: "ig",
        category: "xss",
        description: "Matches common inline JS execution vectors",
        confidence: 0.92,
        source: "evolved",
        generatedFrom: ["req-mock-1", "req-mock-2"],
        validationResults: { truePositives: 420, falsePositives: 2, trueNegatives: 5000, falseNegatives: 12 },
        status: "active",
        deployedAt: randomTimeAgo(24),
        hitCount: 145,
        falsePositiveCount: 1,
        createdAt: randomTimeAgo(30),
        updatedAt: randomTimeAgo(24)
    }
];

const mockEvents = [
    {
        id: "EV-" + Math.floor(1000 + Math.random() * 9000),
        time: randomTimeAgo(1).toISOString(),
        ip: "103.45.12.99",
        type: "SQL Injection Detection",
        action: "Escalated",
        severity: "High",
        createdAt: randomTimeAgo(1)
    },
    {
        id: "EV-" + Math.floor(1000 + Math.random() * 9000),
        time: randomTimeAgo(2).toISOString(),
        ip: "192.168.1.100",
        type: "Rate Limit Exceeded",
        action: "Blocked",
        severity: "Medium",
        createdAt: randomTimeAgo(2)
    }
];


// Execute Inserts

print("Seeding Protected Services...");
db.protectedservices.insertMany(mockApps);

print("Seeding Incidents...");
const insertedIncidents = db.incidents.insertMany(mockIncidents);

// Update playbook incident reference ID
mockPlaybooks[0].incidentId = insertedIncidents.insertedIds[0];

print("Seeding Playbooks...");
db.playbooks.insertMany(mockPlaybooks);

print("Seeding Evolution Changes...");
db.evolutionchanges.insertMany(mockEvolutions);

print("Seeding Learned Patterns...");
db.learnedpatterns.insertMany(mockLearnedPatterns);

print("Seeding Events...");
db.events.insertMany(mockEvents);

print("All new mock data successfully populated!");
