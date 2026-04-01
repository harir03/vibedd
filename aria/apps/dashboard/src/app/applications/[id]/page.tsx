// [ARIA] Service Detail Page — adapted from maf-app ApplicationDetailPage.
// Shows ProtectedService info, forwarding rules, defense config, AI policy, and alerts.
// Fetches from /api/services (ARIA) instead of /api/applications (MAF).
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Globe, Shield, RefreshCcw, Settings, FileText, Activity, Zap, Terminal, ShieldAlert, AlertTriangle } from "lucide-react";
import { DefenseModeModal } from "@/components/applications/DefenseModeModal";
import { cn } from "@/lib/utils";
import Link from "next/link";

// [ARIA] ProtectedService replaces Application
interface ProtectedService {
    _id: string;
    name: string;
    domain: string;
    ports: { protocol: string; port: string }[];
    upstreams: string[];
    type: string;
    defenseMode: "Defense" | "Audited" | "Offline";
    defenseStatus: boolean;
    loggingEnabled: boolean;
    aiModel: string;
    aiSystemPrompt: string;
    createdAt: string;
}

// [ARIA] NEW: Policy history entry type (replaces `any`)
interface PolicyHistoryEntry {
    createdAt: string;
    modelName: string;
    prompt: string;
}

// [ARIA] NEW: Alert summary for the ALERTS tab
interface AlertSummary {
    _id: string;
    time: string;
    method: string;
    uri: string;
    ip: string;
    severity: "critical" | "high" | "medium" | "low" | "info";
    fidelityScore: number;
    decision: "block" | "allow" | "escalate" | "pending";
    attackType: string;
    detectionSource: string;
}

type TabKey = "BASIC" | "RULES" | "ADVANCED" | "AI_POLICY" | "ALERTS";

// [ARIA] Severity color helper
const severityColor = (s: string): string => {
    switch (s) {
        case "critical": return "text-red-600 bg-red-50";
        case "high": return "text-orange-500 bg-orange-50";
        case "medium": return "text-yellow-600 bg-yellow-50";
        case "low": return "text-blue-400 bg-blue-50";
        default: return "text-gray-400 bg-gray-50";
    }
};

// [ARIA] Decision color helper
const decisionColor = (d: string): string => {
    switch (d) {
        case "block": return "text-red-500 bg-red-50";
        case "allow": return "text-green-500 bg-green-50";
        case "escalate": return "text-amber-500 bg-amber-50";
        default: return "text-gray-400 bg-gray-50";
    }
};

