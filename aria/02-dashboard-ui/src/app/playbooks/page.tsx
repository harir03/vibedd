// [ARIA] Playbooks page — view and manage LLM-generated response playbooks
// Shows playbooks with step-by-step procedures, status tracking, and generation controls

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/StatCard";
import {
    BookOpen,
    CheckCircle2,
    Clock,
    XCircle,
    Play,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Filter,
    Loader2,
    Sparkles,
    Shield,
    AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

// [ARIA] Playbook types
interface PlaybookStep {
    order: number;
    action: string;
    assignee: string;
    estimatedTime: string;
    verification: string;
    automated: boolean;
    status: "pending" | "in_progress" | "completed" | "skipped";
}

interface Playbook {
    _id: string;
    incidentId?: string;
    alertId?: string;
    title: string;
    generatedBy: "template" | "llm" | "hybrid";
    category: string;
    steps: PlaybookStep[];
    estimatedResolutionTime: string;
    regulatoryRequirements: string[];
    status: "generated" | "approved" | "in_progress" | "completed" | "rejected";
    llmModel?: string;
    effectiveness?: number;
    createdAt: string;
    updatedAt: string;
}

// [ARIA] Color mappings
const statusColors: Record<string, string> = {
    generated: "bg-blue-100 text-blue-700",
    approved: "bg-green-100 text-green-700",
    in_progress: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
};

const generatedByColors: Record<string, string> = {
    template: "bg-purple-100 text-purple-700",
    llm: "bg-teal-100 text-teal-700",
    hybrid: "bg-indigo-100 text-indigo-700",
};

const stepStatusColors: Record<string, string> = {
    pending: "text-gray-400",
    in_progress: "text-amber-500",
    completed: "text-green-500",
    skipped: "text-gray-300",
};

const assigneeColors: Record<string, string> = {
    "SOC-L1": "bg-blue-50 text-blue-600",
    "SOC-L2": "bg-indigo-50 text-indigo-600",
    "SOC-L3": "bg-purple-50 text-purple-600",
    "IT-Ops": "bg-cyan-50 text-cyan-600",
    "DBA": "bg-orange-50 text-orange-600",
    "Management": "bg-rose-50 text-rose-600",
    "Legal": "bg-amber-50 text-amber-600",
    "CERT-In": "bg-red-50 text-red-600",
};

export default function PlaybooksPage() {
    const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({ total: 0, generated: 0, approved: 0, completed: 0 });

    const fetchPlaybooks = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: "10" });
            if (statusFilter !== "all") params.set("status", statusFilter);

            const res = await fetch(`/api/playbooks?${params}`);
            if (res.ok) {
                const data = await res.json();
                setPlaybooks(data.data || []);
                setTotalPages(data.meta?.totalPages || 1);
                setStats({
                    total: data.meta?.total || 0,
                    generated: (data.data || []).filter((p: Playbook) => p.status === "generated").length,
                    approved: (data.data || []).filter((p: Playbook) => p.status === "approved").length,
                    completed: (data.data || []).filter((p: Playbook) => p.status === "completed").length,
                });
            }
        } catch (err) {
            console.error("Failed to fetch playbooks:", err);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        fetchPlaybooks();
        const interval = setInterval(fetchPlaybooks, 30000);
        return () => clearInterval(interval);
    }, [fetchPlaybooks]);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="p-6">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Response Playbooks</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        AI-generated incident response procedures — NIST 800-61, PCI-DSS, RBI compliant
                    </p>
                </div>
                <button
                    onClick={fetchPlaybooks}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                        "bg-teal-500 text-white hover:bg-teal-600 transition-colors"
                    )}
                >
                    <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                    Refresh
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Total Playbooks"
                    value={(stats.total ?? 0).toLocaleString()}
                    icon={BookOpen}
                />
                <StatCard
                    label="Pending Review"
                    value={(stats.generated ?? 0).toLocaleString()}
                    icon={Clock}
                />
                <StatCard
                    label="Approved"
                    value={(stats.approved ?? 0).toLocaleString()}
                    icon={CheckCircle2}
                />
                <StatCard
                    label="Completed"
                    value={(stats.completed ?? 0).toLocaleString()}
                    icon={Shield}
                />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-gray-400" />
                {["all", "generated", "approved", "in_progress", "completed", "rejected"].map(s => (
                    <button
                        key={s}
                        onClick={() => { setStatusFilter(s); setPage(1); }}
                        className={cn(
                            "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                            statusFilter === s
                                ? "bg-teal-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                    >
                        {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                ))}
            </div>

            {/* Playbooks List */}
            <div className="space-y-3">
                {loading && playbooks.length === 0 ? (
                    <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-gray-100">
                        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                        <span className="ml-2 text-sm text-gray-500">Loading playbooks...</span>
                    </div>
                ) : playbooks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100">
                        <BookOpen className="w-10 h-10 text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">No playbooks generated yet</p>
                        <p className="text-[11px] text-gray-400 mt-1">Playbooks are auto-generated when incidents are detected</p>
                    </div>
                ) : (
                    playbooks.map(playbook => (
                        <div key={playbook._id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Playbook Header */}
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleExpand(playbook._id)}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <BookOpen className="w-5 h-5 text-teal-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-gray-800 truncate">
                                            {playbook.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", statusColors[playbook.status] || "bg-gray-100 text-gray-600")}>
                                                {playbook.status?.replace("_", " ").toUpperCase()}
                                            </span>
                                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", generatedByColors[playbook.generatedBy] || "bg-gray-100 text-gray-600")}>
                                                <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />
                                                {playbook.generatedBy}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {playbook.steps?.length || 0} steps • {playbook.estimatedResolutionTime || "N/A"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(playbook.createdAt).toLocaleDateString()}
                                    </span>
                                    {expandedId === playbook._id
                                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                        : <ChevronDown className="w-4 h-4 text-gray-400" />
                                    }
                                </div>
                            </div>

                            {/* Expanded Steps */}
                            {expandedId === playbook._id && (
                                <div className="border-t border-gray-100 p-4 bg-slate-50">
                                    {/* Regulatory Requirements */}
                                    {(playbook.regulatoryRequirements || []).length > 0 && (
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                            <span className="text-[10px] text-gray-500 font-medium">Regulatory:</span>
                                            {playbook.regulatoryRequirements.map((req, i) => (
                                                <span key={i} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px]">
                                                    {req}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Steps */}
                                    <div className="space-y-2">
                                        {(playbook.steps || []).map((step, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-gray-100">
                                                <div className={cn("flex-shrink-0 mt-0.5", stepStatusColors[step.status] || "text-gray-400")}>
                                                    {step.status === "completed" ? (
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    ) : step.status === "in_progress" ? (
                                                        <Play className="w-4 h-4" />
                                                    ) : step.status === "skipped" ? (
                                                        <XCircle className="w-4 h-4" />
                                                    ) : (
                                                        <Clock className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-800 leading-relaxed">
                                                        <span className="font-semibold text-gray-500 mr-1">
                                                            {step.order}.
                                                        </span>
                                                        {step.action}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", assigneeColors[step.assignee] || "bg-gray-50 text-gray-500")}>
                                                            {step.assignee}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">
                                                            ~{step.estimatedTime}
                                                        </span>
                                                        {step.automated && (
                                                            <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded text-[10px] font-medium">
                                                                Auto
                                                            </span>
                                                        )}
                                                    </div>
                                                    {step.verification && (
                                                        <p className="text-[10px] text-gray-400 mt-1 italic">
                                                            ✓ {step.verification}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 rounded-md text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-xs text-gray-500">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 rounded-md text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
