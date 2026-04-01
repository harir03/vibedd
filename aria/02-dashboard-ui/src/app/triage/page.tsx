// [ARIA] NEW: Triage page — Analyst approval queue for human-in-the-loop incident response
// Shows pending alerts sorted by fidelity score (highest risk first)
// Allows approve/reject decisions that feed back into the self-evolution agent

"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/StatCard";
import {
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Filter,
    Loader2,
    Eye,
    X,
} from "lucide-react";

export const dynamic = "force-dynamic";

// [ARIA] Type for alert data from /api/triage
interface TriageAlert {
    _id: string;
    requestId: string;
    time: string;
    ip: string;
    method: string;
    uri: string;
    headers?: Record<string, unknown>;
    body?: string;
    status?: number;
    userAgent?: string;
    country?: string;
    attackType?: string;
    detectionSource?: "regex" | "ai" | "both" | "none";
    regexMatches?: { pattern: string; category: string }[];
    aiAnalysis?: string;
    aiConfidence?: number;
    fidelityScore: number;
    fidelityBreakdown?: {
        regexScore: number;
        aiScore: number;
        contextScore: number;
        historicalScore: number;
    };
    decision: "block" | "allow" | "escalate" | "pending";
    triageStatus: "pending" | "approved" | "rejected" | "auto-resolved";
    severity: "critical" | "high" | "medium" | "low" | "info";
    createdAt: string;
}

// [ARIA] Severity badge colors per design system
const severityColors: Record<string, string> = {
    critical: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-blue-100 text-blue-700 border-blue-200",
    info: "bg-gray-100 text-gray-600 border-gray-200",
};

// [ARIA] Decision badge colors
const decisionColors: Record<string, string> = {
    block: "bg-red-100 text-red-700",
    allow: "bg-green-100 text-green-700",
    escalate: "bg-amber-100 text-amber-700",
    pending: "bg-gray-100 text-gray-500",
};

// [ARIA] Detection source badge colors
const detectionColors: Record<string, string> = {
    regex: "bg-purple-100 text-purple-700",
    ai: "bg-teal-100 text-teal-700",
    both: "bg-indigo-100 text-indigo-700",
    none: "bg-gray-100 text-gray-500",
};

// [ARIA] Fidelity score color based on severity
function fidelityColor(score: number): string {
    if (score >= 90) return "text-red-600 bg-red-50";
    if (score >= 70) return "text-orange-600 bg-orange-50";
    if (score >= 40) return "text-yellow-600 bg-yellow-50";
    if (score >= 10) return "text-blue-500 bg-blue-50";
    return "text-gray-400 bg-gray-50";
}

