// [ARIA] Natural Language Query API route — maps NL patterns to MongoDB aggregations.
// Feature 16: Takes a query string, matches it against known NL patterns via regex,
// and returns structured results. No LLM — deterministic keyword matching for speed.

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Alert from '@/lib/models/Alert';
import Feedback from '@/lib/models/Feedback';
import Incident from '@/lib/models/Incident';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// [ARIA] Interface for a single query handler: regex pattern + handler function
interface QueryPattern {
    regex: RegExp;
    interpretation: string;
    handler: () => Promise<{ results: unknown[]; resultType: 'table' | 'stat' | 'list' }>;
}

export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const query = (body?.query ?? '').trim();

        if (!query) {
            return NextResponse.json(
                { success: false, error: 'Query is required' },
                { status: 400 }
            );
        }

        const lowerQuery = query.toLowerCase();

        // [ARIA] Define NL pattern matchers — order matters (first match wins)
        const patterns: QueryPattern[] = [
            // "critical alerts" / "critical alerts from today"
            {
                regex: /critical\s+alerts?/i,
                interpretation: 'Showing critical severity alerts',
                handler: async () => {
                    // [ARIA] Check if "today" is mentioned to add date filter
                    const filter: Record<string, unknown> = { severity: 'critical' };
                    if (/today|last\s*24|24\s*hours?/i.test(lowerQuery)) {
                        filter.createdAt = { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
                    }
                    const results = await Alert.find(filter)
                        .sort({ fidelityScore: -1, createdAt: -1 })
                        .limit(50)
                        .select('requestId ip method uri attackType severity fidelityScore decision createdAt')
                        .lean();
                    return { results: results ?? [], resultType: 'table' as const };
                },
            },
            // "high severity alerts"
            {
                regex: /high\s+(severity\s+)?alerts?/i,
                interpretation: 'Showing high severity alerts',
                handler: async () => {
                    const results = await Alert.find({ severity: 'high' })
                        .sort({ fidelityScore: -1, createdAt: -1 })
                        .limit(50)
                        .select('requestId ip method uri attackType severity fidelityScore decision createdAt')
                        .lean();
                    return { results: results ?? [], resultType: 'table' as const };
                },
            },
            // "top attacked endpoints" / "top 10 attacked endpoints"
            {
                regex: /top\s*\d*\s*(attacked|targeted)\s*(endpoints?|uri|url|paths?)/i,
                interpretation: 'Top attacked endpoints by alert count',
                handler: async () => {
                    const limitMatch = lowerQuery.match(/top\s*(\d+)/i);
                    const topN = limitMatch ? Math.min(parseInt(limitMatch[1]), 100) : 10;

                    // [ARIA] Check for time window
                    const dateFilter: Record<string, unknown> = {};
                    if (/this\s*week|last\s*7|7\s*days?/i.test(lowerQuery)) {
                        dateFilter.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
                    } else if (/today|last\s*24|24\s*hours?/i.test(lowerQuery)) {
                        dateFilter.createdAt = { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
                    }

                    const results = await Alert.aggregate([
                        { $match: dateFilter },
                        { $group: { _id: '$uri', count: { $sum: 1 }, avgFidelity: { $avg: '$fidelityScore' } } },
                        { $sort: { count: -1 } },
                        { $limit: topN },
                        { $project: { endpoint: '$_id', count: 1, avgFidelity: { $round: ['$avgFidelity', 1] }, _id: 0 } },
                    ]);
                    return { results: results ?? [], resultType: 'table' as const };
                },
            },
            // "sqli attacks" / "sql injection"
            {
                regex: /sql\s*i(njection)?|sql\s+attack/i,
                interpretation: 'SQL injection alerts',
                handler: async () => {
                    const filter: Record<string, unknown> = { attackType: /sql/i };
                    if (/last\s*24|24\s*hours?|today/i.test(lowerQuery)) {
                        filter.createdAt = { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
                    }
                    const results = await Alert.find(filter)
                        .sort({ fidelityScore: -1, createdAt: -1 })
                        .limit(50)
                        .select('requestId ip method uri fidelityScore decision severity createdAt')
                        .lean();
                    return { results: results ?? [], resultType: 'table' as const };
                },
            },
            // "xss attacks"
            {
                regex: /xss|cross.?site\s*script/i,
                interpretation: 'Cross-site scripting (XSS) alerts',
                handler: async () => {
                    const results = await Alert.find({ attackType: /xss/i })
                        .sort({ fidelityScore: -1, createdAt: -1 })
                        .limit(50)
                        .select('requestId ip method uri fidelityScore decision severity createdAt')
                        .lean();
                    return { results: results ?? [], resultType: 'table' as const };
                },
            },
            // "attacker IPs" / "most active IPs"
            {
                regex: /(attacker|active|malicious|top)\s*(ips?|addresses?|sources?)/i,
                interpretation: 'Most active source IPs by alert count',
                handler: async () => {
                    const results = await Alert.aggregate([
                        { $group: { _id: '$ip', count: { $sum: 1 }, avgFidelity: { $avg: '$fidelityScore' } } },
                        { $sort: { count: -1 } },
                        { $limit: 10 },
                        { $project: { ip: '$_id', count: 1, avgFidelity: { $round: ['$avgFidelity', 1] }, _id: 0 } },
                    ]);
                    return { results: results ?? [], resultType: 'table' as const };
                },
            },
            // "false positive rate"
            {
                regex: /false\s*positive\s*(rate|ratio|percent)/i,
                interpretation: 'False positive rate by detection source',
                handler: async () => {
                    // [ARIA] Compute FP rate from Feedback collection: reject_block = false positive
                    const totalFeedback = await Feedback.countDocuments();
                    const fpCount = await Feedback.countDocuments({ decision: 'reject_block' });
                    const fpRate = totalFeedback > 0
                        ? Math.round((fpCount / totalFeedback) * 1000) / 10
                        : 0;

                    // [ARIA] Also break down by detection source from alerts that have feedback
                    const bySource = await Alert.aggregate([
                        { $match: { triageStatus: { $in: ['approved', 'rejected'] } } },
                        {
                            $group: {
                                _id: '$detectionSource',
                                total: { $sum: 1 },
                                rejected: { $sum: { $cond: [{ $eq: ['$triageStatus', 'rejected'] }, 1, 0] } },
                            },
                        },
                        {
                            $project: {
                                source: '$_id',
                                total: 1,
                                rejected: 1,
                                fpRate: {
                                    $cond: [
                                        { $gt: ['$total', 0] },
                                        { $round: [{ $multiply: [{ $divide: ['$rejected', '$total'] }, 100] }, 1] },
                                        0,
                                    ],
                                },
                                _id: 0,
                            },
                        },
                        { $sort: { fpRate: -1 } },
                    ]);

                    return {
                        results: [
                            { metric: 'Overall FP Rate', value: `${fpRate}%`, total: totalFeedback, falsePositives: fpCount },
                            ...(bySource ?? []),
                        ],
                        resultType: 'table' as const,
                    };
                },
            },
            // "blocked requests" / "blocked alerts"
            {
                regex: /blocked\s*(requests?|alerts?|traffic)/i,
                interpretation: 'Recently blocked requests',
                handler: async () => {
                    const results = await Alert.find({ decision: 'block' })
                        .sort({ createdAt: -1 })
                        .limit(50)
                        .select('requestId ip method uri attackType fidelityScore severity createdAt')
                        .lean();
                    return { results: results ?? [], resultType: 'table' as const };
                },
            },
            // "incidents" / "open incidents" / "active incidents"
            {
                regex: /(open|active|recent)\s*incidents?/i,
                interpretation: 'Open/active incidents',
                handler: async () => {
                    const results = await Incident.find({ status: { $in: ['open', 'investigating'] } })
                        .sort({ createdAt: -1 })
                        .limit(20)
                        .select('title category severity status attackStage alertCount avgFidelity createdAt')
                        .lean();
                    return { results: results ?? [], resultType: 'table' as const };
                },
            },
            // "alert count" / "how many alerts" / "total alerts"
            {
                regex: /(how\s*many|total|count)\s*(alerts?|detections?)/i,
                interpretation: 'Total alert count and breakdown',
                handler: async () => {
                    const [total, bySeverity] = await Promise.all([
                        Alert.countDocuments(),
                        Alert.aggregate([
                            { $group: { _id: '$severity', count: { $sum: 1 } } },
                            { $sort: { count: -1 } },
                        ]),
                    ]);
                    return {
                        results: [
                            { metric: 'Total Alerts', value: total },
                            ...(bySeverity ?? []).map((s: { _id: string; count: number }) => ({
                                severity: s._id ?? 'unknown',
                                count: s.count ?? 0,
                            })),
                        ],
                        resultType: 'stat' as const,
                    };
                },
            },
        ];

        // [ARIA] Try each pattern in order — first match wins
        for (const pattern of patterns) {
            if (pattern.regex.test(lowerQuery)) {
                const { results, resultType } = await pattern.handler();
                return NextResponse.json({
                    query,
                    interpretation: pattern.interpretation,
                    results,
                    resultType,
                });
            }
        }

        // [ARIA] Fallback: use actual LLM from Ollama to dynamic query the database
        try {
            const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
            const prompt = `You are a MongoDB query generator for a security dashboard.
Given the natural language question: "${query}"
Generate a strictly valid JSON response with these properties:
{
  "collection": "alerts" or "incidents",
  "filter": { <mongodb match conditions. use $regex with $options: "i" for strings. > },
  "sort": { "createdAt": -1 } or similar,
  "limit": number
}
Do not write explanations. Only output the JSON.`;

            const resp = await fetch(`${ollamaHost}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'mistral', prompt, stream: false })
            });

            if (resp.ok) {
                const data = await resp.json();
                const rawResponse = data.response;
                // Parse out potential markdown blocks
                const jsonMatch = rawResponse.match(/\{[\s\S]*?\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    
                    let results;
                    if (parsed.collection === 'incidents') {
                        results = await Incident.find(parsed.filter || {})
                            .sort(parsed.sort || { createdAt: -1 })
                            .limit(parsed.limit || 20)
                            .lean();
                    } else {
                        results = await Alert.find(parsed.filter || {})
                            .sort(parsed.sort || { createdAt: -1 })
                            .limit(parsed.limit || 20)
                            .lean();
                    }
                    
                    return NextResponse.json({
                        query,
                        interpretation: '[LLM Generated] ' + (data.interpretation || 'Dynamic search'),
                        results: results || [],
                        resultType: 'table',
                    });
                }
            }
        } catch (e) {
            logger.warn({ err: e }, 'Failed to query Ollama, falling back to keywords');
        }

        // [ARIA] Fallback to keyword text search
        const keywords = lowerQuery
            .replace(/[^a-z0-9\s]/gi, '')
            .split(/\s+/)
            .filter((w: string) => w.length > 2);

        if (keywords.length > 0) {
            const orConditions = keywords.map((kw: string) => ({
                $or: [
                    { attackType: new RegExp(kw, 'i') },
                    { uri: new RegExp(kw, 'i') },
                    { ip: new RegExp(kw, 'i') },
                    { aiAnalysis: new RegExp(kw, 'i') },
                ],
            }));

            const results = await Alert.find({ $or: orConditions.flatMap((c: { $or: Record<string, unknown>[] }) => c.$or) })
                .sort({ fidelityScore: -1, createdAt: -1 })
                .limit(30)
                .select('requestId ip method uri attackType fidelityScore decision severity createdAt')
                .lean();

            if ((results ?? []).length > 0) {
                return NextResponse.json({
                    query,
                    interpretation: `Keyword search for: ${keywords.join(', ')}`,
                    results: results ?? [],
                    resultType: 'table',
                });
            }
        }

        // [ARIA] No matches found — return suggestions
        return NextResponse.json({
            query,
            interpretation: 'No matching query pattern found',
            results: [],
            resultType: 'list',
            suggestions: [
                'Show all critical alerts from today',
                'Top 10 attacked endpoints this week',
                'SQLi attacks in the last 24 hours',
                'Most active attacker IPs',
                'False positive rate by detection source',
                'Blocked requests',
                'Open incidents',
                'How many alerts total',
            ],
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to process NL query', msg);
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
