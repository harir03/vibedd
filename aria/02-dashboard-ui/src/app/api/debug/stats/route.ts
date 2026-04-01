import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
// [ARIA] REMOVED: Log model — replaced by Alert for unified threat data
// import Log from '@/lib/models/Log';
import Alert from '@/lib/models/Alert';

export const dynamic = 'force-dynamic';

export async function GET() {
    await dbConnect();

    try {
        // [ARIA] NEW: Debug stats now query Alert model instead of Log
        const count = await Alert.countDocuments();
        const lastAlerts = await Alert.find().sort({ createdAt: -1 }).limit(5);

        // Test Aggregation
        const now = Date.now();
        const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
        const aggregation = await Alert.aggregate([
            { $match: { createdAt: { $gte: twentyFourHoursAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" },
                        hour: { $hour: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        // [ARIA] NEW: Additional debug info for triage pipeline
        const pendingCount = await Alert.countDocuments({ triageStatus: 'pending' });
        const decisionBreakdown = await Alert.aggregate([
            { $group: { _id: "$decision", count: { $sum: 1 } } }
        ]);

        return NextResponse.json({
            count,
            lastAlerts,
            aggregation,
            pendingTriage: pendingCount,
            decisionBreakdown,
            serverTime: new Date().toString(),
            mongoURI: process.env.MONGODB_URI
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
