const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/aria_db';

const now = new Date();
function randomTimeAgo(hours) {
    return new Date(now.getTime() - Math.floor(Math.random() * hours * 60 * 60 * 1000));
}

// ---------------- ALERTS & LOGS ----------------
// We use a "Dual-Schema" approach to satisfy both legacy MAF code and new ARIA code
const mockAlerts = [];

const attackTypes = ['sqli', 'xss', 'traversal', 'command_injection', 'credential_stuffing', 'brute_force'];
const ips = ['103.45.12.99', '45.22.19.111', '192.168.1.105', '55.10.122.9', '99.102.33.21', '185.199.108.153'];
const paths = ['/api/transfer', '/api/login', '/api/accounts/balance', '/api/users/profile', '/api/admin/config'];

// Generate 60 active alerts for the last 24 hours to make graphs look good
for (let i = 0; i < 60; i++) {
    // Distribute timestamps more evenly for the graph
    const time = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000 / 60)); // Spread 60 points over 24h
    const category = attackTypes[i % attackTypes.length];
    const sourceIP = ips[i % ips.length];
    const path = paths[i % paths.length];
    const fidelity = 20 + Math.floor(Math.random() * 80);
    const isBlock = fidelity > 75;

    mockAlerts.push({
        id: `req-gen-${i}`,
        // ARIA New Schema
        timestamp: time,
        sourceIP: sourceIP,
        path: path,
        aiDecision: isBlock ? "block" : "allow",
        category: category,
        fidelityScore: fidelity,
        severity: fidelity > 90 ? 'critical' : (fidelity > 70 ? 'high' : 'medium'),
        triageStatus: 'pending',
        serviceName: "Retail Banking Portal",

        // Compatibility/Legacy Fields (satisfies /api/logs, /api/events, & various dashboard filters)
        ip: sourceIP,
        uri: path,
        url: path,
        status: isBlock ? 403 : 200,
        createdAt: time,
        time: time.toISOString(),
        action: isBlock ? "Blocked" : "Passed",
        decision: isBlock ? "block" : "allow",
        attackType: category,
        type: category,

        scores: {
            regex: Math.random(),
            llm: Math.random(),
            anomaly: Math.random(),
            ueba: Math.random()
        },
        aiReasoning: `Automated detection of ${category} based on anomalous payload patterns.`,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebkit/537.36",
        headers: { "host": "bank.local", "content-type": "application/json" },
        body: i % 2 === 0 ? '{"test": "payload"}' : ''
    });
}

// Ensure at least 5 alerts are in the last 15 minutes for real-time QPS visibility
for (let i = 1; i <= 5; i++) {
    const time = new Date(now.getTime() - i * 2 * 60 * 1000); // every 2 mins
    mockAlerts.push({
        id: `req-realtime-${i}`,
        timestamp: time,
        sourceIP: "127.0.0.1",
        path: "/api/login",
        aiDecision: "block",
        category: "credential_stuffing",
        fidelityScore: 98,
        severity: 'critical',
        triageStatus: 'pending',
        serviceName: "Retail Banking Portal",
        ip: "127.0.0.1",
        uri: "/api/login",
        url: "/api/login",
        createdAt: time,
        time: time.toISOString(),
        action: "Blocked",
        decision: "block",
        attackType: "credential_stuffing",
        type: "credential_stuffing",
        scores: { regex: 0.95, llm: 0.98, anomaly: 0.9, ueba: 0.9 },
        aiReasoning: "Real-time verification alert triggered.",
        userAgent: "Verification-Agent/1.0",
        headers: { "host": "bank.local" }
    });
}

// ---------------- EVENTS ----------------
const mockEvents = mockAlerts.slice(0, 20).map((a, i) => ({
    id: `EV-${1000 + i}`,
    time: a.timestamp.toISOString(),
    ip: a.sourceIP,
    type: a.category.toUpperCase() + " Attempt",
    action: a.aiDecision === 'block' ? "Blocked" : "Escalated",
    severity: a.severity.charAt(0).toUpperCase() + a.severity.slice(1),
    createdAt: a.timestamp,
    alertId: null
}));

// ---------------- APPLICATIONS / PROTECTED SERVICES ----------------
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
        createdAt: new Date()
    }
];

// ---------------- INCIDENTS ----------------
const mockIncidents = [
    {
        title: "Distributed Credential Stuffing Campaign",
        description: "Multiple IPs attempting rapid login variations using leaked credentials",
        category: "credential_stuffing",
        severity: "critical",
        status: "investigating",
        alertCount: 45,
        sourceIPs: ["103.45.12.99", "45.22.19.111"],
        targetEndpoints: ["/api/login"],
        attackStage: "reconnaissance",
        timeRange: { start: randomTimeAgo(48), end: randomTimeAgo(2) },
        avgFidelity: 92.5,
        maxFidelity: 98,
        createdAt: randomTimeAgo(48),
        updatedAt: randomTimeAgo(2)
    }
];

async function seed() {
    try {
        console.log("Connecting to MongoDB at", MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log("Connected.");
        
        const db = mongoose.connection.db;

        console.log("Clearing Existing Collections...");
        await db.collection('alerts').deleteMany({});
        await db.collection('events').deleteMany({});
        await db.collection('protectedservices').deleteMany({});
        await db.collection('incidents').deleteMany({});
        await db.collection('playbooks').deleteMany({});
        await db.collection('evolutionchanges').deleteMany({});

        console.log(`Seeding ${mockAlerts.length} total Alerts (including ip/uri/createdAt/decision/attackType for compatibility)...`);
        await db.collection('alerts').insertMany(mockAlerts);

        console.log(`Seeding ${mockEvents.length} Events...`);
        await db.collection('events').insertMany(mockEvents);

        console.log("Seeding Protected Services...");
        await db.collection('protectedservices').insertMany(mockApps);

        console.log("Seeding Incidents...");
        await db.collection('incidents').insertMany(mockIncidents);

        console.log("--- SEEDING COMPLETE ---");
        console.log("The dashboard should now show data across ALL pages, maps, graphs, and tables.");

    } catch (err) {
        console.error("Error during seeding:", err);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
