"use client";

import { ClipboardList, Filter } from "lucide-react";

const SAMPLE_LOGS = [
  { id: 1, timestamp: "2026-03-09 14:32:00", user: "analyst@tatva.gov.in", action: "SEARCH", resource: "Entity:India", details: "NL query: 'India defense deals 2025'" },
  { id: 2, timestamp: "2026-03-09 14:28:15", user: "admin@tatva.gov.in", action: "CREATE", resource: "Entity:INS Tushil", details: "New entity created from RSS ingestion" },
  { id: 3, timestamp: "2026-03-09 14:25:00", user: "system", action: "UPDATE", resource: "Relationship:India→UAE", details: "Credibility score updated: 0.72 → 0.85" },
  { id: 4, timestamp: "2026-03-09 14:20:00", user: "analyst@tatva.gov.in", action: "EXPORT", resource: "Report:RPT-2026-0309-0042", details: "PDF report exported: India-China relations" },
  { id: 5, timestamp: "2026-03-09 14:15:30", user: "system", action: "ALERT", resource: "Alert:ALT-0091", details: "Anomaly detected: South China Sea mentions spike" },
];

export default function AuditPage() {
  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <ClipboardList className="w-4 h-4" /> Audit Log
        </h2>
        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50">
          <Filter className="w-3 h-3" /> Filter
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Timestamp</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">User</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Action</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Resource</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_LOGS.map((log) => (
              <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-xs text-slate-500 font-mono">{log.timestamp}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{log.user}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-700 font-medium">{log.resource}</td>
                <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-xs">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-center text-xs text-slate-400">
        Append-only audit log — 7-year retention, government-grade accountability. Immutable by design.
      </p>
    </div>
  );
}
