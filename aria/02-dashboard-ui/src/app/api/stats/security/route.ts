// [ARIA] REMOVED: import Log from '@/lib/models/Log';
// [ARIA] NEW: Security stats now aggregate from Alert collection instead of Log
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Alert from '@/lib/models/Alert';
import SecurityEvent from '@/lib/models/Event';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();

        // [ARIA] 1. KPIs — now using Alert collection for request/attack counts
        const totalAttacks = await Alert.countDocuments({ decision: { $in: ['block', 'escalate'] } });
        const totalRequests = await Alert.countDocuments();
        // [ARIA] NEW: Pending triage count for dashboard KPI
        const pendingTriage = await Alert.countDocuments({ triageStatus: 'pending' });
        const criticalCount = await Alert.countDocuments({ severity: 'critical' });
        const highCount = await Alert.countDocuments({ severity: 'high' });
        // [ARIA] NEW: Average fidelity score across all alerts
        const avgFidelityResult = await Alert.aggregate([
            { $group: { _id: null, avg: { $avg: '$fidelityScore' } } }
        ]);
        const avgFidelity = avgFidelityResult.length > 0 ? Math.round(avgFidelityResult[0].avg) : 0;

        // [ARIA] 2. Trends (Last 24 hours)
        const attacksTrendRaw = await Alert.aggregate([
            { $match: { decision: { $in: ['block', 'escalate'] } } },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // [ARIA] REMOVED: trafficTrendRaw used Log.aggregate
        // [ARIA] NEW: Traffic trend now from Alert collection (all alerts = all analyzed traffic)
        const trafficTrendRaw = await Alert.aggregate([
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatTrend = (data: any[]) => {
            const map = new Map(data.map(d => [d._id, d.count]));
            return Array.from({ length: 24 }).map((_, i) => ({
                name: `${i}:00`,
                value: map.get(i) || 0
            }));
        };

        const attacksTrend = formatTrend(attacksTrendRaw);
        const allowDenyTrend = formatTrend(trafficTrendRaw);

        // [ARIA] 3. Real-time Events (still from Event collection)
        const recentEvents = await SecurityEvent.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('type id time createdAt action');

        // [ARIA] 4. Attack Types — now from Alert.attackType field
        const webAttackRaw = await Alert.aggregate([
            { $match: { attackType: { $exists: true, $ne: null } } },
            { $group: { _id: "$attackType", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        const webAttackData = webAttackRaw.map(d => ({
            name: d._id,
            value: d.count
        }));

        // [ARIA] 5. Attacked Pages — now from Alert.uri where decision is block
        // [ARIA] REMOVED: Log.aggregate with status: { $in: [403, 429] }
        const attackedPagesRaw = await Alert.aggregate([
            { $match: { decision: { $in: ['block', 'escalate'] } } },
            { $group: { _id: "$uri", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        const attackedPages = attackedPagesRaw.map(d => ({
            path: d._id,
            count: d.count
        }));

        // [ARIA] 6. Top IPs — now from Alert collection
        const topIPsRaw = await Alert.aggregate([
            { $match: { decision: { $in: ['block', 'escalate'] } } },
            { $group: { _id: "$ip", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        const topIPs = topIPsRaw.map(d => ({
            ip: d._id,
            count: d.count
        }));

        // [ARIA] 7. Detection source breakdown (new ARIA-specific stat)
        const detectionSourceRaw = await Alert.aggregate([
            { $group: { _id: "$detectionSource", count: { $sum: 1 } } }
        ]);
        const detectionSources = Object.fromEntries(
            detectionSourceRaw.map(d => [d._id || 'none', d.count])
        );

        return NextResponse.json({
            kpi: {
                // [ARIA] REMOVED: Old KPIs: attacks, allowDeny, rateLimit, waitingRoom, antiBot, auth
                // [ARIA] NEW: ARIA-specific KPIs for banking security
                attacks: totalAttacks,
                totalAlerts: totalRequests,
                pendingTriage,
                critical: criticalCount,
                high: highCount,
                avgFidelity,
            },
            trends: {
                attacks: attacksTrend,
                allowDeny: allowDenyTrend
            },
            realtimeEvents: recentEvents.map(e => ({
                type: e.type,
                title: e.id,
                time: e.time
            })),
            charts: {
                webAttack: webAttackData,
                ruleHit: [],
                attackedPages,
                topIPs
            },
            // [ARIA] NEW: Detection source distribution
            detectionSources,
        });

    } catch (error) {
        logger.error('Failed to fetch security stats', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch security stats' }, { status: 500 });
    }
}