export default function TriagePage() {
    const [alerts, setAlerts] = useState<TriageAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedAlert, setSelectedAlert] = useState<TriageAlert | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [reason, setReason] = useState("");
    const [filterSeverity, setFilterSeverity] = useState("");
    const [filterMinFidelity, setFilterMinFidelity] = useState("");
    const [statusFilter, setStatusFilter] = useState("pending");

    // [ARIA] KPI stats
    const [stats, setStats] = useState({
        pending: 0,
        critical: 0,
        high: 0,
        avgFidelity: 0,
    });

    // [ARIA] Fetch alerts from triage API
    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("limit", "15");
            params.set("status", statusFilter);
            if (filterSeverity) params.set("severity", filterSeverity);
            if (filterMinFidelity) params.set("minFidelity", filterMinFidelity);

            const res = await fetch(`/api/triage?${params.toString()}`);
            if (res.ok) {
                const json = await res.json();
                setAlerts(json.data ?? []);
                setTotal(json.meta?.total ?? 0);
                setTotalPages(json.meta?.totalPages ?? 1);
            }
        } catch (err) {
            console.error("Failed to fetch triage queue:", err);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, filterSeverity, filterMinFidelity]);

    // [ARIA] Fetch KPI stats
    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch("/api/triage?status=pending&limit=1");
            if (res.ok) {
                const json = await res.json();
                const pendingTotal = json.meta?.total ?? 0;

                // Fetch critical count
                const critRes = await fetch("/api/triage?status=pending&severity=critical&limit=1");
                const critJson = critRes.ok ? await critRes.json() : { meta: { total: 0 } };

                const highRes = await fetch("/api/triage?status=pending&severity=high&limit=1");
                const highJson = highRes.ok ? await highRes.json() : { meta: { total: 0 } };

                // Compute avg fidelity from current page data
                const avgFid =
                    alerts.length > 0
                        ? Math.round(alerts.reduce((sum, a) => sum + (a.fidelityScore ?? 0), 0) / alerts.length)
                        : 0;

                setStats({
                    pending: pendingTotal,
                    critical: critJson.meta?.total ?? 0,
                    high: highJson.meta?.total ?? 0,
                    avgFidelity: avgFid,
                });
            }
        } catch {
            // fail-open: stats are non-critical
        }
    }, [alerts]);

    // [ARIA] Poll every 5 seconds per instructions
    React.useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 5000);
        return () => clearInterval(interval);
    }, [fetchAlerts]);

    React.useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // [ARIA] Submit triage decision
    const submitDecision = async (alertId: string, decision: string) => {
        setProcessingId(alertId);
        try {
            const res = await fetch("/api/triage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    alertId,
                    decision,
                    reason: reason || undefined,
                    analystId: "analyst-dashboard",
                }),
            });
            if (res.ok) {
                // Remove from current view and refresh
                setAlerts((prev) => prev.filter((a) => a._id !== alertId));
                setSelectedAlert(null);
                setReason("");
                fetchAlerts();
            }
        } catch (err) {
            console.error("Failed to submit triage decision:", err);
        } finally {
            setProcessingId(null);
        }
    };

    // [ARIA] Format timestamp
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

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Triage Queue</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Review and approve/reject alerts sorted by fidelity score
                    </p>
                </div>
                <button
                    onClick={() => fetchAlerts()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors border border-teal-200"
                >
                    <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                    Refresh
                </button>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Pending"
                    value={(stats.pending ?? 0).toLocaleString()}
                    icon={Clock}
                    variant="orange"
                />
                <StatCard
                    label="Critical"
                    value={(stats.critical ?? 0).toLocaleString()}
                    icon={ShieldAlert}
                    variant="red"
                />
                <StatCard
                    label="High"
                    value={(stats.high ?? 0).toLocaleString()}
                    icon={AlertTriangle}
                    variant="orange"
                />
                <StatCard
                    label="Avg Fidelity"
                    value={(stats.avgFidelity ?? 0).toString()}
                    icon={Filter}
                    variant="teal"
                />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="auto-resolved">Auto-Resolved</option>
                </select>

                <select
                    value={filterSeverity}
                    onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }}
                    className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                >
                    <option value="">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="info">Info</option>
                </select>

                <select
                    value={filterMinFidelity}
                    onChange={(e) => { setFilterMinFidelity(e.target.value); setPage(1); }}
                    className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                >
                    <option value="">Min Fidelity</option>
                    <option value="90">90+</option>
                    <option value="70">70+</option>
                    <option value="40">40+</option>
                    <option value="10">10+</option>
                </select>

                <span className="text-[10px] text-gray-400 ml-auto">
                    {total} alert{total !== 1 ? "s" : ""} &middot; Page {page}/{totalPages}
                </span>
            </div>

            {/* Alert Cards */}
            {loading && alerts.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                    <span className="ml-2 text-sm text-gray-500">Loading triage queue...</span>
                </div>
            ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <CheckCircle2 className="w-10 h-10 mb-3 text-green-400" />
                    <p className="text-sm font-medium">No alerts pending triage</p>
                    <p className="text-xs mt-1">All clear — check back soon</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {alerts.map((alert) => (
                        <div
                            key={alert._id}
                            className={cn(
                                "bg-white rounded-xl border border-gray-100 shadow-sm p-4 transition-all hover:shadow-md",
                                alert.severity === "critical" && "border-l-4 border-l-red-500",
                                alert.severity === "high" && "border-l-4 border-l-orange-400",
                                processingId === alert._id && "opacity-60 pointer-events-none"
                            )}
                        >
                            <div className="flex items-start justify-between gap-4">
                                {/* Left: Alert info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        {/* Fidelity Score */}
                                        <span
                                            className={cn(
                                                "text-xs font-bold px-2 py-0.5 rounded-md",
                                                fidelityColor(alert.fidelityScore ?? 0)
                                            )}
                                        >
                                            {alert.fidelityScore ?? 0}
                                        </span>

                                        {/* Severity Badge */}
                                        <span
                                            className={cn(
                                                "text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase",
                                                severityColors[alert.severity] ?? severityColors.info
                                            )}
                                        >
                                            {alert.severity ?? "info"}
                                        </span>

                                        {/* Detection Source */}
                                        <span
                                            className={cn(
                                                "text-[10px] font-medium px-1.5 py-0.5 rounded",
                                                detectionColors[alert.detectionSource ?? "none"] ?? detectionColors.none
                                            )}
                                        >
                                            {alert.detectionSource ?? "none"}
                                        </span>

                                        {/* Decision */}
                                        <span
                                            className={cn(
                                                "text-[10px] font-medium px-1.5 py-0.5 rounded",
                                                decisionColors[alert.decision] ?? decisionColors.pending
                                            )}
                                        >
                                            {alert.decision ?? "pending"}
                                        </span>

                                        {/* Attack Type */}
                                        {alert.attackType && (
                                            <span className="text-[10px] text-gray-500 font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                                                {alert.attackType}
                                            </span>
                                        )}
                                    </div>

                                    {/* URI */}
                                    <p className="text-xs font-mono text-gray-700 truncate mb-1">
                                        <span className="text-[10px] font-semibold text-gray-400 mr-1">
                                            {alert.method ?? "GET"}
                                        </span>
                                        {alert.uri ?? "/"}
                                    </p>

                                    {/* IP & Meta */}
                                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                        <span>{alert.ip ?? "—"}</span>
                                        {alert.country && <span>{alert.country}</span>}
                                        <span>{formatTime(alert.time ?? alert.createdAt)}</span>
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* View Details */}
                                    <button
                                        onClick={() => setSelectedAlert(alert)}
                                        className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                        title="View details"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>

                                    {statusFilter === "pending" && (
                                        <>
                                            {/* Approve Block */}
                                            <button
                                                onClick={() => submitDecision(alert._id, "approve_block")}
                                                disabled={processingId === alert._id}
                                                className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                                                title="Confirm this is a real threat — keep blocked"
                                            >
                                                {processingId === alert._id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <ShieldAlert className="w-3 h-3" />
                                                )}
                                                Block
                                            </button>

                                            {/* Reject Block = Allow */}
                                            <button
                                                onClick={() => submitDecision(alert._id, "reject_block")}
                                                disabled={processingId === alert._id}
                                                className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50"
                                                title="False positive — allow this request"
                                            >
                                                {processingId === alert._id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="w-3 h-3" />
                                                )}
                                                Allow
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Fidelity Breakdown Bar */}
                            {alert.fidelityBreakdown && (
                                <div className="mt-3 pt-2 border-t border-gray-50">
                                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                        <span>
                                            Regex:{" "}
                                            <span className="font-semibold text-purple-600">
                                                {alert.fidelityBreakdown.regexScore ?? 0}
                                            </span>
                                        </span>
                                        <span>
                                            AI:{" "}
                                            <span className="font-semibold text-teal-600">
                                                {alert.fidelityBreakdown.aiScore ?? 0}
                                            </span>
                                        </span>
                                        <span>
                                            Context:{" "}
                                            <span className="font-semibold text-indigo-600">
                                                {alert.fidelityBreakdown.contextScore ?? 0}
                                            </span>
                                        </span>
                                        <span>
                                            History:{" "}
                                            <span className="font-semibold text-cyan-600">
                                                {alert.fidelityBreakdown.historicalScore ?? 0}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-500">
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Detail Modal */}
            {selectedAlert && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span
                                    className={cn(
                                        "text-sm font-bold px-2.5 py-1 rounded-lg",
                                        fidelityColor(selectedAlert.fidelityScore ?? 0)
                                    )}
                                >
                                    Fidelity: {selectedAlert.fidelityScore ?? 0}
                                </span>
                                <span
                                    className={cn(
                                        "text-xs font-semibold px-2 py-0.5 rounded border uppercase",
                                        severityColors[selectedAlert.severity] ?? severityColors.info
                                    )}
                                >
                                    {selectedAlert.severity}
                                </span>
                            </div>
                            <button
                                onClick={() => { setSelectedAlert(null); setReason(""); }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-4 space-y-4">
                            {/* Request Info */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Request</h3>
                                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs font-mono">
                                    <p>
                                        <span className="text-gray-400">Method:</span>{" "}
                                        <span className="font-semibold">{selectedAlert.method}</span>
                                    </p>
                                    <p>
                                        <span className="text-gray-400">URI:</span>{" "}
                                        <span className="text-gray-700 break-all">{selectedAlert.uri}</span>
                                    </p>
                                    <p>
                                        <span className="text-gray-400">IP:</span> {selectedAlert.ip}
                                        {selectedAlert.country && ` (${selectedAlert.country})`}
                                    </p>
                                    <p>
                                        <span className="text-gray-400">Time:</span>{" "}
                                        {formatTime(selectedAlert.time ?? selectedAlert.createdAt)}
                                    </p>
                                    {selectedAlert.userAgent && (
                                        <p>
                                            <span className="text-gray-400">UA:</span>{" "}
                                            <span className="text-gray-500 break-all">{selectedAlert.userAgent}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Detection Details */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Detection</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 rounded-xl p-3">
                                        <p className="text-[10px] text-gray-400 mb-1">Attack Type</p>
                                        <p className="text-xs font-semibold">{selectedAlert.attackType ?? "—"}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3">
                                        <p className="text-[10px] text-gray-400 mb-1">Source</p>
                                        <p className="text-xs font-semibold capitalize">{selectedAlert.detectionSource ?? "—"}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3">
                                        <p className="text-[10px] text-gray-400 mb-1">Decision</p>
                                        <p className={cn("text-xs font-semibold capitalize", decisionColors[selectedAlert.decision])}>
                                            {selectedAlert.decision}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3">
                                        <p className="text-[10px] text-gray-400 mb-1">AI Confidence</p>
                                        <p className="text-xs font-semibold">
                                            {selectedAlert.aiConfidence != null
                                                ? `${(selectedAlert.aiConfidence * 100).toFixed(0)}%`
                                                : "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Fidelity Breakdown */}
                            {selectedAlert.fidelityBreakdown && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Fidelity Breakdown</h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { label: "Regex", value: selectedAlert.fidelityBreakdown.regexScore ?? 0, color: "bg-purple-500" },
                                            { label: "AI", value: selectedAlert.fidelityBreakdown.aiScore ?? 0, color: "bg-teal-500" },
                                            { label: "Context", value: selectedAlert.fidelityBreakdown.contextScore ?? 0, color: "bg-indigo-500" },
                                            { label: "History", value: selectedAlert.fidelityBreakdown.historicalScore ?? 0, color: "bg-cyan-500" },
                                        ].map((item) => (
                                            <div key={item.label} className="text-center">
                                                <div className="h-1.5 w-full bg-gray-100 rounded-full mb-1">
                                                    <div
                                                        className={cn("h-full rounded-full", item.color)}
                                                        style={{ width: `${Math.min(100, item.value)}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-gray-400">{item.label}</p>
                                                <p className="text-xs font-semibold">{item.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Regex Matches */}
                            {(selectedAlert.regexMatches?.length ?? 0) > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Regex Matches</h3>
                                    <div className="space-y-1.5">
                                        {selectedAlert.regexMatches?.map((match, i) => (
                                            <div key={i} className="bg-red-50 rounded-lg px-3 py-2 text-xs">
                                                <span className="font-semibold text-red-700">{match.category}</span>
                                                <span className="text-gray-400 ml-2 font-mono text-[10px] break-all">
                                                    {match.pattern}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AI Analysis */}
                            {selectedAlert.aiAnalysis && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">AI Analysis</h3>
                                    <div className="bg-teal-50 rounded-xl p-3 text-xs text-teal-800 whitespace-pre-wrap">
                                        {selectedAlert.aiAnalysis}
                                    </div>
                                </div>
                            )}

                            {/* Request Body */}
                            {selectedAlert.body && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Request Body</h3>
                                    <pre className="bg-gray-900 text-green-400 rounded-xl p-3 text-[10px] font-mono overflow-x-auto max-h-32 whitespace-pre-wrap">
                                        {selectedAlert.body}
                                    </pre>
                                </div>
                            )}

                            {/* Triage Action */}
                            {selectedAlert.triageStatus === "pending" && (
                                <div className="border-t border-gray-100 pt-4">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Triage Decision</h3>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Optional reason for your decision..."
                                        className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 mb-3 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none"
                                        rows={2}
                                    />
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => submitDecision(selectedAlert._id, "approve_block")}
                                            disabled={processingId === selectedAlert._id}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            <ShieldAlert className="w-3.5 h-3.5" />
                                            Confirm Block
                                        </button>
                                        <button
                                            onClick={() => submitDecision(selectedAlert._id, "reject_block")}
                                            disabled={processingId === selectedAlert._id}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Mark Safe
                                        </button>
                                        <button
                                            onClick={() => submitDecision(selectedAlert._id, "approve_allow")}
                                            disabled={processingId === selectedAlert._id}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            Escalate
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
