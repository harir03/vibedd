// [ARIA] Learning Dashboard page — shows what the AI has learned over time.
// Feature 14: Evolution accuracy timeline, change type breakdown,
// recent evolution change list with expand/collapse, and learned patterns table.
// Polls /api/learning every 30 seconds.

"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/StatCard";
import {
    Dna,
    CheckCircle2,
    Undo2,
    TrendingUp,
    RefreshCw,
    Loader2,
    ChevronDown,
    ChevronUp,
    Zap,
    Brain,
    ShieldCheck,
} from "lucide-react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

export const dynamic = "force-dynamic";

// [ARIA] Type badge colors matching evolution page design system
const typeBadgeColors: Record<string, string> = {
    regex: "bg-purple-100 text-purple-700",
    prompt: "bg-teal-100 text-teal-700",
    pipeline: "bg-cyan-100 text-cyan-700",
    threshold: "bg-blue-100 text-blue-700",
    model: "bg-indigo-100 text-indigo-700",
    weight: "bg-amber-100 text-amber-700",
};

// [ARIA] Status badge colors for evolution changes
const statusBadgeColors: Record<string, string> = {
    proposed: "bg-gray-100 text-gray-600",
    testing: "bg-blue-100 text-blue-700",
    deployed: "bg-green-100 text-green-700",
    monitoring: "bg-amber-100 text-amber-700",
    validated: "bg-emerald-100 text-emerald-700",
    rolled_back: "bg-red-100 text-red-700",
    rejected: "bg-gray-200 text-gray-500",
};

// [ARIA] Pattern status badge colors
const patternStatusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    proposed: "bg-gray-100 text-gray-600",
    testing: "bg-blue-100 text-blue-700",
    disabled: "bg-gray-200 text-gray-500",
    rolled_back: "bg-red-100 text-red-700",
};

// [ARIA] Bar chart fill colors per change type
const typeChartColors: Record<string, string> = {
    regex: "#a855f7",
    prompt: "#14b8a6",
    threshold: "#3b82f6",
    weight: "#f59e0b",
    pipeline: "#06b6d4",
    model: "#6366f1",
};

// [ARIA] Interface for an evolution change record
interface EvolutionChange {
    _id: string;
    type: string;
    description: string;
    reason: string;
    previousValue: unknown;
    proposedValue: unknown;
    validationScore: number;
    status: string;
    createdAt: string;
}

// [ARIA] Interface for a learned pattern record
interface LearnedPatternRecord {
    _id: string;
    pattern: string;
    category: string;
    description: string;
    confidence: number;
    status: string;
    hitCount: number;
    falsePositiveCount: number;
    createdAt: string;
}

// [ARIA] Interface for the full API response
interface LearningData {
    stats: {
        totalEvolutions: number;
        activePatterns: number;
        avgValidationScore: number;
        rollbackRate: number;
    };
    timelineData: { date: string; avgScore: number; count: number }[];
    changesByType: { type: string; count: number }[];
    recentEvolutions: EvolutionChange[];
    learnedPatterns: LearnedPatternRecord[];
}

