// [ARIA] Learning API route — aggregated stats for AI learning dashboard.
// Feature 14 (Learning Dashboard) reads from this endpoint to display
// evolution timeline, learned patterns list, and AI accuracy metrics.

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import EvolutionChange from '@/lib/models/EvolutionChange';
import LearnedPattern from '@/lib/models/LearnedPattern';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const patternLimit = parseInt(searchParams.get('patternLimit') || '50');

        // [ARIA] Total evolutions = all EvolutionChange documents
        const totalEvolutions = await EvolutionChange.countDocuments();

        // [ARIA] Active patterns = LearnedPattern with status 'active'
        const activePatterns = await LearnedPattern.countDocuments({ status: 'active' });

        // [ARIA] Average validation score across all EvolutionChange records
        const avgScoreResult = await EvolutionChange.aggregate([
            { $group: { _id: null, avgScore: { $avg: '$validationScore' } } },
        ]);
        const avgValidationScore = avgScoreResult?.[0]?.avgScore ?? 0;

        // [ARIA] Rollback rate = rolled_back / total evolutions
        const rolledBackCount = await EvolutionChange.countDocuments({ status: 'rolled_back' });
        const rollbackRate = totalEvolutions > 0
            ? Math.round((rolledBackCount / totalEvolutions) * 1000) / 10
            : 0;

        // [ARIA] Evolution timeline: date vs. average validation score grouped by day
        const timelineData = await EvolutionChange.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                    },
                    avgScore: { $avg: '$validationScore' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            { $limit: 90 },
        ]);

        // [ARIA] Changes by type breakdown for bar chart
        const changesByType = await EvolutionChange.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // [ARIA] Recent evolution changes (last 30) for timeline list
        const recentEvolutions = await EvolutionChange.find()
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();

        // [ARIA] Learned patterns list sorted by most recent
        const learnedPatterns = await LearnedPattern.find()
            .sort({ createdAt: -1 })
            .limit(patternLimit)
            .lean();

        return NextResponse.json({
            stats: {
                totalEvolutions,
                activePatterns,
                avgValidationScore: Math.round(avgValidationScore * 10) / 10,
                rollbackRate,
            },
            timelineData: (timelineData ?? []).map((d: { _id: string; avgScore: number; count: number }) => ({
                date: d._id,
                avgScore: Math.round((d.avgScore ?? 0) * 10) / 10,
                count: d.count ?? 0,
            })),
            changesByType: (changesByType ?? []).map((d: { _id: string; count: number }) => ({
                type: d._id ?? 'unknown',
                count: d.count ?? 0,
            })),
            recentEvolutions,
            learnedPatterns,
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to fetch learning dashboard data', msg);
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
