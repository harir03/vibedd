// [ARIA] Triage page — Analyst approval queue for human-in-the-loop incident response.
// Feature 17: Two-panel layout (alert list left, detail view right).
// Shows pending alerts sorted by fidelity score (highest risk first).
// Allows approve/reject decisions that feed back into the self-evolution agent.
// Polls /api/triage every 5 seconds for real-time updates.

"use client";

import React, { useState, useCallback, useEffect } from "react";
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
    ArrowUpDown,
    MessageSquare,
    Shield,
    Zap,
    Globe,
    Terminal,
    User,
    Layers,
} from "lucide-react";

export const dynamic = "force-dynamic";

// [ARIA] Type for alert data from /api/triage — matches Alert model exactly
interface TriageAlert {
    _id: string;
    id: string;
    timestamp: string;
    sourceIP: string;
    method: string;
    path: string;
    headers?: Record<string, unknown>;
    body?: string;
    userAgent?: string;
    aiDecision: "block" | "allow";
    aiReasoning?: string;
    detectionSources?: string[];
    regexMatches?: string[];
    category?: string;
    fidelityScore: number;
    scores?: {
        regex: number;
        llm: number;
        anomaly: number;
        ueba: number;
    };
    severity: "critical" | "high" | "medium" | "low" | "info";
    triageStatus: "pending" | "approved" | "rejected" | "escalated";
    analystId?: string;
    analystNotes?: string;
    triagedAt?: string;
    serviceName?: string;
    responseStatus?: number;
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
    pending: "bg-gray-100 text-gray-500",
};

