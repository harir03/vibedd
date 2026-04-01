"use client";

import { Database, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

const SOURCES = [
  { name: "Reuters", type: "RSS", tier: 1, status: "active", lastFetch: "2 min ago", articles: 1247 },
  { name: "Press Trust of India", type: "RSS", tier: 1, status: "active", lastFetch: "5 min ago", articles: 892 },
  { name: "The Hindu", type: "RSS", tier: 2, status: "active", lastFetch: "8 min ago", articles: 634 },
  { name: "NDTV", type: "RSS", tier: 2, status: "active", lastFetch: "3 min ago", articles: 521 },
  { name: "Al Jazeera", type: "RSS", tier: 2, status: "active", lastFetch: "12 min ago", articles: 445 },
  { name: "Twitter/X API", type: "API", tier: 5, status: "inactive", lastFetch: "N/A", articles: 0 },
];

const TIER_LABELS: Record<number, string> = {
  1: "T1 — Highest",
  2: "T2 — High",
  3: "T3 — Medium",
  4: "T4 — Low",
  5: "T5 — Lowest",
};

export default function SourcesPage() {
  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Data Sources</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          <Database className="w-4 h-4" />
          Add Source
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Source</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Reliability</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Last Fetch</th>
              <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Articles</th>
            </tr>
          </thead>
          <tbody>
            {SOURCES.map((source) => (
              <tr key={source.name} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-semibold text-slate-800">{source.name}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                    {source.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{TIER_LABELS[source.tier]}</td>
                <td className="px-4 py-3">
                  {source.status === "active" ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <XCircle className="w-3 h-3" /> Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {source.lastFetch}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-slate-700 text-right">
                  {source.articles.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
