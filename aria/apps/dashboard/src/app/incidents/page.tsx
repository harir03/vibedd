"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Clock,
  Link2,
  Globe,
  Target,
  Layers,
  Activity,
  RefreshCw,
} from "lucide-react";

// [ARIA] Incident interface — correlated alert groups from /api/incidents
interface Incident {
  _id: string;
  title: string;
  description: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  status: "open" | "investigating" | "resolved" | "false_positive";
  alertIds: string[];
  sourceIPs: string[];
  targetEndpoints: string[];
  attackStage: string;
  timeRange: { start: string; end: string };
  avgFidelity: number;
  maxFidelity: number;
  correlationRule: string;
  playbookId: any;
  assignedTo: string;
  applicationId: string;
  createdAt: string;
  updatedAt: string;
}

interface IncidentsResponse {
  data: Incident[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    statusCounts?: Record<string, number>;
  };
}

// [ARIA] Color maps for severity and status badges
const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-400 text-white",
  info: "bg-gray-400 text-white",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500 text-white",
  investigating: "bg-amber-500 text-white",
  resolved: "bg-green-500 text-white",
  false_positive: "bg-gray-400 text-white",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "false_positive", label: "False Positive" },
];

const SEVERITY_OPTIONS = [
  { value: "all", label: "All Severities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

// [ARIA] Fidelity score color based on value ranges
function fidelityColor(score: number): string {
  if (score >= 90) return "bg-red-600";
  if (score >= 70) return "bg-orange-500";
  if (score >= 40) return "bg-yellow-500";
  if (score >= 10) return "bg-blue-400";
  return "bg-gray-300";
}

// [ARIA] Format timestamp to compact local string
function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "—";
  }
}