// [ARIA] Fidelity score color based on severity
function fidelityColor(score: number): string {
    if (score >= 90) return "text-red-600 bg-red-50 border-red-200";
    if (score >= 70) return "text-orange-600 bg-orange-50 border-orange-200";
    if (score >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (score >= 10) return "text-blue-500 bg-blue-50 border-blue-200";
    return "text-gray-400 bg-gray-50 border-gray-200";
}

// [ARIA] Format timestamp
function formatTime(t: string): string {
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

                const critRes = await fetch("/api/triage?status=pending&severity=critical&limit=1");
                const critJson = critRes.ok ? await critRes.json() : { meta: { total: 0 } };

                const highRes = await fetch("/api/triage?status=pending&severity=high&limit=1");
                const highJson = highRes.ok ? await highRes.json() : { meta: { total: 0 } };

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

    // [ARIA] Poll every 5 seconds
    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 5000);
        return () => clearInterval(interval);
    }, [fetchAlerts]);

    useEffect(() => {
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

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Triage Queue</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Review and approve/reject AI decisions — every decision trains the model
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
                    <option value="escalated">Escalated</option>
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

            {/* [ARIA] Two-Panel Layout: Alert List (Left) + Detail View (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* ── Left Panel: Alert List ──────────────────────────── */}
                <div className={cn(
                    "lg:col-span-5 space-y-2",
                    selectedAlert && "hidden lg:block"
                )}>
                    {loading && alerts.length === 0 ? (
                        <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-gray-100">
                            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                            <span className="ml-2 text-sm text-gray-500">Loading triage queue...</span>
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 text-gray-400">
                            <CheckCircle2 className="w-10 h-10 mb-3 text-green-400" />
                            <p className="text-sm font-medium">No alerts pending triage</p>
                            <p className="text-xs mt-1">All clear — check back soon</p>
                        </div>
                    ) : (
                        alerts.map((alert) => (
                            <button
                                key={alert._id}
                                onClick={() => { setSelectedAlert(alert); setReason(""); }}
                                className={cn(
                                    "w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm p-3 transition-all hover:shadow-md",
                                    selectedAlert?._id === alert._id && "ring-2 ring-teal-400 border-teal-200",
                                    alert.severity === "critical" && "border-l-4 border-l-red-500",
                                    alert.severity === "high" && "border-l-4 border-l-orange-400",
                                    processingId === alert._id && "opacity-50 pointer-events-none"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    {/* Fidelity Score */}
                                    <span className={cn(
                                        "text-xs font-bold px-2 py-0.5 rounded-md border",
                                        fidelityColor(alert.fidelityScore ?? 0)
                                    )}>
                                        {alert.fidelityScore ?? 0}
                                    </span>

                                    {/* Severity Badge */}
                                    <span className={cn(
                                        "text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase",
                                        severityColors[alert.severity] ?? severityColors.info
                                    )}>
                                        {alert.severity ?? "info"}
                                    </span>

                                    {/* AI Decision */}
                                    <span className={cn(
                                        "text-[10px] font-medium px-1.5 py-0.5 rounded",
                                        decisionColors[alert.aiDecision] ?? decisionColors.pending
                                    )}>
                                        {alert.aiDecision ?? "—"}
                                    </span>

                                    {/* Category */}
                                    {alert.category && (
                                        <span className="text-[10px] text-gray-500 font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                                            {alert.category}
                                        </span>
                                    )}
                                </div>

                                {/* URI */}
                                <p className="text-xs font-mono text-gray-700 truncate mb-1">
                                    <span className="text-[10px] font-semibold text-gray-400 mr-1">
                                        {alert.method ?? "GET"}
                                    </span>
                                    {alert.path ?? "/"}
                                </p>

                                {/* IP & Meta */}
                                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                    <span>{alert.sourceIP ?? "—"}</span>
                                    <span>{formatTime(alert.timestamp ?? alert.createdAt)}</span>
                                </div>

                                {/* Detection Sources */}
                                {(alert.detectionSources?.length ?? 0) > 0 && (
                                    <div className="flex items-center gap-1 mt-1.5">
                                        {alert.detectionSources?.map((src) => (
                                            <span key={src} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                                {src}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </button>
                        ))
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-3">
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
                </div>

                {/* ── Right Panel: Detail View ───────────────────────── */}
                <div className={cn(
                    "lg:col-span-7",
                    !selectedAlert && "hidden lg:block"
                )}>
                    {selectedAlert ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 sticky top-6">
                            {/* Detail Header */}
                            <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        "text-sm font-bold px-2.5 py-1 rounded-lg border",
                                        fidelityColor(selectedAlert.fidelityScore ?? 0)
                                    )}>
                                        Fidelity: {selectedAlert.fidelityScore ?? 0}
                                    </span>
                                    <span className={cn(
                                        "text-xs font-semibold px-2 py-0.5 rounded border uppercase",
                                        severityColors[selectedAlert.severity] ?? severityColors.info
                                    )}>
                                        {selectedAlert.severity}
                                    </span>
                                    <span className={cn(
                                        "text-xs font-semibold px-2 py-0.5 rounded capitalize",
                                        decisionColors[selectedAlert.aiDecision] ?? decisionColors.pending
                                    )}>
                                        AI: {selectedAlert.aiDecision}
                                    </span>
                                </div>
                                <button
                                    onClick={() => { setSelectedAlert(null); setReason(""); }}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>

                            {/* Detail Body */}
                            <div className="px-5 py-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                                {/* Request Info */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                                        <Terminal className="w-3.5 h-3.5" />
                                        Request Details
                                    </h3>
                                    <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs font-mono">
                                        <p>
                                            <span className="text-gray-400">Method:</span>{" "}
                                            <span className="font-semibold">{selectedAlert.method}</span>
                                        </p>
                                        <p>
                                            <span className="text-gray-400">Path:</span>{" "}
                                            <span className="text-gray-700 break-all">{selectedAlert.path}</span>
                                        </p>
                                        <p>
                                            <span className="text-gray-400">Source IP:</span>{" "}
                                            <span className="font-semibold">{selectedAlert.sourceIP}</span>
                                        </p>
                                        <p>
                                            <span className="text-gray-400">Time:</span>{" "}
                                            {formatTime(selectedAlert.timestamp ?? selectedAlert.createdAt)}
                                        </p>
                                        {selectedAlert.userAgent && (
                                            <p>
                                                <span className="text-gray-400">User-Agent:</span>{" "}
                                                <span className="text-gray-500 break-all">{selectedAlert.userAgent}</span>
                                            </p>
                                        )}
                                        {selectedAlert.serviceName && (
                                            <p>
                                                <span className="text-gray-400">Service:</span>{" "}
                                                <span className="text-gray-700">{selectedAlert.serviceName}</span>
                                            </p>
                                        )}
                                        {selectedAlert.responseStatus && (
                                            <p>
                                                <span className="text-gray-400">Response Status:</span>{" "}
                                                <span className="font-semibold">{selectedAlert.responseStatus}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Detection Details Grid */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5" />
                                        Detection Details
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-slate-50 rounded-xl p-3">
                                            <p className="text-[10px] text-gray-400 mb-1">Category</p>
                                            <p className="text-xs font-semibold">{selectedAlert.category ?? "—"}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3">
                                            <p className="text-[10px] text-gray-400 mb-1">AI Decision</p>
                                            <p className={cn("text-xs font-semibold capitalize", selectedAlert.aiDecision === "block" ? "text-red-600" : "text-green-600")}>
                                                {selectedAlert.aiDecision}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3">
                                            <p className="text-[10px] text-gray-400 mb-1">Detection Sources</p>
                                            <div className="flex flex-wrap gap-1">
                                                {(selectedAlert.detectionSources?.length ?? 0) > 0
                                                    ? selectedAlert.detectionSources?.map((src) => (
                                                        <span key={src} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">
                                                            {src}
                                                        </span>
                                                    ))
                                                    : <span className="text-xs text-gray-400">—</span>
                                                }
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3">
                                            <p className="text-[10px] text-gray-400 mb-1">Triage Status</p>
                                            <p className="text-xs font-semibold capitalize">{selectedAlert.triageStatus}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Fidelity Score Breakdown */}
                                {selectedAlert.scores && (
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                                            <Layers className="w-3.5 h-3.5" />
                                            Fidelity Score Breakdown
                                        </h3>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { label: "Regex", value: selectedAlert.scores.regex ?? 0, color: "bg-purple-500" },
                                                { label: "LLM", value: selectedAlert.scores.llm ?? 0, color: "bg-teal-500" },
                                                { label: "Anomaly", value: selectedAlert.scores.anomaly ?? 0, color: "bg-indigo-500" },
                                                { label: "UEBA", value: selectedAlert.scores.ueba ?? 0, color: "bg-cyan-500" },
                                            ].map((item) => (
                                                <div key={item.label} className="text-center bg-slate-50 rounded-lg p-2">
                                                    <div className="h-1.5 w-full bg-gray-100 rounded-full mb-1.5">
                                                        <div
                                                            className={cn("h-full rounded-full transition-all", item.color)}
                                                            style={{ width: `${Math.min(100, item.value)}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-gray-400">{item.label}</p>
                                                    <p className="text-xs font-bold">{item.value}</p>
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
                                                    <span className="font-mono text-[10px] text-red-700 break-all">{match}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* AI Reasoning */}
                                {selectedAlert.aiReasoning && (
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                                            <Zap className="w-3.5 h-3.5" />
                                            AI Reasoning
                                        </h3>
                                        <div className="bg-teal-50 rounded-xl p-3 text-xs text-teal-800 whitespace-pre-wrap border border-teal-100">
                                            {selectedAlert.aiReasoning}
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
                                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            Triage Decision
                                        </h3>
                                        <textarea
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="Optional reason for your decision..."
                                            className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 mb-3 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none"
                                            rows={2}
                                        />
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => submitDecision(selectedAlert._id, "approve_block")}
                                                disabled={processingId === selectedAlert._id}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50"
                                            >
                                                {processingId === selectedAlert._id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <ShieldAlert className="w-3.5 h-3.5" />
                                                )}
                                                Confirm Block
                                            </button>
                                            <button
                                                onClick={() => submitDecision(selectedAlert._id, "reject_block")}
                                                disabled={processingId === selectedAlert._id}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors disabled:opacity-50"
                                            >
                                                {processingId === selectedAlert._id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                )}
                                                Mark Safe
                                            </button>
                                            <button
                                                onClick={() => submitDecision(selectedAlert._id, "approve_allow")}
                                                disabled={processingId === selectedAlert._id}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors disabled:opacity-50"
                                            >
                                                {processingId === selectedAlert._id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                )}
                                                Escalate
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // [ARIA] Empty state for right panel when no alert is selected
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-20 text-gray-400">
                            <Eye className="w-8 h-8 mb-3 text-slate-300" />
                            <p className="text-sm font-medium">Select an alert to review</p>
                            <p className="text-xs mt-1">Click any alert on the left to see full details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