export default function LearningPage() {
    // [ARIA] State: API data, loading, error, expanded rows
    const [data, setData] = useState<LearningData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // [ARIA] Fetch learning data from the API
    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch("/api/learning");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load data");
        } finally {
            setLoading(false);
        }
    }, []);

    // [ARIA] Initial load + 30s polling
    useEffect(() => {
        fetchData();
        intervalRef.current = setInterval(fetchData, 30000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchData]);

    // [ARIA] Toggle expand/collapse for evolution change row
    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // [ARIA] Manual refresh
    const handleRefresh = () => {
        setLoading(true);
        fetchData();
    };

    // [ARIA] Defensive access
    const stats = data?.stats ?? { totalEvolutions: 0, activePatterns: 0, avgValidationScore: 0, rollbackRate: 0 };
    const timelineData = data?.timelineData ?? [];
    const changesByType = data?.changesByType ?? [];
    const recentEvolutions = data?.recentEvolutions ?? [];
    const learnedPatterns = data?.learnedPatterns ?? [];

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* [ARIA] Page header with title and refresh button */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">AI Learning Timeline</h1>
                    <p className="text-xs text-slate-400 mt-0.5">What the AI has learned and how it evolved over time</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        "bg-white border border-gray-200 text-slate-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200",
                        loading && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Refresh
                </button>
            </div>

            {/* [ARIA] Error banner */}
            {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                    {error}
                </div>
            )}

            {/* [ARIA] Top row: 4 StatCards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Total Evolutions"
                    value={(stats.totalEvolutions ?? 0).toLocaleString()}
                    icon={Dna}
                    variant="teal"
                />
                <StatCard
                    label="Active Patterns"
                    value={(stats.activePatterns ?? 0).toLocaleString()}
                    icon={CheckCircle2}
                    variant="teal"
                />
                <StatCard
                    label="Avg Validation Score"
                    value={(stats.avgValidationScore ?? 0).toFixed(1)}
                    icon={TrendingUp}
                    variant="teal"
                />
                <StatCard
                    label="Rollback Rate"
                    value={`${(stats.rollbackRate ?? 0).toFixed(1)}%`}
                    icon={Undo2}
                    variant={stats.rollbackRate > 10 ? "red" : "orange"}
                />
            </div>

            {/* [ARIA] Charts row: line chart (accuracy over time) + bar chart (changes by type) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* [ARIA] Line chart: Evolution accuracy over time */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">Evolution Accuracy Over Time</h2>
                    {timelineData.length === 0 ? (
                        <div className="flex items-center justify-center h-[250px] text-xs text-slate-400">
                            No timeline data yet
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={timelineData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                                    tickFormatter={(v: string) => v?.slice(5) ?? ""}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                                    tickFormatter={(v: number) => `${v}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#fff",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: 8,
                                        fontSize: 11,
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                    }}
                                    formatter={(value: number | undefined) => [`${value ?? 0}`, "Avg Score"]}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="avgScore"
                                    stroke="#14b8a6"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "#14b8a6" }}
                                    activeDot={{ r: 5, fill: "#0d9488" }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* [ARIA] Bar chart: Changes by type */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">Changes by Type</h2>
                    {changesByType.length === 0 ? (
                        <div className="flex items-center justify-center h-[250px] text-xs text-slate-400">
                            No change data yet
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={changesByType}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="type"
                                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                                />
                                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#fff",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: 8,
                                        fontSize: 11,
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                    }}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {changesByType.map((entry, index) => (
                                        <rect
                                            key={`cell-${index}`}
                                            fill={typeChartColors[entry.type] ?? "#94a3b8"}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* [ARIA] Recent evolution changes timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Evolution Changes</h2>

                {recentEvolutions.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                        No evolution changes recorded yet.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recentEvolutions.map((change) => {
                            const isExpanded = expandedIds.has(change._id);
                            return (
                                <div
                                    key={change._id}
                                    className="border border-gray-100 rounded-lg overflow-hidden transition-all hover:shadow-sm"
                                >
                                    {/* [ARIA] Collapsed row header — type badge, description, status, score */}
                                    <button
                                        onClick={() => toggleExpand(change._id)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                                    >
                                        {/* Type badge */}
                                        <span className={cn(
                                            "inline-block px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0",
                                            typeBadgeColors[change.type] ?? "bg-gray-100 text-gray-500"
                                        )}>
                                            {change.type}
                                        </span>

                                        {/* Description */}
                                        <span className="text-xs text-gray-700 font-medium flex-1 truncate">
                                            {change.description ?? "—"}
                                        </span>

                                        {/* Status badge */}
                                        <span className={cn(
                                            "inline-block px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0",
                                            statusBadgeColors[change.status] ?? "bg-gray-100 text-gray-500"
                                        )}>
                                            {change.status?.replace(/_/g, " ") ?? "—"}
                                        </span>

                                        {/* Validation score */}
                                        <span className={cn(
                                            "text-xs font-bold flex-shrink-0 w-10 text-right",
                                            (change.validationScore ?? 0) >= 80 ? "text-green-600" :
                                            (change.validationScore ?? 0) >= 50 ? "text-amber-500" :
                                            "text-red-500"
                                        )}>
                                            {(change.validationScore ?? 0).toFixed(0)}
                                        </span>

                                        {/* Timestamp */}
                                        <span className="text-[10px] text-slate-400 flex-shrink-0 w-20 text-right">
                                            {change.createdAt
                                                ? new Date(change.createdAt).toLocaleDateString(undefined, { month: "short", day: "2-digit" })
                                                : "—"
                                            }
                                        </span>

                                        {/* Expand/collapse icon */}
                                        {isExpanded
                                            ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                            : <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                        }
                                    </button>

                                    {/* [ARIA] Expanded detail — reason, before/after values */}
                                    {isExpanded && (
                                        <div className="px-4 pb-3 border-t border-gray-100 bg-gray-50">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Reason</p>
                                                    <p className="text-xs text-gray-700">{change.reason ?? "—"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Validation Score</p>
                                                    <p className="text-xs text-gray-700">{(change.validationScore ?? 0).toFixed(1)} / 100</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Previous Value</p>
                                                    <pre className="text-[10px] text-gray-600 bg-white rounded p-2 border border-gray-100 overflow-x-auto max-h-24">
                                                        {change.previousValue != null ? JSON.stringify(change.previousValue, null, 2) : "—"}
                                                    </pre>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Proposed Value</p>
                                                    <pre className="text-[10px] text-gray-600 bg-white rounded p-2 border border-gray-100 overflow-x-auto max-h-24">
                                                        {change.proposedValue != null ? JSON.stringify(change.proposedValue, null, 2) : "—"}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* [ARIA] Learned patterns table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-teal-500" />
                    <h2 className="text-sm font-semibold text-gray-700">Learned Patterns</h2>
                    <span className="text-[10px] font-bold text-slate-400 ml-auto">
                        {learnedPatterns.length} pattern{learnedPatterns.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {learnedPatterns.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                        No learned patterns yet. The AI agent will generate patterns from confirmed threats.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pb-2 pr-3">Pattern</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pb-2 pr-3">Category</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pb-2 pr-3">Status</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pb-2 pr-3">Confidence</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pb-2 pr-3">Hits</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pb-2 pr-3">FP Count</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pb-2">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {learnedPatterns.map((pat) => (
                                    <tr key={pat._id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                                        {/* [ARIA] Pattern regex — monospace, truncated */}
                                        <td className="py-2 pr-3 max-w-[220px]">
                                            <code className="text-[10px] font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded break-all line-clamp-2">
                                                {pat.pattern ?? "—"}
                                            </code>
                                        </td>

                                        {/* [ARIA] Category */}
                                        <td className="py-2 pr-3 text-[11px] font-medium text-slate-600">
                                            {pat.category ?? "—"}
                                        </td>

                                        {/* [ARIA] Status badge */}
                                        <td className="py-2 pr-3">
                                            <span className={cn(
                                                "inline-block px-2 py-0.5 rounded text-[10px] font-bold",
                                                patternStatusColors[pat.status] ?? "bg-gray-100 text-gray-500"
                                            )}>
                                                {pat.status?.replace(/_/g, " ") ?? "—"}
                                            </span>
                                        </td>

                                        {/* [ARIA] Confidence 0-1 → percentage display */}
                                        <td className="py-2 pr-3 text-xs font-semibold text-slate-700">
                                            {((pat.confidence ?? 0) * 100).toFixed(0)}%
                                        </td>

                                        {/* [ARIA] Hit count */}
                                        <td className="py-2 pr-3 text-xs font-semibold text-slate-700">
                                            {(pat.hitCount ?? 0).toLocaleString()}
                                        </td>

                                        {/* [ARIA] False positive count — red if > 0 */}
                                        <td className="py-2 pr-3">
                                            <span className={cn(
                                                "text-xs font-semibold",
                                                (pat.falsePositiveCount ?? 0) > 0 ? "text-red-500" : "text-slate-400"
                                            )}>
                                                {(pat.falsePositiveCount ?? 0).toLocaleString()}
                                            </span>
                                        </td>

                                        {/* [ARIA] Created date */}
                                        <td className="py-2 text-[10px] text-slate-400 whitespace-nowrap">
                                            {pat.createdAt
                                                ? new Date(pat.createdAt).toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })
                                                : "—"
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
