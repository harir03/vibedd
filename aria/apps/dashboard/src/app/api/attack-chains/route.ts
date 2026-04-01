// [ARIA] Attack Chains API route — aggregates Incident data by kill chain stage.
// Feature 12 (Attack Chain Visualization) reads from this endpoint
// to render the kill chain pipeline and recent incident table.

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Incident from '@/lib/models/Incident';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// [ARIA] Kill chain stages in order — matches Incident.attackStage enum
const KILL_CHAIN_STAGES = [
    'reconnaissance',
    'weaponization',
    'delivery',
    'exploitation',
    'installation',
    'command_control',
    'exfiltration',
] as const;

export async function GET(request: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');

        // [ARIA] Aggregate incidents by attackStage to get counts per kill chain stage
        const stageCounts = await Incident.aggregate([
            { $match: { attackStage: { $ne: 'unknown' } } },
            { $group: { _id: '$attackStage', count: { $sum: 1 } } },
        ]);

        // [ARIA] Build stage map with zero defaults for all stages
        const stageMap: Record<string, number> = {};
        for (const stage of KILL_CHAIN_STAGES) {
            stageMap[stage] = 0;
        }
        for (const row of stageCounts) {
            if (row._id && stageMap[row._id] !== undefined) {
                stageMap[row._id] = row.count ?? 0;
            }
        }

        // [ARIA] Compute summary stats
        const [totalChains, activeChains] = await Promise.all([
            Incident.countDocuments({ attackStage: { $ne: 'unknown' } }),
            Incident.countDocuments({
                attackStage: { $ne: 'unknown' },
                status: { $in: ['open', 'investigating'] },
            }),
        ]);

        // [ARIA] Average chain length = average alertCount across incidents with known stages
        const avgResult = await Incident.aggregate([
            { $match: { attackStage: { $ne: 'unknown' } } },
            { $group: { _id: null, avgLen: { $avg: '$alertCount' } } },
        ]);
        const avgChainLength = avgResult?.[0]?.avgLen ?? 0;

        // [ARIA] Find the highest stage reached (rightmost stage with count > 0)
        let highestStageReached = 'none';
        for (let i = KILL_CHAIN_STAGES.length - 1; i >= 0; i--) {
            if (stageMap[KILL_CHAIN_STAGES[i]] > 0) {
                highestStageReached = KILL_CHAIN_STAGES[i];
                break;
            }
        }

        // [ARIA] Recent incidents with known attack stages for the table
        const recentIncidents = await Incident.find({ attackStage: { $ne: 'unknown' } })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return NextResponse.json({
            stages: stageMap,
            stats: {
                totalChains,
                activeChains,
                avgChainLength: Math.round(avgChainLength * 10) / 10,
                highestStageReached,
            },
            recentIncidents,
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to fetch attack chain data', msg);
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