const LIMIT = 20;

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [meta, setMeta] = useState<IncidentsResponse["meta"]>({
    total: 0,
    page: 1,
    limit: LIMIT,
    totalPages: 1,
    statusCounts: {},
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // [ARIA] Fetch incidents from API with current filters + pagination
  const fetchIncidents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (severityFilter !== "all") params.set("severity", severityFilter);
      params.set("page", String(page));
      params.set("limit", String(LIMIT));

      const res = await fetch(`/api/incidents?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch incidents");
      const json: IncidentsResponse = await res.json();
      setIncidents(json.data ?? []);
      setMeta({
        total: json.meta?.total ?? 0,
        page: json.meta?.page ?? 1,
        limit: json.meta?.limit ?? LIMIT,
        totalPages: json.meta?.totalPages ?? 1,
        statusCounts: json.meta?.statusCounts ?? {},
      });
      setLastFetched(new Date());
    } catch (err) {
      console.error("[ARIA] incidents fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter, page]);

  // [ARIA] Initial fetch + polling every 15 seconds
  useEffect(() => {
    setLoading(true);
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 15000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  // [ARIA] Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, severityFilter]);

  // [ARIA] Derive stat counts from meta.statusCounts or fall back to counting local data
  const statusCounts = meta.statusCounts ?? {};
  const totalIncidents = meta.total ?? 0;
  const openCount = statusCounts.open ?? incidents.filter((i) => i.status === "open").length;
  const investigatingCount = statusCounts.investigating ?? incidents.filter((i) => i.status === "investigating").length;
  const resolvedCount = statusCounts.resolved ?? incidents.filter((i) => i.status === "resolved").length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 space-y-4">
      {/* [ARIA] Page header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold text-gray-800">Incidents</h1>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <RefreshCw className="w-3 h-3" />
          {lastFetched ? `Updated ${formatTime(lastFetched.toISOString())}` : "Loading…"}
        </div>
      </div>

      {/* [ARIA] Stats row — 4 KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Incidents"
          value={(totalIncidents ?? 0).toLocaleString()}
          icon={Layers}
          variant="teal"
        />
        <StatCard
          label="Open"
          value={(openCount ?? 0).toLocaleString()}
          icon={ShieldAlert}
          variant="orange"
        />
        <StatCard
          label="Investigating"
          value={(investigatingCount ?? 0).toLocaleString()}
          icon={Search}
          variant="teal"
        />
        <StatCard
          label="Resolved"
          value={(resolvedCount ?? 0).toLocaleString()}
          icon={ShieldCheck}
          variant="teal"
        />
      </div>

      {/* [ARIA] Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-tight">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-tight">Severity</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-[10px] text-slate-400">
          {totalIncidents} incident{totalIncidents !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* [ARIA] Incidents list */}
      <div className="space-y-3">
        {loading && incidents.length === 0 ? (
          // [ARIA] Skeleton loading state
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse"
            >
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))
        ) : incidents.length === 0 ? (
          // [ARIA] Empty state
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-medium">No incidents found</p>
            <p className="text-[10px] text-slate-400 mt-1">
              Adjust filters or wait for new correlated alerts
            </p>
          </div>
        ) : (
          incidents.map((incident) => (
            <IncidentCard key={incident._id} incident={incident} />
          ))
        )}
      </div>

      {/* [ARIA] Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
              page <= 1
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <span className="text-[11px] text-slate-500">
            Page {page} of {meta.totalPages}
          </span>

          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
              page >= meta.totalPages
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// [ARIA] Individual incident card component — displays all incident metadata
function IncidentCard({ incident }: { incident: Incident }) {
  const alertCount = incident.alertIds?.length ?? 0;
  const sourceIPs = incident.sourceIPs ?? [];
  const targetEndpoints = incident.targetEndpoints ?? [];
  const avgFidelity = incident.avgFidelity ?? 0;
  const maxFidelity = incident.maxFidelity ?? 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      {/* Header row: badges + title */}
      <div className="flex items-start gap-2 mb-2">
        {/* Severity badge */}
        <span
          className={cn(
            "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
            SEVERITY_COLORS[incident.severity] ?? "bg-gray-300 text-white"
          )}
        >
          {incident.severity}
        </span>

        {/* Status badge */}
        <span
          className={cn(
            "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
            STATUS_COLORS[incident.status] ?? "bg-gray-300 text-white"
          )}
        >
          {(incident.status ?? "unknown").replace("_", " ")}
        </span>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 truncate">
            {incident.title || "Untitled Incident"}
          </h3>
        </div>

        {/* Alert count pill */}
        <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full flex-shrink-0">
          <AlertTriangle className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-600">
            {alertCount} alert{alertCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Description */}
      {incident.description && (
        <p className="text-[11px] text-slate-500 mb-3 line-clamp-2">
          {incident.description}
        </p>
      )}

      {/* Detail grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-[10px]">
        {/* Attack stage */}
        <div className="flex items-start gap-1.5">
          <Activity className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-slate-400 font-medium block">Kill Chain</span>
            <span className="text-slate-700 font-semibold">
              {incident.attackStage || "—"}
            </span>
          </div>
        </div>

        {/* Correlation rule */}
        <div className="flex items-start gap-1.5">
          <Layers className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-slate-400 font-medium block">Rule</span>
            <span className="text-slate-700 font-semibold truncate block max-w-[140px]">
              {incident.correlationRule || "—"}
            </span>
          </div>
        </div>

        {/* Source IPs */}
        <div className="flex items-start gap-1.5">
          <Globe className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-slate-400 font-medium block">Source IPs</span>
            <span className="text-slate-700 font-semibold">
              {sourceIPs.length === 0
                ? "—"
                : sourceIPs.length <= 3
                ? sourceIPs.join(", ")
                : `${sourceIPs.slice(0, 3).join(", ")} +${sourceIPs.length - 3}`}
            </span>
          </div>
        </div>

        {/* Target endpoints */}
        <div className="flex items-start gap-1.5">
          <Target className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-slate-400 font-medium block">Targets</span>
            <span className="text-slate-700 font-semibold">
              {targetEndpoints.length === 0
                ? "—"
                : targetEndpoints.length <= 3
                ? targetEndpoints.join(", ")
                : `${targetEndpoints.slice(0, 3).join(", ")} +${targetEndpoints.length - 3}`}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom row: fidelity bars + time + playbook */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
        {/* Avg fidelity */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-medium">Avg</span>
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full", fidelityColor(avgFidelity))}
              style={{ width: `${Math.min(100, avgFidelity)}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-600">{avgFidelity}</span>
        </div>

        {/* Max fidelity */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-medium">Max</span>
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full", fidelityColor(maxFidelity))}
              style={{ width: `${Math.min(100, maxFidelity)}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-600">{maxFidelity}</span>
        </div>

        {/* Time range */}
        <div className="flex items-center gap-1 text-[10px] text-slate-400 ml-auto">
          <Clock className="w-3 h-3" />
          <span>
            {formatTime(incident.timeRange?.start)} – {formatTime(incident.timeRange?.end)}
          </span>
        </div>

        {/* Playbook link */}
        {incident.playbookId && (
          <a
            href={`/playbooks/${typeof incident.playbookId === "object" ? incident.playbookId._id ?? incident.playbookId : incident.playbookId}`}
            className="flex items-center gap-1 text-[10px] font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            <Link2 className="w-3 h-3" />
            Playbook
          </a>
        )}

        {/* Created timestamp */}
        <div className="text-[10px] text-slate-300">
          Created {formatTime(incident.createdAt)}
        </div>
      </div>
    </div>
  );
}
