// [ARIA] Application Policy API Route
// Manages AI policy (system prompt + custom model) for a protected service.

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
// [ARIA] REMOVED: Application model from MAF.
// Was: import Application from '@/lib/models/Application';
// Replaced by: ProtectedService model for ARIA's single banking app config.
import ProtectedService from '@/lib/models/ProtectedService';
import { logger } from '@/lib/logger';
import { createCustomModel } from '@/lib/ollama';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;

    try {
        const body = await request.json();
        const { systemPrompt } = body;

        // [ARIA] NEW: Updated log message for ARIA context
        logger.info('Updating AI Policy for service', { id, systemPrompt });

        if (!systemPrompt || typeof systemPrompt !== 'string') {
            return NextResponse.json(
                { success: false, error: 'System prompt is required' },
                { status: 400 }
            );
        }

        // [ARIA] REMOVED: const app = await Application.findById(id);
        // Replaced by: ProtectedService.findById(id) for ARIA model.
        const service = await ProtectedService.findById(id);
        if (!service) {
            // [ARIA] NEW: Error message says "Service" instead of "Application"
            return NextResponse.json(
                { success: false, error: 'Service not found' },
                { status: 404 }
            );
        }

        // [ARIA] Generate a unique model name
        const timestamp = Date.now();
        // [ARIA] REMOVED: Model name prefix was `maf-custom-`.
        // Was: const modelName = `maf-custom-${app._id}-${timestamp}`;
        // Replaced by: `aria-custom-` prefix for ARIA namespace.
        const modelName = `aria-custom-${service._id}-${timestamp}`;

        // [ARIA] Create the model using Ollama
        await createCustomModel(modelName, systemPrompt);

        // [ARIA] NEW: Update ProtectedService fields
        service.aiModel = modelName;
        service.aiSystemPrompt = systemPrompt;

        // [ARIA] REMOVED: policyHistory tracking from MAF.
        // MAF stored policyHistory inline on the Application document.
        // ProtectedService schema does not have a policyHistory field,
        // so we only persist the current aiModel + aiSystemPrompt.
        // if (!app.policyHistory) app.policyHistory = [];
        // app.policyHistory.unshift({
        //     prompt: systemPrompt,
        //     modelName: modelName,
        //     createdAt: new Date()
        // });

        await service.save();

        logger.info('AI Policy updated for service', { id, modelName });

        // [ARIA] REMOVED: Redis channel was 'maf-config-reload'.
        // Was: await redis.publish('maf-config-reload', 'policy-update');
        // Replaced by: 'aria-config-reload' for ARIA pub/sub namespace.
        await redis.publish('aria-config-reload', 'policy-update');

        return NextResponse.json({ success: true, data: service });

    } catch (error) {
        logger.error('Failed to update AI policy', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update AI policy' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;

    try {
        // [ARIA] REMOVED: const app = await Application.findById(id);
        // Replaced by: ProtectedService.findById(id) for ARIA model.
        const service = await ProtectedService.findById(id);
        if (!service) {
            // [ARIA] NEW: Error message says "Service" instead of "Application"
            return NextResponse.json(
                { success: false, error: 'Service not found' },
                { status: 404 }
            );
        }

        // [ARIA] REMOVED: policyHistory was returned from MAF's Application model.
        // ProtectedService does not have policyHistory, so we return current policy only.
        // Was: policyHistory: app.policyHistory || []
        return NextResponse.json({
            success: true,
            data: {
                aiModel: service.aiModel ?? null,
                aiSystemPrompt: service.aiSystemPrompt ?? null,
            },
        });

    } catch (error) {
        logger.error('Failed to fetch AI policy', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch AI policy' },
            { status: 500 }
        );
    }
}
