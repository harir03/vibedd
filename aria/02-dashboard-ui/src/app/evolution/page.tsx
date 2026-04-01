// [ARIA] NEW: Evolution/Learning dashboard page — AI self-evolution audit trail
// Shows what the AI learned, what changes it made (regex, prompt, threshold, weight),
// deployments, rollbacks, and validation scores over time.
// Polls /api/evolution every 30 seconds.

"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/StatCard";
import {
    Dna,
    CheckCircle2,
    Undo2,
    TrendingUp,
    RefreshCw,
    Filter,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Clock,
    Zap,
    CalendarClock,
    Wrench,
    User,
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

export const dynamic = "force-dynamic";

// [ARIA] EvolutionChange interface matching the MongoDB model
interface EvolutionChange {
    _id: string;
    type: "regex" | "prompt" | "pipeline" | "threshold" | "model" | "weight";
    description: string;
    reason: string;
    previousValue: any;
    proposedValue: any;
    trigger: string;
    validationScore: number;
    validationDetails: any;
    status: string;
    performanceMetrics: any;
    affectedModule: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

// [ARIA] Type badge colors per design system — detection palette
const typeBadgeColors: Record<string, string> = {
    regex: "bg-purple-100 text-purple-700 border-purple-200",
    prompt: "bg-teal-100 text-teal-700 border-teal-200",
    pipeline: "bg-cyan-100 text-cyan-700 border-cyan-200",
    threshold: "bg-amber-100 text-amber-700 border-amber-200",
    model: "bg-blue-100 text-blue-700 border-blue-200",
    weight: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

// [ARIA] Status badge colors per design system
const statusBadgeColors: Record<string, string> = {
    proposed: "bg-gray-100 text-gray-600 border-gray-200",
    testing: "bg-blue-100 text-blue-700 border-blue-200",
    deployed: "bg-green-100 text-green-700 border-green-200",
    monitoring: "bg-amber-100 text-amber-700 border-amber-200",
    validated: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rolled_back: "bg-red-100 text-red-700 border-red-200",
    rejected: "bg-red-100 text-red-600 border-red-200",
};

// [ARIA] Trigger icons mapping
const triggerIcons: Record<string, React.ElementType> = {
    feedback: User,
    scheduled: CalendarClock,
    auto_tune: Zap,
    manual: Wrench,
};

// [ARIA] Validation score color gradient
function validationColor(score: number): string {
    if (score >= 90) return "bg-emerald-500";
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    if (score >= 30) return "bg-orange-500";
    return "bg-red-500";
}

function validationTextColor(score: number): string {
    if (score >= 90) return "text-emerald-700";
    if (score >= 70) return "text-green-700";
    if (score >= 50) return "text-yellow-700";
    if (score >= 30) return "text-orange-700";
    return "text-red-700";
}

// [ARIA] Pie chart colors for type distribution
const TYPE_CHART_COLORS: Record<string, string> = {
    regex: "#a855f7",
    prompt: "#14b8a6",
    pipeline: "#06b6d4",
    threshold: "#f59e0b",
    model: "#3b82f6",
    weight: "#6366f1",
};

export default function EvolutionPage() {
    const [changes, setChanges] = useState<EvolutionChange[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // [ARIA] Filter state
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    // [ARIA] KPI stats
    const [stats, setStats] = useState({
        totalChanges: 0,
        deployed: 0,
        rolledBack: 0,
        avgValidation: 0,
    });

    // [ARIA] Chart data derived from changes
    const [typeDistribution, setTypeDistribution] = useState<{ name: string; value: number }[]>([]);
    const [recentScores, setRecentScores] = useState<{ name: string; score: number; type: string }[]>([]);

    // [ARIA] Fetch evolution changes from API
    const fetchChanges = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("limit", "20");
            if (filterType !== "all") params.set("type", filterType);
            if (filterStatus !== "all") params.set("status", filterStatus);

            const res = await fetch(`/api/evolution?${params.toString()}`);
            if (res.ok) {
                const json = await res.json();
                const data: EvolutionChange[] = json.data ?? [];
                setChanges(data);
                setTotal(json.meta?.total ?? 0);
                setTotalPages(json.meta?.totalPages ?? 1);

                // [ARIA] Compute KPI stats from data
                const deployed = data.filter((c) => c.status === "deployed" || c.status === "validated").length;
                const rolledBack = data.filter((c) => c.status === "rolled_back").length;
                const avgVal =
                    data.length > 0
                        ? Math.round(data.reduce((sum, c) => sum + (c.validationScore ?? 0), 0) / data.length)
                        : 0;

                setStats({
                    totalChanges: json.meta?.total ?? data.length,
                    deployed,
                    rolledBack,
                    avgValidation: avgVal,
                });

                // [ARIA] Compute type distribution for pie chart
                const typeCounts: Record<string, number> = {};
                data.forEach((c) => {
                    typeCounts[c.type] = (typeCounts[c.type] ?? 0) + 1;
                });
                setTypeDistribution(
                    Object.entries(typeCounts).map(([name, value]) => ({ name, value }))
                );

                // [ARIA] Build recent scores for bar chart (last 10 items, reversed for chronological)
                const recent = data
                    .slice(0, 10)
                    .reverse()
                    .map((c, i) => ({
                        name: `#${i + 1}`,
                        score: c.validationScore ?? 0,
                        type: c.type,
                    }));
                setRecentScores(recent);
            }
        } catch (err) {
            console.error("Failed to fetch evolution data:", err);
        } finally {
            setLoading(false);
        }
    }, [page, filterType, filterStatus]);

    // [ARIA] Poll every 30 seconds per instructions
    React.useEffect(() => {
        fetchChanges();
        const interval = setInterval(fetchChanges, 30000);
        return () => clearInterval(interval);
    }, [fetchChanges]);

    // [ARIA] Format timestamp consistently
    const formatTime = (t: string) => {
        try {
            return new Date(t).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });
        } catch {
            return t;
        }
    };

    // [ARIA] Safely render JSON values for expanded details
    const renderJson = (val: any): string => {
        if (val === null || val === undefined) return "—";
        try {
            return typeof val === "string" ? val : JSON.stringify(val, null, 2);
        } catch {
            return String(val);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6">
            {/* [ARIA] Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Evolution & Learning</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        AI self-evolution audit trail — changes, deployments, rollbacks, and validation scores
                    </p>
                </div>
                <button
                    onClick={() => fetchChanges()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors border border-teal-200"
                >
                    <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                    Refresh
                </button>
            </div>

            {/* [ARIA] KPI Stat Cards — 4-column grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Total Changes"
                    value={(stats.totalChanges ?? 0).toLocaleString()}
                    icon={Dna}
                    variant="teal"
                />
                <StatCard
                    label="Deployed"
                    value={(stats.deployed ?? 0).toLocaleString()}
                    icon={CheckCircle2}
                    variant="teal"
                />
                <StatCard
                    label="Rolled Back"
                    value={(stats.rolledBack ?? 0).toLocaleString()}
                    icon={Undo2}
                    variant="red"
                />
                <StatCard
                    label="Avg Validation"
                    value={(stats.avgValidation ?? 0).toString()}
                    subValue="/ 100"
                    icon={TrendingUp}
                    variant="teal"
                />
            </div>

            {/* [ARIA] Charts Row — Type Distribution + Validation Scores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Pie Chart — Type Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">Change Type Distribution</h2>
                    {typeDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={typeDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {typeDistribution.map((entry) => (
                                        <Cell
                                            key={entry.name}
                                            fill={TYPE_CHART_COLORS[entry.name] ?? "#94a3b8"}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: "#fff",
                                        borderRadius: "8px",
                                        border: "1px solid #e5e7eb",
                                        fontSize: "11px",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={30}
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: "10px" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[220px] text-xs text-gray-400">
                            No data available
                        </div>
                    )}
                </div>

                {/* Bar Chart — Recent Validation Scores */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Validation Scores</h2>
                    {recentScores.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={recentScores} barSize={20}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                                    axisLine={{ stroke: "#e2e8f0" }}
                                    tickLine={false}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                                    axisLine={{ stroke: "#e2e8f0" }}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "#fff",
                                        borderRadius: "8px",
                                        border: "1px solid #e5e7eb",
                                        fontSize: "11px",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                    }}
                                    formatter={(value: number | undefined) => [`${value ?? ''}`, "Score"]}
                                />
                                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                                    {recentScores.map((entry, i) => (
                                        <Cell
                                            key={i}
                                            fill={TYPE_CHART_COLORS[entry.type] ?? "#14b8a6"}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[220px] text-xs text-gray-400">
                            No data available
                        </div>
                    )}
                </div>
            </div>

            {/* [ARIA] Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4 flex flex-wrap items-center gap-3">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <div className="flex items-center gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Type</label>
                    <select
                        value={filterType}
                        onChange={(e) => {
                            setFilterType(e.target.value);
                            setPage(1);
                        }}
                        className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-400"
                    >
                        <option value="all">All</option>
                        <option value="regex">Regex</option>
                        <option value="prompt">Prompt</option>
                        <option value="threshold">Threshold</option>
                        <option value="weight">Weight</option>
                        <option value="pipeline">Pipeline</option>
                        <option value="model">Model</option>
                    </select>
                </div>
                <div className="flex items-center gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => {
                            setFilterStatus(e.target.value);
                            setPage(1);
                        }}
                        className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-400"
                    >
                        <option value="all">All</option>
                        <option value="deployed">Deployed</option>
                        <option value="validated">Validated</option>
                        <option value="rolled_back">Rolled Back</option>
                        <option value="proposed">Proposed</option>
                        <option value="testing">Testing</option>
                        <option value="monitoring">Monitoring</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
                <div className="ml-auto text-[10px] text-gray-400 font-medium">
                    {total.toLocaleString()} total changes
                </div>
            </div>

            {/* [ARIA] Evolution Timeline List */}
            <div className="space-y-2">
                {loading && changes.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-teal-500 animate-spin mr-2" />
                        <span className="text-xs text-gray-500">Loading evolution data…</span>
                    </div>
                ) : changes.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                        <Dna className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">No evolution changes found</p>
                    </div>
                ) : (
                    changes.map((change) => {
                        const isExpanded = expandedId === change._id;
                        const TriggerIcon = triggerIcons[change.trigger] ?? Clock;
                        return (
                            <div
                                key={change._id}
                                className={cn(
                                    "bg-white rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md",
                                    isExpanded && "ring-1 ring-teal-200"
                                )}
                            >
                                {/* [ARIA] Row header — clickable to expand */}
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : change._id)}
                                    className="w-full text-left p-3 flex items-center gap-3"
                                >
                                    {/* Type badge */}
                                    <span
                                        className={cn(
                                            "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border flex-shrink-0",
                                            typeBadgeColors[change.type] ?? "bg-gray-100 text-gray-600 border-gray-200"
                                        )}
                                    >
                                        {change.type}
                                    </span>

                                    {/* Status badge */}
                                    <span
                                        className={cn(
                                            "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0",
                                            statusBadgeColors[change.status] ?? "bg-gray-100 text-gray-500 border-gray-200"
                                        )}
                                    >
                                        {change.status?.replace("_", " ")}
                                    </span>

                                    {/* Description */}
                                    <span className="text-xs text-gray-700 font-medium truncate flex-1 min-w-0">
                                        {change.description || "—"}
                                    </span>

                                    {/* Trigger */}
                                    <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-gray-400 flex-shrink-0">
                                        <TriggerIcon className="w-3 h-3" />
                                        {change.trigger ?? "—"}
                                    </span>

                                    {/* Validation Score — mini progress bar */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0 w-24">
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all", validationColor(change.validationScore ?? 0))}
                                                style={{ width: `${Math.min(change.validationScore ?? 0, 100)}%` }}
                                            />
                                        </div>
                                        <span
                                            className={cn(
                                                "text-[10px] font-bold tabular-nums w-7 text-right",
                                                validationTextColor(change.validationScore ?? 0)
                                            )}
                                        >
                                            {change.validationScore ?? 0}
                                        </span>
                                    </div>

                                    {/* Timestamp */}
                                    <span className="hidden lg:inline text-[10px] text-gray-400 flex-shrink-0 w-32 text-right tabular-nums">
                                        {formatTime(change.createdAt)}
                                    </span>

                                    {/* Expand chevron */}
                                    {isExpanded ? (
                                        <ChevronUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    )}
                                </button>

                                {/* [ARIA] Expanded details — previous/proposed values */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 px-3 pb-3 pt-2 space-y-3 animate-in fade-in slide-in-from-top-1">
                                        {/* Meta row */}
                                        <div className="flex flex-wrap gap-4 text-[10px] text-gray-500">
                                            <span>
                                                <strong className="text-gray-600">Module:</strong>{" "}
                                                {change.affectedModule || "—"}
                                            </span>
                                            <span>
                                                <strong className="text-gray-600">Reason:</strong>{" "}
                                                {change.reason || "—"}
                                            </span>
                                            <span>
                                                <strong className="text-gray-600">Created by:</strong>{" "}
                                                {change.createdBy || "system"}
                                            </span>
                                            <span>
                                                <strong className="text-gray-600">Trigger:</strong>{" "}
                                                {change.trigger || "—"}
                                            </span>
                                        </div>

                                        {/* Previous / Proposed values side by side */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                                                    Previous Value
                                                </p>
                                                <pre className="text-[10px] leading-relaxed text-gray-600 bg-gray-50 rounded-lg p-2 overflow-x-auto max-h-40 border border-gray-100 font-mono whitespace-pre-wrap break-all">
                                                    {renderJson(change.previousValue)}
                                                </pre>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wide mb-1">
                                                    Proposed Value
                                                </p>
                                                <pre className="text-[10px] leading-relaxed text-gray-600 bg-teal-50/50 rounded-lg p-2 overflow-x-auto max-h-40 border border-teal-100 font-mono whitespace-pre-wrap break-all">
                                                    {renderJson(change.proposedValue)}
                                                </pre>
                                            </div>
                                        </div>

                                        {/* Validation Details (if present) */}
                                        {change.validationDetails && (
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                                                    Validation Details
                                                </p>
                                                <pre className="text-[10px] leading-relaxed text-gray-600 bg-gray-50 rounded-lg p-2 overflow-x-auto max-h-32 border border-gray-100 font-mono whitespace-pre-wrap break-all">
                                                    {renderJson(change.validationDetails)}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Performance Metrics (if present) */}
                                        {change.performanceMetrics && (
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                                                    Performance Metrics
                                                </p>
                                                <pre className="text-[10px] leading-relaxed text-gray-600 bg-gray-50 rounded-lg p-2 overflow-x-auto max-h-32 border border-gray-100 font-mono whitespace-pre-wrap break-all">
                                                    {renderJson(change.performanceMetrics)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* [ARIA] Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                    <span className="text-[10px] text-gray-400 font-medium">
                        Page {page} of {totalPages} · {total.toLocaleString()} changes
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className={cn(
                                "p-1.5 rounded-md transition-colors",
                                page <= 1
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-600 hover:bg-gray-100"
                            )}
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className={cn(
                                "p-1.5 rounded-md transition-colors",
                                page >= totalPages
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-600 hover:bg-gray-100"
                            )}
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