export default function ServiceDetailPage() {
    const params = useParams();
    // [ARIA] REMOVED: const [app, setApp] = useState<Application | null>(null);
    // [ARIA] NEW: Uses ProtectedService model
    const [service, setService] = useState<ProtectedService | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDefenseModalOpen, setIsDefenseModalOpen] = useState(false);

    const [activeTab, setActiveTab] = useState<TabKey>("BASIC");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [isSavingPolicy, setIsSavingPolicy] = useState(false);
    const [policyHistory, setPolicyHistory] = useState<PolicyHistoryEntry[]>([]);

    // [ARIA] NEW: Alerts state for the ALERTS tab
    const [alerts, setAlerts] = useState<AlertSummary[]>([]);
    const [alertsLoading, setAlertsLoading] = useState(false);
    const [alertsTotal, setAlertsTotal] = useState(0);

    // [ARIA] Fetch service data from /api/services (replaces /api/applications)
    const fetchService = useCallback(async (id: string) => {
        try {
            const res = await fetch("/api/services");
            const data = await res.json();
            const list: ProtectedService[] = data?.data ?? [];
            const found = list.find((s) => s._id === id);
            if (found) {
                setService(found);
                setSystemPrompt(found.aiSystemPrompt ?? "");
            }
        } catch (e) {
            console.error("[ARIA] Failed to fetch service", e);
        } finally {
            setLoading(false);
        }
    }, []);

    // [ARIA] Fetch policy history from existing route
    const fetchPolicy = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/applications/${id}/policy`);
            if (res.ok) {
                const data = await res.json();
                setPolicyHistory(data?.data?.policyHistory ?? []);
            }
        } catch (e) {
            console.error("[ARIA] Failed to fetch policy history", e);
        }
    }, []);

    // [ARIA] NEW: Fetch alerts scoped to this service
    const fetchAlerts = useCallback(async (id: string) => {
        setAlertsLoading(true);
        try {
            const res = await fetch(`/api/alerts?applicationId=${id}&limit=20`);
            if (res.ok) {
                const data = await res.json();
                setAlerts(data?.data ?? []);
                setAlertsTotal(data?.meta?.total ?? 0);
            }
        } catch (e) {
            console.error("[ARIA] Failed to fetch alerts", e);
        } finally {
            setAlertsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (params.id) {
            const id = params.id as string;
            fetchService(id);
            fetchPolicy(id);
        }
    }, [params.id, fetchService, fetchPolicy]);

    // [ARIA] Lazy-load alerts when tab is activated
    useEffect(() => {
        if (activeTab === "ALERTS" && params.id && alerts.length === 0) {
            fetchAlerts(params.id as string);
        }
    }, [activeTab, params.id, alerts.length, fetchAlerts]);

    // [ARIA] REMOVED: handleDefenseModeSave used /api/applications
    // [ARIA] NEW: Uses /api/services for defense mode updates
    const handleDefenseModeSave = async (mode: "Defense" | "Audited" | "Offline") => {
        if (!service) return;
        try {
            const res = await fetch("/api/services", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: service._id, defenseMode: mode }),
            });
            if (res.ok) {
                fetchService(service._id);
            }
        } catch {
            alert("Failed to update defense mode");
        }
    };

    // [ARIA] Policy save — creates aria-custom-* model via Ollama
    const handlePolicySave = async () => {
        if (!service) return;
        if (!systemPrompt.trim()) { alert("Please enter a system prompt"); return; }

        setIsSavingPolicy(true);
        try {
            const res = await fetch(`/api/applications/${service._id}/policy`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ systemPrompt }),
            });
            if (res.ok) {
                alert("Policy saved and model created successfully!");
                fetchService(service._id);
                fetchPolicy(service._id);
            } else {
                const err = await res.json();
                alert("Failed to save policy: " + (err?.error ?? "Unknown error"));
            }
        } catch (e) {
            console.error("[ARIA] Policy save failed", e);
            alert("Failed to save policy");
        } finally {
            setIsSavingPolicy(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Loading service...</div>;
    if (!service) return <div className="p-10 text-center text-slate-500">Service not found</div>;

    const Icon = service.type === "Reverse Proxy" ? Globe : Shield;

    // [ARIA] Tab button helper to reduce repetition
    const tabBtn = (key: TabKey, label: string, icon?: React.ReactNode) => (
        <button
            onClick={() => setActiveTab(key)}
            className={cn(
                "px-6 py-3 text-sm font-bold transition-colors uppercase border-t border-x rounded-t-lg mb-[-1px] flex items-center gap-1",
                activeTab === key
                    ? "bg-white border-slate-200 border-b-white text-teal-500"
                    : "bg-slate-50 border-transparent text-slate-500 hover:text-teal-500"
            )}
        >
            {label} {icon}
        </button>
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen space-y-6">
            {/* [ARIA] Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <Link href="/applications" className="hover:text-teal-500 transition-colors">Services</Link>
                <span>/</span>
                <span className="text-slate-900">{service.name}</span>
            </div>

            {/* [ARIA] Header Card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-teal-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900">{service.name}</h1>
                        </div>
                        <div className="text-slate-500 text-sm font-medium">{service.domain}</div>
                    </div>
                </div>

                <div className="flex items-center gap-12">
                    {/* [ARIA] Defense mode button — colors match mode */}
                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={() => setIsDefenseModalOpen(true)}
                            className={cn(
                                "px-4 py-1.5 border rounded font-bold text-xs tracking-widest uppercase cursor-pointer transition-colors flex items-center gap-2",
                                service.defenseMode === "Defense" && "border-teal-500 text-teal-500 hover:bg-teal-50",
                                service.defenseMode === "Audited" && "border-amber-500 text-amber-500 hover:bg-amber-50",
                                service.defenseMode === "Offline" && "border-red-500 text-red-500 hover:bg-red-50"
                            )}
                        >
                            {service.defenseMode} MODE
                            <Settings className="w-3 h-3" />
                        </button>
                        <span className={cn("text-[10px] font-medium",
                            service.defenseMode === "Defense" && "text-teal-500",
                            service.defenseMode === "Audited" && "text-amber-500",
                            service.defenseMode === "Offline" && "text-red-500"
                        )}>
                            {service.defenseMode === "Defense" ? "Attacks will be blocked" :
                                service.defenseMode === "Audited" ? "Log only strategy" : "All requests rejected"}
                        </span>
                    </div>

                    <div className="flex gap-8">
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">ALERTS</div>
                            <div className="text-sm font-black text-slate-900">{alertsTotal}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">MODE</div>
                            <div className="text-sm font-black text-slate-900">{service.defenseMode}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* [ARIA] Tabs — BASIC, FORWARDING RULES, ADVANCED, AI POLICY, ALERTS */}
            <div className="flex gap-1 border-b border-slate-200">
                {tabBtn("BASIC", "BASIC")}
                {tabBtn("RULES", "FORWARDING RULES")}
                {tabBtn("ADVANCED", "ADVANCED", <Shield className="w-3 h-3" />)}
                {tabBtn("AI_POLICY", "AI POLICY", <Terminal className="w-3 h-3" />)}
                {tabBtn("ALERTS", "ALERTS", <AlertTriangle className="w-3 h-3" />)}
            </div>

            {/* ── BASIC TAB ────────────────────────────────────────────────────── */}
            {activeTab === "BASIC" && (
                <div className="bg-white p-8 rounded-b-xl rounded-tr-xl border border-t-0 border-slate-100 shadow-sm space-y-10">
                    {/* Service Info */}
                    <div className="space-y-6">
                        <h2 className="text-base font-bold text-slate-900">Service Info</h2>
                        <div className="grid grid-cols-[200px_1fr] gap-y-6 text-sm">
                            <div className="text-slate-400 font-medium">Domain</div>
                            <div className="text-slate-500">{service.domain}</div>

                            <div className="text-slate-400 font-medium">Port</div>
                            <div className="flex gap-2">
                                {(service.ports ?? []).map((p, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded text-xs font-bold font-mono">
                                        {p.port}/{p.protocol}
                                    </span>
                                ))}
                            </div>

                            <div className="text-slate-400 font-medium">Access method</div>
                            <div>
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold border border-slate-200">
                                    {service.type}
                                </span>
                            </div>

                            <div className="text-slate-400 font-medium">Upstream</div>
                            <div className="font-mono text-slate-600 bg-slate-50 px-3 py-1 rounded w-fit border border-slate-200">
                                {service.upstreams?.[0] ?? service.domain}
                            </div>

                            <div className="text-slate-400 font-medium">AI Model</div>
                            <div className="font-mono text-slate-600 bg-purple-50 px-3 py-1 rounded w-fit border border-purple-200 text-purple-700">
                                {service.aiModel || "mistral"}
                            </div>

                            <div className="text-slate-400 font-medium">Created</div>
                            <div className="text-slate-500">{new Date(service.createdAt).toLocaleDateString()}</div>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="space-y-6">
                        <h2 className="text-base font-bold text-slate-900">Security</h2>
                        <div className="flex flex-wrap gap-4">
                            <button onClick={() => setActiveTab("ALERTS")} className="flex items-center gap-3 px-4 py-2 bg-cyan-50 border border-cyan-200 rounded text-cyan-600 text-xs font-bold uppercase hover:bg-cyan-100 transition-colors min-w-[140px]">
                                <ShieldAlert className="w-3.5 h-3.5" /> ALERTS
                            </button>
                        </div>
                    </div>

                    {/* Data Statistics */}
                    <div className="space-y-6">
                        <h2 className="text-base font-bold text-slate-900">Data Statistics</h2>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/statistics" className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs font-bold uppercase hover:bg-slate-100 transition-colors">
                                TRAFFIC ANALYSIS <Activity className="w-3.5 h-3.5 text-teal-500" />
                            </Link>
                            <button className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs font-bold uppercase hover:bg-slate-100 transition-colors">
                                SECURITY POSTURE <Shield className="w-3.5 h-3.5 text-teal-500" />
                            </button>
                        </div>
                    </div>

                    {/* Logs */}
                    <div className="space-y-6">
                        <h2 className="text-base font-bold text-slate-900">Logs</h2>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/allow-deny" className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs font-bold uppercase hover:bg-slate-100 transition-colors">
                                <FileText className="w-3.5 h-3.5" /> ACCESS LOG
                            </Link>
                            <Link href="/attacks" className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs font-bold uppercase hover:bg-slate-100 transition-colors">
                                <FileText className="w-3.5 h-3.5" /> ATTACK LOG
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* ── FORWARDING RULES TAB ─────────────────────────────────────────── */}
            {activeTab === "RULES" && (
                <div className="bg-white p-8 rounded-b-xl rounded-tr-xl border border-t-0 border-slate-100 shadow-sm space-y-6">
                    <h2 className="text-base font-bold text-slate-900">Forwarding Rules</h2>
                    <p className="text-sm text-slate-500">Upstream routing configuration for this protected service.</p>
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                                <tr>
                                    <th className="px-4 py-3">#</th>
                                    <th className="px-4 py-3">Protocol</th>
                                    <th className="px-4 py-3">Listen Port</th>
                                    <th className="px-4 py-3">Upstream</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(service.ports ?? []).map((p, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-slate-400 font-mono">{i + 1}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded text-xs font-bold uppercase">{p.protocol}</span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-slate-700">{p.port}</td>
                                        <td className="px-4 py-3 font-mono text-slate-600">{service.upstreams?.[i] ?? service.upstreams?.[0] ?? service.domain}</td>
                                    </tr>
                                ))}
                                {(service.ports ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No forwarding rules configured.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── ADVANCED TAB ─────────────────────────────────────────────────── */}
            {activeTab === "ADVANCED" && (
                <div className="bg-white p-8 rounded-b-xl rounded-tr-xl border border-t-0 border-slate-100 shadow-sm space-y-6">
                    <h2 className="text-base font-bold text-slate-900">Defense Configuration</h2>
                    <p className="text-sm text-slate-500">Click the defense mode button below to change how the ARIA gateway handles traffic for this service.</p>

                    <div className="grid grid-cols-[200px_1fr] gap-y-6 text-sm">
                        <div className="text-slate-400 font-medium">Defense Mode</div>
                        <div>
                            <button
                                onClick={() => setIsDefenseModalOpen(true)}
                                className={cn(
                                    "px-4 py-1.5 border rounded font-bold text-xs tracking-widest uppercase cursor-pointer transition-colors flex items-center gap-2",
                                    service.defenseMode === "Defense" && "border-teal-500 text-teal-500 hover:bg-teal-50",
                                    service.defenseMode === "Audited" && "border-amber-500 text-amber-500 hover:bg-amber-50",
                                    service.defenseMode === "Offline" && "border-red-500 text-red-500 hover:bg-red-50"
                                )}
                            >
                                {service.defenseMode} MODE <Settings className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="text-slate-400 font-medium">Defense Status</div>
                        <div className={cn("font-bold text-xs uppercase", service.defenseStatus ? "text-green-500" : "text-red-500")}>
                            {service.defenseStatus ? "ACTIVE" : "INACTIVE"}
                        </div>

                        <div className="text-slate-400 font-medium">Logging</div>
                        <div className={cn("font-bold text-xs uppercase", service.loggingEnabled ? "text-green-500" : "text-slate-400")}>
                            {service.loggingEnabled ? "ENABLED" : "DISABLED"}
                        </div>
                    </div>
                </div>
            )}

            {/* ── AI POLICY TAB ────────────────────────────────────────────────── */}
            {activeTab === "AI_POLICY" && (
                <div className="bg-white p-8 rounded-b-xl rounded-tr-xl border border-t-0 border-slate-100 shadow-sm space-y-10">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Custom AI WAF Policy</h2>
                                <p className="text-sm text-slate-500 mt-1">Define specific instructions for the AI to analyze traffic for this service.</p>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">CURRENT MODEL</div>
                                <div className="text-sm font-mono font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded inline-block">
                                    {service.aiModel || "mistral"}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                                System Prompt
                            </label>
                            <textarea
                                className="w-full h-64 p-4 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
                                placeholder="You are a WAF optimized for banking. Block credential stuffing, SQL injection on transaction endpoints..."
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handlePolicySave}
                                    disabled={isSavingPolicy}
                                    className="px-6 py-2.5 bg-teal-500 text-white font-bold text-sm rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSavingPolicy ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                    SAVE &amp; BUILD MODEL
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Policy History */}
                    <div className="space-y-6 pt-6 border-t border-slate-100">
                        <h3 className="text-base font-bold text-slate-900">Policy History</h3>
                        <div className="overflow-hidden rounded-lg border border-slate-200">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Model Name</th>
                                        <th className="px-4 py-3">Prompt Summary</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {policyHistory.map((policy, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                                {new Date(policy.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-purple-600">
                                                {policy.modelName}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 truncate max-w-[300px]">
                                                {policy.prompt}
                                            </td>
                                        </tr>
                                    ))}
                                    {policyHistory.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">
                                                No custom policies created yet. Using default &apos;mistral&apos;.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ALERTS TAB (ARIA NEW) ────────────────────────────────────────── */}
            {activeTab === "ALERTS" && (
                <div className="bg-white p-8 rounded-b-xl rounded-tr-xl border border-t-0 border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Recent Alerts</h2>
                            <p className="text-sm text-slate-500 mt-1">Latest detections for <span className="font-semibold text-slate-700">{service.name}</span> — {alertsTotal} total</p>
                        </div>
                        <button
                            onClick={() => fetchAlerts(service._id)}
                            className="px-3 py-1.5 text-xs font-bold text-teal-500 border border-teal-200 rounded hover:bg-teal-50 transition-colors flex items-center gap-1.5 uppercase"
                        >
                            <RefreshCcw className={cn("w-3 h-3", alertsLoading && "animate-spin")} /> Refresh
                        </button>
                    </div>

                    {alertsLoading && alerts.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-sm">Loading alerts...</div>
                    ) : (
                        <div className="overflow-hidden rounded-lg border border-slate-200">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                                    <tr>
                                        <th className="px-4 py-3">Time</th>
                                        <th className="px-4 py-3">Method</th>
                                        <th className="px-4 py-3">URI</th>
                                        <th className="px-4 py-3">IP</th>
                                        <th className="px-4 py-3">Severity</th>
                                        <th className="px-4 py-3">Fidelity</th>
                                        <th className="px-4 py-3">Decision</th>
                                        <th className="px-4 py-3">Source</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {alerts.map((a) => (
                                        <tr key={a._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                                                {new Date(a.time).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-mono font-bold text-xs text-slate-700">{a.method}</td>
                                            <td className="px-4 py-3 font-mono text-slate-600 truncate max-w-[200px] text-xs">{a.uri}</td>
                                            <td className="px-4 py-3 font-mono text-slate-500 text-xs">{a.ip}</td>
                                            <td className="px-4 py-3">
                                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", severityColor(a.severity))}>
                                                    {a.severity}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn("font-bold text-xs", (a.fidelityScore ?? 0) >= 70 ? "text-red-600" : (a.fidelityScore ?? 0) >= 40 ? "text-yellow-600" : "text-blue-400")}>
                                                    {a.fidelityScore ?? 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", decisionColor(a.decision))}>
                                                    {a.decision}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-500 uppercase">
                                                    {a.detectionSource ?? "—"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {alerts.length === 0 && !alertsLoading && (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-12 text-center text-slate-400 italic">
                                                No alerts recorded for this service yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* [ARIA] Defense Mode Modal */}
            <DefenseModeModal
                isOpen={isDefenseModalOpen}
                onClose={() => setIsDefenseModalOpen(false)}
                currentMode={service.defenseMode}
                onSave={handleDefenseModeSave}
            />
        </div>
    );
}
