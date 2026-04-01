// [ARIA] NEW: Triage API route — analyst approve/reject endpoint for human-in-the-loop workflow
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Alert from '@/lib/models/Alert';
import Feedback from '@/lib/models/Feedback';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/triage — Fetch alerts pending triage, sorted by fidelity score (highest risk first)
 */
export async function GET(request: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status') || 'pending';
        const severity = searchParams.get('severity');
        const minFidelity = searchParams.get('minFidelity');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: Record<string, unknown> = { triageStatus: status };
        if (severity) query.severity = severity;
        if (minFidelity) query.fidelityScore = { $gte: parseInt(minFidelity) };

        const skip = (page - 1) * limit;
        const total = await Alert.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        // [ARIA] Sort by fidelity score descending — highest risk alerts surface first
        const alerts = await Alert.find(query)
            .sort({ fidelityScore: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return NextResponse.json({
            data: alerts,
            meta: { total, page, limit, totalPages }
        });
    } catch (error) {
        logger.error('Failed to fetch triage queue', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch triage queue' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/triage — Submit analyst triage decision (approve or reject an alert)
 * Body: { alertId, decision: 'approve_block'|'reject_block'|'approve_allow'|'reject_allow', reason?, analystId? }
 */
export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const { alertId, decision, reason, analystId } = body;

        if (!alertId || !decision) {
            return NextResponse.json(
                { success: false, error: 'alertId and decision are required' },
                { status: 400 }
            );
        }

        const validDecisions = ['approve_block', 'reject_block', 'approve_allow', 'reject_allow'];
        if (!validDecisions.includes(decision)) {
            return NextResponse.json(
                { success: false, error: `Invalid decision. Must be one of: ${validDecisions.join(', ')}` },
                { status: 400 }
            );
        }

        // [ARIA] Find alert and verify it exists
        const alert = await Alert.findById(alertId);
        if (!alert) {
            return NextResponse.json(
                { success: false, error: 'Alert not found' },
                { status: 404 }
            );
        }

        // [ARIA] Create Feedback document for self-evolution training
        const feedback = await Feedback.create({
            alertId,
            analystId: analystId || 'analyst-default',
            decision,
            reason: reason || ''
        });

        // [ARIA] Update alert triage status based on decision
        let newTriageStatus: 'pending' | 'approved' | 'rejected' | 'auto-resolved';
        if (decision === 'approve_block' || decision === 'approve_allow') {
            newTriageStatus = 'approved';
        } else {
            newTriageStatus = 'rejected';
        }

        alert.triageStatus = newTriageStatus;
        await alert.save();

        // [ARIA] Publish triage event to Redis for gateway/self-evolution consumption
        try {
            const { redis } = await import('@/lib/redis');
            await redis.publish('aria-alerts', JSON.stringify({
                type: 'triage_decision',
                alertId,
                decision,
                triageStatus: newTriageStatus,
                analystId: analystId || 'analyst-default',
                timestamp: new Date().toISOString()
            }));
        } catch (redisErr) {
            // [ARIA] Fail-open: Redis publish failure shouldn't block triage
            logger.warn('Failed to publish triage event to Redis', { error: String(redisErr) });
        }

        logger.info(`Triage decision: ${decision} for alert ${alertId} by ${analystId || 'analyst-default'}`);

        return NextResponse.json({
            success: true,
            feedback: { id: feedback._id, decision, alertId },
            alert: { id: alert._id, triageStatus: newTriageStatus }
        });
    } catch (error) {
        logger.error('Failed to process triage decision', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process triage decision' },
            { status: 500 }
        );
    }
}
