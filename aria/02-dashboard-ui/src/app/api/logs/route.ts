// [ARIA] REMOVED: Original MAF logs API route that queried the Log collection.
// Replaced by: /api/alerts/route.ts which queries the Alert collection with fidelity/triage filters.
// This file now re-exports from the alerts route for backwards compatibility.

// import { NextResponse } from 'next/server';
// import dbConnect from '@/lib/db';
// import Log from '@/lib/models/Log';
// import { redis } from '@/lib/redis';
// import { logger } from '@/lib/logger';
//
// export const dynamic = 'force-dynamic';
//
// export async function GET(request: Request) {
//     await dbConnect();
//     try {
//         const { searchParams } = new URL(request.url);
//         const status = searchParams.get('status');
//         const search = searchParams.get('search');
//         const from = searchParams.get('from');
//         const to = searchParams.get('to');
//         const page = parseInt(searchParams.get('page') || '1');
//         const limit = parseInt(searchParams.get('limit') || '20');
//         const skip = (page - 1) * limit;
//         const filter: any = {};
//         if (status) {
//             const statuses = status.split(',').map(s => parseInt(s.trim()));
//             filter.status = { $in: statuses };
//         }
//         if (search) {
//             const searchRegex = { $regex: search, $options: 'i' };
//             filter.$or = [{ ip: searchRegex }, { uri: searchRegex }, { method: searchRegex }];
//         }
//         if (from || to) {
//             filter.time = {};
//             if (from) filter.time.$gte = from;
//             if (to) filter.time.$lte = to;
//         }
//         const total = await Log.countDocuments(filter);
//         const logs = await Log.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
//         return NextResponse.json({ data: logs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
//     } catch (error) {
//         return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 });
//     }
// }
//
// export async function POST(request: Request) {
//     await dbConnect();
//     try {
//         const body = await request.json();
//         const log = await Log.create(body);
//         await redis.del('maf:logs:recent');
//         return NextResponse.json({ success: true, data: log }, { status: 201 });
//     } catch (error) {
//         return NextResponse.json({ success: false, error: 'Failed to create log' }, { status: 400 });
//     }
// }

// [ARIA] NEW: Re-export alerts route handlers for /api/logs backwards compatibility
export { GET, POST } from '@/app/api/alerts/route';
export const dynamic = 'force-dynamic';
