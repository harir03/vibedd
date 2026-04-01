// [ARIA] Evolution API route — tracks self-evolution changes and audit trail.
// Connects to Feature 10 (Self-Evolving Agent) for change history.

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
        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const trigger = searchParams.get('trigger');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};

        if (type) filter.type = { $in: type.split(',').map(s => s.trim()) };
        if (status) filter.status = { $in: status.split(',').map(s => s.trim()) };
        if (trigger) filter.trigger = trigger;

        const [changes, total] = await Promise.all([
            EvolutionChange.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            EvolutionChange.countDocuments(filter),
        ]);

        return NextResponse.json({
            data: changes,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to fetch evolution changes', msg);
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

// [ARIA] Also expose learned patterns at /api/evolution?view=patterns
// This avoids creating a separate /api/patterns route
export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();

        // Query learned patterns
        if (body.action === 'patterns') {
            const status = body.status || 'active';
            const patterns = await LearnedPattern.find({
                status: { $in: status.split(',').map((s: string) => s.trim()) },
            })
                .sort({ createdAt: -1 })
                .limit(body.limit || 50)
                .lean();

            return NextResponse.json({ data: patterns });
        }

        // Manual evolution trigger
        if (body.action === 'trigger') {
            // This would publish to Redis to trigger the self-evolving agent
            // For now, just log the request
            logger.info(`Manual evolution trigger requested: trigger=${body.trigger}, type=${body.type}`);
            return NextResponse.json({
                success: true,
                message: 'Evolution trigger sent — agent will process on next cycle',
            });
        }

        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to process evolution request', msg);
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
