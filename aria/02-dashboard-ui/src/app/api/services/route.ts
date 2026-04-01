// [ARIA] NEW: Services API route — replaces /api/applications.
// CRUD operations for ProtectedService model (banking apps protected by ARIA gateway).
// Publishes config changes to Redis 'aria-config-reload' channel.

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ProtectedService from '@/lib/models/ProtectedService';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
    await dbConnect();

    try {
        const services = await ProtectedService.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ data: services });
    } catch (error) {
        logger.error('Failed to fetch services', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch services' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        logger.info('Creating new protected service', { body });

        // [ARIA] Basic validation
        if (!body.name || !body.domain || !body.ports || body.ports.length === 0) {
            return NextResponse.json({ success: false, error: 'Missing required fields: name, domain, ports' }, { status: 400 });
        }

        const service = await ProtectedService.create({
            ...body,
            defenseMode: body.defenseMode || 'Defense',
            defenseStatus: true,
            loggingEnabled: body.loggingEnabled !== undefined ? body.loggingEnabled : true,
        });

        logger.info('Protected service created successfully', { id: service._id });
        // [ARIA] REMOVED: await redis.publish('maf-config-reload', 'created');
        // [ARIA] NEW: Notify ARIA gateway of config changes
        await redis.publish('aria-config-reload', 'created');

        return NextResponse.json({ success: true, data: service }, { status: 201 });
    } catch (error) {
        logger.error('Failed to create service', error);
        return NextResponse.json({ success: false, error: 'Failed to create service' }, { status: 400 });
    }
}

export async function PUT(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        logger.info('PUT /api/services received', { id, updateData });

        if (!id) {
            logger.error('Missing Service ID');
            return NextResponse.json({ success: false, error: 'Service ID is required' }, { status: 400 });
        }

        const service = await ProtectedService.findByIdAndUpdate(id, updateData, { new: true });

        if (!service) {
            return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 });
        }

        logger.info('Protected service updated successfully', { id: service._id });
        // [ARIA] REMOVED: await redis.publish('maf-config-reload', 'updated');
        // [ARIA] NEW: Notify ARIA gateway of config changes
        await redis.publish('aria-config-reload', 'updated');

        return NextResponse.json({ success: true, data: service });
    } catch (error) {
        logger.error('Failed to update service', error);
        return NextResponse.json({ success: false, error: 'Failed to update service' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Service ID is required' }, { status: 400 });
        }

        const service = await ProtectedService.findByIdAndDelete(id);

        if (!service) {
            return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 });
        }

        logger.info('Protected service deleted successfully', { id });
        // [ARIA] REMOVED: await redis.publish('maf-config-reload', 'deleted');
        // [ARIA] NEW: Notify ARIA gateway of config changes
        await redis.publish('aria-config-reload', 'deleted');

        return NextResponse.json({ success: true, message: 'Service deleted successfully' });
    } catch (error) {
        logger.error('Failed to delete service', error);
        return NextResponse.json({ success: false, error: 'Failed to delete service' }, { status: 500 });
    }
}
