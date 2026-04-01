// [ARIA] Attack Chain Visualization page — interactive React Flow kill chain graph + pipeline + incident table.
// Feature 12: Displays the 7-stage Lockheed Martin kill chain with incident counts,
// connected by arrows. Interactive graph maps incidents to stages visually.
// Active stages highlighted with colors. Table of recent incidents below.
// Polls /api/attack-chains every 30 seconds.

"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/StatCard";
import {
    Link2,
    Activity,
    Layers,
    ArrowUpRight,
    RefreshCw,
    Loader2,
    ChevronRight,
    Shield,
    Crosshair,
    Send,
    Bug,
    Download,
    Radio,
    FileOutput,
    GitBranch,
    LayoutList,
} from "lucide-react";

export const forceDynamic = "force-dynamic";

// [ARIA] Dynamically import the React Flow graph component (heavy client-side)
const AttackChainGraph = dynamic(
    () => import("@/components/dashboard/AttackChainGraph"),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-[500px] bg-white rounded-xl border border-gray-100">
                <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                <span className="ml-2 text-sm text-gray-400">Loading graph...</span>
            </div>
        ),
    }
);

// [ARIA] Kill chain stage metadata — label, description, color, icon
const KILL_CHAIN_STAGES = [
    { key: "reconnaissance", label: "Reconnaissance", icon: Crosshair, color: "bg-blue-500", lightColor: "bg-blue-50 text-blue-700 border-blue-200" },
    { key: "weaponization", label: "Weaponization", icon: Shield, color: "bg-indigo-500", lightColor: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    { key: "delivery", label: "Delivery", icon: Send, color: "bg-purple-500", lightColor: "bg-purple-50 text-purple-700 border-purple-200" },
    { key: "exploitation", label: "Exploitation", icon: Bug, color: "bg-orange-500", lightColor: "bg-orange-50 text-orange-700 border-orange-200" },
    { key: "installation", label: "Installation", icon: Download, color: "bg-amber-500", lightColor: "bg-amber-50 text-amber-700 border-amber-200" },
    { key: "command_control", label: "Command & Control", icon: Radio, color: "bg-red-500", lightColor: "bg-red-50 text-red-700 border-red-200" },
    { key: "exfiltration", label: "Exfiltration", icon: FileOutput, color: "bg-rose-600", lightColor: "bg-rose-50 text-rose-700 border-rose-200" },
] as const;

// [ARIA] Severity badge colors per design system
const severityColors: Record<string, string> = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-blue-100 text-blue-700",
    info: "bg-gray-100 text-gray-600",
};

// [ARIA] Status badge colors per design system
const statusColors: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    investigating: "bg-amber-100 text-amber-700",
    resolved: "bg-green-100 text-green-700",
    false_positive: "bg-gray-100 text-gray-500",
};

// [ARIA] Prettify stage key into display label
function stageLabel(stage: string): string {
    const found = KILL_CHAIN_STAGES.find((s) => s.key === stage);
    return found?.label ?? stage?.replace(/_/g, " ") ?? "Unknown";
}

// [ARIA] Interface for incident row in the table
interface ChainIncident {
    _id: string;
    title: string;
    category: string;
    severity: string;
    status: string;
    attackStage: string;
    alertCount: number;
    avgFidelity: number;
    sourceIPs: string[];
    targetEndpoints: string[];
    createdAt: string;
}

// [ARIA] Interface for API response shape
interface AttackChainData {
    stages: Record<string, number>;
    stats: {
        totalChains: number;
        activeChains: number;
        avgChainLength: number;
        highestStageReached: string;
    };
    recentIncidents: ChainIncident[];
}

