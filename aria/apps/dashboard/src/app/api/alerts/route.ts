// [ARIA] NEW: Alerts API route — replaces /api/logs.
// Queries the Alert collection with support for fidelity, severity, triageStatus,
// and detection source filters in addition to the standard search/time filters.

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Alert from '@/lib/models/Alert';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const severity = searchParams.get('severity');
        const triageStatus = searchParams.get('triageStatus');
        const decision = searchParams.get('decision');
        const detectionSource = searchParams.get('detectionSource');
        const minFidelity = searchParams.get('minFidelity');
        const maxFidelity = searchParams.get('maxFidelity');

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};

        // [ARIA] Severity filter (critical, high, medium, low, info)
        if (severity) {
            const severities = severity.split(',').map(s => s.trim());
            filter.severity = { $in: severities };
        }

        // [ARIA] Triage status filter (pending, approved, rejected, auto-resolved)
        if (triageStatus) {
            const statuses = triageStatus.split(',').map(s => s.trim());
            filter.triageStatus = { $in: statuses };
        }

        // [ARIA] Decision filter (block, allow, escalate, pending)
        if (decision) {
            const decisions = decision.split(',').map(s => s.trim());
            filter.decision = { $in: decisions };
        }

        // [ARIA] Detection source filter (regex, ai, both, none)
        if (detectionSource) {
            const sources = detectionSource.split(',').map(s => s.trim());
            filter.detectionSource = { $in: sources };
        }

        // [ARIA] Fidelity score range filter
        if (minFidelity || maxFidelity) {
            filter.fidelityScore = {};
            if (minFidelity) filter.fidelityScore.$gte = parseInt(minFidelity);
            if (maxFidelity) filter.fidelityScore.$lte = parseInt(maxFidelity);
        }

        // Search filter (IP, URI, method, attackType)
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            filter.$or = [
                { ip: searchRegex },
                { uri: searchRegex },
                { method: searchRegex },
                { attackType: searchRegex },
            ];
        }

        // Time filter
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to);
        }

        const total = await Alert.countDocuments(filter);
        const alerts = await Alert.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            data: alerts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Failed to fetch alerts', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch alerts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        logger.info('Received new alert', { body });

        const alert = await Alert.create(body);

        // [ARIA] REMOVED: await redis.del('maf:logs:recent');
        // [ARIA] NEW: Invalidate ARIA alerts cache
        await redis.del('aria:alerts:recent');
        logger.info('Alert created and cache invalidated');

        return NextResponse.json({ success: true, data: alert }, { status: 201 });
    } catch (error) {
        logger.error('Failed to create alert', error);
        return NextResponse.json({ success: false, error: 'Failed to create alert' }, { status: 400 });
    }
}
