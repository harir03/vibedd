"use client";

import { Eye, Plus, Bell, Trash2 } from "lucide-react";

const WATCHED_ENTITIES = [
  { id: 1, name: "Narendra Modi", type: "PERSON", domain: "Geopolitics", alerts: 3, lastUpdate: "2h ago" },
  { id: 2, name: "DRDO", type: "ORGANIZATION", domain: "Defense", alerts: 1, lastUpdate: "4h ago" },
  { id: 3, name: "CHIPS Act", type: "DOCUMENT", domain: "Technology", alerts: 5, lastUpdate: "1h ago" },
  { id: 4, name: "India-China Border", type: "LOCATION", domain: "Geopolitics", alerts: 8, lastUpdate: "30 min ago" },
  { id: 5, name: "INS Arighat", type: "TECHNOLOGY", domain: "Defense", alerts: 2, lastUpdate: "6h ago" },
];

export default function WatchlistPage() {
  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Eye className="w-4 h-4" /> Entity Watchlist
        </h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          <Plus className="w-4 h-4" />
          Watch Entity
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Entity</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Domain</th>
              <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Alerts</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Last Update</th>
              <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {WATCHED_ENTITIES.map((entity) => (
              <tr key={entity.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-semibold text-slate-800">{entity.name}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                    {entity.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{entity.domain}</td>
                <td className="px-4 py-3 text-center">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600">
                    {entity.alerts}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{entity.lastUpdate}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-teal-600 transition-colors">
                      <Bell className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-center text-xs text-slate-400">
        Daily email digest and real-time alert integration will be implemented in Tier 2.
      </p>
    </div>
  );
}
