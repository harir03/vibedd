"use client";

import { AlertTriangle, Bell, Filter } from "lucide-react";

const SAMPLE_ALERTS = [
  { id: 1, type: "ANOMALY", priority: "CRITICAL", message: "Unusual spike in South China Sea military activity mentions", time: "10 min ago", domain: "Defense" },
  { id: 2, type: "CONTRADICTION", priority: "WARNING", message: "Conflicting GDP growth figures for India (7.2% vs 6.8%)", time: "22 min ago", domain: "Economics" },
  { id: 3, type: "ENTITY", priority: "INFO", message: "New entity discovered: INS Tushil commissioned", time: "35 min ago", domain: "Defense" },
  { id: 4, type: "TREND", priority: "WARNING", message: "Emerging trend: increased QUAD summit coverage", time: "1h ago", domain: "Geopolitics" },
  { id: 5, type: "THRESHOLD", priority: "INFO", message: "Trade volume India-UAE crossed $100B threshold", time: "2h ago", domain: "Economics" },
];

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
  WARNING: "bg-amber-50 text-amber-700 border-amber-200",
  INFO: "bg-blue-50 text-blue-700 border-blue-200",
  FLASH: "bg-red-100 text-red-800 border-red-300",
};

export default function AlertsPage() {
  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Alerts & Anomalies
        </h2>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50">
            <Filter className="w-3 h-3" /> Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700">
            <Bell className="w-3 h-3" /> Create Alert Rule
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {SAMPLE_ALERTS.map((alert) => (
          <div
            key={alert.id}
            className={`bg-white rounded-lg border p-4 hover:shadow-sm transition-all ${
              alert.priority === "CRITICAL" ? "border-l-4 border-l-red-500" :
              alert.priority === "WARNING" ? "border-l-4 border-l-amber-500" :
              "border-l-4 border-l-blue-400"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${PRIORITY_STYLES[alert.priority]}`}>
                {alert.priority}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                {alert.type}
              </span>
              <span className="flex-1 text-sm text-slate-700">{alert.message}</span>
              <span className="text-[11px] text-slate-400 whitespace-nowrap">{alert.time}</span>
              <span className="text-[10px] font-bold text-slate-400">{alert.domain}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-slate-400 text-sm">
          Full alert management with clustering, channels (email/SMS/webhook), and ML-based anomaly detection
          will be implemented in Tier 2.
        </p>
      </div>
    </div>
  );
}
