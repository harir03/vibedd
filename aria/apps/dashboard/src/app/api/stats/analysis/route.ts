import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
// [ARIA] REMOVED: Log model — replaced by Alert model for unified threat-centric data
// import Log from '@/lib/models/Log';
// [ARIA] REMOVED: SecurityEvent — blocked counts now derived from Alert.decision field
// import SecurityEvent from '@/lib/models/Event';
import Alert from '@/lib/models/Alert';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
    await dbConnect();

    try {
        // [ARIA] NEW: All analysis stats now sourced from Alert model instead of Log + SecurityEvent

        // 1. Decision Distribution (replaces Response Status Distribution)
        const decisionDist = await Alert.aggregate([
            { $group: { _id: "$decision", count: { $sum: 1 } } }
        ]);
        const decisionColors: Record<string, string> = {
            block: '#f43f5e', allow: '#2dd4bf', escalate: '#f59e0b', pending: '#94a3b8'
        };
        const responseStatusData = decisionDist.map(d => ({
            name: d._id || 'unknown',
            value: d.count,
            color: decisionColors[d._id] || '#6366f1'
        }));

        // 2. Top User Clients (User Agent) — same field name in Alert
        const uaDist = await Alert.aggregate([
            { $group: { _id: "$userAgent", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        const userClientsData = uaDist.map((u, i) => ({
            name: u._id ? (u._id.length > 15 ? u._id.substring(0, 15) + '...' : u._id) : 'Unknown',
            value: u.count,
            color: ["#2dd4bf", "#f59e0b", "#14b8a6", "#6366f1", "#f43f5e"][i % 5]
        }));

        // 3. Top IPs (all alerts, not just blocked)
        const ipDist = await Alert.aggregate([
            { $group: { _id: "$ip", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        const popularAppData = ipDist.map(ip => ({
            label: ip._id,
            value: ip.count,
            percent: 0
        }));

        // 4. Top URLs (Pages) — uses Alert.uri instead of Log.uri
        const urlDist = await Alert.aggregate([
            { $group: { _id: "$uri", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        const popularPageData = urlDist.map(u => ({
            label: u._id,
            value: u.count,
            percent: 0
        }));

        // 5. Summary Stats — all from Alert model
        const totalRequests = await Alert.countDocuments();
        const uniqueVisitorsResult = await Alert.aggregate([
            { $group: { _id: "$ip" } },
            { $count: "count" }
        ]);
        const uniqueVisitors = uniqueVisitorsResult.length > 0 ? uniqueVisitorsResult[0].count : 0;

        // [ARIA] NEW: Blocked count from Alert.decision instead of SecurityEvent.action
        const blockedCount = await Alert.countDocuments({ decision: 'block' });
        const attackingIpsResult = await Alert.aggregate([
            { $match: { decision: 'block' } },
            { $group: { _id: "$ip" } },
            { $count: "count" }
        ]);
        const attackingIps = attackingIpsResult.length > 0 ? attackingIpsResult[0].count : 0;

        // [ARIA] NEW: Escalated and pending triage counts (banking-specific KPIs)
        const escalatedCount = await Alert.countDocuments({ decision: 'escalate' });
        const pendingTriageCount = await Alert.countDocuments({ triageStatus: 'pending' });

        // [ARIA] REMOVED: HTTP status-based error counts — Alert doesn't track upstream HTTP status
        // const error4xx = await Log.countDocuments({ status: { $gte: 400, $lt: 500 } });
        // const error5xx = await Log.countDocuments({ status: { $gte: 500 } });

        // 6. Geo Stats — all from Alert model
        const geoRequests = await Alert.aggregate([
            { $group: { _id: "$country", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 7 }
        ]);
        const geoBlocked = await Alert.aggregate([
            { $match: { decision: 'block' } },
            { $group: { _id: "$country", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 7 }
        ]);

        const formatGeo = (data: any[]) => {
            const merged = new Map<string, number>();

            data.forEach(d => {
                const name = (d._id && d._id !== 'Unknown' && d._id !== 'UNKNOWN') ? d._id : "Unknown";
                merged.set(name, (merged.get(name) || 0) + d.count);
            });

            return Array.from(merged.entries())
                .map(([name, count]) => ({
                    name,
                    value: count.toString(),
                    percent: totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0
                }))
                .sort((a, b) => parseInt(b.value) - parseInt(a.value));
        };

        // [ARIA] NEW: Fidelity distribution for analysis charts
        const fidelityDist = await Alert.aggregate([
            {
                $bucket: {
                    groupBy: "$fidelityScore",
                    boundaries: [0, 10, 40, 70, 90, 101],
                    default: 'unknown',
                    output: { count: { $sum: 1 } }
                }
            }
        ]);

        return NextResponse.json({
            summary: {
                requests: totalRequests,
                pv: totalRequests,
                uv: uniqueVisitors,
                uniqueIp: uniqueVisitors,
                blocked: blockedCount,
                ipAddr: attackingIps,
                // [ARIA] REMOVED: error4xx, error5xx — not applicable to Alert model
                // error4xx,
                // error5xx,
                // [ARIA] NEW: Banking-specific KPIs
                escalated: escalatedCount,
                pendingTriage: pendingTriageCount
            },
            geo: {
                requests: formatGeo(geoRequests),
                blocked: formatGeo(geoBlocked)
            },
            responseStatus: responseStatusData,
            userClients: userClientsData,
            popularApp: popularAppData,
            popularPage: popularPageData,
            // [ARIA] NEW: Fidelity score distribution for risk analysis
            fidelityDistribution: fidelityDist
        });
    } catch (error) {
        logger.error('Failed to fetch analysis stats', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch analysis stats' }, { status: 500 });
    }
}
