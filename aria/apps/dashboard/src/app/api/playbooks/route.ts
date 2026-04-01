// [ARIA] Playbooks API route — manages LLM-generated response playbooks.
// Connects to Feature 09 (Playbook Generation) for auto-generation.

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Playbook from '@/lib/models/Playbook';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const category = searchParams.get('category');
        const incidentId = searchParams.get('incidentId');
        const alertId = searchParams.get('alertId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};

        if (status) filter.status = { $in: status.split(',').map(s => s.trim()) };
        if (category) filter.category = category;
        if (incidentId) filter.incidentId = incidentId;
        if (alertId) filter.alertId = alertId;

        const [playbooks, total] = await Promise.all([
            Playbook.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Playbook.countDocuments(filter),
        ]);

        return NextResponse.json({
            data: playbooks,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to fetch playbooks', msg);
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();

        // If requesting a playbook generation (via Redis to Feature 09)
        if (body.generate) {
            const { incidentId, alertId, forceLLM } = body;

            await redis.lpush('aria:playbook:request', JSON.stringify({
                incidentId,
                alertId,
                forceLLM: forceLLM || false,
            }));

            // Also publish for the playbook worker subscriber
            await redis.publish('aria:playbook:request', JSON.stringify({
                incidentId,
                alertId,
                forceLLM: forceLLM || false,
            }));

            logger.info(`Playbook generation requested: incidentId=${incidentId}, alertId=${alertId}`);
            return NextResponse.json({
                success: true,
                message: 'Playbook generation requested — will appear shortly',
            });
        }

        // Direct playbook creation (from template or manual)
        const playbook = await Playbook.create(body);
        logger.info(`Playbook created: ${playbook._id}`);
        return NextResponse.json({ success: true, data: playbook }, { status: 201 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to create playbook', msg);
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