export default function AttackChainPage() {
    // [ARIA] State: API data, loading, error, active view tab
    const [data, setData] = useState<AttackChainData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"graph" | "pipeline">("graph");
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // [ARIA] Fetch attack chain data from the API
    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch("/api/attack-chains");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load data");
        } finally {
            setLoading(false);
        }
    }, []);

    // [ARIA] Initial load + 30s polling interval
    useEffect(() => {
        fetchData();
        intervalRef.current = setInterval(fetchData, 30000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchData]);

    // [ARIA] Manual refresh handler
    const handleRefresh = () => {
        setLoading(true);
        fetchData();
    };

    // [ARIA] Defensive access helpers
    const stages = data?.stages ?? {};
    const stats = data?.stats ?? { totalChains: 0, activeChains: 0, avgChainLength: 0, highestStageReached: "none" };
    const recentIncidents = data?.recentIncidents ?? [];

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* [ARIA] Page header with title, view toggle, and refresh */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Attack Chain Analysis</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Kill chain stage progression across incidents</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* [ARIA] View mode toggle — Graph vs Pipeline */}
                    <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode("graph")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all",
                                viewMode === "graph"
                                    ? "bg-teal-50 text-teal-700 border-r border-teal-200"
                                    : "text-slate-500 hover:bg-gray-50"
                            )}
                        >
                            <GitBranch className="w-3.5 h-3.5" />
                            Graph
                        </button>
                        <button
                            onClick={() => setViewMode("pipeline")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all",
                                viewMode === "pipeline"
                                    ? "bg-teal-50 text-teal-700 border-l border-teal-200"
                                    : "text-slate-500 hover:bg-gray-50"
                            )}
                        >
                            <LayoutList className="w-3.5 h-3.5" />
                            Pipeline
                        </button>
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
            </div>

            {/* [ARIA] Error banner */}
            {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                    {error}
                </div>
            )}

            {/* [ARIA] Top row: 4 StatCards with summary metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Total Chains"
                    value={(stats.totalChains ?? 0).toLocaleString()}
                    icon={Link2}
                    variant="teal"
                />
                <StatCard
                    label="Active Kill Chains"
                    value={(stats.activeChains ?? 0).toLocaleString()}
                    icon={Activity}
                    variant="orange"
                />
                <StatCard
                    label="Avg Chain Length"
                    value={(stats.avgChainLength ?? 0).toFixed(1)}
                    icon={Layers}
                    variant="teal"
                />
                <StatCard
                    label="Highest Stage"
                    value={stageLabel(stats.highestStageReached ?? "none")}
                    icon={ArrowUpRight}
                    variant="red"
                />
            </div>

            {/* [ARIA] View: Interactive Graph OR Pipeline */}
            {viewMode === "graph" ? (
                // ── Interactive React Flow Graph ────────────────────────
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-teal-500" />
                        Interactive Kill Chain Graph
                    </h2>
                    <AttackChainGraph stages={stages} incidents={recentIncidents} />
                </div>
            ) : (
                // ── Static Kill Chain Pipeline ──────────────────────────
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Kill Chain Pipeline</h2>
                    <div className="flex items-center gap-1 overflow-x-auto pb-2">
                        {KILL_CHAIN_STAGES.map((stage, idx) => {
                            const count = stages[stage.key] ?? 0;
                            const isActive = count > 0;
                            const StageIcon = stage.icon;

                            return (
                                <React.Fragment key={stage.key}>
                                    <div
                                        className={cn(
                                            "flex flex-col items-center justify-center rounded-lg border px-3 py-3 min-w-[110px] transition-all",
                                            isActive
                                                ? `${stage.lightColor} border shadow-sm`
                                                : "bg-gray-50 border-gray-200 text-gray-400"
                                        )}
                                    >
                                        <StageIcon className={cn("w-5 h-5 mb-1.5", isActive ? "" : "text-gray-300")} />
                                        <span className="text-[10px] font-bold uppercase tracking-tight text-center leading-tight">
                                            {stage.label}
                                        </span>
                                        <span className={cn(
                                            "text-lg font-black mt-1 leading-none",
                                            isActive ? "" : "text-gray-300"
                                        )}>
                                            {count}
                                        </span>
                                    </div>
                                    {idx < KILL_CHAIN_STAGES.length - 1 && (
                                        <ChevronRight className={cn(
                                            "w-5 h-5 flex-shrink-0",
                                            isActive ? "text-teal-400" : "text-gray-200"
                                        )} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* [ARIA] Recent incidents table showing attack stage progression */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Attack Chain Incidents</h2>

                {recentIncidents.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400">
                        No attack chain incidents detected yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pb-2 pr-3">Title</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pb-2 pr-3">Category</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pb-2 pr-3">Stage</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pb-2 pr-3">Severity</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pb-2 pr-3">Status</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pb-2 pr-3">Alerts</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pb-2 pr-3">Fidelity</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pb-2 pr-3">Source IPs</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pb-2 pr-3">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentIncidents.map((inc) => (
                                    <tr key={inc._id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                                        <td className="py-2 pr-3 text-xs font-medium text-gray-800 max-w-[180px] truncate">
                                            {inc.title ?? "Untitled"}
                                        </td>
                                        <td className="py-2 pr-3">
                                            <span className="text-[10px] font-semibold text-slate-500">
                                                {inc.category ?? "—"}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-3">
                                            <span className={cn(
                                                "inline-block px-2 py-0.5 rounded text-[10px] font-bold",
                                                KILL_CHAIN_STAGES.find((s) => s.key === inc.attackStage)?.lightColor ?? "bg-gray-100 text-gray-500"
                                            )}>
                                                {stageLabel(inc.attackStage)}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-3">
                                            <span className={cn(
                                                "inline-block px-2 py-0.5 rounded text-[10px] font-bold",
                                                severityColors[inc.severity] ?? "bg-gray-100 text-gray-500"
                                            )}>
                                                {inc.severity ?? "—"}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-3">
                                            <span className={cn(
                                                "inline-block px-2 py-0.5 rounded text-[10px] font-bold",
                                                statusColors[inc.status] ?? "bg-gray-100 text-gray-500"
                                            )}>
                                                {inc.status?.replace(/_/g, " ") ?? "—"}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-3 text-xs font-semibold text-slate-700">
                                            {(inc.alertCount ?? 0).toLocaleString()}
                                        </td>
                                        <td className="py-2 pr-3">
                                            <span className={cn(
                                                "text-xs font-bold",
                                                (inc.avgFidelity ?? 0) >= 90 ? "text-red-600" :
                                                (inc.avgFidelity ?? 0) >= 70 ? "text-orange-500" :
                                                (inc.avgFidelity ?? 0) >= 40 ? "text-yellow-500" :
                                                "text-blue-400"
                                            )}>
                                                {(inc.avgFidelity ?? 0).toFixed(0)}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-3 text-[11px] text-slate-500">
                                            {(inc.sourceIPs?.length ?? 0)} IPs
                                        </td>
                                        <td className="py-2 text-[10px] text-slate-400 whitespace-nowrap">
                                            {inc.createdAt
                                                ? new Date(inc.createdAt).toLocaleString(undefined, {
                                                    month: "short", day: "2-digit",
                                                    hour: "2-digit", minute: "2-digit", hour12: false
                                                })
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
