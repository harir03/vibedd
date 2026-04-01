// [ARIA] Incidents API route — manages correlated alert groups.
// Automatically groups related alerts into incidents for triage.

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Incident from '@/lib/models/Incident';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const severity = searchParams.get('severity');
        const category = searchParams.get('category');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};

        if (status) {
            filter.status = { $in: status.split(',').map(s => s.trim()) };
        }
        if (severity) {
            filter.severity = { $in: severity.split(',').map(s => s.trim()) };
        }
        if (category) {
            filter.category = category;
        }

        const [incidents, total] = await Promise.all([
            Incident.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('playbookId')
                .lean(),
            Incident.countDocuments(filter),
        ]);

        return NextResponse.json({
            data: incidents,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to fetch incidents', msg);
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const incident = await Incident.create(body);

        logger.info(`Incident created: ${incident._id}`);
        return NextResponse.json({ success: true, data: incident }, { status: 201 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to create incident', msg);
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
